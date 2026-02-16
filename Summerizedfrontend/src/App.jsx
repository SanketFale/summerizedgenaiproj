import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/summarize';

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSummary('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file');

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error summarizing file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ textAlign: 'center' }}>Gemini File Summarizer</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Upload PDF or TXT file:
          </label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          style={{
            width: '100%',
            padding: '0.9rem',
            background: loading ? '#aaa' : '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Summarizing...' : 'Summarize'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', margin: '1rem 0', padding: '0.8rem', background: '#ffebee' }}>
          {error}
        </div>
      )}

      {summary && (
        <div style={{ marginTop: '2rem', background: '#020a04', padding: '1rem', borderRadius: '8px' }}>
          <h3>Summary</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{summary}</pre>
          <button
            onClick={() => navigator.clipboard.writeText(summary).then(() => alert('Copied!'))}
            style={{
              padding: '0.5rem 1rem',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem',
            }}
          >
            Copy Summary
          </button>
        </div>
      )}
    </div>
  );
}

export default App;