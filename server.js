/**
 * Module dependencies.
 */
const express = require('express');
const request = require('request');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const passport = require('passport');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({path: '.env'});

/**
 * HTTPS Credentials (Use in Production)
 */
// var credentials = {
//   key: process.env.PRIVATE_KEY,
//   cert: process.env.CERTIFICATE
// };

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * JWT Authentication
 */
const authenticate = expressJwt({secret: process.env.SECRET});

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
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());

/**
 * API routes.
 */

app.get('/', function(req, res) {
  res.status(200).json({
    hello: 'world'
  });
});

app.get('/me', authenticate, function(req, res) {
  res.status(200).json(req.user);
});

/**
 * OAuth authentication routes. (Sign in)
 */

 app.post('/auth', passport.authenticate(
  'local', {
    session: false,
    scope: []
  }), serialize, generateToken, respond);

  app.get('/auth/facebook', passport.authenticate('facebook', { session: false, scope: ['email', 'user_location'] }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/' }), serialize, generateToken, respond);

  /**
   * Helper Funtions
   */

  function serialize(req, res, next) {

    req.user = {
      id: req.user.id
    }

    next();
  }

  function generateToken(req, res, next) {
    req.token = jwt.sign({
      id: req.user.id,
    }, process.env.SECRET, {
      expiresIn: 5 * 60
    });
    next();
  }

  function respond(req, res) {
    res.status(200).json({
      user: req.user,
      token: req.token
    });
  }

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
