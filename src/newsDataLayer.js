const AWS = require('aws-sdk');
const database = new AWS.DynamoDB.DocumentClient();
const url = require('url');

function findSiteByName (hostname) {
        var params = {
            TableName: 'siteTable',
            Key: {
                name: hostname
            }
        };

        return database.get(params).promise();
    }

module.exports = {
    findHostnames: function (urlList, callback) {
        urlList.forEach(function(urlText, index){
            const urlObject = url.parse(urlText);
            findSiteByName(urlObject.hostname).then(callback);
        })
    },
    findSiteByName: findSiteByName,
}


