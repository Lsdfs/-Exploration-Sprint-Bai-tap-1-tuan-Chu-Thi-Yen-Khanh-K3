export const PROFILES = [
  { id: 'self', name: 'Bác An', relation: 'Bản thân', initial: 'A' },
  { id: 'family', name: 'Bác Bình', relation: 'Người thân', initial: 'B' },
];
export const LOCATIONS = [
  { id: 'times', name: 'Vinmec Times City', detail: 'Hà Nội · Địa điểm tham chiếu' },
  { id: 'central', name: 'Vinmec Central Park', detail: 'TP. Hồ Chí Minh · Địa điểm tham chiếu' },
  { id: 'smart', name: 'Vinmec Smart City', detail: 'Hà Nội · Địa điểm tham chiếu' },
  { id: 'halong', name: 'Vinmec Hạ Long', detail: 'Quảng Ninh · Địa điểm tham chiếu' },
  { id: 'haiphong', name: 'Vinmec Hải Phòng', detail: 'Hải Phòng · Địa điểm tham chiếu' },
  { id: 'danang', name: 'Vinmec Đà Nẵng', detail: 'Đà Nẵng · Địa điểm tham chiếu' },
];
export const SERVICES = [
  { id: 'general', name: 'Nội tổng quát', detail: 'Chọn theo tình huống được giao' },
  { id: 'heart', name: 'Tim mạch', detail: 'Chọn theo tình huống được giao' },
  { id: 'joint', name: 'Cơ xương khớp', detail: 'Chọn theo tình huống được giao' },
  { id: 'skin', name: 'Da liễu', detail: 'Chuyên khoa mẫu · Không tự suy từ triệu chứng' },
  { id: 'eye', name: 'Mắt', detail: 'Chuyên khoa mẫu · Không tự suy từ triệu chứng' },
  { id: 'ent', name: 'Tai mũi họng', detail: 'Chuyên khoa mẫu · Không tự suy từ triệu chứng' },
];
export const TIMES = [
  { id: '08:00', period: 'morning' }, { id: '09:00', period: 'morning' },
  { id: '10:00', period: 'morning' }, { id: '14:00', period: 'afternoon' },
  { id: '15:00', period: 'afternoon' },
];
export const STEPS = ['Người khám', 'Cơ sở', 'Chuyên khoa', 'Ngày giờ', 'Kiểm tra'];
export function availableDates(now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [year, month, day] = today.split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 1, day + i + 1, 5));
    return { id: date.toISOString().slice(0, 10), label: new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit' }).format(date), day: date.getUTCDate(), month: date.getUTCMonth() + 1 };
  });
}
export function newDraft() { return { profile: '', location: '', service: '', date: '', time: '', accepted: false }; }
export function validateStep(step, draft, dates = availableDates()) {
  if (step === 1 && !PROFILES.some(x => x.id === draft.profile)) return 'Cô/chú chọn người sẽ đi khám trước nhé.';
  if (step === 2 && !LOCATIONS.some(x => x.id === draft.location)) return 'Cô/chú chọn một cơ sở trước nhé.';
  if (step === 3 && !SERVICES.some(x => x.id === draft.service)) return 'Cô/chú chọn chuyên khoa trong tình huống thử nhé.';
  if (step === 4 && !dates.some(x => x.id === draft.date)) return 'Cô/chú chọn một ngày khám còn hiển thị nhé.';
  if (step === 4 && !TIMES.some(x => x.id === draft.time)) return 'Cô/chú chọn một giờ khám trước nhé.';
  if (step === 4 && draft.date === dates[0]?.id && draft.time === '10:00') return 'Giờ này đã hết chỗ trong tình huống thử. Cô/chú chọn giờ khác nhé.';
  return '';
}
export function validateBooking(draft, dates = availableDates()) {
  for (let step = 1; step <= 4; step++) { const error = validateStep(step, draft, dates); if (error) return error; }
  return draft.accepted ? '' : 'Cô/chú tích ô xác nhận thông tin thử trước khi gửi nhé.';
}
export function summary(draft, dates = availableDates()) {
  return {
    person: PROFILES.find(x => x.id === draft.profile)?.name || 'Chưa chọn',
    location: LOCATIONS.find(x => x.id === draft.location)?.name || 'Chưa chọn',
    service: SERVICES.find(x => x.id === draft.service)?.name || 'Chưa chọn',
    date: dates.find(x => x.id === draft.date)?.label || draft.date || 'Chưa chọn',
    time: draft.time || 'Chưa chọn',
  };
}
export const SCREENS = ['home', 'person', 'location', 'service', 'schedule', 'review', 'success', 'appointments'];
export const GUIDES = {
  home: { title: 'Mình bắt đầu từ đây nhé', text: 'Cô/chú bấm “Đặt lịch khám”. Tôi sẽ hướng dẫn từng bước, cô/chú tự chọn và kiểm tra trước khi gửi.', target: 'start-booking' },
  person: { title: 'Ai sẽ đi khám?', text: 'Chọn “Bác An” nếu đặt cho bản thân, hoặc “Bác Bình” nếu đặt cho người thân trong tình huống thử. Sau đó bấm “Tiếp tục”.', target: 'profile-options' },
  location: { title: 'Chọn nơi mình muốn đến', text: 'Bấm tên cơ sở trong tình huống được giao, rồi bấm “Tiếp tục”. Địa điểm này chỉ dùng để thử thao tác.', target: 'location-options' },
  service: { title: 'Chọn chuyên khoa đã được giao', text: 'Chọn chuyên khoa ghi trong tình huống thử. Tôi chỉ hướng dẫn thao tác, không chọn chuyên khoa từ triệu chứng.', target: 'service-options' },
  schedule: { title: 'Chọn ngày, rồi chọn giờ', text: 'Cô/chú chọn một ngày ở hàng trên, rồi chọn giờ bên dưới. Giờ màu xám là không chọn được. Đây đều là lịch giả.', target: 'schedule-options' },
  review: { title: 'Mình kiểm tra lại một lần nhé', text: 'Đọc lại người khám, cơ sở, chuyên khoa và ngày giờ. Nếu đúng, tích ô xác nhận rồi bấm “Gửi yêu cầu thử”. Nếu sai, bấm “Sửa” ở dòng tương ứng.', target: 'review-details' },
  success: { title: 'Đã gửi yêu cầu thử', text: 'Yêu cầu đang “Chờ xác nhận” trong bản thử. Chưa có lịch khám thực tế. Cô/chú có thể bấm “Xem lịch hẹn thử” để kiểm tra lại.', target: 'view-appointments' },
  appointments: { title: 'Đọc trạng thái lịch hẹn', text: '“Chờ xác nhận” nghĩa là yêu cầu thử đã được ghi nhận, chưa phải lịch đã xác nhận. Bản thử không gửi yêu cầu đến bệnh viện.', target: 'appointment-list' },
};
export const INTENTS = ['next_step', 'explain_status', 'go_back', 'start_booking', 'view_appointments', 'clarify', 'out_of_scope'];
export function normalize(text) { return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); }
export function localIntent(message) {
  const text = normalize(message);
  if (/thuoc|trieu chung|chan doan|dau nguc|kho tho|xet nghiem|benh gi|ket qua|chuyen khoa nao|dau bung/.test(text)) return 'out_of_scope';
  if (/xem.*lich|lich.*da dat|hen ngay nao/.test(text)) return 'view_appointments';
  if (/xac nhan|thanh cong|da dat|gui chua/.test(text)) return 'explain_status';
  if (/quay|tro lai|sua|nham|doi/.test(text)) return 'go_back';
  if (/dat.*lich|muon.*kham/.test(text)) return 'start_booking';
  if (/bam|lam gi|tiep|giup|chi|huong dan|khong hieu|nhac/.test(text)) return 'next_step';
  return 'clarify';
}
export function guidance(intent, screen) {
  const current = GUIDES[screen];
  if (!current) throw new Error('Unknown screen');
  if (intent === 'out_of_scope') return { title: 'Mình chỉ thử thao tác đặt lịch', text: 'Tôi không tư vấn bệnh, thuốc hay kết quả khám. Cô/chú dùng tình huống và thông tin giả được giao để tiếp tục; câu hỏi chuyên môn cần trao đổi với nhân viên y tế.', target: null };
  if (intent === 'explain_status') return { title: 'Yêu cầu và lịch xác nhận khác nhau', text: screen === 'success' || screen === 'appointments' ? GUIDES.appointments.text : 'Ở bước này chưa gửi yêu cầu. Chỉ sau khi cô/chú tự kiểm tra và bấm “Gửi yêu cầu thử”, bản thử mới ghi nhận yêu cầu ở trạng thái “Chờ xác nhận”.', target: screen === 'success' ? 'view-appointments' : screen === 'appointments' ? 'appointment-list' : null };
  if (intent === 'go_back') return { title: 'Cô/chú có thể sửa lựa chọn', text: screen === 'review' ? 'Bấm “Sửa” ở đúng dòng muốn thay đổi. Các lựa chọn khác sẽ được giữ lại để cô/chú kiểm tra.' : ['home', 'appointments', 'success'].includes(screen) ? 'Cô/chú có thể về “Trang chủ” để bắt đầu một yêu cầu thử khác.' : 'Bấm “Quay lại” để về bước trước. Các lựa chọn đã có vẫn được giữ lại.', target: screen === 'review' ? 'review-details' : ['home', 'appointments', 'success'].includes(screen) ? 'nav-home' : 'back-step' };
  if (intent === 'view_appointments') return { title: 'Xem lại yêu cầu đã gửi', text: 'Bấm “Lịch hẹn thử” ở thanh điều hướng. Chỉ yêu cầu đã gửi trong phiên này mới xuất hiện; bản nháp chưa gửi sẽ không có trong danh sách.', target: 'nav-appointments' };
  if (intent === 'clarify') return { title: 'Cô/chú muốn được giúp phần nào?', text: 'Cô/chú có thể hỏi “Bấm ở đâu tiếp?”, “Sửa lựa chọn thế nào?” hoặc “Chờ xác nhận là gì?”.', target: null };
  return current;
}
