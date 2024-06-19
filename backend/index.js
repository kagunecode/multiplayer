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
    { player1: "What is her favourite colour?", player2: "What is your favourite colour?", display: "What is her favourite colour?" },
    { player1: "What is her favourite movie?", player2: "What is your favourite movie?", display: "What is her favourite movie?" },
    { player1: "What is her favourite song?", player2: "What is your favourite song?", display: "What is her favourite song?" },
  ],
  currentQuestionIndex: 0,
  answers: {},
  scores: { player1: 0, player2: 0 }
};

const sendQuestion = () => {
  const question = gameState.questions[gameState.currentQuestionIndex];
  io.to(gameState.players['player1']).emit('question', { question: question.player1 });
  io.to(gameState.players['player2']).emit('question', { question: question.player2 });
  io.emit('displayQuestion', { question: question.display });
};

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinGame', (player) => {
    gameState.players[player] = socket.id;
    socket.emit('gameState', gameState);
    if (Object.keys(gameState.players).length === 2) {
      sendQuestion();
    }
  });

  socket.on('submitAnswer', (data) => {
    const { player, answer } = data;
    gameState.answers[player] = answer;
    io.emit('playerAnswered', { player });

    if (Object.keys(gameState.answers).length === 2) {
      if (gameState.answers.player1 === gameState.answers.player2) {
        gameState.scores.player1 += 10;
        gameState.scores.player2 += 10;
      } else {
        gameState.scores.player1 -= 5;
        gameState.scores.player2 -= 5;
      }

      io.emit('updateScores', gameState.scores);
      gameState.answers = {};

      gameState.currentQuestionIndex++;
      if (gameState.currentQuestionIndex < gameState.questions.length) {
        sendQuestion();
      } else {
        io.emit('gameOver', gameState.scores);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    const player = Object.keys(gameState.players).find(key => gameState.players[key] === socket.id);
    if (player) {
      delete gameState.players[player];
    }
  });
});

server.listen(4000, () => console.log('Server running on port 4000'));