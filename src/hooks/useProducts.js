import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useProducts = (tenantId) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "products"),
        where("tenantId", "==", tenantId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProducts(productsData);
          setLoading(false);
        },
        (err) => {
          console.error("商品データの取得でエラーが発生しました:", err);
          setError("商品データの取得に失敗しました");
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error("商品データの取得でエラーが発生しました:", err);
      setError("商品データの取得に失敗しました");
      setLoading(false);
    }
  }, [tenantId]);

  return { products, loading, error };
}; 