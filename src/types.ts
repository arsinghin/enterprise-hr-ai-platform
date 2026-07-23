export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  region: string;
  leaveBalance: number;
  salary: number;
  benefits: string[];
}

export interface Workflow {
  id: string;
  type: string;
  status: "Running" | "Completed" | "Approved" | "Cancelled" | "Failed";
  step: string;
  employeeId: string;
  compensationStack: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KafkaEvent {
  offset: number;
  topic: string;
  partition: number;
  timestamp: string;
  key: string;
  value: string;
}

export interface Trace {
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

export interface RAGDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  region: string;
  vectorScore?: number;
  bm25Score?: number;
  rerankScore?: number;
}

export interface AgentReg {
  name: string;
  scope: string;
}

export interface McpToolReg {
  name: string;
  description: string;
}

export interface PolicyReg {
  code: string;
  rule: string;
}
