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
import Spinner from '../components/Spinner'
import DocumentFilter from '../components/dashboard/DocumentFilter'
import DocumentList from '../components/dashboard/DocumentList'

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

  const onSearchChange = (value) => {
    const v = value || '';
    dispatch(setQuery(v));
    // server side search too (keeps server and client in sync)
    dispatch(fetchDocuments({ q: v, status_filter: statusFilter === 'all' ? undefined : statusFilter, file_type: typeFilter === 'all' ? undefined : typeFilter }));
  };

  const onStatusChange = (value) => {
    const v = value;
    setStatusFilter(v);
    dispatch(fetchDocuments({ q: undefined, status_filter: v === 'all' ? undefined : v, file_type: typeFilter === 'all' ? undefined : typeFilter }));
  };

  const onTypeChange = (value) => {
    const v = value;
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
      // Get the filename from the content-disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = doc.name || `document_${doc.id}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Get the content type from the response
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Create blob with the correct type
      const blob = new Blob([response.data], { type: contentType });
      
      // Create object URL
      const url = window.URL.createObjectURL(blob);
      
      // Create and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the document. Please try again.');
    }
  };

  return (
    <div className="h-[80vh] bg-gray-50">
      {uploading && (
        <Spinner message={"📤 Uploading your file… this might take a few moments.⏳"} />
      )}
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">Manage your utility bills</h1>
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

        <DocumentFilter
          onSearchChange={onSearchChange}
          status={statusFilter}
          onStatusChange={onStatusChange}
          type={typeFilter}
          onTypeChange={onTypeChange}
          disabled={uploading}
        />

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow">
          <DocumentList
            documents={documents}
            loading={loading}
            onDownload={onDownload}
            onArchive={async (id) => {
              try {
                await dispatch(archiveDocument(id)).unwrap();
                dispatch(fetchDocuments({
                  status_filter: statusFilter === 'all' ? undefined : statusFilter,
                  file_type: typeFilter === 'all' ? undefined : typeFilter
                }));
              } catch (error) {
                // handled in slice
              }
            }}
            onRestore={async (id) => {
              try {
                await dispatch(unarchiveDocument(id)).unwrap();
                dispatch(fetchDocuments({
                  status_filter: statusFilter === 'all' ? undefined : statusFilter,
                  file_type: typeFilter === 'all' ? undefined : typeFilter
                }));
              } catch (error) {
                // handled in slice
              }
            }}
            onDelete={onDelete}
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
