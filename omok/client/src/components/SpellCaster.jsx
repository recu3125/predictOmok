import React, { useState, useEffect, useRef } from "react";
import './spellCaster.css';

export function SpellCaster({ playerNumber, sendJsonMessage, lastJsonMessage }) {
  const [size, setSize] = useState(7);
  const [stones, setStones] = useState({});
  const [nextStoneColor, setNextStoneColor] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragPath, setDragPath] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [combinedWord, setCombinedWord] = useState('');
  const cellRefs = useRef([...Array(size * size)].map(() => React.createRef())); // Create a ref for each cell
  // const [nextStoneColor, setNextStoneColor] = useState('black');

  const [gameOver, setGameOver] = useState(false);
  const [winningStones, setWinningStones] = useState([]);
  const [hoveredIntersection, setHoveredIntersection] = useState(null);
  const [boardId, setBoardId] = useState('');
  const [boardUsers, setBoardUsers] = useState('');
  const [usersList, setUsersList] = useState('');
  const myUuid = useRef(null);
  const [boardState, setBoardState] = useState('waiting for other player..');
  const letters = ["ㄱ", "ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ","ㅏ","ㅑ","ㅓ","ㅕ","ㅗ","ㅛ","ㅣ","ㄱ", "ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ","ㅏ","ㅑ","ㅓ","ㅕ","ㅗ","ㅛ","ㅣ","ㄱ", "ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ","ㅏ","ㅑ","ㅓ","ㅕ","ㅗ","ㅛ","ㅣ"];

  const combineKoreanCharacters = (str) => {
    const fIndexMap = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ',
                       'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ',
                       'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const sIndexMap = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ',
                       'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ',
                       'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
    const tIndexMap = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ',
                       'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ',
                       'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ',
                       'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const specialCombinationMap = {
      'ㄱㄱ': 'ㄲ', 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
      'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ',
      'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
    };    

    const ga = 44032;
    let result = '';
    let f = -1, s = -1, t = -1;
  
    const commitSyllable = () => {
      if (f !== -1 && s !== -1) {
        //unicode stuff to combine the characters
        const uni = ga + (f * 588) + (s * 28) + (t !== -1 ? t : 0);
        result += String.fromCharCode(uni);
      } else if (f !== -1) {
        result += fIndexMap[f];
      }
        else if (s !== -1) {
        result += sIndexMap[s];
      }
      f = -1; s = -1; t = -1;
    };
  
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (fIndexMap.includes(char) && (s === -1 || i === 0 || (i > 0 && !sIndexMap.includes(str[i - 1])))) {
        if (f !== -1) commitSyllable(); 
        f = fIndexMap.indexOf(char);
      } else if (sIndexMap.includes(char)) {
          if (s !== -1){
            commitSyllable();
          }
          s = sIndexMap.indexOf(char);
          if (f == -1){
            commitSyllable();
          }
        
      } else if (tIndexMap.includes(char) && f !== -1 && s !== -1) {
        if (i+1<str.length && sIndexMap.includes(str[i+1])) {
          commitSyllable();
          f = fIndexMap.indexOf(char);
        }
        else if (i+2<str.length && Object.keys(specialCombinationMap).includes(char + str[i+1]) && sIndexMap.includes(str[i+2])){
          t = tIndexMap.indexOf(char);
          commitSyllable();
        }
        else if (i+1<str.length && Object.keys(specialCombinationMap).includes(char + str[i+1])) {
            t = tIndexMap.indexOf(specialCombinationMap[char + str[i+1]]);
            i += 1; // Skip the next character since it's been combined into 't'
            commitSyllable();
          }
          
          else {
          t = tIndexMap.indexOf(char);
          commitSyllable(); 
        }

      } else {
        // Directly add characters not forming a syllable, or commit existing syllable before adding
        if (f !== -1 || s !== -1) commitSyllable();
        result += char;
      }
    };
  
    if (f !== -1 || s !== -1 || t !== -1) commitSyllable(); 
  
    return result;
  };
  

  const handleMouseDown = (row, col, index) => {
    setIsDragging(true);
    const position = calculatePosition(index);
    setDragPath([{ row, col, position }]);
    setCurrentWord(letters[index]);
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragPath([]);
    setCurrentWord(''); // Clear the current word when dragging stops
  };

  const handleMouseEnter = (row, col, index) => {
    if (isDragging && dragPath.length > 0) {
      const lastPos = dragPath[dragPath.length - 1];
      const newPos = { row, col, position: calculatePosition(index) };

      // Check if newPos is adjacent to lastPos and not already in dragPath
      if (isAdjacent(lastPos, newPos) && !dragPath.find(pos => pos.row === row && pos.col === col)) {
        setDragPath((currentPath) => [...currentPath, newPos]);
        
        setCurrentWord((currentWord) => {
          const updatedCurrentWord = `${currentWord}${letters[index]}`;
          setCombinedWord(combineKoreanCharacters(updatedCurrentWord));
          return updatedCurrentWord;
        });
      }
    }
  };

  const isAdjacent = (lastPos, newPos) => {
    return Math.abs(lastPos.row - newPos.row) <= 1 && Math.abs(lastPos.col - newPos.col) <= 1;
  };

  const calculatePosition = (index) => {
    const cell = cellRefs.current[index].current;
    const grid = cell.offsetParent;
    const x = cell.offsetLeft + cell.offsetWidth / 2 - grid.scrollLeft;
    const y = cell.offsetTop + cell.offsetHeight / 2 - grid.scrollTop;
    return { x, y };
  };


  // Use an effect to listen for mouseup events on the window to end dragging
  // even when the mouse is not over a letter.
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragPath([]);
      setCurrentWord(''); // Reset the word when dragging ends
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

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
      
      <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -100px)', zIndex: 3, pointerEvents: 'none', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '5px', borderRadius: '10px', fontSize: '40px',  fontWeight: 'bold', width: '100%'}}>
        {combinedWord}
      </div>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
        {dragPath.map((pos, index) =>
          index < dragPath.length - 1 && (
            <line key={index} x1={pos.position.x} y1={pos.position.y} x2={dragPath[index + 1].position.x} y2={dragPath[index + 1].position.y} stroke="black" strokeWidth="2" />
          )
        )}
      </svg>
      {Array.from({ length: size }, (_, row) => (
        <div key={row} className="board-row">
          {Array.from({ length: size }, (_, col) => {
            const index = row * size + col;
            const isDragging = dragPath.find(pos => pos.row === row && pos.col === col);
            return (
              <div key={col} ref={cellRefs.current[index]} className={`letters ${isDragging ? 'dragging' : ''}`}
                   onMouseDown={() => handleMouseDown(row, col, index)}
                   onMouseEnter={() => handleMouseEnter(row, col, index)}
                   style={{ position: 'relative', zIndex: 2 }}>
                {letters[index]}
              </div>
            );
          })}
        </div>
      ))}
    </div>
    </div>
  );
}