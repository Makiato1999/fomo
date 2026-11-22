import { NextResponse } from "next/server";
import { termGenerationRequestSchema } from "@/lib/term-generation";
import { getAIProviderConfig } from "@/server/ai/provider-config";
import { researchTerm } from "@/server/ai/term-research";

export const runtime = "nodejs";
export const maxDuration = 120;

function isCapabilityCompatibilityError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLocaleLowerCase() : "";
  return ["web_search", "json_schema", "text.format", "tool", "unsupported"].some((term) => message.includes(term));
}

function isInvalidStructuredOutputError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLocaleLowerCase() : "";
  return message.includes("invalid structured output")
    || message.includes("structured output schema mismatch")
    || message.includes("error reading response");
}

export async function POST(request: Request) {
  if (!getAIProviderConfig()) {
    return NextResponse.json({
      error: {
        code: "CONFIGURATION_REQUIRED",
        message: "服务端尚未配置 AIHUBMIX_API_KEY，请在 .env.local 中配置后重启开发服务器。",
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
    if (isInvalidStructuredOutputError(error)) {
      return NextResponse.json({
        error: {
          code: "STRUCTURED_OUTPUT_INVALID",
          message: "模型返回的节点结构不完整，未通过严格字段校验。现有图谱没有被修改。",
        },
      }, { status: 422 });
    }
    if (isCapabilityCompatibilityError(error)) {
      return NextResponse.json({
        error: {
          code: "MODEL_CAPABILITY_UNSUPPORTED",
          message: "当前 AIHubMix 模型未接受联网搜索或结构化输出参数。为避免生成无来源节点，本次没有写入图谱。",
        },
      }, { status: 422 });
    }
    return NextResponse.json({
      error: {
        code: "RESEARCH_FAILED",
        message: "联网研究未能完成，请稍后重试。现有图谱数据没有被修改。",
      },
    }, { status: 502 });
  }
}
