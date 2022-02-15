const db = require("../modules/mongoose");
const ROLES = db.ROLES;
const User = db.user;

checkDuplicateUserNameOrEmail = (req,res,next)=>{
    User.findOne({
        userName : req.body.userName
    }).exec((err,user)=>{
        if(!req.body.userName){
            res.status(500).send({ message: "UserName Is Required!" });
            return;
        }
        if(user){
            res.status(400).send({ message: "Failed! Username is already in use!" });
            
            return;
        }

        User.findOne({
            email : req.body.email
        }).exec((err,email)=>{
            if(!req.body.email){
                res.status(500).send({ message: "You Need To Provide Email!" });
                return;
            }
            if(email){
                res.status(400).send({ message: "Failed! Email is already in use!" });
                return;  
            }
            next();
        });
    });
};


checkRolesExisted = (req,res,next) =>{
    if(req.body.roles){
        for(let i=0; i<req.body.roles.length; i++){
            if(!ROLES.includes(req.body.roles[i])){
                res.status(400).send({
                    message : `Failed! Role ${req.body.roles[i]} does not exist!`
                });
                return;
            }
        }
    }
    next();
}

const verifySignUp ={
    checkDuplicateUserNameOrEmail,
    checkRolesExisted
};
module.exports = verifySignUp;