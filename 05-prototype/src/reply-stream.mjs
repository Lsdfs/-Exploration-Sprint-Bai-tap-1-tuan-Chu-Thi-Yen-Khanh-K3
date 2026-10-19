export function sentenceChunks(text) {
  return text.match(/[^.!?。！？]+[.!?。！？]+\s*|[^.!?。！？]+$/gu) || [text];
}

export function createSentenceBuffer(onSentence) {
  let pending='';
  return {
    push(text){
      pending+=text;
      const complete=/[.!?。！？]+["”’»)]*(?:\s+|$)/u;
      let match;
      while((match=complete.exec(pending))){
        const end=match.index+match[0].length;
        const sentence=pending.slice(0,end);pending=pending.slice(end);
        if(sentence.trim())onSentence(sentence);
      }
    },
    finish(){const tail=pending;pending='';if(tail.trim())onSentence(tail);},
    reset(){pending='';}
  };
}

export async function readReplyStream(response, onEvent) {
  if (!response.body) throw new Error('Missing stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', complete = false;
  function line(value) {
    if (!value.trim()) return;
    const event = JSON.parse(value);
    if (!['meta', 'delta', 'done'].includes(event.type)) throw new Error('Invalid stream event');
    if (complete) throw new Error('Event after completion');
    if (event.type === 'delta' && typeof event.text !== 'string') throw new Error('Invalid delta');
    onEvent(event);
    if (event.type === 'done') complete = true;
  }
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        line(buffer.slice(0, index)); buffer = buffer.slice(index + 1);
      }
      if (buffer.length > 16000) throw new Error('Stream event too large');
      if (done) break;
    }
    if (buffer.trim()) line(buffer);
    if (!complete) throw new Error('Incomplete stream');
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
