const express = require("express");
const app = express();
const config = require("../env/config");
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
    const token = jwt.sign({id:user._id}, config.secret);
    res.cookie(config.cookieName, token, {maxAge : DURATION_60D, secure: true, httpOnly:true, sameSite: 'None'});
    
    var authorities = [];
    for(let i=0; i<user.roles.length; i++){
      authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      // for(let i=0; i<authorities.length; i++){
      //   if(!authorities[i].includes("ADMIN")){
      //     console.log("no admin here");
      //   }
      //   // res.redirect("/adminPanel")
      //   console.log("i have admin");
      // }
      
      // if(authorities)
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
  // res.sendStatus(200).send({message : "Success"})
  res.json(req.user)
  res.end()
  // res.status(200).send(req.user)

});

app.get("/user/me",authJwt.verifyToken,authJwt.isAdmin,(req,res)=>{
  res.json(req.user)
})


app.get("/getUser",(req,res)=> {
  User.find((err, docs)=>{

    // docs.map((doc)=>{
    //   console.log(doc.userName)
    // })
    if(!err){
        res.send(docs)
    }else{
      res.sendStatus(409)
        console.log("not getting info : " + err);
    }

  })
})

// app.get("/logout", (req, res) => {
//   console.log('Page requested!');
//   console.log('Cookies: ', req.headers); // For some reason this returns undefined
// });


app.get('/logOut',(req, res) =>{
  res.clearCookie(config.cookieName,{path:"/"})
   res.end()
//   res.cookie(config.cookieName, "none",{
//     expires: new Date(Date.now() +5 *1000),
//     httpOnly:true,
//   })
//   res.status(200)
//   .json({success : true, message :"logged out successfully"})
 });
// app.get("/protected", auth,(req,res)=>{
//   return res.json({user: {id: req._id,role: req.role}})
// })
// app.post("/user/login", (req, res, next)=>{
//   const {body} = req;
//   const {userName} = body;
//   const {password} = body;
//   console.log(userName);
  
//   if(userName === Users.userName && password === Users.password){
//       jwt.sign({Users}, "private", {expiresIn : "1h"},(err, token)=>{
//           if(err) {console.log(err)}
//           res.send(token);
//       });
//   }else{
//       console.log("ERROR : Could not log in");
//   }
// })



// app.delete('//:id', (req, res) => {
//   MongoClient.connect(url, (err,db) => {
//   if (err) throw err;
//   let dbo = db.db("CRM")
//   dbo.collection('calls').deleteOne({_id: mongodb.ObjectID( req.params.id)}, (err, result) => {
//     if (err) return console.log(err)
//     console.log(req.body)
    
//   })
//   })
// })
// app.put('/updateCall/:id', (req, res) => {
//   MongoClient.connect(url, (err,db) => {
//   if (err) 
//   {
//       throw err;
//   }
//   let dbo = db.db("CRM")

//   console.log(req.body);
//   console.log(req.body.serverName);
//   dbo.collection('calls').findOneAndUpdate({_id: mongodb.ObjectID(req.params.id)}, (err, result) => {
//     if (err) 
//     {
//       console.log(err)
//     }
//   })
//   })
// })










module.exports = app;