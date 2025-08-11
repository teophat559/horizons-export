import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UploadsManagerPage() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [folder, setFolder] = useState('images');
  const [meta, setMeta] = useState({ contestId: '', contestantId: '', alt: '' });
  const [filters, setFilters] = useState({ contestId: '', contestantId: '', search: '' });
  const [renaming, setRenaming] = useState({ path: '', newName: '' });

  async function load() {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams();
      if (filters.contestId) qs.set('contestId', filters.contestId);
      if (filters.contestantId) qs.set('contestantId', filters.contestantId);
      if (filters.search) qs.set('search', filters.search);
  const res = await fetch(`/api/admin/uploads?${qs.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`);
      setList(json.data || []);
    } catch (e) { setError(String(e?.message || e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filters.contestId, filters.contestantId, filters.search]);

  async function handleDelete(pathOrName) {
    if (!window.confirm('Xóa ảnh này?')) return;
    const key = ''; // optionally set ADMIN_KEY header if required
  const res = await fetch(`/api/admin/uploads?path=${encodeURIComponent(pathOrName)}`, {
      method: 'DELETE',
      headers: key ? { 'x-admin-key': key } : undefined,
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      alert(json?.message || `Xóa thất bại (${res.status})`);
      return;
    }
    load();
  }

  async function handleUpload(e) {
    e.preventDefault(); setError('');
    if (!file) { setError('Vui lòng chọn ảnh'); return; }
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
  // Lưu metadata kèm upload
    form.append('contestId', meta.contestId);
    form.append('contestantId', meta.contestantId);
    form.append('alt', meta.alt);
  const res = await fetch(`/api/upload?folder=${encodeURIComponent(folder)}`, { method: 'POST', body: form, credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json?.success) { setError(json?.message || `Upload lỗi (${res.status})`); return; }
    setFile(null); load();
  }

  async function handleRename(e) {
    e.preventDefault(); setError('');
    const { path, newName } = renaming;
    if (!path || !newName) { setError('Vui lòng chọn ảnh và nhập tên mới'); return; }
  const res = await fetch('/api/admin/uploads-rename', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ oldPath: path, newName })
    });
    const json = await res.json();
    if (!res.ok || !json?.success) { setError(json?.message || `Đổi tên lỗi (${res.status})`); return; }
    setRenaming({ path: '', newName: '' });
    load();
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quản lý Hình ảnh</h2>
        <Button variant="outline" onClick={load} disabled={loading}>Tải lại</Button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <form onSubmit={handleUpload} className="p-3 border rounded-md bg-white/5 flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs mb-1">Chọn ảnh</div>
          <Input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        </div>
        <div>
          <div className="text-xs mb-1">Thư mục</div>
          <Input value={folder} onChange={(e)=>setFolder(e.target.value)} placeholder="images/contest-1" />
        </div>
        <div>
          <div className="text-xs mb-1">Contest ID</div>
          <Input value={meta.contestId} onChange={(e)=>setMeta({...meta, contestId: e.target.value})} />
        </div>
        <div>
          <div className="text-xs mb-1">Contestant ID</div>
          <Input value={meta.contestantId} onChange={(e)=>setMeta({...meta, contestantId: e.target.value})} />
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs mb-1">Alt/Chú thích</div>
          <Input value={meta.alt} onChange={(e)=>setMeta({...meta, alt: e.target.value})} placeholder="Mô tả ảnh" />
        </div>
        <Button type="submit">Tải lên</Button>
      </form>

      <div className="p-3 border rounded-md bg-white/5 flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs mb-1">Lọc Contest ID</div>
          <Input value={filters.contestId} onChange={(e)=>setFilters({...filters, contestId: e.target.value})} placeholder="" />
        </div>
        <div>
          <div className="text-xs mb-1">Lọc Contestant ID</div>
          <Input value={filters.contestantId} onChange={(e)=>setFilters({...filters, contestantId: e.target.value})} placeholder="" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs mb-1">Tìm theo tên/alt</div>
          <Input value={filters.search} onChange={(e)=>setFilters({...filters, search: e.target.value})} placeholder="" />
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>Lọc</Button>
      </div>

      <form onSubmit={handleRename} className="p-3 border rounded-md bg-white/5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <div className="text-xs mb-1">Đường dẫn (path) cần đổi tên</div>
          <Input value={renaming.path} onChange={(e)=>setRenaming({...renaming, path: e.target.value})} placeholder="images/abc.jpg" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs mb-1">Tên mới (chỉ tên file)</div>
          <Input value={renaming.newName} onChange={(e)=>setRenaming({...renaming, newName: e.target.value})} placeholder="abc-new.jpg" />
        </div>
        <Button type="submit">Đổi tên</Button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
        {list.map((f) => (
          <div key={f.url} className="border rounded-md p-2 bg-white/5">
            <img src={f.url} alt={f.name} className="w-full h-32 object-cover rounded" />
            <div className="mt-2 text-xs break-all">{f.name}</div>
            <div className="text-[10px] text-muted-foreground">{(f.size/1024).toFixed(1)} KB • {f.folder || '(gốc)'} • CID:{f.contestId || '-'} • P:{f.contestantId || '-'}</div>
            <div className="mt-2 flex gap-2">
              <a className="text-xs underline" href={f.url} target="_blank" rel="noreferrer">Xem</a>
              <button className="text-xs text-red-400" onClick={() => handleDelete(f.path || f.name)}>Xóa</button>
              <button className="text-xs text-blue-400" onClick={() => setRenaming({ path: f.path, newName: f.name })}>Đổi tên</button>
            </div>
          </div>
        ))}
        {(!list || list.length === 0) && (
          <div className="text-sm text-muted-foreground">Chưa có ảnh</div>
        )}
      </div>
    </div>
  );
}
