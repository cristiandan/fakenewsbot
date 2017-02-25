const newsDataLayer = require('./newsDataLayer');
const q = require('q');

module.exports.handleAdd = (event, context, callback) => {
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? JSON.stringify(err.message) : res,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const addSuccess = () => done(null, {
            message: "Successfully added!",
        });

    const eventBody = JSON.parse(event.body);
    console.log("body", eventBody);
    if (eventBody && eventBody.token !== process.env.VERIFY_TOKEN) {
        console.log("token", eventBody.token, process.env.VERIFY_TOKEN);
        done({
            message: 'wrong token ' + eventBody.token,
        });
    } else if (eventBody.data && eventBody.data.length === undefined) {
        console.log('v1');
        newsDataLayer.addSite(eventBody.data)
            .then(addSuccess);
    } else if (eventBody.data) {
        console.log('v2');
        var promises = eventBody.data.map(function (site) {
            return newsDataLayer.addSite(site);
        });

        console.log('promises', promises);

        q.all(promises)
            .then(addSuccess);
    } else {
        console.log('v3');
        done({
            message: "Error with the payload"
        });
    }


}