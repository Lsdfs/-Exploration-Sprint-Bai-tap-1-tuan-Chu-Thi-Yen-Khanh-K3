import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingHelp, extractBookingSlots } from '../src/chatbot-domain.mjs';
test('unknown specialty asks symptoms, then offers general screening without requiring disclosure',()=>{
 assert.match(bookingHelp('không rõ','service').text,/triệu chứng/);
 assert.match(bookingHelp('không muốn nói','symptoms').text,/đa khoa.*sàng lọc/);
 assert.equal(bookingHelp('đau bụng','symptoms').service,'general');
 assert.equal(bookingHelp('khám tim','service'),null);
});
test('available doctor and explicit general screening are accepted',()=>{
 assert.equal(bookingHelp('bác sĩ nào rảnh','doctor').doctor,'any');
 assert.equal(bookingHelp('không rõ','doctor').doctor,'any');
 assert.equal(extractBookingSlots('khám đa khoa sàng lọc',[]).slots.service,'general');
});
