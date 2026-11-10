const defaultTimeoutMs = 15_000;

class HttpStatusError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP ${status}`);
  }
}

export async function fetchJson(url: string, init?: RequestInit, timeoutMs = defaultTimeoutMs, source = 'external'): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      console.log(`[Jobs] ${source} request started: attempt=${attempt + 1}`);
      const response = await fetch(url, { ...init, signal: controller.signal });
      const contentType = response.headers.get('content-type') ?? 'unknown';
      console.log(`[Jobs] ${source} HTTP status=${response.status} content-type=${contentType}`);
      if (!response.ok) throw new HttpStatusError(response.status);
      const payload = await response.json();
      if (Array.isArray(payload)) {
        console.log(`[Jobs] ${source} response top-level=array count=${payload.length}`);
      } else if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        const collectionKey = ['jobs', 'results', 'data'].find((key) => Array.isArray(record[key]));
        const count = collectionKey ? (record[collectionKey] as unknown[]).length : 0;
        console.log(`[Jobs] ${source} response top-level=object keys=${Object.keys(record).join(',')} collection=${collectionKey ?? 'none'} count=${count}`);
      } else {
        console.log(`[Jobs] ${source} response top-level=${typeof payload} count=0`);
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (error instanceof HttpStatusError && (error.status === 401 || error.status === 403)) {
        break;
      }
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed.');
}
