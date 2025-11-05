import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'

function isTokenExpired(token) {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true   // previously returned false; malformed token should be considered invalid
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = JSON.parse(atob(base64))
    
    // Add some buffer time (5 minutes) to prevent edge cases
    const bufferTime = 5 * 60 * 1000
    return jsonPayload.exp ? Date.now() >= (jsonPayload.exp * 1000 - bufferTime) : true
  } catch (err) {
    console.error('Token validation error:', err)
    return true
  }
}

function ProtectedRoute({ children }) {
  const [expired, setExpired] = useState(false)
  const token = localStorage.getItem("access_token"); 

  useEffect(() => {
    if (!token) return
    if (isTokenExpired(token)) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      localStorage.removeItem('token_expires_at')
      setExpired(true)
      toast.info("Session expired. You have been logged out.", { position: 'top-right' })
    }
  }, [token])

  if (!token || expired) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default ProtectedRoute
