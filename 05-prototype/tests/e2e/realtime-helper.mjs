// Mock the transport boundary, leaving production capture/transcription logic intact.
export async function mockRealtime(page, supported=true) {
  page.on('dialog',dialog=>dialog.accept());
  await page.route('**/api/voice',route=>route.fulfill({status:200,contentType:'application/sdp',body:'v=0\r\nanswer'}));
  await page.addInitScript(({supported})=>{
    window.confirm=()=>true;
    const track={stop(){window.__trackStopped=true;}};
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{
      if(window.__failStart)throw Error('capture failed');
      return {getTracks:()=>[track]};
    }}});
    class Peer {
      addTrack(){}
      createDataChannel(){
        const channel=this.channel={close(){},send(){}};
        const emit=event=>channel.onmessage?.({data:JSON.stringify(event)});
        const proxy={
          onresult(event){const r=event.results[0];emit({type:`conversation.item.input_audio_transcription.${r.isFinal===false?'delta':'completed'}`,item_id:'one',transcript:r[0].transcript,delta:r[0].transcript});},
          onerror(event){if(event.error==='not-allowed')emit({type:'error'});else emit({type:'error'});},
          onend(){},aborted:false,
        };
        this.proxy=proxy;
        window.__voice=window.__mia=window.__miaVoice=window.__recognition=proxy;
        return channel;
      }
      async createOffer(){return {type:'offer',sdp:'v=0\r\n'};}
      async setLocalDescription(){}
      async setRemoteDescription(){if(!window.__holdStart)this.channel.onopen?.();}
      close(){this.proxy.aborted=true;}
    }
    window.RTCPeerConnection=supported?Peer:undefined;
  },{supported});
}
