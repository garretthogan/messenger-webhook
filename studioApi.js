const request = require('request');
const moment = require('moment');

const quickDays = days => {
  return momentQuickReplies(days, 'll', 'Which day?');
}

const quickHours = hours => {
  return momentQuickReplies(hours, 'h', 'What time?');
}

const momentQuickReplies = (moments, format, responseMessage) => {
  return {
    "messaging_type": "RESPONSE",
    "message": {
      "text": responseMessage,
      "quick_replies": moments.map(m => ({
        "content_type": "text",
        "title": m.format(format),
        "payload": format,
      }))
    }
  }
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  const payload = event.payload;

  console.log("Received message for user %d and page %d at %d with payload %d message:",
    senderID, recipientID, timeOfMessage, payload);
  console.log(JSON.stringify(message));

  var messageText = message.text;

  switch (payload) {
    case 'll':
      const hours = [
        moment().startOf('day'),
        moment().startOf('day').add(2, 'hours'),
        moment().startOf('day').add(4, 'hours')
      ];

      sendResponse(senderID, quickHours(hours));

    default:
      sendTextMessage(senderID, messageText);
  }
  // if (messageText) {
  //   switch (messageText) {
  //     default:
  //       sendTextMessage(senderID, messageText);
  //   }
  // }
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
      const days = [
        moment().add(1, 'days'),
        moment().add(2, 'days'),
        moment().add(3, 'days')
      ];

      sendResponse(senderID, quickDays(days));
      break;

    case 'cancel_reservation':
      sendTextMessage(senderID, "Cancel Reservation");
      break;

    case 'll':
      const hours = [
        moment().startOf('day'),
        moment().startOf('day').add(2, 'hours'),
        moment().startOf('day').add(4, 'hours')
      ];

      sendResponse(senderID, quickHours(hours));
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
