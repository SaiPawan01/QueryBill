import { configureStore } from '@reduxjs/toolkit';
import documentsReducer from '../features/documents/documentsSlice';

const store = configureStore({
	reducer: {
		documents: documentsReducer,
	},
});

export default store;


