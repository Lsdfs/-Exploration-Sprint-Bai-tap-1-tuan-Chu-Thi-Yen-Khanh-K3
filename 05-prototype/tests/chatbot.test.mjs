import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRequest, extractBookingSlots, nextQuestion, validateChatBooking, doctorsFor } from '../src/chatbot-domain.mjs';
import { availableDates, newDraft } from '../src/domain.mjs';
const dates = availableDates(new Date('2026-10-18T03:00:00Z'));

test('Natural T1 correction uses the replacement hour without changing other fields', () => {
  const parsed = extractBookingSlots('À khoan, tám giờ tôi chưa đi được. Đổi sang chín giờ, còn những cái khác giữ nguyên.', dates, {time:'08:00'});
  assert.equal(parsed.slots.time, '09:00');
  assert.equal(parsed.slots.profile, undefined);
  assert.equal(parsed.slots.service, undefined);
});

test('Natural scenario dates mean list position rather than weekday', () => {
  assert.equal(extractBookingSlots('Ngày đầu tiên còn lịch nhé, tám giờ sáng.', dates).slots.date, dates[0].id);
  const parsed = extractBookingSlots('Ngày thứ hai trong danh sách, hai giờ chiều.', dates);
  assert.equal(parsed.slots.date, dates[1].id);
  assert.equal(parsed.slots.time, '14:00');
  assert.equal(extractBookingSlots('Thứ hai tuần này', dates).slots.date, '2026-10-19');
});

test('Distinguishes teaching from navigation, including unaccented Vietnamese', () => {
  for (const text of ['Chỉ tôi cách mở lịch hẹn', 'Tôi muốn xem lịch hẹn thì làm thế nào?', 'Huong dan xem lich hen']) assert.deepEqual(classifyRequest(text), { kind: 'guide', destination: 'appointments' });
  for (const text of ['Mở trang lịch hẹn giúp tôi', 'Mở lịch hẹn', 'Đi đến trang lịch hẹn']) assert.deepEqual(classifyRequest(text), { kind: 'open', destination: 'appointments' });
  assert.equal(classifyRequest('Tôi muốn đặt lịch khám tim').kind, 'booking');
  assert.equal(classifyRequest('Đặt giúp tôi khám tim ngày mai chín giờ tại Vinmec Times City, không chọn bác sĩ cụ thể').kind, 'booking');
  assert.deepEqual(classifyRequest('Chỉ cách cập nhật thông tin cá nhân'), { kind: 'guide', destination: 'personal' });
  assert.deepEqual(classifyRequest('Mở kết quả khám giúp tôi'), { kind: 'open', destination: 'results' });
  assert.deepEqual(classifyRequest('Chỉ tôi cách tìm bác sĩ'), { kind: 'guide', destination: 'doctors' });
});
test('Extracts explicit specialty, person, facility and date without inventing an hour', () => {
  const parsed = extractBookingSlots('Đặt giúp tôi khám tim sáng thứ Hai tại Vinmec Times City.', dates);
  assert.equal(parsed.slots.service, 'heart'); assert.equal(parsed.slots.location, 'times');
  assert.equal(parsed.slots.profile, 'self'); assert.equal(parsed.slots.date, '2026-10-19');
  assert.equal(parsed.slots.period, 'morning'); assert.equal(parsed.slots.time, undefined);
});
test('Recognizes exact hours and asks again for unavailable or ambiguous dates', () => {
  assert.equal(extractBookingSlots('Ngày mai lúc 9 giờ', dates).slots.time, '09:00');
  assert.equal(extractBookingSlots('14:00 ngày 20/10', dates).slots.date, '2026-10-20');
  assert.equal(extractBookingSlots('chiều mai lúc 2 giờ', dates).slots.time, '14:00');
  assert.equal(extractBookingSlots('ngày 32/10', dates).slots.date, undefined);
  assert.ok(extractBookingSlots('hôm nay', dates).notes.length);
  assert.ok(extractBookingSlots('ngày mai 10 giờ', dates).notes.length);
});
test('Recognizes short internal medicine names in explicit booking requests', () => {
  for (const text of ['khoa nội', 'Khoa Nội.', 'khoa noi', 'khám nội', 'nội khoa',
    'Đặt giúp tôi khoa nội ngày mai chín giờ tại Vinmec Times City',
    'Tôi muốn khám nội ở Vinmec Times City', 'Nội tổng quát']) {
    assert.equal(extractBookingSlots(text, dates).slots.service, 'general', text);
  }
  const {slots}=extractBookingSlots('Đặt giúp tôi khoa nội ngày mai chín giờ tại Vinmec Times City', dates);
  assert.equal(slots.location,'times');
  assert.equal(slots.date,dates[0].id);
  assert.equal(slots.time,'09:00');
});

test('Does not turn misheard speech, unrelated words or other internal specialties into general medicine', () => {
  for (const text of ['hoa nụ', 'hoa nội', 'Tôi đang nói chuyện', 'khoa nội tiết',
    'khám nội thần kinh', 'khoa nội tiêu hóa', 'khám nội soi', 'khoa nội trú', 'khoa nội thất'])
    assert.equal(extractBookingSlots(text, dates).slots.service, undefined, text);
});
test('Does not infer a specialty from symptoms or execute confirmation commands', () => {
  assert.equal(classifyRequest('Đau ngực thì khám khoa nào?').kind, 'medical');
  assert.equal(extractBookingSlots('Tôi đau ngực và khó thở', dates).slots.service, undefined);
  assert.equal(classifyRequest('Xác nhận đặt lịch ngay').kind, 'confirm');
  assert.equal(extractBookingSlots('Tôi muốn đặt lịch khám', dates).slots.profile, undefined);
});
test('Questions skip known slots and validate doctor compatibility', () => {
  const draft = { ...newDraft(), service: 'heart', location: 'times', date: dates[0].id, period: 'morning' };
  assert.equal(nextQuestion(draft, dates), 'profile');
  draft.profile = 'self'; assert.equal(nextQuestion(draft, dates), 'doctor');
  draft.doctor = 'any'; assert.equal(nextQuestion(draft, dates), 'time');
  draft.time = '09:00'; assert.equal(nextQuestion(draft, dates), 'review');
  draft.accepted = true; assert.equal(validateChatBooking(draft, dates), '');
  draft.doctor = 'nonexistent'; assert.ok(validateChatBooking(draft, dates));
  assert.ok(doctorsFor('heart', 'times').length);
  assert.ok(doctorsFor('heart', 'times').every(d => d.service === 'heart' && d.location === 'times'));
});
