var $ = require("jquery");

require("./channel-messages-send.css");

function getMessageBodyInput() {
  return $("#message-body-input");
}

function getSendMessage() {
  return $("#send-message");
}

function getSendMessageIcon() {
  return $("#send-message i");
}

function getTypingIndicator() {
  return $("#typing-indicator span");
}

let State = {
  typingMembers: undefined,
};

let Events = {
  onTyping: undefined,
};

function initialize(State) {
  State.typingMembers = new Set();
  getMessageBodyInput().on("keydown", function (e) {
    if (e.keyCode === 13) {
      getSendMessage().click();
    } else if (State.activeChannel) {
      updateSendIcon(e);
      Events.onTyping ? Events.onTyping() : "";
    }
  });
}

function updateSendIcon(e) {
  setTimeout(() => {
    if (e.target.value.length) {
      getSendMessageIcon().addClass("zmdi-mail-send").removeClass("zmdi-mic");
    } else {
      getSendMessageIcon().addClass("zmdi-mic").removeClass("zmdi-mail-send");
    }
  }, 250);
}

function onTyping(handler) {
  Events.onTyping = handler;
}

function addTypingMember(member) {
  State.typingMembers.add(member);
  updateTypingIndicator();
}

function deleteTypingMember(member) {
  State.typingMembers.delete(member);
  updateTypingIndicator();
}

function updateTypingIndicator() {
  var message = "Typing: ";
  var names = Array.from(State.typingMembers).slice(0, 3);

  if (State.typingMembers.size) {
    message += names.join(", ");
  }

  if (State.typingMembers.size > 3) {
    message += ", and " + (State.typingMembers.size - 3) + "more";
  }

  if (State.typingMembers.size) {
    message += "...";
  } else {
    message = "";
  }
  getTypingIndicator().text(message);
}

module.exports = {
  addTypingMember,
  deleteTypingMember,
  getMessageBodyInput,
  getSendMessage,
  initialize,
  onTyping,
};
