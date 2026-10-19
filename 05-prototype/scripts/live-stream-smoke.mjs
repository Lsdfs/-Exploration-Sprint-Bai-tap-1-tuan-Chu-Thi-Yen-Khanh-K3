// Opt-in: one real OpenAI reply. Browser speech dispatch is instrumented, not audible.
import {createApp} from '../server.mjs';
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const server=createApp();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 const base=`http://127.0.0.1:${server.address().port}`;
 const config=await(await fetch(base+'/api/config')).json();
 if(config.provider!=='openai')throw new Error('Live OpenAI is not configured');
 browser=await chromium.launch({channel:process.platform==='win32'?'msedge':'chromium',headless:true});
 const page=await browser.newPage();
 await page.addInitScript(()=>{
  window.__speech=[];window.__firstText=null;
  window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices(){return[{name:'HoaiMy',lang:'vi-VN'}];},cancel(){},speak(item){window.__speech.push({text:item.text,at:performance.now()});queueMicrotask(()=>item.onend?.());}}});
 });
 await page.goto(base);await page.locator('.robot-launcher').click();
 await page.locator('#ai-consent').check();
 await page.locator('#help-question').fill('Bấm ở đâu tiếp? Giải thích các bước tiếp theo bằng bốn câu ngắn.');
 await page.evaluate(()=>{
  document.addEventListener('submit',event=>{if(event.target.id==='help-form')window.__start=performance.now();},{capture:true,once:true});
  window.__completeAt=null;
  new MutationObserver(()=>{
    if(window.__firstText===null&&document.querySelector('.guide-message>p')?.textContent.trim())window.__firstText=performance.now();
    if(window.__firstText!==null&&window.__completeAt===null&&!document.querySelector('.send-button')?.disabled)window.__completeAt=performance.now();
  }).observe(document.querySelector('#app'),{childList:true,subtree:true,characterData:true});
 });
 await page.locator('.send-button').click();
 await page.waitForFunction(()=>window.__firstText!==null,{},{timeout:20000});
 await page.waitForFunction(()=>!document.querySelector('.send-button').disabled,{},{timeout:20000});
 const report=await page.evaluate(()=>({
  testedAt:new Date().toISOString(),firstTextMs:window.__firstText-window.__start,
  firstVoiceDispatchMs:window.__speech[0]?.at-window.__start,
  completeMs:window.__completeAt-window.__start,
  text:document.querySelector('.guide-message>p')?.textContent,
  speech:window.__speech.map(s=>({text:s.text,ms:s.at-window.__start})),
  fallback:Boolean(document.querySelector('.fallback-note')),
  speechBackend:'Browser speechSynthesis dispatch instrumented; actual audio not measured'
 }));
 report.model=config.model;
 report.pass=!report.fallback&&report.firstTextMs<report.completeMs&&report.firstVoiceDispatchMs<report.completeMs&&report.speech.length>0;
 await writeFile(new URL('../artifacts/live-stream-smoke.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
}finally{
 await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
