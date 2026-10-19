import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';
test('Local TTS endpoint returns WAV, validates text and does not forward text to a cloud API',async t=>{
 let spoken;
 const wav=Buffer.alloc(48);wav.write('RIFF');wav.write('WAVE',8);
 const server=createApp({provider:'mock',tts:{synthesize:async text=>{spoken=text;return wav;},close(){},status(){return {ready:true,engine:'piper'};}},fetchFn:()=>{throw new Error('No cloud');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=(text,headers={})=>fetch(base+'/api/tts',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({text})});
 const response=await post('Xin chào cô chú.');assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/audio\/wav/);assert.equal(spoken,'Xin chào cô chú.');
 for(const text of ['',null,'x'.repeat(1201)])assert.equal((await post(text)).status,400);
 assert.equal((await post('Xin chào',{origin:'https://foreign.example'})).status,403);
});
test('Local TTS unavailable is explicit and never substitutes a browser voice',async t=>{
 const server=createApp({provider:'mock',tts:{synthesize:async()=>{throw new Error('Missing model');},close(){},status(){return {ready:false};}}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/tts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Xin chào'})});
 assert.equal(response.status,503);assert.match((await response.json()).error,/cục bộ/);
});

test('Local speech streams its first audio before the whole sentence is generated',async t=>{
 let finish;
 const wav=Buffer.from('RIFFtest');
 const server=createApp({provider:'mock',tts:{close(){},synthesize:async(text,{onChunk})=>{
   onChunk(wav);await new Promise(r=>{finish=r;});return wav;
 }}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>{finish?.();server.closeAllConnections();server.close();});
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/tts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'A sentence.',stream:true})});
 assert.match(response.headers.get('content-type'),/ndjson/);
 const reader=response.body.getReader();const first=await reader.read();
 const event=JSON.parse(new TextDecoder().decode(first.value).trim());
 assert.equal(event.type,'audio');assert.equal(event.wav,wav.toString('base64'));
 finish();const last=await reader.read();assert.match(new TextDecoder().decode(last.value),/done/);
 await reader.cancel();
});
