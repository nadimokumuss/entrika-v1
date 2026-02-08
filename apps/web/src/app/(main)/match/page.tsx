"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Heart, X, RefreshCw } from "lucide-react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";

interface DatingCard {
  id: string;
  user_id: string;
  bio: string;
  photos: string[];
  interests: string[];
  city: string;
  age: number | null;
  relationship_status: string | null;
  profile: { username: string; avatar_url: string; reputation_score: number };
}

export default function MatchPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<DatingCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    if (!user) return;
    setLoading(true);

    // Get swiped user IDs
    const { data: swipes } = await supabase
      .from("swipes")
      .select("target_id")
      .eq("swiper_id", user.id);
    const swipedIds = (swipes || []).map((s) => s.target_id);

    // Get blocked user IDs
    const { data: blocks } = await supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const blockedIds = (blocks || []).map((b) => b.blocked_id);

    const excludeIds = [...swipedIds, ...blockedIds, user.id];

    let query = supabase
      .from("dating_profiles")
      .select("*, profile:user_id (username, avatar_url, reputation_score)")
      .eq("is_active", true);

    if (excludeIds.length > 0) {
      query = query.not("user_id", "in", `(${excludeIds.join(",")})`);
    }

    const { data } = await query.limit(20);
    setCards((data as unknown as DatingCard[]) || []);
    setCurrentIndex(0);
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  const handleSwipe = async (direction: "like" | "dislike") => {
    if (!user || currentIndex >= cards.length) return;
    const target = cards[currentIndex];

    await supabase.from("swipes").insert({
      swiper_id: user.id,
      target_id: target.user_id,
      direction,
    });

    setCurrentIndex((prev) => prev + 1);
  };

  const currentCard = cards[currentIndex];
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 100;
    if (info.offset.x > threshold || info.velocity.x > 500) {
      handleSwipe("like");
    } else if (info.offset.x < -threshold || info.velocity.x < -500) {
      handleSwipe("dislike");
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text)]">Eslesmeler</h1>
        <button onClick={fetchCards} className="p-2 rounded-lg hover:bg-[var(--card)]">
          <RefreshCw size={18} className="text-[var(--text-muted)]" />
        </button>
      </div>

      <div className="flex flex-col items-center px-4 py-8">
        {loading ? (
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        ) : !currentCard ? (
          <div className="text-center text-[var(--text-muted)] py-12">
            <Heart size={48} className="mx-auto mb-3 opacity-30" />
            <p>Simdilik gosterecek profil kalmadi.</p>
            <button onClick={fetchCards} className="mt-4 px-4 py-2 rounded-xl text-sm text-white" style={{ background: "var(--primary)" }}>
              Yenile
            </button>
          </div>
        ) : (
          <>
            {/* Draggable Card */}
            <div className="relative w-full max-w-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCard.user_id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.9}
                  onDragEnd={handleDragEnd}
                  style={{ x, rotate }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border-light)] cursor-grab active:cursor-grabbing select-none"
                >
                  {/* Like/Nope overlay labels */}
                  <motion.div
                    style={{ opacity: likeOpacity }}
                    className="absolute top-6 left-6 z-10 px-4 py-2 rounded-lg border-3 border-[var(--success)] text-[var(--success)] font-black text-2xl -rotate-12"
                  >
                    LIKE
                  </motion.div>
                  <motion.div
                    style={{ opacity: nopeOpacity }}
                    className="absolute top-6 right-6 z-10 px-4 py-2 rounded-lg border-3 border-[var(--danger)] text-[var(--danger)] font-black text-2xl rotate-12"
                  >
                    NOPE
                  </motion.div>

                  <img
                    src={
                      currentCard.photos?.[0] ||
                      currentCard.profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/lorelei/png?seed=${currentCard.user_id}`
                    }
                    alt=""
                    className="w-full h-80 object-cover pointer-events-none"
                    draggable={false}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[var(--text)]">
                        {currentCard.profile?.username}
                        {currentCard.age && <span className="font-normal text-[var(--text-muted)]">, {currentCard.age}</span>}
                      </h3>
                      <span className="text-sm text-[var(--primary)] font-medium">
                        {currentCard.profile?.reputation_score?.toFixed(1)}
                      </span>
                    </div>
                    {currentCard.city && (
                      <p className="text-sm text-[var(--text-muted)]">{currentCard.city}</p>
                    )}
                    {currentCard.bio && (
                      <p className="mt-2 text-sm text-[var(--text)]">{currentCard.bio}</p>
                    )}
                    {currentCard.interests?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {currentCard.interests.map((i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)]">
                            {i}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-6 mt-6">
              <button
                onClick={() => handleSwipe("dislike")}
                className="w-14 h-14 rounded-full border-2 border-[var(--danger)] flex items-center justify-center hover:bg-[var(--danger)]/10 transition-colors"
              >
                <X size={28} className="text-[var(--danger)]" />
              </button>
              <button
                onClick={() => handleSwipe("like")}
                className="w-14 h-14 rounded-full border-2 border-[var(--success)] flex items-center justify-center hover:bg-[var(--success)]/10 transition-colors"
              >
                <Heart size={28} className="text-[var(--success)]" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
