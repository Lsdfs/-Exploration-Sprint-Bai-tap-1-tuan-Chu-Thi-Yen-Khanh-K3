import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRequest, extractBookingSlots,validateChatBooking,DOCTORS } from '../src/chatbot-domain.mjs';
import { availableDates,PROFILES,LOCATIONS,SERVICES,TIMES } from '../src/domain.mjs';
import { createApp } from '../server.mjs';
const dates=availableDates(new Date('2026-10-19T04:00:00Z'));
test('Negation and questions never authorize a booking',()=>{
 for(const text of ['Không xác nhận đặt lịch','Chưa xác nhận đặt lịch','Đừng xác nhận đặt lịch','Tôi chưa muốn xác nhận đặt lịch','Xác nhận đặt lịch là gì?','Có phải nói xác nhận đặt lịch không?','Tôi muốn biết xác nhận đặt lịch','Hướng dẫn xác nhận đặt lịch','Bỏ qua bước xác nhận đặt lịch']) {
  assert.notEqual(classifyRequest(text).kind,'confirm',text);
 }
 assert.equal(classifyRequest('Xác nhận đặt lịch').kind,'confirm');
});
test('Novice replies recognize self, short specialty and the day after tomorrow',()=>{
 assert.equal(extractBookingSlots('Tôi',dates).slots.profile,'self');
 assert.equal(extractBookingSlots('Mắt',dates).slots.service,'eye');
 assert.equal(extractBookingSlots('Ngày mốt',dates).slots.date,dates[1].id);
});
test('Invalid edits explicitly invalidate the previous date or time',()=>{
 assert.ok(extractBookingSlots('Đổi sang 25 giờ',dates).invalidFields.includes('time'));
 assert.ok(extractBookingSlots('Đổi sang ngày 32/10',dates).invalidFields.includes('date'));
});
test('Spoken sold-out time uses the date already selected, and changing facility does not mean morning',()=>{
 assert.ok(extractBookingSlots('Mười giờ',dates,{date:dates[0].id}).invalidFields.includes('time'));
 assert.equal(extractBookingSlots('Đổi sang Central Park',dates).slots.period,undefined);
 assert.equal(classifyRequest('Đặt cho tôi khám tổng quát').kind,'booking');
});
test('Booking matrix validates all profiles, facilities, specialties, dates, times and compatible doctors',()=>{
 let combinations=0;
 for(const profile of PROFILES)for(const location of LOCATIONS)for(const service of SERVICES)for(const date of dates)for(const time of TIMES){
  const draft={profile:profile.id,location:location.id,service:service.id,date:date.id,time:time.id,doctor:'any',accepted:true};
  const unavailable=date.id===dates[0].id&&time.id==='10:00';
  assert.equal(Boolean(validateChatBooking(draft,dates)),unavailable);
  assert.ok(validateChatBooking({...draft,accepted:false},dates));combinations++;
 }
 for(const doctor of DOCTORS)for(const date of dates)for(const time of TIMES){
  const draft={profile:'self',location:doctor.location,service:doctor.service,date:date.id,time:time.id,doctor:doctor.id,accepted:true};
  assert.equal(Boolean(validateChatBooking(draft,dates)),date.id===dates[0].id&&time.id==='10:00');combinations++;
  assert.ok(validateChatBooking({...draft,location:doctor.location==='times'?'central':'times'},dates));
 }
 assert.equal(combinations,2835);
});
test('Missing or scalar JSON bodies return a client error rather than server error',async t=>{
 const server=createApp({provider:'mock'});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 for(const body of ['null','[]','true','123','"text"']){
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/help`,{method:'POST',headers:{'Content-Type':'application/json'},body});
  assert.equal(response.status,400,body);
 }
});
