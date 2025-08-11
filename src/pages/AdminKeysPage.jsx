import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { KeyRound, PlusCircle, Edit, Trash2, Save, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const ADMIN_KEYS_STORAGE_KEY = 'bvote_admin_keys';
const MAX_KEYS = 3;

const AdminKeysPage = () => {
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem(ADMIN_KEYS_STORAGE_KEY);
      if (savedKeys) {
        setKeys(JSON.parse(savedKeys));
      } else {
        // Initialize with a default key if none exist
        const defaultKeys = [{ id: Date.now(), value: 'admin123' }];
        setKeys(defaultKeys);
        localStorage.setItem(ADMIN_KEYS_STORAGE_KEY, JSON.stringify(defaultKeys));
      }
    } catch (error) {
      console.error("Failed to load admin keys from localStorage", error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách key.', variant: 'destructive' });
    }
  }, [toast]);

  const saveKeysToStorage = (updatedKeys) => {
    localStorage.setItem(ADMIN_KEYS_STORAGE_KEY, JSON.stringify(updatedKeys));
    setKeys(updatedKeys);
  };

  const handleAddKey = () => {
    if (!newKey.trim()) {
      toast({ title: 'Lỗi', description: 'Mã key không được để trống.', variant: 'destructive' });
      return;
    }
    if (keys.length >= MAX_KEYS) {
      toast({ title: 'Lỗi', description: `Chỉ được phép tạo tối đa ${MAX_KEYS} mã key.`, variant: 'destructive' });
      return;
    }
    const updatedKeys = [...keys, { id: Date.now(), value: newKey.trim() }];
    saveKeysToStorage(updatedKeys);
    setNewKey('');
    toast({ title: 'Thành công', description: 'Đã thêm key mới.' });
  };

  const handleUpdateKey = () => {
    if (!newKey.trim()) {
      toast({ title: 'Lỗi', description: 'Mã key không được để trống.', variant: 'destructive' });
      return;
    }
    const updatedKeys = keys.map(key => 
      key.id === editingKeyId ? { ...key, value: newKey.trim() } : key
    );
    saveKeysToStorage(updatedKeys);
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
      const updatedKeys = keys.filter(key => key.id !== id);
      saveKeysToStorage(updatedKeys);
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
        <Card className="cyber-card-bg max-w-2xl mx-auto">
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
      </motion.div>
    </>
  );
};

export default AdminKeysPage;