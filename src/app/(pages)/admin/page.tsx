'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Users, 
  Package, 
  Zap, 
  UserPlus, 
  Calendar, 
  Settings, 
  CreditCard, 
  BarChart, 
  ArrowUpRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  totalRentals: number;
  pendingRentals: number;
  activeRentals: number;
  cancelledRentals: number;
  completedRentals: number;
  totalTrailers: number;
  totalUsers: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRentals: 0,
    pendingRentals: 0,
    activeRentals: 0,
    cancelledRentals: 0,
    completedRentals: 0,
    totalTrailers: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Placeholder for fetching actual stats - replace with real API endpoint when available
  useEffect(() => {
    // Simulate loading stats
    const fetchStats = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, you would fetch actual stats from an API
        // For now, using placeholder data
        setTimeout(() => {
          setStats({
            totalRentals: 128,
            pendingRentals: 14,
            activeRentals: 35,
            cancelledRentals: 12,
            completedRentals: 67,
            totalTrailers: 73,
            totalUsers: 245,
          });
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Dashboard cards data
  const dashboardCards = [
    {
      title: 'Verhuringen',
      value: stats.totalRentals,
      trend: '+5% t.o.v. vorige maand',
      trendUp: true,
      icon: <Truck className="h-5 w-5" />,
      link: '/admin/rentals',
    },
    {
      title: 'Actieve verhuringen',
      value: stats.activeRentals,
      trend: '+2% t.o.v. vorige maand',
      trendUp: true,
      icon: <Zap className="h-5 w-5" />,
      link: '/admin/rentals?status=ACTIVE',
    },
    {
      title: 'Trailers',
      value: stats.totalTrailers,
      trend: '+8% t.o.v. vorige maand',
      trendUp: true,
      icon: <Package className="h-5 w-5" />,
      link: '/admin/trailers',
    },
    {
      title: 'Gebruikers',
      value: stats.totalUsers,
      trend: '+12% t.o.v. vorige maand',
      trendUp: true,
      icon: <Users className="h-5 w-5" />,
      link: '/admin/users',
    },
  ];

  // Status data
  const statusData = [
    {
      title: "In afwachting",
      value: stats.pendingRentals,
      color: "bg-amber-500",
      link: "/admin/rentals?status=PENDING",
      percentage: (stats.pendingRentals / stats.totalRentals) * 100
    },
    {
      title: "Actief",
      value: stats.activeRentals,
      color: "bg-green-500",
      link: "/admin/rentals?status=ACTIVE",
      percentage: (stats.activeRentals / stats.totalRentals) * 100
    },
    {
      title: "Geannuleerd",
      value: stats.cancelledRentals,
      color: "bg-red-500",
      link: "/admin/rentals?status=CANCELLED",
      percentage: (stats.cancelledRentals / stats.totalRentals) * 100
    },
    {
      title: "Voltooid",
      value: stats.completedRentals,
      color: "bg-blue-500",
      link: "/admin/rentals?status=COMPLETED",
      percentage: (stats.completedRentals / stats.totalRentals) * 100
    }
  ];

  // Recent activity items - placeholder data
  const recentActivity = [
    {
      id: 1,
      action: 'Nieuwe verhuring',
      user: 'Jan Jansen',
      time: '15 minuten geleden',
      details: 'Open aanhanger gehuurd voor 3 dagen',
    },
    {
      id: 2,
      action: 'Verhuring geannuleerd',
      user: 'Piet Pietersen',
      time: '45 minuten geleden',
      details: 'Annulering door huurder, restitutie verwerkt',
    },
    {
      id: 3,
      action: 'Nieuwe gebruiker',
      user: 'Klaas Klaassen',
      time: '1 uur geleden',
      details: 'Nieuwe gebruiker geregistreerd via e-mail',
    },
    {
      id: 4,
      action: 'Nieuwe trailer',
      user: 'Sanne Janssen',
      time: '3 uur geleden',
      details: 'Gesloten aanhanger toegevoegd aan platform',
    },
    {
      id: 5,
      action: 'Support ticket',
      user: 'Willem Willemsen',
      time: '5 uur geleden',
      details: 'Vraag over betaling - opgelost',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      title: "Nieuwe gebruiker toevoegen",
      icon: <UserPlus className="h-4 w-4" />,
      href: "/admin/users/add"
    },
    {
      title: "Bekijk openstaande verhuringen",
      icon: <Calendar className="h-4 w-4" />,
      href: "/admin/rentals?status=PENDING"
    },
    {
      title: "Beheer trailers",
      icon: <Settings className="h-4 w-4" />,
      href: "/admin/trailers"
    },
    {
      title: "Bekijk betalingen",
      icon: <CreditCard className="h-4 w-4" />,
      href: "/admin/payments"
    },
    {
      title: "Rapportages genereren",
      icon: <BarChart className="h-4 w-4" />,
      href: "/admin/reports"
    }
  ];

  // Render dashboard with stats cards and recent activity
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welkom bij het beheerdersdashboard van BuurBak.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  {card.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {card.trendUp ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={card.trendUp ? 'text-green-500' : 'text-red-500'}>
                  {card.trend}
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                <Link href={card.link}>
                  <span>Bekijken</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Verhuring status</CardTitle>
          <CardDescription>Verdeling van verhuringen per status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statusData.map((status, index) => (
              <Link href={status.link} key={index} className="block">
                <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                    <span className="text-sm font-medium">{status.title}</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-10" />
                  ) : (
                    <div className="text-2xl font-bold">{status.value}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {statusData.map((status, index) => (
                <div 
                  key={index}
                  className={`${status.color} transition-all`} 
                  style={{ width: `${status.percentage}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>0%</div>
              <div>100%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout for Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recente activiteit</CardTitle>
            <CardDescription>Laatste activiteiten op het platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                // Skeleton loader for recent activity
                Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex justify-between items-start pb-4 last:pb-0 last:mb-0 last:border-0 border-b">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[300px]" />
                    </div>
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                ))
              ) : (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex justify-between items-start pb-4 last:pb-0 last:mb-0 last:border-0 border-b">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.action}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{item.user}</span> - {item.details}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              Alle activiteiten bekijken
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle acties</CardTitle>
            <CardDescription>Veelgebruikte beheerstaken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <Button key={index} variant="outline" className="w-full justify-start" asChild>
                  <Link href={action.href}>
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4">
                        {action.icon}
                      </div>
                      <span>{action.title}</span>
                    </div>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}