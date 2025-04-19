import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
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
  const [showHeartLost, setShowHeartLost] = useState(false); // 🔥 NEW

  const ballId = useRef(0);
  const animationFrame = useRef();
  const spawnTimer = useRef(0);
  const speedFactor = useRef(1);
  const [lastClickTime, setLastClickTime] = useState(0);
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
    finalScore.current = score;

    const updated = [...leaderboard, { name: playerName, score: finalScore.current }];
    updated.sort((a, b) => b.score - a.score);
    setLeaderboard(updated);
    localStorage.setItem("catchverse-leaderboard", JSON.stringify(updated));
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
    animationFrame.current = requestAnimationFrame(animate);
    spawnTimer.current += 1;

    // 🔥 Adjusting speedFactor
    const baseSpeed = 3;
    const dynamicFactor = 0.08 * score;
    speedFactor.current = 1 + dynamicFactor;

    const spawnInterval = Math.max(15, 50 - Math.floor(score / 5) * 2);

    if (spawnTimer.current >= spawnInterval) {
      const type = getRandomBallType();
      setBalls(prev => [...prev, { id: ballId.current++, x: getRandomX(), y: 0, type }]);
      spawnTimer.current = 0;
    }

    setBalls(prev =>
      prev
        .map(ball => ({
          ...ball,
          y: ball.y + baseSpeed * speedFactor.current,
        }))
        .filter(ball => {
          if (ball.y >= window.innerHeight) {
            if (ball.type === 'white') {
              setLives(l => {
                const newLives = l - 1;
                if (newLives < l) showHeartLostPopup(); // 🎉 show lost heart
                if (newLives <= 0) endGame();
                return newLives;
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
    if (currentTime - lastClickTime < 200) return;
    setLastClickTime(currentTime);

    setBalls(prev => prev.filter(ball => ball.id !== id));

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
            <motion.div
              key={ball.id}
              className={`falling-item ${ball.type}`}
              style={{ left: ball.x, top: ball.y }}
              onClick={() => handleClick(ball.id, ball.type)}
              onTouchStart={() => handleClick(ball.id, ball.type)}
              whileTap={{ scale: 1.2 }}
            />
          ))}

          {showHeartLost && (
            <div className="heart-lost-popup">💔 You lost a heart!</div>
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
            <button className="btn" onClick={() => { setShowInstructions(true); setGameOver(false); }}>Play Again</button>
            <button className="btn" onClick={() => { setPlayerName(''); setShowInstructions(false); setGameOver(false); }}>Exit</button>
            <button className="btn" onClick={handleShareScore}>Share</button>
          </div>
        </div>
      )}
    </div>
  );
}






































