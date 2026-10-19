// Server-only decoder for the Responses API SSE protocol.
export async function readOpenAIStream(response,onDelta,signal) {
  if(!response.body)throw new Error('Missing provider stream');
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let buffer='',complete=false,total=0,hasText=false;
  const abort=()=>{reader.cancel().catch(()=>{});};
  signal?.addEventListener('abort',abort,{once:true});
  function frame(value){
    const data=value.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
    if(!data||data==='[DONE]')return;
    const event=JSON.parse(data);
    if(event.type==='response.output_text.delta'){
      if(complete||typeof event.delta!=='string')throw new Error('Invalid provider delta');
      total+=event.delta.length;if(total>12000)throw new Error('Answer too long');
      if(event.delta){hasText=true;onDelta(event.delta);}
    }else if(event.type==='response.completed'){
      if(event.response?.status!=='completed'||!hasText)throw new Error('Incomplete answer');
      complete=true;
    }else if(['error','response.failed','response.incomplete','response.refusal.delta'].includes(event.type))throw new Error('Provider stream failed');
  }
  try{
    signal?.throwIfAborted();
    while(!complete){
      const chunk=await reader.read();signal?.throwIfAborted();
      buffer+=(chunk.done?decoder.decode():decoder.decode(chunk.value,{stream:true})).replace(/\r/g,'');
      let boundary;
      while((boundary=buffer.indexOf('\n\n'))>=0){const item=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);frame(item);}
      if(buffer.length>65536)throw new Error('Provider event too large');
      if(chunk.done)break;
    }
    if(!complete)throw new Error('Provider stream ended early');
  }finally{
    signal?.removeEventListener('abort',abort);
    await reader.cancel().catch(()=>{});reader.releaseLock();
  }
}
