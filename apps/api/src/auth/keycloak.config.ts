export const keycloakConfig = {
    url: process.env.KEYCLOAK_URL || 'https://keycloak.expertisorjobs.com',
    realm: process.env.KEYCLOAK_REALM || 'virtualogin',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'virtua-lms',
    get issuer() {
        return `${this.url}/realms/${this.realm}`;
    },
    get jwksUri() {
        return `${this.url}/realms/${this.realm}/protocol/openid-connect/certs`;
    },
};
