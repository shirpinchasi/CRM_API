const jwt = require("jsonwebtoken");
const config = require("../env/config");
const { cookieName } = require("../env/production");
const db = require("../modules/mongoose");
const User = db.user;
const Role = db.role;


async function verifyToken(req,res,next){
  const token = req.cookies[cookieName];
  if(!token){
    return res.status(403).send({messege : "no token found"})
  }
  try{
    const payload = jwt.verify(token,config.secret);
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

//  verifyToken = (req,res,next) =>{
//   let token = req.headers["cookie"];
//   console.log(req.cookies[cookieName])

//   if(!token){
//     return res.status(403).send({ message: "No token provided!" });
//   }
//   jwt.verify(token.slice([5,]),config.secret,(err,decoded)=>{
//     if(err){
//       return res.status(401).send({ message: "Unauthorized!" });
//     }
//     const user = User.findById(decoded.id);
//     if(!user){
//       res.status(403).send({message : "no user"})
//       return;
//     }
//     req.user = (user._conditions._id)
//     next();
//   })
  
// }
// const isAuth = (req, res, next) => {
//   console.log( req.headers.cookie);
//   const token = req.header(config.cookieName);
//   if (!token) return res.status(401).send("Access denied");

//   try {
//       const verified = verify(token, config.secret);
//       req.user = verified;
//       console.log('Am i admin?', req.user.isAdmin);
//       next();
//   } catch (err) {
//       res.status(400).send("Invalid token");
//   }
// };


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
  // isAuth,
  isAdmin
};
module.exports = authJwt;