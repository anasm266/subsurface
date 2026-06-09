import {
  looksLikeSubtitleContent,
  shouldInspectResponse,
} from '../lib/detector';
import { SUBSURFACE_MESSAGE_SOURCE, type InjectedCaptureMessage } from '../types';

const MAX_BODY_CHARS = 600_000;

function postCapture(url: string, rawContent: string): void {
  if (!rawContent.trim()) return;

  const message: InjectedCaptureMessage = {
    source: SUBSURFACE_MESSAGE_SOURCE,
    url,
    rawContent: rawContent.slice(0, MAX_BODY_CHARS),
  };

  window.postMessage(message, '*');
}

function postIfSubtitle(url: string, rawContent: string): void {
  if (!looksLikeSubtitleContent(rawContent)) return;
  postCapture(url, rawContent);
}

function readResponseBody(response: Response, url: string): void {
  const contentType = response.headers.get('content-type') ?? '';
  if (!shouldInspectResponse(url, contentType)) return;

  try {
    const cloned = response.clone();
    void cloned
      .text()
      .then((text) => postIfSubtitle(url, text))
      .catch(() => {
        // opaque or unreadable response
      });
  } catch {
    // clone failed
  }
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function patchFetch(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const response = await originalFetch(...args);
    const requestUrl = resolveRequestUrl(args[0]);

    readResponseBody(response, requestUrl);

    return response;
  };
}

function patchXHR(): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function open(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    const resolvedUrl = typeof url === 'string' ? url : url.toString();
    (this as XMLHttpRequest & { _subsurfaceUrl?: string })._subsurfaceUrl = resolvedUrl;
    return originalOpen.call(this, method, url, async ?? true, username, password);
  };

  XMLHttpRequest.prototype.send = function send(body?: Document | XMLHttpRequestBodyInit | null) {
    this.addEventListener('load', () => {
      const url = (this as XMLHttpRequest & { _subsurfaceUrl?: string })._subsurfaceUrl;
      if (!url) return;

      const contentType = this.getResponseHeader('content-type') ?? '';
      if (!shouldInspectResponse(url, contentType)) return;

      const responseType = this.responseType;
      if (responseType && responseType !== 'text' && responseType !== 'document') return;

      const text =
        typeof this.responseText === 'string'
          ? this.responseText
          : typeof this.response === 'string'
            ? this.response
            : '';

      postIfSubtitle(url, text);
    });

    return originalSend.call(this, body);
  };
}

patchFetch();
patchXHR();

export {};
