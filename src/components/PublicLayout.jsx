import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User, LogIn, Vote, Home, Trophy, Search } from 'lucide-react';
import { LoginModal } from '@/components/LoginModal';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PublicLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [initialPlatform, setInitialPlatform] = useState(null);
  const { isUserAuthenticated, user, logout: userLogout } = useUserAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenLoginModal = (platform = null) => {
    setInitialPlatform(platform);
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    userLogout();
    toast({
      title: "✅ Đăng xuất thành công!",
      description: "Hẹn gặp lại bạn.",
    });
     navigate('/contests');
  };

  const navLinkClasses = "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium nav-button-glow";
  const activeNavLinkClasses = "bg-white/10 text-white";
  const inactiveNavLinkClasses = "text-muted-foreground hover:text-white hover:bg-white/5";

  return (
    <>
      <LoginModal
        isOpen={isLoginModalOpen}
        setIsOpen={setIsLoginModalOpen}
        initialPlatform={initialPlatform}
      />
      <div className="min-h-screen text-foreground relative overflow-hidden main-gradient-bg">
        <div className="absolute inset-0 wavy-line"></div>
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="bg-background/80 shadow-md backdrop-blur-sm sticky top-0 z-40 border-b border-white/10">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-6"
              >
                <a href="/contests" className="flex items-center gap-2 text-2xl font-bold text-white nav-item-glow p-2 rounded-lg">
                  <Vote className="h-8 w-8 text-primary" />
                  <span>BVOTE</span>
                </a>
              </motion.div>

              <div className="flex-1 max-w-xl mx-6 hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm cuộc thi hoặc thí sinh..."
                      className="bg-card/80 border-white/10 rounded-full pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
              </div>

              {isUserAuthenticated ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar className="h-10 w-10 border-2 border-primary/50">
                              <AvatarImage src={`https://i.pravatar.cc/150?u=${user.name}`} alt={user.name} />
                              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">{user.name}</p>
                              <p className="text-xs leading-none text-muted-foreground">
                                  {user.platform ? `Qua ${user.platform}` : 'Đã đăng nhập'}
                              </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                           <Link to={`/user/${user.name}`}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Trang cá nhân</span>
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Đăng xuất</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                  <Button onClick={() => handleOpenLoginModal()} className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-bold rounded-full px-6 shadow-lg shadow-primary/30">
                      Đăng nhập
                  </Button>
              )}
            </nav>
          </header>

          <main className="container mx-auto px-4 md:px-8 flex-grow">
            <div className="my-6">
              <div className="flex justify-center items-center gap-4 bg-card/80 border border-white/10 rounded-lg p-2 mb-6 max-w-md mx-auto">
                 <NavLink
                  to="/contests"
                  end
                  className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : inactiveNavLinkClasses}`}
                >
                  <Home className="h-4 w-4" />
                  Trang chủ
                </NavLink>
                <NavLink
                  to="/rankings"
                  className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : inactiveNavLinkClasses}`}
                >
                  <Trophy className="h-4 w-4" />
                  Bảng xếp hạng
                </NavLink>
              </div>

              <div className="relative rounded-xl overflow-hidden h-48 md:h-64 shadow-lg interactive-glow">
                <img loading="lazy" alt="Ảnh bìa chương trình" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1675749191790-6b6b3b13046b" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                       <img loading="lazy" alt="Logo chương trình" className="w-16 h-16 md:w-20 md:h-20 object-contain" src="https://images.unsplash.com/photo-1598802777393-751e5387ecd1" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white title-glow">NỀN TẢNG BVOTE</h1>
                    <p className="text-white/80 mt-2">Nền tảng bình chọn uy tín hàng đầu</p>
                  </div>
                </div>
              </div>
            </div>
            <Outlet context={{ handleOpenLoginModal, searchQuery }} />
          </main>

          <footer className="bg-card/50 backdrop-blur-sm mt-8 py-6 text-center text-muted-foreground border-t border-white/10">
            <p>&copy; {new Date().getFullYear()} Hệ thống BVOTE. Bảo lưu mọi quyền.</p>
            <p className="text-xs mt-1">Nền tảng bình chọn uy tín hàng đầu.</p>
          </footer>
        </div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, delay: 1 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Button
            onClick={() => navigate('/admin/login')}
            variant="ghost"
            size="icon"
            className="rounded-full bg-card/50 text-muted-foreground hover:bg-card hover:text-primary backdrop-blur-sm"
            aria-label="Truy cập trang quản trị"
          >
            <Shield className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default PublicLayout;