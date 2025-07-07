"use client";

import React from 'react';
import { CheckCircle } from 'lucide-react';
import Button from '../ui/Button';

const ThankYouPage = ({ completedOrder, setPage }) => {
  if (!completedOrder) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>完了した注文情報が見つかりません。</p>
        <Button onClick={() => setPage("customer")}>
          注文ページに戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-8 text-center border-t-8 border-green-500">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ご利用ありがとうございました！
        </h2>
        <p className="text-gray-600 mb-6">
          商品の受け渡しが完了しました。<br />
          おいしいアイスクリームをお楽しみください。
        </p>

        <div className="bg-green-50 p-6 rounded-lg my-6">
          <p className="text-lg text-gray-700 mb-2">整理番号</p>
          <p className="text-4xl font-extrabold tracking-wider text-green-600">
            {String(completedOrder.ticketNumber).padStart(3, "0")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            完了時刻: {completedOrder.completedAt?.toDate ? 
              completedOrder.completedAt.toDate().toLocaleTimeString() : 
              new Date().toLocaleTimeString()
            }
          </p>
        </div>

        {/* 注文内容 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-gray-800 mb-3">注文内容</h3>
          <div className="space-y-2">
            {completedOrder.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-green-600 font-medium">
                  {item.quantity}個
                </span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span className="text-black">合計金額</span>
            <span className="text-green-600">
              ¥{completedOrder.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <Button
          onClick={() => setPage("customer")}
          className="w-full"
          size="lg"
        >
          新しい注文をする
        </Button>

        <p className="text-xs text-gray-400 mt-4">
          またのご利用をお待ちしております
        </p>
      </div>
    </div>
  );
};

export default ThankYouPage; 