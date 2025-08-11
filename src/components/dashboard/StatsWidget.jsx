import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ShieldQuestion, Clock, XCircle, BarChartHorizontal } from 'lucide-react';

const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center">
      <Icon className={`h-4 w-4 mr-2 ${color}`} />
      <span className="text-gray-300">{label}</span>
    </div>
    <span className="font-bold text-white">{value}</span>
  </div>
);

export const StatsWidget = ({ historyData }) => {
  const stats = useMemo(() => {
    return {
      success: historyData.filter(item => item.status.startsWith('✅')).length,
      approval: historyData.filter(item => item.status.startsWith('🟡 Chờ phê duyệt')).length,
      otp: historyData.filter(item => item.status.startsWith('🟡 Chờ OTP')).length,
      failed: historyData.filter(item => item.status.startsWith('❌')).length,
    };
  }, [historyData]);

  return (
    <Card className="cyber-card-bg h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-white flex items-center">
          <BarChartHorizontal className="mr-2 text-cyan-400" />
          Thống Kê
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center space-y-3">
        <StatItem icon={CheckCircle} label="Thành công" value={stats.success} color="text-green-400" />
        <StatItem icon={Clock} label="Chờ phê duyệt" value={stats.approval} color="text-yellow-400" />
        <StatItem icon={ShieldQuestion} label="Chờ OTP" value={stats.otp} color="text-blue-400" />
        <StatItem icon={XCircle} label="Sai mật khẩu" value={stats.failed} color="text-red-400" />
      </CardContent>
    </Card>
  );
};