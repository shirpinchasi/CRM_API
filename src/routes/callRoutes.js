const express = require("express");
const app = express();
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
const nodemailer = require('nodemailer');
const db = require("../modules/mongoose");
const User = db.user
const Call = db.call
const hbs = require("nodemailer-express-handlebars")
const path = require("path")
require('dotenv').config({ path: '.env' });
const crypto = require("crypto");
const { forEach } = require("async");
var maxSize = 10000000;
var whiteList=[
  ".png",
  ".jpg",
  ".jpeg",
  ".jfif",
  '.csv',
  '.plain',
]


let transport = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  secureConnection: false,
  port: 587,
  tls: {
    ciphers: "SSLv3"
  },
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});
// transport.verify(function (error, success) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Server is ready to take our messages");
//   }
// });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/Pictures")
  },
});

const upload = multer({ storage: storage,limits:{fileSize:maxSize}})

app.get("/getCalls", authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  Call.find((err, docs) => {
    if (!err) {
      res.send(docs);
    } else {
      res.sendStatus(404).send({message:"call not found"})
    }

  })
})
app.post("/addCall",authJwt.verifyToken, authJwt.isAdmin,  (req, res) => {
  const newCall = new Call(req.body);
  try {
    const createCall = newCall.save();
    res.status(201).json(createCall);
  } catch (err) {
    if (err.code === 11000) {
      res.sendStatus(409);
      return;
    }
    res.sendStatus(500).send({message:"Error in adding new call"})
  }

  const handleOptions = {
    viewEngine: {
      layoutsDir: path.resolve("./views/"),
      partialDir: path.resolve("./views/"),
      defaulLayout: "main",
    },
    viewPath: path.resolve("./views/")
  };

  transport.use("compile", hbs(handleOptions))

  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err
    }
    let dbo = db.db("CRM")
    dbo.collection("users").findOneAndUpdate({userName: req.body.userName
    },{ 
        $addToSet: {calls :{id: newCall._id}}
      })
    User.findOne({userName: req.body.userName}).then((user)=>{
    dbo.collection("calls").findOne({ _id: newCall._id }).then((call) => {
      var mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: user.email,
        subject: 'Open Call Number ' + call._id,
        template: "main",
        context: {
          userName: req.body.userName,
          CallId: call.CallId,
          description: call.description,
          system: call.system,
          assignee: call.assignee,
          team : call.team,
          link: process.env.BASE_URL+`/callInfo/${call._id}`
        }
      }
      transport.sendMail(mailOptions, function (err, info) {
        if (err) {
          res.status(500).send({ message: "Error in sending email" })
        } else {
          res.status(200).send({ message: "Success in sending email" })
        }
      });
    })
  })
})
})

app.post('/openCall/:id',authJwt.verifyToken, authJwt.isAdmin,(req,res)=>{
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('calls').findOneAndUpdate({ _id: Number(req.params.id) }, { $set: { status: "Open",lastUpdater: req.user.userName } }, (err, result) => {
      if (err) {
        res.status(500).send({ message: "Error in Opening call" })
      }
      res.status(200).send({ status: "200", message: "opened call successfully" })
    })
  })
})


app.post('/closeCall/:id',authJwt.verifyToken, authJwt.isAdmin,(req,res)=>{

  const handleOptions = {
    viewEngine: {
      layoutsDir: path.resolve("./views/"),
      defaultLayout: false,
      partialDir: path.resolve("./views/"),
    },
    viewPath: path.resolve("./views/")
  };
  transport.use("compile", hbs(handleOptions))

  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('calls').findOneAndUpdate({ _id: Number(req.params.id) }, { $set: {lastUpdater: req.user.userName, status: "Closed",closingDate: moment().format("D/MM/YYYY, hh:mm:ss a").toLocaleString("he-IL") }},{returnDocument:'after'}, (err, result) => {
      if (err) {
        res.status(500).send({ message: "Error in Closing Call" })
      }else{
      res.status(200).send({ status: "200", message: "Closed Call successfully" })
      }
        User.findOne({userName :result.value.userName}).then((user)=>{
          var mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: `Call number ${result.value._id} has been closed`, 
            template: "closeCall",
            context: {
              userName: result.value.userName,
              status : result.value.status,
              CallId:result.value._id,
              description: result.value.description,
              system: result.value.system,
              assignee: result.value.assignee,
              team : result.value.team,
              closingDate: result.value.closingDate
            }
          }
          transport.sendMail(mailOptions, function (err, info) {
            if (err) {
              res.sendStatus(500).send({ message: "Error in sending email" })
            } else {
              res.sendStatus(200).send({ message: "Success in sending email" })
            }
          });
        })
    })
  })
})


app.put('/assignAssignee/:id/:assigneeId',authJwt.verifyToken, authJwt.isAdmin,(req,res)=>{
  User.findOne({employeeId : req.params.assigneeId}).then((user)=>{
    MongoClient.connect(process.env.DB_URL, (err, db) => {
      if (err) {
        throw err;
      }
      let dbo = db.db("CRM")
      dbo.collection('calls').findOneAndUpdate({ _id:Number(req.params.id)}, { $set: { assignee:user.userName, status:"In Progress"} }, (err, result) => {
        if (err) {
          res.status(500).send({ message: "Error in setting assignee" })
        }
        res.status(200).send({ message: "success in setting assignee" })
      })
    })
  })
})


app.get('/getCalls/:id', authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  Call.findOne({ _id: req.params.id }).then((call) => {
    if (!call) {
      return res.status(404).send({ message: "call not found" })
    } res.send({ call });
  }).catch(() => {
    res.status(500).send({ message: "error in finding call id" })
  })

})

var uploadFile = upload.single("File")
app.put('/uploadFile/:id',authJwt.verifyToken, authJwt.isAdmin,  (req, res, next) => {
  uploadFile(req,res,function(err){
    if(err instanceof multer.MulterError){
      res.status(500).send({message:"File size exedded!"})
    }else{
      var img = fs.readFileSync(req.file.path);
  var encode_image = img.toString('base64');
  var finalImg = {
    itemId: crypto.randomBytes(2).toString("hex"),
    contentType: req.file.mimetype,
    image: Buffer.from(encode_image, 'base64'),
    fileName: req.file.originalname,
    uploadDate: moment().format("D/MM/YYYY, hh:mm:ss a")
  };

  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('calls').findOneAndUpdate({ _id: Number(req.params.id) }, { $addToSet: { picture: finalImg } }, (err, result) => {
      if (err) {
        res.status(500).send({ message: "Error in uploading file" })
      }
      res.status(200).send({ status: "200", message: "uploded file successfully" })
    })
  })
    }
  })
  

})

app.delete("/deleteFile/:id/:itemId",authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('calls').updateOne({ _id: Number(req.params.id) }, { $pull: { picture: { itemId: req.params.itemId } } }, (err, success) => {
      if (err) {
        res.status(500).send({ message: "Error in deleting file" })

      }
      res.status(200).send({status:200, message: "deleted file successfully" })

    })

  })
})


app.put('/updateCall/:id', authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    
    dbo.collection('calls').findOneAndUpdate({ _id: Number(req.params.id) }, { $set: { userName: req.body.userName, system: req.body.system, status: req.body.status,assignee:req.body.assignee , team:req.body.team, description: req.body.description, lastUpdater: req.user.userName } }, (err, result) => {
      if (err) {
        res.status(500).send({ message: "Error in updating call" })
      }
      res.status(200).send({ message: "success in updating call" })
    })
  })
})


module.exports = app;