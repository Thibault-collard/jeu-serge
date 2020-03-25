"use strict";

/**************************************
 * 
 * PARTIE EXPRESS
 * 
 ************************************/


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
        url: "mongodb+srv://admin:Sergio94!@cluster0-eunil.mongodb.net/test?retryWrites=true&w=majority"
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

// Definition de la variable questions

var questions;
const uri= "mongodb+srv://admin:Sergio94!@cluster0-eunil.mongodb.net/test?retryWrites=true&w=majority"

MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, client) {
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

//Definition de la variable user

var user;

MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, client) {
    if (err) {
        console.log("error");
    } else {
        let db = client.db("jeu_mj");
        let collection = db.collection("utilisateurs");
        collection.find({}, { projection: { uuid: 1, pseudo: 1 } }).toArray(function (err, data) {
            if (err) {
                console.log("erreur acces");
            } else {
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


// Middelwares

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
});

//Verification si l'utilisateur a toujours sa session active

app.get("/", function (req, res) {
    // console.log('session==>', req.cookies)
    if (req.cookies) {
        MongoClient.connect(uri, {
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

});


/******************** INSCRIPTION ET CONNEXION *******************************/


/***********INSCRIPTION avec verification si le pseudo est déjà utilisé ************/

app.post("/inscription", function (req, res) {
    MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, client) {
        
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

                    collection.insertOne(insertion, function (err, results) {
                        res.cookie("user_id", uuid, {
                            expires: new Date(Date.now() + 900000),
                            httpOnly: false
                        })
                        res.redirect("room");
                    });
                }
            })
        }
    })
});

/*********** CONNEXION avec vérification des identifiants ************/


app.post("/connexion", function (req, res) {
    MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, client) {
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

        collection.find({ pseudo: ident }).toArray(function (err, data) {
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

                    res.redirect("room")
                } else {
                    res.render("home", {
                        message: "Identifiants incorrects"
                    })
                }
            }
        })
    })
});


/**** Acces à la page room qui va également afficher les dix meilleurs scores enregistrés sur la DB  ****/

app.get("/room", function (req, res) {
    MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, client) {
        if (err) {
            console.log("erreur avec mongo")
        } else {
            let db = client.db("jeu_mj");
            let collection = db.collection("scores");
            collection.find({}).sort({score:-1}).limit(10).toArray(function(err,data){
                if (err) {
                    console.log("erreur d'insertion")
                } else {
                    console.log(data)
                    var tabScore = {};
                    tabScore.gameur = data;
                    res.render("room", tabScore)
                }
            })
        }
    })
})




/***************************************
 * 
 * PARTIE SOCKET IO
 * 
 ***************************************/




const serverHTTP = app.listen(process.env.PORT || 8080, function () {
    console.log("Serveur Démarré");
});

const io = require("socket.io");

const webSocketServer = io(serverHTTP);

// Definitions des trois rooms

const rooms = [
    {nom: "Partie-1", joueurs:[]},
    {nom: "Partie-2", joueurs:[]},
    {nom: "Partie-3", joueurs:[]}
]

// fonction permettant d'aller chercher la room correspondante

var rechercheRoom = function(roomName){
    for(let i=0; i < rooms.length;i++){
        if(rooms[i].nom == roomName){
            return rooms[i];
        }
    }
};

webSocketServer.on("connect", function (socket) {
    console.log("connected to the client");

    // Socket permettant de rejoindre une des trois rooms

    socket.on("joinroom", function (roomName, uuidPlayer) {
        console.log("On Rentre dans JOINROOM", roomName)
        var room = rechercheRoom(roomName)
        console.log(roomName);
        console.log(uuidPlayer);
        console.log(socket.id)

        // const client = new MongoClient(uri);
        // // var permettant d'aller chercher le pseudo correspondant à l'uuid reçu
        // let db = client.db("jeu_mj");
        // let collection = db.collection("utilisateurs");
        // var pseudo = collection
        var pseudo = user.find(joueur => joueur.uuid === uuidPlayer).pseudo
        console.log(pseudo)


        // Conditions concernant les joueurs, leur nombre et le nombre maximal de joueur par room

        if(room.joueurs.length < 2){
            var joueur = {
                pseudo : pseudo,
                uuid : uuidPlayer,
                score : 0,
                roomName : roomName,
                socketId : socket.id, 
            }
            socket.joueur = joueur;
            room.joueurs.push(joueur);
            console.log(room.joueurs.length)
            console.log(room)
            console.log("PPPP")
            console.log(socket.joueur)
            socket.join(roomName);
        }else{
            var alerte = "Room pleine";
            webSocketServer.sockets.to(socket.id).emit("alerte", alerte)
        }


        if(room.joueurs.length === 1){
            var attente = "Vous êtes seul";
            webSocketServer.sockets.to(roomName).emit("attente", attente, room)
        }
        if(room.joueurs.length === 2){
            var message = "La partie va pouvoir commencer";
            webSocketServer.sockets.to(roomName).emit("message", message, room)
        }
          
         
        

    });

    
    // socket concernant le lancemant de la partie et son déroulement

    socket.on("start", function (room) {
        console.log(room)
       
       var i =0;

        //setInterval pour le défilement des questions

        var testInterval = setInterval(() => {
            var question = questions[i];
            var response = Object.assign({}, questions[i]);

            

            // console.log(i)
            // console.log(questions[i])
            if (i >= 25) {
               
                webSocketServer.sockets.in(room).emit("finDePartie", room)
                clearInterval(testInterval);
                clearTimeout(testTimeout);
                return

            }
           
            
            // console.log("emit question", room, question)
            
            webSocketServer.sockets.in(room).emit('questions', question);

            var testTimeout = setTimeout(() => {
                
                // console.log("emit response", room, response)
                
                webSocketServer.sockets.in(room).emit('response', response)
            }, 8000)

            i++
            
        }, 15000);


        
    });


    // socket correspondant à la gestion des réponses

    socket.on("reponse", function (data) {
        let solution = questions[parseFloat(data.question.split("question ")[1]) - 1].solution;
        console.log("//////////////////////")
        console.log(data);
        console.log(socket.id)
        console.log(solution);
        console.log("///////////////////////")
        if (solution == data.reponse) {

            console.log("score + 1!")
            var room = rechercheRoom(socket.joueur.roomName);
            socket.joueur.score += 1;
            console.log("////////")
            console.log(room.joueurs)
            console.log("////////")
            

            webSocketServer.sockets.in(data.room).emit("scores", room.joueurs)

     
        }
    });


    //socket correspondant à la fin de partie avec l'enregistrement des scores et la deconnexion de la room


    socket.on("deconnexion", function(room){
        const client = new MongoClient(uri);
        MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, client){
                    if(err){
                        console.log("erreur")
                    }else{
                        let db = client.db("jeu_mj");
                        let collection = db.collection("scores");
                        let insertion =[
                                        {pseudo:socket.joueur.pseudo, score: socket.joueur.score},
                                        ];


                        collection.insert(insertion, function(err,results){
                            if(err){
                                console.log("erreur d'insertion");
                            }else{
                                console.log("insertion réussie")
                            }
                        })
                    }
                })

        rechercheRoom(room).joueurs = [];
        socket.disconnect();
    })







});


