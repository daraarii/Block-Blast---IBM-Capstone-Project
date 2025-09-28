// Canvas grid setup 
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 10;
const cellSize = canvas.width / gridSize;
const board = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

const colors = ["#f94144","#f3722c","#f8961e","#f9c74f","#90be6d","#43aa8b","#577590"];
const blockShapes = [
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,1,0],[0,1,1]],
  [[1,1,1],[0,1,0]]
];

let availableBlocks = [];
let draggingBlock = null;
let score = 0;
let highScore = localStorage.getItem("blockBlastHighScore") 
  ? parseInt(localStorage.getItem("blockBlastHighScore")) 
  : 0;
let gameOver = false;

// Block container 
let blockContainer = document.getElementById('blockChoices');

function resetGame() {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      board[y][x] = 0;
    }
  }
  score = 0;
  gameOver = false;
  generateBlocks();
}

function generateBlocks() {
  availableBlocks = [];
  blockContainer.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const shape = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const block = { shape, color, id: i };
    availableBlocks.push(block);
  }
  renderBlockChoices();
}

function renderBlockChoices() {
  blockContainer.innerHTML = '';
  availableBlocks.forEach((block, i) => {
    const blockDiv = document.createElement('div');
    blockDiv.style.display = 'inline-block';
    blockDiv.style.cursor = 'grab';
    blockDiv.setAttribute('draggable', 'true');
    blockDiv.dataset.blockId = i;

    const blockSize = 40;
    const blockGrid = document.createElement('div');
    blockGrid.style.display = 'inline-block';
    block.shape.forEach((row) => {
      const rowDiv = document.createElement('div');
      rowDiv.style.display = 'flex';
      row.forEach((cell) => {
        const cellDiv = document.createElement('div');
        cellDiv.style.width = blockSize + 'px';
        cellDiv.style.height = blockSize + 'px';
        cellDiv.style.background = cell ? block.color : 'transparent';
        cellDiv.style.borderRadius = '4px';
        cellDiv.style.border = cell ? '2px solid #333' : 'none';
        rowDiv.appendChild(cellDiv);
      });
      blockGrid.appendChild(rowDiv);
    });
    blockDiv.appendChild(blockGrid);

    blockDiv.addEventListener('dragstart', () => {
      draggingBlock = block;
      blockDiv.style.opacity = '0.5';
    });
    blockDiv.addEventListener('dragend', () => {
      draggingBlock = null;
      blockDiv.style.opacity = '1';
    });
    blockContainer.appendChild(blockDiv);
  });
}

// Drag over (shadow positioning presisi) 
canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (!draggingBlock || gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const gridX = Math.round(x / cellSize - draggingBlock.shape[0].length / 2);
  const gridY = Math.round(y / cellSize - draggingBlock.shape.length / 2);

  window._dragShadow = { gridX, gridY };
});

canvas.addEventListener('dragleave', () => {
  window._dragShadow = null;
});

// --- Drop: gunakan shadow koordinat ---
canvas.addEventListener('drop', () => {
  if (!draggingBlock || gameOver) return;

  const { gridX, gridY } = window._dragShadow || {};
  if (gridX != null && gridY != null && canPlace(draggingBlock, gridX, gridY)) {
    placeBlock(draggingBlock, gridX, gridY);
    clearLines();

    availableBlocks = availableBlocks.filter(b => b !== draggingBlock);
    renderBlockChoices();

    if (availableBlocks.length === 0) {
      generateBlocks();
    }

    if (checkGameOver()) {
      gameOver = true;
    }
  }

  draggingBlock = null;
  window._dragShadow = null;
});

// Drawing 
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.strokeStyle = "#ddd";
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      if (board[y][x]) {
        ctx.fillStyle = board[y][x];
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.strokeStyle = "#222";
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Block shadow 
  if (draggingBlock && window._dragShadow) {
    const { gridX, gridY } = window._dragShadow;
    // Brighter, more visible shadow color
    const shadowColor = "rgba(255,255,180,0.7)";
    draggingBlock.shape.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell) {
          const x = gridX + j;
          const y = gridY + i;
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            ctx.fillStyle = shadowColor;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      });
    });
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial Black";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "25px Arial";
    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 + 20);
  }
}

function canPlace(block, gridX, gridY) {
  return block.shape.every((row, i) =>
    row.every((cell, j) => {
      if (!cell) return true;
      const x = gridX + j;
      const y = gridY + i;
      return x >= 0 && x < gridSize && y >= 0 && y < gridSize && board[y][x] === 0;
    })
  );
}

function placeBlock(block, gridX, gridY) {
  block.shape.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell) board[gridY + i][gridX + j] = block.color;
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = 0; y < gridSize; y++) {
    if (board[y].every(cell => cell !== 0)) {
      board[y] = Array(gridSize).fill(0);
      cleared++;
    }
  }
  for (let x = 0; x < gridSize; x++) {
    if (board.every(row => row[x] !== 0)) {
      for (let y = 0; y < gridSize; y++) board[y][x] = 0;
      cleared++;
    }
  }
  if (cleared > 0) {
    score += cleared * 10;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("blockBlastHighScore", highScore);
    }
  }
}

function checkGameOver() {
  return availableBlocks.every(block => {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (canPlace(block, x, y)) return false;
      }
    }
    return true;
  });
}

// Update DOM Score + High Score 
function updateScoreDisplay() {
  document.getElementById("scoreDisplay").textContent = score;
  document.getElementById("highScoreDisplay").textContent = "High Score: " + highScore;
}

// Call Score
updateScoreDisplay();

// Modify clearLines
function clearLines() {
  let cleared = 0;
  for (let y = 0; y < gridSize; y++) {
    if (board[y].every(cell => cell !== 0)) {
      board[y] = Array(gridSize).fill(0);
      cleared++;
    }
  }
  for (let x = 0; x < gridSize; x++) {
    if (board.every(row => row[x] !== 0)) {
      for (let y = 0; y < gridSize; y++) board[y][x] = 0;
      cleared++;
    }
  }
  if (cleared > 0) {
    score += cleared * 10;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("blockBlastHighScore", highScore);
    }
    updateScoreDisplay(); // 🔥 update tampilan setiap kali skor berubah
  }
}

// Reset Game
function resetGame() {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      board[y][x] = 0;
    }
  }
  score = 0;
  gameOver = false;
  generateBlocks();
  updateScoreDisplay(); // 🔥 reset score tampilan
}

function gameLoop() {
  drawBoard();
  requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop();



