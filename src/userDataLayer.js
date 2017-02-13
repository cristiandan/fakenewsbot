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
    database.put(params).promise()
        .then(value => console.log(value))
        .catch(error => console.log(error));
}

function getUserByUId(userId) {
    var params = {
        TableName: 'userTable',
        Key: {
            userId: userId
        }
    };

    database.get(params).promise()
        .then(value => console.log("getById",value))
        .catch(error => console.log("getByIderror",error));
}

module.exports = {
    saveUniqueUserData: function (userId, pageMessaged, userData) {
        // getUserByUId(userId);
        Object.assign(userData, {
            userId: userId,
            pageMessaged: pageMessaged
        });
        saveUserData(userData);
    },
    getUserByUId: getUserByUId
}