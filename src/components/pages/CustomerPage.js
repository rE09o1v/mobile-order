"use client";

import React from 'react';
import { runTransaction, collection, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ProductCard from '../Product/ProductCard';
import CartModal from '../Cart/CartModal';

const CustomerPage = ({ 
  products, 
  setPage, 
  setLastOrder, 
  cart, 
  setCart, 
  cartModalOpen, 
  setCartModalOpen, 
  setSelectedProduct, 
  currentTenant, 
  categories, 
  currentCategory, 
  setCurrentCategory,
  selectedTenantId 
}) => {
  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setPage("productDetail");
  };

  // カテゴリでフィルタリングされた商品を取得
  const filteredProducts = currentCategory === "all" 
    ? products 
    : products.filter(product => product.category === currentCategory);

  const handleCheckout = async () => {
    console.log("注文処理を開始します:", cart);
    const orderItems = Object.values(cart).map((item) => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    try {
      // Firestoreのトランザクションを使って、在庫の更新と注文の記録を安全に行う
      const newOrderData = await runTransaction(db, async (transaction) => {
        // すべての読み取りを先に実行
        const productRefs = orderItems.map((item) =>
          doc(db, "products", item.productId)
        );
        const productDocs = await Promise.all(
          productRefs.map((ref) => transaction.get(ref))
        );

        // 現在選択中のテナントID
        const tenantId = selectedTenantId;
        
        // 最新の注文番号を取得（テナント毎）
        const latestOrderRef = doc(db, "metadata", `latestOrder_${tenantId}`);
        const latestOrderSnapshot = await transaction.get(latestOrderRef);
        const lastOrderNumber = latestOrderSnapshot.exists()
          ? latestOrderSnapshot.data().number
          : 0;
        const newOrderNumber = lastOrderNumber + 1;

        // 在庫チェック
        for (let i = 0; i < productDocs.length; i++) {
          const productDoc = productDocs[i];
          const orderItem = orderItems[i];
          if (
            !productDoc.exists() ||
            productDoc.data().stock < orderItem.quantity
          ) {
            throw new Error(`${orderItem.name}の在庫が不足しています。`);
          }
        }

        // すべての書き込みを後で実行
        // 在庫を減らす
        productDocs.forEach((productDoc, i) => {
          const newStock = productDoc.data().stock - orderItems[i].quantity;
          transaction.update(productDoc.ref, { stock: newStock });
        });

        // 注文記録を作成
        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, {
          tenantId: tenantId, // テナントIDを追加
          items: orderItems,
          totalAmount: totalAmount,
          createdAt: new Date(),
          ticketNumber: newOrderNumber,
          status: "pending", // ステータスを追加
        });

        // 最新注文番号を更新
        transaction.set(latestOrderRef, { number: newOrderNumber });

        return { id: newOrderRef.id, ticketNumber: newOrderNumber };
      });

      console.log("注文が作成されました:", newOrderData.id);
      setLastOrder(newOrderData);
      setCart({});
      setPage("ticket");
    } catch (e) {
      console.error("注文処理中にエラーが発生しました: ", e);
      alert(`エラー: ${e.message}`);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        {/* 店舗情報ヘッダー */}
        {currentTenant && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ color: currentTenant.settings?.themeColor }}>
              {currentTenant.name}
            </h1>
            <p className="text-gray-600 mb-4">{currentTenant.settings?.description}</p>
            <div className="text-sm text-gray-500">
              <p>{currentTenant.settings?.address}</p>
              <p>TEL: {currentTenant.settings?.phone}</p>
            </div>
          </div>
        )}

        {/* カテゴリフィルター */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setCurrentCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  currentCategory === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                すべて
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setCurrentCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    currentCategory === category.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {currentCategory === "all" 
            ? "商品をえらんでください" 
            : categories.find(c => c.id === currentCategory)?.name || "商品をえらんでください"
          }
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">選択されたカテゴリに商品がありません。</p>
          </div>
        )}

        {/* カートモーダル */}
        {cartModalOpen && (
          <CartModal
            cart={cart}
            setCart={setCart}
            onCheckout={handleCheckout}
            onClose={() => setCartModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerPage; 