// Explicit opt-in smoke test. Reads credentials through server.mjs, never logs them.
import {createApp} from '../server.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {guidance} from '../src/domain.mjs';
const upstream=[];
const server=createApp({fetchFn:async(url,options)=>{
 const started=Date.now();
 try{
  const response=await fetch(url,options);
  upstream.push({status:response.status,ms:Date.now()-started});return response;
 }catch(error){upstream.push({error:error.cause?.code||error.code||error.name,ms:Date.now()-started});throw error;}
}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const report={testedAt:new Date().toISOString(),config:await(await fetch(base+'/api/config')).json(),cases:[],upstream};
async function post(message,screen,consent=true,stream=false){
 const start=Date.now();
 const response=await fetch(base+'/api/help',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,screen,consent,stream})});
 if(!stream)return {status:response.status,ms:Date.now()-start,reply:await response.json()};
 const events=(await response.text()).trim().split('\n').map(s=>JSON.parse(s));
 return {status:response.status,ms:Date.now()-start,reply:{...events[0],text:events.filter(e=>e.type==='delta').map(e=>e.text).join('')},done:events.at(-1).type==='done'};
}
try{
 if(report.config.provider!=='openai'){
  report.result='not-configured';
 }else{
  const blocked=await post('Bấm ở đâu tiếp?','person',false);
  report.cases.push({name:'No consent',...blocked,pass:blocked.status===403&&upstream.length===0});
  for(const [name,message,screen,intent,stream] of [
   ['Next step','Bấm ở đâu tiếp?','person','next_step',false],
   ['Edit review','Tôi chọn nhầm người khám, sửa thế nào?','review','go_back',false],
   ['Pending status','Chờ xác nhận có phải đã đặt thành công chưa?','success','explain_status',false],
   ['Appointment list stream','Tôi muốn xem lịch đã đặt','home','view_appointments',true],
   ['Clarification','abc xyz','home','clarify',false],
  ]){
   const result=await post(message,screen,true,stream);
   const expected=guidance(intent,screen);
   report.cases.push({name,...result,pass:result.status===200&&result.reply.provider==='openai'&&!result.reply.fallback&&(stream ? result.done && result.reply.text.length>0 : result.reply.title===expected.title&&result.reply.target===expected.target)});
  }
  const count=upstream.length;
  const medical=await post('Tôi nên uống thuốc gì?','home');
  report.cases.push({name:'Medical question handled locally',...medical,pass:medical.reply.provider==='local'&&upstream.length===count});
  report.result=report.cases.every(c=>c.pass)?'passed':'failed';
 }
}finally{
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/live-api-smoke.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}
if(report.result!=='passed')process.exitCode=1;
