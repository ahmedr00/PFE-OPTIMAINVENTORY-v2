const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

const buildPrompt = (stats) => `
Tu es un assistant inventaire Optima Inventory.
Analyse ces statistiques et retourne uniquement un JSON valide:
{
  "summary": "string court",
  "topAnomalies": ["string", "string", "string"],
  "recommendedActions": ["string", "string", "string"]
}

Données:
${JSON.stringify(stats, null, 2)}
`.trim();

const heuristicInsights = (stats) => {
  const missing = stats?.statusCounts?.missing || 0;
  const excess = stats?.statusCounts?.excess || 0;
  const conform = stats?.statusCounts?.conform || 0;
  const total = stats?.totals?.articles || 0;

  return {
    summary: `Sur ${total} articles, ${conform} conformes, ${missing} manquants et ${excess} excédents.`,
    topAnomalies: [
      missing > 0 ? `${missing} articles en manquant détectés.` : "Aucun manquant critique.",
      excess > 0 ? `${excess} articles en excédent détectés.` : "Aucun excédent significatif.",
      `Taux de conformité: ${total ? Math.round((conform / total) * 100) : 0}%.`,
    ],
    recommendedActions: [
      "Prioriser un recomptage des zones avec écarts négatifs.",
      "Valider les excédents avec l’équipe logistique avant push Sage.",
      "Lancer un contrôle ciblé sur les articles à fort écart absolu.",
    ],
  };
};

export const generateInventoryInsights = async (stats) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: buildPrompt(stats),
        stream: false,
      }),
    });

    if (!response.ok) {
      return {
        provider: "heuristic",
        model: "fallback",
        insights: heuristicInsights(stats),
      };
    }

    const data = await response.json();
    const raw = data?.response || "";

    const parsed = JSON.parse(raw);
    return {
      provider: "ollama",
      model: OLLAMA_MODEL,
      insights: parsed,
    };
  } catch (err) {
    return {
      provider: "heuristic",
      model: "fallback",
      insights: heuristicInsights(stats),
    };
  }
};

