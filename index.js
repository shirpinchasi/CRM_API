const express = require("express");
const app=express();
const cookieParser = require('cookie-parser')
const config = require("./src/env/config");
const calls = require("./src/routes/callRoutes");
const users = require("./src/routes/userRoutes");
const systems = require("./src/routes/systemRoutes");
const cors = require("cors");
const port = config.port;
const db = require("./src/modules/mongoose");
const Role = db.role;
app.use(cookieParser());



  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus:200
}));



app.use(users,calls,systems,cors())


app.get("/", (req, res) => {
    res.json({ message: "Welcome to application." });
  });
  

  


function listen() {
    app.listen(port, () => console.log(`server is listaning on port ${port}!`)
    );
}
db.mongoose
    .connect(config.dbUrl,{
        useNewUrlParser: true,
        useUnifiedTopology : true
    })
    .then(()=>{
        console.log("connected to db");
        listen();
        initial();
    })
    .catch(err =>{
        console.error("connection error", err);
        process.exit();
    })

function initial(){
    Role.estimatedDocumentCount((err, count)=>{
        if(!err && count ===0){
            new Role({
                name : "user"
            }).save(err =>{
                if(err){
                    console.log("error", err);
                }
                console.log("added 'user' to roles collection");
            });
            new Role({
                name : "admin"
            }).save(err =>{
                if(err){
                    console.log("error", err);
                }
                console.log("added 'admin' to roles collection");
            })
        }
    })
}
// function connect() {
//     mongoose.connect(config.dbUrl, {
//         useNewUrlParser: true,
//         useUnifiedTopology : true
//     });
//     const db = mongoose.connection;
//     db.on("error", err => console.log(err));
//     db.once("open", listen,console.log("opening db"));
// }
