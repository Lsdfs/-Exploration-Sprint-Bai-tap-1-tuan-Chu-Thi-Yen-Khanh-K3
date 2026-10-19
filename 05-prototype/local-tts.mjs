import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function createLocalTts({spawnFn=spawn}={}){
 const root=path.dirname(fileURLToPath(import.meta.url));
 const python=process.env.TTS_PYTHON || path.join(root,'.kokoro-venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
 let child,ready=false,opening,closed=false,sequence=0,activeId=null;
 const pending=new Map(),cache=new Map();let cacheBytes=0;
 function fail(error){ready=false;activeId=null;for(const task of pending.values())task.reject(error);pending.clear();}
 function dispatch(){
  if(!ready||closed||activeId!==null)return;
  const entry=pending.entries().next().value;if(!entry)return;
  const [id,task]=entry;activeId=id;
  child.stdin.write(JSON.stringify({id,text:task.text,stream:Boolean(task.onChunk)})+'\n',error=>{if(error)fail(error);});
 }
 function warmup(){
  if(closed)return Promise.reject(new Error('TTS closed'));
  if(opening)return opening;
  opening=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{reject(new Error('TTS startup timeout'));child?.kill();},45000);
   child=spawnFn(python,['-u',path.join(root,'tts/worker.py')],{cwd:root,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONIOENCODING:'utf-8'}});
   // Never print text/audio or Python errors containing user content.
   child.stderr.resume();
   child.once('error',error=>{clearTimeout(timer);reject(error);fail(error);opening=null;});
   child.once('exit',()=>{clearTimeout(timer);const error=new Error('Local voice worker stopped');reject(error);fail(error);child=null;opening=null;});
   createInterface({input:child.stdout}).on('line',line=>{
    try{
     const data=JSON.parse(line);
     if(data.type==='ready'){ready=true;clearTimeout(timer);resolve();return;}
     if(data.id!==activeId)return;
     if(data.chunk){pending.get(data.id)?.onChunk?.(Buffer.from(data.chunk,'base64'));return;}
     activeId=null;
     const task=pending.get(data.id);pending.delete(data.id);
     if(!task){dispatch();return;}
     if(data.error)task.reject(new Error(data.error));else{
      const wav=Buffer.from(data.wav,'base64');
      if(wav.toString('ascii',0,4)!=='RIFF')throw new Error('Invalid WAV');
      task.resolve(wav);
     }
     dispatch();
    }catch{fail(new Error('Invalid voice worker output'));}
   });
  });return opening;
 }
 return {
  warmup,status(){return {engine:'kokoro-vi',local:true,ready,voice:'Thành Đạt'};},
  async synthesize(text,{signal,onChunk}={}){
   signal?.throwIfAborted();
   if(typeof text!=='string'||!text.trim()||text.length>1200)throw new Error('Invalid text');
   if(cache.has(text)){const audio=cache.get(text);onChunk?.(audio);return audio;}
   if(pending.size>=12)throw new Error('Voice queue full');
   await warmup();
   signal?.throwIfAborted();
   if(pending.size>=12)throw new Error('Voice queue full');
   const id=++sequence;
   const audio=await new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);};
    const cancel=()=>{const task=pending.get(id);pending.delete(id);task?.reject(signal.reason);dispatch();};
    const timer=setTimeout(()=>{const task=pending.get(id);pending.delete(id);task?.reject(new Error('Voice timeout'));dispatch();},30000);
    pending.set(id,{text,onChunk,resolve:value=>{cleanup();resolve(value);},reject:error=>{cleanup();reject(error);}});
    signal?.addEventListener('abort',cancel,{once:true});
    dispatch();
   });
   while(cache.size&&(cache.size>=24||cacheBytes+audio.length>12*1024*1024)){const key=cache.keys().next().value;cacheBytes-=cache.get(key).length;cache.delete(key);}
   if(audio.length<12*1024*1024){cache.set(text,audio);cacheBytes+=audio.length;}
   return audio;
  },
  close(){closed=true;fail(new Error('TTS closed'));child?.kill();cache.clear();cacheBytes=0;}
 };
}
