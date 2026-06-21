import { MapPin, Star, Pencil, Trash2, CheckCircle, Circle } from 'lucide-react';

export default function RestaurantList({ restaurants, onSelect, onDelete }) {
  if (restaurants.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>
        <MapPin size={32} style={{ marginBottom: 8 }} />
        <p>No restaurants yet.</p>
        <p style={{ fontSize: 12 }}>Click anywhere on the map to add one!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {restaurants.map(r => (
        <div key={r._id} style={{
          background: '#fff', borderRadius: 10, padding: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <MapPin size={14} color="#4f87f5" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</span>
              </div>
              {r.category && (
                <span style={{
                  fontSize: 11, background: '#eef2ff', color: '#4f87f5',
                  padding: '2px 8px', borderRadius: 999, display: 'inline-block', marginBottom: 4
                }}>
                  {r.category}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {r.rating && [...Array(r.rating)].map((_, i) => (
                  <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                ))}
                {r.rating && [...Array(5 - r.rating)].map((_, i) => (
                  <Star key={i} size={12} color="#ddd" />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                {r.visited
                  ? <CheckCircle size={12} color="#22c55e" />
                  : <Circle size={12} color="#aaa" />}
                <span style={{ fontSize: 11, color: r.visited ? '#22c55e' : '#aaa' }}>
                  {r.visited ? 'Visited' : 'Not visited'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn-icon-edit" onClick={() => onSelect(r)}>
                <Pencil size={13} />
              </button>
              <button className="btn-icon-delete" onClick={() => onDelete(r._id)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          {r.notes && <p style={{ fontSize: 12, color: '#888', marginTop: 6, borderTop: '1px solid #f0f0f0', paddingTop: 6 }}>{r.notes}</p>}
        </div>
      ))}
    </div>
  );
}