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

function createMessage(message, identity) {
  var $el = $(
    `<div class='message ${isSent(message, identity) ? "sent" : "received"}'/>`
  ).attr("data-index", message.index);
  $el.text(message.body);

  var $metadata = $('<span class="metadata"/>');

  var $timestamp = $('<span class="time"/>')
    .text(getMsgTimeStr(message))
    .appendTo($metadata);

  $el.append($metadata);

  var $membersRead = $('<span class="tick"/>').appendTo($metadata);
  return $el;
}

module.exports = {
  createMessage,
};
