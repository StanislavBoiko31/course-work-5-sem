import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { getPhotographers, getServices } from "../api/studioApi";

// Додаємо простий модальний компонент
const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, maxWidth: 500, margin: '80px auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button style={{ position: 'absolute', top: 8, right: 8, fontSize: 22, border: 'none', background: 'none', cursor: 'pointer' }} onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

const statusLabels = {
  pending: "Очікує",
  approved: "Підтверджено",
  cancelled: "Скасовано",
  completed: "Завершено"
};

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [photographerFilter, setPhotographerFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBooking, setModalBooking] = useState(null);
  const [nextBookingsUrl, setNextBookingsUrl] = useState(null);

  const fetchBookings = async (url = "/api/bookings/") => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(url);
      const data = res.data;
      setBookings(prev => url === "/api/bookings/" ? (data.results || data || []) : [...prev, ...(data.results || data || [])]);
      setNextBookingsUrl(data.next || null);
    } catch (err) {
      setError("Помилка завантаження: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const fetchAll = async () => {
      try {
        const [ph] = await Promise.all([
          getPhotographers()
        ]);
        setPhotographers(ph.data.results || ph.data);
      } catch (err) {
        setError("Помилка завантаження: " + (err.response?.data?.detail || err.message));
      } finally {
        // setLoading(false); // This was removed as loading is now managed by fetchBookings
      }
    };
    fetchAll();
  }, []);

  const handleStatus = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/bookings/${id}/`, { status: newStatus });
      setBookings(list => list.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err) {
      setError("Помилка зміни статусу: " + (err.response?.data?.detail || err.message));
    }
  };

  const filtered = bookings.filter(b => {
    let ok = true;
    if (statusFilter && b.status !== statusFilter) ok = false;
    if (photographerFilter && b.photographer?.id !== Number(photographerFilter)) ok = false;
    if (dateFilter && b.date !== dateFilter) ok = false;
    return ok;
  });

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Завантаження...</div>;
  return (
    <div className="container mt-4">
      <h2>Адміністрування фотосесій</h2>
      <div className="d-flex gap-3 mb-3 align-items-end">
        <div>
          <label className="form-label">Статус</label>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Всі</option>
            <option value="Очікує підтвердження">Очікує</option>
            <option value="Підтверджено адміністратором">Підтверджено адміністратором</option>
            <option value="Зроблено">Зроблено</option>
            <option value="Завершено">Завершено</option>
            <option value="Скасовано адміністратором">Скасовано адміністратором</option>
          </select>
        </div>
        <div>
          <label className="form-label">Майстер</label>
          <select className="form-select" value={photographerFilter} onChange={e => setPhotographerFilter(e.target.value)}>
            <option value="">Всі</option>
            {photographers.map(ph => (
              <option key={ph.id} value={ph.id}>{(ph.user?.first_name || "") + " " + (ph.user?.last_name || "")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Дата</label>
          <input type="date" className="form-control" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
      </div>
      <table className="table table-bordered table-hover mt-4" style={{ fontSize: 18 }}>
        <thead className="table-light">
          <tr>
            <th style={{ width: 60 }}>ID</th>
            <th style={{ width: 180 }}>Клієнт</th>
            <th style={{ width: 180 }}>Майстер</th>
            <th style={{ width: 180 }}>Послуга</th>
            <th style={{ width: 140 }}>Дата</th>
            <th style={{ width: 120 }}>Час</th>
            <th style={{ width: 120 }}>Статус</th>
            <th style={{ width: 220 }}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                {item.user
                  ? `${item.user.first_name || ""} ${item.user.last_name || ""}`
                  : `${item.guest_first_name || ""} ${item.guest_last_name || ""}`
                }
                <br />
                <span style={{ color: '#888', fontSize: 14 }}>
                  {item.user?.email || item.guest_email}
                </span>
              </td>
              <td>{item.photographer ? ((item.photographer.user?.first_name || "") + " " + (item.photographer.user?.last_name || "")).trim() : <span style={{ color: '#888' }}>немає</span>}</td>
              <td>{item.service_obj?.name || <span style={{ color: '#888' }}>немає</span>}</td>
              <td>{item.date}</td>
              <td>
                {item.start_time
                  ? item.end_time
                    ? `${item.start_time} - ${item.end_time}`
                    : item.start_time
                  : ""}
              </td>
              <td>{statusLabels[item.status] || item.status}</td>
              <td>
                {item.status?.toLowerCase().includes("очікує") && (
                  <>
                    <button className="btn btn-sm btn-success me-2" onClick={() => handleStatus(item.id, "Підтверджено адміністратором")}>Підтвердити</button>
                    <button className="btn btn-sm btn-danger me-2" onClick={() => handleStatus(item.id, "Скасовано адміністратором")}>Скасувати</button>
                  </>
                )}
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setModalBooking(item); setModalOpen(true); }}>Деталі</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {nextBookingsUrl && (
        <button onClick={() => fetchBookings(nextBookingsUrl)} style={{marginTop: 16}}>
          Показати ще
        </button>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        {modalBooking && (
          <div>
            <h4>Деталі замовлення #{modalBooking.id}</h4>
            <div><b>Клієнт:</b> {modalBooking.user ? `${modalBooking.user.first_name || ""} ${modalBooking.user.last_name || ""}` : `${modalBooking.guest_first_name || ""} ${modalBooking.guest_last_name || ""}`}</div>
            <div><b>Email:</b> {modalBooking.user?.email || modalBooking.guest_email}</div>
            <div><b>Майстер:</b> {modalBooking.photographer ? ((modalBooking.photographer.user?.first_name || "") + " " + (modalBooking.photographer.user?.last_name || "")).trim() : <span style={{ color: '#888' }}>немає</span>}</div>
            <div><b>Послуга:</b> {modalBooking.service_obj?.name || modalBooking.guest_service_name || <span style={{ color: '#888' }}>немає</span>}</div>
            {modalBooking.additional_services_data && modalBooking.additional_services_data.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <b>Додаткові послуги:</b>
                <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                  {modalBooking.additional_services_data.map((ads, idx) => (
                    <li key={idx}>
                      {ads.name} - {ads.price} грн
                      {ads.description && <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>({ads.description})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div><b>Дата:</b> {modalBooking.date}</div>
            <div><b>Час:</b> {modalBooking.start_time}{modalBooking.end_time ? ` - ${modalBooking.end_time}` : ''}</div>
            <div><b>Статус:</b> {statusLabels[modalBooking.status] || modalBooking.status}</div>
            <div><b>Ціна:</b> {modalBooking.price ? `${modalBooking.price} грн` : '—'}</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminBookingsPage; 