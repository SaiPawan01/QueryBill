import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatDate } from '../utils/dateUtils'
import {
  fetchDocuments,
  uploadDocument,
  extractDocument,
  deleteDocument,
  setQuery,
  selectFilteredDocuments,
  selectLoading,
  selectError,
} from '../features/documents/documentsSlice'
import { archiveDocument, unarchiveDocument } from '../features/documents/documentsSlice'
import { Link } from 'react-router-dom'
import { downloadDocumentApi } from '../features/documents/api'

function Dashboard() {
  const dispatch = useDispatch();
  const documents = useSelector(selectFilteredDocuments);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // initial load
    dispatch(fetchDocuments());
  }, [dispatch]);

  const onSearchChange = (e) => {
    const v = e.target.value || '';
    dispatch(setQuery(v));
    // server side search too (keeps server and client in sync)
    dispatch(fetchDocuments({ q: v, status_filter: statusFilter === 'all' ? undefined : statusFilter, file_type: typeFilter === 'all' ? undefined : typeFilter }));
  };

  const onStatusChange = (e) => {
    const v = e.target.value;
    setStatusFilter(v);
    dispatch(fetchDocuments({ q: undefined, status_filter: v === 'all' ? undefined : v, file_type: typeFilter === 'all' ? undefined : typeFilter }));
  };

  const onTypeChange = (e) => {
    const v = e.target.value;
    setTypeFilter(v);
    dispatch(fetchDocuments({ q: undefined, status_filter: statusFilter === 'all' ? undefined : statusFilter, file_type: v === 'all' ? undefined : v }));
  };

  const triggerFilePick = () => fileInputRef.current?.click();

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const uploaded = await dispatch(uploadDocument(file)).unwrap();
      if (uploaded?.id) {
        // Trigger extraction immediately for the uploaded document
        await dispatch(extractDocument(uploaded.id)).unwrap();
      }
      await dispatch(fetchDocuments());
    } catch (_) {
      // error already in slice
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onDelete = async (id) => {
    try {
      await dispatch(deleteDocument(id)).unwrap();
    } catch (_) {}
  };

  const onDownload = async (doc) => {
    try {
      const response = await downloadDocumentApi(doc.id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name || `document_${doc.id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (_) {
      // error surfaced elsewhere if needed
    }
  };

  return (
    <div className="h-[80vh] bg-gray-50">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Your Documents</h1>
          <button
            onClick={triggerFilePick}
            disabled={uploading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Upload Document'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={onFileSelected}
            className="hidden"
          />
        </div>

        <div className="mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search documents…"
              onChange={onSearchChange}
              className="w-full sm:w-auto flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-3 sm:flex-none">
              <select value={statusFilter} onChange={onStatusChange} className="w-1/2 sm:w-auto px-3 py-2 border rounded-md">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <select value={typeFilter} onChange={onTypeChange} className="w-1/2 sm:w-auto px-3 py-2 border rounded-md">
                <option value="all">All</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow">
          {/* Desktop Header */}
          <div className="hidden sm:grid grid-cols-12 px-4 py-3 text-sm font-medium text-gray-500 border-b">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>
          {loading ? (
            <div className="p-6 text-gray-500">Loading…</div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-gray-500">No documents found.</div>
          ) : (
            <ul>
              {documents.map((doc) => (
                <li key={doc.id} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center px-4 py-3 border-b last:border-b-0">
                  <div className="w-full sm:col-span-4 truncate text-gray-800 mb-2 sm:mb-0">
                    <Link to={`/documents/${doc.id}`} className="text-blue-600 hover:underline">
                      {doc.name}
                    </Link>
                    {/* Mobile metadata */}
                    <div className="flex gap-4 text-sm text-gray-500 mt-1 sm:hidden">
                      <span>{Math.round((doc.size || 0) / 1024)} KB</span>
                      <span>{formatDate(doc.uploaded_at)}</span>
                    </div>
                  </div>
                  {/* Desktop metadata */}
                  <div className="hidden sm:block sm:col-span-2 text-gray-600">{Math.round((doc.size || 0) / 1024)} KB</div>
                  <div className="hidden sm:block sm:col-span-2 text-gray-600">{formatDate(doc.uploaded_at)}</div>
                  <div className="w-full sm:w-auto sm:col-span-4 flex flex-wrap sm:justify-end gap-2">
                    <button
                      onClick={() => onDownload(doc)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 text-center"
                    >
                      Download
                    </button>
                    {doc.status === 'archived' ? (
                      <button
                        onClick={async () => {
                          try {
                            await dispatch(unarchiveDocument(doc.id)).unwrap();
                            dispatch(fetchDocuments({
                              status_filter: statusFilter === 'all' ? undefined : statusFilter,
                              file_type: typeFilter === 'all' ? undefined : typeFilter
                            }));
                          } catch (error) {
                            // Error handled in slice
                          }
                        }}
                        className="flex-1 sm:flex-initial px-3 py-1.5 text-sm bg-green-50 hover:bg-green-100 rounded-md text-green-700 text-center"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            await dispatch(archiveDocument(doc.id)).unwrap();
                            dispatch(fetchDocuments({
                              status_filter: statusFilter === 'all' ? undefined : statusFilter,
                              file_type: typeFilter === 'all' ? undefined : typeFilter
                            }));
                          } catch (error) {
                            // Error handled in slice
                          }
                        }}
                        className="flex-1 sm:flex-initial px-3 py-1.5 text-sm bg-yellow-50 hover:bg-yellow-100 rounded-md text-yellow-700 text-center"
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 rounded-md text-red-700 text-center"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
