import { getChatGPTUser } from "../../../chatgpt-auth";
import { pullPipedrive } from "../../../../lib/integrations";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, error: "Authentication required" }, { status: 401 });

  try {
    const { orgId, dealId } = await request.json() as { orgId?: string; dealId?: string };
    const payload = await pullPipedrive(orgId, dealId);
    return Response.json({ ok: true, matched: Boolean(payload.organization || payload.deal) });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Connection failed" }, { status: 400 });
  }
}
