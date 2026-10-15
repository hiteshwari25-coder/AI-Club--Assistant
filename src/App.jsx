import { useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Bot, CalendarDays, ChevronDown, CircleHelp, Compass, Menu, MessageCircle, Plus, Search, Send, Sparkles, X, BookOpen, Code2, GitBranch, Star, ExternalLink } from 'lucide-react';
import events from './data/events.json';
import roadmaps from './data/roadmaps.json';
import projects from './data/projects.json';
import { getLocalFeatureResponse } from './services/chatbot.js';
import { searchRepositories } from './services/github.js';

const suggestions = [
  { icon: BookOpen, label: 'Show me a Python roadmap', prompt: 'Show me the Python roadmap' },
  { icon: Code2, label: 'Suggest a beginner project', prompt: 'Suggest a beginner project' },
  { icon: GitBranch, label: 'Find popular React repos', prompt: 'Search GitHub for React' },
];

function App() {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const sendLockRef = useRef(false);
  const requestIdRef = useRef(0);
  const [input, setInput] = useState('');
  const [activeNav, setActiveNav] = useState('Ask the assistant');
  const [menuOpen, setMenuOpen] = useState(false);
  const [repoQuery, setRepoQuery] = useState('react');
  const [repos, setRepos] = useState([]);
  const [repoState, setRepoState] = useState('idle');
  const [repoError, setRepoError] = useState('');

  async function runRepoSearch(query = repoQuery) {
    if (!query.trim()) { setRepoError('Enter a topic or language to search.'); setRepoState('error'); return; }
    setRepoQuery(query); setRepoState('loading'); setRepoError('');
    try { setRepos(await searchRepositories(query)); setRepoState('done'); }
    catch (error) { setRepoError(error.message); setRepoState('error'); }
  }
  async function sendMessage(value = input) {
    const question = value.trim(); if (!question || sendLockRef.current) return;
    sendLockRef.current = true;
    const requestId = ++requestIdRef.current;
    setActiveNav('Ask the assistant');
    const searchIntent = /\b(search|find|show me|explore)\b.*\b(github|repos?|repositories)\b|\b(github|repos?|repositories)\b.*\b(search|for|popular|top)\b/i.test(question);
    if (searchIntent) {
      const query = question.replace(/\b(search|find|show me|explore|github|repositories|repository|repos|repo|for|popular|top)\b/gi, '').trim();
      runRepoSearch(query);
    }
    setInput('');
    const userMessage = { role: 'user', text: question };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setIsSending(true);
    try {
      const localResponse = getLocalFeatureResponse(question);
      let answer = localResponse;
      if (!answer) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversation.filter((item) => !item.transient).slice(-10).map(({ role, text }) => ({ role, content: text })) }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'The assistant could not answer right now.');
        answer = payload.reply;
      }
      if (requestIdRef.current === requestId) setMessages((current) => [...current, { role: 'assistant', text: answer }]);
    } catch (error) {
      if (requestIdRef.current === requestId) setMessages((current) => [...current, { role: 'assistant', text: error.message || 'I couldn’t reach the AI assistant. Check the backend configuration and try again.', transient: true }]);
    } finally {
      if (requestIdRef.current === requestId) { sendLockRef.current = false; setIsSending(false); }
    }
  }
  function newChat() { requestIdRef.current += 1; sendLockRef.current = false; setIsSending(false); setMessages([]); setActiveNav('Ask the assistant'); }
  const navItems = [[MessageCircle, 'Ask the assistant'], [BookOpen, 'Learning roadmaps'], [Code2, 'Project ideas'], [GitBranch, 'GitHub explorer'], [CalendarDays, 'Events & workshops'], [Compass, 'Explore the club']];

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Sparkles size={19} strokeWidth={2.4} /></div><span className="brand-name">CodeClub<span> AI</span></span><button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
      <div className="club-selector"><div className="club-avatar">AI</div><div className="club-meta"><strong>AI Club</strong><small>Student community</small></div><ChevronDown size={16} className="muted-icon" /></div>
      <button className="new-chat" onClick={newChat}><Plus size={17} /> New conversation <span>⌘ K</span></button>
      <div className="nav-label">WORKSPACE</div><nav className="main-nav">{navItems.map(([Icon, label]) => <button key={label} className={`nav-item ${activeNav === label ? 'nav-active' : ''}`} onClick={() => { setActiveNav(label); setMenuOpen(false); }}><Icon size={17} />{label}{label === 'Events & workshops' && <span className="nav-count">3</span>}</button>)}</nav>
      <div className="sidebar-spacer" /><div className="sidebar-tip"><div className="tip-icon"><Sparkles size={15} /></div><strong>Curiosity looks good on you.</strong><p>New to coding? You’re in exactly the right place.</p><button onClick={() => sendMessage('Do I need experience to join?')}>Meet the club <ArrowUpRight size={14} /></button></div>
      <button className="profile-button"><div className="profile-avatar">S</div><div className="profile-meta"><strong>Student member</strong><small>Free account</small></div><span className="profile-dots">···</span></button>
    </aside>
    <main className="main-panel">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={19} /></button><div className="breadcrumb">AI Club <span>/</span> <strong>{activeNav}</strong></div><div className="topbar-right"><div className="online-dot" /> <span>Club assistant online</span><button className="help-button" title="Help"><CircleHelp size={17} /></button></div></header>
      {activeNav === 'Events & workshops' ? <EventsView /> : activeNav === 'Explore the club' ? <ExploreView onAsk={sendMessage} /> : activeNav === 'Learning roadmaps' ? <RoadmapsView /> : activeNav === 'Project ideas' ? <ProjectsView /> : activeNav === 'GitHub explorer' ? <GitHubView query={repoQuery} setQuery={setRepoQuery} onSearch={runRepoSearch} repos={repos} state={repoState} error={repoError} /> : <section className="conversation-area">{messages.length === 0 ? <div className="welcome-content"><div className="welcome-eyebrow"><span className="eyebrow-line" /> YOUR AI CLUB COMPANION <span className="eyebrow-line" /></div><div className="bot-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="bot-core"><Bot size={31} strokeWidth={1.7} /></div><span className="orbit-spark spark-a">✳</span><span className="orbit-spark spark-b">✦</span></div><h1>Good ideas start<br />with <em>a question.</em></h1><p className="welcome-copy">Your friendly coding mentor, ready to help.<br />Explore roadmaps, projects, GitHub, or club events.</p><div className="suggestion-grid">{suggestions.map(({ icon: Icon, label, prompt }) => <button className="suggestion-card" key={label} onClick={() => sendMessage(prompt)}><span className="suggestion-icon"><Icon size={17} /></span><span>{label}</span><ArrowUpRight size={15} className="suggestion-arrow" /></button>)}</div><div className="club-status"><span className="status-pulse" /> Sample meetup <strong>Wednesday, 4:00 PM</strong><span className="status-divider">·</span> Innovation Lab</div></div> : <div className="chat-thread">{messages.map((message, index) => <div key={index} className={`message-row ${message.role}`}><div className="message-avatar">{message.role === 'assistant' ? <Sparkles size={15} /> : 'S'}</div><div className="message-body"><span className="message-name">{message.role === 'assistant' ? 'CodeClub AI' : 'You'}</span><div className={`message-bubble ${message.transient ? 'error-bubble' : ''}`}>{message.text}</div></div></div>)}{isSending && <div className="assistant-loading" role="status">CodeClub AI is thinking…</div>}<button className="back-to-start" onClick={newChat}><ArrowDownLeft size={14} /> Start a fresh conversation</button></div>}</section>}
      <div className="composer-wrap"><div className="composer"><textarea aria-label="Ask the AI Club assistant" placeholder="Ask about coding, roadmaps, projects, or club events..." value={input} rows={1} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} /><div className="composer-actions"><div className="composer-hint"><span className="sparkle-small">✳</span> AI answers with local club knowledge for roadmaps and projects</div><button className="send-button" disabled={!input.trim() || isSending} onClick={() => sendMessage()} aria-label="Send message"><Send size={16} /></button></div></div><div className="composer-footnote">AI assistant · GitHub results are fetched live</div></div>
    </main>
      <aside className="right-rail"><div className="rail-heading"><span>YOUR CLUB</span><button className="icon-button" aria-label="Search"><Search size={16} /></button></div><div className="rail-club-card"><div className="rail-club-art"><div className="art-orbit art-one" /><div className="art-orbit art-two" /><div className="art-star">✳</div><div className="art-label">AI<br />CLUB</div></div><div className="rail-card-info"><span className="member-pill"><span /> OPEN TO ALL</span><h3>Curiosity meets<br />creation.</h3><p>A place to explore, experiment, and build with AI.</p><button onClick={() => setActiveNav('Explore the club')}>Explore the club <ArrowUpRight size={14} /></button></div></div><div className="rail-section"><div className="rail-section-head"><h3>Sample events</h3><button onClick={() => setActiveNav('Events & workshops')}>See all</button></div>{events.slice(0, 2).map((event) => <div className="mini-event" key={event.title}><div className={`event-date ${event.color}`}><strong>{event.date.split(' ')[1]}</strong><small>{event.date.split(' ')[0].toUpperCase()}</small></div><div className="mini-event-info"><strong>{event.title}</strong><span>{event.time} <i>·</i> {event.place}</span></div></div>)}</div><div className="rail-section meetup-section"><div className="rail-section-head"><h3>Sample meetup</h3><span className="recurring-tag">SAMPLE</span></div><div className="meetup-box"><div className="meetup-icon"><CalendarDays size={17} /></div><div><strong>Wednesdays · 4:00 PM</strong><span>Innovation Lab, Block C</span></div></div></div><div className="rail-footer"><span>Made for curious minds</span><span>✳</span></div></aside>
  </div>;
}

function RoadmapsView() { return <section className="secondary-view"><div className="section-kicker">LEARN STEP BY STEP</div><h1>Choose your <em>path.</em></h1><p className="secondary-copy">Practical starter roadmaps to turn curiosity into skills. Move at your own pace.</p><div className="content-grid">{roadmaps.map((map) => <article className="content-card" key={map.id}><div className="content-card-top"><span className={`topic-icon ${map.color}`}><BookOpen size={17} /></span><span className="level-pill">{map.level} · {map.duration}</span></div><h2>{map.name}</h2><ol>{map.steps.map((step) => <li key={step}>{step}</li>)}</ol></article>)}</div></section>; }
function ProjectsView() { return <section className="secondary-view"><div className="section-kicker">MAKE YOUR NEXT THING</div><h1>Project <em>ideas.</em></h1><p className="secondary-copy">Pick an idea that fits where you are today. Every project is a chance to learn by building.</p><div className="content-grid">{projects.map((project) => <article className="content-card project-card" key={project.title}><div className="content-card-top"><span className="topic-icon violet"><Code2 size={17} /></span><span className="level-pill">{project.level}</span></div><h2>{project.title}</h2><p>{project.description}</p><span className="stack-label">{project.stack}</span></article>)}</div></section>; }
function GitHubView({ query, setQuery, onSearch, repos, state, error }) { return <section className="secondary-view"><div className="section-kicker">DISCOVER OPEN SOURCE</div><h1>GitHub <em>explorer.</em></h1><p className="secondary-copy">Search public repositories by language, framework, or topic. Results come from GitHub.</p><form className="repo-search" onSubmit={(event) => { event.preventDefault(); onSearch(); }}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Python, React, machine learning..." /><button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Searching…' : 'Search'}</button></form>{state === 'error' && <p className="repo-error" role="alert">{error}</p>}{state === 'done' && repos.length === 0 && <p className="secondary-copy">No repositories found. Try another search.</p>}<div className="repo-grid">{repos.map((repo) => <article className="content-card repo-card" key={repo.id}><div className="content-card-top"><GitBranch size={18} /><span className="repo-stars"><Star size={13} /> {repo.stargazers_count.toLocaleString()}</span></div><h2>{repo.full_name}</h2><p>{repo.description || 'No description provided.'}</p><div className="repo-meta"><span>{repo.language || 'Mixed'}</span><a href={repo.html_url} target="_blank" rel="noreferrer" aria-label={`Open ${repo.full_name} on GitHub`}><ExternalLink size={15} /></a></div></article>)}</div></section>; }
function EventsView() { return <section className="secondary-view"><div className="section-kicker">MAKE SOMETHING TOGETHER</div><h1>Events & <em>workshops.</em></h1><p className="secondary-copy">Low pressure, hands-on, and open to everyone.</p><div className="sample-notice">Sample event schedule · Confirm dates and details with a club organizer.</div><div className="event-list">{events.map((event, index) => <article className="event-card" key={event.id}><div className={`event-date large ${event.color}`}><strong>{event.date.split(' ')[1]}</strong><small>{event.date.split(' ')[0].toUpperCase()}</small></div><div className="event-details"><span className="event-type">{event.type} <span>·</span> Sample</span><h2>{event.title}</h2><p>{event.time} <span>·</span> {event.place}</p></div><div className="event-number">0{index + 1}</div></article>)}</div></section>; }
function ExploreView({ onAsk }) { return <section className="secondary-view explore-view"><div className="section-kicker">A PLACE TO FIND YOUR PEOPLE</div><h1>Curiosity meets <em>creation.</em></h1><p className="secondary-copy">The AI Club is a student community for learning by doing. No gatekeeping, no experience required — just bring an idea and we’ll build from there.</p><div className="explore-cards"><article><span>01 / LEARN</span><h2>Start wherever you are.</h2><p>Friendly sessions make big ideas approachable, from your first prompt to your first model.</p></article><article><span>02 / BUILD</span><h2>Turn ideas into things.</h2><p>Collaborate on playful projects and get unstuck with support from the community.</p></article><article><span>03 / SHARE</span><h2>Make room for everyone.</h2><p>Show your work, learn from each other, and help shape what the club becomes.</p></article></div><button className="explore-cta" onClick={() => onAsk('How can I join the AI Club?')}>Ask how to join <ArrowUpRight size={16} /></button></section>; }

export default App;
