import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Crown, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getSocket, onVoteUpdate, joinContestRoom } from '@/lib/services/socket';

import { API_ENDPOINTS } from '@/lib/services/apiConfig';
const API_CONTESTS = API_ENDPOINTS.contests;
const API_RANKINGS = API_ENDPOINTS.rankings;

const RankingsPage = () => {
  const [contests, setContests] = useState([]);
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [resContests, resRankings] = await Promise.all([
          fetch(API_CONTESTS, { credentials: 'include' }),
          fetch(API_RANKINGS, { credentials: 'include' })
        ]);
        const dataContests = await resContests.json();
        const dataRankings = await resRankings.json();
        if (dataContests.success) setContests(dataContests.data || []);
        if (dataRankings.success) setContestants(dataRankings.data || []);
      } catch (e) {
        console.error('Failed to load rankings', e);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Subscribe to live vote updates (global rankings page)
    const off = onVoteUpdate(({ contestantId, totalVotes }) => {
      // Update the contestant in-place if present
      setContestants(prev => {
        let found = false;
        const next = prev.map(c => {
          if (String(c.id) === String(contestantId)) {
            found = true;
            return { ...c, total_votes: totalVotes };
          }
          return c;
        });
        return found ? next : prev;
      });
    });
    // Ensure socket is initialized
    getSocket();

    return () => {
      if (typeof off === 'function') off();
    };
  }, []);

  // After contests list is loaded, join each contest room to receive updates
  useEffect(() => {
    if (!contests || contests.length === 0) return;
    contests.forEach(c => joinContestRoom(c.id));
  }, [contests]);

  const topParticipants = useMemo(() => {
  return [...contestants]
    .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
    .slice(0, 25)
    .map((p, index) => ({
      ...p,
      rank: index + 1,
      contestName: contests.find(c => c.id === p.contest_id)?.name || 'Không xác định'
    }));
  }, [contests, contestants]);

  if (loading) {
      return <div className="text-center text-white">Đang tải dữ liệu...</div>
  }

  const rankColor = (rank) => {
    if (rank === 1) return 'border-yellow-400 shadow-yellow-400/30';
    if (rank === 2) return 'border-gray-400 shadow-gray-400/30';
    if (rank === 3) return 'border-yellow-600 shadow-yellow-600/30';
    return 'border-white/10';
  };

  const rankTextColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-yellow-600';
    return 'text-white';
  }

  return (
    <>
      <Helmet>
        <title>Bảng Xếp Hạng - BVOTE</title>
        <meta name="description" content="Bảng xếp hạng các thí sinh có lượt bình chọn cao nhất." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white title-glow flex items-center justify-center gap-4">
            <Crown className="h-10 w-10 text-yellow-400" />
            Bảng Xếp Hạng
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">Top 25 thí sinh có lượt bình chọn cao nhất trên toàn hệ thống.</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-card/60 backdrop-blur-sm border-none">
            <div className="flex flex-col">
              {topParticipants.map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`flex items-center p-4 gap-4 border-b ${rankColor(p.rank)} ${index === topParticipants.length - 1 ? 'border-b-0' : ''}`}
                >
                  <div className={`w-12 text-center text-2xl font-bold ${rankTextColor(p.rank)}`}>
                    #{p.rank}
                  </div>
                  <img alt={p.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/50" src={p.image_url || p.imageUrl || 'https://images.unsplash.com/photo-1691437155211-6986ef08cf27'} />
                  <div className="flex-grow">
                    <p className="font-bold text-lg text-white">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.contestName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-lg font-bold text-yellow-400">
                    <Star className="h-5 w-5" />
                    <span>{(p.total_votes || 0).toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default RankingsPage;