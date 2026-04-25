import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { zipCoords, addPrivacyJitter } from "./zipCoords";

export default function MapView({ pledges }) {
  return (
    <section className="map-card">
      <h3>Neighborhood Crop Map 🗺️</h3>

      <MapContainer
        center={[34.2, -118.45]}
        zoom={11}
        style={{ height: "320px", width: "100%", borderRadius: "22px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pledges.map((pledge) => {
          const zip = String(pledge.zip || "").trim();
          const baseCoords = zipCoords[zip];

          if (!baseCoords) {
            console.warn("ZIP not supported yet:", zip);
            return null;
          }

          const position = addPrivacyJitter(baseCoords[0], baseCoords[1]);

          return (
            <Marker key={pledge.id} position={position}>
              <Popup>
                <strong>{pledge.crop}</strong>
                <br />
                {pledge.name}
                <br />
                ZIP {zip}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </section>
  );
}