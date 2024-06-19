import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

const PlayerComponent = ({ player }) => {
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socket.on('question', (data) => {
      setQuestion(data.question);
      setAnswer('');
    });

    socket.on('playerAnswered', (data) => {
      setNotifications(prevNotifications => [...prevNotifications, `${data.player} answered`]);
    });

    return () => {
      socket.off('question');
      socket.off('playerAnswered');
    };
  }, []);

  const submitAnswer = () => {
    socket.emit('submitAnswer', { player, answer });
  };

  return (
    <div>
      <h2>Player {player}</h2>
      <div>{question}</div>
      <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <button onClick={submitAnswer}>Submit Answer</button>
      <div>
        {notifications.map((note, index) => (
          <div key={index}>{note}</div>
        ))}
      </div>
    </div>
  );
};

const DisplayComponent = () => {
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [question, setQuestion] = useState('');

  useEffect(() => {
    socket.on('updateAnswers', (answers) => {
      setAnswers(answers);
    });

    socket.on('updateScores', (scores) => {
      setScores(scores);
    });

    socket.on('displayQuestion', (data) => {
      setQuestion(data.question);
    });

    socket.on('gameOver', (finalScores) => {
      alert(`Game over! Final Scores - Player 1: ${finalScores.player1}, Player 2: ${finalScores.player2}`);
    });

    return () => {
      socket.off('updateAnswers');
      socket.off('updateScores');
      socket.off('displayQuestion');
      socket.off('gameOver');
    };
  }, []);

  return (
    <div>
      <h2>Question</h2>
      <div>{question}</div>
      <h2>Answers</h2>
      <div>Player 1: {answers.player1}</div>
      <div>Player 2: {answers.player2}</div>
      <h2>Scores</h2>
      <div>Player 1: {scores.player1}</div>
      <div>Player 2: {scores.player2}</div>
    </div>
  );
};

const App = () => {
  const [player, setPlayer] = useState(null);

  const joinGame = (player) => {
    setPlayer(player);
    socket.emit('joinGame', player);
  };

  return (
    <div>
      {!player ? (
        <div>
          <button onClick={() => joinGame('player1')}>Join as Player 1</button>
          <button onClick={() => joinGame('player2')}>Join as Player 2</button>
          <button onClick={() => joinGame('display')}>Join as Display</button>
        </div>
      ) : (
        player === 'display' ? <DisplayComponent /> : <PlayerComponent player={player} />
      )}
    </div>
  );
};

export default App;