import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { getServices, getPhotographers } from "../api/studioApi";

const initialForm = { image: null, description: "", service: "", photographer: "" };

const AdminPortfolioPage = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [services, setServices] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [studioPhotographerId, setStudioPhotographerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/api/portfolio/");
        setPortfolio(res.data.results || res.data);
      } catch (err) {
        setError("Помилка завантаження: " + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
    getServices().then(res => setServices(res.data.results || res.data)).catch(() => {});
    getPhotographers().then(res => {
      const phs = res.data.results || res.data;
      setPhotographers(phs);
      // Знаходимо фотографа 'Студія' або 'Ательє'
      const studio = phs.find(p => {
        const name = (p.user?.first_name || "") + " " + (p.user?.last_name || "");
        return name.toLowerCase().includes("студія") || name.toLowerCase().includes("ательє");
      });
      if (studio) setStudioPhotographerId(studio.id);
    }).catch(() => {});
  }, []);

  const openAddForm = () => {
    let defaultService = "";
    if (services.length > 0) defaultService = services[0].id;
    setForm({ ...initialForm, service: defaultService });
    setEditId(null);
    setShowForm(true);
    setError("");
  };

  const openEditForm = (item) => {
    setForm({ image: null, description: item.description || "", service: item.service?.id || "", photographer: item.photographer?.id || "" });
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
    if (!form.image && !editId) {
      setError("Оберіть файл для завантаження.");
      setSubmitting(false);
      return;
    }
    if (!form.service || String(form.service).trim() === "") {
      setError("Оберіть послугу.");
      setSubmitting(false);
      return;
    }
    const filteredPhotographers = photographers.filter(ph => Array.isArray(ph.services) && ph.services.some(s => String(s.id) === String(form.service)));
    if (!form.photographer || String(form.photographer).trim() === "" || !filteredPhotographers.some(ph => String(ph.id) === String(form.photographer))) {
      setError("Оберіть фотографа, який надає цю послугу.");
      setSubmitting(false);
      return;
    }
    const formData = new FormData();
    if (form.image) formData.append("image", form.image);
    formData.append("description", form.description);
    formData.append("service", String(form.service));
    formData.append("photographer", String(form.photographer));
    // DEBUG: log FormData
    for (let pair of formData.entries()) {
      console.log(pair[0]+ ': ' + pair[1]);
    }
    try {
      let res;
      if (editId) {
        res = await axiosInstance.patch(`/api/portfolio/${editId}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPortfolio(list => list.map(p => p.id === editId ? res.data : p));
      } else {
        res = await axiosInstance.post(`/api/portfolio/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPortfolio(list => [res.data, ...list]);
      }
      closeForm();
    } catch (err) {
      setError("Помилка збереження: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Видалити це фото?")) return;
    try {
      await axiosInstance.delete(`/api/portfolio/${item.id}/`);
      setPortfolio(portfolio.filter(p => p.id !== item.id));
    } catch (err) {
      setError("Помилка видалення: " + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Завантаження...</div>;
  return (
    <div className="container mt-4">
      <h2>Адміністрування портфоліо</h2>
      <button className="btn btn-success mb-3" style={{ float: 'right' }} onClick={openAddForm}>
        Додати фото
      </button>
      {showForm && (
        <form className="card p-3 mb-4" onSubmit={handleSubmit} encType="multipart/form-data">
          <h5>{editId ? "Редагування фото" : "Додавання фото"}</h5>
          <div className="mb-2">
            <label className="form-label">Фото {editId ? "(залиште порожнім, якщо не змінювати)" : "*"}</label>
            <input type="file" name="image" className="form-control" accept="image/*" onChange={handleChange} />
          </div>
          <div className="mb-2">
            <label className="form-label">Опис</label>
            <textarea name="description" className="form-control" value={form.description} onChange={handleChange} required />
          </div>
          <div className="mb-2">
            <label className="form-label">Послуга</label>
            <select name="service" className="form-select" value={form.service} onChange={handleChange} required>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label">Фотограф</label>
            <select name="photographer" className="form-select" value={form.photographer || studioPhotographerId || ""} onChange={handleChange} required disabled={!form.service}>
              <option value="" disabled>{form.service ? "Оберіть фотографа" : "Спочатку оберіть послугу"}</option>
              {photographers.filter(ph => Array.isArray(ph.services) && ph.services.some(s => String(s.id) === String(form.service))).map(ph => {
                const name = (ph.user?.first_name || "") + " " + (ph.user?.last_name || "");
                return <option key={ph.id} value={ph.id}>{name.trim() || ph.user?.username || ph.id}</option>;
              })}
            </select>
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
            <th>Опис</th>
            <th style={{ width: 180 }}>Послуга</th>
            <th style={{ width: 180 }}>Майстер</th>
            <th style={{ width: 160 }}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td><img src={item.image} alt="portfolio" style={{ maxWidth: 110, maxHeight: 80, objectFit: 'cover', borderRadius: 8 }} /></td>
              <td>{item.description}</td>
              <td>{item.service_obj?.name || <span style={{ color: '#888' }}>немає</span>}</td>
              <td>{item.photographer_obj ? ((item.photographer_obj.user?.first_name || "") + " " + (item.photographer_obj.user?.last_name || "")).trim() : <span style={{ color: '#888' }}>немає</span>}</td>
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

export default AdminPortfolioPage; 