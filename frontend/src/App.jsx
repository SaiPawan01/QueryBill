import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import Document from './pages/Document.jsx';
import Layout from './components/Layout.jsx';

function App() {
  return (
    <Router>
      {/* default container (keeps existing top-right behavior) */}
      <ToastContainer position="top-right" />
      {/* centered container for confirmation toasts */}
      <ToastContainer
        containerId="center"
        className="toast-center"
        hideProgressBar
        newestOnTop
      />
      <Routes>

        {/* Public route (redirects to /dashboard if already authenticated) */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
              
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Document />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback to login or dashboard depending on auth handled by PublicRoute at "/" */}
        <Route path="*" element={<PublicRoute><LoginPage /></PublicRoute>} />

      </Routes>
    </Router>
  )
}

export default App
