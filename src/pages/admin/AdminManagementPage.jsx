import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManageIpPage from './ManageIpPage';
import AuditLogsPage from './AuditLogsPage';
import UploadsManagerPage from './UploadsManagerPage';
import PendingLoginsPage from './PendingLoginsPage';
import { UserCheck } from 'lucide-react';

const AdminManagementPage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();

  const validTabs = ['ip-management', 'audit-logs', 'uploads', 'pending-logins'];
  const currentTab = validTabs.includes(tab) ? tab : 'ip-management';

  useEffect(() => {
    if (!validTabs.includes(tab)) {
      navigate('/admin/admin-management/ip-management', { replace: true });
    }
  }, [tab, navigate]);

  const handleTabChange = (value) => {
    navigate(`/admin/admin-management/${value}`);
  };

  const pageTitles = {
    'ip-management': 'Quản Lý IP',
    'audit-logs': 'Audit Logs',
  'uploads': 'Quản Lý Hình Ảnh',
  'pending-logins': 'Đăng nhập đang chờ',
  };

  return (
    <>
      <Helmet>
        <title>{pageTitles[currentTab]} - Quản Lý Admin</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 mb-4 border border-border rounded-lg">
            <TabsTrigger value="ip-management" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-slate-300 py-3 rounded-md">
              <UserCheck className="mr-2 h-4 w-4" /> IP Đăng Nhập
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-slate-300 py-3 rounded-md">
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="uploads" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-slate-300 py-3 rounded-md">
              Hình Ảnh
            </TabsTrigger>
            <TabsTrigger value="pending-logins" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-slate-300 py-3 rounded-md">
              Đăng nhập đang chờ
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ip-management">
            <ManageIpPage />
          </TabsContent>
          <TabsContent value="audit-logs">
            <AuditLogsPage />
          </TabsContent>
          <TabsContent value="uploads">
            <UploadsManagerPage />
          </TabsContent>
          <TabsContent value="pending-logins">
            <PendingLoginsPage />
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
};

export default AdminManagementPage;