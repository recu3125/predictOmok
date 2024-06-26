import useWebSocket from "react-use-websocket"
import React, { useEffect, useRef, useState } from "react"
import throttle from "lodash.throttle"
import { Board } from "./Board"
import { Rooms } from "./Rooms"
import { SpellCaster } from "./SpellCaster"


const renderUsersList = users => {
  return (
    <ul>
      {Object.keys(users).map(uuid => {
        return <li key={uuid}>{JSON.stringify(users[uuid])}</li>
      })}
    </ul>
  )
}

export function Home({ username }) {
  const [hasJoinedGame, setHasJoinedGame] = useState(false);
  const WS_URL = `ws://127.0.0.1:8001`
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    queryParams: { username },
  })

  function handleGameJoin(action, boardId) {
    setHasJoinedGame(true);
    sendJsonMessage({
      action: action,
      boardId: boardId
    });
  };

  const THROTTLE = 50
  const sendJsonMessageThrottled = useRef(throttle(sendJsonMessage, THROTTLE))

  useEffect(() => {
    if (hasJoinedGame) {
      sendJsonMessage({
        action: "mousemove",
        x: 0,
        y: 0,
      });
    }
  }, [hasJoinedGame]); // Depend on hasJoinedGame

  if (!hasJoinedGame) {
    return <Rooms onGameJoin={handleGameJoin} />;
  }

  if (lastJsonMessage && lastJsonMessage.type === "omokGame") {
    return (
      <>
        <Board playerNumber={1} sendJsonMessage={sendJsonMessage} lastJsonMessage={lastJsonMessage}></Board>
      </>
    );
  }
  else if (lastJsonMessage && lastJsonMessage.type === "spellCasterGame") {
    return (
      <>
        <SpellCaster playerNumber={1} sendJsonMessage={sendJsonMessage} lastJsonMessage={lastJsonMessage}></SpellCaster>
      </>
    );
  }
}