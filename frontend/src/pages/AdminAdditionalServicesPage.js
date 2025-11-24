import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

const initialForm = { name: "", description: "", price: "" };

const AdminAdditionalServicesPage = () => {
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
        const res = await axiosInstance.get("/api/additional-services/");
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
    setForm({ name: item.name || "", description: item.description || "", price: item.price || "" });
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
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    if (!form.name || !form.price) {
      setError("Заповніть всі обов'язкові поля (назва, ціна)");
      setSubmitting(false);
      return;
    }
    try {
      let res;
      if (editId) {
        res = await axiosInstance.put(`/api/additional-services/${editId}/`, form);
        setServices(list => list.map(s => s.id === editId ? res.data : s));
      } else {
        res = await axiosInstance.post(`/api/additional-services/`, form);
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
    if (!window.confirm("Ви впевнені, що хочете видалити цю додаткову послугу?")) return;
    try {
      await axiosInstance.delete(`/api/additional-services/${item.id}/`);
      setServices(services.filter(s => s.id !== item.id));
    } catch (err) {
      setError("Помилка видалення: " + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Завантаження...</div>;
  return (
    <div className="container mt-4">
      <h2>Адміністрування додаткових послуг</h2>
      <button className="btn btn-success mb-3" style={{ float: 'right' }} onClick={openAddForm}>
        Додати додаткову послугу
      </button>
      {showForm && (
        <form className="card p-3 mb-4" onSubmit={handleSubmit}>
          <h5>{editId ? "Редагування додаткової послуги" : "Додавання додаткової послуги"}</h5>
          <div className="mb-2">
            <label className="form-label">Назва *</label>
            <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
          </div>
          <div className="mb-2">
            <label className="form-label">Опис</label>
            <textarea name="description" className="form-control" value={form.description} onChange={handleChange} />
          </div>
          <div className="mb-2">
            <label className="form-label">Ціна (грн) *</label>
            <input type="number" step="0.01" name="price" className="form-control" value={form.price} onChange={handleChange} required />
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
            <th style={{ width: 250 }}>Назва</th>
            <th>Опис</th>
            <th style={{ width: 120 }}>Ціна</th>
            <th style={{ width: 160 }}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {services.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td style={{ fontWeight: 500 }}>{item.name}</td>
              <td>{item.description || <span style={{ color: '#888' }}>немає опису</span>}</td>
              <td>{item.price} грн</td>
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

export default AdminAdditionalServicesPage;
