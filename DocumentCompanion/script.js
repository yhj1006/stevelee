const player = document.getElementById("player");
const poop = document.getElementById("poop");
const statusText = document.getElementById("status");
const imageUpload = document.getElementById("image-upload");
const poopUpload = document.getElementById("poop-upload");

let playerX = 135;
let poopX = Math.floor(Math.random() * 270);
let poopY = 0;
let gameOver = false;
let moveLeft = false;
let moveRight = false;
let score = 0;
let gameSpeed = 4;
let gameSpeedIncrease = 0.1;

// Initial default images (emoji)
player.innerHTML = "🙂";
poop.innerHTML = "💩";

// Player image upload
imageUpload.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    player.style.backgroundImage = `url('${e.target.result}')`;
    player.innerHTML = ""; // Clear emoji when image is set
  };
  reader.readAsDataURL(file);
});

// Poop image upload
poopUpload.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    poop.style.backgroundImage = `url('${e.target.result}')`;
    poop.innerHTML = ""; // Clear emoji when image is set
  };
  reader.readAsDataURL(file);
});

function updatePlayer() {
  player.style.left = playerX + "px";
}

function dropPoop() {
  poop.style.left = poopX + "px";
  poop.style.top = poopY + "px";
}

function checkCollision() {
  const pLeft = playerX;
  const pRight = playerX + 30;
  const dLeft = poopX;
  const dRight = poopX + 24;

  const hitX = pRight > dLeft && pLeft < dRight;
  const hitY = poopY + 24 >= 370;

  if (hitX && hitY) {
    gameOver = true;
    statusText.textContent = `💥 Game Over! 점수: ${score}`;
    statusText.style.color = "red";
  }
}

function updateScore() {
  if (!gameOver && poopY > 400) {
    score++;
    statusText.textContent = `점수: ${score}`;
    
    // Increase game speed gradually
    if (score % 5 === 0) {
      gameSpeed += gameSpeedIncrease;
    }
  }
}

// Keyboard movement
document.addEventListener("keydown", (e) => {
  if (gameOver) return;

  if (e.key === "ArrowLeft" && playerX > 0) {
    playerX -= 15;
  } else if (e.key === "ArrowRight" && playerX < 270) {
    playerX += 15;
  }
  updatePlayer();
});

// Touch movement
document.getElementById("left-touch").addEventListener("touchstart", () => moveLeft = true);
document.getElementById("left-touch").addEventListener("touchend", () => moveLeft = false);
document.getElementById("right-touch").addEventListener("touchstart", () => moveRight = true);
document.getElementById("right-touch").addEventListener("touchend", () => moveRight = false);

function gameLoop() {
  if (gameOver) return;

  if (moveLeft && playerX > 0) {
    playerX -= 3;
  } else if (moveRight && playerX < 270) {
    playerX += 3;
  }

  updatePlayer();

  poopY += gameSpeed;
  dropPoop();
  checkCollision();

  if (poopY > 400) {
    poopY = 0;
    poopX = Math.floor(Math.random() * 270);
    updateScore();
  }

  requestAnimationFrame(gameLoop);
}

// Initialize the game
function initGame() {
  // Reset game variables
  playerX = 135;
  poopX = Math.floor(Math.random() * 270);
  poopY = 0;
  gameOver = false;
  score = 0;
  gameSpeed = 4;
  
  // Update display
  statusText.textContent = "게임 시작! 똥을 피하세요!";
  statusText.style.color = "black";
  updatePlayer();
  dropPoop();
  
  // Start game loop
  gameLoop();
}

// Initialize event listeners for mobile devices
function initTouchControls() {
  // Prevent scrolling when touching game area on mobile
  document.getElementById("game-area").addEventListener("touchmove", function(e) {
    e.preventDefault();
  }, { passive: false });
}

// Handle window resize
function handleResize() {
  // Adjust game area dimensions if needed
  updatePlayer();
  dropPoop();
}

// Initialize the game
window.addEventListener("load", () => {
  initGame();
  initTouchControls();
});

// Handle window resize
window.addEventListener("resize", handleResize);
