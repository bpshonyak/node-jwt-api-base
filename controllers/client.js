const crypto = require('crypto');
const Client = require('../models/Client');

exports.createOrUpdateClient = function(user_id, cb) {
  Client.findOne({ _id: user_id}, (err, existingClient) => {
    if (!existingClient) {
      // Create a new client entry
      const client = new Client();
      client._id = user_id;
      client.clientCount = 1;
      client.refreshTokens.push( client.clientCount + '.' + crypto.randomBytes(40).toString('hex'));

      client.save((err) => {
        cb(client, err);
      });
    } else {
      // Update client entry
      existingClient.clientCount++;
      existingClient.refreshTokens.push( existingClient.clientCount + '.' + crypto.randomBytes(40).toString('hex'));
      existingClient.save((err) => {
        cb(existingClient, err);
      });
    }
  });
}
