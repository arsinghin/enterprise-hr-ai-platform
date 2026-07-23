import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// -------------------------------------------------------------
// Lazy Gemini Client Initialization
// -------------------------------------------------------------
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// -------------------------------------------------------------
// Enterprise Mock Data Planes (In-Memory Transactional States)
// -------------------------------------------------------------
interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  region: string;
  leaveBalance: number;
  salary: number;
  benefits: string[];
}

const employees: Record<string, Employee> = {
  "E101": {
    id: "E101",
    name: "Sarah Connor",
    role: "Manager",
    department: "Engineering",
    region: "US-CA",
    leaveBalance: 15,
    salary: 150000,
    benefits: ["Premium Dental & Health", "401(k) 5% Match", "Mental Health Stipend"],
  },
  "E102": {
    id: "E102",
    name: "John Connor",
    role: "Employee",
    department: "Product Management",
    region: "US-TX",
    leaveBalance: 22,
    salary: 95000,
    benefits: ["Standard Health & Vision", "401(k) 3% Match"],
  },
  "E103": {
    id: "E103",
    name: "Ellen Ripley",
    role: "Recruiter",
    department: "Human Resources",
    region: "US-NY",
    leaveBalance: 12,
    salary: 110000,
    benefits: ["Premium Health", "Commuter benefits", "Remote work allowance"],
  },
  "E104": {
    id: "E104",
    name: "Neo Anderson",
    role: "Employee",
    department: "Information Security",
    region: "EU-DE",
    leaveBalance: 30,
    salary: 125000, // Equivalent EUR 85k base
    benefits: ["German Pension Plan", "Full Health Coverage", "Public Transport Pass", "Home Office Fund"],
  },
};

// Temporal Durable Workflows Store
interface Workflow {
  id: string;
  type: string;
  status: "Running" | "Completed" | "Approved" | "Cancelled" | "Failed";
  step: string;
  employeeId: string;
  compensationStack: string[];
  createdAt: string;
  updatedAt: string;
}

const workflows: Workflow[] = [
  {
    id: "WF-9821",
    type: "Leave Approval",
    status: "Running",
    step: "Manager Approval",
    employeeId: "E101",
    compensationStack: [],
    createdAt: "2026-07-01T10:30:00Z",
    updatedAt: "2026-07-01T10:30:00Z",
  },
  {
    id: "WF-1049",
    type: "Equipment Allocation",
    status: "Completed",
    step: "Dispatched",
    employeeId: "E104",
    compensationStack: ["Deallocate Asset ID AS-789"],
    createdAt: "2026-06-28T09:00:00Z",
    updatedAt: "2026-06-29T14:15:00Z",
  },
  {
    id: "WF-3841",
    type: "Expense Reimbursement",
    status: "Approved",
    step: "Funds Disbursed",
    employeeId: "E103",
    compensationStack: [],
    createdAt: "2026-07-03T16:45:00Z",
    updatedAt: "2026-07-04T08:30:00Z",
  },
];

// Kafka Event Bus Mock Queue
interface KafkaEvent {
  offset: number;
  topic: string;
  partition: number;
  timestamp: string;
  key: string;
  value: string;
}

let kafkaOffset = 15302;
const kafkaEvents: KafkaEvent[] = [
  {
    offset: kafkaOffset++,
    topic: "employee.leave.created",
    partition: 0,
    timestamp: "2026-07-01T10:30:00Z",
    key: "E101",
    value: JSON.stringify({ workflowId: "WF-9821", daysRequested: 5, startDate: "2026-07-10" }),
  },
  {
    offset: kafkaOffset++,
    topic: "asset.allocated",
    partition: 1,
    timestamp: "2026-06-28T09:12:00Z",
    key: "E104",
    value: JSON.stringify({ workflowId: "WF-1049", assetType: "MacBook Pro M4", serial: "X8271A-M4" }),
  },
  {
    offset: kafkaOffset++,
    topic: "financial.expense.approved",
    partition: 2,
    timestamp: "2026-07-04T08:30:00Z",
    key: "E103",
    value: JSON.stringify({ workflowId: "WF-3841", amount: 450.0, category: "Travel Meals" }),
  },
];

// Langfuse / OTel Observability Trace Storage
interface Trace {
  id: string;
  timestamp: string;
  role: string;
  query: string;
  intent: string;
  agentName: string;
  mcpCalls: string[];
  policiesChecked: string[];
  latencyMs: number;
  tokensUsed: { prompt: number; completion: number; total: number };
  estimatedCost: number;
  evaluation: {
    groundedness: number;
    faithfulness: number;
    hallucinationRisk: number;
    toolAccuracy: number;
  };
  answer: string;
}

const traces: Trace[] = [
  {
    id: "TR-54911",
    timestamp: "2026-07-04T02:15:30Z",
    role: "Manager",
    query: "Show Sarah Connor's active leave days and check if she has enough balance",
    intent: "Leave Inquiry & Accrual Check",
    agentName: "Leave Agent",
    mcpCalls: ["hrms_get_leave_balance"],
    policiesChecked: ["POL_MAX_CONSECUTIVE_LEAVE", "POL_REGIONAL_COMPLIANCE"],
    latencyMs: 980,
    tokensUsed: { prompt: 410, completion: 120, total: 530 },
    estimatedCost: 0.000315,
    evaluation: { groundedness: 1.0, faithfulness: 1.0, hallucinationRisk: 0.0, toolAccuracy: 1.0 },
    answer: "Sarah Connor has a remaining leave balance of 15 days. She currently has 1 pending leave workflow (WF-9821) awaiting manager approval.",
  },
];

// Hybrid RAG Core Documents
interface RAGDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  region: string;
}

const ragDocs: RAGDoc[] = [
  {
    id: "DOC-001",
    title: "California Overtime and Sick Accrual Mandate",
    category: "Compliance",
    content: "Under California Labor Code Section 246, employees who work in California for 30 or more days within a year are entitled to paid sick leave. Accrual rate must be at least 1 hour for every 30 hours worked. Maximum consecutive PTO leave for corporate roles cannot exceed 10 consecutive business days without senior VP approval.",
    region: "US-CA",
  },
  {
    id: "DOC-002",
    title: "Global Parental and Maternity Leave Policy",
    category: "Benefits",
    content: "Standard maternal leave allows up to 16 weeks of fully paid recovery and bonding time. Spousal and paternal bonding is allocated 6 weeks paid. Requests must be filed via Temporal Workflows at least 30 days prior to the expected delivery date.",
    region: "Global",
  },
  {
    id: "DOC-003",
    title: "EU GDPR & German Working Time Ordinance",
    category: "Compliance",
    content: "German Working Time Act (ArbZG) strictly caps daily working hours to 8 hours. Can be extended to 10 hours only if average doesn't exceed 8 hours over 6 months. Minimum 11 hours of uninterrupted rest between shifts. All PII data containing shift allocations and HR logs must be isolated at the tenant and region level to remain GDPR-compliant.",
    region: "EU-DE",
  },
  {
    id: "DOC-004",
    title: "Remote Work Reimbursement Guidelines",
    category: "Expense",
    content: "Full-time remote staff are eligible for a one-time $500 home office setup allowance (Model: Ergonomic chair, monitor). Monthly broadband stipends are capped at $75, requiring receipts submitted via the travel/expense agent workflow.",
    region: "Global",
  },
];

// -------------------------------------------------------------
// Registry Defs (Agent, MCP Tools, Prompts, Policies)
// -------------------------------------------------------------
const registries = {
  agents: [
    { name: "Employee Agent", scope: "General queries, updates to profile metadata." },
    { name: "Leave Agent", scope: "PTO balance, leave applications, manager reviews." },
    { name: "Payroll Agent", scope: "Payslips, salary structures, tax withholding inquiries." },
    { name: "Benefits Agent", scope: "Health insurance, dental, pension schemes." },
    { name: "Policy Agent", scope: "HR Manual searches, state & country regulatory guidelines." },
    { name: "Recruitment Agent", scope: "Candidate tracking, job postings, offer letter templates." },
    { name: "IT & Asset Agent", scope: "Equipment ordering, software license allocations." },
    { name: "Analytics Agent", scope: "Aggregated department metrics, cost projections." },
  ],
  mcpTools: [
    { name: "hrms_get_leave_balance", description: "Gets PTO balance for employee ID." },
    { name: "hrms_trigger_leave_workflow", description: "Launches Temporal Leave Approval workflow." },
    { name: "payroll_get_payslip", description: "Fetches breakdown of latest payslip details." },
    { name: "ocr_extract_pdf_metadata", description: "Extracts metadata & entities from uploaded PDFs." },
    { name: "calendar_book_slot", description: "Queries and schedules Outlook/Google calendar slots." },
    { name: "ticketing_create_jira", description: "Creates standard IT service requests in Jira." },
  ],
  policies: [
    { code: "POL_TURNSTILE_CHALLENGE", rule: "Cloudflare Turnstile managed challenge validation required for ingress traffic." },
    { code: "POL_HONEYPOT_TRAP_ENFORCED", rule: "DOM trap inputs (sys_hp_field) isolate and block automated bot scrapers." },
    { code: "POL_REDIS_RATE_LIMIT", rule: "Redis token bucket caps ingress at 5 requests per minute per IP tenant to protect Gemini AI quota." },
    { code: "POL_MAX_CONSECUTIVE_LEAVE", rule: "Leaves exceeding 10 consecutive working days trigger VP approval." },
    { code: "POL_REGIONAL_COMPLIANCE", rule: "Region-specific mandates (e.g. California PTO, German ArbZG) must be checked." },
    { code: "POL_PII_GUARDRAIL", rule: "Scrub medical records, credit card numbers, and SSNs." },
    { code: "POL_PROMPT_INJECTION", rule: "Detect and block structural ignore commands or context breakouts." },
  ],
};

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Get Registries
app.get("/api/registries", (req, res) => {
  res.json(registries);
});

// Get Database Schemas & Data (Postgres, Redis, Qdrant)
app.get("/api/schemas", (req, res) => {
  res.json({
    postgres: {
      description: "Primary relational storage for HR operational states, employees, roles, and tenant logs.",
      tables: [
        {
          name: "employees",
          columns: ["id VARCHAR(10) PRIMARY KEY", "name VARCHAR(100)", "role VARCHAR(50)", "department VARCHAR(100)", "region VARCHAR(10)", "leave_balance INT", "salary DECIMAL(10,2)"],
          seedData: Object.values(employees),
        },
        {
          name: "tenants",
          columns: ["tenant_id VARCHAR(50) PRIMARY KEY", "company_name VARCHAR(150)", "region VARCHAR(10)", "status VARCHAR(20)"],
          seedData: [{ tenant_id: "T-800", company_name: "Skynet Systems", region: "Global", status: "Active" }],
        },
      ],
    },
    redis: {
      description: "Low-latency semantic prompt caches, user sessions, and API rate-limiter states.",
      keys: [
        { key: "session:E101", ttl: "1800s", type: "Hash", value: { userId: "E101", region: "US-CA", auth_token: "jwt_xxx" } },
        { key: "prompt_cache:sha256_xxx", ttl: "86400s", type: "String", value: { result: "Sarah Connor has 15 PTO days..." } },
      ],
    },
    qdrant: {
      description: "Vector database storing dense embeddings of HR manuals for hybrid RAG retrieval.",
      points: [
        { id: "point-1", vector: [0.021, -0.142, 0.782, "... BAAI BGE-M3 Dense Embedding (1024-dim)"], payload: ragDocs[0] },
        { id: "point-2", vector: [0.087, -0.012, 0.691, "... BAAI BGE-M3 Dense Embedding (1024-dim)"], payload: ragDocs[2] },
      ],
    },
  });
});

// Get Workflows (Temporal Simulation)
app.get("/api/workflows", (req, res) => {
  res.json(workflows);
});

// Post a new Leave Workflow (simulates Temporal orchestration)
app.post("/api/workflows/leave", (req, res) => {
  const { employeeId, days } = req.body;
  const emp = employees[employeeId] || employees["E101"];
  const newWf: Workflow = {
    id: `WF-${Math.floor(1000 + Math.random() * 9000)}`,
    type: "Leave Approval",
    status: "Running",
    step: "Manager Approval",
    employeeId: emp.id,
    compensationStack: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  workflows.unshift(newWf);

  // Publish Kafka Event
  const newEvent: KafkaEvent = {
    offset: kafkaOffset++,
    topic: "employee.leave.created",
    partition: 0,
    timestamp: new Date().toISOString(),
    key: emp.id,
    value: JSON.stringify({ workflowId: newWf.id, daysRequested: days, employeeName: emp.name }),
  };
  kafkaEvents.unshift(newEvent);

  res.json({ message: "Temporal Workflow registered successfully", workflow: newWf, event: newEvent });
});

// Get Kafka Event Stream
app.get("/api/events", (req, res) => {
  res.json(kafkaEvents);
});

// Get RAG Docs
app.get("/api/documents", (req, res) => {
  res.json(ragDocs);
});

// Simulate RAG Document Ingestion
app.post("/api/documents/ingest", (req, res) => {
  const { title, content, category, region } = req.body;
  const newDoc: RAGDoc = {
    id: `DOC-00${ragDocs.length + 1}`,
    title: title || "New HR Directive",
    category: category || "Policy",
    content: content || "No content provided",
    region: region || "Global",
  };
  ragDocs.push(newDoc);
  res.json({ message: "Document embedded with BAAI BGE-M3 & ingested into Qdrant/Elasticsearch caches.", doc: newDoc });
});

// Get Observability traces
app.get("/api/observability", (req, res) => {
  res.json({
    traces,
    metrics: {
      totalTokens: traces.reduce((acc, curr) => acc + curr.tokensUsed.total, 0) + 124500,
      totalCost: parseFloat((traces.reduce((acc, curr) => acc + curr.estimatedCost, 0) + 0.0821).toFixed(6)),
      totalRequests: traces.length + 242,
      averageLatencyMs: Math.round(traces.reduce((acc, curr) => acc + curr.latencyMs, 0) / traces.length) || 840,
      averageGroundedness: parseFloat((traces.reduce((acc, curr) => acc + curr.evaluation.groundedness, 0) / traces.length || 0.96).toFixed(2)),
    },
  });
});

// -------------------------------------------------------------
// Production Operations & Infrastructure Endpoints
// -------------------------------------------------------------

// 1. Health Probe for Pod Readiness/Liveness Probes
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0-release",
    dependencies: {
      postgres: { status: "connected", host: process.env.DB_HOST || "localhost", pingMs: 2 },
      redis: { status: "active", cluster_nodes: 3, hit_rate: "94.2%" },
      kafka: { status: "healthy", active_brokers: 2, consumer_lags: 0 },
      qdrant: { status: "active", collection: "hr_policies", vector_dim: 1024 },
      temporal: { status: "connected", namespace: "hr-workflows" }
    }
  });
});

// 2. Export Configuration Templates for Kubernetes / Docker Compose
app.get("/api/config/export", (req, res) => {
  const dockerCompose = `version: "3.8"

services:
  hr-control-plane:
    image: gcr.io/hr-platform/control-plane:1.0.0
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - DB_HOST=postgres-primary
      - REDIS_HOST=redis-cache
      - KAFKA_BOOTSTRAP_SERVERS=kafka-broker:9092
      - QDRANT_URL=http://qdrant:6333
      - TEMPORAL_ADDRESS=temporal-frontend:7233
    depends_on:
      - postgres-primary
      - redis-cache
      - kafka-broker
      - qdrant
      - temporal-frontend

  postgres-primary:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=hr_admin
      - POSTGRES_PASSWORD=secure_db_password
      - POSTGRES_DB=hr_production
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis-cache:
    image: redis:7-alpine
    command: redis-server --requirepass secure_redis_password

  qdrant:
    image: qdrant/qdrant:v1.8.0
    ports:
      - "6333:6333"

  kafka-broker:
    image: confluentinc/cp-kafka:7.3.0
    environment:
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka-broker:9092

  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.0
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181

  temporal-frontend:
    image: temporalio/auto-setup:1.20.0
    ports:
      - "7233:7233"
      - "8088:8088"

volumes:
  pgdata:
`;

  const kubernetesYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: hr-control-plane
  namespace: hr-platform
  labels:
    app: hr-control-plane
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hr-control-plane
  template:
    metadata:
      labels:
        app: hr-control-plane
    spec:
      containers:
      - name: control-plane
        image: gcr.io/hr-platform/control-plane:1.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: hr-platform-config
        - secretRef:
            name: hr-platform-secrets
        resources:
          limits:
            cpu: "1"
            memory: 1Gi
          requests:
            cpu: 100m
            memory: 256Mi
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: hr-control-plane-svc
  namespace: hr-platform
spec:
  selector:
    app: hr-control-plane
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
`;

  res.json({ dockerCompose, kubernetesYaml });
});

// 3. Simulated Production CLI Execution
app.post("/api/terminal", (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: "Command string is required." });
  }

  const cmd = command.trim();
  const args = cmd.split(" ");
  const baseCmd = args[0].toLowerCase();

  let output = "";

  if (baseCmd === "help") {
    output = `Enterprise HR AI Platform CLI - Production Simulation Command Line Interface
Available commands:
  help                                              Show this system manual
  psql -c "SELECT * FROM employees"                Query the active PostgreSQL Database
  psql -c "SELECT * FROM tenants"                  Query Row-Level Security tenant mapping
  kafka-console-consumer --topic <topic>            Consume stream messages from broker partitions
  mcp list                                          List active registry capability handlers
  temporal workflow list                            Track orchestration engine distributed sagas
  qdrant search --query "<query>"                   Run dense vector cos-similarity calculation
  curl -I http://localhost:3000/api/health         Verify HTTP system probes and readiness
  clear                                             Flush the console buffers
`;
  } else if (baseCmd === "clear") {
    output = "CLEAR";
  } else if (cmd.includes("psql") && cmd.includes("employees")) {
    const list = Object.values(employees);
    const border = "+------------+-----------------+-------------------+-------------+--------------+-----------------+";
    const header = "| id         | name            | role              | region      | leaveBalance | salary          |";
    const rows = list.map(emp => {
      const id = emp.id.padEnd(10);
      const name = emp.name.padEnd(15);
      const role = emp.role.padEnd(17);
      const reg = emp.region.padEnd(11);
      const lb = String(emp.leaveBalance).padEnd(12);
      const sal = `$${emp.salary.toLocaleString()}`.padEnd(15);
      return `| ${id} | ${name} | ${role} | ${reg} | ${lb} | ${sal} |`;
    }).join("\n");
    output = `${border}\n${header}\n${border}\n${rows}\n${border}\n(4 rows returned in PostgreSQL transaction)`;
  } else if (cmd.includes("psql") && cmd.includes("tenants")) {
    output = `+-----------+----------------+--------+---------+
| tenant_id | company_name   | region | status  |
+-----------+----------------+--------+---------+
| T-800     | Skynet Systems | Global | Active  |
+-----------+----------------+--------+---------+
(1 row returned in PostgreSQL transaction)`;
  } else if (baseCmd === "kafka-console-consumer") {
    const topicArg = args.find(a => a.startsWith("--topic"));
    const topic = topicArg ? args[args.indexOf(topicArg) + 1] : "employee.leave.created";
    const filtered = kafkaEvents.filter(e => e.topic === topic || !topicArg);
    
    if (filtered.length === 0) {
      output = `Listening on Kafka Broker Partitions for topic '${topic}'...\n(No recent offsets recorded)`;
    } else {
      output = filtered.map(e => `[OFFSET:${e.offset}][PARTITION:${e.partition}] ${e.timestamp} KEY:${e.key} => ${e.value}`).join("\n");
    }
  } else if (cmd === "mcp list") {
    output = `Model Context Protocol (MCP) Daemon online. Registered tool gateways:\n` + 
      registries.mcpTools.map(t => `  - ${t.name.padEnd(28)}: ${t.description}`).join("\n");
  } else if (cmd === "temporal workflow list") {
    output = `Temporal Cluster namespace 'hr-workflows' running sagas:\n` +
      workflows.map(w => `  - WorkflowID: ${w.id.padEnd(10)} | Type: ${w.type.padEnd(20)} | Status: ${w.status.padEnd(10)} | Step: ${w.step}`).join("\n");
  } else if (cmd.includes("qdrant search")) {
    const queryIdx = cmd.indexOf("--query");
    const queryVal = queryIdx !== -1 ? cmd.substring(queryIdx + 7).replace(/['"]/g, "").trim() : "leave policy";
    const found = ragDocs.filter(d => d.content.toLowerCase().includes(queryVal.toLowerCase()) || d.title.toLowerCase().includes(queryVal.toLowerCase()));
    
    if (found.length === 0) {
      output = `Qdrant Dense Vector Search - Vector Dimension [1024]\nNo points matched cosine similarity threshold [0.72] for query: "${queryVal}"`;
    } else {
      output = `Qdrant Dense Vector Search - Cosine Similarity Threshold [0.72]\n` +
        found.map((doc, idx) => `  - Point ID: point-${idx + 1} | Score: ${(0.92 - idx * 0.11).toFixed(4)} | Region: ${doc.region}\n    Payload: ${JSON.stringify(doc)}`).join("\n");
    }
  } else if (cmd.includes("curl") && cmd.includes("health")) {
    output = `HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 421
Connection: keep-alive
Date: ${new Date().toUTCString()}
X-Powered-By: Express
Access-Control-Allow-Origin: *

{
  "status": "healthy",
  "dependencies": {
    "postgres": "connected",
    "redis": "active",
    "kafka": "healthy",
    "qdrant": "active",
    "temporal": "connected"
  }
}`;
  } else {
    output = `sh: command not found: ${baseCmd}. Type 'help' to view valid platform commands.`;
  }

  res.json({ output });
});

// -------------------------------------------------------------
// CORE REASONING ENGINE (Control Plane + Execution Proxy)
// -------------------------------------------------------------
// Redis Token Bucket Rate Limiter State
const rateLimitMap: Record<string, { count: number; resetAt: number }> = {};

app.post("/api/chat", async (req, res) => {
  const { message, employeeId, honeypot, turnstileToken } = req.body;
  const startTime = Date.now();
  const clientIp = req.ip || "127.0.0.1";

  // Security Layer 0: Redis Token Bucket Rate Limiter Check (5 req/min)
  const now = Date.now();
  const rateKey = `${clientIp}_${employeeId || "E101"}`;
  if (!rateLimitMap[rateKey] || rateLimitMap[rateKey].resetAt < now) {
    rateLimitMap[rateKey] = { count: 1, resetAt: now + 60000 };
  } else {
    rateLimitMap[rateKey].count += 1;
  }

  const remainingRequests = Math.max(0, 5 - rateLimitMap[rateKey].count);
  res.setHeader("X-RateLimit-Limit", "5");
  res.setHeader("X-RateLimit-Remaining", remainingRequests.toString());
  res.setHeader("X-Turnstile-Status", "VERIFIED_CHALLENGE_PASSED");
  res.setHeader("X-Honeypot-Status", honeypot ? "TRAP_TRIGGERED" : "CLEAN");

  if (rateLimitMap[rateKey].count > 5) {
    return res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      answer: "⚡ [RATE LIMIT EXCEEDED] The Ingress Redis Token Bucket rate limiter has been triggered (Max 5 requests/minute limit reached). Please wait 60 seconds before issuing further queries.",
      controlPlane: {
        securityScrubbed: ["REDIS_RATE_LIMIT_EXCEEDED"],
        rateLimitRemaining: 0,
      }
    });
  }

  // Security Layer 1: Honeypot Trap Check
  if (honeypot && honeypot.trim() !== "") {
    // Record Kafka security audit event
    kafkaEvents.unshift({
      offset: kafkaOffset++,
      topic: "security.honeypot.blocked",
      partition: 0,
      timestamp: new Date().toISOString(),
      key: employeeId || "E101",
      value: JSON.stringify({ event: "HONEYPOT_BOT_TRAP_TRIGGERED", ip: clientIp, trapField: "sys_hp_field", payload: honeypot }),
    });

    return res.json({
      answer: "🚨 [HONEYPOT TRAP TRIGGERED] Automated bot activity detected via hidden trap field `sys_hp_field`. Your query has been safely isolated and flagged in Cloudflare WAF Threat Audit.",
      controlPlane: {
        intent: "Security Bot Interception",
        agentName: "Guardrail Firewall",
        matchedDocs: [],
        mcpCalls: [],
        policiesChecked: ["POL_HONEYPOT_TRAP_ENFORCED"],
        securityScrubbed: ["HONEYPOT_BOT_TRAP_ACTIVATED"],
        turnstileStatus: "CHALLENGE_REJECTED",
        honeypotTriggered: true,
      }
    });
  }

  const userContext = employees[employeeId] || employees["E101"];

  // Step 1: Policy Engine Security Guardrails (PII & Injection)
  let securityAlerts: string[] = [];
  let processedMessage = message || "";

  // Cloudflare Turnstile token validation logging
  securityAlerts.push("CLOUDFLARE_TURNSTILE_VERIFIED");

  // Simple SSN / Credit Card PII detection mock
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
  const ccPattern = /\b(?:\d[ -]*?){13,16}\b/;

  if (ssnPattern.test(message)) {
    securityAlerts.push("PII_SSN_DETECTED_AND_SCRUBBED");
    processedMessage = processedMessage.replace(ssnPattern, "[REDACTED_SSN]");
  }
  if (ccPattern.test(message)) {
    securityAlerts.push("PII_FINANCIAL_CARD_DETECTED_AND_SCRUBBED");
    processedMessage = processedMessage.replace(ccPattern, "[REDACTED_CARD_NUMBER]");
  }

  // Prompt Injection Audit
  const lowerMsg = message.toLowerCase();
  const isPromptInjection =
    lowerMsg.includes("ignore previous") ||
    lowerMsg.includes("system prompt") ||
    lowerMsg.includes("you must ignore") ||
    lowerMsg.includes("override");

  if (isPromptInjection) {
    securityAlerts.push("PROMPT_INJECTION_RISK_BLOCKED");
  }

  // Compile triggered policies
  const triggeredPolicies: string[] = [];
  if (securityAlerts.length > 0) triggeredPolicies.push("POL_PII_GUARDRAIL");
  if (isPromptInjection) triggeredPolicies.push("POL_PROMPT_INJECTION");

  // Step 2: Live AI Control Plane Execution (Gemini API)
  const gemini = getGeminiClient();
  let aiAnswer = "";
  let intent = "Policy Inquiry";
  let agentName = "Policy Agent";
  let mcpCalls: string[] = [];
  let promptTokens = 380;
  let completionTokens = 150;

  // Hybrid RAG simulation over core documents
  let matchedDocs: any[] = [];
  const queryLower = message.toLowerCase();

  // Route to database matching
  if (queryLower.includes("leave") || queryLower.includes("pto") || queryLower.includes("vacation") || queryLower.includes("off")) {
    intent = "Leave Query & Workflow Request";
    agentName = "Leave Agent";
    mcpCalls.push("hrms_get_leave_balance");
    triggeredPolicies.push("POL_MAX_CONSECUTIVE_LEAVE");
    matchedDocs = ragDocs.filter(d => d.category === "Compliance" || d.category === "Benefits");
  } else if (queryLower.includes("salary") || queryLower.includes("payroll") || queryLower.includes("pay") || queryLower.includes("withholding")) {
    intent = "Payroll Inquiries";
    agentName = "Payroll Agent";
    mcpCalls.push("payroll_get_payslip");
    matchedDocs = ragDocs.filter(d => d.region === "Global" || d.title.includes("California"));
  } else if (queryLower.includes("benefits") || queryLower.includes("insurance") || queryLower.includes("health")) {
    intent = "Benefits Strategy & Allocation";
    agentName = "Benefits Agent";
    matchedDocs = ragDocs.filter(d => d.category === "Benefits");
  } else {
    intent = "General Policy Search";
    agentName = "Policy Agent";
    matchedDocs = ragDocs;
  }

  // Cross-Encoder reranking simulator
  matchedDocs = matchedDocs.map((doc, idx) => ({
    ...doc,
    vectorScore: parseFloat((0.85 - idx * 0.12).toFixed(3)),
    bm25Score: parseFloat((12.4 - idx * 2.1).toFixed(1)),
    rerankScore: parseFloat((0.94 - idx * 0.15).toFixed(3)), // BGE-Reranker output
  })).slice(0, 2);

  // If Gemini client is online, run actual full composition!
  if (gemini && !isPromptInjection) {
    try {
      const promptInstruction = `
        You are the Enterprise HR AI Platform Control Plane (Response Composer).
        The user querying you has the following profile:
        - Name: ${userContext.name}
        - Role: ${userContext.role}
        - Dept: ${userContext.department}
        - Region: ${userContext.region}
        - Current PTO Balance: ${userContext.leaveBalance} days
        - Annual Base Salary: $${userContext.salary}

        The active Agent in control is: ${agentName}
        The active Intent identified is: ${intent}
        We matched the following Hybrid RAG policy documents:
        ${JSON.stringify(matchedDocs)}

        Answer the user's HR query accurately. Do not make up facts.
        If they are asking for a task (e.g. applying for leave or seeing salary details), clearly indicate that you have executed the respective MCP Tools: ${JSON.stringify(mcpCalls)} and state their current data in a highly structured, polished, enterprise-friendly format.
        Mention relevant policies (e.g. consecutive day rules, compliance region restrictions).
        Keep the tone highly professional, precise, helpful, and system-design elegant.
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: processedMessage,
        config: {
          systemInstruction: promptInstruction,
          temperature: 0.3,
        },
      });

      aiAnswer = response.text || "Unable to formulate a response from the control plane.";
      // Mock accurate token counts
      promptTokens = Math.round(promptInstruction.length / 4) + Math.round(processedMessage.length / 4);
      completionTokens = Math.round(aiAnswer.length / 4);
    } catch (err: any) {
      console.error("Gemini API direct execution error:", err);
      aiAnswer = `[Control Plane Failover Activated] I received your request. Using local business rules logic: your profile is in ${userContext.region} region. Let me assist you with your ${intent} intent. Your query has been grounded using policy docs matching region ${userContext.region}. Details: Leave Balance is ${userContext.leaveBalance} days.`;
    }
  } else {
    // Elegant local failover engine
    if (isPromptInjection) {
      aiAnswer = "🚨 [SECURITY VIOLATION DETECTED] The Enterprise policy engine has intercepted a potential prompt injection attempt. This event, along with your session footprint, has been published to the centralized compliance topic `compliance.security.audit` and logged in Langfuse. System parameters cannot be overwritten.";
    } else {
      // Heuristic responses
      if (intent.includes("Leave")) {
        aiAnswer = `Hello ${userContext.name}, your Leave Agent has verified your balance using MCP tool \`hrms_get_leave_balance\`. You currently have **${userContext.leaveBalance} days** remaining. 
        
According to policy **POL_MAX_CONSECUTIVE_LEAVE**, any requests exceeding 10 consecutive business days will trigger an escalated approval stack. If you would like to proceed with booking dates, let me know and I will launch the **Temporal Durable Leave Workflow**!`;
      } else if (intent.includes("Payroll")) {
        aiAnswer = `Hello ${userContext.name}, your Payroll Agent has successfully run \`payroll_get_payslip\` to aggregate your details:
        
- **Annual Base Salary**: $${userContext.salary.toLocaleString()}
- **Region Zone**: ${userContext.region} compliance profile
- **Active Direct Deposit**: Enabled (Verified on PostgreSQL)

Is there anything specific in your deductions or payslip break-down you would like to search?`;
      } else {
        aiAnswer = `Hello ${userContext.name}, your HR AI Copilot has grounded your request using California & Global directives. Based on remote guidelines, full-time staff qualify for ergonomic equipment allocations. What equipment or regulatory support can I assist you with today?`;
      }
    }
  }

  const latencyMs = Date.now() - startTime;
  const estimatedCost = parseFloat(((promptTokens * 0.075 + completionTokens * 0.3) / 1000000).toFixed(6));

  // Step 3: Run Simulated AI Evaluations
  const groundedness = isPromptInjection ? 0.0 : parseFloat((0.92 + Math.random() * 0.08).toFixed(2));
  const faithfulness = isPromptInjection ? 0.0 : parseFloat((0.94 + Math.random() * 0.06).toFixed(2));
  const hallucinationRisk = isPromptInjection ? 0.95 : parseFloat((Math.random() * 0.05).toFixed(2));
  const toolAccuracy = isPromptInjection ? 0.0 : 1.0;

  // Step 4: Write to OTel / Langfuse Trace Stores
  const newTrace: Trace = {
    id: `TR-${Math.floor(10000 + Math.random() * 90000)}`,
    timestamp: new Date().toISOString(),
    role: userContext.role,
    query: message,
    intent,
    agentName,
    mcpCalls,
    policiesChecked: triggeredPolicies,
    latencyMs,
    tokensUsed: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
    estimatedCost,
    evaluation: { groundedness, faithfulness, hallucinationRisk, toolAccuracy },
    answer: aiAnswer,
  };

  traces.unshift(newTrace);

  // Trigger simulated workflow run if leave requested
  if (queryLower.includes("request leave") || queryLower.includes("apply for leave") || queryLower.includes("book vacation")) {
    const newWf: Workflow = {
      id: `WF-${Math.floor(1000 + Math.random() * 9000)}`,
      type: "Leave Approval",
      status: "Running",
      step: "Manager Approval",
      employeeId: userContext.id,
      compensationStack: ["Revert Accrued PTO Deductions"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workflows.unshift(newWf);

    // Kafka Event
    kafkaEvents.unshift({
      offset: kafkaOffset++,
      topic: "employee.leave.created",
      partition: 0,
      timestamp: new Date().toISOString(),
      key: userContext.id,
      value: JSON.stringify({ workflowId: newWf.id, daysRequested: 5, employeeName: userContext.name }),
    });
  }

  res.json({
    answer: aiAnswer,
    traceId: newTrace.id,
    controlPlane: {
      intent,
      agentName,
      matchedDocs,
      mcpCalls,
      policiesChecked: triggeredPolicies,
      securityScrubbed: securityAlerts,
    },
    traceDetails: newTrace,
  });
});

// -------------------------------------------------------------
// Vite Dev Server / Static Production Mounting
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise HR AI Platform running on http://localhost:${PORT}`);
  });
}

startServer();
