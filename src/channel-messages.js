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

  if (initHeight - 50 < $messages.scrollTop() + $messages.height()) {
    $messages.scrollTop(getChannelMessagesList().height());
  }

  if (
    getChannelMessagesList().height() <= $messages.height() &&
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
    var $li = $(".message[data-index=" + lastIndex + "]");
    var top = $li.position() && $li.position().top;
    $li.addClass("last-read");
    getChannelMessages().scrollTop(top + getChannelMessages().scrollTop());
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
    channelMsgsObject.scrollTop(difference);
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

function createTickForAMember(member, user) {
  return `<svg title="${user.friendlyName || member.identity}" data-identity="${
    member.identity
  }" xmlns="http://www.w3.org/2000/svg" width="16" height="15" id="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#4fc3f7"/></svg>`;
}

function markMsgAsReadByUser(lastIndex, $userGravatarInHisLastReadMessage) {
  $(
    "#channel-messages .message[data-index=" + lastIndex + "] span.tick"
  ).append($userGravatarInHisLastReadMessage);
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
    $tickForAMember = createTickForAMember(member, user);
  }

  var lastIndex = member.lastConsumedMessageIndex;
  if (lastIndex) {
    markMsgAsReadByUser(lastIndex, $tickForAMember);
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
