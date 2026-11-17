'use client';

import QRCodeDisplay from './QRCodeDisplay.jsx';

export default function PrintIndigency({ documentData }) {
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
              BARANGAY SAN GABRIEL
            </div>
            <div className="text-xs font-semibold tracking-wide italic mt-0.5">
              OFFICE OF THE PUNONG BARANGAY
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <h1 className="text-2xl font-bold tracking-widest uppercase underline decoration-2 underline-offset-8">
              CERTIFICATE OF INDIGENCY
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
              {resident.purok || 'Purok 1'}, Barangay San Gabriel.
            </p>

            <p className="indent-8">
              This further certifies that the above-named person and his/her family belongs to the{' '}
              <strong>INDIGENT / LOW-INCOME BRACKET</strong> of this barangay, having no regular source of
              income sufficient to meet daily sustenance and basic household needs.
            </p>

            <p className="indent-8">
              This certification is issued upon the request of the interested party in connection with their
              application for:
            </p>

            <div className="p-3 my-2 border border-black/30 font-sans font-semibold text-center uppercase tracking-wide">
              {documentData?.purpose || 'MEDICAL / FINANCIAL / SOCIAL WELFARE ASSISTANCE'}
            </div>

            <p className="indent-8">
              Issued this <strong>{day}th</strong> day of <strong>{month}</strong>, <strong>{year}</strong>{' '}
              at the Office of the Punong Barangay, Barangay San Gabriel.
            </p>

            <p className="text-xs italic text-black/70">
              * Note: Issued pursuant to R.A. 11261 (First Time Jobseekers Act) / Barangay Welfare Policy.
              Exempt from all local barangay fees.
            </p>
          </div>

          {/* Lower Section */}
          <div className="mt-8 pt-6 border-t border-black/20 grid grid-cols-12 gap-4 items-end">
            {/* Left: Metadata & QR */}
            <div className="col-span-6 space-y-3 font-sans text-[10px]">
              <div className="border border-black p-2 space-y-1">
                <div>
                  <span className="font-semibold">Fee Assessment: </span>
                  <span className="font-bold text-black uppercase">EXEMPT / ZERO FEE (INDIGENT)</span>
                </div>
                <div>
                  <span className="font-semibold">Certificate No.: </span>
                  <span className="font-mono font-bold">{documentData?.tracking_code}</span>
                </div>
                <div>
                  <span className="font-semibold">Issuing Officer: </span>
                  <span>Desk Officer on Duty</span>
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

            {/* Right: Punong Barangay Signature */}
            <div className="col-span-6 text-center font-sans">
              <div className="mb-12 text-xs italic">Approved and attested by:</div>
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
