import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalSpeech} from '../src/local-speech.mjs';
test('Local speech fetches WAV and plays in order, cancellation discards pending audio',async t=>{
 const originalFetch=globalThis.fetch,originalAudio=globalThis.Audio;
 t.after(()=>{globalThis.fetch=originalFetch;globalThis.Audio=originalAudio;});
 const requested=[],played=[];let count=0;
 globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/tts');requested.push(JSON.parse(options.body).text);return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'audio/wav'}});};
 globalThis.Audio=class{constructor(){this.id=++count;}play(){played.push(this.id);queueMicrotask(()=>this.onended?.());return Promise.resolve();}pause(){}removeAttribute(){}};
 const voice=createLocalSpeech();await Promise.all([voice.enqueue('Câu một.'),voice.enqueue('Câu hai.')]);
 assert.deepEqual(requested,['Câu một.','Câu hai.']);assert.deepEqual(played,[1,2]);
 let resolve;globalThis.fetch=()=>new Promise(r=>{resolve=r;});
 const pending=voice.enqueue('Câu cũ.');voice.cancel();resolve(new Response('audio'));await pending;
 assert.deepEqual(played,[1,2]);
});
test('Local speech failure reports an error without browser speech fallback',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 globalThis.fetch=async()=>new Response('{}',{status:503});
 const errors=[];const voice=createLocalSpeech({onError:error=>errors.push(error)});
 await voice.enqueue('Xin chào');assert.equal(errors.length,1);
});
