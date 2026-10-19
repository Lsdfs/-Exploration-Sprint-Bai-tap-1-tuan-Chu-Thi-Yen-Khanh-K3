import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';

async function serve(t, config = {}) {
  const app = createApp({ provider: 'mock', ...config });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { app.closeAllConnections(); app.close(resolve); }));
  const base = `http://127.0.0.1:${app.address().port}`;
  return { get: path => fetch(base + path), post: (body, headers = {}) => fetch(base + '/api/help', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }) };
}
const input = { message: 'Bấm ở đâu tiếp?', screen: 'person', consent: true };

test('Live answer forwards upstream deltas before provider completion', async t => {
  let upstream,request;
  const encoder=new TextEncoder();
  const client=await serve(t,{provider:'openai',apiKey:'fake',fetchFn:async(_,options)=>{
    request=JSON.parse(options.body);
    return new Response(new ReadableStream({start(c){upstream=c;}}),{headers:{'content-type':'text/event-stream'}});
  }});
  const response=await client.post({...input,stream:true});
  assert.equal(request.stream,true);
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let received=decoder.decode((await reader.read()).value);
  upstream.enqueue(encoder.encode('event: response.output_text.delta\r\ndata: '+JSON.stringify({type:'response.output_text.delta',delta:'Bạn chọn ngày.'})+'\r\n\r\n'));
  while(!received.includes('Bạn chọn ngày.')) received+=decoder.decode((await reader.read()).value);
  assert.ok(!received.includes('"type":"done"'));
  upstream.enqueue(encoder.encode('data: '+JSON.stringify({type:'response.completed',response:{status:'completed'}})+'\n\n'));
  upstream.close();
  while(true){const chunk=await reader.read();if(chunk.done)break;received+=decoder.decode(chunk.value);}
  assert.match(received,/"type":"done"/);
});

test('Interrupted upstream replaces partial answer with marked fallback',async t=>{
  const client=await serve(t,{provider:'openai',apiKey:'fake',fetchFn:async()=>new Response(
    'data: '+JSON.stringify({type:'response.output_text.delta',delta:'Partial answer'})+'\n\ndata: '+JSON.stringify({type:'response.failed'})+'\n\n',
    {headers:{'content-type':'text/event-stream'}})});
  const events=(await(await client.post({...input,stream:true})).text()).trim().split('\n').map(JSON.parse);
  const reset=events.findIndex(e=>e.type==='meta'&&e.replace===true);
  assert.ok(reset>0);assert.equal(events[reset].fallback,true);
  assert.equal(events.slice(reset).filter(e=>e.type==='delta').map(e=>e.text).join(''), 'Chọn “Bác An” nếu đặt cho bản thân, hoặc “Bác Bình” nếu đặt cho người thân trong tình huống thử. Sau đó bấm “Tiếp tục”.');
  assert.equal(events.at(-1).type,'done');
});

test('Disconnecting a streaming client aborts the provider request', {timeout:3000}, async t=>{
  let resolveAbort;
  const aborted=new Promise(resolve=>{resolveAbort=resolve;});
  const client=await serve(t,{provider:'openai',apiKey:'fake',fetchFn:async(_,{signal})=>{
    signal.addEventListener('abort',resolveAbort,{once:true});
    return new Response(new ReadableStream({start(){}}),{headers:{'content-type':'text/event-stream'}});
  }});
  const response=await client.post({...input,stream:true});
  await response.body.cancel();await aborted;
});

test('Streaming help emits metadata, sentence deltas and completion', async t => {
  const client = await serve(t);
  const response = await client.post({ ...input, stream: true });
  assert.match(response.headers.get('content-type'), /ndjson/);
  const events = (await response.text()).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(events[0].type, 'meta');
  assert.equal(events.at(-1).type, 'done');
  const expected = await (await client.post(input)).json();
  assert.equal(events.filter(event => event.type === 'delta').map(event => event.text).join(''), expected.text);
});
test('Serves the app but never exposes secrets or research documents', async t => {
  const client = await serve(t);
  assert.equal((await client.get('/')).status, 200);
  for (const route of ['/.env', '/server.mjs', '/README.md', '/src/../.env', '/api/missing']) assert.equal((await client.get(route)).status, 404);
});
test('Configuration contains no API key', async t => {
  const client = await serve(t, { provider: 'openai', apiKey: 'fake-secret-for-test' });
  const text = await (await client.get('/api/config')).text();
  assert.equal(JSON.parse(text).provider, 'openai'); assert.ok(!text.includes('fake-secret'));
});

test('Reference UI assets are served while arbitrary asset paths stay private', async t => {
  const client = await serve(t);
  for (const route of ['/reference-ui.mjs', '/reference-ui.css', '/chatbot.mjs', '/chatbot-domain.mjs', '/chatbot.css', '/additional-ui.mjs', '/additional-ui.css', '/assets/mia.png', '/assets/banner.png', '/assets/service-11.png', '/assets/mother.png']) {
    const response = await client.get(route);
    assert.equal(response.status, 200);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  for (const route of ['/assets/.env', '/assets/server.mjs', '/assets/service-12.png', '/references/Screenshot_20261018_090654_MyVinmec.jpg']) {
    assert.equal((await client.get(route)).status, 404);
  }
});
test('Mock returns context-aware guidance without calling external services', async t => {
  const client = await serve(t, { fetchFn: () => { throw new Error('Must not call'); } });
  const reply = await (await client.post(input)).json();
  assert.equal(reply.provider, 'mock'); assert.equal(reply.target, 'profile-options');
});
test('Rejects invalid JSON, unknown screens, empty questions and overlong input', async t => {
  const client = await serve(t);
  for (const body of ['{', { ...input, screen: 'made-up' }, { ...input, message: '' }, { ...input, message: 'a'.repeat(501) }]) assert.equal((await client.post(body)).status, 400);
  assert.equal((await client.post({ ...input, message: 'a'.repeat(6000) })).status, 413);
});
test('Rejects cross-origin requests and requires consent for live requests', async t => {
  const client = await serve(t, { provider: 'openai', apiKey: 'fake' });
  assert.equal((await client.post(input, { Origin: 'https://external.example' })).status, 403);
  assert.equal((await client.post({ ...input, consent: false })).status, 403);
});
test('Missing key falls back transparently without external request', async t => {
  const client = await serve(t, { provider: 'openai', apiKey: '', fetchFn: () => { throw new Error('Must not call'); } });
  const reply = await (await client.post(input)).json();
  assert.equal(reply.provider, 'mock'); assert.equal(reply.fallback, true);
});
test('Live mode sends a bounded structured-output request, strips contact strings and checks intent', async t => {
  let request;
  const client = await serve(t, { provider: 'openai', apiKey: 'fake', fetchFn: async (url, options) => {
    request = JSON.parse(options.body);
    return new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: '{"intent":"go_back"}' }] }] }), { status: 200 });
  } });
  const reply = await (await client.post({ ...input, message: 'Bấm ở đâu, email abc@example.com, số 0912345678' })).json();
  assert.equal(reply.provider, 'openai'); assert.equal(reply.target, 'back-step');
  assert.equal(request.store, false); assert.equal(request.text.format.strict, true);
  assert.ok(!JSON.stringify(request).includes('abc@example.com')); assert.ok(!JSON.stringify(request).includes('0912345678'));
});
for (const [name, response] of [
  ['provider rejects request', () => new Response('{}', { status: 429 })],
  ['provider returns malformed JSON', () => new Response('no json', { status: 200 })],
  ['provider returns invalid intent', () => new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: '{"intent":"book_now"}' }] }] }))],
  ['provider refuses', () => new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'No' }] }] }))],
  ['provider is incomplete', () => new Response(JSON.stringify({ status: 'incomplete', output: [] }))],
]) test(`Fallback to safe local instructions when ${name}`, async t => {
  const client = await serve(t, { provider: 'openai', apiKey: 'fake', fetchFn: async () => response() });
  const reply = await (await client.post(input)).json();
  assert.equal(reply.provider, 'local'); assert.equal(reply.fallback, true); assert.equal(reply.target, 'profile-options');
});
test('Timeout falls back without hanging the booking flow', async t => {
  const client = await serve(t, { provider: 'openai', apiKey: 'fake', aiTimeoutMs: 20, fetchFn: async (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true })) });
  assert.equal((await (await client.post(input)).json()).fallback, true);
});
test('Medical queries are handled locally even with live AI enabled', async t => {
  const client = await serve(t, { provider: 'openai', apiKey: 'fake', fetchFn: () => { throw new Error('Must not call'); } });
  const reply = await (await client.post({ ...input, message: 'Bác uống thuốc gì?' })).json();
  assert.equal(reply.provider, 'local'); assert.equal(reply.target, null);
});
