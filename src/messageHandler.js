'use strict';

const request = require('request');
const mongoose = require('mongoose');
const User = require('./userModel');
mongoose.connect(process.env.MONGO_DB_CONNECTION);

module.exports.handleMessage = (event, context, callback) => {

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? JSON.stringify(err.message) : res,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log("event", event);

    const data = JSON.parse(event.body);
    if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function (entry) {
            var pageID = entry.id;
            var timeOfEvent = entry.time;

            // Iterate over each messaging event
            console.log("entry", entry);
            entry.messaging.forEach(function (event) {
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

        const user = new User({id: senderID});
        user.save(function(err){
            if (err) {
                console.log({info: 'error during cat create', error: err});
            };
            console.log({info: 'cat created successfully'});
        });

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
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: process.env.PAGE_ACCESS_TOKEN
            },
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
            
        });
    }
    
    mongoose.connection.close();
    done(null, "ok");
}