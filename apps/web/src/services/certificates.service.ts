import { contentClient } from './apiClient';

export interface VerifiedCertificate {
  id: string;
  code: string;
  issuedAt: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
  };
}

export interface MyCertificateItem {
  id: string;
  code: string;
  issuedAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
  };
}

export const certificatesService = {
  async getMyCertificates(): Promise<MyCertificateItem[]> {
    return contentClient.get<MyCertificateItem[]>('/certificates/me');
  },

  async verifyCertificate(code: string): Promise<VerifiedCertificate> {
    return contentClient.get<VerifiedCertificate>(`/certificates/verify/${code}`);
  },
};
