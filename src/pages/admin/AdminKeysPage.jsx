import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { KeyRound, PlusCircle, Edit, Trash2, Save, XCircle, Eye, EyeOff, History, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const ADMIN_KEYS_STORAGE_KEY = 'bvote_admin_keys';
const ADMIN_KEYS_HISTORY_STORAGE_KEY = 'bvote_admin_keys_history';
const MAX_KEYS = 3;

const AdminKeysPage = () => {
  const [keys, setKeys] = useState([]);
  const [history, setHistory] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem(ADMIN_KEYS_STORAGE_KEY);
      const savedHistory = localStorage.getItem(ADMIN_KEYS_HISTORY_STORAGE_KEY);
      
      if (savedKeys) {
        setKeys(JSON.parse(savedKeys));
      } else {
        const defaultKeys = [{ id: Date.now(), value: 'admin123' }];
        setKeys(defaultKeys);
        localStorage.setItem(ADMIN_KEYS_STORAGE_KEY, JSON.stringify(defaultKeys));
      }

      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu.', variant: 'destructive' });
    }
  }, [toast]);

  const addHistoryRecord = (action, keyValue) => {
    const newRecord = {
      id: Date.now(),
      action,
      keyValue,
      timestamp: new Date().toLocaleString('sv-SE'),
    };
    const updatedHistory = [newRecord, ...history].slice(0, 20); // Keep last 20 records
    setHistory(updatedHistory);
    localStorage.setItem(ADMIN_KEYS_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const saveKeysToStorage = (updatedKeys) => {
    localStorage.setItem(ADMIN_KEYS_STORAGE_KEY, JSON.stringify(updatedKeys));
    setKeys(updatedKeys);
  };

  const handleAddKey = () => {
    const trimmedKey = newKey.trim();
    if (!trimmedKey) {
      toast({ title: 'Lỗi', description: 'Mã key không được để trống.', variant: 'destructive' });
      return;
    }
    if (keys.length >= MAX_KEYS) {
      toast({ title: 'Lỗi', description: `Chỉ được phép tạo tối đa ${MAX_KEYS} mã key.`, variant: 'destructive' });
      return;
    }
    const updatedKeys = [...keys, { id: Date.now(), value: trimmedKey }];
    saveKeysToStorage(updatedKeys);
    addHistoryRecord('Tạo mới', trimmedKey);
    setNewKey('');
    toast({ title: 'Thành công', description: 'Đã thêm key mới.' });
  };

  const handleUpdateKey = () => {
    const trimmedKey = newKey.trim();
    if (!trimmedKey) {
      toast({ title: 'Lỗi', description: 'Mã key không được để trống.', variant: 'destructive' });
      return;
    }
    const originalKey = keys.find(k => k.id === editingKeyId)?.value;
    const updatedKeys = keys.map(key => 
      key.id === editingKeyId ? { ...key, value: trimmedKey } : key
    );
    saveKeysToStorage(updatedKeys);
    addHistoryRecord('Cập nhật', `từ '${originalKey}' thành '${trimmedKey}'`);
    setNewKey('');
    setEditingKeyId(null);
    toast({ title: 'Thành công', description: 'Đã cập nhật key.' });
  };

  const handleDeleteKey = (id) => {
    if (keys.length <= 1) {
      toast({ title: 'Lỗi', description: 'Phải có ít nhất một mã key.', variant: 'destructive' });
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa mã key này?')) {
      const keyToDelete = keys.find(k => k.id === id);
      const updatedKeys = keys.filter(key => key.id !== id);
      saveKeysToStorage(updatedKeys);
      addHistoryRecord('Xóa', keyToDelete.value);
      toast({ title: 'Thành công', description: 'Đã xóa key.' });
    }
  };

  const startEditing = (key) => {
    setEditingKeyId(key.id);
    setNewKey(key.value);
  };

  const cancelEditing = () => {
    setEditingKeyId(null);
    setNewKey('');
  };

  const toggleVisibility = (id) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const maskKey = (keyStr) => {
      if (keyStr.length <= 4) return '****';
      return `${keyStr.substring(0,2)}...${keyStr.substring(keyStr.length - 2)}`;
  }

  return (
    <>
      <Helmet>
        <title>Quản Lý Mã Truy Cập - BVOTE WEB</title>
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="cyber-main-bg rounded-lg min-h-[calc(100vh-20px)] p-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <div className="lg:col-span-2">
            <Card className="cyber-card-bg">
              <CardHeader>
                <CardTitle className="text-white flex items-center"><KeyRound className="mr-3 text-yellow-400"/> Quản Lý Mã Truy Cập Admin</CardTitle>
                <CardDescription className="text-gray-400">Tạo, sửa, xóa các mã key để truy cập trang quản trị. Tối đa {MAX_KEYS} key.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-gray-300">Danh sách Key</Label>
                  {keys.map(key => (
                    <div key={key.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-md">
                      <div className="flex items-center">
                        <Input
                          type={visibleKeys[key.id] ? 'text' : 'password'}
                          value={key.value}
                          readOnly
                          className="bg-transparent border-none text-white w-48"
                        />
                        <Button onClick={() => toggleVisibility(key.id)} size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                          {visibleKeys[key.id] ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => startEditing(key)} size="icon" variant="ghost" className="text-yellow-400 hover:text-yellow-300"><Edit className="h-4 w-4"/></Button>
                        <Button onClick={() => handleDeleteKey(key.id)} size="icon" variant="ghost" className="text-red-500 hover:text-red-400" disabled={keys.length <= 1}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-700 pt-6 space-y-3">
                  <h4 className="text-md font-semibold text-white">{editingKeyId ? 'Sửa Mã Key' : 'Thêm Mã Key Mới'}</h4>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="Nhập mã key..."
                      className="bg-slate-800/50 border-slate-700 text-white"
                      disabled={!editingKeyId && keys.length >= MAX_KEYS}
                    />
                    {editingKeyId ? (
                      <>
                        <Button onClick={handleUpdateKey} size="icon" className="bg-green-600 hover:bg-green-700"><Save className="h-4 w-4"/></Button>
                        <Button onClick={cancelEditing} size="icon" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"><XCircle className="h-4 w-4"/></Button>
                      </>
                    ) : (
                      <Button onClick={handleAddKey} className="glowing-button-cyber" disabled={keys.length >= MAX_KEYS}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Thêm
                      </Button>
                    )}
                  </div>
                  {!editingKeyId && keys.length >= MAX_KEYS && (
                    <p className="text-sm text-yellow-500">Đã đạt đến số lượng key tối đa.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="cyber-card-bg">
                <CardHeader>
                    <CardTitle className="text-white flex items-center"><History className="mr-3 text-cyan-400"/> Lịch sử Thay đổi</CardTitle>
                    <CardDescription className="text-gray-400">Ghi lại các hoạt động gần đây liên quan đến mã key.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 max-h-[500px] overflow-y-auto">
                    {history.length > 0 ? (
                        <ul className="space-y-4">
                            {history.map((item) => (
                                <li key={item.id} className="flex items-start space-x-3">
                                    <div className="mt-1">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.action === 'Tạo mới' ? 'bg-green-500/20' : item.action === 'Xóa' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                                        {item.action === 'Tạo mới' ? <PlusCircle className="h-3 w-3 text-green-400"/> : item.action === 'Xóa' ? <Trash2 className="h-3 w-3 text-red-400"/> : <Edit className="h-3 w-3 text-yellow-400"/>}
                                      </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {item.action} 
                                            <span className="font-normal text-slate-300 ml-1">
                                              {item.action === 'Cập nhật' ? item.keyValue : `key '${maskKey(item.keyValue)}'`}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center mt-1">
                                            <Clock className="h-3 w-3 mr-1.5"/>
                                            {item.timestamp}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">Chưa có hoạt động nào được ghi lại.</p>
                    )}
                </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AdminKeysPage;