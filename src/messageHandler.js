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

            entry.messaging.forEach(function (event) {
                if (event.message) {
                    receivedMessage(event);
                } else {
                    console.log("Webhook received unknown event: ", event);
                }
            });
        });
    }

    mongoose.connection.close();
    done(null, "ok");
}


function receivedMessage(event) {
    var senderId = event.sender.id;
    var recipientId = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    getUserInfo(senderId, function(userInfo){
        console.log('UserInfo', userInfo);
        saveUserData(senderId, recipientId, userInfo);
    });

    var messageId = message.mid;
    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
        handleTextMessage(message, senderId, recipientId, timeOfMessage);
    } else if (messageAttachments) {
        handleMsgWithAttachament(message);
    }
}

function handleMsgWithAttachament(message) {
    sendTextMessage(senderId, "Message with attachment received");    
}

function handleTextMessage(message, senderId, recipientId, timeOfMessage) {

    var messageText = message.text;

    switch (messageText) {
            case 'generic':
                sendTextMessage(senderId, "messageText12");
                break;

            default:
                sendTextMessage(senderId, messageText);
        }
}

function saveUserData(userId, pageMessaged, userData) {
    Object.assign(userData, { userId: userId, pageMessaged: pageMessaged });
    const user = new User(userData);
    user.save(function (err) {
        if (err) {};
    
    });
}

function getUserInfo(userId, callback) {
    request({
        uri: 'https://graph.facebook.com/v2.6/'+userId,
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN,
            fields: 'first_name,locale,profile_pic,last_name,timezone,gender'
        },
        method: 'GET'

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(JSON.parse(body));
        } else {
            console.error("Unable to send message.");
            console.error("response", response);
            console.error("error", error);
        }
    });
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
