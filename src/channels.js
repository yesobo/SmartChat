var $ = require("jquery");

var Channel = require("./channel.js");
var State = require("./state.js");

let Events = {
  newChannel: undefined,
  channelClick: undefined,
};

function initialize(client) {
  $("#create-channel .remove-button").on("click", function () {
    $("#create-channel").hide();
    $("#overlay").hide();
  });

  $("#create-channel-button").on("click", function () {
    $("#create-channel").show();
    $("#overlay").show();
  });

  $("#create-new-channel").on("click", function () {
    var attributes = {
      description: $("#create-channel-desc").val(),
    };

    var isPrivate = $("#create-channel-private").is(":checked");
    var friendlyName = $("#create-channel-display-name").val();
    var uniqueName = $("#create-channel-unique-name").val();

    client
      .createChannel({
        attributes: attributes,
        friendlyName: friendlyName,
        isPrivate: isPrivate,
        uniqueName: uniqueName,
      })
      .then(function joinChannel(channel) {
        $("#create-channel").hide();
        $("#overlay").hide();
        return channel.join();
      })
      .then((channel) => {
        Events.newChannel(channel);
      });
  });
}

function onNewChannel(cb) {
  Events.newChannel = cb;
}

function onChannelClick(cb) {
  Events.channelClick = cb;
}

function updateUnreadMessages(message, state) {
  var channel = message.channel;
  if (channel !== state.activeChannel) {
    $('#sidebar li[data-sid="' + channel.sid + '"] span').addClass(
      "new-messages"
    );
  }
}

function addKnownChannel(channel, state, client) {
  var $el = $("<li/>")
    .attr("data-sid", channel.sid)
    .on("click", function () {
      ChannelsUtils.setActiveChannel(
        channel,
        state.activeChannel,
        state.activeChannelPage,
        client
      ).then(({ channel, page }) => {
        state.activeChannel = channel;
        state.activeChannelPage = page;
      });
    });

  var $title = $("<span/>").text(channel.friendlyName).appendTo($el);

  $("#known-channels ul").append($el);
}

function removePublicChannel(channel) {
  $("#public-channels li[data-sid=" + channel.sid + "]").remove();
}

function addChannel(channel) {
  var $el = Channel.createChannelElement(channel);
  $("#my-channels ul").append($el);
  return $el;
}

function addPublicChannel(channel) {
  const newPublicChannelElement = Channel.createPublicChannelElement(channel);
  $("#public-channels ul").append(newPublicChannelElement);
  return newPublicChannelElement;
}

function _addInvitedChannel(channel) {
  var newInvitedChannelElement = Channel.createInvitedChannelElement(channel);
  $("#invited-channels ul").append(invitedChannelElement);
  return newInvitedChannelElement;
}

function addInvitedChannel(channel, { onClick }) {
  var invitedChannelElement = _addInvitedChannel(channel);
  invitedChannelElement.on("click", onClick);
}

function cleanSubscribedChannelsLists() {
  $("#known-channels ul").empty();
  $("#invited-channels ul").empty();
  $("#my-channels ul").empty();
}

function removeLeftChannel(channel) {
  $("#my-channels li[data-sid=" + channel.sid + "]").remove();

  if (channel === State.activeChannel) {
    Channel.clearActiveChannel();
  }
}

function addJoinedChannel(channel, { onClick }) {
  var joinedChannelElement = addChannel(channel);
  joinedChannelElement.on("click", onClick);
}

function renderSubscribedChannels(subscribedChannels) {
  cleanSubscribedChannelsLists();
  subscribedChannels.forEach(function (channel) {
    switch (channel.status) {
      case "joined":
        addJoinedChannel(channel, {
          onClick: () => {
            if (Events.channelClick) {
              Events.channelClick(channel);
            }
          },
        });
        break;
      case "invited":
        addInvitedChannel(channel, {
          onClick: () => {
            if (Events.channelClick) {
              Events.channelClick(channel);
            }
          },
        });
        break;
      default:
        addKnownChannel(channel, State, client);
        break;
    }
  });
}

module.exports = {
  addChannel,
  addPublicChannel,
  initialize,
  onChannelClick,
  onNewChannel,
  removeLeftChannel,
  removePublicChannel,
  renderSubscribedChannels,
  updateUnreadMessages,
};
