import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import OrdersTable from "../components/OrdersTable";

const ProfilePage = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [orders, setOrders] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [discount, setDiscount] = useState(5); // дефолтна знижка
  const [editOrderId, setEditOrderId] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({});
  const [services, setServices] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [allPhotographers, setAllPhotographers] = useState([]); // всі фотографи
  const [editOrderSlots, setEditOrderSlots] = useState([]);
  const [editOrderLoadingSlots, setEditOrderLoadingSlots] = useState(false);
  const [nextOrdersUrl, setNextOrdersUrl] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [additionalServices, setAdditionalServices] = useState([]);
  const navigate = useNavigate();

  const fetchOrders = async (url = "/api/bookings/my/") => {
    setOrdersLoading(true);
    try {
      const res = await axiosInstance.get(url);
      const data = res.data;
      setOrders(prev => url === "/api/bookings/my/" ? (data.results || data || []) : [...prev, ...(data.results || data || [])]);
      setNextOrdersUrl(data.next || null);
    } catch (err) {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    // Завантаження профілю
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/api/auth/users/myprofile/");
        setUser(res.data);
        setForm({
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          email: res.data.email || "",
          password: "",
        });
        setDiscount(res.data.personal_discount || 5);
        setProfileImage(res.data.profile_image || null);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          navigate("/login");
        }
      }
    };
    fetchUser();

    // Завантаження історії замовлень
    fetchOrders();

    // Завантаження послуг і фотографів для редагування бронювання
    const fetchServicesPhotographers = async () => {
      try {
        const [servicesRes, photographersRes, additionalServicesRes] = await Promise.all([
          axiosInstance.get("/api/services/"),
          axiosInstance.get("/api/photographers/"),
          axiosInstance.get("/api/additional-services/")
        ]);
        setServices(servicesRes.data.results || servicesRes.data);
        const photographersData = photographersRes.data.results || photographersRes.data;
        setAllPhotographers(photographersData);
        setPhotographers(photographersData);
        setAdditionalServices(additionalServicesRes.data.results || additionalServicesRes.data);
      } catch (e) {}
    };
    fetchServicesPhotographers();
  }, [navigate]);

  // Фільтрація фотографів при зміні послуги у формі редагування
  useEffect(() => {
    if (editOrderId) {
      if (editOrderForm.service_id) {
        const filteredPhotographers = allPhotographers.filter(ph =>
          Array.isArray(ph.services) && ph.services.some(s => String(s.id) === String(editOrderForm.service_id))
        );
        setPhotographers(filteredPhotographers);
        if (editOrderForm.photographer_id && !filteredPhotographers.find(ph => ph.id === Number(editOrderForm.photographer_id))) {
          setEditOrderForm(prev => ({ ...prev, photographer_id: "", start_time: "" }));
        }
      } else {
        setPhotographers(allPhotographers);
      }
    }
  }, [editOrderForm.service_id, editOrderForm.photographer_id, allPhotographers, editOrderId]);

  // Підвантаження слотів при зміні service/photographer/date у формі редагування
  useEffect(() => {
    if (editOrderId && editOrderForm.service_id && editOrderForm.photographer_id && editOrderForm.date) {
      const fetchSlots = async () => {
        try {
          setEditOrderLoadingSlots(true);
          console.log("Запит слотів:", {
            service: editOrderForm.service_id,
            photographer: editOrderForm.photographer_id,
            date: editOrderForm.date
          });
          const response = await axiosInstance.get("/api/bookings/available_slots/", {
            params: {
              service: editOrderForm.service_id,
              photographer: editOrderForm.photographer_id,
              date: editOrderForm.date
            }
          });
          setEditOrderSlots(response.data.slots || []);
          setEditOrderForm(prev => ({ ...prev, start_time: "" }));
        } catch (error) {
          setEditOrderSlots([]);
        } finally {
          setEditOrderLoadingSlots(false);
        }
      };
      fetchSlots();
    } else if (editOrderId) {
      setEditOrderSlots([]);
      setEditOrderForm(prev => ({ ...prev, start_time: "" }));
    }
  }, [editOrderForm.service_id, editOrderForm.photographer_id, editOrderForm.date, editOrderId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = () => setEditing(true);

  const handleSave = async (e) => {
    e.preventDefault();
    console.log("handleSave called");
    try {
      let dataToSend;
      let config = {};
      if (profileImage && typeof profileImage !== "string") {
        // Якщо вибрано нове фото
        dataToSend = new FormData();
        dataToSend.append("first_name", form.first_name);
        dataToSend.append("last_name", form.last_name);
        dataToSend.append("email", form.email);
        if (form.password) dataToSend.append("password", form.password);
        dataToSend.append("profile_image", profileImage);
        config.headers = { "Content-Type": "multipart/form-data" };
      } else {
        // Якщо фото не змінювали
        dataToSend = { ...form };
        if (!form.password) delete dataToSend.password;
      }
      const res = await axiosInstance.patch("/api/auth/users/me/", dataToSend, config);
      setEditing(false);
      // Оновити дані без reload:
      setUser(res.data);
      setForm({
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        email: res.data.email || "",
        password: "",
      });
      setDiscount(res.data.personal_discount || 5);
      setProfileImage(res.data.profile_image || null);
    } catch (err) {
      alert("Помилка збереження профілю: " + (err.response?.data?.detail || err.message));
      console.log(err.response?.data || err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    if (onLogout) onLogout();
    navigate("/login");
  };

  const handleEditOrder = (order) => {
    setEditOrderId(order.id);
    const currentAdditionalServiceIds = order.additional_services_data 
      ? order.additional_services_data.map(ads => ads.id)
      : [];
    setEditOrderForm({
      service_id: order.service?.id || "",
      photographer_id: order.photographer?.id || "",
      date: order.date || "",
      start_time: order.start_time || "",
      additional_service_ids: currentAdditionalServiceIds
    });
  };
  const handleEditOrderChange = (e) => {
    if (e.target.type === 'checkbox' && e.target.name === 'additional_service') {
      const serviceId = Number(e.target.value);
      const currentIds = editOrderForm.additional_service_ids || [];
      if (e.target.checked) {
        setEditOrderForm({ ...editOrderForm, additional_service_ids: [...currentIds, serviceId] });
      } else {
        setEditOrderForm({ ...editOrderForm, additional_service_ids: currentIds.filter(id => id !== serviceId) });
      }
    } else {
      setEditOrderForm({ ...editOrderForm, [e.target.name]: e.target.value });
    }
  };
  const handleEditOrderSave = async (e) => {
    e.preventDefault();
    try {
      // Фільтруємо порожні значення перед відправкою
      const dataToSend = {};
      Object.keys(editOrderForm).forEach(key => {
        const value = editOrderForm[key];
        // Для additional_service_ids завжди відправляємо масив (навіть порожній), щоб можна було видалити всі послуги
        if (key === 'additional_service_ids') {
          dataToSend[key] = Array.isArray(value) ? value : [];
        }
        // Пропускаємо порожні рядки, але залишаємо 0, false, null та інші масиви
        else if (value !== "" && value !== null && value !== undefined) {
          if (Array.isArray(value) && value.length > 0) {
            dataToSend[key] = value;
          } else if (!Array.isArray(value)) {
            dataToSend[key] = value;
          }
        }
      });
      await axiosInstance.patch(`/api/bookings/${editOrderId}/`, dataToSend);
      setEditOrderId(null);
      setOrders([]);
      setNextOrdersUrl(null);
      await fetchOrders("/api/bookings/my/");
    } catch (err) {
      alert("Помилка збереження замовлення: " + (err.response?.data?.detail || err.message || "Невідома помилка"));
    }
  };
  const handleEditOrderCancel = () => {
    setEditOrderId(null);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Ви дійсно хочете скасувати це замовлення?")) return;
    try {
      await axiosInstance.patch(`/api/bookings/${orderId}/`, { status: "Скасовано користувачем" });
      setOrders([]);
      setNextOrdersUrl(null);
      await fetchOrders("/api/bookings/my/");
    } catch (err) {
      alert("Помилка скасування: " + (err.response?.data?.detail || err.message));
    }
  };

  if (!user) return <div>Завантаження...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", border: "1px solid #ccc", padding: 32, borderRadius: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
        {/* Ліва частина: особиста інформація */}
        <div style={{ flex: 1 }}>
          <h2 style={{ display: "inline-block" }}>Особиста інформація</h2>
          <button style={{ marginLeft: 16 }} onClick={handleEdit}>Змінити</button>
          <button style={{ marginLeft: 16, background: '#f44', color: '#fff' }} onClick={handleLogout}>Вийти</button>
          <form onSubmit={handleSave} style={{ marginTop: 16 }}>
            <input
              name="first_name"
              placeholder="Ім'я"
              value={form.first_name}
              onChange={handleChange}
              disabled={!editing}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />
            <input
              name="last_name"
              placeholder="Фамілія"
              value={form.last_name}
              onChange={handleChange}
              disabled={!editing}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />
            <input
              name="email"
              placeholder="Пошта"
              value={form.email}
              onChange={handleChange}
              disabled={!editing}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />
            <input
              name="password"
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={handleChange}
              disabled={!editing}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />
            {editing && <button type="submit">Зберегти</button>}
          </form>
        </div>
        {/* Права частина: фото і знижка */}
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 8 }}>
            <img
              src={
                profileImage
                  ? typeof profileImage === "string"
                    ? profileImage // якщо це URL з бекенду
                    : URL.createObjectURL(profileImage) // якщо це File
                  : "/default-avatar.png"
              }
              alt="profile"
              style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "1px solid #aaa" }}
            />
          </div>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: 8 }} />
          <div style={{ marginTop: 16, fontWeight: "bold" }}>
            Знижка на наступне замовлення: {discount}%
          </div>
        </div>
      </div>
      {/* Історія замовлень */}
      <h3 style={{ marginTop: 40 }}>Історія замовлень фотосесій</h3>
      <OrdersTable
        orders={orders}
        services={services}
        photographers={photographers}
        additionalServices={additionalServices}
        editOrderId={editOrderId}
        editOrderForm={editOrderForm}
        editOrderSlots={editOrderSlots}
        editOrderLoadingSlots={editOrderLoadingSlots}
        onEdit={handleEditOrder}
        onEditChange={handleEditOrderChange}
        onEditSave={handleEditOrderSave}
        onEditCancel={handleEditOrderCancel}
        onCancelOrder={handleCancelOrder}
      />
      {nextOrdersUrl && (
        <button onClick={() => fetchOrders(nextOrdersUrl)} style={{marginTop: 16}} disabled={ordersLoading}>
          {ordersLoading ? "Завантаження..." : "Показати ще"}
        </button>
      )}
    </div>
  );
};

export default ProfilePage;