import React, { useEffect, useState } from 'react';
import './OptionsPage.css';
import { StorageService } from './storage';
import { getAccessiblePages, createNotionDBAutomatic, testNotionConnection } from './notion';
import { NotionPage } from './types';

const OptionsPage: React.FC = () => {
  const [notionToken, setNotionToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [selectedParentPage, setSelectedParentPage] = useState('');
  const [parentPages, setParentPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [message, setMessage] = useState('');
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await StorageService.getConfig();
      setNotionToken(config.notionToken || '');
      setDatabaseId(config.databaseId || '');
      setSelectedParentPage(config.parentPageId || '');
      setAutoSync(config.autoSync || false);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    setLoading(false);
  };

  const fetchParentPages = async () => {
    if (!notionToken.trim()) {
      setMessage('Please enter your Notion API token first.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoadingPages(true);
    setMessage('');
    try {
      const result = await getAccessiblePages(notionToken);
      if (result.success) {
        setParentPages(result.pages);
        setMessage(`Found ${result.pages.length} accessible pages.`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        if (result.error?.includes('401')) {
          setMessage('Invalid API token. Please check your token.');
        } else {
          setMessage(`Failed to fetch pages: ${result.error}`);
        }
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      setMessage('Failed to fetch pages. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoadingPages(false);
  };

  const createDatabase = async () => {
    if (!notionToken.trim() || !selectedParentPage) {
      setMessage('Please select a parent page first.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const result = await createNotionDBAutomatic(notionToken);
      if (result.success) {
        const newDatabaseId = result.data.id;
        setDatabaseId(newDatabaseId);
        
        const selectedPage = parentPages.find(p => p.id === selectedParentPage);
        await StorageService.saveConfig({
          notionToken: notionToken.trim(),
          databaseId: newDatabaseId,
          parentPageId: selectedParentPage,
          parentPageTitle: selectedPage?.title || ''
        });
        
        setMessage('Database created and configuration saved successfully!');
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`Failed to create database: ${result.error}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to create database:', error);
      setMessage('Failed to create database. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage('');
    try {
      const selectedPage = parentPages.find(p => p.id === selectedParentPage);
      await StorageService.saveConfig({
        notionToken: notionToken.trim(),
        databaseId: databaseId.trim(),
        parentPageId: selectedParentPage,
        parentPageTitle: selectedPage?.title || '',
        autoSync: autoSync
      });
      setMessage('Configuration saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage('Failed to save configuration. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  };

  const testApiConnection = async () => {
    if (!notionToken.trim()) {
      setMessage('Please enter your Notion API token first.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setTestingApi(true);
    setMessage('');
    try {
      const result = await testNotionConnection(notionToken);
      if (result.success) {
        setMessage(`✅ API connection successful! Connected as: ${result.data?.name || 'Unknown user'}`);
        setTimeout(() => setMessage(''), 5000);
      } else {
        if (result.error?.includes('401') || result.error?.includes('Unauthorized')) {
          setMessage('❌ Invalid API token. Please check your token.');
        } else {
          setMessage(`❌ API test failed: ${result.error}`);
        }
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('API test error:', error);
      setMessage('❌ Failed to test API connection. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
    setTestingApi(false);
  };

  const clearConfig = async () => {
    if (confirm('Are you sure you want to clear all configuration? This cannot be undone.')) {
      setSaving(true);
      try {
        await StorageService.clearConfig();
        setNotionToken('');
        setDatabaseId('');
        setSelectedParentPage('');
        setParentPages([]);
        setMessage('Configuration cleared successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Failed to clear config:', error);
        setMessage('Failed to clear configuration. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="options-loading">Loading...</div>;
  }

  return (
    <>
      {/* Floating message area */}
      <div className="options-message-area">
        {message && (
          <div className={`options-message ${
            message.includes('✅') ? 'success' : 
            message.includes('❌') ? 'error' : 'info'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="options-container">
        <h1 className="options-title">LeetCode-Notion Tracker Options</h1>
      
      <div className="options-token-section">
        <div className="options-token-header">
          <label className="options-token-label">
            Notion API Token:
          </label>
          <button
            onClick={testApiConnection}
            disabled={testingApi || !notionToken.trim()}
            className="options-token-test-button"
          >
            {testingApi ? 'Testing...' : 'Test API'}
          </button>
        </div>
        <input
          type="password"
          value={notionToken}
          onChange={(e) => setNotionToken(e.target.value)}
          placeholder="Enter your Notion integration token"
          className="options-token-input"
        />
        <small className="options-token-help">
          Get your token from: https://www.notion.so/my-integrations
        </small>
      </div>

      <div className="options-parent-section">
        <div className="options-parent-header">
          <label className="options-parent-label">
            Parent Page:
          </label>
          <button
            onClick={fetchParentPages}
            disabled={loadingPages || !notionToken.trim()}
            className="options-parent-fetch-button"
          >
            {loadingPages ? 'Loading...' : 'Fetch Pages'}
          </button>
        </div>
        <select
          value={selectedParentPage}
          onChange={(e) => setSelectedParentPage(e.target.value)}
          disabled={parentPages.length === 0}
          className="options-parent-select"
        >
          <option value="">
            {parentPages.length === 0 ? 'Click "Fetch Pages" to load options' : 'Select a parent page'}
          </option>
          {parentPages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title}
            </option>
          ))}
        </select>
        <small className="options-parent-help">
          Choose where to create the LeetCode problems database
        </small>
      </div>

      <div className="options-database-section">
        <div className="options-database-header">
          <label className="options-database-label">
            Database ID:
          </label>
          <button
            onClick={createDatabase}
            disabled={saving || !selectedParentPage || !notionToken.trim()}
            className="options-database-create-button"
          >
            {saving ? 'Creating...' :'Create Database'}
          </button>
          <button
            onClick={() => window.open(`https://notion.so/${databaseId.replace(/-/g, '')}`, '_blank')}
            disabled={!databaseId}
            className="options-database-open-button"
          >
            Open DB
          </button>
        </div>
        <input
          type="text"
          value={databaseId.replace(/-/g, '')}
          onChange={(e) => setDatabaseId(e.target.value)}
          placeholder="Database ID will appear here after creation"
          className={`options-database-input ${databaseId ? 'filled' : 'empty'}`}
          readOnly={!!databaseId}
        />
        <small className="options-database-help">
          {databaseId ? 'Database created automatically' : 'Use the "Create Database" button or enter manually'}
        </small>
      </div>

      <div className="options-field">
        <div className="options-field-header">
          <label className="options-label">
            Auto-Sync Problems:
          </label>
        </div>
        <label className="options-checkbox-container">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="options-checkbox"
          />
          <span className="options-checkbox-label">
            Automatically sync to Notion when adding problems
          </span>
        </label>
        <small className="options-help-text">
          When enabled, problems will be automatically synced to Notion immediately after being added to the tracker.
        </small>
      </div>

      <div className="options-main-actions">
        <button
          onClick={saveConfig}
          disabled={saving || !notionToken.trim() || !databaseId.trim()}
          className="options-save-button"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

        <button
          onClick={clearConfig}
          disabled={saving}
          className="options-clear-button"
        >
          Clear Configuration
        </button>
      </div>

      <div className="options-instructions">
        <h3 className="options-instructions-title">How to set up a Notion database for your LeetCode problems:</h3>
        <ol className="options-instructions-list">
          <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="options-instructions-link">notion.so/my-integrations</a></li>
          <li>Create a new integration and copy the token</li>
          <li>Paste the token above and click "Fetch Pages"</li>
          <li>Select a parent page from the dropdown</li>
          <li>Click "Create Database" to automatically set up the database</li>
          <li>Save your configuration</li>
        </ol>
      </div>
    </div>
    </>
  );
};

export default OptionsPage;