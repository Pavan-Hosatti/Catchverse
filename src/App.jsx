import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import './styles/main.css';
// Removed Framer Motion import to eliminate potential animation conflicts

const getRandomX = () => Math.floor(Math.random() * (window.innerWidth - 70));

export default function App() {
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState([]);
  const [lives, setLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHeartLost, setShowHeartLost] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  // Initialize canSpawnBalls to true by default
  const [canSpawnBalls, setCanSpawnBalls] = useState(true);

  const ballId = useRef(0);
  const animationFrame = useRef();
  const spawnTimer = useRef(0);
  const speedFactor = useRef(1);
  // Removed unused lastClickTime state
  const finalScore = useRef(0);
  const gameOverRef = useRef(null);

  useEffect(() => {
    const storedData = localStorage.getItem("catchverse-leaderboard");
    if (storedData) {
      setLeaderboard(JSON.parse(storedData));
    }
  }, []);

  useLayoutEffect(() => {
    if (gameOverRef.current) {
      if (gameOver) gameOverRef.current.classList.add('active');
      else gameOverRef.current.classList.remove('active');
    }
  }, [gameOver]);

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      setShowInstructions(true);
    }
  };

  const startGame = () => {
    console.log('Starting game...');

    // First, ensure any existing animation is canceled
    cancelAnimationFrame(animationFrame.current);

    // Make sure there are no balls at all before starting
    setBalls([]);

    // Reset all game state
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameActive(true);

    // Reset all refs
    ballId.current = 0;
    spawnTimer.current = 0; // Reset spawn timer to prevent immediate ball spawning

    // Reset the current level
    setCurrentLevel(1);

    // Clear the clicked balls and heart lost balls sets
    clickedBalls.current.clear();
    heartLostBalls.current.clear();

    // Enable ball spawning immediately
    setCanSpawnBalls(true);

    // Start animation
    animate();

    // Double-check that ball spawning is enabled after a delay
    setTimeout(() => {
      console.log('Checking if ball spawning is enabled...');
      if (!canSpawnBalls) {
        console.log('Forcing ball spawning to be enabled');
        setCanSpawnBalls(true);
      }
    }, 1000);
  };

  const endGame = () => {
    // Disable ball spawning immediately
    setCanSpawnBalls(false);

    setGameActive(false);
    setGameOver(true);
    cancelAnimationFrame(animationFrame.current);
    finalScore.current = score;

    // Clear the clicked balls set when the game ends
    clickedBalls.current.clear();

    const updated = [...leaderboard, { name: playerName, score: finalScore.current }];
    updated.sort((a, b) => b.score - a.score);
    setLeaderboard(updated);
    localStorage.setItem("catchverse-leaderboard", JSON.stringify(updated));
  };

  // Function to reset game state when clicking Play Again
  const resetGame = () => {
    console.log('Resetting game...');

    // Cancel any existing animation frame
    cancelAnimationFrame(animationFrame.current);

    // Clear all balls immediately
    setBalls([]);

    // Reset all refs
    ballId.current = 0;
    spawnTimer.current = 0;

    // Clear all sets
    clickedBalls.current.clear();
    heartLostBalls.current.clear();

    // Reset game state
    setGameOver(false);
    setShowInstructions(true);

    // Make sure canSpawnBalls is true for the next game start
    setCanSpawnBalls(true);
  };

  const getRandomBallType = () => {
    const rand = Math.random();
    if (rand < 0.75) return 'white';
    else if (rand < 0.90) return 'red';
    else return 'green';
  };

  const showHeartLostPopup = () => {
    setShowHeartLost(true);
    setTimeout(() => setShowHeartLost(false), 800);
  };

  const animate = () => {
    // Request the next animation frame first
    animationFrame.current = requestAnimationFrame(animate);

    // Increment the spawn timer
    spawnTimer.current += 1;

    // Base speed for ball movement
    const baseSpeed = 3;

    // Simple spawn interval based on level
    const spawnInterval = currentLevel <= 4 ?
      Math.max(10, Math.floor(60 / Math.sqrt(currentLevel))) :
      Math.max(5, Math.floor(20 / currentLevel));

    // Debug logging
    console.log(`Animation frame: Score=${score}, Level=${currentLevel}, CanSpawn=${canSpawnBalls}, Timer=${spawnTimer.current}, Interval=${spawnInterval}`);

    // If we're in active gameplay but canSpawnBalls is false, enable it
    if (gameActive && !canSpawnBalls) {
      console.log('Game is active but canSpawnBalls is false, enabling it');
      setCanSpawnBalls(true);
    }

    // Spawn new balls if allowed and timer reached interval
    if (canSpawnBalls && spawnTimer.current >= spawnInterval) {
      const type = getRandomBallType();
      console.log(`Spawning a new ${type} ball`);

      // Add a new ball
      setBalls(prev => {
        const newBalls = [...prev, { id: ballId.current++, x: getRandomX(), y: 0, type }];
        console.log(`Balls count: ${newBalls.length}`);
        return newBalls;
      });

      // Reset spawn timer
      spawnTimer.current = 0;
    }

    // Move existing balls down and remove those that are out of bounds
    setBalls(prev => {
      // Skip if no balls
      if (prev.length === 0) return prev;

      return prev
        .map(ball => ({
          ...ball,
          y: ball.y + baseSpeed * speedFactor.current,
        }))
        .filter(ball => {
          // Check if ball is out of bounds
          if (ball.y >= window.innerHeight) {
            // Handle white balls that cause heart loss
            if (ball.type === 'white' && !heartLostBalls.current.has(ball.id)) {
              // Mark this ball as having caused heart loss
              heartLostBalls.current.add(ball.id);

              setLives(l => {
                const newLives = l - 1;
                if (newLives < l) showHeartLostPopup();
                if (newLives <= 0) endGame();
                return newLives;
              });
            }
            return false; // Remove the ball
          }
          return true; // Keep the ball
        });
    });
  };

  // Cleanup animation frame when component unmounts
  useEffect(() => {
    return () => cancelAnimationFrame(animationFrame.current);
  }, []);

  // Cleanup animation frame when game state changes
  useEffect(() => {
    if (gameActive) {
      // When game becomes active, ensure ball spawning is enabled
      console.log('Game became active, ensuring ball spawning is enabled');
      setCanSpawnBalls(true);
    } else {
      // When game becomes inactive
      cancelAnimationFrame(animationFrame.current);
      // Also ensure balls are cleared when game is not active
      if (!gameOver) {
        setBalls([]);
      }
    }
  }, [gameActive, gameOver]);

  // Log when canSpawnBalls changes
  useEffect(() => {
    console.log(`canSpawnBalls changed to: ${canSpawnBalls}`);
  }, [canSpawnBalls]);

  // Add a useEffect to update the speed factor when score changes
  useEffect(() => {
    // Calculate difficulty level based on score
    let difficultyLevel = 1;

    // Keep level 1 until score 5 for easier start
    if (score < 5) difficultyLevel = 1;
    else if (score >= 5 && score < 10) difficultyLevel = 2;
    else if (score >= 10 && score < 15) difficultyLevel = 3;
    else if (score >= 15 && score < 20) difficultyLevel = 4;
    else if (score >= 20 && score < 25) difficultyLevel = 5;
    else if (score >= 25 && score < 30) difficultyLevel = 6;
    else if (score >= 30 && score < 35) difficultyLevel = 7;
    else if (score >= 35 && score < 40) difficultyLevel = 8;
    else if (score >= 40 && score < 45) difficultyLevel = 9;
    else if (score >= 45) difficultyLevel = 10;

    // Calculate speed factor based on difficulty level
    let difficultyFactor;

    // Level 1: No speed increase (factor = 1.0)
    if (difficultyLevel === 1) {
      difficultyFactor = 1.0;
    }
    // Levels 2-4: Moderate speed increases
    else if (difficultyLevel <= 4) {
      // More gradual progression for levels 2-4
      difficultyFactor = 1.0 + ((difficultyLevel - 1) * 0.3); // +30% per level
    }
    // Level 5: Bigger jump but still manageable
    else if (difficultyLevel === 5) {
      difficultyFactor = 2.5; // 150% faster than base
    }
    // Levels 6+: More significant increases
    else {
      // Start from level 5 speed and add 50% per level
      difficultyFactor = 2.5 + ((difficultyLevel - 5) * 0.5);
    }

    // Update the speed factor ref
    speedFactor.current = difficultyFactor;

    // Show level up notification when difficulty level changes
    if (difficultyLevel > currentLevel) {
      setCurrentLevel(difficultyLevel);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 800); // Reduced from 1500ms to 800ms
    }

    console.log(`[SCORE CHANGE] Score: ${score}, Level: ${difficultyLevel}, Speed Factor: ${difficultyFactor}`);
  }, [score, currentLevel]);

  // Add touch event handling for mobile devices
  useEffect(() => {
    // Prevent scrolling while playing
    const handleTouchMove = (e) => {
      if (gameActive) {
        e.preventDefault();
      }
    };

    // Prevent double-tap zoom on mobile
    const handleTouchEnd = (e) => {
      if (gameActive) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameActive]);

  // Create a ref to track balls that have been clicked
  const clickedBalls = useRef(new Set());
  // Create a ref to track balls that have already caused heart loss
  const heartLostBalls = useRef(new Set());
  // Create a ref to track the last time we processed a click
  const lastProcessedClick = useRef(0);

  // Direct DOM event handler for ball clicks - more reliable than React's synthetic events
  useEffect(() => {
    if (!gameActive) return;

    // Create a function to handle all click/touch events
    const handleGlobalClick = (e) => {
      // Only process clicks during active gameplay
      if (!gameActive) return;

      // Find the clicked element
      const target = e.target;
      if (!target.classList.contains('falling-item')) return;

      // Get the ball ID from the data attribute
      const ballId = parseInt(target.dataset.ballId);
      if (isNaN(ballId)) return;

      // Get the ball type from the class
      let ballType = null;
      if (target.classList.contains('white')) ballType = 'white';
      else if (target.classList.contains('green')) ballType = 'green';
      else if (target.classList.contains('red')) ballType = 'red';
      if (!ballType) return;

      // Process the click
      processBallClick(ballId, ballType);

      // For white balls, add a visual feedback by adding a 'clicked' class
      if (ballType === 'white') {
        target.classList.add('clicked');
        // Also immediately hide the ball visually
        target.style.opacity = '0';
      }

      // Prevent default behavior and stop propagation
      e.preventDefault();
      e.stopPropagation();
    };

    // Add global click and touch handlers
    document.addEventListener('click', handleGlobalClick, { capture: true });
    document.addEventListener('touchstart', handleGlobalClick, { capture: true });

    // Also add mousedown for even faster response
    document.addEventListener('mousedown', handleGlobalClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
      document.removeEventListener('touchstart', handleGlobalClick, { capture: true });
      document.removeEventListener('mousedown', handleGlobalClick, { capture: true });
    };
  }, [gameActive]);

  // Separate function to process ball clicks
  const processBallClick = (id, type) => {
    // Implement a very short time-based debounce (20ms) - just enough to prevent double clicks
    const now = Date.now();
    if (now - lastProcessedClick.current < 20) return;
    lastProcessedClick.current = now;

    // If this ball has already been clicked, ignore
    if (clickedBalls.current.has(id)) {
      console.log(`Ball ${id} already clicked, ignoring`);
      return;
    }

    // Mark this ball as clicked immediately
    clickedBalls.current.add(id);
    console.log(`Processing click on ball ${id} of type ${type}`);

    // Remove the ball from state - use a callback to ensure we're working with the latest state
    setBalls(prev => {
      // Double-check that the ball still exists in the array
      const ballExists = prev.some(ball => ball.id === id);
      if (!ballExists) {
        console.log(`Ball ${id} no longer exists in state`);
        return prev;
      }
      return prev.filter(ball => ball.id !== id);
    });

    // Process the ball type effects
    if (type === 'white') {
      setScore(prev => prev + 1);
    } else if (type === 'green') {
      setLives(prev => Math.min(prev + 1, 5));
    } else if (type === 'red') {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives < prev) showHeartLostPopup();
        if (newLives <= 0) endGame();
        return newLives;
      });
    }

    // Clean up clicked balls set periodically
    if (clickedBalls.current.size > 100) {
      clickedBalls.current = new Set();
    }
  };

  // Legacy handler for React events (as a fallback)
  const handleClick = (id, type) => {
    processBallClick(id, type);
  };

  const handleShareScore = () => {
    const shareText = `🎮 I just scored ${score} points in Catchverse! Think you can beat me? 🔥`;
    navigator.clipboard.writeText(shareText).then(() => alert('Score copied!')).catch(() => {});
    if (navigator.share) {
      navigator.share({ title: 'Catchverse Score', text: shareText, url: window.location.href }).catch(() => {});
    }
  };

  return (
    <div className="game-container">
      {!playerName && (
        <div className="name-form">
          <h2>Enter Your Name</h2>
          <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Your Name..." />
          <button onClick={handleNameSubmit}>Submit</button>
        </div>
      )}

      {!gameActive && showInstructions && !gameOver && (
        <div className="instructions-box">
          <h2>🎮 Welcome, <span className="player-name">{playerName}</span>!</h2>
          <p>⚪ Tap white balls to score</p>
          <p>🟢 Catch green balls to gain a ❤️</p>
          <p>🔴 Avoid red balls — they remove ❤️</p>
          <button className="start-button" onClick={startGame}>🚀 Start Game</button>
        </div>
      )}

      {gameActive && (
        <>
          <div className="score-heart-box">
            <h2 className="score">Score: {score}</h2>
            <div className="hearts">
              {Array.from({ length: lives }).map((_, i) => (
                <span key={i} className="heart">❤️</span>
              ))}
            </div>
          </div>

          {balls.map(ball => (
            <div
              key={ball.id}
              className={`falling-item ${ball.type}`}
              style={{ left: ball.x, top: ball.y }}
              data-ball-id={ball.id}
              onClick={() => handleClick(ball.id, ball.type)}
              onTouchStart={() => handleClick(ball.id, ball.type)}
            />
          ))}

          {showHeartLost && (
            <div className="heart-lost-popup">💔 You lost a heart!</div>
          )}

          {showLevelUp && (
            <div className={`level-up-popup ${currentLevel >= 5 ? 'extreme' : ''}`}>
              {currentLevel >= 5 ? '💥💥💥 EXTREME ' : '🚀 '}
              LEVEL {currentLevel}!
              Speed {currentLevel === 1 ?
                // Level 1: No speed increase
                0 :
                currentLevel <= 4 ?
                  // Levels 2-4: +30% per level
                  Math.round(((currentLevel - 1) * 0.3) * 100) :
                currentLevel === 5 ?
                  // Level 5: 150% faster
                  150 :
                  // Levels 6+: 150% + 50% per level above 5
                  Math.round((2.5 + ((currentLevel - 5) * 0.5) - 1) * 100)
              }% FASTER!
              {currentLevel >= 5 && <div className="warning">INSANE MODE!</div>}
            </div>
          )}
        </>
      )}

      {gameOver && (
        <div className="game-over-box" ref={gameOverRef}>
          <h2>Game Over, {playerName}!</h2>
          <p>Your Score: <strong>{score}</strong></p>
          <h3>🏆 Leaderboard</h3>
          <ul>
            {leaderboard.map((entry, idx) => (
              <li key={idx}>{entry.name} - {entry.score}</li>
            ))}
          </ul>
          <div className="game-over-buttons">
            <button className="btn" onClick={resetGame}>Play Again</button>
            <button className="btn" onClick={() => { setPlayerName(''); setShowInstructions(false); setGameOver(false); }}>Exit</button>
            <button className="btn" onClick={handleShareScore}>Share</button>
          </div>
        </div>
      )}
    </div>
  );
}







































