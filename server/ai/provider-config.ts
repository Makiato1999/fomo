export type AIProviderConfig = {
  apiKey: string;
  baseURL: string | undefined;
  model: string;
  providerName: "AIHubMix" | "OpenAI";
};

export function getAIProviderConfig(): AIProviderConfig | null {
  if (process.env.AIHUBMIX_API_KEY) {
    return {
      apiKey: process.env.AIHUBMIX_API_KEY,
      baseURL: process.env.AIHUBMIX_BASE_URL ?? "https://api.inferera.com/v1",
      model: process.env.AIHUBMIX_MODEL ?? "gpt-5.6-luna",
      providerName: "AIHubMix",
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      providerName: "OpenAI",
    };
  }

  return null;
}
