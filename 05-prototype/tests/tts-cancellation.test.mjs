import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {createLocalTts} from '../local-tts.mjs';
import {createApp} from '../server.mjs';

test('Cancelled sentences never occupy the worker ahead of the next reply',async t=>{
  const sent=[];
  const child=Object.assign(new EventEmitter(),{stdin:new PassThrough(),stdout:new PassThrough(),stderr:new PassThrough(),kill(){this.emit('exit');}});
  child.stdin.on('data',raw=>sent.push(JSON.parse(raw.toString())));
  const voice=createLocalTts({spawnFn:()=>child});t.after(()=>voice.close());
  const ready=voice.warmup();child.stdout.write('{"type":"ready"}\n');await ready;
  const abort=new AbortController();
  const first=voice.synthesize('Old first.',{signal:abort.signal});
  const second=voice.synthesize('Old second.',{signal:abort.signal});
  const rejected=Promise.all([assert.rejects(first,{name:'AbortError'}),assert.rejects(second,{name:'AbortError'})]);
  await new Promise(r=>setImmediate(r));
  assert.equal(sent.length,1);
  abort.abort();await rejected;
  const next=voice.synthesize('New reply.');await new Promise(r=>setImmediate(r));
  const wav=Buffer.from('RIFFfake-wave').toString('base64');
  child.stdout.write(JSON.stringify({id:sent[0].id,wav})+'\n');
  await new Promise(r=>setImmediate(r));
  assert.deepEqual(sent.map(r=>r.text),['Old first.','New reply.']);
  child.stdout.write(JSON.stringify({id:sent[1].id,wav})+'\n');
  assert.equal((await next).toString(),'RIFFfake-wave');
});

test('Closing a speech HTTP request cancels its server synthesis job',async t=>{
  let started,stopped;
  const begun=new Promise(r=>{started=r;});
  const cancelled=new Promise(r=>{stopped=r;});
  const server=createApp({provider:'mock',tts:{close(){},synthesize:async(text,{signal})=>{
    started();return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{stopped();reject(signal.reason);},{once:true}));
  }}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
  const controller=new AbortController();
  const response=fetch(`http://127.0.0.1:${server.address().port}/api/tts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Old reply.'}),signal:controller.signal});
  const rejected=assert.rejects(response,{name:'AbortError'});
  await begun;controller.abort();await rejected;
  await Promise.race([cancelled,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Synthesis was not cancelled')),1000);timer.unref();})]);
});
