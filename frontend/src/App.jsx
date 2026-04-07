import React, { useEffect, useState } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Aura eCommerce</h1>
        <p>Production-ready 3D eCommerce Platform</p>
      </header>
      <main className="product-grid">
        {loading && <p>Loading products…</p>}
        {error && <p className="error">Error: {error}</p>}
        {!loading &&
          !error &&
          products.map((p) => (
            <div key={p.id} className="product-card">
              <h2>{p.name}</h2>
              <p className="price">${p.price.toFixed(2)}</p>
              <p className="stock">{p.stock} in stock</p>
              <button>Add to Cart</button>
            </div>
          ))}
      </main>
    </div>
  );
}

export default App;
