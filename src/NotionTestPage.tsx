import React, { useState } from 'react';
import { testNotionConnection, createNotionDB } from './notion';

const NotionTestPage: React.FC = () => {
  const [notionToken, setNotionToken] = useState('');
  const [parentPageId, setParentPageId] = useState('');
  const [testResult, setTestResult] = useState<string>('');
  const [dbResult, setDbResult] = useState<string>('');
  const [isTestingNotion, setIsTestingNotion] = useState(false);
  const [isCreatingDB, setIsCreatingDB] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [dbResponse, setDbResponse] = useState<any>(null);

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
    if (!parentPageId.trim()) {
      setDbResult('Please enter a parent page ID');
      return;
    }
    
    setIsCreatingDB(true);
    setDbResult('Creating database...');
    setDbResponse(null);
    
    const result = await createNotionDB(notionToken, parentPageId);
    
    if (result.success) {
      setDbResult(`✅ Database created successfully!`);
      setDbResponse(result.data);
    } else {
      setDbResult(`❌ Error: ${result.error}`);
      setDbResponse(null);
    }
    
    setIsCreatingDB(false);
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
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              Parent Page ID:
            </label>
            <input
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={parentPageId}
              onChange={(e) => setParentPageId(e.target.value)}
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
              Get this from any Notion page URL: notion.so/workspace/PAGE_ID
            </small>
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