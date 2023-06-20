const express = require('express');
const app = express();
const port = 8081;
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const YandexStrategy = require('passport-yandex').Strategy;

app.use(session({ secret: "supersecret", resave: true, saveUninitialized: true }));

let Users = [{'login': 'admin', 'email':'egorsobinin@yandex.ru'},
            {'login': 'EgrSobn', 'email':'ouroged@gmail.com'}];

const findUserByLogin = (login) => {
    return Users.find((element)=> {
        return element.login == login;
    })
}

const findUserByEmail = (email) => {
    return Users.find((element)=> {
        return element.email.toLowerCase() == email.toLowerCase();
    })
}

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.login);
});

passport.deserializeUser((login, done) => {
    user = findUserByLogin(login);
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: '749708634051-q67qp08c9508g6s76s1u6058fv5s49f2.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: "http://localhost:8081/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = profile;
    if (user) return done(null, user);

    done(true, null);
  }
));

passport.use(new GithubStrategy({
    clientID: 'e983dedb9601ca2145e9',
    clientSecret: '635ba0b6d655111574caadc4399fcf753f5291c9',
    callbackURL: "http://localhost:8081/auth/github/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByLogin(profile.username);
    if (!user) {
      user = findUserByEmail(profile.emails[0].value);
    }
    if (user) {
      user.profile = profile;
      return done(null, user);
    }

    return done(true, null);
  }
));

passport.use(new YandexStrategy({
    clientID: '7947b761ee304a148a9f12139a05fc73',
    clientSecret: 'e845c7b37ec144bea2379ea8ba8b1668',
    callbackURL: "http://localhost:8081/auth/yandex/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = profile;
    if (user) return done(null, user);
    done(true, null);
  }
));

const isAuth = (req, res, next)=> {
    if (req.isAuthenticated()) return next();

    res.redirect('/sorry');
}

app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/sorry', (req, res)=> {
    res.sendFile(path.join(__dirname, 'sorry.html'));
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/sorry', successRedirect: '/private' }));

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/sorry', successRedirect: '/private' }));

app.get('/auth/yandex', passport.authenticate('yandex'));

app.get('/auth/yandex/callback', passport.authenticate('yandex', { failureRedirect: '/sorry', successRedirect: '/private' }));

app.get('/private', isAuth, (req, res)=>{
    res.send(req.user);
});

app.listen(port, () => console.log(`App listening on port ${port}!`));