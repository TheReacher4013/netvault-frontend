import { useState, useRef } from 'react'
import { Upload, Download, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ImportExportBar({ onExport, onImport, templateHeaders, entityLabel = 'Records', theme }) {
  const fileRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState(null) // { imported, skipped, failed, errors }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      await onExport()
      toast.success(`${entityLabel} exported successfully`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed')
    } finally { setExporting(false) }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset so same file can be re-selected

    // Client-side validation
    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV files are accepted')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max size is 2MB.')
      return
    }

    const fd = new FormData()
    fd.append('file', file)
    setImporting(true)
    setResult(null)
    try {
      const res = await onImport(fd)
      const data = res?.data?.data || {}
      setResult({
        imported: data.imported || 0,
        skipped: data.skipped || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      })
      if ((data.imported || 0) > 0) {
        toast.success(`${data.imported} ${entityLabel.toLowerCase()} imported successfully`)
      } else {
        toast.error('No records were imported')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Import failed'
      toast.error(msg)
    } finally { setImporting(false) }
  }

  const downloadTemplate = () => {
    const blob = new Blob([templateHeaders + '\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityLabel.toLowerCase()}-import-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Export */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
          style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}40`, color: theme.accent }}
        >
          {exporting
            ? <Loader2 size={12} className="animate-spin" />
            : <Download size={12} />}
          Export CSV
        </button>

        {/* Import */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
          style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}40`, color: theme.accent }}
        >
          {importing
            ? <Loader2 size={12} className="animate-spin" />
            : <Upload size={12} />}
          Import CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

        {/* Template download */}
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{ color: theme.muted, border: `1px solid ${theme.border}` }}
        >
          <FileText size={11} />
          Template
        </button>
      </div>

      {/* Import result summary */}
      {result && (
        <div className="mt-3 rounded-xl p-3.5 text-xs"
          style={{ background: `${theme.surface}`, border: `1px solid ${theme.border}` }}>
          <div className="flex items-start justify-between mb-2">
            <span className="font-semibold" style={{ color: theme.text }}>Import Result</span>
            <button onClick={() => setResult(null)} style={{ color: theme.muted }}>
              <X size={12} />
            </button>
          </div>
          <div className="flex gap-4 mb-2">
            <span className="flex items-center gap-1" style={{ color: '#16a34a' }}>
              <CheckCircle2 size={11} /> {result.imported} imported
            </span>
            {result.skipped > 0 && (
              <span style={{ color: theme.muted }}>{result.skipped} skipped</span>
            )}
            {result.failed > 0 && (
              <span className="flex items-center gap-1" style={{ color: '#C94040' }}>
                <AlertCircle size={11} /> {result.failed} failed
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1 mt-2 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
              <span className="font-mono text-[10px]" style={{ color: theme.muted }}>Errors:</span>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {result.errors.slice(0, 10).map((e, i) => (
                  <div key={i} className="font-mono text-[10px]" style={{ color: '#C94040' }}>
                    Row {e.row}: {e.name || e.label} — {e.error}
                  </div>
                ))}
                {result.errors.length > 10 && (
                  <div className="font-mono text-[10px]" style={{ color: theme.muted }}>
                    ...and {result.errors.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
