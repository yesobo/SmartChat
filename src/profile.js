var $ = require("jquery");
var { MD5 } = require("./md5.js");

function setLabel(text) {
  $("#profile label").text(text);
}

function getConnectionState() {
  return $("#profile #presence");
}

function update(user, identity) {
  setLabel(user.friendlyName || user.identity);

  $("#profile img").attr(
    "src",
    "http://gravatar.com/avatar/" + MD5(identity) + "?s=40&d=mm&r=g"
  );
}

function setConnectionState(connectionState) {
  var connectionInfo = getConnectionState();
  connectionInfo
    .removeClass("online offline connecting denied")
    .addClass(connectionState);
}

module.exports = {
  update,
  setConnectionState,
  setLabel,
};
