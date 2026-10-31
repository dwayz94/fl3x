"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SpotifyIcon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, FieldError, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

type Connections = { available: { spotify: boolean }; connected: { provider: string; accountName: string | null }[] };

/** Accounts that feed widgets automatically. Spotify → the music widget shows what you're playing. */
export function ConnectionsPanel() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({ queryKey: ["connections"], queryFn: async () => api<Connections>("/me/connections", { token: await getToken() }) });
  const spotify = data?.connected.find((c) => c.provider === "spotify");
  const router = useRouter();
  const pathname = usePathname();
  const [finished, setFinished] = useState(false);
  const status = finished ? "connected" : params.get("spotify");

  // Back from Spotify: this page attaches the account with your own session, then cleans the URL.
  const code = params.get("spotify_code");
  const state = params.get("spotify_state");
  const finishing = useRef(false);
  useEffect(() => {
    if (!code || !state || finishing.current) return;
    finishing.current = true;
    setBusy(true);
    void (async () => {
      try {
        await api("/me/connections/spotify/finish", { token: await getToken(), json: { code, state } });
        await qc.invalidateQueries({ queryKey: ["connections"] });
        setFinished(true);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Spotify connection failed, try again.");
      } finally {
        setBusy(false);
        router.replace(pathname, { scroll: false });
      }
    })();
  }, [code, state, getToken, qc, router, pathname]);

  const connect = async () => {
    setError(null);
    setBusy(true);
    try {
      const { url } = await api<{ url: string }>("/me/connections/spotify", { method: "POST", token: await getToken() });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not reach Spotify");
      setBusy(false);
    }
  };
  const disconnect = async () => {
    setError(null);
    setBusy(true);
    try {
      await api("/me/connections/spotify", { method: "DELETE", token: await getToken() });
      await qc.invalidateQueries({ queryKey: ["connections"] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not disconnect Spotify");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-12 items-center gap-3 rounded-xl bg-white/[0.04] px-3 text-sm">
        <Icon icon={SpotifyIcon} size={20} className="text-[#1DB954]" />
        <span className="min-w-0 flex-1 truncate">
          Spotify {spotify ? <span className="text-fg-3">· {spotify.accountName}</span> : <span className="text-fg-3">· not connected</span>}
        </span>
        {spotify ? (
          <Button size="sm" variant="ghost" loading={busy} onClick={() => void disconnect()}>
            Disconnect
          </Button>
        ) : (
          <Button size="sm" variant="secondary" loading={busy} disabled={data && !data.available.spotify} onClick={() => void connect()}>
            Connect
          </Button>
        )}
      </div>
      <p className="text-[11px] text-fg-3">
        {data && !data.available.spotify
          ? "Spotify isn't set up on this server yet (SPOTIFY_CLIENT_ID)."
          : "Your music widget shows the track you're playing, or the last one you played."}
      </p>
      {status === "connected" && <p className="text-xs text-success">Spotify connected.</p>}
      {(status === "error" || error) && <FieldError>{error ?? "Spotify connection failed, try again."}</FieldError>}
    </div>
  );
}
