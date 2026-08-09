"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@eventmind/api";
import { useAuthStore } from "@eventmind/store";
import { Navbar } from "@/components/navbar/Navbar";
import { GUTTERS } from "@/lib/layout";

const GREEN = "var(--brand-green)";

function subFromToken(token: string | null): string {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? "";
  } catch {
    return "";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function MyOrganisedEventsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokens = useAuthStore((s) => s.tokens);

  const organizerId = subFromToken(tokens?.access_token ?? null);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/auth");
  }, [isAuthenticated, router]);

  const { data: events, isLoading } = useQuery({
    queryKey: ["my-events", organizerId],
    queryFn: () =>
      eventsApi
        .search({ organizer_id: organizerId, status: "published" } as Parameters<typeof eventsApi.search>[0])
        .then((r) => r.data),
    enabled: !!organizerId,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--brand-bg)" }}>
      <Navbar />

      <div className={`py-10 max-w-5xl mx-auto ${GUTTERS}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ border: "1px solid var(--brand-border)", backgroundColor: "var(--brand-surface)" }}
              title="Back to Home"
            >
              <svg className="w-4 h-4" style={{ color: "var(--brand-hint)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-[28px] font-bold" style={{ color: "var(--brand-text)" }}>My Organised Events</h1>
              <p className="text-[18px] mt-1" style={{ color: "var(--brand-hint)" }}>
                Events you have published on EventMind
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/organizer/create")}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[var(--brand-on-green)] transition-colors shrink-0 self-start"
            style={{ backgroundColor: GREEN }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create New Event
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${GREEN} transparent transparent transparent` }} />
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-5 rounded-2xl"
            style={{ backgroundColor: "var(--brand-bg)", border: "1px solid var(--brand-border)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: "var(--brand-bg)" }}>
              📋
            </div>
            <div className="text-center">
              <p className="text-[18px] font-bold mb-1" style={{ color: "var(--brand-text)" }}>No events yet</p>
              <p className="text-[16px]" style={{ color: "var(--brand-hint)" }}>
                Events you create will appear here.
              </p>
            </div>
            <button
              onClick={() => router.push("/organizer/create")}
              className="px-6 py-3 rounded-xl text-sm font-bold text-[var(--brand-on-green)]"
              style={{ backgroundColor: GREEN }}
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--brand-border)" }}>
            {/* Six columns have no honest narrow layout — the table keeps its
                width and scrolls inside the card. */}
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr style={{ backgroundColor: "var(--brand-surface)", borderBottom: "1px solid var(--brand-border)" }}>
                  {["Event", "City", "Date", "Type", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wide"
                      style={{ color: "var(--brand-hint)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: "var(--brand-bg)" }}>
                {events.map((ev, i) => {
                  const loc = ev.location as Record<string, unknown>;
                  const cityName = (loc?.address as string)?.split(",").slice(-2).join(",").trim() ?? "—";
                  const isOnline = loc?.event_type === "online" || loc?.event_type === "Online";
                  return (
                    <tr
                      key={ev.id}
                      style={{ borderBottom: i < events.length - 1 ? "1px solid var(--brand-border)" : "none" }}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>{ev.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--brand-hint)" }}>{ev.category}</p>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--brand-hint)" }}>
                        {isOnline ? "Online" : cityName || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--brand-hint)" }}>
                        {formatDate(ev.start_date)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-md font-medium"
                          style={{
                            backgroundColor: isOnline ? "color-mix(in srgb, #4F46E5 14%, transparent)" : "color-mix(in srgb, var(--brand-green) 10%, transparent)",
                            color: isOnline ? "#4F46E5" : GREEN,
                          }}>
                          {isOnline ? "Online" : "In-Person"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-md font-medium"
                          style={{ backgroundColor: "color-mix(in srgb, #16A34A 16%, transparent)", color: "#16A34A" }}>
                          {ev.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => router.push(`/event/${ev.id}`)}
                          className="text-xs font-semibold"
                          style={{ color: GREEN }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
