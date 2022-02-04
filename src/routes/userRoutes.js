const express = require("express");
const app = express();
const bodyParser = require("body-parser")
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {verifySignUp} = require("../middlewares/export")
app.use(cookieParser());
const authJwt = require("../helpers/auth")
const db = require("../modules/mongoose");
const User = db.user;
const Role = db.role;
const DURATION_60D =  60 * 60 * 24 * 60 * 1000;



app.use(function(req,res,next){
  res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});



app.post("/user/signup",verifySignUp.checkDuplicateUserNameOrEmail,verifySignUp.checkRolesExisted,(req,res)=>{
  const user = new User(req.body);
  user.email = req.body.email
    user.password = crypto.createHash("SHA256").update(user.password).digest("hex");
  user.save((err,user)=>{
    if(err){
      res.status(500).send({ message: err });
      return;
    }
    if(req.body.roles){
      Role.find(
        {
          name : {$in : req.body.roles}
        },
        (err,roles)=>{
          if(err){
            res.status(500).send({ message: err });
            return;
          }
          user.roles = roles.map(role => role._id);
          user.save(err =>{
            if(err){
              res.status(500).send({ message: err });
              return;
            }
            console.log(roles);
            res.send({message : "User Registered!"})
          });
        }
      );
    }else{
      Role.findOne({name:"user"},(err,role)=>{
        if(err){
          res.status(500).send({ message: err });
        return;
        }
        user.roles = [role._id];
        user.save(err=>{
          if(err){
            res.status(500).send({ message: err });
            return;
          }
          res.send("User Registered!")
        });
      });
    }
  });
 
})


app.post("/user/login",(req,res,next) =>{
  User.findOne({
    userName : req.body.userName,
  })
  .populate("roles","-__v")
  .exec((err,user)=>{
    if(err){
      res.status(500).send({ message: err });
      return;
    }
    if(!user){
      return res.status(401).send({message : "Username or Password is Incorrect"});
    }
    var passwordIsValid = crypto.createHash("SHA256").update(req.body.password).digest("hex")  == user.password
    if(!passwordIsValid){
      return res.status(401).send({
        accessToken : null,
        message : "Username or Password is Incorrect",

      });
    }
    const token = jwt.sign({id:user._id}, process.env.SECRET);
    res.cookie(process.env.COOKIE_NAME, token, {maxAge : DURATION_60D, secure: true, httpOnly:true, sameSite: 'None'});
    
    var authorities = [];
    for(let i=0; i<user.roles.length; i++){
      authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

    res.status(200).send({
      _id : user._id,
      userName : user.userName,
      email : user.email,
      roles : authorities,
      accessToken : token,
    })
    
  })
})

app.get("/adminPanel",authJwt.verifyToken,authJwt.isAdmin,(req, res) => {
  res.json(req.user)
  res.end()

});

app.get("/user/me",authJwt.verifyToken,authJwt.isAdmin,(req,res)=>{
  res.json(req.user)
})


app.get("/getUser",(req,res)=> {
  User.find((err, docs)=>{
    if(!err){
        res.send(docs)
    }else{
      res.sendStatus(409)
        console.log("not getting info : " + err);
    }

  })
})



app.get('/logOut',(req, res) =>{
  res.clearCookie(process.env.COOKIE_NAME,{path:"/"})
   res.end()

 });


module.exports = app;