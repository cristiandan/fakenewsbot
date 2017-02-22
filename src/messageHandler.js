const request = require('request');
const userDataLayer = require('./userDataLayer');
const getUrls = require('get-urls');
const newsDataLayer = require('./newsDataLayer');

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

            handleMessagingEvents(entry);
        });
    }

    done(null, "ok");
}

function handleMessagingEvents (entry) {
    entry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.optin) {
          // receivedAuthentication(messagingEvent);
          console.log("received authentication event", messagingEvent);
        } else if (messagingEvent.delivery) {
          // receivedDeliveryConfirmation(messagingEvent);
          console.log("received delivery confirmation event", messagingEvent);
        } else if (messagingEvent.postback) {
          // receivedPostback(messagingEvent);
          console.log("received postback event", messagingEvent);
        } else if (messagingEvent.read) {
          // receivedMessageRead(messagingEvent);
          console.log("received message read event", messagingEvent);
        } else if (messagingEvent.account_linking) {
          // receivedAccountLink(messagingEvent);
          console.log("received account link event", messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
    });
}


function receivedMessage(event) {
    var senderId = event.sender.id;
    var recipientId = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    userDataLayer.getUserByUId(senderId)
            .then(function(user){
                console.log('get user by id', user)
                if (!Object.keys(user).length)
                {
                    getUserInfo(senderId, function(userInfo){
                        console.log('UserInfo', userInfo);
                        userDataLayer.saveUniqueUserData(senderId, recipientId, userInfo);
                    });
                }
            })
            .catch(handleError);

    var messageId = message.mid;
    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
        handleTextMessage(message, senderId, recipientId, timeOfMessage);
    } else if (messageAttachments) {
        handleMsgWithAttachament(message, senderId);
    }
}

function handleMsgWithAttachament(message, senderId) {
    sendTextMessage(senderId, "Message with attachment received");    
}

function handleTextMessage(message, senderId, recipientId, timeOfMessage) {

    var messageText = message.text;

    // switch (messageText) {
    //         case 'generic':
    //             sendTextMessage(senderId, "messageText12");
    //             break;

    //         default:
    //             sendTextMessage(senderId, messageText);
    //     }
    const urlList = parseTextForUrls(messageText);

    newsDataLayer.findHostnames(Array.from(urlList))
        .then(function(sitesData){
            sitesData.forEach(function(site){
                if(site && site.Item){
                    message = makeMessageText(site.Item);
                    sendTextMessage(senderId, message);
                }
            })
    });
}

function makeMessageText(siteData){
    var emoji = "";
    switch(siteData.type) {
        case "danger":
        emoji = "\u26d4\ufe0f";
        break;

        case "warning":
        emoji = "\u26a0\ufe0f";
        break;

        case "verified":
        emoji = "\u2705";
        break;

        case "unknown":
        emoji = "\u2049\ufe0f";
        break;

        case "!!":
        emoji = "\u203c\ufe0f";
        break;

        default:
        emoji = "";
        break;
    }
    return emoji + "  " + siteData.name + "\n" + siteData.desc;
}

function parseTextForUrls(messageText, callback){
    return getUrls(messageText);
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
            error.response = response;
            handleError(error)
        }
    });
}

function sendTextMessage(recipientId, messageText) {
    var message = limitChars(messageText);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: message
        }
    };

    callSendAPI(messageData);
}

function limitChars(message) {
    if (message.length > 640) {
        return message.substring(0, 640);
    }
    return message;
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

        } else if (response.statusCode != 200){
            handleError({response: response});
        }
        else {
            error.response = response;
            handleError(error);
        }

    });
}

function handleError(err) {
    console.error("error!", err);
}