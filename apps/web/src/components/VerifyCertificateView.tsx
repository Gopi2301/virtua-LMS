import { ArrowLeft, CheckCircle } from "@virtua-lms/ui";
import { PageHeading, ErrorState } from "./LearningUI";
import React, { useState, useEffect } from "react";
import { certificatesService } from "../services/certificates.service";
import type { VerifiedCertificate } from "../services/certificates.service";
import { formatDate } from "../utils/formatters";

interface VerifyCertificateViewProps {
  initialCode?: string;
  onBack: () => void;
}

export const VerifyCertificateView: React.FC<VerifyCertificateViewProps> = ({
  initialCode = "",
  onBack,
}) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState<VerifiedCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (codeToVerify: string) => {
    const clean = codeToVerify.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setCert(null);
    try {
      const data = await certificatesService.verifyCertificate(clean);
      setCert(data);
    } catch (err: any) {
      setError(
        err?.message || "Certificate verification failed. Code may be invalid.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  return (
    <section className="verification-page learning-page">
      <button className="learning-link" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to courses
      </button>
      <PageHeading
        title="Verify a credential"
        description="Enter the credential code from a Virtua Academy certificate to check its authenticity."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify(code);
        }}
        className="verification-form"
      >
        <label htmlFor="credential-code">Credential code</label>
        <div>
          <input
            id="credential-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter credential code"
            required
            autoCapitalize="characters"
          />
          <button className="learning-button" disabled={loading}>
            {loading ? "Verifying…" : "Verify credential"}
          </button>
        </div>
      </form>
      {error && <ErrorState message={error} retry={() => handleVerify(code)} />}
      {cert && (
        <section className="verified-credential" aria-live="polite">
          <h2>
            <CheckCircle size={20} aria-hidden="true" />
            Verified certificate
          </h2>
          <p className="secondary-text">Credential {cert.code}</p>
          <dl>
            <div>
              <dt>Recipient</dt>
              <dd>
                {cert.user?.firstName} {cert.user?.lastName}
              </dd>
            </div>
            <div>
              <dt>Date issued</dt>
              <dd>{formatDate(cert.issuedAt)}</dd>
            </div>
            <div>
              <dt>Course completed</dt>
              <dd>{cert.product?.title}</dd>
            </div>
          </dl>
        </section>
      )}
    </section>
  );
};
