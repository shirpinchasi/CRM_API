const jwt = require("jsonwebtoken");
const db = require("../modules/mongoose");
const User = db.user;
const Role = db.role;
const Team = db.team
const express = require("express");
const app = express();

async function verifyToken(req, res, next) {
  const token = req.cookies[process.env.COOKIE_NAME];
  if (!token) {
    return res.status(403).send({ messege: "no token found" })
  }
  try {
    const payload = jwt.verify(token, process.env.SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).send({ messege: "unauthorized" })

    }
    req.user = user;
    next();
  } catch (err) {
    res.sendStatus(500)
  }
};

function isAdmin(req, res, next) {
  User.findById(req.user._id).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    Role.find(
      {
        _id: { $in: user.roles }
      },
      (err, roles) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "admin") {
            next();
            return;
          }

        }

      }

    )
  })
};

// function isITTeam(req, res, next) {
//   User.findById(req.user._id).exec((err, user) => {
//     if (err) {
//       res.status(500).send({ message: err });
//       return;
//     }
//     for (let i = 0; i < user.team.length; i++) {
//       const teamNames = user.team[i];
//     Team.find({teamName:teamNames.teamName},
//       (err, team) => {
//         if (err) {
//           res.status(500).send({ message: err });
//           return;
//         }
//         for (let i = 0; i < team.length; i++) {
//           for (let j = 0; j < team.teamMembers.length; j++) {
//             const element = team.teamMembers[j];
//             console.log(element);
            
//           }
//           if (team[i].teamMembers.includes(user.employeeId)) {
//                 // console.log(user.employeeId);
//             // next();
//             // return;
//           }

//         }

//       }

//     )
//   }
//   })
// };

const authJwt = {
  verifyToken,
  isAdmin,
  // isITTeam
};
module.exports = authJwt;