const socket = new WebSocket("ws://localhost:3000");

const usernameInput = document.getElementById("username");
const usernameContainer = document.getElementById("login-section");

const joinBtn = document.getElementById("joinBtn");
const quizContainer = document.getElementById("quizContainer");
const questionContainer = document.getElementById("questionContainer");
const questionText = document.getElementById("question");
const optionsList = document.getElementById("options");
const scoreboard = document.getElementById("scoreboard");
const resultsSection = document.getElementById("results");
const startBtn = document.getElementById("startBtn");

// Timer elements
const timerDisplay = document.createElement("div");
timerDisplay.id = "timer";
questionContainer.appendChild(timerDisplay);

// Next button
const nextBtn = document.createElement("button");
nextBtn.textContent = "Next";
nextBtn.style.marginTop = "10px";
nextBtn.classList.add("hidden");
questionContainer.appendChild(nextBtn);

let hasAnswered = false;
let currentAnswer = null;
let timer = null;
let timeLeft = 15; // seconds
let quizStarted = false;


joinBtn.onclick = function () {
  const username = usernameInput.value;
  if (username) {
    socket.send(JSON.stringify({ type: "join", username: username }));
    quizContainer.classList.remove("hidden");
  }
};

startBtn.onclick = function () {
  usernameContainer.classList.add("hidden");
  scoreboard.innerHTML = "";
  quizStarted = true; // 👈 Add this line
  socket.send(JSON.stringify({ type: "startQuiz" }));
  resultsSection.innerHTML = "";
};

socket.onmessage = function (event) {
  const message = JSON.parse(event.data);
  switch (message.type) {
    case "question":
      displayQuestion(message);
      break;

    case "answerResult":
      showAnswerResult(message);
      break;

    case "quizEnd":
      showFinalResults(message);
      break;

    case "playerJoined":
      if (!quizStarted) {
        updateScoreboard('${message.username} joined the game!');
      }
      break;

    case "playerAnswered":
      updateScoreboard('${message.username} answered ${message.correct ? "correctly" : "incorrectly"}');
      break;
  }
};

function displayQuestion(message) {
  hasAnswered = false;
  currentAnswer = null;
  timeLeft = 15;
  clearInterval(timer);
  startTimer();

  questionContainer.classList.remove("hidden");
  questionText.textContent = message.question;
  optionsList.innerHTML = "";
  nextBtn.classList.add("hidden");

  message.options.forEach((option, index) => {
    const optionBtn = document.createElement("button");
    optionBtn.textContent = option;
    optionBtn.classList.add("option");
    optionBtn.onclick = () => selectAnswer(index);
    optionsList.appendChild(optionBtn);
  });
}

function selectAnswer(index) {
  if (hasAnswered) return;
  hasAnswered = true;

  const selectedOption = document.querySelectorAll(".option")[index];
  selectedOption.classList.add("selected");
  currentAnswer = index;

  socket.send(JSON.stringify({ type: "answer", answer: index }));
}

function showAnswerResult(message) {
  clearInterval(timer);
  timerDisplay.textContent = "⏱ Time's up or answered";

  const options = document.querySelectorAll(".option");
  options.forEach((option, index) => {
    option.disabled = true;
    if (index === message.correctAnswer) {
      option.classList.add("correct");
    } else if (index === currentAnswer && index !== message.correctAnswer) {
      option.classList.add("incorrect");
    }
  });

  nextBtn.classList.remove("hidden");
}

function showFinalResults(message) {
  const resultsBody = document.getElementById("results-body");
  //questionContainer.classList.add("hidden");
  resultsSection.innerHTML = "";
  message.scores.forEach((score) => {
    const row = document.createElement("tr");
   
    const nameCell = document.createElement('td');
        nameCell.textContent = score.username;
    const scoreCell = document.createElement('td');
        scoreCell.textContent = score.score;
    
        
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
    resultsSection.appendChild(row);
  });

  /*const restartBtn = document.createElement("button");
  restartBtn.textContent = "Restart Quiz";
  restartBtn.onclick = () => {scoreboard.innerHTML = ""; // 👈 Clears scoreboard
  ;socket.send(JSON.stringify({ type: "startQuiz" }));
  };
  resultsSection.appendChild(restartBtn);*/
  // End Quiz button
  const endBtn = document.createElement("button");
  endBtn.textContent = "End Quiz";
  endBtn.style.marginLeft = "10px";
  endBtn.onclick = () => {
    // Reset client-side state
    resultsSection.innerHTML = "";
    scoreboard.innerHTML = "";
    quizContainer.classList.add("hidden");
    document.getElementById("login-section").classList.remove("hidden");
    usernameInput.value = "";
  };
  resultsSection.appendChild(endBtn);

 /* const scoreList = document.getElementById("scoreList");
  scoreList.innerHTML = "";
  data.scores.forEach((player, index) => {
    const li = document.createElement("li");
    li.innerHTML = <span>${player.username}</span><span>${player.score} pts</span>;
    scoreList.appendChild(li);
  });*/
}

function updateScoreboard(message) {
  const p = document.createElement("p");
  p.textContent = message;
  scoreboard.appendChild(p);
}

function startTimer() {
  timerDisplay.textContent = "⏱ Time left: ${timeLeft}s";
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = "⏱ Time left: ${timeLeft}s";
    if (timeLeft <= 0) {
      clearInterval(timer);
      timerDisplay.textContent = "⏱ Time's up!";
      if (!hasAnswered) {
        hasAnswered = true;
        socket.send(JSON.stringify({ type: "answer", answer: -1 }));
      }
    }
  }, 1000);
}

// Proceed to next question when "Next" is clicked
nextBtn.onclick = function () {
  nextBtn.classList.add("hidden");
  timerDisplay.textContent = "";
  socket.send(JSON.stringify({ type: "next" }));
};