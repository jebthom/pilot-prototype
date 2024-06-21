import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import './App.css';
import 'react-quill/dist/quill.snow.css'; // Include the Quill CSS

function TextEditor() {
    
    const [text, setText] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selection, setSelection] = useState(null);
    const conditions = ['condition1', 'condition2', 'condition3'];
    const [condition, setCondition] = useState(() => {
        const randomIndex = Math.floor(Math.random() * conditions.length);
        return conditions[randomIndex];
    });
    const quillRef = useRef(null);
    

    const handleTextChange = (content, delta, source, editor) => {
        setText(content);
        setSelection(editor.getSelection());
        
    };


    const handleSelectionChange = (range, source, editor) => {
        if (range) {
            setCursorPosition(range.index);  // Update cursor position
        }
    };

    const handleAutowrite = () => {
        if (cursorPosition !== null) {
            // Adjusting the cursor position by +3 to account for non-visible formatting characters
            // that are not reflected in the plain text cursor index.
            const adjustedPosition = cursorPosition + 3;
            fetch('https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    cursorPosition: adjustedPosition
                })
            })
            .then(response => response.json())
            .then(data => {
                const newText = insertTextAtPosition(text, data.response, adjustedPosition);
                setText(newText);
                // Set cursor position after ensuring the state update has rendered
                setTimeout(() => {
                    if (quillRef.current) {
                        const editor = quillRef.current.getEditor();
                        const newCursorPosition = adjustedPosition + data.response.length;
                        editor.setSelection(newCursorPosition - 2, 0);
                    } else {
                        console.log('Editor not available');
                    }
                }, 0); // Adjust timeout as necessary, testing with 0 (next event loop) to start
               
            })
            .catch(error => console.error('Error:', error));
        }
    };
    
    const insertTextAtPosition = (originalText, insertText, position) => {
        const beforeText = originalText.substring(0, position);
        const afterText = originalText.substring(position);
        const spaceIfNeeded = position > 0 && originalText[position - 1] !== ' ' ? ' ' : '';
        return beforeText + spaceIfNeeded + insertText + afterText;
    };

    const handleMagicWrite = () => {
        if (cursorPosition !== null) {
            // Adjusting the cursor position by +3 to account for non-visible formatting characters
            // that are not reflected in the plain text cursor index.
            const adjustedPosition = cursorPosition + 3;
            fetch('https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    cursorPosition: adjustedPosition
                })
            })
            .then(response => response.json())
            .then(data => {
                const newText = insertTextAtPosition(text, data.response, adjustedPosition);
                setText(newText);
                // Set cursor position after ensuring the state update has rendered
                setTimeout(() => {
                    if (quillRef.current) {
                        const editor = quillRef.current.getEditor();
                        const newCursorPosition = adjustedPosition + data.response.length;
                        console.log('Setting cursor position to:', newCursorPosition); // Debug log
                        editor.setSelection(newCursorPosition - 2, 0);
                    } else {
                        console.log('Editor not available');
                    }
                }, 0); // Adjust timeout as necessary, testing with 0 (next event loop) to start
                const quillContainer = document.querySelector('.custom-quill');
                quillContainer.classList.add('fade-text');
                setTimeout(() => {
                    quillContainer.classList.remove('fade-text');
                }, 3000); // Matches animation duration
            })
            .catch(error => console.error('Error:', error));
        }
    };

    const insertMagicTextAtPosition = (originalText, insertText, position) => {
        const beforeText = originalText.substring(0, position);
        const afterText = originalText.substring(position);
        // Wrap the insertText in a span for animation
        const animatedText = `<span class="fade-in-text">${insertText}</span>`;
        return beforeText + animatedText + afterText;
    };

    return (
        <div className='text-editor-container'>
            <ReactQuill
                className='custom-quill'
                ref={quillRef}
                theme="snow"
                value={text}
                onChange={handleTextChange}
                onChangeSelection={handleSelectionChange}
                placeholder='Start typing here...'
            />
            <div className='ai-area'>
                {renderAIComponent(condition, handleAutowrite, handleMagicWrite, text, selection)}
            </div>
        </div>
    );
}

function renderAIComponent(condition, handleAutowrite, handleMagicWrite, cursorPosition, text) {
    switch (condition) {
        case 'condition1':
            return <DefaultComponent onAutowrite={handleAutowrite} />;
        case 'condition2':
            return <ComponentForCondition2 onMagicWrite={handleMagicWrite} />;
        case 'condition3':
            return <ComponentForCondition3 cursorPosition={cursorPosition} text={text} onMagicWrite={handleMagicWrite} />;
        default:
            return <DefaultComponent onAutowrite={handleAutowrite} />;
    }
}

function DefaultComponent({ onAutowrite }) {
  const [tone, setTone] = useState('Casual');  // Default tone

  const handleToneChange = (event) => {
      setTone(event.target.value);
  };

  return (
      <div>
          <p>Select the tone of your text, and the Autowrite tool will continue your text from the current cursor location.</p>
          <button onClick={onAutowrite}>Autowrite</button>
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
          <p>Magic Write will magically match your tone and continue your text from the current cursor location.</p>
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
        //   const textBeforeCursor = text.substring(0, cursorPosition);
          setMessages(messages => [...messages, { text: `Sorry I'm not available to chat right now. You can choose the suggestion below and I'll help write your text.`, sender: 'AI' }]);
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
              placeholder='Chat not implemented.'
          />
          <button onClick={handleSubmit}>Send</button>
      </div>
  );
}

export default TextEditor;