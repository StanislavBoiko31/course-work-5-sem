import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

const AdminPhotographersPage = () => {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPhotographers = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/api/photographers/admin/");
        setPhotographers(res.data.results || res.data);
      } catch (err) {
        setError("Помилка завантаження: " + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchPhotographers();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Завантаження...</div>;
  if (error) return <div style={{ color: "red", textAlign: "center", padding: 40 }}>{error}</div>;

  const handleToggleActive = async (ph) => {
    try {
      await axiosInstance.patch(`/api/photographers/admin/${ph.id}/toggle-active/`);
      // Оновити список після зміни
      const res = await axiosInstance.get("/api/photographers/admin/?t=" + Date.now());
      setPhotographers(res.data.results || res.data);
    } catch (err) {
      setError("Помилка зміни статусу: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="container mt-4">
      <h2>Адміністрування фотографів</h2>
      <button className="btn btn-success mb-3" style={{ float: 'right' }}>
        Додати майстра
      </button>
      <table className="table table-bordered table-hover mt-4">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Ім'я</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Статус</th>
            <th>Послуги</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {photographers.map(ph => (
            <tr key={ph.id}>
              <td>{ph.id}</td>
              <td>{ph.user?.first_name} {ph.user?.last_name}</td>
              <td>{ph.user?.email}</td>
              <td>{ph.phone}</td>
              <td style={{ color: ph.user?.is_active ? 'green' : 'red' }}>
                {ph.user?.is_active ? 'Активний' : 'Неактивний'}
              </td>
              <td>
                {ph.services && ph.services.length > 0
                  ? ph.services.map(s => s.name).filter(Boolean).join(", ")
                  : <span style={{ color: '#888' }}>немає</span>}
              </td>
              <td>
                {ph.user?.is_active ? (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleToggleActive(ph)}>Деактивувати</button>
                ) : (
                  <button className="btn btn-sm btn-outline-success" onClick={() => handleToggleActive(ph)}>Активувати</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPhotographersPage; 