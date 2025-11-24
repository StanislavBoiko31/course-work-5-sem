import React, { useState } from "react";

// Додаємо мапу статусів українською
const statusLabels = {
  approved: "Підтверджено адміністратором",
  cancelled: "Скасовано адміністратором",
  completed: "Завершено",
  pending: "Очікує підтвердження",
  "очікує підтвердження": "Очікує підтвердження",
};

const OrdersTable = ({
  orders = [],
  services = [],
  photographers = [],
  additionalServices = [],
  editOrderId,
  editOrderForm,
  editOrderSlots = [],
  editOrderLoadingSlots = false,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  onCancelOrder
}) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const getImageUrl = (url) => url?.startsWith('/media/') ? `http://localhost:8000${url}` : url;

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(getImageUrl(url));
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Помилка завантаження файлу:', error);
      // Fallback - спроба прямого завантаження
      const link = document.createElement('a');
      link.href = getImageUrl(url);
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 17, background: '#fafbfc' }}>
    <thead>
      <tr>
        <th style={{ border: "1px solid #ccc", padding: '14px 10px', minWidth: 110, textAlign: 'center', background: '#f5f6fa' }}>Дата</th>
        <th style={{ border: "1px solid #ccc", padding: '14px 10px', minWidth: 90, textAlign: 'center', background: '#f5f6fa' }}>Час</th>
        <th style={{ border: "1px solid #ccc", padding: '14px 10px', minWidth: 180, textAlign: 'center', background: '#f5f6fa' }}>Послуга</th>
        <th style={{ border: "1px solid #ccc", padding: '14px 10px', minWidth: 180, textAlign: 'center', background: '#f5f6fa' }}>Фотограф</th>
        <th style={{ border: "1px solid #ccc", padding: '14px 10px', minWidth: 120, textAlign: 'center', background: '#f5f6fa' }}>Статус</th>
        <th style={{ border: "1px solid #ccc", padding: '14px 10px', minWidth: 90, textAlign: 'center', background: '#f5f6fa' }}>Ціна</th>
        <th style={{ border: "1px solid #ccc", padding: '14px 10px', minWidth: 120, textAlign: 'center', background: '#f5f6fa' }}>Дія</th>
      </tr>
    </thead>
    <tbody>
      {(!orders || orders.length === 0) && (
        <tr>
          <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>Немає замовлень</td>
        </tr>
      )}
      {orders && orders.length > 0 && orders.map(order => (
        <React.Fragment key={order.id}>
          <tr style={{ verticalAlign: 'middle' }}>
            <td style={{ border: "1px solid #ccc", padding: '12px 8px', textAlign: 'center', wordBreak: 'break-word' }}>
              {editOrderId === order.id ? (
                <input type="date" name="date" value={editOrderForm.date} onChange={onEditChange} />
              ) : order.date}
            </td>
            <td style={{ border: "1px solid #ccc", padding: '12px 8px', textAlign: 'center', wordBreak: 'break-word' }}>
              {editOrderId === order.id ? (
                <select
                  name="start_time"
                  value={editOrderForm.start_time}
                  onChange={onEditChange}
                  required
                  style={{ width: "100%", padding: 8, marginTop: 4 }}
                  disabled={editOrderLoadingSlots || editOrderSlots.length === 0}
                >
                  <option value="">
                    {editOrderLoadingSlots ? "Завантаження..." : editOrderSlots.length === 0 ? "Немає доступних слотів" : "Оберіть час"}
                  </option>
                  {editOrderSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              ) : order.start_time}
            </td>
            <td style={{ border: "1px solid #ccc", padding: '12px 8px', textAlign: 'center', wordBreak: 'break-word' }}>
              {editOrderId === order.id ? (
                <select name="service_id" value={editOrderForm.service_id} onChange={onEditChange}>
                  <option value="">Оберіть послугу</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                order.service?.name ||
                order.service_obj?.name ||
                order.guest_service_name ||
                order.service_name ||
                'Невідомо'
              )}
            </td>
            <td style={{ border: "1px solid #ccc", padding: '12px 8px', textAlign: 'center', wordBreak: 'break-word' }}>
              {editOrderId === order.id ? (
                <select name="photographer_id" value={editOrderForm.photographer_id} onChange={onEditChange}>
                  <option value="">Оберіть фотографа</option>
                  {photographers.map(p => (
                    <option key={p.id} value={p.id}>{p.user?.first_name} {p.user?.last_name}</option>
                  ))}
                </select>
              ) : (order.photographer && order.photographer.user
                ? `${order.photographer.user.first_name} ${order.photographer.user.last_name}`.trim()
                : (order.guest_first_name || order.guest_last_name
                    ? `${order.guest_first_name || ""} ${order.guest_last_name || ""}`.trim()
                    : 'Невідомо')
              )}
            </td>
            <td style={{ border: "1px solid #ccc", padding: '12px 8px', textAlign: 'center', wordBreak: 'break-word' }}>{statusLabels[order.status?.toLowerCase()] || order.status}</td>
            <td style={{ border: "1px solid #ccc", padding: '12px 8px', textAlign: 'center', wordBreak: 'break-word' }}>{order.price ? `${order.price} грн` : '-'}</td>
            <td style={{ border: "1px solid #ccc", padding: '12px 8px', textAlign: 'center', wordBreak: 'break-word' }}>
              {editOrderId === order.id ? (
                <>
                  <button onClick={onEditSave}>Зберегти</button>
                  <button onClick={onEditCancel} style={{ marginLeft: 8 }}>Скасувати</button>
                </>
              ) : (
                <>
                  {order.status === "Очікує підтвердження" && (
                    <>
                      <button onClick={() => onEdit(order)}>Змінити</button>
                      <button onClick={() => onCancelOrder(order.id)} style={{ marginLeft: 8, background: '#f44', color: '#fff' }}>Скасувати</button>
                    </>
                  )}
                  {(order.result_photos?.length > 0 || order.result_videos?.length > 0) && (
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowResults(true);
                      }}
                      style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', marginLeft: 8 }}
                    >
                      Результати
                    </button>
                  )}
                </>
              )}
            </td>
          </tr>
          {editOrderId === order.id && additionalServices.length > 0 && (
            <tr>
              <td colSpan={7} style={{ border: "1px solid #ccc", padding: '12px 8px', background: '#f8f9fa' }}>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Додаткові послуги:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {additionalServices.map(service => (
                    <label key={service.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="additional_service"
                        value={service.id}
                        checked={(editOrderForm.additional_service_ids || []).includes(service.id)}
                        onChange={onEditChange}
                        style={{ marginRight: 6 }}
                      />
                      <span 
                        style={{ fontWeight: 500 }}
                        title={service.description || ""}
                      >
                        {service.name}
                      </span>
                      <span style={{ marginLeft: 6, color: "#007bff", fontWeight: "bold" }}>+{service.price} грн</span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      ))}
      </tbody>
    </table>

    {/* Модальне вікно з результатами */}
    {showResults && selectedOrder && (
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
        maxWidth: 800,
        width: "90%",
        maxHeight: "80%",
        overflow: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3>Результати замовлення #{selectedOrder.id}</h3>
          <button 
            onClick={() => {
              setShowResults(false);
              setSelectedOrder(null);
            }}
            style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {/* Деталі замовлення */}
        <div style={{ marginBottom: 24, padding: 16, background: "#f8f9fa", borderRadius: 8 }}>
          <h4 style={{ marginBottom: 12 }}>Деталі замовлення</h4>
          <p><strong>Дата:</strong> {selectedOrder.date}</p>
          <p><strong>Час:</strong> {selectedOrder.start_time}{selectedOrder.end_time ? ` - ${selectedOrder.end_time}` : ''}</p>
          <p><strong>Послуга:</strong> {selectedOrder.service_obj?.name || selectedOrder.service?.name || 'Не вказано'}</p>
          {selectedOrder.additional_services_data && selectedOrder.additional_services_data.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Додаткові послуги:</strong>
              <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                {selectedOrder.additional_services_data.map((ads, idx) => (
                  <li key={idx}>
                    {ads.name} - {ads.price} грн
                    {ads.description && <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>({ads.description})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p><strong>Ціна:</strong> {selectedOrder.price ? `${selectedOrder.price} грн` : 'Не вказано'}</p>
        </div>

        {/* Кнопки для завантаження всіх файлів */}
        <div style={{ marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {selectedOrder.result_photos?.length > 0 && (
            <button
              onClick={async () => {
                for (let idx = 0; idx < selectedOrder.result_photos.length; idx++) {
                  const photo = selectedOrder.result_photos[idx];
                  const fileName = photo.split('/').pop() || `photo_${selectedOrder.id}_${idx + 1}.jpg`;
                  await downloadFile(photo, fileName);
                  // Затримка між завантаженнями (300мс)
                  if (idx < selectedOrder.result_photos.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                }
              }}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              Завантажити всі фото ({selectedOrder.result_photos.length})
            </button>
          )}
          {selectedOrder.result_videos?.length > 0 && (
            <button
              onClick={async () => {
                for (let idx = 0; idx < selectedOrder.result_videos.length; idx++) {
                  const video = selectedOrder.result_videos[idx];
                  const fileName = video.split('/').pop() || `video_${selectedOrder.id}_${idx + 1}.mp4`;
                  await downloadFile(video, fileName);
                  // Затримка між завантаженнями (500мс для відео)
                  if (idx < selectedOrder.result_videos.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }
              }}
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              Завантажити всі відео ({selectedOrder.result_videos.length})
            </button>
          )}
        </div>
        
        {selectedOrder.result_photos?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h4>Фото ({selectedOrder.result_photos.length})</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
              {selectedOrder.result_photos.map((photo, idx) => {
                const photoUrl = getImageUrl(photo);
                const fileName = photo.split('/').pop() || `photo_${selectedOrder.id}_${idx + 1}.jpg`;
                return (
                  <div key={idx} style={{ position: "relative" }}>
                    <img 
                      src={photoUrl}
                      alt={`Результат ${idx + 1}`}
                      style={{ width: 200, height: 200, objectFit: "cover", borderRadius: 4, cursor: "pointer" }}
                      onClick={() => window.open(photoUrl, '_blank')}
                    />
                    <button
                      onClick={() => downloadFile(photo, fileName)}
                      style={{ 
                        display: "block", 
                        marginTop: 4, 
                        width: "100%",
                        textAlign: "center", 
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12
                      }}
                    >
                      Завантажити
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedOrder.result_videos?.length > 0 && (
          <div>
            <h4>Відео ({selectedOrder.result_videos.length})</h4>
            <div style={{ marginTop: 12 }}>
              {selectedOrder.result_videos.map((video, idx) => {
                const videoUrl = getImageUrl(video);
                const fileName = video.split('/').pop() || `video_${selectedOrder.id}_${idx + 1}.mp4`;
                return (
                  <div key={idx} style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center" }}>
                    <a 
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        display: "inline-block",
                        color: "#007bff", 
                        textDecoration: "underline"
                      }}
                    >
                      Переглянути відео {idx + 1}
                    </a>
                    <button
                      onClick={() => downloadFile(video, fileName)}
                      style={{ 
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        padding: "4px 12px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 14
                      }}
                    >
                      Завантажити
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <button 
            onClick={() => {
              setShowResults(false);
              setSelectedOrder(null);
            }}
            style={{ background: "#6c757d", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
    )}
    </>
  );
};

export default OrdersTable; 