require("./channel-messages.css");

var $ = require("jquery");

var Message = require("./message.js");

var GlobalState = require("./state.js");

function getChannelMessages() {
  return $("#channel-messages");
}

function getChannelMessagesList() {
  return $("#channel-messages");
}

let State = {
  isUpdatingConsumption: undefined,
};

function initialize(parentState) {
  State.isUpdatingConsumption = false;
  getChannelMessages().on("scroll", function (e) {
    var $messages = getChannelMessages();

    if (
      getChannelMessagesList().height() - 50 <
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
  var initHeight = getChannelMessagesList().height();
  var $el = Message.createMessage(message, GlobalState.identity);

  getChannelMessagesList().append($el);

  /*
  if (initHeight - 50 < $messages.scrollTop() + $messages.height()) {
    $messages.scrollTop(getChannelMessagesList().height() + 200);
  }
  */

  if (
    getChannelMessagesList().height() <= $messages.height() &&
    message.index > message.channel.lastConsumedMessageIndex
  ) {
    message.channel.updateLastConsumedMessageIndex(message.index);
  }

  setTimeout(() => {
    $messages.scrollTop(10000);
  }, 150);
}

function scrollToLastRead(page, channel) {
  var newestMessageIndex = page.items.length
    ? page.items[page.items.length - 1].index
    : 0;
  var lastIndex = channel.lastConsumedMessageIndex;
  if (lastIndex && lastIndex !== newestMessageIndex) {
    var $li = $(".message[data-index=" + lastIndex + "]");
    var top = $li.position() && $li.position().top;
    $li.addClass("last-read");
    // getChannelMessages().scrollTop(top + getChannelMessages().scrollTop());
  }
  return newestMessageIndex;
}

function loadPreviousMessages(channelMsgsObject) {
  channelMsgsObject.addClass("loader");
  var initialHeight = $(channelMsgsObject).height();
  State.activeChannelPage.prevPage().then((page) => {
    page.items.reverse().forEach(prependMessage);
    State.activeChannelPage = page;
    var difference = $(channelMsgsObject).height() - initialHeight;
    // channelMsgsObject.scrollTop(difference);
    channelMsgsObject.removeClass("loader");
  });
}

function removeMessage(message) {
  $("#channel-messages .message[data-index=" + message.index + "]").remove();
}

function updateLastRead() {
  $("#channel-messages .message.last-read").removeClass("last-read");
}

function addTwilioChannelPageMsgs(page) {
  page.items.forEach(addMessage);
}

function markMsgAsReadByUser(lastIndex, $userTick) {
  $(
    "#channel-messages .message[data-index=" + lastIndex + "] span.tick"
  ).append($userTick);
}

function updateMemberMsgsTicks(member, user, client) {
  if (user === undefined) {
    return;
  }
  if (member.identity === decodeURIComponent(client.identity)) {
    return;
  }

  var $tickForAMember = $(
    '#channel-messages .tick svg[data-identity="' + member.identity + '"]'
  );

  if (!$tickForAMember.length) {
    $tickForAMember = Message.createTickForAMember(
      member.identity,
      user.friendlyName
    );
  }

  var lastIndex = member.lastConsumedMessageIndex;
  if (lastIndex) {
    // TODO: Tick logic not available yet, currently showing double ticks on every sent msg
    // markMsgAsReadByUser(lastIndex, $tickForAMember);
  }
}

module.exports = {
  addMessage,
  getChannelMessages,
  getChannelMessagesList,
  initialize,
  removeMessage,
  addTwilioChannelPageMsgs,
  scrollToLastRead,
  updateLastRead,
  updateMemberMsgsTicks,
};
