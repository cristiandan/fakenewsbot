const AWS = require('aws-sdk');
const database = new AWS.DynamoDB.DocumentClient();
const url = require('url');
const q = require('q');

function findSiteByName(hostname) {
    var params = {
        TableName: 'siteTable',
        Key: {
            name: hostname
        }
    };

    return database.get(params).promise();
}

module.exports = {
    findHostnames: function (urlList) {
        var promises = urlList.map(function (urlString) {
            var urlObject = url.parse(urlString);
            return findSiteByName(urlObject.hostname);
        })
        return q.all(promises);
    },
    findSiteByName: findSiteByName,
    addSite: function (site) {
        const params = {
            TableName: 'siteTable',
            Item: site
        };

        return database.put(params).promise();
    },
}
