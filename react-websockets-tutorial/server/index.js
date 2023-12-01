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

const handleMessage = (bytes, uuid) => {
  const message = JSON.parse(bytes.toString())
  console.log(message)
  const user = users[uuid]
  user.state = message
  broadcast()

  if (message.action === 'placestone' && message.boardId) {
    updateBoard(message.boardId, message.row, message.col, message.color);
  } else if (message.action == 'createOrJoinBoard') {
    let boardId = findOrCreateBoard(uuid, user);
    user.currentBoard = boardId;
    broadcastBoardState(boardId);
    broadcastuserColor(user);
  } else if (message.action == 'deleteboard') {
    delete boards[user.currentBoard];
    broadcastBoardState(user.currentBoard);
    user.currentBoard = null;
  }
  else if (message.action == 'clearBoard') {
    boards[message.boardId].stones = {};
  }

  console.log(
    `${user.username} updated their updated state: ${JSON.stringify(
      user.state,
    )}`,
  )
}
const findOrCreateBoard = (uuid, user) => {
  console.log(boards);
  for (let boardId in boards) {
    console.log(boards[boardId].users.length);
    if (boards[boardId].users.length === 1) {
      boards[boardId].users.push(uuid);
      user.stoneColor = 'white';
      return boardId;
    }
  }
  user.stoneColor = 'black';


  const newBoardId = uuidv4();
  boards[newBoardId] = { stones: {}, users: [uuid] };
  return newBoardId;
};

const updateBoard = (boardId, row, col, color) => {
  console.log(boards);

  if (!boards[boardId]) {
    console.log(`Board ${boardId} not found`);
    return;
  }
  boards[boardId].stones[`${row},${col}`] = color;
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

const broadcastuserColor = () => {
  Object.keys(users).forEach((uuid) => {
    const user = users[uuid];
    const colorMessage = JSON.stringify({ userColor: user.stoneColor });
    const connection = connections[uuid];
    if (connection) {
      connection.send(colorMessage);
    }
  });
};

const handleClose = (uuid) => {
  console.log(`${users[uuid].username} disconnected`);
  const boardId = users[uuid].currentBoard;

  if (boards[boardId]) {
    boards[boardId].users = boards[boardId].users.filter(userUuid => userUuid !== uuid);

    if (boards[boardId].users.length === 0) {
      console.log(`Deleting board ${boardId} as all users have left.`);
      deleteBoard(boardId);
    } else {
      broadcastBoardState(boardId);
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
  console.log(`WebSocket server is running on port ${port}`)
})