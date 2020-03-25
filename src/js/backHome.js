"use strict"


var buttonConnexion = document.getElementById("connexion");
var buttonInscription = document.getElementById("inscription");
var formInscription = document.getElementById("formInscription");
var formConnexion = document.getElementById("formConnexion");
var instructions = document.getElementById("instructions");


formConnexion.style.display ="none";
formInscription.style.display ="none";
console.log(formInscription)

window.addEventListener("load", function(){
    
    //gestion de l'evenment lors du clic sur le boutton inscription

    buttonInscription.addEventListener("click", function(){
        instructions.style.display = "none";
        buttonConnexion.style.display = "none";
        buttonInscription.style.display = "none";
        formInscription.style.display = "flex";
    })

    //gestion de l'evenment lors du clic sur le boutton connexion

    buttonConnexion.addEventListener("click", function(){
        buttonConnexion.style.display = "none";
        buttonInscription.style.display = "none";
        formConnexion.style.display = "flex";
        instructions.style.display = "none";
        
    })


})
