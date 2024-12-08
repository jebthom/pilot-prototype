import React, { useState } from 'react';

const ProlificModal = ({ isOpen, onSubmit }) => {
  const [prolificId, setProlificId] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  const validateProlificId = (id) => {
    const regex = /^[a-zA-Z0-9]{24}$/;
    return regex.test(id);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setProlificId(value);
    setTouched(true);
    setIsValid(validateProlificId(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(prolificId);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Enter Your Prolific ID</h2>
        <p>Please enter your 24-character Prolific ID to continue.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="text"
              value={prolificId}
              onChange={handleChange}
              placeholder="Enter your Prolific ID"
              maxLength={24}
              className="prolific-input"
            />
            {touched && (
              <span className={`validation-indicator ${isValid ? 'valid' : 'invalid'}`}>
                {isValid ? '✓' : '✗'}
              </span>
            )}
          </div>
          
          {touched && !isValid && (
            <p className="error-message">
              Please enter a valid 24-character alphanumeric Prolific ID
            </p>
          )}
          
          <button 
            type="submit" 
            disabled={!isValid}
            className={`submit-button ${!isValid ? 'disabled' : ''}`}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProlificModal;