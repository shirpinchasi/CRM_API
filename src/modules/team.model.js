const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var moment = require('moment');
require('dotenv').config({ path: '.env' });
const autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection(process.env.DB_URL);
 
autoIncrement.initialize(connection);

var Teams = new Schema({
    _id : {
        type : Number,
    },
    teamName: {
        type: String
    },
    openingDate: {
        type: String,
        default: () => moment().format("d/MM/YYYY, hh:mm:ss a")
    }
});

Teams.plugin(autoIncrement.plugin, {
    model: 'Teams',
    field: '_id',
    startAt : 1
});
var Team = connection.model("Team", Teams)
module.exports = Team