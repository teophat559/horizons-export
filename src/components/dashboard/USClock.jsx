import React, { useState, useEffect } from 'react';

export const USClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const formatTime = (date) => {
        const options = {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    const formatDate = (date) => {
        const options = {
            timeZone: 'America/New_York',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return new Intl.DateTimeFormat('vi-VN', options).format(date);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-white">
            <div 
                className="font-mono text-5xl tracking-widest"
                style={{ textShadow: '0 0 5px #10b981, 0 0 10px #10b981, 0 0 15px #10b981' }}
            >
                {formatTime(time)}
            </div>
            <div className="text-sm text-slate-400 mt-1">
                {formatDate(time)} (UTC-4)
            </div>
        </div>
    );
};