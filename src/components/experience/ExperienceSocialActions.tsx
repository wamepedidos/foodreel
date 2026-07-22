import { Bookmark, Eye, Heart, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { restaurantConfig } from '../../config/restaurant';
import { likeExperiencePost, shareExperiencePost } from '../../services/experiencePostsService';
import type { ExperiencePost } from '../../types';
import { compactCount } from '../../utils/format';
import { useToast } from '../Toast';

export function ExperienceSocialActions({
  post,
  userId,
  onComments,
  onPostChange
}: {
  post: ExperiencePost;
  userId: string;
  onComments: () => void;
  onPostChange: (post: ExperiencePost) => void;
}) {
  const { showToast } = useToast();
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(false);
  const canInteract = post.status === 'approved';

  const toggleLike = async () => {
    if (!canInteract) {
      showToast('Disponible cuando la publicacion sea aprobada');
      return;
    }
    const nextLiked = !liked;
    const optimisticPost = {
      ...post,
      likesCount: Math.max(0, post.likesCount + (nextLiked ? 1 : -1))
    };
    setLiked(nextLiked);
    onPostChange(optimisticPost);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 420);
    try {
      const updated = await likeExperiencePost(post.id, userId, nextLiked);
      if (updated) {
        onPostChange(updated);
      }
    } catch {
      setLiked(!nextLiked);
      onPostChange(post);
      showToast('No se pudo actualizar el me gusta');
    }
  };

  const sharePost = async () => {
    const text = post.dishName
      ? `Estoy disfrutando una ${post.dishName} en ${restaurantConfig.restaurantName}. Mira mi experiencia.`
      : `Estoy disfrutando mi visita a ${restaurantConfig.restaurantName}. Mira mi experiencia.`;
    const url = `${window.location.origin}/experience/${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: restaurantConfig.restaurantName, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Enlace copiado');
      }
      const updated = await shareExperiencePost(post.id);
      if (updated) {
        onPostChange(updated);
      }
    } catch {
      showToast('No se pudo compartir ahora');
    }
  };

  return (
    <div className="grid grid-cols-5 items-center gap-1 border-t border-white/10 px-2 py-3 text-xs font-bold text-muted">
      <button className={`relative grid place-items-center gap-1 rounded-xl py-1 ${liked ? 'text-red-400' : ''}`} onClick={toggleLike} type="button">
        <Heart className="size-5" fill={liked ? 'currentColor' : 'none'} />
        <span>{compactCount(post.likesCount)}</span>
        {burst ? <Heart className="pointer-events-none absolute top-0 size-7 animate-like-burst text-red-500" fill="currentColor" /> : null}
      </button>
      <span className="grid place-items-center gap-1 py-1">
        <Eye className="size-5" />
        <span>{compactCount(post.viewsCount)}</span>
      </span>
      <button className="grid place-items-center gap-1 rounded-xl py-1" onClick={onComments} type="button">
        <MessageCircle className="size-5" />
        <span>{compactCount(post.commentsCount)}</span>
      </button>
      <button className="grid place-items-center gap-1 rounded-xl py-1" onClick={sharePost} type="button">
        <Send className="size-5" />
        <span>{compactCount(post.sharesCount)}</span>
      </button>
      <button className="grid place-items-center gap-1 rounded-xl py-1" onClick={() => showToast('Guardado disponible proximamente')} type="button">
        <Bookmark className="size-5" />
        <span>Guardar</span>
      </button>
    </div>
  );
}
