import React from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/dateUtils'

export default function DocumentItem({ doc, onDownload, onArchive, onRestore, onDelete, disabled }) {
  const title = doc.name || `Document #${doc.id}`
  const uploaded = doc.uploaded_at || doc.created_at || ''

  return (
    <li className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center px-4 py-3 border-b last:border-b-0">
      <div className="w-full sm:col-span-4 truncate text-gray-800 mb-2 sm:mb-0">
        <Link to={`/documents/${doc.id}`} className="text-blue-600 hover:underline">
          {title}
        </Link>
        <div className="flex gap-4 text-sm text-gray-500 mt-1 sm:hidden">
          <span>{Math.round((doc.size || 0) / 1024)} KB</span>
          <span>{formatDate(uploaded)}</span>
        </div>
      </div>

      <div className="hidden sm:block sm:col-span-2 text-gray-600">{Math.round((doc.size || 0) / 1024)} KB</div>
      <div className="hidden sm:block sm:col-span-2 text-gray-600">{formatDate(uploaded)}</div>

      <div className="w-full sm:w-auto sm:col-span-4 flex flex-wrap sm:justify-end gap-2">
        <button
          onClick={() => onDownload(doc)}
          disabled={disabled}
          className="flex-1 sm:flex-initial px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download
        </button>

        {doc.status === 'archived' ? (
          <button
            onClick={() => onRestore(doc.id)}
            disabled={disabled}
            className="flex-1 sm:flex-initial px-3 py-1.5 text-sm bg-green-50 hover:bg-green-100 rounded-md text-green-700 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Restore
          </button>
        ) : (
          <button
            onClick={() => onArchive(doc.id)}
            disabled={disabled}
            className="flex-1 sm:flex-initial px-3 py-1.5 text-sm bg-yellow-50 hover:bg-yellow-100 rounded-md text-yellow-700 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Archive
          </button>
        )}

        <button
          onClick={() => onDelete(doc.id)}
          disabled={disabled}
          className="flex-1 sm:flex-initial px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 rounded-md text-red-700 text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete
        </button>
      </div>
    </li>
  )
}
