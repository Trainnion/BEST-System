'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeDisplay({
  trackingCode,
  qrHash,
  size = 110,
  showLabel = true,
  className = '',
}) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!trackingCode) return;

    // The verification payload encoded in the QR code
    const payload = JSON.stringify({
      code: trackingCode,
      hash: qrHash || '',
      verify_url: `/track?code=${encodeURIComponent(trackingCode)}`,
    });

    QRCode.toDataURL(payload, {
      width: size * 2, // 2x for sharp 300 DPI print scale
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setDataUrl(url))
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [trackingCode, qrHash, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500 ${className}`}
      >
        QR Loading...
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`Verification QR for ${trackingCode}`}
        width={size}
        height={size}
        className="print-qr-code"
      />
      {showLabel && (
        <div className="text-center mt-1">
          <div className="font-mono text-[9px] font-bold text-black tracking-wider">
            {trackingCode}
          </div>
          {qrHash && (
            <div className="font-mono text-[7px] text-black/70">
              SIG: {qrHash.slice(0, 16)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
