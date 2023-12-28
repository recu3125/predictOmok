import React, { useState, useEffect, useRef } from "react";
import './Board.css';

export function Board({ playerNumber, sendJsonMessage, lastJsonMessage }) {
  const [size, setSize] = useState(19);
  const [stones, setStones] = useState({});
  const [nextStoneColor, setNextStoneColor] = useState('');
  // const [nextStoneColor, setNextStoneColor] = useState('black');

  const [gameOver, setGameOver] = useState(false);
  const [winningStones, setWinningStones] = useState([]);
  const [hoveredIntersection, setHoveredIntersection] = useState(null);
  const [boardId, setBoardId] = useState('');
  const [boardUsers, setBoardUsers] = useState('');
  const [usersList, setUsersList] = useState('');
  const myUuid = useRef(null)
  const [boardState, setBoardState] = useState('waiting for other player..');
  useEffect(() => {
    sendJsonMessage({
      action: "reqUuid"
    });
  }, []);
  useEffect(() => {
    let gameoverVar = gameOver
    if (lastJsonMessage) {
      if (lastJsonMessage.uuid) {
        myUuid.current = lastJsonMessage.uuid
        setUsersList(boardUsers.map(user => {
          console.log(user.uuid, lastJsonMessage.uuid)
          let stoneIcon;
          if (user.stoneColor === 'white') {
            stoneIcon = <p className="stoneIcon" style={{ color: '#FFF', textShadow: '-1px 0 #000, 0 1px #000, 1px 0 #000, 0 -1px #000' }}>⬤</p>;
          } else if (user.stoneColor === 'black') {
            stoneIcon = <p className="stoneIcon" style={{ color: '#000', textShadow: '-1px 0 #FFF, 0 1px #FFF, 1px 0 #FFF, 0 -1px #FFF' }}>⬤</p>;
          } else {
            stoneIcon = <p className="stoneIcon" style={{ color: '#AAF', textShadow: '-1px 0 #33F, 0 1px #33F, 1px 0 #33F, 0 -1px #33F' }}>👁</p>;
          }
          return (
            <div className="userRow">
              {stoneIcon}<p className={`${lastJsonMessage.uuid == user.uuid ? "selfName" : "userName"}`}>{user.username}</p><br></br>
            </div>
          )
        }))
      }
      if (lastJsonMessage.action === 'gameOver') {
        console.log('gameover', lastJsonMessage);
        setGameOver(true);
        gameoverVar = true
        setWinningStones(lastJsonMessage.winningStones);
      }
      if (lastJsonMessage.board) {
        switch (lastJsonMessage.board.state) {
          case 'waiting':
            setBoardState('waiting for\nother player..')
            break;
          case 'black':
            setBoardState('black\'s turn')
            break;
          case 'white':
            setBoardState('white\'s turn')
            break;

        }
        console.log('board', lastJsonMessage);
        if (!gameoverVar) {
          setStones(lastJsonMessage.board.stones);
          console.log('board_stones\n', lastJsonMessage.board.stones)
          setBoardId(lastJsonMessage.BoardId);
        }
        let boardUsersVar = lastJsonMessage.board.users.map(uuid => ({ uuid: uuid, username: lastJsonMessage.users[uuid].username, stoneColor: lastJsonMessage.users[uuid].stoneColor }))
        setBoardUsers(boardUsersVar)
        setUsersList(boardUsersVar.map(user => {
          console.log(user.uuid, myUuid.current)
          let stoneIcon;
          if (user.stoneColor === 'white') {
            stoneIcon = <p className="stoneIcon" style={{ color: '#FFF', textShadow: '-1px 0 #000, 0 1px #000, 1px 0 #000, 0 -1px #000' }}>⬤</p>;
          } else if (user.stoneColor === 'black') {
            stoneIcon = <p className="stoneIcon" style={{ color: '#000', textShadow: '-1px 0 #FFF, 0 1px #FFF, 1px 0 #FFF, 0 -1px #FFF' }}>⬤</p>;
          } else {
            stoneIcon = <p className="stoneIcon" style={{ color: '#AAF', textShadow: '-1px 0 #33F, 0 1px #33F, 1px 0 #33F, 0 -1px #33F' }}>👁</p>;
          }
          return (
            <div className="userRow">
              {stoneIcon}<p className={`${myUuid.current == user.uuid ? "selfName" : "userName"}`}>{user.username}</p><br></br>
            </div>
          )
        }))
      }
      if (lastJsonMessage.userColor) {
        console.log('usercolor', lastJsonMessage);
        setNextStoneColor(lastJsonMessage.userColor);
      }
    }
  }, [lastJsonMessage]);

  function handleMouseEnter(row, col) {
    setHoveredIntersection({ row, col });
  };

  function handleMouseLeave() {
    setHoveredIntersection(null);
  };
  function restartGame() {
    setStones({});
    sendJsonMessage({
      action: "restart",
      boardId: boardId,
    });
    setGameOver(false);
    setStones([]);
    setWinningStones([]);
  };

  function placeStone(row, col) {
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
      <div className="sidebar">
        <p className="boardId">#{boardId}</p>
        <br></br>
        {usersList}
        <br></br>
        <p className="boardState">{boardState}</p>
      </div>
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