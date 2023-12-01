import React, { useState, useEffect } from "react";
import './Board.css';

export function Board({ playerNumber, sendJsonMessage, lastJsonMessage }) {
    const [size, setSize] = useState(19);
    const [stones, setStones] = useState({});
    const [nextStoneColor, setNextStoneColor] = useState('black');
    const [gameOver, setGameOver] = useState(false);
    const [winningStones, setWinningStones] = useState([]);
    const [hoveredIntersection, setHoveredIntersection] = useState(null);
    const [boardId, setBoardId] = useState(null);

    useEffect(() => {
      if (lastJsonMessage) {
        console.log('New message in Board component:', lastJsonMessage);
        if (lastJsonMessage.board){
          console.log('Board', lastJsonMessage);

          setStones(lastJsonMessage.board.stones);
          setBoardId(lastJsonMessage.BoardId); // Assuming board ID is sent in the message
          console.log('Ud', lastJsonMessage.BoardId);


        }

      }
    }, [lastJsonMessage]);
  
    const handleMouseEnter = (row, col) => {
      setHoveredIntersection({ row, col });
    };
  
    const handleMouseLeave = () => {
      setHoveredIntersection(null);
    };
    const restartGame = () => {
        setStones({});
        setGameOver(false);
        setWinningStones([]);
        setNextStoneColor('black'); 
    };

    const checkForWinner = (newStones) => {
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const color = newStones[`${row},${col}`];
                if (color) {
                    let winningStones;
                    if (winningStones = isConsecutive(newStones, row, col, 0, 1, color) ||
                        isConsecutive(newStones, row, col, 1, 0, color) ||
                        isConsecutive(newStones, row, col, 1, 1, color) ||
                        isConsecutive(newStones, row, col, 1, -1, color)) {
                        return winningStones;
                    }
                }
            }
        }
        return false;
    };

    const isConsecutive = (stones, row, col, rowDelta, colDelta, color) => {
        let winningStones = [[row, col]];
        for (let i = 1; i < 5; i++) {
            const nextRow = row + i * rowDelta;
            const nextCol = col + i * colDelta;
            if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
                return false;
            }
            if (stones[`${nextRow},${nextCol}`] !== color) {
                return false;
            }
            winningStones.push([nextRow, nextCol]);
        }
        return winningStones;
    };




    const placeStone = (row, col) => {
        const key = `${row},${col}`;
        if (boardId && !stones[key] && !gameOver) {
          const newStones = {
                ...stones,
                [key]: nextStoneColor
            };
            // setStones(newStones);
            sendJsonMessage({
              action: "placestone",
              boardId: boardId,

              row: row,
              col: col,
              color: nextStoneColor // Assuming you also need to send the color

            });
            setNextStoneColor(nextStoneColor === 'black' ? 'white' : 'black');
            const result = checkForWinner(newStones);
            if (result) {
                setGameOver(true);
                setWinningStones(result);
            }
        }
        
    };

    return (
        <div className="board">
          {gameOver && (
            <div className="overlay">
              Done
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