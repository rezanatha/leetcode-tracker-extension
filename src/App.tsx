import React, { useEffect, useState } from 'react';
import './App.css';
import { LeetCodeProblem } from './types';
import { StorageService } from './storage';
import ProblemsTable from './ProblemsTable';

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

  const checkIfProblemSaved = (problemsList = problems) => {
    if (!isLeetCodeProblem || !currentUrl) {
      setIsProblemSaved(false);
      return;
    }
    
    const urlObj = new URL(currentUrl);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const currentProblemName = pathSegments[1];
    
    const exists = problemsList.some(p => p.problemNameFromUrl === currentProblemName);
    setIsProblemSaved(exists);
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

  const deleteProblem = async (problemId: string) => {
    await StorageService.deleteProblem(problemId);
    await loadProblems();
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
      <ProblemsTable problems={problems} onDelete={deleteProblem} />
    </div>
  );
};

export default App;