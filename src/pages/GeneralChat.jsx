import React, { useState, useEffect, useRef } from "react";
import { IoSend } from "react-icons/io5";

const GeneralChat = ({ onUsernameSubmit, onSwitchToGamesChat }) => {
  const [username, setUsername] = useState(
    sessionStorage.getItem("user") || ""
  );
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [enteredChat, setEnteredChat] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [whisperTarget, setWhisperTarget] = useState("");
  const [whisperMessages, setWhisperMessages] = useState([]);

  const messagesEndRef = useRef(null);

  // SHORT POLLING
  const fetchWhisperMessages = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/whisper-messages?username=${username}`
      );
      if (!response.ok) {
        throw new Error(
          `Error al obtener mensajes de susurro: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      setWhisperMessages(data.messages);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    fetchWhisperMessages();

    const whisperMessagesInterval = setInterval(fetchWhisperMessages, 2000);

    return () => {
      clearInterval(whisperMessagesInterval);
    };
  }, [username]);

  // LONG POLLING
  useEffect(() => {
    const fetchConnectedUsersLongPolling = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/connections");
        if (!response.ok) {
          throw new Error(
            `Error al obtener la cantidad de usuarios conectados: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        setConnectedUsers(data.connections);
      } catch (error) {
        console.error(error.message);
      } finally {
        setTimeout(fetchConnectedUsersLongPolling, 2000);
      }
    };

    fetchConnectedUsersLongPolling();

    return () => {
      clearTimeout(fetchConnectedUsersLongPolling);
    };
  }, []);

  //SCROLL

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages, whisperMessages]);

  //WEBSOCKET

  useEffect(() => {
    const newSocket = new WebSocket("ws://localhost:8080/api/chat");
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleSocketMessage = (event) => {
      const newMessage = JSON.parse(event.data);

      if (newMessage.whisper) {
        setWhisperMessages((prevWhisperMessages) => [
          ...prevWhisperMessages,
          newMessage,
        ]);
      } else {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }

      if (newMessage.whisper && newMessage.whisperTarget === username) {
        setWhisperTarget("");
      }
    };

    const handleSocketClose = () => {
      console.log("Conexión cerrada");

      setTimeout(() => {
        if (socket.readyState === WebSocket.CLOSED) {
          console.log("Intentando reconectar...");
          const newSocket = new WebSocket("ws://localhost:8080/api/chat");
          setSocket(newSocket);
        }
      }, 2000);
    };

    socket.addEventListener("message", handleSocketMessage);
    socket.addEventListener("close", handleSocketClose);

    return () => {
      socket.removeEventListener("message", handleSocketMessage);
      socket.removeEventListener("close", handleSocketClose);
    };
  }, [socket, username]);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();

    sessionStorage.setItem("user", username);

    if (username.trim() !== "") {
      const welcomeMessage = "se ha unido al chat.";
      const messageObject = {
        type: "message",
        content: welcomeMessage,
        username,
      };

      socket.send(JSON.stringify(messageObject));
      setMessage("");
      setEnteredChat(true);
      onUsernameSubmit(username);
    }
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
  
    if (message.trim() !== '') {
      const whisperMatch = message.match(/^\/whisper (\w+) (.+)/);
      if (whisperMatch) {
        const whisperTarget = whisperMatch[1];
        const whisperContent = whisperMatch[2];
  
        try {
          const response = await fetch('http://localhost:8080/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username,
              content: whisperContent,
              whisper: true,
              whisperTarget,
            }),
          });
  
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
  
          const data = await response.json();
          console.log('Response from server:', data);
        } catch (error) {
          console.error('Error sending whisper:', error);
        }
      } else {
        const messageObject = {
          type: 'message',
          content: message,
          username,
        };
  
        // Manejo de errores al enviar mensajes a través de WebSocket
        try {
          socket.send(JSON.stringify(messageObject));
        } catch (error) {
          console.error('Error sending message via WebSocket:', error);
        }
      }
  
      setMessage('');
    }
  };
  

  const handleWhisper = (whisperTarget) => {
    setMessage(`/whisper ${whisperTarget} `);
    setWhisperTarget(whisperTarget);
  };

  const handleReply = () => {
    if (whisperTarget) {
      setMessage(`/whisper ${whisperTarget} `);
    }
  };

  const getUsernameFromSession = () => {
    const user = sessionStorage.getItem("user");
    setUsername(user);
  };

  return (
    <div className="ChatContainer">
      {enteredChat ? (
        <div>
          <h1>Bienvenido al Chat, {username}!</h1>
          <div className="UserCountContainer">
            <p>Usuarios Conectados: {connectedUsers}</p>
          </div>
          <div className="MessagesContainer" ref={messagesEndRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`Message ${
                  msg.username === username ? "UserMessage" : "OtherMessage"
                }${msg.whisper ? " WhisperMessage" : ""}`}
              >
                <strong>{msg.username}:</strong> {msg.content}
                {msg.whisper && (
                  <button onClick={() => handleWhisper(msg.username)}>
                    Responder
                  </button>
                )}
                {!msg.whisper && (
                  <button onClick={() => handleWhisper(msg.username)}>
                    Susurrar
                  </button>
                )}
              </div>
            ))}
          </div>
          <div
            className="WhisperMessagesContainer"
            style={{ maxHeight: "200px", overflowY: "auto" }}
          >
            {whisperMessages.map((whisper, index) => (
              <div key={index} className={`Message WhisperMessage`}>
                <strong>{whisper.username} (susurro):</strong> {whisper.content}
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
            <button
              type="button"
              onClick={handleReply}
              disabled={!whisperTarget}
            >
              Responder
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
