import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import BookingForm from "../components/BookingForm";

const BookingPage = () => {
  const [services, setServices] = useState([]);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [allPhotographers, setAllPhotographers] = useState([]);
  const [user, setUser] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isAuthenticated = Boolean(localStorage.getItem("access"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesRes, photographersRes, additionalServicesRes] = await Promise.all([
          axiosInstance.get("/api/services/"),
          axiosInstance.get("/api/photographers/"),
          axiosInstance.get("/api/additional-services/")
        ]);
        setServices(servicesRes.data.results || servicesRes.data);
        setAdditionalServices(additionalServicesRes.data.results || additionalServicesRes.data);
        const photographersData = photographersRes.data.results || photographersRes.data;
        setAllPhotographers(photographersData);
        setPhotographers(photographersData);
        if (isAuthenticated) {
          const userRes = await axiosInstance.get("/api/auth/users/myprofile/");
          setUser(userRes.data);
          setDiscount(userRes.data.personal_discount || 0);
        } else {
          setUser(null);
          setDiscount(0);
        }
      } catch (error) {
        setMessage("Помилка завантаження даних: " + (error.response?.data?.detail || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Завантаження...</div>;
  }

  return (
    <BookingForm
      services={services}
      additionalServices={additionalServices}
      photographers={photographers}
      allPhotographers={allPhotographers}
      isAuthenticated={isAuthenticated}
      discount={discount}
      user={user}
      onBookingSuccess={() => {}}
    />
  );
};

export default BookingPage;