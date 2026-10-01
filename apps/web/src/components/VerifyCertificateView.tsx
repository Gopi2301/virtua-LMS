import React, { useState, useEffect } from 'react';
import { certificatesService } from '../services/certificates.service';
import type { VerifiedCertificate } from '../services/certificates.service';
import { formatDate } from '../utils/formatters';

interface VerifyCertificateViewProps {
  initialCode?: string;
  onBack: () => void;
}

export const VerifyCertificateView: React.FC<VerifyCertificateViewProps> = ({
  initialCode = '',
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
      setError(err?.message || 'Certificate verification failed. Code may be invalid.');
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
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
      >
        ← Back to Catalog
      </button>

      <div className="bg-[#181818] border border-[#272727] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#F3E700]">
            CREDENTIAL VERIFICATION
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Verify Certificate of Completion</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Enter the unique credential identification code found at the bottom of the certificate.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(code);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. 5A92C1D4"
            className="flex-1 px-4 py-3 bg-[#121212] border border-[#333] focus:border-[#F3E700] rounded-xl text-white font-mono tracking-wider placeholder:text-zinc-600 focus:outline-none transition uppercase"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#F3E700] hover:bg-[#e0d500] text-black font-bold rounded-xl transition shadow-[0_0_12px_rgba(243,231,0,0.3)] disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Credential'}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {cert && (
          <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-400">Authentic & Verified Certificate</h3>
                <p className="text-xs text-zinc-400 font-mono">Serial: {cert.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800/80 pt-4 text-sm">
              <div>
                <p className="text-xs text-zinc-500">Recipient</p>
                <p className="font-semibold text-white">
                  {cert.user?.firstName} {cert.user?.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Issue Date</p>
                <p className="font-semibold text-white">{formatDate(cert.issuedAt)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-zinc-500">Completed Program</p>
                <p className="font-semibold text-lg text-[#F3E700]">{cert.product?.title}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
