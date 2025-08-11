import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, CircleEllipsis as Ellipsis, Rss, UserPlus, Users, Image as ImageIcon, Video, Smile } from 'lucide-react';

const UserPage = () => {
  return (
    <>
      <Helmet>
        <title>Trang cá nhân của User</title>
        <meta name="description" content="Trang cá nhân người dùng trên nền tảng BVOTE." />
      </Helmet>
      <div className="w-full max-w-5xl mx-auto">
        {/* Cover Photo and Profile Header */}
        <Card className="rounded-b-none border-none overflow-hidden">
          <div className="h-48 md:h-64 lg:h-80 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 relative">
            <img  alt="Ảnh bìa trang cá nhân" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1620207418302-439b387441b0" />
            <Button size="sm" className="absolute bottom-4 right-4 bg-white/80 hover:bg-white text-black">
              <Camera className="h-4 w-4 mr-2" />
              Chỉnh sửa ảnh bìa
            </Button>
          </div>
          <div className="bg-card px-4 sm:px-6 lg:px-8">
            <div className="flex items-end -mt-20 sm:-mt-24 space-x-5">
              <div className="relative">
                <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-card">
                  <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" />
                  <AvatarFallback>UN</AvatarFallback>
                </Avatar>
                <Button size="icon" variant="secondary" className="absolute bottom-2 right-2 h-8 w-8 rounded-full">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="pb-6 flex-grow">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">User Name</h1>
                <p className="text-muted-foreground">1.2K bạn bè</p>
              </div>
              <div className="pb-6 flex space-x-2">
                <Button className="bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Thêm bạn bè</span>
                </Button>
                <Button variant="secondary">
                  <Rss className="h-4 w-4 mr-0 sm:mr-2" />
                   <span className="hidden sm:inline">Theo dõi</span>
                </Button>
                <Button variant="secondary" size="icon">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <hr className="border-border" />
          </div>
        </Card>

        {/* Tabs Navigation */}
        <div className="bg-card sticky top-[65px] z-30 rounded-t-none">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-5 px-2">
              <TabsTrigger value="posts">Bài viết</TabsTrigger>
              <TabsTrigger value="about">Giới thiệu</TabsTrigger>
              <TabsTrigger value="friends">Bạn bè</TabsTrigger>
              <TabsTrigger value="photos">Ảnh</TabsTrigger>
              <TabsTrigger value="videos">Video</TabsTrigger>
            </TabsList>

            <div className="p-4 sm:p-6 lg:p-8">
              <TabsContent value="posts">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column */}
                  <div className="md:col-span-5 space-y-6">
                    <IntroCard />
                    <PhotosCard />
                  </div>
                  {/* Right Column (Main content) */}
                  <div className="md:col-span-7 space-y-6">
                    <CreatePostCard />
                    <PostCard />
                    <PostCard />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="about"><div className="text-center p-8">Thông tin giới thiệu sẽ được hiển thị tại đây.</div></TabsContent>
              <TabsContent value="friends"><div className="text-center p-8">Danh sách bạn bè sẽ được hiển thị tại đây.</div></TabsContent>
              <TabsContent value="photos"><div className="text-center p-8">Thư viện ảnh sẽ được hiển thị tại đây.</div></TabsContent>
              <TabsContent value="videos"><div className="text-center p-8">Thư viện video sẽ được hiển thị tại đây.</div></TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
};

const IntroCard = () => (
  <Card>
    <CardContent className="p-4">
      <h3 className="font-bold text-xl mb-4">Giới thiệu</h3>
      <p className="text-sm text-center text-muted-foreground mb-4">Mô tả ngắn về bản thân. "Sống hết mình với đam mê."</p>
      <Button variant="secondary" className="w-full mb-4">Chỉnh sửa tiểu sử</Button>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Đến từ <strong>Hà Nội</strong></li>
        <li className="flex items-center gap-2"><Rss className="h-4 w-4 text-muted-foreground" />Sống tại <strong>TP. Hồ Chí Minh</strong></li>
      </ul>
      <Button variant="secondary" className="w-full mt-4">Chỉnh sửa chi tiết</Button>
    </CardContent>
  </Card>
);

const PhotosCard = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xl">Ảnh</h3>
        <Button variant="link" className="text-primary">Xem tất cả ảnh</Button>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-lg overflow-hidden">
        <img  alt="Photo 1" className="aspect-square object-cover w-full h-full" src="https://images.unsplash.com/photo-1578390432942-d323db577792" />
        <img  alt="Photo 2" className="aspect-square object-cover w-full h-full" src="https://images.unsplash.com/photo-1578390432942-d323db577792" />
        <img  alt="Photo 3" className="aspect-square object-cover w-full h-full" src="https://images.unsplash.com/photo-1578390432942-d323db577792" />
        <img  alt="Photo 4" className="aspect-square object-cover w-full h-full" src="https://images.unsplash.com/photo-1578390432942-d323db577792" />
        <img  alt="Photo 5" className="aspect-square object-cover w-full h-full" src="https://images.unsplash.com/photo-1578390432942-d323db577792" />
        <img  alt="Photo 6" className="aspect-square object-cover w-full h-full" src="https://images.unsplash.com/photo-1546427864-8ba58def433f" />
      </div>
    </CardContent>
  </Card>
);


const CreatePostCard = () => (
  <Card>
    <CardContent className="p-4">
       <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
         <Avatar>
            <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
            <AvatarFallback>UN</AvatarFallback>
         </Avatar>
         <Button variant="secondary" className="flex-grow justify-start rounded-full h-10 text-muted-foreground">Bạn đang nghĩ gì?</Button>
       </div>
       <div className="grid grid-cols-3 gap-2">
            <Button variant="ghost" className="flex items-center justify-center gap-2">
                <Video className="h-5 w-5 text-red-500" /> Video
            </Button>
             <Button variant="ghost" className="flex items-center justify-center gap-2">
                <ImageIcon className="h-5 w-5 text-green-500" /> Ảnh
            </Button>
             <Button variant="ghost" className="flex items-center justify-center gap-2">
                <Smile className="h-5 w-5 text-yellow-500" /> Cảm xúc
            </Button>
       </div>
    </CardContent>
  </Card>
);


const PostCard = () => (
    <Card>
        <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                        <AvatarFallback>UN</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold">User Name</p>
                        <p className="text-xs text-muted-foreground">18 tháng 7 lúc 10:30</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon"><Ellipsis className="h-5 w-5" /></Button>
            </div>
            <p className="mb-4">Hôm nay là một ngày tuyệt vời để bắt đầu những dự án mới! Cảm thấy thật nhiều năng lượng. 💪 #motivation #newbeginnings</p>
            <div className="rounded-lg overflow-hidden mb-4">
                <img  alt="Post image" className="w-full h-auto object-cover" src="https://images.unsplash.com/photo-1688634744943-d5c15e625a52" />
            </div>
             <div className="flex justify-between items-center text-muted-foreground text-sm mb-2">
                <span>128 lượt thích</span>
                <span>32 bình luận</span>
            </div>
            <hr className="border-border" />
            <div className="grid grid-cols-3 gap-1 mt-1">
                <Button variant="ghost">Thích</Button>
                <Button variant="ghost">Bình luận</Button>
                <Button variant="ghost">Chia sẻ</Button>
            </div>
        </CardContent>
    </Card>
);

export default UserPage;