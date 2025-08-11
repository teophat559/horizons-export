import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/AuthContext';
import NotificationSoundController from '@/components/NotificationSoundController';
import { LayoutDashboard, Users, Vote, Bell, Settings, KeySquare, LogOut, Menu, X, Chrome, ExternalLink, Shield, Users2, Palette, Video, Bot, Server, FileCog, Music } from 'lucide-react';

const navItems = [{
  name: 'Bảng Điều Khiển',
  icon: LayoutDashboard,
  path: '/admin/dashboard'
}, {
  name: 'Quản lý Cuộc thi',
  icon: Vote,
  subItems: [{
    name: 'Danh sách Cuộc thi',
    path: '/admin/contest-management/contests',
    icon: Vote
  }, {
    name: 'Danh sách Thí sinh',
    path: '/admin/contest-management/contestants',
    icon: Users
  }]
}, {
  name: 'Quản lý Người dùng',
  icon: Users2,
  subItems: [{
    name: 'Giao diện',
    path: '/admin/user-management/appearance',
    icon: Palette
  }, {
    name: 'Lịch sử Video',
    path: '/admin/user-management/record',
    icon: Video
  }]
}, {
  name: 'Quản lý Thông báo',
  icon: Bell,
  subItems: [{
    name: 'Mẫu thông báo',
    path: '/admin/notification-management/templates',
    icon: FileCog
  }, {
    name: 'Lịch sử thông báo',
    path: '/admin/notification-management/history',
    icon: Bell
  }, {
    name: 'Cài đặt chuông',
    path: '/admin/notification-management/sound-settings',
    icon: Music
  }]
}, {
  name: 'Tự động hóa Chrome',
  icon: Chrome,
  subItems: [{
    name: 'Bảng điều khiển',
    path: '/admin/chrome-management/control',
    icon: Bot
  }, {
    name: 'Quản lý Profiles',
    path: '/admin/chrome-management/profiles',
    icon: Users
  }, {
    name: 'Cài đặt Agent',
    path: '/admin/chrome-management/setup',
    icon: Server
  }]
}, {
  name: 'Cài đặt chung',
  icon: Settings,
  subItems: [{
    name: 'Cấu hình Web',
    path: '/admin/settings/web-config',
    icon: Settings
  }, {
    name: 'Cấu hình Auto Login',
    path: '/admin/settings/auto-login',
    icon: Bot
  }, {
    name: 'Mã bảo mật',
    path: '/admin/settings/admin-keys',
    icon: KeySquare
  }]
}];
const SidebarLink = ({
  item,
  isExpanded,
  location,
  toggleSidebar
}) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(item.subItems ? item.subItems.some(sub => location.pathname.startsWith(sub.path)) : false);
  const toggleSubMenu = () => {
    if (item.subItems) {
      setIsSubMenuOpen(!isSubMenuOpen);
    }
  };
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };
  if (item.subItems) {
    return <div>
        <button onClick={toggleSubMenu} className="w-full flex items-center justify-between p-3 rounded-md text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-200">
          <div className="flex items-center">
            <item.icon className="w-6 h-6 mr-4" />
            <AnimatePresence>
                {isExpanded && <motion.span initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} exit={{
              opacity: 0
            }}>{item.name}</motion.span>}
            </AnimatePresence>
          </div>
          <AnimatePresence>
          {isExpanded && <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className={`transform transition-transform duration-200 ${isSubMenuOpen ? 'rotate-90' : ''}`}>
                 &gt;
            </motion.div>}
          </AnimatePresence>
        </button>
        <AnimatePresence>
        {isSubMenuOpen && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: 'auto',
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} className="overflow-hidden">
             <div className={`pt-2 ${isExpanded ? 'pl-8' : 'pl-2'}`}>
              {item.subItems.map(subItem => <NavLink key={subItem.path} to={subItem.path} onClick={handleLinkClick} className={({
              isActive
            }) => `flex items-center p-3 my-1 rounded-md transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  {subItem.icon && <subItem.icon className={`w-4 h-4 ${isExpanded ? 'mr-3' : ''}`} />}
                   <AnimatePresence>
                    {isExpanded && <motion.span initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} exit={{
                  opacity: 0
                }} className="text-sm">{subItem.name}</motion.span>}
                   </AnimatePresence>
                </NavLink>)}
            </div>
          </motion.div>}
        </AnimatePresence>
      </div>;
  }
  return <NavLink to={item.path} onClick={handleLinkClick} className={({
    isActive
  }) => `flex items-center p-3 my-1 rounded-md transition-all duration-200 nav-item-glow ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : ''}`}>
      <item.icon className={`w-6 h-6 ${isExpanded ? 'mr-4' : 'mx-auto'}`} />
      <AnimatePresence>
        {isExpanded && <motion.span initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }}>{item.name}</motion.span>}
      </AnimatePresence>
    </NavLink>;
};
const MainLayout = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const {
    logout
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };
  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  };
  const sidebarVariants = {
    expanded: {
      width: '280px'
    },
    collapsed: {
      width: '80px'
    },
    mobileOpen: {
      x: 0
    },
    mobileClosed: {
      x: '-100%'
    }
  };
  return <div className="flex h-screen bg-background text-foreground">
            <NotificationSoundController />
            <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50 text-white" onClick={toggleSidebar}>
                {isMobileOpen ? <X /> : <Menu />}
            </Button>

            <motion.aside animate={window.innerWidth < 1024 ? isMobileOpen ? 'mobileOpen' : 'mobileClosed' : isExpanded ? 'expanded' : 'collapsed'} variants={sidebarVariants} transition={{
      type: 'spring',
      stiffness: 300,
      damping: 30
    }} className={`fixed lg:relative z-40 h-full flex flex-col p-4 cyber-sidebar-bg`}>
                <div className="flex items-center justify-center mb-8 relative">
                     <AnimatePresence>
                        {isExpanded && <motion.h1 className="text-2xl font-bold text-white animate-text-glow" initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -20
          }}>Hello Boong!!</motion.h1>}
                    </AnimatePresence>
                    <Button variant="ghost" size="icon" className="hidden lg:inline-flex text-white absolute right-0" onClick={toggleSidebar}>
                        {isExpanded ? <X /> : <Menu />}
                    </Button>
                </div>

                <nav className="flex-grow">
                    {navItems.map((item, index) => <motion.div key={index} className="my-1">
                            <SidebarLink item={item} isExpanded={isExpanded} location={location} toggleSidebar={toggleSidebar} />
                        </motion.div>)}
                </nav>

                <div className="mt-auto flex flex-col items-center space-y-2">
                  <motion.div whileHover={{
          scale: 1.05
        }} className="w-full">
                     <a href="/" target="_blank" rel="noopener noreferrer" className={`flex items-center p-3 rounded-md transition-all duration-200 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-white ${!isExpanded && 'justify-center'}`}>
                          <ExternalLink className={`w-5 h-5 ${isExpanded && 'mr-3'}`} />
                          <AnimatePresence>
                            {isExpanded && <motion.span initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} exit={{
                opacity: 0
              }}>Xem trang User</motion.span>}
                          </AnimatePresence>
                      </a>
                  </motion.div>
                  <motion.div whileHover={{
          scale: 1.05
        }} className="w-full">
                      <Button onClick={handleLogout} variant="destructive" className={`w-full flex items-center p-3 rounded-md transition-all duration-200 border border-red-500/50 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-white ${!isExpanded && 'justify-center'}`}>
                          <LogOut className={`w-5 h-5 ${isExpanded && 'mr-3'}`} />
                           <AnimatePresence>
                            {isExpanded && <motion.span initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} exit={{
                opacity: 0
              }}>Đăng xuất</motion.span>}
                           </AnimatePresence>
                      </Button>
                  </motion.div>
                </div>
            </motion.aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto main-gradient-bg p-4">
                    <Outlet />
                </main>
            </div>
        </div>;
};
export default MainLayout;