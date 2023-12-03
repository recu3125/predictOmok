import { useEffect, useState } from "react"

export function Rooms({ onRoomSelect }) {
  let [roomList, setroomList] = useState([])
  useEffect(() => {
    async function getboards() {
      let boards = await (await fetch("http://localhost:8001/api/boards")).json()
      console.log(boards)
      console.log('a')
      setroomList(Object.keys(boards).map(key => {
        return(<li onClick={(e) => onRoomSelect(key)}>{key} , {boards[key].users.length} players in the room</li>)
      }));
    }
    getboards()
  },[onRoomSelect])
  console.log(roomList)
  return (
    <div>
      <ul>
        {roomList}
      </ul>
    </div>
  )
}