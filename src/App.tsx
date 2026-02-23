import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./App.css";

interface ServerToClientEvents {
  lobby_update: (data: { players: string[] }) => void;
  first_buzz: (data: { player: string }) => void;
  game_started: () => void;
  round_reset: () => void;
  error: (msg: string) => void;
}

interface ClientToServerEvents {
  join_room: (data: { roomCode: string; playerName: string }) => void;
  buzz: (data: { roomCode: string; playerName: string }) => void;
}

const SOCKET_API = import.meta.env.VITE_SOCKET_API;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_API);

function App() {
  const [screen, setScreen] = useState<"join" | "lobby" | "buzzer">("join");
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [firstBuzz, setFirstBuzz] = useState<string>("");
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  useEffect(() => {
    socket.on("lobby_update", (data) => setPlayers(data.players));
    socket.on("first_buzz", (data) => setFirstBuzz(data.player));
    socket.on("game_started", () => {
      setGameStarted(true);
      setScreen("buzzer");
      setFirstBuzz("");
    });
    socket.on("round_reset", () => setFirstBuzz(""));
    socket.on("error", (msg) => alert(msg));

    return () => {
      socket.off("lobby_update");
      socket.off("first_buzz");
      socket.off("game_started");
      socket.off("round_reset");
      socket.off("error");
    };
  }, []);

  const handleJoin = () => {
    if (!roomCode || !playerName) return alert("Enter name and room code");
    socket.emit("join_room", { roomCode, playerName });
    setScreen("lobby");
  };

  const handleBuzz = () => {
    if (!firstBuzz) {
      socket.emit("buzz", { roomCode, playerName });
      setFirstBuzz(playerName);
    }
  };

  return (
    <div className="player-container">
      {screen === "join" && (
        <div className="card card-join">
          <h2>Join a Room</h2>
          <input
            className="input-player-name"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            className="input-room-code"
            placeholder="Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button className="btn btn-join" onClick={handleJoin}>
            Join Room
          </button>
        </div>
      )}

      {(screen === "lobby" || screen === "buzzer") && (
        <div className="player-layout">
          <div className="card card-main">
            <h2>
              {screen === "lobby" ? "Lobby" : "Game"} - Code: {roomCode}
            </h2>

            {screen === "lobby" && (
              <p>Waiting for admin to start the game...</p>
            )}

            {screen === "buzzer" && (
              <>
                <h3>Player: {playerName}</h3>
                <button className="btn btn-buzz" onClick={handleBuzz}>
                  BUZZ
                </button>

                {firstBuzz && (
                  <div className="buzz-notification">
                    <p>{firstBuzz} buzzed first!</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card card-players">
            <h3>Players</h3>
            <ul className="players-list">
              {players.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
