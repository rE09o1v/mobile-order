"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Ticket } from 'lucide-react';
import { runTransaction, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Button from '../ui/Button';

const TicketPage = ({ lastOrder, setPage, orders, setCompletedOrder }) => {
  const [isCancelling, setIsCancelling] = useState(false);

  // 注文ステータスをリアルタイムで確認
  useEffect(() => {
    if (lastOrder) {
      const currentOrder = orders.find(o => o.id === lastOrder.id);
      if (currentOrder) {
        if (currentOrder.status === "completed") {
          // 完了済みの場合は感謝メッセージページに遷移
          setCompletedOrder(currentOrder);
          setPage("thankYou");
        } else if (currentOrder.status === "cancelled") {
          // 取り消し済みの場合は注文ページに戻る
          alert("この注文は取り消されました。");
          setPage("customer");
        }
      }
    }
  }, [orders, lastOrder, setPage, setCompletedOrder]);

  if (!lastOrder) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>注文情報が見つかりません。</p>
        <Button onClick={() => setPage("customer")}>
          注文ページに戻る
        </Button>
      </div>
    );
  }

  const ticketUrl = `${window.location.href.split("?")[0]}?page=ticket&orderId=${lastOrder.id}`;

  // QRコードにより実用的な情報を含める
  const qrCodeData = {
    ticketNumber: lastOrder.ticketNumber,
    orderId: lastOrder.id,
    items: lastOrder.items,
    totalAmount: lastOrder.totalAmount,
    createdAt: lastOrder.createdAt?.toDate ? lastOrder.createdAt.toDate().toISOString() : new Date().toISOString(),
    status: lastOrder.status || "pending"
  };

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    JSON.stringify(qrCodeData)
  )}`;

  const handleCancelOrder = async () => {
    if (!confirm("この注文を取り消しますか？取り消し後は元に戻せません。")) {
      return;
    }

    setIsCancelling(true);
    try {
      // 在庫を戻す
      await runTransaction(db, async (transaction) => {
        // 1. まず全ての読み取り操作を実行
        const orderRef = doc(db, "orders", lastOrder.id);
        const orderDoc = await transaction.get(orderRef);

        if (!orderDoc.exists()) {
          throw new Error("注文が見つかりません");
        }

        const order = orderDoc.data();

        // 各商品の現在の在庫を読み取り
        const productUpdates = [];
        for (const item of order.items) {
          const productRef = doc(db, "products", item.productId);
          const productDoc = await transaction.get(productRef);
          if (productDoc.exists()) {
            const currentStock = productDoc.data().stock;
            productUpdates.push({
              ref: productRef,
              newStock: currentStock + item.quantity
            });
          }
        }

        // 2. 次に全ての書き込み操作を実行
        // 各商品の在庫を更新
        for (const update of productUpdates) {
          transaction.update(update.ref, { stock: update.newStock });
        }

        // 注文ステータスを取り消しに更新
        transaction.update(orderRef, {
          status: "cancelled",
          cancelledAt: new Date()
        });
      });

      alert("注文を取り消しました。在庫も戻されました。");
      setPage("customer");
    } catch (error) {
      console.error("注文取り消し中にエラーが発生しました:", error);
      alert("注文の取り消しに失敗しました: " + error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-8 text-center border-t-8 border-blue-500">
        <Ticket className="mx-auto text-blue-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-600">
          ご注文ありがとうございます
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          商品受け取り時にこの画面をお見せください
        </p>

        <div className="bg-gray-100 p-6 rounded-lg my-6">
          <p className="text-lg text-gray-600">整理番号</p>
          <p className="text-7xl font-extrabold tracking-wider text-blue-600">
            {String(lastOrder.ticketNumber).padStart(3, "0")}
          </p>
        </div>

        <div className="my-6">
          <Image
            src={qrCodeApiUrl}
            alt="整理券のQRコード"
            width={180}
            height={180}
            className="mx-auto"
          />
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setPage("customer")}
            className="w-full"
            variant="primary"
          >
            新しい注文をする
          </Button>
          
          <Button
            onClick={() => {
              // 整理券を再表示するためのURLをコピー
              navigator.clipboard.writeText(ticketUrl);
              alert('整理券のURLをクリップボードにコピーしました。\n\nこのURLをブックマークしておくと、後で整理券を再表示できます。');
            }}
            variant="secondary"
            className="w-full"
          >
            整理券URLをコピー
          </Button>
          
          <Button
            onClick={handleCancelOrder}
            disabled={isCancelling}
            variant="danger"
            className="w-full"
          >
            {isCancelling ? "取り消し中..." : "注文を取り消す"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketPage; 