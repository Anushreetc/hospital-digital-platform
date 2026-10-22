import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { AuthProvider } from '../lib/auth';

import { StaffApp } from './StaffApp';
import PortalPage from './PortalPage';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      
        <AuthProvider>
          <BrowserRouter>
            <Routes><Route path="/" element={<PortalPage/>}/><Route path="/staff" element={<PortalPage/>}/><Route path="/staff/:portal" element={<PortalPage/>}/><Route path="*" element={<StaffApp/>}/></Routes>
          </BrowserRouter>
        </AuthProvider>
      
    </ErrorBoundary>
  </React.StrictMode>
);
