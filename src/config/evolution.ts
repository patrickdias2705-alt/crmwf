export const EVOLUTION_CONFIG = {
  API_URL: import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolutionapi.dentechia.shop/',
  API_KEY: import.meta.env.VITE_EVOLUTION_API_KEY || 'KFZOm3Hc3GSNWwHBywEm67xYgjN8xGTH',
  WEBHOOK_SECRET: import.meta.env.VITE_WEBHOOK_SECRET || 'crm-webhook-secret-2024',
  PUBLIC_BASE_URL: import.meta.env.VITE_PUBLIC_BASE_URL ||
    (import.meta.env.MODE === 'production'
      ? 'https://seu-dominio.com' // Substitua pelo seu domínio
      : 'http://localhost:8082')
};

export const EVOLUTION_ENDPOINTS = {
  CREATE_INSTANCE: '/instance/create',
  CONNECTION_STATE: '/instance/connectionState',
  REQUEST_PAIRING: '/instance/connect',
  DELETE_INSTANCE: '/instance/delete',
  RESTART_INSTANCE: '/instance/restart'
};
