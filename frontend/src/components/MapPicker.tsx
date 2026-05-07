import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

export type MapPosition = {
  latitude: number;
  longitude: number;
  label?: string;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export function MapPicker({
  value,
  onChange,
  height = 320,
}: {
  value: MapPosition | null;
  onChange: (position: MapPosition) => void;
  height?: number;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const initialPosition: [number, number] = [36.8065, 10.1815];
    const map = L.map(mapElementRef.current).setView(initialPosition, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    map.on("click", async (event) => {
      const latitude = Number(event.latlng.lat.toFixed(6));
      const longitude = Number(event.latlng.lng.toFixed(6));
      let label: string | undefined;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        );
        const data = await response.json();
        label = data.display_name || undefined;
      } catch {
        label = undefined;
      }
      onChangeRef.current({ latitude, longitude, label });
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;

    const latLng: [number, number] = [value.latitude, value.longitude];
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(latLng, {
        radius: 9,
        color: "#6366F1",
        fillColor: "#A855F7",
        fillOpacity: 0.85,
        weight: 3,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(latLng);
    }
    map.setView(latLng, Math.max(map.getZoom(), 13));
  }, [value]);

  const searchLocation = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || !data.length) setSearchError("No locations found.");
    } catch {
      setSearchError("Could not search locations. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (result: SearchResult) => {
    setResults([]);
    setQuery(result.display_name);
    onChange({
      latitude: Number(Number(result.lat).toFixed(6)),
      longitude: Number(Number(result.lon).toFixed(6)),
      label: result.display_name,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void searchLocation();
              }
            }}
            placeholder="Search a city, address, or place"
            className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface-elevated pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/70 focus:border-ring"
          />
        </div>
        <Button type="button" variant="secondary" onClick={searchLocation} disabled={searching}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search
        </Button>
      </div>
      {searchError && <Notice tone="error">{searchError}</Notice>}
      {results.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-1.5">
          {results.map((result) => (
            <button
              type="button"
              key={result.place_id}
              onClick={() => selectResult(result)}
              className="rounded-md px-3 py-2 text-left text-sm text-foreground/90 hover:bg-surface"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}
      <div
        ref={mapElementRef}
        className="overflow-hidden rounded-[var(--radius-md)] border border-border"
        style={{ minHeight: height, height }}
      />
    </div>
  );
}
