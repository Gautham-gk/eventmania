import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tracks which chat rooms have unread activity, so the navbar chat button can
 * "glow" when a message arrives.
 *
 * ⚠️ This is a FRONTEND-ONLY MVP. The chat backend does not persist messages or
 * track read state, so unread is detected live via WebSocket while the app is
 * open (see components/ChatPresence.tsx). A message that arrives while the app
 * is closed cannot be known here. The persisted map only keeps glows you already
 * saw from vanishing on a soft navigation — it is NOT a true unread history.
 */
interface ChatUnreadState {
  /** roomId → number of unread messages observed this session. */
  unreadRooms: Record<string, number>;
  /** The room currently open on screen — its messages are never marked unread. */
  activeRoom: string | null;
  markUnread: (roomId: string) => void;
  markRead: (roomId: string) => void;
  setActiveRoom: (roomId: string | null) => void;
}

export const useChatUnreadStore = create<ChatUnreadState>()(
  persist(
    (set, get) => ({
      unreadRooms: {},
      activeRoom: null,
      markUnread: (roomId) => {
        // The room the user is looking at is never "unread".
        if (get().activeRoom === roomId) return;
        set((s) => ({
          unreadRooms: {
            ...s.unreadRooms,
            [roomId]: (s.unreadRooms[roomId] ?? 0) + 1,
          },
        }));
      },
      markRead: (roomId) =>
        set((s) => {
          if (!s.unreadRooms[roomId]) return s;
          const next = { ...s.unreadRooms };
          delete next[roomId];
          return { unreadRooms: next };
        }),
      setActiveRoom: (roomId) => set({ activeRoom: roomId }),
    }),
    {
      name: "eventmind-chat-unread",
      // activeRoom is per-page runtime state — only the unread map is persisted.
      partialize: (s) => ({ unreadRooms: s.unreadRooms }),
    }
  )
);
