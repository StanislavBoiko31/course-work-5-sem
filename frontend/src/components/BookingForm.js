import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BookingForm = ({
  services,
  photographers,
  allPhotographers,
  isAuthenticated,
  discount,
  user,
  onBookingSuccess,
  additionalServices = []
}) => {
  const [form, setForm] = useState({
    service: "",
    photographer: "",
    date: "",
    start_time: "",
    guest_first_name: "",
    guest_last_name: "",
    guest_email: ""
  });
  const [selectedAdditionalServices, setSelectedAdditionalServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  
  // Генеруємо список недоступних дат для excludeDates
  const getExcludedDates = () => {
    if (availableDates.length === 0) return [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    const excluded = [];
    const current = new Date(today);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      if (!availableDates.includes(dateStr)) {
        excluded.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    return excluded;
  };

  // Фільтрація фотографів при зміні послуги
  useEffect(() => {
    if (form.service) {
      const filteredPhotographers = allPhotographers.filter(ph => ph.user?.is_active &&
        Array.isArray(ph.services) && ph.services.some(s => String(s.id) === String(form.service))
      );
      if (form.photographer && !filteredPhotographers.find(ph => ph.id === Number(form.photographer))) {
        setForm(prev => ({ ...prev, photographer: "", start_time: "", date: "" }));
        setAvailableDates([]);
      }
    }
    // eslint-disable-next-line
  }, [form.service, allPhotographers]);

  // Завантаження доступних дат при виборі фотографа
  useEffect(() => {
    if (form.photographer && form.service) {
      const fetchAvailableDates = async () => {
        try {
          setLoadingDates(true);
          const response = await axiosInstance.get("/api/bookings/available_dates/", {
            params: {
              photographer: form.photographer,
              service: form.service
            }
          });
          setAvailableDates(response.data.available_dates || []);
          // Якщо вибрана дата більше не доступна, скидаємо її
          if (form.date && !response.data.available_dates.includes(form.date)) {
            setForm(prev => ({ ...prev, date: "", start_time: "" }));
          }
        } catch (error) {
          setAvailableDates([]);
          console.error("Помилка завантаження доступних дат:", error);
        } finally {
          setLoadingDates(false);
        }
      };
      fetchAvailableDates();
    } else {
      setAvailableDates([]);
      if (form.date) {
        setForm(prev => ({ ...prev, date: "", start_time: "" }));
      }
    }
    // eslint-disable-next-line
  }, [form.photographer, form.service]);

  // Завантаження слотів при зміні service, photographer, date
  useEffect(() => {
    if (form.service && form.photographer && form.date) {
      const fetchSlots = async () => {
        try {
          setLoadingSlots(true);
          console.log("Запит слотів:", {
            service: form.service,
            photographer: form.photographer,
            date: form.date
          });
          const response = await axiosInstance.get("/api/bookings/available_slots/", {
            params: {
              service: form.service,
              photographer: form.photographer,
              date: form.date
            }
          });
          setSlots(response.data.slots || []);
          setForm(prev => ({ ...prev, start_time: "" }));
        } catch (error) {
          setSlots([]);
          setMessage("Помилка завантаження слотів: " + (error.response?.data?.detail || error.message));
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setSlots([]);
      setForm(prev => ({ ...prev, start_time: "" }));
    }
    // eslint-disable-next-line
  }, [form.service, form.photographer, form.date]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
    setMessage("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.service) newErrors.service = "Оберіть послугу";
    if (!form.photographer) newErrors.photographer = "Оберіть фотографа";
    if (!form.date) newErrors.date = "Оберіть дату";
    if (!form.start_time) newErrors.start_time = "Оберіть час";
    if (!isAuthenticated) {
      if (!form.guest_first_name) newErrors.guest_first_name = "Введіть ім'я";
      if (!form.guest_last_name) newErrors.guest_last_name = "Введіть прізвище";
      if (!form.guest_email) newErrors.guest_email = "Введіть email";
      else if (!/^\S+@\S+\.\S+$/.test(form.guest_email)) newErrors.guest_email = "Некоректний email";
    }
    if (form.date) {
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Не можна бронювати в минулому";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Підрахунок ціни з урахуванням знижки та додаткових послуг
  const selectedService = services.find(s => s.id === Number(form.service));
  const basePrice = selectedService ? Number(selectedService.price) : 0;
  const additionalServicesPrice = selectedAdditionalServices.reduce((sum, id) => {
    const service = additionalServices.find(s => s.id === id);
    return sum + (service ? Number(service.price) : 0);
  }, 0);
  const fullPrice = basePrice + additionalServicesPrice;
  // Знижка застосовується до загальної суми (основна послуга + додаткові послуги)
  const discountAmount = isAuthenticated ? fullPrice * discount / 100 : 0;
  const finalPrice = fullPrice - discountAmount;

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    if (!validateForm()) return;
    try {
      setLoading(true);
      const payload = {
        service_id: form.service,
        photographer_id: form.photographer,
        date: form.date,
        start_time: form.start_time,
      };
      if (selectedAdditionalServices.length > 0) {
        payload.additional_service_ids = selectedAdditionalServices;
      }
      if (!isAuthenticated) {
        payload.guest_first_name = form.guest_first_name;
        payload.guest_last_name = form.guest_last_name;
        payload.guest_email = form.guest_email;
      }
      await axiosInstance.post("/api/bookings/", payload);
      setMessage(`✅ Бронювання успішно створено! Сума до сплати: ${finalPrice} грн`);
      setForm({ service: "", photographer: "", date: "", start_time: "", guest_first_name: "", guest_last_name: "", guest_email: "" });
      setSelectedAdditionalServices([]);
      setSlots([]);
      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      setMessage("❌ Помилка: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "40px auto", border: "1px solid #ccc", padding: 32, borderRadius: 8 }}>
      <h2>Бронювання фотосесії</h2>
      {!isAuthenticated && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label>Ім'я:</label>
            <input
              name="guest_first_name"
              value={form.guest_first_name}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
            {errors.guest_first_name && <div style={{ color: "red", fontSize: 12 }}>{errors.guest_first_name}</div>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Прізвище:</label>
            <input
              name="guest_last_name"
              value={form.guest_last_name}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
            {errors.guest_last_name && <div style={{ color: "red", fontSize: 12 }}>{errors.guest_last_name}</div>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Email:</label>
            <input
              name="guest_email"
              type="email"
              value={form.guest_email}
              onChange={handleChange}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
            {errors.guest_email && <div style={{ color: "red", fontSize: 12 }}>{errors.guest_email}</div>}
          </div>
        </>
      )}
      <div style={{ marginBottom: 16 }}>
        <label>Послуга:</label>
        <select name="service" value={form.service} onChange={handleChange} required style={{ width: "100%", padding: 8, marginTop: 4 }}>
          <option value="">Оберіть послугу</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} - {s.price} грн ({s.duration} хв)
            </option>
          ))}
        </select>
        {form.service && (
          <div style={{ marginTop: 8, fontWeight: "bold" }}>
            {isAuthenticated && discount > 0 ? (
              <>
                Ваша знижка: {discount}%<br />
                {additionalServicesPrice > 0 && (
                  <>
                    Основна послуга: {basePrice} грн<br />
                    Додаткові послуги: {additionalServicesPrice} грн<br />
                  </>
                )}
                Ціна зі знижкою: <span style={{ color: "green" }}>{finalPrice.toFixed(2)} грн</span> <span style={{ textDecoration: "line-through", color: "#888", marginLeft: 8 }}>{fullPrice.toFixed(2)} грн</span>
              </>
            ) : (
              <>
                {additionalServicesPrice > 0 && (
                  <>
                    Основна послуга: {basePrice} грн<br />
                    Додаткові послуги: {additionalServicesPrice} грн<br />
                  </>
                )}
                Ціна: {fullPrice.toFixed(2)} грн
              </>
            )}
          </div>
        )}
      </div>
      {form.service && additionalServices.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label>Додаткові послуги (опціонально):</label>
          <div style={{ marginTop: 8, border: "1px solid #ddd", borderRadius: 4, padding: 12, maxHeight: 200, overflowY: "auto" }}>
            {additionalServices.map(service => {
              const servicePrice = Number(service.price);
              // Розраховуємо ціну зі знижкою для цієї послуги
              const servicePriceWithDiscount = isAuthenticated && discount > 0 
                ? servicePrice * (1 - discount / 100) 
                : servicePrice;
              
              return (
                <label key={service.id} style={{ display: "block", marginBottom: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedAdditionalServices.includes(service.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAdditionalServices([...selectedAdditionalServices, service.id]);
                      } else {
                        setSelectedAdditionalServices(selectedAdditionalServices.filter(id => id !== service.id));
                      }
                    }}
                    style={{ marginRight: 8 }}
                  />
                  <span 
                    style={{ fontWeight: 500 }}
                    title={service.description || ""}
                  >
                    {service.name}
                  </span>
                  {isAuthenticated && discount > 0 ? (
                    <span style={{ marginLeft: 8 }}>
                      <span style={{ textDecoration: "line-through", color: "#888", marginRight: 4 }}>
                        +{servicePrice.toFixed(2)} грн
                      </span>
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>
                        +{servicePriceWithDiscount.toFixed(2)} грн
                      </span>
                    </span>
                  ) : (
                    <span style={{ marginLeft: 8, color: "#007bff", fontWeight: "bold" }}>
                      +{servicePrice.toFixed(2)} грн
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {selectedAdditionalServices.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
              Вибрано додаткових послуг: {selectedAdditionalServices.length}
            </div>
          )}
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label>Фотограф:</label>
        <select name="photographer" value={form.photographer} onChange={handleChange} required style={{ width: "100%", padding: 8, marginTop: 4 }}>
          <option value="">
            {form.service 
              ? `Оберіть фотографа для послуги "${services.find(s => s.id === Number(form.service))?.name}"`
              : "Спочатку оберіть послугу"
            }
          </option>
          {photographers
            .filter(ph => ph.user?.is_active && (Array.isArray(ph.services) && ph.services.some(s => String(s.id) === String(form.service))))
            .map(p => (
              <option key={p.id} value={p.id}>
                {p.user?.first_name} {p.user?.last_name}
              </option>
            ))}
        </select>
        {form.service && photographers.filter(ph => Array.isArray(ph.services) && ph.services.some(s => String(s.id) === String(form.service))).length === 0 && (
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Немає фотографів для цієї послуги
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Дата:</label>
        {form.photographer && form.service ? (
          <div style={{ marginTop: 4 }}>
            <DatePicker
              selected={form.date ? new Date(form.date) : null}
              onChange={(date) => {
                if (date) {
                  const dateStr = date.toISOString().split('T')[0];
                  setForm(prev => ({ ...prev, date: dateStr, start_time: "" }));
                  setErrors(prev => ({ ...prev, date: "" }));
                } else {
                  setForm(prev => ({ ...prev, date: "", start_time: "" }));
                }
              }}
              excludeDates={getExcludedDates()}
              minDate={new Date()}
              dateFormat="yyyy-MM-dd"
              placeholderText="Оберіть дату"
              required
              disabled={loadingDates}
              className="form-control"
              style={{ width: "100%", padding: 8 }}
              dayClassName={(date) => {
                const dateStr = date.toISOString().split('T')[0];
                const today = new Date().toISOString().split('T')[0];
                // Якщо дата в минулому, не стилізуємо
                if (dateStr < today) {
                  return "";
                }
                // Якщо дата доступна
                if (availableDates.includes(dateStr)) {
                  return "available-date";
                }
                // Якщо дата недоступна - показуємо сірою
                return "unavailable-date";
              }}
            />
            {loadingDates && (
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                Завантаження доступних дат...
              </div>
            )}
            {!loadingDates && availableDates.length === 0 && form.photographer && (
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                Немає доступних дат для цього фотографа
              </div>
            )}
          </div>
        ) : (
          <input 
            type="date" 
            name="date" 
            value={form.date} 
            onChange={handleChange}
            min={today}
            required 
            disabled
            style={{ width: "100%", padding: 8, marginTop: 4, backgroundColor: "#f5f5f5" }}
            placeholder="Спочатку оберіть фотографа"
          />
        )}
        {errors.date && <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{errors.date}</div>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Час:</label>
        <select 
          name="start_time" 
          value={form.start_time} 
          onChange={handleChange}
          required 
          style={{ width: "100%", padding: 8, marginTop: 4 }}
          disabled={loadingSlots || slots.length === 0}
        >
          <option value="">
            {loadingSlots ? "Завантаження..." : slots.length === 0 ? "Немає доступних слотів" : "Оберіть час"}
          </option>
          {slots.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
        {loadingSlots && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Завантаження доступних слотів...</div>}
      </div>
      <button 
        type="submit" 
        disabled={loading || !form.start_time || loadingSlots}
        style={{ width: "100%", padding: 12, backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        {loading ? "Створення..." : "Забронювати"}
      </button>
      {message && (
        <div style={{ marginTop: 16, color: message.includes('❌') ? 'red' : 'green' }}>
          {message}
        </div>
      )}
    </form>
  );
};

export default BookingForm; 