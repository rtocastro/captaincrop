import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapView({ pledges }) {
  return (
    <section className="map-card">
      <h3>Neighborhood Crop Map 🗺️</h3>

      <MapContainer
        center={[34.2, -118.45]}
        zoom={12}
        style={{ height: "320px", width: "100%", borderRadius: "22px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pledges.map((pledge) => (
          <Marker key={pledge.id} position={[34.2, -118.45]}>
            <Popup>
              <strong>{pledge.crop}</strong>
              <br />
              {pledge.name} · {pledge.neighborhood}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}