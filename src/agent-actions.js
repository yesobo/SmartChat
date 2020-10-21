var $ = require("jquery");

function sendCustomMessage(body, State, ChannelMsgs) {
  State.activeChannel.sendMessage('##html' + body).then(function () {
    ChannelMsgs.getChannelMessages().scrollTop(
      ChannelMsgs.getChannelMessagesList().height()
    );
    ChannelMsgs.updateLastRead();
  });
}

function sendImage(img, State, ChannelMsgs) {
  sendCustomMessage('<img src="assets/'+img+'">', State, ChannelMsgs)
}

function sendButtonOptions(options, State, ChannelMsgs) {
  if (options.length > 0) {
    const body = options.map(option => option ? '<button class="button-option">'+option+'</button>' : '');
    sendCustomMessage(body.filter(value => value !== '').join(''), State, ChannelMsgs);
  }
}

function initialize(State, ChannelMsgs) {
  $("#send-image").on("click", function () {
    sendImage('ing-logo.jpg', State, ChannelMsgs);
  });

  $("#show-pinpad").on("click", function () {

  });
  
  $("#custom-options").on("click", function () {
    const option1 = $("#option-input-1").val();
    const option2 = $("#option-input-2").val();
    const option3 = $("#option-input-3").val();
    sendButtonOptions([option1, option2, option3], State, ChannelMsgs);
  });
  
}

module.exports = {
  initialize
};
