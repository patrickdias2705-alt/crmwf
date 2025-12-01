
import { 
  Users, 
  MessageSquare, 
  Database, 
  BarChart3, 
  Settings,
  Phone,
  Target,
  Activity,
  Zap,
  Shield,
  Eye
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Badge } from "@/components/ui/badge";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

  const mainItems = [
    { title: "Leads", url: "/leads", icon: Users, hideForRoles: ['supervisor'] },
    { title: "Lista Geral", url: "/lista-geral", icon: Eye },
    { title: "Pipelines", url: "/pipelines", icon: Target, hideForRoles: ['supervisor'] },
    { title: "Metrics", url: "/metrics", icon: Activity },
  ];

const settingsItems = [
  { title: "WhatsApp", url: "/whatsapp", icon: Phone },
  { title: "Database", url: "/database", icon: Database },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Supervisor", url: "/supervisor", icon: Eye },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { hasRole } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const unreadCount = useUnreadMessages();
  
  const isAdmin = hasRole(['admin']);
  const isSupervisor = hasRole(['admin', 'supervisor']);

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (isActiveLink: boolean) =>
    isActiveLink 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";

  return (
      <Sidebar 
        className={"glass-heavy border-r border-border/30 shadow-2xl overflow-hidden"} 
        collapsible="icon"
      >
      {/* Gradient overlay mais aparente */}
      <div className="absolute inset-0 bg-gradient-to-b from-sidebar/95 via-primary/5 to-sidebar/95 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/15 via-primary/8 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary shadow-xl flex items-center justify-center glow-primary overflow-hidden">
              <img 
                src="/lovable-uploads/55c76384-6a84-4f3a-a555-8b1652907de7.png" 
                alt="WF Cirúrgicos Logo" 
                className="w-10 h-10 object-contain" 
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-transparent"></div>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <h2 className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent drop-shadow-sm font-display">
                  WF Cirúrgicos
                </h2>
                <span className="text-xs text-muted-foreground font-medium">CRM & WhatsApp</span>
              </div>
            )}
          </div>
        </div>

        <SidebarContent className="px-3 py-4">
          <SidebarGroup className="mb-6">
            <SidebarGroupLabel className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              {!collapsed && "Principal"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {mainItems
                  .filter(item => {
                    if (!item.hideForRoles) return true;
                    return !item.hideForRoles.some(role => hasRole([role]));
                  })
                  .map((item, index) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={`${getNavClass(isActive(item.url))} 
                          group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 
                          ${isActive(item.url) ? 
                            'bg-gradient-to-r from-primary/25 to-accent/15 border border-primary/30 shadow-lg glow-primary' : 
                            'hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/10 hover:border hover:border-primary/20 hover:text-foreground'
                          }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className={`p-2 rounded-lg ${isActive(item.url) ? 
                          'bg-gradient-to-br from-primary via-accent to-secondary shadow-lg' : 
                          'bg-sidebar-accent/50 group-hover:bg-primary/20'
                        } transition-all duration-300`}>
                          <item.icon className={`h-4 w-4 ${isActive(item.url) ? 
                            'text-primary-foreground' : 
                            'text-sidebar-foreground group-hover:text-primary'
                          } transition-colors duration-300`} />
                        </div>
                        {!collapsed && (
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`font-medium transition-colors duration-300 ${isActive(item.url) ? 
                              'text-primary' : 
                              'text-sidebar-foreground group-hover:text-primary'
                            }`}>
                              {item.title}
                            </span>
                            {item.url === '/conversations' && unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-1 text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        )}
                        {isActive(item.url) && !collapsed && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {!collapsed && "Configuração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {settingsItems
                  .filter(item => {
                    // Esconder Admin se não for admin
                    if (item.url === '/admin' && !isAdmin) return false;
                    // Esconder Supervisor se não for admin ou supervisor
                    if (item.url === '/supervisor' && !isSupervisor) return false;
                    return true;
                  })
                  .map((item, index) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`${getNavClass(isActive(item.url))} 
                          group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105
                          ${isActive(item.url) ? 
                            'bg-gradient-to-r from-primary/25 to-accent/15 border border-primary/30 shadow-lg glow-primary' : 
                            'hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/10 hover:border hover:border-primary/20 hover:text-foreground'
                          }`}
                        style={{ animationDelay: `${(index + mainItems.length) * 0.1}s` }}
                      >
                        <div className={`p-2 rounded-lg ${isActive(item.url) ? 
                          'bg-gradient-to-br from-primary via-accent to-secondary shadow-lg' : 
                          'bg-sidebar-accent/50 group-hover:bg-primary/20'
                        } transition-all duration-300`}>
                          <item.icon className={`h-4 w-4 ${isActive(item.url) ? 
                            'text-primary-foreground' : 
                            'text-sidebar-foreground group-hover:text-primary'
                          } transition-colors duration-300`} />
                        </div>
                        {!collapsed && (
                          <span className={`font-medium transition-colors duration-300 ${isActive(item.url) ? 
                            'text-primary' : 
                            'text-sidebar-foreground group-hover:text-primary'
                          }`}>
                            {item.title}
                          </span>
                        )}
                        {isActive(item.url) && !collapsed && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}