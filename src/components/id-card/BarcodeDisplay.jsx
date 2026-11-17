'use client';

/**
 * BarcodeDisplay - Code 128 barcode for the back of the digital ID card
 * (plan Sec. 17.2). The bundled `jsbarcode` package draws it locally into an
 * inline SVG: no network request, no image host and no external origin.
 *
 * The value always comes from the view model `barcode_data` field. The
 * caption repeats the exact value as text so the card stays understandable
 * when the barcode itself cannot be drawn.
 */

import { useEffect, useRef, useState } from 'react';

import JsBarcode from 'jsbarcode';

export default function BarcodeDisplay({ value }) {
  const svgRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const text = typeof value === 'string' ? value.trim() : '';

  useEffect(() => {
    const node = svgRef.current;
    if (!node || !text) return;

    setFailed(false);
    try {
      JsBarcode(node, text, {
        format: 'CODE128',
        width: 2,
        height: 62,
        margin: 0,
        displayValue: false,
        background: '#f8fafc',
        lineColor: '#0f172a',
      });
    } catch {
      setFailed(true);
    }
  }, [text]);

  if (!text) {
    return (
      <div className="barcode-empty text-xs text-slate-500" role="status">
        Barcode not available.
      </div>
    );
  }

  return (
    <div>
      {failed ? (
        <p className="m-0 text-center text-[0.7rem] font-semibold text-slate-700">
          Barcode could not be drawn on this device.
        </p>
      ) : (
        <svg
          ref={svgRef}
          role="img"
          aria-label={'Code 128 barcode for ' + text}
          className="mx-auto block h-auto max-w-full"
        />
      )}
      <p className="m-0 mt-1 break-all text-center font-mono text-[0.6rem] leading-snug text-slate-700">
        {text}
      </p>
    </div>
  );
}
