import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../services/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ notifications: NotificationItem[]; unreadCount: number }>(
        '/notifications',
      );
      setItems(res.notifications);
      setUnread(res.unreadCount);
    } catch {
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function toggle() {
    setOpen((prev) => {
      if (!prev) void load();
      return !prev;
    });
  }

  async function markRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      setError('No se pudo marcar la notificación como leída.');
    }
  }

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="workspace-notif-btn"
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell size={16} aria-hidden="true" />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <strong>Notificaciones</strong>
            {unread > 0 && <span className="notif-unread-count">{unread} sin leer</span>}
          </div>
          {loading ? (
            <p className="notif-empty" role="status">
              Cargando…
            </p>
          ) : error ? (
            <p className="notif-empty" role="alert">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="notif-empty">Todavía no tenés notificaciones.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`notif-item${n.read ? '' : ' is-unread'}`}
                onClick={() => void markRead(n.id)}
                disabled={n.read}
              >
                <strong>{n.title}</strong>
                <span>{n.message}</span>
                <time dateTime={n.createdAt}>
                  {new Date(n.createdAt).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
