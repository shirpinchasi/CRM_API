const mongoose = require("mongoose");
const crypto = require("crypto");

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