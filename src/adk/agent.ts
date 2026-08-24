import "dotenv/config";
import {
  LlmAgent,
  FunctionTool,
  InMemoryRunner,
  isFinalResponse,
  MCPToolset,
  StreamableHTTPConnectionParamsSchema
} from "@google/adk";
import { createUserContent } from "@google/genai";
import { z } from "zod";

import {
  consultarCampanha,
  consultarMetricas,
  cancelarCampanha,
  getCampaignInput,
  getMetricsInput,
  cancelCampaignInput
} from "../tools/ads-tools.js";
import { retrieve } from "../rag/rag.js";

const campaignTool = new FunctionTool({
  name: "consultar_campanha",
  description: "Consulta o status e os dados de uma campanha Ada Ads.",
  parameters: getCampaignInput,
  execute: async (args) => consultarCampanha(args)
});

const metricsTool = new FunctionTool({
  name: "consultar_metricas",
  description: "Consulta métricas de performance de uma campanha Ada Ads.",
  parameters: getMetricsInput,
  execute: async (args) => consultarMetricas(args)
});

const cancelTool = new FunctionTool({
  name: "cancelar_campanha",
  description: "Cancela uma campanha. Só execute quando o usuário pedir explicitamente.",
  parameters: cancelCampaignInput,
  execute: async (args) => cancelarCampanha(args)
});

/**
 * Tool RAG local.
 *
 * O ADK trata a função como uma tool. A implementação da recuperação
 * continua sendo nossa, dentro de src/rag.
 */
const knowledgeTool = new FunctionTool({
  name: "buscar_conhecimento_ada_ads",
  description: "Busca conhecimento relevante na base de documentação do Ada Ads.",
  parameters: z.object({
    query: z.string().describe("Pergunta ou assunto a buscar na documentação")
  }),
  execute: async ({ query }) => retrieve(query)
});

const mcpUrl = process.env.MCP_SERVER_URL;

const mcpToolset = mcpUrl
  ? new MCPToolset(
      StreamableHTTPConnectionParamsSchema.parse({
        type: "StreamableHTTPConnectionParams",
        url: mcpUrl
      })
    )
  : undefined;

/**
 * O ponto mais importante para estudar:
 *
 * ADK Agent
 *   ├── LLM (Gemini)
 *   ├── FunctionTools diretas
 *   ├── RAG como tool
 *   └── MCPToolset (opcional)
 */
export const rootAgent = new LlmAgent({
  name: "ada_assist_adk",
  description: "Assistente de IA para Ada Ads.",
  model: "gemini-2.5-flash",
  instruction: `
Você é o Ada Assist, assistente do time comercial do Ada Ads.

Seu objetivo é responder perguntas, consultar dados e executar ações com segurança.

Use:
- buscar_conhecimento_ada_ads para perguntas conceituais/documentação;
- consultar_campanha para dados atuais de campanha;
- consultar_metricas para performance;
- cancelar_campanha somente quando o usuário pedir explicitamente.

Se houver ferramentas MCP disponíveis, use-as quando forem a melhor fonte para o sistema que elas representam.
Não invente dados.
`,
  tools: [
    knowledgeTool,
    campaignTool,
    metricsTool,
    cancelTool,
    ...(mcpToolset ? [mcpToolset] : [])
  ]
});

export async function runAdkAgent(message: string) {
  const runner = new InMemoryRunner({
    agent: rootAgent,
    appName: "ada_assist_adk"
  });

  const session = await runner.sessionService.createSession({
    appName: "ada_assist_adk",
    userId: "local-user"
  });

  const events = [];

  for await (const event of runner.runAsync({
    userId: session.userId,
    sessionId: session.id,
    newMessage: createUserContent(message)
  })) {
    events.push({
      author: event.author,
      isFinal: isFinalResponse(event),
      content: event.content
    });
  }

  const final = [...events].reverse().find(e => e.isFinal);
  const text = final?.content?.parts
    ?.map((part: any) => part.text ?? "")
    .join("")
    .trim();

  return {
    mode: "adk",
    answer: text || "O agente executou, mas não retornou texto final.",
    events
  };
}
