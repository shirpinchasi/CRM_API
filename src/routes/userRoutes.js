const express = require("express");
const app = express();
const bodyParser = require("body-parser")
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken")
const { verifySignUp } = require("../middlewares/export")
app.use(cookieParser());
const authJwt = require("../helpers/auth")
const db = require("../modules/mongoose");
const User = db.user;
const Role = db.role;
const Call = db.call;
const Token = db.token;
var MongoClient = require('mongodb').MongoClient;
const crypto = require("crypto")
const DURATION_60D = 60 * 60 * 24 * 60 * 1000;
require('dotenv').config({ path: '.env' });
const cors = require("cors");
const hbs = require("nodemailer-express-handlebars")
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt")
var validator = require('validator');
const path = require("path");


app.use(cors({
  origin: true,
  credentials: true
}));


app.use(function (req, res, next) {
  res.setHeader(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept',
    'Access-Control-Allow-Origin', 'true'
  );
  next();
});

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


app.post("/user/signup", verifySignUp.checkDuplicateUserNameOrEmail, verifySignUp.checkRolesExisted, (req, res) => {
  const user = new User(req.body);
  user.email = req.body.email
  user.setPassword(req.body.password);

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: "You Need To Provide User Name!" });
      return;
    }
    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }
          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: "error creating role" });
              return;
            }
            res.status(201).send({ message: "User Registered!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err + "error finding role" });
          return;
        }
        user.roles = [role._id];

        user.save(err => {
          if (err) {
            res.status(500).send({ message: "error saving user" });
            return;
          }
          return res.status(201).send({ redirectUrl: "/Login", message: "User Registered!" });
        });
      });
    }
  });

})


app.post("/user/login", (req, res, next) => {
  User.findOne({
    userName: req.body.userName,
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      if (user === null) {
        return res.status(400).send({ message: "Username or Password is Incorrect" });
      } else {
        if (user.validPassword(req.body.password) === false) {
          return res.status(400).send({
            message: "Username or Password is Incorrect",
          })
        }
      }
      const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: DURATION_60D });
      res.cookie(process.env.COOKIE_NAME, token, { maxAge: DURATION_60D, secure: true, httpOnly: true, sameSite: 'none' });
      var authorities = [];
      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      if (user.status === "Not Active") {
        res.status(401).send({ message: "your account has been disabled" })
      } else if (authorities.includes("ROLE_ADMIN")) {
        return res.status(200).send({
          userName: user.userName,
          user: token,
          redirectUrl: "/adminPanel"
        })
      } else {
        return res.status(200).send({
          userName: user.userName,
          user: token,
          redirectUrl: "/"
        })
      }
    })
})


app.post('/ForgetPasswordEmail', (req, res) => {
  User.findOne({ userName: req.body.userName }).then((user) => {
    if (!user) {
      return res.status(404).send({ message: "User not found" })
    } res.send({ user });
  }).catch(() => {
    res.status(500).send({ message: "error" })
  })
  const handleOptions = {
    viewEngine: {
      layoutsDir: path.resolve("./views/"),
      defaultLayout: false,
      partialDir: path.resolve("./views/forget/"),
    },
    viewPath: path.resolve("./views/forget")
  };
  transport.use("compile", hbs(handleOptions))
  MongoClient.connect(process.env.DB_URL, (err, db) => {
    if (err) {
      throw err
    }
    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = crypto.pbkdf2Sync(resetToken, process.env.SECRET,
      10, 64, `sha512`).toString(`hex`)
    let dbo = db.db("CRM")
    dbo.collection("users").findOne({ email: req.body.email }).then((user) => {
      const newToken = new Token({
        userId: user.employeeId,
        token: hash,
        createdAt: Date.now()
      })
      newToken.save();

      var mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: req.body.email,
        subject: 'Forget Password Email',
        template: 'forget',
        context: {
          userName: user.userName,
          link: process.env.BASE_URL + `/ForgetPassword/${user.employeeId}/${hash}`
        }
      }
      transport.sendMail(mailOptions, function (err, info) {
        if (err) {
          res.sendStatus(500).send({ message: "Error in sending email" })
        } else {
          res.sendStatus(200).send({ message: "Email send successfully! please check your inbox!" })
        }
      });
    })
  })

})
app.get('/ForgetPassword/:userId/:token', (req, res) => {
  Token.findOne({ token: req.params.token }).then((token) => {
    if (!token) {
      return res.status(404).send({ err: "Sorry, Page Not Found" })
    }
    return res.status(200).send({ message: "ok" })
  })
})


app.post('/ForgetPassword/:userId/:token', async (req, res) => {

  const tokenFromDb = await Token.findOne({
    userId: req.params.userId,
    token: req.params.token
  })
  if (!tokenFromDb) return res.status(400).send({ message: "invald token or expired" })

  const handleOptions = {
    viewEngine: {
      layoutsDir: path.resolve("./views/"),
      defaultLayout: false,
      partialDir: path.resolve("./views/"),
    },
    viewPath: path.resolve("./views/")
  };
  transport.use("compile", hbs(handleOptions))


  User.findOne({ employeeId: req.params.userId }).then((user) => {
    const newPassword = crypto.pbkdf2Sync(req.body.password, process.env.SECRET,
      100000, 64, `sha512`).toString(`hex`);
    const validateNewPassword = crypto.pbkdf2Sync(req.body.passwordConfirmation,
      process.env.SECRET, 100000, 64, `sha512`).toString(`hex`);
    if (newPassword !== validateNewPassword) {
      return res.status(400).send({ message: "passwords does not match" })
    } else {
      MongoClient.connect(process.env.DB_URL, (err, db) => {
        if (err) {
          throw err;
        }
        let dbo = db.db("CRM")
        dbo.collection('users').findOneAndUpdate({ employeeId: user.employeeId }, { $set: { hash: newPassword } }, (err, result) => {
          if (err) {
            res.status(500).send({ message: "Error in changing password" })
          }
        })
      })
      var mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: user.email,
        subject: 'Password Reset Successfully',
        template: 'ResetSuccess',
        context: {
          userName: user.userName,
        }
      }
      transport.sendMail(mailOptions, function (err, info) {
        if (err) {
          res.sendStatus(500).send({ message: "Error in sending email" })
        } else {
          
          res.sendStatus(200).send({ message: "Email send successfully! please check your inbox!" })
        }
      });
    }

  })

})


app.get('/getUser/:employeeId', authJwt.verifyToken, (req, res) => {
  User.findOne({ employeeId: req.params.employeeId }).then((user) => {
    if (!user) {
      return res.status(404).send({ message: "user not found " })
    } res.send({ user });
  }).catch(() => {
    res.status(500).send({ message: "error" })
  })

})
app.get("/adminPanel", authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  res.send({ data: req.user })
  res.end();
});

app.get("/user/me", authJwt.verifyToken, (req, res) => {
  Role.findById({ _id: req.user.roles }).then((role) => {
    if (role.name === "admin") {
      res.status(200).send({ valid: "admin", user: req.user })
    } else if (role.name === "user") {
      res.status(200).send({ valid: "user", user: req.user })
    }
  })
})


app.get("/getUser", authJwt.verifyToken, authJwt.isAdmin, (req, res) => {
  User.find((err, docs) => {

    if (!err) {
      res.send(docs)

    } else {
      res.sendStatus(404)
      console.log("not getting info : " + err);
    }

  })
})



app.get('/logOut', authJwt.verifyToken, (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME, { sameSite: "none", secure: true })
  res.send({ message: 'cookie cleared', redirectUrl: "/Login" });
});

app.get("/getCallsPerUser/:id", (req, res) => {
  User.findOne({ employeeId: req.params.id }).then((user) => {
    if (!user) {
      return res.status(404).send({ message: "user not found " })
    }
    var arr = []
    for (let i = 0; i < user.calls.length; i++) {
      // const element = user.calls[i].id;
      var obj = {}
      obj = user.calls[i].id;
      arr.push(obj)
    } Call.find({ _id: arr }).then((call) => {
      if (call) {
        return res.send(call)
      }

    })
  }).catch((err) => {
    res.status(500).send({ message: "error" + err })
  })

})


module.exports = app;