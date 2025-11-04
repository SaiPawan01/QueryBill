import React from 'react'

export default function DocumentFilter({
  search = '',
  onSearchChange = () => {},
  status = 'all',
  onStatusChange = () => {},
  type = 'all',
  onTypeChange = () => {},
  disabled = false,
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search documents…"
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
          className="w-full sm:w-auto flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex gap-3 sm:flex-none">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            disabled={disabled}
            className="w-1/2 sm:w-auto px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            disabled={disabled}
            className="w-1/2 sm:w-auto px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
          </select>
        </div>
      </div>
    </div>
  )
}
