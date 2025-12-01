import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Zap } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TenantViewBanner } from "@/components/TenantViewBanner";
import { AgentSwitcher } from "@/components/AgentSwitcher";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, tenant, signOut } = useAuth();

  return (
    <SidebarProvider>
      {/* Background Aurora Effect mais aparente */}
      <div
        className="fixed inset-0 -z-10 aurora opacity-40 animate-aurora bg-gradient-to-br from-primary/25 via-accent/15 to-secondary/20"
        style={{ backgroundSize: "400% 400%" }}
      />

      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        <header className="h-16 flex items-center justify-between border-b border-primary/15 backdrop-blur-md bg-gradient-to-r from-background/80 via-primary/3 to-background/80 px-6 shadow-lg shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg p-2" />
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-accent to-secondary shadow-lg flex items-center justify-center overflow-hidden zap-glow">
                <span className="text-xs font-display font-bold text-primary-foreground">NMD</span>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent"></div>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent drop-shadow-sm">
                  Nexus Mind Data
                </h1>
                {tenant && tenant.name && (
                  <span className="text-xs text-muted-foreground font-medium">• {tenant.name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AgentSwitcher />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-3 hover:bg-primary/10 hover:text-foreground transition-all duration-300 rounded-xl px-4 py-2 glass-heavy border-primary/15"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-lg">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-foreground">{user?.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 glass-heavy border border-primary/25 shadow-2xl bg-background/95 backdrop-blur-xl z-50">
                <DropdownMenuItem disabled className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{user?.name}</span>
                      <span className="text-sm text-muted-foreground">{user?.email}</span>
                      <span className="text-xs text-foreground bg-primary/15 px-2 py-0.5 rounded-md mt-1 inline-block">{user?.role}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive text-foreground font-medium p-3 rounded-lg mx-2 mb-2 transition-all duration-300"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-transparent via-primary/3 to-accent/3">
          <TenantViewBanner />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}