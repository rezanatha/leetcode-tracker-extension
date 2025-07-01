import React, { useEffect, useState } from 'react';
import './App.css';
import { LeetCodeProblem } from './types';
import { StorageService } from './storage';
import { scrapeLeetCodeDifficulty } from './notion';


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
    
    // Try to scrape difficulty from the current page
    let difficulty: 'Easy' | 'Medium' | 'Hard' | undefined;
    try {
      console.log('Attempting to scrape difficulty from:', currentUrl);
      const difficultyResult = await scrapeLeetCodeDifficulty(currentUrl);
      console.log('Difficulty scraping result:', difficultyResult);
      if (difficultyResult.success) {
        difficulty = difficultyResult.difficulty;
        console.log('Successfully scraped difficulty:', difficulty);
      } else {
        console.warn('Failed to scrape difficulty:', difficultyResult.error);
      }
    } catch (error) {
      console.warn('Failed to scrape difficulty:', error);
      // Continue without difficulty if scraping fails
    }
    
    const problem: LeetCodeProblem = {
      id: Date.now().toString(),
      title: tabTitle,
      url: currentUrl,
      problemNameFromUrl: problemName,
      dateAdded: new Date().toISOString(),
      difficulty: difficulty
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
      <div className="status-section">
        <p><strong>Status:</strong> {isLeetCode ? '✅ On LeetCode' : '❌ Not on LeetCode'}</p>
        {isLeetCode && (
          <>
            <p><strong>Is Problem:</strong> {isLeetCodeProblem ? 'Yes' : 'No'}</p>
            {isLeetCodeProblem && (
              <>
                <p><strong>Title:</strong> {tabTitle}</p>
                {isProblemSaved && currentProblem && (
                  <div className="problem-info">
                    {currentProblem.difficulty && (
                      <div className="difficulty-info">
                        <strong>Difficulty:</strong> 
                        <span className={`difficulty-${currentProblem.difficulty?.toLowerCase()}`}>
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
className={`action-button ${isProblemSaved ? 'remove-button' : 'save-button'}`}
                >
                  {isSaving ? (isProblemSaved ? 'Removing...' : 'Saving...') : (isProblemSaved ? 'Remove Problem' : 'Save Problem')}
                </button>
              </>
            )}
          </>
        )}
      </div>
      <div className="navigation-section">
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('problems.html') })}
className="nav-button view-problems-button"
        >
         View All Problems ({problems.length})
        </button>
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })}
className="nav-button options-button"
        >
          ⚙️ Options
        </button>
        <div className="app-footer">
          <p>LeetCode Notion Tracker v1.0</p>
          <p>Save problems to track your progress</p>
        </div>
      </div>
    </div>
  );
};

export default App;