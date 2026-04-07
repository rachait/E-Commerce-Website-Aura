import React, { useEffect, useRef, useState } from 'react'

let pdfjsPromise

async function getPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjs) => {
      const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
      return pdfjs
    })
  }

  return pdfjsPromise
}

export default function InvoicePreviewModal({ invoiceUrl, open, onClose }) {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let canceled = false

    const renderPdf = async () => {
      if (!open || !invoiceUrl || !canvasRef.current) {
        return
      }

      setLoading(true)
      setError('')

      try {
        const pdfjs = await getPdfJs()
        const loadingTask = pdfjs.getDocument(invoiceUrl)
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)

        const viewport = page.getViewport({ scale: 1.35 })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: context,
          viewport
        }).promise

        if (!canceled) {
          setLoading(false)
        }
      } catch (err) {
        if (!canceled) {
          setError('Unable to preview invoice PDF.')
          setLoading(false)
        }
      }
    }

    renderPdf()

    return () => {
      canceled = true
    }
  }, [invoiceUrl, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-zinc-900">Invoice Preview</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm border border-zinc-300 rounded-sm hover:border-zinc-900"
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-auto max-h-[78vh] bg-zinc-50">
          {loading && <p className="text-zinc-600">Rendering invoice...</p>}
          {error && <p className="text-red-600">{error}</p>}
          <canvas ref={canvasRef} className="mx-auto bg-white shadow" />
        </div>
      </div>
    </div>
  )
}
