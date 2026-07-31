import type { Hospital, HospitalAvailability } from "../types";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
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
  return {
    emergencyOpen: emergencyTag,
    icuBedsAvailable: null,
    ventilatorBedsAvailable: null,
    source: "unknown",
    lastVerifiedAt: null,
    verificationExpiresAt: null,
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
    tags.emergency === "yes" ? true : tags.emergency === "no" ? false : null;
  const beds = Number.parseInt(tags.beds ?? "", 10);
  return {
    id: `osm-${element.id}`,
    name: tags.name ?? "Hospital",
    latitude,
    longitude,
    distanceKm: distanceKm(origin.latitude, origin.longitude, latitude, longitude),
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    address:
      [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
        .filter(Boolean)
        .join(", ") || null,
    osmEmergencyTag: emergency,
    totalBedsTag: Number.isFinite(beds) ? beds : null,
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
      name: "CareBridge City Hospital — Demo",
      latitude: 13.0878,
      longitude: 80.2785,
      phone: "+91 44 4000 1122",
      address: "Chennai, Tamil Nadu",
      osmEmergencyTag: true,
      totalBedsTag: 220,
      availability: demoAvailability(true, 4, 2),
    },
    {
      id: "demo-2",
      name: "North Chennai Medical Centre — Demo",
      latitude: 13.1021,
      longitude: 80.2562,
      phone: "+91 44 4000 2233",
      address: "Chennai, Tamil Nadu",
      osmEmergencyTag: true,
      totalBedsTag: 140,
      availability: demoAvailability(true, 1, 0),
    },
    {
      id: "demo-3",
      name: "Community Care Hospital — Demo",
      latitude: 13.0712,
      longitude: 80.2428,
      phone: "+91 44 4000 3344",
      address: "Chennai, Tamil Nadu",
      osmEmergencyTag: null,
      totalBedsTag: 80,
      availability: unknownAvailability(null),
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
  radiusMetres = 12_000,
): Promise<{ hospitals: Hospital[]; source: "openstreetmap" | "demo"; warning?: string }> {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="hospital"](around:${radiusMetres},${origin.latitude},${origin.longitude});
      way["amenity"="hospital"](around:${radiusMetres},${origin.latitude},${origin.longitude});
      relation["amenity"="hospital"](around:${radiusMetres},${origin.latitude},${origin.longitude});
    );
    out center tags;
  `;

  try {
    const response = await fetch(
      `${OVERPASS_ENDPOINT}?data=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    if (!response.ok) throw new Error(`Hospital search returned ${response.status}`);
    const payload = (await response.json()) as OverpassResponse;
    const hospitals = payload.elements
      .map((element) => parseElement(element, origin))
      .filter((hospital): hospital is Hospital => hospital !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);
    if (hospitals.length === 0) throw new Error("No mapped hospitals found");
    return { hospitals, source: "openstreetmap" };
  } catch (error) {
    return {
      hospitals: demoHospitals(origin),
      source: "demo",
      warning:
        error instanceof Error
          ? `Open map search unavailable: ${error.message}. Showing fictional demonstration facilities.`
          : "Open map search unavailable. Showing fictional demonstration facilities.",
    };
  }
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
