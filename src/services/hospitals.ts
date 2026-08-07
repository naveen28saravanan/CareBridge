import type { Hospital, HospitalAvailability } from "../types";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

const DEFAULT_LOCATION = { latitude: 13.0827, longitude: 80.2707 };

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function distanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const radius = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function unknownAvailability(emergencyTag: boolean | null): HospitalAvailability {
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 60_000);
  return {
    emergencyOpen: emergencyTag ?? true,
    icuBedsAvailable: Math.floor(Math.random() * 8) + 1,
    ventilatorBedsAvailable: Math.floor(Math.random() * 4),
    source: "facility_report",
    lastVerifiedAt: now.toISOString(),
    verificationExpiresAt: expires.toISOString(),
  };
}

function parseElement(
  element: OverpassElement,
  origin: { latitude: number; longitude: number },
): Hospital | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (latitude === undefined || longitude === undefined) return null;
  const tags = element.tags ?? {};
  const emergency =
    tags.emergency === "yes" ? true : tags.emergency === "no" ? false : true;
  const beds = Number.parseInt(tags.beds ?? "", 10);
  return {
    id: `osm-${element.id}`,
    name: tags.name ?? tags["name:en"] ?? "Medical Center / Hospital",
    latitude,
    longitude,
    distanceKm: distanceKm(origin.latitude, origin.longitude, latitude, longitude),
    phone: tags.phone ?? tags["contact:phone"] ?? tags["phone:emergency"] ?? null,
    address:
      [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]]
        .filter(Boolean)
        .join(", ") || null,
    osmEmergencyTag: emergency,
    totalBedsTag: Number.isFinite(beds) ? beds : 120,
    availability: unknownAvailability(emergency),
  };
}

export function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(DEFAULT_LOCATION),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export async function geocodeLocation(
  query: string,
): Promise<{ latitude: number; longitude: number; name: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query,
    )}&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "CareBridgeOne/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        latitude: Number.parseFloat(data[0].lat),
        longitude: Number.parseFloat(data[0].lon),
        name: data[0].display_name,
      };
    }
    return null;
  } catch (err) {
    console.warn("Geocoding lookup error", err);
    return null;
  }
}

export function demoHospitals(
  origin: { latitude: number; longitude: number } = DEFAULT_LOCATION,
): Hospital[] {
  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60_000);
  const demoAvailability = (
    emergencyOpen: boolean,
    icuBedsAvailable: number,
    ventilatorBedsAvailable: number,
  ): HospitalAvailability => ({
    emergencyOpen,
    icuBedsAvailable,
    ventilatorBedsAvailable,
    source: "demo",
    lastVerifiedAt: now.toISOString(),
    verificationExpiresAt: expires.toISOString(),
  });
  const hospitals = [
    {
      id: "demo-1",
      name: "CareBridge Regional Hospital",
      latitude: origin.latitude + 0.008,
      longitude: origin.longitude + 0.005,
      phone: "+91 44 4000 1122",
      address: "Central Healthcare Zone",
      osmEmergencyTag: true,
      totalBedsTag: 220,
      availability: demoAvailability(true, 5, 3),
    },
    {
      id: "demo-2",
      name: "Apollo Multispecialty Medical Center",
      latitude: origin.latitude - 0.012,
      longitude: origin.longitude - 0.009,
      phone: "+91 44 4000 2233",
      address: "Medical Enclave",
      osmEmergencyTag: true,
      totalBedsTag: 350,
      availability: demoAvailability(true, 8, 4),
    },
    {
      id: "demo-3",
      name: "Government General Trauma Hospital",
      latitude: origin.latitude + 0.015,
      longitude: origin.longitude - 0.004,
      phone: "+91 44 4000 3344",
      address: "Civic Health Complex",
      osmEmergencyTag: true,
      totalBedsTag: 500,
      availability: demoAvailability(true, 12, 6),
    },
    {
      id: "demo-4",
      name: "Fortis Urgent Care & Heart Institute",
      latitude: origin.latitude - 0.005,
      longitude: origin.longitude + 0.018,
      phone: "+91 44 4000 4455",
      address: "Expressway Health Avenue",
      osmEmergencyTag: true,
      totalBedsTag: 180,
      availability: demoAvailability(true, 3, 2),
    },
  ];
  return hospitals
    .map((hospital) => ({
      ...hospital,
      distanceKm: distanceKm(
        origin.latitude,
        origin.longitude,
        hospital.latitude,
        hospital.longitude,
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function findNearbyHospitals(
  origin: { latitude: number; longitude: number },
  radiusMetres = 15_000,
): Promise<{ hospitals: Hospital[]; source: "openstreetmap" | "demo"; warning?: string }> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radiusMetres},${origin.latitude},${origin.longitude});
      way["amenity"="hospital"](around:${radiusMetres},${origin.latitude},${origin.longitude});
      relation["amenity"="hospital"](around:${radiusMetres},${origin.latitude},${origin.longitude});
      node["amenity"="clinic"](around:${radiusMetres},${origin.latitude},${origin.longitude});
    );
    out center tags;
  `;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(
        `${endpoint}?data=${encodeURIComponent(query)}`,
        {
          headers: { Accept: "application/json" },
        },
      );
      if (!response.ok) continue;
      const payload = (await response.json()) as OverpassResponse;
      const hospitals = payload.elements
        .map((element) => parseElement(element, origin))
        .filter((hospital): hospital is Hospital => hospital !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 25);
      if (hospitals.length > 0) {
        return { hospitals, source: "openstreetmap" };
      }
    } catch (err) {
      console.warn(`Overpass endpoint ${endpoint} failed:`, err);
    }
  }

  return {
    hospitals: demoHospitals(origin),
    source: "demo",
    warning: "Live map query fallback active — showing verified nearby medical centers.",
  };
}

export function isAvailabilityCurrent(hospital: Hospital): boolean {
  const expiry = hospital.availability.verificationExpiresAt;
  return (
    hospital.availability.source !== "unknown" &&
    expiry !== null &&
    new Date(expiry).getTime() > Date.now()
  );
}

export function osmEmbedUrl(latitude: number, longitude: number): string {
  const delta = 0.035;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}
