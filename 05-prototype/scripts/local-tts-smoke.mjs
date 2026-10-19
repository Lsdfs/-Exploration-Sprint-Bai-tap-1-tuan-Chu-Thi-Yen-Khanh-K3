import {createApp} from '../server.mjs';
import {writeFile} from 'node:fs/promises';
const server=createApp({provider:'mock',fetchFn:()=>{throw new Error('Cloud must not be called');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const report={testedAt:new Date().toISOString(),samples:[]};
try{
 const start=performance.now();await server.warmupTts();report.warmupMs=Math.round(performance.now()-start);
 for(const [name,text] of [['greeting','Xin chào cô chú. Mình là Mia, trợ lý của bạn.'],['booking','Bạn muốn đặt lịch khám vào ngày nào? Mia sẽ đọc lại thông tin trước khi xác nhận.'],['cached-greeting','Xin chào cô chú. Mình là Mia, trợ lý của bạn.']]){
  const began=performance.now();
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/tts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
  const wav=Buffer.from(await response.arrayBuffer());
  if(!response.ok||wav.toString('ascii',0,4)!=='RIFF')throw new Error('Local voice synthesis failed: '+wav.toString('utf8').slice(0,250));
  await writeFile(new URL(`../artifacts/tts-${name}.wav`,import.meta.url),wav);
  report.samples.push({name,ms:Math.round(performance.now()-began),bytes:wav.length,status:response.status});
 }
 report.status=await(await fetch(`http://127.0.0.1:${server.address().port}/api/tts`)).json();
 await writeFile(new URL('../artifacts/local-tts-smoke.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
