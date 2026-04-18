import { Link, useLocation } from "wouter";
import { Film, Home, Briefcase, MessageSquare, Bell, Bookmark, User as UserIcon } from "lucide-react";
import { useGetUnreadCount, useGetMe } from "@workspace/api-client-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: unreadData } = useGetUnreadCount();
  const { data: me } = useGetMe();

  const navItems = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/projects", icon: Briefcase, label: "Projects" },
    { href: "/chat", icon: MessageSquare, label: "Messages", badge: unreadData?.count },
    { href: "/notifications", icon: Bell, label: "Alerts" },
    { href: "/bookmarks", icon: Bookmark, label: "Saved" },
    { href: "/profile/me", icon: UserIcon, label: "Profile" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4">
        <Link href="/feed" className="flex items-center gap-2 mb-8 px-2 text-primary font-serif italic text-2xl">
          <Film className="w-8 h-8" />
          CineConnect
        </Link>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-md transition-colors ${
                location === item.href || location.startsWith(item.href + "/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge ? (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0 relative overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full relative ${
              location === item.href || location.startsWith(item.href + "/")
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-6 h-6" />
            {item.badge ? (
              <span className="absolute top-1 right-2 w-4 h-4 bg-destructive rounded-full border-2 border-card" />
            ) : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
