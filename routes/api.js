var express = require('express');
var router = express.Router({caseSensitive: true});
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var User = require('../models/user');
var Poll = require('../models/polls');

// Delete selected poll 

router.delete('/polls/:id', function (request, response) {
    Poll.findById(request.params.id, function (err, poll) {
        if (err) {
            return response.status(400).send({
                message: 'No poll found'
            })
        }
        if (poll) {
            var token = request.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.secret, function(err, decoded) {
                if (err) {
                    return response.status(400).json('Unauthorized request: invalid token');
                }
                else {
                    console.log(poll);
                    if (decoded.data.name === poll.owner) {
                        poll.remove(function (err) {
                            if (err) {
                                return response.status(400).send(err);
                            }
                            else {
                                return response.status(200).send({
                                    message: 'Deleted poll'
                                });
                            }
                        })
                    }
                    else {
                        return response.status(403).send({
                            message: 'Can only delete polls you own'
                        });
                    }
                }
            });
        }
    });
});


// Get all polls created by current user in the profile page

router.get('/user-polls/:name', function(request, response) {
    if (!request.params.name) {
        return response.status(400).send({
            message: 'No user name provided!'
        })
    }
    else {
        Poll.find({owner: request.params.name}, function(err, documents) {
            if (err) {
                return response.status(400).send(err);
            }
            else {
                return response.status(200).send(documents);
            }
        });
    }
});


// Add a vote to the option of a poll

router.put('/polls/', function(request, response) {
    Poll.findById(request.body.id, function(err, poll) {
        if (err) {
            return response.status(400).send(err);
        }
        console.log('in api print poll ');
        for (var i = 0; i < poll.options.length; i++) {
            if (poll.options[i]._id.toString() === request.body.vote) {
                console.log('hit');
                poll.options[i].votes += 1;
                poll.save(function(err, res) {
                    if (err) {
                        return response.status(400).send(err);
                    }
                    else {
                        return response.status(200).send({
                            message: 'Successfully voted!'
                        });
                    }
                });
            }
        }
    });
});



// Get current poll

router.get('/poll/:id', function(request, response){
    Poll.findOne({ _id: request.params.id }, function(err, poll) {
        if (err) {
            return response.status(400).send(err);
        }
        else {
            return response.status(200).send(poll);
        }
    });
});



// Add an option in an existing poll

router.put('/polls/add-option', function(request, response) {
    var id = request.body.id;
    var option = request.body.option;
    Poll.findById(id, function (err, poll) {
        if (err) {
            return response.status(400).send(err);
        }
        for (var i = 0; i < poll.options.length; i++) {
            if (poll.options[i].name === option) {
                return response.status(403).send({
                    message: 'Option already exists!'
                })
            }
        }
        poll.options.push({
            name: option,
            votes: 0
        });
        poll.save(function (err, res) {
            if (err) {
                return response.status(400).send({
                    message: 'Problem has occured in saving poll!',
                    error: err
                });
            }
            else {
                return response.status(201).send({
                    message: 'Successfully created a new poll option!'
                });
            }
        });
    });
});

// Get all polls

router.get('/polls', function(request, response) {
    Poll.find({}, function(err, polls) {
        if (err) {
            return response.status(400).send(err);
        }
        return response.status(200).send(polls);
    });
});

// Create a new poll

router.post('/polls', authenticate, function (request, response){
    if (!request.body.options || !request.body.name) {
        return response.status(400).send('No poll data supplied!');
    }
    var poll = new Poll();
    poll.name = request.body.name;
    poll.options = request.body.options;
    poll.owner = request.body.owner;

    poll.save(function (err, document) {
        if (err) {
            if (err.code === 11000) {
                return response.status(400).send('No duplicates!');
            }
            return response.status(400).send(err);
        }else {
            return response.status(201).send({
                message: 'Successfully created a poll',
                data: document
            });
        }
    });
});


// Verification of token

router.post('/verify', function (request, response) {
    if (!request.body.token) {
        return response.status(400).send('No token has been provided!');
    }
    jwt.verify(request.body.token, process.env.secret, function (err, decoded) {
        if (err) {
            return response.status(400).send({
                message: 'invalid token',
                error: err
            });
        }
        else {
            return response.status(200).send({
                message: 'valid token',
                decoded: decoded
            }); 
        }
    });
});


// Login

router.post('/login', function (request, response){
    if(request.body.name && request.body.password) {
        User.findOne({ name: request.body.name}, function (err, user) {
            if (err) {
                return response.status(400).send(err);
            }
            if (!user) {
                return response.status(404).send('No user has been registered with these credentials!');
            }
            if (bcrypt.compareSync(request.body.password, user.password)) {
                var token = jwt.sign({
                    data: user
                }, process.env.secret, { expiresIn: 3600});
                return response.status(200).send(token);
            }
            else {
                return response.status(400).send({
                    message: 'Unauthorized'
                });
            }
            
        });
    }
    else {
        return response.status(400).send({
            message: 'Server error in posting to api'
        });
    }
})

//Register

router.post('/register', function(request, response){
    if (request.body.name && request.body.password) {
        var user = new User();
        user.name = request.body.name;
        console.time('bcryptHash');
        user.password = bcrypt.hashSync(request.body.password, bcrypt.genSaltSync(10))
        console.timeEnd('bcryptHash');
        user.save(function(err, document){
            if (err) {
                return response.status(400).send(err);
            }
            else {
                var token = jwt.sign({
                    data: document
                }, process.env.secret, { expiresIn: 3600});
                return response.status(201).send(token);
            }
        });
    }
    else {
        return response.status(400).send({
            message: 'Invalid credentials supplied!'
        });
    }
});

//Authentication middleware

function authenticate(request, response, next) {
    var header = request.headers.authorization;
    if (!header) {
        return response.status(403).send('No token supplied');
    }
    else {
        var token = header.split(' ')[1];
        jwt.verify(token, process.env.secret, function (err, decoded) {
            if (err) {
                return response.status(401).json('Unauthorized request: invalid token');
            }
            else next();
        });
    }
}

module.exports = router;