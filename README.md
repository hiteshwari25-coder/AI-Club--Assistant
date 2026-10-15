# CodeClub AI — AI Club Assistant

A responsive React + Vite assistant for coding club members. It combines generative coding help through a private Node.js backend with local JSON roadmaps, project suggestions, club FAQs and sample events, plus live public GitHub repository search.

## Requirements

- Node.js 20 or newer and npm
- An OpenAI API key and a model ID enabled for your account for generative answers

## Setup and run

Install project dependencies once:

```bash
npm install
```

Copy `server/.env.example` to `server/.env`, then set the credentials locally:

```dotenv
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=your_available_model_id
```

Choose a model ID available to your OpenAI account. The model is configurable; this project does not assume a particular model is enabled. Keep the key in `server/.env`, never in a `VITE_` variable or React source.

Run the backend and frontend in separate terminals from the project root:

```bash
npm run dev:server
```

```bash
npm run dev
```

Open the Vite URL printed in the frontend terminal. The Vite development proxy forwards `/api/*` requests to the local backend at `127.0.0.1:3001`; React does not need a public backend URL. `GET /api/health` returns backend status and whether AI is configured, without revealing credentials. Without a key/model, the UI and local features still work, while general AI requests show a configuration error.

## Features

- **AI assistant:** general coding questions use the OpenAI JavaScript SDK and Responses API via the Express backend. Recent role/content history is limited to ten messages; request text is capped at 2,000 characters per message.
- **Local knowledge:** FAQs, Python/Java/C++/web roadmaps, project recommendations, and sample events remain backed by local JSON and do not require a model call.
- **GitHub Explorer:** searches public repositories using GitHub's API and handles empty results, rate limits, and network errors.
- **Dashboard:** responsive navigation, chat history, quick prompts, and the existing CodeClub AI visual design.

## Tests and production build

```bash
npm test
npm run build
```

Backend tests use a mocked Responses API client and do not make paid model calls. The UI's direct generative path requires the backend and valid credentials for manual end-to-end verification.

## Security and limitations

- `.env` files are ignored by Git. Never commit `server/.env`, paste keys into chat, or expose them in browser code.
- The backend validates request shape, bounds history and content, disables response storage for model calls, and returns safe provider errors. It listens on loopback by default for local development.
- Model availability and account quota depend on your OpenAI account. A real provider request has not been verified unless separately run with your own valid credentials.
- Local events and meetup details are sample data, not verified club announcements. Confirm details with a club coordinator.
- GitHub's unauthenticated API has rate limits. The current app has no authentication or persistent chat storage. The local backend is an MVP and would need production deployment controls (HTTPS, authentication, rate limiting, and monitoring) before public exposure.

## Structure

```text
server/                  Express API and OpenAI Responses service
src/data/                JSON knowledge base
src/services/            Local chatbot routing and GitHub API
src/App.jsx              Existing dashboard and chat UI
tests/                   Local chatbot, GitHub and mocked backend tests
vite.config.js           Local API proxy
```

See [MVP_PLAN.md](./MVP_PLAN.md) for the four-phase project plan.
