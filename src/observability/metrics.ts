type EventName =
  | "request_started"
  | "rag_retrieval"
  | "tool_called"
  | "mcp_tool_called"
  | "request_completed"
  | "request_failed";

type Event = {
  name: EventName;
  at: string;
  data?: Record<string, unknown>;
};

const events: Event[] = [];

export function track(name: EventName, data?: Record<string, unknown>) {
  events.push({ name, at: new Date().toISOString(), data });
}

export function getMetrics() {
  const completed = events.filter(e => e.name === "request_completed");
  const failed = events.filter(e => e.name === "request_failed");
  const rag = events.filter(e => e.name === "rag_retrieval");
  const tools = events.filter(e => e.name === "tool_called");
  const mcp = events.filter(e => e.name === "mcp_tool_called");

  const latencies = completed
    .map(e => Number(e.data?.latencyMs))
    .filter(Number.isFinite);

  return {
    requests: completed.length + failed.length,
    successRate: completed.length + failed.length
      ? completed.length / (completed.length + failed.length)
      : 0,
    errors: failed.length,
    ragCalls: rag.length,
    toolCalls: tools.length,
    mcpToolCalls: mcp.length,
    avgLatencyMs: latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0
  };
}

export function getRecentEvents() {
  return events.slice(-30).reverse();
}
