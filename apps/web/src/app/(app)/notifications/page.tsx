'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Loader2, 
  CheckSquare, 
  Landmark, 
  FileText, 
  ShieldAlert, 
  MailCheck, 
  X,
  Circle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      return response.data?.data || [];
    },
    retry: 1,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mock fallbacks
  const mockNotifications: AppNotification[] = [
    {
      id: 'n1',
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: 'You have been assigned to: Complete 8th floor slab casting.',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'n2',
      type: 'EXPENSE_APPROVED',
      title: 'Expense Voucher Approved',
      message: 'Your expense for Cement purchase - 200 bags (LKR 370,000) was approved.',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'n3',
      type: 'DAILY_LOG_SUBMITTED',
      title: 'Daily Report Submitted',
      message: ' Kasun Silva submitted the Daily Site Log for Horizon Tower today.',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    }
  ];

  const notifications = data || mockNotifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED': return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case 'EXPENSE_APPROVED': return <Landmark className="w-4 h-4 text-emerald-500" />;
      case 'DAILY_LOG_SUBMITTED': return <FileText className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Panel */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Notifications Inbox
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            View real-time updates and alerts for your company account.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="border-zinc-200 dark:border-zinc-800 font-semibold text-xs"
          >
            <MailCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-3">
          <Bell className="w-10 h-10 text-zinc-300" />
          <div>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Inbox is empty</p>
            <p className="text-xs text-zinc-500 mt-1">We will notify you when site events require your approval or action.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card 
              key={n.id} 
              className={`border-zinc-200 dark:border-zinc-800 hover:shadow-sm transition-shadow relative ${
                !n.isRead ? 'bg-amber-500/[0.02] border-amber-500/20' : ''
              }`}
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Type Indicator */}
                <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-100 dark:border-zinc-900 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 space-y-1 text-sm">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{n.title}</span>
                    <span className="text-xs text-zinc-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">{n.message}</p>
                </div>

                {/* Mark as read button */}
                {!n.isRead && (
                  <button 
                    onClick={() => markReadMutation.mutate(n.id)}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 self-center"
                    title="Mark as read"
                  >
                    <Circle className="w-3 h-3 fill-amber-500 text-amber-500" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
