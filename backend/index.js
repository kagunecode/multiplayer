const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());

let gameState = {
  players: {},
  questions: [
    { question: "What is your favourite colour?", type: "individual" },
    { question: "What is her favourite colour?", type: "matching" },
  ],
  answers: {},
  scores: { player1: 0, player2: 0 }
};

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinGame', (player) => {
    gameState.players[socket.id] = player;
    socket.emit('gameState', gameState);
  });

  socket.on('submitAnswer', (data) => {
    const { player, answer } = data;
    console.log(player, answer)
    gameState.answers[player] = answer;
    io.emit('updateAnswers', gameState.answers);
    if (gameState.answers.player1 && gameState.answers.player2) {
      if (gameState.answers.player1 === gameState.answers.player2) {
        gameState.scores.player1 += 10;
        gameState.scores.player2 += 10;
      } else {
        gameState.scores.player1 -= 5;
        gameState.scores.player2 -= 5;
      }
      io.emit('updateScores', gameState.scores);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    delete gameState.players[socket.id];
  });
});

server.listen(4000, () => console.log('Server running on port 4000'));