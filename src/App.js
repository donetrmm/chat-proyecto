// ... (código anterior)

import React, { useState, useEffect, useRef } from 'react';
import { IoSend } from 'react-icons/io5';
import './App.css';

const App = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [enteredChat, setEnteredChat] = useState(false);

  const messagesEndRef = useRef(null);

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

    socket.addEventListener('message', (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.addEventListener('close', (event) => {
      console.log('Conexión cerrada');

      // Implementar lógica de reconexión aquí
      setTimeout(() => {
        console.log('Intentando reconectar...');
        const newSocket = new WebSocket('ws://localhost:8080/api/chat');
        setSocket(newSocket);
      }, 2000); // Intentar reconectar después de 2 segundos
    });
  }, [socket]);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();

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

  return (
    <div className="App">
      {enteredChat ? (
        <div className="ChatContainer">
          <h1>Bienvenido al Chat, {username}!</h1>
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

export default App;
