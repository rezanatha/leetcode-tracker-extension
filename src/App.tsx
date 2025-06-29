import React, { useEffect, useState } from 'react';
import './App.css';
import { LeetCodeProblem } from './types';
import { StorageService } from './storage';


const App: React.FC = () => {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);

  const [isLeetCode, setIsLeetCode] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLeetCodeProblem, setLeetCodeProblem] = useState(false);
  const [tabTitle, setTabTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isProblemSaved, setIsProblemSaved] = useState(false);
  
  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    const storedProblems = await StorageService.getProblems();
    setProblems(storedProblems);
    checkIfProblemSaved(storedProblems);
  };

  const [currentProblem, setCurrentProblem] = useState<LeetCodeProblem | null>(null);

  const checkIfProblemSaved = (problemsList = problems) => {
    if (!isLeetCodeProblem || !currentUrl) {
      setIsProblemSaved(false);
      setCurrentProblem(null);
      return;
    }
    
    const urlObj = new URL(currentUrl);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const currentProblemName = pathSegments[1];
    
    const foundProblem = problemsList.find(p => p.problemNameFromUrl === currentProblemName);
    setIsProblemSaved(!!foundProblem);
    setCurrentProblem(foundProblem || null);
  };

  const saveProblem = async () => {
    if (!isLeetCodeProblem || !tabTitle || !currentUrl) return;
    
    setIsSaving(true);
    const urlObj = new URL(currentUrl);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const problemName = pathSegments[1];
    const problem: LeetCodeProblem = {
      id: Date.now().toString(),
      title: tabTitle,
      url: currentUrl,
      problemNameFromUrl: problemName,
      dateAdded: new Date().toISOString(),
      status: 'Not Started'
    };
    
    await StorageService.addProblem(problem);
    await loadProblems();
    setIsSaving(false);
  };


  const removeProblem = async () => {
    if (!isLeetCodeProblem || !currentUrl) return;
    
    setIsSaving(true);
    const urlObj = new URL(currentUrl);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const currentProblemName = pathSegments[1];
    
    const existingProblem = problems.find(p => p.problemNameFromUrl === currentProblemName);
    if (existingProblem) {
      await StorageService.deleteProblem(existingProblem.id);
      await loadProblems();
    }
    setIsSaving(false);
  };

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
  }, []);

  useEffect(() => {
    checkIfProblemSaved();
  }, [isLeetCodeProblem, currentUrl, problems]);

  return (
    <div className="app-container">
      <h1 className="app-title">
        Leetcode Tracker
      </h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Status:</strong> {isLeetCode ? '✅ On LeetCode' : '❌ Not on LeetCode'}</p>
        {isLeetCode && (
          <>
            <p><strong>Is Problem:</strong> {isLeetCodeProblem ? 'Yes' : 'No'}</p>
            {isLeetCodeProblem && (
              <>
                <p><strong>Title:</strong> {tabTitle}</p>
                {isProblemSaved && currentProblem && (
                  <div style={{ 
                    marginBottom: '15px', 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>Status:</strong> 
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: 
                          currentProblem.status === 'Solved' ? '#d4edda' :
                          currentProblem.status === 'Attempted' ? '#fff3cd' : '#f8d7da',
                        color:
                          currentProblem.status === 'Solved' ? '#155724' :
                          currentProblem.status === 'Attempted' ? '#856404' : '#721c24'
                      }}>
                        {currentProblem.status || 'Not Started'}
                      </span>
                    </div>
                    {currentProblem.difficulty && (
                      <div style={{ marginBottom: '5px' }}>
                        <strong>Difficulty:</strong> 
                        <span style={{
                          marginLeft: '8px',
                          color: 
                            currentProblem.difficulty === 'Easy' ? '#28a745' :
                            currentProblem.difficulty === 'Medium' ? '#ffc107' : '#dc3545'
                        }}>
                          {currentProblem.difficulty}
                        </span>
                      </div>
                    )}
                    <div>
                      <strong>Date Added:</strong> {new Date(currentProblem.dateAdded).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <button 
                  onClick={isProblemSaved ? removeProblem : saveProblem}
                  disabled={isSaving}
                  style={{
                    background: isProblemSaved ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? (isProblemSaved ? 'Removing...' : 'Saving...') : (isProblemSaved ? 'Remove Problem' : 'Save Problem')}
                </button>
              </>
            )}
          </>
        )}
      </div>
      <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '20px' }}>
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('problems.html') })}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
         View All Problems ({problems.length})
        </button>
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('notion-test.html') })}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginTop: '10px'
          }}
        >
          🧪 Test Notion API
        </button>
      </div>
    </div>
  );
};

export default App;