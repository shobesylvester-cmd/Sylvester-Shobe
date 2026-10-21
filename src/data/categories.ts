import { CategorySpec, DepartmentCategory } from '../types/classifier.ts';

export const CATEGORIES_CONFIG: Record<DepartmentCategory, CategorySpec> = {
  HR: {
    id: 'HR',
    name: 'Human Resources',
    badgeColor: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    borderColor: 'border-rose-400 dark:border-rose-600',
    bgColor: 'bg-rose-500',
    lightBg: 'bg-rose-50 dark:bg-rose-950/20',
    accentColor: '#f43f5e',
    iconName: 'Users',
    description: 'Manages employee lifecycle, compensation, benefits, workplace relations, time-off, and organizational development.',
    subCategories: [
      'Payroll & Direct Deposit',
      'Benefits & Health Insurance',
      'Leave & PTO Requests',
      'Workplace Relations & HRBP',
      'Onboarding / Offboarding',
      'Performance & Compensation Reviews',
      'Training & Certifications'
    ],
    sampleTriggers: [
      'I need to update my direct deposit routing number for next payroll cycle.',
      'How do I add my newborn dependent to company medical insurance coverage?',
      'Requesting 3 weeks parental leave starting in November.',
      'Question regarding the 401(k) company employer match percentage.'
    ],
    defaultSLA: '24 Hours',
    primaryLead: 'Sarah Lin (VP People Operations)',
    dispatchQueue: 'queue.people.general',
    keywords: [
      'payroll', 'salary', 'benefits', 'insurance', 'health', '401k', 'pto', 'vacation',
      'sick leave', 'maternity', 'paternity', 'hiring', 'onboarding', 'offboarding',
      'hrbp', 'compensation', 'bonus', 'direct deposit', 'w-2', 'contract', 'resignation'
    ]
  },
  IT: {
    id: 'IT',
    name: 'Information Technology',
    badgeColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    borderColor: 'border-indigo-400 dark:border-indigo-600',
    bgColor: 'bg-indigo-500',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/20',
    accentColor: '#6366f1',
    iconName: 'Laptop',
    description: 'Oversees infrastructure, developer tooling, hardware procurement, network security, software licenses, and access control.',
    subCategories: [
      'Hardware & Peripherals',
      'VPN & Network Access',
      'Software Licenses & SaaS Provisioning',
      'Account Security & MFA/SSO',
      'System Outages & Incident Ops',
      'Cloud & Infrastructure Permissions',
      'Bug Reports & Dev Environment'
    ],
    sampleTriggers: [
      'MacBook battery swelling and trackpad is unresponsive, need urgent replacement.',
      'Unable to connect to internal staging VPN from London remote office.',
      'Need GitHub enterprise copilot license provisioned for the front-end team.',
      'Suspicious phishing email received with an unusual invoice attachment.'
    ],
    defaultSLA: '4 Hours (1hr for P1)',
    primaryLead: 'Marcus Vance (Director of IT & SecOps)',
    dispatchQueue: 'queue.infra.support',
    keywords: [
      'laptop', 'macbook', 'monitor', 'vpn', 'wifi', 'network', 'password', 'mfa', 'sso',
      'okta', 'github', 'aws', 'docker', 'license', 'phishing', 'security', 'firewall',
      'hardware', 'software', 'crash', 'keyboard', 'printer', 'access token'
    ]
  },
  Finance: {
    id: 'Finance',
    name: 'Finance & Accounting',
    badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    borderColor: 'border-emerald-400 dark:border-emerald-600',
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/20',
    accentColor: '#10b981',
    iconName: 'DollarSign',
    description: 'Handles accounts payable/receivable, corporate spend, expense reimbursements, purchase orders, budgeting, and tax compliance.',
    subCategories: [
      'Expense Reimbursements',
      'Vendor Invoices & AP',
      'Purchase Orders (PO) & Approvals',
      'Corporate Credit Cards & Limits',
      'Budget Allocations & Forecasting',
      'Client Invoicing & AR',
      'Tax & Audit Compliance'
    ],
    sampleTriggers: [
      'Expensify report #9948 submitted for Q3 AWS Summit travel expenses.',
      'Vendor Datadog invoice #8291 overdue by 14 days, please expedite ACH release.',
      'Need temporary $15,000 corporate card limit increase for booth rental.',
      'W-9 form request from external enterprise client before contract signing.'
    ],
    defaultSLA: '48 Hours',
    primaryLead: 'Elena Rostova (Head of Corporate Accounting)',
    dispatchQueue: 'queue.finance.ledger',
    keywords: [
      'invoice', 'expense', 'reimbursement', 'receipt', 'vendor', 'payment', 'ach', 'wire',
      'purchase order', 'po', 'budget', 'corporate card', 'tax', 'w9', '1099', 'audit',
      'depreciation', 'billing', 'accounts payable', 'ap', 'ar', 'expensify'
    ]
  },
  Operations: {
    id: 'Operations',
    name: 'Operations & Facilities',
    badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    borderColor: 'border-amber-400 dark:border-amber-600',
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-50 dark:bg-amber-950/20',
    accentColor: '#f59e0b',
    iconName: 'Briefcase',
    description: 'Maintains physical workplace facilities, supply logistics, office safety, inventory control, shipping/receiving, and security badges.',
    subCategories: [
      'Facilities Maintenance & HVAC',
      'Office Supply & Inventory',
      'Physical Security & Badge Access',
      'Shipping, Mail & Logistics',
      'Catering & Event Coordination',
      'Health, Safety & Ergonomics',
      'Vendor Onsite Access'
    ],
    sampleTriggers: [
      'Conference Room 4B projector is flickering and AC is set to 80 degrees.',
      'Physical security badge not unlocking 3rd floor server room turnstiles.',
      'Package with sensitive prototype components delivered to reception, needs pickup.',
      'Ergonomic standing desk motor jammed in lowest position.'
    ],
    defaultSLA: '8 Hours',
    primaryLead: 'David O\'Connor (VP Global Workplace & Operations)',
    dispatchQueue: 'queue.ops.workplace',
    keywords: [
      'facilities', 'office', 'building', 'hvac', 'temperature', 'desk', 'chair',
      'badge', 'access card', 'security gate', 'shipping', 'fedex', 'ups', 'mail',
      'cleaning', 'janitorial', 'parking', 'catering', 'ergonomic', 'leak', 'light'
    ]
  }
};

export const CATEGORY_LIST = Object.values(CATEGORIES_CONFIG);
