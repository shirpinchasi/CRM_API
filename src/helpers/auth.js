const jwt = require("jsonwebtoken");
const db = require("../modules/mongoose");
const User = db.user;
const Role = db.role;


async function verifyToken(req,res,next){
  const token = req.cookies[process.env.COOKIE_NAME];
  if(!token){
    return res.status(403).send({messege : "no token found"})
  }
  try{
    const payload = jwt.verify(token,process.env.SECRET);
    const user = await User.findById(payload.id);
    if(!user){
      return res.status(403).send({messege : "unauthorized"})
      
    }
    req.user = user;
    next();
  }catch(err){
    res.sendStatus(403)
  }
};


async function isAdmin (req,res,next){
 await User.findById(req.user._id).exec((err,user)=>{
    if(err){
      res.status(500).send({ message: err });
      return;
    }
    Role.find(
      {
        _id : {$in: user.roles}
      },
      (err,roles)=>{
        if(err){
          
          res.status(500).send({ message: err });
          return;
        }
        for(let i=0; i< roles.length; i++){
          if(roles[i].name === "admin"){
            
            next();
            return;
          }
        }
        res.status(403).send({sendStatus : 403, message: "Require Admin Role!" });
      }
    )
  })
};


const authJwt = {
  verifyToken,
  isAdmin
};
module.exports = authJwt;