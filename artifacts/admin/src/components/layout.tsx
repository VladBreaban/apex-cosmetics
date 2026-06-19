import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Products", href: "/products", icon: Package },
  { title: "Orders", href: "/orders", icon: ShoppingCart },
  { title: "Discounts", href: "/discounts", icon: Tag },
  { title: "Customers", href: "/users", icon: Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { admin, logout } = useAuth();

  const getBreadcrumbs = () => {
    const paths = location.split("/").filter(Boolean);
    if (paths.length === 0) return [{ title: "Dashboard", href: "/" }];
    
    return paths.map((path, i) => {
      const href = "/" + paths.slice(0, i + 1).join("/");
      return {
        title: path.charAt(0).toUpperCase() + path.slice(1).replace("-", " "),
        href
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <Sidebar className="border-r bg-card">
          <SidebarHeader className="border-b px-6 py-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <div className="size-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                <LayoutDashboard className="size-4" />
              </div>
              Apex Health
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="flex-1">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="px-2 py-4 space-y-1">
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={location === item.href || (location.startsWith(item.href) && item.href !== "/")}
                        >
                          <Link href={item.href} className="font-medium">
                            <item.icon className="size-4 mr-2" />
                            {item.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </ScrollArea>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.href}>
                    <BreadcrumbItem>
                      {i === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.title}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {i < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                {admin?.username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void logout()}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </header>
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}