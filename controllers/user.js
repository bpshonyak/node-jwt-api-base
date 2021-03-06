const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({remove_dots: false});

    const errors = req.validationErrors();

    if (errors) return next(errors);

    passport.authenticate('local', {
        session: false,
        scope: []
    })(req, res, next);
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {

    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
    req.sanitize('email').normalizeEmail({remove_dots: false});

    const errors = req.validationErrors();

    if (errors) return next(errors);

    const user = new User({email: req.body.email, password: req.body.password});

    User.findOne({
        email: req.body.email
    }, (err, existingUser) => {

        if(err) return next(err);

        if (existingUser) {
            var err = {
                msg: 'Account with that email address already exists.',
                status: 403
            };
            return next(err);
        }

        user.save((err) => {
            if (err)
                return next(err)

            req.user = user;
            return next();
        });
    });
};

/**
 * GET /account/profile
 * Retreive profile information.
 */
exports.getProfile = (req, res, next) => {

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }

        req.profile = user;

        next();

    });

};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({remove_dots: false});

    const errors = req.validationErrors();

    if (errors)
        return next(errors);


    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user.email = req.body.email || '';
        user.profile.name = req.body.name || '';
        user.profile.gender = req.body.gender || '';
        user.profile.location = req.body.location || '';
        user.profile.website = req.body.website || '';
        user.save((err) => {
            if (err) {
                if (err.code === 11000) {
                    var err = {msg: 'The email address you have entered is already associated with an account.'};
                    return next(err);
                }
                return next(err);
            }
            res.status(200).json({msg: 'Profile information has been updated.'});
        });
    });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors)
        return next(errors);


    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user.password = req.body.password;
        user.save((err) => {
            if (err)
                return next(err);

            res.status(200).json({msg: 'Password has been changed.'});
        });
    });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
    User.remove({
        _id: req.user.id
    }, (err) => {
        if (err)
            return next(err);

        //TODO: Revoke refreshToken here
        res.status(200).json({msg: 'Your account has been deleted.'});
    });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
    const provider = req.params.provider;
    User.findById(req.user.id, (err, user) => {
        if (err)
            return next(err);

        user[provider] = undefined;
        user.tokens = user.tokens.filter(token => token.kind !== provider);
        user.save((err) => {
            if (err)
                return next(err);

            res.status(200).json({msg: `${provider} account has been unlinked.`});
        });
    });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    User.findOne({passwordResetToken: req.params.token}).where('passwordResetExpires').gt(Date.now()).exec((err, user) => {
        if (err)
            return next(err);

        if (!user) {
            req.flash('errors', {msg: 'Password reset token is invalid or has expired.'});
            return res.redirect('/forgot');
        }
        res.render('account/reset', {title: 'Password Reset'});
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    req.assert('confirm', 'Passwords must match.').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    async.waterfall([
        function(done) {
            User.findOne({passwordResetToken: req.params.token}).where('passwordResetExpires').gt(Date.now()).exec((err, user) => {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    req.flash('errors', {msg: 'Password reset token is invalid or has expired.'});
                    return res.redirect('back');
                }
                user.password = req.body.password;
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                user.save((err) => {
                    if (err) {
                        return next(err);
                    }
                    req.logIn(user, (err) => {
                        done(err, user);
                    });
                });
            });
        },
        function(user, done) {
            const transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'hackathon@starter.com',
                subject: 'Your Hackathon Starter password has been changed',
                text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
            };
            transporter.sendMail(mailOptions, (err) => {
                req.flash('success', {msg: 'Success! Your password has been changed.'});
                done(err);
            });
        }
    ], (err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({remove_dots: false});

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    async.waterfall([
        function(done) {
            crypto.randomBytes(16, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({
                email: req.body.email
            }, (err, user) => {
                if (!user) {
                    req.flash('errors', {msg: 'Account with that email address does not exist.'});
                    return res.redirect('/forgot');
                }
                user.passwordResetToken = token;
                user.passwordResetExpires = Date.now() + 3600000; // 1 hour
                user.save((err) => {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            const transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'hackathon@starter.com',
                subject: 'Reset your password on Hackathon Starter',
                text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
            };
            transporter.sendMail(mailOptions, (err) => {
                req.flash('info', {msg: `An e-mail has been sent to ${user.email} with further instructions.`});
                done(err);
            });
        }
    ], (err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/forgot');
    });
};
