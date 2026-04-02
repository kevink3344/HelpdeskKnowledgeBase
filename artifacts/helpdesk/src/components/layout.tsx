import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  BookOpen, 
  PlusCircle, 
  Settings,
  Bell
} from "lucide-react";
import { Button } from "./ui/button";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Tickets", href: "/tickets", icon: TicketIcon },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold shadow-sm">
              S
            </div>
            <span className="font-semibold text-sidebar-foreground tracking-tight text-lg">SupportDesk</span>
          </div>
        </div>

        <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Main
          </div>
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-sidebar-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}

          <div className="mt-8 px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Quick Actions
          </div>
          <Link href="/tickets/new">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer transition-colors">
              <PlusCircle className="w-4 h-4" />
              New Ticket
            </div>
          </Link>
        </div>

        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b bg-card/50 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex items-center md:hidden">
            <span className="font-semibold text-foreground tracking-tight text-lg">SupportDesk</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-medium text-sm">
              JD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
