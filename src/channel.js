var $ = require("jquery");

var State = require("./state.js");

function updateActiveChannel(activeChannel) {
  $("#channel-title").text(activeChannel.friendlyName);
  $("#channel-desc").text(activeChannel.attributes.description);
}

function getChannel() {
  return $("#channel");
}

function clearActiveChannel() {
  getChannel().hide();
  if (!State.isClient) {
    $("#no-channel").show();
  }
}

function setViewOnly(isViewOnly) {
  if (isViewOnly) {
    getChannel().addClass("view-only");
  } else {
    getChannel().removeClass("view-only");
  }
}

function createChannelElement(channel) {
  var $el = $("<li/>").attr("data-sid", channel.sid);

  var $title = $('<span class="joined"/>')
    .text(channel.friendlyName)
    .appendTo($el);
  var $count = $('<span class="messages-count"/>').appendTo($el);
  /*
  channel.getUnreadMessagesCount().then(count => {
    if (count > 0) {
      $el.addClass('new-messages');
      $count.text(count);
    }
  });
  */
  var $leave = $('<div class="remove-button glyphicon glyphicon-remove"/>')
    .on("click", function (e) {
      e.stopPropagation();
      channel.leave();
    })
    .appendTo($el);
  return $el;
}

function createPublicChannelElement(channel) {
  var $el = $("<li/>").attr("data-sid", channel.sid).attr("id", channel.sid);
  var $title = $("<span/>").text(channel.friendlyName).appendTo($el);
  return $el;
}

function createInvitedChannelElement(channel) {
  var $el = $("<li/>").attr("data-sid", channel.sid);

  var $title = $('<span class="invited"/>')
    .text(channel.friendlyName)
    .appendTo($el);

  var $decline = $('<div class="remove-button glyphicon glyphicon-remove"/>')
    .on("click", function (e) {
      e.stopPropagation();
      channel.decline();
    })
    .appendTo($el);
}

function updateChannelInfo(channel, State) {
  $("#channel-title").text(channel.friendlyName);
  State.activeChannel.getAttributes().then(function (attributes) {
    $("#channel-desc").text(attributes.description);
  });
}

module.exports = {
  clearActiveChannel,
  createChannelElement,
  createInvitedChannelElement,
  createPublicChannelElement,
  getChannel,
  updateActiveChannel,
  updateChannelInfo,
  setViewOnly,
};
