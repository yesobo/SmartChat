var request = require("./vendor/superagent.js");

function initChat(identity) {
  return new Promise((resolve, reject) => {
    request("/getToken?identity=" + identity, function (err, res) {
      if (err) {
        throw new Error(res.text);
      }
      var token = res.text;
      Twilio.Chat.Client.create(token, { logLevel: "info" })
        .then(function (createdClient) {
          resolve({ createdClient, identity });
        })
        .catch(function (err) {
          throw err;
        });
    });
  });
}

function updateToken(identity) {
  return new Promise((resolve, reject) => {
    request("/getToken?identity=" + identity, function (err, res) {
      if (err) {
        console.error("Failed to get a token ", res.text);
        reject(new Error(res.text));
      }
      console.log("Got new token!", res.text);
      resolve(res.text);
    });
  });
}

module.exports = {
  initChat,
  updateToken,
};
