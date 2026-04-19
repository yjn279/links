export async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'user-agent': 'LinksBackend/0.1 (+https://github.com/links)' },
    redirect: 'follow',
    // Cloudflare Workers default timeout is generous; no explicit timeout.
  });
  if (!response.ok) {
    throw new Error(`upstream ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error(`unsupported content-type: ${contentType}`);
  }
  return await response.text();
}
