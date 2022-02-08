const express = require("express");
const app=express();
const cookieParser = require('cookie-parser')
const calls = require("./src/routes/callRoutes");
const users = require("./src/routes/userRoutes");
const systems = require("./src/routes/systemRoutes");
const cors = require("cors");
const db = require("./src/modules/mongoose");
const Role = db.role;
app.use(cookieParser());


  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true
}));


app.use(users,calls,systems,cors())


app.get("/", (req, res) => {
    res.json({ message: "Welcome to application." });
  });
  
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
  


function listen() {
    app.listen(process.env.PORT, () => console.log(`server is listaning on port ${process.env.PORT}!`)
    );
}
db.mongoose
    .connect(process.env.DB_URL,{
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

