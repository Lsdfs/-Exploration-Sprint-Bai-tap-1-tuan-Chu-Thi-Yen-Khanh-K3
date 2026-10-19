// Adapted from double fun/frontend/src/app/transcribe-stream.ts.
// Keep capture muted during negotiation, stream partial text, and explicitly
// commit only after speech followed by a pause. No transcript rewriting.
export async function transcribeLive(stream,signal,{onPartial=()=>{},onReady=()=>{},onCommit=()=>{}}={}) {
  let peer,channel,context,source,interval,deadline,connectTimeout;
  let finished=false,committed=false,partial='',itemId;
  let speechMs=0,lastSound=0,startedSpeaking;
  const retiredItems=new Set();
  const setupController=new AbortController();
  const tracks=stream.getAudioTracks();
  const requestSignal=AbortSignal.any([signal,setupController.signal]);
  let resolveResult,rejectResult;
  const result=new Promise((resolve,reject)=>{resolveResult=resolve;rejectResult=reject;});
  const fail=error=>rejectResult(error);
  const active=()=>!finished&&!requestSignal.aborted;
  const abort=()=>fail(new DOMException('Đã dừng nghe.','AbortError'));
  signal.addEventListener('abort',abort,{once:true});
  try {
    signal.throwIfAborted();
    for(const track of tracks)track.enabled=false;
    peer=new RTCPeerConnection();
    channel=peer.createDataChannel('oai-events');
    context=new AudioContext();
    const analyser=context.createAnalyser();analyser.fftSize=2048;
    source=context.createMediaStreamSource(stream);source.connect(analyser);
    for(const track of tracks)peer.addTrack(track,stream);
    const samples=new Float32Array(analyser.fftSize);
    const commit=()=>{
      if(!active()||committed||speechMs<250)return;
      committed=true;clearInterval(interval);clearTimeout(deadline);
      for(const track of tracks)track.enabled=false;
      onCommit();
      // Let the last media packets arrive before the data-channel commit.
      deadline=setTimeout(()=>{
        if(!active())return;
        if(channel.readyState!=='open'){fail(new Error('Đã mất kết nối nhận giọng nói.'));return;}
        try{channel.send(JSON.stringify({type:'input_audio_buffer.commit'}));}
        catch{fail(new Error('Đã mất kết nối nhận giọng nói.'));return;}
        deadline=setTimeout(()=>fail(new Error('Chưa nhận được bản chép lời. Cô/chú thử nói lại nhé.')),30000);
      },200);
    };
    const sample=()=>{
      if(!active()||committed)return;
      analyser.getFloatTimeDomainData(samples);
      const rms=Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length);
      const now=performance.now();
      if(rms>0.02){speechMs+=50;lastSound=now;startedSpeaking??=now;}
      if(speechMs>=250&&(now-lastSound>=900||now-startedSpeaking>=60000))commit();
    };
    const listen=()=>{
      if(!active())return;
      clearInterval(interval);clearTimeout(deadline);
      committed=false;partial='';itemId=undefined;speechMs=0;startedSpeaking=undefined;lastSound=performance.now();
      for(const track of tracks)track.enabled=true;
      onReady({finish:commit});interval=setInterval(sample,50);
    };
    channel.onmessage=({data})=>{
      if(!active())return;
      try {
        const event=JSON.parse(data);
        if(event.type==='error'||event.type==='conversation.item.input_audio_transcription.failed'){
          fail(new Error('Dịch vụ giọng nói chưa kết nối được. Cô/chú thử lại nhé.'));return;
        }
        if(!event.type?.startsWith('conversation.item.input_audio_transcription.'))return;
        if(retiredItems.has(event.item_id)||(itemId&&event.item_id!==itemId))return;
        if(event.type.endsWith('.delta')){
          if(typeof event.delta!=='string')throw new Error('Invalid delta');
          itemId=event.item_id;partial+=event.delta;
          if(partial.length>500){fail(new Error('Câu nói quá dài. Cô/chú nói từng yêu cầu ngắn nhé.'));return;}
          onPartial(partial);
        } else if(event.type.endsWith('.completed')&&committed){
          if(typeof event.transcript!=='string')throw new Error('Invalid transcript');
          const text=event.transcript.trim();
          if(!text){if(event.item_id)retiredItems.add(event.item_id);listen();}
          else if(text.length>500)fail(new Error('Câu nói quá dài. Cô/chú nói từng yêu cầu ngắn nhé.'));
          else resolveResult(text);
        }
      } catch {fail(new Error('Dữ liệu nhận giọng nói không hợp lệ. Cô/chú thử lại nhé.'));}
    };
    channel.onclose=channel.onerror=()=>{if(active())fail(new Error('Đã mất kết nối nhận giọng nói.'));};
    peer.onconnectionstatechange=()=>{
      if(active()&&['failed','disconnected'].includes(peer.connectionState))fail(new Error('Chưa kết nối được dịch vụ nhận giọng nói.'));
    };
    channel.onopen=()=>{if(active()){clearTimeout(connectTimeout);listen();}};
    connectTimeout=setTimeout(()=>fail(new Error('Kết nối nhận giọng nói quá lâu. Cô/chú thử lại nhé.')),25000);
    // Observe negotiation errors even if the channel closes or the user cancels
    // before setRemoteDescription completes. Cleanup aborts a pending fetch.
    void (async()=>{
      await context.resume();if(!active())return;
      const offer=await peer.createOffer();if(!active())return;
      await peer.setLocalDescription(offer);if(!active())return;
      const response=await fetch('/api/voice',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({sdp:offer.sdp,consent:true}),signal:requestSignal,
      });
      if(!active())return;
      if(!response.ok){
        let message;try{const body=await response.json();if(typeof body.error==='string')message=body.error;}catch{}
        throw new Error(message||'Chưa kết nối được dịch vụ nhận giọng nói.');
      }
      const sdp=await response.text();if(!active())return;
      await peer.setRemoteDescription({type:'answer',sdp});
    })().catch(fail);
    return await result;
  } finally {
    finished=true;setupController.abort();signal.removeEventListener('abort',abort);
    clearTimeout(connectTimeout);clearTimeout(deadline);clearInterval(interval);
    source?.disconnect();channel?.close();peer?.close();
    stream.getTracks().forEach(track=>track.stop());
    if(context)await context.close().catch(()=>{});
  }
}
