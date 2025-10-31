import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
import { Link } from 'react-router-dom'
import { getDownloadUrl } from '../features/documents/api'

function Dashboard() {
  const dispatch = useDispatch();
  const documents = useSelector(selectFilteredDocuments);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  const onSearchChange = (e) => {
    dispatch(setQuery(e.target.value));
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

  return (
    <div className="h-[80vh] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Your Documents</h1>
          <button
            onClick={triggerFilePick}
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
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
          <input
            type="text"
            placeholder="Search documents…"
            onChange={onSearchChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-12 px-4 py-3 text-sm font-medium text-gray-500 border-b">
            <div className="col-span-6">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>
          {loading ? (
            <div className="p-6 text-gray-500">Loading…</div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-gray-500">No documents found.</div>
          ) : (
            <ul>
              {documents.map((doc) => (
                <li key={doc.id} className="grid grid-cols-12 items-center px-4 py-3 border-b last:border-b-0">
                  <div className="col-span-6 truncate text-gray-800">
                    <Link to={`/documents/${doc.id}`} className="text-blue-600 hover:underline">
                      {doc.name}
                    </Link>
                  </div>
                  <div className="col-span-2 text-gray-600">{Math.round((doc.size || 0) / 1024)} KB</div>
                  <div className="col-span-4 flex justify-end gap-2">
                    <a
                      href={getDownloadUrl(doc.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 rounded-md text-red-700"
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
