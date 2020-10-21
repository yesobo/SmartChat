import channelMessages from "./channel-messages.js";
import "./index.css";

var $ = require("jquery");

var Channel = require("./channel.js");
var ChannelMsgs = require("./channel-messages.js");
var ChannelMsgsSend = require("./channel-messages-send.js");
var Message = require("./message.js");
var Members = require("./members.js");
var UpdateChannelModal = require("./update-channel-modal.js");
var LoginModal = require("./login-modal.js");
var ChannelMenu = require("./channel-menu.js");
var Channels = require("./channels");
var State = require("./state.js");
var Profile = require("./profile.js");
var TwilioClient = require("./twilio-client.js");
var DeviceDetector = require("./device-detector.js");

var client;

$(document).ready(function () {
  LoginModal.initialize(State);
  LoginModal.onLogin(({ createdClient, identity }) => {
    initLoggedInUI(createdClient, identity);

    client = createdClient;

    initializeChannelsComponent(client);

    initializeJoinChannelBtn();
  });

  ChannelMsgsSend.initialize(State);
  ChannelMsgsSend.onTyping(() => {
    State.activeChannel.typing();
  });

  ChannelMsgs.initialize(State);

  UpdateChannelModal.initialize(State);

  ChannelMenu.initialize(State);

  Members.initialize(State);

  if (getDeviceWarning()) {
    if (!DeviceDetector.isDeviceAllowed()) {
      showDeviceWarning();
    }
  }
  showBody();
  State.isClient = $("body").hasClass("is-client");
});

function showDeviceWarning() {
  getDeviceWarning().css("display", "block");
}

function getDeviceWarning() {
  return $("#warn-device");
}

function showBody() {
  $("body").css("display", "block");
  if (LoginModal.getLoginClientPassword()) {
    LoginModal.getLoginClientPassword().focus();
  }
}

function initializeJoinChannelBtn() {
  $("#join-channel").on("click", function () {
    State.activeChannel
      .join()
      .then((channel) => {
        return TwilioChannelUtils.setActiveChannel(channel, State, client);
      })
      .then(({ channel, page }) => {
        State.activeChannel = channel;
        State.activeChannelPage = page;
      });
  });
}

function initializeChannelsComponent(client) {
  Channels.initialize(client);
  Channels.onNewChannel((channel) => {
    TwilioChannelUtils.setActiveChannel(channel, State, client).then(
      ({ channel, page }) => {
        State.activeChannel = channel;
        State.activeChannelPage = page;
      }
    );
  });
  Channels.onChannelClick((channel) => {
    updateActiveChannel(channel, State, client);
  });
}

function initLoggedInUI(createdClient, identity) {
  LoginModal.hideLoginModal();

  let client = addClientEventHandlers(createdClient, identity);

  updateProfileComponent(client, identity);

  client.getSubscribedChannels().then((page) => {
    updateChannels(page);
    setClientChannelEventsHandlers(client);
  });
}

function updateProfileComponent(client, identity) {
  Profile.update(client.user, identity);
  Profile.setConnectionState(client.connectionState);
}

function addClientEventHandlers(createdClient, identity) {
  let client = createdClient;
  client.on("tokenAboutToExpire", () => {
    TwilioClient.updateToken(identity).then((token) => {
      client.updateToken(token);
    });
  });
  client.user.on("updated", function () {
    Profile.setLabel(client.user.friendlyName || client.user.identity);
  });
  client.on("connectionStateChanged", function (state) {
    Profile.setConnectionState(client.connectionState);
  });

  return client;
}

function setClientChannelEventsHandlers(client) {
  client.on("channelJoined", function (channel) {
    channel.on("messageAdded", (message) => {
      Channels.updateUnreadMessages(message, State);
    });
    channel.on("messageAdded", (param) => {
      console.log("messageAdded event");
      updateChannels(param);
    });
    console.log("channel joined event");
    updateChannels();
  });

  client.on("channelInvited", (param) => {
    console.log("channelInvited event");
    updateChannels(param);
  });
  client.on("channelAdded", (param) => {
    console.log("channel added event");
    updateChannels(param);
  });
  client.on("channelUpdated", (param) => {
    console.log("channelUpdated event");
    updateChannels(param);
  });
  client.on("channelLeft", leaveChannel);
  client.on("channelRemoved", leaveChannel);
}

function leaveChannel(channel) {
  if (channel == State.activeChannel && channel.status !== "joined") {
    Channel.clearActiveChannel();
  }

  channel.removeListener("messageAdded", updateUnreadMessages);
  console.log("leving channel");
  updateChannels();
}

function updateMessages() {
  ChannelMsgs.getChannelMessagesList().empty();
  State.activeChannel.getMessages(30).then(function (page) {
    page.items.forEach(ChannelMsgs.addMessage);
  });
}

function updateMessage(args) {
  var $el = $("#channel-messages li[data-index=" + args.message.index + "]");
  $el.empty();
  Message.createMessage(args.message, $el);
}

function prependMessage(message) {
  var $messages = ChannelMsgs.getChannelMessages();
  var $el = $("<li/>").attr("data-index", message.index);
  Message.createMessage(message, $el);
  ChannelMsgs.getChannelMessagesList().prepend($el);
}

function updateChannels(page) {
  if (page && page.items) {
    console.log(`Updating ${page.items.length} channels`);
    const subscribedChannels = page.items.sort(function (a, b) {
      return a.state.friendlyName > b.state.friendlyName;
    });
    Channels.renderSubscribedChannels(subscribedChannels);
    client.getPublicChannelDescriptors().then((page) => {
      const publicChannels = page.items.sort(function (a, b) {
        return a.friendlyName > b.friendlyName;
      });
      $("#public-channels ul").empty();
      addPublicChannels(publicChannels, subscribedChannels);
    });
  } else {
    console.error("No channels on the page!");
  }
}

function addPublicChannel(channel) {
  var channelElement = Channels.addPublicChannel(channel);
  channelElement.on("click", function () {
    channelClickHandler(channel);
  });
}

function channelClickHandler(channel) {
  channel.getChannel().then((chatChannel) => {
    chatChannel
      .join()
      .then((joinedChannel) => {
        return TwilioChannelUtils.setActiveChannel(
          joinedChannel,
          State,
          client
        );
      })
      .then(({ newChannel, page }) => {
        State.activeChannel = newChannel;
        State.activeChannelPage = page;
        Channels.removePublicChannel(channel);
      });
  });
}

function addPublicChannels(publicChannels, subscribedChannels) {
  publicChannels.forEach(function (channel) {
    var result = subscribedChannels.find((item) => item.sid === channel.sid);
    console.log(
      "Adding public channel " +
        channel.sid +
        " " +
        channel.status +
        ", result=" +
        result
    );
    if (result === undefined) {
      addPublicChannel(channel);
    }
  });
}

function updateActiveChannel(channel, State, client) {
  TwilioChannelUtils.setActiveChannel(channel, State, client).then(
    ({ channel, page }) => {
      State.activeChannel = channel;
      State.activeChannelPage = page;
    }
  );
}

// ---------------- Channel --------------- //

function setActiveChannel(channel, State, client) {
  console.log(`setActiveChannel with ${channel}`);
  if (State.activeChannel) {
    TwilioChannelUtils.removeTwilioChannelListeners(
      State.activeChannel,
      client
    );
  }

  State.activeChannel = channel;

  ChannelMsgs.getChannelMessagesList().empty();
  Members.emptyMembers();
  $("#no-channel").hide();

  Channel.updateChannelInfo(channel, State);

  updateSendMenssageComponentClickHandler(channel);

  State.activeChannel.on("updated", () => {
    Channel.updateActiveChannel(State.activeChannel);
  });

  Channel.getChannel().show();

  if (channel.status !== "joined") {
    Channel.setViewOnly(true);
    return Promise.resolve({
      channel: State.activeChannel,
      page: State.activeChannelPage,
    });
  } else {
    Channel.setViewOnly(false);

    return channel
      .getMessages(30)
      .then(function (page) {
        State.activeChannelPage = page;

        TwilioChannelUtils.addChannelMessageEvents(channel);

        ChannelMsgs.addTwilioChannelPageMsgs(page);
        var newestMessageIndex = ChannelMsgs.scrollToLastRead(page, channel);

        if (
          ChannelMsgs.getChannelMessagesList().height() <=
          ChannelMsgs.getChannelMessages().height()
        ) {
          channel
            .updateLastConsumedMessageIndex(newestMessageIndex)
            .then(() => {
              return client.getSubscribedChannels();
            })
            .then(updateChannels);
        }

        return channel.getMembers();
      })
      .then(function (members) {
        Members.updateMembers(State.activeChannel, client, channel, members);

        addTypingEventsHandlers(channel);

        ChannelMsgsSend.getMessageBodyInput().focus();

        return {
          channel: State.activeChannel,
          page: State.activeChannelPage,
        };
      });
  }
}

var TwilioChannelUtils = {
  setActiveChannel,
  removeTwilioChannelListeners,
  addChannelMessageEvents,
};

function updateSendMenssageComponentClickHandler(channel) {
  ChannelMsgsSend.getSendMessage().off("click");
  ChannelMsgsSend.getSendMessage().on("click", function () {
    var body = ChannelMsgsSend.getMessageBodyInput().val();
    channel.sendMessage(body).then(function () {
      ChannelMsgsSend.getMessageBodyInput().val("").focus();
      ChannelMsgs.getChannelMessages().scrollTop(
        ChannelMsgs.getChannelMessagesList().height()
      );
      ChannelMsgs.updateLastRead();
    });
  });
}

function addTypingEventsHandlers(channel) {
  channel.on("typingStarted", function (member) {
    member.getUser().then((user) => {
      ChannelMsgsSend.addTypingMember(user.friendlyName || member.identity);
    });
  });

  channel.on("typingEnded", function (member) {
    member.getUser().then((user) => {
      ChannelMsgsSend.deleteTypingMember(user.friendlyName || member.identity);
    });
  });
}

function addChannelMessageEvents(channel) {
  channel.on("messageAdded", ChannelMsgs.addMessage);
  channel.on("messageUpdated", updateMessage);
  channel.on("messageRemoved", ChannelMsgs.removeMessage);
}

function removeTwilioChannelListeners(activeChannel, client) {
  activeChannel.removeListener("messageAdded", ChannelMsgs.addMessage);
  activeChannel.removeListener("messageRemoved", ChannelMsgs.removeMessage);
  activeChannel.removeListener("messageUpdated", updateMessage);
  activeChannel.removeListener("updated", () => {
    Channel.updateActiveChannel(activeChannel);
  });
  activeChannel.removeListener("memberUpdated", (member, user) => {
    console.log("memberUpdated event triggered");
    ChannelMsgs.updateMemberMsgsTicks(member, user, client);
  });
}
