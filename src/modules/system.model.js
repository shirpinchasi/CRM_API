const mongoose = require("mongoose");
var connection = mongoose.createConnection(process.env.DB_URL);
var System = new mongoose.Schema({
    systemName: {
        type: String
    },
    systemManager: {
        type: String
    }
});
var System = connection.model("System",System)
module.exports = System