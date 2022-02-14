const express = require("express");
const app = express()
const Call = require("../modules/call.model")
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
var MongoClient = require('mongodb').MongoClient;
const mongodb = require('mongodb');
const authJwt = require("../helpers/auth")

app.get("/getCalls",authJwt.verifyToken,(req,res)=> {
  Call.find((err, docs)=>{
    if(!err){
      console.log(docs);
        res.send(docs);
    }else{
      res.sendStatus(409)
        console.log("not getting info : " +err);
    }

  })
})
app.post("/addCall",authJwt.verifyToken,authJwt.isAdmin, (req, res)=>{
  const newCall = new Call(req.body);
  try{
      const createCall =  newCall.save();
      res.status(201).json(createCall);
  }catch(err){
      if(err.code === 11000){
          res.sendStatus(409);
          return;
      }
      res.sendStatus(500)
  }
})


app.get('/getCalls/:id',authJwt.verifyToken, (req, res) => {
   Call.findById(req.params.id).then((call)=>{
    if(!call){
      return res.status(404).send
    }res.send({call});
     }).catch(()=>{
      res.status(404).send()
  })

})

app.put('/updateCall/:id',authJwt.verifyToken,authJwt.isAdmin, (req, res) => {
  MongoClient.connect(process.env.DB_URL, (err,db) => {
  if (err) 
  {
      throw err;
  }
  let dbo = db.db("CRM")
  dbo.collection('calls').findOneAndUpdate({_id: mongodb.ObjectId(req.params.id)},{$set: {userName: req.body.userName, system : req.body.system}}, (err, result) => {
    if (err) 
    {
      console.log(err)
    }
  })
  })
})


module.exports = app;