# Enterprise HR AI Platform

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![System Architecture: C4 Model](https://img.shields.io/badge/Architecture-C4_Model-indigo)](https://structurizr.com/)
[![Durable Workflows: Temporal](https://img.shields.io/badge/Workflows-Temporal-red)](https://temporal.io/)
[![Streaming Event Bus: Kafka](https://img.shields.io/badge/Event_Bus-Apache_Kafka-black)](https://kafka.apache.org/)
[![Vector Database: Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant-emerald)](https://qdrant.tech/)

An open-source, production-ready, enterprise-grade HR AI Platform showcasing state-of-the-art **Registry-Driven Compound AI System Architecture**, high-durability **Temporal Workflow Sagas**, unified **Model Context Protocol (MCP)** integrations, and hybrid vector-keyword retrieval (RAG) with real-time **Langfuse Observability**.

Designed to demonstrate production system design patterns for standard HR automated operations, multi-tenant workspace isolation, and high-security guardrail enforcement.

---

## 🏗️ System Architecture

Our platform implements an **AI Control Plane** separate from the **Execution Plane**, ensuring that LLM model capabilities do not have direct, unmitigated access to critical transaction databases.

```text
                                       CLIENT ENTRY
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │               Cloudflare WAF                 │
                    │         Ingress Rate Limiting (Redis)        │
                    └──────────────────────────────────────────────┘
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │            OIDC / Keycloak Identity          │
                    │       Tenant Claims & Context Builder        │
                    └──────────────────────────────────────────────┘
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │             AI CONTROL PLANE                 │
                    │  - PII Scrubber & Guardrails                 │
                    │  - Intent Classifier                         │
                    │  - Capability & Prompt Registry              │
                    └──────────────────────────────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │   Hybrid Retrieval (RAG)  │                 │    MCP Tool Gateway       │
       │   - Dense Qdrant Embeds   │                 │   - Workday / SAP HCM     │
       │   - Sparse BM25 / Reranker│                 │   - Calendar / Email API  │
       └───────────────────────────┘                 └───────────────────────────┘
                     │                                             │
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │   LiteLLM Proxy Router    │                 │  Temporal Saga Workflow   │
       │   - GPT-4o / Claude 3.5   │                 │   - Leave Booking         │
       │   - Gemini 1.5 Pro        │                 │   - Equipment allocation  │
       └───────────────────────────┘                 └───────────────────────────┘
                                                           │
                                                           ▼
                                                     ┌───────────┐
                                                     │ Kafka Bus │
                                                     └───────────┘
```

---

## 🚀 Key Architectural Pillars

### 1. Unified Control Plane & Capability Registries
The LLM never makes free-form database queries. Instead, user requests are intercepted by an **AI Control Plane**:
* **Intent Classification**: Evaluates input parameters to identify intent classes.
* **Registry Routing**: Maps intents to registered target Agents and structured MCP tools.
* **Strict Guardrails**: Scrub PII (SSNs, medical records, financial data) and intercept Prompt Injection vectors.

### 2. Durable Sagas via Temporal Workflows
Critical mutations (e.g., deducting leave balances, dispatching laptop shipments, triggering payroll adjustments) are handled as **Temporal Sagas**:
* Every action registered in a workflow has a defined **Compensating Transaction** (e.g., if asset dispatch fails, previous PTO deductions are safely reverted).
* Guaranteed completion over arbitrary infrastructure crashes, system restarts, and API timeouts.

### 3. Model Context Protocol (MCP) Integration
External SaaS directories (Workday HCM, SAP, Google Workspace, Jira) are isolated behind standard **MCP Gateways**:
* Unified API schemas for reading context or executing mutations.
* Eradicates custom API client SDK bloat, replacing them with standard daemon client hooks.

### 4. Enterprise-Grade Hybrid RAG Ingestion Pipeline
* **Embeddings Engine**: Utilizes **BAAI BGE-M3** for producing multi-lingual dense vector spaces (1024-dim).
* **Sparse Vector Ingestion**: Concurrent keyword ingestion via Elasticsearch (BM25 score matching) to guarantee accuracy on compliance code tokens (e.g., *California Labor Code Section 246*).
* **BGE Reranker (Cross-Encoder)**: Merges sparse and dense search scores to deliver high-precision context injection.

---

## 🛠️ Repository Folder Structure

```text
enterprise-hr-ai/
├── apps/
│   ├── web/                     # Next.js Front-End Portal
│   └── admin/                   # Operations & Infrastructure Terminal Panel
├── services/
│   ├── api-gateway/             # Ingress, Rate-limiting, & Keycloak Token Verification
│   ├── ai-control-plane/        # Intent Routing, RAG pipelines, and Prompt Registries
│   ├── workflow-engine/         # Temporal Durable Workflows Sagas
│   └── observability/           # OpenTelemetry & Langfuse Trace aggregations
├── registries/                  # Structured Agent, MCP Tool, & Policy schemas
├── docs/                        # Architectural Decision Records, Threat Models, C4 diagrams
└── infra/                       # Terraform Blueprints & Helm Charts
```

---

## 📦 Local Installation & Setup

### Prerequisites
* Docker & Docker Compose (v2.20+)
* Node.js (v18+)
* Python (v3.10+) for backend engine runtimes

### Clone and Launch Dev Environment
```bash
git clone https://github.com/your-org/enterprise-hr-ai.git
cd enterprise-hr-ai

# Boot up dependent infrastructure (PostgreSQL, Redis, Qdrant, Kafka, Temporal, Keycloak)
docker-compose -f docker-compose.infra.yml up -d

# Install packages
npm install

# Run build tasks and compile artifacts
npm run build

# Start local server hosting API + static simulator SPA on port 3000
npm run dev
```

---

## 🛡️ Enterprise Security Model (STRIDE)

* **Spoofing**: Backed by secure Keycloak OpenID Connect (OIDC) JWT signature verification. Role-based (RBAC) claims injected natively into gRPC payload descriptors.
* **Tampering**: PostgreSQL tables employ Row-Level Security (RLS) partitioned on Tenant Identifiers.
* **Information Disclosure**: Policy Engine proactively scans prompt structures for high-priority PII markers and replaces them with cryptographic tags prior to prompt composition.
* **Elevation of Privilege**: Zero direct database mutation paths are exposed to LLM agents. All transitions occur via schema-validated, version-controlled Temporal steps.

---

## 📘 Architectural Decision Records (ADR)
Detailed systemic decisions are documented inside the `docs/adr/` directory:
* **ADR-001**: Selection of Temporal over customized cron/retry code blocks to ensure 100% saga durability.
* **ADR-002**: Utilizing Model Context Protocol (MCP) as the unified bridge to external enterprise resources (SAP, Workday).
* **ADR-003**: Standardizing on Hybrid BM25+Dense retrieval paired with Cross-Encoder reranking for high-fidelity HR policy grounding.

---

## 📄 License
This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
