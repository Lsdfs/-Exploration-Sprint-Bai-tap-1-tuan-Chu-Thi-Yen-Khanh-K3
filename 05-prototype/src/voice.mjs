let activeRecognition;
let generation = 0;
let voiceConsent = false;

// One short utterance per connection. Audio travels as a live WebRTC track;
// only the completed transcript enters the existing chat and booking pipeline.
class RealtimeRecognition {
  async start() {
    this.controller = new AbortController();
    const current = () => !this.closed;
    const fail = (message, error='network') => { if(current()) this.onerror?.({error,message}); this.abort(); };
    this.timer=setTimeout(()=>fail('Đã hết thời gian nghe. Cô/chú bấm micro để nói lại.'),60000);
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if(!current()){stream.getTracks().forEach(track=>track.stop());return;}
      this.stream=stream;
      const pc=this.pc=new RTCPeerConnection();
      for(const track of stream.getTracks())pc.addTrack(track,stream);
      const channel=this.channel=pc.createDataChannel('oai-events');
      channel.onopen=()=>{if(current())this.onstart?.();};
      channel.onclose=()=>{if(current())fail();};
      channel.onerror=()=>fail();
      pc.onconnectionstatechange=()=>{if(['failed','disconnected'].includes(pc.connectionState))fail();};
      let transcript='';let item;
      channel.onmessage=({data})=>{
        if(!current())return;
        let event;try{event=JSON.parse(data);}catch{return;}
        if(event.type==='error'||event.type==='conversation.item.input_audio_transcription.failed'){fail();return;}
        if(event.type==='input_audio_buffer.speech_started'&&!item)item=event.item_id;
        if(!event.type?.startsWith('conversation.item.input_audio_transcription.'))return;
        if(item&&event.item_id!==item)return;
        item=event.item_id;
        const final=event.type.endsWith('.completed');
        if(!final&&!event.type.endsWith('.delta'))return;
        transcript=final?event.transcript:(transcript+(event.delta||''));
        const result=[{transcript:transcript||''}];result.isFinal=final;
        if(final)this.abort();
        this.onresult?.({results:[result]});
      };
      const offer=await pc.createOffer();if(!current())return;
      await pc.setLocalDescription(offer);if(!current())return;
      const response=await fetch('/api/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:offer.sdp,consent:true}),signal:this.controller.signal});
      if(!current())return;
      if(!response.ok){let message;try{message=(await response.json()).error;}catch{}fail(message);return;}
      const sdp=await response.text();if(current())await pc.setRemoteDescription({type:'answer',sdp});
    }catch(error){if(current())fail(undefined,error.name==='NotAllowedError'?'not-allowed':'network');}
  }
  abort(){this.closed=true;clearTimeout(this.timer);this.controller?.abort();this.stream?.getTracks().forEach(track=>track.stop());this.channel?.close();this.pc?.close();}
  stop(){this.abort();}
}

export function stopVoice() {
  generation++;
  const recognition = activeRecognition;
  activeRecognition = null;
  try { recognition?.abort(); } catch { /* Already stopped. */ }
}

export function mountVoice(form, onCommand, { onState = () => {}, onBeforeListen = () => {}, label: micLabel = '🎙 Nói yêu cầu' } = {}) {
  stopVoice();
  if (!form) return;
  const Recognition = window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia ? RealtimeRecognition : null;
  const box = document.createElement('section');
  box.className = 'voice-control';
  box.setAttribute('aria-label', 'Yêu cầu bằng giọng nói');
  const mic = document.createElement('button');
  mic.type = 'button';
  mic.className = 'button secondary voice-button';
  mic.textContent = micLabel;
  mic.setAttribute('aria-pressed', 'false');
  const status = document.createElement('p');
  status.className = 'voice-status';
  status.setAttribute('role', 'status');
  status.hidden = false;
  status.textContent = Recognition ? 'Âm thanh được gửi tới OpenAI. Ví dụ: “Tôi muốn đặt lịch khám”. Mia sẽ trả lời khi cô/chú nói xong.' : 'Trình duyệt này chưa hỗ trợ nhận giọng nói. Cô/chú vẫn có thể gõ câu hỏi hoặc bấm các lựa chọn.';
  box.append(mic, status);
  form.before(box);
  let listening = false;
  let starting = false;
  let localGeneration;
  mic.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (!Recognition) return;
    status.hidden = false;
    if (starting) {
      stopVoice(); starting = false; listening = false;
      mic.textContent = micLabel; mic.setAttribute('aria-pressed', 'false');
      status.textContent = 'Đã dừng nghe. Cô/chú có thể bấm nói lại.';
      onState('waiting');
      return;
    }
    if (listening) {
      stopVoice(); starting = false; listening = false;
      mic.textContent = micLabel; mic.setAttribute('aria-pressed', 'false');
      status.textContent = 'Đã dừng nghe. Cô/chú có thể bấm nói lại.'; onState('waiting');
      return;
    }
    if (!voiceConsent) {
      if (!window.confirm('Micro sẽ gửi âm thanh tới OpenAI để chuyển thành chữ. Giọng đọc câu trả lời chạy trên máy. Cô/chú đồng ý bật micro?')) return;
      voiceConsent = true;
    }
    startListening();
  });
  mic.disabled = !Recognition;
  function startListening() {
    if (listening || !Recognition) return;
    onBeforeListen();
    stopVoice();
    localGeneration = generation;
    starting = true;
    mic.textContent = 'Dừng nghe'; mic.setAttribute('aria-pressed', 'true');
    status.textContent = 'Đang mở micro… Cô/chú cho phép dùng micro nếu trình duyệt hỏi nhé.';
    let recognition;
    try {
      recognition = new Recognition();
      activeRecognition = recognition;
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      const current = () => localGeneration === generation && box.isConnected;
      const idle = () => { starting = false; listening = false; mic.textContent = micLabel; mic.setAttribute('aria-pressed', 'false'); onState('waiting'); };
      recognition.onstart = () => {
        if (!current()) return;
        starting = false; listening = true; mic.textContent = 'Dừng nghe'; mic.setAttribute('aria-pressed', 'true');
        onState('listening');
        status.textContent = 'Đang nghe… Cô/chú nói một yêu cầu ngắn nhé.';
      };
      recognition.onresult = event => {
        if (!current()) return;
        const results = Array.from(event.results || []);
        const text = results.map(result => result[0]?.transcript || '').join(' ').trim().slice(0, 500);
        status.textContent = text || 'Đang nghe…';
        if (results.some(result => result.isFinal === false)) return;
        idle();
        if (!text) { status.textContent = 'Chưa nghe rõ. Cô/chú có thể nói lại hoặc gõ yêu cầu.'; return; }
        stopVoice();
        onCommand(text);
      };
      recognition.onerror = event => {
        if (!current()) return;
        stopVoice(); idle();
        status.textContent = event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Micro chưa được cho phép. Cô/chú có thể bật quyền micro trong trình duyệt hoặc gõ yêu cầu.'
          : event.message || (event.error === 'network' ? 'Dịch vụ giọng nói chưa kết nối được. Cô/chú có thể gõ yêu cầu hoặc thử lại.'
            : 'Chưa nghe rõ yêu cầu. Cô/chú thử lại hoặc gõ vào ô bên dưới nhé.');
      };
      recognition.onend = () => {
        if (!current()) return;
        idle();
        if (/^Đang (nghe|mở micro)/.test(status.textContent)) status.textContent = 'Chưa nhận được câu nói. Cô/chú bấm nói lại hoặc gõ yêu cầu nhé.';
      };
      recognition.start();
    } catch {
      starting = false; listening = false;
      mic.textContent = micLabel; mic.setAttribute('aria-pressed', 'false');
      status.textContent = 'Chưa bật được micro. Cô/chú vẫn có thể gõ yêu cầu hoặc thử lại.';
      stopVoice();
    }
  }

}

export function mountSimulatedVoice(form, onCommand, onState = () => {}) {
  stopVoice();
  if (!form) return;
  const box = document.createElement('section'); box.className = 'voice-control voice-simulation';
  box.setAttribute('aria-label','Giọng nói mô phỏng');
  box.innerHTML = `<p class="simulation-label">MÔ PHỎNG · Không dùng micro, không thu âm</p><button type="button" class="button secondary voice-button" aria-pressed="false">Nói với Mia</button><p class="voice-status" role="status">Bấm micro để trình diễn trạng thái đang nghe.</p><div class="simulation-input" hidden><label for="simulation-utterance">Câu nói mô phỏng</label><textarea id="simulation-utterance" rows="2" maxlength="500" placeholder="Ví dụ: Mở trang lịch hẹn giúp tôi"></textarea><button type="button" class="text-button simulation-receive">Nhận câu mô phỏng</button></div><div class="voice-review" hidden><label for="voice-transcript">Bạn kiểm tra và sửa câu đã nhận:</label><textarea id="voice-transcript" rows="2" maxlength="500"></textarea><button type="button" class="button primary simulation-confirm">Dùng yêu cầu này</button></div>`;
  form.before(box);
  const mic = box.querySelector('.voice-button'), status = box.querySelector('.voice-status');
  status.hidden = true;
  const input = box.querySelector('.simulation-input'), review = box.querySelector('.voice-review');
  const localGeneration = generation;
  const current = () => localGeneration === generation && box.isConnected;
  let listening = false;
  mic.addEventListener('click',()=> {
    if (!current()) return;
    status.hidden = false;
    listening = !listening; mic.textContent = listening ? 'Dừng nghe' : 'Nói với Mia';mic.setAttribute('aria-pressed',String(listening));
    input.hidden=false;onState(listening ? 'listening' : 'waiting');
    status.textContent=listening ? 'Đang nghe… (mô phỏng). Nhập câu giả định ở bên dưới.' : 'Đã dừng nghe mô phỏng. Bạn có thể nhận câu mô phỏng để xem bản chép lời.';
  });
  box.querySelector('.simulation-receive').addEventListener('click',()=> {
    if (!current()) return;
    const text = box.querySelector('#simulation-utterance').value.trim();
    if (!text) {status.textContent='Bạn nhập câu nói mô phỏng trước nhé.';return;}
    listening=false;mic.textContent='Nói với Mia';mic.setAttribute('aria-pressed','false');onState('answering');
    box.querySelector('#voice-transcript').value=text;review.hidden=false;
    status.textContent='Đã nhận bản chép lời mô phỏng, chưa thực hiện. Bạn kiểm tra và sửa trước khi dùng.';
  });
  box.querySelector('.simulation-confirm').addEventListener('click',()=> {
    if (!current()) return;
    const text=box.querySelector('#voice-transcript').value.trim();
    if (!text) {status.textContent='Bạn nhập câu đã nhận trước nhé.';return;}
    stopVoice();onCommand(text);
  });
  activeRecognition={abort(){listening=false;onState('waiting');}};
}
