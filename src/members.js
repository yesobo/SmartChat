var $ = require("jquery");
var { MD5 } = require("./md5.js");

function addMember(member, client) {
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

    updateMember(member, user, client);

    $("#channel-members ul").append($el);
  });
}

function updateMember(member, user, client) {
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

function addMembersEventsHandlers(channel, activeChannel) {
  console.log("adding addMember event handlers");
  channel.on("memberJoined", () => {
    updateMembers(activeChannel, client);
  });
  channel.on("memberLeft", () => {
    updateMembers(activeChannel, client);
  });
  channel.on("memberUpdated", () => {
    console.log("memberUpdated event triggered");
    updateMember();
  });
}

function updateMembers(activeChannel, client, channel, members) {
  $("#channel-members ul").empty();

  activeChannel.getMembers().then((members) => {
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
      .forEach((item) => {
        addMember(item, client);
      });

    members.forEach((member) => {
      member.getUser().then((user) => {
        user.on("updated", () => {
          updateMember.bind(null, member, user, client);
          updateMembers(activeChannel, client);
        });
      });
    });
  });

  addMembersEventsHandlers(channel, activeChannel);
}

function initialize(State) {
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
      State.activeChannel.invite(identity).then(function () {
        $("#invite-member").hide();
        $("#overlay").hide();
        $("#invite-identity").val("");
      });
  });

  $("#add-button").on("click", function () {
    var identity = $("#add-identity").val();
    identity &&
      State.activeChannel.add(identity).then(function () {
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
}

function emptyMembers() {
  $("#channel-members ul").empty();
}

module.exports = {
  emptyMembers,
  initialize,
  updateMember,
  updateMembers,
};
