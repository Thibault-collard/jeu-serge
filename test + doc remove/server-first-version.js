"use strict";

const express = require("express");
const expressSession = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const MongoClient = require("mongodb").MongoClient;
const uuidv1 = require("uuid/v1"); // executer uuidv1() pour avoir un uuid
const connectMongo = require("connect-mongo");
const app = express();

app.set("view engine", "pug");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(__dirname + "/src"));
app.use("/images", express.static(__dirname + "/src/images"));
app.use(cookieParser());

const MongoStore = connectMongo(expressSession)

//variables pour la date d'expiration des cookies et pour la durée de la session
var cookieExpiration = 60 * 60 * 1000; // 1 hour
console.log(cookieExpiration);
var sessionlife = 60 * 60 * 1000;

const options = {
    store: new MongoStore({
        url: "mongodb://localhost:27017/jeu_mj"
    }),
    secret: "1234Secret",
    saveUninitialized: true,
    resave: false,
    expires: new Date(Date.now() + cookieExpiration),
    rolling: true, // reset maxAge on every response
    cookie: {
        maxAge: sessionlife,
        expires: new Date(Date.now() + sessionlife)
    },
}


var questions;

MongoClient.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, function (err, client) {
    console.log("MONGOCLIENT")
    if (err) {
        console.log("Cannot connect to database");
    } else {
        let db = client.db("jeu_mj");
        let collection = db.collection("questions");
        collection.find().toArray(function (err, data) {
            if (err) {
                console.log("impossible d'acceder a la collection")
            } else {
                questions = data
            }
        });
    } 
}); 

var user;

MongoClient.connect("mongodb://localhost:27017",{useUnifiedTopology:true}, function(err, client){
    if(err){
        console.log("error");
    }else{
        let db = client.db("jeu_mj");
        let collection = db.collection("utilisateurs");
        collection.find({},{projection:{uuid:1, pseudo:1}}).toArray(function(err, data){
            if(err){
                console.log("erreur acces");
            }else{
                // var pseudoPlayer= data[0].pseudo;
                // console.log(data)
                user = data;
            }
            
        })
    }
})
console.log(user)
console.log(questions)

app.use(expressSession(options));


app.use(function (req, res, next) {
        if (req.url == "/home" || req.url == "/inscription" || req.url == "/connexion") {
            next()
        } else {
            if (!req.session.userName) {
                console.log("test")
                res.cookie("user_id", "", {
                    expires: new Date(Date.now() + 900000),
                    httpOnly: false
                })
                res.redirect("/home") 
            } else {
                console.log("test2")
                res.cookie("user_id", req.session.uuid, {
                    expires: new Date(Date.now() + 900000),
                    httpOnly: false
                })
                next()
            }
        }
    }

);



app.get("/home", function (req, res) {
    res.render("home");
})
app.get("/", function (req, res) {

    // console.log('session==>', req.cookies)
    if (req.cookies) {
        MongoClient.connect("mongodb://localhost:27017", {
            useUnifiedTopology: true
        }, function (err, client) {
            let dbase = client.db("jeu_mj");
            let collect = dbase.collection("sessions");
            console.log(req.session.userName);
            if (req.session.authentification === true) {
                res.redirect("/room")
            } else {
                res.redirect("/home");
            }
        }) 
    }

})


/******************** INSCRIPTION ET CONNEXION *******************************/

app.post("/inscription", function (req, res) {
    MongoClient.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, function (err, client) {
        let db= client.db("jeu_mj");
        let collection = db.collection("utilisateurs")
        if (err) {
            console.log("erreur")
        } else {

            // test si le joueur à saisie mdp et identifiant    
            if (req.body.identifiant === "" || req.body.mdp === "") {
                res.render("home", {
                    message: "Veuillez saisir les informations"
                });
            }
            collection.find({ pseudo: req.body.identifiant }).toArray(function (err, data){
                console.log(data.length)  
                if(data.length){
                    res.render("home", {
                        message: "Identifiant déjà pris"
                    })
                } else {

                    let db = client.db("jeu_mj");
                    let collection = db.collection("utilisateurs");
                    let ident = req.body.identifiant;
                    let motDePasse = req.body.mdp;
                    let insertion = {};
                    let uuid = uuidv1();

                    //Creation de la session du joueur
                    req.session.uuid = uuid;
                    req.session.authentification = true;
                    req.session.userName = ident;
                    

                    //insertion du joueur dans la data base Utilisateurs
                    insertion.pseudo = ident;
                    insertion.mdp = motDePasse;
                    insertion.uuid = uuid;
                    insertion.avatar;
                    
                    collection.insertOne(insertion, function (err, results) {
                        res.cookie("user_id", uuid, {
                            expires: new Date(Date.now() + 900000),
                            httpOnly: false
                        })
                        res.render("room");
                    });
                }
            })
        }
    })
});

app.post("/connexion", function (req, res) {
    MongoClient.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, function (err, client) {
        if (err) {
            console.log("erreur")
        }

        if (req.body.identifiant === "" || req.body.mdp === "") {
            res.render("home", {
                message: "Veuillez saisir les informations"
            })
        }

        let db = client.db("jeu_mj");
        let collection = db.collection("utilisateurs");
        let ident = req.body.identifiant;
        let motDePasse = req.body.mdp;

        collection.find({pseudo: ident}).toArray(function (err, data){
            if (data.length) {
                console.log(data)
                let user = data[0]; // probleme si plusieurs personnes sont connectées le data[0] n'est plus bon ????? //semi réponse = si c'est ok si la session est ouverte
                    console.log(data[0])
                if (user.mdp === motDePasse) {
                    req.session.userName = user.pseudo;
                    req.session.authentification = true;
                    req.session.uuid = user.uuid
                    res.cookie("user_id", user.uuid, {
                        expires: new Date(Date.now() + 900000),
                        httpOnly: false
                    })

                    res.render("room")
                } else {
                    res.render("home", {
                        message: "Identifiants incorrects"
                    })
                }
            }
        })
    })
});



app.get("/room", function (req, res) { 
    res.render("room")
})

app.post("/room", function(req, res){
    req.session.avatar = req.body.image;
})




const serverHTTP = app.listen(8080, function () {
    console.log("Serveur Démarré");
});

const io = require("socket.io");

const webSocketServer = io(serverHTTP);



webSocketServer.on("connect", function (socket) {
    console.log("connected to the client");

    
    // const CreateRoom = function(socketid, roomName, joueurs){
    //     this.socketid = socketid;
    //     this.nom = roomName;
    //     this.joueurs = joueurs;
    // }

    socket.joueur = {
        room:"",
        pseudo:"",
        uuid:"",
        score:""
    }


    socket.on("avatar", function(image){
        console.log(image); 
        MongoClient.connect("mongodb://localhost:27017",{useUnifiedTopology: true},function(err,client){
            let db = client.db("jeu_mj");
            let collection = db.collection("utlisateurs");
            let insertion = {};
            insertion.avatar= image;
            collection.updateOne({},{$set:{avatar: image}})
            
        })
    })

   

    var joueurJ1 = {
        room:"",
        player:"",
        playerId:"",
        score:""
    }
    var joueurJ2 = {
        room:"",
        player:"",
        playerId:"",
        score:""
    }

    socket.on("create_room1", function(room,uuidPlayer){

        

        console.log("yal1111111")
        console.log(uuidPlayer)
        console.log(room)
        console.log(socket.rooms)
        console.log(socket.id)
        console.log("yalaaaaaa") 
        socket.join(room); 

        

        var roomOne = webSocketServer.sockets.adapter.rooms[room];

        console.log(roomOne)
        console.log(roomOne.length)

        console.log(uuidPlayer)

       

        if(roomOne.length > 2){ 
             var message = "Room pleine";
            webSocketServer.sockets.to(socket.id).emit("message", message)
            socket.leave(room)
        }

        if (!webSocketServer.sockets.adapter.rooms[room].hasOwnProperty("scores")){
            webSocketServer.sockets.adapter.rooms[room]["scores"]={}
        }
        var score = webSocketServer.sockets.adapter.rooms[room]["scores"][uuidPlayer] = 0;

        var joueur = user.find(joueur => joueur.uuid === uuidPlayer)
        console.log(joueur)
        console.log(joueur.pseudo)
        webSocketServer.sockets.in(room).emit('joueur', joueur)
        
        if(roomOne.length == 1){
            joueurJ1.room = room;
            joueurJ1.player = joueur; 
            joueurJ1.playerId = player;
            joueurJ1.score = score;
            console.log(joueurJ1)
            var attente = "Vous êtes seul";
            webSocketServer.sockets.to(room).emit("attente", attente, joueurJ1)
            
        }
        // webSocketServer.on("joueur1",function(joueurJ1){
        // if(roomOne.length == 2){
        //     if(room == "Partie 1"){
        //     console.log(socket.rooms)
        //     joueurJ1.room = room;
        //     joueurJ1.player = joueur; 
        //     joueurJ1.playerId = player; 
        //     joueurJ1.score = score;
        //     joueurJ2.room = room;
        //     joueurJ2.player = joueur;
        //     joueurJ2.playerId = player;
        //     joueurJ2.score = score;
        //     console.log(joueurJ1, joueurJ2)
        //     webSocketServer.sockets.to(room).emit("joueurJ2", joueurJ2, joueurJ1)
        //     }
        
        //     }
        // })

        
    })


    
    socket.on("create_room2", function(room, player){ 
        console.log("yal222222")
        console.log(player)
        console.log(room)
        console.log(socket.rooms) 
        console.log("yalaaaaaa")
        socket.join(room)

        var roomTwo = webSocketServer.sockets.adapter.rooms[room];

        console.log(roomTwo)
        console.log(roomTwo.length)
        if(roomTwo.length == 1){
            var attente = "Vous êtes seul";
            webSocketServer.sockets.to(socket.id).emit("attente", attente)
        }

        if(roomTwo.length > 2){ 
             var message = "Room pleine";
            webSocketServer.sockets.to(socket.id).emit("message", message)  
            socket.leave(room)  
        }

        if (!webSocketServer.sockets.adapter.rooms[room].hasOwnProperty("scores")){
            webSocketServer.sockets.adapter.rooms[room]["scores"]={}
        }
        webSocketServer.sockets.adapter.rooms[room]["scores"][player] = 0
    })
    
    
    socket.on("create_room3", function(room, player){
        console.log("yal333333")
        console.log(room)
        console.log(socket.rooms) 
        console.log("yalaaaaaa")
        socket.join(room)

        var roomThree = webSocketServer.sockets.adapter.rooms[room];

        console.log(roomThree)
        console.log(roomThree.length)
        if(roomThree.length == 1){
            var attente = "Vous êtes seul";
            webSocketServer.sockets.to(socket.id).emit("attente", attente)
        }

        if(roomThree.length > 2){ 
             var message = "Room pleine";
            webSocketServer.sockets.to(socket.id).emit("message", message) 
            socket.leave(room)
        }

        if (!webSocketServer.sockets.adapter.rooms[room].hasOwnProperty("scores")){
            webSocketServer.sockets.adapter.rooms[room]["scores"]={}
        }
        webSocketServer.sockets.adapter.rooms[room]["scores"][player] = 0
    })

    
    socket.on("create_room4", function(room, player){
        console.log("yal444444")
        console.log(room)
        console.log(socket.rooms) 
        console.log("yalaaaaaa")
        socket.join(room)

        var roomFour = webSocketServer.sockets.adapter.rooms[room];

        console.log(roomFour)
        console.log(roomFour.length)
        if(roomFour.length == 1){
            var attente = "Vous êtes seul";
            webSocketServer.sockets.to(socket.id).emit("attente", attente)
        }

        if(roomFour.length > 2){ 
             var message = "Room pleine";
            webSocketServer.sockets.to(socket.id).emit("message", message)
            socket.leave(room)
        }

        if (!webSocketServer.sockets.adapter.rooms[room].hasOwnProperty("scores")){
            webSocketServer.sockets.adapter.rooms[room]["scores"]={}
        }
        webSocketServer.sockets.adapter.rooms[room]["scores"][player] = 0
    })

    
    socket.on("create_room5", function(room, player){
        console.log(room)
        console.log("yal555555")
        console.log(socket.rooms) 
        console.log("yalaaaaaa")
        console.log(player)
        socket.join(room)

        var roomFive = webSocketServer.sockets.adapter.rooms[room];

        console.log(roomFive)
        console.log(roomFive.length)
        if(roomFive.length == 1){
            var attente = "Vous êtes seul";
            webSocketServer.sockets.to(socket.id).emit("attente", attente)
        }

        if(roomFive.length > 2){ 
             var message = "Room pleine";
            webSocketServer.sockets.to(socket.id).emit("message", message)
            socket.leave(room)
        } 

        if (!webSocketServer.sockets.adapter.rooms[room].hasOwnProperty("scores")){
            webSocketServer.sockets.adapter.rooms[room]["scores"]={}
        }
        webSocketServer.sockets.adapter.rooms[room]["scores"][player] = 0
    })
 



  
    socket.on("create_room", function (roomName, player) {
        
       
        console.log("ici c'est les rooms")
        console.log(roomName)
        console.log(player)
        console.log("------------------")
        socket.join(roomName);

        var roomPerso = webSocketServer.sockets.adapter.rooms[roomName];

        console.log(roomPerso)
        console.log(roomPerso.length)
        if(roomPerso.length == 1){
            var attente = "Vous êtes seul";
            webSocketServer.sockets.to(socket.id).emit("attente", attente)
        }

        if(roomPerso.length > 2){ 
             var message = "Room pleine";
            webSocketServer.sockets.to(socket.id).emit("message", message)
            socket.leave(roomName)
        }

        if (!webSocketServer.sockets.adapter.rooms[roomName].hasOwnProperty("scores")){
            webSocketServer.sockets.adapter.rooms[roomName]["scores"]={}
        }
        webSocketServer.sockets.adapter.rooms[roomName]["scores"][player] = 0
        
 
 
    });
    
      


    socket.on("start", function (room) {
        if(webSocketServer.sockets.adapter.rooms[room]["start"] == true){
            return
        }else{
            webSocketServer.sockets.adapter.rooms[room]["start"] = true
        }

        console.log("bbbbbbbbbbbbbbb")
        console.log(socket.adapter.rooms)
        console.log("RECU EMIT START GAME")
        console.log("room", room)
        console.log(webSocketServer.sockets.adapter.rooms)

        console.log(webSocketServer.nsps['/'].adapter.rooms)
        console.log("bbbbbbbbbbbbbbb")
        console.log(socket.rooms) 
        var i=0; 

       
        
        console.log(webSocketServer.sockets.adapter.rooms)

        var testInterval = setInterval(() => {
            console.log("PPPPPPPPPPPPPPPPPPPPPPPPP")
            console.log(webSocketServer.sockets.adapter.rooms)
            var question = questions[i]
            var response = Object.assign({}, questions[i]);



            console.log(i)
            // console.log(questions[i])
            if (i >= 25) {
                clearInterval(testInterval)
                clearTimeout(testTimeout)
                console.log("fermer la room ici")
                return
            }
            // console.log("----LALA----")
            // console.log(room)
            // console.log("emit question", room, question)
            // console.log("----LALA----")
            webSocketServer.sockets.in(room).emit('questions', question)
            
            var testTimeout = setTimeout(() => {
                // console.log("------------ICI------------")
                // console.log("emit response", room, response)
                // console.log("------------ICI------------")
                webSocketServer.sockets.in(room).emit('response', response)  
            }, 3000)
            i++
            // console.log("-----TAPUTINDETAMERE-------")
            // console.log(i) 
            // console.log("-----TAPUTINDETAMERE-------")
        }, 6000);
 
        console.log("YAQUOI")
    });

    socket.on("reponse", function(data){
        let solution = questions[parseFloat(data.question.split("question ")[1])-1].solution;
        console.log(data);
        console.log(socket.id)
        console.log(solution);

        MongoClient.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, function (err, client){
            if(err){
                console.log("erreur avec mongo") 
            }else{
                let db = client.db("jeu_mj");
                let collection = db.collection("scores");
                collection.findOne({},{projection:{uuid:1}})
                    if(err){
                        console.log("error")
                    }
                    collection.update({},{$set:{socketid: socket.id}})
                }
            })

        if(solution == data.reponse){  
            console.log("score + 1!")
        
            var _room =  webSocketServer.sockets.adapter.rooms[data.room];
            console.log(_room) 
            _room["scores"][data.userId] += 1; 
            var playerScore = _room["scores"]
            webSocketServer.sockets.in(data.room).emit("scores",playerScore);
            console.log("SCOREEEEEEEEEEEEEEEEEEEEEEEE") 
            console.log(webSocketServer.sockets.adapter.rooms[data.room]);
            console.log(_room["scores"])

            MongoClient.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, function (err, client){
                if(err){
                    console.log("erreur avec mongo") 
                }else{
                    let db = client.db("jeu_mj");
                    let collection = db.collection("scores");
                    collection.findOne({},{projection:{socketid:1}})
                        if(err){
                            console.log("error")
                        }
                        collection.updateOne({},{$inc:{score:1}})   
                    

                }
            })
        }
           
    })      

    


    // /**** partie pour quitter la room *****/ 
    // socket.on("disconnect", function () {
    //     socket.leave(socket.room);  
    // })
    
    
    
 

});


