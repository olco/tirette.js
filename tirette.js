/* 

Olivier COSQUER - 2019 

Licence WTFPL - http://www.wtfpl.net

Pour me contacter : ocosquer@gmail.com

*/

let offset = [0, 0];
let posTopLeft = [0, 0];
let isDown = false;
let currentTirette;
let currentLabel;
let currentLine;
let inputHeight = 0;

// On va chercher tous les objets ayant la classe tirette
let tirettes;

document.addEventListener('DOMContentLoaded', ev => {
    stateLoad(true);
}, false);


window.addEventListener('resize', function(e) {
    stateLoad(false);
}, false);

function stateLoad(initState){
    tirettes = document.getElementsByClassName("tirette");

    for (let i = 0; i < tirettes.length; i++) {
        (function(index) {

            if(initState == true){
            // On ajoute dynamiquement les objets graphiques
                tirettes[index].insertAdjacentHTML('afterend', '<div class="tirette-line-' + index + '"id="tirette-line-' + index + '">&nbsp;</div><div class="tirette-handle-' + index + '"id="tirette-handle-' + index + '" dragable="true" ><div class="tirette-label-' + index + '"id="tirette-label-' + index + '">&nbsp;</div></div>');
            }        
            // On récupère les objets tirette et ligne pour les repositionner
            let tirette = document.getElementById("tirette-handle-" + index);
            let line = document.getElementById("tirette-line-" + index);

            // Calcul de la position de la tirette et de la ligne
            let rect = tirettes[index].getBoundingClientRect();
            let rightPos = rect.right;
            let leftPos = rect.left + (rect.right - rect.left) / 2;
            let topPos = rect.top + window.scrollY;
            inputHeight = rect.bottom - rect.top;

            // On repositionne la tirette et la ligne
            line.style.left = rect.right + 'px';
            line.style.top = topPos + parseInt((rect.bottom - rect.top) / 2) + 'px';
            tirette.style.width = inputHeight + 'px';
            tirette.style.height = inputHeight + 'px';
            tirette.style.left = rightPos + 'px';
            tirette.style.top = topPos + 'px';
            tirette.style.marginRight = ((rect.bottom - rect.top)) + 'px';

            // Gestion des événements souris
            tirette.addEventListener('mousedown', function(e) {
                e.preventDefault();
                stateInit(this.id, this.offsetLeft, this.offsetTop, e.clientX, e.clientY);
                e.stopPropagation();
            }, true);

            document.addEventListener('mouseup', function() {
                stateEnd();
            }, true);

            document.addEventListener('mousemove', function(e) {
                e.preventDefault();
                stateMove(e.clientX, e.clientY);
                e.stopPropagation();
            }, true);

            // gestion de la suppression
            tirette.addEventListener('dblclick', function(e) {
                e.preventDefault();
                let inputsTirette = document.getElementsByClassName('tirette');
                let tiretteInput = inputsTirette[this.id.split('-')[2]];
                tiretteInput.value = "";
                e.stopPropagation();
            }, true);

            // Gestion des événements tactiles
            tirette.addEventListener('touchstart', function(e) {
                e.preventDefault();
                stateInit(this.id, this.offsetLeft, this.offsetTop, e.touches[0].clientX, e.touches[0].clientY);
                e.stopPropagation();
            }, true);

            document.addEventListener('touchend', function() {
                stateEnd();
            }, true);

            document.addEventListener('touchmove', function(e) {
                e.preventDefault();
                stateMove(e.touches[0].clientX, e.touches[0].clientY);
                e.stopPropagation();
            }, true);

        })(i);
    }
}

// Etat initial
function stateInit(tirettId, offsetLeft, offsetTop, clientX, clientY) {

    // On bascule dans le mode "ça va bouger"
    isDown = true;

    // On récupère nos IDs
    currentTirette = tirettId;
    currentLine = "tirette-line-" + currentTirette.split('-')[2];
    currentLabel = "tirette-label-" + currentTirette.split('-')[2];

    // On affiche la ligne
    let lineDown = document.getElementById(currentLine);
    lineDown.style.opacity = 1;

    // On récupère nos positions intiales
    offset = [
        offsetLeft - clientX,
        offsetTop - clientY
    ];
    posTopLeft = [
        offsetLeft,
        offsetTop
    ];
}

// Etat "en mouvement"
function stateMove(clientX, clientY) {
    if (isDown) {

        // On récupère la position du pointeur
        pointerPosition = {
            x: clientX,
            y: clientY
        };

        // On déplace la tirette en fonction de la poisition du pointeur
        let tiretteDown = document.getElementById(currentTirette);
        tiretteDown.style.left = pointerPosition.x + offset[0] + 'px';
        tiretteDown.style.top = pointerPosition.y + offset[1] + 'px';

        // Quelques calculs ::
        // - pour récupérer la distance entre le point initial et le point courant
        // - pour la rotation de la ligne
        let topLeftX = posTopLeft[0];
        let offsetX = offset[0];
        let dist = distance(topLeftX, (pointerPosition.x + offsetX), posTopLeft[1], (pointerPosition.y + offset[1]));
        let xMid = (topLeftX + (pointerPosition.x + offsetX)) / 2;
        let yMid = (posTopLeft[1] + (pointerPosition.y + offset[1])) / 2 + (inputHeight / 2);
        let inRad = Math.atan2((pointerPosition.y + offset[1]) - posTopLeft[1], (pointerPosition.x + offsetX) - topLeftX);
        let inDeg = (inRad * 180) / Math.PI;

        // On affiche la ligne en fonction des calculs précédents
        let lineDown = document.getElementById(currentLine);
        lineDown.style.width = dist + 'px';
        lineDown.style.top = (yMid) + 'px';
        lineDown.style.left = (xMid) - (dist / 2) + 'px';
        lineDown.style.transform = "rotate(" + inDeg + "deg)";

        // On récupère les objets et les attributs qui nous interessent
        let inputsTirette = document.getElementsByClassName('tirette');
        let tiretteInput = inputsTirette[currentTirette.split('-')[2]];
        let min = tiretteInput.getAttribute("min");
        let max = tiretteInput.getAttribute("max");
        let accuracy = tiretteInput.getAttribute("accuracy");

        // Calcul de la valeur à partir de la valeur min le cas échéant
        let computedValue = 0;
        console.log(tiretteInput.tagName);

        if (tiretteInput.tagName.toUpperCase() == "SELECT") {
            min = 0;
            max = tiretteInput.length - 1;
        }

        computedValue = ((min != null) ? parseInt(min) : 0) + Math.round(dist / ((accuracy != null) ? parseInt(accuracy) : 1));

        // On bloque ou non en fonction de la valeur max
        let showValue = (max != null && parseInt(max) < computedValue) ? false : true;

        // On affiche le label à côté de la tirette (feedback)
        let labelDown = document.getElementById(currentLabel);
        labelDown.style.opacity = 1;

        // Affichage de la valeur
        if (showValue) {
            if (tiretteInput.tagName.toUpperCase() == "SELECT") {
                tiretteInput.selectedIndex = computedValue;
            } else {
                tiretteInput.value = computedValue;
                labelDown.innerHTML = tiretteInput.value;
            }
            labelDown.innerHTML = tiretteInput.value;
        } else {
            if (tiretteInput.tagName.toUpperCase() == "SELECT") {
                tiretteInput.selectedIndex = parseInt(max);
            } else {
                tiretteInput.value = parseInt(max);
                labelDown.innerHTML = tiretteInput.value;
            }
            labelDown.innerHTML = tiretteInput.value;
        }
    }
}

// Etat final
function stateEnd() {

    if (isDown) {
        // C'est terminé, on repositionne le booléen à son état initial
        isDown = false;

        // On repositionne la tirette
        let tiretteDown = document.getElementById(currentTirette);
        tiretteDown.style.left = posTopLeft[0] + 'px';
        tiretteDown.style.top = posTopLeft[1] + 'px';

        // On repositionne la ligne
        let lineDown = document.getElementById(currentLine);
        lineDown.style.width = 1 + 'px';
        lineDown.style.opacity = 0;

        // On repositionne le label
        let labelDown = document.getElementById(currentLabel);
        labelDown.style.opacity = 0;
    }
}

// Calcul de la distance entre deux points
function distance(x1, x2, y1, y2) {
    let xx = (x1 - x2) * (x1 - x2);
    let yy = (y1 - y2) * (y1 - y2);
    return Math.round(Math.sqrt((xx + yy)));
}