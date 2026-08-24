import { retrieve } from "../rag/rag.js";
import {
  consultarCampanha,
  consultarMetricas,
  cancelarCampanha
} from "../tools/ads-tools.js";
import { track } from "../observability/metrics.js";

export async function runMockAgent(message: string) {
  const started = Date.now();
  track("request_started", { mode: "mock" });

  const lower = message.toLowerCase();
  let answer = "";

  if (lower.includes("métrica") || lower.includes("metrica") || lower.includes("performance")) {
    track("tool_called", { tool: "consultar_metricas" });
    const result = consultarMetricas({ campaignId: "camp-001" });
    answer = `A campanha camp-001 tem CTR de ${result.ctr}% e ${result.conversions} conversões.`;
  } else if (lower.includes("cancel") && lower.includes("camp")) {
    track("tool_called", { tool: "cancelar_campanha" });
    const result = cancelarCampanha({ campaignId: "camp-001" });
    answer = result.success
      ? "A campanha camp-001 foi cancelada."
      : String(result.error);
  } else if (lower.includes("campanha")) {
    track("tool_called", { tool: "consultar_campanha" });
    const result = consultarCampanha({ campaignId: "camp-001" });
    answer = `A campanha ${result.id} (${result.name}) está ${result.status}.`;
  } else {
    const docs = retrieve(message);
    track("rag_retrieval", {
      query: message,
      documents: docs.map(d => d.id)
    });

    if (docs.length) {
      answer = `Encontrei este contexto na base Ada Ads: ${docs.map(d => d.text).join(" ")}`;
    } else {
      answer = "No modo mock, não encontrei um contexto específico. Tente perguntar sobre CTR, planejamento ou uma campanha.";
    }
  }

  track("request_completed", {
    mode: "mock",
    latencyMs: Date.now() - started
  });

  return {
    mode: "mock",
    answer
  };
}
