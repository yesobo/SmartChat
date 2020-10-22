var $ = require("jquery");
window.$ = $;

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
    let body = options.map(option => option ? '<button class="button-option">'+option+'</button>' : '');
    body = body.filter(value => value !== '').join('');
    body += '<script>';
    body += '$(".button-option").off();'
    body += '$(".button-option").on("click", function (e) {';
    body += 'var selected = e.target.innerHTML;';
    body += 'e.target.parentNode.remove();';
    body += 'window.sendReplaceMessage(selected);';
    body += '});';
    body += '</script>';
    sendCustomMessage(body, State, ChannelMsgs);
  }
}

function initialize(State, ChannelMsgs) {
  $("#send-image").on("click", function () {
    sendImage('ing-logo.jpg', State, ChannelMsgs);
  });
  
  $("#custom-options").on("click", function () {
    const option1 = $("#option-input-1").val();
    const option2 = $("#option-input-2").val();
    const option3 = $("#option-input-3").val();
    sendButtonOptions([option1, option2, option3], State, ChannelMsgs);
  });
  
  window.sendReplaceMessage = window.sendReplaceMessage || function(body) {
    State.activeChannel.sendMessage("Seleccionado: " + body).then(function () {
      ChannelMsgs.getChannelMessages().scrollTop(
        ChannelMsgs.getChannelMessagesList().height()
      );
      ChannelMsgs.updateLastRead();
    });
  }
}

module.exports = {
  initialize
};
