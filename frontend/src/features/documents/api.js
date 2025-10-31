import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchDocumentsApi() {
  const response = await axios.get(`${API_BASE}/documents/list`, {
    headers: {
      ...getAuthHeaders(),
    },
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

export function getDownloadUrl(docId) {
  return `${API_BASE}/documents/${docId}`;
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


