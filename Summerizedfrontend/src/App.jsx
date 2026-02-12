import { useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const formatFileSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function App() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleSummarize = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/summarize`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to summarize file");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white">
      <div className="relative z-10 max-w-2xl mx-auto px-5 py-16">
        {/* Drop Zone */}
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer mb-4
            ${dragging ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"}
            ${file ? "py-5 px-6" : "py-14 px-6"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => !file && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.csv,.json,.xml,.html,.pdf,.jpg,.jpeg,.png,.gif,.webp,.py,.js,.ts,.jsx,.tsx,.css,.yaml,.yml,.log"
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
          />

          {file ? (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-white/50">
                  Drop your file here, or{" "}
                  <span className="text-violet-400">browse</span>
                </p>
                <p className="text-xs text-white/20 mt-1">
                  TXT, MD, PDF, CSV, JSON, images & more · Max 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSummarize}
          disabled={!file || loading}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2
            ${
              !file || loading
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_30px_rgba(124,58,237,0.4)]"
            }`}
        >
          {loading ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            "Summarize File"
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span>{result.filename}</span>
              {result.word_count > 0 && (
                <span>· ~{result.word_count.toLocaleString()} words</span>
              )}
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">
                Summary
              </h2>
              <p className="text-white/80 text-sm leading-7">
                {result.summary}
              </p>
            </div>

            {result.key_points?.length > 0 && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">
                  Key Points
                </h2>
                <ul className="space-y-3">
                  {result.key_points.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-white/70"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                reset();
                inputRef.current?.click();
              }}
              className="w-full py-3 rounded-xl text-sm text-white/40 hover:text-white/70 border border-white/5 hover:border-white/10 transition-all"
            >
              Summarize another file →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}