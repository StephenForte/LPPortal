import { askAnthropic } from "../../../../lib/integrations";

export async function POST(request: Request) {
  try {
    const { company, context, styleGuide } = await request.json() as { company?: string; context?: string; styleGuide?: string };
    if (!company || !context) return Response.json({ error: "Company and context are required" }, { status: 400 });
    const result = await askAnthropic(
      `You draft factual quarterly portfolio updates for LPs. Follow this style guide exactly:\n${styleGuide || "Clear, restrained, factual, 70-100 words."}\nNever invent facts. Return only the editable blurb.`,
      `Company: ${company}\nRecent CRM context:\n${context}`,
      500,
    );
    return Response.json({ draft: result.text, usage: result.usage });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Drafting failed" }, { status: 503 });
  }
}
