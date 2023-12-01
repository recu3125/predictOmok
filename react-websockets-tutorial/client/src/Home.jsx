import { Cursor } from "./components/Cursor"
import useWebSocket from "react-use-websocket"
import React, { useEffect, useRef, useState } from "react"
import throttle from "lodash.throttle"
import {Board} from "./components/Board"

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

  const Registration = ({ onRegister }) => (
    <div>
      <button onClick={onRegister}>Join Now</button>
    </div>
  );

export function Home({ username }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const WS_URL = `ws://127.0.0.1:8001`
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    queryParams: { username },
  })

  const handleRegister = () => {
    console.log("asdddddddd");
    setIsRegistered(true);
    sendJsonMessage({
      action: "createOrJoinBoard",
      x:0,
      y:0,
    });
  };

  const THROTTLE = 50
  const sendJsonMessageThrottled = useRef(throttle(sendJsonMessage, THROTTLE))

useEffect(() => {
    if (isRegistered) {
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
  }, [isRegistered]); // Depend on isRegistered

  if (!isRegistered) {
    return <Registration onRegister={handleRegister} />;
  }

  if (lastJsonMessage) {
    return (
      <>
        {renderUsersList(lastJsonMessage)}
        {renderCursors(lastJsonMessage)}
        <Board playerNumber={1} sendJsonMessage={sendJsonMessage} lastJsonMessage={lastJsonMessage}></Board>
      </>
    );
  }
}