import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PoweredByStrategicInsight } from '@/components/PoweredByStrategicInsight';
import { useConfirmAction } from '@/components/confirm-action';

/** Primary research path: Home → Surveys → per-survey tabs (data, analysis, report). */
const primaryNav = [
  { title: 'Research home', url: '/dashboard', end: true },
  { title: 'Surveys', url: '/dashboard/surveys', end: false },
  { title: 'Data explorer', url: '/dashboard/data', end: false },
];

const secondaryNav = [
  { title: 'Review queue', url: '/dashboard/review', end: false },
  { title: 'Agent queries', url: '/dashboard/queries', end: false },
  { title: 'Agents', url: '/dashboard/agents', end: false },
  { title: 'Users', url: '/dashboard/users', end: false },
  { title: 'Projects', url: '/dashboard/projects', end: false },
];

function pageTitle(pathname: string) {
  if (pathname.startsWith('/dashboard/projects/')) return 'Project';
  if (pathname.startsWith('/dashboard/projects')) return 'Projects';
  if (pathname.startsWith('/dashboard/data')) return 'Data explorer';
  if (pathname.startsWith('/dashboard/review')) return 'Review queue';
  if (pathname.startsWith('/dashboard/queries')) return 'Agent queries';
  if (pathname.startsWith('/dashboard/surveys/')) return 'Survey workspace';
  if (pathname.startsWith('/dashboard/surveys')) return 'Surveys';
  if (pathname.startsWith('/dashboard/agents')) return 'Agents';
  if (pathname.startsWith('/dashboard/users')) return 'Users';
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'Research home';
  return 'Tafiti Admin';
}

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const confirmAction = useConfirmAction();

  const signOut = async () => {
    const ok = await confirmAction({
      title: 'Sign out of Tafiti Admin?',
      description: 'You will need to sign in again to manage surveys, agents, and reports.',
      confirmLabel: 'Sign out',
      tone: 'warning',
      facts: user?.email ? [{ label: 'Account', value: user.email }] : undefined,
    });
    if (!ok) return;
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-sm px-3 py-2 font-display text-sm transition-colors ${
      isActive
        ? 'bg-primary/10 font-medium text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-[var(--sidebar-background)]">
      <div className="border-b border-border px-4 py-5">
        <div className="font-display text-sm font-semibold tracking-tight text-foreground">Tafiti Admin</div>
        <div className="mt-0.5 text-xs text-muted-foreground">Research &amp; field operations</div>
        <p className="mt-2">
          <PoweredByStrategicInsight />
        </p>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground/80">
          Field agents use the <span className="font-medium text-foreground">Tafiti</span> mobile PWA — not this
          site.
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-4 p-2">
        <div>
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Research
          </div>
          <div className="flex flex-col gap-0.5">
            {primaryNav.map((item) => (
              <NavLink key={item.title} to={item.url} end={item.end} className={linkClass}>
                {item.title}
              </NavLink>
            ))}
          </div>
        </div>
        <div>
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Operations
          </div>
          <div className="flex flex-col gap-0.5">
            {secondaryNav.map((item) => (
              <NavLink key={item.title} to={item.url} end={item.end} className={linkClass}>
                {item.title}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 truncate px-1 text-xs text-muted-foreground">{user?.email}</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start px-2 text-muted-foreground"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export function PageChrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const title = pageTitle(location.pathname);

  return (
    <div className="admin-ledger flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center border-b border-border bg-card px-6">
          <h1 className="font-display text-sm font-semibold tracking-tight text-foreground">{title}</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-5 lg:p-6">{children}</main>
        <footer className="border-t border-border px-6 py-2">
          <PoweredByStrategicInsight />
        </footer>
      </div>
    </div>
  );
}
