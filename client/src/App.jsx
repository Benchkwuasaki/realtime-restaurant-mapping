import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Map, Satellite, Search } from 'lucide-react';
import MapView from './components/MapView';
import RestaurantForm from './components/RestaurantForm';
import RestaurantList from './components/RestaurantList';

const API = 'http://localhost:5000/api/restaurants';

export default function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [clickedPos, setClickedPos] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [tileType, setTileType] = useState('street');
  const [search, setSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [flyTo, setFlyTo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async () => {
    const res = await axios.get(API);
    setRestaurants(res.data);
  };

  const handleMapClick = (latlng) => {
    setSelected(null); setClickedPos(latlng); setShowForm(true);
  };

  const handleSelect = (r) => {
    setSelected(r); setClickedPos(null); setShowForm(true);
  };

  const handleSubmit = async (data) => {
    if (selected) await axios.put(`${API}/${selected._id}`, data);
    else await axios.post(API, data);
    setShowForm(false); setSelected(null); setClickedPos(null);
    fetchRestaurants();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this restaurant?')) return;
    await axios.delete(`${API}/${id}`);
    fetchRestaurants();
  };

  const handleLocationSearch = async (e) => {
    const val = e.target.value;
    setLocationSearch(val);
    if (val.length < 3) { setSuggestions([]); return; }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`);
    const data = await res.json();
    setSuggestions(data);
  };

  const handleSuggestionClick = (place) => {
    setFlyTo({ lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name });
    setLocationSearch(place.display_name.split(',')[0]);
    setSuggestions([]);
  };

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.category && r.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{
        width: 300, display: 'flex', flexDirection: 'column',
        background: '#f9fafb', borderRight: '1px solid #e5e7eb'
      }}>
        <div style={{ padding: '16px 16px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1f2937' }}>
            Restaurant Tracker
          </h2>
          {!showForm && (
            <input
              placeholder="Search name or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {showForm ? (
            <RestaurantForm
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setSelected(null); setClickedPos(null); }}
              selected={selected}
              clickedPos={clickedPos}
            />
          ) : (
            <RestaurantList
              restaurants={filtered}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {/* Location search bar on map */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, width: 340
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} />
            <input
              value={locationSearch}
              onChange={handleLocationSearch}
              placeholder="Search province, city, country..."
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13,
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)', background: '#fff'
              }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#fff', borderRadius: 8, marginTop: 4,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 2000
              }}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                      borderBottom: '1px solid #f3f4f6', color: '#374151'
                    }}
                    onMouseEnter={e => e.target.style.background = '#f9fafb'}
                    onMouseLeave={e => e.target.style.background = '#fff'}
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map/Satellite toggle */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1000,
          display: 'flex', gap: 6, background: '#fff',
          borderRadius: 8, padding: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <button
            className={`btn-tile${tileType === 'street' ? ' active' : ''}`}
            onClick={() => setTileType('street')}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Map size={14} /> Street
          </button>
          <button
            className={`btn-tile${tileType === 'satellite' ? ' active' : ''}`}
            onClick={() => setTileType('satellite')}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Satellite size={14} /> Satellite
          </button>
        </div>

        <MapView
          restaurants={restaurants}
          onMapClick={handleMapClick}
          onSelect={handleSelect}
          tileType={tileType}
          flyTo={flyTo}
        />
      </div>
    </div>
  );
}