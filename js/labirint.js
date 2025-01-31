const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const rows = 30;
const cellSize = Math.floor(canvas.width / rows);
const cols = Math.floor(canvas.height / cellSize);

let solutionShown = false;

var maze = [];
var rootIndex = 0, playerIndex = 15;
var gameSpeed = 400, frame=1;
var gameInterval, mazeInterval;
var moveDown, moveUp, moveLeft, moveRight;
var previousDirection = {dx: 0, dy: 0};
let isMouseDown = false;

class Node {
    constructor(parentNode, x, y) {
        this.x = x;
        this.y = y;
        this.parent = parentNode;
        this.children = [];
    }
}

init();

function init() {
    initializeMaze();
    drawBorder();
    generateInstantly(50000);
}

function initializeMaze() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let parentNode = null;
            let newNode;

            if (j > 0) {
                parentNode = maze[i*cols+(j-1)];
            } else if (i > 0) {
                parentNode = maze[(i-1)*cols+j];
            }
            newNode=new Node(parentNode, j, i);

            maze.push(newNode);
            if(parentNode != null){
                parentNode.children.push(newNode);
            }
        }
    }
}

function setRoot(x, y) {
    const newRoot = maze[y * cols + x];
    recursiveRootSwitch(newRoot);
}

function recursiveRootSwitch(node){
    if(node.parent == null) return; // Follow the "pointers" to the parent
    recursiveRootSwitch(node.parent);
    switchRoot(node.parent, node); // Turn the "pointers" around while backtracking 
}

function randomRootShift() {
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 }   // Right
    ];

    let currentRoot = maze[rootIndex];
    let currentX = currentRoot.x;
    let currentY = currentRoot.y;
    do{
        var randomDirection = directions[Math.floor(Math.random() * directions.length)];
        var newX = currentX + randomDirection.dx;
        var newY = currentY + randomDirection.dy;
    } while (
        (newX < 0 || newX >= cols || newY < 0 || newY >= rows) ||
        (randomDirection.dx === -previousDirection.dx && randomDirection.dy === -previousDirection.dy)
    );
    previousDirection = randomDirection;

    const newRoot = maze[newY * cols + newX];

    //animation = setInterval(animateRoot(previousDirection), 10)
    switchRoot(currentRoot, newRoot)
}

function switchRoot(oldRoot, newRoot) {
    // 1. Make the old root's parent the new root
    oldRoot.parent = newRoot;

    // 2. Remove the new root from its parent's children array
    newRoot.parent.children = newRoot.parent.children.filter(child => child !== newRoot);

    // 3. Add the old root to children of the new root
    newRoot.children.push(oldRoot);

    // 4. Make the new root's parent null
    newRoot.parent = null;

    // 5. Update the root index
    rootIndex = newRoot.y*cols + newRoot.x;
}

function generateInstantly(repetitions) {
    let i=0;
    while (i<repetitions) {
        randomRootShift();
        i++;
    }
    drawMaze();
}

function toggleSolution(){
    solutionShown = !solutionShown;
}

function startGame() {
    gameInterval = setInterval(gameUpdate, gameSpeed);
    document.getElementById("game").disabled = true;
}

function gameUpdate() {
    randomRootShift();
    movePlayer();

    drawMaze();
    if(solutionShown) {
        drawSolution();
    }
    //animateRoot();
    //drawRoot();
    drawPlayer();
    
    checkWin();
}

function movePlayer() {
    let path = getPaths(maze[playerIndex]);

    if(moveUp && path[2]){
        playerIndex -= cols;
    } else if(moveRight && path[1]){
        playerIndex += 1;
    } else if(moveDown && path[-2]){
        playerIndex += cols;
    } else if(moveLeft && path[-1]){
        playerIndex -= 1;
    }
    moveDown=false, moveUp=false, moveLeft=false, moveRight=false;
}

function getPaths(node) {
    let path = []

    if(node.parent){
        path[node.parent.x - node.x] = true;
        path[2*(node.y - node.parent.y)] = true;
    }
    
    node.children.forEach(child => {
        path[child.x - node.x] = true;
        path[2*(node.y - child.y)] = true;
    });
    return path;
}

function checkWin() {
    if(playerIndex === 29*cols + 15){
        alert('You win!');
        resetGame();
        // TODO
    }
}

function resetGame() {
    clearInterval(gameInterval);
    generateInstantly(50000);

    solutionShown = false;
    playerIndex = 15;
    moveDown=false, moveUp=false, moveLeft=false, moveRight=false;

    drawPlayer();
    gameInterval = setInterval(gameUpdate, gameSpeed);
}

function drawBorder() {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);

    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width/2, 0);
    ctx.moveTo(canvas.width/2+cellSize, 0);
    ctx.lineTo(canvas.width, 0);

    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);

    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.moveTo(canvas.width/2+cellSize, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 6;
    ctx.stroke();
}

function drawMaze() {
    ctx.clearRect(3, 3, canvas.width-6, canvas.height-6);
    ctx.beginPath();

    maze.forEach(node => {
        let left = node.x != 0;
        let top = node.y != 0;

        if(node.parent){
            if(node.parent.x < node.x) left=false;
            if(node.parent.y < node.y) top=false;
        }
        
        node.children.forEach(child => {
            if(child.x < node.x) left=false;
            if(child.y < node.y) top=false;
        });
        
        if(left){
            ctx.moveTo(node.x * cellSize, node.y * cellSize);
            ctx.lineTo(node.x * cellSize, node.y * cellSize + cellSize);
        }
        if(top){
            ctx.moveTo(node.x * cellSize, node.y * cellSize);
            ctx.lineTo(node.x * cellSize + cellSize, node.y * cellSize);
        }
    });

    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
}

/*function animateRoot(){
    frame=1;
    animation = setInterval(drawRoot, 10);
}

function drawRoot() {
    ctx.clearRect(maze[rootIndex].x*cellSize+3, maze[rootIndex].y*cellSize+3, cellSize-6, cellSize-6);

    let x = maze[rootIndex].x*cellSize + cellSize/2 + previousDirection.dx*frame;
    let y = maze[rootIndex].y*cellSize + cellSize/2 + previousDirection.dy*frame;

    ctx.beginPath();
    ctx.arc(x, y, 0.3*cellSize, 0, 2 * Math.PI);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.arc(x, y, 0.2*cellSize, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(250, 250, 255, 0.3)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 0.15*cellSize, -Math.PI/2, 0);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.stroke();

    console.log(frame);
    if(frame >= 10){
        clearInterval(animation);
        animation=null;
        console.log("konc");
    }
    frame++;
}*/

function drawPlayer() {
    //TODO
    ctx.beginPath();
    ctx.arc(maze[playerIndex].x*cellSize + cellSize/2, maze[playerIndex].y*cellSize + cellSize/2, 0.4*cellSize, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
    ctx.fill();
}

function drawSolution() {
    ctx.beginPath();

    let temp=rootIndex;
    setRoot(15, 29);
    
    let node = maze[15] // maze[y * cols + x]
    while(node.parent !== null){
        ctx.moveTo(node.x*cellSize + cellSize/2, node.y*cellSize + cellSize/2);
        ctx.lineTo(node.parent.x*cellSize + cellSize/2, node.parent.y*cellSize + cellSize/2)
        node = node.parent;
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.stroke();

    setRoot(temp%cols, Math.floor(temp / cols));
}

/*
canvas.addEventListener('mousedown', (event) => {
    if(mazeInterval != null) return;
    isMouseDown = true;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.floor((event.clientX - rect.left)/cellSize));
    const y = Math.max(0, Math.floor((event.clientY - rect.top)/cellSize));
    setRoot(x, y);
    drawUpdate();
});

document.addEventListener('mouseup', (event) => {
    isMouseDown = false;
    drawMaze();
});

canvas.addEventListener('mousemove', (event) => {
    if(isMouseDown) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.floor((event.clientX - rect.left)/cellSize));
        const y = Math.max(0, Math.floor((event.clientY - rect.top)/cellSize));
        const clickIndex = y*cols + x;

        let ouOfReach = Math.abs(maze[clickIndex].x - maze[rootIndex].x) + Math.abs(maze[clickIndex].y - maze[rootIndex].y) > 1;
        let cellChanged = clickIndex !== rootIndex;
        if(ouOfReach){
            setRoot(x, y);
            drawUpdate();
        } else if(cellChanged){
            switchRoot(maze[rootIndex], maze[clickIndex]);
            drawUpdate();
        }
    }
});
*/

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
/*
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
*/