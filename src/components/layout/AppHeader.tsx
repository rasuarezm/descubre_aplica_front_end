
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, UserCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import type { Notification } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import { avatarUrlForImg } from "@/lib/user-profile";

export function AppHeader() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiClient.get<Notification[]>('/get_my_notifications?status=unread');
      setUnreadCount(data.length);
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const handleBellClick = async () => {
    if (isLoadingNotifs) return;
    setIsLoadingNotifs(true);

    try {
      const data = await apiClient.get<Notification[]>('/get_my_notifications');
      setNotifications(data);

      const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        await apiClient.post('/mark_notifications_as_read', { notification_ids: unreadIds });
        setUnreadCount(0);
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las notificaciones.", variant: "destructive" });
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="ml-auto flex items-center gap-4">
         <DropdownMenu onOpenChange={(open) => open && handleBellClick()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              <span className="sr-only">Alternar notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoadingNotifs ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-center text-muted-foreground">No tienes notificaciones.</p>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem key={notif.id} asChild className="cursor-pointer">
                  <Link href={notif.link_url || '#'} className="flex flex-col items-start gap-1 whitespace-normal">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={avatarUrlForImg(userProfile?.photo_signed_url, user?.photoURL)}
                  alt="Avatar de usuario"
                  data-ai-hint="user avatar"
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback>{userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile?.displayName || "Usuario"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings/profile" passHref>
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard/settings" passHref>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-400 focus:bg-red-900/20">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
