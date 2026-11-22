import { NextResponse } from "next/server";
import { termGenerationRequestSchema } from "@/lib/term-generation";
import { researchTerm } from "@/server/ai/term-research";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: {
        code: "CONFIGURATION_REQUIRED",
        message: "服务端尚未配置 OPENAI_API_KEY，请在 .env.local 中配置后重启开发服务器。",
      },
    }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "请求不是有效的 JSON。" } }, { status: 400 });
  }

  const parsed = termGenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: {
        code: "INVALID_REQUEST",
        message: parsed.error.issues[0]?.message ?? "术语请求格式不正确。",
      },
    }, { status: 400 });
  }

  try {
    return NextResponse.json(await researchTerm(parsed.data));
  } catch (error) {
    console.error("Term research failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({
      error: {
        code: "RESEARCH_FAILED",
        message: "联网研究未能完成，请稍后重试。现有图谱数据没有被修改。",
      },
    }, { status: 502 });
  }
}
