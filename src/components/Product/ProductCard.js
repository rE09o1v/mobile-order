import React from 'react';
import Image from 'next/image';
import Button from '../ui/Button';

const ProductCard = ({ product, categories = [], onViewDetail }) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${isOutOfStock ? 'opacity-60' : ''}`}>
      <div className="relative">
        <Image
          src={product.imageUrl || "/images/placeholder.jpg"}
          alt={product.name}
          width={400}
          height={300}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = "/images/placeholder.jpg";
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-lg font-bold">売切れ</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {product.name}
        </h3>

        {product.category && (
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {categories.find(c => c.id === product.category)?.name || product.category}
            </span>
          </div>
        )}

        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description.length > 50
              ? `${product.description.substring(0, 50)}...`
              : product.description
            }
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">
            ¥{product.price.toLocaleString()}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              在庫: {product.stock}
            </span>
            <Button
              onClick={() => onViewDetail(product)}
              disabled={isOutOfStock}
              size="sm"
            >
              詳細を見る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 