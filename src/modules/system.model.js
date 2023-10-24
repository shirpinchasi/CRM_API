const mongoose = require("mongoose");
var connection = mongoose.createConnection(process.env.DB_URL);
const AutoIncrementFactory = require('mongoose-sequence');
var connection = mongoose.createConnection(process.env.DB_URL);
const AutoIncrement = AutoIncrementFactory(connection);


var System = new mongoose.Schema({
    systemId: {
        type: Number,
    },
    systemName: {
        type: String
    },
    systemManager: {
        type: String
    }
});

System.plugin(AutoIncrement, {inc_field: 'systemId'});


var System = connection.model("System",System)
module.exports = System