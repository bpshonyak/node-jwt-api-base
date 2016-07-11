/**
 * Module dependencies.
 */
const express     = require('express');
const request     = require('request');
const http        = require('http');
const https       = require('https');
const bodyParser  = require('body-parser');
const logger      = require('morgan');
const dotenv      = require('dotenv');
const mongoose    = require('mongoose');
const passport    = require('passport');
const expressJwt  = require('express-jwt');
const jwt         = require('jsonwebtoken');
const _           = require('lodash');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env' });

/**
 * HTTPS Credentials (Use in Production)
 */
 // var credentials = {
 //   key: process.env.PRIVATE_KEY,
 //   cert: process.env.CERTIFICATE
 // };

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', () => {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

/**
 * Express configuration.
 */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(passport.initialize());

/**
 * API routes.
 */


/**
 * OAuth authentication routes. (Sign in)
 */



/**
 * Start server (development).
 */
http.createServer(app).listen(3000, function() {
  console.log('server listening on port ', 3000);
});

/**
 * Start server (production).
 */
// https.createServer(credentials,app).listen(3000, function() {
//   console.log('server listening on port ', 3000);
// });
