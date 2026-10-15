export async function searchRepositories(query) {
  const term = String(query ?? '').trim();
  if (!term) throw new Error('Enter a topic or language to search.');

  let response;
  try {
    response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(term)}&sort=stars&per_page=6`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch {
    throw new Error('Could not reach GitHub. Check your connection and try again.');
  }

  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (response.status === 429 || (response.status === 403 && remaining === '0')) {
      throw new Error('GitHub search is rate limited right now. Try again in a little while.');
    }
    throw new Error('GitHub could not complete the search. Please try again.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('GitHub returned an unreadable response. Please try again.');
  }
  return Array.isArray(data.items) ? data.items : [];
}
