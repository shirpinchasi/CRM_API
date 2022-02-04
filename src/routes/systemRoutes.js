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

module.exports = app;