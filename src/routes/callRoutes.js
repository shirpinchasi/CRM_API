const express = require("express");
const app = express()
const Call = require("../modules/call.model")
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
var url = "mongodb://localhost:27017/";
var MongoClient = require('mongodb').MongoClient;
const mongodb = require('mongodb');


app.get("/getCalls",(req,res)=> {
  Call.find((err, docs)=>{
    if(!err){
        res.send(docs);
    }else{
      res.sendStatus(409)
        console.log("not getting info : " +err);
    }

  })
})
app.post("/addCall", (req, res)=>{
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


app.get('/getCalls/:id', (req, res) => {
  Call.findById(req.params.id).then((call)=>{
    if(!call){
      return res.status(404).send
    }res.send({call});
     }).catch(()=>{
      res.status(404).send()
  })

})


// app.delete('/:id', (req, res) => {
//   MongoClient.connect(url, (err,db) => {
//   if (err) throw err;
//   let dbo = db.db("CRM")
//   dbo.collection('calls').deleteOne({_id: mongodb.ObjectID( req.params.id)}, (err, result) => {
//     if (err) return console.log(err)
//     console.log(req.body)

//   })
//   })
// })
app.put('/updateCall/:id', (req, res) => {
  MongoClient.connect(url, (err,db) => {
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