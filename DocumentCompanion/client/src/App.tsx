import { useEffect, useState, useRef, useCallback } from "react";
import { useAudio } from "./lib/stores/useAudio";
import { useGame } from "./lib/stores/useGame";
import LeaderboardModal from "./components/LeaderboardModal";
import PermanentLeaderboard from "./components/PermanentLeaderboard";
import { apiRequest } from "./lib/queryClient";
import "@fontsource/inter";
import "./index.css";

// Define LeaderboardEntry interface here for reuse
interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  level: number;
  createdAt: string;
}

// Define falling object interface
interface FallingObject {
  id: number;
  x: number;
  y: number;
  speed: number;
}

// Main App component
function App() {
  const { phase, start } = useGame();
  const audio = useAudio();
  
  // Initialize sound effects
  useEffect(() => {
    // Create audio elements
    const hitSound = new Audio();
    hitSound.src = "/hit.mp3"; // We'll create these files or use default sounds
    
    const successSound = new Audio();
    successSound.src = "/success.mp3";
    
    // Set them in our audio store
    audio.setHitSound(hitSound);
    audio.setSuccessSound(successSound);
    
    // Don't toggle mute here - we'll set it directly to avoid infinite loop
    // The default state is muted already
  }, []);
  
  // Shorthand functions for sound
  const playHit = useCallback(() => audio.playHit(), [audio]);
  const playSuccess = useCallback(() => audio.playSuccess(), [audio]);
  
  // Game state
  const [playerX, setPlayerX] = useState(135);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(4);
  const [gameOver, setGameOver] = useState(false);
  const [moveLeft, setMoveLeft] = useState(false);
  const [moveRight, setMoveRight] = useState(false);
  const [gameLevel, setGameLevel] = useState(1);
  const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
  
  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  
  // Image state
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [poopImage, setPoopImage] = useState<string | null>("/images/poop.png");
  
  // Refs for animation frame
  const animationFrameRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const lastPoopTimeRef = useRef<number>(0);
  const poopIdCounterRef = useRef<number>(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  // Handle player image upload
  const handlePlayerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPlayerImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Handle poop image upload
  const handlePoopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPoopImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Create a new falling object
  const createFallingObject = useCallback(() => {
    const id = poopIdCounterRef.current++;
    return {
      id,
      x: Math.floor(Math.random() * 270),
      y: 0,
      speed: gameSpeed * (0.8 + Math.random() * 0.4) // Random speed variation
    };
  }, [gameSpeed]);
  
  // Check for collisions between player and all falling objects
  const checkCollisions = useCallback(() => {
    const pLeft = playerX;
    const pRight = playerX + 30;
    const pTop = 370; // Player is positioned at the bottom
    const pBottom = 400;
    
    for (const obj of fallingObjects) {
      const dLeft = obj.x;
      const dRight = obj.x + 24;
      const dTop = obj.y;
      const dBottom = obj.y + 24;
      
      const hitX = pRight > dLeft && pLeft < dRight;
      const hitY = pBottom > dTop && pTop < dBottom;
      
      if (hitX && hitY) {
        setGameOver(true);
        playHit();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Show leaderboard after a short delay
        if (score > 0) {
          setTimeout(() => {
            setShowLeaderboard(true);
          }, 1000);
        }
        break;
      }
    }
  }, [playerX, fallingObjects, playHit, score]);
  
  // Update falling objects
  const updateFallingObjects = useCallback((deltaTime: number) => {
    // Maybe spawn a new poop based on level
    lastPoopTimeRef.current += deltaTime;
    
    // Spawn rate is affected by game level
    const spawnRate = 2000 / gameLevel; // ms between spawns
    if (lastPoopTimeRef.current > spawnRate) {
      lastPoopTimeRef.current = 0;
      setFallingObjects(prev => [...prev, createFallingObject()]);
    }
    
    // Update positions and check if objects have gone off screen
    setFallingObjects(prev => {
      const updatedObjects = prev.map(obj => ({
        ...obj,
        y: obj.y + obj.speed
      }));
      
      // Filter out objects that have gone off screen
      const objectsStillOnScreen = updatedObjects.filter(obj => obj.y <= 400);
      
      // Count objects that went off screen (for score)
      const objectsPassed = updatedObjects.length - objectsStillOnScreen.length;
      
      // Update score if any objects passed
      if (objectsPassed > 0 && !gameOver) {
        setScore(prevScore => {
          const newScore = prevScore + objectsPassed;
          
          // Level up every 10 points
          if (Math.floor(newScore / 10) > Math.floor(prevScore / 10)) {
            const newLevel = Math.min(5, Math.floor(newScore / 10) + 1);
            setGameLevel(newLevel);
            setGameSpeed(prev => prev + 0.2);
          }
          
          // Play success sound for each object that passes
          Array(objectsPassed).fill(0).forEach(() => playSuccess());
          
          return newScore;
        });
      }
      
      return objectsStillOnScreen;
    });
  }, [gameLevel, createFallingObject, gameOver, playSuccess]);
  
  // Show level up effect - in a real component this would be more visual
  const levelRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Apply animation effect when level changes
    if (levelRef.current && gameLevel > 1) {
      levelRef.current.classList.add('pulse');
      setTimeout(() => {
        if (levelRef.current) {
          levelRef.current.classList.remove('pulse');
        }
      }, 500);
    }
  }, [gameLevel]);
  
  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (prevTimeRef.current === null) {
      prevTimeRef.current = timestamp;
      lastPoopTimeRef.current = 0;
    }
    
    const deltaTime = timestamp - prevTimeRef.current;
    prevTimeRef.current = timestamp;
    
    // Move player based on key press or touch
    if (moveLeft && playerX > 0) {
      setPlayerX(prev => Math.max(prev - 3, 0));
    } else if (moveRight && playerX < 270) {
      setPlayerX(prev => Math.min(prev + 3, 270));
    }
    
    // Update falling objects
    updateFallingObjects(deltaTime);
    
    // Check for collisions
    checkCollisions();
    
    // Continue the game loop
    if (!gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [playerX, moveLeft, moveRight, updateFallingObjects, checkCollisions, gameOver]);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      if (e.key === "ArrowLeft" && playerX > 0) {
        setPlayerX(prev => Math.max(prev - 15, 0));
      } else if (e.key === "ArrowRight" && playerX < 270) {
        setPlayerX(prev => Math.min(prev + 15, 270));
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerX, gameOver]);
  
  // Start game loop
  useEffect(() => {
    if (phase === "playing" && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, gameLoop, gameOver]);
  
  // Initialize game
  useEffect(() => {
    start();
  }, [start]);
  
  // Handle score submission
  const handleSubmitScore = async (playerName: string) => {
    try {
      await apiRequest('/api/leaderboard', {
        method: 'POST',
        data: {
          playerName,
          score,
          level: gameLevel
        }
      });
      console.log('Score submitted successfully');
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };
  
  // Restart game function
  const restartGame = () => {
    setPlayerX(135);
    setScore(0);
    setGameSpeed(4);
    setGameOver(false);
    setGameLevel(1);
    setFallingObjects([]);
    setShowLeaderboard(false); // Close leaderboard if it's open
    lastPoopTimeRef.current = 0;
    prevTimeRef.current = null;
    start();
  };
  
  // Handle mouse/touch drag events
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameOver) return;
    
    setIsDragging(true);
    
    // Get the x position based on mouse or touch
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
      
    setDragStartX(clientX);
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
  };
  
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || gameOver) return;
    
    // Get the x position based on mouse or touch
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    
    // Calculate how far we've moved
    const deltaX = clientX - dragStartX;
    
    // Update drag start for next move
    setDragStartX(clientX);
    
    // Move the player by the amount moved
    setPlayerX(prev => {
      const newPos = prev + deltaX;
      return Math.min(Math.max(newPos, 0), 270);
    });
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  return (
    <div className="game-container">
      <h1>이성열 피하기</h1>
      
      <div className="upload-area">
        <label>
          👤 캐릭터 이미지:
          <input type="file" accept="image/*" onChange={handlePlayerImageUpload} />
        </label>
        <label>
          이성열 이미지:
          <input type="file" accept="image/*" onChange={handlePoopImageUpload} />
        </label>
      </div>
      
      <div className="game-and-leaderboard">
        <div className="game-section">
          <div 
            className="game-area" 
            ref={gameAreaRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div className="level-indicator" ref={levelRef}>
              레벨: {gameLevel}
            </div>
            
            <div 
              className="player" 
              style={{ 
                left: `${playerX}px`,
                backgroundImage: playerImage ? `url(${playerImage})` : 'none'
              }}
            >
              {!playerImage && "🙂"}
            </div>
            
            {fallingObjects.map(obj => (
              <div 
                key={obj.id}
                className="poop" 
                style={{ 
                  left: `${obj.x}px`, 
                  top: `${obj.y}px`,
                  backgroundImage: poopImage ? `url(${poopImage})` : 'none'
                }}
              >
                {!poopImage && "💩"}
              </div>
            ))}
          </div>
          
          <p className="status" style={{ color: gameOver ? 'red' : 'black' }}>
            {gameOver ? `💥 Game Over! 점수: ${score}` : `점수: ${score}`}
          </p>
          
          <div className="game-buttons">
            <button onClick={restartGame}>다시하기</button>
            {gameOver && (
              <button onClick={() => setShowLeaderboard(true)}>점수 등록하기</button>
            )}
          </div>
        </div>
        
        <div className="leaderboard-section">
          <PermanentLeaderboard />
        </div>
      </div>
      
      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentScore={score}
        currentLevel={gameLevel}
        onSubmitScore={handleSubmitScore}
      />
    </div>
  );
}

export default App;
