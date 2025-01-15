// TEMP
const rangeInput = document.getElementById('rangeInput');
const rangeValue = document.getElementById('rangeValue');

rangeInput.addEventListener('input', () => {
    rangeValue.textContent = Math.floor(rangeInput.value*rangeInput.value);
});
//


var moveDown, moveUp, moveLeft, moveRight;

//TODO

document.onkeydown = function(e) {
    switch (e.keyCode) {
        case 37:
            moveLeft=true;
            break;
        case 65:
            moveLeft=true;
            break;
        case 38:
            moveUp=true;
            break;
        case 87:
            moveUp=true;
            break;
        case 39:
            moveRight=true;
            break;
        case 68:
            moveRight=true;
            break;
        case 40:
            moveDown=true;
            break;
        case 83:
            moveDown=true;
            break;
    }
};

document.onkeyup = function(e) {
    switch (e.keyCode) {
        case 37:
            moveLeft=false;
            break;
        case 65:
            moveLeft=false;
            break;
        case 38:
            moveUp=false;
            break;
        case 87:
            moveUp=false;
            break;
        case 39:
            moveRight=false;
            break;
        case 68:
            moveRight=false;
            break;
        case 40:
            moveDown=false;
            break;
        case 83:
            moveDown=false;
            break;
    }
};