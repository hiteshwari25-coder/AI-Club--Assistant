import faqs from '../data/faqs.json' with { type: 'json' };
import roadmaps from '../data/roadmaps.json' with { type: 'json' };
import projects from '../data/projects.json' with { type: 'json' };
import codingTopics from '../data/codingTopics.json' with { type: 'json' };

const normalize = (text) => text.toLowerCase().replace(/[’']/g, "'").replace(/[^\p{L}\p{N}+#.\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
const containsPhrase = (text, phrase) => new RegExp(`(^|[^\\p{L}\\p{N}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}($|[^\\p{L}\\p{N}])`, 'u').test(text);

function matchTopic(text) {
  const priority = ['linked-list', 'arrays', 'loops', 'functions', 'oop', 'github', 'git', 'python', 'java'];
  const matches = codingTopics
    .flatMap((topic) => topic.keywords.map((keyword) => ({ topic, keyword })))
    .filter(({ keyword }) => containsPhrase(text, normalize(keyword)))
    .sort((a, b) => priority.indexOf(a.topic.id) - priority.indexOf(b.topic.id) || b.keyword.length - a.keyword.length);
  return matches[0]?.topic;
}

function roadmapAnswer(roadmap) {
  return `${roadmap.name} learning roadmap (${roadmap.duration}): ${roadmap.steps.map((step, index) => `${index + 1}. ${step}`).join('  •  ')}`;
}

function projectAnswer(text) {
  const level = /\b(advanced|hard|challenging)\b/.test(text) ? 'Advanced'
    : /\b(intermediate|medium)\b/.test(text) ? 'Intermediate' : 'Beginner';
  const picks = projects.filter((project) => project.level === level).slice(0, 3);
  if (!picks.length) return 'I don’t have project ideas for that level yet. Try beginner, intermediate, or advanced.';
  return `${level} project ideas: ${picks.map((project) => `${project.title} (${project.stack}) — ${project.description}`).join('  •  ')}`;
}

function matchFaq(text) {
  const faqIntents = [
    { test: /\b(join|membership|sign up|become a member)\b/, id: 'faq-join' },
    { test: /\b(events?|workshops?|calendar|what's happening|what is happening|next event)\b/, id: 'faq-events' },
    { test: /\b(meeting|meetup|location|where does the club|where do we meet|when do we meet|what time do we meet)\b/, id: 'faq-meeting' },
    { test: /\b(beginner|experience|new to coding|no experience)\b/, id: 'faq-beginner' },
    { test: /\b(contact|email|organizer)\b/, id: 'faq-contact' },
  ];
  const intent = faqIntents.find(({ test }) => test.test(text));
  return intent ? faqs.find((faq) => faq.id === intent.id)?.answer : null;
}

// JSON-backed intents stay local to avoid model calls for club facts and structured recommendations.
export function getLocalFeatureResponse(input) {
  const text = normalize(String(input ?? ''));
  if (!text) return null;

  const requestedRoadmap = /\b(roadmap|learning path|study plan|learn|learning|start with|where do i start)\b/.test(text);
  if (requestedRoadmap) {
    const roadmap = roadmaps.find((item) => containsPhrase(text, normalize(item.name))
      || (item.id === 'cpp' && /\bc\+\+\b|\bcpp\b/.test(text))
      || (item.id === 'web' && /\b(web|html|css|javascript)\b/.test(text)));
    if (roadmap) return roadmapAnswer(roadmap);
    if (/\b(roadmap|learning path|study plan)\b/.test(text)) return `Available roadmaps: ${roadmaps.map((item) => item.name).join(', ')}. Tell me which one you want to follow.`;
  }

  if (/\b(project ideas?|coding projects?)\b|\b(suggest|recommend|give me|show me|find)\b.{0,35}\bproject\b|\bwhat should i build\b/.test(text)) return projectAnswer(text);

  return matchFaq(text);
}

// Kept as an offline fallback and for local-only clients.
export function getChatbotResponse(input) {
  const text = normalize(String(input ?? ''));
  if (!text) return 'Type a question about coding, roadmaps, projects, GitHub, or club activities and I’ll help.';
  const featureResponse = getLocalFeatureResponse(text);
  if (featureResponse) return featureResponse;

  const topic = matchTopic(text);
  if (topic) return topic.answer;
  if (/\b(roadmap|learning path|study plan)\b/.test(text)) return `I can suggest roadmaps for ${roadmaps.map((item) => item.name).join(', ')}. Which topic are you learning?`;
  if (/\b(project|ideas|build)\b/.test(text)) return 'I can suggest beginner, intermediate, or advanced project ideas. Tell me your skill level and preferred language.';
  if (/\b(python|java|c\+\+|cpp|javascript|html|css|programming|coding|debug|error)\b/.test(text)) return 'I can help with Python, Java, arrays, linked lists, loops, functions, OOP, and Git/GitHub. What concept or error are you working on?';
  return 'I’m not sure how to answer that yet. Ask me about Python, Java, arrays, linked lists, loops, functions, OOP, Git/GitHub, project ideas, learning roadmaps, or AI Club events.';
}
