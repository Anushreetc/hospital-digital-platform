import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { AuthProvider } from '../lib/auth';

import { PublicApp } from './PublicApp';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      
        <AuthProvider>
          <BrowserRouter>
            <PublicApp />
          </BrowserRouter>
        </AuthProvider>
      
    </ErrorBoundary>
  </React.StrictMode>
);
