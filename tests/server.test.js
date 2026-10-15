import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../server/app.js';
import { CODECLUB_INSTRUCTIONS, createOpenAIChatService } from '../server/openaiChat.js';

async function withServer(app, run) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try { await run(`http://127.0.0.1:${port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test('health reports configuration without disclosing secrets', async () => {
  await withServer(createApp({ chatService: async () => 'ok' }), async (base) => {
    const response = await fetch(`${base}/api/health`);
    assert.deepEqual(await response.json(), { status: 'ok', aiConfigured: true });
  });
});

test('chat rejects malformed and oversized histories before calling AI', async () => {
  let calls = 0;
  await withServer(createApp({ chatService: async () => { calls++; return 'ok'; } }), async (base) => {
    for (const messages of [undefined, [], [{ role: 'system', content: 'bad' }], [{ role: 'user', content: ' ' }], [{ role: 'assistant', content: 'latest' }], [{ role: 'user', content: 'x'.repeat(2001) }], Array.from({ length: 11 }, () => ({ role: 'user', content: 'x' }))]) {
      const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
      assert.equal(response.status, 400);
      assert.equal(typeof (await response.json()).error, 'string');
    }
  });
  assert.equal(calls, 0);
});

test('chat passes bounded history to service and returns AI reply', async () => {
  let received;
  await withServer(createApp({ chatService: async (messages) => { received = messages; return 'A Python list is mutable.'; } }), async (base) => {
    const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: ' Explain lists ' }] }) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: 'A Python list is mutable.' });
  });
  assert.deepEqual(received, [{ role: 'user', content: 'Explain lists' }]);
});

test('chat maps provider failures to safe errors and rate-limit status', async () => {
  await withServer(createApp({ chatService: async () => { const error = new Error('secret provider details'); error.status = 429; throw error; } }), async (base) => {
    const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }) });
    assert.equal(response.status, 429);
    const payload = await response.json();
    assert.match(payload.error, /rate-limited/);
    assert.doesNotMatch(JSON.stringify(payload), /secret provider details/);
  });
});

test('Responses API service uses configured model, safe instructions and mock SDK', async () => {
  let request;
  const service = createOpenAIChatService({ apiKey: 'test-key', model: 'test-model', client: { responses: { create: async (value) => { request = value; return { output_text: '  Mocked answer  ' }; } } } });
  assert.equal(await service([{ role: 'user', content: 'Why use functions?' }]), 'Mocked answer');
  assert.equal(request.model, 'test-model');
  assert.equal(request.store, false);
  assert.match(request.instructions, /beginner-friendly/);
  assert.deepEqual(request.input, [{ role: 'user', content: 'Why use functions?' }]);
  assert.match(CODECLUB_INSTRUCTIONS, /coding club/);
});

test('Responses API service handles provider errors and missing configuration', async () => {
  assert.equal(createOpenAIChatService({ apiKey: '', model: 'test-model' }), null);
  const service = createOpenAIChatService({ apiKey: 'test-key', model: 'test-model', client: { responses: { create: async () => { throw new Error('provider down'); } } } });
  await assert.rejects(service([]), /provider down/);
});
