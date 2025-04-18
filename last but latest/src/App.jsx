



import React, { useEffect, useRef, useState } from 'react';
import './styles/main.css';
import { motion } from 'framer-motion';

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

  const ballId = useRef(0);
  const animationFrame = useRef();
  const spawnTimer = useRef(0);
  const speedFactor = useRef(1.2);
  const [isClicking, setIsClicking] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // ✅ Load leaderboard from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem("catchverse-leaderboard");
    if (storedData) {
      setLeaderboard(JSON.parse(storedData));
    }
  }, []);

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      setShowInstructions(true);
    }
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setBalls([]);
    setGameOver(false);
    setGameActive(true);
    ballId.current = 0;
    animate();
  };

  const endGame = () => {
    setGameActive(false);
    setGameOver(true);
    cancelAnimationFrame(animationFrame.current);
    const updated = [...leaderboard, { name: playerName, score }];
    updated.sort((a, b) => b.score - a.score);
    setLeaderboard(updated);
    // ✅ Save to localStorage
    localStorage.setItem("catchverse-leaderboard", JSON.stringify(updated));
  };


  const getRandomBallType = () => {
    const rand = Math.random();
    if (rand < 0.75) return 'white';
    else if (rand < 0.90) return 'red';
    else return 'green';
  };

  const animate = () => {
    animationFrame.current = requestAnimationFrame(animate);
    spawnTimer.current += 1;
    const spawnInterval = Math.max(15, 50 - Math.floor(score / 5) * 2);

    if (score > 90) speedFactor.current = 2.0;
    else if (score > 80) speedFactor.current = 1.9;
    else if (score > 70) speedFactor.current = 1.8;
    else if (score > 60) speedFactor.current = 1.7;
    else if (score > 50) speedFactor.current = 1.6;
    else if (score > 40) speedFactor.current = 1.5;
    else if (score > 30) speedFactor.current = 1.4;
    else if (score > 20) speedFactor.current = 1.3;
    else if (score > 10) speedFactor.current = 1.2;
    else if (score > 5) speedFactor.current = 1.1;
    else speedFactor.current = 1.0;

    if (spawnTimer.current >= spawnInterval) {
      const type = getRandomBallType();
      setBalls(prev => [
        ...prev,
        { id: ballId.current++, x: getRandomX(), y: 0, type },
      ]);
      spawnTimer.current = 0;
    }

    setBalls(prev =>
      prev
        .map(ball => ({
          ...ball,
          y: ball.y + 3 + score * 0.05 * speedFactor.current,
        }))
        .filter(ball => {
          if (ball.y >= window.innerHeight) {
            if (ball.type === 'white') {
              setLives(l => {
                if (l - 1 <= 0) endGame();
                return l - 1;
              });
            }
            return false;
          }
          return true;
        })
    );
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animationFrame.current);
  }, []);

  const handleClick = (id, type) => {
    const currentTime = Date.now();
    const timeDifference = currentTime - lastClickTime;
    if (timeDifference < 200) return;
    setLastClickTime(currentTime);
    setIsClicking(true);

    setBalls(prev => prev.filter(ball => ball.id !== id));

    if (type === 'white') {
      setScore(prev => prev + 1);
    } else if (type === 'green') {
      setLives(prev => Math.min(prev + 1, 5));
    } else if (type === 'red') {
      setLives(prev => {
        if (prev - 1 <= 0) endGame();
        return prev - 1;
      });
    }

    setTimeout(() => setIsClicking(false), 200);
  };

  const handleTouch = (id, type) => {
    handleClick(id, type);
  };

  const handleShareScore = () => {
    const shareText = `🎮 I just scored ${score} points in Catchverse! Think you can beat me? 🔥`;
  
    // Copy to clipboard
    navigator.clipboard.writeText(shareText)
      .then(() => alert('Score copied! Share it with your friends 🎉'))
      .catch(() => alert('Failed to copy score. Try again!'));
  
    // Optional: Use Web Share API (for mobile)
    if (navigator.share) {
      navigator.share({
        title: 'Catchverse Score',
        text: shareText,
        url: window.location.href,
      }).catch(() => {
        // User cancelled sharing or not supported
      });
    }
  };
  

  

  return (
    <div className="game-container">
      {!playerName && (
        <div className="name-form">
          <h2>Enter Your Name</h2>
          <input
            type="text"
            className="placeholder"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Type your name..."
          />
          <button onClick={handleNameSubmit}>Submit</button>
        </div>
      )}

      {!gameActive && showInstructions && !gameOver && (
        <div className="instructions-box">
          <h2>🎮 Welcome, <span className="player-name">{playerName}</span>!</h2>
          <div className="instructions-list">
            <p>⚪ <strong>White Balls:</strong> Tap to score! (Some may need 1️⃣, 2️⃣, or even 3️⃣ clicks! but chill 3 click is very rare)</p>
            <p>🟢 <strong>Green Balls:</strong> Catch them to gain a ❤️</p>
            <p>🔴 <strong>Red Balls:</strong> Avoid clicking — they take away your ❤️ not just one but 2!</p>
          </div>
          <p className="challenge-line">Think you've got what it takes to master the chaos? 😎</p>
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
          {balls.map((ball) => (
            <motion.div
              key={ball.id}
              className={`falling-item ${ball.type}`}
              style={{ left: ball.x, top: ball.y }}
              onClick={() => handleClick(ball.id, ball.type)}
              onTouchStart={() => handleTouch(ball.id, ball.type)}
              whileTap={{ scale: 1.2 }}
            />
          ))}
        </>
      )}

      {gameOver && (
        <div className="game-over-box">
          <h2>Game Over, {playerName}!</h2>
          <p>Your Score: <strong>{score}</strong></p>
          <h3>🏆 Leaderboard</h3>
          <ul>
            {leaderboard.map((entry, idx) => (
              <li key={idx}>
                {entry.name} - {entry.score}
              </li>
            ))}
          </ul>
          <div className="game-over-buttons">
            <button className="start-button play_again" onClick={() => {
              setShowInstructions(true);
              setGameOver(false);
            }}>Play Again</button>
            <button className="start-button" onClick={() => {
              setPlayerName('');
              setShowInstructions(false);
              setGameOver(false);
            }}>Exit Game</button>
            <button className="start-button" onClick={handleShareScore}>📤 Share Score</button>

          </div>
        </div>
      )}
    </div>
  );
}


































