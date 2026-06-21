import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function createCustomIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

function FlyController({ flyTo }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) map.flyTo([flyTo.lat, flyTo.lng], 13, { duration: 1.5 });
  }, [flyTo]);
  return null;
}

function NearbyLoader({ onLoad, onLoading }) {
  const map = useMap();

  useEffect(() => {
    let timeout;

    const fetchNearby = async () => {
      const center = map.getCenter();
      const zoom = map.getZoom();

      // Adjust radius based on zoom level
      const radius = zoom >= 15 ? 2000 : zoom >= 13 ? 5000 : zoom >= 11 ? 15000 : 30000;

      const query = `
        [out:json][timeout:30];
        (
          node["amenity"="restaurant"](around:${radius},${center.lat},${center.lng});
          node["amenity"="cafe"](around:${radius},${center.lat},${center.lng});
          node["amenity"="fast_food"](around:${radius},${center.lat},${center.lng});
          node["amenity"="food_court"](around:${radius},${center.lat},${center.lng});
        );
        out body;
      `;

      onLoading(true);
      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        });
        const data = await res.json();
        onLoad(data.elements || []);
      } catch (e) {
        console.log('Overpass error:', e);
      } finally {
        onLoading(false);
      }
    };

    const debouncedFetch = () => {
      clearTimeout(timeout);
      timeout = setTimeout(fetchNearby, 800);
    };

    fetchNearby();
    map.on('moveend', debouncedFetch);
    return () => {
      map.off('moveend', debouncedFetch);
      clearTimeout(timeout);
    };
  }, []);

  return null;
}

export default function MapView({ restaurants, onMapClick, onSelect, tileType, flyTo }) {
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(false);

  const tiles = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  const savedIds = new Set(restaurants.map(r => r.name.toLowerCase()));

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#fff', padding: '8px 16px',
          borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <div style={{
            width: 14, height: 14, border: '2px solid #f97316',
            borderTop: '2px solid transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Loading nearby restaurants...
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <MapContainer center={[9.1771, 124.7242]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={tiles[tileType] || tiles.street} />
        <ClickHandler onMapClick={onMapClick} />
        <NearbyLoader onLoad={setNearby} onLoading={setLoading} />
        <FlyController flyTo={flyTo} />

        {nearby
          .filter(n => n.tags?.name && !savedIds.has(n.tags.name.toLowerCase()))
          .map(n => (
            <Marker
              key={`osm-${n.id}`}
              position={[n.lat, n.lon]}
              icon={createCustomIcon('#f97316')}
            >
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <strong>{n.tags?.name}</strong><br />
                  {n.tags?.cuisine && <span style={{ fontSize: 12, color: '#666' }}>
                    {n.tags.cuisine}
                  </span>}<br />
                  {n.tags?.['addr:street'] && <span style={{ fontSize: 11, color: '#999' }}>
                    {n.tags['addr:street']}
                  </span>}<br />
                  <span style={{ fontSize: 11, color: '#f97316' }}>Not in your tracker</span><br />
                  <button
                    className="btn-map-add"
                    onClick={() => onMapClick({ lat: n.lat, lng: n.lon })}
                  >
                    + Add to Tracker
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        {restaurants.map(r => (
          <Marker
            key={r._id}
            position={[r.location.coordinates[1], r.location.coordinates[0]]}
            icon={createCustomIcon(r.visited ? '#22c55e' : '#a855f7')}
          >
            <Popup>
              <div style={{ minWidth: 150 }}>
                <strong>{r.name}</strong><br />
                {r.category && <span style={{ fontSize: 12, color: '#666' }}>{r.category}</span>}<br />
                {r.rating && <span>{'⭐'.repeat(r.rating)}</span>}<br />
                {r.notes && <p style={{ fontSize: 12, margin: '4px 0' }}>{r.notes}</p>}
                <span style={{ fontSize: 11, color: r.visited ? '#22c55e' : '#a855f7' }}>
                  {r.visited ? '✅ Visited' : '💜 In your tracker'}
                </span><br />
                <button
                  className="btn-map-edit"
                  onClick={() => onSelect(r)}
                >
                  Edit
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}