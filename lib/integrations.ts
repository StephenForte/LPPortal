import { env } from "cloudflare:workers";

type RuntimeEnv = { PIPEDRIVE_API_TOKEN?: string; ANTHROPIC_API_KEY?: string };
const runtime = env as unknown as RuntimeEnv;

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Integration request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function pullPipedrive(orgId?: string | null, dealId?: string | null) {
  if (!runtime.PIPEDRIVE_API_TOKEN) throw new Error("Pipedrive is not configured");
  if (!orgId && !dealId) throw new Error("No Pipedrive record is linked");
  const base = "https://api.pipedrive.com/v1";
  const token = encodeURIComponent(runtime.PIPEDRIVE_API_TOKEN);
  const [organization, activities, deal, notes] = await Promise.all([
    orgId ? jsonFetch(`${base}/organizations/${encodeURIComponent(orgId)}?api_token=${token}`) : Promise.resolve(undefined),
    orgId ? jsonFetch(`${base}/organizations/${encodeURIComponent(orgId)}/activities?api_token=${token}`) : Promise.resolve(undefined),
    dealId ? jsonFetch(`${base}/deals/${encodeURIComponent(dealId)}?api_token=${token}`) : Promise.resolve(undefined),
    dealId ? jsonFetch(`${base}/notes?deal_id=${encodeURIComponent(dealId)}&api_token=${token}`) : Promise.resolve(undefined),
  ]);
  return { organization, activities, deal, notes };
}

export async function askAnthropic(system: string, prompt: string, maxTokens = 700) {
  if (!runtime.ANTHROPIC_API_KEY) throw new Error("Anthropic is not configured");
  const result = await jsonFetch<{ content?: Array<{ type: string; text?: string }>; usage?: { input_tokens?: number; output_tokens?: number } }>("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": runtime.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-3-5-haiku-latest", max_tokens: Math.min(maxTokens, 900), system, messages: [{ role: "user", content: prompt }] }),
  });
  return { text: result.content?.find(part => part.type === "text")?.text ?? "", usage: result.usage };
}
