import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'

function isTokenExpired(token) {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length < 2) return false
    const payload = parts[1]
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = JSON.parse(atob(base64))
    if (jsonPayload.exp) {
      return Date.now() >= jsonPayload.exp * 1000
    }
    return false
  } catch (err) {
    // If parsing fails, assume not expired (avoid forcing logout for bad token format)
    return false
  }
}

function ProtectedRoute({ children }) {
  const [expired, setExpired] = useState(false)
  const token = localStorage.getItem("access_token"); 

  useEffect(() => {
    if (!token) return
    if (isTokenExpired(token)) {
      localStorage.removeItem('access_token')
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
