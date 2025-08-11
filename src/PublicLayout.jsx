import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User, LogIn, Vote, Home, Trophy } from 'lucide-react';
import { LoginModal } from '@/components/LoginModal';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const PublicLayout = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [initialPlatform, setInitialPlatform] = useState(null);
  const { isUserAuthenticated, user, logout: userLogout } = useUserAuth();

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
  
  const navLinkClasses = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium";
  const activeNavLinkClasses = "bg-primary text-primary-foreground";
  const inactiveNavLinkClasses = "text-muted-foreground hover:text-foreground nav-item-glow";

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
          <header className="bg-background/80 shadow-md backdrop-blur-sm sticky top-0 z-40 border-b border-border">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                <a href="/contests" className="flex items-center gap-2 text-xl font-bold text-white nav-item-glow p-2 rounded-lg">
                  <Vote className="h-7 w-7 text-primary" />
                  <span>BVOTE</span>
                </a>
                <div className="hidden md:flex items-center gap-2">
                   <NavLink 
                    to="/contests"
                    end
                    className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : inactiveNavLinkClasses}`}
                  >
                    <Home className="h-4 w-4" />
                    Trang Chủ
                  </NavLink>
                  <button onClick={() => toast({ title: "🚧 Tính năng đang phát triển!" })} className={`${navLinkClasses} ${inactiveNavLinkClasses}`}>
                    <Trophy className="h-4 w-4" />
                    Cuộc Thi
                  </button>
                </div>
              </motion.div>
              
              {isUserAuthenticated ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar className="h-10 w-10">
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
                  <Button onClick={() => handleOpenLoginModal()} variant="outline" className="font-bold">
                      <LogIn className="mr-2 h-4 w-4" />
                      Đăng Nhập
                  </Button>
              )}
            </nav>
          </header>
          
          <main className="container mx-auto p-0 sm:p-4 md:p-8 flex-grow">
            {children}
          </main>

          <footer className="bg-card/50 backdrop-blur-sm mt-8 py-6 text-center text-muted-foreground border-t border-border">
            <p>&copy; {new Date().getFullYear()} BVOTE System. All rights reserved.</p>
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