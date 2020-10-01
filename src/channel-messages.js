var $ = require("jquery");

var Message = require("./message.js");

function getChannelMessages() {
  return $("#channel-messages");
}

function getChannelMessagesUl() {
  return $("#channel-messages ul");
}

function addMessage(message) {
  var $messages = getChannelMessages();
  var initHeight = getChannelMessagesUl().height();
  var $el = $("<li/>").attr("data-index", message.index);
  Message.createMessage(message, $el);

  getChannelMessagesUl().append($el);

  if (initHeight - 50 < $messages.scrollTop() + $messages.height()) {
    $messages.scrollTop(getChannelMessagesUl().height());
  }

  if (
    getChannelMessagesUl().height() <= $messages.height() &&
    message.index > message.channel.lastConsumedMessageIndex
  ) {
    message.channel.updateLastConsumedMessageIndex(message.index);
  }
}

module.exports = {
  addMessage,
  getChannelMessages,
  getChannelMessagesUl,
};
