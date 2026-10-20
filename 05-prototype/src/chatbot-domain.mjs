import { normalize, PROFILES, SERVICES, LOCATIONS, TIMES, validateBooking } from './domain.mjs';

export const DOCTORS = [
  { id: 'times-heart-lan', name: 'BS. Nguyễn Minh Lan', service: 'heart', location: 'times' },
  { id: 'times-general-an', name: 'BS. Trần Minh An', service: 'general', location: 'times' },
  { id: 'times-joint-binh', name: 'BS. Lê Thanh Bình', service: 'joint', location: 'times' },
  { id: 'central-heart-hai', name: 'BS. Phạm Minh Hải', service: 'heart', location: 'central' },
  { id: 'central-general-hoa', name: 'BS. Nguyễn Thanh Hoa', service: 'general', location: 'central' },
  { id: 'central-joint-nam', name: 'BS. Trần Hoài Nam', service: 'joint', location: 'central' },
  { id: 'halong-skin-linh', name: 'BS. Lê Minh Linh', service: 'skin', location: 'halong' },
  { id: 'times-eye-thao', name: 'BS. Nguyễn Thanh Thảo', service: 'eye', location: 'times' },
  { id: 'haiphong-ent-son', name: 'BS. Trần Minh Sơn', service: 'ent', location: 'haiphong' },
];
export const doctorsFor = (service, location) => DOCTORS.filter(d => d.service === service && d.location === location);
export function bookingHelp(message, question) {
  const text=normalize(message);
  if(/dau nguc|kho tho|bat tinh|chay mau khong cam|dot ngot/.test(text))return null;
  if(/khong ro|khong biet|chua biet|khong hieu/.test(text)) {
    const guidance = {
      profile:'Trong bài thử, chọn Bác An nếu đặt cho bản thân hoặc Bác Bình nếu đặt cho người thân. Cô/chú muốn đặt cho ai ạ?',
      location:'Cô/chú chọn cơ sở thuận tiện trong danh sách, ví dụ Times City ở Hà Nội hoặc Central Park ở TP. Hồ Chí Minh. Mia chưa chọn cơ sở thay cô/chú.',
      date:'Cô/chú có thể bấm một ngày trong danh sách hoặc nói “ngày đầu tiên trong danh sách”, “ngày thứ hai trong danh sách”. Mia chưa chọn ngày thay cô/chú.',
      time:'Cô/chú chọn một giờ còn trống trên màn hình, ví dụ nói “chín giờ” hoặc “hai giờ chiều”. Giờ bị làm mờ đã hết chỗ trong lịch mẫu.',
      review:'Cô/chú kiểm tra người khám, cơ sở, chuyên khoa, bác sĩ, ngày và giờ trên bản tóm tắt. Có thể bấm Sửa; chỉ xác nhận khi thông tin đã đúng. Lịch mẫu chưa gửi tới bệnh viện.',
    }[question];
    if(guidance)return {text:guidance};
  }
  if(question==='doctor' && /khong ro|khong biet|nao.*ranh|nao.*trong|ai cung duoc|tuy|bat ky/.test(text))
    return {doctor:'any',text:'Dạ, cô/chú không cần chọn bác sĩ cụ thể. Mia sẽ hiển thị các giờ còn trống trong lịch mẫu để cô/chú chọn; chưa tra được lịch thật của bệnh viện.'};
  if(question==='service' && /khong ro|khong biet|chua biet|khong hieu|goi y.*khoa|khoa nao/.test(text))
    return {askSymptoms:true,text:'Cô/chú đang có triệu chứng hoặc khó chịu ở đâu, bắt đầu từ khi nào ạ? Nếu chưa rõ hoặc không muốn chia sẻ, Mia có thể hỗ trợ chọn khám đa khoa sàng lọc (Nội tổng quát) trước.'};
  if(question==='symptoms') return {service:'general',text:'Dạ, mình có thể khám đa khoa sàng lọc (Nội tổng quát) trước để bác sĩ đánh giá và hướng dẫn chuyên khoa phù hợp. Cô/chú không bắt buộc kể triệu chứng để đặt lịch. Mia sẽ ghi vào bản nháp để cô/chú kiểm tra trước khi xác nhận.'};
  return null;
}
export function classifyRequest(message) {
  const text = normalize(message);
  if (/xac nhan.*dat lich/.test(text)) {
    const affirmative = /^(?:(?:mia oi|mia|toi|toi dong y|dong y|hay|vui long)[,\s]+)*xac nhan dat lich(?: (?:nay|ngay|nhe|a|di|luon|giup toi|cho toi))*[.!\s]*$/.test(text.trim());
    return {kind:affirmative?'confirm':'clarify_confirmation'};
  }
  if (/xac nhan.*dat lich|gui.*yeu cau|huy lich/.test(text)) return { kind: 'confirm' };
  const destination = /lich hen|lich da dat|xem.*lich/.test(text) ? 'appointments'
    : /thong tin ca nhan|cap nhat.*ho so/.test(text) ? 'personal'
      : /ket qua.*kham|ket qua.*xet nghiem/.test(text) && !/doc|giai thich|y nghia/.test(text) ? 'results'
        : /tim\s+(?:giup\s+)?bac si|danh sach.*bac si|trang.*bac si/.test(text) ? 'doctors' : '';
  if (destination) return { kind: /chi|cach|the nao|huong dan|o dau/.test(text) ? 'guide' : /mo|di den|chuyen|giup/.test(text) ? 'open' : 'guide', destination };
  if (/dau nguc|kho tho|trieu chung|chan doan|thuoc gi|benh gi|dau bung|doc ket qua|giai thich.*ket qua|chuyen khoa nao/.test(text)) return { kind: 'medical' };
  if (/dat.*lich|dat giup|dat cho|muon.*kham|kham tim/.test(text)) return { kind: 'booking' };
  return { kind: 'answer' };
}
export function extractBookingSlots(message, dates, context = {}) {
  let text = normalize(message);
  const spokenHours = { mot:1, hai:2, ba:3, tu:4, bon:4, nam:5, sau:6, bay:7, tam:8, chin:9, muoi:10, 'muoi mot':11, 'muoi hai':12 };
  text = text.replace(/\b(muoi mot|muoi hai|muoi|mot|hai|ba|tu|bon|nam|sau|bay|tam|chin)\s+gio\b/g, (_, word) => `${spokenHours[word]} gio`);
  const slots = {}, notes = [], invalidFields = [];
  // A short name must end or lead into booking details, not another specialty (e.g. nội tiết).
  const shortInternalMedicine = /\b(?:khoa noi|kham noi|noi khoa)(?=\s*(?:$|[,.!?;:])|\s+(?:ngay|luc|tai|o|cho|giup|nhe|a|vao|sang|chieu)\b)/.test(text);
  if (/nguoi than|bac binh|cho me|cho bo/.test(text)) slots.profile = 'family';
  else if (/ban than|bac an|cho toi|giup toi|cho minh/.test(text) || /^(toi|minh)( a)?[.!\s]*$/.test(text)) slots.profile = 'self';
  if (/tim mach|kham tim/.test(text)) slots.service = 'heart';
  else if (/noi tong quat|tong quat|da khoa|sang loc/.test(text) || shortInternalMedicine) slots.service = 'general';
  else if (/co xuong khop|kham khop/.test(text)) slots.service = 'joint';
  else if (/da lieu/.test(text)) slots.service = 'skin';
  else if (/khoa mat|kham mat/.test(text) || /^mat[.!\s]*$/.test(text)) slots.service = 'eye';
  else if (/tai mui hong/.test(text)) slots.service = 'ent';
  if (/times city/.test(text)) slots.location = 'times';
  else if (/central park/.test(text)) slots.location = 'central';
  else if (/smart city/.test(text)) slots.location = 'smart';
  else if (/ha long/.test(text)) slots.location = 'halong';
  else if (/hai phong/.test(text)) slots.location = 'haiphong';
  else if (/da nang/.test(text)) slots.location = 'danang';
  const doctor = DOCTORS.find(d => text.includes(normalize(d.name.replace('BS. ', ''))));
  if (doctor) { slots.doctor = doctor.id; slots.service = doctor.service; slots.location = doctor.location; }
  if (/khong.*bac si|bat ky.*bac si/.test(text)) slots.doctor = 'any';
  if (/\bsang\b/.test(text.replace(/\bdoi sang\b/g,''))) slots.period = 'morning';
  else if (/chieu/.test(text)) slots.period = 'afternoon';
  const listDay = text.match(/ngay\s+(dau tien|thu\s+(nhat|hai|ba|tu|nam|sau|bay))(?:\s+(?:trong danh sach|con lich|dang hien thi))?/);
  if (listDay) {
    const index = listDay[1] === 'dau tien' ? 0 : ({nhat:0,hai:1,ba:2,tu:3,nam:4,sau:5,bay:6})[listDay[2]];
    slots.date = dates[index]?.id;
    if (!slots.date) { invalidFields.push('date'); notes.push('Ngày này chưa có trong danh sách. Bạn chọn lại nhé.'); }
  }
  else if (/ngay mot|ngay kia/.test(text)) slots.date = dates[1]?.id;
  else if (/ngay mai|sang mai|chieu mai/.test(text)) slots.date = dates[0]?.id;
  else if (/hom nay/.test(text)) { invalidFields.push('date'); notes.push('Hôm nay chưa có khung giờ mẫu. Bạn chọn một ngày trong danh sách nhé.'); }
  else {
    const weekday = text.match(/thu\s+(hai|ba|tu|nam|sau|bay|2|3|4|5|6|7)|chu nhat/);
    if (weekday) {
      const dayIndex = weekday[0] === 'chu nhat' ? 0 : ({ hai:1, ba:2, tu:3, nam:4, sau:5, bay:6, 2:1, 3:2, 4:3, 5:4, 6:5, 7:6 })[weekday[1]];
      slots.date = dates.find(d => new Date(d.id + 'T05:00:00Z').getUTCDay() === dayIndex)?.id;
    }
    const numeric = text.match(/ngay\s+(\d{1,2})(?:[\/.-](\d{1,2})(?:[\/.-](\d{4}))?)?/);
    if (numeric) {
      const matches = dates.filter(d => d.day === Number(numeric[1]) && (!numeric[2] || d.month === Number(numeric[2])) && (!numeric[3] || d.id.startsWith(numeric[3])));
      if (matches.length === 1) slots.date = matches[0].id;
      else { delete slots.date; invalidFields.push('date'); notes.push('Ngày này chưa có trong lịch mẫu. Bạn chọn lại ngày để mình ghi nhận chính xác nhé.'); }
    }
  }
  // A correction can mention the rejected hour first; parse the explicit replacement.
  const timeText = text.split(/\bdoi sang\b/).at(-1);
  const hour = timeText.match(/\b(\d{1,2}):(\d{2})\b/) || timeText.match(/\b(\d{1,2})\s*(?:gio|h)(?:\s*(\d{2}))?\b/);
  if (hour) {
    let value = Number(hour[1]); if (slots.period === 'afternoon' && value < 12) value += 12;
    const time = `${String(value).padStart(2,'0')}:${hour[2] || '00'}`;
    if (TIMES.some(t => t.id === time) && !((slots.date || context.date) === dates[0]?.id && time === '10:00')) slots.time = time;
    else { invalidFields.push('time'); notes.push('Giờ này chưa còn chỗ trong lịch mẫu. Bạn chọn một khung giờ khác nhé.'); }
  }
  return { slots, notes, invalidFields };
}
export function nextQuestion(draft, dates) {
  if (!PROFILES.some(p => p.id === draft.profile)) return 'profile';
  if (!SERVICES.some(s => s.id === draft.service)) return 'service';
  if (!LOCATIONS.some(l => l.id === draft.location)) return 'location';
  if (draft.doctor !== 'any' && !doctorsFor(draft.service, draft.location).some(d => d.id === draft.doctor)) return 'doctor';
  if (!dates.some(d => d.id === draft.date)) return 'date';
  if (!TIMES.some(t => t.id === draft.time) || (draft.date === dates[0]?.id && draft.time === '10:00')) return 'time';
  return 'review';
}
export function validateChatBooking(draft, dates) {
  if (nextQuestion(draft, dates) !== 'review') return 'Bạn kiểm tra lại thông tin và bác sĩ trước khi xác nhận nhé.';
  return validateBooking(draft, dates);
}
