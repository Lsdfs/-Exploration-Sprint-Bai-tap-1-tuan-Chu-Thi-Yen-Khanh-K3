import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';
import {SERVICES, LOCATIONS} from '../src/domain.mjs';

async function setup(t, options={}) {
  const app=createApp({provider:'openai',apiKey:'test-key',tts:{close(){}},...options});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  t.after(()=>new Promise(r=>{app.closeAllConnections();app.close(r);}));
  return (body={sdp:'v=0\r\n',consent:true},headers={})=>fetch(`http://127.0.0.1:${app.address().port}/api/voice`,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
}
test('Voice negotiates transcription only and keeps the API key on the server',async t=>{
  let request;
  const post=await setup(t,{fetchFn:async(url,options)=>{request={url,...options};return new Response('v=0\r\nanswer',{headers:{'Content-Type':'application/sdp'}});}});
  const res=await post();assert.equal(res.status,200);assert.equal(await res.text(),'v=0\r\nanswer');
  assert.equal(request.url,'https://api.openai.com/v1/realtime/calls');
  assert.equal(request.headers.Authorization,'Bearer test-key');
  const session=JSON.parse(request.body.get('session'));
  assert.equal(session.type,'transcription');assert.equal(session.audio.input.transcription.language,'vi');
  assert.equal(session.audio.input.turn_detection.type,'server_vad');
  assert.equal(session.audio.input.turn_detection.silence_duration_ms,600);
  assert.equal(request.body.get('sdp'),'v=0\r\n');
});
test('Voice rejects missing consent, foreign origins and invalid SDP before contacting OpenAI',async t=>{
  const post=await setup(t,{fetchFn:()=>{throw Error('Must not call');}});
  assert.equal((await post({sdp:'v=0',consent:false})).status,403);
  assert.equal((await post(undefined,{Origin:'https://other.example'})).status,403);
  assert.equal((await post({sdp:'bad',consent:true})).status,400);
  assert.equal((await post({sdp:'v=0'+'a'.repeat(70000),consent:true})).status,413);
});
test('Voice supplies Vietnamese booking vocabulary to transcription without changing the model',async t=>{
  let session;
  const post=await setup(t,{fetchFn:async(_url,options)=>{
    session=JSON.parse(options.body.get('session'));
    return new Response('v=0\r\nanswer');
  }});
  assert.equal((await post()).status,200);
  const transcription=session.audio.input.transcription;
  assert.equal(transcription.model,process.env.OPENAI_TRANSCRIPTION_MODEL||'gpt-4o-transcribe');
  assert.equal(transcription.language,'vi');
  assert.equal(typeof transcription.prompt,'string');
  for(const term of ['Mia','đặt lịch','khoa nội',...SERVICES.map(s=>s.name),...LOCATIONS.map(l=>l.name)])
    assert.ok(transcription.prompt.includes(term),`Missing transcription context: ${term}`);
});
test('Voice reports unavailable configuration and upstream errors without exposing secrets',async t=>{
  const disabled=await setup(t,{apiKey:''});assert.equal((await disabled()).status,503);
  const failed=await setup(t,{fetchFn:async()=>new Response('test-key private error',{status:401})});
  const res=await failed();assert.equal(res.status,502);assert.ok(!(await res.text()).includes('test-key'));
});
