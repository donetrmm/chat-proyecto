// App.js
import React, { useState } from 'react';
import GeneralChat from './pages/GeneralChat';
import GamesChat from './pages/GamesChat';
import './App.css';

const App = () => {
  const [username, setUsername] = useState('');
  const [showGamesChat, setShowGamesChat] = useState(false);

  const handleUsernameSubmit = (name) => {
    setUsername(name);
  };

  const switchToGamesChat = () => {
    setShowGamesChat(true);
  };

  const handleReturnToGeneralChat = (name) => {
    setShowGamesChat(false);
    // Si se proporciona un nombre al regresar, lo establecemos como nombre de usuario
    if (name) {
      setUsername(name);
    }
  };

  return (
    <div className="App">
      {showGamesChat ? (
        <GamesChat username={username} onReturnToGeneralChat={handleReturnToGeneralChat} />
      ) : (
        <GeneralChat
          username={username}
          onUsernameSubmit={handleUsernameSubmit}
          onSwitchToGamesChat={switchToGamesChat}
        />
      )}
    </div>
  );
};

export default App;
