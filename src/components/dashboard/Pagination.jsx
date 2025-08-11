import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    return (
        <div className="flex justify-end items-center space-x-2 mt-4">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => onPageChange(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="border-gray-700 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
            >
                <ChevronLeft className="h-4 w-4"/>
            </Button>
            <span className="text-sm text-gray-400">Trang {currentPage} / {totalPages}</span>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="border-gray-700 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
            >
                <ChevronRight className="h-4 w-4"/>
            </Button>
        </div>
    );
};