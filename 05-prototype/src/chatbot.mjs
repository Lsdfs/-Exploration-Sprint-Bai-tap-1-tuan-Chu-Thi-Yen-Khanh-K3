import {createLocalSpeech} from './local-speech.mjs';
import { sentenceChunks, createSentenceBuffer } from './reply-stream.mjs';
import { normalize, PROFILES, SERVICES, LOCATIONS, TIMES, GUIDES, newDraft, summary } from './domain.mjs';
import { classifyRequest, extractBookingSlots, nextQuestion, validateChatBooking, doctorsFor, DOCTORS, bookingHelp } from './chatbot-domain.mjs';
import { mountVoice, mountSimulatedVoice, stopVoice, finishVoice } from './voice.mjs';
import {createActivityIndicator} from './activity.mjs';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const robot = (small = false) => `<img class="robot-avatar mia-avatar ${small ? 'robot-small' : ''}" src="/assets/mia.png" alt="Mia, trợ lý sức khỏe MyVinmec" width="156" height="156">`;
const greeting = 'Xin chào! Mình là Mia. Bạn cần mình giúp gì hôm nay?';
const names = { appointments:'Lịch hẹn', results:'Kết quả khám', doctors:'Tìm bác sĩ', personal:'Thông tin cá nhân' };
function appHelp(message) {
  const text = normalize(message);
  if (/goi y.*khoa|chua biet.*khoa|khoa.*gom|cac chuyen khoa/.test(text)) return 'Bạn có thể chọn Nội tổng quát nếu muốn khám tổng quát; các lựa chọn khác có Tim mạch, Cơ xương khớp, Da liễu, Mắt và Tai mũi họng. Bạn muốn chọn khoa nào? Mia sẽ hỏi lại trước khi ghi nhận. Nếu chưa rõ khoa phù hợp, hãy nhờ nhân viên y tế hỗ trợ; Mia không chẩn đoán từ triệu chứng.';
  if (/don thuoc|nhac.*thuoc/.test(text)) return 'Từ Trang chủ, chọn Đơn thuốc để xem đơn, hoặc Nhắc lịch uống thuốc để xem nhắc lịch mẫu. Prototype chưa có đơn thuốc hay thông báo uống thuốc thật.';
  if (/thanh toan|tam ung|vien phi/.test(text)) return 'Từ Trang chủ, chọn Tạm ứng viện phí. Tính năng hiện chỉ hiển thị giao diện mẫu, chưa thực hiện giao dịch. Danh mục giá & quyền lợi cho phép chọn bệnh viện trước khi xem thông tin mẫu.';
  if (/so tiem|tiem chung/.test(text)) return 'Từ Trang chủ, chọn Sổ tiêm để xem giao diện sổ tiêm mẫu. Prototype chưa kết nối hồ sơ tiêm chủng thật.';
  if (/lien he|tong dai/.test(text)) return 'Từ Trang chủ, chọn Liên hệ để mở các lựa chọn liên hệ. Prototype chưa thực hiện cuộc gọi hoặc kết nối nhân viên thật.';
  if (/luu.*thong tin|thong tin.*luu/.test(text)) return 'Mia giữ bản nháp đặt lịch và lịch mẫu đã xác nhận trong tab này, kể cả khi tải lại. Đóng tab hoặc chọn Bắt đầu phiên mới sẽ xóa dữ liệu dùng thử. Bạn có thể xem lịch trong Lịch hẹn.';
  if (/chuc nang|lam duoc gi|dung app/.test(text)) return 'Mia giúp đặt lịch bằng giọng nói hoặc nhập chữ, kiểm tra và sửa trước khi xác nhận. Bạn cũng có thể hỏi cách xem lịch hẹn, kết quả khám, tìm bác sĩ, sửa thông tin cá nhân, xem đơn thuốc hoặc sổ tiêm. Các dữ liệu trong prototype là dữ liệu mẫu.';
  return '';
}
const tourSteps = {
  appointments: [{ target:'nav-appointments', text:'Bạn nhấn vào mục Lịch hẹn ở phía dưới màn hình nhé.', screen:'home' }, { target:'appointment-list', text:'Danh sách lịch hẹn nằm ở đây. Bạn xem người khám, ngày giờ và trạng thái nhé.', screen:'appointments' }],
  results: [{ target:'nav-profile', text:'Bạn nhấn Hồ sơ ở phía dưới màn hình nhé.', screen:'home' }, { target:'profile-results', text:'Tiếp theo, nhấn Kết quả khám trong Hồ sơ.', screen:'profile' }, { target:'results-list', text:'Đây là danh sách kết quả mẫu. Chọn một thẻ để xem thông tin.', screen:'results' }],
  doctors: [{ target:'nav-profile', text:'Bạn nhấn Hồ sơ ở phía dưới màn hình nhé.', screen:'home' }, { target:'profile-doctors', text:'Nhấn Tìm bác sĩ để xem danh sách.', screen:'profile' }, { target:'doctor-list', text:'Bạn chọn chuyên khoa hoặc tìm bác sĩ theo tên ở đây.', screen:'doctors' }],
  personal: [{ target:'nav-profile', text:'Bạn nhấn Hồ sơ ở phía dưới màn hình nhé.', screen:'home' }, { target:'profile-personal', text:'Nhấn Thông tin cá nhân trong Hồ sơ.', screen:'profile' }, { target:'personal-form', text:'Bạn sửa thông tin mẫu tại đây. Khi bấm Lưu thay đổi, app sẽ hỏi xác nhận trước khi lưu.', screen:'personal' }],
};
const prompts = { profile:'Bạn đặt lịch cho bản thân hay người thân?', service:'Bạn muốn đặt lịch khám chuyên khoa nào?', location:'Bạn muốn khám tại cơ sở nào?', doctor:'Bạn có muốn chọn bác sĩ cụ thể không?', date:'Bạn muốn khám vào ngày nào?', time:'Bạn chọn một giờ còn trống nhé.', review:'Bạn kiểm tra thông tin bên dưới nhé. Bạn có xác nhận đặt lịch này không? Có thể bấm nút hoặc nói “Xác nhận đặt lịch”.' };

export function createChatbot(hooks) {
  const model = { messages:[], active:false, draft:newDraft(), question:'', edit:'', tour:null, voiceMode:'native', autoRead:true, status:'waiting', submitted:false, note:'', version:0 };
  const activity=createActivityIndicator({onFinish:finishVoice,onCancel(phase){
    if(['thinking','answering'].includes(phase))hooks.cancelHelp();
    else document.querySelector('.voice-button')?.click();
  }});
  const updateActivity=()=>activity.update(hooks.state.helpBusy?(hooks.state.helpStreaming?'answering':'thinking'):(['connecting','listening','transcribing'].includes(model.status)?model.status:''));
  try {
    const draft = JSON.parse(sessionStorage.getItem('mia-draft') || 'null');
    if (draft && typeof draft === 'object') {
      model.draft = {...newDraft(), ...Object.fromEntries(Object.entries(draft).filter(([k,v])=>['profile','location','service','doctor','date','time','period'].includes(k) && typeof v === 'string' && v.length < 80)), accepted:false};
      model.active = true; model.question = nextQuestion(model.draft, hooks.state.dates);
    }
  } catch {}
  let element;
  let speechGeneration = 0;
  let reading = false;
  let speechPending = 0;
  let speechStreamOpen = false;
  let speechStreamMuted = false;
  const localSpeech=createLocalSpeech({onError(){
    const composer=document.querySelector('.chat-composer');
    if(composer&&!composer.querySelector('.mia-voice-notice')){
      const notice=document.createElement('p');notice.className='mia-voice-notice';notice.setAttribute('role','status');notice.textContent='Mia chưa phát được giọng cục bộ. Bạn vẫn có thể đọc câu trả lời; kiểm tra TTS trên máy rồi thử lại.';composer.append(notice);
    }
  }});
  const speechBuffer = createSentenceBuffer(queueSpeech);
  function stopReading() {
    speechBuffer.reset();
    speechGeneration++;
    reading = false;
    speechPending = 0;
    speechStreamOpen = false;
    speechStreamMuted = true;
    localSpeech.cancel();
    document.querySelector('.chat-stop-reading')?.remove();
  }
  function mountReadingControl() {
    if (!reading || document.querySelector('.chat-stop-reading')) return;
    const button = document.createElement('button');
    button.className = 'chat-stop-reading';
    button.textContent = 'Dừng đọc';
    button.addEventListener('click', () => { stopReading(); setStatus('waiting'); });
    document.querySelector('.chatbot-header')?.append(button);
  }
  let tourResize;
  let intro = true;
  function dismissIntro(open = false) {
    intro = false;
    hooks.state.helpOpen = open;
    if(open){hooks.open('mia');return;}
    redraw();
  }
  function queueSpeech(text) {
    if(!model.autoRead)return;
    const generation=speechGeneration;
    reading=true;speechPending++;mountReadingControl();
    localSpeech.enqueue(text).then(()=>{
      if(generation!==speechGeneration)return;
      speechPending--;finishSpeech();
    });
  }
  function finishSpeech() {
    if (!speechPending && !speechStreamOpen) {
      reading = false;
      document.querySelector('.chat-stop-reading')?.remove();
      if (model.status === 'answering') setStatus('waiting');
    }
  }
  function speak(text) {
    stopReading();
    for (const chunk of sentenceChunks(text)) queueSpeech(chunk);
  }
  function setStatus(value) {
    model.status = value;
    const panel = document.querySelector('.chatbot-panel'); if (panel) panel.dataset.status = value;
    const label = document.querySelector('.robot-state'); if (label) label.textContent = ({waiting:'Đang chờ bạn',connecting:'Đang mở micro…',listening:'Đang nghe…',transcribing:'Đang nhận lời nói…',processing:'Đang xử lý…',answering:'Đang trả lời'})[value] || 'Đang chờ bạn';
    updateActivity();
  }
  function reply(text) { model.messages.push({ role:'assistant', text }); model.messages = model.messages.slice(-14); setStatus('answering'); speak(text); }
  function user(text) { model.messages.push({ role:'user', text }); model.messages = model.messages.slice(-14); }
  function redraw() {
    try { if(model.active) sessionStorage.setItem('mia-draft',JSON.stringify(model.draft)); else sessionStorage.removeItem('mia-draft'); } catch { model.note = 'Không thể giữ bản nháp khi tải lại tab. Bạn vẫn có thể tiếp tục đặt lịch ở đây.'; }
    hooks.render();
  }
  function askNext() {
    model.question = model.edit || nextQuestion(model.draft, hooks.state.dates);
    reply(prompts[model.question]); redraw();
  }
  function startBooking(text = '') {
    hooks.state.healthMode='app';hooks.state.healthHistory=[];
    stopVoice(); model.tour = null; model.submitted = false;
    if (!model.active) { model.draft = newDraft(); model.active = true; }
    const {slots, notes, invalidFields} = extractBookingSlots(text, hooks.state.dates,model.draft);
    merge(slots,invalidFields); model.note = notes.join(' '); model.edit = ''; hooks.state.helpOpen = true; askNext();
  }
  function merge(slots,invalidFields=[]) {
    for (const field of invalidFields) { model.draft[field]=''; if(field==='date') model.draft.time=''; }
    if ((slots.service && slots.service !== model.draft.service) || (slots.location && slots.location !== model.draft.location)) model.draft.doctor = '';
    if (slots.date && slots.date !== model.draft.date) model.draft.time = '';
    if (slots.period && slots.period !== model.draft.period && !slots.time) model.draft.time = '';
    Object.assign(model.draft, slots, {accepted:false});
  }
  function choose(field, value) {
    const allowed = field === 'profile' ? PROFILES.map(p=>p.id) : field === 'service' ? SERVICES.map(s=>s.id) : field === 'location' ? LOCATIONS.map(l=>l.id) : field === 'doctor' ? ['any',...doctorsFor(model.draft.service,model.draft.location).map(d=>d.id)] : field === 'date' ? hooks.state.dates.map(d=>d.id) : TIMES.filter(t => !(model.draft.date === hooks.state.dates[0].id && t.id === '10:00')).map(t=>t.id);
    if (!allowed.includes(value) || hooks.state.bookingBusy) return;
    const name = field === 'profile' ? PROFILES.find(p=>p.id===value)?.name : field === 'service' ? SERVICES.find(p=>p.id===value)?.name : field === 'location' ? LOCATIONS.find(p=>p.id===value)?.name : field === 'doctor' ? DOCTORS.find(p=>p.id===value)?.name || 'Không chọn bác sĩ cụ thể' : field === 'date' ? hooks.state.dates.find(p=>p.id===value)?.label : value;
    user(name); merge({[field]:value}); model.edit = ''; model.note = ''; askNext();
  }
  function choices() {
    const question = model.question;
    const items = question === 'profile' ? PROFILES.map(p=>[p.id,`${p.relation} · ${p.name}`]) : question === 'service' ? SERVICES.map(s=>[s.id,s.name]) : question === 'location' ? LOCATIONS.map(l=>[l.id,l.name]) : question === 'doctor' ? [...doctorsFor(model.draft.service,model.draft.location).map(d=>[d.id,d.name]),['any','Không chọn bác sĩ cụ thể']] : question === 'date' ? hooks.state.dates.map(d=>[d.id,d.label]) : question === 'time' ? TIMES.filter(t=>!model.draft.period || t.period===model.draft.period).map(t=>[t.id,t.id]) : [];
    return `<div class="chat-choices">${items.map(([value,label])=>`<button class="chat-choice" data-chat-field="${question}" data-value="${value}" ${question === 'time' && model.draft.date === hooks.state.dates[0].id && value === '10:00' ? 'disabled' : ''}>${esc(label)}</button>`).join('')}${question === 'service' ? '<button class="chat-choice chat-support" data-chat="specialty-help">Tôi chưa biết chọn chuyên khoa</button>' : ''}${question === 'time' && model.draft.period ? '<button class="chat-choice" data-chat="all-times">Xem tất cả khung giờ</button>' : ''}</div>`;
  }
  function review() {
    const s = summary(model.draft,hooks.state.dates);
    const fields = [['profile','Người khám',s.person],['service','Chuyên khoa',s.service],['location','Cơ sở',s.location],['doctor','Bác sĩ',DOCTORS.find(d=>d.id===model.draft.doctor)?.name || 'Không chọn bác sĩ cụ thể'],['date','Ngày',s.date],['time','Giờ',s.time]];
    return `<section class="chat-booking-review" aria-label="Kiểm tra lịch hẹn"><dl>${fields.map(([field,label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd><button data-chat-edit="${field}" aria-label="Sửa ${field === 'profile' ? 'người khám' : label.toLowerCase()}" ${hooks.state.bookingBusy ? 'disabled' : ''}>Sửa</button></div>`).join('')}</dl><p class="chat-demo-note">Lịch hẹn và bác sĩ là dữ liệu mẫu. Không gửi tới bệnh viện.</p><button class="chat-confirm" data-chat="confirm" ${hooks.state.bookingBusy ? 'disabled' : ''}>${hooks.state.bookingBusy ? 'Đang ghi nhận…' : 'Xác nhận đặt lịch'}</button></section>`;
  }
  function markup() {
    const state = hooks.state, guide = state.answer || GUIDES[state.screen] || GUIDES.home;
    const open = state.helpOpen && (!intro || state.miaPage);
    return `${intro && !state.miaPage ? '<div class="mia-intro-dimmer"></div><section class="mia-intro-bubble" role="dialog" aria-modal="true" aria-label="Làm quen với Mia"><p>Nếu bạn cần giúp đỡ thì hãy nói chuyện với Mia nhé!</p><button data-chat="intro-dismiss" autofocus>Đã hiểu</button><span aria-hidden="true">↘</span></section>' : ''}${!open && !model.tour ? `<button class="robot-launcher ${intro ? 'mia-intro-spotlight' : ''}" data-action="${intro ? 'mia-intro-open' : 'mobile-help'}" aria-label="Mở hướng dẫn">${robot(true)}</button>` : ''}<aside class="assistant chatbot-panel ${state.miaPage ? 'mia-conversation' : ''}" data-status="${model.status}" aria-label="Chatbot trợ lý MyVinmec" ${open ? '' : 'hidden'}><header class="chatbot-header">${state.miaPage ? '<button class="mia-chat-back" data-action="home" aria-label="Quay lại trang chủ">←</button>' : robot(true)}<div><h2>${state.miaPage ? 'Trợ lý sức khỏe AI MIA' : 'Mia · Trợ lý của bạn'}</h2><span class="robot-state">${({waiting:'Đang chờ bạn',listening:'Đang nghe…',processing:'Đang xử lý…',answering:'Đang trả lời'})[model.status]}</span></div><button class="chat-collapse" data-action="mobile-help" aria-label="Thu gọn hướng dẫn">−</button></header><div class="chatbot-scroll">${state.healthMode && state.healthMode!=='app' ? `<section class="mia-health-banner"><strong>${state.healthMode==='nutrition' ? 'Phân tích dinh dưỡng' : 'Kiểm tra triệu chứng'}</strong><span>${state.healthMode==='nutrition' ? 'Ước tính từ mô tả món ăn · Không phân tích ảnh' : 'Thông tin tham khảo · Không thay thế khám bác sĩ'}</span><button data-chat="health-exit">Quay lại Mia</button></section>` : ''}${state.miaPage && !model.active && !model.messages.length ? hooks.miaWelcome() : ''}${state.guided ? `${!model.active ? `<div class="chat-greeting" ${model.messages.length || state.miaPage ? 'hidden' : ''}>${greeting}</div><div class="chat-main-actions" ${state.miaPage ? 'hidden' : ''}><button data-chat="start">Đặt lịch khám</button><button data-chat="guide-menu">Hướng dẫn dùng app</button></div>` : ''}<div class="chat-messages" role="log" aria-label="Cuộc trò chuyện" aria-live="polite">${model.messages.filter((m, index) => !(model.active && index === model.messages.length - 1 && m.role === 'assistant' && Object.values(prompts).includes(m.text))).map(m=>`<p class="chat-message ${m.role}">${esc(m.text)}</p>`).join('')}</div>${model.note ? `<p class="chat-note" role="status">${esc(model.note)}</p>` : ''}${model.active ? `<div class="chat-prompt">${esc(prompts[model.question])}</div>${model.question === 'review' ? review() : choices()}<div class="chat-step-controls"><button data-chat="booking-back">Quay lại</button><button data-chat="booking-stop">Dừng đặt lịch</button></div>` : ''}${model.submitted ? '<button class="chat-confirm" data-chat="appointments">Xem lịch hẹn</button>' : ''}${state.answer ? `<div class="guide-message" role="status"><h3>${esc(guide.title)}</h3><p>${esc(guide.text)}</p>${guide.fallback ? '<p class="fallback-note">AI chưa phản hồi được. Đang dùng hướng dẫn có sẵn.</p>' : ''}</div>` : ''}</div><div class="chat-composer">${state.helpBusy ? `<div class="chat-wait" role="status" aria-live="polite">${state.helpStreaming ? 'Mia đang trả lời…' : state.helpSlow ? 'Mia đang mất lâu hơn dự kiến. Bạn có thể tiếp tục chờ hoặc dừng để thử lại.' : 'Đang xử lý câu hỏi của bạn…'}<button type="button" data-chat="cancel-wait">${state.helpStreaming ? 'Dừng phản hồi' : 'Dừng chờ'}</button></div>` : ''}<form id="help-form"><label for="help-question">Bạn muốn mình giúp gì?</label><div class="question-row"><input id="help-question" name="question" maxlength="500" placeholder="Hỏi về sức khỏe &amp; y tế…" autocomplete="off" ${model.status === 'processing' || state.helpBusy ? 'disabled' : ''}><button class="send-button" type="submit" aria-label="Gửi câu hỏi" ${!state.configLoaded || model.status === 'processing' || state.helpBusy ? 'disabled' : ''}>➜</button></div></form></div>` : '<h3>Cô/chú đang tự thao tác</h3><p>Khi cần, bạn có thể bật trợ lý trở lại.</p><button class="button secondary" data-action="toggle-guide">Bật hướng dẫn</button></div>'}</aside>${model.tour ? tourMarkup() : ''}`;
  }
  function tourMarkup() {
    const step = tourSteps[model.tour.destination][model.tour.index];
    return `<div class="coach-dimmer" aria-hidden="true"></div><aside class="coach-bubble" role="region" aria-label="Hướng dẫn trên giao diện"><div class="coach-heading">${robot(true)}<strong>Bước ${model.tour.index+1}/${tourSteps[model.tour.destination].length}</strong></div><p>${esc(step.text)}</p>${model.tour.notice ? `<small role="status">${esc(model.tour.notice)}</small>` : ''}<div class="coach-actions"><button data-chat="tour-next">Tiếp tục</button>${model.tour.index ? '<button data-chat="tour-back">Quay lại</button>' : ''}<button data-chat="tour-open">Mở giúp tôi</button><button data-chat="tour-stop">Dừng hướng dẫn</button></div><div id="tour-voice-anchor"></div><span class="coach-arrow" aria-hidden="true">▼</span></aside>`;
  }
  function positionTour() {
    document.querySelectorAll('.coach-target').forEach(el=>el.classList.remove('coach-target'));
    document.body.classList.toggle('coach-active',Boolean(model.tour));
    if (!model.tour) return;
    const step = tourSteps[model.tour.destination][model.tour.index];
    const target = document.getElementById(step.target), bubble = document.querySelector('.coach-bubble');
    if (!target || !bubble) return;
    target.classList.add('coach-target');
    target.scrollIntoView({block:'nearest',behavior:'instant'});
    const rect = target.getBoundingClientRect(), width = Math.min(innerWidth - 24,360);
    bubble.style.width = `${width}px`;
    const left = Math.max(12,Math.min(innerWidth-width-12,rect.left+rect.width/2-width/2));
    bubble.style.left = `${left}px`;
    const height = bubble.offsetHeight;
    const above = rect.top >= height + 16;
    bubble.style.top = `${Math.max(12,Math.min(innerHeight-height-80,above ? rect.top-height-12 : rect.bottom+12))}px`;
    bubble.classList.toggle('coach-below',!above);
    const arrow = bubble.querySelector('.coach-arrow'); arrow.style.left = `${Math.max(12,Math.min(width-28,rect.left+rect.width/2-left-8))}px`;
  }
  function startTour(destination) {
    stopVoice(); model.tour = {destination,index:0,notice:''}; hooks.state.helpOpen = false;
    hooks.open('home'); reply(tourSteps[destination][0].text); redraw();
  }
  function openPage(destination) {
    model.tour = null; hooks.state.helpOpen = true; hooks.open(destination);
    reply(`Mình đã mở trang ${names[destination]} cho bạn.`); redraw();
  }
  function confirmBooking() {
    if (!model.active || model.question !== 'review' || model.edit || hooks.state.bookingBusy) {
      reply('Mia cần đủ thông tin và mở bản tóm tắt trước khi bạn xác nhận đặt lịch nhé.'); redraw(); return;
    }
    const draft = {...model.draft, accepted:true};
    const error = validateChatBooking(draft,hooks.state.dates);
    if (error) {model.note=error;redraw();return;}
    hooks.commit(draft);
  }
  async function processMessage(text) {
    if (!text.trim() || hooks.state.bookingBusy || model.status === 'processing' || hooks.state.helpBusy) return;
    stopVoice(); user(text.slice(0,500)); const version = ++model.version; setStatus('processing'); redraw();
    if (version !== model.version) return;
    setStatus('answering');
    const command = normalize(text).trim();
    if(hooks.state.healthMode&&hooks.state.healthMode!=='app'){
      if(/^(thoat|dung|quay lai|ve mia|ve trang chu)[.!\s]*$/.test(command)){hooks.state.healthMode='app';hooks.state.healthHistory=[];model.messages=[];hooks.open('mia');return;}
      if(!/^(dat.*lich|toi muon dat.*lich)/.test(command)){redraw();await hooks.ask(text);return;}
    }
    if(classifyRequest(text).kind==='clarify_confirmation') {
      reply('Mia chưa ghi nhận lịch. Chỉ khi bạn đã kiểm tra bản tóm tắt và chủ động nói “Xác nhận đặt lịch” hoặc bấm nút xác nhận, Mia mới lưu yêu cầu mẫu. Bạn vẫn có thể sửa thông tin.');redraw();return;
    }
    if (/^(xin chao|chao|chao mia|mia oi|alo)[.!?\s]*$/.test(command)) {
      reply('Dạ, Mia chào cô chú. Mia đang nghe đây ạ. Cô chú cần Mia giúp gì hôm nay?'); redraw(); return;
    }
    if (/^(cam on|cam on mia|cam on nhe)[.!?\s]*$/.test(command)) {
      reply('Dạ, cô chú cứ gọi Mia khi cần nhé.'); redraw(); return;
    }
    if (/dong.*(chat|tro chuyen)|thu gon/.test(command)) { hooks.state.helpOpen=false;setStatus('waiting');redraw();return; }
    if (model.tour) {
      if (/mo.*(giup|ho).*toi|mo giup|mo ho/.test(command) && !/lich hen|ket qua|bac si|ca nhan/.test(command)) {openPage(model.tour.destination);return;}
      if (/dung.*huong dan/.test(command)) {model.tour=null;hooks.state.helpOpen=true;reply('Mia đã dừng hướng dẫn.');redraw();return;}
      if (/quay lai|buoc truoc/.test(command)) {model.tour.index=Math.max(0,model.tour.index-1);hooks.open(tourSteps[model.tour.destination][model.tour.index].screen);reply(tourSteps[model.tour.destination][model.tour.index].text);redraw();return;}
      if (/tiep theo|tiep tuc/.test(command)) {
        const step=tourSteps[model.tour.destination][model.tour.index];
        const target=document.getElementById(step.target);
        if (target?.tagName==='BUTTON') target.click();
        else {model.tour=null;hooks.state.helpOpen=true;reply('Bạn đã xem xong hướng dẫn.');redraw();}
        return;
      }
    }
    if (model.active) {
      if (/doc lai|kiem tra.*thong tin/.test(command)) {const s=summary(model.draft,hooks.state.dates);reply(Object.values(s).join('. '));redraw();return;}
      if (/quay lai|buoc truoc/.test(command)) {const fields=['profile','service','location','doctor','date','time','review'];model.edit=fields[Math.max(0,fields.indexOf(model.question)-1)];askNext();return;}
      if (/dung dat lich/.test(command)) {model.active=false;reply('Mia đã dừng đặt lịch.');redraw();return;}
      const ordinal=command.match(/(?:chon|gio|lua chon).*thu (nhat|hai|ba|tu|nam|sau|bay|[1-7])/);
      if (ordinal) {
        const index=({nhat:1,hai:2,ba:3,tu:4,nam:5,sau:6,bay:7})[ordinal[1]] || Number(ordinal[1]);
        const options=[...document.querySelectorAll('.chat-choice[data-chat-field]')];
        const option=options[index-1];
        if(option && !option.disabled){choose(option.dataset.chatField,option.dataset.value);return;}
        model.note='Lựa chọn này chưa có hoặc đã hết chỗ. Bạn chọn lại nhé.';redraw();return;
      }
      const editFields=[['profile',/sua.*(nguoi kham|ho so)/],['service',/sua.*chuyen khoa/],['location',/sua.*co so/],['doctor',/sua.*bac si/],['date',/sua.*ngay/],['time',/sua.*gio/]];
      const edit=editFields.find(([,pattern])=>pattern.test(command));
      if(edit){model.edit=edit[0];askNext();return;}
    }
    const knownSlots=extractBookingSlots(text,hooks.state.dates,model.draft).slots;
    const support=bookingHelp(text,model.awaitingSymptoms?'symptoms':model.question || (/chuyen khoa|khoa nao/.test(command)?'service':''));
    if(support && !knownSlots.service){
      if(support.askSymptoms){model.awaitingSymptoms=true;reply(support.text);redraw();return;}
      model.awaitingSymptoms=false;
      if(!model.active){model.draft=newDraft();model.active=true;}
      merge(support.service?{service:support.service}:{doctor:support.doctor});
      model.edit='';reply(support.text);askNext();return;
    }
    if(knownSlots.service)model.awaitingSymptoms=false;
    const help = knownSlots.service ? '' : appHelp(text);
    if(help){reply(help);redraw();return;}
    const request = classifyRequest(text);
    if (request.kind === 'guide') startTour(request.destination);
    else if (request.kind === 'open') openPage(request.destination);
    else if (request.kind === 'booking') startBooking(text);
    else if (request.kind === 'confirm') { if (/xac nhan.*dat lich/.test(command)) confirmBooking(); else {reply('Bạn mở lịch hẹn để kiểm tra trước khi hủy nhé.');redraw();} }
    else if (request.kind === 'medical') { reply('Mình không chẩn đoán hoặc chọn chuyên khoa từ triệu chứng. Bạn hãy liên hệ nhân viên y tế để được hỗ trợ chọn chuyên khoa nhé.'); redraw(); await hooks.ask(text); }
    else if (model.active) {
      const parsed = extractBookingSlots(text,hooks.state.dates,model.draft);
      if(model.question==='doctor' && /^(khong|khong can|ai cung duoc|bac si nao cung duoc)[.!\s]*$/.test(command)) parsed.slots.doctor='any';
      if (Object.keys(parsed.slots).length || parsed.invalidFields.length) { merge(parsed.slots,parsed.invalidFields); model.note = parsed.notes.join(' '); model.edit = ''; askNext(); }
      else { model.note = parsed.notes.join(' ') || 'Mình chưa hiểu rõ. Bạn chọn một nút bên dưới hoặc nói lại ngắn gọn nhé.'; redraw(); }
    } else { redraw(); await hooks.ask(text); }
  }
  function mount() {
    updateActivity();
    mountReadingControl();
    tourResize?.disconnect();
    const bubble = document.querySelector('.coach-bubble');
    if (bubble) { tourResize = new ResizeObserver(positionTour); tourResize.observe(bubble); }
    element = document.querySelector('.chatbot-panel');
    const form = model.tour ? document.querySelector('#tour-voice-anchor') : document.querySelector('#help-form');
    if (form) {
      const callback = text=>{ hooks.track('voice_command'); processMessage(text); };
      const onStatus = status=>setStatus(status);
      if (model.voiceMode === 'simulation') mountSimulatedVoice(form,callback,onStatus);
      else mountVoice(form,callback,{onState:onStatus, onBeforeListen:stopReading, label:'Nói với Mia'});
      if (!model.tour) {
        const scroll = document.querySelector('.chatbot-scroll');
        const voice = document.querySelector('.chat-composer .voice-control');
        if (voice && scroll) {
          form.querySelector('.question-row').prepend(voice.querySelector('.voice-button'));
          scroll.append(voice);
        }
      }
    }
    requestAnimationFrame(()=> {
      const scroll = document.querySelector('.chatbot-scroll');
      if (model.active) document.querySelector('.chat-prompt')?.scrollIntoView({block:'nearest',behavior:'instant'});
      else if (model.messages.length && scroll) { document.querySelector('.chat-messages')?.scrollIntoView({block:'nearest',behavior:'instant'}); }
      positionTour();
    });
  }
  document.addEventListener('submit',event=>{ if(event.target.id==='help-form'){event.preventDefault();processMessage(new FormData(event.target).get('question') || '');} });
  document.addEventListener('change',event=> {
    if(event.target.id==='chat-voice-mode'){ stopVoice();model.voiceMode=event.target.value;setStatus('waiting');redraw(); }
    if(event.target.id==='chat-read-aloud'){model.autoRead=event.target.checked;if(!model.autoRead){stopReading();setStatus('waiting');}}
  });
  document.addEventListener('click',event=> {
    const button = event.target.closest('button'); if(!button || button.disabled) return;
    if (button.matches('.voice-button')) stopReading();
    if (intro && button.dataset.action === 'mia-intro-open') { event.stopImmediatePropagation(); dismissIntro(true); return; }
    if (button.dataset.chat === 'intro-dismiss') {dismissIntro();return;}
    if (model.tour && button.id === tourSteps[model.tour.destination][model.tour.index].target && model.tour.index < tourSteps[model.tour.destination].length-1) {
      model.tour.index++; model.tour.notice='';reply(tourSteps[model.tour.destination][model.tour.index].text);redraw();return;
    }
    if(button.dataset.chatField){choose(button.dataset.chatField,button.dataset.value);return;}
    if(button.dataset.chatEdit){model.edit=button.dataset.chatEdit;model.draft.accepted=false;askNext();return;}
    const action = button.dataset.chat;
    if(action==='cancel-wait'){hooks.cancelHelp();return;}
    if (!action || hooks.state.bookingBusy) return;
    if(action==='health-exit'){hooks.state.healthMode='app';hooks.state.healthHistory=[];model.messages=[];hooks.state.answer=null;hooks.open('mia');}
    else if(action==='start') startBooking();
    else if(action==='guide-menu'){reply('Bạn muốn mình hướng dẫn việc nào?');model.note='';redraw();const actions=document.createElement('div');actions.className='chat-guide-menu';actions.innerHTML=Object.entries(names).map(([key,name])=>`<button class="chat-choice" data-chat="guide-${key}">${name}</button>`).join('');document.querySelector('.chat-main-actions').after(actions);}
    else if(action.startsWith('guide-')) startTour(action.slice(6));
    else if(action==='appointments') openPage('appointments');
    else if(action==='specialty-help'){model.awaitingSymptoms=true;reply(bookingHelp('không rõ','service').text);redraw();}
    else if(action==='all-times'){model.draft.period='';redraw();}
    else if(action==='booking-back'){const fields=['profile','service','location','doctor','date','time','review'];const index=fields.indexOf(model.question);model.edit=fields[Math.max(0,index-1)];askNext();}
    else if(action==='booking-stop'){model.active=false;model.edit='';reply('Mình đã dừng đặt lịch. Chưa có lịch nào được tạo.');redraw();}
    else if(action==='confirm') { confirmBooking(); } else if(action==='tour-open') openPage(model.tour.destination);
    else if(action==='tour-stop'){model.tour=null;redraw();}
    else if(action==='tour-next'){
      if(model.tour.index===tourSteps[model.tour.destination].length-1){model.tour=null;reply('Bạn đã xem xong hướng dẫn. Mình vẫn ở đây khi bạn cần.');hooks.state.helpOpen=true;redraw();}
      else {model.tour.notice='Bạn hãy nhấn đúng nút được làm nổi bật trước nhé.';redraw();}
    } else if(action==='tour-back'){model.tour.index--;const step=tourSteps[model.tour.destination][model.tour.index];model.tour.notice='';hooks.open(step.screen);redraw();}
  });
  document.addEventListener('keydown', event => {if(intro && event.key==='Escape') dismissIntro();});
  window.addEventListener('resize',positionTour); window.addEventListener('scroll',positionTour,{passive:true});
  return { markup, mount, processMessage, readText:speak, stopReading,
    openHealth(mode){stopVoice();stopReading();model.tour=null;model.messages=[];model.active=false;model.note='';hooks.state.answer=null;hooks.state.healthMode=mode;hooks.state.helpOpen=true;reply(mode==='nutrition'?'Bạn đã ăn những món gì và bao nhiêu? Hãy cho Mia biết khẩu phần, cách chế biến và đồ uống để ước tính calo, đạm, tinh bột và chất béo.':'Bạn đang gặp triệu chứng gì? Hãy cho Mia biết tuổi, triệu chứng bắt đầu khi nào, mức độ và các dấu hiệu đi kèm. Mia hỗ trợ tìm hiểu và hướng dẫn mức độ cần khám, không thay thế chẩn đoán của bác sĩ.');redraw();},
    syncDraft(draft){model.draft={...draft,accepted:false};model.active=true;model.question=nextQuestion(model.draft,hooks.state.dates);try{sessionStorage.setItem('mia-draft',JSON.stringify(model.draft));}catch{}},
    startReplyStream({preserveMute=false}={}) { const muted=speechStreamMuted; stopReading(); speechStreamMuted = preserveMute && muted; speechStreamOpen = true; },
    replyDelta(text) { setStatus('answering'); if (!speechStreamMuted) speechBuffer.push(text); },
    endReplyStream() { if(!speechStreamMuted)speechBuffer.finish(); speechStreamOpen = false; finishSpeech(); },
    bookingResult(success,text) {
    if(!model.active) return;
    if(success){try{sessionStorage.removeItem('mia-draft');}catch{}model.active=false;model.submitted=true;model.note='';reply('Đã ghi nhận lịch hẹn mô phỏng. Trạng thái: Chờ xác nhận. Bạn có thể xem lại lịch hẹn.');}
    else {model.note=text;setStatus('answering');}
  }, cancelPending(){stopReading();model.version++;setStatus('waiting');}, reset(){stopReading();model.version++;Object.assign(model,{messages:[],active:false,draft:newDraft(),question:'',edit:'',tour:null,status:'waiting',submitted:false,note:''});}, collapse(){stopReading();stopVoice();setStatus('waiting');}, positionTour };
}
