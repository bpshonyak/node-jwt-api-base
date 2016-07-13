const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  id: String,
  refreshToken: String
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
