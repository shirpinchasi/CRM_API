const mongoose = require("mongoose");

const User = new mongoose.model("User", {
    role: {
        type: String,
    },
    password : {
        type : String,
        required : true,
    },
    employeeId: {
        type: Number
    },
    userName: {
        type: String,
        required : true,
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    status: {
        type: String
    },
    email :{
        type:String
    },
    openingDate: {
        type: Date,
        default: () => new Date()
    },
    roles : [
        {
            type : String,
            ref : "Role"
        }
    ]
});

module.exports = User