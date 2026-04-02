import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  BookOpen, 
  PlusCircle, 
  Settings,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Tickets", href: "/tickets", icon: TicketIcon },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
  ];

  const quickActions = [
    { name: "New Ticket", href: "/tickets/new", icon: PlusCircle },
  ];

  const NavItem = ({ item, onClick }: { item: typeof navigation[0]; onClick?: () => void }) => {
    const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
    const content = (
      <Link
        key={item.name}
        href={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        }`}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:flex
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-sidebar-border/50 shrink-0 ${collapsed ? "justify-center px-2" : "px-6 justify-between"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold shadow-sm shrink-0">
              S
            </div>
            {!collapsed && (
              <span className="font-semibold text-sidebar-foreground tracking-tight text-lg truncate">
                SupportDesk
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              Main
            </div>
          )}

          {navigation.map((item) => (
            <NavItem key={item.name} item={item} onClick={() => setMobileOpen(false)} />
          ))}

          <div className={`mt-8 mb-2 ${collapsed ? "" : "px-3"}`}>
            {!collapsed && (
              <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                Quick Actions
              </div>
            )}
          </div>

          {quickActions.map((item) => (
            <NavItem key={item.name} item={item} onClick={() => setMobileOpen(false)} />
          ))}
        </div>

        {/* Bottom: Settings + Collapse toggle */}
        <div className="p-4 border-t border-sidebar-border/50 space-y-1 shrink-0">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer transition-colors">
                  <Settings className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
          )}

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`hidden md:flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b bg-card/50 backdrop-blur-sm z-10 sticky top-0">
          {/* Mobile menu button + title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-semibold text-foreground tracking-tight text-lg md:hidden">
              SupportDesk
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Dark/light toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* Notification bell */}
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
              <Bell className="w-5 h-5" />
            </Button>

            {/* Avatar */}
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
