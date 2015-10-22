//npm install cookie-parser
//npm install openid
//npm install ect

var express = require('express');
var app = express();
var ECT = require('ect');
var openid = require('openid');
var session = require('express-session');

var relyingParty = new openid.RelyingParty('http://127.0.0.1:3000/verify', 'http://127.0.0.1:3000', true, false, []);
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext: '.ect', gzip: true });

app.use(session({
    secret: '1234567890QWERTY',
    saveUninitialized: true,
    resave: true,
    name: 'joba228'
}));
app.use(express.static('public'));
app.set('view engine', 'ect');
app.engine('ect', ectRenderer.render);

app.get('/', function (req, res){
    res.render('layout', {is_logged: req.session.authorized});
});

app.get('/logout', function (req, res){
    delete req.session.authorized;
    delete req.session.steamid;
});

app.get('/verify', function (req, res){
    relyingParty.verifyAssertion(req, function(error, result) {
        if (!error && result.authenticated) {
            req.session.authorized = true;
            req.session.steamid = result.claimedIdentifier;
            res.redirect('/');
        } else {
            req.session.authorized = false;
            console.log("auth closed or error");
        }
    });
});

app.get('/auth', function (req, res){
    relyingParty.authenticate("http://steamcommunity.com/openid/", false, function(error, authUrl) {
        if (error) {
            res.writeHead(200);
            res.end('Authentication failed: ' + error.message);
        } else if (!authUrl) {
            res.writeHead(200);
            res.end('Authentication failed');
        } else {
            res.writeHead(302, {Location: authUrl});
            res.end();
        }
    });
});

var server = app.listen(3030, '10.135.134.196', function() {
    console.log("Server started.");
});