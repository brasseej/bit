// variables
let userName = null;
let state = 'SUCCESS';
let count=0;
let mode="text";
let SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
//let chatbottom=document.querySelector(".bottom_wrapper");
let recognition;
let $message_input;
let llocation;
let aacc;





//todo://api가 허가 되는 브라우저랑 안되는 브랄우저 나눠서 마이크 버튼 보여주려고

if(SpeechRecognition){
console.log('support speechRecogniton ');
//chatbottom.innerHTML('<div class="mike_button" onclick="mikemode()"><img src="../static/image/yesmike.png" width="50px" height="50px"></div>');
recognition=new SpeechRecognition();
recognition.continuous=true;
recognition.addEventListener('start',startspeechrecognition);
recognition.addEventListener('end',endspeechrecognition);
recognition.addEventListener('result',resultrecognition);
recognition.lang='ko';
}else{
console.log('not support speechrecogition');
}


// functions
function Message(arg) {
    this.text = arg.text;
    this.message_side = arg.message_side;

    this.draw = function (_this) {
        return function () {
            let $message;
            $message = $($('.message_template').clone().html());
            $message.addClass(_this.message_side).find('.text').html(_this.text);
            $('.messages').append($message);

            return setTimeout(function () {
                return $message.addClass('appeared');
            }, 0);
        };
    }(this);
    return this;
}

function startspeechrecognition()
{
let $message_input;
$message_input = $('.message_input');
$message_input.focus()
console.log("speech start");

}
function endspeechrecognition(){
let $message_input;
$message_input = $('.message_input');
$message_input.focus()
console.log('stop');
}
function resultrecognition(event){
console.log(event);
let currentresult=event.resultIndex;
let transcript=event.results[currentresult][0].transcript;
$message_input = $('.message_input');
if(transcript.toLowerCase().trim().includes("로봇"))
{
if(transcript.toLowerCase().trim().includes("안녕")){
sendMessage('음성 모두가 종료됩니다.🔔','left');
let $btn=$('.mike_button');
$btn.removeClass('active');
mode='text';
recognition.stop();
}else if(transcript.toLowerCase().trim().includes("다시"))
{
$message_input.val("");
}else if(transcript.toLowerCase().trim()=="맞아")
{
check('네');
}else if(transcript.toLowerCase().trim()=="아니야")
{
check('아니오');
}else if(transcript.toLowerCase().trim().includes("요양"))
{
f1(llocation,aacc,'요양');
}
else{
transcript=transcript.replace('로봇'," ");
$message_input.val(transcript);
setTimeout(()=>{onSendButtonClicked();},1000);

}
}

}
//todo://한글자씩 써지는거 해보기




function mikemode(){
//토글 버튼으로 누르면 모드 변환해주고,active 클래스 설정해서 css 변경하기 쉽게 클래스 설정. active speech 이미지 전환해줘야함 css
  let $btn=$('.mike_button');

  if ($btn.hasClass('active')){
    $btn.removeClass('active');
    $btn.html('<img src="../static/image/mic2.png" width="70px" height="70px">');
    mode='text';
    recognition.stop();
    console.log("mikestop")
  }
  else{
    $btn.addClass('active');
    $btn.html('<img src="../static/image/mic.png" width="70px" height="70px">');
    mode='speech';
    recognition.start();
     }

    alert("음성인식시 로봇 명령어를 붙여주세요 ('로봇 일하다가 추락했어')");

    if(mode=='speech')
    {
      sendMessage('음성 모드가 실행되었습니다.🔔','left');

    }
   }


function sendMessage(text, message_side) {

//   let ttstext=text.replace("로봇",'');
   if(mode=='speech'&&message_side=='left')
   {
    let regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

     ttstext=text.replace(regex, '');
     let tts=window.speechSynthesis;
     let tospeak=new SpeechSynthesisUtterance(ttstext);
     tts.speak(tospeak);
   }



    let $messages, message;
    $('.message_input').val('');
    $messages = $('.messages');
    message = new Message({
        text: text,
        message_side: message_side
    });
    message.draw();
    $messages.animate({scrollTop: $messages.prop('scrollHeight')}, 500);

   }



function onSendButtonClicked() {
    let messageText = getMessageText();
    sendMessage(messageText, 'right');

    if (userName == null) {
        userName = setUserName(messageText);

    } else {
        if (messageText.includes('안녕')) {
            setTimeout(function () {
                return sendMessage("안녕하세요. 저는 산재 로우봇입니다.😁", 'left');
            }, 1000);
        } else if (messageText.includes('고마워')) {
            setTimeout(function () {
                return sendMessage("천만에요. 더 물어보실 건 없나요?🥺", 'left');
            }, 1000);
        } else if (messageText.includes('없어')) {
            setTimeout(function () {
                return sendMessage("그렇군요. 알겠습니다!💪🏻", 'left');
            }, 1000);


        } else if (state.includes('REQUIRE')) {
            return requestChat(messageText, 'fill_slot');
        } else {
            return requestChat(messageText, 'request_chat');
        }
    }
}

function makebutton(message_side,location,accident){
      let $message;
      let html="";
      llocation=location;
      aacc=accident;
      let butname=['장해','요양','휴업'];
      for(let i=0;i<3;i++){
        html += `<button class='button1' onclick='f1("${location}","${accident}","${butname[i]}")'>${butname[i]}</button>`;
        }
      alert(html)
      $message = $($('.message_template').clone().html());
      $message.addClass(message_side).find('.text_wrapper').html(html);
      $('.messages').append($message);
      $message.addClass('appeared');
      $messages = $('.messages');
      $messages.animate({scrollTop: $messages.prop('scrollHeight')}, 500);
}


function dupcheckbutton(message_side){
      let $message;
      let html="";
      let butname=['아니오','네'];
      for(let i=0;i<2;i++){
        html += `<button class='button2' onclick='check("${butname[i]}")'>${butname[i]}</button>`;
        }
      $message = $($('.message_template').clone().html());
      $message.addClass(message_side).find('.text_wrapper').html(html);
      $('.messages').append($message);
      $message.addClass('appeared');
      $messages = $('.messages');
      $messages.animate({scrollTop: $messages.prop('scrollHeight')}, 500);
}
function check(ch){
      count++;
      alert(count)
      if(count==1)
      return requestChat(ch,'dups');
      else alert('이미 클릭 되었습니다.');

}

function f1(location,accident,name){

//      $.ajax({
//      url://장고 url 주소,
//      type:"POST",
//      data:{'loc':location,'acc':accident,'button':name}
//      success:function(data){alert('success')},
//      error:function(error){
//      console.log(error)
//      alert("error")
//      }
//      });

      alert("엔티티는"+location+accident+name+"입니다.");

      //window.open('#html주소&loc=추락&acc/button','new window');

}
function getMessageText() {
    let $message_input;
    $message_input = $('.message_input');
    return $message_input.val();
}




function greet() {
    setTimeout(function () {
        return sendMessage("Lobot에 오신걸 환영합니다.🙌🏻", 'left');
    }, 1000);

    setTimeout(function () {
        return sendMessage("사용할 닉네임을 알려주세요.", 'left');
    }, 2000);
}

function onClickAsEnter(e) {
    if (e.keyCode === 13) {
        onSendButtonClicked()
    }
}

function setUserName(username) {

    if (username != null && username.replace(" ", "" !== "")) {
        setTimeout(function () {
            return sendMessage(" 반갑습니다. " + username + "님.  닉네임이  설정되었습니다.", 'left');
        }, 1000);
        setTimeout(function () {
            return sendMessage("어떤 판결문에 대해 궁금하신가요?💭💭", 'left');
        }, 2000);
        return username;

    } else {
        setTimeout(function () {
            return sendMessage("올바른 닉네임을 이용해주세요.", 'left');
        }, 1000);

        return null;
    }
}



function requestChat(messageText, url_pattern) {
    $.ajax({
        url: "http://127.0.0.1:8000/" + url_pattern + '/' + userName + '/' + messageText,
        type: "GET",
        dataType: "json",
        success: function (data) {
            state = data['state'];
            if (state === 'SUCCESS') {
                let answer=data['answer']['LOC']+"중 "+data['answer']['ACC']+" 사고로 인해 "+ data['answer']['INJURY']+" 부상을 당하셨군요👩🏻‍💻🧑🏻‍💻👩🏻‍💻🧑🏻‍💻🧑🏻‍💻"
                setTimeout(function () {  return sendMessage(answer, 'left');}, 1000);
                setTimeout(function () {  return sendMessage("청구하고 싶은  <보상 범위>를  선택해주세요💸💸💸", 'left'); }, 2000);
                setTimeout(function () {  return sendMessage(" 아래에  버튼을  누르면  판결문이 나옵니다.👀✌🏻", 'left');  }, 3000);
                setTimeout(function () {  return makebutton('left',data['answer']['LOC'],data['answer']['ACC']); }, 4000);
                setTimeout(function () {  return sendMessage("더 궁금한 질문이 있으면 질문해주세요.😎", 'left');}, 5000);
                setTimeout(function () {  return sendMessage("판결문 조회가 완료 되었습니다.종료를 원하면 로봇 안녕이라고 말해주세요 😜", 'left');}, 5000);
                //mode == speech->
            } else if (state === 'REQUIRE_LOC') {
                return sendMessage('어떤 장소에서 사고가 났나요?😭(출근중,회사에서,현장에서 등)', 'left');
            }else if (state === 'REQUIRE_ACC') {
                return sendMessage('무슨 사고가 있으셨나요?☠️☠️☠️️', 'left');
            }else if (state === 'REQUIRE_INJURY') {
                return sendMessage('어떤  부상을 입으셨나요?🤕', 'left');
            } else if (state === 'REQUIRE_CHECK') {
              count=0;
              let answer='동일한 데이터가 입력되었습니다🙀 ';
              setTimeout(function () {  return sendMessage(answer, 'left');}, 1000);

              let answer2='입력하신 데이터가 [ ';
              if(data['dup'].hasOwnProperty('LOC'))
                  answer2+=' 장소: '+data['dup']['LOC'];
              if(data['dup'].hasOwnProperty('ACC'))
                answer2+=' 사고: '+data['dup']['ACC'];
              if(data['dup'].hasOwnProperty('INJURY'))
                answer2+=' 부상: '+data['dup']['INJURY'];
              answer2+='] 이 맞나요?👀';
              setTimeout(function () {  return sendMessage(answer2, 'left');}, 1000);
              setTimeout(function () {  return dupcheckbutton('left'); }, 2000);

            } else {
            setTimeout(function () {  sendMessage('산업재해와 관련없는 말이에요❌ ', 'left');}, 1000);
            setTimeout(function () {   return sendMessage('다시 입력해주세요👀', 'left');}, 2000);
}
        },

        error: function (request, status, error) {
            console.log(error);

            return sendMessage('죄송합니다. 서버 연결에 실패했습니다.😱', 'left');
        }
    });
}
