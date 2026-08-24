import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runMockAgent } from "./mock/agent.js";
import { getMetrics, getRecentEvents } from "./observability/metrics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message || "").trim();

  if (!message) {
    return res.status(400).json({ error: "message é obrigatório" });
  }

  // Zero-cost by default.
  // The real ADK agent is kept in src/adk/agent.ts and can be run
  // with the official ADK dev UI or by switching the project to real mode.
  if (process.env.MOCK_MODE !== "false") {
    return res.json(await runMockAgent(message));
  }

  try {
    const { runAdkAgent } = await import("./adk/agent.js");
    return res.json(await runAdkAgent(message));
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Falha ao executar o agente ADK",
      detail: String(error)
    });
  }
});

app.get("/api/metrics", (_req, res) => {
  res.json(getMetrics());
});

app.get("/api/events", (_req, res) => {
  res.json(getRecentEvents());
});

app.listen(port, () => {
  console.log(`Ada Assist ADK Lab: http://localhost:${port}`);
  console.log(`Modo: ${process.env.MOCK_MODE === "false" ? "ADK REAL" : "MOCK (sem custo de API)"}`);
});
