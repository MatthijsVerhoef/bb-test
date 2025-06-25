// "use client";

// import { 
//   useQuery, 
//   useMutation, 
//   useQueryClient
// } from '@tanstack/react-query';
// import { ApiClient } from '@/lib/api-client';

// export interface Notification {
//   id: string;
//   message: string;
//   read: boolean;
//   type: "BOOKING" | "PAYMENT" | "CHAT" | "SYSTEM" | "REMINDER" | "PROMOTION" | "OTHER";
//   actionUrl?: string;
//   expiresAt?: Date;
//   createdAt: Date;
// }

// export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

// interface NotificationsResponse {
//   notifications: Notification[];
// }

// export const fetchNotifications = async (): Promise<Notification[]> => {
//   try {
//     const cachedData = localStorage.getItem("notifications");
//     const cachedTimestamp = localStorage.getItem("notificationsTimestamp");
    
//     if (cachedData && cachedTimestamp) {
//       const timestamp = parseInt(cachedTimestamp, 10);
//       if (Date.now() - timestamp < 30000) {
//         return JSON.parse(cachedData);
//       }
//     }
//   } catch (error) {
//     console.warn("Error reading notifications from cache:", error);
//   }
  
//   const data = await ApiClient.get<NotificationsResponse>('/api/notifications', {
//     cacheConfig: {
//       ttl: 30000,
//       cacheKey: 'notifications'
//     }
//   });
  
//   try {
//     localStorage.setItem("notifications", JSON.stringify(data.notifications));
//     localStorage.setItem("notificationsTimestamp", Date.now().toString());
//   } catch (error) {
//     console.warn("Error setting notifications cache:", error);
//   }
  
//   return data.notifications;
// };

// export const markAsReadApi = async (id: string): Promise<void> => {
//   return ApiClient.put(`/api/notifications/${id}/read`, undefined, {
//     cacheConfig: {
//       ttl: 0,
//       bypassCache: true
//     }
//   });
// };

// export const markAllAsReadApi = async (): Promise<void> => {
//   return ApiClient.put('/api/notifications/read-all', undefined, {
//     cacheConfig: {
//       ttl: 0,
//       bypassCache: true
//     }
//   });
// };

// export const deleteNotificationApi = async (id: string): Promise<void> => {
//   return ApiClient.delete(`/api/notifications/${id}`, {
//     cacheConfig: {
//       ttl: 0,
//       bypassCache: true
//     }
//   });
// };

// export function useNotificationsData() {
//   const queryClient = useQueryClient();
  
//   const isUserLoggedIn = (() => {
//     try {
//       if (typeof window !== 'undefined') {
//         const userSession = localStorage.getItem("userSession");
//         if (userSession) {
//           const parsedSession = JSON.parse(userSession);
//           return !!parsedSession.user && parsedSession.expiry > Date.now();
//         }
//       }
//       return false;
//     } catch (e) {
//       return false;
//     }
//   })();
  
//   const {
//     data = [],
//     isLoading,
//     error,
//     refetch
//   } = useQuery({
//     queryKey: ['notifications'],
//     queryFn: fetchNotifications,
//     staleTime: 30 * 1000,
//     refetchInterval: 60 * 1000,
//     refetchOnWindowFocus: true,
//     enabled: isUserLoggedIn, 
//   });
  
//   const unreadCount = data.filter(notification => !notification.read).length;
  
//   const markAsReadMutation = useMutation({
//     mutationFn: markAsReadApi,
//     onMutate: async (id) => {
//       await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
//       const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);
      
//       queryClient.setQueryData<Notification[]>(['notifications'], old => 
//         old?.map(notification => 
//           notification.id === id 
//             ? { ...notification, read: true } 
//             : notification
//         ) || []
//       );
      
//       try {
//         const cachedData = localStorage.getItem("notifications");
//         if (cachedData) {
//           const parsed = JSON.parse(cachedData);
//           const updated = parsed.map((notification: Notification) =>
//             notification.id === id ? { ...notification, read: true } : notification
//           );
//           localStorage.setItem("notifications", JSON.stringify(updated));
//           localStorage.setItem("notificationsTimestamp", Date.now().toString());
//         }
//       } catch (error) {
//         console.warn("Error updating notifications cache:", error);
//       }
      
//       return { previousNotifications };
//     },
//     onError: (_, __, context) => {
//       if (context?.previousNotifications) {
//         queryClient.setQueryData(
//           ['notifications'], 
//           context.previousNotifications
//         );
//       }
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries({ queryKey: ['notifications'] });
//     }
//   });
  
//   const markAllAsReadMutation = useMutation({
//     mutationFn: markAllAsReadApi,
//     onMutate: async () => {
//       await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
//       const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);
      
//       queryClient.setQueryData<Notification[]>(['notifications'], old => 
//         old?.map(notification => ({ ...notification, read: true })) || []
//       );
      
//       try {
//         const cachedData = localStorage.getItem("notifications");
//         if (cachedData) {
//           const parsed = JSON.parse(cachedData);
//           const updated = parsed.map((notification: Notification) => ({
//             ...notification,
//             read: true
//           }));
//           localStorage.setItem("notifications", JSON.stringify(updated));
//           localStorage.setItem("notificationsTimestamp", Date.now().toString());
//         }
//       } catch (error) {
//         console.warn("Error updating notifications cache:", error);
//       }
      
//       return { previousNotifications };
//     },
//     onError: (_, __, context) => {
//       if (context?.previousNotifications) {
//         queryClient.setQueryData(
//           ['notifications'], 
//           context.previousNotifications
//         );
//       }
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries({ queryKey: ['notifications'] });
//     }
//   });
  
//   const deleteNotificationMutation = useMutation({
//     mutationFn: deleteNotificationApi,
//     onMutate: async (id) => {
//       await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
//       const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);
      
//       queryClient.setQueryData<Notification[]>(['notifications'], old => 
//         old?.filter(notification => notification.id !== id) || []
//       );
      
//       try {
//         const cachedData = localStorage.getItem("notifications");
//         if (cachedData) {
//           const parsed = JSON.parse(cachedData);
//           const updated = parsed.filter(
//             (notification: Notification) => notification.id !== id
//           );
//           localStorage.setItem("notifications", JSON.stringify(updated));
//           localStorage.setItem("notificationsTimestamp", Date.now().toString());
//         }
//       } catch (error) {
//         console.warn("Error updating notifications cache:", error);
//       }
      
//       return { previousNotifications };
//     },
//     onError: (_, __, context) => {
//       if (context?.previousNotifications) {
//         queryClient.setQueryData(
//           ['notifications'], 
//           context.previousNotifications
//         );
//       }
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries({ queryKey: ['notifications'] });
//     }
//   });
  
//   const markAsRead = async (id: string) => {
//     await markAsReadMutation.mutateAsync(id);
//   };
  
//   const markAllAsRead = async () => {
//     await markAllAsReadMutation.mutateAsync();
//   };
  
//   const deleteNotification = async (id: string) => {
//     await deleteNotificationMutation.mutateAsync(id);
//   };
  
//   const refreshNotifications = async () => {
//     await refetch();
//   };
  
//   return {
//     notifications: data,
//     unreadCount,
//     loading: isLoading,
//     error: error ? (error as Error).message : null,
//     wsStatus: "connected" as WebSocketStatus,
    
//     markAsRead,
//     markAllAsRead,
//     deleteNotification,
//     refreshNotifications,
    
//     markAsReadStatus: markAsReadMutation.status,
//     markAllAsReadStatus: markAllAsReadMutation.status,
//     deleteNotificationStatus: deleteNotificationMutation.status
//   };
// }