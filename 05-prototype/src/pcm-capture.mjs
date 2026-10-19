class PcmCapture extends AudioWorkletProcessor{
  constructor(){super();this.samples=[];this.cursor=0;}
  process(inputs){
    const channels=inputs[0];if(!channels?.length)return true;
    const mono=channels[0];
    for(let i=0;i<mono.length;i++)this.samples.push(channels.reduce((sum,ch)=>sum+ch[i],0)/channels.length);
    const step=sampleRate/16000;
    while(this.samples.length-this.cursor>=1600*step+1){
      const pcm=new Int16Array(1600);let sum=0;
      for(let i=0;i<1600;i++){
        const index=Math.floor(this.cursor),fraction=this.cursor-index;
        const value=this.samples[index]*(1-fraction)+this.samples[index+1]*fraction;
        sum+=value*value;pcm[i]=Math.round(Math.max(-1,Math.min(1,value))*(value<0?32768:32767));this.cursor+=step;
      }
      this.port.postMessage({pcm:pcm.buffer,rms:Math.sqrt(sum/1600)},[pcm.buffer]);
      const consumed=Math.floor(this.cursor);this.samples.splice(0,consumed);this.cursor-=consumed;
    }
    return true;
  }
}
registerProcessor('pcm-capture',PcmCapture);
