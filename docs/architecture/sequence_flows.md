# Sequence Models & Transaction Flows

This document maps out the specific transactional sequence diagrams for core platform workflows, ensuring precise execution paths and security boundaries.

---

## 📅 Sequence 1: Durable Leave Request Saga (Temporal & Kafka)

Demonstrates how our system executes mutations across heterogeneous services safely without relying on fragile distributed 2-Phase commits.

```text
User          API Gateway      Control Plane      Temporal       PostgreSQL      Kafka Bus       Courier
 │                 │                 │               │               │               │              │
 ├─Submit PTO Request────────────────►               │               │               │              │
 │                 ├─Identify Intent & Validate      │               │               │              │
 │                 ├─Inject Tenant Claim             │               │               │              │
 │                 └────────────────►│               │               │               │              │
 │                                   ├─Start Workflow│               │               │              │
 │                                   └──────────────►│               │               │              │
 │                                                   ├─Deduct PTO Ledger             │              │
 │                                                   └──────────────►│               │              │
 │                                                   │               ├─Update Success│              │
 │                                                   │               │ (Commit RLS)  │              │
 │                                                   │               ├──────────────►│              │
 │                                                   ├─Publish "leave.created"       │              │
 │                                                   └──────────────────────────────►│              │
 │                                                   │                               ├─Consume Event│
 │                                                   │                               └─────────────►│
 │                                                   │                                              ├─Dispatch
 │                                                   │                                              │ Courier
 │                                                   │                                              └─────┐
 │                                                   │                                                    │
 │                                                   │ <───────[TIMEOUT / COURIER FAILURE INTERRUPT]──────┘
 │                                                   ├─Triggers Compensation (Rollback)
 │                                                   ├─Revert PTO Ledger             │              │
 │                                                   └──────────────────────────────►│              │
 │                                                   │                               │              │
 │                                                   ├─Publish "leave.failed"        │              │
 │                                                   └──────────────────────────────►│              │
```

---

## 🔍 Sequence 2: Hybrid RAG Retrieval (Qdrant & Elasticsearch)

Details the exact flow from the user query to semantic vector expansion, sparse keyword merging, and cross-encoder score reranking.

```text
User            API Gateway       Control Plane        Qdrant        Elasticsearch      Cross-Encoder
 │                   │                  │                 │                │                  │
 ├─Query "PTO Policy"►                  │                 │                │                  │
 │                   ├─Authenticate JWT │                 │                │                  │
 │                   └─────────────────►│                 │                │                  │
 │                                      ├─Generate Dense Vector Embedding  │                  │
 │                                      ├────────────────►│                │                  │
 │                                      │                 └─[Dense Matches]│                  │
 │                                      │                  (Score 0.82)───►│                  │
 │                                      ├─Generate Sparse Query Token      │                  │
 │                                      ├─────────────────────────────────►│                  │
 │                                      │                                  └─[BM25 Matches]   │
 │                                      │                                    (Score 45.2)────►│
 │                                      ├─Send Candidates to Reranking Engine                 │
 │                                      └────────────────────────────────────────────────────►│
 │                                                                                            ├─Compute Similarity
 │                                                                                            ├─Recalculate Weighted Rank
 │                                                                                            └──────┬
 │                                                                                                   │
 │                                      │ <─────────────────Sorted Top-K Context Payload─────────────┘
 │                                      ├─Inject Context into System Prompt Template
 │                                      ├─Call Gemini model (Context Locked)
 │                                      ▼
```

---

## 🛠️ Sequence 3: Model Context Protocol (MCP) Execution Routing

Illustrates the decoupled mechanism where the AI Control Plane safely calls system tools through authenticated, strictly-typed MCP Gateways.

```text
AI Control Plane          MCP Gateway Broker        Target SaaS Integration (Workday)
       │                           │                                │
       ├─Resolve Tool Invitation──►│                                │
       │ (JSON-RPC 2.0 Request)    │                                │
       │                           ├─Validate Dynamic Schema        │
       │                           ├─Bind OAuth Bearer Session      │
       │                           └───────────────────────────────►│
       │                                                            ├─Validate Token
       │                                                            ├─Apply Mutation / Select
       │                                                            └───────┬
       │                                                                    │
       │                           │ <──────HTTP 200 API Payload────────────┘
       │                           ├─Format to JSON-RPC 2.0 Response
       │ <─JSON-RPC 2.0 Response───│                                │
       ▼
```
