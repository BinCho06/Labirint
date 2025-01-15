const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const cellSize = 20;
const rows = Math.floor(canvas.width / cellSize);
const cols = Math.floor(canvas.height / cellSize);

let intervals = [];
let maze = [];
let rootIndex = 0;

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
    drawMaze();
    drawRoot();
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
    rootIndex = maze.indexOf(newRoot);
}

function recursiveRootSwitch(node){
    if(node.parent == null) return;
    recursiveRootSwitch(node.parent);
    switchRoot(node.parent, node);
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

    let validDirection = null;
    while (!validDirection) {
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        const newX = currentX + randomDirection.dx;
        const newY = currentY + randomDirection.dy;

        if (newX >= 0 && newX < cols && newY >= 0 && newY < rows) {
            validDirection = randomDirection;
        }
    }
    const newX = currentX + validDirection.dx;
    const newY = currentY + validDirection.dy;

    rootIndex = newY * cols + newX;
    const newRoot = maze[rootIndex];

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
}

function drawMazeUpdate() {
    randomRootShift();
    drawMaze();
    drawRoot();
}

function generateInstantly(repetitions) {
    let i=0;
    while (i<repetitions) {
        randomRootShift();
        i++;
    }
    drawMaze();
}

function startGeneration() {
    drawMazeUpdate()

    let speed = Math.pow(document.getElementById("rangeInput").value, 2);
    while (speed > 200){
        intervals.push(setInterval(drawMazeUpdate, 5));
        speed-=200;
    }
    intervals.push(setInterval(drawMazeUpdate, 1000/speed));

    //temp
    document.getElementById("start").disabled = true;
    document.getElementById("stop").disabled = false;
    document.getElementById('solution').disabled = true;
    document.getElementById('rangeInput').disabled = true;
}

function stopGeneration() {
    while (intervals.length > 0){
        clearInterval(intervals.pop());
    }
    drawMaze();

    //temp
    document.getElementById("start").disabled = false;
    document.getElementById("stop").disabled = true;
    document.getElementById('solution').disabled = false;
    document.getElementById('rangeInput').disabled = false;
}

function drawBorder() {
    ctx.beginPath();

    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);

    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width/2, 0);
    ctx.moveTo(canvas.width/2+20, 0);
    ctx.lineTo(canvas.width, 0);

    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);

    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.moveTo(canvas.width/2+20, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.stroke();
}

function drawMaze() {
    ctx.clearRect(2, 2, canvas.width-4, canvas.height-4);
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
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawRoot() {
    ctx.beginPath();

    ctx.arc(maze[rootIndex].x*cellSize + cellSize/2, maze[rootIndex].y*cellSize + cellSize/2, 0.3*cellSize, 0, 2 * Math.PI);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.stroke();
}

function drawSolution() {
    ctx.beginPath();

    setRoot(15, 29);

    let node = maze[15] // maze[y * cols + x]
    while(node.parent !== null){
        ctx.moveTo(node.x*cellSize + cellSize/2, node.y*cellSize + cellSize/2);
        ctx.lineTo(node.parent.x*cellSize + cellSize/2, node.parent.y*cellSize + cellSize/2)
        node = node.parent;
    }

    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.stroke();
}