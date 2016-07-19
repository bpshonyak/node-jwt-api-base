const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientCount: Number,
  refreshTokens: Array
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
