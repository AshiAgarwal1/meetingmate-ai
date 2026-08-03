// Splits markdown like "## 1. Summary\n...text...\n## 2. Action Items\n..."
// into [{ title: "Summary", content: "...text..." }, ...]

function cleanTitle(rawTitle) {
  return rawTitle
    .replace(/\*\*/g, "")       // strip bold markers (**)
    .replace(/^\d+\.\s*/, "")   // strip leading numbering like "1. "
    .trim();
}

export function parseSections(markdown) {
  if (!markdown) return [];

  const lines = markdown.split("\n");
  const sections = [];
  let current = null;
  const headingRegex = /^#{1,6}\s*(?:\d+\.\s*)?(.+)$/;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      if (current) sections.push(current);
      current = { title: cleanTitle(match[1]), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);

  // Fallback: if Gemini didn't use headers at all, show everything as one card
  if (sections.length === 0 && markdown.trim()) {
    return [{ title: "Analysis", content: markdown }];
  }

  return sections;
}

// Maps a section title to an icon + pastel color theme for its card
export function getSectionStyle(title) {
  const t = title.toLowerCase();
  if (t.includes("summary")) return { icon: "📋", className: "card-blue" };
  if (t.includes("minutes")) return { icon: "📝", className: "card-purple" };
  if (t.includes("action")) return { icon: "✅", className: "card-green" };
  if (t.includes("decision")) return { icon: "👑", className: "card-amber" };
  if (t.includes("risk")) return { icon: "⚠️", className: "card-red" };
  if (t.includes("question")) return { icon: "❓", className: "card-purple" };
  if (t.includes("next step")) return { icon: "🚀", className: "card-blue" };
  return { icon: "📌", className: "card-neutral" };
}