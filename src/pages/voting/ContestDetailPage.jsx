import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Vote, Award, Calendar, Info, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useEventBus } from '@/contexts/AppContext';
import { Helmet } from 'react-helmet-async';
import { joinContestRoom, onVoteUpdate, getSocket } from '@/lib/services/socket';

import { API_ENDPOINTS } from '@/lib/services/apiConfig';
import { attachDefaultSections } from '@/lib/templates/contestantSections';
const API_CONTESTS = API_ENDPOINTS.contests;
const API_CONTESTANTS = API_ENDPOINTS.contestants;
const API_VOTE = API_ENDPOINTS.vote;

const ContestDetailPage = () => {
  const { contestId } = useParams();
  const { handleOpenLoginModal } = useOutletContext();
  const { toast } = useToast();
  const { isUserAuthenticated, user } = useUserAuth();
  const EventBus = useEventBus();

  const [contest, setContest] = useState(null);
  const [contestants, setContestants] = useState([]);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);
  const MAX_VOTING_LIST = 15; // Giới hạn tối đa sau khi đăng nhập

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Load contests and select current
        const resContest = await fetch(API_CONTESTS, { credentials: 'include' });
        const dataContest = await resContest.json();
        if (!dataContest.success) throw new Error('contest fetch failed');
        const current = (dataContest.data || []).find(c => String(c.id) === String(contestId));
        if (!current) throw new Error('not_found');
        setContest(current);
        EventBus.dispatch('view_contest', { contest: current, user });

        // Load contestants for contest
        const resContestants = await fetch(`${API_CONTESTANTS}?contest_id=${encodeURIComponent(contestId)}`, { credentials: 'include' });
        const dataContestants = await resContestants.json();
        if (!dataContestants.success) throw new Error('contestants fetch failed');
        // Chuẩn hóa khóa dữ liệu và lọc theo contestId (backend trả snake_case)
        const rawList = Array.isArray(dataContestants.data) ? dataContestants.data : [];
        const normalized = rawList
          .filter((row) => !row.contest_id || String(row.contest_id) === String(contestId))
          .map((row) => ({
            ...row,
            imageUrl: row.imageUrl || row.image_url || '',
            contestId: row.contestId ?? row.contest_id,
          }));
        // Gắn danh mục + khung hình mặc định
        setContestants(attachDefaultSections(normalized));
      } catch (error) {
        if (error.message === 'not_found') {
          setContest(null);
        } else {
          console.error('Failed to load contest detail', error);
          toast({
            title: 'Lỗi tải dữ liệu',
            description: 'Không thể tải thông tin cuộc thi. Vui lòng thử lại.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId, user]);

  // Realtime updates: join contest room and apply vote deltas
  useEffect(() => {
    if (!contestId) return;
    joinContestRoom(contestId);
    getSocket();
    const off = onVoteUpdate(({ contestantId, totalVotes, contestId: cid }) => {
      // If payload includes contestId, ignore others
      if (cid && String(cid) !== String(contestId)) return;
      setContestants(prev => prev.map(c => String(c.id) === String(contestantId) ? { ...c, total_votes: totalVotes } : c));
    });
    return () => { if (typeof off === 'function') off(); };
  }, [contestId]);

  // Danh sách hiển thị: nếu đã đăng nhập, luôn giới hạn 15; nếu chưa, có thể "Xem thêm"
  const displayContestants = useMemo(() => {
    const list = Array.isArray(contestants) ? contestants : [];
    if (isUserAuthenticated) return list.slice(0, MAX_VOTING_LIST);
    return list.slice(0, visibleCount);
  }, [contestants, isUserAuthenticated, visibleCount]);

  const handleVote = async (contestantId, contestantName) => {
    if (!isUserAuthenticated) {
      toast({
        title: 'Yêu cầu đăng nhập',
        description: 'Bạn cần đăng nhập để có thể bình chọn.',
        variant: 'destructive',
      });
      handleOpenLoginModal();
      return;
    }

    try {
      const res = await fetch(API_VOTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.__CSRF_TOKEN || '' },
        credentials: 'include',
        body: JSON.stringify({ contestant_id: contestantId, csrf_token: window.__CSRF_TOKEN || '' })
      });
      const data = await res.json();
      if (data.success) {
        const newVotes = { ...votes, [contestantId]: (votes[contestantId] || 0) + 1 };
        setVotes(newVotes);
        EventBus.dispatch('user_voted', { user, contestantId, contestantName, contestName: contest.name });
        toast({ title: 'Cảm ơn bạn đã bình chọn!', description: `Bạn đã bình chọn cho ${contestantName}.` });
      } else {
        toast({ title: 'Không thể bình chọn', description: data.message || 'Vui lòng thử lại', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Lỗi kết nối', description: 'Vui lòng thử lại', variant: 'destructive' });
    }
  };

  const totalContestVotes = useMemo(() => {
    return contestants.reduce((sum, c) => {
        const initialVotes = c.votes || 0;
        const newVotes = votes[c.id] || 0;
        // Logic to avoid double counting if initial votes are also in 'votes' state
        // This simple sum assumes `votes` are incremental to initial `c.votes`
        return sum + initialVotes + (votes[c.id] ? newVotes : 0);
    }, 0);
  }, [contestants, votes]);

  const formatDate = (d) => {
    try {
      const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
      if (isNaN(date?.getTime?.())) return null;
      return date.toLocaleDateString('vi-VN');
    } catch { return null; }
  };

  const startDisplay = formatDate(contest?.start_date || contest?.startDate || contest?.begin_date || contest?.beginDate || contest?.time_start || contest?.start);
  const endDisplay = formatDate(contest?.end_date || contest?.endDate || contest?.finish_date || contest?.finishDate || contest?.time_end || contest?.end);


  if (loading) {
    return <div className="text-center text-white">Đang tải cuộc thi...</div>;
  }

  if (!contest) {
    return (
        <div className="text-center text-white">
            <h2 className="text-2xl font-bold">404 - Không tìm thấy cuộc thi</h2>
            <p className="mt-4">Cuộc thi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Button asChild variant="outline" className="mt-6 border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link to="/contests">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Về trang chủ
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{contest.name} - BVOTE</title>
        <meta name="description" content={contest.description} />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
            <Link to="/contests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Link>
          </Button>
        </div>

        <Card className="bg-card/50 border-white/10 text-white backdrop-blur-lg overflow-hidden mb-8">
          <div className="relative h-64 md:h-80">
            <img
              className="absolute inset-0 w-full h-full object-cover"
              alt={`Banner for ${contest.name}`}
              src={contest.bannerUrl || 'https://images.unsplash.com/photo-1511744184484-5e7777d2b106'} />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-white"
              >
                {contest.name}
              </motion.h1>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Bắt đầu: {startDisplay || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <span>{contestants.length} Thí sinh</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Award className="h-5 w-5 text-primary" />
                <span>Tổng phiếu: {totalContestVotes.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
              <Info className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <p className="text-muted-foreground">{contest.description}</p>
            </div>
          </CardContent>
        </Card>

  <h2 className="text-3xl font-bold text-white mb-6 text-center">Danh sách Thí sinh</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
      {displayContestants.map((contestant, index) => (
              <motion.div
                key={contestant.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: Math.min(index, 10) * 0.05 }}
              >
                <Card className="bg-card/50 border-white/10 text-white backdrop-blur-lg overflow-hidden h-full flex flex-col transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-primary/30">
                  <CardHeader className="p-0">
                    <div className="aspect-square">
                      <img
                        className="w-full h-full object-cover"
                        alt={`Image of ${contestant.name}`}
                        src={contestant.imageUrl || 'https://images.unsplash.com/photo-1635521071003-d9a00f967e0b'} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-xl mb-2">{contestant.name}</CardTitle>
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Vote className="h-5 w-5" />
                      <span>{((votes[contestant.id] || 0) + (contestant.total_votes || 0)).toLocaleString()} Phiếu</span>
                    </div>
                    {Array.isArray(contestant.categories) && contestant.categories.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {contestant.categories.map((cat) => {
                          const sec = contestant.sections?.[cat.id];
                          return (
                            <div key={cat.id} className="border-t border-white/10 pt-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase">{cat.title}</h4>
                              {(() => {
                                if (!sec) {
                                  return <p className="text-xs text-muted-foreground/70 italic">Đang cập nhật</p>;
                                }
                                switch (cat.id) {
                                  case 'about':
                                    return (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {sec.content || 'Đang cập nhật'}
                                      </p>
                                    );
                                  case 'achievements':
                                    return Array.isArray(sec.items) && sec.items.length > 0 ? (
                                      <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 space-y-0.5">
                                        {sec.items.slice(0, 3).map((it, i) => (
                                          <li key={i}>{it}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-xs text-muted-foreground/70 italic">Đang cập nhật</p>
                                    );
                                  case 'gallery':
                                    return Array.isArray(sec.images) && sec.images.length > 0 ? (
                                      <div className="flex gap-2 mt-1">
                                        {sec.images.slice(0, 3).map((img, i) => (
                                          <img key={i} src={img} alt={`gallery-${i}`} className="h-10 w-10 rounded-md object-cover border border-white/10" />
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground/70 italic">Đang cập nhật</p>
                                    );
                                  case 'video':
                                    return Array.isArray(sec.embeds) && sec.embeds.length > 0 ? (
                                      <p className="text-xs text-muted-foreground mt-1">{sec.embeds.length} video</p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground/70 italic">Đang cập nhật</p>
                                    );
                                  case 'contact':
                                    return Array.isArray(sec.links) && sec.links.length > 0 ? (
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {sec.links.slice(0, 3).map((lnk, i) => (
                                          <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                                            {lnk.type || 'Liên hệ'}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground/70 italic">Đang cập nhật</p>
                                    );
                                  default:
                                    return <p className="text-xs text-muted-foreground/70 italic">Đang cập nhật</p>;
                                }
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4">
                    <Button
                      onClick={() => handleVote(contestant.id, contestant.name)}
                      className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-bold rounded-full shadow-lg shadow-primary/30"
                    >
                      Bình chọn
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

  {!isUserAuthenticated && contestants.length > visibleCount && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setVisibleCount(c => c + 12)}
              className="px-6 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-semibold rounded-full"
            >
              Xem thêm
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ContestDetailPage;