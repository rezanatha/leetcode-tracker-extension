import React, { useEffect, useState } from 'react';
import './ProblemsPage.css';
import { LeetCodeProblem } from './types';
import { StorageService } from './storage';
import { syncBidirectionalWithNotion } from './notion';

const ProblemsPage: React.FC = () => {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
    loadLastSyncTime();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    const storedProblems = await StorageService.getProblems();
    setProblems(storedProblems);
    setLoading(false);
    updateStats(storedProblems);
  };

  const loadLastSyncTime = async () => {
    try {
      const config = await StorageService.getConfig();
      setLastSyncTime(config.lastSyncTime || null);
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  };

  const updateStats = (problemsList: LeetCodeProblem[]) => {
    const totalElement = document.getElementById('total-count');

    if (totalElement) totalElement.textContent = problemsList.length.toString();
  };

  const deleteProblem = async (problemId: string) => {
    if (confirm('Are you sure you want to delete this problem?')) {
      await StorageService.deleteProblem(problemId);
      await loadProblems();
    }
  };


  const clearAllProblems = async () => {
    if (confirm('Are you sure you want to delete ALL problems? This cannot be undone.')) {
      await StorageService.clearAll();
      await loadProblems();
    }
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
        await loadLastSyncTime(); // Refresh the displayed time
        
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

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.problemNameFromUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'All' || problem.difficulty === filterDifficulty;
    
    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return <div className="problems-loading">Loading...</div>;
  }

  return (
    <div>
      <div className="problems-controls">
        <input
          type="text"
          placeholder="Search problems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
className="problems-search"
        />
        
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
className="problems-filter"
        >
          <option value="All">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <button
          onClick={syncToNotion}
          disabled={syncing || problems.length === 0}
className={`problems-sync-button ${syncing ? 'syncing' : 'ready'}`}
        >
          {syncing ? 'Syncing...' : 'Sync to Notion'}
        </button>

        <button
          onClick={clearAllProblems}
className="problems-clear-button"
        >
          Clear All
        </button>

        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })}
          className="problems-settings-button"
        >
          Options
        </button>
      </div>

      {syncMessage && (
        <div className={`problems-sync-message ${
          syncMessage.includes('❌') ? 'error' : 
          syncMessage.includes('✅') ? 'success' : 'info'
        }`}>
          {syncMessage}
        </div>
      )}

      {lastSyncTime && (
        <div className="problems-last-sync">
          Last sync: {new Date(lastSyncTime).toLocaleString()}
        </div>
      )}

      {filteredProblems.length === 0 ? (
        <div className="problems-empty">
          {problems.length === 0 ? 'No problems saved yet' : 'No problems match your filters'}
        </div>
      ) : (
        <div className="problems-table-container">
          <table className="problems-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Difficulty</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem, index) => (
                <tr key={problem.id}>
                  <td>
                    <div>
                      <a
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
className="problem-link"
                      >
                        {problem.title}
                      </a>
                      <div className="problem-name">
                        {problem.problemNameFromUrl}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`difficulty-badge ${problem.difficulty?.toLowerCase()}`}>
                      {problem.difficulty || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="date-text">
                      {new Date(problem.dateAdded).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteProblem(problem.id)}
className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="problems-summary">
        Showing {filteredProblems.length} of {problems.length} problems
      </div>
    </div>
  );
};


export default ProblemsPage;