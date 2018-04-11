var express = require('express');
var router = express.Router({caseSensitive: true});
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var User = require('../models/user');

//Register

router.post('/register', function(request, response){
    if (request.body.name && request.body.password) {
        var user = new User();
        user.name = request.body.name;
        console.time('bcryptHashing');
        user.password = bcrypt.hashSync(request.body.password, bcrypt.genSaltSync(10))
        console.timeEnd('bcryptHasing');
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



module.exports = router;