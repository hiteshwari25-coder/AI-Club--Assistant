import test from 'node:test';
import assert from 'node:assert/strict';
import { searchRepositories } from '../src/services/github.js';

const originalFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = originalFetch; });

test('rejects empty queries before making a request', async () => {
  globalThis.fetch = () => { throw new Error('fetch should not be called'); };
  await assert.rejects(searchRepositories('  '), /Enter a topic or language/);
});

test('searches the public GitHub repository API and returns its items', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({ items: [{ id: 1, full_name: 'facebook/react' }] }), { status: 200 });
  };
  const items = await searchRepositories('react hooks');
  assert.match(requestedUrl, /^https:\/\/api\.github\.com\/search\/repositories\?/);
  assert.match(requestedUrl, /q=react%20hooks/);
  assert.equal(items[0].full_name, 'facebook/react');
});

test('returns an empty array for empty result sets', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ items: [] }), { status: 200 });
  assert.deepEqual(await searchRepositories('unlikely-topic'), []);
});

test('reports GitHub rate limits clearly', async () => {
  globalThis.fetch = async () => new Response('', { status: 403, headers: { 'x-ratelimit-remaining': '0' } });
  await assert.rejects(searchRepositories('react'), /rate limited/);
});

test('reports network failures with a helpful message', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(searchRepositories('react'), /Check your connection/);
});
