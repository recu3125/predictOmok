import { useEffect, useState } from "react"

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
      <div className = "join-parent-buttons">
        <button className="join-button" onClick={() => onGameJoin("quickJoin", null)}>Quick join</button>
        <button className="join-button" onClick={() => onGameJoin("createBoard", null)}>Create new room</button>
      </div>
      </ul>

      <style jsx>{`
        .room-list {
          list-style-type: none;
          overflow-y: auto;
          height: 50vh;
          width: 50vw;
          padding: 10px;
          background-color: #cfcfcf;
          margin: 0;
          position: relative; 
        }

        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .room-item {
          background-color: #f0f0f0;
          margin-bottom: 5px;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .room-item:hover {
          background-color: #d9d9d9;
        }

        .room-key-button {
          background-color: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background-color 0.3s;
        }

        .room-key-button:hover {
          background-color: #bfbfbf;
        }

        .players-count, .no-rooms {
          user-select: none;
        }

        .join-button {
          background-color: #efefef;
          margin: 3px
        }

        .join-parent-buttons {
          position: absolute;
          bottom: 0; 
          width:98%;
          // with 98 because of the margin. <- this is bad coding 
          justify-content: center;
        }
      `}</style>
    </div>
  )
}
