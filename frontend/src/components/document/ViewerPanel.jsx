import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

export default function ViewerPanel({ downloadUrl }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [blobUrl, setBlobUrl] = useState(null)
  const [mimeType, setMimeType] = useState(null)

  const token = useMemo(() => localStorage.getItem('access_token') || '', [])

  useEffect(() => {
    let isMounted = true
    let currentUrl = null

    async function load() {
      try {
        setLoading(true)
        setError(null)
        setBlobUrl(null)
        setMimeType(null)
        const res = await axios.get(downloadUrl, {
          responseType: 'blob',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!isMounted) return
        const type = res?.headers?.['content-type'] || res?.data?.type || 'application/octet-stream'
        const url = URL.createObjectURL(res.data)
        currentUrl = url
        setMimeType(type)
        setBlobUrl(url)
      } catch (e) {
        if (!isMounted) return
        setError(e?.response?.data?.detail || e.message || 'Failed to load file')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [downloadUrl, token])

  const isPdf = (mimeType || '').includes('pdf')
  const isImage = (mimeType || '').startsWith('image/')

  const openInNewTab = () => {
    if (!blobUrl) return
    window.open(blobUrl, '_blank')
  }

  return (
    <div className="bg-white rounded-lg shadow p-3 h-[78vh] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">Document Viewer</div>
        <div className="flex gap-2">
          <button onClick={openInNewTab} disabled={!blobUrl} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 text-sm">Open</button>
        </div>
      </div>

      {loading && (
        <div className="flex-1 grid place-items-center text-gray-500 text-sm">Loading…</div>
      )}
      {error && (
        <div className="flex-1 grid place-items-center text-red-600 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="flex-1 border rounded overflow-hidden bg-gray-50">
          {isPdf && blobUrl && (
            <iframe title="pdf-viewer" src={blobUrl} className="w-full h-full" />
          )}
          {isImage && blobUrl && (
            <img src={blobUrl} alt="document" className="w-full h-full object-contain bg-white" />
          )}
          {!isPdf && !isImage && blobUrl && (
            <div className="p-3 text-sm text-gray-600">
              Cannot preview this file type. Use "Open" to view in a new tab.
            </div>
          )}
          {!blobUrl && (
            <div className="p-3 text-sm text-gray-600">No content available.</div>
          )}
        </div>
      )}
    </div>
  )
}



