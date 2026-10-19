// Gemini's file transcription path from double fun: capture the complete
// utterance, then send the original recording to the server without rewriting.
export async function recordAndTranscribe(stream,signal,{onReady=()=>{},onCommit=()=>{}}={}){
  let context,source,recorder,interval,timeout,setupTimeout,finished=false,committed=false;
  const chunks=[];let size=0,speechMs=0,lastSound=0,startedSpeaking;
  const controller=new AbortController(),requestSignal=AbortSignal.any([signal,controller.signal]);
  let resolveResult,rejectResult;
  const result=new Promise((resolve,reject)=>{resolveResult=resolve;rejectResult=reject;});
  const active=()=>!finished&&!requestSignal.aborted;
  const abort=()=>rejectResult(new DOMException('Đã dừng nghe.','AbortError'));
  signal.addEventListener('abort',abort,{once:true});
  const tracks=stream.getAudioTracks();
  try{
    signal.throwIfAborted();tracks.forEach(track=>{track.enabled=false;});
    context=new AudioContext();const analyser=context.createAnalyser();analyser.fftSize=2048;
    source=context.createMediaStreamSource(stream);source.connect(analyser);
    const mimeType=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
    if(!mimeType)throw new Error('Trình duyệt chưa hỗ trợ định dạng thu âm. Cô/chú có thể gõ yêu cầu.');
    recorder=new MediaRecorder(stream,{mimeType});
    recorder.onerror=()=>rejectResult(new Error('Chưa thu được âm thanh. Cô/chú thử lại nhé.'));
    recorder.ondataavailable=event=>{
      if(!active()||!event.data?.size)return;
      size+=event.data.size;
      if(size>10*1024*1024){rejectResult(new Error('Đoạn thu âm quá dài. Cô/chú nói yêu cầu ngắn hơn nhé.'));return;}
      chunks.push(event.data);
    };
    recorder.onstop=()=>{
      if(!active()||!committed)return;
      void (async()=>{
        if(!size)throw new Error('Chưa thu được âm thanh. Cô/chú thử lại nhé.');
        const audio=new Blob(chunks,{type:recorder.mimeType});
        timeout=setTimeout(()=>{controller.abort();rejectResult(new Error('Nhận giọng nói quá lâu. Cô/chú thử lại nhé.'));},35000);
        const response=await fetch('/api/voice/transcribe',{method:'POST',headers:{'Content-Type':audio.type,'X-Audio-Consent':'true'},body:audio,signal:requestSignal});
        const body=await response.json();
        if(!response.ok)throw new Error(typeof body.error==='string'?body.error:'Chưa kết nối được Gemini. Cô/chú thử lại nhé.');
        if(typeof body.text!=='string'||!body.text.trim()||body.text.length>500)throw new Error('Bản chép lời không hợp lệ. Cô/chú thử lại nhé.');
        if(active())resolveResult(body.text.trim());
      })().catch(rejectResult);
    };
    const commit=()=>{
      if(!active()||committed)return;
      committed=true;clearInterval(interval);tracks.forEach(track=>{track.enabled=false;});onCommit();recorder.stop();
    };
    const samples=new Float32Array(analyser.fftSize);
    setupTimeout=setTimeout(()=>rejectResult(new Error('Chưa bật được âm thanh micro. Cô/chú bấm nói lại nhé.')),25000);
    // Observe resume failures and cancellation even before capture is ready.
    void (async()=>{
      await context.resume();if(!active())return;
      clearTimeout(setupTimeout);
      tracks.forEach(track=>{track.enabled=true;});recorder.start(250);onReady({finish:commit});
      interval=setInterval(()=>{
        if(!active())return;
        analyser.getFloatTimeDomainData(samples);
        const rms=Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length),now=performance.now();
        if(rms>0.02){speechMs+=50;lastSound=now;startedSpeaking??=now;}
        if(speechMs>=250&&(now-lastSound>=900||now-startedSpeaking>=60000))commit();
      },50);
    })().catch(rejectResult);
    return await result;
  }finally{
    finished=true;controller.abort();signal.removeEventListener('abort',abort);clearInterval(interval);clearTimeout(timeout);clearTimeout(setupTimeout);
    if(recorder?.state==='recording')recorder.stop();
    stream.getTracks().forEach(track=>track.stop());source?.disconnect();
    if(context)await context.close().catch(()=>{});
    chunks.length=0;
  }
}
