'use strict';

module.exports.handleRequest = (event, context, callback) => {

  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? JSON.stringify(err.message) : res,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("event", event);

  if (event.queryStringParameters['hub.mode'] === 'subscribe' &&
    event.queryStringParameters['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    done(null, event.queryStringParameters['hub.challenge']);
  } else {
    done({ message: "Failed validation. Make sure the validation tokens match." });
  }
};