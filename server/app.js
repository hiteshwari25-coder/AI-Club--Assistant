import express from 'express';

const MAX_MESSAGES = 10;
const MAX_CONTENT_LENGTH = 2000;

function validateMessages(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Array.isArray(body.messages)) return 'Send a messages array.';
  const { messages } = body;
  if (messages.length < 1 || messages.length > MAX_MESSAGES) return `Conversation history must contain 1 to ${MAX_MESSAGES} messages.`;
  for (const message of messages) {
    if (!message || typeof message !== 'object' || !['user', 'assistant'].includes(message.role)) return 'Each message must have a user or assistant role.';
    if (typeof message.content !== 'string' || !message.content.trim()) return 'Each message must include non-empty text.';
    if (message.content.length > MAX_CONTENT_LENGTH) return `Each message must be ${MAX_CONTENT_LENGTH} characters or fewer.`;
  }
  if (messages.at(-1).role !== 'user') return 'The latest message must be from the user.';
  return null;
}

export function createApp({ chatService = null } = {}) {
  const app = express();
  app.use(express.json({ limit: '24kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', aiConfigured: Boolean(chatService) }));
  app.post('/api/chat', async (req, res) => {
    const validationError = validateMessages(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    if (!chatService) return res.status(503).json({ error: 'AI is not configured. Add OPENAI_API_KEY and OPENAI_MODEL to server/.env.' });
    try {
      const messages = req.body.messages.map(({ role, content }) => ({ role, content: content.trim() }));
      const reply = await chatService(messages);
      return res.json({ reply });
    } catch (error) {
      const status = error?.status === 429 ? 429 : 502;
      return res.status(status).json({ error: status === 429 ? 'The AI service is rate-limited. Please try again shortly.' : 'The AI service could not complete your request. Please try again.' });
    }
  });
  app.use((error, _req, res, _next) => {
    if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Request body must be valid JSON.' });
    return res.status(500).json({ error: 'Unexpected server error.' });
  });
  return app;
}
