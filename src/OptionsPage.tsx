import React, { useEffect, useState } from 'react';
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
        parentPageTitle: selectedPage?.title || ''
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
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Options</h1>
      
      <div style={{ 
        minHeight: '60px', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center'
      }}>
        {message && (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: message.includes('✅') ? '#d4edda' : 
                            message.includes('❌') ? '#f8d7da' : '#d1ecf1',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : 
                                  message.includes('❌') ? '#f5c6cb' : '#bee5eb'}`,
            color: message.includes('✅') ? '#155724' : 
                   message.includes('❌') ? '#721c24' : '#0c5460',
            fontSize: '14px',
            whiteSpace: 'pre-line',
            width: '100%'
          }}>
            {message}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <label style={{ 
            fontWeight: '600',
            color: '#555',
            flex: 1
          }}>
            Notion API Token:
          </label>
          <button
            onClick={testApiConnection}
            disabled={testingApi || !notionToken.trim()}
            style={{
              padding: '6px 12px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: testingApi || !notionToken.trim() ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: testingApi || !notionToken.trim() ? 0.6 : 1
            }}
          >
            {testingApi ? '🔄 Testing...' : '🧪 Test API'}
          </button>
        </div>
        <input
          type="password"
          value={notionToken}
          onChange={(e) => setNotionToken(e.target.value)}
          placeholder="Enter your Notion integration token"
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e1e5e9',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        />
        <small style={{ color: '#6c757d', fontSize: '12px' }}>
          Get your token from: https://www.notion.so/my-integrations
        </small>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <label style={{ 
            fontWeight: '600',
            color: '#555',
            flex: 1
          }}>
            Parent Page:
          </label>
          <button
            onClick={fetchParentPages}
            disabled={loadingPages || !notionToken.trim()}
            style={{
              padding: '6px 12px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingPages || !notionToken.trim() ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: loadingPages || !notionToken.trim() ? 0.6 : 1
            }}
          >
            {loadingPages ? '🔄 Loading...' : '🔍 Fetch Pages'}
          </button>
        </div>
        <select
          value={selectedParentPage}
          onChange={(e) => setSelectedParentPage(e.target.value)}
          disabled={parentPages.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e1e5e9',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: parentPages.length === 0 ? '#f8f9fa' : 'white'
          }}
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
        <small style={{ color: '#6c757d', fontSize: '12px' }}>
          Choose where to create the LeetCode problems database
        </small>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <label style={{ 
            fontWeight: '600',
            color: '#555',
            flex: 1
          }}>
            Database ID:
          </label>
          <button
            onClick={createDatabase}
            disabled={saving || !selectedParentPage || !notionToken.trim()}
            style={{
              padding: '6px 12px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving || !selectedParentPage || !notionToken.trim() ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: saving || !selectedParentPage || !notionToken.trim() ? 0.6 : 1
            }}
          >
            {saving ? '🔄 Creating...' : '📝 Create Database'}
          </button>
          <button
            onClick={() => window.open(`https://notion.so/${databaseId.replace(/-/g, '')}`, '_blank')}
            disabled={!databaseId}
            style={{
              padding: '6px 12px',
              background: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !databaseId ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: !databaseId ? 0.6 : 1
            }}
          >
            🔗 Open DB
          </button>
        </div>
        <input
          type="text"
          value={databaseId.replace(/-/g, '')}
          onChange={(e) => setDatabaseId(e.target.value)}
          placeholder="Database ID will appear here after creation"
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e1e5e9',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'monospace',
            backgroundColor: databaseId ? 'white' : '#f8f9fa'
          }}
          readOnly={!!databaseId}
        />
        <small style={{ color: '#6c757d', fontSize: '12px' }}>
          {databaseId ? 'Database created automatically' : 'Use the "Create Database" button or enter manually'}
        </small>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={saveConfig}
          disabled={saving || !notionToken.trim() || !databaseId.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: saving || !notionToken.trim() || !databaseId.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: saving || !notionToken.trim() || !databaseId.trim() ? 0.6 : 1
          }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

        <button
          onClick={clearConfig}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: saving ? 0.6 : 1
          }}
        >
          Clear Configuration
        </button>
      </div>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '6px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: '0', color: '#495057' }}>How to set up:</h3>
        <ol style={{ color: '#6c757d', lineHeight: '1.6' }}>
          <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer">notion.so/my-integrations</a></li>
          <li>Create a new integration and copy the token</li>
          <li>Paste the token above and click "Fetch Pages"</li>
          <li>Select a parent page from the dropdown</li>
          <li>Click "Create Database" to automatically set up the database</li>
          <li>Save your configuration</li>
        </ol>
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}>
          <strong style={{ color: '#0c5460' }}>💡 Tip:</strong> 
          <span style={{ color: '#0c5460', fontSize: '13px' }}> The integration will automatically create a properly configured database with all required columns!</span>
        </div>
      </div>
    </div>
  );
};

export default OptionsPage;