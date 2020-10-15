var $ = require("jquery");
const { initChat } = require("./twilio-client.js");

let Events = {
  login,
};

function getLoginName() {
  return $("#login-name");
}

function googleLogIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  var identity = profile.getEmail().toLowerCase();
  var fullName = profile.getName();
  logIn(identity, fullName);
}

function logIn(identity) {
  return initChat(identity);
}

function initialize(State) {
  getLoginName().focus();

  $("#login-button").on("click", function () {
    var identity = getLoginName().val();
    if (!identity) {
      return;
    }

    State.identity = identity;

    logIn(identity).then(({ createdClient, identity }) => {
      State.identity = identity;
      Events.login({ createdClient, identity });
    });
  });

  getLoginName().on("keydown", function (e) {
    if (e.keyCode === 13) {
      $("#login-button").click();
    }
  });
}

function onLogin(cb) {
  Events.login = cb;
}

function hideLoginModal() {
  $("#login").hide();
  $("#overlay").hide();
}

module.exports = {
  hideLoginModal,
  initialize,
  onLogin,
};
