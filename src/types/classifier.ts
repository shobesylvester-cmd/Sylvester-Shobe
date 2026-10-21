export type DepartmentCategory = 'HR' | 'IT' | 'Finance' | 'Operations';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type RequestStatus = 'New' | 'Triaged' | 'In Progress' | 'Escalated' | 'Resolved';

export type ResponseTone = 'formal' | 'friendly' | 'urgent';

export interface ResponseTemplate {
  id: string;
  category: DepartmentCategory;
  name: string;
  description: string;
  targetScenario: string;
  recommendedTone: ResponseTone;
  keyPoints: string[];
  defaultSignOff: string;
}

export interface GeneratedResponse {
  id: string;
  ticketId: string;
  tone: ResponseTone;
  templateId: string;
  templateName: string;
  subject: string;
  greeting: string;
  body: string;
  keyNextSteps: string[];
  slaCommitment: string;
  signOff: string;
  createdAt: string;
  engine: 'gemini-3.8-flash' | 'heuristic-generator';
}

export interface ClassificationResult {
  category: DepartmentCategory;
  confidence: number; // 0.0 to 1.0
  subCategory: string;
  urgency: UrgencyLevel;
  summary: string;
  reasoning: string;
  keyEntities: string[];
  suggestedAction: string;
  estimatedResolutionTime: string;
  escalationRequired: boolean;
  classificationEngine: 'gemini-3.8-flash' | 'heuristic-fallback';
}

export interface ClassifiedRequest extends ClassificationResult {
  id: string;
  rawText: string;
  requesterName: string;
  requesterEmail?: string;
  source: 'web_portal' | 'rest_api' | 'email_webhook' | 'batch_import';
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  assignedTeam: string;
  manualOverride?: {
    originalCategory: DepartmentCategory;
    overriddenBy: string;
    reason: string;
    timestamp: string;
  };
  processingTimeMs: number;
  responses?: GeneratedResponse[];
  actualResolutionHours?: number; // Time elapsed to resolution
  slaTargetHours?: number; // Target SLA in hours (e.g. 4 for IT, 24 for HR)
  slaMet?: boolean; // Whether resolved within target SLA
  resolvedAt?: string;
  firstResponseTimeMinutes?: number;
}

export interface TrendDataPoint {
  date: string;
  dayName: string;
  total: number;
  HR: number;
  IT: number;
  Finance: number;
  Operations: number;
  avgResolutionHours: number;
}

export type ReportFocusMode = 'executive' | 'operations' | 'bottlenecks' | 'capacity';

export interface WeeklyInsightsReport {
  weekPeriod: string;
  generatedAt: string;
  executiveSummary: string;
  totalVolume: number;
  slaAdherenceRate: number;
  meanResolutionHours: number;
  keyHighlights: string[];
  departmentPerformance: {
    category: DepartmentCategory;
    volume: number;
    avgResolutionHours: number;
    targetSLA: string;
    slaAdherenceRate: number;
    healthStatus: 'Excellent' | 'Good' | 'Attention Required';
    summary: string;
  }[];
  criticalBottlenecks: string[];
  strategicRecommendations: string[];
  projectedForecast: string;
  modelEngine: string;
  targetDepartment?: DepartmentCategory | 'ALL';
  reportFocus?: ReportFocusMode;
  departmentMeta?: {
    name: string;
    primaryLead: string;
    dispatchQueue: string;
    defaultSLA: string;
    subCategories: string[];
  };
  subCategoryBreakdown?: {
    name: string;
    count: number;
    percentage: number;
  }[];
  urgencyDistribution?: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
  recentSampleTickets?: {
    id: string;
    summary: string;
    urgency: UrgencyLevel;
    status: RequestStatus;
    requesterName: string;
    resolutionTime?: string;
  }[];
}

export interface CategorySpec {
  id: DepartmentCategory;
  name: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  lightBg: string;
  accentColor: string;
  iconName: string;
  description: string;
  subCategories: string[];
  sampleTriggers: string[];
  defaultSLA: string;
  primaryLead: string;
  dispatchQueue: string;
  keywords: string[];
}

export interface SystemArchitectureNode {
  id: string;
  title: string;
  layer: 'Ingestion' | 'Pre-processing' | 'AI Core' | 'Validation & Routing' | 'Storage & Sinks';
  icon: string;
  shortDesc: string;
  status: 'active' | 'standby' | 'ready';
  metrics?: { label: string; value: string };
  spec: {
    protocol: string;
    latencyTarget: string;
    schemaSummary: string;
    responsibilities: string[];
  };
}

export interface SystemStats {
  totalRequests: number;
  byCategory: Record<DepartmentCategory, number>;
  byUrgency: Record<UrgencyLevel, number>;
  byStatus: Record<RequestStatus, number>;
  avgConfidence: number;
  avgLatencyMs: number;
  escalationCount: number;
  totalResponsesGenerated?: number;
}
