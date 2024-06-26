import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sparkles from './Sparkles';
import FSSparkles from './FSSparkles';
import { ReactComponent as QuillIcon } from './assets/quill2.svg';
import { ReactComponent as QuillIcon2 } from './assets/quill.svg';
import { ReactComponent as AIIcon } from './assets/ai.svg';
import { ReactComponent as UserIcon } from './assets/user.svg';
import './App.css';

function App() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<TextEditor initialCondition={null} />} />
          <Route path="/condition1" element={<TextEditor initialCondition="condition1" />} />
          <Route path="/condition2" element={<TextEditor initialCondition="condition2" />} />
          <Route path="/condition3" element={<TextEditor initialCondition="condition3" />} />
        </Routes>
      </Router>
    );
}
  
export default App;


function TextEditor({ initialCondition }) {
    const [text, setText] = useState("");
    const editorRef = useRef(null);
    const ignoreNextInput = useRef(false);
    const conditions = ['condition1', 'condition2', 'condition3'];
    // Set initial condition randomly if initialCondition is null, otherwise use initialCondition
    const [condition, setCondition] = useState(() => {
        if (initialCondition === null) {
            const randomIndex = Math.floor(Math.random() * conditions.length);
            return conditions[randomIndex];
        } else {
            return initialCondition;
        }
    });
    const [showSparkles, setShowSparkles] = useState(false);

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
        if (safeText.trim().length === 0) {
            // If there is no text, do nothing and return early
            return;
        }
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
            const endsWithSpace = /[\s\u00A0]$/.test(safeText);
            const spacePrefix = endsWithSpace ? '' : ' ';
            const newText = safeText + spacePrefix + data.response;
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
        const apiURL = 'https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text';
        // Need to use the innerText or else the checking for spacePrefix doesn't work reliably
        const editorText = editorRef.current ? editorRef.current.innerText : ""; // Directly use the current editor text
        const safeText = DOMPurify.sanitize(editorText);
        if (safeText.trim().length === 0) {
            // If there is no text, do nothing and return early
            return;
        }
        editorRef.current.classList.remove("placeholder");
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

            // Trigger sparkles
            setShowSparkles(true);
            
            // Set a timeout to hide sparkles after 3-5 seconds
            setTimeout(() => {
                setShowSparkles(false);
            }, 3000);  // Change 3000 to 5000 for 5 seconds

        })
        .catch(error => console.error('Error:', error));
    };

    const handleAgentWrite = () => {
        const safeText = DOMPurify.sanitize(text);
        if (safeText.trim().length === 0) {
            // If there is no text, do nothing and return early
            return;
        }
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
            const delay = 40; // milliseconds between "keystrokes"
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
        <div className={`text-editor-container`}>
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
            {showSparkles && <FSSparkles />}
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
    const [style, setStyle] = useState('Creative');  // Default style
    const [verbosity, setVerbosity] = useState(50);  // Default slider value for verbosity
    const [creativity, setCreativity] = useState(50);  // Default slider value for creativity
  
    const handleToneChange = (event) => {
      setTone(event.target.value);
    };
  
    const handleStyleChange = (event) => {
      setStyle(event.target.value);
    };
  
    const handleVerbosityChange = (event) => {
      setVerbosity(event.target.value);
    };
  
    const handleCreativityChange = (event) => {
      setCreativity(event.target.value);
    };
  
    return (
      <div style={{ padding: '20px' }}>
        <p>Select the tone, style, creativity, and verbosity of your text, and the Autowrite tool will complete your paragraph.</p>
        <button onClick={onAutowrite}>Autowrite</button>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="tone-dropdown">Tone: </label>
          <select id="tone-dropdown" value={tone} onChange={handleToneChange}>
            <option value="Casual">Casual</option>
            <option value="Formal">Formal</option>
            <option value="Academic">Academic</option>
          </select>
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="style-dropdown">Style: </label>
          <select id="style-dropdown" value={style} onChange={handleStyleChange}>
            <option value="Creative">Creative</option>
            <option value="Technical">Technical</option>
            <option value="Narrative">Narrative</option>
          </select>
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="creativity-slider">Creativity: </label>
          <input 
            type="range" 
            id="creativity-slider" 
            value={creativity} 
            onChange={handleCreativityChange} 
            min="0" 
            max="100" 
          />
          <span>{creativity}</span>
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="verbosity-slider">Verbosity: </label>
          <input 
            type="range" 
            id="verbosity-slider" 
            value={verbosity} 
            onChange={handleVerbosityChange} 
            min="0" 
            max="100" 
          />
          <span>{verbosity}</span>
        </div>
        
      </div>
    );
  }

function ComponentForCondition2({ onMagicWrite }) {
  return (
      <div>
          <p>Let the <Sparkles>magic quill</Sparkles> finish your paragraph.</p>
          <Sparkles>
            <button onClick={onMagicWrite} className='magic-button'>
                <QuillIcon className="icon-quill" />
            </button>
          </Sparkles>
      </div>
  );
}

function ComponentForCondition3({ text, onAgentWrite }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
  
    useEffect(() => {
        const initialMessage = {
            text: 'Hi! I am your helpful writing assistant. I am here to help you complete a paragraph.',
            sender: 'AI'
        };
        setMessages([initialMessage]);
    }, []);
  
    const handleInputChange = (event) => {
        setInput(event.target.value);
    };
  
    const handleSuggestionClick = () => {
        const suggestion = "Please read my text and continue writing from the cursor";
        const safeText = DOMPurify.sanitize(text);
        if (safeText.trim().length === 0) {
            setMessages(messages => [...messages, { text: suggestion, sender: 'User' }]);
            setMessages(messages => [...messages, { text: "Sorry, I don't see any text!", sender: 'AI' }]);
        }
        else {
            setMessages(messages => [...messages, { text: suggestion, sender: 'User' }]);
            setMessages(messages => [...messages, { text: "Gladly, I'll type it up now!", sender: 'AI' }]);
            
        }
        onAgentWrite();
    };
  
    const handleSubmit = () => {
        if (input.trim() !== '') {
            setMessages(messages => [...messages, { text: input, sender: 'User' }]);
            setMessages(messages => [...messages, { text: `Sorry I'm not available to chat right now. You can choose the suggestion below and I'll help write your text.`, sender: 'AI' }]);
            setInput('');
        }
    };
  
    return (
        <div>
            <div className="chat-container">
                {messages.map((message, index) => (
                    <div key={index} className={`chat-message ${message.sender.toLowerCase()}`}>
                        {message.sender === 'AI' ? (
                            <>
                                <AIIcon className="chat-message-icon" />
                                <div>{message.text}</div>
                            </>
                        ) : (
                            <>
                                <div>{message.text}</div>
                                <UserIcon className="chat-message-icon" />
                            </>
                        )}
                    </div>
                ))}
            </div>
            <div onClick={handleSuggestionClick} className="chat-suggestion">
                Please read my text and continue writing for me
            </div>
            {/* <input
                type="text"
                value={input}
                onChange={handleInputChange}
                className="chat-input"
                placeholder='Chat not implemented.'
            />
            <button onClick={handleSubmit}>Send</button> */}
        </div>
    );
  }

//   export default TextEditor;