import { Bookmark, ExternalLink, Heart, Instagram, MessageCircle, Share2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void;
      };
    };
  }
}

type InstagramFoodPost = {
  id: string;
  label: string;
  instagramUrl: string;
};

const instagramPosts: InstagramFoodPost[] = [
  {
    id: 'DZLry4zNdTK',
    label: 'Plato 1',
    instagramUrl: 'https://www.instagram.com/p/DZLry4zNdTK/?hl=es-la'
  },
  {
    id: 'DYfJ2qHhPyn',
    label: 'Plato 2',
    instagramUrl: 'https://www.instagram.com/p/DYfJ2qHhPyn/?hl=es-la'
  },
  {
    id: 'DYTSIo0M2TE',
    label: 'Plato 3',
    instagramUrl: 'https://www.instagram.com/p/DYTSIo0M2TE/?hl=es-la'
  },
  {
    id: 'DYKclKHhOyA',
    label: 'Plato 4',
    instagramUrl: 'https://www.instagram.com/p/DYKclKHhOyA/?hl=es-la'
  },
  {
    id: 'DX-pZfzsRth',
    label: 'Plato 5',
    instagramUrl: 'https://www.instagram.com/p/DX-pZfzsRth/?hl=es-la'
  }
];

const instagramEmbedScriptId = 'instagram-embed-script';

export function FoodInstagramPage() {
  const [activePostId, setActivePostId] = useState(instagramPosts[0]?.id ?? '');
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const processEmbeds = () => window.instgrm?.Embeds?.process();
    const existingScript = document.getElementById(instagramEmbedScriptId) as HTMLScriptElement | null;

    if (existingScript) {
      processEmbeds();
      return undefined;
    }

    const script = document.createElement('script');
    script.id = instagramEmbedScriptId;
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    script.onload = processEmbeds;
    document.body.appendChild(script);

    return undefined;
  }, []);

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
      { root: viewport, threshold: [0.58, 0.74] }
    );

    viewport.querySelectorAll<HTMLElement>('[data-post-id]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const toggleSaved = (postId: string) => {
    setSavedPostIds((current) => (current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]));
  };

  const sharePost = (post: InstagramFoodPost) => {
    const url = `${window.location.origin}/foodinstagram#${post.id}`;
    if (navigator.share) {
      void navigator.share({ title: `FoodInstagram ${post.label}`, text: post.instagramUrl, url }).catch(() => undefined);
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
          {instagramPosts.map((post, index) => {
            const saved = savedPostIds.includes(post.id);
            const active = activePostId === post.id;

            return (
              <article
                className="relative grid h-dvh snap-start place-items-center overflow-hidden bg-[#08090b] px-3 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(66px+env(safe-area-inset-top))]"
                data-post-id={post.id}
                id={post.id}
                key={post.id}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,75,46,0.18),transparent_19rem),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_35%,rgba(0,0,0,0.72))]" />

                <div className="relative z-10 flex h-full w-full items-center justify-center pr-[66px]">
                  <div className="foodinstagram-embed-frame reel-scroll max-h-full w-full max-w-[370px] overflow-y-auto rounded-[8px] border border-white/10 bg-white text-black shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                    <InstagramEmbed post={post} />
                  </div>
                </div>

                <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3">
                  <FoodInstagramLinkAction
                    href={post.instagramUrl}
                    icon={<Heart className="size-6" />}
                    label="Me gusta en Instagram"
                  />
                  <FoodInstagramLinkAction
                    href={post.instagramUrl}
                    icon={<MessageCircle className="size-6" />}
                    label="Comentar en Instagram"
                  />
                  <FoodInstagramButtonAction
                    icon={<Share2 className="size-5" />}
                    label="Compartir"
                    onClick={() => sharePost(post)}
                  />
                  <FoodInstagramButtonAction
                    active={saved}
                    icon={<Bookmark className={saved ? 'size-5 fill-current' : 'size-5'} />}
                    label="Guardar en FoodReel"
                    onClick={() => toggleSaved(post.id)}
                  />
                  <FoodInstagramLinkAction
                    href={post.instagramUrl}
                    icon={<ExternalLink className="size-5" />}
                    label="Abrir publicacion"
                  />
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(22px+env(safe-area-inset-bottom))] pr-[86px]">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#ff4b2e]">
                    {active ? 'Reel activo' : `Reel ${index + 1}`}
                  </p>
                  <h1 className="mt-1 text-xl font-black leading-6 tracking-normal text-white drop-shadow-2xl">
                    {post.label}
                  </h1>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function InstagramEmbed({ post }: { post: InstagramFoodPost }) {
  return (
    <blockquote
      className="instagram-media"
      data-instgrm-captioned
      data-instgrm-permalink={post.instagramUrl}
      data-instgrm-version="14"
      style={{
        background: '#fff',
        border: 0,
        margin: 0,
        maxWidth: '100%',
        minWidth: 0,
        width: '100%'
      }}
    >
      <a href={post.instagramUrl} rel="noreferrer" target="_blank">
        Ver {post.label} en Instagram
      </a>
    </blockquote>
  );
}

function FoodInstagramLinkAction({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      aria-label={label}
      className="grid place-items-center gap-1 text-white transition hover:text-white/82"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="grid size-12 place-items-center rounded-full border border-white/16 bg-black/36 shadow-2xl backdrop-blur-xl transition hover:border-white/45">
        {icon}
      </span>
      <span className="text-[0.62rem] font-bold leading-none">IG</span>
    </a>
  );
}

function FoodInstagramButtonAction({
  active,
  icon,
  label,
  onClick
}: {
  active?: boolean;
  icon: ReactNode;
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
    </button>
  );
}
