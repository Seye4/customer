import axios from 'axios';

// const API_URL = 'http://10.0.0.106/autofix/backend/api';
const API_URL = __DEV__
  ? 'https://seveinteractive.com/api' // Local URL (e.g., http://localhost:8000 or http://10.0.2.2/api for Android emulator)
  : 'https://seveinteractive.com/api'; // Production URL

type RequestOptions = {
  method?: string;
  body?: any;
  token?: string | null;
  isFormData?: boolean;
};

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, isFormData = false } = options;

  const headers: Record<string, string> = {};

  /*
   * Don't manually set Content-Type
   * for FormData.
   *
   * React Native needs to generate
   * the multipart boundary.
   */

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/${endpoint}`, {
      method,
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  let responseText = await response.text();
  let result: any;

  try {
    result = JSON.parse(responseText);
  } catch {
    console.log('Raw PHP Response:', responseText); // Check your console logs for PHP errors
    throw new Error('The server returned an invalid response.');
  }

  /* let result: any;

  try {
    result = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  } */

  if (!response.ok) {
    throw new Error(result?.message || `Request failed (${response.status}).`);
  }

  return result as T;
}

// Previous

export const API_URL2 = 'http://10.0.0.106/autofix/backend/index.php';

export const api = axios.create({
  baseURL: API_URL2,
  timeout: 20000,

  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('?')) {
    const path = config.url.replace(/^\/+/, '');

    config.url = '';
    config.params = {
      ...(config.params || {}),
      path,
    };
  }

  return config;
});
