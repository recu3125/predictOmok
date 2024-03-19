import { useEffect, useState } from "react";
import './Rooms.css';

export function Rooms({ onGameJoin }) {
  const [rooms, setRooms] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRoomList, setFilteredRoomList] = useState([]);

  useEffect(() => {
    async function getBoards() {
      let boards = await (await fetch("http://localhost:8001/api/boards")).json();
      setRooms(boards);
      filterRooms(boards, "");
    }
    getBoards();
  }, [onGameJoin]);

  useEffect(() => {
    filterRooms(rooms, searchTerm);
  }, [rooms, searchTerm]);

  function filterRooms(boards, term) {
    const keys = Object.keys(boards);
    if (keys.length === 0) {
      setFilteredRoomList(<li className="no-rooms">No rooms are open</li>);
    } else {
      const filteredKeys = term.length === 0 ? keys : keys.filter(key =>
        key.toLowerCase().includes(term.toLowerCase())
      );

      const listItems = filteredKeys.length > 0 ? filteredKeys.map(key => (
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
      )) : <li className="no-rooms">No matching rooms found</li>;

      setFilteredRoomList(listItems);
    }
  }

  return (
    <div>
      <ul className="room-list">
      <input
        type="text"
        placeholder="Search by room key..."
        className="search-bar"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
        {filteredRoomList}
        <div className="join-parent-buttons">
          <button className="join-button" onClick={() => onGameJoin("quickJoin", null)}>Quick join</button>
          <button className="join-button" onClick={() => onGameJoin("createBoard", null)}>Create new room</button>
          <button className="join-button" onClick={() => onGameJoin("createBoardSpellCaster", null)}>Create new spellCaster</button>
        </div>
      </ul>
    </div>
  );
}
