import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

const ViewSwitcher = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const isUserVotingPage = location.pathname.startsWith('/vote');
    const isAdminArea = isAuthenticated && !isUserVotingPage;

    const handleSwitch = () => {
        if (isAdminArea) {
            navigate('/vote');
        } else {
            navigate('/dashboard');
        }
    };
    
    // Don't show on login pages
    if (location.pathname === '/login' || location.pathname === '/voter-login') {
        return null;
    }

    // Only show if authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.5 }}
            className="fixed bottom-5 right-5 z-50"
        >
            <Button
                onClick={handleSwitch}
                className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white glowing-button-cyber"
                size="lg"
            >
                {isAdminArea ? (
                    <>
                        <Eye className="mr-2 h-5 w-5" />
                        Xem trang User
                    </>
                ) : (
                    <>
                        <Shield className="mr-2 h-5 w-5" />
                        Về trang Admin
                    </>
                )}
            </Button>
        </motion.div>
    );
};

export default ViewSwitcher;