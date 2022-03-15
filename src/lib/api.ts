import { environment, showToast, Toast } from "@raycast/api";
import fetch, { AbortError } from "node-fetch";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPreferences } from "./preferences";

type Fetcher<A, R> = (args: { signal: AbortSignal; args?: A }) => Promise<R>;

export function useQuery<A, R>(fetcher: Fetcher<A, R>) {
  const [state, setState] = useState<{ results: R | null; isLoading: boolean }>({ results: null, isLoading: true });
  const cancelRef = useRef<AbortController | null>(null);
  const perform = useCallback(
    async function perform(args?: A) {
      cancelRef.current?.abort();
      cancelRef.current = new AbortController();

      setState((oldState) => ({
        ...oldState,
        isLoading: true,
      }));

      try {
        const results = await fetcher({ signal: cancelRef.current.signal, args });

        setState((oldState) => ({
          ...oldState,
          results,
          isLoading: false,
        }));
      } catch (error) {
        setState((oldState) => ({
          ...oldState,
          isLoading: false,
        }));

        if (error instanceof AbortError) {
          return;
        }

        console.error("API error:", error);

        showToast({ style: Toast.Style.Failure, title: "API request failed", message: String(error) });
      }
    },
    [cancelRef, setState]
  );

  useEffect(() => {
    perform();

    return () => {
      cancelRef.current?.abort();
    };
  }, []);

  return {
    state,
    perform,
  };
}

export async function apiRequest(
  base: string,
  {
    params = {},
    body,
  }: {
    params?: Record<string, unknown>;
    body?: Record<string, unknown>;
    signal: AbortSignal;
  }
) {
  const { apiKey } = getPreferences();
  // console.log(`https://holodex.net/api/v2/${base}?` + toParams(params), body);
  const res = await fetch(`https://holodex.net/api/v2/${base}?` + toParams(params), {
    method: body ? "POST" : "GET",
    body: JSON.stringify(body),
    headers: {
      "X-API-KEY": apiKey,
      "User-Agent": `Raycast/${environment.raycastVersion}`,
      ...(body ? { "Content-Type": "application/json" } : null),
    },
  });

  return await res.json();
}

function toParams(json: Record<string, unknown>): string {
  const params = Object.fromEntries(
    Object.entries(json).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v)])
  );

  return new URLSearchParams(params).toString();
}
