import { ResponseTemplate, DepartmentCategory } from '../types/classifier.ts';

export const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  // HR Category Templates
  {
    id: 'hr-benefits-enrollment',
    category: 'HR',
    name: 'Benefits & Policy Guidance',
    description: 'Clarifies health, dental, 401(k), dependent coverage, and enrollment deadlines with policy links.',
    targetScenario: 'Open enrollment inquiries, dependent health changes, retirement plan contributions.',
    recommendedTone: 'friendly',
    keyPoints: [
      'Acknowledge the specific benefits inquiry and congratulate/validate context',
      'Provide concrete documentation required (e.g. proof of qualifying life event)',
      'Confirm the deadline and outline step-by-step enrollment portal instructions',
      'Provide HR People Operations contact for confidential follow-up'
    ],
    defaultSignOff: 'Warm regards,\nPeople Operations & Benefits Team'
  },
  {
    id: 'hr-leave-confirmation',
    category: 'HR',
    name: 'Leave Request Acknowledgment',
    description: 'Confirms receipt of parental, medical, or extended PTO leave with pay and accrual status.',
    targetScenario: 'Parental leave, medical leave, sabbatical, or bereavement leave requests.',
    recommendedTone: 'friendly',
    keyPoints: [
      'Express support for the personal leave event',
      'Confirm receipt of preliminary dates and initiate leave coordinator review',
      'Detail PTO accrual, salary continuation, and benefits status during absence',
      'Outline return-to-work timeline and point of contact'
    ],
    defaultSignOff: 'Wishing you all the best,\nGlobal People Experience Team'
  },
  {
    id: 'hr-payroll-update',
    category: 'HR',
    name: 'Payroll & Direct Deposit Notice',
    description: 'Secure confirmation of banking details, tax withholding updates, and pay cycle timing.',
    targetScenario: 'Direct deposit routing changes, W-4 tax withholding updates, payroll discrepancies.',
    recommendedTone: 'formal',
    keyPoints: [
      'Confirm receipt without revealing full banking numbers in clear text',
      'Specify the exact payroll cycle cutoff date when the change takes effect',
      'Remind employee to keep existing account active until initial $0 pre-note clears',
      'Reiterate security compliance and MFA verification requirement'
    ],
    defaultSignOff: 'Sincerely,\nCorporate Payroll & Compensation Department'
  },

  // IT Category Templates
  {
    id: 'it-hardware-dispatch',
    category: 'IT',
    name: 'Urgent Hardware Replacement Dispatch',
    description: 'Immediate replacement device courier for swollen batteries, broken machines, or failed peripherals.',
    targetScenario: 'Battery swelling, broken screen, kernel panic reboot loops, loaner laptop needs.',
    recommendedTone: 'urgent',
    keyPoints: [
      'Acknowledge hardware safety risk and immediate work disruption',
      'Provide device courier tracking number or IT Helpdesk pickup locker combination',
      'Instructions for safe handling and hazardous battery isolation if applicable',
      'One-click data backup and cloud identity restoration steps'
    ],
    defaultSignOff: 'Rapid Response Team,\nGlobal IT Infrastructure & End-User Services'
  },
  {
    id: 'it-vpn-access-troubleshoot',
    category: 'IT',
    name: 'VPN & Identity Access Resolution',
    description: 'Step-by-step diagnostic for credential resets, Okta MFA desynchronization, and remote VPN.',
    targetScenario: 'Remote VPN disconnects, password expiration, Okta Verify desync, 2FA lockout.',
    recommendedTone: 'formal',
    keyPoints: [
      'Confirm account status and identity verification protocol',
      'Provide temporary secure bypass code or instructions to re-sync MFA token',
      'List verified corporate VPN gateway endpoints by geographic region',
      'Direct link to IT service portal diagnostics'
    ],
    defaultSignOff: 'Regards,\nInformation Security & Access Management'
  },
  {
    id: 'it-software-provisioning',
    category: 'IT',
    name: 'SaaS License & Tool Provisioning',
    description: 'Confirms allocation of developer licenses, cloud permissions, or SaaS workspace access.',
    targetScenario: 'GitHub Copilot, Figma, AWS IAM, Datadog, JetBrains, or Slack enterprise licenses.',
    recommendedTone: 'friendly',
    keyPoints: [
      'Confirm managerial approval and seat license assignment',
      'Provide SSO login instructions and activation URL',
      'Include department best-practice usage guide and security guardrails',
      'Provide license renewal and seat reclamation policy'
    ],
    defaultSignOff: 'Best,\nIT SaaS Procurement & Developer Experience'
  },

  // Finance Category Templates
  {
    id: 'fin-invoice-wire-release',
    category: 'Finance',
    name: 'Vendor Invoice & Disbursement Schedule',
    description: 'Formal statement of invoice audit status, ACH/wire release date, and remittance receipt.',
    targetScenario: 'Overdue vendor invoices, urgent ACH payments, billing discrepancies, payment verification.',
    recommendedTone: 'formal',
    keyPoints: [
      'Reference specific invoice number, dollar amount, and vendor entity',
      'State verified payment approval status and scheduled ACH clearing date',
      'Provide Treasury remittance confirmation reference number',
      'Clarify standard Net-30/Net-60 terms and accounts payable contact'
    ],
    defaultSignOff: 'Respectfully,\nAccounts Payable & Corporate Treasury'
  },
  {
    id: 'fin-expense-audit-clear',
    category: 'Finance',
    name: 'Expense Audit & Reimbursement Approval',
    description: 'Detailed review of submitted travel or corporate expenses with exchange rates and receipts.',
    targetScenario: 'Expensify reports, travel meal per diem, international currency exchange, client entertainment.',
    recommendedTone: 'friendly',
    keyPoints: [
      'Confirm receipt of expense report and itemized receipt audit',
      'Explain applied per diem guidelines and currency spot rate reconciliation',
      'Confirm direct deposit reimbursement processing window (next payroll run)',
      'Remind submitter of corporate travel policy reminders'
    ],
    defaultSignOff: 'Kind regards,\nCorporate Expense & Travel Compliance'
  },
  {
    id: 'fin-po-budget-approval',
    category: 'Finance',
    name: 'PO Clearance & Budget Allocation',
    description: 'Expedited authorization of purchase orders, departmental budget approvals, and credit line increases.',
    targetScenario: 'Capital expenditure requests, vendor PO approvals, corporate card limit adjustments.',
    recommendedTone: 'urgent',
    keyPoints: [
      'Confirm approved Purchase Order number and cost-center code',
      'State effective spending authorization window and approved monetary ceiling',
      'Specify invoicing instructions for the external vendor',
      'Detail required post-purchase deliverables and receipt submission cutoff'
    ],
    defaultSignOff: 'Sincerely,\nFinancial Planning & Strategic Procurement'
  },

  // Operations Category Templates
  {
    id: 'ops-hvac-facilities-fix',
    category: 'Operations',
    name: 'Facilities & Environmental Climate Dispatch',
    description: 'Immediate engineering deployment for temperature extremes, leaks, electrical, or lighting faults.',
    targetScenario: 'HVAC failures, temperature spikes, water leaks, lighting outages, elevator maintenance.',
    recommendedTone: 'urgent',
    keyPoints: [
      'Acknowledge building zone, floor, and impact on team comfort',
      'Confirm building facilities engineer dispatched on-site with estimated arrival time',
      'Provide safety or temporary relocation recommendations if applicable',
      'Commit to a follow-up status notification once thermostat/HVAC is recalibrated'
    ],
    defaultSignOff: 'Workplace Operations Emergency Desk,\nBuilding Facilities & Environmental Safety'
  },
  {
    id: 'ops-badge-access-recovery',
    category: 'Operations',
    name: 'Physical Badge & Turnstile Access Recovery',
    description: 'Restores building RFID entry, visitor badges, or secure server room physical credentials.',
    targetScenario: 'Badge reader failure, RFID card demagnetized, lost badge replacement, visitor pass.',
    recommendedTone: 'urgent',
    keyPoints: [
      'Acknowledge security turnstile failure and employee queue disruption',
      'Issue immediate temporary digital visitor QR pass via mobile or reception desk',
      'Dispatch physical security technician to reset reader controller',
      'Provide instructions for replacement badge issuance at building security office'
    ],
    defaultSignOff: 'Corporate Physical Security & Workplace Access Control'
  },
  {
    id: 'ops-workstation-ergonomics',
    category: 'Operations',
    name: 'Office Ergonomics & Supply Fulfillment',
    description: 'Fulfills ergonomic chairs, motorized standing desk adjustments, and specialized office equipment.',
    targetScenario: 'Standing desk motor failure, ergonomic chair requests, monitor arm installation.',
    recommendedTone: 'friendly',
    keyPoints: [
      'Acknowledge ergonomic discomfort and prioritize workplace well-being',
      'Schedule on-site technician appointment for desk motor diagnostic or chair delivery',
      'Provide self-service ergonomics adjustment guide PDF',
      'Confirm ticket tracking number and feedback loop'
    ],
    defaultSignOff: 'Warmly,\nWorkplace Experience & Ergonomics Team'
  }
];

export const TONE_CONFIGS = {
  formal: {
    id: 'formal',
    name: 'Formal & Professional',
    description: 'Authoritative, compliant, precise corporate etiquette suitable for executives, vendors, and audit matters.',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    promptGuideline: 'Use formal corporate tone. Employ precise vocabulary, professional courtesy, unambiguous commitments, compliance references, and complete absence of slang or overly casual idioms.'
  },
  friendly: {
    id: 'friendly',
    name: 'Friendly & Empathetic',
    description: 'Warm, approachable, conversational, and supportive — perfect for employee onboarding, HR, and culture.',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    promptGuideline: 'Use a warm, friendly, empathetic, and reassuring tone. Be supportive, clear, collaborative, and encouraging while maintaining professional boundaries.'
  },
  urgent: {
    id: 'urgent',
    name: 'Urgent & Action-Oriented',
    description: 'Direct, rapid, bulleted next-steps emphasizing expedited timelines, incident escalation, and safety.',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    promptGuideline: 'Use a crisp, urgent, high-priority, action-oriented tone. Highlight immediate mitigation actions, exact timestamps, clear escalation contacts, and expedited SLA turnarounds.'
  }
};
