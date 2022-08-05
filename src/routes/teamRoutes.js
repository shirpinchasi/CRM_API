const express = require("express");
const app = express()
const Team = require("../modules/team.model")
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
var MongoClient = require('mongodb').MongoClient;
const mongodb = require('mongodb');
const authJwt = require("../helpers/auth")

app.get("/getTeams", (req, res) => {
  Team.find((err, docs) => {
    if (!err) {
      res.send(docs);
      // console.log(docs);
    } else {
      res.sendStatus(404).send({ message: "Teams not found" })
    }

  })
})

// app.get("/teamMembers/",(req,res)=>{
//   Team.find((err,docs) => {
//     console.log();
//     if(!err){
      
//       // Call.find({_id: arr}).then((call)=>{
//       //   console.log(call);
//       //   if(call){
//       //     return res.send(call)
//       //   }
       
//       // })

//   }
//   })
// })
  

  
app.post("/addTeam", (req, res) => {
  const newTeam = new Team(req.body);
  try {
    const createTeam = newTeam.save();
    res.status(201).json(createTeam);
  } catch (err) {
    if (err.code === 11000) {
      res.sendStatus(409);
      return;
    }
    res.sendStatus(500).send({ message: "Error in adding team" })
  }
})


app.get('/getTeam/:id', authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  Team.findById(req.params.id).then((team) => {
    if (!team) {
      return res.status(404).send({ message: "Team not found" })
    } res.send({ team });
  }).catch(() => {
    res.status(500).send({ message: "Error getting Team" })
  })

})

app.put('/updateTeam/:id', authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err;
    }
    let dbo = db.db("CRM")
    dbo.collection('teams').findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: { userName: req.body.userName, teamName: req.body.teamName } }, (err, result) => {
      if (err) {
        res.status(500).send({ message: "Error updating team" })

      }
    })
  })
})


module.exports = app;