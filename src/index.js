import "./index.css";

var $ = require("jquery");

var request = require("./vendor/superagent.js");
var { MD5 } = require("./md5.js");

var Channel = require("./channel.js");
var ChannelMsgs = require("./channel-messages.js");
var Message = require("./message.js");

var activeChannel;
var client;
var typingMembers = new Set();

var activeChannelPage;

var userContext = { identity: null };

function getLoginName() {
  return $("#login-name");
}

function getMessageBodyInput() {
  return $("#message-body-input");
}

function getUpdateChannel() {
  return $("#update-channel");
}

function getSendMessage() {
  return $("#send-message");
}

$(document).ready(function () {
  getLoginName().focus();

  $("#login-button").on("click", function () {
    var identity = getLoginName().val();
    if (!identity) {
      return;
    }

    userContext.identity = identity;

    logIn(identity, identity);
  });

  getLoginName().on("keydown", function (e) {
    if (e.keyCode === 13) {
      $("#login-button").click();
    }
  });

  getMessageBodyInput().on("keydown", function (e) {
    if (e.keyCode === 13) {
      getSendMessage().click();
    } else if (activeChannel) {
      activeChannel.typing();
    }
  });

  $("#edit-channel").on("click", function () {
    $("#update-channel-display-name").val(activeChannel.friendlyName || "");
    $("#update-channel-unique-name").val(activeChannel.uniqueName || "");
    $("#update-channel-desc").val(activeChannel.attributes.description || "");
    $("#update-channel-private").prop("checked", activeChannel.isPrivate);
    getUpdateChannel().show();
    $("#overlay").show();
  });

  var isUpdatingConsumption = false;
  ChannelMsgs.getChannelMessages().on("scroll", function (e) {
    var $messages = ChannelMsgs.getChannelMessages();

    if (
      ChannelMsgs.getChannelMessagesUl().height() - 50 <
      $messages.scrollTop() + $messages.height()
    ) {
      activeChannel.getMessages(1).then((messages) => {
        var newestMessageIndex = messages.length ? messages[0].index : 0;
        if (
          !isUpdatingConsumption &&
          activeChannel.lastConsumedMessageIndex !== newestMessageIndex
        ) {
          isUpdatingConsumption = true;
          activeChannel
            .updateLastConsumedMessageIndex(newestMessageIndex)
            .then(function () {
              isUpdatingConsumption = false;
            });
        }
      });
    }

    var self = $(this);
    if (
      $messages.scrollTop() < 50 &&
      activeChannelPage &&
      activeChannelPage.hasPrevPage &&
      !self.hasClass("loader")
    ) {
      self.addClass("loader");
      var initialHeight = $("ul", self).height();
      activeChannelPage.prevPage().then((page) => {
        page.items.reverse().forEach(prependMessage);
        activeChannelPage = page;
        var difference = $("ul", self).height() - initialHeight;
        self.scrollTop(difference);
        self.removeClass("loader");
      });
    }
  });

  $("#update-channel .remove-button").on("click", function () {
    getUpdateChannel().hide();
    $("#overlay").hide();
  });

  $("#delete-channel").on("click", function () {
    activeChannel && activeChannel.delete();
  });

  $("#join-channel").on("click", function () {
    activeChannel
      .join()
      .then((channel) => {
        return Channels.setActiveChannel(
          channel,
          activeChannel,
          activeChannelPage
        );
      })
      .then(({ channel, page }) => {
        activeChannel = channel;
        activeChannelPage = page;
      });
  });

  $("#invite-user").on("click", function () {
    $("#invite-member").show();
    $("#overlay").show();
  });

  $("#add-user").on("click", function () {
    $("#add-member").show();
    $("#overlay").show();
  });

  $("#invite-button").on("click", function () {
    var identity = $("#invite-identity").val();
    identity &&
      activeChannel.invite(identity).then(function () {
        $("#invite-member").hide();
        $("#overlay").hide();
        $("#invite-identity").val("");
      });
  });

  $("#add-button").on("click", function () {
    var identity = $("#add-identity").val();
    identity &&
      activeChannel.add(identity).then(function () {
        $("#add-member").hide();
        $("#overlay").hide();
        $("#add-identity").val("");
      });
  });

  $("#invite-member .remove-button").on("click", function () {
    $("#invite-member").hide();
    $("#overlay").hide();
  });

  $("#add-member .remove-button").on("click", function () {
    $("#add-member").hide();
    $("#overlay").hide();
  });

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
        return Channels.setActiveChannel(
          channel,
          activeChannel,
          activeChannelPage
        );
      })
      .then(({ channel, page }) => {
        activeChannel = channel;
        activeChannelPage = page;
      });
  });

  $("#update-channel-submit").on("click", function () {
    var desc = $("#update-channel-desc").val();
    var friendlyName = $("#update-channel-display-name").val();
    var uniqueName = $("#update-channel-unique-name").val();

    var promises = [];
    if (desc !== activeChannel.attributes.description) {
      promises.push(activeChannel.updateAttributes({ description: desc }));
    }

    if (friendlyName !== activeChannel.friendlyName) {
      promises.push(activeChannel.updateFriendlyName(friendlyName));
    }

    if (uniqueName !== activeChannel.uniqueName) {
      promises.push(activeChannel.updateUniqueName(uniqueName));
    }

    Promise.all(promises).then(function () {
      getUpdateChannel().hide();
      $("#overlay").hide();
    });
  });
});

function googleLogIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  var identity = profile.getEmail().toLowerCase();
  var fullName = profile.getName();
  logIn(identity, fullName);
}

function logIn(identity, displayName) {
  request("/getToken?identity=" + identity, function (err, res) {
    if (err) {
      throw new Error(res.text);
    }

    var token = res.text;

    userContext.identity = identity;

    Twilio.Chat.Client.create(token, { logLevel: "info" })
      .then(function (createdClient) {
        $("#login").hide();
        $("#overlay").hide();
        client = createdClient;
        client.on("tokenAboutToExpire", () => {
          request("/getToken?identity=" + identity, function (err, res) {
            if (err) {
              console.error("Failed to get a token ", res.text);
              throw new Error(res.text);
            }
            console.log("Got new token!", res.text);
            client.updateToken(res.text);
          });
        });

        $("#profile label").text(
          client.user.friendlyName || client.user.identity
        );
        $("#profile img").attr(
          "src",
          "http://gravatar.com/avatar/" + MD5(identity) + "?s=40&d=mm&r=g"
        );

        client.user.on("updated", function () {
          $("#profile label").text(
            client.user.friendlyName || client.user.identity
          );
        });

        var connectionInfo = $("#profile #presence");
        connectionInfo
          .removeClass("online offline connecting denied")
          .addClass(client.connectionState);
        client.on("connectionStateChanged", function (state) {
          connectionInfo
            .removeClass("online offline connecting denied")
            .addClass(client.connectionState);
        });

        client.getSubscribedChannels().then(updateChannels);

        client.on("channelJoined", function (channel) {
          channel.on("messageAdded", updateUnreadMessages);
          channel.on("messageAdded", updateChannels);
          updateChannels();
        });

        client.on("channelInvited", updateChannels);
        client.on("channelAdded", updateChannels);
        client.on("channelUpdated", updateChannels);
        client.on("channelLeft", leaveChannel);
        client.on("channelRemoved", leaveChannel);
      })
      .catch(function (err) {
        throw err;
      });
  });
}

function updateUnreadMessages(message) {
  var channel = message.channel;
  if (channel !== activeChannel) {
    $('#sidebar li[data-sid="' + channel.sid + '"] span').addClass(
      "new-messages"
    );
  }
}

function leaveChannel(channel) {
  if (channel == activeChannel && channel.status !== "joined") {
    Channel.clearActiveChannel();
  }

  channel.removeListener("messageAdded", updateUnreadMessages);

  updateChannels();
}

function addKnownChannel(channel) {
  var $el = $("<li/>")
    .attr("data-sid", channel.sid)
    .on("click", function () {
      Channels.setActiveChannel(channel, activeChannel, activeChannelPage).then(
        ({ channel, page }) => {
          activeChannel = channel;
          activeChannelPage = page;
        }
      );
    });

  var $title = $("<span/>").text(channel.friendlyName).appendTo($el);

  $("#known-channels ul").append($el);
}

function addPublicChannel(channel) {
  var joinedChannel;
  var $el = $("<li/>")
    .attr("data-sid", channel.sid)
    .attr("id", channel.sid)
    .on("click", function () {
      channel.getChannel().then((channel) => {
        channel
          .join()
          .then((channel) => {
            joinedChannel = channel;
            return Channels.setActiveChannel(
              channel,
              activeChannel,
              activeChannelPage
            );
          })
          .then(({ newChannel, page }) => {
            activeChannel = newChannel;
            activeChannelPage = page;
            removePublicChannel(joinedChannel);
          });
      });
    });

  var $title = $("<span/>").text(channel.friendlyName).appendTo($el);

  $("#public-channels ul").append($el);
}

function addInvitedChannel(channel) {
  var $el = $("<li/>")
    .attr("data-sid", channel.sid)
    .on("click", function () {
      Channels.setActiveChannel(channel, activeChannel, activeChannelPage).then(
        ({ channel, page }) => {
          activeChannel = channel;
          activeChannelPage = page;
        }
      );
    });

  var $title = $('<span class="invited"/>')
    .text(channel.friendlyName)
    .appendTo($el);

  var $decline = $('<div class="remove-button glyphicon glyphicon-remove"/>')
    .on("click", function (e) {
      e.stopPropagation();
      channel.decline();
    })
    .appendTo($el);

  $("#invited-channels ul").append($el);
}

function addJoinedChannel(channel) {
  var $el = $("<li/>")
    .attr("data-sid", channel.sid)
    .on("click", function () {
      console.debug("click on channel");
      Channels.setActiveChannel(channel, activeChannel, activeChannelPage).then(
        ({ channel, page }) => {
          activeChannel = channel;
          activeChannelPage = page;
        }
      );
    });

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

  $("#my-channels ul").append($el);
}

function removeLeftChannel(channel) {
  $("#my-channels li[data-sid=" + channel.sid + "]").remove();

  if (channel === activeChannel) {
    Channel.clearActiveChannel();
  }
}

function removePublicChannel(channel) {
  $("#public-channels li[data-sid=" + channel.sid + "]").remove();
}

function updateMessages() {
  ChannelMsgs.getChannelMessagesUl().empty();
  activeChannel.getMessages(30).then(function (page) {
    page.items.forEach(ChannelMsgs.addMessage);
  });
}

function removeMessage(message) {
  $("#channel-messages li[data-index=" + message.index + "]").remove();
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
  ChannelMsgs.getChannelMessagesUl().prepend($el);
}

function addMember(member) {
  member.getUser().then((user) => {
    var $el = $("<li/>").attr("data-identity", member.identity);

    var $img = $("<img/>")
      .attr(
        "src",
        "http://gravatar.com/avatar/" +
          MD5(member.identity.toLowerCase()) +
          "?s=20&d=mm&r=g"
      )
      .appendTo($el);

    let hasReachability =
      user.online !== null && typeof user.online !== "undefined";
    var $span = $("<span/>")
      .text(user.friendlyName || user.identity)
      .addClass(
        hasReachability
          ? user.online
            ? "member-online"
            : "member-offline"
          : ""
      )
      .appendTo($el);

    var $remove = $('<div class="remove-button glyphicon glyphicon-remove"/>')
      .on("click", member.remove.bind(member))
      .appendTo($el);

    updateMember(member, user);

    $("#channel-members ul").append($el);
  });
}

function updateMembers(activeChannel) {
  $("#channel-members ul").empty();

  activeChannel.getMembers().then((members) =>
    members
      .sort(function (a, b) {
        return a.identity > b.identity;
      })
      .sort(function (a, b) {
        return (
          a.getUser().then((user) => user.online) <
          b.getUser().then((user) => user.online)
        );
      })
      .forEach(addMember)
  );
}

function updateChannels() {
  client.getSubscribedChannels().then((page) => {
    const subscribedChannels = page.items.sort(function (a, b) {
      return a.state.friendlyName > b.state.friendlyName;
    });
    renderSubscribedChannels(subscribedChannels);
    client.getPublicChannelDescriptors().then((page) => {
      const publicChannels = page.items.sort(function (a, b) {
        console.log("test");
        return a.friendlyName > b.friendlyName;
      });
      $("#public-channels ul").empty();
      addPublicChannels(publicChannels, subscribedChannels);
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

function renderSubscribedChannels(subscribedChannels) {
  cleanSubscribedChannelsLists();
  subscribedChannels.forEach(function (channel) {
    switch (channel.status) {
      case "joined":
        addJoinedChannel(channel);
        break;
      case "invited":
        addInvitedChannel(channel);
        break;
      default:
        addKnownChannel(channel);
        break;
    }
  });
}

function cleanSubscribedChannelsLists() {
  $("#known-channels ul").empty();
  $("#invited-channels ul").empty();
  $("#my-channels ul").empty();
}

function updateMember(member, user) {
  if (user === undefined) {
    return;
  }
  if (member.identity === decodeURIComponent(client.identity)) {
    return;
  }

  var $lastRead = $(
    '#channel-messages p.members-read img[data-identity="' +
      member.identity +
      '"]'
  );

  if (!$lastRead.length) {
    $lastRead = $("<img/>")
      .attr(
        "src",
        "http://gravatar.com/avatar/" + MD5(member.identity) + "?s=20&d=mm&r=g"
      )
      .attr("title", user.friendlyName || member.identity)
      .attr("data-identity", member.identity);
  }

  var lastIndex = member.lastConsumedMessageIndex;
  if (lastIndex) {
    $(
      "#channel-messages li[data-index=" + lastIndex + "] p.members-read"
    ).append($lastRead);
  }
}

function updateTypingIndicator() {
  var message = "Typing: ";
  var names = Array.from(typingMembers).slice(0, 3);

  if (typingMembers.size) {
    message += names.join(", ");
  }

  if (typingMembers.size > 3) {
    message += ", and " + (typingMembers.size - 3) + "more";
  }

  if (typingMembers.size) {
    message += "...";
  } else {
    message = "";
  }
  $("#typing-indicator span").text(message);
}

// ---------------- Channel --------------- //

function setActiveChannel(channel, activeChannel, activeChannelPage) {
  if (activeChannel) {
    removeListeners(activeChannel);
  }

  activeChannel = channel;

  $("#channel-title").text(channel.friendlyName);
  ChannelMsgs.getChannelMessagesUl().empty();
  $("#channel-members ul").empty();
  activeChannel.getAttributes().then(function (attributes) {
    $("#channel-desc").text(attributes.description);
  });

  updateSendMenssageClickHandler(channel);

  activeChannel.on("updated", () => {
    Channel.updateActiveChannel(activeChannel);
  });

  $("#no-channel").hide();
  Channel.getChannel().show();

  if (channel.status !== "joined") {
    Channel.getChannel().addClass("view-only");
    return;
  } else {
    Channel.getChannel().removeClass("view-only");
  }

  return channel
    .getMessages(30)
    .then(function (page) {
      activeChannelPage = page;
      page.items.forEach(ChannelMsgs.addMessage);

      addMessageEventsHandlers(channel);

      var newestMessageIndex = page.items.length
        ? page.items[page.items.length - 1].index
        : 0;
      var lastIndex = channel.lastConsumedMessageIndex;
      if (lastIndex && lastIndex !== newestMessageIndex) {
        var $li = $("li[data-index=" + lastIndex + "]");
        var top = $li.position() && $li.position().top;
        $li.addClass("last-read");
        ChannelMsgs.getChannelMessages().scrollTop(
          top + ChannelMsgs.getChannelMessages().scrollTop()
        );
      }

      if (
        ChannelMsgs.getChannelMessagesUl().height() <=
        ChannelMsgs.getChannelMessages().height()
      ) {
        channel
          .updateLastConsumedMessageIndex(newestMessageIndex)
          .then(updateChannels);
      }

      return channel.getMembers();
    })
    .then(function (members) {
      updateMembers(activeChannel);

      addMembersEventsHandlers(channel, activeChannel);

      members.forEach((member) => {
        member.getUser().then((user) => {
          user.on("updated", () => {
            updateMember.bind(null, member, user);
            updateMembers(activeChannel);
          });
        });
      });

      addTypingEventsHandlers(channel);

      getMessageBodyInput().focus();

      return {
        activeChannel,
        activeChannelPage,
      };
    });
}

var Channels = {
  setActiveChannel,
};

function updateSendMenssageClickHandler(channel) {
  getSendMessage().off("click");
  getSendMessage().on("click", function () {
    var body = getMessageBodyInput().val();
    channel.sendMessage(body).then(function () {
      getMessageBodyInput().val("").focus();
      ChannelMsgs.getChannelMessages().scrollTop(
        ChannelMsgs.getChannelMessagesUl().height()
      );
      $("#channel-messages li.last-read").removeClass("last-read");
    });
  });
}

function addTypingEventsHandlers(channel) {
  channel.on("typingStarted", function (member) {
    member.getUser().then((user) => {
      typingMembers.add(user.friendlyName || member.identity);
      updateTypingIndicator();
    });
  });

  channel.on("typingEnded", function (member) {
    member.getUser().then((user) => {
      typingMembers.delete(user.friendlyName || member.identity);
      updateTypingIndicator();
    });
  });
}

function addMembersEventsHandlers(channel, activeChannel) {
  channel.on("memberJoined", () => {
    updateMembers(activeChannel);
  });
  channel.on("memberLeft", () => {
    updateMembers(activeChannel);
  });
  channel.on("memberUpdated", updateMember);
}

function addMessageEventsHandlers(channel) {
  channel.on("messageAdded", ChannelMsgs.addMessage);
  channel.on("messageUpdated", updateMessage);
  channel.on("messageRemoved", removeMessage);
}

function removeListeners(activeChannel) {
  activeChannel.removeListener("messageAdded", ChannelMsgs.addMessage);
  activeChannel.removeListener("messageRemoved", removeMessage);
  activeChannel.removeListener("messageUpdated", updateMessage);
  activeChannel.removeListener("updated", () => {
    Channel.updateActiveChannel(activeChannel);
  });
  activeChannel.removeListener("memberUpdated", updateMember);
}
