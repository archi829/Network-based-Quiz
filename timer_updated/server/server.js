const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

const questions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"],
    correctAnswer: 1
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    correctAnswer: 1
  },
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: 1
  },
  {
    question: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Oxygen", "Iron", "Silver"],
    correctAnswer: 1
  }

];

let players = [];
let currentQuestionIndex = 0;

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    if (msg.type === "join") {
      ws.username = msg.username;
      ws.score = 0;
      players.push(ws);
      broadcast({ type: "playerJoined", username: msg.username });
    }

    if (msg.type === "startQuiz") {
      currentQuestionIndex = 0;
      players.forEach(p => {
        p.score = 0;
      });
      sendQuestion();
    }

    if (msg.type === "answer") {
      const correctAnswer = questions[currentQuestionIndex].correctAnswer;
      if (msg.answer === correctAnswer) {
        ws.score += 1;
        broadcast({ type: "playerAnswered", username: ws.username, correct: true });
      } else {
        broadcast({ type: "playerAnswered", username: ws.username, correct: false });
      }

      broadcast({
        type: "answerResult",
        correctAnswer: correctAnswer,
      });
    }

    if (msg.type === "next") {
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        sendQuestion();
      } else {
        const scores = players.map(p => ({
          username: p.username,
          score: p.score
        })).sort((a, b) => b.score - a.score);
        broadcast({ type: "quizEnd", message: "Quiz Over!", scores });
      }
    }
  });

  ws.on("close", () => {
    players = players.filter(p => p !== ws);
    console.log("Client disconnected");
  });
});

function sendQuestion() {
  const q = questions[currentQuestionIndex];
  broadcast({
    type: "question",
    question: q.question,
    options: q.options,
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on http://localhost:${PORT}");
});