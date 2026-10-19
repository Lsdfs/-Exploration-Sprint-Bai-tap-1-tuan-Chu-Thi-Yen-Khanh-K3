// Gemini Live Transcribe: ephemeral credentials, 16 kHz PCM, interim previews.
let warmSocket,warmCapture,idleTimer,warmSince=0;
export function getWarmMicrophone(){
  if(warmSocket?.readyState!==1)return undefined;
  return warmCapture?.stream;
}
function discardWarm(){
  clearTimeout(idleTimer);const socket=warmSocket,capture=warmCapture;warmSocket=undefined;warmCapture=undefined;socket?.close();
  if(capture){capture.node.port.onmessage=null;capture.source.disconnect();capture.node.disconnect();capture.gain.disconnect();capture.stream.getTracks().forEach(track=>track.stop());void capture.context.close().catch(()=>{});}
}
if(typeof window!=='undefined'){
  window.addEventListener('pagehide',discardWarm);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)discardWarm();});
}
export async function transcribeGeminiLive(stream,signal,{onPartial=()=>{},onReady=()=>{},onCommit=()=>{}}={}){
  let socket,context,source,node,gain,timer,deadline,closed=false,ending=false,finalText='',speechMs=0,lastSound=0;
  const controller=new AbortController();const tracks=stream.getAudioTracks();
  let reusable=false,reusedCapture,pendingInterim=false;
  let resolve,reject;const result=new Promise((yes,no)=>{resolve=yes;reject=no;});void result.catch(()=>{});
  const fail=()=>reject(new Error('Kết nối Gemini live bị gián đoạn. Cô/chú thử lại nhé.'));
  const abort=()=>reject(new DOMException('Đã dừng nghe.','AbortError'));
  signal.addEventListener('abort',abort,{once:true});
  const send=value=>{if(socket?.readyState===1)socket.send(JSON.stringify(value));};
  const complete=()=>{reusable=true;resolve(finalText.trim());};
  const finish=()=>{
    if(closed||ending)return;ending=true;tracks.forEach(track=>{track.enabled=false;});onCommit();
    send({realtimeInput:{audioStreamEnd:true}});
    if(finalText.trim()&&!pendingInterim){complete();return;}
    // Timeout reports missing final text; it must not delay a finalized transcript.
    deadline=setTimeout(()=>reject(new Error('Chưa nhận được lời nói hoàn tất. Cô/chú thử lại nhé.')),10000);
  };
  try{
    signal.throwIfAborted();
    timer=setTimeout(fail,25000);
    void(async()=>{
      let credentials;
      clearTimeout(idleTimer);
      if(warmSocket?.readyState===1){socket=warmSocket;warmSocket=undefined;reusedCapture=warmCapture;warmCapture=undefined;}
      else{
        discardWarm();
        const response=await fetch('/api/voice/live-token',{method:'POST',headers:{'X-Audio-Consent':'true'},signal:AbortSignal.any([signal,controller.signal])});
        credentials=await response.json();if(!response.ok)throw Error(credentials.error||'Gemini live chưa sẵn sàng.');
      }
      if(closed||signal.aborted)return;
      if(reusedCapture&&reusedCapture.stream===stream){({context,source,node,gain}=reusedCapture);}
      else{context=new AudioContext();await context.audioWorklet.addModule('/pcm-capture.mjs');await context.resume();}
      if(closed||signal.aborted)return;
      if(!socket){
        socket=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token='+encodeURIComponent(credentials.token));
        warmSince=performance.now();socket.onopen=()=>send({setup:credentials.setup});
      }
      socket.onerror=fail;socket.onclose=()=>{if(!closed)fail();};
      socket.onmessage=async({data})=>{
        if(closed)return;
        try{
          const event=JSON.parse(typeof data==='string'?data:await data.text());
          if(event.error){fail();return;}
          if(event.setupComplete){
            clearTimeout(timer);
            if(!node){source=context.createMediaStreamSource(stream);node=new AudioWorkletNode(context,'pcm-capture');gain=context.createGain();gain.gain.value=0;source.connect(node);node.connect(gain);gain.connect(context.destination);}
            node.port.onmessage=({data:{pcm,rms}})=>{
              if(closed||ending)return;
              const bytes=new Uint8Array(pcm);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
              send({realtimeInput:{audio:{data:btoa(binary),mimeType:'audio/pcm;rate=16000'}}});
              if(rms>0.02){speechMs+=100;lastSound=performance.now();}
              if(speechMs>=300&&performance.now()-lastSound>=900)finish();
            };
            tracks.forEach(track=>{track.enabled=true;});onReady({finish});
          }
          const content=event.serverContent;if(!content)return;
          if(content.interimInputTranscription?.text){pendingInterim=true;onPartial(finalText+content.interimInputTranscription.text);}
          if(content.inputTranscription?.text){pendingInterim=false;finalText+=content.inputTranscription.text;onPartial(finalText);}
          if(finalText.length>500)throw Error('Câu nói quá dài.');
          if(finalText.trim()&&(content.turnComplete||(ending&&!pendingInterim&&content.inputTranscription?.text)))complete();
        }catch{fail();}
      };
      if(!credentials)await socket.onmessage({data:'{"setupComplete":{}}'});
    })().catch(reject);
    return await result;
  }finally{
    closed=true;controller.abort();clearTimeout(timer);clearTimeout(deadline);signal.removeEventListener('abort',abort);
    if(node)node.port.onmessage=null;
    if(reusable&&socket?.readyState===1&&!signal.aborted){
      warmSocket=socket;
      warmCapture={stream,context,source,node,gain};tracks.forEach(track=>{track.enabled=true;});
      socket.onmessage=()=>{};socket.onerror=discardWarm;socket.onclose=()=>{if(warmSocket===socket)discardWarm();};
      idleTimer=setTimeout(discardWarm,60000);idleTimer.unref?.();
    }else{
      socket?.close();source?.disconnect();node?.disconnect();gain?.disconnect();
      stream.getTracks().forEach(track=>track.stop());if(context)await context.close().catch(()=>{});
    }
  }
}
