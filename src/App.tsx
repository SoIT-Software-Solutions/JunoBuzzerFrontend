import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { User, Hash, Users, Zap, CheckCircle2 } from "lucide-react";
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
    if (!roomCode || !playerName)
      return alert("Please enter your name and room code");
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
        <AnimatePresence mode="wait">
          {screen === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="glass-card card-join"
            >
              <h1 className="join-title">Juno Buzzer</h1>

              <div className="input-group">
                <div className="input-icon-wrapper">
                  <User size={20} />
                  <input
                    className="glass-input"
                    placeholder="Your Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-icon-wrapper">
                  <Hash size={20} />
                  <input
                    className="glass-input"
                    placeholder="Room Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
              </div>

              <button className="btn-premium" onClick={handleJoin}>
                Get Started
              </button>
            </motion.div>
          )}

          {(screen === "lobby" || screen === "buzzer") && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="player-layout"
            >
              <div className="glass-card main-card">
                <header style={{ marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1.8rem", margin: 0 }}>
                    {screen === "lobby" ? "Waiting for Game" : "Buzzer Active"}
                  </h2>
                  <div style={{ marginTop: "0.5rem" }}>
                    <span className="room-code-display">{roomCode}</span>
                  </div>
                </header>

                {screen === "lobby" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="subtle"
                  >
                    <div className="buzzer-wrapper">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <Zap size={48} color="#6366f1" className="pulse-icon" />
                        <p>The host will start the game soon...</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {screen === "buzzer" && (
                  <div className="buzzer-wrapper">
                    <h3
                      className="player-name"
                      style={{
                        fontSize: "1.5rem",
                        opacity: 1,
                        color: "#a5b4fc",
                      }}
                    >
                      {playerName}
                    </h3>

                    <button
                      className={`buzzer-btn ${hasBuzzed ? "buzzed" : ""}`}
                      onClick={handleBuzz}
                      disabled={hasBuzzed}
                    >
                      {!hasBuzzed && <div className="pulse-ring"></div>}
                      <div className="buzzer-inner">
                        {hasBuzzed ? <CheckCircle2 size={64} /> : "BUZZ!"}
                      </div>
                    </button>

                    <div
                      style={{
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {hasBuzzed ? (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="buzz-status"
                        >
                          Successfully buzzed!
                        </motion.p>
                      ) : (
                        <p className="subtle">
                          Press SPACE or Click the Button
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card side-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    marginBottom: "1rem",
                  }}
                >
                  <Users size={20} color="#6366f1" />
                  <h3 style={{ margin: 0 }}>Players ({players.length})</h3>
                </div>
                <div className="players-list">
                  <AnimatePresence>
                    {players.map((p, index) => (
                      <motion.div
                        key={p}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`player-bubble ${p === playerName ? "self" : ""}`}
                      >
                        <span style={{ fontWeight: 600 }}>{p}</span>
                        {p === playerName && (
                          <span className="you-tag">YOU</span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="footer">Powered by SoIT Software Solutions</footer>
    </div>
  );
}

export default App;
