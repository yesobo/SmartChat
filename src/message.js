var $ = require("jquery");

var { MD5 } = require("./md5.js");

require("./message.css");

function isSent(message, identity) {
  return message.author == identity;
}

function createMessage(message, identity) {
  var $el = $(
    `<div class='message ${isSent(message, identity) ? "sent" : "received"}'/>`
  ).attr("data-index", message.index);

  var $remove = $('<div class="remove-button glyphicon glyphicon-remove"/>')
    .on("click", function (e) {
      e.preventDefault();
      message.remove();
    })
    .appendTo($el);

  var $edit = $('<div class="remove-button glyphicon glyphicon-edit"/>')
    .on("click", function (e) {
      e.preventDefault();
      $(".body", $el).hide();
      $(".edit-body", $el).show();
      $("button", $el).show();
      $el.addClass("editing");
    })
    .appendTo($el);

  var $img = $("<img/>")
    .attr(
      "src",
      "http://gravatar.com/avatar/" + MD5(message.author) + "?s=30&d=mm&r=g"
    )
    .appendTo($el);

  var $author = $('<p class="author"/>').text(message.author).appendTo($el);

  var time = message.timestamp;
  var minutes = time.getMinutes();
  var ampm = Math.floor(time.getHours() / 12) ? "PM" : "AM";

  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  var $timestamp = $('<span class="timestamp"/>')
    .text("(" + (time.getHours() % 12) + ":" + minutes + " " + ampm + ")")
    .appendTo($author);

  if (message.lastUpdatedBy) {
    time = message.dateUpdated;
    minutes = time.getMinutes();
    ampm = Math.floor(time.getHours() / 12) ? "PM" : "AM";

    if (minutes < 10) {
      minutes = "0" + minutes;
    }

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

  var $body = $('<p class="body"/>').text(message.body).appendTo($el);

  var $editBody = $('<textarea class="edit-body"/>')
    .text(message.body)
    .appendTo($el);

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

  var $edit = $('<button class="red-button"/>')
    .text("Make Change")
    .on("click", function (e) {
      message.updateBody($editBody.val());
    })
    .appendTo($el);

  var $lastRead = $('<p class="last-read"/>')
    .text("New messages")
    .appendTo($el);

  var $membersRead = $('<p class="members-read"/>').appendTo($el);
  return $el;
}

module.exports = {
  createMessage,
};
