require("./login-modal.css");
require("./login-modal-client.css");

var $ = require("jquery");
const { initChat } = require("./twilio-client.js");

let Events = {
  login,
};

function getLoginName() {
  return $("#login-name");
}

function getLoginButton() {
  return $("#login-button");
}

function getLoginClientPassword() {
  // could be null
  return $("#login.login-client #login-pass");
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

  if (getLoginClientPassword()) {
    getLoginClientPassword().on("keydown", function (e) {
      if (e.target.value.length === 5) {
        // a trick to not repeat click if 6 (maxlength) is reached twice
        getLoginButton().click();
      }
    });
  }
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
