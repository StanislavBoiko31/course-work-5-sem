import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import ZoomableImage from "../components/ZoomableImage";

const PhotographerPortfolioPage = () => {
  const { id } = useParams();
  const [photographer, setPhotographer] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Завантажуємо фотографа
    axiosInstance.get(`/api/photographers/${id}/`)
      .then(res => setPhotographer(res.data))
      .catch(err => console.error(err));
    
    // Завантажуємо портфоліо
    axiosInstance.get(`/api/portfolio/?photographer=${id}`)
      .then(res => setPortfolio(res.data.results || res.data))
      .catch(err => console.error(err));
  }, [id]);

  // Отримуємо назви послуг фотографа
  const photographerServices = useMemo(() => {
    if (!photographer || !photographer.services) return [];
    return photographer.services.map(service => service.name);
  }, [photographer]);

  // Категорії для фільтрації
  const categories = useMemo(() => {
    const names = portfolio
      .map(item => item.service_obj && item.service_obj.name)
      .filter(Boolean);
    return ["all", ...Array.from(new Set(names))];
  }, [portfolio]);

  const filteredPortfolio =
    filter === "all"
      ? portfolio
      : portfolio.filter(item => item.service_obj && item.service_obj.name === filter);

  const getImageUrl = (url) => url?.startsWith('/media/') ? `http://localhost:8000${url}` : url;

  if (!photographer) return <div>Завантаження...</div>;
  if (!photographer?.user?.is_active) return <div>Фотограф неактивний</div>;

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-4">
          {photographer.photo && (
            <ZoomableImage
              src={getImageUrl(photographer.photo)}
              alt={photographer.user?.first_name || "Фотограф"}
              className="img-fluid rounded"
              style={{ objectFit: "cover", width: "100%", height: 250 }}
            />
          )}
        </div>
        <div className="col-md-8">
          <h2>
            {photographer.user 
              ? `${photographer.user.first_name || ""} ${photographer.user.last_name || ""}`.trim() || photographer.user.email
              : `Фотограф ${photographer.id}`
            }
          </h2>
          <p>{photographer.bio}</p>
          
          <h5>Послуги які надає:</h5>
          {photographerServices.length > 0 ? (
            <ul>
              {photographerServices.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          ) : (
            <p>Послуги не вказані</p>
          )}
          
          <Link to="/booking" className="btn btn-primary mt-3">
            Замовити фотосесію
          </Link>
        </div>
      </div>
      
      <h4>Портфоліо майстра</h4>
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
            <ZoomableImage
              src={getImageUrl(item.image)}
              alt={item.description}
              className="img-fluid rounded"
              style={{ objectFit: "cover", width: "100%", height: 200 }}
            />
          </div>
        ))}
        {filteredPortfolio.length === 0 && <div>Портфоліо порожнє.</div>}
      </div>
    </div>
  );
};

export default PhotographerPortfolioPage;
