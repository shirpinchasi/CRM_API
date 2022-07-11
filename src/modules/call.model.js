const mongoose = require("mongoose");
const {Schema} = mongoose;
var moment = require('moment');
require('dotenv').config({ path: '.env' });
const AutoIncrementFactory = require('mongoose-sequence');
var connection = mongoose.createConnection(process.env.DB_URL);
const AutoIncrement = AutoIncrementFactory(connection);

var Calls = Schema({
    _id: {
        type: Number,
    },
    system: {
        type: String,
        required: true,
        ref: "System"
    },
    userName: {
        type: String,
        required: true
    },
    assignee: {
        type: String,
        ref: "User"
    },
    team: {
        type: String,
        ref: "Team"
    },
    User: {
        type: String,
        ref: "User"
    },
    status: {
        type: String,
        default: () => "Open"
    },
    description: {
        type: String,
        required: true
    },
    openingDate: {
        type: String,
        default: () => moment().format("D/MM/YYYY, hh:mm:ss a").toLocaleString("il, ISR")
    },
    lastUpdater: {
        type: String,
        ref: "User"
    },
    picture: {
        data: Buffer,
        contentType: String,
        type: Array,
        uploadDate: Date
        // default: () => moment().format("D/MM/YYYY, hh:mm:ss a")

    },
    link:{
        type:String
    }
});
Calls.plugin(AutoIncrement, {inc_field: '_id'});


// Calls.plugin(autoIncrement.plugin, {
//     model: 'Calls',
//     field: '_id',
//     startAt: 1
// });

var Call = connection.model("Calls", Calls)
module.exports = Call