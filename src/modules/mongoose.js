const mongoose = require("mongoose");


const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.call = require("./call.model")
db.system = require("./system.model")
db.team = require("./team.model")


db.ROLES = ["user", "admin"]

module.exports = db;