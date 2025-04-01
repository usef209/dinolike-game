// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 300;
const GROUND_HEIGHT = 20;
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const OBSTACLE_SPEED = 6;
const OBSTACLE_FREQUENCY = 0.02; // Probability of spawning an obstacle each frame
const SCORE_INCREMENT = 0.1;

// Game variables
let canvas, ctx;
let dino;
let obstacles = [];
let ground;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameSpeed = 1;
let gameOver = false;
let gameStarted = false;
let frameCount = 0;
let clouds = [];
let lastObstacleTime = 0;
let minObstacleInterval = 50; // Minimum frames between obstacles

// Sprite frames for dino animation
const dinoSprites = {
    running: [
        { x: 0, y: 0, width: 40, height: 40 },
        { x: 40, y: 0, width: 40, height: 40 }
    ],
    jumping: { x: 80, y: 0, width: 40, height: 40 },
    dead: { x: 120, y: 0, width: 40, height: 40 }
};

// Initialize the game
window.onload = function() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Load high score from localStorage
    document.getElementById('highScore').textContent = Math.floor(highScore);
    
    // Initialize game objects
    initGame();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('click', handleClick);
    
    // Create initial clouds
    for (let i = 0; i < 3; i++) {
        createCloud();
    }
};

// Initialize game objects
function initGame() {
    // Create dino character
    dino = {
        x: 50,
        y: GAME_HEIGHT - GROUND_HEIGHT - 40,
        width: 40,
        height: 40,
        velocityY: 0,
        jumping: false,
        dead: false,
        frameIndex: 0,
        frameCount: 0,
        draw: function() {
            ctx.fillStyle = '#555';
            
            // Determine which sprite to use
            let sprite;
            if (this.dead) {
                sprite = dinoSprites.dead;
            } else if (this.jumping) {
                sprite = dinoSprites.jumping;
            } else {
                // Animate running by switching between frames
                this.frameCount++;
                if (this.frameCount >= 10) {
                    this.frameIndex = (this.frameIndex + 1) % 2;
                    this.frameCount = 0;
                }
                sprite = dinoSprites.running[this.frameIndex];
            }
            
            // Draw the dino
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw eyes for character
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x + 28, this.y + 8, 8, 8);
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x + 32, this.y + 10, 4, 4);
        },
        jump: function() {
            if (!this.jumping && !gameOver) {
                this.jumping = true;
                this.velocityY = JUMP_FORCE;
                
                // Play jump sound
                playSound('jump');
                
                if (!gameStarted) {
                    startGame();
                }
            }
        },
        update: function() {
            // Apply gravity
            this.velocityY += GRAVITY;
            this.y += this.velocityY;
            
            // Ground collision
            if (this.y > GAME_HEIGHT - GROUND_HEIGHT - this.height) {
                this.y = GAME_HEIGHT - GROUND_HEIGHT - this.height;
                this.velocityY = 0;
                this.jumping = false;
            }
        }
    };
    
    // Create ground
    ground = {
        y: GAME_HEIGHT - GROUND_HEIGHT,
        draw: function() {
            ctx.fillStyle = '#AAA';
            ctx.fillRect(0, this.y, GAME_WIDTH, GROUND_HEIGHT);
            
            // Draw ground texture
            ctx.fillStyle = '#999';
            for (let i = 0; i < GAME_WIDTH; i += 50) {
                ctx.fillRect(i, this.y + 5, 30, 2);
            }
        }
    };
    
    // Reset game state
    obstacles = [];
    score = 0;
    gameSpeed = 1;
    gameOver = false;
    gameStarted = false;
    frameCount = 0;
    lastObstacleTime = 0;
    
    // Update UI
    updateScore();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-start').classList.remove('hidden');
}

// Create a cloud
function createCloud() {
    const cloud = {
        x: GAME_WIDTH + Math.random() * 200,
        y: 50 + Math.random() * 100,
        width: 60 + Math.random() * 40,
        height: 20 + Math.random() * 20,
        speed: 1 + Math.random() * 0.5,
        draw: function() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.height/2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width * 0.3, this.y - this.height * 0.2, this.height * 0.6, 0, Math.PI * 2);
            ctx.arc(this.x + this.width * 0.6, this.y, this.height * 0.7, 0, Math.PI * 2);
            ctx.fill();
        },
        update: function() {
            this.x -= this.speed * gameSpeed;
            if (this.x + this.width < 0) {
                this.x = GAME_WIDTH + Math.random() * 200;
                this.y = 50 + Math.random() * 100;
            }
        }
    };
    clouds.push(cloud);
}

// Update clouds
function updateClouds() {
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].update();
    }
    
    // Add new cloud occasionally
    if (Math.random() < 0.003 * gameSpeed && clouds.length < 5) {
        createCloud();
    }
}

// Draw clouds
function drawClouds() {
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].draw();
    }
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#b3e0ff');
    gradient.addColorStop(1, '#e6f2ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Update and draw clouds
    updateClouds();
    drawClouds();
    
    // Update game state
    if (gameStarted && !gameOver) {
        // Update dino
        dino.update();
        
        // Generate obstacles
        if (Math.random() < OBSTACLE_FREQUENCY * gameSpeed && 
            frameCount > 60 && 
            frameCount - lastObstacleTime > minObstacleInterval) {
            createObstacle();
            lastObstacleTime = frameCount;
        }
        
        // Update obstacles
        updateObstacles();
        
        // Check collisions
        checkCollisions();
        
        // Update score
        score += SCORE_INCREMENT * gameSpeed;
        updateScore();
        
        // Increase game speed gradually
        if (frameCount % 500 === 0) {
            gameSpeed += 0.1;
            // Decrease minimum obstacle interval as game speeds up
            minObstacleInterval = Math.max(30, minObstacleInterval - 2);
        }
        
        frameCount++;
    }
    
    // Draw game objects
    ground.draw();
    dino.draw();
    drawObstacles();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Create a new obstacle
function createObstacle() {
    const height = 20 + Math.random() * 30;
    const width = 20 + Math.random() * 10;
    
    // Occasionally create a taller, thinner obstacle
    const isTall = Math.random() > 0.7;
    const finalHeight = isTall ? height * 1.5 : height;
    const finalWidth = isTall ? width * 0.7 : width;
    
    const obstacle = {
        x: GAME_WIDTH,
        y: GAME_HEIGHT - GROUND_HEIGHT - finalHeight,
        width: finalWidth,
        height: finalHeight,
        draw: function() {
            ctx.fillStyle = '#833';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Add texture to obstacles
            ctx.fillStyle = '#722';
            ctx.fillRect(this.x + this.width * 0.25, this.y, this.width * 0.1, this.height);
            ctx.fillRect(this.x + this.width * 0.6, this.y, this.width * 0.1, this.height);
        }
    };
    obstacles.push(obstacle);
}

// Update all obstacles
function updateObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= OBSTACLE_SPEED * gameSpeed;
        
        // Remove obstacles that are off-screen
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
}

// Draw all obstacles
function drawObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].draw();
    }
}

// Check for collisions between dino and obstacles
function checkCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        
        // Simple rectangle collision detection
        if (
            dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y
        ) {
            endGame();
            break;
        }
    }
}

// Play sound effects
function playSound(type) {
    // Sound effects could be implemented here
    // For now, we'll just log the sound type
    console.log('Playing sound:', type);
}

// Start the game
function startGame() {
    gameStarted = true;
    document.getElementById('game-start').classList.add('hidden');
}

// End the game
function endGame() {
    gameOver = true;
    dino.dead = true;
    
    // Play death sound
    playSound('death');
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
        document.getElementById('highScore').textContent = Math.floor(highScore);
    }
    
    // Show game over screen
    document.getElementById('game-over').classList.remove('hidden');
}

// Restart the game
function restartGame() {
    if (gameOver) {
        initGame();
    }
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = Math.floor(score);
}

// Event handlers
function handleKeyDown(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        if (gameOver) {
            restartGame();
        } else {
            dino.jump();
        }
    }
}

function handleTouchStart(event) {
    event.preventDefault();
    if (gameOver) {
        restartGame();
    } else {
        dino.jump();
    }
}

function handleClick(event) {
    if (gameOver) {
        restartGame();
    } else {
        dino.jump();
    }
}
