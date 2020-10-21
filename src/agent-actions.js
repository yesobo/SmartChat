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

function initialize(State, ChannelMsgs) {
  $("#send-image").on("click", function () {
    sendImage('ing-logo.jpg', State, ChannelMsgs);
  });

  $("#show-pinpad").on("click", function () {

  });

}

module.exports = {
  initialize
};
