var $ = require("jquery");

var { MD5 } = require("./md5.js");

require("./message.css");

function isSent(message, identity) {
  return message.author == identity;
}

function renderRemoveBtn(message, $el) {
  var $remove = $('<div class="remove-button glyphicon glyphicon-remove"/>')
    .on("click", function (e) {
      e.preventDefault();
      message.remove();
    })
    .appendTo($el);
}

function renderEditBtn($el) {
  var $edit = $('<div class="remove-button glyphicon glyphicon-edit"/>')
    .on("click", function (e) {
      e.preventDefault();
      $(".body", $el).hide();
      $(".edit-body", $el).show();
      $("button", $el).show();
      $el.addClass("editing");
    })
    .appendTo($el);
}

function renderAvatar(message, $el) {
  var $img = $("<img/>")
    .attr(
      "src",
      "http://gravatar.com/avatar/" + MD5(message.author) + "?s=30&d=mm&r=g"
    )
    .appendTo($el);
}

function renderAuthor(message, $el) {
  var $author = $('<p class="author"/>').text(message.author).appendTo($el);
}

function renderCancelEdit($el) {
  var $cancel = $('<button class="cancel-edit"/>')
    .text("Cancel")
    .on("click", function (e) {
      e.preventDefault();
      $(".edit-body", $el).hide();
      $("button", $el).hide();
      $(".body", $el).show();
      $el.removeClass("editing");
    })
    .appendTo($el);
}

function renderEditedBy(message, time, minutes, ampm, $author) {
  $('<span class="timestamp"/>')
    .text(
      "(Edited by " +
        message.lastUpdatedBy +
        " at " +
        (time.getHours() % 12) +
        ":" +
        minutes +
        " " +
        ampm +
        ")"
    )
    .appendTo($author);
}

function renderEditArea(message, $el) {
  var $editBody = $('<textarea class="edit-body"/>')
    .text(message.body)
    .appendTo($el);
}

function renderConfirmEdit(message, $editBody, $el) {
  var $edit = $('<button class="red-button"/>')
    .text("Make Change")
    .on("click", function (e) {
      message.updateBody($editBody.val());
    })
    .appendTo($el);
}

function renderNewMessagesBoundary($el) {
  var $lastRead = $('<p class="last-read"/>')
    .text("New messages")
    .appendTo($el);
}

function getMsgTimeStr(message) {
  if (message.lastUpdatedBy) {
    time = message.dateUpdated;
  } else {
    time = message.timestamp;
  }
  var minutes = time.getMinutes();
  var ampm = Math.floor(time.getHours() / 12) ? "PM" : "AM";

  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  return (time.getHours() % 12) + ":" + minutes + " " + ampm;
}

function createTickForAMember(identity, friendlyName) {
  return `<svg title="${
    friendlyName || identity
  }" data-identity="${identity}" xmlns="http://www.w3.org/2000/svg" width="16" height="15" id="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#4fc3f7"/></svg>`;
}

function createMessage(message, identity) {
  var $el = $(
    `<div class='message ${isSent(message, identity) ? "sent" : "received"}'/>`
  ).attr("data-index", message.index);
  if (message.body.indexOf("##html") === 0)
    $el.html(message.body.slice( 6 ));
  else
    $el.text(message.body);

  var $metadata = $('<span class="metadata"/>');

  var $timestamp = $('<span class="time"/>')
    .text(getMsgTimeStr(message))
    .appendTo($metadata);

  $el.append($metadata);

  var $membersRead = $('<span class="tick"/>').appendTo($metadata);

  if (isSent(message, identity)) {
    $membersRead.append(createTickForAMember(identity));
  }
  return $el;
}

module.exports = {
  createMessage,
  createTickForAMember,
};
