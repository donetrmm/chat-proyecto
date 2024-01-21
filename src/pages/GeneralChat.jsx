// GeneralChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { IoSend } from 'react-icons/io5';

const GeneralChat = ({ onUsernameSubmit, onSwitchToGamesChat }) => {
  const [username, setUsername] = useState(sessionStorage.getItem('user') || '');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [enteredChat, setEnteredChat] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchConnectedUsers = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/connections');
        const data = await response.text();
        setConnectedUsers(parseInt(data, 10));
      } catch (error) {
        console.error('Error al obtener la cantidad de usuarios conectados:', error);
      }
    };

    const intervalId = setInterval(fetchConnectedUsers, 1000);

    fetchConnectedUsers();

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const newSocket = new WebSocket('ws://localhost:8080/api/chat');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleSocketMessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    const handleSocketClose = () => {
      console.log('Conexión cerrada');

      setTimeout(() => {
        console.log('Intentando reconectar...');
        const newSocket = new WebSocket('ws://localhost:8080/api/chat');
        setSocket(newSocket);
      }, 2000);
    };

    socket.addEventListener('message', handleSocketMessage);
    socket.addEventListener('close', handleSocketClose);

    return () => {
      socket.removeEventListener('message', handleSocketMessage);
      socket.removeEventListener('close', handleSocketClose);
    };
  }, [socket]);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();

    sessionStorage.setItem('user', username);

    if (username.trim() !== '') {
      const welcomeMessage = 'se ha unido al chat.';
      const messageObject = {
        type: 'message',
        content: welcomeMessage,
        username,
      };

      socket.send(JSON.stringify(messageObject));
      setMessage('');
      setEnteredChat(true);
      onUsernameSubmit(username);
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();

    if (message.trim() !== '') {
      const messageObject = {
        type: 'message',
        content: message,
        username,
      };

      socket.send(JSON.stringify(messageObject));
      setMessage('');
    }
  };

  const getUsernameFromSession = () => {
    const user = sessionStorage.getItem('user');
    setUsername(user);
  };

  return (
    <div className="ChatContainer">
      {enteredChat ? (
        <div>
          <h1>Bienvenido al Chat, {username}!</h1>
          <h1>Usuarios Conectados: {connectedUsers}</h1>
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
            <button type="submit">
              <IoSend className="sendIcon" />
            </button>
          </form>
          <button onClick={onSwitchToGamesChat}>Cambiar a Sala Games</button>
        </div>
      ) : (
        <div onLoad={getUsernameFromSession}>
          <h1>Ingresa un nombre para entrar al chat</h1>
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              className="inputMessage"
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

export default GeneralChat;