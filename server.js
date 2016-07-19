/**
 * Module dependencies.
 */
const express = require('express');
const request = require('request');
const http = require('http');
const bodyParser = require('body-parser');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({path: '.env'});

/**
 * Controllers (route handlers).
 */
const userController = require('./controllers/user');
const clientController = require('./controllers/client');

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
 * Server responses
 */
 const respond = {
     auth: function(req, res) {
         res.status(200).json({
           user: req.user,
           token: req.token
         });
     },
     token: function(req, res) {
         res.status(201).json({
           refreshToken: req.refreshToken
         });
     },
     revoke: function(req, res) {
         res.status(200).json({
           success: "Refresh token has been revoked!"
         });
     }
 }

/**
 * API routes.
 */

app.get('/', function(req, res) {
    res.status(200).json({
        API: 'JWT-AUTH-STARTER'
    });
});

app.get('/profile', authenticate, function(req, res) {
    res.status(200).json(req.user);
});

app.post('/login', userController.postLogin, serializeUser, generateAccessToken, respond.auth);
// app.get('/logout', userController.logout);
// app.get('/forgot', userController.getForgot);
// app.post('/forgot', userController.postForgot);
// app.get('/reset/:token', userController.getReset);
// app.post('/reset/:token', userController.postReset);
app.post('/signup', userController.postSignup, serializeUser, generateAccessToken, respond.auth);
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
}), serializeUser, generateAccessToken, respond.auth);

app.get('/token', authenticate, generateRefreshToken, respond.token);
app.post('/token/refresh', validateRefreshToken, generateAccessToken, respond.auth);
app.post('/token/revoke', revokeRefreshToken, respond.revoke);

/**
 * Helper Funtions
 */


function serializeUser(req, res, next) {
    req.user = { id: req.user.id };
    next();
}

function validateRefreshToken(req, res, next) {

    req.user = {
        id: req.body.id
    }

    clientController.validateToken(req.body.id, req.body.refreshToken, function(valid) {

        if(!valid) {
            res.status(500).json({
              error: "Failed to validate refresh token."
            });
        } else {
            next();
        }
    });
}

function revokeRefreshToken(req, res, next) {

    req.user = {
        id: req.body.id
    }

    clientController.revokeToken(req.body.id, req.body.refreshToken, function(valid) {

        if(!valid) {
            res.status(500).json({
              error: "Failed to revoke refresh token."
            });
        } else {
            next();
        }
    });

}

function generateAccessToken(req, res, next) {
    // Define token body
    req.token = jwt.sign({
        id: req.user.id
    }, process.env.SECRET, {
        expiresIn: 5 * 60
    });
    next();
}

function generateRefreshToken(req, res, next) {
    clientController.createOrUpdateClient(req.user.id, function(refreshToken, err) {
        if (err)
            console.log(err);

        console.log(refreshToken);
        req.refreshToken = refreshToken;
        next();
    });
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
