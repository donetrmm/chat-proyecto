// AppGames.js (Sala de Juegos)
import React, { useState, useEffect, useRef } from 'react';
import { IoSend } from 'react-icons/io5';
import io from 'socket.io-client';
import '../App.css';

const AppGames = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState('games');
  const [socket, setSocket] = useState(null);
  const [enteredChat, setEnteredChat] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:8080', { path: '/api/rooms' });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinRoom', room);

    socket.on('message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('disconnect', () => {
      console.log('Conexión cerrada');

      setTimeout(() => {
        console.log('Intentando reconectar...');
        const newSocket = io('http://localhost:8080', { path: '/api/rooms' });
        setSocket(newSocket);
        newSocket.emit('joinRoom', room);
      }, 2000);
    });
  }, [socket, room]);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();

    if (username.trim() !== '') {
      const welcomeMessage = `se ha unido a la sala ${room}.`;
      const messageObject = {
        type: 'message',
        content: welcomeMessage,
        username,
        room,
      };

      socket.emit('message', messageObject);
      setMessage('');
      setEnteredChat(true);
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();

    if (message.trim() !== '') {
      const messageObject = {
        type: 'message',
        content: message,
        username,
        room,
      };

      socket.emit('message', messageObject);
      setMessage('');
    }
  };

  const switchRoom = (newRoom) => {
    setEnteredChat(false);
    setRoom(newRoom);

    // Envía un mensaje de cambio de sala al servidor
    const switchRoomMessage = {
      type: 'switchRoom',
      content: `ha cambiado a la sala ${newRoom}.`,
      username,
      oldRoom: 'games', // Sala actual (puedes ajustarla según la lógica)
      newRoom,
    };

    socket.emit('message', switchRoomMessage);
  };

  return (
    <div className="App">
      {enteredChat ? (
        <div className="ChatContainer">
          <h1>Bienvenido al Chat, {username}!</h1>
          <h2>{`Sala: ${room}`}</h2>
          <div className="MessagesContainer" ref={messagesEndRef}>
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
          
          {/* Botón para cambiar a la sala general */}
          <button onClick={() => switchRoom('general')}>Entrar a la sala general</button>
        </div>
      ) : (
        <div className="ChatContainer">
          <h1>Ingresa un nombre para entrar al chat</h1>
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              className='inputMessage'
              placeholder="Nickname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button type="submit">Entrar al chat</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AppGames;
