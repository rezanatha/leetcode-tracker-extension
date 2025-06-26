import React, { useEffect, useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  const [isLeetCode, setIsLeetCode] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLeetCodeProblem, setLeetCodeProblem] = useState(false);
  const [tabTitle, setTabTitle] = useState('');

  useEffect(() => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const url = tabs[0].url || '';
      setCurrentUrl(url);
      try {
        const urlObj = new URL(url);
        const isLeetCodeSite = urlObj.hostname === 'leetcode.com'||
                               urlObj.hostname === 'www.leetcode.com' ||
                               urlObj.hostname.endsWith('.leetcode.com');
        setIsLeetCode(isLeetCodeSite);

        if (isLeetCodeSite) {
          const leetCodeProblemObj = new URL(url);
          const isLeetCodeProblem = leetCodeProblemObj.pathname.startsWith('/problems/')
          setLeetCodeProblem(isLeetCodeProblem);
          if (isLeetCodeProblem) {
            const tab = tabs[0];
            setTabTitle(tab.title?.replace(' - LeetCode', '') || 'N/A');
            //const problemName = title.replace(' - LeetCode', '');
          }

        } 



      } catch (error) {
        setIsLeetCode(false);
      }



    });
  }, []
);

  return (
    <div className="app-container">
      <h1 className="app-title">
        Leetcode Tracker
      </h1>
      <div>
          <p>Current URL: {currentUrl}</p>
          <p>Status: {isLeetCode ? '✅ On LeetCode' : '❌ Not on LeetCode'}</p>
          <p>Is Problem? {isLeetCodeProblem ? 'Yes': 'No'} </p>
          <p>Title: {tabTitle}</p>

      </div>
      <div className="counter-section">
        <h2 className="counter-title">Counter: {count}</h2>
      </div>
      
      <div className="button-section">
        <button 
          onClick={increment}
          className="button button-increment"
        >
          +
        </button>
        
        <button 
          onClick={decrement}
          className="button button-decrement"
        >
          -
        </button>
      </div>
      
      <p className="app-description">
        This is a React-based Chrome extension!
      </p>
    </div>
  );
};

export default App;