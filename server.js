const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Quiz questions
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

// Keep track of clients and their scores
const clients = new Map();
let currentQuestionIndex = 0;
let isQuizActive = false;

// Start quiz function
function startQuiz() {
  isQuizActive = true;
  currentQuestionIndex = 0;
  
  // Reset all clients' scores
  clients.forEach((client) => {
    client.score = 0;
    client.currentQuestion = 0;
  });
  
  // Send first question to all clients
  broadcastQuestion();
}

// Broadcast current question to all clients
function broadcastQuestion() {
  if (currentQuestionIndex >= questions.length) {
    // Quiz ended
    broadcastMessage({
      type: 'quizEnd',
      message: 'Quiz has ended. Final scores:',
      scores: getScores()
    });
    isQuizActive = false;
    return;
  }

  const question = questions[currentQuestionIndex];
  broadcastMessage({
    type: 'question',
    questionNumber: currentQuestionIndex + 1,
    totalQuestions: questions.length,
    question: question.question,
    options: question.options
  });
}

// Get all client scores
function getScores() {
  const scores = [];
  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      scores.push({
        username: clientInfo.username,
        score: clientInfo.score
      });
    }
  });
  
  // Sort by score (highest first)
  return scores.sort((a, b) => b.score - a.score);
}

// Broadcast a message to all connected clients
function broadcastMessage(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// WebSocket server event handlers
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Initialize client data
  clients.set(ws, {
    username: `User_${Math.floor(Math.random() * 1000)}`,
    score: 0,
    currentQuestion: currentQuestionIndex
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Welcome to the Quiz Game! Waiting for other players...'
  }));
  
  // If quiz is active, send current question to the new client
  if (isQuizActive) {
    const question = questions[currentQuestionIndex];
    ws.send(JSON.stringify({
      type: 'question',
      questionNumber: currentQuestionIndex + 1,
      totalQuestions: questions.length,
      question: question.question,
      options: question.options
    }));
  }
  
  // Broadcast updated player list
  broadcastMessage({
    type: 'playerList',
    players: Array.from(clients.values()).map(client => client.username),
    scores: getScores()
  });
  
  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const clientInfo = clients.get(ws);
      
      console.log(`Received message from ${clientInfo.username}:`, message);
      
      switch (message.type) {
        case 'setUsername':
          clientInfo.username = message.username;
          console.log(`Client username set to: ${message.username}`);
          
          // Update all clients with new player list
          broadcastMessage({
            type: 'playerList',
            players: Array.from(clients.values()).map(client => client.username),
            scores: getScores()
          });
          break;
          
        case 'startQuiz':
          if (!isQuizActive) {
            console.log('Starting quiz');
            startQuiz();
          }
          break;
          
        case 'answer':
          if (isQuizActive && message.questionIndex === currentQuestionIndex) {
            const question = questions[currentQuestionIndex];
            const isCorrect = message.answerIndex === question.correctAnswer;
            
            console.log(`${clientInfo.username} answered ${isCorrect ? 'correctly' : 'incorrectly'}`);
            
            // Update client's score if correct
            if (isCorrect) {
              clientInfo.score += 10;
            }
            
            // Send result to the client
            ws.send(JSON.stringify({
              type: 'answerResult',
              correct: isCorrect,
              correctAnswer: question.correctAnswer,
              yourScore: clientInfo.score
            }));
            
            // Check if all clients have answered
            let allAnswered = true;
            clients.forEach((client) => {
              if (client.currentQuestion < currentQuestionIndex) {
                allAnswered = false;
              }
            });
            
            // Update the client's current question
            clientInfo.currentQuestion = currentQuestionIndex + 1;
            
            // If all clients have answered or after a timeout, move to next question
            if (allAnswered) {
              moveToNextQuestion();
            } else {
              // Broadcast updated scores
              broadcastMessage({
                type: 'scores',
                scores: getScores()
              });
            }
          }
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client ${clients.get(ws)?.username || 'unknown'} disconnected`);
    clients.delete(ws);
    
    // Broadcast updated player list
    broadcastMessage({
      type: 'playerList',
      players: Array.from(clients.values()).map(client => client.username),
      scores: getScores()
    });
  });
});

// Move to the next question after a delay
function moveToNextQuestion() {
  // Broadcast current scores
  broadcastMessage({
    type: 'scores',
    scores: getScores()
  });
  
  // Wait 3 seconds before next question
  setTimeout(() => {
    currentQuestionIndex++;
    broadcastQuestion();
  }, 3000);
}

// Start the server on port 8080
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Quiz server running on port ${PORT}`);
  console.log('Waiting for clients to connect...');
});
