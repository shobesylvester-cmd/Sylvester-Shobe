import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { ClassifiedRequest, DepartmentCategory, UrgencyLevel, RequestStatus, ResponseTone, GeneratedResponse } from './src/types/classifier.ts';
import { CATEGORIES_CONFIG } from './src/data/categories.ts';
import { SYSTEM_ARCHITECTURE_LAYERS, SYSTEM_DATA_FLOW } from './src/data/architectureSpec.ts';
import { RESPONSE_TEMPLATES, TONE_CONFIGS } from './src/data/responseTemplates.ts';
import { calculateTrends, generateHeuristicWeeklyInsights, generateAiWeeklyInsights } from './src/server/analyticsService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'classified_requests.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Default initial seed requests distributed across the past 7 days
const DAY_MS = 24 * 60 * 60 * 1000;
const INITIAL_SEEDS: ClassifiedRequest[] = [
  {
    id: 'req-seed-001',
    rawText: 'My MacBook Pro trackpad is unresponsive and the battery has started to swell. I am currently unable to work on customer pull requests.',
    requesterName: 'Alex Rivera',
    requesterEmail: 'alex.rivera@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'In Progress',
    category: 'IT',
    confidence: 0.98,
    subCategory: 'Hardware & Peripherals',
    urgency: 'Critical',
    summary: 'Swollen MacBook battery causing trackpad failure and preventing daily software engineering work.',
    reasoning: 'Hardware safety and productivity hazard requiring immediate device replacement and hazardous battery disposal protocol.',
    keyEntities: ['MacBook Pro', 'battery swell', 'trackpad'],
    suggestedAction: 'Dispatch replacement 16-inch M3 Max laptop via IT desk and schedule battery disposal.',
    estimatedResolutionTime: '2 Hours',
    actualResolutionHours: 1.8,
    slaTargetHours: 4,
    slaMet: true,
    escalationRequired: true,
    assignedTeam: 'queue.infra.support',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 420,
  },
  {
    id: 'req-seed-002',
    rawText: 'Hello, our team would like to know if dental and vision coverage extends to domestic partners, and how to enroll before open enrollment closes this Friday.',
    requesterName: 'Priya Patel',
    requesterEmail: 'priya.patel@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'Triaged',
    category: 'HR',
    confidence: 0.96,
    subCategory: 'Benefits & Health Insurance',
    urgency: 'High',
    summary: 'Inquiry regarding domestic partner health/dental eligibility and open enrollment deadline.',
    reasoning: 'Direct inquiry on company health insurance policy and domestic partner enrollment documentation.',
    keyEntities: ['dental and vision', 'domestic partners', 'open enrollment'],
    suggestedAction: 'Send Domestic Partnership Affidavit link and benefits guide booklet.',
    estimatedResolutionTime: '12 Hours',
    actualResolutionHours: 11.2,
    slaTargetHours: 24,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.people.general',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 380,
  },
  {
    id: 'req-seed-003',
    rawText: 'Vendor AWS Cloud Services invoice #INV-99214 for $14,280 is pending payment approval. Payment terms are net-30 and it is 3 days past due.',
    requesterName: 'Marcus Zhang',
    requesterEmail: 'marcus.zhang@enterprise.corp',
    source: 'rest_api',
    createdAt: new Date(Date.now() - DAY_MS * 1 + 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 1 + 1000 * 60 * 30).toISOString(),
    status: 'New',
    category: 'Finance',
    confidence: 0.99,
    subCategory: 'Vendor Invoices & AP',
    urgency: 'High',
    summary: 'Overdue AWS cloud infrastructure vendor invoice requiring expedited accounts payable release.',
    reasoning: 'Involves vendor payment, net-30 terms, invoice number, and direct financial disbursement to cloud vendor.',
    keyEntities: ['AWS Cloud Services', '$14,280', 'INV-99214', 'Net-30'],
    suggestedAction: 'Route to Accounts Payable manager for immediate wire/ACH authorization.',
    estimatedResolutionTime: '24 Hours',
    actualResolutionHours: 22.0,
    slaTargetHours: 48,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.finance.ledger',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 360,
  },
  {
    id: 'req-seed-004',
    rawText: 'The air conditioning on the 4th floor west wing is blowing warm air, and the office temperature is currently 79 degrees Fahrenheit.',
    requesterName: 'Chloe Bennett',
    requesterEmail: 'chloe.bennett@enterprise.corp',
    source: 'email_webhook',
    createdAt: new Date(Date.now() - DAY_MS * 1 + 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 1 + 1000 * 60 * 120).toISOString(),
    status: 'Resolved',
    category: 'Operations',
    confidence: 0.95,
    subCategory: 'Facilities Maintenance & HVAC',
    urgency: 'Medium',
    summary: 'HVAC malfunction on 4th floor west wing causing excessive room temperature.',
    reasoning: 'Physical building climate control, HVAC maintenance, and employee workspace comfort managed by facilities operations.',
    keyEntities: ['4th floor west wing', 'HVAC / AC', '79 degrees F'],
    suggestedAction: 'Dispatch building engineer to inspect compressor unit 4B and recalibrate thermostat.',
    estimatedResolutionTime: '4 Hours',
    actualResolutionHours: 3.5,
    slaTargetHours: 8,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.ops.workplace',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 395,
  },
  {
    id: 'req-seed-005',
    rawText: 'Need 3 new Dell 32-inch 4K monitors and dual-display USB-C docks ordered for the new machine learning interns starting next Monday.',
    requesterName: 'Liam Evans',
    requesterEmail: 'liam.evans@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - DAY_MS * 2 + 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 2 + 1000 * 60 * 60).toISOString(),
    status: 'In Progress',
    category: 'IT',
    confidence: 0.92,
    subCategory: 'Hardware & Peripherals',
    urgency: 'Medium',
    summary: 'Hardware procurement request for 3 4K monitors and USB-C docks for incoming interns.',
    reasoning: 'IT equipment requisition for peripherals and workstation accessories prior to onboarding.',
    keyEntities: ['Dell 32-inch 4K monitors', 'USB-C docks', 'ML interns'],
    suggestedAction: 'Verify IT peripheral inventory and submit equipment checkout request.',
    estimatedResolutionTime: '48 Hours',
    actualResolutionHours: 3.8,
    slaTargetHours: 4,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.infra.support',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 410,
  },
  {
    id: 'req-seed-006',
    rawText: 'Submitted travel expense report for last month Tokyo sales conference ($3,420). Need sign-off on per diem exchange rate adjustments.',
    requesterName: 'Devon Scott',
    requesterEmail: 'devon.scott@enterprise.corp',
    source: 'batch_import',
    createdAt: new Date(Date.now() - DAY_MS * 2 + 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 2 + 1000 * 60 * 180).toISOString(),
    status: 'Resolved',
    category: 'Finance',
    confidence: 0.97,
    subCategory: 'Expense Reimbursements',
    urgency: 'Low',
    summary: 'Travel reimbursement and currency exchange rate sign-off for Tokyo business trip.',
    reasoning: 'Expense reporting, per diem reconciliation, and reimbursement processing governed by corporate finance travel policy.',
    keyEntities: ['Tokyo sales conference', '$3,420', 'per diem', 'exchange rate'],
    suggestedAction: 'Audit receipts against JPY/USD spot rate on transaction dates and approve payout.',
    estimatedResolutionTime: '48 Hours',
    actualResolutionHours: 26.5,
    slaTargetHours: 48,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.finance.ledger',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 345,
  },
  {
    id: 'req-seed-007',
    rawText: 'Question regarding the 401(k) company employer match percentage and how vesting schedule applies after reaching 2-year tenure.',
    requesterName: 'Elena Rostova',
    requesterEmail: 'elena.rostova@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - DAY_MS * 3 + 1000 * 60 * 90).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 3 + 1000 * 60 * 90).toISOString(),
    status: 'Resolved',
    category: 'HR',
    confidence: 0.98,
    subCategory: 'Benefits & Health Insurance',
    urgency: 'Low',
    summary: '401(k) retirement employer contribution match and 2-year vesting schedule inquiry.',
    reasoning: 'Corporate retirement benefits question governed by People Operations total rewards team.',
    keyEntities: ['401(k)', 'employer match', 'vesting schedule'],
    suggestedAction: 'Provide Fidelity retirement plan prospectus and vesting breakdown.',
    estimatedResolutionTime: '24 Hours',
    actualResolutionHours: 9.0,
    slaTargetHours: 24,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.people.general',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 350,
  },
  {
    id: 'req-seed-008',
    rawText: 'The RFID badge turnstile at North Tower main lobby is flashing red and refusing all employee cards. Employees queuing in rain.',
    requesterName: 'Security Desk',
    requesterEmail: 'security.north@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - DAY_MS * 3 + 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 3 + 1000 * 60 * 15).toISOString(),
    status: 'Resolved',
    category: 'Operations',
    confidence: 0.99,
    subCategory: 'Physical Security & Badge Access',
    urgency: 'Critical',
    summary: 'Turnstile RFID controller failure preventing physical employee building entry.',
    reasoning: 'Physical access disruption causing queue bottlenecks and potential life-safety concern.',
    keyEntities: ['RFID badge turnstile', 'North Tower', 'main lobby'],
    suggestedAction: 'Deploy security technician to override turnstiles to manual pass-through mode.',
    estimatedResolutionTime: '2 Hours',
    actualResolutionHours: 1.4,
    slaTargetHours: 8,
    slaMet: true,
    escalationRequired: true,
    assignedTeam: 'queue.ops.workplace',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 375,
  },
  {
    id: 'req-seed-009',
    rawText: 'Need GitHub Enterprise Copilot seat provisioned for the new full-stack frontend engineer.',
    requesterName: 'David Kim',
    requesterEmail: 'david.kim@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - DAY_MS * 4 + 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 4 + 1000 * 60 * 45).toISOString(),
    status: 'Resolved',
    category: 'IT',
    confidence: 0.96,
    subCategory: 'Software Licenses & SaaS Provisioning',
    urgency: 'Low',
    summary: 'GitHub Copilot license assignment for software engineering hire.',
    reasoning: 'SaaS tooling requisition under developer infrastructure seat governance.',
    keyEntities: ['GitHub Enterprise Copilot', 'seat provisioning'],
    suggestedAction: 'Assign GitHub org license via Okta SaaS portal.',
    estimatedResolutionTime: '4 Hours',
    actualResolutionHours: 2.2,
    slaTargetHours: 4,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.infra.support',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 340,
  },
  {
    id: 'req-seed-010',
    rawText: 'Need temporary $15,000 corporate card limit increase for booth rental and staging deposits at the upcoming Las Vegas Cloud Expo.',
    requesterName: 'Rachel Green',
    requesterEmail: 'rachel.green@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - DAY_MS * 4 + 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 4 + 1000 * 60 * 120).toISOString(),
    status: 'Resolved',
    category: 'Finance',
    confidence: 0.98,
    subCategory: 'Corporate Credit Cards & Limits',
    urgency: 'High',
    summary: 'Corporate credit card temporary credit ceiling increase for expo booth rental.',
    reasoning: 'Commercial card limit adjustment requiring FP&A budget verification.',
    keyEntities: ['$15,000', 'corporate card limit', 'Cloud Expo'],
    suggestedAction: 'Approve temporary limit raise on Brex dashboard for 14-day window.',
    estimatedResolutionTime: '24 Hours',
    actualResolutionHours: 15.0,
    slaTargetHours: 48,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.finance.ledger',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 365,
  },
  {
    id: 'req-seed-011',
    rawText: 'Requesting 8 weeks parental leave starting in November. Need guidelines on salary continuation and health insurance continuity.',
    requesterName: 'Jordan Vance',
    requesterEmail: 'jordan.vance@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - DAY_MS * 5 + 1000 * 60 * 150).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 5 + 1000 * 60 * 150).toISOString(),
    status: 'Resolved',
    category: 'HR',
    confidence: 0.97,
    subCategory: 'Leave & PTO Requests',
    urgency: 'Medium',
    summary: 'Parental leave scheduling, salary continuation, and benefits continuation inquiry.',
    reasoning: 'Statutory and company family leave request managed by People Operations.',
    keyEntities: ['8 weeks parental leave', 'salary continuation'],
    suggestedAction: 'Assign dedicated Leave Coordinator and issue FMLA/State leave packet.',
    estimatedResolutionTime: '24 Hours',
    actualResolutionHours: 14.5,
    slaTargetHours: 24,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.people.general',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 370,
  },
  {
    id: 'req-seed-012',
    rawText: 'Ergonomic standing desk motor on desk #304 is jammed in the lowest position and making a grinding noise.',
    requesterName: 'Tom Holland',
    requesterEmail: 'tom.holland@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - DAY_MS * 5 + 1000 * 60 * 200).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 5 + 1000 * 60 * 200).toISOString(),
    status: 'Resolved',
    category: 'Operations',
    confidence: 0.94,
    subCategory: 'Health, Safety & Ergonomics',
    urgency: 'Low',
    summary: 'Standing desk motor actuator failure and mechanical reset request.',
    reasoning: 'Workplace ergonomic equipment maintenance handled by Facilities staff.',
    keyEntities: ['standing desk motor', 'desk #304', 'grinding noise'],
    suggestedAction: 'Dispatch maintenance technician with reset key and spare motor assembly.',
    estimatedResolutionTime: '8 Hours',
    actualResolutionHours: 5.5,
    slaTargetHours: 8,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.ops.workplace',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 385,
  },
  {
    id: 'req-seed-013',
    rawText: 'Unable to connect to internal staging VPN from London remote office; Okta MFA token reports invalid timestamp.',
    requesterName: 'Samantha Bell',
    requesterEmail: 'samantha.bell@enterprise.corp',
    source: 'web_portal',
    createdAt: new Date(Date.now() - DAY_MS * 6 + 1000 * 60 * 100).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 6 + 1000 * 60 * 100).toISOString(),
    status: 'Resolved',
    category: 'IT',
    confidence: 0.97,
    subCategory: 'VPN & Network Access',
    urgency: 'High',
    summary: 'Okta MFA time-drift error blocking remote VPN staging access.',
    reasoning: 'Authentication failure and VPN gateway security lockout.',
    keyEntities: ['staging VPN', 'London office', 'Okta MFA token'],
    suggestedAction: 'Re-sync Okta Verify clock skew on authenticator and verify IP whitelist.',
    estimatedResolutionTime: '4 Hours',
    actualResolutionHours: 2.8,
    slaTargetHours: 4,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.infra.support',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 390,
  },
  {
    id: 'req-seed-014',
    rawText: 'External enterprise client Acme Corp requests updated Form W-9 signed by Corporate Controller before contract execution.',
    requesterName: 'Michael Scott',
    requesterEmail: 'michael.scott@enterprise.corp',
    source: 'email_webhook',
    createdAt: new Date(Date.now() - DAY_MS * 6 + 1000 * 60 * 220).toISOString(),
    updatedAt: new Date(Date.now() - DAY_MS * 6 + 1000 * 60 * 220).toISOString(),
    status: 'Resolved',
    category: 'Finance',
    confidence: 0.98,
    subCategory: 'Tax & Audit Compliance',
    urgency: 'Medium',
    summary: 'Corporate Form W-9 transmission for external client vendor onboarding.',
    reasoning: 'Tax documentation and vendor compliance request under Corporate Treasury.',
    keyEntities: ['Form W-9', 'Acme Corp', 'Corporate Controller'],
    suggestedAction: 'Transmit countersigned 2026 Form W-9 PDF with encrypted delivery.',
    estimatedResolutionTime: '24 Hours',
    actualResolutionHours: 12.0,
    slaTargetHours: 48,
    slaMet: true,
    escalationRequired: false,
    assignedTeam: 'queue.finance.ledger',
    classificationEngine: 'gemini-3.8-flash',
    processingTimeMs: 360,
  }
];

// Helper to read and write database
function getStoredRequests(): ClassifiedRequest[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading stored requests file, resetting to initial seeds:', err);
  }
  // Initialize with seeds if empty or missing
  saveStoredRequests(INITIAL_SEEDS);
  return INITIAL_SEEDS;
}

function saveStoredRequests(requests: ClassifiedRequest[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing stored requests to file:', err);
  }
}

// Fallback heuristic classifier for offline/safety mode
function classifyHeuristically(text: string): {
  category: DepartmentCategory;
  confidence: number;
  subCategory: string;
  urgency: UrgencyLevel;
  summary: string;
  reasoning: string;
  keyEntities: string[];
  suggestedAction: string;
  estimatedResolutionTime: string;
  escalationRequired: boolean;
  classificationEngine: 'heuristic-fallback';
} {
  const lower = text.toLowerCase();

  let hrScore = 0;
  let itScore = 0;
  let finScore = 0;
  let opsScore = 0;

  for (const kw of CATEGORIES_CONFIG.HR.keywords) {
    if (lower.includes(kw)) hrScore += 2;
  }
  for (const kw of CATEGORIES_CONFIG.IT.keywords) {
    if (lower.includes(kw)) itScore += 2;
  }
  for (const kw of CATEGORIES_CONFIG.Finance.keywords) {
    if (lower.includes(kw)) finScore += 2;
  }
  for (const kw of CATEGORIES_CONFIG.Operations.keywords) {
    if (lower.includes(kw)) opsScore += 2;
  }

  let category: DepartmentCategory = 'IT';
  let maxScore = itScore;
  let subCategory = 'General IT Inquiry';

  if (hrScore > maxScore) {
    category = 'HR';
    maxScore = hrScore;
    subCategory = lower.includes('payroll') ? 'Payroll & Direct Deposit' : 'Benefits & HR';
  }
  if (finScore > maxScore) {
    category = 'Finance';
    maxScore = finScore;
    subCategory = lower.includes('invoice') ? 'Vendor Invoices & AP' : 'Expense & Budgeting';
  }
  if (opsScore > maxScore) {
    category = 'Operations';
    maxScore = opsScore;
    subCategory = lower.includes('hvac') || lower.includes('temperature') ? 'Facilities Maintenance & HVAC' : 'Office Logistics';
  }

  const confidence = Math.min(0.95, Math.max(0.72, 0.65 + maxScore * 0.05));

  let urgency: UrgencyLevel = 'Medium';
  let escalationRequired = false;
  if (lower.includes('critical') || lower.includes('urgent') || lower.includes('immediately') || lower.includes('outage') || lower.includes('swell') || lower.includes('hazard')) {
    urgency = 'Critical';
    escalationRequired = true;
  } else if (lower.includes('high') || lower.includes('overdue') || lower.includes('asap') || lower.includes('deadline')) {
    urgency = 'High';
  } else if (lower.includes('when convenient') || lower.includes('low') || lower.includes('just wondering')) {
    urgency = 'Low';
  }

  return {
    category,
    confidence: Number(confidence.toFixed(2)),
    subCategory,
    urgency,
    summary: text.length > 80 ? text.slice(0, 77) + '...' : text,
    reasoning: `Rule-based lexical match identified key terminology aligning with ${category} standard domain responsibilities.`,
    keyEntities: text.split(' ').filter(w => w.length > 5).slice(0, 3),
    suggestedAction: `Dispatch request ticket to ${category} operational queue (${CATEGORIES_CONFIG[category].dispatchQueue}).`,
    estimatedResolutionTime: CATEGORIES_CONFIG[category].defaultSLA,
    escalationRequired,
    classificationEngine: 'heuristic-fallback',
  };
}

// AI Classifier with Gemini 3.8 Flash
async function classifyWithGemini(text: string) {
  const startTime = Date.now();

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10;

  if (!isKeyValid) {
    const fallback = classifyHeuristically(text);
    return {
      ...fallback,
      processingTimeMs: Date.now() - startTime,
    };
  }

  const systemInstruction = `You are AutoTriage, an intelligent enterprise request routing classifier.
Classify incoming employee, customer, or vendor requests into exactly one of the four corporate categories:
1. "HR" (Human Resources: payroll, benefits, PTO, health insurance, hiring, offboarding, workplace relations, 401k)
2. "IT" (Information Technology: hardware, laptop, VPN, wifi, credentials, software licenses, cybersecurity, bug reports, dev tools)
3. "Finance" (Finance & Accounting: invoices, expense reports, purchase orders, budgets, vendor payments, corporate cards, taxes)
4. "Operations" (Operations & Facilities: building maintenance, HVAC, office supplies, security badge, mail/shipping, catering, ergonomics)

Provide strict JSON output matching the schema. Calculate accurate confidence [0.0 - 1.0]. Assign urgency (Low, Medium, High, Critical) based on operational impact.`;

  try {
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Request to classify: "${text}"` }]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'The classified department. Must be one of: HR, IT, Finance, Operations.',
              enum: ['HR', 'IT', 'Finance', 'Operations']
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.0 and 1.0.'
            },
            subCategory: {
              type: Type.STRING,
              description: 'Specific sub-category within the department.'
            },
            urgency: {
              type: Type.STRING,
              description: 'Urgency level based on business impact.',
              enum: ['Low', 'Medium', 'High', 'Critical']
            },
            summary: {
              type: Type.STRING,
              description: 'A crisp one-sentence summary of the request.'
            },
            reasoning: {
              type: Type.STRING,
              description: 'Detailed enterprise justification for why this category and urgency were selected.'
            },
            keyEntities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key extracted entities, products, systems, or monetary values.'
            },
            suggestedAction: {
              type: Type.STRING,
              description: 'Recommended next operational step or automated routing dispatch.'
            },
            estimatedResolutionTime: {
              type: Type.STRING,
              description: 'Target SLA estimate, e.g. "4 Hours", "24 Hours".'
            },
            escalationRequired: {
              type: Type.BOOLEAN,
              description: 'True if executive or emergency on-call escalation is required.'
            }
          },
          required: [
            'category',
            'confidence',
            'subCategory',
            'urgency',
            'summary',
            'reasoning',
            'keyEntities',
            'suggestedAction',
            'estimatedResolutionTime',
            'escalationRequired'
          ]
        }
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI inference timeout after 8000ms')), 8000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const rawJson = response.text?.trim() || '';
    const parsed = JSON.parse(rawJson);

    // Validate category enum
    const validCategories: DepartmentCategory[] = ['HR', 'IT', 'Finance', 'Operations'];
    const assignedCategory = validCategories.includes(parsed.category as DepartmentCategory)
      ? (parsed.category as DepartmentCategory)
      : 'IT';

    return {
      category: assignedCategory,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.85)),
      subCategory: parsed.subCategory || 'General Support',
      urgency: (['Low', 'Medium', 'High', 'Critical'].includes(parsed.urgency) ? parsed.urgency : 'Medium') as UrgencyLevel,
      summary: parsed.summary || text.slice(0, 80),
      reasoning: parsed.reasoning || `Classified as ${assignedCategory} by enterprise language model.`,
      keyEntities: Array.isArray(parsed.keyEntities) ? parsed.keyEntities : [],
      suggestedAction: parsed.suggestedAction || `Route to ${assignedCategory} lead queue.`,
      estimatedResolutionTime: parsed.estimatedResolutionTime || CATEGORIES_CONFIG[assignedCategory].defaultSLA,
      escalationRequired: Boolean(parsed.escalationRequired),
      classificationEngine: 'gemini-3.8-flash' as const,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.warn('Gemini API call failed or encountered error, falling back to heuristic engine:', error);
    const fallback = classifyHeuristically(text);
    return {
      ...fallback,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// Fallback Heuristic Response Generator
function generateHeuristicResponse(params: {
  category: DepartmentCategory;
  rawText: string;
  requesterName: string;
  summary?: string;
  urgency?: UrgencyLevel;
  tone: ResponseTone;
  templateId?: string;
  customInstructions?: string;
}) {
  const firstName = params.requesterName?.split(' ')[0] || 'Colleague';
  const catSpec = CATEGORIES_CONFIG[params.category] || CATEGORIES_CONFIG.IT;
  const template = RESPONSE_TEMPLATES.find((t) => t.id === params.templateId) || RESPONSE_TEMPLATES.find((t) => t.category === params.category) || RESPONSE_TEMPLATES[0];

  let greeting = '';
  let subject = '';
  let body = '';
  let signOff = '';
  let slaCommitment = '';
  const keyNextSteps: string[] = [];

  const urgencyTag = params.urgency === 'Critical' ? '[CRITICAL P1] ' : params.urgency === 'High' ? '[HIGH PRIORITY] ' : '';

  if (params.tone === 'formal') {
    greeting = `Dear ${params.requesterName || 'Colleague'},`;
    subject = `${urgencyTag}${catSpec.name} Notice: Inbound Request Resolution`;
    signOff = template.defaultSignOff || `Respectfully,\n${catSpec.name} Administration`;
    slaCommitment = `Target resolution within standard department SLA: ${catSpec.defaultSLA}`;

    body = `Thank you for contacting the ${catSpec.name} department regarding your submission. We have officially recorded your request into our operational triage system.\n\nFollowing our review of the provided details, our team has initiated the appropriate protocol under the ${template.name} framework. All procedures will adhere strictly to corporate policy and statutory standards.`;

    keyNextSteps.push(`Your request has been routed to queue: ${catSpec.dispatchQueue}`);
    keyNextSteps.push(`Please preserve this correspondence for internal compliance auditing.`);
    keyNextSteps.push(`A designated specialist will review any attached supplementary records.`);
  } else if (params.tone === 'friendly') {
    greeting = `Hi ${firstName}!`;
    subject = `${urgencyTag}Update on your ${catSpec.name} request (${template.name})`;
    signOff = `Warmly,\nYour ${catSpec.name} Team`;
    slaCommitment = `We're on it! Expect full completion within ${catSpec.defaultSLA}.`;

    body = `Thanks so much for reaching out to us! We know how important this is to your day-to-day work, and we are happy to assist.\n\nOur team has triaged your note regarding "${params.summary || 'your request'}" and we are already moving forward with the ${template.name} workflow. We'll make sure everything is taken care of smoothly.`;

    keyNextSteps.push(`Sit tight while our team processes the next step on your behalf.`);
    keyNextSteps.push(`Feel free to reply right here if any extra questions pop up in the meantime.`);
    keyNextSteps.push(`You can track progress in real-time on our self-service portal.`);
  } else {
    // urgent
    greeting = `ATTENTION: ${params.requesterName.toUpperCase()}`;
    subject = `[URGENT ACTION] ${catSpec.name} Expedited Triage: Immediate Next Steps`;
    signOff = `Priority Response Operations,\n${catSpec.name} Incident Command`;
    slaCommitment = `EXPEDITED SLA: Active response within 1-2 hours.`;

    body = `This is an automated priority escalation regarding your urgent request concerning: "${params.summary || params.rawText.slice(0, 80)}".\n\nGiven the operational severity, this ticket has been fast-tracked past the standard triage queue directly to on-call ${catSpec.primaryLead}. Resources have been allocated to prevent further disruption.`;

    keyNextSteps.push(`IMMEDIATE: Please remain reachable via corporate Slack or mobile.`);
    keyNextSteps.push(`Escalation ticket dispatched to primary queue: ${catSpec.dispatchQueue}.`);
    keyNextSteps.push(`Next status dispatch will be communicated within 60 minutes.`);
  }

  // Include custom instructions if provided
  if (params.customInstructions?.trim()) {
    body += `\n\nAdditional Guidance: ${params.customInstructions.trim()}`;
  }

  return {
    subject,
    greeting,
    body,
    keyNextSteps,
    slaCommitment,
    signOff,
    engine: 'heuristic-generator' as const,
  };
}

// Generative AI Response Creator using Gemini 3.8 Flash
async function generateResponseWithGemini(params: {
  category: DepartmentCategory;
  rawText: string;
  requesterName: string;
  summary?: string;
  urgency?: UrgencyLevel;
  tone: ResponseTone;
  templateId?: string;
  customInstructions?: string;
}) {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10;

  if (!isKeyValid) {
    return generateHeuristicResponse(params);
  }

  const catSpec = CATEGORIES_CONFIG[params.category] || CATEGORIES_CONFIG.IT;
  const toneRule = TONE_CONFIGS[params.tone] || TONE_CONFIGS.formal;
  const template = RESPONSE_TEMPLATES.find((t) => t.id === params.templateId) || RESPONSE_TEMPLATES.find((t) => t.category === params.category);

  const systemInstruction = `You are AutoTriage AI, an expert enterprise communication engine.
Your role is to draft a professional, ready-to-send email or ticket reply for a corporate request.

Department: ${catSpec.name} (${params.category})
Target SLA: ${catSpec.defaultSLA}
Primary Lead: ${catSpec.primaryLead}
Selected Response Template: ${template ? template.name : 'General Resolution'}
Template Goals: ${template ? template.keyPoints.join('; ') : 'Resolve request promptly'}

TONE CONTROL:
You must strictly enforce the following tone: "${params.tone.toUpperCase()}":
${toneRule.promptGuideline}

Output Requirements:
- Return valid JSON matching the exact schema.
- Write a clear, appropriate subject line.
- Write an appropriate greeting matching the requested tone.
- Write a substantive, polished body (2-3 well-structured paragraphs).
- Provide 2 to 4 concrete, numbered or bulleted keyNextSteps.
- Provide a clear slaCommitment statement.
- Provide an authentic professional signOff.`;

  const userPrompt = `Draft a response for the following request:
Requester Name: ${params.requesterName}
Category: ${params.category}
Urgency Level: ${params.urgency || 'Medium'}
Request Content: "${params.rawText}"
Synopsis: "${params.summary || ''}"
Tone: ${params.tone}
${params.customInstructions ? `Special Instructions to include: ${params.customInstructions}` : ''}`;

  try {
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: 'Crisp, professional email subject line.'
            },
            greeting: {
              type: Type.STRING,
              description: 'Greeting line tailored to the selected tone (e.g. "Dear Alex," or "Hi Alex," or "ATTENTION: ALEX").'
            },
            body: {
              type: Type.STRING,
              description: 'The complete email body text with paragraph breaks.'
            },
            keyNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 actionable next steps for the requester or team.'
            },
            slaCommitment: {
              type: Type.STRING,
              description: 'Committed resolution timeline or SLA assurance.'
            },
            signOff: {
              type: Type.STRING,
              description: 'Professional sign-off matching the department and tone.'
            }
          },
          required: ['subject', 'greeting', 'body', 'keyNextSteps', 'slaCommitment', 'signOff']
        }
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response generation timeout after 8000ms')), 8000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const rawJson = response.text?.trim() || '';
    const parsed = JSON.parse(rawJson);

    return {
      subject: parsed.subject || `${params.category} Request Acknowledgment`,
      greeting: parsed.greeting || `Hello ${params.requesterName},`,
      body: parsed.body || '',
      keyNextSteps: Array.isArray(parsed.keyNextSteps) ? parsed.keyNextSteps : [],
      slaCommitment: parsed.slaCommitment || `Within ${catSpec.defaultSLA}`,
      signOff: parsed.signOff || template?.defaultSignOff || `Regards,\n${catSpec.name} Team`,
      engine: 'gemini-3.8-flash' as const,
    };
  } catch (err) {
    console.warn('Gemini response generator failed or timed out, using heuristic generator:', err);
    return generateHeuristicResponse(params);
  }
}

// REST API Endpoints

// 1. Get Categories Taxonomy
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json({
    categories: CATEGORIES_CONFIG,
    list: Object.values(CATEGORIES_CONFIG),
  });
});

// 2. Get System Architecture Blueprint
app.get('/api/architecture', (_req: Request, res: Response) => {
  res.json({
    layers: SYSTEM_ARCHITECTURE_LAYERS,
    dataFlow: SYSTEM_DATA_FLOW,
    version: '2.4.0-enterprise',
    model: 'gemini-3.8-flash',
    protocols: ['REST', 'Server-Sent Events', 'JSON Schema v7'],
    storageType: 'Persistent File-Backed JSON Store',
  });
});

// 3. Get Stored Classified Requests (with query filters)
app.get('/api/requests', (req: Request, res: Response) => {
  const { category, urgency, status, search } = req.query;
  let list = getStoredRequests();

  if (category && typeof category === 'string' && category !== 'ALL') {
    list = list.filter((r) => r.category === category);
  }

  if (urgency && typeof urgency === 'string' && urgency !== 'ALL') {
    list = list.filter((r) => r.urgency === urgency);
  }

  if (status && typeof status === 'string' && status !== 'ALL') {
    list = list.filter((r) => r.status === status);
  }

  if (search && typeof search === 'string') {
    const term = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.rawText.toLowerCase().includes(term) ||
        r.summary.toLowerCase().includes(term) ||
        r.requesterName.toLowerCase().includes(term) ||
        r.subCategory.toLowerCase().includes(term) ||
        r.reasoning.toLowerCase().includes(term)
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ requests: list, total: list.length });
});

// 4. Classify and Store Incoming Request
app.post('/api/classify', async (req: Request, res: Response) => {
  try {
    const { requestText, requesterName, requesterEmail, source } = req.body;

    if (!requestText || typeof requestText !== 'string' || !requestText.trim()) {
      return res.status(400).json({ error: 'Field "requestText" is required.' });
    }

    const classification = await classifyWithGemini(requestText.trim());
    const validCategory = classification.category;

    // Enforce routing assignment
    const assignedTeam = CATEGORIES_CONFIG[validCategory]?.dispatchQueue || 'queue.general.triage';

    // Status: if confidence is low (< 0.70) or urgency is Critical, flag appropriately
    let initialStatus: RequestStatus = 'Triaged';
    if (classification.urgency === 'Critical') {
      initialStatus = 'Escalated';
    } else if (classification.confidence >= 0.85) {
      initialStatus = 'New';
    }

    const newRecord: ClassifiedRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rawText: requestText.trim(),
      requesterName: requesterName?.trim() || 'Anonymous Colleague',
      requesterEmail: requesterEmail?.trim() || undefined,
      source: source || 'web_portal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: initialStatus,
      assignedTeam,
      ...classification,
    };

    // Store in persistence file
    const existing = getStoredRequests();
    existing.unshift(newRecord);
    saveStoredRequests(existing);

    res.status(201).json(newRecord);
  } catch (err: any) {
    console.error('Classification error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during classification.' });
  }
});

// 5. Batch Classification
app.post('/api/batch', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Array "items" is required.' });
    }

    const results: ClassifiedRequest[] = [];
    const existing = getStoredRequests();

    for (const item of items.slice(0, 10)) {
      const text = typeof item === 'string' ? item : item.text;
      const requester = typeof item === 'object' ? item.requester : 'Batch Importer';
      if (!text) continue;

      const classification = await classifyWithGemini(text);
      const record: ClassifiedRequest = {
        id: `req-batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        rawText: text,
        requesterName: requester || 'Batch System',
        source: 'batch_import',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: classification.urgency === 'Critical' ? 'Escalated' : 'New',
        assignedTeam: CATEGORIES_CONFIG[classification.category]?.dispatchQueue || 'queue.general',
        ...classification,
      };
      results.push(record);
      existing.unshift(record);
    }

    saveStoredRequests(existing);
    res.json({ processed: results.length, records: results });
  } catch (err: any) {
    console.error('Batch error:', err);
    res.status(500).json({ error: err.message || 'Batch classification failed.' });
  }
});

// 6. Update Request Status or Manual Re-categorization
app.patch('/api/requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, category, overrideReason, overriddenBy } = req.body;

  const list = getStoredRequests();
  const index = list.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Request with ID "${id}" not found.` });
  }

  const existing = list[index];

  if (status) {
    existing.status = status as RequestStatus;
  }

  if (category && category !== existing.category) {
    const validCats: DepartmentCategory[] = ['HR', 'IT', 'Finance', 'Operations'];
    if (validCats.includes(category as DepartmentCategory)) {
      existing.manualOverride = {
        originalCategory: existing.category,
        overriddenBy: overriddenBy || 'Supervisor Agent',
        reason: overrideReason || 'Manual operational reassignment',
        timestamp: new Date().toISOString(),
      };
      existing.category = category as DepartmentCategory;
      existing.assignedTeam = CATEGORIES_CONFIG[category as DepartmentCategory].dispatchQueue;
    }
  }

  existing.updatedAt = new Date().toISOString();
  list[index] = existing;
  saveStoredRequests(list);

  res.json(existing);
});

// 7. Delete Request
app.delete('/api/requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = getStoredRequests();
  const filtered = list.filter((r) => r.id !== id);

  if (filtered.length === list.length) {
    return res.status(404).json({ error: `Request with ID "${id}" not found.` });
  }

  saveStoredRequests(filtered);
  res.json({ success: true, message: `Request ${id} deleted.` });
});

// 8. Reset / Seed Sample Data
app.post('/api/requests/seed', (_req: Request, res: Response) => {
  saveStoredRequests(INITIAL_SEEDS);
  res.json({ success: true, seededCount: INITIAL_SEEDS.length, requests: INITIAL_SEEDS });
});

// 9. Clear All Stored Records
app.delete('/api/requests', (_req: Request, res: Response) => {
  saveStoredRequests([]);
  res.json({ success: true, message: 'All stored records cleared.' });
});

// 10. System Analytics & Aggregations
app.get('/api/stats', (_req: Request, res: Response) => {
  const list = getStoredRequests();

  const byCategory: Record<DepartmentCategory, number> = {
    HR: 0,
    IT: 0,
    Finance: 0,
    Operations: 0,
  };

  const byUrgency: Record<UrgencyLevel, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0,
  };

  const byStatus: Record<RequestStatus, number> = {
    New: 0,
    Triaged: 0,
    'In Progress': 0,
    Escalated: 0,
    Resolved: 0,
  };

  let totalConfidence = 0;
  let totalLatency = 0;
  let escalationCount = 0;

  for (const item of list) {
    if (byCategory[item.category] !== undefined) {
      byCategory[item.category]++;
    }
    if (byUrgency[item.urgency] !== undefined) {
      byUrgency[item.urgency]++;
    }
    if (byStatus[item.status] !== undefined) {
      byStatus[item.status]++;
    }
    totalConfidence += item.confidence || 0;
    totalLatency += item.processingTimeMs || 350;
    if (item.escalationRequired || item.urgency === 'Critical') {
      escalationCount++;
    }
  }

  const count = list.length || 1;
  const avgConfidence = list.length ? Number((totalConfidence / count).toFixed(2)) : 0;
  const avgLatencyMs = list.length ? Math.round(totalLatency / count) : 0;

  res.json({
    totalRequests: list.length,
    byCategory,
    byUrgency,
    byStatus,
    avgConfidence,
    avgLatencyMs,
    escalationCount,
    totalResponsesGenerated: list.reduce((acc, r) => acc + (r.responses?.length || 0), 0),
  });
});

// 11. Get Response Templates & Tone Specifications
app.get('/api/templates', (req: Request, res: Response) => {
  const { category } = req.query;
  let templates = RESPONSE_TEMPLATES;
  if (category && typeof category === 'string' && category !== 'ALL') {
    templates = templates.filter((t) => t.category === category);
  }
  res.json({
    templates,
    tones: TONE_CONFIGS,
    total: templates.length,
  });
});

// 12. Generate Professional Response with Tone Control & Category Templates
app.post('/api/generate-response', async (req: Request, res: Response) => {
  try {
    const {
      ticketId,
      category,
      rawText,
      requesterName,
      summary,
      urgency,
      tone = 'formal',
      templateId,
      customInstructions,
    } = req.body;

    if (!category || !rawText) {
      return res.status(400).json({ error: 'Fields "category" and "rawText" are required.' });
    }

    const validCats: DepartmentCategory[] = ['HR', 'IT', 'Finance', 'Operations'];
    const validTones: ResponseTone[] = ['formal', 'friendly', 'urgent'];

    const targetCategory = validCats.includes(category) ? category : 'IT';
    const targetTone = validTones.includes(tone) ? tone : 'formal';

    const generated = await generateResponseWithGemini({
      category: targetCategory,
      rawText,
      requesterName: requesterName || 'Colleague',
      summary,
      urgency: urgency || 'Medium',
      tone: targetTone,
      templateId,
      customInstructions,
    });

    const templateMeta = RESPONSE_TEMPLATES.find((t) => t.id === templateId) || RESPONSE_TEMPLATES.find((t) => t.category === targetCategory);

    const resultPayload: GeneratedResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticketId || 'draft',
      tone: targetTone,
      templateId: templateMeta ? templateMeta.id : 'custom',
      templateName: templateMeta ? templateMeta.name : 'Standard Resolution',
      ...generated,
      createdAt: new Date().toISOString(),
    };

    res.json(resultPayload);
  } catch (err: any) {
    console.error('Error generating response:', err);
    res.status(500).json({ error: err.message || 'Failed to generate response.' });
  }
});

// 13. Attach Response to Stored Ticket / Send Reply
app.post('/api/requests/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { response, newStatus } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Response object is required.' });
    }

    const list = getStoredRequests();
    const index = list.findIndex((r) => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: `Request with ID "${id}" not found.` });
    }

    const request = list[index];
    if (!request.responses) {
      request.responses = [];
    }

    const replyRecord: GeneratedResponse = {
      ...response,
      ticketId: id,
      createdAt: new Date().toISOString(),
    };

    request.responses.push(replyRecord);

    if (newStatus) {
      request.status = newStatus as RequestStatus;
    } else if (request.status === 'New' || request.status === 'Triaged') {
      request.status = 'In Progress';
    }

    request.updatedAt = new Date().toISOString();
    list[index] = request;
    saveStoredRequests(list);

    res.json({
      success: true,
      request,
      addedResponse: replyRecord,
    });
  } catch (err: any) {
    console.error('Error attaching reply:', err);
    res.status(500).json({ error: err.message || 'Failed to attach reply.' });
  }
});

// 14. Get Analytics & 7-Day Trend Timeline
app.get('/api/trends', (_req: Request, res: Response) => {
  const list = getStoredRequests();
  const trends = calculateTrends(list);
  res.json(trends);
});

// 15. Generate Weekly Executive Summary & Operational Insights (Customizable per Department)
app.post('/api/generate-weekly-insights', async (req: Request, res: Response) => {
  try {
    const list = getStoredRequests();
    const { department, focus, timeRange } = req.body || {};
    const options = {
      department: department as any,
      focus: focus as any,
      timeRange: timeRange as any,
    };

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeyValid = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10;

    let report;
    if (isKeyValid) {
      report = await generateAiWeeklyInsights(list, ai, options);
    } else {
      report = generateHeuristicWeeklyInsights(list, options);
    }

    res.json(report);
  } catch (err: any) {
    console.error('Error generating weekly insights:', err);
    res.status(500).json({ error: err.message || 'Failed to generate weekly insights.' });
  }
});

// Vite Middleware for Dev or Static files in Production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoTriage Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
