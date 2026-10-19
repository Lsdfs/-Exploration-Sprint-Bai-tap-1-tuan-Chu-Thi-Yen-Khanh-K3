import test from 'node:test';
import assert from 'node:assert/strict';
import {readOpenAIStream} from '../openai-stream.mjs';
const event=value=>'data: '+JSON.stringify(value)+'\r\n\r\n';
test('Provider decoder preserves split Vietnamese bytes and ignores lifecycle events',async()=>{
 const text=event({type:'response.created'})+event({type:'response.output_text.delta',delta:'Cô chú ơi. '})+event({type:'response.output_text.delta',delta:'Mình chọn ngày.'})+event({type:'response.completed',response:{status:'completed'}});
 const bytes=new TextEncoder().encode(text),deltas=[];
 const response=new Response(new ReadableStream({start(c){for(const b of bytes)c.enqueue(new Uint8Array([b]));c.close();}}));
 await readOpenAIStream(response,s=>deltas.push(s));assert.equal(deltas.join(''),'Cô chú ơi. Mình chọn ngày.');
});
test('Provider decoder rejects missing completion, refusal, incomplete response and malformed events',async()=>{
 for(const payload of [
  event({type:'response.output_text.delta',delta:'partial'}),
  event({type:'response.refusal.delta',delta:'No'}),
  event({type:'response.incomplete'}),
  event({type:'response.completed',response:{status:'completed'}}),
  'data: {broken\n\n',
 ])await assert.rejects(readOpenAIStream(new Response(payload),()=>{}));
});
test('Aborting an upstream read cancels its body and rejects without waiting for completion',async()=>{
 const aborter=new AbortController();let cancelled=false;
 const response=new Response(new ReadableStream({cancel(){cancelled=true;}}));
 const pending=readOpenAIStream(response,()=>{},aborter.signal);
 aborter.abort();await assert.rejects(pending);assert.equal(cancelled,true);
});
