const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var moment = require('moment');
require('dotenv').config({ path: '.env' });
const AutoIncrementFactory = require('mongoose-sequence');
var connection = mongoose.createConnection(process.env.DB_URL);
const AutoIncrement = AutoIncrementFactory(connection);


const Teams = new Schema({
   
    teamName: {
        type: Object
    },
    teamMembers:
        {
            type: Array,
            ref: "User"
        },
        openingDate: {
        type: String,
        default: () => moment().format("d/MM/YYYY, hh:mm:ss a")
    }
});

Teams.plugin(AutoIncrement, {inc_field: 'id'});

var Team = connection.model("Team", Teams)
module.exports = Team