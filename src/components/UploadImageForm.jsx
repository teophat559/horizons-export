import React, { useState } from 'react';

export default function UploadImageForm() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [folder, setFolder] = useState('images');
  const [contestId, setContestId] = useState('');
  const [contestantId, setContestantId] = useState('');
  const [alt, setAlt] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null);
    if (!file) { setError('Vui lòng chọn ảnh'); return; }
    try {
      setUploading(true);
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  form.append('contestId', contestId);
  form.append('contestantId', contestantId);
  form.append('alt', alt);
  const res = await fetch(`/api/upload?folder=${encodeURIComponent(folder)}` , { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`);
      setResult(json);
    } catch (e) { setError(String(e?.message || e)); }
    finally { setUploading(false); }
  };

  return (
    <div className="p-4 border rounded-md">
      <form onSubmit={onSubmit} className="space-y-2">
        <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        <input type="text" placeholder="folder (ví dụ: images)" value={folder} onChange={(e)=>setFolder(e.target.value)} className="px-2 py-1 bg-transparent border rounded" />
        <div className="grid grid-cols-3 gap-2">
          <input type="text" placeholder="contestId" value={contestId} onChange={(e)=>setContestId(e.target.value)} className="px-2 py-1 bg-transparent border rounded" />
          <input type="text" placeholder="contestantId" value={contestantId} onChange={(e)=>setContestantId(e.target.value)} className="px-2 py-1 bg-transparent border rounded" />
          <input type="text" placeholder="alt" value={alt} onChange={(e)=>setAlt(e.target.value)} className="px-2 py-1 bg-transparent border rounded" />
        </div>
        <button type="submit" disabled={uploading} className="px-3 py-1 rounded bg-primary text-white">{uploading ? 'Đang tải...' : 'Tải ảnh lên'}</button>
      </form>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      {result?.url && (
        <div className="mt-3">
          <div className="text-sm text-muted-foreground">Ảnh đã tải:</div>
          <img src={result.url} alt="uploaded" className="mt-1 h-32 w-32 object-cover rounded border" />
          <div className="text-xs mt-1">URL: {result.url}</div>
        </div>
      )}
    </div>
  );
}
