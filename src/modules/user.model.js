const mongoose = require("mongoose");
const { Schema } = mongoose;
const crypto = require("crypto");
var moment = require('moment');
const autoIncrement = require('mongoose-auto-increment');
const Call = require("./call.model");
var connection = mongoose.createConnection(process.env.DB_URL);
autoIncrement.initialize(connection);

const UserSchema = Schema({

    hash: String,
    // password : {
    //     type : String,
    //     required : true,
    // },
    employeeId: {
        type: Number
    },
    userName: {
        type: String,
        required: true,
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    status: {
        type: String,
        default: () => "Active"
    },
    email: {
        type: String
    },
    openingDate: {
        type: String,
        default: () => moment().format("D/MM/YYYY, hh:mm:ss a")
    },
    roles:
            {
                type: Array,
                ref: "Role"
            },
    team:
    {
        type: String,
        ref: "Team"
    },
    Calls:
        [{
            type: Schema.Types.ObjectId,
            ref: "Calls"
        }]
});
UserSchema.plugin(autoIncrement.plugin, {
    model: 'UserSchema',
    field: 'employeeId',
    startAt: 1
});


UserSchema.methods.setPassword = function (password) {

    this.hash = crypto.pbkdf2Sync(password, process.env.SECRET,
        100000, 64, `sha512`).toString(`hex`);
};
UserSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password,
        process.env.SECRET, 100000, 64, `sha512`).toString(`hex`);
    return this.hash === hash;
};

const User = mongoose.model('User', UserSchema);
module.exports = User