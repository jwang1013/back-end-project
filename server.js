//Create a db connection string

var db = 'mongodb://localhost:27017/free-code-camp-voting';

//Create a port for server to listen on

var port = process.env.PORT || 8000;

// Load in router

var router = require('./routes/api');

// Load in node modules

var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dotenv = require('dotenv');


//Create an express application

var app = express();

//Load in environment variables

dotenv.config({ verbose: true});

// Connect to Mongo

mongoose.connect(db, function(err) {
    if(err) {
        console.log(err);
    }
});

// Listen to mongoose connection events

mongoose.connection.on('connected', function() {
    console.log('Successfully opened a connection to ' + db);
});

mongoose.connection.on('disconnected', function() {
    console.log('Successfully disconnected from ' + db);
});

mongoose.connection.on('error', function() {
    console.log('An error has occured connecting to ' + db);
});

// Configure express middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.use('/api', router);
app.get("*", function (req, res){
    res.sendFile(__dirname + '/public/index.html');
});

//Start up our server

app.listen(port, function() {
    console.log('Listening on ' + port);
});

console.log(process.env.secret);