import axios, { AxiosError } from 'axios';

export const TOKEN_KEY = 'inmo360.accessToken';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[] }>) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('inmo360:session-expired'));
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'La solicitud a INMO360 agotó el tiempo de espera. Comprueba el estado del backend e inténtalo de nuevo.';
    }
    if (!error.response) {
      return 'No hubo respuesta de INMO360 en http://localhost:3001. Comprueba que NestJS esté iniciado y que CORS permita http://localhost:5173.';
    }
    if (error.response.status === 401) return message || 'El correo electrónico o la contraseña son incorrectos.';
    if (error.response.status === 409) return message || 'Ya existe una cuenta con ese correo electrónico.';
    if (error.response.status === 400 || error.response.status === 422) {
      return message || 'Los datos enviados no son válidos. Revísalos e inténtalo de nuevo.';
    }
    if (error.response.status >= 500) {
      return message
        ? `El servidor de INMO360 devolvió un error (${error.response.status}): ${message}`
        : `El servidor de INMO360 devolvió un error (${error.response.status}).`;
    }
    if (message) return message;
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
