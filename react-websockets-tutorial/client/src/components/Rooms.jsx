import { useEffect, useState } from "react"

export function Rooms({ onGameJoin }) {
  let [roomList, setroomList] = useState([])
  useEffect(() => {
    async function getboards() {
      let boards = await (await fetch("http://localhost:8001/api/boards")).json()
      console.log(boards)
      console.log('a')
      setroomList(Object.keys(boards).map(key => {
        return(<li onClick={(e) => onGameJoin("joinBoard",key)}>{key} , {boards[key].users.length} players in the room</li>)
      }));
    }
    getboards()
  },[onGameJoin])
  console.log(roomList)
  return (
    <div>
      <ul>
        {roomList}
      </ul>
      <div>
        <button onClick={(e) => onGameJoin("quickJoin",null)}>Quick join</button>
        <button onClick={(e) => onGameJoin("createBoard",null)}>Create new room</button>
      </div>
    </div>
  )
}