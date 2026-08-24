import { documents } from "./knowledge.js";

function tokenize(text: string) {
  return new Set(
    text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\W+/)
      .filter(Boolean)
  );
}

/**
 * RAG didático/local:
 * 1. quebra a pergunta em tokens;
 * 2. pontua documentos por sobreposição;
 * 3. retorna os documentos mais relevantes.
 *
 * Em produção, a etapa de retrieval normalmente usaria embeddings,
 * vector search e/ou reranking.
 */
export function retrieve(query: string, topK = 2) {
  const q = tokenize(query);

  return documents
    .map(doc => {
      const d = tokenize(`${doc.title} ${doc.text}`);
      const score = [...q].filter(token => d.has(token)).length;
      return { ...doc, score };
    })
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
