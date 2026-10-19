import test from 'node:test';
import assert from 'node:assert/strict';
import { readReplyStream, createSentenceBuffer } from '../src/reply-stream.mjs';

test('Voice buffers token fragments, emits complete sentences once and flushes final text',()=>{
  const spoken=[],buffer=createSentenceBuffer(text=>spoken.push(text));
  buffer.push('Cô chú ');buffer.push('chọn ngày');assert.deepEqual(spoken,[]);
  buffer.push(' nhé. ');assert.deepEqual(spoken,['Cô chú chọn ngày nhé. ']);
  buffer.push('Mia sẽ ');buffer.push('hỏi lại');buffer.finish();
  assert.deepEqual(spoken,['Cô chú chọn ngày nhé. ','Mia sẽ hỏi lại']);
  buffer.finish();assert.equal(spoken.length,2);
  buffer.push('Nội dung cũ');buffer.reset();buffer.finish();assert.equal(spoken.length,2);
});

test('Completion succeeds and malformed stream events fail', async () => {
  const events = [];
  await readReplyStream(new Response('{"type":"delta","text":"Xin chào."}\n{"type":"done"}'), event => events.push(event));
  assert.equal(events.length, 2);
  for (const text of ['{"type":"unknown"}\n', '{"type":"delta","text":3}\n', '{"type":"done"}\n{"type":"delta","text":"late"}\n']) {
    await assert.rejects(readReplyStream(new Response(text), () => {}));
  }
});

test('Delivers Vietnamese text before stream closes, handles split bytes and rejects incomplete streams', async () => {
  let controller;
  const encoder = new TextEncoder();
  const body = new ReadableStream({ start(c) { controller = c; } });
  const received = [];
  const pending = readReplyStream(new Response(body), event => received.push(event));
  const data = encoder.encode(JSON.stringify({ type: 'delta', text: 'Cô chú ơi. ' }) + '\n');
  controller.enqueue(data.slice(0, 24));
  controller.enqueue(data.slice(24));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(received[0].text, 'Cô chú ơi. ');
  controller.close();
  await assert.rejects(pending, /Incomplete/);
});
