import { X, Download, Link } from "@virtua-lms/ui";
import { LearningDialog } from "./LearningUI";
import React, { useState } from "react";
import { formatDate } from "../utils/formatters";

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
    <LearningDialog
      title="Certificate of completion"
      onClose={onClose}
      className="certificate-dialog"
    >
      <button
        className="dialog-close"
        onClick={onClose}
        aria-label="Close certificate"
      >
        <X size={20} />
      </button>
      <article className="certificate-document">
        <div className="certificate-brand">
          <span className="learning-brand-mark">v.</span>Virtua Academy
        </div>
        <p className="certificate-label">Certificate of completion</p>
        <h2>{studentName}</h2>
        <p>has completed</p>
        <h3>{courseTitle}</h3>
        <dl>
          <div>
            <dt>Date issued</dt>
            <dd>{formatDate(certificate.issuedAt)}</dd>
          </div>
          <div>
            <dt>Credential code</dt>
            <dd>{certificate.code}</dd>
          </div>
        </dl>
        <p className="certificate-url">Verify at {verificationUrl}</p>
      </article>
      <div className="certificate-actions">
        <button className="learning-button secondary" onClick={handleCopyLink}>
          <Link size={16} />
          {copied ? "Link copied" : "Copy verification link"}
        </button>
        <button className="learning-button" onClick={handlePrint}>
          <Download size={16} />
          Print / Save PDF
        </button>
      </div>
    </LearningDialog>
  );
};
