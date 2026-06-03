import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useUserProfile, getFirstName } from "@/lib/userProfile";

interface Props {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, eyebrow, description, actions, children }: Props) {
  const { fullName } = useUserProfile();
  const firstName = getFirstName(fullName);
  const studioLabel = firstName ? `${firstName}'s Studio` : "Your Studio";
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background flex-col">
        {/* Forest-green announcement bar — echoes allegoryartconsulting.com */}
        <div className="bg-primary text-[11px] tracking-[0.28em] uppercase text-center py-2 font-medium" style={{ color: "#032419" }}>
          Allegory Studio · for working artists
        </div>
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center border-b border-border px-3 gap-2 bg-background/80 backdrop-blur sticky top-0 z-20">
              <SidebarTrigger />
              <div className="rule w-px h-4 bg-border mx-2" style={{ width: 1 }} />
              <Link to="/" className="eyebrow hover:opacity-70 transition-opacity" style={{ color: "#032419" }}>{studioLabel}</Link>
              <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </header>
            <main className="flex-1 px-6 md:px-10 lg:px-14 py-10 max-w-[1400px] w-full mx-auto animate-fade-in">
              <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
                <div>
                  {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
                  <h1 className="font-display text-4xl md:text-6xl leading-[1.02] max-w-2xl tracking-tight">{title}</h1>
                  {description && (
                    <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed">{description}</p>
                  )}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
              <div className="rule mb-8" />
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
