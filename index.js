//npm install express-session
//npm install openid
//npm install ect
//npm install mysql

var express = require('express');
var app = express();
var ECT = require('ect');
var openid = require('openid');
var session = require('express-session');
var mysql = require('mysql');

var config = {
    //server_ip: 'localhost',
    server_ip: '10.135.134.196',
    server_port: 3030,
    //server_domain: 'http://localhost:3030'
    server_domain: 'http://steam.andrey-volkov.ru'
};

var relyingParty = new openid.RelyingParty(config.server_domain + '/verify', config.server_domain, true, false, []);
var ect = ECT({ watch: true, root: __dirname + '/views', ext: '.ect', gzip: true });

app.use(session({
    secret: '1234567890QWERTY',
    saveUninitialized: true,
    resave: true,
    name: 'session'
}));
app.use(express.static('public'));
app.set('view engine', 'ect');
app.engine('ect', ect.render);

var connection = mysql.createConnection({
    socketPath: '/var/run/mysqld/mysqld.sock',
    host: 'localhost',
    user: 'root',
    password: '94volkoff14',
    database: 'steam_holiday_cards'
});

connection.connect(function(err){
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection to Db established');
});

app.get('/', function (req, res){
    res.render('layout', {is_logged: req.session.authorized});
});

app.get('/logout', function (req, res){
    req.session.destroy();
    res.redirect('/');
});

app.get('/verify', function (req, res){
    relyingParty.verifyAssertion(req, function(error, result) {
        if (!error && result.authenticated) {
            var openid_steamid = /(\d+)/;
            var returned_steamid = result.claimedIdentifier.match(openid_steamid);

            req.session.authorized = true;
            req.session.steamid = returned_steamid[1];
            console.log("Log in: " + returned_steamid[1]);

            connection.query('SELECT * FROM users WHERE steamid = ?', [returned_steamid[1]], function(err, rows) {
                if(err) throw err;

                if (rows.length == 0) {
                    console.log('need to insert');
                } else {
                    console.log('need to return');
                    console.log(rows);
                }
            });

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

var server = app.listen(config.server_port, config.server_ip, function() {
    console.log("Server started.");
});