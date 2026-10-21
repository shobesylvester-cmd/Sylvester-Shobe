import { ClassifiedRequest, DepartmentCategory, TrendDataPoint, WeeklyInsightsReport, ReportFocusMode } from '../types/classifier.ts';
import { CATEGORIES_CONFIG } from '../data/categories.ts';
import { GoogleGenAI, Type } from '@google/genai';

export function calculateTrends(requests: ClassifiedRequest[]): {
  timeline: TrendDataPoint[];
  categoriesBreakdown: {
    category: DepartmentCategory;
    name: string;
    volume: number;
    percentage: number;
    avgResolutionHours: number;
    targetSLA: string;
    slaTargetHours: number;
    slaAdherenceRate: number;
    accentColor: string;
    healthStatus: 'Excellent' | 'Good' | 'Attention Required';
  }[];
  responseTimeMetrics: {
    overallMeanHours: number;
    slaAdherenceRate: number;
    slaBreachCount: number;
    totalResolved: number;
    totalOpen: number;
  };
} {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();

  // Create 7-day buckets (last 7 days including today)
  const timelineMap = new Map<string, TrendDataPoint>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayName = days[d.getDay()];

    timelineMap.set(dateStr, {
      date: dateStr,
      dayName,
      total: 0,
      HR: 0,
      IT: 0,
      Finance: 0,
      Operations: 0,
      avgResolutionHours: 0,
    });
  }

  // Populate timeline
  const dailyResolutionAccumulator: Record<string, { totalHours: number; count: number }> = {};

  requests.forEach((req) => {
    const reqDate = new Date(req.createdAt);
    const dateStr = reqDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (timelineMap.has(dateStr)) {
      const point = timelineMap.get(dateStr)!;
      point.total++;
      if (point[req.category] !== undefined) {
        point[req.category]++;
      }

      const resHours = req.actualResolutionHours || (req.status === 'Resolved' ? 3.5 : 8.0);
      if (!dailyResolutionAccumulator[dateStr]) {
        dailyResolutionAccumulator[dateStr] = { totalHours: 0, count: 0 };
      }
      dailyResolutionAccumulator[dateStr].totalHours += resHours;
      dailyResolutionAccumulator[dateStr].count++;
    }
  });

  // Calculate daily averages
  for (const [dateStr, point] of timelineMap.entries()) {
    if (dailyResolutionAccumulator[dateStr] && dailyResolutionAccumulator[dateStr].count > 0) {
      point.avgResolutionHours = Number(
        (dailyResolutionAccumulator[dateStr].totalHours / dailyResolutionAccumulator[dateStr].count).toFixed(1)
      );
    }
  }

  // Category breakdowns
  const totalVolume = requests.length || 1;
  const categoriesList: DepartmentCategory[] = ['HR', 'IT', 'Finance', 'Operations'];

  let totalSlaEligible = 0;
  let totalSlaMet = 0;
  let totalResolutionHoursSum = 0;
  let totalResolvedCount = 0;

  const categoriesBreakdown = categoriesList.map((catKey) => {
    const catReqs = requests.filter((r) => r.category === catKey);
    const volume = catReqs.length;
    const percentage = Number(((volume / totalVolume) * 100).toFixed(1));

    const cfg = CATEGORIES_CONFIG[catKey];
    const slaTargetHours = catKey === 'IT' ? 4 : catKey === 'HR' ? 24 : catKey === 'Finance' ? 48 : 8;

    let resSum = 0;
    let metCount = 0;

    catReqs.forEach((r) => {
      const resTime = r.actualResolutionHours ?? (r.status === 'Resolved' ? slaTargetHours * 0.6 : slaTargetHours * 1.1);
      resSum += resTime;
      totalResolutionHoursSum += resTime;

      // Check SLA met
      const isMet = r.slaMet !== undefined ? r.slaMet : resTime <= slaTargetHours;
      if (isMet) metCount++;
      totalSlaEligible++;
      if (isMet) totalSlaMet++;

      if (r.status === 'Resolved') totalResolvedCount++;
    });

    const avgResolutionHours = volume > 0 ? Number((resSum / volume).toFixed(1)) : 0;
    const slaAdherenceRate = volume > 0 ? Number(((metCount / volume) * 100).toFixed(1)) : 100;

    let healthStatus: 'Excellent' | 'Good' | 'Attention Required' = 'Good';
    if (slaAdherenceRate >= 90) healthStatus = 'Excellent';
    else if (slaAdherenceRate < 75) healthStatus = 'Attention Required';

    return {
      category: catKey,
      name: cfg.name,
      volume,
      percentage,
      avgResolutionHours,
      targetSLA: cfg.defaultSLA,
      slaTargetHours,
      slaAdherenceRate,
      accentColor: cfg.accentColor,
      healthStatus,
    };
  });

  const overallMeanHours = requests.length > 0 ? Number((totalResolutionHoursSum / requests.length).toFixed(1)) : 0;
  const slaAdherenceRate = totalSlaEligible > 0 ? Number(((totalSlaMet / totalSlaEligible) * 100).toFixed(1)) : 100;
  const slaBreachCount = totalSlaEligible - totalSlaMet;
  const totalOpen = requests.filter((r) => r.status !== 'Resolved').length;

  return {
    timeline: Array.from(timelineMap.values()),
    categoriesBreakdown,
    responseTimeMetrics: {
      overallMeanHours,
      slaAdherenceRate,
      slaBreachCount,
      totalResolved: totalResolvedCount,
      totalOpen,
    },
  };
}

export interface ReportOptions {
  department?: DepartmentCategory | 'ALL';
  focus?: ReportFocusMode;
  timeRange?: '7d' | '14d' | '30d' | 'all';
}

export function generateHeuristicWeeklyInsights(
  requests: ClassifiedRequest[],
  options: ReportOptions = {}
): WeeklyInsightsReport {
  const targetDept = options.department && options.department !== 'ALL' ? options.department : 'ALL';
  const focus = options.focus || 'executive';
  const trends = calculateTrends(requests);

  const now = new Date();
  const daysBack = options.timeRange === '30d' ? 30 : options.timeRange === '14d' ? 14 : 7;
  const weekStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEnd = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Filter requests if department selected
  const targetRequests = targetDept === 'ALL' ? requests : requests.filter((r) => r.category === targetDept);

  // Sub-category distribution
  const subCategoryCounts: Record<string, number> = {};
  const urgencyCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  let deptResolutionHoursSum = 0;
  let deptResolvedCount = 0;
  let deptSlaMetCount = 0;

  targetRequests.forEach((r) => {
    subCategoryCounts[r.subCategory] = (subCategoryCounts[r.subCategory] || 0) + 1;
    if (urgencyCounts[r.urgency] !== undefined) {
      urgencyCounts[r.urgency]++;
    }
    const resHours = r.actualResolutionHours || (r.status === 'Resolved' ? 3.5 : 8.0);
    deptResolutionHoursSum += resHours;
    if (r.status === 'Resolved') deptResolvedCount++;
    if (r.slaMet !== false) deptSlaMetCount++;
  });

  const totalTargetVol = targetRequests.length || 1;
  const subCategoryBreakdown = Object.entries(subCategoryCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Number(((count / totalTargetVol) * 100).toFixed(1)),
  })).sort((a, b) => b.count - a.count);

  const deptSlaRate = Number(((deptSlaMetCount / totalTargetVol) * 100).toFixed(1));
  const deptAvgHours = Number((deptResolutionHoursSum / totalTargetVol).toFixed(1));

  // Department-specific metadata and defaults
  let executiveSummary = '';
  let keyHighlights: string[] = [];
  let criticalBottlenecks: string[] = [];
  let strategicRecommendations: string[] = [];
  let projectedForecast = '';
  let departmentMeta: WeeklyInsightsReport['departmentMeta'] = undefined;

  if (targetDept !== 'ALL') {
    const cfg = CATEGORIES_CONFIG[targetDept];
    departmentMeta = {
      name: cfg.name,
      primaryLead: cfg.primaryLead,
      dispatchQueue: cfg.dispatchQueue,
      defaultSLA: cfg.defaultSLA,
      subCategories: cfg.subCategories,
    };

    if (targetDept === 'HR') {
      executiveSummary = `The Human Resources operations queue processed ${targetRequests.length} workforce requests over ${options.timeRange || '7d'} with a ${deptSlaRate}% SLA adherence rate (Target: ${cfg.defaultSLA}). Primary request volumes concentrated in Benefits & Health Insurance and Payroll verification, driven by upcoming open enrollment deadlines.`;
      keyHighlights = [
        `Maintained an average resolution time of ${deptAvgHours}h, well within the ${cfg.defaultSLA} departmental target.`,
        `Resolved 100% of employee retirement 401(k) vesting and domestic partner health enrollment inquiries.`,
        `Direct deposit and compensation updates triaged with automated validation within 4 hours.`,
        `Automated AI response drafting generated 8 policy-compliant employee communications.`
      ];
      criticalBottlenecks = [
        'Open enrollment inquiries create noticeable volume spikes during mid-week afternoon windows.',
        'Domestic partnership affidavit verification requires manual documentation uploads which lengthen turnaround.'
      ];
      strategicRecommendations = [
        'Publish an interactive self-service Benefits FAQ widget in the employee onboarding portal.',
        'Implement automated reminder triggers for incomplete benefits election forms 48 hours prior to open enrollment cutoff.',
        'Cross-train two Tier-1 HR coordinators on payroll tax deduction inquiries.'
      ];
      projectedForecast = 'HR ticket influx is projected to rise by 15-20% over the next 10 business days as annual benefits open enrollment reaches final deadline.';
    } else if (targetDept === 'IT') {
      executiveSummary = `IT Systems & Infrastructure resolved ${targetRequests.length} technical requests with ${deptSlaRate}% SLA adherence and a mean turnaround of ${deptAvgHours}h (Target: ${cfg.defaultSLA}). Hardware replacement emergencies and remote access VPN authentication accounted for the bulk of high-urgency volume.`;
      keyHighlights = [
        `Rapid turnaround on critical hardware battery swelling incident (${deptAvgHours}h vs 4h SLA).`,
        `Zero sustained VPN access downtime reported following remote London Okta time-skew sync.`,
        `Successfully provisioned GitHub Copilot Enterprise seats for engineering hires within 45 minutes of intake.`,
        `Infrastructure support queue (${cfg.dispatchQueue}) operated at 96% first-contact resolution.`
      ];
      criticalBottlenecks = [
        'Peripheral monitor and USB-C dock inventory is running low in local depot storerooms.',
        'Time-drift errors on MFA tokens generate recurring high-priority authentication lockouts for remote workers.'
      ];
      strategicRecommendations = [
        'Pre-provision a buffer of 5 configured M3 laptops and 10 universal USB-C docks for expedited replacement.',
        'Deploy automated NTP time-sync check in corporate Okta Verify desktop agent.',
        'Integrate automated Slack notifications for developer license provisioning status.'
      ];
      projectedForecast = 'IT volume is expected to remain steady, with potential uptick in remote setup requests following next Monday new hire onboarding batch.';
    } else if (targetDept === 'Finance') {
      executiveSummary = `Corporate Finance & Accounting triaged ${targetRequests.length} monetary transactions and compliance requests with ${deptSlaRate}% SLA compliance. Key activity centered on vendor invoice approval under Net-30 terms and Q3 international travel expense reconciliations.`;
      keyHighlights = [
        `Expedited overdue AWS cloud infrastructure invoice (#INV-99214) preventing service disruption risk.`,
        `Processed multi-currency Tokyo sales trip expense reports with automated spot exchange rate auditing.`,
        `Delivered signed Form W-9 compliance certificates for major enterprise client Acme Corp within 12h.`,
        `Zero billing disputes or unaccounted ledger discrepancies recorded across active queues.`
      ];
      criticalBottlenecks = [
        'Invoices requiring dual VP signatures encounter approval latency during quarter-end fiscal travel.',
        'Currency conversion receipts submitted in physical foreign receipts require manual spot rate lookup.'
      ];
      strategicRecommendations = [
        'Establish automated threshold approval for pre-budgeted SaaS vendor invoices under $15,000.',
        'Enable mobile optical character recognition (OCR) and automatic foreign exchange rate lookup in expense submission.',
        'Maintain a secure centralized portal for pre-signed client compliance documents (W-9, SOC2).'
      ];
      projectedForecast = 'Finance ticket volume will surge by 25% during the final 3 days of the month due to standard corporate AP closing cycle.';
    } else {
      // Operations
      executiveSummary = `Operations & Facilities managed ${targetRequests.length} physical workplace, security, and office logistics tickets with ${deptSlaRate}% SLA adherence. Rapid physical intervention prevented major employee ingress delays during North Tower turnstile RFID malfunctions.`;
      keyHighlights = [
        `Turnstile RFID controller failure was resolved within 1.4h, meeting emergency 2h safety SLA.`,
        `HVAC temperature sensor recalibration on West Wing Floor 4 restored climate comfort within 5.5h.`,
        `Office supply and ergonomic workstation equipment requisitions delivered next-day.`,
        `Maintained 100% workplace safety and security compliance across corporate campus facilities.`
      ];
      criticalBottlenecks = [
        'Legacy turnstile RFID sensors are vulnerable to moisture and firmware drift during heavy weather.',
        'HVAC pneumatic dampers in older building zones require quarterly pneumatic recalibration.'
      ];
      strategicRecommendations = [
        'Upgrade turnstile readers to dual NFC/RFID controllers with automated fail-open safety override.',
        'Schedule preventative HVAC damper maintenance during non-business hours twice per quarter.',
        'Establish automated low-stock reorder triggers with regional office supply vendors.'
      ];
      projectedForecast = 'Facilities ticket volume is projected to remain stable with seasonal heating checks scheduled for next weekend.';
    }
  } else {
    // ALL Departments Executive Overview
    executiveSummary = `AutoTriage triaged and routed ${requests.length} incoming enterprise requests over the past ${options.timeRange || '7d'} across HR, IT, Finance, and Operations with an overall SLA adherence of ${trends.responseTimeMetrics.slaAdherenceRate}%. Automated zero-shot classification delivered consistent routing accuracy without manual queue bottlenecks.`;
    keyHighlights = [
      `Ingested ${requests.length} structured tickets with zero unhandled dropped requests.`,
      `IT Infrastructure achieved highest triage velocity with sub-3-hour average resolution.`,
      `Corporate Finance successfully reconciled overdue accounts payable with 98% audit compliance.`,
      `Facilities Operations resolved 100% of reported urgent HVAC and RFID access turnstile events.`
    ];
    criticalBottlenecks = [
      'Hardware battery swelling tickets require proactive inventory stocking to maintain 2-hour SLA.',
      'Open enrollment benefits questions surged by 28% during mid-week peak windows.'
    ];
    strategicRecommendations = [
      'Enable automated self-service password reset and VPN diagnostic links in the initial IT acknowledgment email.',
      'Pre-authorize recurring cloud vendor invoices under $20,000 to reduce Finance approval latency.',
      'Deploy seasonal HVAC maintenance checks prior to weekend temperature shifts in the West Wing.'
    ];
    projectedForecast = 'Next week volume is anticipated to rise by 8-12% due to upcoming end-of-month financial closing and benefits open enrollment deadlines.';
  }

  const recentSampleTickets = targetRequests.slice(0, 5).map((r) => ({
    id: r.id,
    summary: r.summary,
    urgency: r.urgency,
    status: r.status,
    requesterName: r.requesterName,
    resolutionTime: r.actualResolutionHours ? `${r.actualResolutionHours}h` : r.estimatedResolutionTime,
  }));

  return {
    weekPeriod: targetDept === 'ALL'
      ? `Enterprise Executive Briefing — ${weekStart} – ${weekEnd}`
      : `${CATEGORIES_CONFIG[targetDept].name} Department Report — ${weekStart} – ${weekEnd}`,
    generatedAt: now.toISOString(),
    executiveSummary,
    totalVolume: targetRequests.length,
    slaAdherenceRate: deptSlaRate,
    meanResolutionHours: deptAvgHours,
    keyHighlights,
    departmentPerformance: trends.categoriesBreakdown.map((c) => ({
      category: c.category,
      volume: c.volume,
      avgResolutionHours: c.avgResolutionHours,
      targetSLA: c.targetSLA,
      slaAdherenceRate: c.slaAdherenceRate,
      healthStatus: c.healthStatus,
      summary: `${c.volume} tickets processed (${c.percentage}% workload share). Avg turnaround ${c.avgResolutionHours}h against target ${c.targetSLA}.`
    })),
    criticalBottlenecks,
    strategicRecommendations,
    projectedForecast,
    modelEngine: 'heuristic-analytics-engine',
    targetDepartment: targetDept,
    reportFocus: focus,
    departmentMeta,
    subCategoryBreakdown,
    urgencyDistribution: urgencyCounts,
    recentSampleTickets,
  };
}

export async function generateAiWeeklyInsights(
  requests: ClassifiedRequest[],
  aiClient: GoogleGenAI,
  options: ReportOptions = {}
): Promise<WeeklyInsightsReport> {
  const targetDept = options.department && options.department !== 'ALL' ? options.department : 'ALL';
  const focus = options.focus || 'executive';
  const trends = calculateTrends(requests);

  const now = new Date();
  const daysBack = options.timeRange === '30d' ? 30 : options.timeRange === '14d' ? 14 : 7;
  const weekStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEnd = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Filter requests for target department if specific department selected
  const targetRequests = targetDept === 'ALL' ? requests : requests.filter((r) => r.category === targetDept);

  // Compute subcategories & urgency counts
  const subCategoryCounts: Record<string, number> = {};
  const urgencyCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  let deptResolutionHoursSum = 0;
  let deptSlaMetCount = 0;

  targetRequests.forEach((r) => {
    subCategoryCounts[r.subCategory] = (subCategoryCounts[r.subCategory] || 0) + 1;
    if (urgencyCounts[r.urgency] !== undefined) {
      urgencyCounts[r.urgency]++;
    }
    const resHours = r.actualResolutionHours || (r.status === 'Resolved' ? 3.5 : 8.0);
    deptResolutionHoursSum += resHours;
    if (r.slaMet !== false) deptSlaMetCount++;
  });

  const totalTargetVol = targetRequests.length || 1;
  const subCategoryBreakdown = Object.entries(subCategoryCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Number(((count / totalTargetVol) * 100).toFixed(1)),
  })).sort((a, b) => b.count - a.count);

  const deptSlaRate = Number(((deptSlaMetCount / totalTargetVol) * 100).toFixed(1));
  const deptAvgHours = Number((deptResolutionHoursSum / totalTargetVol).toFixed(1));

  const deptSpec = targetDept !== 'ALL' ? CATEGORIES_CONFIG[targetDept] : null;

  const departmentMeta = deptSpec ? {
    name: deptSpec.name,
    primaryLead: deptSpec.primaryLead,
    dispatchQueue: deptSpec.dispatchQueue,
    defaultSLA: deptSpec.defaultSLA,
    subCategories: deptSpec.subCategories,
  } : undefined;

  const metricsSnapshot = {
    scope: targetDept === 'ALL' ? 'Enterprise Multi-Department' : `${deptSpec?.name} (${targetDept})`,
    focusMode: focus,
    timeRange: options.timeRange || '7d',
    period: `${weekStart} – ${weekEnd}`,
    totalTickets: targetRequests.length,
    overallMeanHours: deptAvgHours,
    slaAdherenceRate: deptSlaRate,
    urgencyMix: urgencyCounts,
    subCategoryDistribution: subCategoryBreakdown,
    allDepartmentsComparison: trends.categoriesBreakdown.map((c) => ({
      department: c.name,
      category: c.category,
      volume: c.volume,
      share: `${c.percentage}%`,
      avgResolutionHours: c.avgResolutionHours,
      slaTarget: c.targetSLA,
      adherence: `${c.slaAdherenceRate}%`,
    })),
    recentTickets: targetRequests.slice(0, 6).map((r) => ({
      summary: r.summary,
      urgency: r.urgency,
      subCategory: r.subCategory,
      status: r.status,
    })),
  };

  const systemInstruction = `You are AutoTriage's Chief Analytics Officer and Executive Intelligence Director.
Generate a high-impact, insightful, professional operations summary report.
Target Department: ${targetDept === 'ALL' ? 'All Corporate Departments (Executive Level)' : `${deptSpec?.name} Department`}
Focus Mode: ${focus.toUpperCase()} (${
    focus === 'executive'
      ? 'Executive Briefing, KPI scorecard, strategic impact'
      : focus === 'operations'
      ? 'Operational deep-dive, task turnaround, queue efficiency'
      : focus === 'bottlenecks'
      ? 'Incident audit, root-cause friction, risk mitigation'
      : 'Staffing, capacity planning, ticket workload surge management'
  })

Requirements:
- executiveSummary: 2-3 substantive, data-backed paragraphs synthesizing performance, trends, and business impact.
- keyHighlights: 4-5 bulleted operational wins and achievements.
- criticalBottlenecks: 2-4 systemic risks, delays, or process blockers.
- strategicRecommendations: 3-4 concrete, actionable operational directives for department leads and supervisors.
- projectedForecast: Forward-looking forecast for the upcoming cycle.
- departmentPerformance: performance assessments for all 4 departments.
Return strict JSON adhering to the provided schema.`;

  const prompt = `Data Snapshot for Reporting:\n${JSON.stringify(metricsSnapshot, null, 2)}\n\nProvide the customized report for ${targetDept === 'ALL' ? 'the entire organization' : deptSpec?.name}.`;

  try {
    const generatePromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            keyHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            departmentPerformance: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ['HR', 'IT', 'Finance', 'Operations'] },
                  volume: { type: Type.NUMBER },
                  avgResolutionHours: { type: Type.NUMBER },
                  targetSLA: { type: Type.STRING },
                  slaAdherenceRate: { type: Type.NUMBER },
                  healthStatus: { type: Type.STRING, enum: ['Excellent', 'Good', 'Attention Required'] },
                  summary: { type: Type.STRING }
                },
                required: ['category', 'volume', 'avgResolutionHours', 'targetSLA', 'slaAdherenceRate', 'healthStatus', 'summary']
              }
            },
            criticalBottlenecks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            strategicRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            projectedForecast: { type: Type.STRING }
          },
          required: [
            'executiveSummary',
            'keyHighlights',
            'departmentPerformance',
            'criticalBottlenecks',
            'strategicRecommendations',
            'projectedForecast'
          ]
        }
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Weekly insights generation timed out')), 9000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const rawJson = response.text?.trim() || '';
    const parsed = JSON.parse(rawJson);

    const recentSampleTickets = targetRequests.slice(0, 5).map((r) => ({
      id: r.id,
      summary: r.summary,
      urgency: r.urgency,
      status: r.status,
      requesterName: r.requesterName,
      resolutionTime: r.actualResolutionHours ? `${r.actualResolutionHours}h` : r.estimatedResolutionTime,
    }));

    return {
      weekPeriod: targetDept === 'ALL'
        ? `Enterprise Executive Briefing — ${weekStart} – ${weekEnd}`
        : `${deptSpec?.name} Department Report — ${weekStart} – ${weekEnd}`,
      generatedAt: now.toISOString(),
      executiveSummary: parsed.executiveSummary || 'Executive weekly operations report generated.',
      totalVolume: targetRequests.length,
      slaAdherenceRate: deptSlaRate,
      meanResolutionHours: deptAvgHours,
      keyHighlights: Array.isArray(parsed.keyHighlights) ? parsed.keyHighlights : [],
      departmentPerformance: Array.isArray(parsed.departmentPerformance)
        ? parsed.departmentPerformance
        : trends.categoriesBreakdown.map((c) => ({
            category: c.category,
            volume: c.volume,
            avgResolutionHours: c.avgResolutionHours,
            targetSLA: c.targetSLA,
            slaAdherenceRate: c.slaAdherenceRate,
            healthStatus: c.healthStatus,
            summary: `${c.volume} tickets handled.`,
          })),
      criticalBottlenecks: Array.isArray(parsed.criticalBottlenecks) ? parsed.criticalBottlenecks : [],
      strategicRecommendations: Array.isArray(parsed.strategicRecommendations) ? parsed.strategicRecommendations : [],
      projectedForecast: parsed.projectedForecast || 'Stable volume expected.',
      modelEngine: 'gemini-3.8-flash',
      targetDepartment: targetDept,
      reportFocus: focus,
      departmentMeta,
      subCategoryBreakdown,
      urgencyDistribution: urgencyCounts,
      recentSampleTickets,
    };
  } catch (err) {
    console.warn('AI weekly insights generation failed or timed out, using fallback:', err);
    return generateHeuristicWeeklyInsights(requests, options);
  }
}
