export function createLocalSpeech({onError=()=>{}}={}){
 let generation=0,tail=Promise.resolve(),active=null;
 const requests=new Set();
 async function playStream(response,version){
  const context=new AudioContext(),reader=response.body.getReader(),sources=new Set(),ended=[];
  let buffer='',done=false,nextTime=context.currentTime;
  const decoder=new TextDecoder();
  const stop=()=>{for(const source of sources){try{source.stop();}catch{}}reader.cancel().catch(()=>{});};
  const playback={stop};active=playback;
  try{
   await context.resume();
   async function event(line){
    if(!line.trim())return;
    const event=JSON.parse(line);if(done)throw Error('Audio after completion');
    if(event.type==='done'){done=true;return;}
    if(event.type!=='audio'||typeof event.wav!=='string')throw Error('Invalid audio stream');
    const bytes=Uint8Array.from(atob(event.wav),c=>c.charCodeAt(0));
    const audio=await context.decodeAudioData(bytes.buffer);
    if(version!==generation)return;
    const source=context.createBufferSource();source.buffer=audio;source.connect(context.destination);sources.add(source);
    ended.push(new Promise(resolve=>{source.onended=()=>{sources.delete(source);source.disconnect();resolve();};}));
    nextTime=Math.max(nextTime,context.currentTime+0.03);source.start(nextTime);nextTime+=audio.duration;
   }
   while(version===generation){
    const part=await reader.read();buffer+=part.done?decoder.decode():decoder.decode(part.value,{stream:true});
    let index;while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);await event(line);}
    if(buffer.length>4000000)throw Error('Audio event too large');
    if(part.done)break;
   }
   if(version===generation){if(buffer.trim())await event(buffer);if(!done)throw Error('Incomplete audio stream');await Promise.all(ended);}
  }finally{stop();await context.close();if(active===playback)active=null;}
 }
 return {
  enqueue(text){
   const version=generation,controller=new AbortController();requests.add(controller);
   const prepared=fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,stream:false}),signal:controller.signal})
    .then(response=>{if(!response.ok)throw new Error('Local TTS unavailable');return response;});
   prepared.catch(()=>{});
   const playing=tail.catch(()=>{}).then(async()=>{
    if(version!==generation)return;
    const response=await prepared;if(version!==generation)return;
    if(response.headers.get('content-type')?.includes('ndjson'))return playStream(response,version);
    const blob=await response.blob();if(version!==generation)return;
    const url=URL.createObjectURL(blob),audio=new Audio(url);
    try{
     await new Promise((resolve,reject)=>{
      active={audio,finish:resolve};audio.onended=resolve;audio.onerror=()=>reject(new Error('Cannot play audio'));
      Promise.resolve(audio.play()).catch(reject);
     });
    }finally{audio.pause();audio.removeAttribute('src');URL.revokeObjectURL(url);if(active?.audio===audio)active=null;}
   }).finally(()=>requests.delete(controller));
   tail=playing.catch(error=>{if(version===generation&&error.name!=='AbortError')onError(error);});
   return tail;
  },
  cancel(){generation++;for(const request of requests)request.abort();requests.clear();if(active){if(active.stop)active.stop();else{active.audio.pause();active.finish();}active=null;}tail=Promise.resolve();}
 };
}
