const express = require("express");
const app = express();
const Call = require("../modules/call.model")
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
var MongoClient = require('mongodb').MongoClient;
const mongodb = require('mongodb');
const authJwt = require("../helpers/auth");
const multer = require("multer");
const fs = require('fs');
var moment = require('moment');
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var nodemailer = require('nodemailer');
const db = require("../modules/mongoose");
const User = db.user
const hbs = require("nodemailer-express-handlebars")
const path = require("path")
require('dotenv').config({ path: '.env' });

let transport = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  secureConnection : false,
  port: 587,
  tls:{
    ciphers:"SSLv3"
  },
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/Pictures")
  },
});

const upload = multer({ storage: storage })


app.get("/getCalls", authJwt.verifyToken,authJwt.isAdmin, (req, res) => {
  Call.find((err, docs) => {
    if (!err) {
      res.send(docs);
    } else {
      res.sendStatus(404)
      console.log("not getting info : " + err);
    }

  })
})
app.post("/addCall",authJwt.verifyToken, (req, res) => {
  const newCall = new Call(req.body);
  try {
    const createCall = newCall.save();
    res.status(201).json(createCall);
  } catch (err) {
    if (err.code === 11000) {
      res.sendStatus(409);
      return;
    }
    res.sendStatus(500)
  }
// User.findOne({ userName: req.user.userName }, function(error, user) {
//   if (error) {
//     return handleError(error);
//   }
//   user.Calls = author;
//   console.log(user.author._id); // prints "Ian Fleming"
// });

// Call.find().populate("User").exec((err,res)=>{
//   console.log(res + " This is the populate");

// })

const handleOptions = {
  viewEngine :{
    layoutsDir: path.resolve("./views/"),
    partialDir : path.resolve("./views/"),
    defaulLayout :"main",
  },
  viewPath : path.resolve("./views/")
};
console.log(handleOptions);

transport.use("compile",hbs(handleOptions))


MongoClient.connect(process.env.DB_URL,(err,db)=>{
  if(err){
    throw err
  }
  let dbo = db.db("CRM")
  dbo.collection("users").findOneAndUpdate({
    userName : req.user.userName
  },{
    $push:{
      "calls" : {$each : [newCall._id]}
    }
  })
  dbo.collection("calls").findOne({_id : newCall._id}).then((call)=>{
 var mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: req.user.email, 
        subject: 'Open Call Number ' + call.CallId , // Subject line
        template : "main",
        context : {
          userName : req.user.userName,
          CallId : call.CallId,
          description: call.description,
          system : call.system,
          assignee : call.assignee,
          link : `/getCalls/${call.CallId}`
        }
        // text: 'Hello world ', // plaintext body
        // html: '<b>Hello world </b><br> This is the first email sent with Nodemailer in Node.js' // html body
      }
      transport.sendMail(mailOptions, function(err, info) {
        if (err) {
          console.log(err)
        } else {
          console.log(info);
        }
      });
    console.log(call);
  })
})
})


app.get('/getCalls/:CallId', authJwt.verifyToken, (req, res) => {
  Call.findOne({CallId : req.params.CallId}).then((call) => {
    if (!call) {
      return res.status(404).send({message:"not found"})
    } res.send({ call });
  }).catch(() => {
    res.status(404).send({message:"not found"})
  })

})
app.put('/uploadPicture/:id', upload.single("File"), authJwt.verifyToken, (req, res, next) => {
  var img = fs.readFileSync(req.file.path);
  var encode_image = img.toString('base64');
  var finalImg = {
    contentType: req.file.mimetype,
    image: Buffer.from(encode_image, 'base64'),
    fileName: req.file.originalname,
    uploadDate: moment().format("d/MM/YYYY, hh:mm:ss a")
  };
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('calls').findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: { picture: finalImg } }, (err, result) => {
      if (err) {
        res.status(500).send({message : "this is error"})
        console.log(err + "this is error")
      }
      res.status(200).send({ status: "200", message: "uploded file" })
    })
  })
})





app.put('/updateCall/:id', authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('calls').findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: { userName: req.body.userName, system: req.body.system } }, (err, result) => {
      if (err) {
        res.status(500).send({message : "this is error"})
        console.log(err)
      }
    })
  })
})


module.exports = app;