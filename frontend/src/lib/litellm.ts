import { ChatOpenAI } from "@langchain/openai";

const liteLlmApiBase =
  process.env.LITELLM_API_BASE ?? "http://localhost:4000/v1";

export function getGroqModel() {
  return new ChatOpenAI({
    configuration: {
      baseURL: liteLlmApiBase,
    },
    modelName: "groq-llama-3.1-70b",
    apiKey: process.env.GROQ_API_KEY || "dummy",
    temperature: 0.2,
  });
}

export function getSynthesizerModel() {
  return new ChatOpenAI({
    configuration: {
      baseURL: liteLlmApiBase,
    },
    modelName: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY || "dummy",
    temperature: 0.3,
  });
}
