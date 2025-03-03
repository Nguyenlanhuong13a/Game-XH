// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF'
];

// Tetromino shapes
const SHAPES = [
    [[1, 1, 1, 1]],                    // I
    [[1, 1, 1], [0, 1, 0]],            // T
    [[1, 1, 1], [1, 0, 0]],            // L
    [[1, 1, 1], [0, 0, 1]],            // J
    [[1, 1], [1, 1]],                  // O
    [[1, 1, 0], [0, 1, 1]],            // S
    [[0, 1, 1], [1, 1, 0]]             // Z
];

// Game variables
let canvas;
let ctx;
let nextCanvas;
let nextCtx;
let board;
let piece;
let nextPiece;
let dropCounter;
let dropInterval;
let lastTime;
let score;
let lines;
let level;
let gameOver;
let isPaused;
let highScore;
let isSoundEnabled = true;
let isBackgroundMusicPlaying = false;
let isGameStarted = false;

// Sound elements
const rotateSound = document.getElementById('rotate-sound');
const dropSound = document.getElementById('drop-sound');
const clearSound = document.getElementById('clear-sound');
const gameoverSound = document.getElementById('gameover-sound');
const backgroundMusic = document.getElementById('background-music');

// Initialize game
function init() {
    canvas = document.getElementById('tetris');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('nextPiece');
    nextCtx = nextCanvas.getContext('2d');

    // Scale canvas for better resolution on high DPI displays
    const scale = window.devicePixelRatio;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width *= scale;
    canvas.height *= scale;
    ctx.scale(scale, scale);

    // Initialize game state
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    isPaused = false;
    dropInterval = 1000;
    highScore = localStorage.getItem('tetrisHighScore') || 0;
    updateScore();

    // Create first piece
    piece = createPiece();
    nextPiece = createPiece();

    // Start game loop
    lastTime = 0;
    requestAnimationFrame(update);
    
    // Show main menu
    document.getElementById('main-menu').style.display = 'flex';
    
    // Setup menu controls
    setupMenuControls();
}

// Setup menu controls
function setupMenuControls() {
    // Play button
    document.getElementById('play-btn').addEventListener('click', () => {
        document.getElementById('main-menu').style.display = 'none';
        isGameStarted = true;
        isPaused = false;
        if (isSoundEnabled && !isBackgroundMusicPlaying) {
            backgroundMusic.play();
            isBackgroundMusicPlaying = true;
        }
    });
    
    // Menu sound button
    document.getElementById('sound-btn-menu').addEventListener('click', () => {
        const soundBtn = document.getElementById('sound-btn-menu');
        isSoundEnabled = !isSoundEnabled;
        soundBtn.innerHTML = isSoundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        document.getElementById('sound-btn').innerHTML = isSoundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        if (!isSoundEnabled) {
            backgroundMusic.pause();
            isBackgroundMusicPlaying = false;
        }
    });
    
    // Menu theme switch
    document.getElementById('theme-switch-menu').addEventListener('change', () => {
        const menuThemeSwitch = document.getElementById('theme-switch-menu');
        const gameThemeSwitch = document.getElementById('theme-switch');
        gameThemeSwitch.checked = menuThemeSwitch.checked;
        document.body.setAttribute('data-theme', menuThemeSwitch.checked ? 'dark' : 'light');
    });
}

// Create empty game board
function createBoard() {
    return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

// Create new tetromino piece
function createPiece() {
    const index = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[index];
    return {
        shape,
        color: COLORS[index],
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

// Draw single block
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE);
    ctx.lineTo((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE);
    ctx.lineTo(x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE);
    ctx.lineTo((x + 1) * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
    ctx.lineTo(x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
    ctx.fill();
}

// Draw game board
function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(x, y, COLORS[value - 1]);
            }
        });
    });
}

// Draw current piece
function drawPiece() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(piece.x + x, piece.y + y, piece.color);
            }
        });
    });
}

// Draw next piece preview
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.save();
    nextCtx.scale(0.5, 0.5);
    nextCtx.translate(50, 50);

    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                nextCtx.fillStyle = nextPiece.color;
                nextCtx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                nextCtx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });

    nextCtx.restore();
}

// Check collision
function collision() {
    return piece.shape.some((row, y) => {
        return row.some((value, x) => {
            if (value) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                return boardX < 0 || 
                       boardX >= COLS || 
                       boardY >= ROWS ||
                       (boardY >= 0 && board[boardY][boardX]);
            }
            return false;
        });
    });
}

// Merge piece with board
function merge() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[piece.y + y][piece.x + x] = COLORS.indexOf(piece.color) + 1;
            }
        });
    });
}

// Rotate piece
function rotate() {
    if (isSoundEnabled) rotateSound.play();
    const oldShape = piece.shape;
    piece.shape = piece.shape[0].map((_, i) => 
        piece.shape.map(row => row[i]).reverse()
    );
    if (collision()) {
        piece.shape = oldShape;
    }
}

// Move piece
function move(dir) {
    piece.x += dir;
    if (collision()) {
        piece.x -= dir;
        return false;
    }
    return true;
}

// Drop piece
function drop() {
    piece.y++;
    if (collision()) {
        piece.y--;
        merge();
        if (isSoundEnabled) dropSound.play();
        clearLines();
        piece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();
        if (collision()) {
            gameOver = true;
            if (isSoundEnabled) {
                gameoverSound.play();
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
            }
            showGameOver();
        }
        return false;
    }
    return true;
}

// Hard drop
function hardDrop() {
    while (drop()) {}
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (!board[y][x]) continue outer;
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        linesCleared++;
    }

    if (linesCleared > 0) {
        if (isSoundEnabled) clearSound.play();
        lines += linesCleared;
        score += [40, 100, 300, 1200][linesCleared - 1] * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = 1000 * Math.pow(0.85, level - 1);
        updateScore();
    }
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('lines').textContent = lines;
    document.getElementById('level').textContent = level;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tetrisHighScore', highScore);
    }
    document.getElementById('highscore').textContent = highScore;
}

// Show game over modal
function showGameOver() {
    const modal = document.getElementById('game-over');
    document.getElementById('final-score').textContent = score;
    modal.style.display = 'flex';
}

// Game loop constants
const FPS = 120;
const FRAME_TIME = 1000 / FPS;

// Game loop
function update(time = 0) {
    if (!gameOver && !isPaused && isGameStarted) {
        const deltaTime = time - lastTime;
        dropCounter = (dropCounter || 0) + deltaTime;

        // Update game logic at a fixed time step
        while (dropCounter > dropInterval) {
            drop();
            dropCounter -= dropInterval;
        }

        // Render at 120 FPS
        if (deltaTime >= FRAME_TIME) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
            drawPiece();
            lastTime = time;
        }
    }

    requestAnimationFrame(update);
}

// Event listeners
document.addEventListener('keydown', event => {
    if (gameOver || isPaused) return;

    switch (event.code) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'ArrowUp':
            rotate();
            break;
        case 'Space':
            hardDrop();
            break;
    }
});

// Theme toggle
const themeSwitch = document.getElementById('theme-switch');
themeSwitch.addEventListener('change', () => {
    document.body.setAttribute('data-theme', themeSwitch.checked ? 'dark' : 'light');
});

// Start button
document.getElementById('start-btn').addEventListener('click', () => {
    if (gameOver) {
        board = createBoard();
        score = 0;
        lines = 0;
        level = 1;
        updateScore();
        gameOver = false;
        document.getElementById('game-over').style.display = 'none';
    }
    isGameStarted = true;
    isPaused = false;
    if (isSoundEnabled && !isBackgroundMusicPlaying) {
        backgroundMusic.play();
        isBackgroundMusicPlaying = true;
    }
});

// Pause button
document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        backgroundMusic.pause();
    } else if (isSoundEnabled) {
        backgroundMusic.play();
    }
});

// Sound toggle button
document.getElementById('sound-btn').addEventListener('click', () => {
    const soundBtn = document.getElementById('sound-btn');
    isSoundEnabled = !isSoundEnabled;
    soundBtn.innerHTML = isSoundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    if (!isSoundEnabled) {
        backgroundMusic.pause();
        isBackgroundMusicPlaying = false;
    } else if (!isPaused && !gameOver) {
        backgroundMusic.play();
        isBackgroundMusicPlaying = true;
    }
});

// Restart button
document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    updateScore();
    gameOver = false;
    piece = createPiece();
    nextPiece = createPiece();
    drawNextPiece();
    if (isSoundEnabled) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
        isBackgroundMusicPlaying = true;
    }
});

// Initialize game
init();