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



const storage = multer.diskStorage({
  destination: (req, file, cb)=> {
    cb(null, "public/Pictures")
  },
});

const upload = multer({ storage: storage })


app.get("/getCalls", authJwt.verifyToken, (req, res) => {
  Call.find((err, docs) => {
    if (!err) {
      res.send(docs);
    } else {
      res.sendStatus(409)
      console.log("not getting info : " + err);
    }

  })
})
app.post("/addCall",authJwt.verifyToken,authJwt.isAdmin,(req, res) => {
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
})


app.get('/getCalls/:id',  (req, res) => {
  Call.findById(req.params.id).then((call) => {
    if (!call) {
      return res.status(404).send
    } res.send({ call });
  }).catch(() => {
    res.status(404).send()
  })
  
})

app.put('/uploadPicture/:id', upload.single("File"), (req, res,next) => {
  var img = fs.readFileSync(req.file.path);
  var encode_image = img.toString('base64');
  var finalImg = {
    contentType: req.file.mimetype,
    image: Buffer.from(encode_image, 'base64'),
    fileName : req.file.originalname,
    uploadDate : moment().format("d/MM/YYYY, hh:mm:ss a")
  };
  console.log(finalImg);
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('calls').findOneAndUpdate({_id: mongodb.ObjectId(req.params.id) }, { $set: { picture: finalImg} },(err, result) => {
      if (err) {
        console.log(err +"this is error")
      }
      console.log(result);
      res.status(200).send({status:"200",message:"uploded file"})
    })
  })
})

// app.post('/upload/photo', upload.single('picture'), (req, res) => {
//   console.log(req.file);
//   var img = fs.readFileSync(req.file.path);
//   var encode_image = img.toString('base64');
//   // Define a JSONobject for the image attributes for saving to database

//   var finalImg = {
//     contentType: req.file.mimetype,
//     image: new Buffer(encode_image, 'base64')
//   };
//   MongoClient.connect(process.env.DB_URL, (err, db) => {
//     let dbo = db.db("CRM")
//     dbo.collection('calls').insertOne(finalImg, (err, result) => {

//       console.log(result)

//       if (err) return console.log(err)

//       console.log('saved to database')
//       res.redirect('/calls')
//     })
//   })

// })




app.put('/updateCall/:id', authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('calls').findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: { userName: req.body.userName, system: req.body.system } }, (err, result) => {
      if (err) {
        console.log(err)
      }
    })
  })
})


module.exports = app;