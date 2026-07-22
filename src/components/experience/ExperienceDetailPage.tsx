import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { restaurantConfig } from '../../config/restaurant';
import { getExperiencePostById, registerExperienceView, subscribeToExperiencePost } from '../../services/experiencePostsService';
import type { ExperiencePost } from '../../types';
import { getOrCreateCustomerSessionId } from '../../utils/session';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { ExperienceCommentsSheet } from './ExperienceCommentsSheet';
import { ExperienceErrorState } from './ExperienceErrorState';
import { ExperiencePostCard } from './ExperiencePostCard';

export function ExperienceDetailPage() {
  const { experienceId = '' } = useParams();
  const navigate = useNavigate();
  const userId = useMemo(() => getOrCreateCustomerSessionId(), []);
  const [post, setPost] = useState<ExperiencePost | null>(null);
  const [error, setError] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const viewRegisteredRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    void getExperiencePostById(experienceId, userId)
      .then((nextPost) => {
        if (mounted) {
          setPost(nextPost);
        }
      })
      .catch((caughtError) => {
        if (mounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'No pudimos cargar la publicacion.');
        }
      });

    const unsubscribe = subscribeToExperiencePost(experienceId, userId, (nextPost) => {
      if (mounted) {
        setPost(nextPost);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [experienceId, userId]);

  useEffect(() => {
    if (!post || post.status !== 'approved' || viewRegisteredRef.current || !cardRef.current) {
      return undefined;
    }

    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.75) {
          timer = window.setTimeout(() => {
            if (!viewRegisteredRef.current) {
              viewRegisteredRef.current = true;
              void registerExperienceView(post.id, userId).then((updated) => {
                if (updated) {
                  setPost(updated);
                }
              });
            }
          }, 2000);
        }
      },
      { threshold: [0, 0.75, 1] }
    );

    observer.observe(cardRef.current);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [post, userId]);

  return (
    <div className="h-full overflow-y-auto px-4 pb-[108px] pt-4">
      <div className="mx-auto max-w-[680px]">
        <div className="mb-4 flex items-center gap-3">
          <button aria-label="Volver" className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-surface text-white" onClick={() => navigate('/comunidad')} type="button">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Mesa {restaurantConfig.tableNumber}</p>
            <h1 className="text-xl font-black text-white">Experiencia</h1>
          </div>
        </div>

        {error ? <ExperienceErrorState message={error} /> : null}
        {!post && !error ? <LoadingSkeleton /> : null}
        {post ? (
          <div ref={cardRef}>
            <ExperiencePostCard onComments={() => setCommentsOpen(true)} onPostChange={setPost} post={post} userId={userId} />
            <ExperienceCommentsSheet onClose={() => setCommentsOpen(false)} open={commentsOpen} post={post} userId={userId} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
