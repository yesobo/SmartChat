var $ = require("jquery");

var Message = require("./message.js");

function getChannelMessages() {
  return $("#channel-messages");
}

function getChannelMessagesUl() {
  return $("#channel-messages ul");
}

let State = {
  isUpdatingConsumption: undefined,
};

function initialize(parentState) {
  State.isUpdatingConsumption = false;
  getChannelMessages().on("scroll", function (e) {
    var $messages = getChannelMessages();

    if (
      getChannelMessagesUl().height() - 50 <
      $messages.scrollTop() + $messages.height()
    ) {
      parentState.activeChannel.getMessages(1).then((messages) => {
        var newestMessageIndex = messages.length ? messages[0].index : 0;
        if (
          !State.isUpdatingConsumption &&
          parentState.activeChannel.lastConsumedMessageIndex !==
            newestMessageIndex
        ) {
          State.isUpdatingConsumption = true;
          parentState.activeChannel
            .updateLastConsumedMessageIndex(newestMessageIndex)
            .then(function () {
              State.isUpdatingConsumption = false;
            });
        }
      });
    }
    if (
      $messages.scrollTop() < 50 &&
      parentState.activeChannelPage &&
      parentState.activeChannelPage.hasPrevPage &&
      !self.hasClass("loader")
    ) {
      loadPreviousMessages($(this));
    }
  });
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

function scrollToLastRead(page, channel) {
  var newestMessageIndex = page.items.length
    ? page.items[page.items.length - 1].index
    : 0;
  var lastIndex = channel.lastConsumedMessageIndex;
  if (lastIndex && lastIndex !== newestMessageIndex) {
    var $li = $("li[data-index=" + lastIndex + "]");
    var top = $li.position() && $li.position().top;
    $li.addClass("last-read");
    getChannelMessages().scrollTop(top + getChannelMessages().scrollTop());
  }
  return newestMessageIndex;
}

function loadPreviousMessages(channelMsgsObject) {
  channelMsgsObject.addClass("loader");
  var initialHeight = $("ul", channelMsgsObject).height();
  State.activeChannelPage.prevPage().then((page) => {
    page.items.reverse().forEach(prependMessage);
    State.activeChannelPage = page;
    var difference = $("ul", channelMsgsObject).height() - initialHeight;
    channelMsgsObject.scrollTop(difference);
    channelMsgsObject.removeClass("loader");
  });
}

function removeMessage(message) {
  $("#channel-messages li[data-index=" + message.index + "]").remove();
}

function updateLastRead() {
  $("#channel-messages li.last-read").removeClass("last-read");
}

function addTwilioChannelPageMsgs(page) {
  page.items.forEach(addMessage);
}

module.exports = {
  addMessage,
  getChannelMessages,
  getChannelMessagesUl,
  initialize,
  loadPreviousMessages,
  removeMessage,
  addTwilioChannelPageMsgs,
  scrollToLastRead,
  updateLastRead,
};
