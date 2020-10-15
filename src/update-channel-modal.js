var $ = require("jquery");

function getUpdateChannel() {
  return $("#update-channel");
}

function open(State) {
  $("#update-channel-display-name").val(State.activeChannel.friendlyName || "");
  $("#update-channel-unique-name").val(State.activeChannel.uniqueName || "");
  $("#update-channel-desc").val(
    State.activeChannel.attributes.description || ""
  );
  $("#update-channel-private").prop("checked", State.activeChannel.isPrivate);
  getUpdateChannel().show();
}

function initialize(State) {
  $("#update-channel .remove-button").on("click", function () {
    getUpdateChannel().hide();
    $("#overlay").hide();
  });

  $("#update-channel-submit").on("click", function () {
    var desc = $("#update-channel-desc").val();
    var friendlyName = $("#update-channel-display-name").val();
    var uniqueName = $("#update-channel-unique-name").val();

    var promises = [];
    if (desc !== State.activeChannel.attributes.description) {
      promises.push(
        State.activeChannel.updateAttributes({ description: desc })
      );
    }

    if (friendlyName !== State.activeChannel.friendlyName) {
      promises.push(State.activeChannel.updateFriendlyName(friendlyName));
    }

    if (uniqueName !== State.activeChannel.uniqueName) {
      promises.push(State.activeChannel.updateUniqueName(uniqueName));
    }

    Promise.all(promises).then(function () {
      getUpdateChannel().hide();
      $("#overlay").hide();
    });
  });
}

module.exports = {
  initialize,
  getUpdateChannel,
  open,
};
