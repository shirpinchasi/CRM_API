const mongoose = require("mongoose");
const crypto = require("crypto");
var moment = require('moment');
const autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection(process.env.DB_URL);
autoIncrement.initialize(connection);



const UserSchema =  mongoose.Schema({
    role: {
        type: String,
    },
    hash : String,
    // password : {
    //     type : String,
    //     required : true,
    // },
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
        type: String,
        default:() => "Active"
    },
    email :{
        type:String
    },
    openingDate: {
        type: String,
        default: () => moment().format("d/MM/YYYY, hh:mm:ss a")
    },
    roles : [
        {
            type : String,
            ref : "Role"
        }
    ],
    team : [
        {
            type:String,
            ref : "Team"
        }
    ]
});
UserSchema.plugin(autoIncrement.plugin, {
    model: 'UserSchema',
    field: 'employeeId',
    startAt : 1
});


UserSchema.methods.setPassword = function(password) { 
    
       this.hash = crypto.pbkdf2Sync(password, process.env.SECRET,  
       100000, 64, `sha512`).toString(`hex`); 
   }; 
   UserSchema.methods.validPassword = function(password) { 
       var hash = crypto.pbkdf2Sync(password,  
        process.env.SECRET, 100000, 64, `sha512`).toString(`hex`); 
       return this.hash === hash; 
   }; 

const User = module.exports = mongoose.model('User', UserSchema); 