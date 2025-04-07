# Network Quiz Game

A real-time multiplayer quiz game using WebSockets that allows multiple players to compete in a trivia challenge.

## Quick Start Guide

### Server Setup
```
# Install dependencies
npm init -y
npm install ws

# Run the server
node server.js
```

### Client Setup
1. Open `index.html` in a browser
2. Verify the Server URL is correct (ws://localhost:8080 for local testing)
3. Click "Connect" button
4. Enter a username and join the quiz

## How to Play

1. **Connect and Join**
   - After connecting, enter your username and click "Join Quiz"
   - You'll be placed in the waiting room with other players

2. **Start the Quiz**
   - Any player can click "Start Quiz" to begin
   - All players will receive questions simultaneously

3. **Answer Questions**
   - Select your answer by clicking one of the options
   - Correct answers earn 10 points
   - You'll see which answer was correct after answering

4. **View Results**
   - The scoreboard updates after each question
   - Final rankings are shown at the end of the quiz

## Customizing Questions

Edit the `questions` array in `server.js` to add your own trivia questions.
