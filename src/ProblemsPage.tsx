import React, { useEffect, useState } from 'react';
import { LeetCodeProblem } from './types';
import { StorageService } from './storage';

const ProblemsPage: React.FC = () => {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    const storedProblems = await StorageService.getProblems();
    setProblems(storedProblems);
    setLoading(false);
    updateStats(storedProblems);
  };

  const updateStats = (problemsList: LeetCodeProblem[]) => {
    const totalElement = document.getElementById('total-count');
    const solvedElement = document.getElementById('solved-count');
    const attemptedElement = document.getElementById('attempted-count');

    if (totalElement) totalElement.textContent = problemsList.length.toString();
    if (solvedElement) {
      const solvedCount = problemsList.filter(p => p.status === 'Solved').length;
      solvedElement.textContent = solvedCount.toString();
    }
    if (attemptedElement) {
      const attemptedCount = problemsList.filter(p => p.status === 'Attempted').length;
      attemptedElement.textContent = attemptedCount.toString();
    }
  };

  const deleteProblem = async (problemId: string) => {
    if (confirm('Are you sure you want to delete this problem?')) {
      await StorageService.deleteProblem(problemId);
      await loadProblems();
    }
  };

  const updateProblemStatus = async (problemId: string, newStatus: string) => {
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      const updatedProblem = { ...problem, status: newStatus as any };
      await StorageService.addProblem(updatedProblem);
      await loadProblems();
    }
  };

  const clearAllProblems = async () => {
    if (confirm('Are you sure you want to delete ALL problems? This cannot be undone.')) {
      await StorageService.clearAll();
      await loadProblems();
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.problemNameFromUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || problem.status === filterStatus;
    const matchesDifficulty = filterDifficulty === 'All' || problem.difficulty === filterDifficulty;
    
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '15px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search problems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            flex: '1',
            minWidth: '200px'
          }}
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="All">All Status</option>
          <option value="Not Started">Not Started</option>
          <option value="Attempted">Attempted</option>
          <option value="Solved">Solved</option>
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="All">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <button
          onClick={clearAllProblems}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear All
        </button>
      </div>

      {filteredProblems.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#6c757d',
          fontSize: '16px'
        }}>
          {problems.length === 0 ? 'No problems saved yet' : 'No problems match your filters'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={headerStyle}>Problem</th>
                <th style={headerStyle}>Difficulty</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Date Added</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem, index) => (
                <tr key={problem.id} style={{ 
                  backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <td style={cellStyle}>
                    <div>
                      <a
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#007bff',
                          textDecoration: 'none',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        {problem.title}
                      </a>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6c757d', 
                        marginTop: '2px' 
                      }}>
                        {problem.problemNameFromUrl}
                      </div>
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: 
                        problem.difficulty === 'Easy' ? '#d4edda' :
                        problem.difficulty === 'Medium' ? '#fff3cd' : '#f8d7da',
                      color:
                        problem.difficulty === 'Easy' ? '#155724' :
                        problem.difficulty === 'Medium' ? '#856404' : '#721c24'
                    }}>
                      {problem.difficulty || 'N/A'}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <select
                      value={problem.status || 'Not Started'}
                      onChange={(e) => updateProblemStatus(problem.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 
                          problem.status === 'Solved' ? '#d4edda' :
                          problem.status === 'Attempted' ? '#fff3cd' : '#f8d7da'
                      }}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Attempted">Attempted</option>
                      <option value="Solved">Solved</option>
                    </select>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ fontSize: '12px', color: '#6c757d' }}>
                      {new Date(problem.dateAdded).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => deleteProblem(problem.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
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
      
      <div style={{ 
        marginTop: '20px', 
        textAlign: 'center', 
        fontSize: '14px', 
        color: '#6c757d' 
      }}>
        Showing {filteredProblems.length} of {problems.length} problems
      </div>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: '600',
  color: '#495057',
  fontSize: '14px',
  borderBottom: '2px solid #e9ecef'
};

const cellStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '14px',
  color: '#495057'
};

export default ProblemsPage;