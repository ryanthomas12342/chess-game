const express = require("express");
const socket = require("socket.io");
const http = require("http");
const path = require("path");
const { Chess } = require("chess.js");
const { createSocket } = require("dgram");
const { unwatchFile } = require("fs");
const app = express();

const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();

let players = {};

let currentPlayer = "w";

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "CHESS GAME" });
});

io.on("connection", function (uniquesocket) {
  console.log("connection established");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerrole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerrole", "b");
  } else {
    uniquesocket.emit("spectator");
  }

  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id) {
      if (uniquesocket.id === players.white) {
        delete players.white;
      } else if (uniquesocket.id === players.black) {
        delete players.black;
      }
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() == "w" && uniquesocket.id != players.white) return;
      if (chess.turn() == "b" && uniquesocket.id != players.black) return;

      const result = chess.move(move);

      if (result) {
        if (result) {
          currentPlayer = chess.turn();
          io.emit("move", move);
          io.emit("boardState", chess.fen());
        } else {
          console.log("invlaid move taken");
          uniquesocket.emit("invalidmove", move);
        }
      }
    } catch (err) {}
  });
});

server.listen(3000, function () {
  console.log("listenign to port 3000");
});
