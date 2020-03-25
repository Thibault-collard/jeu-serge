"use strict";

var buttonConnexion = document.getElementById("connexion");
var buttonInscription = document.getElementById("inscription");
var formInscription = document.getElementById("formInscription");
var formConnexion = document.getElementById("formConnexion");

formConnexion.style.display ="none";
formInscription.style.display ="none";


window.addEventListener("DOMContentLoaded", function(){

    buttonConnexion.addEventListener("click", function(){
        buttonConnexion.style.display = "none";
        buttonInscription.style.display = "none";
        formConnexion.style.display = "flex";
    })


    buttonInscription.addEventListener("click", function(){
        buttonConnexion.style.display = "none";
        buttonInscription.style.display = "none";
        formInscription.style.display = "flex";
    })

})