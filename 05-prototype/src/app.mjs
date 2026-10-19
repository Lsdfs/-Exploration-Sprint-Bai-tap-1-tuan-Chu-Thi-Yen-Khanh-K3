import { readReplyStream } from './reply-stream.mjs';
import { createAdditionalUI } from './additional-ui.mjs';
import { createChatbot } from './chatbot.mjs';
import { DOCTORS } from './chatbot-domain.mjs';
import { referenceHome, referenceNav, referencePage, referenceDialog } from './reference-ui.mjs';
let referenceScreen = '';
import { PROFILES, LOCATIONS, SERVICES, TIMES, STEPS, GUIDES, availableDates, newDraft, validateStep, validateBooking, summary } from './domain.mjs';
import { stopVoice } from './voice.mjs';

const icons = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="m14 5-7 7 7 7M7 12h14"/>',
  home: '<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  help: '<path d="M21 11.5a9 9 0 0 1-9 9H4l-2 2v-11a9 9 0 1 1 19 0Z"/><path d="M9.5 8a2.5 2.5 0 1 1 4 2l-1.5 1v1m0 3h.01"/>',
  volume: '<path d="m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  book: '<path d="M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v15h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3zM12 6v15"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.help}</svg>`;
const esc = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const root = document.querySelector('#app');
const state = {
  screen: 'home', step: 0, draft: newDraft(), dates: availableDates(), appointments: [],
  guided: true, large: false, error: '', bookingBusy: false, editReturn: false,
  helpBusy: false, answer: null, config: { provider: 'mock', ready: true }, configLoaded: false,
  consent: true, dialog: false, resetPending: false, failNext: false, helpCount: 0, helpOpen: false,
  started: Date.now(), events: [], run: crypto.randomUUID(), submitted: new Set(), lastStep: 1,
};
const chatbot = createChatbot({ state, render, ask, track, speaking: () => speaking,
  miaWelcome: () => additionalUI.page('mia'),
  referenceBooking(draft) { additionalUI.fromVoice(draft); },
  cancelHelp: () => { stopHelp(); announce('Đã dừng chờ. Bạn có thể thử lại.'); render(); },
  open(destination) {
    if (['home','appointments'].includes(destination)) navigate(destination);
    else { stopHelp(); document.querySelector('#reference-dialog')?.close(); state.screen='home'; state.step=0; referenceScreen=destination; render(true); }
  },
  commit(draft) {
    state.draft={...draft}; submit('chat');
    if(state.error) { chatbot.bookingResult(false,state.error); render(); }
  },
});
const additionalUI = createAdditionalUI({state,render,
  openHealth(mode){stopHelp();state.healthMode=mode;state.healthHistory=[];chatbot.openHealth(mode);},
  syncDraft(draft){chatbot.syncDraft(draft);},
  collapse(){state.helpOpen=false;chatbot.collapse();},
  open(destination){if(['home','appointments'].includes(destination))navigate(destination);else{stopHelp();referenceScreen=destination;state.screen='home';state.step=0;render(true);}},
  commit(draft){state.draft={...draft};submit('mia');if(state.error){additionalUI.result(false,state.error);render();}}
});
state.demoProfile = { name: 'Bác An', year: '1958' };
state.profileSaved = false;
try {
  const saved = JSON.parse(sessionStorage.getItem('mia-appointments') || '[]');
  if (Array.isArray(saved)) state.appointments = saved.filter(a => a && !validateBooking({...a, accepted:true}, [{id:a.date}]) && /^\d{4}-\d{2}-\d{2}$/.test(a.date) && typeof a.id === 'string').slice(-50);
  for (const a of state.appointments) state.submitted.add(['profile','location','service','date','time'].map(k=>a[k]).concat(a.doctor || 'any').join('|'));
} catch {}
let helpController;
let requestVersion = 0;
let bookingTimer;
let speaking = false;

function track(event, detail = {}) {
  state.events.push({ event, screen: state.screen, elapsedMs: Date.now() - state.started, ...detail });
}
function stopHelp() {
  chatbot.cancelPending();
  stopVoice();
  requestVersion++;
  helpController?.abort();
  state.helpBusy = false;
  state.answer = null;
  chatbot.stopReading();
  speaking = false;
}
function announce(text) { document.querySelector('#announcer').textContent = text; }
function navigate(screen, step = 0) {
  state.healthMode='app';state.healthHistory=[];
  if (state.bookingBusy) return;
  stopHelp();
  referenceScreen = '';
  document.querySelector('#reference-dialog')?.close();
  state.screen = screen;
  state.step = step;
  if (step) state.lastStep = step;
  state.error = '';
  track('screen');
  render(true);
}
function goStep(step) { navigate(['', 'person', 'location', 'service', 'schedule', 'review'][step], step); }
function hasDraft() { return Object.values(state.draft).some(Boolean); }
function primary(text, action, id = '', extra = '') { return `<button class="button primary" data-action="${action}" ${id ? `id="${id}"` : ''} ${extra}>${text}${icon('arrow')}</button>`; }
function optionGroup(items, selected, field, id, type) {
  return `<div class="options" id="${id}" role="group" aria-label="${field === 'profile' ? 'Chọn người khám' : field === 'location' ? 'Chọn cơ sở' : 'Chọn chuyên khoa'}">${items.map(item => `<button class="option ${selected === item.id ? 'selected' : ''}" type="button" data-field="${field}" data-value="${item.id}" aria-pressed="${selected === item.id}"><span class="option-icon ${field === 'profile' ? 'avatar' : ''}">${field === 'profile' ? item.initial : icon(type)}</span><span class="option-copy"><strong>${esc(item.name)}</strong><span>${esc(item.relation || item.detail)}</span></span><span class="radio-mark">${selected === item.id ? icon('check') : ''}</span></button>`).join('')}</div>`;
}
function header() {
  return `<header class="site-header"><a href="#" data-action="home" class="brand" aria-label="MyVinmec bản thử, về trang chủ"><span class="brand-mark">${icon('plus')}</span><span>MyVinmec<span class="brand-sub">Đồng hành từng bước</span></span></a><div class="header-actions"><button class="text-button" data-action="toggle-guide" aria-label="Hướng dẫn: ${state.guided ? 'Bật' : 'Tắt'}" aria-pressed="${state.guided}">${icon('help')}</button><button id="header-appointments" class="text-button ref-history" data-action="appointments" aria-label="Xem lịch hẹn thử">${icon('clock')}</button><span class="demo-tag">Bản thử · Lịch giả</span><button class="text-button font-button" data-action="font" aria-pressed="${state.large}" aria-label="${state.large ? 'Dùng chữ thường' : 'Dùng chữ lớn hơn'}"><span aria-hidden="true">A<span class="big-a">A</span></span><span>Chữ ${state.large ? 'thường' : 'lớn'}</span></button><button class="icon-button" aria-label="Công cụ dùng thử" data-action="tools">${icon('settings')}</button></div></header>`;
}
function navigation() {
  return `<aside class="sidebar"><div class="sidebar-label">KHÔNG GIAN CỦA CÔ/CHÚ</div><nav aria-label="Điều hướng chính"><button id="nav-home" class="nav-item ${state.screen === 'home' ? 'active' : ''}" data-action="home">${icon('home')}<span>Trang chủ</span></button><button class="nav-item ${state.step > 0 ? 'active' : ''}" data-action="start">${icon('calendar')}<span>Đặt lịch khám</span></button><button id="nav-appointments" class="nav-item ${state.screen === 'appointments' ? 'active' : ''}" data-action="appointments">${icon('clock')}<span>Lịch hẹn thử</span>${state.appointments.length ? `<span class="count">${state.appointments.length}</span>` : ''}</button></nav><div class="sidebar-note">${icon('shield')}<p>Yên tâm dùng thử<span>Mọi hồ sơ và lịch hẹn ở đây đều là dữ liệu giả.</span></p></div><button class="text-button about-button" data-action="about">${icon('book')} Về bản thử này</button></aside>`;
}
function illustration() {
  return `<svg class="hero-art" viewBox="0 0 260 235" fill="none" aria-hidden="true"><circle cx="142" cy="122" r="101" fill="#d6eee5"/><circle cx="220" cy="41" r="20" fill="#f5ce91"/><path d="M47 192c-8-36-7-52-18-66 23 2 32 24 32 41m148 16c5-24 4-43 19-58 9 30-2 48-19 58" stroke="#669f89" stroke-width="5" stroke-linecap="round"/><rect x="66" y="40" width="125" height="159" rx="17" fill="white" transform="rotate(6 66 40)"/><rect x="77" y="59" width="103" height="35" rx="9" fill="#138b7f" transform="rotate(6 77 59)"/><path d="m94 49-1 17m64-11-2 17" stroke="#153f3b" stroke-width="6" stroke-linecap="round"/><path d="m87 114 8 1m18 1 8 1m18 1 8 1m-62 19 8 1m18 1 8 1" stroke="#b4d2c8" stroke-width="7" stroke-linecap="round"/><circle cx="164" cy="166" r="38" fill="#f7d49e"/><path d="m147 164 12 12 23-26" stroke="#185149" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M41 73v15m-7-8h15" stroke="#78b2a3" stroke-width="3" stroke-linecap="round"/></svg>`;
}
function home() {
  return `<div class="eyebrow">CHĂM SÓC SỨC KHỎE, THEO CÁCH CỦA MÌNH</div><section class="welcome"><div><p class="greeting">Chào cô/chú,</p><h1 id="page-title" tabindex="-1">Đặt lịch nhẹ nhàng.<br>An tâm từng bước.</h1><p class="lead">Mình cùng chọn lịch phù hợp.<br>Cô/chú luôn được kiểm tra trước khi gửi.</p></div>${illustration()}</section><section class="home-actions" aria-label="Việc cô/chú có thể làm"><button id="start-booking" class="booking-card" data-action="start"><span class="card-icon">${icon('calendar')}</span><span><strong>${hasDraft() ? 'Tiếp tục đặt lịch' : 'Đặt lịch khám'}</strong><span>Chọn người khám, cơ sở và ngày giờ</span></span><span class="card-arrow">${icon('arrow')}</span></button><button class="appointment-shortcut" data-action="appointments"><span class="subtle-icon">${icon('clock')}</span><span><strong>Xem lịch hẹn thử</strong><span>${state.appointments.length ? `${state.appointments.length} yêu cầu trong phiên này` : 'Kiểm tra lại yêu cầu đã gửi'}</span></span>${icon('arrow')}</button></section><section class="reassurance"><span>${icon('user')} Chỉ dùng hồ sơ mẫu</span><span>${icon('check')} Tự kiểm tra từng lựa chọn</span></section><div class="home-footnote">Không có lịch khám thật nào được tạo trong bản thử này.</div>`;
}
function progress() {
  return `<div class="step-caption"><span>BƯỚC ${state.step} / 5</span><span>Cô/chú cứ thao tác theo nhịp của mình</span></div><ol class="progress" aria-label="Các bước đặt lịch">${STEPS.map((label, i) => `<li class="${i + 1 === state.step ? 'current' : i + 1 < state.step ? 'done' : ''}" ${i + 1 === state.step ? 'aria-current="step"' : ''}><span class="step-number">${i + 1 < state.step ? icon('check') : i + 1}</span><span>${label}</span></li>`).join('')}</ol>`;
}
function schedule() {
  return `<div id="schedule-options"><fieldset><legend>Ngày khám</legend><div class="dates">${state.dates.map((date, i) => `<button class="date-option ${state.draft.date === date.id ? 'selected' : ''}" data-field="date" data-value="${date.id}" aria-label="${esc(date.label)}" aria-pressed="${state.draft.date === date.id}"><span>${i === 0 ? 'Ngày mai' : new Intl.DateTimeFormat('vi-VN', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(date.id + 'T05:00:00Z'))}</span><strong>${date.day}</strong><span>Tháng ${date.month}</span></button>`).join('')}</div></fieldset><fieldset><legend>Giờ khám <span class="muted">· Lịch giả</span></legend><p class="field-hint">Chọn ngày trước, sau đó chọn một giờ còn trống.</p>${['morning', 'afternoon'].map(period => `<div class="period-label">${icon('clock')}${period === 'morning' ? 'Buổi sáng' : 'Buổi chiều'}</div><div class="times">${TIMES.filter(t => t.period === period).map(t => { const unavailable = state.draft.date === state.dates[0].id && t.id === '10:00'; return `<button class="time-option ${state.draft.time === t.id ? 'selected' : ''}" data-field="time" data-value="${t.id}" aria-pressed="${state.draft.time === t.id}" ${!state.draft.date || unavailable ? 'disabled' : ''} aria-label="${t.id}${unavailable ? ', hết chỗ' : ''}">${t.id}${unavailable ? '<small>Hết chỗ</small>' : ''}</button>`; }).join('')}</div>`).join('')}</fieldset></div>`;
}
function review() {
  const s = summary(state.draft, state.dates);
  return `<div class="review-details" id="review-details"><dl>${[[1, 'Người khám', s.person, 'user'], [2, 'Cơ sở', s.location, 'pin'], [3, 'Chuyên khoa', s.service, 'heart'], [4, 'Ngày và giờ', `${s.date} · ${s.time}`, 'calendar']].map(([step, label, value, glyph]) => `<div class="review-row">${icon(glyph)}<div><dt>${label}</dt><dd>${esc(value)}</dd></div><button class="text-button edit-button" data-edit="${step}" aria-label="Sửa ${label.toLowerCase()}" ${state.bookingBusy ? 'disabled' : ''}>Sửa</button></div>`).join('')}</dl></div><label class="check-label"><input id="accept-booking" type="checkbox" ${state.draft.accepted ? 'checked' : ''} ${state.bookingBusy ? 'disabled' : ''}><span>Tôi đã kiểm tra thông tin và hiểu đây là <strong>yêu cầu đặt lịch thử</strong>.</span></label>`;
}
function booking() {
  const titles = ['', 'Cô/chú đặt lịch cho ai?', 'Mình muốn khám ở đâu?', 'Chọn chuyên khoa muốn đặt', 'Ngày giờ nào thuận tiện?', 'Mình kiểm tra lại nhé'];
  const subtitles = ['', 'Chọn một hồ sơ mẫu để tiếp tục.', 'Chọn cơ sở theo tình huống dùng thử.', 'Chọn theo tình huống đã được giao, không nhập triệu chứng.', 'Các khung giờ dưới đây chỉ dùng để thử thao tác.', 'Chưa gửi yêu cầu. Cô/chú có thể sửa từng lựa chọn.'];
  return `${progress()}<div class="section-heading"><h1 id="page-title" tabindex="-1">${titles[state.step]}</h1><p class="lead">${subtitles[state.step]}</p></div><section class="form-card" aria-label="Thông tin đặt lịch">${state.step === 1 ? optionGroup(PROFILES, state.draft.profile, 'profile', 'profile-options', 'user') : state.step === 2 ? optionGroup(LOCATIONS, state.draft.location, 'location', 'location-options', 'pin') : state.step === 3 ? optionGroup(SERVICES, state.draft.service, 'service', 'service-options', 'heart') : state.step === 4 ? schedule() : review()}${state.error ? `<div class="error-box" role="alert">${esc(state.error)}</div>` : ''}<div class="form-footer"><button class="button secondary" id="back-step" data-action="back" ${state.bookingBusy ? 'disabled' : ''}>${icon('back')}Quay lại</button>${state.step === 5 ? primary(state.bookingBusy ? 'Đang ghi nhận…' : 'Gửi yêu cầu thử', 'submit', 'submit-booking', state.bookingBusy ? 'disabled aria-busy="true"' : '') : primary(state.editReturn ? 'Kiểm tra lại' : 'Tiếp tục', 'next', 'next-step')}</div></section><button class="text-button discard-button" data-action="discard" ${state.bookingBusy ? 'disabled' : ''}>Bỏ bản nháp này</button>`;
}
function success() {
  const appointment = state.appointments.at(-1);
  const s = summary(appointment, state.dates);
  return `<section class="success-content"><div class="success-icon">${icon('check')}</div><div class="eyebrow">ĐÃ GHI NHẬN TRONG BẢN THỬ</div><h1 id="page-title" tabindex="-1">Đã gửi yêu cầu thử</h1><p class="lead">Cô/chú đã hoàn thành các bước.<br>Yêu cầu này vẫn đang chờ xác nhận.</p><span class="status-pill">${icon('clock')}Chờ xác nhận · Mô phỏng</span><div class="success-summary"><strong>${esc(s.person)} · ${esc(s.service)}</strong><span>${esc(s.location)}</span><span>${esc(s.date)} · ${esc(s.time)}</span></div><p class="demo-explanation">Không gửi tới bệnh viện. Đây không phải lịch khám thật.</p>${primary('Xem lịch hẹn thử', 'appointments', 'view-appointments')}<button class="button secondary" data-action="home">Về trang chủ</button></section>`;
}
function appointments() {
  return `<div class="eyebrow">YÊU CẦU TRONG PHIÊN NÀY</div><div class="section-heading"><h1 id="page-title" tabindex="-1">Lịch hẹn thử của cô/chú</h1><p class="lead">Mình xem lại thông tin và trạng thái ở đây.</p></div><div id="appointment-list">${state.appointments.length ? `<div class="status-explanation">${icon('clock')}<p><strong>Chờ xác nhận chưa phải là đã có lịch.</strong><span>Tất cả yêu cầu dưới đây chỉ tồn tại trong phiên dùng thử này.</span></p></div>${state.appointments.map(a => { const s = summary(a, state.dates); return `<article class="appointment-card"><div class="appointment-date"><strong>${Number(a.date.slice(-2))}</strong><span>Tháng ${Number(a.date.slice(5, 7))}</span></div><div><span class="status-pill">Chờ xác nhận · Mô phỏng</span><h2>${esc(s.service)}</h2><p>${esc(s.person)} · ${esc(s.location)}</p><p>${esc(s.date)} · <strong>${esc(s.time)}</strong></p><p>Bác sĩ: ${esc(DOCTORS.find(d => d.id === a.doctor)?.name || 'Không chọn bác sĩ cụ thể')}</p><small>Mã thử ${esc(a.id)}</small></div></article>`; }).join('')}` : `<div class="empty-state">${icon('calendar')}<h2>Chưa có yêu cầu thử nào</h2><p>Sau khi gửi một yêu cầu thử, cô/chú sẽ thấy thông tin ở đây.</p>${primary('Đặt lịch khám', 'new-booking')}</div>`}</div>${state.appointments.length ? `<button class="button secondary" data-action="new-booking">${icon('plus')}Đặt thêm lịch thử</button>` : ''}`;
}
function assistant() { return chatbot.markup(); }
function tools() {
  return `<dialog id="research-dialog" aria-labelledby="tools-title"><div class="dialog-header"><h2 id="tools-title">Công cụ dùng thử</h2><button class="icon-button" data-action="close-tools" aria-label="Đóng công cụ">${icon('close')}</button></div><p>Thông tin phiên chỉ lưu trong bộ nhớ tab. Không lưu nội dung câu hỏi.</p><dl class="session-info"><div><dt>Phiên</dt><dd>${esc(state.run.slice(0, 8))}</dd></div><div><dt>Hướng dẫn</dt><dd>${state.guided ? 'Bật' : 'Tắt'}</dd></div><div><dt>Số yêu cầu thử</dt><dd>${state.appointments.length}</dd></div><div><dt>Số lần hỏi trợ lý</dt><dd>${state.helpCount}</dd></div></dl><label class="check-label"><input type="checkbox" id="simulate-submit-error" ${state.failNext ? 'checked' : ''}><span>Giả lập lỗi ở lần gửi yêu cầu kế tiếp</span></label><div class="dialog-buttons"><button class="button secondary" data-action="export">Tải log thao tác (JSON)</button><button class="button secondary" data-action="mark-help">Ghi nhận người điều phối giúp</button><button class="text-button danger" data-action="request-reset">Bắt đầu phiên mới</button></div>${state.resetPending ? '<div class="reset-confirm"><p>Xóa bản nháp, yêu cầu thử và log của phiên này? Tải log trước nếu cần giữ lại.</p><button class="button danger-button" data-action="confirm-reset">Xóa và bắt đầu lại</button></div>' : ''}<p class="fine-print">Log tự động chỉ ghi thao tác. Ghi chép đồng ý tham gia, quan sát và phản hồi nằm trong log thử người dùng riêng.</p></dialog><dialog id="discard-dialog" aria-labelledby="discard-title"><h2 id="discard-title">Bỏ bản nháp này?</h2><p>Các lựa chọn chưa gửi sẽ bị xóa. Những yêu cầu đã gửi trước đó vẫn được giữ trong phiên này.</p><div class="dialog-buttons"><button class="button primary" data-action="keep-draft">Tiếp tục đặt lịch</button><button class="button secondary" data-action="confirm-discard">Bỏ bản nháp</button></div></dialog><dialog id="about-dialog" aria-labelledby="about-title"><div class="dialog-header"><h2 id="about-title">Về bản thử này</h2><button class="icon-button" data-action="close-about" aria-label="Đóng giới thiệu">${icon('close')}</button></div><p>Đây là thiết kế đề xuất tham khảo hình ảnh MyVinmec công khai, chưa phải sản phẩm chính thức của Vinmec.</p><p>Hồ sơ, chuyên khoa được giao và giờ trống đều là dữ liệu mô phỏng. Không kết nối tài khoản hay hệ thống đặt lịch thật.</p><p>Cô/chú có thể dừng bất kỳ lúc nào. Không nhập thông tin cá nhân hoặc sức khỏe thật.</p><p>Chế độ mô phỏng dùng hướng dẫn viết sẵn. Khi có cấu hình OpenAI và được đồng ý, AI chỉ nhận diện ý câu hỏi; hướng dẫn hiển thị vẫn do ứng dụng kiểm soát.</p></dialog>`;
}
function render(focus = false) {
  state.miaPage = referenceScreen === 'mia';
  root.classList.toggle('mia-fullscreen', state.miaPage);
  if (state.miaPage) { state.helpOpen = true; state.guided = true; }
  const activeModal = root.querySelector('#reference-dialog[open]');
  const modalHtml = activeModal?.outerHTML;
  document.documentElement.classList.toggle('large-text', state.large);
  root.classList.add('reference-app');
  root.classList.toggle('chat-closed', !state.helpOpen);
  root.innerHTML = `${header()}<div class="app-shell"><div class="workspace"><div class="workspace-top"><span>${icon('heart')} Một chút chủ động, thêm phần an tâm</span><button class="text-button guide-toggle" data-action="toggle-guide" aria-pressed="${state.guided}">${icon('help')}Hướng dẫn: ${state.guided ? 'Bật' : 'Tắt'}</button></div><div class="content-grid"><main id="main-content">${referenceScreen === 'mia' ? '' : ['manual-booking'].includes(referenceScreen) ? additionalUI.page(referenceScreen) : referenceScreen ? referencePage(referenceScreen, state.demoProfile, state.profileSaved) : state.screen === 'home' ? referenceHome() : state.screen === 'success' ? success() : state.screen === 'appointments' ? appointments() : booking()}</main>${assistant()}</div><footer class="workspace-footer"><span>Thiết kế đề xuất · Dữ liệu mô phỏng</span><span>Cô/chú có thể dừng bất kỳ lúc nào</span></footer></div></div>${tools()}${profileConfirmDialog()}${referenceNav(state.screen)}`;
  if (modalHtml) {
    root.insertAdjacentHTML('beforeend', modalHtml);
    const modal = root.querySelector('#reference-dialog');
    modal.removeAttribute('open');
    modal.showModal();
  }
  chatbot.mount();
  additionalUI.mount();
  if (state.dialog) { const dialog = document.querySelector('#research-dialog'); dialog.showModal(); dialog.addEventListener('close', () => { state.dialog = false; state.resetPending = false; }, { once: true }); }
  if (focus) { document.querySelector('#page-title')?.focus({ preventScroll: true }); document.querySelector('#main-content')?.scrollIntoView({ behavior: 'instant', block: 'start' }); }
}
function next() {
  const error = validateStep(state.step, state.draft, state.dates);
  if (error) { state.error = error; track('validation_error', { step: state.step }); render(); return; }
  if (state.editReturn) { state.editReturn = false; goStep(5); } else goStep(state.step + 1);
}
function submit(source = 'legacy') {
  if (state.bookingBusy) return;
  const error = validateBooking(state.draft, state.dates);
  if (error) { state.error = error; track('validation_error', { step: 5 }); render(); return; }
  const fingerprint = ['profile', 'location', 'service', 'date', 'time'].map(key => state.draft[key]).concat(state.draft.doctor || 'any').join('|');
  if (state.submitted.has(fingerprint)) { state.error = 'Yêu cầu thử này đã có trong “Lịch hẹn thử”. Cô/chú không cần gửi lại.'; track('duplicate_prevented'); render(); return; }
  state.bookingBusy = true;
  state.error = '';
  stopHelp();
  track('submit_attempt');
  render();
  bookingTimer = setTimeout(() => {
    if (state.failNext) { state.failNext = false; state.bookingBusy = false; state.error = 'Chưa ghi nhận yêu cầu thử. Các lựa chọn vẫn còn, cô/chú bấm gửi lại khi sẵn sàng.'; track('submit_error'); if(source === 'chat') chatbot.bookingResult(false,state.error); if(source === 'mia') additionalUI.result(false,state.error); render(); return; }
    state.appointments.push({ ...state.draft, id: 'THU-' + String(state.appointments.length + 1).padStart(3, '0'), status: 'pending' });
    try { sessionStorage.setItem('mia-appointments', JSON.stringify(state.appointments)); } catch { announce('Không thể lưu khi tải lại tab. Lịch vẫn còn trong phiên đang mở.'); }
    state.submitted.add(fingerprint);
    state.bookingBusy = false;
    track('booking_completed', { durationMs: Date.now() - state.started });
    state.draft = newDraft();
    navigate('success');
    if(source === 'chat') { chatbot.bookingResult(true); render(); }
    if(source === 'mia') additionalUI.result(true);
  }, 450);
}
async function ask(question) {
  if (state.helpBusy || !state.guided || !state.configLoaded) return;
  if (['openai','gemini'].includes(state.config.provider) && !state.consent) { state.answer = { title: 'Cần cô/chú đồng ý trước', text: 'Tích ô đồng ý nếu muốn gửi câu hỏi dùng thử tới dịch vụ AI. Cô/chú vẫn có thể đọc hướng dẫn có sẵn mà không gửi câu hỏi.', target: null }; render(); return; }
  if (!question.trim()) { announce('Cô/chú nhập câu hỏi trước nhé.'); return; }
  state.helpBusy = true;
  state.helpStreaming = false;
  state.helpCount++;
  track('assistant_question');
  const version = ++requestVersion;
  const screen = state.screen;
  const healthMode=state.healthMode || 'app';
  const history=(state.healthHistory || []).slice(-6);
  helpController = new AbortController();
  const controller = helpController;
  const timeout = setTimeout(() => controller.abort(), 14000);
  state.helpSlow = false;
  const slowTimer = setTimeout(() => { if (version === requestVersion && state.helpBusy) { state.helpSlow = true; render(); } }, 4000);
  render();
  try {
    const response = await fetch('/api/help', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question.slice(0, 500), screen, consent: state.consent, stream: true,mode:healthMode,history }), signal: helpController.signal });
    if (!response.ok) throw new Error('Request failed');
    const current = () => version === requestVersion && screen === state.screen && state.guided;
    if (!current()) return;
    let data;
    chatbot.startReplyStream();
    if (response.headers.get('content-type')?.includes('ndjson')) {
      await readReplyStream(response, event => {
        if (!current()) return;
        if (event.type === 'meta') {
          if (typeof event.title !== 'string' || (event.target !== null && typeof event.target !== 'string')) throw new Error('Invalid reply');
          data = { ...event, text: '' };
          if(event.replace)chatbot.startReplyStream({preserveMute:true});
          state.answer={...data};
        } else if (event.type === 'delta') {
          if (!data) throw new Error('Missing metadata');
          data.text += event.text;
          state.helpStreaming=true;
          state.answer = { ...data };
          render();
          chatbot.replyDelta(event.text);
        }
      });
    } else {
      data = await response.json();
      if (current() && typeof data.text === 'string') chatbot.replyDelta(data.text);
    }
    if (!current()) return;
    if (!data || typeof data.title !== 'string' || typeof data.text !== 'string' || (data.target !== null && typeof data.target !== 'string')) throw new Error('Invalid reply');
    state.answer = data;
    if(healthMode!=='app'&&!data.fallback)state.healthHistory=[...history,{role:'user',content:question.slice(0,500)},{role:'assistant',content:data.text.slice(0,2000)}].slice(-6);
    chatbot.endReplyStream();
    track('assistant_reply', { provider: ['mock', 'local', 'openai','gemini'].includes(data.provider) ? data.provider : 'unknown', fallback: Boolean(data.fallback) });
  } catch {
    if (version !== requestVersion) return;
    state.answer = healthMode==='app'?{ ...GUIDES[screen], fallback: true }:{title:'Chưa thể phân tích',text:'Mia chưa thể phân tích lúc này. Bạn có thể thử lại; nếu triệu chứng nặng hoặc tăng nhanh, hãy liên hệ cơ sở y tế.',target:null,fallback:true};
    chatbot.startReplyStream({preserveMute:true});
    chatbot.replyDelta(state.answer.text);
    chatbot.endReplyStream();
    track('assistant_error');
  } finally {
    clearTimeout(slowTimer);
    clearTimeout(timeout);
    if (version === requestVersion) { state.helpBusy = false; render(); }
  }
}
function exportLog() {
  track('export');
  const blob = new Blob([JSON.stringify({ version: '0.1.0', run: state.run, startedAt: new Date(state.started).toISOString(), guided: state.guided, provider: state.config.provider, totalMs: Date.now() - state.started, appointments: state.appointments.length, events: state.events }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `thu-dat-lich-${state.run.slice(0, 8)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
root.addEventListener('click', event => {
  const button = event.target.closest('button, a[data-action]');
  if (!button || button.disabled) return;
  if (button.matches('a')) event.preventDefault();
  if (button.dataset.ui === 'mia') state.helpOpen=false;
  if (button.dataset.ui || button.dataset.detail) {
    if (state.bookingBusy) return;
    const key = button.dataset.ui;
    if (key === 'close') { document.querySelector('#reference-dialog')?.close(); return; }
    if (key === 'back') { navigate('home'); return; }
    if (key === 'appointments' && state.appointments.length) { navigate('appointments'); return; }
    if (button.dataset.detail || ['all','contact','benefits','support','photo','price-result','mother-detail','unavailable','search'].includes(key)) {
      document.querySelector('#reference-dialog')?.remove();
      root.insertAdjacentHTML('beforeend', referenceDialog(key, button.dataset.detail));
      document.querySelector('#reference-dialog').showModal();
    } else {
      document.querySelector('#reference-dialog')?.close();
      stopHelp(); state.screen = 'home'; state.step = 0; referenceScreen = key; state.error = ''; track('reference_screen', { destination: key }); render(true);
    }
    return;
  }
  if (button.dataset.field) {
    const { field, value } = button.dataset;
    state.draft[field] = value;
    state.draft.accepted = false;
    if (['location', 'service', 'date'].includes(field)) state.draft.time = '';
    state.error = '';
    track('selection', { field });
    // Refresh state-dependent controls but retain keyboard focus on the chosen option.
    render();
    root.querySelector(`[data-field="${field}"][data-value="${value}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.edit) { state.editReturn = true; state.draft.accepted = false; track('edit', { step: Number(button.dataset.edit) }); goStep(Number(button.dataset.edit)); return; }
  if (button.dataset.question) { ask(button.dataset.question); return; }
  if (button.dataset.ui === 'mia') state.helpOpen=false;
  const action = button.dataset.action;
  switch (action) {
    case 'home': navigate('home'); break;
    case 'start': state.helpOpen=false; state.editReturn = false; goStep(hasDraft() ? state.lastStep : 1); break;
    case 'new-booking': state.helpOpen=false; state.draft = newDraft(); state.editReturn = false; goStep(1); break;
    case 'appointments': navigate('appointments'); break;
    case 'next': next(); break;
    case 'back': if (state.editReturn) { state.editReturn = false; goStep(5); } else if (state.step === 1) navigate('home'); else goStep(state.step - 1); break;
    case 'submit': submit(); break;
    case 'font': state.large = !state.large; track('font_size', { large: state.large }); render(); break;
    case 'toggle-guide': stopHelp(); state.guided = !state.guided; track('guidance_toggle', { enabled: state.guided }); render(); break;
    case 'mobile-help': chatbot.collapse(); if(state.helpOpen){state.helpOpen=false; navigate('home');}else{stopHelp();referenceScreen='mia';state.screen='home';state.helpOpen=true;render(true);} break;
    case 'highlight': { const targetId = (state.answer || GUIDES[state.screen]).target; if (window.matchMedia('(max-width: 800px)').matches) { state.helpOpen = false; render(); } const target = document.getElementById(targetId); if (target) { target.classList.remove('highlight'); void target.offsetWidth; target.classList.add('highlight'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); track('highlight'); setTimeout(() => target.classList.remove('highlight'), 4000); } break; }
    case 'speak': {
      if(speaking){chatbot.stopReading();speaking=false;render();break;}
      const answer=state.answer || GUIDES[state.screen] || GUIDES.home;
      chatbot.readText(answer.text);track('listen');break;
    }
    case 'tools': state.dialog = true; render(); break;
    case 'close-tools': state.dialog = false; state.resetPending = false; document.querySelector('#research-dialog').close(); break;
    case 'about': document.querySelector('#about-dialog').showModal(); break;
    case 'close-about': document.querySelector('#about-dialog').close(); break;
    case 'export': exportLog(); break;
    case 'mark-help': track('moderator_help'); announce('Đã ghi nhận một lần người điều phối giúp.'); break;
    case 'request-reset': state.resetPending = true; render(); break;
    case 'confirm-reset':
      try { sessionStorage.removeItem('mia-appointments'); sessionStorage.removeItem('mia-draft'); } catch {}
      clearTimeout(bookingTimer); stopHelp(); chatbot.reset(); additionalUI.reset(); referenceScreen=''; state.demoProfile={name:'Bác An',year:'1958'}; state.profileSaved=false;
      Object.assign(state, { draft: newDraft(), appointments: [], submitted: new Set(), screen: 'home', step: 0, lastStep: 1, error: '', bookingBusy: false, editReturn: false, failNext: false, dialog: false, resetPending: false, helpCount: 0, consent: true, started: Date.now(), events: [], run: crypto.randomUUID() });
      track('session_start'); render(true); break;
    case 'discard': document.querySelector('#discard-dialog').showModal(); break;
    case 'keep-draft': document.querySelector('#discard-dialog').close(); break;
    case 'confirm-discard': state.draft = newDraft(); state.editReturn = false; state.lastStep = 1; track('draft_discarded'); navigate('home'); break;
  }
});
root.addEventListener('change', event => {
  if (event.target.id === 'price-hospital') root.querySelector('#check-price').disabled = !event.target.value;
  if (event.target.id === 'accept-booking') { state.draft.accepted = event.target.checked; state.error = ''; const error = root.querySelector('.error-box'); error?.remove(); }
  if (event.target.id === 'ai-consent') state.consent = event.target.checked;
  if (event.target.id === 'simulate-submit-error') state.failNext = event.target.checked;
});

document.addEventListener('keydown', event => { if (event.key === 'Escape') { state.dialog = false; state.resetPending = false; } });
track('session_start');
render();
fetch('/api/config').then(response => { if (!response.ok) throw new Error('Config'); return response.json(); }).then(config => { state.config = config; }).catch(() => { state.config = { provider: 'mock', ready: false }; }).finally(() => { state.configLoaded = true; render(); });

root.addEventListener('input', event => {
  if (event.target.id === 'medical-search') {
    const query = event.target.value.toLocaleLowerCase('vi');
    root.querySelectorAll('.medical-card').forEach(card => { card.hidden = !card.dataset.name.includes(query); });
  }
  if (event.target.id === 'community-search') {
    const query = event.target.value.toLocaleLowerCase('vi');
    root.querySelectorAll('.community-list > button').forEach(button => { button.hidden = !button.textContent.toLocaleLowerCase('vi').includes(query); });
  }
  if (event.target.id === 'doctor-search') {
    const query = event.target.value.toLocaleLowerCase('vi');
    root.querySelectorAll('.doctor-card').forEach(card => { card.hidden = !card.dataset.name.includes(query); });
  }
});

function profileConfirmDialog() {
  return '<dialog id="profile-confirm-dialog" aria-labelledby="profile-confirm-title"><h2 id="profile-confirm-title">Xác nhận lưu thông tin</h2><p>Thông tin mẫu chỉ được lưu trong phiên dùng thử này.</p><div class="dialog-buttons"><button class="button primary" data-action="save-profile-confirm">Xác nhận lưu</button><button class="button secondary" data-action="save-profile-cancel">Quay lại chỉnh sửa</button></div></dialog>';
}
root.addEventListener('submit',event=> {
  if(event.target.id !== 'personal-form') return;
  event.preventDefault();const data=new FormData(event.target);
  state.profilePending={name:String(data.get('name') || '').trim().slice(0,80),year:String(data.get('year') || '').trim()};
  if(!state.profilePending.name) return;
  document.querySelector('#profile-confirm-dialog').showModal();
});
root.addEventListener('click',event=> {
  const action=event.target.closest('button')?.dataset.action;
  if(action==='save-profile-confirm') { if(!state.profilePending) return; state.demoProfile={...state.profilePending};state.profilePending=null;state.profileSaved=true;track('profile_saved');render(); }
  if(action==='save-profile-cancel') { state.profilePending=null;document.querySelector('#profile-confirm-dialog').close(); }
});
