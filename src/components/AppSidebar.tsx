import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Boxes, Receipt, CalendarClock, Users, MessageCircle, FolderLock, Inbox, Megaphone, Lock, Settings as SettingsIcon, Sparkles, LogOut, BarChart3 } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useTier, isProPath } from "@/lib/tier";
import { useUserProfile, getFirstName } from "@/lib/userProfile";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";
import { toast } from "sonner";

const items = [
  { title: "Today", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Sales & Finance", url: "/sales", icon: Receipt },
  { title: "Opportunities", url: "/exhibitions", icon: CalendarClock },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Profile Vault", url: "/profile-vault", icon: FolderLock },
  { title: "Communications", url: "/communications", icon: Inbox },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Studio Manager", url: "/studio-manager", icon: MessageCircle },
];

const accountItems = [
  { title: "Pricing", url: "/pricing", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { tier } = useTier();
  const { fullName } = useUserProfile();
  const firstName = getFirstName(fullName);
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="px-4 pt-6 pb-2">
          {!collapsed ? (
            <>
              <Link to="/dashboard" aria-label="Allegory Studio — Dashboard">
                <img src="/Allegory_Studio_Logo.png" alt="Allegory Studio" style={{ width: 160, height: "auto" }} />
              </Link>
              {firstName && (
                <div className="mt-2 text-[11px] text-muted-foreground">{firstName}'s Studio</div>
              )}
            </>
          ) : (
            <Link to="/dashboard" aria-label="Allegory Studio — Dashboard" className="block">
              <img src="/AAC_Brandmark-03_Emerald.png" alt="Allegory Studio" style={{ width: 32, height: "auto" }} className="mx-auto" />
            </Link>
          )}
        </div>
        <div className="rule mx-3 mb-2" />
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="eyebrow px-4">Studio</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.url);
                const locked = tier === "starter" && isProPath(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={`group relative flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          active
                            ? "text-foreground font-medium"
                            : locked
                            ? "text-muted-foreground/70 hover:text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-foreground" />}
                        <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                        {!collapsed && (
                          <span className="flex items-center gap-1.5 flex-1">
                            <span>{item.title}</span>
                            {locked && <Lock className="h-3 w-3 opacity-60" strokeWidth={1.5} />}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="eyebrow px-4">Account</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => {
                const active = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`group relative flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-foreground" />}
                        <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/reports"
                      className={`group relative flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        pathname.startsWith("/reports") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {pathname.startsWith("/reports") && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-foreground" />}
                      <BarChart3 className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      {!collapsed && <span>Reports</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="group relative flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    {!collapsed && <span>Sign out</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto px-4 py-4 text-[11px] text-muted-foreground leading-relaxed">
            <div className="rule mb-3" />
            <div className="mb-2">
              <span className="eyebrow">Plan</span>
              <div className="mt-1 text-foreground">Studio {tier === "pro" ? "Pro" : "Starter"}</div>
            </div>
            A studio manager for<br />working artists.
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
