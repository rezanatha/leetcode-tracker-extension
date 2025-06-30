import React, { useState } from 'react';
import { testNotionConnection, createNotionDBAutomatic, syncLocalProblemsToNotion } from './notion';
import { StorageService } from './storage';

const NotionTestPage: React.FC = () => {
  const [notionToken, setNotionToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [testResult, setTestResult] = useState<string>('');
  const [dbResult, setDbResult] = useState<string>('');
  const [syncResult, setSyncResult] = useState<string>('');
  const [isTestingNotion, setIsTestingNotion] = useState(false);
  const [isCreatingDB, setIsCreatingDB] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [dbResponse, setDbResponse] = useState<any>(null);
  const [syncResponse, setSyncResponse] = useState<any>(null);

  const handleNotionTest = async () => {
    if (!notionToken.trim()) {
      setTestResult('Please enter a Notion token');
      return;
    }
    
    setIsTestingNotion(true);
    setTestResult('Testing...');
    setResponse(null);
    
    const result = await testNotionConnection(notionToken);
    
    if (result.success) {
      setTestResult(`✅ Success! Connected to Notion`);
      setResponse(result.data);
    } else {
      setTestResult(`❌ Error: ${result.error}`);
      setResponse(null);
    }
    
    setIsTestingNotion(false);
  };

  const handleCreateDB = async () => {
    if (!notionToken.trim()) {
      setDbResult('Please enter a Notion token');
      return;
    }
    
    setIsCreatingDB(true);
    setDbResult('Finding workspace and creating database...');
    setDbResponse(null);
    
    const result = await createNotionDBAutomatic(notionToken);
    
    if (result.success) {
      setDbResult(`✅ Database created automatically!`);
      setDbResponse(result.data);
      // Auto-fill the database ID for sync
      setDatabaseId(result.data.id);
    } else {
      setDbResult(`❌ Error: ${result.error}`);
      setDbResponse(null);
    }
    
    setIsCreatingDB(false);
  };

  const handleSync = async () => {
    if (!notionToken.trim()) {
      setSyncResult('Please enter a Notion token');
      return;
    }
    if (!databaseId.trim()) {
      setSyncResult('Please enter a database ID');
      return;
    }
    
    setIsSyncing(true);
    setSyncResult('Loading local problems...');
    setSyncResponse(null);
    
    try {
      // Get local problems from storage
      const localProblems = await StorageService.getProblems();
      
      if (localProblems.length === 0) {
        setSyncResult('No local problems found to sync');
        setIsSyncing(false);
        return;
      }
      
      setSyncResult(`Syncing ${localProblems.length} problems to Notion...`);
      
      const result = await syncLocalProblemsToNotion(notionToken, databaseId, localProblems);
      
      if (result.success && result.results) {
        const { results } = result;
        setSyncResult(`✅ Sync completed! ${results.success} successful, ${results.failed} failed`);
        setSyncResponse(results);
      } else {
        setSyncResult(`❌ Sync failed: ${result.error}`);
        setSyncResponse(null);
      }
      
    } catch (error) {
      setSyncResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSyncResponse(null);
    }
    
    setIsSyncing(false);
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 30px 0', 
          color: '#2c3e50',
          textAlign: 'center'
        }}>
          🧪 Notion API Test
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#495057'
          }}>
            Notion API Token:
          </label>
          <input
            type="password"
            placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={notionToken}
            onChange={(e) => setNotionToken(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          <small style={{ color: '#6c757d', fontSize: '12px' }}>
            Get your token from <a 
              href="https://www.notion.so/my-integrations" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#007bff' }}
            >
              https://www.notion.so/my-integrations
            </a>
          </small>
        </div>

        <button
          onClick={handleNotionTest}
          disabled={isTestingNotion}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: isTestingNotion ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isTestingNotion ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}
        >
          {isTestingNotion ? 'Testing Connection...' : 'Test Connection'}
        </button>

        {testResult && (
          <div style={{
            padding: '16px',
            backgroundColor: testResult.includes('✅') ? '#d4edda' : '#f8d7da',
            color: testResult.includes('✅') ? '#155724' : '#721c24',
            border: `1px solid ${testResult.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {testResult}
          </div>
        )}

        {response && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>API Response:</h3>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {/* Database Creation Section */}
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '30px', 
          borderTop: '2px solid #e9ecef' 
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            color: '#2c3e50',
            fontSize: '20px'
          }}>
            🗃️ Create LeetCode Database
          </h2>
          
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            backgroundColor: '#e7f3ff', 
            borderRadius: '4px',
            border: '1px solid #b3d7ff'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#004085' }}>
              🎯 This will automatically find your workspace and create a LeetCode tracking database with all the right columns!
            </p>
          </div>

          <button
            onClick={handleCreateDB}
            disabled={isCreatingDB}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: isCreatingDB ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isCreatingDB ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}
          >
            {isCreatingDB ? 'Creating Database...' : 'Create Database'}
          </button>

          {dbResult && (
            <div style={{
              padding: '16px',
              backgroundColor: dbResult.includes('✅') ? '#d4edda' : '#f8d7da',
              color: dbResult.includes('✅') ? '#155724' : '#721c24',
              border: `1px solid ${dbResult.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {dbResult}
            </div>
          )}

          {dbResponse && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Database Created:</h3>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #e9ecef',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                <strong>Database ID:</strong> <code style={{ backgroundColor: '#e9ecef', padding: '2px 4px', borderRadius: '2px' }}>{dbResponse.id}</code>
              </div>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #e9ecef',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(dbResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sync Section */}
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '30px', 
          borderTop: '2px solid #e9ecef' 
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            color: '#2c3e50',
            fontSize: '20px'
          }}>
            🔄 Sync Local Problems to Notion
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              Database ID:
            </label>
            <input
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
            <small style={{ color: '#6c757d', fontSize: '12px' }}>
              Use the database ID from the database creation above
            </small>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: isSyncing ? '#6c757d' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}
          >
            {isSyncing ? 'Syncing...' : 'Sync Local Problems to Notion'}
          </button>

          {syncResult && (
            <div style={{
              padding: '16px',
              backgroundColor: syncResult.includes('✅') ? '#d4edda' : '#f8d7da',
              color: syncResult.includes('✅') ? '#155724' : '#721c24',
              border: `1px solid ${syncResult.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {syncResult}
            </div>
          )}

          {syncResponse && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Sync Results:</h3>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #e9ecef',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                <strong>✅ Successful:</strong> {syncResponse.success}<br/>
                <strong>⏩ Skipped:</strong> {syncResponse.skipped}<br/>
                <strong>❌ Failed:</strong> {syncResponse.failed}
              </div>
              {syncResponse.errors && syncResponse.errors.length > 0 && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  padding: '16px',
                  borderRadius: '4px',
                  border: '1px solid #f5c6cb',
                  fontSize: '12px'
                }}>
                  <strong>Errors:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    {syncResponse.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>How to get a Notion token:</h4>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>notion.so/my-integrations</a></li>
            <li>Click "New integration"</li>
            <li>Give it a name (e.g., "LeetCode Tracker")</li>
            <li>Copy the "Internal Integration Token"</li>
            <li>Paste it above and test!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default NotionTestPage;