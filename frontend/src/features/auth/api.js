import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function loginApi(email_id, password) {
  const response = await axios.post(
    `${API_BASE}/auth/login`,
    {
      email_id,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

export async function registerApi(first_name, last_name, email_id, password) {
  const response = await axios.post(
    `${API_BASE}/auth/register`,
    {
      first_name,
      last_name,
      email_id,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

