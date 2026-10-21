import { SystemArchitectureNode } from '../types/classifier.ts';

export const SYSTEM_ARCHITECTURE_LAYERS: SystemArchitectureNode[] = [
  {
    id: 'layer-ingestion',
    title: '1. Request Ingestion Gateway',
    layer: 'Ingestion',
    icon: 'Radio',
    shortDesc: 'Multi-channel entry point accepting inbound requests from Web UI, Slack bot, REST API, or email webhooks.',
    status: 'active',
    metrics: { label: 'Supported Protocols', value: 'REST / SSE / Webhook' },
    spec: {
      protocol: 'HTTPS REST (POST /api/requests) & Batch Gateway',
      latencyTarget: '< 25ms',
      schemaSummary: '{ text: string, requester: string, source: "web_portal" | "rest_api" | "email_webhook" }',
      responsibilities: [
        'Authenticate API token / session identity',
        'Payload size verification and rate limiting (60 req/min)',
        'Assign immutable Request UUID (v4) and ISO-8601 ingestion timestamp',
        'Emit ingestion metric event to observability pipeline'
      ]
    }
  },
  {
    id: 'layer-preprocessing',
    title: '2. Pre-processing & Sanitization',
    layer: 'Pre-processing',
    icon: 'ShieldCheck',
    shortDesc: 'Strips sensitive PII, normalizes Unicode, strips malicious HTML/scripts, and prepares prompt embeddings.',
    status: 'active',
    metrics: { label: 'Sanitization Pipeline', value: 'PII Redact + HTML Clean' },
    spec: {
      protocol: 'In-Memory Stream Transform',
      latencyTarget: '< 10ms',
      schemaSummary: '{ sanitizedText: string, piiDetected: boolean, length: number }',
      responsibilities: [
        'Mask sensitive credit card numbers, SSNs, or API secrets with [REDACTED]',
        'Trim whitespace and sanitize against XSS and control characters',
        'Extract high-priority heuristics (e.g., words like "urgent", "security alert", "leak")',
        'Construct prompt payload with strict department taxonomy definitions'
      ]
    }
  },
  {
    id: 'layer-ai-core',
    title: '3. Gemini 3.8 Flash Classifier Core',
    layer: 'AI Core',
    icon: 'Cpu',
    shortDesc: 'Executes zero-shot enterprise classification with structured JSON schema output and reasoning analysis.',
    status: 'active',
    metrics: { label: 'Foundation Model', value: 'gemini-3.8-flash' },
    spec: {
      protocol: 'Server-side Google Gen AI TypeScript SDK (Type.OBJECT responseSchema)',
      latencyTarget: '400ms - 900ms',
      schemaSummary: 'Strict JSON { category, confidence, subCategory, urgency, summary, reasoning, suggestedAction, tags }',
      responsibilities: [
        'Classify request into exactly one of: HR, IT, Finance, Operations',
        'Calculate continuous confidence score [0.00 - 1.00]',
        'Extract contextual urgency (Low, Medium, High, Critical) based on business impact',
        'Synthesize executive 1-sentence summary and concrete operational reasoning',
        'Recommend automated next workflow action and expected resolution SLA'
      ]
    }
  },
  {
    id: 'layer-validation',
    title: '4. Decision Rules & Failover Router',
    layer: 'Validation & Routing',
    icon: 'GitMerge',
    shortDesc: 'Validates AI confidence thresholds (> 0.70 auto-route, ≤ 0.70 flag for human triage), ensures SLA compliance.',
    status: 'active',
    metrics: { label: 'Confidence Threshold', value: '0.70 auto-dispatch' },
    spec: {
      protocol: 'Deterministic Rule Engine',
      latencyTarget: '< 5ms',
      schemaSummary: '{ validated: boolean, routeTarget: string, autoAssigned: boolean }',
      responsibilities: [
        'Validate JSON schema integrity against DepartmentCategory enum',
        'Enforce fallback if confidence < 0.70: assign "Triaged" status for human supervisor review',
        'Trigger P1 Emergency alert webhook if Urgency === "Critical"',
        'Attach target queue destination (e.g., queue.infra.support, queue.finance.ledger)'
      ]
    }
  },
  {
    id: 'layer-storage-sinks',
    title: '5. Storage Engine & Department Sinks',
    layer: 'Storage & Sinks',
    icon: 'Database',
    shortDesc: 'Persists classified records with indexed querying, audit history, manual overrides, and downstream dispatch.',
    status: 'active',
    metrics: { label: 'Persistence Store', value: 'File/In-Memory JSON DB' },
    spec: {
      protocol: 'ACID-like JSON Store with REST API (CRUD + Metrics)',
      latencyTarget: '< 15ms',
      schemaSummary: 'Indexed on [category, urgency, status, createdAt, confidence]',
      responsibilities: [
        'Persist classified request records with full metadata and reasoning trail',
        'Dispatch payload to respective department queues (HR, IT, Finance, Operations)',
        'Track status changes (New -> Triaged -> In Progress -> Resolved)',
        'Support manual override with audit timestamps and human review notes',
        'Expose analytics aggregations for department load and turnaround times'
      ]
    }
  }
];

export const SYSTEM_DATA_FLOW = [
  { step: 1, title: 'Inbound Request', from: 'User / Channel', to: 'Ingestion API', desc: 'Raw text message received with author metadata' },
  { step: 2, title: 'Sanitization', from: 'Ingestion API', to: 'Sanitizer', desc: 'PII scrubbed, control chars removed' },
  { step: 3, title: 'Inference', from: 'Sanitizer', to: 'Gemini 3.8 Flash', desc: 'Structured zero-shot department taxonomy classification' },
  { step: 4, title: 'Verification', from: 'Gemini 3.8 Flash', to: 'Rule Engine', desc: 'Confidence validation & urgency escalation checks' },
  { step: 5, title: 'Persistence', from: 'Rule Engine', to: 'Store & Sinks', desc: 'Saved to records and routed to HR, IT, Finance, or Ops' }
];
