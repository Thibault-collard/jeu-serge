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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/src"));
app.use("/images", express.static(__dirname + "/src/images"));
app.use(cookieParser());

const MongoStore = connectMongo(expressSession);

//variable pour la date d'expiration des cookies
var cookieExpiration = new Date(Date.now() + 3600); // 1 hour
console.log(cookieExpiration);
var sessionlife = 60 * 60 * 1000;

const options = {
    store: new MongoStore({
        url: "mongodb://localhost:27017/jeu_mj"
    }),
    secret: "1234Secret",
    saveUninitialized: true,
    resave: false,
    expires: cookieExpiration,
    rolling: true, // reset maxAge on every response
    cookie: {
        maxAge: sessionlife,
        expires: new Date(Date.now() + sessionlife)
    },
};

app.use(expressSession(options));

app.use(function (req, res, next) {
    if (req.url == "/home" || req.url == "/auth") {
        next()
    } else {
        if (!req.session.userName) {
            console.log("test")
            res.redirect("/home")
        } else {
            console.log("test2")
            next()
        }
    }
});

app.get("/", function (req, res) {
    res.render("home");
})

app.post("/inscription", function(req, res){
    MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true },function(err, client){
        
        // test si le joueur à saisie mdp et identifiant    
        if (req.body.identifiant === "" || req.body.mdp === "") {
            res.render("home", { message: "Veuillez saisir les informations" });
        };


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
            res.render("avatar", { mess: "Bienvenue " + ident });
        });
    })
});

app.post("/connexion", function(req, res){
    MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true }, function(err, client){
        if(err){
            console.log("erreur")
        }

        collection.find({pseudo: ident}).toArray(function(err, data){
            if(data.length){

                let user = data[0]; // probleme si plusieurs personnes sont connectées le data[0] n'est plus bon ????? //semi réponse = si c'est ok si la session est ouverte

                    if(user.mdp === motDePasse && user.pseudo === ident){
                        req.session.userName = user.pseudo;
                        req.session.authentification = true;
                        res.render("avatar", {message : "Bienvenue " + req.session.userName})
                    }else{
                        res.render("home", {message:"Identifiants incorrects" })
                    }
            }
        })
    })
});

app.get("/avatar", function (req, res) {
    res.render("avatar", { mess: "Bienvenue " + req.session.userName });
});

app.post("/avatar", function(req, res){
    req.session.avatar = req.body.image // => user values?
    console.log("AHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH")
    res.redirect("/room")
});

app.post("/room", function(req, res){
    console.log("RRRRRRRRRRRRRRRRRRRRR")
    MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true }, function(err, client){
        if(err){
            console.log("erreur")
        }
        let db = client.db("jeu_mj");
        let collection= db.collection("rooms");
        console.log("-----")
        console.log(req.body)
        console.log("-----")
        let nomDeLaPartie = req.body.roomname;
        let insertion= {};

        collection.find({nom: nomDeLaPartie}).toArray(function(err, data){
            if(!data.length){
                console.log("room inexistante");
                insertion.uuid = uuidv1();
                insertion.nom = nomDeLaPartie;
                insertion.maxJoueur = 2;
                insertion.minJoueur = 1;
                insertion.nomDesJoueurs = [req.session.userName];
                collection.insertOne(insertion, function(err, results){
                    console.log("room créée")
                })
            }
        })        
    })
});

const serverHTTP = app.listen(8080, function () {
    console.log("Serveur Démarré");
});

const io = require("socket.io");

const webSocketServer = io(serverHTTP);

webSocketServer.on("connect", function(socket){
    console.log("connected to the client");
})