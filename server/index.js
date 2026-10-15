import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createOpenAIChatService } from './openaiChat.js';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });
const port = Number(process.env.PORT) || 3001;
const app = createApp({ chatService: createOpenAIChatService() });
app.listen(port, '127.0.0.1', () => console.log(`CodeClub AI backend listening on http://127.0.0.1:${port}`));
