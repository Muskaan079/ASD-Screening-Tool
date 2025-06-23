import React, { useState } from 'react';
import './Screening.css';

const Screening = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'practitioner',
      text: 'Hello! I\'ll be guiding you through this screening session. How are you feeling today?',
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: 'patient',
      text: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate practitioner response (this would be replaced with actual AI/backend logic)
    setTimeout(() => {
      const practitionerResponse = {
        id: messages.length + 2,
        sender: 'practitioner',
        text: 'Thank you for sharing. Could you tell me more about that?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, practitionerResponse]);
    }, 1000);
  };

  return (
    <div className="screening-container">
      <div className="chat-header">
        <h2>ASD Screening Session</h2>
        <p>Chat with your practitioner</p>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'practitioner' ? 'practitioner' : 'patient'}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Screening; 