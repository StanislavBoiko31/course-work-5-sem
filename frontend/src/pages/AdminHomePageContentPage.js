import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

const AdminHomePageContentPage = () => {
  const [content, setContent] = useState({
    title: "",
    description: "",
    contact_emails: [],
    contact_phones: [],
    contact_addresses: [],
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/api/portfolio/homepage-content/");
        const data = res.data;
        // Конвертуємо старі поля в нові списки для зворотної сумісності
        setContent({
          title: data.title || "",
          description: data.description || "",
          contact_emails: data.contact_emails && data.contact_emails.length > 0 
            ? data.contact_emails 
            : (data.contact_email ? [data.contact_email] : []),
          contact_phones: data.contact_phones && data.contact_phones.length > 0 
            ? data.contact_phones 
            : (data.contact_phone ? [data.contact_phone] : []),
          contact_addresses: data.contact_addresses && data.contact_addresses.length > 0 
            ? data.contact_addresses 
            : (data.contact_address ? [data.contact_address] : []),
          is_active: data.is_active !== undefined ? data.is_active : true
        });
      } catch (err) {
        setError("Помилка завантаження: " + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContent(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError("");
    setSuccess("");
  };

  const handleListChange = (field, index, value) => {
    setContent(prev => {
      const newList = [...prev[field]];
      newList[index] = value;
      return { ...prev, [field]: newList };
    });
  };

  const addListItem = (field) => {
    setContent(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeListItem = (field, index) => {
    setContent(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!content.title || !content.description) {
      setError("Заповніть всі обов'язкові поля (заголовок, опис)");
      setSubmitting(false);
      return;
    }

    // Фільтруємо порожні значення зі списків та переконуємося, що це масиви
    const dataToSend = {
      title: content.title,
      description: content.description,
      is_active: content.is_active,
      contact_emails: Array.isArray(content.contact_emails) 
        ? content.contact_emails.filter(email => email && email.trim() !== "") 
        : [],
      contact_phones: Array.isArray(content.contact_phones) 
        ? content.contact_phones.filter(phone => phone && phone.trim() !== "") 
        : [],
      contact_addresses: Array.isArray(content.contact_addresses) 
        ? content.contact_addresses.filter(address => address && address.trim() !== "") 
        : []
    };

    try {
      await axiosInstance.put("/api/portfolio/homepage-content/", dataToSend);
      setSuccess("Контент успішно збережено!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Помилка збереження: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Завантаження...</div>;

  return (
    <div className="container mt-4">
      <h2>Редагування контенту головної сторінки</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-4">
        <h5 className="mb-4">Основний контент</h5>
        
        <div className="mb-3">
          <label className="form-label">Заголовок *</label>
          <input
            type="text"
            name="title"
            className="form-control"
            value={content.title}
            onChange={handleChange}
            required
            placeholder="Наприклад: Ласкаво просимо до нашої фотостудії"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Опис *</label>
          <textarea
            name="description"
            className="form-control"
            rows="4"
            value={content.description}
            onChange={handleChange}
            required
            placeholder="Опис студії (2-3 речення)"
          />
        </div>

        <div className="mb-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={content.is_active}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="is_active">
              Показувати на головній сторінці
            </label>
          </div>
        </div>

        <hr className="my-4" />
        
        <h5 className="mb-4">Контактна інформація</h5>

        {/* Email */}
        <div className="mb-4">
          <label className="form-label">Email для контактів</label>
          {content.contact_emails.map((email, index) => (
            <div key={index} className="input-group mb-2">
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => handleListChange('contact_emails', index, e.target.value)}
                placeholder="info@studio.com"
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => removeListItem('contact_emails', index)}
              >
                Видалити
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => addListItem('contact_emails')}
          >
            + Додати email
          </button>
        </div>

        {/* Телефони */}
        <div className="mb-4">
          <label className="form-label">Телефони</label>
          {content.contact_phones.map((phone, index) => (
            <div key={index} className="input-group mb-2">
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => handleListChange('contact_phones', index, e.target.value)}
                placeholder="+380 XX XXX XX XX"
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => removeListItem('contact_phones', index)}
              >
                Видалити
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => addListItem('contact_phones')}
          >
            + Додати телефон
          </button>
        </div>

        {/* Адреси */}
        <div className="mb-4">
          <label className="form-label">Адреси</label>
          {content.contact_addresses.map((address, index) => (
            <div key={index} className="input-group mb-2">
              <textarea
                className="form-control"
                rows="2"
                value={address}
                onChange={(e) => handleListChange('contact_addresses', index, e.target.value)}
                placeholder="Вулиця, будинок, місто"
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => removeListItem('contact_addresses', index)}
              >
                Видалити
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => addListItem('contact_addresses')}
          >
            + Додати адресу
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Збереження..." : "Зберегти зміни"}
        </button>
      </form>
    </div>
  );
};

export default AdminHomePageContentPage;
