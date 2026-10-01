import React, { useState } from 'react';
import { formatDate } from '../utils/formatters';

interface CertificateModalProps {
  certificate: {
    id: string;
    code: string;
    issuedAt: string;
  };
  courseTitle: string;
  studentName: string;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  courseTitle,
  studentName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const verificationUrl = `${window.location.origin}/?verify=${certificate.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#141414] border border-[#333] rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Certificate Frame */}
        <div className="relative border-4 border-[#2a2a2a] p-8 sm:p-12 rounded-xl bg-gradient-to-b from-[#1a1a1a] via-[#141414] to-[#111] shadow-inner text-center">
          {/* Ornamental corner accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#F3E700]" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#F3E700]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#F3E700]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#F3E700]" />

          {/* Logo badge */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F3E700] text-black font-black text-2xl flex items-center justify-center shadow-[0_0_24px_rgba(243,231,0,0.3)] mb-4">
            V
          </div>

          <p className="text-xs uppercase tracking-[0.3em] font-semibold text-[#F3E700] mb-2">
            VIRTUA LMS ACADEMY
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 font-serif">
            Certificate of Completion
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm tracking-wider uppercase mb-6">
            This is proudly presented to
          </p>

          <div className="text-2xl sm:text-3xl font-bold text-white border-b border-zinc-700/60 pb-2 mb-6 max-w-md mx-auto">
            {studentName}
          </div>

          <p className="text-zinc-400 text-xs sm:text-sm mb-2">
            for successfully mastering and completing all curriculum requirements of
          </p>
          <div className="text-xl sm:text-2xl font-bold text-[#F3E700] mb-8 max-w-xl mx-auto leading-snug">
            {courseTitle}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-6 text-left max-w-md mx-auto">
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Date Issued</p>
              <p className="text-sm font-semibold text-zinc-200">{formatDate(certificate.issuedAt)}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Verification Code</p>
              <p className="text-sm font-mono font-bold text-[#F3E700] tracking-wider">{certificate.code}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-400 font-mono">
            Code: <span className="text-[#F3E700] font-bold">{certificate.code}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700 flex items-center gap-2"
            >
              {copied ? '✓ Link Copied' : 'Share Verification Link'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F3E700] hover:bg-[#e0d500] text-black font-bold transition shadow-[0_0_12px_rgba(243,231,0,0.3)]"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
