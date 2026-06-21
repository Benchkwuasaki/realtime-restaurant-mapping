import { useState, useEffect } from 'react';

export default function RestaurantForm({ onSubmit, onCancel, selected, clickedPos }) {
  const [form, setForm] = useState({
    name: '', category: '', rating: '', notes: '', visited: false,
    lat: '', lng: ''
  });

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name || '',
        category: selected.category || '',
        rating: selected.rating || '',
        notes: selected.notes || '',
        visited: selected.visited || false,
        lat: selected.location.coordinates[1],
        lng: selected.location.coordinates[0],
      });
    } else if (clickedPos) {
      setForm(f => ({ ...f, lat: clickedPos.lat, lng: clickedPos.lng }));
    }
  }, [selected, clickedPos]);

  const handle = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = e => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      category: form.category,
      rating: form.rating ? Number(form.rating) : null,
      notes: form.notes,
      visited: form.visited,
      location: {
        type: 'Point',
        coordinates: [parseFloat(form.lng), parseFloat(form.lat)]
      }
    });
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input name="name" placeholder="Restaurant name *" value={form.name} onChange={handle} required />
      <input name="category" placeholder="Category (e.g. Japanese)" value={form.category} onChange={handle} />
      <input name="rating" type="number" min="1" max="5" placeholder="Rating (1-5)" value={form.rating} onChange={handle} />
      <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handle} />
      <label>
        <input name="visited" type="checkbox" checked={form.visited} onChange={handle} /> Visited
      </label>
      <input name="lat" placeholder="Latitude" value={form.lat} onChange={handle} required />
      <input name="lng" placeholder="Longitude" value={form.lng} onChange={handle} required />
      <small style={{ color: '#888' }}>Tip: click on the map to auto-fill coordinates</small>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1 }}>{selected ? 'Update' : 'Add'} Restaurant</button>
        <button type="button" className="btn-cancel" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
      </div>
    </form>
  );
}