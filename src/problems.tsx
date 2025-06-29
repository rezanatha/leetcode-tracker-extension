import React from 'react';
import ReactDOM from 'react-dom/client';
import ProblemsPage from './ProblemsPage';

const container = document.getElementById('app');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<ProblemsPage />);
}