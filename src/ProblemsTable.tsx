import React from 'react';
import { LeetCodeProblem } from './types';

interface ProblemsTableProps {
  problems: LeetCodeProblem[];
  onDelete: (problemId: string) => void;
}

const ProblemsTable: React.FC<ProblemsTableProps> = ({ problems, onDelete }) => {
  if (problems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        No problems saved yet
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Saved Problems ({problems.length})</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Difficulty</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Date</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr key={problem.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <a 
                    href={problem.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#007bff', 
                      textDecoration: 'none',
                      fontSize: '11px'
                    }}
                    title={problem.url}
                  >
                    {problem.title}
                  </a>
                </td>
                <td style={{ 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  textAlign: 'center',
                  color: problem.difficulty === 'Easy' ? '#28a745' : 
                         problem.difficulty === 'Medium' ? '#ffc107' : '#dc3545'
                }}>
                  {problem.difficulty || 'N/A'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {new Date(problem.dateAdded).toLocaleDateString()}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button 
                    onClick={() => onDelete(problem.id)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px'
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
    </div>
  );
};

export default ProblemsTable;