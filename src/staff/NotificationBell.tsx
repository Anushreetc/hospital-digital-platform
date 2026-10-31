import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notificationsApi, PortalNotification, toNotification } from '../services/db';

/**
 * Header bell for the staff portals. Shows the alerts this user may read
 * (reception feed for staff, own feed for a doctor), updates live, and on a
 * new alert shows a short pop-up, plays a soft chime and, when allowed and the
 * tab is in the background, a desktop notification.
 */

const timeAgo = (iso: string) => {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const playChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    gain.connect(ctx.destination);
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + 0.6);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    // Audio is optional.
  }
};

export const NotificationBell: React.FC = () => {
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState<PortalNotification | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setItems(await notificationsApi.list());
    } catch (e) {
      console.warn('Could not load alerts', e);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('portal-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = toNotification(payload.new);
        setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev].slice(0, 50)));
        setPopup(n);
        playChime();
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          new Notification(n.title, { body: n.body, tag: n.id });
        }
      })
      .subscribe();
    // Fallback refresh in case the live connection drops.
    const timer = window.setInterval(load, 60_000);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    if (!popup) return;
    const timer = window.setTimeout(() => setPopup(null), 8000);
    return () => window.clearTimeout(timer);
  }, [popup]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unread = items.filter((n) => !n.read);

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markRead(ids);
    } catch (e) {
      console.warn('Could not mark alerts as read', e);
    }
  };

  const enableDesktop = async () => {
    if (typeof Notification === 'undefined') return;
    setPermission(await Notification.requestPermission());
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#10294c] hover:bg-slate-100 transition-colors"
        aria-label={unread.length ? `Alerts, ${unread.length} unread` : 'Alerts'}
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(380px,calc(100vw-24px))] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <span className="text-sm font-semibold text-[#10294c]">Alerts</span>
            {unread.length > 0 && (
              <button
                onClick={() => markRead(unread.map((n) => n.id))}
                className="text-xs font-semibold text-[#195fbd] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          {permission === 'default' && (
            <button
              onClick={enableDesktop}
              className="w-full text-left px-4 py-2.5 text-xs text-[#195fbd] bg-blue-50 border-b border-slate-200 hover:bg-blue-100"
            >
              Turn on desktop alerts so you see new bookings in other tabs
            </button>
          )}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No alerts yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead([n.id])}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex gap-3 ${n.read ? '' : 'bg-blue-50/60'}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-[#195fbd]'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#10294c]">{n.title}</span>
                    <span className="block text-xs text-slate-600 mt-0.5 break-words">{n.body}</span>
                    <span className="block text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {popup && !open && (
        <div
          role="status"
          className="fixed top-4 right-4 z-[60] w-[min(360px,calc(100vw-32px))] bg-white border border-slate-200 border-l-4 border-l-[#195fbd] rounded-xl shadow-lg p-4 flex gap-3"
        >
          <Bell className="w-5 h-5 text-[#195fbd] shrink-0 mt-0.5" />
          <button
            className="text-left min-w-0 flex-1"
            onClick={() => {
              setPopup(null);
              setOpen(true);
            }}
          >
            <span className="block text-sm font-semibold text-[#10294c]">{popup.title}</span>
            <span className="block text-xs text-slate-600 mt-0.5 break-words">{popup.body}</span>
          </button>
          <button onClick={() => setPopup(null)} className="text-slate-400 hover:text-slate-600 shrink-0" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
