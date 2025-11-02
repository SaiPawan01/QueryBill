import axios from "axios";

// Use VITE_API_URL or fallback to default backend URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchDocumentsApi(params = {}) {
  // params: { q, file_type, status, offset, limit }
  const response = await axios.get(`${API_BASE}/documents/list`, {
    headers: {
      ...getAuthHeaders(),
    },
    params,
  });
  return response.data;
}

export async function uploadDocumentApi(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(`${API_BASE}/documents/upload`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function deleteDocumentApi(docId) {
  const response = await axios.delete(`${API_BASE}/documents/${docId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response.data;
}

export async function archiveDocumentApi(docId) {
  const response = await axios.post(`${API_BASE}/documents/archive/${docId}`, null, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response.data;
}

export async function unarchiveDocumentApi(docId) {
  const response = await axios.post(`${API_BASE}/documents/unarchive/${docId}`, null, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response.data;
}

export function getDownloadUrl(docId) {
  return `${API_BASE}/documents/${docId}`;
}

export async function downloadDocumentApi(docId) {
  const response = await axios.get(`${API_BASE}/documents/${docId}`, {
    headers: {
      ...getAuthHeaders(),
    },
    responseType: "blob",
  });
  return response;
}


export async function extractDocumentApi(docId) {
  const response = await axios.post(`${API_BASE}/document/extract/${docId}`, null, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response.data;
}

export async function getExtractedDocumentApi(docId) {
  const response = await axios.get(`${API_BASE}/document/extract/${docId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response.data;
}

// Chat API functions
export async function sendChatMessageApi(documentId, message) {
  const response = await axios.post(
    `${API_BASE}/chat/${documentId}/message`,
    { message },
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

export async function getChatHistoryApi(documentId) {
  const response = await axios.get(`${API_BASE}/chat/${documentId}/history`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response.data;
}


