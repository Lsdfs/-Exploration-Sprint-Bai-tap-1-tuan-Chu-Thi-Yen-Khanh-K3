import {createApp} from '../server.mjs';
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const server=createApp({provider:'mock',fetchFn:()=>{throw new Error('No cloud');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 await server.warmupTts();
 browser=await chromium.launch({channel:process.platform==='win32'?'msedge':'chromium',headless:true});
 const page=await browser.newPage();const errors=[],external=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{if(new URL(route.request().url()).hostname!=='127.0.0.1'){external.push(route.request().url());return route.abort();}return route.continue();});
 await page.addInitScript(()=>{
  window.__playing=0;window.__ended=0;const NativeAudio=window.Audio;
  window.Audio=function(url){const audio=new NativeAudio(url);audio.addEventListener('playing',()=>window.__playing++);audio.addEventListener('ended',()=>window.__ended++);return audio;};
  Object.defineProperty(window,'speechSynthesis',{value:{speak(){throw new Error('Unexpected browser voice');}}});
 });
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('.robot-launcher').click();
 await page.locator('[data-mia="nutrition"]').click();
 await page.waitForFunction(()=>window.__playing>0,{},{timeout:20000});
 await page.getByRole('button',{name:'Dừng đọc',exact:true}).click();
 const report={testedAt:new Date().toISOString(),playback:await page.evaluate(()=>({playing:window.__playing,ended:window.__ended})),errors,externalRequests:external};
 report.pass=report.playback.playing>0&&!errors.length&&!external.length;
 await writeFile(new URL('../artifacts/local-tts-browser.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
