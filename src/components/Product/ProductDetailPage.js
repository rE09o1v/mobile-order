"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Plus, Minus, ShoppingCart, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

const ProductDetailPage = ({ product, onAddToCart, onBack, setSuccessMessage }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      alert("在庫が不足しています");
      return;
    }
    onAddToCart(product, quantity);
    setSuccessMessage(`${product.name} を ${quantity}個 カートに追加しました`);
    setQuantity(1);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const isOutOfStock = product.stock <= 0;
  const isQuantityExceedsStock = quantity > product.stock;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            商品一覧に戻る
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 商品画像 */}
          <div className="relative h-80 md:h-96">
            <Image
              src={product.imageUrl || "/images/placeholder.jpg"}
              alt={product.name}
              fill
              className="object-cover"
              onError={(e) => {
                e.target.src = "/images/placeholder.jpg";
              }}
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">売切れ</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* 商品基本情報 */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-blue-600">
                  ¥{product.price.toLocaleString()}
                </span>
                <div className="text-right">
                  <span className="text-sm text-gray-500">在庫</span>
                  <span className={`ml-2 font-medium ${
                    product.stock <= 5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {product.stock}個
                  </span>
                </div>
              </div>
            </div>

            {/* 商品説明 */}
            {product.description && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                  <ShoppingCart size={20} className="mr-2 text-blue-600" />
                  商品説明
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* 栄養成分情報 */}
            {product.nutrition && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  栄養成分（1個あたり）
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {product.nutrition}
                </p>
              </div>
            )}

            {/* アレルゲン情報 */}
            {product.allergens && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h2 className="text-lg font-bold text-red-800 mb-2 flex items-center">
                  <AlertTriangle size={20} className="mr-2 text-red-600" />
                  アレルゲン情報
                </h2>
                <p className="text-red-700 font-medium">
                  {product.allergens}
                </p>
              </div>
            )}

            {/* 数量選択とカート追加 */}
            {!isOutOfStock && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-medium text-gray-700">数量を選択:</span>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      variant="outline"
                      size="sm"
                      className="w-10 h-10 p-0"
                    >
                      <Minus size={16} />
                    </Button>
                    
                    <span className="text-xl font-bold w-12 text-center">
                      {quantity}
                    </span>
                    
                    <Button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      variant="outline"
                      size="sm"
                      className="w-10 h-10 p-0"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                {isQuantityExceedsStock && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-red-700 text-sm">
                      選択した数量が在庫を超えています。最大{product.stock}個まで選択可能です。
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">小計:</span>
                    <span className="font-bold text-blue-600">
                      ¥{(product.price * quantity).toLocaleString()}
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleAddToCart}
                    disabled={isQuantityExceedsStock}
                    className="w-full h-12"
                    size="lg"
                  >
                    <ShoppingCart size={20} />
                    カートに入れる
                  </Button>
                </div>
              </div>
            )}

            {isOutOfStock && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-gray-600 text-lg">申し訳ございません。この商品は現在売切れです。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage; 