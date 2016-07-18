/**
 * Module dependencies.
 */
const express = require('express');
const request = require('request');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const Client = require('./models/Client');

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
 * Controllers (route handlers).
 */
const userController = require('./controllers/user');

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
app.use(expressValidator());
app.use(passport.initialize());

/**
 * API routes.
 */

app.get('/', function(req, res) {
    res.status(200).json({
        title: 'SPA-AUTH-STARTER',
        author: 'Bogdan Pshonyak',
        routes: [
            {
                path: '/login',
                type: 'POST',
                desc: 'Login with email and password',
                protected: false
            }, {
                path: '/signup',
                type: 'POST',
                desc: 'Register with email and password',
                protected: false
            }, {
                path: '/account/profile',
                type: 'GET',
                desc: 'Retrieve user profile information',
                protected: true
            }, {
                path: '/account/password',
                type: 'POST',
                desc: 'Change a local users password',
                protected: true
            }, {
                path: '/account/delete',
                type: 'POST',
                desc: 'Delete a user',
                protected: true
            }, {
                path: '/auth/facebook',
                type: 'GET',
                desc: 'Authenticate user with their facebook account',
                protected: false
            }
        ]
    });
});

app.get('/profile', authenticate, function(req, res) {
    res.status(200).json(req.user);
});

app.post('/login', userController.postLogin, serializeUser, generateToken, respond);
// app.get('/logout', userController.logout);
// app.get('/forgot', userController.getForgot);
// app.post('/forgot', userController.postForgot);
// app.get('/reset/:token', userController.getReset);
// app.post('/reset/:token', userController.postReset);
app.post('/signup', userController.postSignup, serializeUser, generateToken, respond);
// app.get('/account', authenticate, userController.getAccount);
app.get('/account/profile', authenticate, userController.getProfile);
app.post('/account/password', authenticate, userController.postUpdatePassword);
app.post('/account/delete', authenticate, userController.postDeleteAccount);
app.get('/account/unlink/:provider', authenticate, userController.getOauthUnlink);

/**
 * OAuth authentication routes. (Sign in)
 */

app.get('/auth/facebook', passport.authenticate('facebook', {
    session: false,
    scope: ['email', 'user_location']
}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    session: false,
    failureRedirect: '/'
}), serializeUser, generateToken, respond);

/**
 * Helper Funtions
 */

function serializeUser(req, res, next) {

    req.user = {
        id: req.user.id
    }

    next();
}

function generateToken(req, res, next) {
    // Define token body
    req.token = jwt.sign({
        id: req.user.id
    }, process.env.SECRET, {
        expiresIn: 5 * 60
    });
    next();
}

function generateRefreshToken(req, res, next) {
  if (req.query.permanent === 'true') {
    req.token.refreshToken = req.user.clientId.toString() + '.' + crypto.randomBytes(
      40).toString('hex');
    db.client.storeToken({
      id: req.user.clientId,
      refreshToken: req.token.refreshToken
    }, next);
  } else {
    next();
  }
}

function respond(req, res) {
    res.status(200).json({user: req.user, token: req.token});
}

/**
 * Error Handler. (SHOULD ONLY BE USED IN DEVELOPMENT)
 */
app.use(errorHandler());

/**
 * Start server (development).
 */
http.createServer(app).listen(3000, function() {
    console.log('Server listening on port ', 3000);
});

/**
 * Start server (production).
 */
// https.createServer(credentials,app).listen(3000, function() {
//   console.log('server listening on port ', 3000);
// });
