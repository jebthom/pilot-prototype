import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Sparkles from './Sparkles';
import './App.css';


function TextEditor() {
    const [text, setText] = useState("");
    const editorRef = useRef(null);
    const ignoreNextInput = useRef(false);
    const conditions = ['condition1', 'condition2', 'condition3'];
    const [condition, setCondition] = useState(() => {
        const randomIndex = Math.floor(Math.random() * conditions.length);
        return conditions[randomIndex];
    });

    useEffect(() => {
        if (text.trim() === "") {
            editorRef.current.classList.add("placeholder");
        } else {
            editorRef.current.classList.remove("placeholder");
        }
    }, []); // Empty dependency array to run only once on mount

    const handleInput = (e) => {
        if (!ignoreNextInput.current) {
            setText(e.target.innerText);
            if (e.target.innerText.trim() === "") {
                editorRef.current.classList.add("placeholder");
            } else {
                editorRef.current.classList.remove("placeholder");
            }
        } else {
            ignoreNextInput.current = false; // Reset for next updates
        }
    };

    const handleAutowrite = () => {
        const safeText = DOMPurify.sanitize(text);
        editorRef.current.classList.remove("placeholder");
        const cursorPosition = safeText.length; // We'll pass the length of the text as the cursor position
        fetch('https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: safeText,
                cursorPosition: cursorPosition
            })
        })
        .then(response => response.json())
        .then(data => {
            // Combine text and new response
            const newText = safeText + (safeText.endsWith(' ') ? '' : ' ') + data.response;
            ignoreNextInput.current = true; // Ignore the next input event triggered by the manual update
            setText(newText);
            if (editorRef.current) {
                editorRef.current.innerText = newText; // Manually update text
                placeCaretAtEnd(editorRef.current); // Set caret at the end
            }
        })
        .catch(error => console.error('Error:', error));
    };

    function placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != "undefined"
                && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    const handleMagicWrite = () => {
        editorRef.current.classList.remove("placeholder");
        const apiURL = 'https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text';
        // Need to use the innerText or else the checking for spacePrefix doesn't work reliably
        const editorText = editorRef.current ? editorRef.current.innerText : ""; // Directly use the current editor text
        const safeText = DOMPurify.sanitize(editorText);
        const cursorPosition = safeText.length;
    
        fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: safeText,
                cursorPosition: cursorPosition
            })
        })
        .then(response => response.json())
        .then(data => {
            const endsWithSpace = /[\s\u00A0]$/.test(safeText);
            const spacePrefix = endsWithSpace ? '' : ' ';
            const newText = safeText + spacePrefix + data.response;
    
            // Update React state
            setText(newText);
    
            // Append text with animation
            const span = document.createElement('span');
            span.className = 'fade-text';
            span.textContent = spacePrefix + data.response;
    
            if (editorRef.current) {
                editorRef.current.appendChild(span);
                placeCaretAtEnd(editorRef.current);
            }
    
            ignoreNextInput.current = true; // To ignore the next input event
        })
        .catch(error => console.error('Error:', error));
    };

    const handleAgentWrite = () => {
        editorRef.current.classList.remove("placeholder");
        const apiURL = 'https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text';
        const cursorPosition = text.length;
    
        fetch(apiURL, {
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
            const fullResponse = data.response;
            const delay = 50; // milliseconds between "keystrokes"
            typeText(fullResponse, delay);
        })
        .catch(error => console.error('Error:', error));
    };
    
    function typeText(fullText, delay) {
        // Use a regular expression to check for ending space characters
        const currentText = editorRef.current.innerText;
        let safeText = DOMPurify.sanitize(currentText);
        // Match any space character including spaces, tabs, newlines, and no-break spaces
        const endsWithSpace = /[\s\u00A0]$/.test(safeText);
    
        // Set shouldStartWithSpace true if there is text and it does not end with a space
        const shouldStartWithSpace = safeText.length > 0 && !endsWithSpace;
    
        // Split the fullText into words based on spaces
        const words = fullText.split(' ');
        let currentWordIndex = 0;
    
        const intervalId = setInterval(() => {
            if (currentWordIndex < words.length) {
                const nextWord = words[currentWordIndex];
    
                // Add a space before the next word if it's not the first word or if starting with a space is needed
                if (currentWordIndex > 0 || (currentWordIndex === 0 && shouldStartWithSpace)) {
                    safeText += ' ';
                }
                safeText += nextWord;
    
                editorRef.current.innerText = safeText;
                setText(editorRef.current.innerText); // Update React state to reflect current text
                placeCaretAtEnd(editorRef.current); // Optionally keep the caret at the end
    
                currentWordIndex++; // Move to the next word
            } else {
                clearInterval(intervalId); // Stop the interval when done
            }
        }, delay);
    }

    return (
        <div className="text-editor-container">
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="editor"
                data-placeholder="Start typing here..."
            />
            <div className='ai-area'>
                {renderAIComponent(condition, handleAutowrite, handleMagicWrite, handleAgentWrite, text)}
            </div>
        </div>
    );
}

function renderAIComponent(condition, handleAutowrite, handleMagicWrite, handleAgentWrite, text) {
    switch (condition) {
        case 'condition1':
            return <DefaultComponent onAutowrite={handleAutowrite} />;
        case 'condition2':
            return <ComponentForCondition2 onMagicWrite={handleMagicWrite} />;
        case 'condition3':
            return <ComponentForCondition3 text={text} onAgentWrite={handleAgentWrite} />;
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
          <p>Select the tone of your text, and the Autowrite tool will continue your text.</p>
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
          <p>Magic Write will magically match your tone and continue your text.</p>
          <Sparkles>
            <button onClick={onMagicWrite}>Magic Write</button>
          </Sparkles>
      </div>
  );
}

function ComponentForCondition3({ text, onAgentWrite }) {
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
      onAgentWrite();
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
              Please read my text and continue writing for me
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