const mongoose = require("mongoose");



const System = new mongoose.model("System",{
         systemName : { 
             type: String
        },
        systemManager : {
            type : String
        }
});
module.exports =  System