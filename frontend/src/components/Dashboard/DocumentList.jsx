import React from 'react'
import DocumentItem from './DocumentItem'

export default function DocumentList({ documents = [], loading = false, onDownload = () => {}, onArchive = () => {}, onRestore = () => {}, onDelete = () => {}, disabled = false }) {
  if (loading) {
    return <div className="p-6 text-gray-500">Loading…</div>
  }

  if (!documents || documents.length === 0) {
    return <div className="p-6 text-gray-500">No documents found.</div>
  }

  return (
    <div>
      {/* Desktop Header */}
      <div className="hidden sm:grid grid-cols-12 px-4 py-3 text-sm font-medium text-gray-500 border-b">
        <div className="col-span-4">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Uploaded</div>
        <div className="col-span-4 text-right">Actions</div>
      </div>

      <ul>
        {documents.map((doc) => (
          <DocumentItem
            key={doc.id}
            doc={doc}
            onDownload={onDownload}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </ul>
    </div>
  )
}
