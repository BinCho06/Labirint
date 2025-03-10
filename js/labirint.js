const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const rows = 30;
const cellSize = Math.floor(canvas.width / rows);
const cols = Math.floor(canvas.height / cellSize);

var maze = [];
var rootIndex = 0, playerIndex = 29*cols + 15;
var previousDirection = {dx: 0, dy: 0}, playerDir = {dx: 0, dy: 0};
var oldRoot, oldPlayer;

var time = 91;
var gameSpeed = 500;
var gameInterval;

var playerColor = "#ffaaaa";
var moveDown=false, moveUp=false, moveLeft=false, moveRight=false;
var hints=0;
var buffer=false;

// TODO refractor/cleanup
var frame=1, animation;
var playerFrame=1, playerAnimation;

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
    updateTime();

    oldPlayer=maze[playerIndex]

    displayScores();
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
    if(rootIndex == null) return;
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 }   // Right
    ];

    oldRoot = maze[rootIndex];
    let x = oldRoot.x;
    let y = oldRoot.y;
    do{
        var randomDirection = directions[Math.floor(Math.random() * directions.length)];
        var newX = x + randomDirection.dx;
        var newY = y + randomDirection.dy;
    } while (
        (newX < 0 || newX >= cols || newY < 0 || newY >= rows) ||
        (randomDirection.dx === -previousDirection.dx && randomDirection.dy === -previousDirection.dy)
    );
    previousDirection = randomDirection;

    const newRoot = maze[newY * cols + newX];

    switchRoot(oldRoot, newRoot)
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

function gameUpdate() {
    randomRootShift();

    drawMaze();
    if(buffer) drawSolution();
    buffer=false;

    if(rootIndex) animateRoot();
    drawPlayer();
    updateTime();

    checkPosition();
}

function updateTime(){
    time-=gameSpeed/1000;
    document.getElementById("time").innerHTML = "Time left: " + Math.floor(time / 60) + ":" + String(Math.floor(time) % 60).padStart(2, '0');
    if(time<0.1){
        Swal.fire({
            title: 'Izgubil si!',
            text: 'Zmanjkalo ti je zraka, poskusi ponovno.',
            icon: 'error',
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'buttoncolor'
            }
        }).then(() => {
            resetGame();
        });
        clearInterval(gameInterval);
    }
}

function useHint(){
    drawSolution();
    drawPlayer();
    drawRoot();

    hints++;
    document.getElementById("hints").innerHTML = "Hints used: "+hints;

    time -= 10 - gameSpeed/1000;
    updateTime();

    buffer=true;
}

function movePlayer(key) {
    if(playerAnimation) return;
    switch (key) {
        case "w": case "W": case "ArrowUp":
            moveUp = true;
            break;
        case "s": case "S": case "ArrowDown":
            moveDown = true;
            break;
        case "a": case "A": case "ArrowLeft":
            moveLeft = true;
            break;
        case "d": case "D": case "ArrowRight":
            moveRight = true;
            break;
        default:
            return;
    }

    oldPlayer=maze[playerIndex]
    let path = getPaths(oldPlayer);

    if(moveUp && path[2]){
        playerIndex -= cols;
        playerDir = { dx: 0, dy: -1 }
    } else if(moveRight && path[1]){
        playerIndex += 1;
        playerDir = { dx: 1, dy: 0 }
    } else if(moveDown && path[-2]){
        playerIndex += cols;
        playerDir = { dx: 0, dy: 1 }
    } else if(moveLeft && path[-1]){
        playerIndex -= 1;
        playerDir = { dx: -1, dy: 0 }
    } else{
        playerDir = { dx: 0, dy: 0 }
        return;
    }

    moveDown=false, moveUp=false, moveLeft=false, moveRight=false;
    playerFrame = 1;
    playerAnimation = requestAnimationFrame(drawPlayer);
}

function getPaths(node) {
    let path = []

    /* Array[1, 2, -2, -1] values are individualy set to true 
     * based on the direction of the node connection
    */
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

function checkPosition() {
    if(playerIndex === 15){
        saveScore(90-time, hints);

        Swal.fire({
            title: 'Zmagal si!',
            text: 'Uspešno si pogenil iz labirinta na površje',
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'buttoncolor'
            }
        }).then(() => {
            resetGame();
        });

        clearInterval(gameInterval);
    }
    if(!rootIndex) return;
    if(playerIndex == rootIndex || (playerIndex == oldRoot.y*cols + oldRoot.x && frame<cellSize*0.8)){
        rootIndex = null;
        oldRoot=null;
        time=time+10;
    }
}

function resetGame() {
    clearInterval(gameInterval);
    if(!rootIndex) rootIndex=0;
    generateInstantly(50000);

    hints = 0;
    time = 90;
    playerIndex = 29*cols + 15;
    oldPlayer=maze[playerIndex];
    playerDir = {dx: 0, dy: 0}
    moveDown=false, moveUp=false, moveLeft=false, moveRight=false;

    document.getElementById("time").innerHTML = "Time left: " + Math.floor(time / 60) + ":" + String(Math.floor(time) % 60).padStart(2, '0');
    document.getElementById("hints").innerHTML = "Hints used: "+hints;
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

function animateRoot(){
    if (animation || rootIndex == null) return;
    frame = 1;
    animation = requestAnimationFrame(drawRoot);
}

function drawRoot() {
    ctx.clearRect(oldRoot.x*cellSize+3 + previousDirection.dx*frame, oldRoot.y*cellSize+3 + previousDirection.dy*frame, cellSize-6, cellSize-6);

    let x = oldRoot.x*cellSize + cellSize/2 + previousDirection.dx*frame;
    let y = oldRoot.y*cellSize + cellSize/2 + previousDirection.dy*frame;

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

    frame+=2;
    if (frame > cellSize || rootIndex == null) {
        animation = null;
    } else {
        animation = requestAnimationFrame(drawRoot);
    }
}

function drawPlayer() {
    if(playerFrame > cellSize) playerFrame=cellSize;
    ctx.clearRect(oldPlayer.x*cellSize+3 + playerDir.dx*playerFrame, oldPlayer.y*cellSize+3 + playerDir.dy*playerFrame, cellSize-6, cellSize-6);

    let x = oldPlayer.x*cellSize + cellSize/2 + playerDir.dx*playerFrame;
    let y = oldPlayer.y*cellSize + cellSize/2 + playerDir.dy*playerFrame;

    ctx.beginPath();
    ctx.arc(x, y, 0.30*cellSize, 0, 2 * Math.PI);
    playerColor = "#ff"+Math.floor(time/10)+Math.floor(time%10)+Math.floor(time/10)+Math.floor(time%10);
    console.log(playerColor);
    ctx.fillStyle = playerColor;
    ctx.fill();

    if (playerFrame >= cellSize) {
        playerAnimation = null;
    } else {
        playerFrame+=3;
        playerAnimation = requestAnimationFrame(drawPlayer);
    }
}

function drawSolution() {
    ctx.beginPath();

    let temp=rootIndex;
    setRoot(15, 0);
    
    let node = maze[29*cols + 15] // maze[y * cols + x]
    while(node.parent !== null){
        ctx.moveTo(node.x*cellSize + cellSize/2, node.y*cellSize + cellSize/2);
        ctx.lineTo(node.parent.x*cellSize + cellSize/2, node.parent.y*cellSize + cellSize/2);    

        node = node.parent;
    }

    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.stroke();

    if(temp != null) {
        setRoot(temp%cols, Math.floor(temp / cols));
    } else {
        rootIndex=null;
    }
}

function saveScore(timeTaken, hintsUsed) {
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    scores.push({ timeTaken, hintsUsed });
    localStorage.setItem('scores', JSON.stringify(scores));
}

function displayScores() {
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    let scoreText = "";
    scores.forEach((score, index) => {
        scoreText += `${index + 1}: Time Taken - ${score.timeTaken}s, Hints Used - ${score.hintsUsed}<br>`;
    });
    Swal.fire({
        title: 'Rezultati',
        html: scoreText,
        icon: 'info',
        confirmButtonText: 'OK',
        customClass: {
            confirmButton: 'buttoncolor'
        }
    }).then(() => {
        Swal.fire({
            title: 'Priplavaj na površje',
            text: 'V tej igri igraš kot plavalec ki mora priplavati na površje skozi labirint predent ti zmanjka sape/časa. Mehurček ki ti spreminja labirint lahko uničiš in s tem pridobiš več časa za reševanje',
            icon: 'info',
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'buttoncolor'
            }
        }).then(() => {
            gameInterval = setInterval(gameUpdate, gameSpeed);
        });
    });
    
}

document.addEventListener("keydown", function(event) {
    if(event.key === "h" || event.key === "H" && hints<maxHints){
        useHint();
    }else{
        movePlayer(event.key);
    }
});

function credits(){
    Swal.fire({
        title: 'Vizitka',
        text: 'Štefan Koren 4. Rb, 2025',
        icon: 'info',
        confirmButtonText: 'OK',
        customClass: {
            confirmButton: 'buttoncolor'
        }
    })
}