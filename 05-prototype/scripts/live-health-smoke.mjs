import {createApp} from '../server.mjs';
import {readReplyStream} from '../src/reply-stream.mjs';
import {writeFile} from 'node:fs/promises';
const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={testedAt:new Date().toISOString(),cases:[]};
try{
 const base=`http://127.0.0.1:${server.address().port}`;
 const config=await(await fetch(base+'/api/config')).json();if(config.provider!=='openai')throw new Error('Live API not configured');
 for(const [mode,message] of [['nutrition','Tôi ăn 200g cơm trắng chín, 100g ức gà luộc bỏ da, 100g rau cải luộc, không dầu hay sốt. Khoảng bao nhiêu calo và chất dinh dưỡng?'],['symptoms','Tôi 35 tuổi, nghẹt mũi và hắt hơi nhẹ một ngày, không sốt, không khó thở, vẫn sinh hoạt bình thường. Nên theo dõi gì?']]){
  const start=performance.now();let meta,text='',firstMs;
  const response=await fetch(base+'/api/help',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,message,screen:'home',consent:true,stream:true})});
  await readReplyStream(response,event=>{if(event.type==='meta')meta=event;if(event.type==='delta'){firstMs??=performance.now()-start;text+=event.text;}});
  report.cases.push({mode,status:response.status,provider:meta?.provider,fallback:meta?.fallback,firstTextMs:Math.round(firstMs),completeMs:Math.round(performance.now()-start),text});
 }
 report.pass=report.cases.every(c=>c.provider==='openai'&&!c.fallback&&c.text.length>0);
 await writeFile(new URL('../artifacts/live-health-smoke.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
