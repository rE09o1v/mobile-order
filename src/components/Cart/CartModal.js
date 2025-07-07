"use client";

import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const CartModal = ({ cart, setCart, onCheckout, onClose }) => {
  const cartItems = Object.values(cart);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart[productId]) {
        newCart[productId].quantity += delta;
        if (newCart[productId].quantity <= 0) {
          delete newCart[productId];
        }
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">カート</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
            aria-label="カートを閉じる"
          >
            <X size={24} />
          </button>
        </div>

        {/* カート内容 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">カートが空です</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      ¥{item.price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      aria-label="数量を減らす"
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      aria-label="数量を増やす"
                    >
                      <Plus size={16} />
                    </button>
                    
                    <button
                      onClick={() => updateQuantity(item.id, -item.quantity)}
                      className="p-1 hover:bg-red-100 rounded-full transition-colors text-red-600 ml-2"
                      aria-label="商品を削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        {cartItems.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">合計:</span>
              <span className="text-xl font-bold text-blue-600">
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearCart}
                className="flex-1"
              >
                <Trash2 size={16} />
                すべて削除
              </Button>
              
              <Button
                onClick={onCheckout}
                className="flex-1"
              >
                注文を確定して整理券を受け取る
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal; 