import React, { useState, useEffect } from "react";
import './Board.css';

export function Board({ playerNumber, sendJsonMessage, lastJsonMessage }) {
  const [size, setSize] = useState(19);
  const [stones, setStones] = useState({});
  const [nextStoneColor, setNextStoneColor] = useState('');
  // const [nextStoneColor, setNextStoneColor] = useState('black');

  const [gameOver, setGameOver] = useState(false);
  const [winningStones, setWinningStones] = useState([]);
  const [hoveredIntersection, setHoveredIntersection] = useState(null);
  const [boardId, setBoardId] = useState(null);

  useEffect(() => {
    if (lastJsonMessage) {
      console.log('New message in Board component:', lastJsonMessage);
      if (lastJsonMessage.board) {
        console.log('Board', lastJsonMessage);
        setStones(lastJsonMessage.board.stones);
        setBoardId(lastJsonMessage.BoardId);
      }
      if (lastJsonMessage.userColor) {
        console.log('color', lastJsonMessage);
        setNextStoneColor(lastJsonMessage.userColor);
      }
      if (lastJsonMessage.action === 'gameOver') {
        setGameOver(true);
        setWinningStones(lastJsonMessage.winningStones);


      }

    }
  }, [lastJsonMessage]);

  function handleMouseEnter (row, col){
    setHoveredIntersection({ row, col });
  };

  function handleMouseLeave (){
    setHoveredIntersection(null);
  };
  function restartGame (){
    setStones({});
    sendJsonMessage({
      action: "gameOver",
      boardId: boardId,
    });
    setGameOver(false);
    setWinningStones([]);
    setNextStoneColor('black');
  };

  function placeStone (row, col){
    const key = `${row},${col}`;
    if (boardId && !stones[key] && !gameOver) {
        sendJsonMessage({
        action: "placestone",
        boardId: boardId,
        row: row,
        col: col,
        color: nextStoneColor
      });
    }
  };

  return (
    <div className="board">
      {gameOver && (
        <div className="overlay">
          Game Over
          <button onClick={restartGame} className="restart-button">Restart</button>
        </div>
      )}
      {Array.from({ length: size }, (_, row) => (
        <div key={row} className="board-row">
          {Array.from({ length: size }, (_, col) => {
            const key = `${row},${col}`;
            const isWinningStone = winningStones.some(pos => pos[0] === row && pos[1] === col);
            const isHovered = hoveredIntersection && hoveredIntersection.row === row && hoveredIntersection.col === col;
            return (
              <div key={col} className="intersection"
                onClick={() => placeStone(row, col)}
                onMouseEnter={() => handleMouseEnter(row, col)}
                onMouseLeave={handleMouseLeave}>
                {stones[key] &&
                  <div className={`stone ${stones[key]} ${isWinningStone ? 'winning-stone' : ''}`} />
                }
                {isHovered && !stones[key] &&
                  <div className={`stone ${nextStoneColor} transparent`} />
                }
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}