import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalTts} from '../local-tts.mjs';

test('Mia uses the local Thanh Binh voice with the VieNeu engine',()=>{
 const tts=createLocalTts();
 try{assert.equal(tts.status().voice,'Thanh Bình');assert.equal(tts.status().engine,'vieneu-v3-turbo');assert.equal(tts.status().local,true);}
 finally{tts.close();}
});
