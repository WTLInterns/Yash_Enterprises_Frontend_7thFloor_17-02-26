'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Building2, TrendingUp, Calendar, Activity, Settings, LogOut, Menu, Smartphone, Bell, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import EnhancedToast from '@/components/EnhancedToast';

export default function AdminDashboard() {
  const router = useRouter();
  const [fcmTokens, setFcmTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [recentActivities, setRecentActivities] = useState([
    { type: 'employee', message: 'New employee added', time: '2 hours ago', color: 'bg-blue-500' },
    { type: 'team', message: 'Team created', time: '5 hours ago', color: 'bg-green-500' },
    { type: 'report', message: 'Report generated', time: '1 day ago', color: 'bg-orange-500' }
  ]);
  const [showEnhancedToast, setShowEnhancedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  
  const { isConnected, subscribeToAttendanceEvents, subscribeToTaskEvents, subscribeToPunchEvents } = useWebSocket();

  // Listen for real-time events
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to attendance events
    const unsubscribeAttendance = subscribeToAttendanceEvents((event) => {
      console.log('Attendance event received:', event);
      
      // Safely extract event data with validation
      const employeeName = event?.employeeName || event?.employee?.name || 'Employee';
      
      // Update recent activities
      const newActivity = {
        type: 'attendance',
        message: `Attendance marked for ${employeeName}`,
        time: 'Just now',
        color: 'bg-purple-500'
      };
      
      setRecentActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      
      // Show enhanced toast notification
      setToastMessage(`Attendance Update: ${employeeName} marked attendance`);
      setToastType('success');
      setShowEnhancedToast(true);
    });

    // Subscribe to task events
    const unsubscribeTask = subscribeToTaskEvents((event) => {
      console.log('Task event received:', event);
      
      // Safely extract event data with validation
      const employeeName = event?.employeeName || event?.employee?.name || 'Employee';
      const taskTitle = event?.taskTitle || event?.title || 'Task';
      const status = event?.status || 'updated';
      
      // Update recent activities
      const newActivity = {
        type: 'task',
        message: `Task ${status} by ${employeeName}`,
        time: 'Just now',
        color: 'bg-indigo-500'
      };
      
      setRecentActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      
      // Show enhanced toast notification
      setToastMessage(`Task Update: ${taskTitle} ${status}`);
      setToastType('info');
      setShowEnhancedToast(true);
    });

    // Subscribe to punch events
    const unsubscribePunch = subscribeToPunchEvents((event) => {
      console.log('Punch event received:', event);
      
      // Safely extract event data with validation
      const employeeName = event?.employeeName || event?.employee?.name || 'Employee';
      const punchType = event?.type || 'UNKNOWN';
      const punchAction = punchType === 'PUNCH_IN' ? 'Punch In' : 'Punch Out';
      
      // Update recent activities
      const newActivity = {
        type: 'punch',
        message: `${punchAction} - ${employeeName}`,
        time: 'Just now',
        color: punchType === 'PUNCH_IN' ? 'bg-green-500' : 'bg-red-500'
      };
      
      setRecentActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      
      // Show enhanced toast notification
      setToastMessage(`${punchAction}: ${employeeName}`);
      setToastType(punchType === 'PUNCH_IN' ? 'success' : 'warning');
      setShowEnhancedToast(true);
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeTask();
      unsubscribePunch();
    };
  }, [isConnected, subscribeToAttendanceEvents, subscribeToTaskEvents, subscribeToPunchEvents]);

  // Connection status monitoring
  useEffect(() => {
    if (isConnected) {
      setToastMessage('Connected to real-time updates');
      setToastType('connection');
      setShowEnhancedToast(true);
    } else {
      setToastMessage('Disconnected from real-time updates');
      setToastType('disconnection');
      setShowEnhancedToast(true);
    }
  }, [isConnected]);
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem("user_data");
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch (_e) {
      return null;
    }
  });

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_data");
    }
    router.push("/login");
  };

  const fetchFcmTokens = async () => {
    setLoadingTokens(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("api.yashrajent.com/api/notifications/tokens", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      setFcmTokens(data.tokens || []);
    } catch (error) {
      console.error("Failed to fetch FCM tokens:", error);
    } finally {
      setLoadingTokens(false);
    }
  };

  // Fetch FCM tokens on component mount
  useEffect(() => {
    fetchFcmTokens();
  }, []);

  const menuItems = [
    {
      title: "Employee Management",
      icon: Users,
      description: "Manage employees, roles, and permissions",
      href: "/employees",
      color: "bg-blue-500"
    },
    {
      title: "Organization",
      icon: Building2,
      description: "Manage departments, teams, and structure",
      href: "/organization",
      color: "bg-green-500"
    },
    {
      title: "Reports & Analytics",
      icon: TrendingUp,
      description: "View reports and business analytics",
      href: "/reports",
      color: "bg-purple-500"
    },
    {
      title: "Attendance",
      icon: Calendar,
      description: "Track employee attendance and schedules",
      href: "/attendance",
      color: "bg-orange-500"
    },
    {
      title: "System Settings",
      icon: Settings,
      description: "Configure system settings and preferences",
      href: "/settings",
      color: "bg-gray-500"
    }
  ];

  return (
    <DashboardLayout
      header={{
        project: "Admin Dashboard",
        user: user ? { name: `${user.firstName} ${user.lastName}`, role: user.roleName } : { name: "Admin User", role: "Administrator" },
        tabs: [],
        activeTabKey: "dashboard"
      }}
    >
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.firstName || 'Admin'}! 👋
                </h1>
                <p className="text-gray-600 mt-2">
                  Here&apos;s what&apos;s happening with your organization today
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Last login</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">892</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">+12%</p>
              </div>
            </div>
          </div>
        </div>

        {/* FCM Token Management */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Smartphone className="text-indigo-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">FCM Token Management</h2>
                <p className="text-sm text-gray-600">View mobile app notification tokens</p>
              </div>
            </div>
            <button
              onClick={fetchFcmTokens}
              disabled={loadingTokens}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loadingTokens ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loadingTokens ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-gray-600 mt-2">Loading FCM tokens...</p>
            </div>
          ) : fcmTokens.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="text-gray-400 mx-auto mb-3" size={48} />
              <p className="text-gray-600">No FCM tokens found</p>
              <p className="text-sm text-gray-500 mt-1">Employees need to log in to the mobile app to register their tokens</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile Token</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Web Token</th>
                  </tr>
                </thead>
                <tbody>
                  {fcmTokens.map((token, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {token.firstName} {token.lastName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{token.email}</td>
                      <td className="py-3 px-4">
                        {token.hasMobileToken ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            <Smartphone size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {token.hasWebToken ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            <Bell size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/employees/add')}
                className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users size={20} />
                Add New Employee
              </button>
              <button
                onClick={() => router.push('/teams/add')}
                className="w-full flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Building2 size={20} />
                Create Team
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
                {isConnected ? (
                  <Wifi size={14} className="text-green-500" />
                ) : (
                  <WifiOff size={14} className="text-red-500" />
                )}
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.time}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${activity.color} rounded-full animate-pulse`}></div>
                    <span className="text-sm text-gray-700">{activity.message}</span>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Toast */}
        <EnhancedToast
          message={toastMessage}
          type={toastType}
          isVisible={showEnhancedToast}
          onClose={() => setShowEnhancedToast(false)}
          duration={3000}
        />

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => router.push(item.href)}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 ${item.color} rounded-lg text-white group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} />
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">{item.title}</h3>
              </div>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
