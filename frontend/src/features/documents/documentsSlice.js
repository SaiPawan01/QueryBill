import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import {
  fetchDocumentsApi,
  uploadDocumentApi,
  deleteDocumentApi,
  extractDocumentApi,
  archiveDocumentApi,
  unarchiveDocumentApi,
} from "./api";

export const fetchDocuments = createAsyncThunk(
  "documents/fetchDocuments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchDocumentsApi(params);
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Failed to load";
      return rejectWithValue(message);
    }
  }
);

export const uploadDocument = createAsyncThunk(
  "documents/uploadDocument",
  async (file, { rejectWithValue }) => {
    try {
      const data = await uploadDocumentApi(file);
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Upload failed";
      return rejectWithValue(message);
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "documents/deleteDocument",
  async (docId, { rejectWithValue }) => {
    try {
      await deleteDocumentApi(docId);
      return docId;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Delete failed";
      return rejectWithValue(message);
    }
  }
);

export const extractDocument = createAsyncThunk(
  "documents/extractDocument",
  async (docId, { rejectWithValue }) => {
    try {
      const data = await extractDocumentApi(docId);
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Extraction failed";
      return rejectWithValue(message);
    }
  }
);

export const archiveDocument = createAsyncThunk(
  "documents/archiveDocument",
  async (docId, { rejectWithValue }) => {
    try {
      const data = await archiveDocumentApi(docId);
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Archive failed";
      return rejectWithValue(message);
    }
  }
);

export const unarchiveDocument = createAsyncThunk(
  "documents/unarchiveDocument",
  async (docId, { rejectWithValue }) => {
    try {
      const data = await unarchiveDocumentApi(docId);
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Restore failed";
      return rejectWithValue(message);
    }
  }
);

const documentsSlice = createSlice({
  name: "documents",
  initialState: {
    items: [],
    query: "",
    loading: false,
    error: null,
  },
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        // Normalize different possible API response shapes into an array
        const payload = action.payload;
        let items = [];
        if (Array.isArray(payload)) {
          items = payload;
        } else if (payload && typeof payload === 'object') {
          // common shapes: { documents: [...] } or { items: [...] } or { data: [...] }
          if (Array.isArray(payload.documents)) items = payload.documents;
          else if (Array.isArray(payload.items)) items = payload.items;
          else if (Array.isArray(payload.data)) items = payload.data;
          else items = [];
        } else {
          items = [];
        }
        state.items = items;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load";
      })
      .addCase(uploadDocument.pending, (state) => {
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state) => {
        // Trigger refresh from component to get full metadata
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.error = action.payload || "Upload failed";
      })
      .addCase(extractDocument.rejected, (state, action) => {
        state.error = action.payload || "Extraction failed";
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((d) => d.id !== id);
      })
      .addCase(archiveDocument.fulfilled, (state, action) => {
        // update item status locally if present
        const id = action.payload?.id;
        if (!id) return;
        state.items = state.items.map((it) => (it.id === id ? { ...it, status: 'archived' } : it));
      })
      .addCase(unarchiveDocument.fulfilled, (state, action) => {
        // update item status locally if present
        const id = action.payload?.id;
        if (!id) return;
        state.items = state.items.map((it) => (it.id === id ? { ...it, status: 'active' } : it));
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.error = action.payload || "Delete failed";
      });
  },
});

export const { setQuery, clearError } = documentsSlice.actions;

const selectDocumentsState = (state) => state.documents;
export const selectDocuments = (state) => selectDocumentsState(state).items || [];
export const selectQuery = (state) => selectDocumentsState(state).query;
export const selectLoading = (state) => selectDocumentsState(state).loading;
export const selectError = (state) => selectDocumentsState(state).error;

export const selectFilteredDocuments = createSelector(
  [selectDocuments, selectQuery],
  (items, query) => {
    const q = (query || "").toLowerCase();
    if (!q) return items;
    return items.filter((d) =>
      (d.name || "").toLowerCase().includes(q)
    );
  }
);

export default documentsSlice.reducer;


