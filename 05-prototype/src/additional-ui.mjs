import { PROFILES, LOCATIONS, SERVICES, TIMES, newDraft, summary, validateBooking } from './domain.mjs';
import { DOCTORS, doctorsFor, validateChatBooking } from './chatbot-domain.mjs';
const esc = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createAdditionalUI(hooks) {
  const model={draft:newDraft(),dialog:'',picker:'',selected:'',date:'',time:'',step:1,terms:false,privacy:false,error:'',reason:'Khám theo lịch mẫu',gender:'female',result:false};
  const action=(label,key,cls='mia-primary',disabled=false)=>`<button type="button" class="${cls}" data-mia="${key}" ${disabled?'disabled':''}>${label}</button>`;
  const heading=title=>`<header class="ref-page-header"><button data-ui="back" aria-label="Quay lại trang chủ">←</button><h1 id="page-title" tabindex="-1">${title}</h1><span></span></header>`;
  const field=(label,key,value)=>`<label class="mia-field"><span>${label} <b>*</b></span><button type="button" aria-label="${label}" data-mia="${key}">${esc(value || label)}<span>⌄</span></button></label>`;
  function miaPage() {
    return `<section class="ref-page mia-page">${heading('Trợ lý sức khỏe AI MIA')}<div class="mia-welcome"><img class="mia-character" src="/assets/mia.png" alt="Nhân vật MIA" aria-label="Nhân vật trợ lý MIA"><h2>Chào ${esc(hooks.state.demoProfile.name)},<br>hôm nay bạn thế nào?</h2></div><section class="mia-tools" aria-label="Ứng dụng MIA"><button data-mia="symptoms" aria-label="Kiểm tra triệu chứng"><i class="mia-blue">♙</i><strong>Kiểm tra triệu chứng</strong><span>Mô tả triệu chứng, nhận giải thích và hướng dẫn đi khám</span></button><button data-mia="nutrition" aria-label="Phân tích dinh dưỡng"><i class="mia-pink">♧</i><strong>Phân tích dinh dưỡng</strong><span>Nhập món ăn và khẩu phần, ước tính calo và dinh dưỡng</span></button><button data-mia="book" aria-label="Đặt lịch khám"><i class="mia-green">✚</i><strong>Đặt lịch khám</strong><span>Đặt lịch mẫu với bác sĩ và cơ sở phù hợp</span></button><button data-mia="connections" aria-label="Liên kết ứng dụng"><i class="mia-orange">♡</i><strong>Liên kết ứng dụng</strong><span>Xem lựa chọn kết nối dữ liệu sức khỏe</span></button></section><div class="mia-chat-preview"><p>Trợ lý giúp bạn đặt lịch và tìm đúng chức năng trong app.</p>${action('Trò chuyện với MIA','chat','mia-text')}<small>Prototype · Không phải dịch vụ tư vấn y khoa thật</small></div></section>`;
  }
  function manualPage() {
    const d=model.draft;
    return `<section class="ref-page manual-booking">${heading('Đặt lịch hẹn')}<form id="manual-booking-form"><h2>Chọn khách hàng</h2><div class="manual-profiles">${PROFILES.map(p=>`<button type="button" data-manual-profile="${p.id}" aria-pressed="${d.profile===p.id}" class="${d.profile===p.id?'selected':''}"><span>♙</span>${p.name}<small>${p.relation}</small></button>`).join('')}</div><h2>Thông tin người đặt lịch</h2><label>Họ và tên<input value="${esc(PROFILES.find(p=>p.id===d.profile)?.name || 'Bác An')}" readonly></label><label>Năm sinh<input value="1958" readonly></label><div class="manual-gender"><span>Giới tính mẫu</span>${action('Nam','male',model.gender==='male'?'selected':'mia-text')}${action('Nữ','female',model.gender==='female'?'selected':'mia-text')}</div><h2>Thông tin đặt hẹn</h2><label>Cơ sở khám<select id="manual-location" required><option value="">Chọn địa điểm</option>${LOCATIONS.map(l=>`<option value="${l.id}" ${d.location===l.id?'selected':''}>${l.name}</option>`).join('')}</select></label><label>Chuyên khoa<select id="manual-service" required><option value="">Chọn chuyên khoa</option>${SERVICES.map(s=>`<option value="${s.id}" ${d.service===s.id?'selected':''}>${s.name}</option>`).join('')}</select></label><label>Bác sĩ<select id="manual-doctor"><option value="any">Không chọn bác sĩ cụ thể</option>${doctorsFor(d.service,d.location).map(doc=>`<option value="${doc.id}" ${d.doctor===doc.id?'selected':''}>${doc.name}</option>`).join('')}</select></label><h2>Lịch hẹn</h2><label>Ngày khám<select id="manual-date" required><option value="">Chọn ngày khám mong muốn</option>${hooks.state.dates.map(date=>`<option value="${date.id}" ${d.date===date.id?'selected':''}>${date.label}</option>`).join('')}</select></label><label>Giờ khám<select id="manual-time" required><option value="">Chọn giờ khám</option>${TIMES.map(t=>`<option value="${t.id}" ${d.time===t.id?'selected':''} ${d.date===hooks.state.dates[0].id&&t.id==='10:00'?'disabled':''}>${t.id}${d.date===hooks.state.dates[0].id&&t.id==='10:00'?' · Hết chỗ':''}</option>`).join('')}</select></label><label>Lý do khám<textarea id="manual-reason" maxlength="100">${esc(model.reason)}</textarea></label><p class="mia-demo">Chỉ dùng dữ liệu mẫu. Không nhập số điện thoại hoặc thông tin sức khỏe thật.</p>${action('ĐẶT HẸN','manual-review','mia-primary',Boolean(validateBooking({...d,accepted:true},hooks.state.dates)))}</form></section>`;
  }
  function modal() {
    if(!model.dialog) return '';
    let title='',body='';
    if(model.dialog==='types'){ title='Đặt lịch hẹn';body=`<div class="booking-types">${action('Tham vấn tâm lý từ xa','remote','mia-choice')}${action('Khám chuyên khoa tại bệnh viện','hospital','mia-choice')}${action('Đặt hẹn theo mẫu','manual','mia-text')}</div>`; }
    else if(model.dialog==='unavailable'){title='Dịch vụ tham chiếu';body=`<p>${esc(model.error)}</p>${action('Đóng','close')}`;}
    else if(model.dialog==='result'){title='Đã ghi nhận lịch hẹn mô phỏng';body=`<div class="mia-result-icon">✓</div><p>Chờ xác nhận · Mô phỏng</p><p>Lịch được lưu trong phiên này, chưa gửi tới bệnh viện.</p>${action('Xem lịch hẹn','appointments')}`;}
    else if(model.picker) { title=({location:'Lựa chọn cơ sở khám',service:'Lựa chọn chuyên khoa',doctor:'Lựa chọn bác sĩ',schedule:'Lựa chọn thời gian khám'})[model.picker];body=picker(); }
    else {
      title=model.step===1?'Thông tin cơ bản':model.step===2?'Thông tin đặt lịch':'Xác nhận thông tin';
      body=`<div class="mia-progress">${[1,2,3].map(n=>`<span class="${n===model.step?'active':''}"></span>`).join('')}</div>${model.step===1?basics():model.step===2?details():review()}${model.error?`<p role="alert" class="mia-error">${esc(model.error)}</p>`:''}<footer class="mia-modal-footer"><span>${model.step}/3</span>${model.step>1?action('Quay lại','previous','mia-text'):''}${model.step<3?action('Tiếp theo','next','mia-primary',!validStep()):action(hooks.state.bookingBusy?'Đang ghi nhận…':'Xác nhận đặt lịch','confirm','mia-primary',!model.terms||!model.privacy||hooks.state.bookingBusy)}</footer>`;
    }
    return `<dialog id="mia-dialog" class="mia-dialog ${model.dialog==='types'?'mia-sheet':''}" aria-labelledby="mia-title"><header><h2 id="mia-title">${title}</h2><button data-mia="close" aria-label="Đóng màn hình">×</button></header>${body}</dialog>`;
  }
  function basics() {
    const d=model.draft;
    return `<label class="mia-field"><span>Hồ sơ khám <b>*</b></span><select id="mia-profile">${PROFILES.map(p=>`<option value="${p.id}" ${d.profile===p.id?'selected':''}>${p.name} (${p.relation})</option>`).join('')}</select></label>${field('Chọn cơ sở khám','pick-location',LOCATIONS.find(l=>l.id===d.location)?.name)}<label class="mia-field"><span>Lý do khám <b>*</b></span><textarea id="mia-reason" rows="3" maxlength="100">${esc(model.reason)}</textarea><small>Thông tin giả định · Tối đa 100 ký tự</small></label>`;
  }
  function details() {
    const d=model.draft,doctor=DOCTORS.find(doc=>doc.id===d.doctor);
    return `${field('Chọn chuyên khoa','pick-service',SERVICES.find(s=>s.id===d.service)?.name)}${field('Chọn bác sĩ','pick-doctor',doctor?.name || (d.doctor==='any'?'Không chọn bác sĩ cụ thể':''))}${field('Chọn thời gian khám','pick-schedule',d.date&&d.time?`${summary(d,hooks.state.dates).date} · ${d.time}`:'')}<p class="mia-demo">Bác sĩ và giờ khám là dữ liệu mẫu nhất quán trong prototype.</p>`;
  }
  function review() {
    const d=model.draft,s=summary(d,hooks.state.dates);
    const rows=[['Họ và tên',s.person,'profile'],['Cơ sở khám',s.location,'location'],['Chuyên khoa',s.service,'service'],['Bác sĩ',DOCTORS.find(doc=>doc.id===d.doctor)?.name || 'Không chọn bác sĩ cụ thể','doctor'],['Thời gian khám',`${s.date} · ${s.time}`,'schedule'],['Lý do khám',model.reason,'reason']];
    return `<h3>Thông tin người đặt lịch</h3><dl class="mia-review">${rows.map(([label,value,key])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd><button data-mia-edit="${key}" aria-label="Sửa ${label.toLowerCase()}" ${hooks.state.bookingBusy?'disabled':''}>›</button></div>`).join('')}</dl><p class="mia-demo">Không có phí hoặc lịch khám thật được tạo.</p><label class="mia-check"><input id="mia-terms" type="checkbox" ${model.terms?'checked':''}>Tôi đồng ý với điều khoản sử dụng mẫu</label><label class="mia-check"><input id="mia-privacy" type="checkbox" ${model.privacy?'checked':''}>Tôi đồng ý với chính sách bảo mật mẫu</label>`;
  }
  function picker() {
    if(model.picker==='schedule') {
      const date=model.date,selected=hooks.state.dates.find(d=>d.id===date) || hooks.state.dates[0];
      return `<h3>${selected?'Tháng '+selected.month+', '+selected.id.slice(0,4):'Chọn ngày'}</h3>${calendar(selected,date)}<h3>Giờ khám</h3>${date?`<div class="mia-times">${TIMES.map(t=>`<button data-mia-time="${t.id}" ${date===hooks.state.dates[0].id&&t.id==='10:00'?'disabled':''} class="${model.time===t.id?'selected':''}">${t.id}</button>`).join('')}</div>`:'<p>Chọn ngày để xem giờ còn trống.</p>'}${action('Xác nhận','picker-confirm','mia-primary',!date||!model.time)}`;
    }
    const items=model.picker==='location'?LOCATIONS:model.picker==='service'?SERVICES:[...doctorsFor(model.draft.service,model.draft.location),{id:'any',name:'Không chọn bác sĩ cụ thể'}];
    return `<input class="mia-picker-search" placeholder="Tìm ${model.picker==='location'?'cơ sở':model.picker==='service'?'chuyên khoa':'bác sĩ'}" aria-label="Tìm trong danh sách"><div class="mia-picker-list">${items.map(item=>`<button aria-label="${item.name}" data-mia-value="${item.id}" data-search="${esc(item.name.toLocaleLowerCase('vi'))}" class="${model.selected===item.id?'selected':''}"><strong>${item.name}</strong>${item.detail?`<small>${esc(item.detail)}</small>`:''}</button>`).join('')}</div>${action('Xác nhận','picker-confirm','mia-primary',!model.selected)}`;
  }
  function calendar(selected,date) {
    const year=Number(selected.id.slice(0,4)),month=selected.month;
    const offset=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;
    const count=new Date(Date.UTC(year,month,0)).getUTCDate();
    const slots=Array.from({length:offset},()=>'<span></span>');
    for(let day=1;day<=count;day++) {
      const id=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const available=hooks.state.dates.find(d=>d.id===id);
      slots.push(available?`<button data-mia-date="${id}" aria-label="${esc(available.label)}" class="${date===id?'selected':''}">${day}</button>`:`<button disabled>${day}</button>`);
    }
    return `<div class="mia-weekdays">${['T2','T3','T4','T5','T6','T7','CN'].map(day=>`<span>${day}</span>`).join('')}</div><div class="mia-calendar">${slots.join('')}</div><p class="mia-demo">Ngày đậm có giờ mẫu còn trống.</p>${hooks.state.dates.some(d=>d.month!==month)?`<div class="mia-next-month">${hooks.state.dates.filter(d=>d.month!==month).map(d=>`<button data-mia-date="${d.id}">${d.day}/${d.month}</button>`).join('')}</div>`:''}`;
  }
  function validStep(){return model.step===1?Boolean(model.draft.profile&&model.draft.location&&model.reason.trim()):!validateChatBooking({...model.draft,accepted:true},hooks.state.dates);}
  function renderDialog(){const composer=document.querySelector('#mia-dialog .chat-composer');composer?.remove();document.querySelector('#mia-dialog')?.remove();if(!model.dialog)return;document.querySelector('#app').insertAdjacentHTML('beforeend',modal());const dialog=document.querySelector('#mia-dialog');if(composer&&model.dialog==='booking')dialog.append(composer);dialog.showModal();dialog.addEventListener('cancel',event=>{event.preventDefault();if(!hooks.state.bookingBusy)closeDialog();},{once:true});}
  function closeDialog(){if(model.picker){model.picker='';renderDialog();}else{model.dialog='';document.querySelector('#mia-dialog')?.close();}}
  function openTypes(){hooks.collapse();model.dialog='types';model.error='';renderDialog();}
  function start(){model.draft={...newDraft(),profile:'self',doctor:'any'};model.dialog='booking';model.step=1;model.terms=false;model.privacy=false;model.error='';model.picker='';model.reason='Khám theo lịch mẫu';hooks.collapse();hooks.syncDraft(model.draft);hooks.render();}
  function choosePicker(key){model.picker=key;model.selected=model.draft[key] || '';model.date=model.draft.date;model.time=model.draft.time;renderDialog();}
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled||hooks.state.bookingBusy)return;
    if(button.dataset.manualProfile){model.draft.profile=button.dataset.manualProfile;hooks.render();return;}
    if(button.dataset.miaValue){model.selected=button.dataset.miaValue;renderDialog();return;}
    if(button.dataset.miaDate){model.date=button.dataset.miaDate;model.time='';renderDialog();return;}
    if(button.dataset.miaTime){model.time=button.dataset.miaTime;renderDialog();return;}
    if(button.dataset.miaEdit){const key=button.dataset.miaEdit;model.terms=false;model.privacy=false;model.step=['profile','location','reason'].includes(key)?1:2;if(['location','service','doctor','schedule'].includes(key))choosePicker(key);else renderDialog();return;}
    const key=button.dataset.mia;if(!key)return;
    if(key==='types')openTypes();
    else if(key==='close')closeDialog();
    else if(key==='hospital'){model.dialog='';hooks.open('mia');}
    else if(key==='manual'){model.dialog='';model.draft={...newDraft(),profile:'self',doctor:'any'};hooks.open('manual-booking');}
    else if(key==='book')start();
    else if(key==='chat'){hooks.state.helpOpen=true;hooks.render();}
    else if(key==='symptoms'||key==='nutrition'){model.dialog='';model.picker='';hooks.openHealth(key);}
    else if(['remote','symptoms','nutrition','connections'].includes(key)){model.dialog='unavailable';model.error=key==='symptoms'?'Prototype hỗ trợ thao tác app và đặt lịch, không chẩn đoán hoặc đề xuất bệnh từ triệu chứng. Bạn có thể đặt lịch theo chuyên khoa đã biết.':key==='nutrition'?'Chưa kết nối dịch vụ phân tích dinh dưỡng từ ảnh.':'Chưa kết nối dịch vụ thật. Màn hình này chỉ để trình diễn giao diện tham chiếu.';renderDialog();}
    else if(key.startsWith('pick-'))choosePicker(key.slice(5));
    else if(key==='picker-confirm'){
      if(model.picker==='schedule'){model.draft.date=model.date;model.draft.time=model.time;}
      else {if(['location','service'].includes(model.picker)&&model.selected!==model.draft[model.picker])model.draft.doctor='any';model.draft[model.picker]=model.selected;}
      model.picker='';model.terms=false;model.privacy=false;hooks.syncDraft(model.draft);renderDialog();
    } else if(key==='next'){if(!validStep())return;model.step++;renderDialog();}
    else if(key==='previous'){model.step--;model.terms=false;model.privacy=false;renderDialog();}
    else if(key==='manual-review'){if(validateBooking({...model.draft,accepted:true},hooks.state.dates))return;model.dialog='booking';model.step=3;model.terms=false;model.privacy=false;renderDialog();}
    else if(key==='confirm'){if(!model.terms||!model.privacy)return;const error=validateChatBooking({...model.draft,accepted:true},hooks.state.dates);if(error){model.error=error;renderDialog();return;}hooks.commit({...model.draft,accepted:true});}
    else if(key==='appointments'){model.dialog='';hooks.open('appointments');}
    else if(key==='male'||key==='female'){model.gender=key;hooks.render();}
  });
  document.addEventListener('change',event=>{
    const id=event.target.id;
    if(id==='mia-profile'){model.draft.profile=event.target.value;model.terms=false;model.privacy=false;hooks.syncDraft(model.draft);}
    if(id==='mia-terms')model.terms=event.target.checked;if(id==='mia-privacy')model.privacy=event.target.checked;
    if(['mia-terms','mia-privacy'].includes(id)){const confirm=document.querySelector('[data-mia="confirm"]');if(confirm)confirm.disabled=!model.terms||!model.privacy||hooks.state.bookingBusy;}
    if(id.startsWith('manual-')&&['location','service','doctor','date','time'].includes(id.slice(7))){const key=id.slice(7);model.draft[key]=event.target.value;if(['location','service'].includes(key))model.draft.doctor='any';if(key==='date')model.draft.time='';hooks.render();}
  });
  document.addEventListener('input',event=>{
    if(['mia-reason','manual-reason'].includes(event.target.id)){model.reason=event.target.value.slice(0,100);model.terms=false;model.privacy=false;const next=document.querySelector('[data-mia="next"]');if(next)next.disabled=!validStep();}
    if(event.target.classList.contains('mia-picker-search')){const query=event.target.value.toLocaleLowerCase('vi');document.querySelectorAll('.mia-picker-list>button').forEach(button=>button.hidden=!button.dataset.search.includes(query));}
  });
  return {fromVoice(draft){model.draft={...draft};model.dialog='booking';model.picker='';model.step=validateChatBooking({...draft,accepted:true},hooks.state.dates)?(draft.profile&&draft.location?2:1):3;model.terms=false;model.privacy=false;hooks.render();},page(key){return key==='mia'?miaPage():manualPage();},openTypes,mount(){if(model.dialog){renderDialog();if(hooks.state.miaPage){const composer=document.querySelector('.chat-composer');const dialog=document.querySelector('#mia-dialog');if(composer&&dialog&&model.dialog==='booking')dialog.append(composer);}}},result(success,text){if(model.dialog!=='booking')return;if(success){model.dialog='result';model.error='';}else model.error=text;renderDialog();},reset(){model.dialog='';model.picker='';model.draft=newDraft();}};
}
