import React, { useState } from 'react';
import './App.css';

function TextEditor() {
    const [text, setText] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [condition, setCondition] = useState('condition3');

    const handleTextChange = (event) => {
        setText(event.target.value);
        setCursorPosition(event.target.selectionStart);
    };

    const handleConditionChange = (newCondition) => {
        setCondition(newCondition);
    };

    const handleAutowrite = (selectedTone) => {
      console.log("Autowrite with tone:", selectedTone);
      // make an API call to the backend
    };

    const handleMagicWrite = () => {
      fetch('http://localhost:5000/generate-text', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              text: text,
              cursorPosition: cursorPosition
          })
      })
      .then(response => response.json())
      .then(data => {
          // Check if the previous character is not a space and cursorPosition is not 0
          const spaceIfNeeded = cursorPosition > 0 && text[cursorPosition - 1] !== ' ' ? ' ' : '';
          // Insert the generated text with a space if needed
          setText(text.substring(0, cursorPosition) + spaceIfNeeded + data.response + text.substring(cursorPosition));
      })
      .catch(error => console.error('Error:', error));
    };

    return (
        <div className='text-editor-container'>
            <textarea
                className='text-area'
                value={text}
                onChange={handleTextChange}
                onClick={handleTextChange}
                onKeyUp={handleTextChange}
            />
            <div className='ai-area'>
                {renderAIComponent(condition, handleMagicWrite, cursorPosition, text)}
            </div>
        </div>
    );
}

function renderAIComponent(condition, handleMagicWrite, cursorPosition, text) {
    switch (condition) {
        case 'condition1':
            return <DefaultComponent onMagicWrite={handleMagicWrite} />;
        case 'condition2':
            return <ComponentForCondition2 onMagicWrite={handleMagicWrite} />;
        case 'condition3':
            return <ComponentForCondition3 cursorPosition={cursorPosition} text={text} onMagicWrite={handleMagicWrite} />;
        default:
            return <DefaultComponent onMagicWrite={handleMagicWrite} />;
    }
}

function DefaultComponent({ onMagicWrite }) {
  const [tone, setTone] = useState('Casual');  // Default tone

  const handleToneChange = (event) => {
      setTone(event.target.value);
  };

  return (
      <div>
          <button onClick={onMagicWrite}>Autowrite</button>
          <div>
              <label htmlFor="tone-dropdown">Tone: </label>
              <select id="tone-dropdown" value={tone} onChange={handleToneChange}>
                  <option value="Casual">Casual</option>
                  <option value="Formal">Formal</option>
                  <option value="Academic">Academic</option>
              </select>
          </div>
      </div>
  );
}

function ComponentForCondition2({ onMagicWrite }) {
  return (
      <div>
          <button onClick={onMagicWrite}>Magic Write</button>
      </div>
  );
}

function ComponentForCondition3({ cursorPosition, text, onMagicWrite }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleInputChange = (event) => {
      setInput(event.target.value);
  };

  const handleSuggestionClick = () => {
      // Simulate sending the suggested message
      const suggestion = "Please read my text and continue writing from the cursor";
      setMessages(messages => [...messages, { text: suggestion, sender: 'User' }]);
      // Simulate AI response and then call onMagicWrite to generate real continuation
      setMessages(messages => [...messages, { text: "Gladly, I'll type it up now!", sender: 'AI' }]);
      onMagicWrite();
  };

  const handleSubmit = () => {
      if (input.trim() !== '') {
          // Add the user's message to the chat
          setMessages(messages => [...messages, { text: input, sender: 'User' }]);
          // Simulate an AI response
          const textBeforeCursor = text.substring(0, cursorPosition);
          setMessages(messages => [...messages, { text: `The text before the current cursor position is ${textBeforeCursor}`, sender: 'AI' }]);
          // Clear the input field
          setInput('');
      }
  };

  return (
      <div>
          <div className="chat-container">
              {messages.map((message, index) => (
                  <div key={index} className={`chat-message ${message.sender.toLowerCase()}`}>
                      <div>{message.text}</div>
                  </div>
              ))}
          </div>
          <div onClick={handleSuggestionClick} className="chat-suggestion">
              Please read my text and continue writing from the cursor
          </div>
          <input
              type="text"
              value={input}
              onChange={handleInputChange}
              className="chat-input"
          />
          <button onClick={handleSubmit}>Send</button>
      </div>
  );
}

export default TextEditor;