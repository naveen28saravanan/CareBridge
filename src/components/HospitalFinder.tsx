import { useMemo, useState } from "react";
import {
  Ambulance,
  BedDouble,
  Clock3,
  ExternalLink,
  Hospital as HospitalIcon,
  LocateFixed,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  findNearbyHospitals,
  getCurrentLocation,
  isAvailabilityCurrent,
  osmEmbedUrl,
} from "../services/hospitals";
import type { Hospital } from "../types";
import { Badge, Button, Card, SectionHeading, Toggle } from "./ui";

export function HospitalFinder() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [origin, setOrigin] = useState({ latitude: 13.0827, longitude: 80.2707 });
  const [source, setSource] = useState<"openstreetmap" | "demo" | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [verifiedIcuOnly, setVerifiedIcuOnly] = useState(false);

  const visible = useMemo(
    () =>
      hospitals.filter((hospital) => {
        if (emergencyOnly && hospital.osmEmergencyTag !== true) return false;
        if (
          verifiedIcuOnly &&
          (!isAvailabilityCurrent(hospital) ||
            (hospital.availability.icuBedsAvailable ?? 0) <= 0)
        ) {
          return false;
        }
        return true;
      }),
    [emergencyOnly, hospitals, verifiedIcuOnly],
  );

  const locate = async () => {
    setLoading(true);
    setWarning(null);
    const location = await getCurrentLocation();
    setOrigin(location);
    const result = await findNearbyHospitals(location);
    setHospitals(result.hospitals);
    setSource(result.source);
    setWarning(result.warning ?? null);
    setLoading(false);
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Nearby hospitals"
        subtitle="Keyless OpenStreetMap discovery with a separate verified ICU-availability layer."
        action={
          <Button icon={<LocateFixed size={18} />} onClick={locate} disabled={loading}>
            {loading ? "Locating…" : "Find hospitals near me"}
          </Button>
        }
      />

      <Card tone="critical" className="hospital-warning">
        <TriangleAlert size={23} />
        <div>
          <strong>Do not rely on a map during a life-threatening emergency.</strong>
          <p>
            Call 112. ICU and emergency availability can change within minutes; call the
            hospital unless a current verified source is shown.
          </p>
        </div>
        <a className="button button--danger" href="tel:112">
          <Phone size={18} />
          <span>Call 112</span>
        </a>
      </Card>

      <div className="hospital-layout">
        <Card className="map-card">
          <iframe
            title="OpenStreetMap hospital area"
            src={osmEmbedUrl(origin.latitude, origin.longitude)}
            loading="lazy"
          />
          <footer>
            <span>
              <MapPin size={15} /> {origin.latitude.toFixed(4)},{" "}
              {origin.longitude.toFixed(4)}
            </span>
            <a
              href={`https://www.openstreetmap.org/?mlat=${origin.latitude}&mlon=${origin.longitude}#map=14/${origin.latitude}/${origin.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              Open map <ExternalLink size={14} />
            </a>
          </footer>
        </Card>

        <div className="page-stack hospital-results">
          <Card className="filter-card">
            <div>
              <strong>Result filters</strong>
              <p className="muted">
                Emergency tags come from map data; ICU status requires verification.
              </p>
            </div>
            <Toggle
              checked={emergencyOnly}
              onChange={setEmergencyOnly}
              label="Mapped emergency service"
            />
            <Toggle
              checked={verifiedIcuOnly}
              onChange={setVerifiedIcuOnly}
              label="Current verified ICU beds"
            />
          </Card>

          {source ? (
            <div className="result-source">
              <Badge tone={source === "openstreetmap" ? "green" : "amber"}>
                {source === "openstreetmap"
                  ? "OpenStreetMap live query"
                  : "Fictional demo facilities"}
              </Badge>
              <span>{visible.length} facilities shown</span>
            </div>
          ) : null}

          {warning ? (
            <Card tone="critical" className="inline-alert">
              <TriangleAlert size={18} />
              <span>{warning}</span>
            </Card>
          ) : null}

          {visible.length === 0 ? (
            <Card className="hospital-empty">
              <HospitalIcon size={40} />
              <h3>No hospital results loaded</h3>
              <p>
                Allow location access and run the nearby search. Chennai is used as the safe
                demonstration fallback.
              </p>
              <Button icon={<RefreshCw size={17} />} onClick={locate} disabled={loading}>
                Load nearby hospitals
              </Button>
            </Card>
          ) : (
            visible.map((hospital) => {
              const current = isAvailabilityCurrent(hospital);
              const icu = hospital.availability.icuBedsAvailable;
              return (
                <Card key={hospital.id} className="hospital-card">
                  <div className="hospital-card__header">
                    <span className="hospital-card__icon">
                      <HospitalIcon size={22} />
                    </span>
                    <div>
                      <h3>{hospital.name}</h3>
                      <p>
                        {hospital.distanceKm.toFixed(1)} km •{" "}
                        {hospital.address ?? "Address not mapped"}
                      </p>
                    </div>
                    <Badge
                      tone={
                        hospital.osmEmergencyTag === true
                          ? "green"
                          : hospital.osmEmergencyTag === false
                            ? "red"
                            : "neutral"
                      }
                    >
                      <Ambulance size={13} />
                      {hospital.osmEmergencyTag === true
                        ? "Emergency mapped"
                        : hospital.osmEmergencyTag === false
                          ? "No emergency tag"
                          : "Emergency unknown"}
                    </Badge>
                  </div>

                  <div className="availability-grid">
                    <div>
                      <BedDouble size={18} />
                      <span>ICU beds</span>
                      <strong>{current && icu !== null ? icu : "Call to verify"}</strong>
                    </div>
                    <div>
                      <ShieldCheck size={18} />
                      <span>Availability source</span>
                      <strong>
                        {hospital.availability.source === "unknown"
                          ? "Not connected"
                          : hospital.availability.source.replaceAll("_", " ")}
                      </strong>
                    </div>
                    <div>
                      <Clock3 size={18} />
                      <span>Last verified</span>
                      <strong>
                        {hospital.availability.lastVerifiedAt
                          ? new Date(
                              hospital.availability.lastVerifiedAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Not available"}
                      </strong>
                    </div>
                  </div>

                  <footer className="hospital-card__actions">
                    {hospital.phone ? (
                      <a
                        className="button button--outline"
                        href={`tel:${hospital.phone.replaceAll(" ", "")}`}
                      >
                        <Phone size={17} />
                        <span>Call hospital</span>
                      </a>
                    ) : (
                      <Button variant="outline" disabled>
                        Phone not mapped
                      </Button>
                    )}
                    <a
                      className="button button--secondary"
                      href={`https://www.openstreetmap.org/?mlat=${hospital.latitude}&mlon=${hospital.longitude}#map=17/${hospital.latitude}/${hospital.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin size={17} />
                      <span>Directions</span>
                    </a>
                  </footer>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
