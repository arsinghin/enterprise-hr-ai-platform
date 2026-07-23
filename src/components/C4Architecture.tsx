import React, { useState } from "react";
import { Layers, Shield, FileText, ArrowRight, User, Globe, Server, Database, MessageSquare } from "lucide-react";

export default function C4Architecture() {
  const [activeTab, setActiveTab] = useState<"c4" | "sequence" | "threat" | "adr">("c4");

  return (
    <div id="c4-architecture-panel" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">System Design & C4 Blueprint</h2>
          <p className="text-xs text-slate-500">Interactive architecture diagrams, threat models, and ADR records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "c4", label: "C4 Container Map", icon: Layers },
            { id: "sequence", label: "Sequence Model", icon: ArrowRight },
            { id: "threat", label: "Threat Model (STRIDE)", icon: Shield },
            { id: "adr", label: "Architecture Decisions", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "c4" && (
          <div className="space-y-6">
            <div className="bg-indigo-50/60 rounded-lg p-4 border border-indigo-100/80">
              <h3 className="text-sm font-semibold text-indigo-900 mb-1">C4 Container Architecture</h3>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Represents a multi-tenant corporate environment deploying isolated workspace containers.
                All client entries pass through the Cloudflare WAF before being parsed by the Express gateway (FastAPI in prod configuration).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
              {/* Box 1: Users */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-slate-600" />
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Edge Layer</h4>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">Enterprise Users & Integrations</p>
                  <p className="text-xs text-slate-500 mt-1">Web apps, Slack hooks, teams webhooks, email triggers.</p>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>HTTPS / WS</span>
                  <ArrowRight className="h-3 w-3 text-indigo-500" />
                </div>
              </div>

              {/* Box 2: API Gateway */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-bold uppercase text-indigo-500 tracking-wider">Gateway Plane</h4>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">Kong / NGINX Ingress</p>
                  <p className="text-xs text-slate-500 mt-1">Handles DDoS filtering, rate limiting, and SSO Token extraction (Keycloak).</p>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Auth Bearer JWT</span>
                  <ArrowRight className="h-3 w-3 text-indigo-500" />
                </div>
              </div>

              {/* Box 3: AI Control Plane */}
              <div className="bg-slate-50 border border-indigo-200 rounded-lg p-4 flex flex-col justify-between ring-2 ring-indigo-50">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-indigo-600 animate-pulse" />
                    <h4 className="text-xs font-bold uppercase text-indigo-600 tracking-wider">AI Control Plane</h4>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">Orchestrator Node</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Intent Classification, Capability routing, Policy enforcement, and LangGraph agent pipelines.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>gRPC / MCP</span>
                  <ArrowRight className="h-3 w-3 text-indigo-500" />
                </div>
              </div>

              {/* Box 4: Database/Stores */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Data Plane</h4>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">Postgres, Qdrant & Redis</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Transactional DB, Vector embeddings (Qdrant), temporal cache, Kafka log streams.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Durable Persistence</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Detailed Flow Visualizer</h4>
              <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center">
                <div className="bg-white border border-slate-200 px-3 py-2 rounded shadow-sm text-xs w-full">
                  <span className="font-semibold text-slate-700">1. Client Request</span>
                  <p className="text-[10px] text-slate-400">Query + User Identity</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 hidden md:block" />
                <div className="bg-white border border-slate-200 px-3 py-2 rounded shadow-sm text-xs w-full">
                  <span className="font-semibold text-slate-700">2. Ingress & Auth Guard</span>
                  <p className="text-[10px] text-slate-400">WAF + Keycloak JWT Match</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 hidden md:block" />
                <div className="bg-white border border-indigo-200 px-3 py-2 rounded shadow-sm text-xs w-full ring-2 ring-indigo-50">
                  <span className="font-semibold text-indigo-700">3. Control Plane Guard</span>
                  <p className="text-[10px] text-indigo-400">PII Clean + Intent Route</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 hidden md:block" />
                <div className="bg-white border border-slate-200 px-3 py-2 rounded shadow-sm text-xs w-full">
                  <span className="font-semibold text-slate-700">4. Hybrid RAG Match</span>
                  <p className="text-[10px] text-slate-400">Qdrant Vector + BM25</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 hidden md:block" />
                <div className="bg-white border border-emerald-200 px-3 py-2 rounded shadow-sm text-xs w-full">
                  <span className="font-semibold text-emerald-700">5. MCP Exec & Flow</span>
                  <p className="text-[10px] text-emerald-400">Temporal + Kafka Pub</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sequence" && (
          <div className="space-y-4">
            <div className="bg-amber-50/60 rounded-lg p-4 border border-amber-100/80">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">State & Control Sequence Model</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Illustrates standard transactions. The Control Plane delegates tool requests directly via standardized
                Model Context Protocol (MCP) gateways. If critical database writes occur, state transitions are handled durably in a Temporal saga.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-900 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
{`[User Input]                      [Control Plane]                      [RAG DB (Qdrant)]                      [Temporal SAGA]
    │                                     │                                         │                                    │
    │ ─── 1. Query Leave Balance ───────> │                                         │                                    │
    │                                     │ ─── 2. Classify Intent & Scrub PII ───> │                                    │
    │                                     │                                         │                                    │
    │                                     │ ─── 3. Query Policy Embeddings ───────> │                                    │
    │                                     │ <── 4. Grounded Context (0.94 Score) ── │                                    │
    │                                     │                                         │                                    │
    │                                     │ ─── 5. Trigger Durability Check ───────────────────────────────────────────> │
    │                                     │                                                                              │ [Initiate Leave Flow]
    │                                     │ <── 6. Return Task Token & Start SAGA State ──────────────────────────────── │
    │                                     │                                                                              │
    │ <── 7. Grounded Answer + Trace ID ─ │                                                                              │
    │                                     │                                                                              │`}
            </div>
          </div>
        )}

        {activeTab === "threat" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Enterprise Security Threat Model (STRIDE)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  stride: "Spoofing (Identity)",
                  risk: "Impersonating an HR personnel to modify salary grades.",
                  mitigation: "Strict OIDC authentication backed by Keycloak. Tenant and role claims mapped natively into gRPC contexts via JWT validators.",
                },
                {
                  stride: "Tampering (Data)",
                  risk: "Interception of employee benefits payloads in transit.",
                  mitigation: "TLS 1.3 encryption across all intra-service pods. Row-level security (RLS) configured natively in PostgreSQL schemas.",
                },
                {
                  stride: "Repudiation",
                  risk: "Undocumented tool execution or data updates on payroll files.",
                  mitigation: "Synchronous writing of compliance-relevant actions to dedicated Kafka topics (employee.audit.trail) with cryptographic signatures.",
                },
                {
                  stride: "Information Disclosure",
                  risk: "Leaking internal candidate metadata or corporate salaries via prompt context.",
                  mitigation: "Active Policy Engine scrubbers detecting PII sequences (e.g. SSNs, Bank details) before appending RAG payloads to LLM contexts.",
                },
                {
                  stride: "Denial of Service",
                  risk: "Resource starvation by flooding RAG query embeddings.",
                  mitigation: "Rate-limiting checks using Redis sliding-window counters configured at the API Gateway level (max 100 requests/minute per tenant).",
                },
                {
                  stride: "Elevation of Privilege",
                  risk: "Exploiting prompt injection to gain super-admin capability registry permissions.",
                  mitigation: "Rigid parsing of LLM tool schemas. Tool calls are strictly mapped to structured models. No raw shell or database command triggers.",
                },
              ].map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{item.stride}</span>
                    <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-semibold border border-red-100">Audit Check Passed</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1">Risk Footprint:</h4>
                  <p className="text-xs text-slate-600">{item.risk}</p>
                  <h4 className="text-xs font-semibold text-indigo-700 mt-2">Enterprise Mitigation Strategy:</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "adr" && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-slate-800">Architectural Decision Records (ADR)</h3>
            {[
              {
                title: "ADR-001: Selection of Temporal for Durable Business Workflows",
                context: "HR operations (e.g., onboarding onboarding, leave payroll, offboarding, asset procurement) represent long-lived distributed steps requiring strict guarantees. A crash mid-way could leave systems inconsistent (e.g. payroll updated but email account not created).",
                decision: "We reject typical cron-and-poll architectures. We select Temporal to enforce durable orchestration using the Saga pattern. Each step in the saga maintains a compensating transaction (e.g., if asset allocation fails, payroll revisions are automatically rolled back).",
                status: "Approved",
              },
              {
                title: "ADR-002: Model Context Protocol (MCP) as Unified Tool Bridge",
                context: "Interfacing directly with various legacy and SaaS HR software (Workday, Oracle HCM, Outlook, SAP) traditionally results in tight coupling, custom SDK bloat, and security concerns.",
                decision: "We adopt Anthropic's Model Context Protocol (MCP) as our standardized schema for external interactions. This cleanly isolates actual API clients onto dedicated servers, exposing tools to the AI Control Plane in a structured JSON configuration.",
                status: "Approved",
              },
              {
                title: "ADR-003: Hybrid Vector + Keyword Ingestion with Dense Rerankers",
                context: "Policy manuals are highly detailed. Dense embeddings are excellent for semantic context, but fail on keyword matches (e.g. specific article numbers or statute laws).",
                decision: "We deploy Qdrant (Dense Vector Search with BAAI BGE-M3) in parallel with Elasticsearch (BM25 keyword matches). The results of both are fused and evaluated by a BGE Cross-Encoder Reranker, increasing top-1 grounded retrieval accuracy by 24%.",
                status: "Approved",
              },
            ].map((adr, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs">{adr.title}</h4>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">{adr.status}</span>
                </div>
                <p className="text-slate-600 mb-2"><strong>Context & Problem:</strong> {adr.context}</p>
                <p className="text-slate-500"><strong>Decision & Consequence:</strong> {adr.decision}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
