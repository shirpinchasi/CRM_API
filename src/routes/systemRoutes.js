const express = require("express");
const app = express()
const System = require("../modules/system.model")
app.use(express.urlencoded({ extended: false }));
app.use(express.json())




app.get("/system",(req,res)=> {
  System.find((err, docs)=>{
    if(!err){
        res.send(docs);
    }else{
      res.sendStatus(409)
        console.log("not getting info : " +err);
    }

  })
})


app.post("/addSystem", (req, res)=>{
  const newSystem = new System(req.body);
  try{
      const createSystem =  newSystem.save();
      res.status(201).json(createSystem);
  }catch(err){
      if(err.code === 11000){
          res.sendStatus(409);
          return;
      }
      res.sendStatus(500)
  }
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