import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak.expertisorjobs.com',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'virtualogin',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'virtua-lms',
});
