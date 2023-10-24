const express = require("express");
const app = express()
const db = require("../modules/mongoose")
const System = db.system
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
const authJwt = require("../helpers/auth")



app.get("/system", authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  System.find((err, docs) => {
    if (!err) {
      res.send(docs);

    } else {
      res.send({ status: 404, message: "Error in finding system" })
    }

  })
})


app.post("/addSystem", authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  const newSystem = new System(req.body);
  System.findOne({systemName: req.body.systemName}).exec((err, system) => {
      // if (!req.body.systemName) {
      //   res.status(406).send({ message: "system name Required!" });
      //   return;
      // }
      if (system) {
        res.status(409).send({status:409, message: "Failed! System Name already exist!" });
        return;
      }
      try {
        const createSystem = newSystem.save();
        res.status(201).send({status:201,system:createSystem});
      } catch (err) {
        if (err.code === 11000) {
          res.sendStatus(409);
          return;
        }
        res.sendStatus(500).send({ message: "Error in adding system" })
      }

  })
})

module.exports = app;