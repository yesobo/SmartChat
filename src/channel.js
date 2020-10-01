var $ = require("jquery");

function updateActiveChannel(activeChannel) {
  $("#channel-title").text(activeChannel.friendlyName);
  $("#channel-desc").text(activeChannel.attributes.description);
}

function getChannel() {
  return $("#channel");
}

function clearActiveChannel() {
  getChannel().hide();
  $("#no-channel").show();
}

module.exports = {
  clearActiveChannel,
  getChannel,
  updateActiveChannel,
};
