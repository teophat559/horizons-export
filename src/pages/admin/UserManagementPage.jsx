import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Palette, Video } from 'lucide-react';
import UserAppearanceManagementPage from '@/pages/admin/UserAppearanceManagementPage';
import VideoRecordHistoryPage from '@/pages/admin/VideoRecordHistoryPage';

const UserManagementPage = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const currentTab = (tab === 'appearance' || tab === 'record') ? tab : 'appearance';

    return (
        <>
            <Helmet>
                <title>Quản lý Người dùng - BVOTE WEB</title>
            </Helmet>
            <div className="p-4 md:p-6 space-y-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Quản lý Người dùng</h1>
                <Tabs value={currentTab} onValueChange={(value) => navigate(`/admin/user-management/${value}`)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-sm bg-card/80 backdrop-blur-sm border-border">
                        <TabsTrigger value="appearance" className="data-[state=active]:bg-primary/80 data-[state=active]:text-white">
                            <Palette className="mr-2 h-4 w-4" /> Giao diện
                        </TabsTrigger>
                        <TabsTrigger value="record" className="data-[state=active]:bg-primary/80 data-[state=active]:text-white">
                            <Video className="mr-2 h-4 w-4" /> Lịch sử Video
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="appearance" className="mt-4">
                        <UserAppearanceManagementPage />
                    </TabsContent>
                    <TabsContent value="record" className="mt-4">
                        <VideoRecordHistoryPage />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
};

export default UserManagementPage;