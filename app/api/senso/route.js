import handler from '../../../src/server/senso-handler.js';

export const runtime = 'nodejs';

const MAX_BODY = 1_800_000;

export async function POST(request) {
  let body;
  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_BODY) return Response.json({ error: 'Image too large.' }, { status: 413 });
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    body = undefined;
  }

  const headers = Object.fromEntries(request.headers.entries());
  const req = {
    method: request.method,
    headers,
    socket: { remoteAddress: headers['x-forwarded-for'] || 'ip' },
    body,
  };
  if (body === undefined) {
    req[Symbol.asyncIterator] = async function* invalidBody() {
      yield Buffer.from('invalid json');
    };
  }

  let statusCode = 200;
  let responseBody = '';
  const responseHeaders = new Headers();
  const res = {
    setHeader(name, value) { responseHeaders.set(name, value); },
    end(value) { responseBody = value; },
  };
  Object.defineProperty(res, 'statusCode', {
    get() { return statusCode; },
    set(value) { statusCode = value; },
  });

  await handler(req, res);
  return new Response(responseBody, { status: statusCode, headers: responseHeaders });
}
