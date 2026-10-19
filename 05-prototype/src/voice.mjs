import {transcribeGeminiLive,getWarmMicrophone} from './gemini-live.mjs';
import {transcribeLive} from './transcribe-stream.mjs';
import {recordAndTranscribe} from './record-transcribe.mjs';

let activeRecognition;
let generation = 0;
let voiceConsent = false;

// Bridge the separate live audio module to the existing chat/booking UI.
class RealtimeRecognition {
  async start() {
    this.controller = new AbortController();
    let captured=false;
    try {
      const response=await fetch('/api/config',{signal:this.controller.signal});
      if(!response.ok)throw new Error('Configuration unavailable');
      const config=await response.json();if(this.closed)return;
      const liveGemini=config.voiceProvider==='gemini-live';
      const gemini=config.voiceProvider==='gemini';
      if(liveGemini?!window.WebSocket:gemini?!window.MediaRecorder:!window.RTCPeerConnection)throw new Error('Capture unavailable');
      const stream=(liveGemini&&getWarmMicrophone())||await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      if(this.closed){stream.getTracks().forEach(track=>track.stop());return;}
      captured=true;
      const emit=(transcript,final)=>{
        if(this.closed)return;
        const result=[{transcript}];result.isFinal=final;
        this.onresult?.({results:[result]});
      };
      const text=await (liveGemini?transcribeGeminiLive:gemini?recordAndTranscribe:transcribeLive)(stream,this.controller.signal,{
        onPartial:text=>emit(text,false),
        onReady:controls=>{this.finish=controls?.finish;if(!this.closed)this.onstart?.();},
        onCommit:()=>{if(!this.closed)this.onprocessing?.();},
      });
      emit(text,true);
    }catch(error){if(!this.closed)this.onerror?.({error:error.name==='NotAllowedError'?'not-allowed':'network',message:captured?error.message:undefined});}
  }
  abort(){this.closed=true;this.controller?.abort();}
  stop(){this.abort();}
}

export function stopVoice() {
  generation++;
  const recognition = activeRecognition;
  activeRecognition = null;
  try { recognition?.abort(); } catch { /* Already stopped. */ }
}

export function finishVoice(){activeRecognition?.finish?.();}

export function mountVoice(form, onCommand, { onState = () => {}, onBeforeListen = () => {}, label: micLabel = '🎙 Nói yêu cầu' } = {}) {
  stopVoice();
  if (!form) return;
  const Recognition = (window.RTCPeerConnection||window.MediaRecorder) && window.AudioContext && navigator.mediaDevices?.getUserMedia ? RealtimeRecognition : null;
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
  status.textContent = Recognition ? 'Bấm micro rồi chờ “Đang nghe” để nói. Âm thanh được gửi tới dịch vụ AI đang bật để chuyển thành chữ.' : 'Trình duyệt này chưa hỗ trợ nhận giọng nói. Cô/chú vẫn có thể gõ câu hỏi hoặc bấm các lựa chọn.';
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
      if (!window.confirm('Micro sẽ gửi âm thanh tới nhà cung cấp AI đang bật (Gemini hoặc OpenAI) để chuyển thành chữ. Giọng đọc câu trả lời chạy trên máy. Cô/chú đồng ý bật micro?')) return;
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
    onState('connecting');
    mic.textContent = 'Dừng nghe'; mic.setAttribute('aria-pressed', 'true');
    status.textContent = 'Đang mở micro… Cô/chú cho phép dùng micro nếu trình duyệt hỏi nhé.';
    let recognition;
    try {
      recognition = new Recognition();
      activeRecognition = recognition;
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
        if (results.some(result => result.isFinal === false)) {
          const preview=document.querySelector('.mia-activity-copy p');
          if(preview){preview.textContent=text||'Mia đang nghe…';preview.dataset.transcript='true';}
          return;
        }
        idle();
        if (!text) { status.textContent = 'Chưa nghe rõ. Cô/chú có thể nói lại hoặc gõ yêu cầu.'; return; }
        stopVoice();
        onCommand(text);
      };
      recognition.onprocessing = () => {
        if(!current())return;
        onState('transcribing');mic.textContent='Hủy nhận giọng';status.textContent='Đang chuyển lời nói thành chữ…';
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
