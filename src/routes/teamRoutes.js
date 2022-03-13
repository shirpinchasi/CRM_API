const express = require("express");
const app = express()
const Team = require("../modules/team.model")
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
var MongoClient = require('mongodb').MongoClient;
const mongodb = require('mongodb');
const authJwt = require("../helpers/auth")

app.get("/getTeams", authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  Team.find((err, docs) => {
    if (!err) {
      res.send(docs);
    } else {
      res.sendStatus(409)
      console.log("not getting info : " + err);
    }

  })
})
app.post("/addTeam",  (req, res) => {
  const newTeam = new Team(req.body);
  try {
    const createTeam = newTeam.save();
    res.status(201).json(createTeam);
  } catch (err) {
    if (err.code === 11000) {
      res.sendStatus(409);
      return;
    }
    res.sendStatus(500)
  }
})


app.get('/getTeam/:id', authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  Team.findById(req.params.id).then((team) => {
    if (!team) {
      return res.status(404).send
    } res.send({ team });
  }).catch(() => {
    res.status(404).send()
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
        console.log(err)
      }
    })
  })
})


module.exports = app;