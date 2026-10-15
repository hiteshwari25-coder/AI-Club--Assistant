import OpenAI from 'openai';

export const CODECLUB_INSTRUCTIONS = `You are CodeClub AI, a friendly mentor for college coding club members. Explain programming concepts accurately in beginner-friendly language. Give a small example when useful, define unfamiliar terms, and break multi-step solutions into clear steps. Ask a brief clarifying question when the problem is underspecified. Do not claim club events, schedules, or policies are verified; those come from the app's local sample data. Never request passwords, API keys, or other secrets. If asked about something outside coding or the club, respond briefly and steer back to learning, projects, and programming.`;

export function createOpenAIChatService({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL, client } = {}) {
  if (!apiKey || !model) return null;
  const openai = client ?? new OpenAI({ apiKey, timeout: 20_000, maxRetries: 1 });
  return async (messages) => {
    const response = await openai.responses.create({
      model,
      instructions: CODECLUB_INSTRUCTIONS,
      input: messages,
      max_output_tokens: 700,
      store: false,
    });
    const reply = response.output_text?.trim();
    if (!reply) throw new Error('The AI service returned an empty response.');
    return reply;
  };
}
