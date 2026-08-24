import "dotenv/config";
import { runMockAgent } from "./mock/agent.js";

const cases = [
  {
    id: "rag-01",
    question: "O que é CTR?",
    mustContain: "CTR"
  },
  {
    id: "tool-01",
    question: "Qual a performance da campanha?",
    mustContain: "CTR"
  },
  {
    id: "tool-02",
    question: "Cancele a campanha camp-001",
    mustContain: "cancelada"
  }
];

let passed = 0;

for (const test of cases) {
  const result = await runMockAgent(test.question);
  const ok = result.answer.toLowerCase().includes(test.mustContain.toLowerCase());

  console.log(`${ok ? "PASS" : "FAIL"} ${test.id} — ${test.question}`);

  if (ok) passed++;
}

console.log(`\nEvaluation: ${passed}/${cases.length} (${Math.round((passed / cases.length) * 100)}%)`);
