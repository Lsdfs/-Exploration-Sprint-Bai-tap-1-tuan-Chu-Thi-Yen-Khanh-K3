import test from 'node:test';
import assert from 'node:assert/strict';
import { availableDates, newDraft, validateStep, validateBooking, summary, localIntent, guidance, SCREENS } from '../src/domain.mjs';

const dates = availableDates(new Date('2026-10-17T18:00:00Z'));
const complete = () => ({ profile: 'self', location: 'times', service: 'general', date: dates[0].id, time: '09:00', accepted: true });
test('Dates use Vietnam day and handle month/year rollover', () => {
  assert.equal(dates[0].id, '2026-10-19');
  const end = availableDates(new Date('2026-12-31T18:00:00Z'));
  assert.equal(end[0].id, '2027-01-02');
  assert.equal(new Set(dates.map(d => d.id)).size, 7);
});
test('Each required booking step rejects missing and invented options', () => {
  for (let step = 1; step <= 4; step++) assert.ok(validateStep(step, newDraft(), dates));
  for (const [step, field] of [[1, 'profile'], [2, 'location'], [3, 'service'], [4, 'date'], [4, 'time']]) {
    const draft = complete(); draft[field] = 'invented'; assert.ok(validateStep(step, draft, dates));
  }
});
test('Booking needs all selections and explicit acceptance', () => {
  assert.equal(validateBooking(complete(), dates), '');
  assert.match(validateBooking({ ...complete(), accepted: false }, dates), /tích ô/);
  assert.ok(validateBooking({ ...complete(), date: '2020-01-01' }, dates));
  assert.match(validateBooking({ ...complete(), time: '10:00' }, dates), /hết chỗ/);
});
test('Summary reflects the selected person, site, service and time', () => {
  assert.equal(summary(complete(), dates).person, 'Bác An');
  assert.equal(summary({ ...complete(), profile: 'family' }, dates).person, 'Bác Bình');
  assert.equal(summary(complete(), dates).time, '09:00');
});
test('All screens have guidance and can explain state without claiming a confirmed appointment', () => {
  for (const screen of SCREENS) {
    assert.ok(guidance('next_step', screen).text);
    assert.match(guidance('explain_status', screen).text, /Chờ xác nhận|chưa gửi yêu cầu/);
  }
});
test('Vietnamese wording maps to navigation intents', () => {
  for (const [question, intent] of [
    ['Bác không biết bấm chỗ nào tiếp', 'next_step'],
    ['Tôi muốn sửa lại', 'go_back'],
    ['Tôi xem lịch đã đặt ở đâu?', 'view_appointments'],
    ['Đã xác nhận chưa?', 'explain_status'],
    ['Tôi muốn đặt lịch', 'start_booking'],
    ['xyz', 'clarify'],
  ]) assert.equal(localIntent(question), intent, question);
});
test('Medical questions stay out of the navigation assistant', () => {
  for (const question of ['Đau ngực thì chọn chuyên khoa nào?', 'Uống thuốc gì?', 'Đọc kết quả xét nghiệm']) {
    assert.equal(localIntent(question), 'out_of_scope');
    assert.equal(guidance('out_of_scope', 'service').target, null);
  }
});
