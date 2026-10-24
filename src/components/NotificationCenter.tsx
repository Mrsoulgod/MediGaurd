import React, { useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Trash2,
  X,
  FileCheck2,
  Clock,
  Layers,
} from 'lucide-react';
import { useMediGuard } from '../context/MediGuardContext';
import { AppNotification } from '../schemas';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateScreen?: (screen: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateScreen,
}) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useMediGuard();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getSeverityIcon = (sev: AppNotification['severity']) => {
    switch (sev) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4 text-[#B91C1C]" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#A16207]" />;
      case 'info':
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#15803D]" />;
    }
  };

  const getSeverityBadge = (sev: AppNotification['severity']) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
            CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF9C3] text-[#A16207] border border-[#FEF08A]">
            WARNING
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
            NOTICE
          </span>
        );
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.actionScreen && onNavigateScreen) {
      onNavigateScreen(notif.actionScreen);
      onClose();
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E7E5E4] z-50 overflow-hidden text-xs text-[#1C1917]"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#C2410C]" />
          <h3 className="font-bold text-sm text-[#1C1917]">Hospital Alerts & Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#C2410C] text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-[#78716C] hover:text-[#1C1917] p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Control Actions */}
      <div className="px-3.5 py-2 bg-white border-b border-[#E7E5E4] flex items-center justify-between text-[11px] text-[#78716C]">
        <button
          onClick={markAllNotificationsAsRead}
          className="hover:text-[#C2410C] transition-colors"
        >
          Mark all as read
        </button>
        <button
          onClick={clearNotifications}
          className="hover:text-[#B91C1C] flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear all</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#E7E5E4]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[#78716C] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#15803D] mx-auto opacity-70" />
            <div className="font-semibold text-xs text-[#1C1917]">All Clear</div>
            <div className="text-[11px]">No active inventory alerts or pending critical tasks.</div>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 cursor-pointer hover:bg-[#FAFAF9] transition-colors space-y-1.5 ${
                !notif.read ? 'bg-[#FFF7ED]/30' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {getSeverityIcon(notif.severity)}
                  <span className="font-semibold text-xs text-[#1C1917] line-clamp-1">
                    {notif.title}
                  </span>
                </div>
                {getSeverityBadge(notif.severity)}
              </div>

              <p className="text-[11px] text-[#78716C] leading-relaxed">
                {notif.message}
              </p>

              <div className="flex items-center justify-between pt-1 text-[10px] text-[#78716C]">
                <span className="font-mono">{notif.timestamp}</span>
                {notif.actionScreen && (
                  <span className="text-[#C2410C] font-semibold flex items-center gap-1 hover:underline">
                    <span>Act now</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
