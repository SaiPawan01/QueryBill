import React from 'react'
import { Navigate } from 'react-router-dom'

function isTokenValid(token) {
  if (!token) return false
  try {
    const parts = token.split('.')
    if (parts.length < 2) return false
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp) {
      return Date.now() < payload.exp * 1000
    }
    return false
  } catch (e) {
    return false
  }
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("access_token");
  if (token && isTokenValid(token)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default PublicRoute


