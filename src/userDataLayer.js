const AWS = require('aws-sdk');
const database = new AWS.DynamoDB.DocumentClient();


function handleError(err) {
    console.error("error!", err);
}

function saveUserData(userData) {
    console.log(userData);
    const params = {
        TableName: 'userTable',
        Item: userData
    };

    return database.put(params).promise();
}

function getUserByUId(userId) {
    var params = {
        TableName: 'userTable',
        Key: {
            userId: userId
        }
    };

    return database.get(params).promise();
}

module.exports = {
    saveUniqueUserData: function (userId, pageMessaged, userData) {

        Object.assign(userData, {
            userId: userId,
            pageMessaged: pageMessaged
        });
        saveUserData(userData)
            .then(function (value) {

            })
            .catch(handleError);

    },
    getUserByUId: getUserByUId
}