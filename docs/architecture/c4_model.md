# Architectural Blueprint: C4 Container Model

This documentation outlines the structural bounds, architectural context, and software container boundaries for the Enterprise HR AI Platform. It is mapped following the **C4 Software Architecture Model**.

---

## 🗺️ Level 1: System Context Diagram

Defines the overall boundaries of our ecosystem and how actors interact with it.

```text
                               ┌────────────────────────────────┐
                               │       Active Directory         │
                               │        (HR Directory)          │
                               └───────────────▲────────────────┘
                                               │ Context
                                               │ & Auth
                                               │
 ┌──────────────────────┐              ┌───────┴────────┐              ┌──────────────────────┐
 │     HR Employee      │ ───────────> │  Enterprise    │ <─────────── │  External SaaS APIs  │
 │  (Requestor / User)  │  Submit     │  HR AI System  │  Interacts   │ (Workday, SAP, etc.) │
 └──────────────────────┘  PTO / Queries└───────┬────────┘              └──────────────────────┘
                                               │
                                               │ Pub/Sub
                                               ▼
                               ┌────────────────────────────────┐
                               │      Notification System       │
                               │      (Slack, SMTP Relay)       │
                               └────────────────────────────────┘
```

---

## 🧱 Level 2: Software Container Diagram

This container-level view illustrates how distinct, isolated backend runtimes communicate to process requests securely.

```text
                                        [ INGRESS CHANNEL ]
                                                 │
                                                 ▼
                             ┌───────────────────────────────────────┐
                             │          Nginx Ingress Proxy          │
                             │  (SSL Offloading & Rate Limiting)     │
                             └───────────────────┬───────────────────┘
                                                 │
                                                 ▼
                             ┌───────────────────────────────────────┐
                             │            API Gateway                │
                             │  - Keycloak JWT validation            │
                             │  - Row-Level Tenant Security Injection │
                             └───────────────────┬───────────────────┘
                                                 │
                                                 ▼
                             ┌───────────────────────────────────────┐
                             │       AI Control Plane Service        │
                             │  - Intent Classifier (Gemini/GPT)     │
                             │  - Prompt & Tool Capability Registry  │
                             │  - Guardrail & Redaction Processor    │
                             └──────┬────────────────────────┬───────┘
                                    │                        │
       ┌────────────────────────────┘                        └────────────────────────────┐
       ▼                                                                                  ▼
┌───────────────────────────────────────┐                                          ┌───────────────────────────────────────┐
│     Hybrid Retrieval (RAG) Service    │                                          │      Temporal Workflow Orchestrator   │
│  - Dense Retrieval (Qdrant Database)   │                                          │  - Durable Leave Sagas (State Machine) │
│  - Sparse Keyword Match (Elasticsearch)│                                          │  - Compensation Steps Execution       │
└───────────────────────────────────────┘                                          └──────────────────┬────────────────────┘
                                                                                                      │
                                                                                                      ▼
                                                                                   ┌───────────────────────────────────────┐
                                                                                   │          Apache Kafka Event Bus       │
                                                                                   │  (Durable Event Streaming & Audits)  │
                                                                                   └───────────────────────────────────────┘
```

### Major Containers & Roles

1. **API Gateway (Express / Kong)**:
   Acts as the unified entrance. No unauthenticated requests are allowed past this point. Validates OpenID Connect signatures and decodes structural role claims.
2. **AI Control Plane Service (NodeJS / Python)**:
   Resolves intent parameters using high-performance NLP models. Manages available registries and orchestrates tool usage safely.
3. **Hybrid Retrieval (RAG) Service**:
   Operates cross-encoders to join semantic Qdrant embeddings search and token keyword matches from Elasticsearch. Matches the result payload targeting specific geographical regions.
4. **Temporal Workflow Orchestrator**:
   Implements decoupled state-machines. Standardizes multi-system transactions (such as HR ledger mutations and provisioning events) as highly durable workflows with full automatic rollback capabilities.
