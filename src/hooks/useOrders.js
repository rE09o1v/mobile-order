import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useOrders = (tenantId) => {
  const [orders, setOrders] = useState([]);
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
        collection(db, "orders"),
        where("tenantId", "==", tenantId),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(ordersData);
          setLoading(false);
        },
        (err) => {
          console.error("注文データの取得でエラーが発生しました:", err);
          setError("注文データの取得に失敗しました");
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error("注文データの取得でエラーが発生しました:", err);
      setError("注文データの取得に失敗しました");
      setLoading(false);
    }
  }, [tenantId]);

  // 注文をステータス別に分類
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const completedOrders = orders.filter(order => order.status === 'completed');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');

  // 売上計算（完了済み注文のみ）
  const totalSales = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return { 
    orders, 
    pendingOrders, 
    completedOrders, 
    cancelledOrders,
    totalSales,
    loading, 
    error 
  };
}; 