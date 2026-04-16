
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Home, Users, Briefcase, FileText, Settings, ChevronDown, ChevronUp, UserSquare, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDescubre } from "@/contexts/descubre-context";
import { Badge } from "@/components/ui/badge";
import type { Customer, Opportunity } from "@/types";
import { getUrgencyInfo, type UrgencyInfo } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";

const allNavItemsForAdmin = [
  { href: "/dashboard", label: "Panel Principal", icon: Home },
  { href: "/dashboard/customers", label: "Clientes", icon: Users, isSubmenu: true },
  { href: "/dashboard/opportunities", label: "Oportunidades", icon: Briefcase },
  { href: "/dashboard/documents", label: "Biblioteca", icon: FileText },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

interface OpportunityWithUrgency extends Opportunity {
    urgencyInfo: UrgencyInfo | null;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const { tieneAplica, tieneDescubre, loading: descubreLoading } = useDescubre();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({ "Clientes": true, "Oportunidades": true });
  const [customerSubItems, setCustomerSubItems] = useState<{href: string, label: string}[]>([]);
  const [opportunitySubItems, setOpportunitySubItems] = useState<OpportunityWithUrgency[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    if (userProfile?.role !== 'admin') {
      setDataLoading(false);
      return;
    }
    
    setDataLoading(true);
    try {
      let customers: Customer[] = await apiClient.get('/get_customers');
      customers = customers.filter(c => !c.is_archived);
      customers.sort((a, b) => a.name.localeCompare(b.name));
      setCustomerSubItems(customers.map(c => ({ href: `/dashboard/customers/${c.id}`, label: c.name })));
    } catch (error) {
      console.error("Could not fetch customers for sidebar:", error);
      setCustomerSubItems([]);
    } finally {
      setDataLoading(false);
    }
  }, [userProfile]);

  const fetchCustomerData = useCallback(async () => {
    if (userProfile?.role !== 'customer' || !userProfile.customer_id) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    try {
      const opportunitiesData: Opportunity[] = await apiClient.get(`/get_opportunities?customer_id=${userProfile.customer_id}`);
      
      const opportunities: OpportunityWithUrgency[] = opportunitiesData
        .filter(opp => !opp.is_archived) // Ensure only active opportunities are shown
        .map(opp => {
          const deadline = opp.deadline ? new Date(opp.deadline) : undefined;
          return {
              ...opp,
              title: opp.name,
              customerId: String(opp.customer_id),
              deadline,
              urgencyInfo: deadline ? getUrgencyInfo(deadline) : null,
          };
        });
      
      opportunities.sort((a, b) => {
          if (a.deadline && b.deadline) {
              return a.deadline.getTime() - b.deadline.getTime();
          }
          if (a.deadline) return -1; // a comes first
          if (b.deadline) return 1;  // b comes first
          return a.title.localeCompare(b.title); // fallback to title sort
      });
      
      setOpportunitySubItems(opportunities);

    } catch (error) {
      console.error("Could not fetch opportunities for sidebar:", error);
      setOpportunitySubItems([]);
    } finally {
      setDataLoading(false);
    }
  }, [userProfile]);
  
  // Effect for initial data load and custom event listener
  useEffect(() => {
    const handleCustomersUpdate = () => {
        console.log("Sidebar detected customer update. Refetching...");
        if (userProfile?.role === 'admin') {
            fetchAdminData();
        }
    };
    
    window.addEventListener('customersUpdated', handleCustomersUpdate);

    if (userProfile?.role === 'admin') {
      fetchAdminData();
    } else if (userProfile?.role === 'customer') {
      fetchCustomerData();
    } else {
      setDataLoading(false);
    }

    return () => {
        window.removeEventListener('customersUpdated', handleCustomersUpdate);
    };
  }, [userProfile, fetchAdminData, fetchCustomerData]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const renderAdminNav = () => (
    <>
      {allNavItemsForAdmin.map((item) => (
        <SidebarMenuItem key={item.label}>
          {item.isSubmenu ? (
            <>
              <SidebarMenuButton 
                onClick={() => toggleSubmenu(item.label)}
                isActive={pathname.startsWith(item.href)}
                tooltip={{content: item.label, side: "right"}}
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </div>
                {openSubmenus[item.label] ? <ChevronUp className="h-4 w-4 group-data-[collapsible=icon]:hidden" /> : <ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" />}
              </SidebarMenuButton>
              {openSubmenus[item.label] && (
                <SidebarMenuSub>
                   {dataLoading ? (
                    <>
                      <SidebarMenuSkeleton className="h-7" />
                      <SidebarMenuSkeleton className="h-7" />
                      <SidebarMenuSkeleton className="h-7" />
                    </>
                  ) : (
                    customerSubItems.map(subItem => (
                      <SidebarMenuSubItem key={subItem.href}>
                        <Link href={subItem.href} passHref>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                              <span>{subItem.label}</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    ))
                  )}
                </SidebarMenuSub>
              )}
            </>
          ) : (
            <Link href={item.href} passHref>
              <SidebarMenuButton 
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={{content: item.label, side: "right"}}
              >
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          )}
        </SidebarMenuItem>
      ))}
    </>
  );
  
  const renderCustomerNav = () => {
    const customerZoneHref = `/dashboard/customers/${userProfile?.customer_id}`;
    const isDescubreOportunidadesActive =
      pathname === "/dashboard/descubre" ||
      (pathname.startsWith("/dashboard/descubre/") &&
        !pathname.startsWith("/dashboard/descubre/perfil"));

    const renderAplicaFullNav = () => (
      <>
        <SidebarMenuItem>
          <Link href={customerZoneHref} passHref>
            <SidebarMenuButton 
              isActive={pathname === customerZoneHref}
              tooltip={{content: "Mi Empresa", side: "right"}}
            >
              <UserSquare className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Mi Empresa</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        
        <SidebarMenuItem>
           <SidebarMenuButton 
              onClick={() => toggleSubmenu("Oportunidades")}
              isActive={pathname.includes("/opportunities/")}
              tooltip={{content: "Oportunidades", side: "right"}}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">Oportunidades</span>
              </div>
              {openSubmenus["Oportunidades"] ? <ChevronUp className="h-4 w-4 group-data-[collapsible=icon]:hidden" /> : <ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" />}
            </SidebarMenuButton>
            {openSubmenus["Oportunidades"] && (
              <SidebarMenuSub>
                 {dataLoading ? (
                  <>
                    <SidebarMenuSkeleton className="h-7" />
                    <SidebarMenuSkeleton className="h-7" />
                  </>
                ) : (
                  opportunitySubItems.length > 0 ? (
                    opportunitySubItems.map(opp => {
                       const href = `/dashboard/customers/${opp.customerId}/opportunities/${opp.id}`;
                       const status = opp.urgencyInfo?.status;
                       const showRedDot = status === 'urgent' || status === 'overdue';
                       const showYellowDot = status === 'upcoming';
                      return (
                        <SidebarMenuSubItem key={href}>
                          <Link href={href} passHref>
                            <SidebarMenuSubButton asChild isActive={pathname === href}>
                               <div className="flex items-start gap-2 w-full">
                                {showRedDot && <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></span>}
                                {showYellowDot && <span className="h-2 w-2 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5"></span>}
                                <span className="line-clamp-2" title={opp.title}>{opp.title}</span>
                               </div>
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      );
                    })
                  ) : (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        href="#"
                        aria-disabled
                        tabIndex={-1}
                        className="pointer-events-none cursor-default opacity-50"
                        onClick={(e) => e.preventDefault()}
                      >
                        <span className="text-xs italic">No hay oportunidades</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                )}
              </SidebarMenuSub>
            )}
        </SidebarMenuItem>
         <SidebarMenuItem>
          <Link href="/dashboard/settings" passHref>
            <SidebarMenuButton 
              isActive={pathname.startsWith('/dashboard/settings')}
              tooltip={{content: "Configuración", side: "right"}}
            >
              <Settings className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Configuración</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </>
    );

    return (
      <>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard" passHref>
                  <SidebarMenuButton
                    isActive={pathname === "/dashboard"}
                    tooltip={{ content: "Panel Principal", side: "right" }}
                  >
                    <Home className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Panel Principal</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!descubreLoading && tieneDescubre ? (
          <>
            {/* DESCUBRE */}
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs font-semibold tracking-widest text-sidebar-foreground/50 uppercase px-2 pb-1">
                Descubre
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Link href="/dashboard/descubre" passHref>
                      <SidebarMenuButton
                        isActive={isDescubreOportunidadesActive}
                    tooltip={{ content: "Mis Oportunidades", side: "right" }}
                      >
                        <Search className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Mis Oportunidades</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Link href="/dashboard/descubre/perfil" passHref>
                      <SidebarMenuButton
                        isActive={pathname.startsWith("/dashboard/descubre/perfil")}
                        tooltip={{ content: "Mis Preferencias", side: "right" }}
                      >
                        <SlidersHorizontal className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:hidden">Mis Preferencias</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}

        {/* APLICA */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs font-semibold tracking-widest text-sidebar-foreground/50 uppercase px-2 pb-1">
            Aplica
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {descubreLoading ? null : (tieneAplica || !tieneDescubre ? renderAplicaFullNav() : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    disabled
                    tooltip={{ content: "Aplica — Plan Profesional", side: "right" }}
                    className="justify-between gap-2 opacity-70"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Briefcase className="h-5 w-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden truncate">
                        Aplica — Plan Profesional
                      </span>
                    </div>
                    <Badge
                      className="group-data-[collapsible=icon]:hidden shrink-0 border-0 bg-popular px-2 py-0 text-[10px] font-semibold text-popular-foreground shadow-sm hover:bg-popular/90"
                    >
                      Upgrade
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    );
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 items-center justify-center h-[6rem]">
        <Link href="/dashboard" className="flex items-center justify-center text-sidebar-foreground h-full">
          <Image
            src="/logo-bidtory-color.svg"
            alt="Bidtory Logo"
            width={128}
            height={40}
            className="w-auto h-full max-h-10 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-auto"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        {userProfile?.role === 'admin' ? (
          <SidebarMenu>
            {renderAdminNav()}
          </SidebarMenu>
        ) : userProfile?.role === 'customer' ? (
          renderCustomerNav()
        ) : null}
      </SidebarContent>
      <SidebarFooter className="p-4">
        {/* Can add elements to footer, like user info or a logout button, if not in header */}
      </SidebarFooter>
    </Sidebar>
  );
}
