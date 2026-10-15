# AI Club Assistant — Four-Phase MVP Plan

## Project goal

Build a professional, responsive Coding Club Assistant for college students and club coordinators. The MVP combines a React/Vite interface, a JSON knowledge base, rule-based responses, and live public GitHub repository search. Its response service is isolated so a generative model can be added later through a secure backend.

## Users and outcomes

- **Students getting started:** find a beginner-friendly path, project idea, resource, or club activity.
- **Active club members:** look up coding guidance, events, and repositories to explore.
- **Club coordinators:** maintain clear club facts and demonstrate an extensible assistant.

## Phase 1 — Planning, research, and system design

**Objective:** Define the MVP boundary and the data and interaction contracts before expanding implementation.

### Work

1. Prioritize four flows: ask a question, follow a programming roadmap, choose a project by skill level, and search GitHub.
2. Define navigation for Assistant, Roadmaps, Projects, GitHub Explorer, Events, and club overview.
3. Use a shared visual system: light workspace, navy details, violet accents, readable type, responsive cards, and keyboard-accessible controls.
4. Define JSON schemas:
   - FAQ: `id`, `category`, `keywords`, `answer`.
   - Roadmap: `id`, `name`, `level`, `duration`, ordered `steps`.
   - Project: `title`, `level`, `stack`, `description`.
   - Event: `id`, `title`, `date`, `time`, `place`, `type`, `color`.
5. Define GitHub search behavior: query public repositories, show name/description/language/stars/link, and report empty, rate-limited, and network states.
6. Keep the response contract in a separate service so local matching can be replaced by a backend request without exposing a model key in browser code.

**Deliverables:** this plan, the responsive dashboard interaction map, sample data schemas, the source structure, and research references below.

**Completion criteria:** Core screens, user flows, data fields, and MVP boundaries are explicit.

## Phase 2 — React frontend and interface

**Objective:** Provide a polished interface that adapts to desktop and mobile and makes each feature discoverable.

### Work

1. Use React and Vite with JavaScript and CSS.
2. Build a sidebar, top bar, assistant welcome state, message history, composer, quick prompts, events view, and club overview.
3. Add roadmaps, project idea cards, and GitHub search/results views.
4. Support send by button or Enter, ignore empty input, clear the conversation, and close/open the mobile menu.
5. Show loading and actionable error/empty states. Keep controls labeled and keyboard operable.

**Deliverables:** functional dashboard, chatbot screen, feature navigation, and responsive layouts.

**Completion criteria:** Navigation and primary actions work; each major view renders useful data at desktop and phone widths.

## Phase 3 — Chatbot intelligence and data integration

**Objective:** Make the UI useful with local knowledge and live repository discovery.

### Work

1. Keep FAQ, roadmap, project, and event data in separate JSON files under `src/data/`.
2. Route questions through `src/services/chatbot.js`; match club FAQs, coding-help prompts, roadmap requests, and skill-level project requests, with a useful fallback.
3. Provide ordered starter paths for Python, Java, C++, and web development.
4. Recommend beginner, intermediate, and advanced projects with descriptions and stacks.
5. Search GitHub's public repository API from `src/services/github.js`; display repository metadata and handle rate limits, network failures, empty queries, and no results.
6. Keep generative AI as a future backend integration. Send conversation context to a server-side endpoint only after a provider and secure server configuration are selected; never put a private key in React.

**Deliverables:** JSON-powered answers, roadmap and project recommendations, events, and live GitHub search.

**Completion criteria:** Supported questions produce relevant local responses and GitHub searches show results or a clear recovery message.

## Phase 4 — Testing, optimization, and demonstration

**Objective:** Validate the main experience and prepare a reliable CIE-3 demonstration.

### Work

1. Verify assistant replies, clear chat, quick prompts, navigation, roadmaps, project levels, and event rendering.
2. Try GitHub searches with valid topics, blank input, no results, rate-limit responses, and offline/network failure.
3. Review mobile and desktop layouts, keyboard operation, accessible labels, focus visibility, and empty/error states.
4. Keep personal data collection out of scope; protect future AI credentials on a backend.
5. Document local setup, features, architecture, known limits, and the demo sequence.
6. Run the app locally before presenting; deployment remains optional.

**Deliverables:** checked MVP, setup documentation, and a repeatable demo workflow.

**Completion criteria:** Core user flows work without blocking errors, and presenters can explain the local-response approach, live GitHub integration, limitations, and future AI path.

## Recommended demonstration

1. Ask for a Python roadmap and explain the ordered learning steps.
2. Ask for a beginner project and discuss its stack and scope.
3. Search GitHub for `react` or `python` and inspect stars, language, description, and link.
4. Open Events & workshops and show the club schedule.
5. Ask an unsupported question to demonstrate the fallback.

## Current MVP boundary

**Included:** responsive React dashboard, JSON FAQ/roadmaps/projects/events, keyword-based chatbot, skill-level recommendations, and public GitHub search.

**Future work:** generative AI through a secured backend, persistent chat history, sign-in, coordinator content management, and deployment.

**Content note:** the club contact, meetup details, and event entries are sample data. Replace them with coordinator-approved information before sharing the app as an official club source.

## Research references

- [React Quick Start](https://react.dev/learn): components, state, and event handling.
- [Vite Guide](https://vite.dev/guide/): frontend development server and production build workflow.
- [GitHub REST API — Search repositories](https://docs.github.com/en/rest/search/search#search-repositories): public repository search and result fields.
- [assistant-ui](https://github.com/assistant-ui/assistant-ui): an open-source example of composable React chat UI patterns; used as inspiration, not as an app dependency.
