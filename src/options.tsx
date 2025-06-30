import React from 'react';
import ReactDOM from 'react-dom/client';
import OptionsPage from './OptionsPage';

const container = document.getElementById('app');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<OptionsPage />);
}