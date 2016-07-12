const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  id: String,
  refreshToken: String
}, { timestamps: true });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
