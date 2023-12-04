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
  console.log(user.stoneColor)
  broadcastBoardState(boardId);
  sendUserColor(uuid);
}

const handleMessage = (bytes, uuid) => {
  const message = JSON.parse(bytes.toString())
  console.log(message)
  const user = users[uuid]
  user.state = message
  broadcast()

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
  else if (message.action == 'clearBoard') {
    boards[message.boardId].stones = {};
  }

  // console.log(
  //   `${user.username} updated their updated state: ${JSON.stringify(
  //     user.state,
  //   )}`,
  // )
}
const availableBoard = (uuid, user) => {
  console.log(boards);
  for (let boardId in boards) {
    console.log(boards[boardId].users.length);
    if (boards[boardId].users.length === 1) {
      return boardId;
    }
  }

  return createBoard();

};

function createBoard(uuid, user) {
  //const newBoardId = uuidv4();
  function randomString(boards, length) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const result = alphabet[Math.floor(Math.random() * alphabet.length)] + alphabet[Math.floor(Math.random() * alphabet.length)] + alphabet[Math.floor(Math.random() * alphabet.length)] + alphabet[Math.floor(Math.random() * alphabet.length)]
    if (boards[result]) {
      return randomString(boards, length)
    }
    return result
  }
  const newBoardId = randomString(boards, 4)


  boards[newBoardId] = { stones: {}, users: [], state: "waiting" }; //waiting, white, black
  return newBoardId;
}

const updateBoard = (boardId, row, col, color) => {
  console.log(boards);
  if (!boards[boardId]) { console.log(`Board ${boardId} not found`); return; }
  if (boards[boardId].state == "waiting") { console.log(`stone placed while waiting player`); return; }
  if (boards[boardId].state !== color) { console.error(`${color} stone placed in turn ${boards[boardId].state}`); return; }

  boards[boardId].stones[`${row},${col}`] = color;
  boards[boardId].state = (boards[boardId].state == "white" ? "black" : "white");
  broadcastBoardState(boardId);
};

const broadcastBoardState = (boardId) => {
  if (boards[boardId]) {
    const message = JSON.stringify({ board: boards[boardId], users: users, BoardId: boardId });
    Object.keys(connections).forEach((uuid) => {
      if (users[uuid].currentBoard === boardId) {
        const connection = connections[uuid];
        console.log(`Broadcasting to ${users[uuid].username} on board ${boardId}`);
        connection.send(message);
      }
    });
  } else {
    console.log(`Board ${boardId} not found for broadcasting`);
  }
}

// const broadcastUserColor = (uuid) => {
// Object.keys(users).forEach((uuid) => {
//   const user = users[uuid];
//   const colorMessage = JSON.stringify({ userColor: user.stoneColor });
//   const connection = connections[uuid];
//   if (connection) {
//     connection.send(colorMessage);
//   }
// });
// };

const sendUserColor = (uuid) => {
  if(!users[uuid]) return;
  const user = users[uuid];
  const colorMessage = JSON.stringify({ userColor: user.stoneColor });
  const connection = connections[uuid];
  if (connection) {
    connection.send(colorMessage);
  }
};

const handleClose = (uuid) => {
  console.log(`${users[uuid].username} disconnected`);
  const boardId = users[uuid].currentBoard;

  if (boards[boardId]) {
    boards[boardId].users = boards[boardId].users.filter(userUuid => userUuid !== uuid);
    boards[boardId].state = 'waiting' // should stop game, resett board, show win message, etc

    if (boards[boardId].users.length === 0) {
      console.log(`Deleting board ${boardId} as all users have left.`);
      deleteBoard(boardId);
    } else {
      broadcastBoardState(boardId);
      remainderUuid = Object.keys(boards[boardId].users)[0]
      boards[boardId].users[0].stoneColor == 'black' //maybe this should be moved to game restart function later
      sendUserColor(remainderUuid);
    }
  }

  delete connections[uuid];
  delete users[uuid];
};

const deleteBoard = (boardId) => {
  console.log(`Board ${boardId} deleted.`);
  delete boards[boardId];
};

const broadcast = () => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid]
    const message = JSON.stringify(users)
    connection.send(message)
  })
}
const broadcastboardID = (boardId) => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid]
    const message = JSON.stringify({ board: boards[boardId], boardId: boardId })
    connection.send(message)
  })
}


const express = require('express')
const app = express()
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