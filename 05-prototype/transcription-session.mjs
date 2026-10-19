// Adapted from double fun's speech/transcribe/session route. Audio stays on
// WebRTC; this server only negotiates the session and owns the provider key.
export async function createTranscriptionSession({sdp,apiKey,model,fetchFn=fetch,signal}) {
  const transcription=model.startsWith('gpt-live-transcribe')
    ? {model,languages:['vi'],delay:'medium'}
    : {model,language:'vi'};
  const data=new FormData();
  data.set('sdp',sdp);
  data.set('session',JSON.stringify({type:'transcription',audio:{input:{transcription,turn_detection:null}}}));
  const response=await fetchFn('https://api.openai.com/v1/realtime/calls',{
    method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:data,signal,
  });
  if(!response.ok)throw new Error('Voice unavailable');
  const answer=await response.text();
  if(!answer.startsWith('v=0'))throw new Error('Invalid SDP');
  return answer;
}
