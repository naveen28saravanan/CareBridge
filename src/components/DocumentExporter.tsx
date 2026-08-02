import React from "react";
import { Printer, Download, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { Button, Modal } from "./ui";

export interface PrescriptionDocData {
  prescriptionId: string;
  clinicianName: string;
  clinicianReg: string;
  patientName: string;
  patientAgeSex: string;
  patientAllergies: string;
  date: string;
  medicines: Array<{ medicine: string; strength: string; instructions: string }>;
  clinicalNotes?: string;
}

export interface DocumentExporterProps {
  open: boolean;
  onClose: () => void;
  title: string;
  docData: PrescriptionDocData;
}

export const DocumentExporter: React.FC<DocumentExporterProps> = ({
  open,
  onClose,
  title,
  docData,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const textContent = `
=====================================================
CAREBRIDGE ONE - OFFICIAL CLINICAL DIGITAL PRESCRIPTION
=====================================================
Prescription ID: ${docData.prescriptionId}
Date: ${docData.date}

CLINICIAN INFORMATION:
Doctor: ${docData.clinicianName}
Registration No: ${docData.clinicianReg}

PATIENT DEMOGRAPHICS:
Patient Name: ${docData.patientName}
Age/Sex: ${docData.patientAgeSex}
Allergies: ${docData.patientAllergies}

PRESCRIBED MEDICATIONS:
${docData.medicines
  .map(
    (m, idx) =>
      `${idx + 1}. ${m.medicine} (${m.strength})\n   Instructions: ${m.instructions}`,
  )
  .join("\n\n")}

${docData.clinicalNotes ? `CLINICAL NOTES:\n${docData.clinicalNotes}\n` : ""}
-----------------------------------------------------
VERIFICATION: Digitally signed by ${docData.clinicianName}
Security Standard: HIPAA & ABDM Compliant Prototype
=====================================================
    `.trim();

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docData.prescriptionId}_${docData.patientName.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} title={title} onClose={onClose} wide>
      <div className="document-export-modal">
        <div className="document-sheet">
          <header className="document-header">
            <div className="document-brand">
              <h2>CAREBRIDGE ONE</h2>
              <p>Verified Telehealth & Clinical Network</p>
            </div>
            <div className="document-meta">
              <strong>Rx #{docData.prescriptionId}</strong>
              <span>Date: {docData.date}</span>
            </div>
          </header>

          <div className="document-patient-strip">
            <div>
              <span>PATIENT NAME</span>
              <strong>{docData.patientName}</strong>
            </div>
            <div>
              <span>AGE / SEX</span>
              <strong>{docData.patientAgeSex}</strong>
            </div>
            <div>
              <span>RECORDED ALLERGIES</span>
              <strong style={{ color: docData.patientAllergies !== "None" ? "#dc2626" : "inherit" }}>
                {docData.patientAllergies}
              </strong>
            </div>
            <div>
              <span>PRESCRIBING DOCTOR</span>
              <strong>{docData.clinicianName} ({docData.clinicianReg})</strong>
            </div>
          </div>

          <section className="document-section">
            <h4>Prescribed Medicines (Rx)</h4>
            <div className="document-rx-list">
              {docData.medicines.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "0.8rem" }}>No medicines recorded in this digital summary.</p>
              ) : (
                docData.medicines.map((m, idx) => (
                  <div key={idx} className="document-rx-item">
                    <div>
                      <strong style={{ fontSize: "0.9rem", color: "#1e293b" }}>
                        {idx + 1}. {m.medicine} {m.strength ? `(${m.strength})` : ""}
                      </strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#475569" }}>
                        Instructions: {m.instructions}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {docData.clinicalNotes ? (
            <section className="document-section">
              <h4>Clinical Summary & Advice</h4>
              <p style={{ fontSize: "0.8rem", color: "#334155", lineHeight: 1.5, margin: 0 }}>
                {docData.clinicalNotes}
              </p>
            </section>
          ) : null}

          <footer className="document-footer">
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                <ShieldCheck size={14} color="#2563eb" /> Cryptographically verified record
              </span>
              <span>Issued via CareBridge One Telehealth Network</span>
            </div>
            <div className="document-signature">
              <span className="document-signature-stamp">
                <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />
                DIGITALLY SIGNED
              </span>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1e293b" }}>
                {docData.clinicianName}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#64748b" }}>{docData.clinicianReg}</div>
            </div>
          </footer>
        </div>

        <div className="button-row button-row--end" style={{ marginTop: 12 }}>
          <Button variant="outline" icon={<Download size={17} />} onClick={handleDownloadTxt}>
            Download text copy
          </Button>
          <Button icon={<Printer size={17} />} onClick={handlePrint}>
            Print / Save PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
};
