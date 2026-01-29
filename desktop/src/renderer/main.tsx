/**
 * @fileoverview Application Entry Point
 *
 * Bootstraps the React application by mounting it to the DOM.
 * Sets up React StrictMode for development warnings and
 * BrowserRouter for client-side routing.
 *
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

/**
 * Mount the application to the root DOM element.
 * - StrictMode: Enables additional development checks and warnings
 * - BrowserRouter: Provides client-side routing using the History API
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
