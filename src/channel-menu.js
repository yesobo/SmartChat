const Events = require("twilio/lib/rest/Events");

var $ = require("jquery");
var UpdateChannelModal = require("./update-channel-modal.js");

function initialize(State) {
  $("#edit-channel").on("click", function () {
    UpdateChannelModal.open(State);
    $("#overlay").show();
  });

  $("#delete-channel").on("click", function () {
    State.activeChannel && State.activeChannel.delete();
  });
}

module.exports = {
  initialize,
};
