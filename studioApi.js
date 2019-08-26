const request = require('request');
const moment = require('moment');

const quickReserveOptions = {
  "messaging_type": "RESPONSE",
  "message": {
    "text": "Pick a color:",
    "quick_replies": [
      {
        "content_type": "text",
        "title": moment().add(1, 'days').format('ll'),
        "payload": "<POSTBACK_PAYLOAD>",
      }, {
        "content_type": "text",
        "title": moment().add(2, 'days').format('ll'),
        "payload": "<POSTBACK_PAYLOAD>",
      }, {
        "content_type": "text",
        "title": moment().add(3, 'days').format('ll'),
        "payload": "<POSTBACK_PAYLOAD>",
      }
    ]
  }
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageText = message.text;

  if (messageText) {
    switch (messageText) {
      default:
        sendTextMessage(senderID, messageText);
    }
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  switch (payload) {
    case 'get_started':
      sendGetStarted(senderID);
      break;
    case 'studio_time':
      sendResponse(senderID, quickReserveOptions);
      break;
    case 'cancel_reservation':
      sendTextMessage(senderID, "Cancel Reservation");
      break;
    default:
      sendTextMessage(senderID, "Postback called");
  }
}

function sendResponse(recipientID, data) {
  const message = { recipient: { id: recipientID }, ...data }

  callSendAPI(message);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };
  callSendAPI(messageData);
}

function sendGetStarted(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "How can I help you today?",
          buttons: [{
            type: "postback",
            title: "Reserve Studio Time",
            payload: "studio_time"
          }, {
            type: "postback",
            title: "Cancel Reservation",
            payload: "cancel_reservation"
          }]
        }
      }
    }
  };
  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  console.log(messageData);
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
      } else {
        console.log("Successfully called Send API for recipient %s",
          recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

module.exports = { receivedMessage, receivedPostback }
