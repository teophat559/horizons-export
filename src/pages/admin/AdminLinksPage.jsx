import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-toastify';

export default function AdminLinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState('');
  const [adminName, setAdminName] = useState('');
  const adminKey = useMemo(() => {
    try { return localStorage.getItem('ADMIN_KEY') || ''; } catch { return ''; }
  }, []);
  const adminHeaders = useMemo(() => {
    const h = { 'content-type': 'application/json' };
    if (adminKey) h['x-admin-key'] = adminKey;
    return h;
  }, [adminKey]);

  async function load() {
    try {
      setLoading(true);
  const res = await fetch('/api/admin/links?withCounts=true', { headers: adminHeaders, credentials: 'include' });
      const json = await res.json();
      if (res.ok && json?.success) setLinks(json.data || []);
      else toast.error(json?.message || 'Tải danh sách thất bại');
    } catch (e) {
      toast.error('Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createLink() {
    if (!label && !adminName) {
      toast.warn('Nhập ít nhất Label hoặc Admin Name');
      return;
    }
    try {
      const res = await fetch('/api/admin/links', {
        method: 'POST', headers: adminHeaders, credentials: 'include',
        body: JSON.stringify({ label, adminName })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) return toast.error(json?.message || 'Tạo link thất bại');
      toast.success('Đã tạo link');
      setLabel(''); setAdminName('');
      load();
    } catch { toast.error('Lỗi tạo link'); }
  }

  async function deleteLink(key) {
    if (!window.confirm('Xóa link phụ này?')) return;
    try {
      const res = await fetch(`/api/admin/links/${encodeURIComponent(key)}`, { method: 'DELETE', headers: adminHeaders, credentials: 'include' });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success === false) return toast.error(json?.message || 'Xóa thất bại');
      toast.success('Đã xóa');
      setLinks(prev => prev.filter(x => x.key !== key));
    } catch { toast.error('Lỗi xóa link'); }
  }

  function copyLink(key) {
    const url = `${window.location.origin}/?al=${key}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Đã copy link'), () => toast.error('Không thể copy'));
  }

  return (
    <Card className="cyber-card-bg">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Label</label>
            <Input value={label} onChange={e=>setLabel(e.target.value)} placeholder="VD: Team A" className="bg-input border-border text-white" />
          </div>
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Admin Name</label>
            <Input value={adminName} onChange={e=>setAdminName(e.target.value)} placeholder="VD: Nguyen Van A" className="bg-input border-border text-white" />
          </div>
          <Button onClick={createLink}>Tạo Link Phụ</Button>
        </div>

        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-purple-500/30">
                <TableHead>KEY</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Admin Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Số lượt truy cập</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((x) => (
                <TableRow key={x.key} className="border-b-purple-500/10 text-sm">
                  <TableCell className="font-mono">{x.key}</TableCell>
                  <TableCell>{x.adminName || x.label || x.key}</TableCell>
                  <TableCell>{x.label || '—'}</TableCell>
                  <TableCell>{x.adminName || '—'}</TableCell>
                  <TableCell>{x.createdAt ? new Date(x.createdAt).toLocaleString('vi-VN') : '—'}</TableCell>
                  <TableCell>{typeof x.viewsCount === 'number' ? x.viewsCount : 0}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="secondary" onClick={()=>copyLink(x.key)}>Copy</Button>
                    <Button variant="destructive" onClick={()=>deleteLink(x.key)}>Xoá</Button>
                  </TableCell>
                </TableRow>
              ))}
              {links.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-6">Chưa có link phụ nào.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
