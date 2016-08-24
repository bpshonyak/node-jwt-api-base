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
      return cb({msg: 'The client id provided does not exists', status: 500});
    } else {

      existingClient.refreshTokens.map(function(refreshToken) {

        if (token === refreshToken) {
          return cb();
        }
      });

      return cb({msg: 'Refresh token not found', status: 500});

    }
  });
}

exports.revokeToken = (user_id, token, cb) => {
  Client.findOne({ _id: user_id}, (err, existingClient) => {

    if (!existingClient) {
      return cb({msg: 'The client id provided does not exists', status: 500});
    } else {

      var found = false;
      var tokenIndex = -1;

      for (var i = 0; i < existingClient.refreshTokens.length; i++) {
        if (token === existingClient.refreshTokens[i]) {
          found = true;
          tokenIndex = i;
        }
      }

      if(found){
        existingClient.refreshTokens.splice( tokenIndex, 1 );
      } else {
        return cb({msg: 'Refresh token not found', status: 500});
      }

      existingClient.save((err) => {
        if (err)
          return cb(err);

        return cb();
      });

    }
  });
}
