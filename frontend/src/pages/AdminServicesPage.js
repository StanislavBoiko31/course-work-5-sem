import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

const initialForm = { name: "", description: "", price: "", duration: "", image: null, location_address: "" };

const AdminServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/api/services/");
        setServices(res.data.results || res.data);
      } catch (err) {
        setError("Помилка завантаження: " + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const openAddForm = () => {
    setForm(initialForm);
    setEditId(null);
    setShowForm(true);
    setError("");
  };

  const openEditForm = (item) => {
    setForm({ 
      name: item.name || "", 
      description: item.description || "", 
      price: item.price || "", 
      duration: item.duration || "", 
      image: null,
      location_address: item.location_address || ""
    });
    setEditId(item.id);
    setShowForm(true);
    setError("");
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(initialForm);
    setEditId(null);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm(f => ({ ...f, image: files[0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    if (!form.name || !form.price || !form.duration) {
      setError("Заповніть всі обов'язкові поля (назва, ціна, тривалість)");
      setSubmitting(false);
      return;
    }
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("duration", form.duration);
    if (form.location_address) formData.append("location_address", form.location_address);
    if (form.image) formData.append("image", form.image);
    try {
      let res;
      if (editId) {
        res = await axiosInstance.put(`/api/services/${editId}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setServices(list => list.map(s => s.id === editId ? res.data : s));
      } else {
        res = await axiosInstance.post(`/api/services/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setServices(list => [res.data, ...list]);
      }
      closeForm();
    } catch (err) {
      setError("Помилка збереження: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Всі фото, що належать до цієї послуги, також будуть видалені. Ви впевнені?")) return;
    try {
      await axiosInstance.delete(`/api/services/${item.id}/`);
      setServices(services.filter(s => s.id !== item.id));
    } catch (err) {
      setError("Помилка видалення: " + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Завантаження...</div>;
  return (
    <div className="container mt-4">
      <h2>Адміністрування послуг</h2>
      <button className="btn btn-success mb-3" style={{ float: 'right' }} onClick={openAddForm}>
        Додати послугу
      </button>
      {showForm && (
        <form className="card p-3 mb-4" onSubmit={handleSubmit} encType="multipart/form-data">
          <h5>{editId ? "Редагування послуги" : "Додавання послуги"}</h5>
          <div className="mb-2">
            <label className="form-label">Назва *</label>
            <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
          </div>
          <div className="mb-2">
            <label className="form-label">Опис</label>
            <textarea name="description" className="form-control" value={form.description} onChange={handleChange} />
          </div>
          <div className="mb-2">
            <label className="form-label">Адреса локації</label>
            <textarea 
              name="location_address" 
              className="form-control" 
              value={form.location_address} 
              onChange={handleChange}
              placeholder="Адреса студії або локація клієнта (наприклад, для фотосесії весілля). Залиште порожнім, якщо локація вибирається окремо."
              rows="2"
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Ціна (грн) *</label>
            <input type="number" name="price" className="form-control" value={form.price} onChange={handleChange} required />
          </div>
          <div className="mb-2">
            <label className="form-label">Тривалість (хв) *</label>
            <input type="number" name="duration" className="form-control" value={form.duration} onChange={handleChange} required />
          </div>
          <div className="mb-2">
            <label className="form-label">Фото</label>
            <input type="file" name="image" className="form-control" accept="image/*" onChange={handleChange} />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit" disabled={submitting}>{editId ? "Зберегти" : "Додати"}</button>
            <button className="btn btn-secondary" type="button" onClick={closeForm} disabled={submitting}>Скасувати</button>
          </div>
        </form>
      )}
      <table className="table table-bordered table-hover mt-4" style={{ fontSize: 18 }}>
        <thead className="table-light">
          <tr>
            <th style={{ width: 60 }}>ID</th>
            <th style={{ width: 120 }}>Фото</th>
            <th style={{ width: 180 }}>Назва</th>
            <th>Опис</th>
            <th style={{ width: 150 }}>Адреса локації</th>
            <th style={{ width: 100 }}>Ціна</th>
            <th style={{ width: 120 }}>Тривалість</th>
            <th style={{ width: 220 }}>Майстри</th>
            <th style={{ width: 160 }}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {services.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.image && <img src={item.image} alt="service" style={{ maxWidth: 110, maxHeight: 80, objectFit: 'cover', borderRadius: 8 }} />}</td>
              <td style={{ fontWeight: 500 }}>{item.name}</td>
              <td>{item.description}</td>
              <td>{item.location_address || <span style={{ color: '#888' }}>не вказано</span>}</td>
              <td>{item.price}</td>
              <td>{item.duration}</td>
              <td>
                {item.photographers && item.photographers.length > 0
                  ? item.photographers.map(ph => (ph.user?.first_name || "") + " " + (ph.user?.last_name || "")).join(", ")
                  : <span style={{ color: '#888' }}>немає</span>}
              </td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditForm(item)}>Редагувати</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item)}>Видалити</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminServicesPage; 