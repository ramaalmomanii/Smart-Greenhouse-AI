import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FullLandingPage from './components/landing/FullLandingPage';
import Dashboard from './components/Dashboard';
import './index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FullLandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
} 