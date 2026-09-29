export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  KEYCLOAK_URL: import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak.expertisorjobs.com',
  KEYCLOAK_REALM: import.meta.env.VITE_KEYCLOAK_REALM || 'virtualogin',
  KEYCLOAK_CLIENT_ID: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'virtua-lms',
} as const;
