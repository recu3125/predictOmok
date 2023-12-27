import { useEffect, useState } from "react"
import './Rooms.css';

export function Rooms({ onGameJoin }) {
  let [roomList, setRoomList] = useState([])
  useEffect(() => {
    async function getBoards() {
      let boards = await (await fetch("http://localhost:8001/api/boards")).json()
      if (Object.keys(boards).length === 0) {
        setRoomList(<li className="no-rooms">No rooms are open</li>)
      } else {
        setRoomList(Object.keys(boards).map(key => {
          return (
            <li
              key={key}
              onClick={() => onGameJoin("joinBoard", key)}
              className="room-item"
            >
              <button
                className="room-key-button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(key);
                }}
              >
                {key}
              </button>
              , <span className="players-count">{boards[key].users.length} players in the room</span>
            </li>
          )
        }))
      }
    }
    getBoards()
  }, [onGameJoin])

  return (
    <div>
      <ul className="room-list">
        {roomList}
        <div className="join-parent-buttons">
          <button className="join-button" onClick={() => onGameJoin("quickJoin", null)}>Quick join</button>
          <button className="join-button" onClick={() => onGameJoin("createBoard", null)}>Create new room</button>
        </div>
      </ul>
    </div>
  )
}
