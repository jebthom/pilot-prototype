import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sparkles from './Sparkles';
import FSSparkles from './FSSparkles';
import { ReactComponent as QuillIcon } from './assets/quill2.svg';
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
          <Route path="/condition4" element={<TextEditor initialCondition="condition4" />} />
          <Route path="/condition5" element={<TextEditor initialCondition="condition5" />} />
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
    const [condition, /*setCondition*/] = useState(() => {
        if (initialCondition === null) {
            const randomIndex = Math.floor(Math.random() * conditions.length);
            return conditions[randomIndex];
        } else {
            return initialCondition;
        }
    });
    const [isButtonDisabled, setIsButtonDisabled] = useState(false); // State to manage temporary button disable
    const [showSparkles, setShowSparkles] = useState(false);
    const [agentTypingCompleted, setAgentTypingCompleted] = useState(false);
    const [agentStartTime, setAgentStartTime] = useState(null);
    // writingPrompt should always end with a space so that the concatenation is correct
    const writingPrompt = "Choose an object from the list and include it in your story: a silver locket that refuses to open, a cracked compass that always points south, or a pocketwatch that runs backwards. ";
    const framingText = "You have 5 minutes to use the application. Write a story based on the following prompt:   ";

    useEffect(() => {
        if (text.trim() === "") {
            editorRef.current.classList.add("placeholder");
        } else {
            editorRef.current.classList.remove("placeholder");
        }
    }, [text]); // Empty dependency array to run only once on mount

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

    const disableButtonTemporarily = () => {
        setIsButtonDisabled(true);
        setTimeout(() => {
            setIsButtonDisabled(false);
        }, 2000); // Disable the button for 2 seconds
    };

    const handleAutowrite = () => {
        if (isButtonDisabled) return; // Prevent function execution if the button is disabled
        disableButtonTemporarily(); // Disable the button temporarily
        const startTime = performance.now();
        const safeText = DOMPurify.sanitize(text);
        const combinedText = `${safeText}`;
        if (safeText.trim().length === 0) {
            // If there is no text, do nothing and return early
            return;
        }
        editorRef.current.classList.remove("placeholder");
        const cursorPosition = combinedText.length; // We'll pass the length of the text as the cursor position
        fetch('https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: combinedText,
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
        .finally(() => {
            const endTime = performance.now();  // Stop timing after the asynchronous operation completes
            // console.log(`handleAutowrite took ${endTime - startTime} milliseconds.`);
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
        if (isButtonDisabled) return; // Prevent function execution if the button is disabled
        disableButtonTemporarily(); // Disable the button temporarily
        const startTime = performance.now();
        const apiURL = 'https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text';
        // Need to use the innerText or else the checking for spacePrefix doesn't work reliably
        const editorText = editorRef.current ? editorRef.current.innerText : ""; // Directly use the current editor text
        const safeText = DOMPurify.sanitize(editorText);
        const combinedText = `${safeText}`;
        if (safeText.trim().length === 0) {
            // If there is no text, do nothing and return early
            return;
        }
        editorRef.current.classList.remove("placeholder");
        const cursorPosition = combinedText.length;
    
        fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: combinedText,
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
        .finally(() => {
            const endTime = performance.now();  // Stop timing after the asynchronous operation completes
            // console.log(`handleMagicWrite took ${endTime - startTime} milliseconds.`);
        })
        .catch(error => console.error('Error:', error));
    };

    const handleAgentWrite = () => {
        if (isButtonDisabled) return; // Prevent function execution if the button is disabled
        disableButtonTemporarily(); // Disable the button temporarily
        setAgentStartTime(performance.now());
        setAgentTypingCompleted(false);
        const safeText = DOMPurify.sanitize(text);
        const combinedText = `${safeText}`;
        if (safeText.trim().length === 0) {
            // If there is no text, do nothing and return early
            return;
        }
        editorRef.current.classList.remove("placeholder");
        const apiURL = 'https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-text';
        const cursorPosition = combinedText.length;
    
        fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: combinedText,
                cursorPosition: cursorPosition
            })
        })
        .then(response => response.json())
        .then(data => {
            const fullResponse = data.response;
            const delay = 30; // milliseconds between "keystrokes"
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
                setAgentTypingCompleted(true);

            }
        }, delay);
    }

    useEffect(() => {
        if (agentTypingCompleted && agentStartTime) {
            const endTime = performance.now();
            // console.log(`Total processing time: ${endTime - agentStartTime} milliseconds.`);
            setAgentTypingCompleted(false);  // Reset for next usage
        }
    }, [agentTypingCompleted, agentStartTime]);

    return (
        <div>
            <div >
                <span className='framing-text'>{framingText}</span>
                <span className='writing-prompt'>{writingPrompt}</span>
            </div>
            <div className={`text-editor-container`}>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    className="editor"
                    data-placeholder="Continue typing here..."
                />
                <div className='ai-area'>
                    {renderAIComponent(condition, handleAutowrite, handleMagicWrite, handleAgentWrite, text, isButtonDisabled, disableButtonTemporarily)}
                </div>
                {showSparkles && <FSSparkles />}
            </div>
        </div>
    );
}

function renderAIComponent(condition, handleAutowrite, handleMagicWrite, handleAgentWrite, text, isButtonDisabled, disableButtonTemporarily) {
    switch (condition) {
        case 'condition1':
            return <DefaultComponent onAutowrite={handleAutowrite} />;
        case 'condition2':
            return <ComponentForCondition2 onMagicWrite={handleMagicWrite} />;
        case 'condition3':
            return <ComponentForCondition3 text={text} onAgentWrite={handleAgentWrite} isDisabled={isButtonDisabled} disableButton={disableButtonTemporarily} />;
        case 'condition4':
            return <ComponentForCondition4 text={text} onAgentWrite={handleAgentWrite} isDisabled={isButtonDisabled} disableButton={disableButtonTemporarily} />;
        case 'condition5':
            return <ComponentForCondition5 text={text} onAgentWrite={handleAgentWrite} isDisabled={isButtonDisabled} disableButton={disableButtonTemporarily} />;
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
        <p>Select the tone, style, creativity, and verbosity of your text, and the Autowrite tool will continue your text.</p>
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
          <p>Let the <Sparkles>magic quill</Sparkles> continue your text.</p>
          <Sparkles>
            <button onClick={onMagicWrite} className='magic-button'>
                <QuillIcon className="icon-quill" />
            </button>
          </Sparkles>
      </div>
  );
}

function ComponentForCondition3({ text, onAgentWrite, isDisabled, disableButton }) {
    const [messages, setMessages] = useState([]);
    
    // const [input, setInput] = useState('');
  
    useEffect(() => {
        const initialMessage = {
            text: 'Hi! I am your helpful writing assistant. I am here to help you complete a paragraph.',
            sender: 'AI'
        };
        setMessages([initialMessage]);
    }, []);
  
    const handleSuggestionClick = () => {
        // console.log("disabled button", isDisabled);
        if (isDisabled) return; // Check if the button is disabled
        // disableButton(); // Disable the button temporarily
        const suggestion = "Please read my text and continue writing for me";
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

    /* These functions work with the chat input area, which has been removed for the pilot. */
    // const handleInputChange = (event) => {
    //     setInput(event.target.value);
    // };
  
    // const handleSubmit = () => {
    //     if (input.trim() !== '') {
    //         setMessages(messages => [...messages, { text: input, sender: 'User' }]);
    //         setMessages(messages => [...messages, { text: `Sorry I'm not available to chat right now. You can choose the suggestion below and I'll help write your text.`, sender: 'AI' }]);
    //         setInput('');
    //     }
    // };
  
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

  function ComponentForCondition4({ text, onAgentWrite, isDisabled, disableButton}) {
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [input, setInput] = useState('');
    const chatContainerRef = useRef(null);
  
    useEffect(() => {
        const initialMessage = {
            content: 'Hi! I am your helpful writing assistant. I am here to help you complete a paragraph.',
            role: 'AI'
        };
        const initialSystemMessage = {
            role: 'system',
            content: "You are a helpful writing assistant. Answer general writing questions, but politely decline to answer questions not related to writing. Respond with text only, without formatting or markdown."
        };
        setMessages([initialMessage]);
        setChatHistory([initialSystemMessage]);
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);
  
    const handleSuggestionClick = () => {
        // console.log("disabled button", isDisabled);
        if (isDisabled) return; // Check if the button is disabled
        // disableButton(); // Disable the button temporarily
        const suggestion = "Please read my text and continue writing for me";
        const safeText = DOMPurify.sanitize(text);
        if (safeText.trim().length === 0) {
            setMessages(messages => [...messages, { content: suggestion, role: 'User' }]);
            setMessages(messages => [...messages, { content: "Sorry, I don't see any text!", role: 'AI' }]);
        }
        else {
            setMessages(messages => [...messages, { content: suggestion, role: 'User' }]);
            setMessages(messages => [...messages, { content: "Gladly, I'll type it up now!", role: 'AI' }]);
            
        }
        onAgentWrite();
    };

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const handleSubmit = () => {
        if (input.trim() !== '') {
            const safeInput = DOMPurify.sanitize(input);
            const newMessage = { role: 'user', content: safeInput };
            const updatedChatHistory = [...chatHistory, newMessage];
            setMessages(messages => [...messages, newMessage]);
            setInput('');
            const apiURL = 'https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-chat-no-text';

            fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_history: updatedChatHistory
                })
            })
            .then(response => response.json())
            .then(data => {
                const assistantMessage = { role: 'AI', content: data.response};
                setMessages(messages => [...messages, assistantMessage]);
                setChatHistory(data.chat_history);
            })
            .catch(error => console.error('Error:', error));
        }
    };
  
    return (
        <div>
            <div className="chat-container" ref={chatContainerRef}>
                {messages.map((message, index) => (
                    <div key={index} className={`chat-message ${message.role.toLowerCase()}`}>
                        {message.role === 'AI' ? (
                            <>
                                <AIIcon className="chat-message-icon" />
                                <div>{message.content}</div>
                            </>
                        ) : (
                            <>
                                <div>{message.content}</div>
                                <UserIcon className="chat-message-icon" />
                            </>
                        )}
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
                placeholder='Chat with the Writing Assistant'
            />
            <button onClick={handleSubmit}>Send</button>
        </div>
    );
  }


  function ComponentForCondition5({ text, onAgentWrite, isDisabled, disableButton}) {
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [input, setInput] = useState('');
    const chatContainerRef = useRef(null);
  
    useEffect(() => {
        const initialMessage = {
            content: 'Hi! I am your helpful writing assistant. I am here to help you complete a paragraph.',
            role: 'AI'
        };
        const initialSystemMessage = {
            role: 'system',
            content: "You are an assistant designed to determine if a user's message is a request for text completion, continuing a story, or writing content for them. When a user sends a message, follow these guidelines: 1. If the user's message asks for text completion, to continue writing a story, or to add text for them using phrases like \"finish this text\", \"continue this story\", \"write the next part\", \"complete this sentence\", \"add more to this paragraph\", \"extend this text\", \"help me write more\", \"continue writing for me\", \"generate the next section\", \"provide the next lines\", \"add to this\", \"continue the narrative\", \"fill in the rest\", \"carry on with this text\", \"write for me\", \"write the following part\", or \"extend the narrative\", respond with 'true'. If the request mentions writing or text at all, respond with 'true'.  2. If the user's message is a question, a request for information, or any interaction not related to text completion, respond with 'false'.\n\nYour response should only be 'true' or 'false' based on these criteria."
        };
        setMessages([initialMessage]);
        setChatHistory([initialSystemMessage]);
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);
  
    const handleSuggestionClick = () => {
        // console.log("disabled button", isDisabled);
        if (isDisabled) return; // Check if the button is disabled
        // disableButton(); // Disable the button temporarily
        const suggestion = "Please read my text and continue writing for me";
        const safeText = DOMPurify.sanitize(text);
        if (safeText.trim().length === 0) {
            setMessages(messages => [...messages, { content: suggestion, role: 'User' }]);
            setMessages(messages => [...messages, { content: "Sorry, I don't see any text!", role: 'AI' }]);
        }
        else {
            setMessages(messages => [...messages, { content: suggestion, role: 'User' }]);
            setMessages(messages => [...messages, { content: "Gladly, I'll type it up now!", role: 'AI' }]);
            
        }
        onAgentWrite();
    };

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const handleSubmit = () => {
        if (input.trim() !== '') {
            const safeInput = DOMPurify.sanitize(input);
            const safeText = DOMPurify.sanitize(text);
            const newMessage = { role: 'user', content: safeInput };
            const updatedChatHistory = [...chatHistory, newMessage];
            setMessages(messages => [...messages, newMessage]);
            setInput('');

            const apiURL = 'https://pilot-prototype-31e1ca0e2a37.herokuapp.com/generate-chat-no-text';

            fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_history: updatedChatHistory
                })
            })
            .then(response => response.json())
            .then(data => {
                const assistantMessage = { role: 'AI', content: data.response};
                console.log("response", data.response);
                if (safeText.trim().length === 0) {
                    setMessages(messages => [...messages, { content: "Sorry, I don't see any text!", role: 'AI' }]);
                }
                else if (data.response === 'true') {
                    setMessages(messages => [...messages, { content: "Gladly, I'll type it up now!", role: 'AI' }]);
                    onAgentWrite();
                }
                else {
                    setMessages(messages => [...messages, { content: "Sorry, right now I can only help complete your text. Try making requests like \"finish this text\", \"continue this story\", \"write the next part\", \"add more to this paragraph\"", role: 'AI' }]);
                }
                setChatHistory(data.chat_history);

            })
            .catch(error => console.error('Error:', error));
        }
    };
  
    return (
        <div>
            <div className="chat-container" ref={chatContainerRef}>
                {messages.map((message, index) => (
                    <div key={index} className={`chat-message ${message.role.toLowerCase()}`}>
                        {message.role === 'AI' ? (
                            <>
                                <AIIcon className="chat-message-icon" />
                                <div>{message.content}</div>
                            </>
                        ) : (
                            <>
                                <div>{message.content}</div>
                                <UserIcon className="chat-message-icon" />
                            </>
                        )}
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
                placeholder='Chat with the Writing Assistant'
            />
            <button onClick={handleSubmit}>Send</button>
        </div>
    );
  }

//   export default TextEditor;