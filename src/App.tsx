import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./App.css";

interface ServerToClientEvents {
  lobby_update: (data: { players: string[] }) => void;
  game_started: () => void;
  round_reset: () => void;
  error: (msg: string) => void;
}

interface ClientToServerEvents {
  join_room: (data: { roomCode: string; playerName: string }) => void;
  buzz: (data: { roomCode: string }) => void;
}

const SOCKET_API = import.meta.env.VITE_SOCKET_API;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_API);

function App() {
  const [screen, setScreen] = useState<"join" | "lobby" | "buzzer">("join");
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [hasBuzzed, setHasBuzzed] = useState(false);

  useEffect(() => {
    socket.on("lobby_update", (data) => setPlayers(data.players));

    socket.on("game_started", () => {
      setScreen("buzzer");
      setHasBuzzed(false);
    });

    socket.on("round_reset", () => {
      setHasBuzzed(false);
    });

    socket.on("error", (msg) => alert(msg));

    return () => {
      socket.off("lobby_update");
      socket.off("game_started");
      socket.off("round_reset");
      socket.off("error");
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && screen === "buzzer" && !hasBuzzed) {
        e.preventDefault();
        handleBuzz();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, hasBuzzed, roomCode]);

  const handleJoin = () => {
    if (!roomCode || !playerName) return alert("Enter name and room code");

    socket.emit("join_room", { roomCode, playerName });
    setScreen("lobby");
  };

  const handleBuzz = () => {
    if (hasBuzzed) return;

    socket.emit("buzz", { roomCode });
    setHasBuzzed(true);
  };

  return (
    <div className="player-container">
      <div className="player-content">
        {screen === "join" && (
          <div className="card card-join">
            <h2>Join a Room</h2>

            <input
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />

            <input
              placeholder="Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />

            <button className="btn-primary" onClick={handleJoin}>
              Join Room
            </button>
          </div>
        )}

        {(screen === "lobby" || screen === "buzzer") && (
          <div className="player-layout">
            <div className="card main-card">
              <h2>
                {screen === "lobby" ? "Lobby" : "Game"} — {roomCode}
              </h2>

              {screen === "lobby" && (
                <p className="subtle">Waiting for admin to start the game...</p>
              )}

              {screen === "buzzer" && (
                <>
                  <h3 className="player-name">{playerName}</h3>

                  <button
                    className={`buzz-button ${hasBuzzed ? "buzzed" : ""}`}
                    onClick={handleBuzz}
                    disabled={hasBuzzed}
                  >
                    {hasBuzzed ? "BUZZED ✓" : "PRESS SPACE OR CLICK"}
                  </button>

                  {hasBuzzed && (
                    <p className="buzz-status">
                      You buzzed in. Waiting for admin.
                    </p>
                  )}
                </>
              )}
            </div>

            {screen === "lobby" && (
              <div className="card side-card">
                <h3>Players</h3>
                <ul>
                  {players.map((p) => (
                    <li
                      key={p}
                      className={p === playerName ? "self-player" : ""}
                    >
                      {p}
                      {p === playerName && (
                        <span className="you-badge">YOU</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="footer">by SoIT Software Solutions</footer>
    </div>
  );
}

export default App;
