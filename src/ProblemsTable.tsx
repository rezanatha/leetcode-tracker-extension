import React from 'react';
import './ProblemsTable.css';
import { LeetCodeProblem } from './types';

interface ProblemsTableProps {
  problems: LeetCodeProblem[];
  onDelete: (problemId: string) => void;
}

const ProblemsTable: React.FC<ProblemsTableProps> = ({ problems, onDelete }) => {
  if (problems.length === 0) {
    return (
      <div className="problems-table-empty">
        No problems saved yet
      </div>
    );
  }

  return (
    <div className="problems-table-wrapper">
      <h3>Saved Problems ({problems.length})</h3>
      <div className="problems-table-scroll">
        <table className="problems-table-compact">
          <thead>
            <tr>
              <th className="title">Title</th>
              <th className="center">Difficulty</th>
              <th className="center">Date</th>
              <th className="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr key={problem.id}>
                <td>
                  <a 
                    href={problem.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
className="problem-link-compact"
                    title={problem.url}
                  >
                    {problem.title}
                  </a>
                </td>
                <td className={`center difficulty-${problem.difficulty?.toLowerCase()}`}>
                  {problem.difficulty || 'N/A'}
                </td>
                <td className="center">
                  {new Date(problem.dateAdded).toLocaleDateString()}
                </td>
                <td className="center">
                  <button 
                    onClick={() => onDelete(problem.id)}
className="delete-button-compact"
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