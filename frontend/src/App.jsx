import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Auth from './pages/auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './componets/ProtectedRoute.jsx';
import Document from './pages/Document.jsx';

function App() {
  return (
    <Router>
      <Routes>

        {/* Public route */}
        <Route path="/" element={<Auth />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Document />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  )
}

export default App
