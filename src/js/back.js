"use strict"

/************** Definition des différentes variables ******************/

var ioClient;
var numQuestion = window.document.getElementById("numQuestion")
var theme = window.document.getElementById("theme");
var question = window.document.getElementById("question");
var reponseA = window.document.getElementById("reponseA");
var reponseB = window.document.getElementById("reponseB");
var reponseC = window.document.getElementById("reponseC");
var reponseD = window.document.getElementById("reponseD");
var reponseFinale = window.document.getElementById("reponseFinale")
var anecdote = window.document.getElementById("anecdote");
var startGame = window.document.getElementById("startGame");
var fenetreDeJeu = window.document.getElementById("fenetreDeJeu");
var allForm = window.document.getElementById("allForm");
var buttonConnexion = document.getElementById("connexion");
var buttonInscription = document.getElementById("inscription");
var boutonRejoindre = document.getElementById("boutonRejoindre");
var partieUne = document.getElementById("partieUne");
var partieDeux = document.getElementById("partieDeux");
var partieTrois = document.getElementById("partieTrois");
var partieQuatre = document.getElementById("partieQuatre"); 
var partieCinq = document.getElementById("partieCinq");
var joueurs = document.getElementById("joueurs");
var nameJ1 = document.getElementById("nameJ1");
var nameJ2 = document.getElementById("nameJ2");
var scoreJ1 = document.getElementById("score1");
var scoreJ2 = document.getElementById("score2");
var avatarfinalJ1 = document.getElementById("avatarfinalJ1");
var avatarfinalJ2 = document.getElementById("avatarfinalJ2");
var idConnexion = document.getElementById("idConnexion");
var idInscription = document.getElementById("idInscription");
var bouttonStart = document.getElementById("bouttonStart");
var messageAlerte = document.getElementById("message");
var beforePartie = document.getElementById("beforePartie");
var submitavatar = document.getElementById("submitAvatar");
var instructions = document.getElementById("instructions");


// gestion des cookies

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}


window.addEventListener("DOMContentLoaded", function(){ 

/************ Hide fenetre de jeu ***********/
joueurs.style.display = "none";
bouttonStart.style.display = "none";
fenetreDeJeu.style.display = "none";
/********************************************/


ioClient = io("http://localhost:8080", {reconnection: true});


ioClient.on("connect", function(){
    console.log("Connecté au serveur");
    
    
    
    // Evenements permettant de rejoindre les rooms avec les données côté client à envoyer
    
    if(partieUne){
    
        partieUne.addEventListener("click", (event)=>{
            console.log("room Partie une");
            event.preventDefault();
            
            let roomName = document.getElementById("partieUne").value
            
            console.log(roomName);
    
            setCookie("room", roomName) //donne le roomName
            
    
            let uuidPlayer = getCookie("user_id");
            

            joueurs.style.display = "flex";
            bouttonStart.style.display = "block";
            fenetreDeJeu.style.display = "block";
            beforePartie.style.display = "none";
     
            ioClient.emit("joinroom", roomName, uuidPlayer); 
            // console.log(questionPosée)
        })
    } 
    


    if(partieDeux){
    
        partieDeux.addEventListener("click", (event)=>{
            console.log("room Partie Deux");
            event.preventDefault();
    
            let roomName = document.getElementById("partieDeux").value
    
            console.log(roomName);
    
            setCookie("room", roomName)
    
            let player = getCookie("user_id");

            joueurs.style.display = "flex";
            bouttonStart.style.display = "block";
            fenetreDeJeu.style.display = "block";
            beforePartie.style.display = "none";
            
            ioClient.emit("joinroom", roomName, player);
            // console.log(questionPosée)
        })
    }
    
    
    if(partieTrois){
    
        partieTrois.addEventListener("click", (event)=>{
            console.log("room Partie Trois");
            event.preventDefault();
    
            let roomName = document.getElementById("partieTrois").value
    
            console.log(roomName);
    
            setCookie("room", roomName)
    
            let player = getCookie("user_id");

            joueurs.style.display = "flex";
            bouttonStart.style.display = "block";
            fenetreDeJeu.style.display = "block";
            beforePartie.style.display = "none";
    
            ioClient.emit("joinroom", roomName, player);
            // console.log(questionPosée)
        })
    }
    
    
    
    // définition de l'affichage des questions et réponses
    
    
    var questionPosée = function(questions){
    
        theme.innerHTML= questions.theme;
        numQuestion.innerHTML=questions.id
        question.innerHTML= questions.question;
        reponseA.innerHTML= questions.propositions[0];
        reponseB.innerHTML= questions.propositions[1];
        reponseC.innerHTML= questions.propositions[2];
        reponseD.innerHTML= questions.propositions[3];         
    }
    
    var reponsePosée = function(questions){
        
        reponseFinale.innerHTML = questions.solution;
        anecdote.innerHTML = questions.anecdote;
    }
    
    
    // Gestion de la fenetre de jeu pendant le jeu
    
    ioClient.on("questions", function(question){
        // console.log(question)
        questionPosée(question)
        reponseA.style.backgroundColor = "unset";
        reponseB.style.backgroundColor = "unset";
        reponseC.style.backgroundColor = "unset";
        reponseD.style.backgroundColor = "unset";
        reponseA.disabled = false;
        reponseB.disabled = false;
        reponseC.disabled = false;
        reponseD.disabled = false;
        reponseFinale.innerHTML = "";
        anecdote.innerHTML = "";
    })
    
    ioClient.on("response", function(response){
        // console.log(response)
        reponsePosée(response);
        reponseA.disabled = true;
        reponseB.disabled = true;
        reponseC.disabled = true;
        reponseD.disabled = true;
    })


    // gestion de la room lorsqu'il n'y a qu'un joueur

    ioClient.on("attente", function(attente, room){
        alert(attente);
        bouttonStart.disabled = true;
        nameJ1.innerHTML = room.joueurs[0].pseudo;
        scoreJ1.innerHTML = room.joueurs[0].score;
    })

    // gestion de la room quand les deux joueurs sont présents

    ioClient.on("message",function(message, room){
        alert(message);
        nameJ1.innerHTML = room.joueurs[0].pseudo;
        scoreJ1.innerHTML = room.joueurs[0].score;
        nameJ2.innerHTML = room.joueurs[1].pseudo;
        scoreJ2.innerHTML = room.joueurs[1].score; 
    })

    // gestion lorsque la room est pleine

    ioClient.on("alerte", function(alerte){
        alert(alerte);
        document.location.reload();
    })


    // gestion de la partie

    if(bouttonStart){
        bouttonStart.addEventListener("click", function(event){
            bouttonStart.disabled = true;
            console.log("ahahaahahah")
            console.log(getCookie("room"))
            event.preventDefault();
            ioClient.emit("start", getCookie("room"));
        })
        }  
    
    if (reponseA){
        reponseA.addEventListener("click", function(){
    
            reponseA.style.backgroundColor = "goldenrod"; 
            if(reponseA.style.backgroundColor == "goldenrod"){
                reponseA.disabled = true;
                reponseB.disabled = true;
                reponseC.disabled = true;
                reponseD.disabled = true;
            } 
            let data = {
            room : getCookie("room"),
            reponse : reponseA.innerHTML,
            question : numQuestion.innerHTML,
            userId : getCookie("user_id") 
            }
            console.log(data)
            ioClient.emit("reponse", data );  
        
        })
    }
    
    
    if (reponseB){
        reponseB.addEventListener("click", function(){
    
            reponseB.style.backgroundColor = "goldenrod"; 
            if(reponseB.style.backgroundColor == "goldenrod"){
                reponseA.disabled = true;
                reponseB.disabled = true;
                reponseC.disabled = true;
                reponseD.disabled = true;
            }
            let data = {
                room : getCookie("room"),
                reponse : reponseB.innerHTML,
                question : numQuestion.innerHTML,
                userId : getCookie("user_id") 
                }
            ioClient.emit("reponse", data);
        })
    }
    
    
    if(reponseC){
        reponseC.addEventListener("click", function(){
    
            reponseC.style.backgroundColor = "goldenrod"; 
            if(reponseC.style.backgroundColor == "goldenrod"){
                reponseB.disabled = true;
                reponseA.disabled = true;
                reponseC.disabled = true;
                reponseD.disabled = true;
            }
            let data = {
                room : getCookie("room"),
                reponse : reponseC.innerHTML,
                question : numQuestion.innerHTML,
                userId : getCookie("user_id") 
                };
            ioClient.emit("reponse", data);
        })

    }
    
    
    if(reponseD){
        reponseD.addEventListener("click", function(){ 
    
            reponseD.style.backgroundColor = "goldenrod"; 
            if(reponseD.style.backgroundColor == "goldenrod"){
                reponseB.disabled = true;
                reponseC.disabled = true;
                reponseA.disabled = true;
                reponseD.disabled = true;
            }
            let data = {
                room : getCookie("room"), 
                reponse : reponseD.innerHTML,
                question : numQuestion.innerHTML,
                userId : getCookie("user_id") 
                }
            ioClient.emit("reponse", data);
        })
    }

 
    //gestion de l'affichage des scores
            
    ioClient.on("scores", function(joueurs){

        
        console.log(joueurs);
        scoreJ1.innerHTML = joueurs[0].score;
        scoreJ2.innerHTML = joueurs[1].score;

    }) 

    // gestion de la fin de partie

    ioClient.on("finDePartie", function(room){
        ioClient.emit("deconnexion",room);
        document.location.reload();
    })
    
})

  



})
