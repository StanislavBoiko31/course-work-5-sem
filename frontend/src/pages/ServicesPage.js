import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ServicesPage = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/services/")
      .then(res => setServices(res.data?.results || res.data || []))
      .catch(err => {
        console.error(err);
        setServices([]);
      });
  }, []);

  return (
    <div className="container mt-4">
      <h2>Перелік послуг</h2>
      <div className="row">
        {services.map(service => (
          <div className="col-md-4 mb-4" key={service.id}>
            <div className="card h-100">
              {service.image && (
                <img
                  src={service.image}
                  alt={service.name}
                  className="card-img-top"
                  style={{ objectFit: "cover", height: 200 }}
                />
              )}
              <div className="card-body">
  <h5 className="card-title">{service.name}</h5>
  <p className="card-text">{service.description}</p>
  <p className="card-text"><b>Ціна:</b> {service.price} грн</p>
  <Link to={`/services/${service.id}`} className="btn btn-outline-primary">
    Переглянути детальніше
  </Link>
</div>
            </div>
          </div>
        ))}
        {services.length === 0 && <div>Послуг не знайдено.</div>}
      </div>
    </div>
  );
};

export default ServicesPage;