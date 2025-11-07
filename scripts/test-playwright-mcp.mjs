// Minimal MCP client that talks to Playwright MCP over SSE/HTTP.
const protocolVersion = '2024-11-05';
const baseUrl = new URL('http://127.0.0.1:9020');

let postEndpoint = null;
const pending = new Map();
let nextId = 1;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function startSSE() {
  const response = await fetch(new URL('/sse', baseUrl), {
    headers: {
      Accept: 'text/event-stream',
      'MCP-Protocol-Version': protocolVersion,
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE connection failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      handleSSEChunk(chunk);
    }
  }
}

function handleSSEChunk(chunk) {
  if (!chunk.trim()) return;

  const lines = chunk.split('\n');
  let eventType = 'message';
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  const data = dataLines.join('\n');

  if (eventType === 'endpoint') {
    postEndpoint = new URL(data, baseUrl);
    console.log(`[session] Using endpoint ${postEndpoint.href}`);
    return;
  }

  if (!data) return;

  try {
    const payload = JSON.parse(data);
    console.log('<=', JSON.stringify(payload, null, 2));

    if (typeof payload.id !== 'undefined' && pending.has(payload.id)) {
      const { resolve } = pending.get(payload.id);
      pending.delete(payload.id);
      resolve(payload);
    }
  } catch (error) {
    console.error('[error] Failed to parse SSE payload', error, data);
  }
}

async function send(message, expectResponse) {
  if (!postEndpoint) throw new Error('MCP endpoint not ready yet');
  console.log('=>', JSON.stringify(message, null, 2));

  const response = await fetch(postEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'MCP-Protocol-Version': protocolVersion,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }

  if (!expectResponse) {
    await response.arrayBuffer();
  }
}

async function request(method, params) {
  const id = nextId++;
  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`Request ${id} timed out`));
      }
    }, 30000);

    pending.set(id, {
      resolve: payload => {
        clearTimeout(timeout);
        resolve(payload);
      },
    });
  });

  await send(
    {
      jsonrpc: '2.0',
      id,
      method,
      params,
    },
    true,
  );

  return promise;
}

async function notify(method, params) {
  await send(
    {
      jsonrpc: '2.0',
      method,
      params,
    },
    false,
  );
}

async function main() {
  startSSE().catch(error => {
    console.error('[fatal] SSE connection aborted', error);
    process.exit(1);
  });

  while (!postEndpoint) {
    await sleep(50);
  }

  await request('initialize', {
    protocolVersion,
    clientInfo: { name: 'codex-cli', version: '0.0.1' },
    capabilities: {},
  });
  console.log('[info] initialize result received');

  await notify('notifications/initialized');

  await request('tools/list', {});

  await request('tools/call', {
    name: 'browser_navigate',
    arguments: { url: 'https://example.com' },
  });

  await sleep(8000);

  await notify('notifications/shutdown');
  console.log('[info] Finished scripted MCP session. Close the browser window manually if needed.');
  process.exit(0);
}

main().catch(error => {
  console.error('[fatal]', error);
  process.exit(1);
});
