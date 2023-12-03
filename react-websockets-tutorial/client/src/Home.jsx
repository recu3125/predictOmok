import { Cursor } from "./components/Cursor"
import useWebSocket from "react-use-websocket"
import React, { useEffect, useRef, useState } from "react"
import throttle from "lodash.throttle"
import { Board } from "./components/Board"
import { Rooms } from "./components/Rooms"

const renderCursors = (users) => {
  return Object.keys(users).map((uuid) => {
    const user = users[uuid]
    return (
      <Cursor key={uuid} userId={uuid} point={[user.state?.x, user.state?.y]} />
    )
  })
}

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
  const [hasSelectedRoom, setHasSelectedRoom] = useState(false);
  const WS_URL = `ws://127.0.0.1:8001`
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    queryParams: { username },
  })

  const handleRoomSelect = (boardId) => {
    console.log("asdddddddd");
    setHasSelectedRoom(true);
    sendJsonMessage({
      action: "joinBoard",
      boardId: boardId
    });
  };

  const THROTTLE = 50
  const sendJsonMessageThrottled = useRef(throttle(sendJsonMessage, THROTTLE))

  useEffect(() => {
    if (hasSelectedRoom) {
      sendJsonMessage({
        action: "mousemove",
        x: 0,
        y: 0,
      });

      const handleMouseMove = (e) => {
        sendJsonMessageThrottled.current({
          action: "mousemove",
          x: e.clientX,
          y: e.clientY,
        });
      };


      window.addEventListener("mousemove", handleMouseMove);

      // Clean up function
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [hasSelectedRoom]); // Depend on hasSelectedRoom

  if (!hasSelectedRoom) {
    return <Rooms onRoomSelect={handleRoomSelect} />;
  }

  if (lastJsonMessage) {
    return (
      <>
        {/* {renderUsersList(lastJsonMessage)} */}
        {renderCursors(lastJsonMessage)}
        <Board playerNumber={1} sendJsonMessage={sendJsonMessage} lastJsonMessage={lastJsonMessage}></Board>
      </>
    );
  }
}