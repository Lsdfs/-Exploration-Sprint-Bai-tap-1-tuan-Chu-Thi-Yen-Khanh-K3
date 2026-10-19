const labels={
  connecting:['Đang mở micro','Chờ dòng “Mia đang nghe” rồi bắt đầu nói nhé.'],
  listening:['Mia đang nghe','Cô/chú nói yêu cầu. Nói xong, Mia sẽ nhận lời nói.'],
  transcribing:['Đang nhận lời nói','Mia đang chuyển câu cô/chú vừa nói thành chữ.'],
  thinking:['Mia đang chuẩn bị trả lời','Đã nhận câu hỏi. Cô/chú chờ một chút nhé.'],
  answering:['Mia đang trả lời','Câu trả lời đang hiện dần ở phía trên.'],
};

// Update the visible status without re-rendering or interrupting microphone
// capture. Elapsed time is separate from live announcements for screen readers.
export function createActivityIndicator({onCancel,onFinish}){
  let phase='',started=0,timer;
  function update(next){
    const composer=document.querySelector('.chatbot-panel .chat-composer');
    composer?.querySelector('.chat-wait:not(.mia-activity)')?.remove();
    if(!composer||!labels[next]){
      clearInterval(timer);timer=undefined;phase='';
      document.querySelector('.mia-activity')?.remove();
      composer?.setAttribute('aria-busy','false');return;
    }
    const changed=phase!==next;
    if(changed){phase=next;started=performance.now();}
    const busy=phase!=='listening';composer.setAttribute('aria-busy',String(busy));
    let card=composer.querySelector('.mia-activity');
    if(!card||changed){
      card?.remove();card=document.createElement('section');
      card.className='chat-wait mia-activity';card.dataset.phase=phase;
      card.innerHTML='<span class="mia-progress-icon" aria-hidden="true"></span><div class="mia-activity-copy"><strong role="status" aria-live="polite"></strong><p></p><small class="mia-activity-time" aria-hidden="true"></small></div><div class="mia-activity-actions"><button type="button"></button></div>';
      const [title,detail]=labels[phase];card.querySelector('strong').textContent=title;card.querySelector('p').textContent=detail;
      const cancel=card.querySelector('button');
      cancel.textContent=['connecting','listening','transcribing'].includes(phase)?(phase==='transcribing'?'Hủy nhận giọng':'Dừng nghe'):(phase==='answering'?'Dừng phản hồi':'Dừng chờ');
      cancel.addEventListener('click',()=>onCancel(phase));composer.prepend(card);
      if(phase==='listening'){
        const done=document.createElement('button');done.type='button';done.className='mia-finish-speaking';done.textContent='Nói xong';
        done.addEventListener('click',onFinish);card.querySelector('.mia-activity-actions').prepend(done);
      }
    }
    clearInterval(timer);
    const tick=()=>{
      if(!card.isConnected){clearInterval(timer);timer=undefined;return;}
      const seconds=Math.floor((performance.now()-started)/1000);
      card.querySelector('.mia-activity-time').textContent=busy?`Đã chờ ${seconds} giây`:'';
      if(seconds>=5&&['transcribing','thinking'].includes(phase))card.querySelector('p').textContent='Vẫn đang xử lý. Cô/chú có thể tiếp tục chờ hoặc bấm dừng để thử lại.';
    };
    tick();timer=setInterval(tick,1000);
  }
  return {update};
}
