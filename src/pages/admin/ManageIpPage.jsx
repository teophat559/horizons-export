import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ShieldOff, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/auth/AuthContext';

import { API_ENDPOINTS } from '@/lib/services/apiConfig';
const API_URL = API_ENDPOINTS.adminBlockedIps;

const IpManagementTable = ({ title, icon: Icon, ips, onDelete, colorClass }) => {
    return (
        <Card className="cyber-card-bg">
            <CardHeader>
                <CardTitle className={`text-white flex items-center ${colorClass}`}>
                    {Icon} {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {ips.length > 0 ? ips.map(ip => (
                    <div key={ip.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-md">
                        <div>
                            <p className="font-mono text-white">{ip.ip}</p>
                            <p className="text-xs text-gray-400">{ip.note}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button onClick={() => onDelete(ip.id)} variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-400" />
                            </Button>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 py-4">Không có IP nào.</p>}
            </CardContent>
        </Card>
    );
};

const ManageIpPage = () => {
    const { isAuthenticated } = useAuth();
    const [ipList, setIpList] = useState([]);
    const [newIp, setNewIp] = useState('');
    const [note, setNote] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchIPs = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_URL, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                // Normalize to { id, ip, type, note }
                const mapped = (data.data || []).map((row) => ({
                    id: row.id,
                    ip: row.ip_address,
                    type: row.is_active ? 'blocked' : 'allowed',
                    note: row.reason || ''
                }));
                setIpList(mapped);
            } else {
                toast.error(data.message || 'Không tải được danh sách IP');
            }
        } catch (e) {
            toast.error('Lỗi tải danh sách IP');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIPs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddIp = async () => {
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(newIp)) {
            toast.error('Địa chỉ IP không hợp lệ.');
            return;
        }
        if (!note) {
            toast.error('Ghi chú không được để trống.');
            return;
        }
        if (!isAuthenticated) {
            toast.error('Cần đăng nhập admin.');
            return;
        }
        try {
            setLoading(true);
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.__CSRF_TOKEN || ''
                },
                credentials: 'include',
                body: JSON.stringify({ ip: newIp, reason: note, csrf_token: window.__CSRF_TOKEN || '' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Đã thêm IP ${newIp}.`);
                setNewIp('');
                setNote('');
                fetchIPs();
            } else {
                toast.error(data.message || 'Thêm IP thất bại');
            }
        } catch (e) {
            toast.error('Lỗi thêm IP');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleIp = async (id) => {};

    const handleDeleteIp = async (id) => {
        const ip = ipList.find(x => x.id === id);
        if (!ip) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}?ip=${encodeURIComponent(ip.ip)}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã xóa IP khỏi danh sách.');
                fetchIPs();
            } else {
                toast.error(data.message || 'Xóa IP thất bại');
            }
        } catch (e) {
            toast.error('Lỗi xóa IP');
        } finally {
            setLoading(false);
        }
    };

    const filteredIps = ipList.filter(ip =>
        ip.ip.includes(searchTerm) || ip.note.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Helmet>
                <title>Quản Lý IP - BVOTE WEB</title>
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="cyber-card-bg mb-6">
                    <CardHeader>
                        <CardTitle className="text-white">Chặn IP mới</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Địa chỉ IP (VD: 192.168.1.1)" value={newIp} onChange={e => setNewIp(e.target.value)} className="bg-background border-border text-white" />
                            <Input placeholder="Ghi chú (VD: Văn phòng)" value={note} onChange={e => setNote(e.target.value)} className="bg-background border-border text-white" />
                        </div>
                        <div className="flex items-center justify-end">
                            <Button onClick={handleAddIp} className="glowing-button-cyber">
                                <Plus className="mr-2 h-4 w-4" /> Thêm
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="relative w-full max-w-sm mb-6">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm IP hoặc ghi chú..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 pl-10 text-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <IpManagementTable
                        title="Danh Sách IP Bị Chặn"
                        icon={<ShieldOff className="mr-2 h-5 w-5" />}
                        ips={filteredIps}
                        onDelete={handleDeleteIp}
                        colorClass="text-red-400"
                    />
                </div>
            </motion.div>
        </>
    );
};

export default ManageIpPage;