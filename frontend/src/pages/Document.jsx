import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getExtractedDocumentApi, getDownloadUrl, extractDocumentApi, fetchDocumentsApi } from '../features/documents/api'
import Spinner from '../components/Spinner'
import { formatDate } from '../utils/dateUtils'
import ViewerPanel from '../components/document/ViewerPanel'
import ExtractedDataPanel from '../components/document/ExtractedDataPanel'
import ChatPanel from '../components/document/ChatPanel'

function Document() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [data, setData] = useState(null);
  const [edited, setEdited] = useState({});
  const [extracting, setExtracting] = useState(false);
  const [docName, setDocName] = useState(null);
  const merged = useMemo(() => ({ ...(data || {}), ...(edited || {}) }), [data, edited]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorStatus(null);
        const res = await getExtractedDocumentApi(id);
        if (isMounted) {
          setData(res);
          console.log(res);
          setEdited({});
        }
      } catch (e) {
        if (isMounted) {
          setError(e?.response?.data?.detail || e.message || 'Failed to load document');
          setErrorStatus(e?.response?.status || null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    // Also fetch document metadata (name) from documents list
    (async () => {
      try {
        const docs = await fetchDocumentsApi();
        const found = Array.isArray(docs) ? docs.find(d => String(d.id) === String(id) || d.id === id) : null;
        if (isMounted && found) setDocName(found.name || found.original_filename || null);
      } catch (err) {
        // ignore metadata fetch errors
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
          <div className='flex gap-1'>
            <h1 className='text-xl font-semibold text-gray-800'>File Name : </h1>
            <h1 className="text-xl font-semibold text-gray-600">{docName ? docName :`Document #${id}`}</h1>
            {/* {data && (
              <div className="text-sm text-gray-500 mt-1">Extracted: {data?.extraction_metadata?.extraction_date ? formatDate(data.extraction_metadata.extraction_date) : formatDate(data.created_at)}</div>
            )} */}
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Back</Link>
          </div>
        </div>

        {loading && <div className="p-6 text-gray-500">Loading…</div>}
        {/* {error && errorStatus !== 404 && <div className="p-6 text-red-600">{error}</div>} */}

        {!loading && (
          <div className="flex gap-3 flex-col lg:flex-row">
            <div className="flex-1 min-w-0">
              <ViewerPanel downloadUrl={getDownloadUrl(id)} />
            </div>

            <div className="flex-1 min-w-0">
              {/* If no extracted data found (404) show an Extract button */}
              {errorStatus === 404 || !data ? (
                <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center h-full">
                  <div className="text-sm text-gray-700 mb-3">No extracted data found for this document.</div>
                  <button
                    onClick={async () => {
                      try {
                        setExtracting(true);
                        setError(null);
                        setErrorStatus(null);
                        await extractDocumentApi(id);
                        // refetch the extracted data
                        const res = await getExtractedDocumentApi(id);
                        setData(res);
                        setEdited({});
                      } catch (e) {
                        setError(e?.response?.data?.detail || e.message || 'Extraction failed');
                        setErrorStatus(e?.response?.status || null);
                      } finally {
                        setExtracting(false);
                      }
                    }}
                    disabled={extracting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extracting ? 'Extracting…' : 'Extract Data'}
                  </button>
                </div>
              ) : (
                <ExtractedDataPanel id={id} data={merged || {}} onFieldChange={setField} onLineItemChange={setLineItemField} />
              )}
            </div>

            <div className="w-full lg:w-[35%] min-w-0">
              <ChatPanel />
            </div>
          </div>
        )}

        {extracting && <Spinner message={"Extracting data... please wait a moment ⏳"} />}
      </div>
    </div>
  )
}

export default Document;
