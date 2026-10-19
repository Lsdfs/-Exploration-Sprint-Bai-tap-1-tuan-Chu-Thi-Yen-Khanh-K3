import {createApp} from '../server.mjs';
import {chromium} from '@playwright/test';
import {writeFile,readFile} from 'node:fs/promises';

// Uses only a synthetic Vietnamese greeting, never the physical microphone.
const upstream=[];
const server=createApp({provider:'openai',fetchFn:async(url,options)=>{
  let response;
  try{response=await fetch(url,options);}catch(error){upstream.push({endpoint:new URL(url).pathname,error:error.name,code:error.cause?.code});throw error;}
  console.log('Upstream status:',response.status);
  upstream.push({status:response.status,endpoint:new URL(url).pathname});
  if(!response.ok){const error=await response.clone().json().catch(()=>({}));upstream.at(-1).code=error.error?.code;upstream.at(-1).message=error.error?.message;}
  return response;
}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
  if(process.env.VOICE_LATENCY==='1')await server.warmupTts();
  browser=await chromium.launch({channel:process.platform==='win32'?'msedge':'chromium',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage();const errors=[];
  const audio=await readFile(new URL('../artifacts/tts-vivos-greeting.wav',import.meta.url));
  await page.route('**/voice-smoke.wav',route=>route.fulfill({contentType:'audio/wav',body:audio}));
  await page.addInitScript(()=>{
    window.__voiceDiagnostics={states:[],events:[],timings:[],playing:[]};
    const mark=(name)=>window.__voiceDiagnostics.timings.push({name,ms:Math.round(performance.now())});
    const nativeFetch=window.fetch;
    window.fetch=async(...args)=>{const url=String(args[0]);if(url.startsWith('/api/'))mark(url+':request');const response=await nativeFetch(...args);if(url.startsWith('/api/'))mark(url+':headers');return response;};
    const NativeAudio=window.Audio;
    window.Audio=function(url){const audio=new NativeAudio(url);audio.addEventListener('playing',()=>window.__voiceDiagnostics.playing.push(Math.round(performance.now())));return audio;};
    let source,context;
    Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{
      context=new AudioContext();await context.resume();
      source=context.createBufferSource();
      const speech=await context.decodeAudioData(await (await fetch('/voice-smoke.wav')).arrayBuffer());
      window.__voiceDiagnostics.speechDurationMs=Math.round(speech.duration*1000);
      const padded=context.createBuffer(1,speech.length+context.sampleRate*3,context.sampleRate);
      padded.getChannelData(0).set(speech.getChannelData(0));source.buffer=padded;
      const destination=context.createMediaStreamDestination();source.connect(destination);return destination.stream;
    }}});
    const native=RTCPeerConnection.prototype.createDataChannel;
    RTCPeerConnection.prototype.createDataChannel=function(...args){
      this.addEventListener('connectionstatechange',()=>window.__voiceDiagnostics.states.push(this.connectionState));
      this.addEventListener('iceconnectionstatechange',()=>window.__voiceDiagnostics.states.push(`ice:${this.iceConnectionState}`));
      const channel=native.apply(this,args);
      channel.addEventListener('open',()=>{window.__voiceDiagnostics.states.push('channel:open');mark('speech:start');source.start();});
      channel.addEventListener('message',({data})=>{try{const event=JSON.parse(data);window.__voiceDiagnostics.events.push({type:event.type,error:event.error?.code,ms:Math.round(performance.now())});}catch{}});
      return channel;
    };
  });
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('.robot-launcher').click();
  await page.locator('.voice-button').click();
  await page.waitForFunction(()=>document.querySelector('.chat-message.user')||(/chưa kết nối|cần bật|hết thời gian|chưa được cho phép/i.test(document.querySelector('.voice-status')?.textContent||'')),null,{timeout:65000}).catch(()=>{});
  if(process.env.VOICE_LATENCY==='1')await page.waitForFunction(()=>{const d=window.__voiceDiagnostics;const final=d.events.find(e=>e.type.endsWith('transcription.completed'));return final&&d.playing.some(ms=>ms>final.ms);},null,{timeout:30000}).catch(()=>{});
  const report={testedAt:new Date().toISOString(),upstream,errors,...await page.evaluate(()=>({diagnostics:window.__voiceDiagnostics,transcript:document.querySelector('.chat-message.user')?.textContent||null,status:document.querySelector('.voice-status')?.textContent||null}))};
  report.pass=Boolean(report.transcript)&&!errors.length;
  await writeFile(new URL(process.env.VOICE_LATENCY==='1'?'../artifacts/voice-latency.json':'../artifacts/realtime-voice-smoke.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
