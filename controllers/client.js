const crypto = require('crypto');
const Client = require('../models/Client');


exports.createOrUpdateClient = (user_id, cb) => {

  Client.findOne({ _id: user_id}, (err, existingClient) => {

    var refreshToken;

    if (!existingClient) {
      // Create a new client entry
      const client = new Client();
      client._id = user_id;
      client.clientCount = 1;

      refreshToken = client.clientCount + '.' + crypto.randomBytes(40).toString('hex');

      client.refreshTokens.push( refreshToken );

      client.save((err) => {
        cb(refreshToken, err);
      });
    } else {
      // Update client entry
      existingClient.clientCount++;

      refreshToken = existingClient.clientCount + '.' + crypto.randomBytes(40).toString('hex');

      existingClient.refreshTokens.push( refreshToken );
      existingClient.save((err) => {
        cb(refreshToken, err);
      });
    }
  });
}

exports.validateToken = (user_id, token, cb) => {
  Client.findOne({ _id: user_id}, (err, existingClient) => {

    if (!existingClient) {
      cb(false);
    } else {

      var valid = false;

      existingClient.refreshTokens.map(function(refreshToken) {

        if (token === refreshToken) {
          valid = true;
          return;
        }
      });

      cb(valid);

    }
  });
}

exports.revokeToken = (user_id, token, cb) => {
  Client.findOne({ _id: user_id}, (err, existingClient) => {

    if (!existingClient) {
      cb(false);
    } else {

      var valid = false;
      var tokenIndex = -1;

      for (var i = 0; i < existingClient.refreshTokens.length; i++) {
        if (token === existingClient.refreshTokens[i]) {
          valid = true;
          tokenIndex = i;
        }
      }

      if(valid){
        existingClient.refreshTokens.splice( tokenIndex, 1 );
      }

      existingClient.save((err) => {
        cb(valid, err);
      });

    }
  });
}
