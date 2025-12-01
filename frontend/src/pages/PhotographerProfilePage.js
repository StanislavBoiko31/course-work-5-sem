import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

const PhotographerProfilePage = () => {
  const [photographer, setPhotographer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioForm, setPortfolioForm] = useState({ image: null, description: "", service: "" });
  const [portfolioEditId, setPortfolioEditId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, portfolio, bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [nextBookingsUrl, setNextBookingsUrl] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [bookingFilters, setBookingFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: ""
  });
  const [uploadingResults, setUploadingResults] = useState(false);
  const [uploadPhotos, setUploadPhotos] = useState([]);
  const [uploadVideos, setUploadVideos] = useState([]);

  useEffect(() => {
    axiosInstance.get("/api/photographers/me/")
      .then(res => {
        setPhotographer(res.data);
        setForm({
          email: res.data.user?.email || "",
          bio: res.data.bio || "",
          phone: res.data.phone || "",
          work_start: res.data.work_start || "09:00",
          work_end: res.data.work_end || "18:00",
          work_days: res.data.work_days || "0,1,2,3,4",
          services: Array.isArray(res.data.services) ? res.data.services.filter(id => id != null) : [],
        });
      });
    axiosInstance.get("/api/services/").then(res => setServices(res.data.results || res.data));
    axiosInstance.get("/api/portfolio/my/").then(res => setPortfolio(res.data.results || res.data));
  }, []);

  // Завантаження замовлень при переключенні на таб
  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchBookings = async (url = "/api/bookings/photographer/") => {
    setBookingsLoading(true);
    try {
      const res = await axiosInstance.get(url);
      const data = res.data;
      if (url === "/api/bookings/photographer/") {
        // Перше завантаження - замінюємо всі замовлення
        setBookings(data.results || data || []);
      } else {
        // Додаткове завантаження - додаємо до існуючих
        setBookings(prev => [...prev, ...(data.results || data || [])]);
      }
      setNextBookingsUrl(data.next || null);
    } catch (err) {
      console.error("Помилка завантаження замовлень:", err);
      if (url === "/api/bookings/photographer/") {
        setBookings([]);
      }
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadMoreBookings = () => {
    if (nextBookingsUrl && !bookingsLoading) {
      fetchBookings(nextBookingsUrl);
    }
  };

  const handleChange = e => {
    const { name, value, type, files } = e.target;
    if (type === "file") setPhotoFile(files[0]);
    else if (name === "services") {
      const options = e.target.options;
      const selected = [];
      for (let i = 0; i < options.length; i++) if (options[i].selected) selected.push(Number(options[i].value));
      setForm(f => ({ ...f, services: selected }));
    } else setForm(f => ({ ...f, [name]: value }));
  };

  const handleEdit = () => setEditing(true);
  const handleSave = async e => {
    e.preventDefault();
    let emailChanged = form.email !== photographer.user?.email;
    let dataToSend;
    let config = {};
    const cleanedServices = form.services ? form.services.filter(id => id != null) : [];
    if (photoFile) {
      dataToSend = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "services") cleanedServices.forEach(id => dataToSend.append("services", id));
        else dataToSend.append(k, v);
      });
      dataToSend.append("photo", photoFile);
      config.headers = { "Content-Type": "multipart/form-data" };
    } else {
      dataToSend = { ...form, services: cleanedServices };
    }

    try {
      if (emailChanged) {
        await axiosInstance.patch("/api/auth/users/me/", { email: form.email });
      }
      const res = await axiosInstance.patch("/api/photographers/me/", dataToSend, config);
      setPhotographer(res.data);
      setForm({
        email: res.data.user?.email || "",
        bio: res.data.bio || "",
        phone: res.data.phone || "",
        work_start: res.data.work_start || "09:00",
        work_end: res.data.work_end || "18:00",
        work_days: res.data.work_days || "0,1,2,3,4",
        services: Array.isArray(res.data.services) ? res.data.services.filter(id => id != null) : [],
      });
      setEditing(false);
      setPhotoFile(null);
    } catch (err) {
      alert("Помилка збереження профілю: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  // Portfolio CRUD
  const handlePortfolioFormChange = e => {
    const { name, value, type, files } = e.target;
    if (type === "file") setPortfolioForm(f => ({ ...f, image: files[0] }));
    else setPortfolioForm(f => ({ ...f, [name]: value }));
  };
  const handlePortfolioAdd = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("description", portfolioForm.description);
    formData.append("service", portfolioForm.service);
    if (portfolioForm.image) formData.append("image", portfolioForm.image);
    const res = await axiosInstance.post("/api/portfolio/my/", formData, { headers: { "Content-Type": "multipart/form-data" } });
    setPortfolio(list => [res.data, ...list]);
    setPortfolioForm({ image: null, description: "", service: "" });
  };
  const handlePortfolioEdit = item => {
    setPortfolioEditId(item.id);
    setPortfolioForm({ image: null, description: item.description, service: item.service });
  };
  const handlePortfolioUpdate = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("description", portfolioForm.description);
    formData.append("service", portfolioForm.service);
    if (portfolioForm.image) formData.append("image", portfolioForm.image);
    const res = await axiosInstance.patch(`/api/portfolio/my/${portfolioEditId}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    setPortfolio(list => list.map(p => p.id === portfolioEditId ? res.data : p));
    setPortfolioEditId(null);
    setPortfolioForm({ image: null, description: "", service: "" });
  };
  const handlePortfolioDelete = async id => {
    if (!window.confirm("Видалити цю роботу?")) return;
    await axiosInstance.delete(`/api/portfolio/my/${id}/`);
    setPortfolio(list => list.filter(p => p.id !== id));
  };

  // Booking management
  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      await axiosInstance.patch(`/api/bookings/${bookingId}/`, { status: newStatus });
      await fetchBookings(); // Refresh bookings
    } catch (err) {
      alert("Помилка зміни статусу: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUploadResults = async (bookingId) => {
    if (!uploadPhotos.length && !uploadVideos.length) {
      alert("Оберіть хоча б один файл для завантаження");
      return;
    }

    setUploadingResults(true);
    try {
      const formData = new FormData();
      uploadPhotos.forEach(photo => formData.append('photos', photo));
      uploadVideos.forEach(video => formData.append('videos', video));
      
      await axiosInstance.post(`/api/bookings/${bookingId}/upload_results/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      alert("Результати успішно завантажено!");
      setUploadPhotos([]);
      setUploadVideos([]);
      await fetchBookings();
    } catch (err) {
      alert("Помилка завантаження: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingResults(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "очікує підтвердження": return "#ffc107";
      case "підтверджено адміністратором": return "#28a745";
      case "зроблено": return "#17a2b8";
      case "завершено": return "#20c997";
      case "скасовано адміністратором": return "#dc3545";
      case "скасовано користувачем": return "#6c757d";
      default: return "#6c757d";
    }
  };

  const getDayName = (dayNumber) => {
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
    return days[dayNumber] || dayNumber;
  };

  const handleBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const closeBookingDetails = () => {
    setShowBookingDetails(false);
    setSelectedBooking(null);
  };

  const filteredBookings = bookings.filter(booking => {
    // Фільтр за статусом
    if (bookingFilters.status !== "all" && booking.status !== bookingFilters.status) {
      return false;
    }
    
    // Фільтр за датою
    if (bookingFilters.dateFrom && booking.date < bookingFilters.dateFrom) {
      return false;
    }
    if (bookingFilters.dateTo && booking.date > bookingFilters.dateTo) {
      return false;
    }
    
    return true;
  });

  const handleFilterChange = (field, value) => {
    setBookingFilters(prev => ({ ...prev, [field]: value }));
  };

  if (!photographer) return <div>Завантаження...</div>;

  console.log("form.services", form.services, typeof form.services[0]);
  console.log("services", services);

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", border: "1px solid #ccc", padding: 32, borderRadius: 8 }}>
      <h2>Кабінет майстра</h2>
      
      {/* Табси */}
      <div style={{ marginBottom: 24, borderBottom: "1px solid #ccc" }}>
        <button 
          onClick={() => setActiveTab("profile")}
          style={{ 
            padding: "8px 16px", 
            marginRight: 8, 
            border: "none", 
            background: activeTab === "profile" ? "#007bff" : "#f8f9fa",
            color: activeTab === "profile" ? "white" : "black",
            cursor: "pointer"
          }}
        >
          Профіль
        </button>
        <button 
          onClick={() => setActiveTab("portfolio")}
          style={{ 
            padding: "8px 16px", 
            marginRight: 8, 
            border: "none", 
            background: activeTab === "portfolio" ? "#007bff" : "#f8f9fa",
            color: activeTab === "portfolio" ? "white" : "black",
            cursor: "pointer"
          }}
        >
          Портфоліо
        </button>
        <button 
          onClick={() => setActiveTab("bookings")}
          style={{ 
            padding: "8px 16px", 
            marginRight: 8, 
            border: "none", 
            background: activeTab === "bookings" ? "#007bff" : "#f8f9fa",
            color: activeTab === "bookings" ? "white" : "black",
            cursor: "pointer"
          }}
        >
          Мої замовлення
        </button>
      </div>

      {/* Таб Профіль */}
      {activeTab === "profile" && (
        <>
          <form onSubmit={handleSave} style={{ marginBottom: 32 }}>
            <h4>Особиста інформація</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', alignItems: 'center', marginBottom: 16 }}>
              <label htmlFor="email">Пошта:</label>
              <input
                id="email"
                name="email"
                placeholder="Пошта"
                value={form.email || ""}
                onChange={handleChange}
                disabled={!editing}
                style={{ marginBottom: 8, width: "100%" }}
              />

              <label htmlFor="bio">Опис:</label>
              <textarea id="bio" name="bio" placeholder="Про себе" value={form.bio} onChange={handleChange} disabled={!editing} style={{ width: "100%", marginBottom: 8 }} />

              <label htmlFor="phone">Телефон:</label>
              <input id="phone" name="phone" placeholder="Телефон" value={form.phone} onChange={handleChange} disabled={!editing} style={{ width: "100%", marginBottom: 8 }} />

              <label htmlFor="work_start">Початок роботи:</label>
              <input id="work_start" name="work_start" type="time" value={form.work_start} onChange={handleChange} disabled={!editing} style={{ marginRight: 8 }} />

              <label htmlFor="work_end">Кінець роботи:</label>
              <input id="work_end" name="work_end" type="time" value={form.work_end} onChange={handleChange} disabled={!editing} style={{ marginRight: 8 }} />

              <label htmlFor="work_days">Дні роботи:</label>
              <input id="work_days" name="work_days" placeholder="0,1,2..." value={form.work_days} onChange={handleChange} disabled={!editing} style={{ marginRight: 8 }} />

              <label>Послуги:</label>
              <div style={{ marginBottom: 8 }}>
                {Array.isArray(services) && services.length > 0 && services.map(s => (
                  <label key={s.id} style={{ marginRight: 16 }}>
                    <input
                      type="checkbox"
                      value={s.id}
                      checked={Array.isArray(form.services) && form.services.includes(Number(s.id))}
                      onChange={e => {
                        if (!editing) return;
                        const id = Number(e.target.value);
                        setForm(f => ({
                          ...f,
                          services: e.target.checked
                            ? [...f.services, id]
                            : f.services.filter(sid => sid !== id)
                        }));
                      }}
                      disabled={!editing}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
            <input type="file" accept="image/*" name="photo" onChange={handleChange} disabled={!editing} />
            {editing && <button type="submit">Зберегти</button>}
            {!editing && <button type="button" onClick={handleEdit}>Редагувати</button>}
          </form>

          {/* Графік роботи */}
          <div style={{ marginBottom: 32 }}>
            <h4>Графік роботи</h4>
            <div style={{ background: "#f8f9fa", padding: 16, borderRadius: 8 }}>
              <p><strong>Робочі години:</strong> {form.work_start} - {form.work_end}</p>
              <p><strong>Робочі дні:</strong> {form.work_days.split(',').map(day => getDayName(parseInt(day))).join(', ')}</p>
            </div>
          </div>
        </>
      )}

      {/* Таб Портфоліо */}
      {activeTab === "portfolio" && (
        <>
          <h4>Моє портфоліо</h4>
          <form onSubmit={portfolioEditId ? handlePortfolioUpdate : handlePortfolioAdd} style={{ marginBottom: 24 }}>
            <input name="description" placeholder="Опис" value={portfolioForm.description} onChange={handlePortfolioFormChange} style={{ marginRight: 8 }} />
            {form.services.length === 0 && (
              <div style={{ color: 'red', marginBottom: 8 }}>Спочатку оберіть хоча б одну послугу у своєму профілі!</div>
            )}
            <select name="service" value={portfolioForm.service} onChange={handlePortfolioFormChange} required style={{ marginRight: 8 }}>
              <option value="">Оберіть послугу</option>
              {services
                .filter(s => form.services.includes(s.id))
                .map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
            <input type="file" accept="image/*" name="image" onChange={handlePortfolioFormChange} style={{ marginRight: 8 }} />
            <button type="submit">{portfolioEditId ? "Оновити" : "Додати"}</button>
            {portfolioEditId && <button type="button" onClick={() => { setPortfolioEditId(null); setPortfolioForm({ image: null, description: "", service: "" }); }}>Скасувати</button>}
          </form>
          <table style={{ width: "100%", borderCollapse: "collapse", background: '#fafbfc' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Фото</th>
                <th>Опис</th>
                <th>Послуга</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.image && <img src={item.image.startsWith("/media/") ? `http://localhost:8000${item.image}` : item.image} alt="portfolio" style={{ maxWidth: 110, maxHeight: 80, objectFit: 'cover', borderRadius: 8 }} />}</td>
                  <td>{item.description}</td>
                  <td>{item.service_obj?.name || item.service}</td>
                  <td>
                    <button onClick={() => handlePortfolioEdit(item)}>Редагувати</button>
                    <button onClick={() => handlePortfolioDelete(item.id)} style={{ marginLeft: 8, background: '#f44', color: '#fff' }}>Видалити</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Таб Замовлення */}
      {activeTab === "bookings" && (
        <>
          <h4>Мої замовлення</h4>
          
          {/* Статистика */}
          {!bookingsLoading && bookings.length > 0 && (
            <div style={{ marginBottom: 16, padding: 16, background: "#e3f2fd", borderRadius: 8 }}>
              <h5 style={{ marginBottom: 12 }}>Статистика</h5>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <strong>Всього замовлень:</strong> {bookings.length}
                </div>
                <div>
                  <strong>Очікують підтвердження:</strong> {bookings.filter(b => b.status === "Очікує підтвердження").length}
                </div>
                <div>
                  <strong>Підтверджені:</strong> {bookings.filter(b => b.status === "Підтверджено адміністратором").length}
                </div>
                <div>
                  <strong>Зроблені:</strong> {bookings.filter(b => b.status === "Зроблено").length}
                </div>
                <div>
                  <strong>З результатами:</strong> {bookings.filter(b => (b.result_photos?.length > 0 || b.result_videos?.length > 0)).length}
                </div>
                <div>
                  <strong>Завершені:</strong> {bookings.filter(b => b.status === "Завершено").length}
                </div>
                <div>
                  <strong>Скасовані:</strong> {bookings.filter(b => b.status.includes("Скасовано")).length}
                </div>
              </div>
            </div>
          )}
          
          {/* Фільтри */}
          <div style={{ marginBottom: 16, padding: 16, background: "#f8f9fa", borderRadius: 8 }}>
            <h5 style={{ marginBottom: 12 }}>Фільтри</h5>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <label style={{ marginRight: 8 }}>Статус:</label>
                <select 
                  value={bookingFilters.status} 
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  style={{ padding: "4px 8px" }}
                >
                  <option value="all">Всі статуси</option>
                  <option value="Очікує підтвердження">Очікує підтвердження</option>
                  <option value="Підтверджено адміністратором">Підтверджено адміністратором</option>
                  <option value="Зроблено">Зроблено</option>
                  <option value="Завершено">Завершено</option>
                  <option value="Скасовано адміністратором">Скасовано</option>
                  <option value="Скасовано користувачем">Скасовано користувачем</option>
                </select>
              </div>
              <div>
                <label style={{ marginRight: 8 }}>Дата від:</label>
                <input 
                  type="date" 
                  value={bookingFilters.dateFrom} 
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  style={{ padding: "4px 8px" }}
                />
              </div>
              <div>
                <label style={{ marginRight: 8 }}>Дата до:</label>
                <input 
                  type="date" 
                  value={bookingFilters.dateTo} 
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  style={{ padding: "4px 8px" }}
                />
              </div>
              <button 
                onClick={() => setBookingFilters({ status: "all", dateFrom: "", dateTo: "" })}
                style={{ background: "#6c757d", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
              >
                Скинути фільтри
              </button>
            </div>
          </div>

          {bookingsLoading ? (
            <div>Завантаження замовлень...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", background: '#fafbfc' }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px", border: "1px solid #ddd", background: "#f5f6fa" }}>Дата</th>
                  <th style={{ padding: "12px", border: "1px solid #ddd", background: "#f5f6fa" }}>Час</th>
                  <th style={{ padding: "12px", border: "1px solid #ddd", background: "#f5f6fa" }}>Клієнт</th>
                  <th style={{ padding: "12px", border: "1px solid #ddd", background: "#f5f6fa" }}>Послуга</th>
                  <th style={{ padding: "12px", border: "1px solid #ddd", background: "#f5f6fa" }}>Статус</th>
                  <th style={{ padding: "12px", border: "1px solid #ddd", background: "#f5f6fa" }}>Ціна</th>
                  <th style={{ padding: "12px", border: "1px solid #ddd", background: "#f5f6fa" }}>Дії</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>Немає замовлень</td>
                  </tr>
                ) : (
                  filteredBookings.map(booking => (
                    <tr key={booking.id}>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{booking.date}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                        {booking.start_time} - {booking.end_time}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                        {booking.user ? (
                          `${booking.user.first_name || ''} ${booking.user.last_name || ''}`.trim() || booking.user.email
                        ) : (
                          `${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || booking.guest_email
                        )}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                        {booking.service_obj?.name || booking.service}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #ddd", color: getStatusColor(booking.status), fontWeight: "bold" }}>
                        {booking.status}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                        {booking.price ? `${booking.price} грн` : '-'}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                        <button 
                          onClick={() => handleBookingDetails(booking)}
                          style={{ background: "#007bff", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", marginRight: 4 }}
                        >
                          Деталі
                        </button>
                        {booking.status === "Підтверджено адміністратором" && (
                          <button 
                            onClick={() => handleBookingStatusChange(booking.id, "Зроблено")}
                            style={{ background: "#17a2b8", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", marginRight: 4 }}
                          >
                            Зроблено
                          </button>
                        )}
                        {booking.status === "Зроблено" && (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowBookingDetails(true);
                              }}
                              style={{ background: "#17a2b8", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", marginRight: 4 }}
                            >
                              Завантажити результати
                            </button>
                            {(booking.result_photos?.length > 0 || booking.result_videos?.length > 0) && (
                              <button 
                                onClick={() => handleBookingStatusChange(booking.id, "Завершено")}
                                style={{ background: "#28a745", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
                              >
                                Завершити
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Кнопка "Показати ще" */}
          {!bookingsLoading && nextBookingsUrl && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                onClick={loadMoreBookings}
                style={{
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 16
                }}
              >
                Показати ще
              </button>
            </div>
          )}

          {/* Модальне вікно з деталями замовлення */}
          {showBookingDetails && selectedBooking && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}>
              <div style={{
                background: "white",
                padding: 24,
                borderRadius: 8,
                maxWidth: 600,
                width: "90%",
                maxHeight: "80%",
                overflow: "auto"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3>Деталі замовлення #{selectedBooking.id}</h3>
                  <button 
                    onClick={closeBookingDetails}
                    style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
                
                {selectedBooking.status === "Зроблено" && (
                  <div style={{ marginBottom: 24, padding: 16, background: "#e3f2fd", borderRadius: 8 }}>
                    <h4>Завантажити результати роботи</h4>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 4 }}>Фото:</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={(e) => setUploadPhotos(Array.from(e.target.files))}
                        style={{ marginBottom: 8 }}
                      />
                      {uploadPhotos.length > 0 && (
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Обрано фото: {uploadPhotos.length}
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 4 }}>Відео:</label>
                      <input 
                        type="file" 
                        accept="video/*" 
                        multiple 
                        onChange={(e) => setUploadVideos(Array.from(e.target.files))}
                        style={{ marginBottom: 8 }}
                      />
                      {uploadVideos.length > 0 && (
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Обрано відео: {uploadVideos.length}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleUploadResults(selectedBooking.id)}
                      disabled={uploadingResults || (!uploadPhotos.length && !uploadVideos.length)}
                      style={{ 
                        background: uploadingResults ? "#ccc" : "#17a2b8", 
                        color: "white", 
                        border: "none", 
                        padding: "8px 16px", 
                        borderRadius: 4, 
                        cursor: uploadingResults ? "not-allowed" : "pointer" 
                      }}
                    >
                      {uploadingResults ? "Завантаження..." : "Завантажити"}
                    </button>
                  </div>
                )}

                {(selectedBooking.result_photos?.length > 0 || selectedBooking.result_videos?.length > 0) && (
                  <div style={{ marginBottom: 24, padding: 16, background: "#f0f8f0", borderRadius: 8 }}>
                    <h4>Завантажені результати</h4>
                    {selectedBooking.result_photos?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <strong>Фото ({selectedBooking.result_photos.length}):</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                          {selectedBooking.result_photos.map((photo, idx) => (
                            <img 
                              key={idx}
                              src={photo.startsWith('/media/') ? `http://localhost:8000${photo}` : photo}
                              alt={`Результат ${idx + 1}`}
                              style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4 }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedBooking.result_videos?.length > 0 && (
                      <div>
                        <strong>Відео ({selectedBooking.result_videos.length}):</strong>
                        <div style={{ marginTop: 8 }}>
                          {selectedBooking.result_videos.map((video, idx) => (
                            <div key={idx} style={{ marginBottom: 8 }}>
                              <a 
                                href={video.startsWith('/media/') ? `http://localhost:8000${video}` : video}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#007bff", textDecoration: "underline" }}
                              >
                                Відео {idx + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <h4>Інформація про клієнта</h4>
                  {selectedBooking.user ? (
                    <div>
                      <p><strong>Ім'я:</strong> {selectedBooking.user.first_name || 'Не вказано'}</p>
                      <p><strong>Прізвище:</strong> {selectedBooking.user.last_name || 'Не вказано'}</p>
                      <p><strong>Email:</strong> {selectedBooking.user.email}</p>
                      <p><strong>Знижка:</strong> {selectedBooking.user.personal_discount || 0}%</p>
                    </div>
                  ) : (
                    <div>
                      <p><strong>Ім'я:</strong> {selectedBooking.guest_first_name || 'Не вказано'}</p>
                      <p><strong>Прізвище:</strong> {selectedBooking.guest_last_name || 'Не вказано'}</p>
                      <p><strong>Email:</strong> {selectedBooking.guest_email || 'Не вказано'}</p>
                      <p><em>Гостьове замовлення</em></p>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <h4>Деталі замовлення</h4>
                  <p><strong>Дата:</strong> {selectedBooking.date}</p>
                  <p><strong>Час:</strong> {selectedBooking.start_time} - {selectedBooking.end_time}</p>
                  <p><strong>Послуга:</strong> {selectedBooking.service_obj?.name || selectedBooking.service}</p>
                  <p><strong>Опис послуги:</strong> {selectedBooking.service_obj?.description || 'Не вказано'}</p>
                  <p><strong>Тривалість:</strong> {selectedBooking.service_obj?.duration || 'Не вказано'} хв</p>
                  {selectedBooking.additional_services_data && selectedBooking.additional_services_data.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Додаткові послуги:</strong>
                      <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                        {selectedBooking.additional_services_data.map((ads, idx) => (
                          <li key={idx}>
                            {ads.name} - {ads.price} грн
                            {ads.description && <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>({ads.description})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p><strong>Статус:</strong> <span style={{ color: getStatusColor(selectedBooking.status), fontWeight: "bold" }}>{selectedBooking.status}</span></p>
                  <p><strong>Ціна:</strong> {selectedBooking.price ? `${selectedBooking.price} грн` : 'Не вказано'}</p>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  {selectedBooking.status === "Зроблено" && (selectedBooking.result_photos?.length > 0 || selectedBooking.result_videos?.length > 0) && (
                    <button 
                      onClick={() => {
                        handleBookingStatusChange(selectedBooking.id, "Завершено");
                        closeBookingDetails();
                      }}
                      style={{ background: "#28a745", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
                    >
                      Завершити замовлення
                    </button>
                  )}
                  <button 
                    onClick={closeBookingDetails}
                    style={{ background: "#6c757d", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PhotographerProfilePage; 