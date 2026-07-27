import {
  BadgeCheck,
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
import { useState } from 'react';
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
  fallbackImage: string;
  carousel: string;
  caption: string;
  badges: MomentBadge[];
  likes: string;
  comments: string;
  views: string;
};

const filters = ['Todos', 'Populares', 'Recientes', 'Siguiendo'];

function publicAsset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

const posts: MomentPost[] = [
  {
    author: 'SofiFoodie',
    avatar: publicAsset('momentos/avatar-sofi.jpg'),
    verified: true,
    time: 'Hace 2 horas',
    title: 'Burger entre amigos',
    subtitle: 'Momento en mesa',
    image: publicAsset('momentos/post-personas-burger.jpg'),
    fallbackImage: publicAsset('momentos/post-burger.png'),
    carousel: '1/3',
    caption: 'Llegaron las burgers y la mesa se puso feliz. Papas, bebidas frias y buena compania.',
    badges: [
      { icon: ChefHat, label: 'Recomendado', tone: 'accent' },
      { icon: UsersRound, label: 'Mesa de 2', tone: 'amber' }
    ],
    likes: '156',
    comments: '23',
    views: '1.2K'
  },
  {
    author: 'CarlosViajero',
    avatar: publicAsset('momentos/avatar-carlos.jpg'),
    time: 'Hace 5 horas',
    title: 'Submarino Gigante',
    subtitle: 'Especialidad de la casa',
    image: publicAsset('momentos/post-submarino.jpg'),
    fallbackImage: publicAsset('momentos/post-tacos.png'),
    carousel: '1/2',
    caption: 'Simplemente espectacular! El mejor submarino que he probado. La carne es jugosa y el pan queda perfecto.',
    badges: [
      { icon: Flame, label: 'Picante alto', tone: 'accent' },
      { icon: UsersRound, label: 'Para 4 personas', tone: 'amber' }
    ],
    likes: '98',
    comments: '12',
    views: '890'
  },
  {
    author: 'MesaFoodie',
    avatar: publicAsset('momentos/avatar-default.jpg'),
    verified: true,
    time: 'Hace 7 horas',
    title: 'Mesa compartida',
    subtitle: 'Amigos probando favoritos',
    image: publicAsset('momentos/post-personas-amigos.jpg'),
    fallbackImage: publicAsset('momentos/post-tacos.png'),
    carousel: '1/4',
    caption: 'Pedimos varios platos al centro y fue la mejor decision. Cada quien encontro su favorito.',
    badges: [
      { icon: ChefHat, label: 'Para compartir', tone: 'accent' },
      { icon: UsersRound, label: 'Mesa de 3', tone: 'amber' }
    ],
    likes: '211',
    comments: '34',
    views: '2.4K'
  },
  {
    author: 'AnaComeBien',
    avatar: publicAsset('momentos/avatar-sofi.jpg'),
    time: 'Ayer',
    title: 'Volcan de Chocolate',
    subtitle: 'Postre que no te puedes perder',
    image: publicAsset('momentos/post-volcan.jpg'),
    fallbackImage: publicAsset('momentos/post-crema.png'),
    carousel: '2/3',
    caption: 'Centro caliente, helado cremoso y una textura brutal. Es el cierre perfecto para compartir.',
    badges: [
      { icon: ChefHat, label: 'Recomendado', tone: 'accent' },
      { icon: UsersRound, label: 'Para 2 personas', tone: 'amber' }
    ],
    likes: '143',
    comments: '18',
    views: '1.1K'
  },
  {
    author: 'RutaBurger',
    avatar: publicAsset('momentos/avatar-carlos.jpg'),
    verified: true,
    time: 'Ayer',
    title: 'Foto antes del primer bocado',
    subtitle: 'El ritual FoodReel',
    image: publicAsset('momentos/post-personas-foto.jpg'),
    fallbackImage: publicAsset('momentos/post-burger.png'),
    carousel: '3/5',
    caption: 'Ese momento antes de probarla: foto rapida, papas calientes y todos esperando el primer mordisco.',
    badges: [
      { icon: ChefHat, label: 'Momento social', tone: 'accent' },
      { icon: UsersRound, label: 'Mesa de amigos', tone: 'amber' }
    ],
    likes: '302',
    comments: '41',
    views: '3.8K'
  },
  {
    author: 'DulceFinal',
    avatar: publicAsset('momentos/avatar-default.jpg'),
    time: 'Hace 2 dias',
    title: 'Tacos al Pastor',
    subtitle: 'Favorito para compartir',
    image: publicAsset('momentos/post-tacos.png'),
    fallbackImage: publicAsset('momentos/post-submarino.jpg'),
    carousel: '1/2',
    caption: 'Tortilla suave, carne bien dorada y ese toque de limon que levanta todo el plato.',
    badges: [
      { icon: Flame, label: 'Picante suave', tone: 'accent' },
      { icon: UsersRound, label: 'Para 3 personas', tone: 'amber' }
    ],
    likes: '187',
    comments: '29',
    views: '1.7K'
  }
];

function MomentosHeader() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState(filters[0]);

  return (
    <header className="px-4 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.35rem] font-extrabold leading-tight tracking-normal text-white">Momentos</h1>
          <p className="mt-1 text-[0.68rem] font-medium leading-5 text-muted">
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
        {filters.map((filter) => (
          <button
            aria-pressed={selectedFilter === filter}
            className={`h-8 shrink-0 rounded-full border px-4 text-xs font-normal transition ${
              selectedFilter === filter
                ? 'border-accent bg-accent text-white shadow-[0_10px_26px_rgba(252,45,4,0.24)]'
                : 'border-white/10 bg-surface text-muted hover:border-accent/50 hover:text-white'
            }`}
            key={filter}
            onClick={() => setSelectedFilter(filter)}
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
    accent: 'border-accent/35 bg-accent/10 text-accent',
    amber: 'border-yellow-300/45 bg-yellow-500/10 text-warning'
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
      className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-full px-1.5 text-xs text-muted transition hover:text-white"
      onClick={onClick}
      type="button"
    >
      <Icon className={`size-3.5 shrink-0 ${active ? 'text-accent' : 'text-muted'}`} fill={active ? 'currentColor' : 'none'} />
      {label ? <span className="truncate leading-none">{label}</span> : null}
    </button>
  );
}

function MomentPostCard({ post }: { post: MomentPost }) {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState(post.image);
  const [avatarSrc, setAvatarSrc] = useState(post.avatar);

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/10 bg-card shadow-2xl shadow-black/25">
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
        <img
          alt=""
          className="size-9 shrink-0 rounded-full object-cover"
          onError={() => setAvatarSrc(publicAsset('momentos/avatar-default.jpg'))}
          src={avatarSrc}
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-black leading-4 text-white">{post.author}</p>
            {post.verified ? (
              <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-accent text-white">
                <BadgeCheck className="size-3" />
              </span>
            ) : null}
          </div>
          <p className="truncate text-[0.68rem] font-medium leading-4 text-muted">{post.time}</p>
        </div>
        <button aria-label="Mas opciones" className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-white" type="button">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="px-2">
        <div className="relative overflow-hidden rounded-[14px] bg-black">
          <img
            alt={post.title}
            className="aspect-[16/8.2] w-full object-cover"
            onError={() => setImageSrc(post.fallbackImage)}
            src={imageSrc}
          />
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
    <div className="momentos-light-theme no-scrollbar h-full overflow-y-auto bg-base pb-[92px]">
      <MomentosHeader />
      <main className="space-y-3 px-4 pb-6 pt-2">
        {posts.map((post) => (
          <MomentPostCard key={post.title} post={post} />
        ))}
      </main>
    </div>
  );
}
