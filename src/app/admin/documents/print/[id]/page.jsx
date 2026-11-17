'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft, AlertCircle } from 'lucide-react';
import PrintClearance from '../../../../../components/print/PrintClearance.jsx';
import PrintIndigency from '../../../../../components/print/PrintIndigency.jsx';
import '../../../../../styles/print.css';

export default function DocumentPrintPage() {
  const params = useParams();
  const trackingCode = params?.id;

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!trackingCode) return;
    let active = true;

    async function loadDocument() {
      try {
        const res = await fetch(`/api/documents/${trackingCode}`);
        if (!res.ok) throw new Error('Document record not found');
        const data = await res.json();
        if (active) {
          setDoc(data);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Error loading document');
          setLoading(false);
        }
      }
    }

    loadDocument();
    return () => {
      active = false;
    };
  }, [trackingCode]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black p-8 font-mono text-sm">
        Preparing certificate print engine...
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-8">
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-200 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Print Engine Error</h2>
          <p className="text-xs text-rose-300 mt-1">{error || 'Document could not be loaded.'}</p>
          <Link
            href="/admin/documents"
            className="inline-block mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
          >
            Return to Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 text-black py-8 print:py-0 print:bg-white">
      {/* Screen action bar - hidden on print */}
      <div className="no-print max-w-[210mm] mx-auto mb-6 px-4 flex items-center justify-between">
        <Link
          href="/admin/documents"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document Queue</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print Certificate (A4 / Letter)</span>
        </button>
      </div>

      {/* Printable Certificate Sheet */}
      <div className="print-area">
        {doc.document_type === 'CLEARANCE' ? (
          <PrintClearance documentData={doc} />
        ) : (
          <PrintIndigency documentData={doc} />
        )}
      </div>
    </div>
  );
}
