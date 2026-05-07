import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Warehouse } from "@/types/domain";

export function WarehouseMap({
  warehouses,
  selectedId,
  onSelect,
  height = 360,
}: {
  warehouses: Warehouse[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([36.8065, 10.1815], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const points = warehouses.filter(
      (warehouse) =>
        typeof warehouse.latitude === "number" && typeof warehouse.longitude === "number",
    );

    points.forEach((warehouse) => {
      const lat = warehouse.latitude as number;
      const lng = warehouse.longitude as number;
      const isSelected = warehouse._id === selectedId;
      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 12 : 9,
        color: isSelected ? "rgb(99,102,241)" : "rgb(168,85,247)",
        fillColor: isSelected ? "rgb(99,102,241)" : "rgb(168,85,247)",
        fillOpacity: isSelected ? 0.9 : 0.7,
        weight: isSelected ? 3 : 2,
      })
        .bindTooltip(`<strong>${warehouse.name}</strong><br/>${warehouse.location || ""}`, {
          direction: "top",
          opacity: 0.95,
          className: "leaflet-warehouse-tip",
        })
        .on("click", () => onSelect?.(warehouse._id));

      const pulse = L.circleMarker([lat, lng], {
        radius: isSelected ? 22 : 18,
        color: isSelected ? "rgb(99,102,241)" : "rgb(168,85,247)",
        fillColor: "transparent",
        weight: 1,
        opacity: 0.4,
        className: "warehouse-pin-pulse",
      });

      pulse.addTo(layer);
      marker.addTo(layer);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(
        points.map((warehouse) => [
          warehouse.latitude as number,
          warehouse.longitude as number,
        ]),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [warehouses, selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-[var(--radius-md)] border border-border"
      style={{ height, minHeight: height }}
    />
  );
}
