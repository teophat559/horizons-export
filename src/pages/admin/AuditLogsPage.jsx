import React, { useEffect, useMemo, useState } from 'react';
import { io as ioClient } from 'socket.io-client';
import { API_ENDPOINTS } from '@/lib/services/apiConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
} from '@/components/ui/table';

export default function AuditLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [ip, setIp] = useState('');
  const [userId, setUserId] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (action) p.set('action', action);
    if (ip) p.set('ip', ip);
    if (userId) p.set('user_id', userId);
    p.set('limit', String(limit));
    p.set('offset', String(offset));
    return p.toString();
  }, [action, ip, userId, limit, offset]);

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.adminAuditList}?${qs}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`);
      setRows(json.data || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */}, [qs]);

  // Realtime: subscribe to 'audit_log' and prepend new rows
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';
    // Derive Socket.IO origin: if base is an absolute URL, strip any path (e.g., /api)
    // so the client connects to host root at /socket.io. Otherwise use current origin (dev proxy handles ws).
    const url = (() => {
      if (base && base.startsWith('http')) {
        try { return new URL(base).origin; } catch { return base; }
      }
      return window.location.origin;
    })();
    const sock = ioClient(url, { transports: ['websocket'] });
    const handler = (row) => {
      // Simple client-side filtering by current filters
      const matchAction = !action || row?.action === action;
      const matchIp = !ip || row?.ip === ip;
      const matchUser = !userId || row?.user_id === userId;
      if (matchAction && matchIp && matchUser) {
        setRows((prev) => [row, ...prev].slice(0, Number(limit) || 50));
      }
    };
    sock.on('audit_log', handler);
    return () => { try { sock.off('audit_log', handler); sock.close(); } catch {} };
  }, [action, ip, userId, limit]);

  return (
    <div className="p-4 space-y-4">
    <h2 className="text-xl font-semibold">Nhật ký hoạt động</h2>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
        <div>
      <label className="block text-sm mb-1">Hành động</label>
      <Input value={action} onChange={(e)=>setAction(e.target.value)} placeholder="VD: auth_login_request | auth_login_success | vote_submit | view_contests | view_rankings" />
        </div>
        <div>
          <label className="block text-sm mb-1">IP</label>
          <Input value={ip} onChange={(e)=>setIp(e.target.value)} placeholder="127.0.0.1" />
        </div>
        <div>
      <label className="block text-sm mb-1">ID người dùng</label>
          <Input value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="admin" />
        </div>
        <div>
      <label className="block text-sm mb-1">Giới hạn</label>
          <Input type="number" value={limit} onChange={(e)=>setLimit(Number(e.target.value)||50)} />
        </div>
        <div>
      <label className="block text-sm mb-1">Bắt đầu từ</label>
          <Input type="number" value={offset} onChange={(e)=>setOffset(Number(e.target.value)||0)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={()=>{setOffset(0); load();}} disabled={loading}>Lọc</Button>
          <Button variant="outline" onClick={()=>{ setAction(''); setIp(''); setUserId(''); setOffset(0); }} disabled={loading}>Xóa lọc</Button>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="overflow-auto border rounded-md">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Đường dẫn</TableHead>
              <TableHead>Phương thức</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Dữ liệu</TableHead>
              <TableHead>Thời gian xử lý</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id || `${r.ts}-${r.ip}-${r.action}`}>
                <TableCell className="whitespace-nowrap">{new Date(r.ts || r.meta?.ts || Date.now()).toLocaleString()}</TableCell>
                <TableCell>{r.ip}</TableCell>
                <TableCell>{r.user_id}</TableCell>
                <TableCell>{r.action}</TableCell>
                <TableCell className="max-w-[280px] truncate" title={r.path}>{r.path}</TableCell>
                <TableCell>{r.method}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell className="max-w-[360px] truncate" title={r.payload ? JSON.stringify(r.payload) : ''}>{r.payload ? JSON.stringify(r.payload).slice(0, 120) : ''}</TableCell>
                <TableCell>{r.meta?.duration_ms != null ? `${r.meta?.duration_ms} ms` : ''}</TableCell>
              </TableRow>
            ))}
            {(!rows || rows.length === 0) && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex gap-2 items-center">
        <Button variant="outline" onClick={()=>setOffset(Math.max(0, offset - limit))} disabled={loading || offset===0}>Trước</Button>
        <span className="text-sm">vị trí: {offset}</span>
        <Button onClick={()=>setOffset(offset + limit)} disabled={loading}>Sau</Button>
      </div>
    </div>
  );
}
