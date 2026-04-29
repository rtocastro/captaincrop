import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { zipCoords, addPrivacyJitter } from "./zipCoords";
import { DivIcon } from "leaflet";

const getCropEmoji = (crop = "") => {
  const lower = crop.toLowerCase();

  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("pepper")) return "🌶️";
  if (lower.includes("lettuce")) return "🥬";
  if (lower.includes("carrot")) return "🥕";
  if (lower.includes("corn")) return "🌽";
  if (lower.includes("potato")) return "🥔";
  if (lower.includes("strawberry")) return "🍓";
  if (lower.includes("watermelon")) return "🍉";
  if (lower.includes("dragon")) return "🐉";
  if (lower.includes("herb") || lower.includes("basil") || lower.includes("mint")) return "🌿";

  return "🌱";
};

const createEmojiIcon = (emoji) =>
  new DivIcon({
    html: `<div class="emoji-marker">${emoji}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

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
            return (
              <Marker key={pledge.id} position={[34.2, -118.45]}>
                <Popup>
                  ZIP not supported yet: {zip}
                </Popup>
              </Marker>
            );
          }
          const position = addPrivacyJitter(baseCoords[0], baseCoords[1]);

          return (
            <Marker
              key={pledge.id}
              position={position}
              icon={createEmojiIcon(getCropEmoji(pledge.crop))}
            >
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