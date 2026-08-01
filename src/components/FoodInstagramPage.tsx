import {
  Bookmark,
  ChefHat,
  ExternalLink,
  Eye,
  Heart,
  Instagram,
  MessageCircle,
  Send,
  Share2,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { compactCount } from '../utils/format';

type InstagramFoodPost = {
  id: string;
  author: string;
  avatar: string;
  title: string;
  caption: string;
  dish: string;
  priceLabel: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  instagramUrl: string;
  location: string;
  likes: number;
  comments: string[];
  views: number;
};

const instagramPosts: InstagramFoodPost[] = [
  {
    id: 'tacos-birria',
    author: '@vitos.tacos',
    avatar: '/brand/foodreel-logo.png',
    title: 'Tacos de birria',
    caption: 'Tortilla dorada, consome intenso y queso fundido al centro.',
    dish: 'Birria crunch',
    priceLabel: '$28.900',
    mediaUrl: '/media/VitosTacos_pindown.io_1784239258.mp4',
    mediaType: 'video',
    instagramUrl: 'https://www.instagram.com/',
    location: 'FoodReel Demo',
    likes: 1268,
    comments: ['La salsa se ve brutal', 'Ese queso pide mesa ya'],
    views: 18400
  },
  {
    id: 'pizza-horno',
    author: '@aromatapizzaria',
    avatar: '/brand/foodreel-logo.png',
    title: 'Pizza al horno',
    caption: 'Masa aireada, borde crocante y pepperoni bien dorado.',
    dish: 'Pizza fuego',
    priceLabel: '$34.500',
    mediaUrl: '/media/aromatapizzaria_pindown.io_1784239416.mp4',
    mediaType: 'video',
    instagramUrl: 'https://www.instagram.com/',
    location: 'FoodReel Demo',
    likes: 2194,
    comments: ['Necesito probar esa masa', 'El borde quedo perfecto'],
    views: 31200
  },
  {
    id: 'burger-smash',
    author: '@bbqlads',
    avatar: '/brand/foodreel-logo.png',
    title: 'Smash burger',
    caption: 'Doble carne sellada, cheddar y papas crocantes.',
    dish: 'Smash doble',
    priceLabel: '$31.900',
    mediaUrl: '/media/bbqlads_pindown.io_1784234850.mp4',
    mediaType: 'video',
    instagramUrl: 'https://www.instagram.com/',
    location: 'FoodReel Demo',
    likes: 1783,
    comments: ['La costra de la carne esta tremenda', 'Con extra cheddar'],
    views: 26700
  },
  {
    id: 'pollo-crispy',
    author: '@onestop44',
    avatar: '/brand/foodreel-logo.png',
    title: 'Pollo crispy',
    caption: 'Crujiente por fuera, jugoso por dentro y banado en salsa de la casa.',
    dish: 'Crispy honey',
    priceLabel: '$29.900',
    mediaUrl: '/media/onestop44_pindown.io_1784238412.mp4',
    mediaType: 'video',
    instagramUrl: 'https://www.instagram.com/',
    location: 'FoodReel Demo',
    likes: 956,
    comments: ['Esa textura esta perfecta', 'Lo pido con papas'],
    views: 14300
  }
];

type PostState = {
  liked: boolean;
  saved: boolean;
  likes: number;
  comments: string[];
};

function createInitialState() {
  return instagramPosts.reduce<Record<string, PostState>>((state, post) => {
    state[post.id] = {
      liked: false,
      saved: false,
      likes: post.likes,
      comments: post.comments
    };
    return state;
  }, {});
}

export function FoodInstagramPage() {
  const [activePostId, setActivePostId] = useState(instagramPosts[0]?.id ?? '');
  const [muted, setMuted] = useState(true);
  const [selectedCommentsPostId, setSelectedCommentsPostId] = useState<string | null>(null);
  const [postState, setPostState] = useState(createInitialState);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const selectedCommentsPost = useMemo(
    () => instagramPosts.find((post) => post.id === selectedCommentsPostId) ?? null,
    [selectedCommentsPostId]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visibleEntry?.target instanceof HTMLElement && visibleEntry.target.dataset.postId) {
          setActivePostId(visibleEntry.target.dataset.postId);
        }
      },
      { root: viewport, threshold: [0.64, 0.82] }
    );

    viewport.querySelectorAll<HTMLElement>('[data-post-id]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([postId, video]) => {
      if (!video) return;
      video.muted = muted;
      if (postId === activePostId) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [activePostId, muted]);

  const toggleLike = (postId: string) => {
    setPostState((current) => {
      const post = current[postId];
      if (!post) return current;
      const liked = !post.liked;
      return {
        ...current,
        [postId]: {
          ...post,
          liked,
          likes: Math.max(0, post.likes + (liked ? 1 : -1))
        }
      };
    });
  };

  const toggleSaved = (postId: string) => {
    setPostState((current) => {
      const post = current[postId];
      if (!post) return current;
      return {
        ...current,
        [postId]: {
          ...post,
          saved: !post.saved
        }
      };
    });
  };

  const addComment = (postId: string, comment: string) => {
    const text = comment.trim();
    if (!text) return;
    setPostState((current) => {
      const post = current[postId];
      if (!post) return current;
      return {
        ...current,
        [postId]: {
          ...post,
          comments: [...post.comments, text]
        }
      };
    });
  };

  const sharePost = (post: InstagramFoodPost) => {
    const url = `${window.location.origin}/foodinstagram#${post.id}`;
    if (navigator.share) {
      void navigator.share({ title: post.title, text: post.caption, url }).catch(() => undefined);
      return;
    }
    void navigator.clipboard?.writeText(url);
  };

  return (
    <main className="foodinstagram-shell min-h-dvh w-full bg-[#08090b] text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-black shadow-[0_0_80px_rgba(0,0,0,0.48)] md:max-h-dvh md:min-h-[860px] md:border-x md:border-white/10">
        <header className="pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between text-white">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-black">
                <Instagram className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black leading-4">FoodInstagram</p>
                <p className="truncate text-[0.66rem] font-semibold text-white/64">foodreel.lat/foodinstagram</p>
              </div>
            </div>
            <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur-xl">
              Demo
            </span>
          </div>
        </header>

        <section className="reel-scroll h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain" ref={viewportRef}>
          {instagramPosts.map((post) => {
            const state = postState[post.id];
            return (
              <article
                className="relative h-dvh snap-start overflow-hidden bg-black"
                data-post-id={post.id}
                id={post.id}
                key={post.id}
              >
                <PostMedia
                  active={activePostId === post.id}
                  muted={muted}
                  post={post}
                  refSetter={(element) => {
                    videoRefs.current[post.id] = element;
                  }}
                />

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.36)_0%,rgba(0,0,0,0.04)_28%,rgba(0,0,0,0.08)_52%,rgba(0,0,0,0.86)_100%)]" />

                <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3">
                  <FoodInstagramAction
                    active={state?.liked}
                    count={state?.likes ?? post.likes}
                    icon={<Heart className={state?.liked ? 'size-6 fill-current' : 'size-6'} />}
                    label="Me gusta"
                    onClick={() => toggleLike(post.id)}
                  />
                  <FoodInstagramAction
                    count={state?.comments.length ?? post.comments.length}
                    icon={<MessageCircle className="size-6" />}
                    label="Comentarios"
                    onClick={() => setSelectedCommentsPostId(post.id)}
                  />
                  <FoodInstagramAction
                    icon={<Share2 className="size-5" />}
                    label="Compartir"
                    onClick={() => sharePost(post)}
                  />
                  <FoodInstagramAction
                    active={state?.saved}
                    icon={<Bookmark className={state?.saved ? 'size-5 fill-current' : 'size-5'} />}
                    label="Guardar"
                    onClick={() => toggleSaved(post.id)}
                  />
                  <button
                    aria-label={muted ? 'Activar sonido' : 'Silenciar video'}
                    className="grid size-11 place-items-center rounded-full border border-white/16 bg-black/36 text-white shadow-2xl backdrop-blur-xl transition hover:border-white/45"
                    onClick={() => setMuted((value) => !value)}
                    type="button"
                  >
                    {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pr-[82px]">
                  <div className="mb-3 flex items-center gap-2">
                    <img
                      alt=""
                      className="size-9 rounded-full border border-white/30 bg-white object-cover"
                      src={post.avatar}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black leading-4">{post.author}</p>
                      <p className="truncate text-[0.72rem] font-semibold text-white/68">{post.location}</p>
                    </div>
                    <a
                      aria-label="Abrir publicacion en Instagram"
                      className="ml-auto grid size-9 shrink-0 place-items-center rounded-full border border-white/18 bg-white/10 backdrop-blur-xl transition hover:border-white/45"
                      href={post.instagramUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </div>

                  <div className="inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-white/16 bg-black/28 px-3 text-[0.76rem] font-bold text-white backdrop-blur-xl">
                    <ChefHat className="size-4 shrink-0 text-[#ff4b2e]" />
                    <span className="truncate">{post.dish}</span>
                    <span className="shrink-0 text-white/58">{post.priceLabel}</span>
                  </div>

                  <h1 className="mt-3 max-w-[19rem] text-2xl font-black leading-7 tracking-normal text-white drop-shadow-2xl">
                    {post.title}
                  </h1>
                  <p className="mt-2 max-w-[20rem] text-sm font-semibold leading-5 text-white/84">
                    {post.caption}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[0.76rem] font-bold text-white/72">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="size-4" />
                      {compactCount(post.views)}
                    </span>
                    <span>{compactCount(state?.likes ?? post.likes)} likes</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {selectedCommentsPost ? (
        <InstagramCommentsSheet
          comments={postState[selectedCommentsPost.id]?.comments ?? selectedCommentsPost.comments}
          onAddComment={(comment) => addComment(selectedCommentsPost.id, comment)}
          onClose={() => setSelectedCommentsPostId(null)}
          post={selectedCommentsPost}
        />
      ) : null}
    </main>
  );
}

function PostMedia({
  active,
  muted,
  post,
  refSetter
}: {
  active: boolean;
  muted: boolean;
  post: InstagramFoodPost;
  refSetter: (element: HTMLVideoElement | null) => void;
}) {
  if (post.mediaType === 'image') {
    return <img alt="" className="h-full w-full object-cover" src={post.mediaUrl} />;
  }

  return (
    <video
      aria-label={post.title}
      className="h-full w-full object-cover"
      loop
      muted={muted}
      playsInline
      preload={active ? 'auto' : 'metadata'}
      ref={refSetter}
      src={post.mediaUrl}
    />
  );
}

function FoodInstagramAction({
  active,
  count,
  icon,
  label,
  onClick
}: {
  active?: boolean;
  count?: number;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`grid place-items-center gap-1 text-white transition ${active ? 'text-[#ff4b2e]' : 'hover:text-white/82'}`}
      onClick={onClick}
      type="button"
    >
      <span className="grid size-12 place-items-center rounded-full border border-white/16 bg-black/36 shadow-2xl backdrop-blur-xl transition hover:border-white/45">
        {icon}
      </span>
      {typeof count === 'number' ? <span className="text-[0.66rem] font-bold leading-none">{compactCount(count)}</span> : null}
    </button>
  );
}

function InstagramCommentsSheet({
  comments,
  onAddComment,
  onClose,
  post
}: {
  comments: string[];
  onAddComment: (comment: string) => void;
  onClose: () => void;
  post: InstagramFoodPost;
}) {
  const [draft, setDraft] = useState('');

  return (
    <div
      aria-label={`Comentarios de ${post.title}`}
      aria-modal="true"
      className="fixed inset-0 z-[80] flex justify-center bg-black/72 backdrop-blur-sm md:items-end"
      role="dialog"
    >
      <section className="mt-auto flex max-h-[78dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[24px] border-t border-white/12 bg-[#101115] text-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#ff4b2e]">{post.author}</p>
            <h2 className="truncate text-base font-black">{post.title}</h2>
          </div>
          <button
            aria-label="Cerrar comentarios"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-white/30"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="reel-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="grid gap-2">
            {comments.map((comment, index) => (
              <article className="rounded-[16px] border border-white/10 bg-white/[0.06] p-3" key={`${comment}-${index}`}>
                <p className="text-[0.72rem] font-black text-white/58">cliente.foodreel</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-white/88">{comment}</p>
              </article>
            ))}
          </div>
        </div>

        <form
          className="flex shrink-0 items-center gap-2 border-t border-white/10 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
          onSubmit={(event) => {
            event.preventDefault();
            onAddComment(draft);
            setDraft('');
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/42 focus:border-[#ff4b2e]/70"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe un comentario..."
            value={draft}
          />
          <button
            aria-label="Enviar comentario"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[#ff4b2e] text-white shadow-[0_12px_30px_rgba(255,75,46,0.34)] disabled:opacity-50"
            disabled={!draft.trim()}
            type="submit"
          >
            <Send className="size-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
