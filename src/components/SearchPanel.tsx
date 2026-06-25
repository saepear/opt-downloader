"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { detectPlatform } from "@/lib/platforms";
import type { SearchResult } from "@/lib/search";
import toast from "react-hot-toast";

interface SearchPanelProps {
  onSelectResult: (url: string, title: string) => void;
}

interface SearchResultItem extends SearchResult {
  durationLabel: string;
}

export function SearchPanel({ onSelectResult }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      toast.error("Escribe un término de búsqueda");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Error al buscar");
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(data.items ?? []);
    } catch {
      toast.error("Error de red al buscar");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }

  function pickResult(item: SearchResultItem) {
    onSelectResult(item.url, item.title);
    setQuery("");
    setResults([]);
    setSearched(false);
  }

  return (
    <Card className="w-full max-w-2xl">
      <h2 className="text-sm font-medium text-foreground/80 mb-3">
        Buscar por nombre
      </h2>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Artista o canción…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoComplete="off"
        />
        <Button type="button" onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Buscando…" : "Buscar"}
        </Button>
      </div>

      {searched && !loading && results.length === 0 && (
        <p className="text-sm text-foreground/50 mt-4">
          Sin resultados para <strong>&ldquo;{query}&rdquo;</strong>
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map((item) => (
            <ResultCard key={item.id} item={item} onPick={pickResult} />
          ))}
        </div>
      )}
    </Card>
  );
}

interface ResultCardProps {
  item: SearchResultItem;
  onPick: (item: SearchResultItem) => void;
}

function ResultCard({ item, onPick }: ResultCardProps) {
  const platform = detectPlatform(item.url);
  return (
    <button
      type="button"
      onClick={() => onPick(item)}
      className="flex gap-3 items-start rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06] hover:border-fuchsia-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
    >
      {item.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0 bg-white/5"
          loading="lazy"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-white/5 shrink-0 flex items-center justify-center text-foreground/30 text-xs">
          sin img
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">{item.title}</div>
        {item.uploader && (
          <div className="text-xs text-foreground/50 truncate mt-0.5">
            {item.uploader}
          </div>
        )}
        <div className="flex gap-2 mt-1.5">
          <span className="text-[10px] uppercase tracking-wider text-fuchsia-400/70 font-medium">
            {platform.name || "YouTube"}
          </span>
          {item.durationLabel && (
            <span className="text-[10px] text-foreground/40">{item.durationLabel}</span>
          )}
        </div>
      </div>
    </button>
  );
}
