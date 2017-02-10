'use strict';

const request = require('request');

module.exports.handleRequest = (event, context, callback) => {

  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? JSON.stringify(err.message) : res,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("event", event);
  console.log("context", context);
  console.log('query', event.queryStringParameters);

  if (event.queryStringParameters['hub.mode'] === 'subscribe' &&
    event.queryStringParameters['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    done(null, event.queryStringParameters['hub.challenge']);
  } else {
    done({
      message: {
        ms: "Failed validation. Make sure the validation tokens match.",
        obj1: JSON.stringify(event.queryStringParameters)
      }
    });
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};


module.exports.handleMessage = (event, context, callback) => {
  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? JSON.stringify(err.message) : res,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("event", event);
  console.log("context", context);

  const data = JSON.parse(event.body);
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      console.log("entry", entry);
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
  }



function receivedMessage(event) {
  console.log('enter received event');
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendTextMessage(senderID, "messageText12");
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  console.log("envi",process.env.PAGE_ACCESS_TOKEN);
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);

    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
    done(null, "ok");
  });  
}

}