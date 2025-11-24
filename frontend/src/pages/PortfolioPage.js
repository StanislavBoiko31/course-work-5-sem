import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPortfolio } from "../api/studioApi";
import axiosInstance from "../axiosInstance";
import ZoomableImage from "../components/ZoomableImage";

const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [filter, setFilter] = useState("all");
  const [homePageContent, setHomePageContent] = useState(null);

  useEffect(() => {
    // Завантажуємо портфоліо
    getPortfolio()
      .then(res => setPortfolio(res.data?.results || res.data || []))
      .catch(err => {
        console.error("Помилка завантаження портфоліо:", err);
        setPortfolio([]);
      });
    
    // Завантажуємо контент головної сторінки (не блокує відображення при помилці)
    axiosInstance.get("/api/portfolio/homepage-content/")
      .then(res => setHomePageContent(res.data))
      .catch(err => {
        console.error("Помилка завантаження контенту головної сторінки:", err);
        // Встановлюємо null, щоб не показувати секцію при помилці
        setHomePageContent(null);
      });
  }, []);

  const categories = useMemo(() => {
    const names = portfolio
      .map(item => item.service_obj && item.service_obj.name)
      .filter(Boolean);
    return ["all", ...Array.from(new Set(names))];
  }, [portfolio]);

  const getImageUrl = (url) => url?.startsWith('/media/') ? `http://localhost:8000${url}` : url;

  // Фільтрація (припускаємо, що у кожного фото є поле category)
  const filteredPortfolio =
  filter === "all"
    ? portfolio
    : portfolio.filter(item => item.service_obj && item.service_obj.name === filter);

  return (
    <div>
      {/* Hero-секція */}
      {homePageContent && homePageContent.is_active && (
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "80px 20px",
          textAlign: "center",
          marginBottom: "40px"
        }}>
          <div className="container">
            <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "20px" }}>
              {homePageContent.title}
            </h1>
            <p style={{ fontSize: "1.25rem", lineHeight: "1.8", maxWidth: "800px", margin: "0 auto 30px" }}>
              {homePageContent.description}
            </p>
          </div>
        </div>
      )}

      {/* Контактна інформація */}
      {homePageContent && homePageContent.is_active && (
        <div className="container mb-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div style={{
                background: "#f8f9fa",
                padding: "30px",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <h3 style={{ marginBottom: "25px", color: "#333" }}>Контакти</h3>
                <div className="row">
                  {/* Email */}
                  {((homePageContent.contact_emails && homePageContent.contact_emails.length > 0) || homePageContent.contact_email) && (
                    <div className="col-md-4 mb-3">
                      <div>
                        <strong>Email:</strong><br />
                        {homePageContent.contact_emails && homePageContent.contact_emails.length > 0 ? (
                          homePageContent.contact_emails.map((email, idx) => (
                            <div key={idx}>
                              <a href={`mailto:${email}`} style={{ color: "#667eea" }}>
                                {email}
                              </a>
                            </div>
                          ))
                        ) : homePageContent.contact_email ? (
                          <a href={`mailto:${homePageContent.contact_email}`} style={{ color: "#667eea" }}>
                            {homePageContent.contact_email}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                  {/* Телефони */}
                  {((homePageContent.contact_phones && homePageContent.contact_phones.length > 0) || homePageContent.contact_phone) && (
                    <div className="col-md-4 mb-3">
                      <div>
                        <strong>Телефон:</strong><br />
                        {homePageContent.contact_phones && homePageContent.contact_phones.length > 0 ? (
                          homePageContent.contact_phones.map((phone, idx) => (
                            <div key={idx}>
                              <a href={`tel:${phone}`} style={{ color: "#667eea" }}>
                                {phone}
                              </a>
                            </div>
                          ))
                        ) : homePageContent.contact_phone ? (
                          <a href={`tel:${homePageContent.contact_phone}`} style={{ color: "#667eea" }}>
                            {homePageContent.contact_phone}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                  {/* Адреси */}
                  {((homePageContent.contact_addresses && homePageContent.contact_addresses.length > 0) || homePageContent.contact_address) && (
                    <div className="col-md-4 mb-3">
                      <div>
                        <strong>Адреса:</strong><br />
                        {homePageContent.contact_addresses && homePageContent.contact_addresses.length > 0 ? (
                          homePageContent.contact_addresses.map((address, idx) => (
                            <div key={idx} style={{ marginBottom: "8px" }}>
                              {address}
                            </div>
                          ))
                        ) : homePageContent.contact_address ? (
                          <span>{homePageContent.contact_address}</span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Портфоліо */}
      <div className="container">
        <h2 style={{ marginBottom: "30px", textAlign: "center" }}>Наше портфоліо</h2>
        <div className="d-flex mb-3">
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn${filter === cat ? "" : "-outline"}-primary me-2`}
              onClick={() => setFilter(cat)}
            >
              {cat === "all" ? "Усе" : cat}
            </button>
          ))}
        </div>
        <div className="row">
          {filteredPortfolio.map(item => (
            <div className="col-md-4 mb-4" key={item.id}>
              <div className="card">
                <ZoomableImage
                  src={getImageUrl(item.image)}
                  className="card-img-top"
                  alt={item.description || "portfolio"}
                />
                <div className="card-body">
                  <p className="card-text">{item.description}</p>
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {item.photographer_obj && (
                      <Link 
                        to={`/photographers/${item.photographer_obj.id}/portfolio`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge bg-primary text-decoration-none"
                        style={{ cursor: "pointer" }}
                      >
                        Майстер: {(() => {
                          const user = item.photographer_obj.user;
                          if (user?.first_name || user?.last_name) {
                            return `${user.first_name || ""} ${user.last_name || ""}`.trim();
                          }
                          return user?.email || `Фотограф #${item.photographer_obj.id}`;
                        })()}
                      </Link>
                    )}
                    {item.service_obj && (
                      <Link 
                        to={`/services/${item.service_obj.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge bg-success text-decoration-none"
                        style={{ cursor: "pointer" }}
                      >
                        Послуга: {item.service_obj.name}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredPortfolio.length === 0 && (
            <div>Немає фото для цієї категорії.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;