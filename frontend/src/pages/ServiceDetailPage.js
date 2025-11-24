import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import ZoomableImage from "../components/ZoomableImage";

const getImageUrl = (url) => url?.startsWith('/media/') ? `http://localhost:8000${url}` : url;

const ServiceDetailPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState("all");

  useEffect(() => {
    axiosInstance.get(`/api/services/${id}/`)
      .then(res => setService(res.data))
      .catch(err => console.error(err));
    axiosInstance.get(`/api/portfolio/?service=${id}`)
      .then(res => setPortfolio(res.data.results || res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!service) return <div>Завантаження...</div>;

  // Фільтрація портфоліо по фотографу і активності фотографа
  const filteredPortfolio = selectedPhotographer === "all"
    ? portfolio
    : portfolio.filter(item => {
        if (!item.photographer) return false;
        if (typeof item.photographer === 'object' && item.photographer !== null) {
          return item.photographer.id === selectedPhotographer;
        }
        return item.photographer === selectedPhotographer;
      });

  return (
    <div className="container mt-4">
      <h2>{service.name}</h2>
      <div className="d-flex align-items-start mb-3" style={{ gap: 32 }}>
        {service.image && (
          <ZoomableImage
            src={service.image}
            alt={service.name}
            className="img-fluid rounded"
            style={{ objectFit: "cover", maxWidth: 320, maxHeight: 220, width: "100%" }}
          />
        )}
        <div style={{ flex: 1 }}>
          <p>{service.description}</p>
          <p><b>Ціна:</b> {service.price} грн</p>
          <p><b>Тривалість:</b> {service.duration} хв</p>
          <Link to="/booking" className="btn btn-primary mb-3">Замовити фотосесію</Link>
        </div>
      </div>
      {/* Фільтри по майстрах над портфоліо */}
      <div className="mb-3">
        <b>Майстри:</b>
        {service.photographers && service.photographers.length > 0 ? (
          <div style={{ margin: '8px 0' }}>
            <button
              className={`btn btn-sm me-2 ${selectedPhotographer === "all" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setSelectedPhotographer("all")}
            >
              Усі майстри
            </button>
            {service.photographers.filter(ph => ph.user?.is_active).map(ph => (
              <button
                key={ph.id}
                className={`btn btn-sm me-2 ${selectedPhotographer === ph.id ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setSelectedPhotographer(ph.id)}
              >
                {ph.user?.first_name} {ph.user?.last_name}
              </button>
            ))}
          </div>
        ) : (
          <span style={{ color: '#888' }}>Немає майстрів</span>
        )}
      </div>
      <h4 className="mt-4">Портфоліо робіт</h4>
      <div className="row">
        {filteredPortfolio.map(item => (
          <div className="col-md-4 mb-4" key={item.id}>
            <ZoomableImage
              src={item.image}
              alt={item.description}
              className="img-fluid rounded"
              style={{ objectFit: "cover", width: "100%", height: 200 }}
            />
            <div className="card-body">
              <p className="card-text">{item.description}</p>
              {/* <p className="card-text" style={{ color: '#888', fontSize: 14 }}>{item.service_obj?.name}</p> */}
            </div>
          </div>
        ))}
        {filteredPortfolio.length === 0 && <div>Немає фото для цього майстра.</div>}
      </div>
    </div>
  );
};

export default ServiceDetailPage;
