var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PollsSchema = new Schema ({
    name: {
        type: String,
        required: true,
        unique: true
    },
    options: [
        {
        name: {
            type: String,
            required: true,
        },
        votes: {
            type: Number,
            default: 0
        }
        }
    ],
    createdAT: {
        type: Date,
        default: Date.now()
    },
    owner: {
        type: String,
        required: true
    }
});

var Model = mongoose.model('Polls', PollsSchema);

module.exports = Model;