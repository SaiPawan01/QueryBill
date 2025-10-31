import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getExtractedDocumentApi, getDownloadUrl } from '../features/documents/api'
import ViewerPanel from '../components/document/ViewerPanel'
import ExtractedDataPanel from '../components/document/ExtractedDataPanel'
import ChatPanel from '../components/document/ChatPanel'

function Document() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [edited, setEdited] = useState({});
  const merged = useMemo(() => ({ ...(data || {}), ...(edited || {}) }), [data, edited]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getExtractedDocumentApi(id);
        if (isMounted) {
          setData(res);
          setEdited({});
        }
      } catch (e) {
        if (isMounted) setError(e?.response?.data?.detail || e.message || 'Failed to load document');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false };
  }, [id]);

  // Debounced autosave stub (replace with real API when available)
  useEffect(() => {
    if (!data) return;
    const handle = setTimeout(() => {
      setData((prev) => ({ ...(prev || {}), ...(edited || {}) }));
    }, 600);
    return () => clearTimeout(handle);
  }, [edited, data]);

  const setField = (key, value) => setEdited((p) => ({ ...(p || {}), [key]: value }));
  const setLineItemField = (idx, key, value) => {
    const current = Array.isArray(merged.line_items) ? merged.line_items : [];
    const next = current.map((li, i) => (i === idx ? { ...(li || {}), [key]: value } : li));
    setEdited((p) => ({ ...(p || {}), line_items: next }));
  };

  return (
    <div className="h-[75vh] bg-gray-50">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-800">Document #{id}</h1>
          <div className="flex gap-2">
            <a href={getDownloadUrl(id)} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800">Download Original</a>
            <Link to="/dashboard" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Back</Link>
          </div>
        </div>

        {loading && <div className="p-6 text-gray-500">Loading…</div>}
        {error && <div className="p-6 text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-12 gap-3">
            <ViewerPanel downloadUrl={getDownloadUrl(id)} />
            <ExtractedDataPanel id={id} data={merged || {}} onFieldChange={setField} onLineItemChange={setLineItemField} />
            <ChatPanel data={merged || {}} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Document;
