import {
  Bookmark,
  ChefHat,
  CirclePlus,
  Eye,
  Flame,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  UsersRound,
  Utensils
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type MomentBadge = {
  icon: LucideIcon;
  label: string;
  tone: 'accent' | 'amber';
};

type MomentPost = {
  author: string;
  avatar: string;
  verified?: boolean;
  time: string;
  title: string;
  subtitle: string;
  image: string;
  carousel: string;
  caption: string;
  badges: MomentBadge[];
  likes: string;
  comments: string;
  views: string;
};

const filters = ['Todos', 'Populares', 'Recientes', 'Siguiendo'];

const posts: MomentPost[] = [
  {
    author: 'SofiFoodie',
    avatar: '/mockups/momentos-avatar-sofi.jpg',
    verified: true,
    time: 'Hace 2 horas',
    title: 'Submarino Gigante',
    subtitle: 'Especialidad de la casa',
    image: '/mockups/momentos-submarino.jpg',
    carousel: '1/3',
    caption: 'Simplemente espectacular! El mejor submarino que he probado. La carne es jugosa y el pan queda perfecto.',
    badges: [
      { icon: Flame, label: 'Picante alto', tone: 'accent' },
      { icon: UsersRound, label: 'Para 4 personas', tone: 'amber' }
    ],
    likes: '156',
    comments: '23',
    views: '1.2K'
  },
  {
    author: 'CarlosViajero',
    avatar: '/mockups/momentos-avatar-carlos.jpg',
    time: 'Hace 5 horas',
    title: 'Volcan de Chocolate',
    subtitle: 'Postre que no te puedes perder',
    image: '/mockups/momentos-volcan.jpg',
    carousel: '1/2',
    caption: 'Centro caliente, helado cremoso y una textura brutal. Es el cierre perfecto para compartir.',
    badges: [
      { icon: ChefHat, label: 'Recomendado', tone: 'accent' },
      { icon: UsersRound, label: 'Para 2 personas', tone: 'amber' }
    ],
    likes: '98',
    comments: '12',
    views: '890'
  }
];

function MomentosHeader() {
  const navigate = useNavigate();

  return (
    <header className="px-4 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.35rem] font-extrabold leading-tight tracking-normal text-white">Momentos</h1>
          <p className="mt-1 text-[0.68rem] font-medium leading-5 text-white/58">
            Descubre y comparte los mejores platos
          </p>
        </div>
        <button
          className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[16px] bg-accent px-3 text-[0.72rem] font-bold text-white shadow-[0_14px_36px_rgba(252,45,4,0.30)] transition hover:brightness-110"
          onClick={() => navigate('/experience/new')}
          type="button"
        >
          <CirclePlus className="size-4 shrink-0" strokeWidth={2} />
          <span className="truncate">Crea tu momento</span>
        </button>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter, index) => (
          <button
            aria-pressed={index === 0}
            className={`h-8 shrink-0 rounded-full border px-4 text-xs font-normal transition ${
              index === 0
                ? 'border-white bg-white text-neutral-950'
                : 'border-white/10 bg-black/20 text-white/70 hover:border-accent/50 hover:text-white'
            }`}
            key={filter}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>
    </header>
  );
}

function MomentBadgePill({ badge }: { badge: MomentBadge }) {
  const Icon = badge.icon;
  const styles = {
    accent: 'border-accent/65 bg-black/[0.24] text-accent',
    amber: 'border-yellow-300/55 bg-black/[0.24] text-yellow-200'
  } satisfies Record<MomentBadge['tone'], string>;

  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.72rem] font-semibold backdrop-blur-md ${styles[badge.tone]}`}>
      <Icon className="size-3.5" />
      {badge.label}
    </span>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: LucideIcon;
  label?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-full px-1.5 text-xs text-white/70 transition hover:text-white"
      onClick={onClick}
      type="button"
    >
      <Icon className={`size-3.5 shrink-0 ${active ? 'text-accent' : 'text-white/70'}`} fill={active ? 'currentColor' : 'none'} />
      {label ? <span className="truncate leading-none">{label}</span> : null}
    </button>
  );
}

function MomentPostCard({ post }: { post: MomentPost }) {
  const navigate = useNavigate();

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/10 bg-card shadow-2xl shadow-black/25">
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
        <img alt="" className="size-9 shrink-0 rounded-full object-cover" src={post.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-black leading-4 text-white">{post.author}</p>
            {post.verified ? <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-accent text-[8px] font-black text-white">✓</span> : null}
          </div>
          <p className="truncate text-[0.68rem] font-medium leading-4 text-muted">{post.time}</p>
        </div>
        <button aria-label="Mas opciones" className="grid size-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white" type="button">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="px-2">
        <div className="relative overflow-hidden rounded-[14px] bg-black">
          <img alt="" className="aspect-[16/8.2] w-full object-cover" src={post.image} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/26 to-transparent p-3">
            <h2 className="max-w-[17rem] truncate text-[1.05rem] font-extrabold leading-tight tracking-normal text-white">
              {post.title}
            </h2>
            <p className="mt-0.5 max-w-[17rem] truncate text-[0.72rem] font-semibold leading-4 text-white/[0.92]">
              {post.subtitle}
            </p>
          </div>
          <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-1 text-[0.68rem] font-semibold text-white backdrop-blur-md">
            {post.carousel}
          </span>
        </div>
      </div>

      <div className="px-3 pb-3 pt-2">
        <p className="line-clamp-2 text-[0.78rem] font-medium leading-5 text-white/72">
          {post.caption}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
            {post.badges.map((badge) => (
              <MomentBadgePill badge={badge} key={badge.label} />
            ))}
          </div>
          <button
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-accent/65 bg-accent/10 px-3 text-xs font-semibold text-accent transition hover:bg-accent/15"
            onClick={() => navigate('/menu')}
            type="button"
          >
            <Utensils className="size-3.5" />
            Ver platos
          </button>
        </div>

        <div className="mt-2 flex min-w-0 items-center justify-between gap-1">
          <ActionButton icon={Heart} label={post.likes} />
          <ActionButton icon={MessageCircle} label={post.comments} />
          <ActionButton icon={Eye} label={post.views} />
          <ActionButton icon={Share2} label="Compartir" />
          <ActionButton icon={Bookmark} />
        </div>
      </div>
    </article>
  );
}

export function MomentosMockupPage() {
  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-base pb-[92px]">
      <MomentosHeader />
      <main className="space-y-3 px-4 pb-6 pt-2">
        {posts.map((post) => (
          <MomentPostCard key={post.title} post={post} />
        ))}
      </main>
    </div>
  );
}
