"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { 
  BarChart2, 
  Package, 
  Users, 
  QrCode, 
  Settings, 
  RotateCcw,
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';
import { getDocs, collection, setDoc, doc, updateDoc, deleteDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const AdminPage = ({ 
  products, 
  orders, 
  onLogout, 
  onOpenScanner, 
  onOpenProductManagement, 
  onOpenTenantManagement, 
  onCancelOrder, 
  currentStaff 
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [backups, setBackups] = useState([]);

  // メモ化された計算値
  const { 
    completedOrders, 
    pendingOrders, 
    cancelledOrders, 
    totalRevenue, 
    salesByProduct 
  } = useMemo(() => {
    const completed = orders.filter(order => order.status === "completed");
    const pending = orders.filter(order => order.status === "pending");
    const cancelled = orders.filter(order => order.status === "cancelled");
    
    const revenue = completed.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const productSales = products.map((product) => {
      const soldQuantity = completed.reduce((sum, order) => {
        const item = order.items.find((i) => i.productId === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      return {
        ...product,
        soldQuantity,
        revenue: soldQuantity * product.price,
      };
    });

    return {
      completedOrders: completed,
      pendingOrders: pending,
      cancelledOrders: cancelled,
      totalRevenue: revenue,
      salesByProduct: productSales
    };
  }, [orders, products]);

  // バックアップ一覧を取得
  const fetchBackups = useCallback(async () => {
    try {
      const backupsSnapshot = await getDocs(collection(db, "backups"));
      const backupList = backupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setBackups(backupList);
    } catch (error) {
      console.error("バックアップ一覧の取得エラー:", error);
    }
  }, []);

  // 注文データと売上データのみをリセット（商品データは保持）
  const handleResetOrdersOnly = useCallback(async (executorName) => {
    setIsResetting(true);
    try {
      // 1. バックアップを作成
      const backupId = `backup_${Date.now()}`;
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // メタデータを取得
      const latestOrderDoc = await getDoc(doc(db, "metadata", "latestOrder"));
      const latestOrderData = latestOrderDoc.exists() ? latestOrderDoc.data() : { number: 0 };

      // バックアップを保存
      await setDoc(doc(db, "backups", backupId), {
        executorName: executorName,
        createdAt: new Date(),
        ordersData: ordersData,
        latestOrderNumber: latestOrderData.number,
        type: "orders_reset"
      });

      // 2. 全ての注文データを削除
      const orderDeletePromises = ordersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(orderDeletePromises);

      // 3. 整理番号カウンターをリセット
      await updateDoc(doc(db, "metadata", "latestOrder"), { number: 0 });

      alert(`注文データと売上データをリセットしました。\nバックアップID: ${backupId}\n実行者: ${executorName}`);
    } catch (error) {
      console.error("リセットエラー:", error);
      alert("データリセットに失敗しました: " + error.message);
    } finally {
      setIsResetting(false);
      setResetModalOpen(false);
    }
  }, []);

  // バックアップからデータを復元
  const handleRestoreFromBackup = useCallback(async (backupId, executorName) => {
    setIsResetting(true);
    try {
      // バックアップデータを取得
      const backupDoc = await getDoc(doc(db, "backups", backupId));
      if (!backupDoc.exists()) {
        throw new Error("バックアップが見つかりません");
      }

      const backupData = backupDoc.data();

      // 現在の注文データを削除
      const currentOrdersSnapshot = await getDocs(collection(db, "orders"));
      const deletePromises = currentOrdersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // バックアップから注文データを復元
      const restorePromises = backupData.ordersData.map(order =>
        setDoc(doc(db, "orders", order.id), order)
      );
      await Promise.all(restorePromises);

      // 整理番号を復元
      await updateDoc(doc(db, "metadata", "latestOrder"), {
        number: backupData.latestOrderNumber
      });

      // 復元記録を作成
      await setDoc(doc(collection(db, "restoreLog")), {
        backupId: backupId,
        executorName: executorName,
        restoredAt: new Date(),
        originalBackupDate: backupData.createdAt,
        originalExecutor: backupData.executorName
      });

      alert(`データを復元しました。\nバックアップ日時: ${backupData.createdAt.toDate().toLocaleString()}\n元の実行者: ${backupData.executorName}\n復元実行者: ${executorName}`);
    } catch (error) {
      console.error("復元エラー:", error);
      alert("データ復元に失敗しました: " + error.message);
    } finally {
      setIsResetting(false);
      setRestoreModalOpen(false);
    }
  }, []);

  const handleCompleteOrder = useCallback(async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "completed",
        completedAt: new Date()
      });
    } catch (error) {
      console.error("注文完了エラー:", error);
      alert("注文の完了処理に失敗しました");
    }
  }, []);

  const handleProxyOrder = useCallback(async (orderData) => {
    try {
      // 代理注文処理
      await runTransaction(db, async (transaction) => {
        // 1. まず全ての読み取り操作を実行
        const productDocs = [];
        for (const item of orderData.items) {
          const productRef = doc(db, "products", item.productId);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) {
            throw new Error(`商品が見つかりません: ${item.productId}`);
          }
          const productData = productDoc.data();
          if (productData.stock < item.quantity) {
            throw new Error(`在庫不足: ${productData.name}`);
          }
          productDocs.push({ ref: productRef, data: productData, item });
        }

        // 整理番号を取得
        const latestOrderRef = doc(db, "metadata", "latestOrder");
        const latestOrderDoc = await transaction.get(latestOrderRef);
        const currentNumber = latestOrderDoc.exists() ? latestOrderDoc.data().number : 0;
        const newTicketNumber = currentNumber + 1;

        // 2. 次に全ての書き込み操作を実行
        // 商品の在庫を減少
        for (const { ref, data, item } of productDocs) {
          transaction.update(ref, { stock: data.stock - item.quantity });
        }

        // 整理番号を更新
        transaction.update(latestOrderRef, { number: newTicketNumber });

        // 注文を作成
        const orderRef = doc(collection(db, "orders"));
        transaction.set(orderRef, {
          ...orderData,
          ticketNumber: newTicketNumber,
          status: "pending",
          isProxy: true,
          createdAt: new Date(),
          id: orderRef.id,
        });
      });

      alert("代理注文が正常に作成されました");
      setProxyModalOpen(false);
    } catch (error) {
      console.error("代理注文エラー:", error);
      alert("代理注文の作成に失敗しました: " + error.message);
    }
  }, []);

  if (isResetting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
        <p className="ml-4 text-lg">処理中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">管理画面</h1>
          {currentStaff && (
            <p className="text-gray-600">ようこそ、{currentStaff.name}さん</p>
          )}
        </div>
        <Button onClick={onLogout} variant="outline">
          ログアウト
        </Button>
      </div>

      {/* ダッシュボード統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          icon={<BarChart2 className="text-green-600" size={24} />}
          title="完了済み注文の売上"
          value={`¥${totalRevenue.toLocaleString()}`}
          subtitle={`${completedOrders.length}件の注文`}
        />
        
        <DashboardCard
          icon={<Package className="text-blue-600" size={24} />}
          title="在庫状況"
          value={`${products.length}商品`}
          subtitle="管理中の商品数"
        />
        
        <DashboardCard
          icon={<Users className="text-orange-600" size={24} />}
          title="対応中注文"
          value={`${pendingOrders.length}件`}
          subtitle="処理待ちの注文"
        />
        
        <DashboardCard
          icon={<AlertTriangle className="text-red-600" size={24} />}
          title="取り消し注文"
          value={`${cancelledOrders.length}件`}
          subtitle="取り消された注文"
        />
      </div>

      {/* アクションボタン */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Button onClick={onOpenScanner} className="h-20">
          <QrCode size={20} />
          QRスキャン
        </Button>
        
        <Button onClick={onOpenProductManagement} variant="secondary" className="h-20">
          <Package size={20} />
          商品管理
        </Button>
        
        <Button onClick={() => setProxyModalOpen(true)} variant="secondary" className="h-20">
          <Users size={20} />
          代理注文
        </Button>
        
        <Button onClick={() => setResetModalOpen(true)} variant="danger" className="h-20">
          <RotateCcw size={20} />
          注文データリセット
        </Button>
        
        <Button onClick={() => {
          fetchBackups();
          setRestoreModalOpen(true);
        }} variant="outline" className="h-20">
          <RotateCcw size={20} />
          データ復元
        </Button>
        
        <Button onClick={onOpenTenantManagement} variant="outline" className="h-20">
          <Settings size={20} />
          テナント管理
        </Button>
      </div>

      {/* 最新注文一覧 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">最新注文一覧</h2>
        
        {pendingOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">対応中の注文はありません</p>
        ) : (
          <div className="space-y-4">
            {pendingOrders.slice(0, 10).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onComplete={() => handleCompleteOrder(order.id)}
                onCancel={() => onCancelOrder(order.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* モーダル */}
      {resetModalOpen && (
        <ResetConfirmModal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          onConfirm={handleResetOrdersOnly}
          isProcessing={isResetting}
        />
      )}

      {restoreModalOpen && (
        <RestoreModal
          isOpen={restoreModalOpen}
          onClose={() => setRestoreModalOpen(false)}
          backups={backups}
          onRestore={handleRestoreFromBackup}
          isProcessing={isResetting}
        />
      )}

      {proxyModalOpen && (
        <ProxyOrderModal
          products={products}
          onClose={() => setProxyModalOpen(false)}
          onOrder={handleProxyOrder}
        />
      )}
    </div>
  );
};

// ダッシュボードカードコンポーネント
const DashboardCard = React.memo(({ icon, title, value, subtitle }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-2">
      {icon}
    </div>
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
));
DashboardCard.displayName = 'DashboardCard';

// 注文カードコンポーネント
const OrderCard = React.memo(({ order, onComplete, onCancel }) => (
  <div className="border rounded-lg p-4 bg-gray-50">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="font-bold text-lg">整理番号 #{order.ticketNumber}</h3>
        <p className="text-sm text-gray-600">
          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : '日時不明'}
        </p>
        {order.isProxy && (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
            代理注文
          </span>
        )}
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">¥{order.totalAmount.toLocaleString()}</p>
      </div>
    </div>
    
    <div className="mb-3">
      <h4 className="font-medium text-gray-700 mb-2">注文内容:</h4>
      <ul className="text-sm text-gray-600">
        {order.items.map((item, index) => (
          <li key={index} className="flex justify-between">
            <span>{item.name}</span>
            <span>{item.quantity}個</span>
          </li>
        ))}
      </ul>
    </div>
    
    <div className="flex gap-2">
      <Button onClick={onComplete} variant="success" size="sm" className="flex-1">
        <CheckCircle size={16} />
        受け渡し完了
      </Button>
      <Button onClick={onCancel} variant="danger" size="sm" className="flex-1">
        <X size={16} />
        取り消し
      </Button>
    </div>
  </div>
));
OrderCard.displayName = 'OrderCard';

// 仮のモーダルコンポーネント（後で分離予定）
const ResetConfirmModal = ({ isOpen, onClose, onConfirm, isProcessing }) => {
  if (!isOpen) return null;
  // 簡略化された実装
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4">データリセット確認</h3>
        <p>本当にリセットしますか？</p>
        <div className="flex gap-2 mt-4">
          <Button onClick={onClose}>キャンセル</Button>
          <Button onClick={() => onConfirm("管理者")} variant="danger">リセット実行</Button>
        </div>
      </div>
    </div>
  );
};

const RestoreModal = ({ isOpen, onClose, backups, onRestore, isProcessing }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">データ復元</h3>
        <p>復元するバックアップを選択してください</p>
        <div className="mt-4 space-y-2">
          {backups.map((backup) => (
            <button
              key={backup.id}
              onClick={() => onRestore(backup.id, "管理者")}
              className="w-full text-left p-2 border rounded hover:bg-gray-50"
            >
              {backup.createdAt.toDate().toLocaleString()} - {backup.executorName}
            </button>
          ))}
        </div>
        <Button onClick={onClose} className="mt-4">閉じる</Button>
      </div>
    </div>
  );
};

const ProxyOrderModal = ({ products, onClose, onOrder }) => {
  if (!products) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4">代理注文</h3>
        <p>代理注文機能は開発中です</p>
        <Button onClick={onClose} className="mt-4">閉じる</Button>
      </div>
    </div>
  );
};

export default React.memo(AdminPage); 