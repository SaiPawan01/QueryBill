import axios from "axios";

// Use VITE_API_URL fallback to localhost for dev
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
  try {
    const response = await axios.get(`${API_BASE}/documents/${docId}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept': '*/*',  // Accept any content type
      },
      responseType: 'blob',
      timeout: 30000, // 30 second timeout
    });
    
    // Verify that we received data
    if (!response.data || response.data.size === 0) {
      throw new Error('Received empty file');
    }
    
    return response;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.status === 404 ? 'Document not found' : 'Failed to download document');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Failed to initiate download');
    }
  }
}


export async function extractDocumentApi(docId) {
  try {
    const response = await axios.post(`${API_BASE}/document/extract/${docId}`, null, {
      headers: {
        ...getAuthHeaders(),
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Document not found");
    }
    throw error;
  }
}

export async function getExtractedDocumentApi(docId) {
  try {
    const response = await axios.get(`${API_BASE}/document/extract/${docId}`, {
      headers: {
        ...getAuthHeaders(),
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Extracted data not found");
    }
    throw error;
  }
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

export async function updateExtractedDocumentApi(docId, data) {
  try {
    const response = await axios.put(`${API_BASE}/document/extract/${docId}`, data, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Document not found");
    }
    throw error;
  }
}

