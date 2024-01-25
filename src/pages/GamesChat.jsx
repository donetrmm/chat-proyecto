import React, { useState, useEffect } from 'react';
import { IoSend } from 'react-icons/io5';
import io from 'socket.io-client';
import '../App.css';

const GamesChat = ({ username, onReturnToGeneralChat }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:8080', { path: '/api/rooms' });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinRoom', 'games');

    socket.on('message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('disconnect', () => {
      console.log('Conexión cerrada');

      setTimeout(() => {
        console.log('Intentando reconectar...');
        const newSocket = io('http://localhost:8080', { path: '/api/rooms' });
        setSocket(newSocket);
        newSocket.emit('joinRoom', 'games');
      }, 2000);
    });
  }, [socket]);

  const handleMessageSubmit = (e) => {
    e.preventDefault();

    if (message.trim() !== '') {
      const messageObject = {
        type: 'message',
        content: message,
        username,
        room: 'games',
      };

      socket.emit('message', messageObject);
      setMessage('');
    }
  };

  const returnToGeneralChat = () => {
    onReturnToGeneralChat(username);
  };

  return (
    <div className="ChatContainer">
      <h1>Bienvenido al Chat de Juegos, {username}!</h1>
      <div className="MessagesContainer">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`Message ${
              msg.username === username ? 'UserMessage' : 'OtherMessage'
            }`}
          >
            <strong>{msg.username}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleMessageSubmit}>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit"><IoSend className='sendIcon' /></button>
      </form>
      <button onClick={returnToGeneralChat}>Volver al Chat General</button>
    </div>
  );
};

export default GamesChat;
  