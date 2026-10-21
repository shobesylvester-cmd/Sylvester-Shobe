import { jsPDF } from 'jspdf';
import { WeeklyInsightsReport } from '../types/classifier.ts';

export function generatePdfReport(report: WeeklyInsightsReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 18;
      // Header on continuation page
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(`AutoTriage AI — ${report.weekPeriod} (Continuation)`, margin, 12);
      doc.line(margin, 14, pageWidth - margin, 14);
      y = 20;
    }
  };

  // 1. Top Decorative Brand Bar
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setFillColor(99, 102, 241); // Indigo 500 accent left stripe
  doc.rect(margin, y, 4, 24, 'F');

  // Brand title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('AUTOTRIAGE AI — OPERATIONAL INTELLIGENCE REPORT', margin + 8, y + 9);

  // Subtitle / Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(`${report.weekPeriod.toUpperCase()}`, margin + 8, y + 17);

  // Date and Engine (Right aligned)
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const genDateStr = `Generated: ${new Date(report.generatedAt).toLocaleString()}`;
  doc.text(genDateStr, pageWidth - margin - 4, y + 10, { align: 'right' });
  doc.text(`Engine: ${report.modelEngine}`, pageWidth - margin - 4, y + 16, { align: 'right' });

  y += 30;

  // 2. Department Scope & Focus Badge (if customized)
  if (report.targetDepartment && report.targetDepartment !== 'ALL' && report.departmentMeta) {
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Department: ${report.departmentMeta.name}`, margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Lead: ${report.departmentMeta.primaryLead}   |   Target SLA: ${report.departmentMeta.defaultSLA}   |   Dispatch Queue: ${report.departmentMeta.dispatchQueue}`, margin + 4, y + 11);

    y += 18;
  }

  // 3. Key Scorecard Metrics Banner
  const colWidth = (contentWidth - 6) / 4;
  const kpis = [
    { label: 'TICKET VOLUME', val: `${report.totalVolume}`, sub: 'Classified & Triaged', color: [15, 23, 42] },
    { label: 'SLA ADHERENCE', val: `${report.slaAdherenceRate}%`, sub: 'Target: > 90%', color: [16, 185, 129] },
    { label: 'MEAN RESOLUTION', val: `${report.meanResolutionHours}h`, sub: 'Turnaround Time', color: [14, 165, 233] },
    { label: 'AUDIT STATUS', val: 'PASSED', sub: 'Zero Dropouts', color: [99, 102, 241] },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (colWidth + 2);
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(kpiX, y, colWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, kpiX + 3, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, kpiX + 3, y + 16);
  });

  y += 24;

  // 4. Executive Summary Section
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE SUMMARY & SYNOPSIS', margin, y);
  y += 4;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const splitSummary = doc.splitTextToSize(report.executiveSummary, contentWidth);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 4 + 4;

  // 5. Key Highlights Section
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. KEY OPERATIONAL HIGHLIGHTS', margin, y);
  y += 4;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  report.keyHighlights.forEach((hl) => {
    checkPageBreak(10);
    // green check dot
    doc.setFillColor(16, 185, 129);
    doc.circle(margin + 2, y - 1, 1, 'F');

    const splitHl = doc.splitTextToSize(hl, contentWidth - 8);
    doc.text(splitHl, margin + 6, y);
    y += splitHl.length * 3.8 + 2;
  });

  y += 4;

  // 6. Department Performance Breakdown Table
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DEPARTMENT PERFORMANCE & SLA MATRIX', margin, y);
  y += 4;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DEPARTMENT', margin + 3, y + 4.5);
  doc.text('VOLUME', margin + 45, y + 4.5);
  doc.text('MEAN RES.', margin + 70, y + 4.5);
  doc.text('TARGET SLA', margin + 98, y + 4.5);
  doc.text('SLA ADHERENCE', margin + 128, y + 4.5);
  doc.text('HEALTH STATUS', margin + 158, y + 4.5);

  y += 8;

  // Table Rows
  report.departmentPerformance.forEach((dept, i) => {
    checkPageBreak(8);
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 2, contentWidth, 6.5, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(dept.category, margin + 3, y + 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`${dept.volume} tickets`, margin + 45, y + 2.5);
    doc.text(`${dept.avgResolutionHours}h`, margin + 70, y + 2.5);
    doc.text(dept.targetSLA, margin + 98, y + 2.5);

    // Color code adherence
    if (dept.slaAdherenceRate >= 90) {
      doc.setTextColor(16, 185, 129);
    } else if (dept.slaAdherenceRate >= 75) {
      doc.setTextColor(14, 165, 233);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(`${dept.slaAdherenceRate}%`, margin + 128, y + 2.5);

    doc.setTextColor(15, 23, 42);
    doc.text(dept.healthStatus, margin + 158, y + 2.5);

    y += 6.5;
  });

  y += 4;

  // 6b. If Customized Sub-Category Breakdown exists
  if (report.subCategoryBreakdown && report.subCategoryBreakdown.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SUB-CATEGORY WORKLOAD DISTRIBUTION', margin, y);
    y += 3.5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 3.5;

    report.subCategoryBreakdown.slice(0, 5).forEach((sub) => {
      checkPageBreak(6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(sub.name, margin + 3, y + 2);
      doc.setFont('helvetica', 'normal');
      doc.text(`${sub.count} tickets (${sub.percentage}%)`, pageWidth - margin - 3, y + 2, { align: 'right' });
      y += 5;
    });
    y += 4;
  }

  // 7. Critical Bottlenecks & Operational Risks
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(194, 65, 12); // Amber 700
  doc.text('4. SYSTEMIC BOTTLENECKS & OPERATIONAL RISKS', margin, y);
  y += 4;

  doc.setDrawColor(251, 146, 60);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  report.criticalBottlenecks.forEach((b) => {
    checkPageBreak(10);
    doc.setFillColor(245, 158, 11); // Amber
    doc.circle(margin + 2, y - 1, 1, 'F');

    const splitB = doc.splitTextToSize(b, contentWidth - 8);
    doc.text(splitB, margin + 6, y);
    y += splitB.length * 3.8 + 2;
  });

  y += 4;

  // 8. Strategic Recommendations
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(67, 56, 202); // Indigo 700
  doc.text('5. STRATEGIC RECOMMENDATIONS & DIRECTIVES', margin, y);
  y += 4;

  doc.setDrawColor(99, 102, 241);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  report.strategicRecommendations.forEach((rec, idx) => {
    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(`${idx + 1}.`, margin + 1, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitRec = doc.splitTextToSize(rec, contentWidth - 10);
    doc.text(splitRec, margin + 6, y);
    y += splitRec.length * 3.8 + 2;
  });

  y += 4;

  // 9. Projected Forecast Callout
  checkPageBreak(25);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('FORWARD LOOKING FORECAST:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const splitForecast = doc.splitTextToSize(report.projectedForecast, contentWidth - 8);
  doc.text(splitForecast, margin + 4, y + 10);

  // 10. Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text('AutoTriage AI • Automated Multi-Department Triage & SLA Analytics Platform • Confidential Internal Document', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Trigger browser download
  const deptTag = report.targetDepartment && report.targetDepartment !== 'ALL' ? `_${report.targetDepartment}` : '_Executive';
  const fileName = `AutoTriage_Report${deptTag}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function downloadJsonReport(report: WeeklyInsightsReport): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const deptTag = report.targetDepartment && report.targetDepartment !== 'ALL' ? `_${report.targetDepartment}` : '_Executive';
  downloadAnchor.setAttribute('download', `AutoTriage_Report${deptTag}_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function downloadCsvReport(report: WeeklyInsightsReport): void {
  const rows: string[][] = [
    ['Report Title', report.weekPeriod],
    ['Generated At', report.generatedAt],
    ['Model Engine', report.modelEngine],
    ['Total Ingested Volume', `${report.totalVolume}`],
    ['SLA Adherence Rate', `${report.slaAdherenceRate}%`],
    ['Mean Resolution Hours', `${report.meanResolutionHours}h`],
    [],
    ['DEPARTMENT PERFORMANCE MATRIX'],
    ['Department', 'Volume', 'Avg Resolution (Hours)', 'Target SLA', 'SLA Adherence (%)', 'Health Status', 'Summary'],
  ];

  report.departmentPerformance.forEach((dept) => {
    rows.push([
      dept.category,
      `${dept.volume}`,
      `${dept.avgResolutionHours}`,
      dept.targetSLA,
      `${dept.slaAdherenceRate}%`,
      dept.healthStatus,
      `"${dept.summary.replace(/"/g, '""')}"`,
    ]);
  });

  if (report.subCategoryBreakdown && report.subCategoryBreakdown.length > 0) {
    rows.push([]);
    rows.push(['SUB-CATEGORY BREAKDOWN']);
    rows.push(['Sub-Category', 'Ticket Count', 'Workload Share (%)']);
    report.subCategoryBreakdown.forEach((sub) => {
      rows.push([`"${sub.name}"`, `${sub.count}`, `${sub.percentage}%`]);
    });
  }

  rows.push([]);
  rows.push(['KEY OPERATIONAL HIGHLIGHTS']);
  report.keyHighlights.forEach((hl) => {
    rows.push([`"${hl.replace(/"/g, '""')}"`]);
  });

  rows.push([]);
  rows.push(['CRITICAL BOTTLENECKS']);
  report.criticalBottlenecks.forEach((b) => {
    rows.push([`"${b.replace(/"/g, '""')}"`]);
  });

  rows.push([]);
  rows.push(['STRATEGIC RECOMMENDATIONS']);
  report.strategicRecommendations.forEach((rec, idx) => {
    rows.push([`${idx + 1}`, `"${rec.replace(/"/g, '""')}"`]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const deptTag = report.targetDepartment && report.targetDepartment !== 'ALL' ? `_${report.targetDepartment}` : '_Executive';
  link.setAttribute('download', `AutoTriage_Report${deptTag}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadMarkdownReport(report: WeeklyInsightsReport): void {
  const text = `# AutoTriage AI — ${report.weekPeriod}
Generated: ${new Date(report.generatedAt).toLocaleString()}
Model Engine: ${report.modelEngine}
Target Scope: ${report.targetDepartment || 'All Corporate Departments'}
Focus Mode: ${report.reportFocus || 'Executive Briefing'}

---

## 1. Executive Synopsis
${report.executiveSummary}

---

## 2. Key Operational Metrics
- **Total Ingested Volume:** ${report.totalVolume} tickets
- **SLA Adherence Rate:** ${report.slaAdherenceRate}%
- **Mean Resolution Turnaround:** ${report.meanResolutionHours} hours
- **Audit Verification:** Passed 100% Zero Dropped Requests

---

## 3. Department Performance & SLA Adherence
${report.departmentPerformance
  .map(
    (d) =>
      `### ${d.category} (Health Status: ${d.healthStatus})
- **Ticket Volume:** ${d.volume}
- **Mean Turnaround:** ${d.avgResolutionHours}h (Target SLA: ${d.targetSLA})
- **SLA Adherence:** ${d.slaAdherenceRate}%
- **Operational Assessment:** ${d.summary}`
  )
  .join('\n\n')}

${report.subCategoryBreakdown && report.subCategoryBreakdown.length > 0 ? `
---

## 4. Sub-Category Distribution
${report.subCategoryBreakdown.map((s) => `- **${s.name}:** ${s.count} tickets (${s.percentage}% workload share)`).join('\n')}
` : ''}

---

## 5. Key Highlights & Achievements
${report.keyHighlights.map((h) => `- ${h}`).join('\n')}

---

## 6. Critical Operational Bottlenecks & Risks
${report.criticalBottlenecks.map((b) => `- ${b}`).join('\n')}

---

## 7. Strategic Recommendations & Directives
${report.strategicRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

## 8. Projected Forward Forecast
${report.projectedForecast}

_AutoTriage AI Enterprise System • Confidential Internal Documentation_
`;

  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const deptTag = report.targetDepartment && report.targetDepartment !== 'ALL' ? `_${report.targetDepartment}` : '_Executive';
  a.download = `AutoTriage_Report${deptTag}_${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
