import React, { useEffect, useState } from 'react';
import './App.css';
import { LeetCodeProblem } from './types';
import { StorageService } from './storage';
import { scrapeLeetCodeDifficulty, syncBidirectionalWithNotion } from './notion';


const App: React.FC = () => {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);

  const [isLeetCode, setIsLeetCode] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLeetCodeProblem, setLeetCodeProblem] = useState(false);
  const [tabTitle, setTabTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isProblemSaved, setIsProblemSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  
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
    
    // Check if auto-sync is enabled and trigger sync
    try {
      const config = await StorageService.getConfig();
      if (config.autoSync && config.notionToken && config.databaseId) {
        setSyncMessage('🔄 Auto-syncing to Notion...');
        setAutoSyncing(true);
        
        const updatedProblems = await StorageService.getProblems();
        const result = await syncBidirectionalWithNotion(config.notionToken, config.databaseId, updatedProblems);
        
        if (result.success) {
          // Update last sync time
          await StorageService.updateLastSyncTime();
          setSyncMessage('✅ Auto-sync completed successfully!');
        } else {
          setSyncMessage(`❌ Auto-sync failed: ${result.error}`);
        }
        
        setTimeout(() => setSyncMessage(''), 5000);
        setAutoSyncing(false);
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
      setAutoSyncing(false);
    }
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

  const syncToNotion = async () => {
    setSyncing(true);
    setSyncMessage('');
    
    try {
      // Load config
      const config = await StorageService.getConfig();
      if (!config.notionToken || !config.databaseId) {
        setSyncMessage('❌ Please configure your Notion API token and database ID in Options first.');
        setSyncing(false);
        setTimeout(() => setSyncMessage(''), 5000);
        return;
      }

      // Start sync
      setSyncMessage('🔄 Starting sync to Notion...');
      const result = await syncBidirectionalWithNotion(config.notionToken, config.databaseId, problems);
      
      if (result.success) {
        // Update last sync time
        await StorageService.updateLastSyncTime();
        
        const { results } = result;
        if (results) {
          const successMsg = `✅ Sync completed! ${results.success} added, ${results.deleted} deleted, ${results.skipped} skipped, ${results.failed} failed.`;
          setSyncMessage(successMsg);
          
          if (results.failed > 0 && results.errors.length > 0) {
            console.error('Sync errors:', results.errors);
            const errorDetails = results.errors.slice(0, 3).join('\n');
            setSyncMessage(successMsg + `\n\nFirst errors:\n${errorDetails}`);
          }
        } else {
          setSyncMessage('✅ Sync completed successfully!');
        }
      } else {
        // Handle specific error types
        if (result.error?.includes('API Error 401')) {
          setSyncMessage('❌ Invalid Notion API token. Please check your configuration in Options.');
        } else if (result.error?.includes('API Error 404')) {
          setSyncMessage('❌ Database not found. Please check your database ID in Options.');
        } else if (result.schemaBroken) {
          setSyncMessage(`❌ Database schema error:\n${result.error}`);
        } else {
          setSyncMessage(`❌ Sync failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncMessage(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setSyncing(false);
    setTimeout(() => setSyncMessage(''), 10000);
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
        LeetCode-Notion Tracker
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
      {syncMessage && (
        <div className={`sync-message ${
          syncMessage.includes('❌') ? 'error' : 
          syncMessage.includes('✅') ? 'success' : 'info'
        }`}>
          {syncMessage}
        </div>
      )}
      <div className="navigation-section">
        {problems.length > 0 && (
          <button
            onClick={syncToNotion}
            disabled={syncing}
            className={`nav-button sync-button ${syncing ? 'syncing' : 'ready'}`}
          >
            {syncing ? 'Syncing...' : 'Sync to Notion'}
          </button>
        )}
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('problems.html') })}
className="nav-button view-problems-button"
        >
         View All Problems ({problems.length})
        </button>
      </div>
    </div>
  );
};

export default App;