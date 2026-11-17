'use client';

import QRCodeDisplay from './QRCodeDisplay.jsx';

export default function PrintClearance({ documentData }) {
  const resident = documentData?.resident || {};
  const residentName = `${resident.first_name || ''} ${
    resident.middle_name ? `${resident.middle_name[0]}. ` : ''
  }${resident.last_name || ''} ${resident.suffix || ''}`.trim() || documentData?.masked_name || 'RESIDENT NAME';

  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();

  return (
    <div className="certificate-sheet bg-white text-black font-serif text-sm p-8 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
      <div className="certificate-border border-2 border-black p-8 flex-1 flex flex-col justify-between">
        <div className="certificate-inner-border border border-black p-6 flex-1 flex flex-col justify-between">
          {/* Header */}
          <div className="text-center space-y-0.5 border-b-2 border-black pb-4 mb-6">
            <div className="text-xs uppercase tracking-wider">Republic of the Philippines</div>
            <div className="text-xs uppercase tracking-wider">Province of Laguna</div>
            <div className="text-xs uppercase tracking-wider">Municipality / City of Santa Rosa</div>
            <div className="text-sm font-bold uppercase tracking-widest mt-1">
              BARANGAY DARO
            </div>
            <div className="text-xs font-semibold tracking-wide italic mt-0.5">
              OFFICE OF THE PUNONG BARANGAY
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <h1 className="text-2xl font-bold tracking-widest uppercase underline decoration-2 underline-offset-8">
              BARANGAY CLEARANCE
            </h1>
          </div>

          {/* Salutation */}
          <div className="text-left font-bold text-sm mb-4">
            TO WHOM IT MAY CONCERN:
          </div>

          {/* Body */}
          <div className="space-y-4 text-justify leading-relaxed text-sm">
            <p className="indent-8">
              This is to certify that{' '}
              <strong className="uppercase underline font-bold">{residentName}</strong>, of legal age,{' '}
              {resident.civil_status ? resident.civil_status.toLowerCase() : 'single'}, Filipino, is a bona fide
              resident of {resident.street_address ? `${resident.street_address}, ` : ''}
              {resident.purok || 'Purok 1'}, Barangay Daro.
            </p>

            <p className="indent-8">
              Based on the records of this office, the aforementioned person has{' '}
              <strong>NO DEROGATORY RECORD</strong> or pending blotter report filed against him/her and is
              known in the community to be of good moral character, peaceful, and a law-abiding citizen.
            </p>

            <p className="indent-8">
              This certification is issued upon the request of the interested party for the purpose of:
            </p>

            <div className="p-3 my-2 border border-black/30 font-sans font-semibold text-center uppercase tracking-wide">
              {documentData?.purpose || 'LEGAL / EMPLOYMENT REQUIREMENTS'}
            </div>

            <p className="indent-8">
              Issued this <strong>{day}th</strong> day of <strong>{month}</strong>, <strong>{year}</strong>{' '}
              at the Office of the Punong Barangay, Barangay Daro.
            </p>
          </div>

          {/* Lower Section: Thumbmark, Details, Signatures */}
          <div className="mt-8 pt-6 border-t border-black/20 grid grid-cols-12 gap-4 items-end">
            {/* Left: Metadata & QR */}
            <div className="col-span-4 space-y-3 font-sans text-[10px]">
              <div className="border border-black p-2 space-y-1">
                <div>
                  <span className="font-semibold">CTC No.: </span>
                  <span className="font-mono">{documentData?.ctc_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold">Fee Paid: </span>
                  <span className="font-mono">
                    ₱{Number(documentData?.fee_amount || 50).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">OR No.: </span>
                  <span className="font-mono">{documentData?.receipt_or_no || 'OR-PENDING'}</span>
                </div>
                <div>
                  <span className="font-semibold">Doc No.: </span>
                  <span className="font-mono font-bold">{documentData?.tracking_code}</span>
                </div>
              </div>

              {/* QR Verification */}
              <div className="pt-1">
                <QRCodeDisplay
                  trackingCode={documentData?.tracking_code}
                  qrHash={documentData?.qr_hash}
                  size={95}
                />
              </div>
            </div>

            {/* Middle: Thumbmark Box */}
            <div className="col-span-3 flex flex-col items-center">
              <div className="w-20 h-24 border border-black flex items-center justify-center text-[9px] font-sans text-black/60 text-center p-1">
                Right Thumbmark
              </div>
              <div className="text-[9px] font-sans text-center mt-1">Applicant Signature</div>
            </div>

            {/* Right: Punong Barangay Signature */}
            <div className="col-span-5 text-center font-sans">
              <div className="mb-10 text-xs italic">Approved and attested by:</div>
              <div className="border-b-2 border-black pb-1 font-bold text-sm tracking-wide uppercase">
                HON. JUAN DELA CRUZ
              </div>
              <div className="text-xs font-semibold mt-0.5">Punong Barangay</div>
              <div className="text-[9px] text-black/70 italic">Not valid without official seal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
