var credentials = require("./credentials.json");
var express = require("express");
const body_parser = require("body-parser");
const MessagingResponse = require("twilio/lib/twiml/MessagingResponse");

var TokenProvider = require("./lib/tokenprovider");
var Conversation = require("./lib/conversation");

var app = new express();
var tokenProvider = new TokenProvider(credentials);

if (credentials.authToken) {
  console.warn(
    'WARNING: The "authToken" field is deprecated. Please use "signingKeySecret".'
  );
}

if (credentials.instanceSid) {
  console.warn(
    'WARNING: The "instanceSid" field is deprecated. Please use "serviceSid".'
  );
}

app.get("/status", (req, res) => {
  res.sendStatus(200);
});

app.get("/getToken", function (req, res) {
  var identity = req.query && req.query.identity;
  if (!identity) {
    res.status(400).send("getToken requires an Identity to be provided");
  }

  var token = tokenProvider.getToken(identity);
  res.send(token);
});

app.post(
  "/whatsapp",
  body_parser.urlencoded({ extended: false }),
  (req, res) => {
    const twiml = new MessagingResponse();

    /*
    AccountSid:'AC340ff87de8e86be07452832bc4ea2f5f'
    ApiVersion:'2010-04-01'
    Body:'Hi!'
    From:'whatsapp:+34647309368'
    MessageSid:'SMd560fd57e6a716185ff48d0eecaebae0'
    NumMedia:'0'
    NumSegments:'1'
    SmsMessageSid:'SMd560fd57e6a716185ff48d0eecaebae0'
    SmsSid:'SMd560fd57e6a716185ff48d0eecaebae0'
    SmsStatus:'received'
    To:'whatsapp:+14155238886'
    */

    const fromNumber = req.body.From.split("whatsapp:")[1];
    const toNumber = req.body.To.split("whatsapp:")[1];

    const authToken = credentials.authToken;

    Conversation.createConversation(
      `${req.body.From}-${req.body.SmsMessageSid}`,
      {
        accountSid: credentials.accountSid,
        authToken,
      }
    )
      .then((conversation) => {
        return Conversation.createWhatsappChatParticipant(
          conversation.sid,
          fromNumber,
          toNumber,
          {
            accountSid: credentials.accountSid,
            authToken,
          }
        ).then((participantSid) => {
          console.log(`${participantSid}`);
          twiml.message("The Robots are coming! Head for the hills!");

          res.writeHead(200, { "Content-Type": "text/xml" });
          res.end(twiml.toString());
        });
      })
      .catch((err) => {
        console.error(`ERROR: ${err}`);
      });
  }
);

app.use(express.static(__dirname + "/dist"));

app.listen(8080, "0.0.0.0");
