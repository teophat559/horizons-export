import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { Users, Star, ArrowRight, Crown, Calendar } from 'lucide-react';
import { socialLogins } from '@/components/LoginModal';

import { API_ENDPOINTS } from '@/lib/services/apiConfig';
const API_BASE = API_ENDPOINTS.vote.replace(/\/vote$/, '');
import { Skeleton } from '@/components/ui/skeleton';

const HeroSection = ({ onLoginClick }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="w-full max-w-2xl mx-auto my-8"
  >
    <Card className="bg-card/60 backdrop-blur-sm border border-white/10 shadow-2xl shadow-primary/10">
      <CardContent className="p-6 sm:p-8 text-center">
        <Button
          onClick={() => onLoginClick()}
          size="lg"
          className="mt-4 w-full sm:w-auto bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-bold text-lg rounded-full px-8 py-4 shadow-lg shadow-primary/30 transition-transform transform hover:scale-105"
        >
          Đăng Nhập
        </Button>
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-muted-foreground text-sm">hoặc tiếp tục với</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>
    <div className="flex justify-center items-center gap-4">
          {socialLogins.map((p) => (
            <motion.button
              key={p.name}
              onClick={() => onLoginClick(p)}
              whileHover={{ scale: 1.15, y: -3 }}
              whileTap={{ scale: 0.95 }}
      className={`flex items-center justify-center w-12 h-12 rounded-lg ${p.bgClass} ${p.borderClass} shadow-md overflow-hidden p-0`}
              aria-label={`Đăng nhập với ${p.name}`}
            >
              <p.icon className={`h-full w-full object-cover ${p.padding || ''}`} />
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const formatDate = (d) => {
  try {
    const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
    if (isNaN(date?.getTime?.())) return null;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return null;
  }
};

const getContestTimeRange = (contest) => {
  // Try multiple common field names; fallback to unknown if not present
  const start = contest.start_date || contest.startDate || contest.begin_date || contest.beginDate || contest.time_start || contest.start;
  const end = contest.end_date || contest.endDate || contest.finish_date || contest.finishDate || contest.time_end || contest.end;
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} - ${e}`;
  if (s) return `${s} - ?`;
  if (e) return `? - ${e}`;
  return 'Chưa cập nhật';
};

const ContestCard = ({ contest, contestantsCount }) => {
  const totalVotes = contestantsCount.totalVotes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      layout
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 group flex flex-col"
    >
      <div className="relative">
        <img loading="lazy" alt={contest.name} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" src={contest.bannerUrl || 'https://images.unsplash.com/photo-1658504140972-7af3e80d35f1'} />
        <div className="absolute top-3 right-3 bg-green-500/80 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
          Đang diễn ra
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white truncate">{contest.name}</h3>
        <p className="text-muted-foreground text-sm mt-1 h-10 flex-grow">{contest.description}</p>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>Thời gian: {getContestTimeRange(contest)}</span>
        </div>
        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>{contestantsCount.count} thí sinh</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span>{totalVotes.toLocaleString()} phiếu</span>
          </div>
        </div>
        <Button asChild className="w-full mt-5 bg-gradient-to-r from-primary/80 to-purple-500/80 hover:from-primary hover:to-purple-500 text-white font-semibold group">
          <Link to={`/contests/${contest.id}`}>
            Xem chi tiết
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
};

const ParticipantCard = ({ participant, contestName }) => {
    const rankColor = {
        1: 'bg-yellow-400 text-black',
        2: 'bg-gray-300 text-black',
        3: 'bg-yellow-600 text-white',
    };
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, delay: (participant.rank || 4) * 0.1 }}
            className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center flex flex-col items-center shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300"
        >
            <div className="relative mb-4">
                <img loading="lazy" alt={participant.name} className="w-24 h-24 rounded-full object-cover border-4 border-primary/50" src={participant.imageUrl || 'https://images.unsplash.com/photo-1691437155211-6986ef08cf27'} />
                {participant.rank && (
                  <div className={`absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankColor[participant.rank] || 'bg-secondary text-white'}`}>
                      #{participant.rank}
                  </div>
                )}
            </div>
            <h4 className="text-lg font-bold text-white">{participant.name}</h4>
            <p className="text-xs text-muted-foreground">{contestName}</p>
            <div className="flex items-center gap-2 mt-3 text-yellow-400 font-bold">
                <Star className="h-5 w-5" />
                <span>{(participant.votes || 0).toLocaleString()} Phiếu</span>
            </div>
        </motion.div>
    );
};

const ContestsListPage = () => {
  const { handleOpenLoginModal, searchQuery = '' } = useOutletContext();
  const location = useLocation();
  const [contests, setContests] = useState([]);
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [cRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/public/contests`),
          fetch(`${API_BASE}/public/rankings`)
        ]);
        const contestsJson = await cRes.json();
        const ranksJson = await rRes.json();
        if (cancelled) return;
        if (contestsJson.success) setContests(contestsJson.data || []);
        if (ranksJson.success) setContestants((ranksJson.data || []).map(r => ({
          id: r.id,
          name: r.name,
          imageUrl: r.image_url,
          votes: r.total_votes,
          contestId: r.contest_id,
        })));
      } catch (e) {
        console.error('Failed to load contests:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const { contestantCounts, featuredContests, featuredParticipants, homepageRankings, totalFilteredContests } = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const match = (s) => (s||'').toString().toLowerCase().includes(q);
    const filteredContests = q ? contests.filter(c => match(c.name) || match(c.description)) : contests;
    const filteredContestants = q ? contestants.filter(c => match(c.name)) : contestants;
    const counts = {};
    filteredContests.forEach(contest => {
      const filtered = filteredContestants.filter(c => c.contestId === contest.id);
        const totalVotes = filtered.reduce((sum, c) => sum + (c.votes || 0), 0);
        counts[contest.id] = { count: filtered.length, totalVotes };
    });

    // Featured contests: cap to 2
    const isAllPage = location.pathname === '/contests';
    const topContests = Array.isArray(filteredContests)
      ? (isAllPage ? filteredContests : filteredContests.slice(0, 2))
      : [];

    // Featured participants: top 3 by votes
    const top3 = [...filteredContestants]
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, 3)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
        contestName: filteredContests.find(c => c.id === p.contestId)?.name || 'Không xác định'
      }));

  // Homepage rankings list: top 25 by votes
  const top25 = [...filteredContestants]
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, 25)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
    contestName: filteredContests.find(c => c.id === p.contestId)?.name || 'Không xác định'
      }));

    return { contestantCounts: counts, featuredContests: topContests, featuredParticipants: top3, homepageRankings: top25, totalFilteredContests: filteredContests.length };
  }, [contests, contestants, searchQuery, location.pathname]);


  if (loading) {
    return (
      <div className="w-full">
        <HeroSection onLoginClick={handleOpenLoginModal} />
        <div className="my-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white title-glow">Danh sách cuộc thi nổi bật</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card/60 border border-white/10 rounded-xl overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between mt-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="my-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white title-glow">Thí sinh nổi bật</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card/60 border border-white/10 rounded-xl p-6 text-center">
                <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                <Skeleton className="h-5 w-1/2 mx-auto" />
                <Skeleton className="h-4 w-1/3 mx-auto mt-2" />
              </div>
            ))}
          </div>
        </div>
        <div className="my-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white title-glow">Bảng xếp hạng bình chọn</h2>
          </div>
          <Card className="bg-card/60 border border-white/10 max-h-[600px] overflow-hidden">
            <CardContent className="p-0">
              <ul className="divide-y divide-white/10" aria-busy>
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Trang Chủ - BVOTE</title>
        <meta name="description" content="Tham gia các cuộc thi bình chọn và ủng hộ thí sinh bạn yêu thích." />
      </Helmet>
      <div className="w-full">
        <HeroSection onLoginClick={handleOpenLoginModal} />

        {featuredContests.length > 0 ? (
          <div className="my-16">
             <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white title-glow">
                Danh sách cuộc thi nổi bật
              </h2>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div />
              {location.pathname !== '/contests' && totalFilteredContests > 2 && (
                <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/contests">Xem tất cả</Link>
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {featuredContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} contestantsCount={contestantCounts[contest.id] || { count: 0, totalVotes: 0 }} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="my-16">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-white">Không tìm thấy cuộc thi phù hợp</h2>
              <p className="text-sm text-muted-foreground mt-2">Thử thay đổi từ khóa tìm kiếm.</p>
            </div>
          </div>
        )}

        {featuredParticipants.length > 0 && (
          <div className="my-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white title-glow flex items-center justify-center gap-3">
                <Crown className="h-8 w-8 text-yellow-400" />
                Thí sinh nổi bật
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {featuredParticipants.map((p) => (
                <ParticipantCard key={p.id} participant={p} contestName={p.contestName} />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link to="/rankings">Xem tất cả thí sinh nổi bật</Link>
              </Button>
            </div>
          </div>
        )}

  {homepageRankings.length > 0 && (
          <div id="rankings" className="my-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white title-glow">Bảng xếp hạng bình chọn</h2>
            </div>
            <Card className="bg-card/60 backdrop-blur-sm border border-white/10 shadow-2xl shadow-primary/10 max-h-[600px] overflow-y-auto">
              <CardContent className="p-0">
                <ul className="divide-y divide-white/10">
                  <AnimatePresence mode="popLayout">
                    {homepageRankings.map((p) => (
                      <motion.li
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-4 p-4"
                      >
                        <div className="w-8 text-center font-bold text-white/80">{p.rank}</div>
                        <img loading="lazy" src={p.imageUrl || 'https://images.unsplash.com/photo-1691437155211-6986ef08cf27'} alt={p.name} className="h-10 w-10 rounded-full object-cover border border-white/10" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.contestName}</div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400 font-bold">
                          <Star className="h-4 w-4" />
                          <span>{(p.votes || 0).toLocaleString()}</span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </>
  );
};

export default ContestsListPage;