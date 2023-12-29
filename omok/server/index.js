const { WebSocketServer } = require("ws")
const http = require("http")
const uuidv4 = require("uuid").v4
const url = require("url")

const server = http.createServer()
const wsServer = new WebSocketServer({ server })

const port = 8001
const connections = {}
const boards = {}
const users = {}

function joinBoard(uuid, user, boardId) {
  boards[boardId].users.push(uuid);
  user.currentBoard = boardId;
  if (boards[boardId].users.length == 2) {
    boards[boardId].state = 'black';
    user.stoneColor = 'white';
  }
  else if (boards[boardId].users.length == 1) {
    user.stoneColor = 'black';
  }
  //console.log(user.stoneColor)
  broadcastBoardState(boardId);
  sendUserColor(uuid);
}

function handleMessage(bytes, uuid) {
  const message = JSON.parse(bytes.toString())
  //console.log(message)
  const user = users[uuid]
  user.state = message
  broadcastUsers()

  if (message.action === 'placestone' && message.boardId) {
    updateBoard(message.boardId, message.row, message.col, message.color);
  } else if (message.action == 'quickJoin') {
    const boardId = availableBoard(uuid, user);
    joinBoard(uuid, user, boardId)
  } else if (message.action == 'joinBoard') {
    joinBoard(uuid, user, message.boardId)
  } else if (message.action == 'createBoard') {
    const boardId = createBoard(uuid, user)
    joinBoard(uuid, user, boardId)
  } else if (message.action == 'deleteboard') {
    delete boards[user.currentBoard];
    broadcastBoardState(user.currentBoard);
    user.currentBoard = null;
  }
  else if (message.action == 'reqUuid') {
    const connection = connections[uuid];
    if (connection) {
      connection.send(JSON.stringify({ uuid: uuid }));
    }
  }

}
function availableBoard(uuid, user) {
  //console.log(boards);
  for (let boardId in boards) {
    //console.log(boards[boardId].users.length);
    if (boards[boardId].users.length === 1) {
      return boardId;
    }
  }

  return createBoard();

};

function checkForWinner(board, size) {
  const stones = board.stones;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const key = `${row},${col}`;
      const color = stones[key];
      if (color) {
        let winningStones;
        if (winningStones = isConsecutive(stones, row, col, 0, 1, color, size) ||
          isConsecutive(stones, row, col, 1, 0, color, size) ||
          isConsecutive(stones, row, col, 1, 1, color, size) ||
          isConsecutive(stones, row, col, 1, -1, color, size)) {
          return winningStones;
        }
      }
    }
  }
  return false;
}

function isConsecutive(stones, row, col, rowDelta, colDelta, color, size) {
  let winningStones = [[row, col]];
  for (let i = 1; i < 5; i++) {
    const nextRow = row + i * rowDelta;
    const nextCol = col + i * colDelta;
    if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
      return false;
    }
    const key = `${nextRow},${nextCol}`;
    if (stones[key] !== color) {
      return false;
    }
    winningStones.push([nextRow, nextCol]);
  }
  return winningStones;
}


function resetBoard(boardId) {
  if (!boards[boardId]) {
    console.error(`Board ${boardId} not found for reset`);
    return;
  }
  boards[boardId].stones = {};
  delete boards[boardId].winner;
  delete boards[boardId].winningStones;
}

function createBoard(uuid, user) {
  function randomString(boards, length) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const result = alphabet[Math.floor(Math.random() * alphabet.length)] + alphabet[Math.floor(Math.random() * alphabet.length)] + alphabet[Math.floor(Math.random() * alphabet.length)] + alphabet[Math.floor(Math.random() * alphabet.length)]
    if (boards[result]) {
      return randomString(boards, length)
    }
    return result
  }
  const newBoardId = randomString(boards, 4)


  boards[newBoardId] = { stones: {}, users: [], state: "waiting" };
  return newBoardId;
}

function updateBoard(boardId, row, col, color) {
  //console.log(boards);
  if (!boards[boardId]) { console.log(`Board ${boardId} not found`); return; }
  if (boards[boardId].state == "waiting") { console.log(`stone placed while waiting player`); return; }
  if (boards[boardId].state !== color) { console.error(`${color ? color : 'spectator'} stone placed in turn ${boards[boardId].state}`); return; }

  boards[boardId].stones[`${row},${col}`] = color;
  const winningStones = checkForWinner(boards[boardId], 19);
  if (winningStones) {
    boards[boardId].winner = color;
    boards[boardId].winningStones = winningStones;
    broadcastGameOver(boardId, color, winningStones);
    broadcastBoardState(boardId);
    resetStoneColor(boardId);
    resetBoard(boardId);
    boards[boardId].state = 'black'
  } else {
    boards[boardId].state = (boards[boardId].state === "white" ? "black" : "white");
    broadcastBoardState(boardId);
  }
};

function broadcastBoardState(boardId) {
  if (boards[boardId]) {
    const message = JSON.stringify({ board: boards[boardId], users: users, BoardId: boardId });
    Object.keys(connections).forEach((uuid) => {
      if (users[uuid].currentBoard === boardId) {
        const connection = connections[uuid];
        //console.log(`Broadcasting to ${users[uuid].username} on board ${boardId}`);
        connection.send(message);
      }
    });
  } else {
    console.log(`Board ${boardId} not found for broadcasting`);
  }
}

function broadcastGameOver(boardId, winner, winningStones) {
  console.log(`gameover ${boardId}`)
  const gameOverMessage = JSON.stringify({
    action: 'gameOver',
    boardId: boardId,
    winner: winner,
    winningStones: winningStones
  });
  Object.keys(connections).forEach((uuid) => {
    if (users[uuid].currentBoard === boardId) {
      const connection = connections[uuid];
      connection.send(gameOverMessage);
    }
  });
};

// function broadcastUserColor (uuid){
// Object.keys(users).forEach((uuid) => {
//   const user = users[uuid];
//   const colorMessage = JSON.stringify({ userColor: user.stoneColor });
//   const connection = connections[uuid];
//   if (connection) {
//     connection.send(colorMessage);
//   }
// });
// };

function sendUserColor(uuid) {
  if (!users[uuid]) return;
  const user = users[uuid];
  const colorMessage = JSON.stringify({ userColor: user.stoneColor });
  const connection = connections[uuid];
  if (connection) {
    connection.send(colorMessage);
  }
};

function resetStoneColor(boardId) {
  console.log(`resetting stone color. ${boardId}`)
  if (boards[boardId].users.length == 0) {//not sure if this situation will occur but coded it anyways
    deleteBoard(boardId)
  }
  else if (boards[boardId].users.length == 1) {
    console.log('one user remaining, set to black')
    users[Object.keys(users)[0]].stoneColor = 'black'
    sendUserColor(Object.keys(users)[0]);
    boards[boardId].state = 'waiting'
  }
  else { //when there are more than 2 people in the room
    let stoneOccupied = []
    for (let i = 0; i < boards[boardId].users.length; i++) {
      if (users[Object.keys(users)[i]].stoneColor)
        stoneOccupied.push(users[Object.keys(users)[i]].stoneColor)
    }
    console.log(stoneOccupied)
    if (stoneOccupied.length == 0) { //also not sure if this situation will occur but coded it anyways
      console.log('more than two users remaining, no players remaining. set colors.')
      let randomNum = Math.floor(Math.random() * boards[boardId].users.length)
      while (!users[Object.keys(users)[randomNum]].stoneColor) {
        randomNum = Math.floor(Math.random() * boards[boardId].users.length)
      }
      users[Object.keys(users)[randomNum]].stoneColor = 'black'
      sendUserColor(Object.keys(users)[randomNum]);
      while (!users[Object.keys(users)[randomNum]].stoneColor) {
        randomNum = Math.floor(Math.random() * boards[boardId].users.length)
      }
      users[Object.keys(users)[randomNum]].stoneColor = 'white'
      sendUserColor(Object.keys(users)[randomNum]);
    }
    else if (stoneOccupied.length == 1) {//maybe one of them left
      console.log('more than two users remaining, one player remaining. set color.')
      let randomNum = Math.floor(Math.random() * boards[boardId].users.length)
      while (users[Object.keys(users)[randomNum]].stoneColor) {
        randomNum = Math.floor(Math.random() * boards[boardId].users.length) //set random one's color to white
      }
      console.log(users[Object.keys(users)[randomNum]].stoneColor)
      users[Object.keys(users)[randomNum]].stoneColor = stoneOccupied.includes('white') ? 'black' : 'white'
      sendUserColor(Object.keys(users)[randomNum]);
      console.log(`${users[Object.keys(users)[randomNum]].username} is set to white.`)
    }
    else { //two player are still playing. the game is over, or a spectator left the game.
      console.log('more than two users remaining, two player remaining. no need to reset colors.')
      //do nothing
      //not do anything?
      //don't anything
      //don't everything
    }
  }
}

function handleClose(uuid) {
  console.log(`${users[uuid].username} disconnected`);
  const boardId = users[uuid].currentBoard;
  const stoneColor = users[uuid].stoneColor
  boards[boardId].users = boards[boardId].users.filter(userUuid => userUuid !== uuid);
  delete connections[uuid];
  delete users[uuid];
  if (boards[boardId].users.length === 0) {
    console.log(`Deleting board ${boardId} as all users have left.`);
    deleteBoard(boardId);
  }
  else if (stoneColor) { //when player(non-spectator) left
    boards[boardId].state = 'black'
    resetStoneColor(boardId)
    resetBoard(boardId);
  }
  broadcastBoardState(boardId);
};

function deleteBoard(boardId) {
  console.log(`Board ${boardId} deleted.`);
  delete boards[boardId];
};

function broadcastUsers() {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid]
    const message = JSON.stringify(users)
    connection.send(message)
  })
}
// function broadcastBoardID(boardId) {
//   Object.keys(connections).forEach((uuid) => {
//     const connection = connections[uuid]
//     const message = JSON.stringify({ board: boards[boardId], boardId: boardId })
//     connection.send(message)
//   })
// }

const express = require('express')
const app = express()
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Specify the allowed HTTP methods
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Specify the allowed headers

  // Allow credentials (if needed)
  // res.header('Access-Control-Allow-Credentials', true);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});
app.get('/api/boards', function (req, res) {
  res.send(JSON.stringify(boards))
})
app.get('/api/debug', function (req, res) {
  res.send(JSON.stringify(boards) + '<br><br>' + JSON.stringify(users))
})
server.on('request', app);

wsServer.on("connection", (connection, request) => {
  const { username } = url.parse(request.url, true).query
  console.log(`${username} connected`)
  const uuid = uuidv4()
  connections[uuid] = connection
  users[uuid] = {
    username,
    state: {},
    currentBoard: null
  }
  connection.on("message", (message) => handleMessage(message, uuid))
  connection.on("close", () => handleClose(uuid))
})

server.listen(port, () => {
  console.log(`server is running on port ${port}`)
})