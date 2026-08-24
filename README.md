# Assist ADK Lab

Um laboratório didático para entender **Google ADK + LLM + RAG + Tools + MCP + Observabilidade + Evaluation**, usando TypeScript/Node.js.

A ideia é ser a continuação do projeto anterior: primeiro você viu como um agente poderia ser montado "na mão"; agora você consegue ver o que um framework de agentes como o **Google ADK** passa a abstrair.

## 1. Rodar sem pagar API

O modo padrão é:

```bash
npm install
cp .env.example .env
npm run dev
```

Abra:

- http://localhost:3000
- http://localhost:3000/adk.html
- http://localhost:3000/dashboard.html

Neste modo:

```env
MOCK_MODE=true
```

Não há chamada para Gemini. RAG, tools e métricas funcionam localmente.

## 2. Onde está o ADK de verdade?

O arquivo principal é:

```text
src/adk/agent.ts
```

Ele usa:

```ts
import {
  LlmAgent,
  FunctionTool,
  InMemoryRunner,
  MCPToolset
} from "@google/adk";
```

E define:

```text
LlmAgent
  ├── Gemini
  ├── FunctionTool: consultar_campanha
  ├── FunctionTool: consultar_metricas
  ├── FunctionTool: cancelar_campanha
  ├── FunctionTool: buscar_conhecimento_globo_ads
  └── MCPToolset (opcional)
```

## 3. RAG

O RAG local está em:

```text
src/rag/
├── knowledge.ts
└── rag.ts
```

É propositalmente simples. Ele faz uma recuperação local por sobreposição de tokens.

O objetivo é você enxergar a arquitetura:

```text
Pergunta
  ↓
Retriever
  ↓
Documentos relevantes
  ↓
Contexto
  ↓
LLM
```

Em produção, você poderia trocar o retriever por embeddings + vector database + reranking.

## 4. Tools

As tools de negócio estão em:

```text
src/tools/ads-tools.ts
```

Exemplos:

```text
consultarCampanha()
consultarMetricas()
cancelarCampanha()
```

No ADK elas viram `FunctionTool`.

## 5. MCP

O ADK tem integração com MCP através de `MCPToolset`.

Neste projeto:

```ts
const mcpToolset = mcpUrl
  ? new MCPToolset(...)
  : undefined;
```

Então, se `MCP_SERVER_URL` estiver configurado, o agente ADK pode receber tools de um MCP Server.

A intenção é você visualizar:

```text
ADK Agent
    ↓
MCPToolset
    ↓
MCP Server
    ↓
Tools / APIs / RAG
```

## 6. Evaluation

```bash
npm run eval
```

O dataset simples está em:

```text
src/eval.ts
```

Ele testa casos de RAG e tools.

## 7. Usar Gemini de verdade

Quando quiser experimentar o ADK real:

```env
MOCK_MODE=false
GOOGLE_API_KEY=sua_chave
```

Depois:

```bash
npm run dev
```

ou use diretamente a ferramenta oficial do ADK:

```bash
npm run adk:web
```

O ADK para TypeScript também oferece `adk run` e `adk web` para execução/teste local.

## 8. Como estudar este projeto

A ordem que recomendo:

1. `src/adk/agent.ts`
2. `src/tools/ads-tools.ts`
3. `src/rag/rag.ts`
4. `src/observability/metrics.ts`
5. `src/eval.ts`
6. `public/adk.html`

A pergunta que você deve fazer em cada arquivo é:

> "O que eu teria que implementar manualmente se eu não tivesse um framework de agentes?"

Essa comparação é justamente o ponto deste laboratório.

## Nota sobre versão

O projeto usa o pacote TypeScript `@google/adk`. O ADK TypeScript é um toolkit oficial da Google para Node.js/browser, com `LlmAgent`, tools, runners, MCP e uma UI de desenvolvimento. Consulte a documentação oficial antes de rodar em produção, pois o SDK evolui rapidamente.
