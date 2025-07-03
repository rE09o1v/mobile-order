"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  runTransaction,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  Wifi,
  BatteryFull,
  X,
  ShoppingCart,
  User,
  Ticket,
  BarChart2,
  AlertTriangle,
  Lock,
  QrCode,
  CheckCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

// --- Firebaseの初期設定 ---
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-x6D3zA8o9LNXTpMjQK142Lw66z549PA",
  authDomain: "f-ice-913c7.firebaseapp.com",
  projectId: "f-ice-913c7",
  storageBucket: "f-ice-913c7.firebasestorage.app",
  messagingSenderId: "966826031567",
  appId: "1:966826031567:web:85b08aab43d2e0eb303aba",
  measurementId: "G-NBN18MQRPC"
};

// --- Firebaseアプリの初期化 ---
// 設定が有効な場合のみ初期化
let app;
let db;
let storage;
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
}

// --- 画像アップロード関数 ---
const uploadImage = async (file, productId) => {
  if (!storage) {
    throw new Error("Firebase Storageが初期化されていません");
  }

  // ファイルサイズチェック（5MB以下）
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("ファイルサイズは5MB以下にしてください");
  }

  // ファイル形式チェック
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("JPEG、PNG、WebP形式の画像のみアップロード可能です");
  }

  try {
    // ファイル名を生成（productId_timestamp.extension）
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${productId}_${timestamp}.${fileExtension}`;

    // Storageの参照を作成
    const storageRef = ref(storage, `product-images/${fileName}`);

    // ファイルをアップロード
    const snapshot = await uploadBytes(storageRef, file);

    // ダウンロードURLを取得
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("画像アップロードエラー:", error);
    throw new Error("画像のアップロードに失敗しました");
  }
};

// --- 画像削除関数 ---
const deleteImage = async (imageUrl) => {
  if (!storage || !imageUrl) return;

  try {
    // URLからファイルパスを抽出
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0];
    const storageRef = ref(storage, `product-images/${fileName}`);

    await deleteObject(storageRef);
  } catch (error) {
    console.error("画像削除エラー:", error);
    // 削除に失敗しても処理を続行
  }
};

// --- ダミーデータ設定用の関数 ---
// 初回実行時にFirestoreにサンプルデータを作成します。
const setupInitialData = async () => {
  if (!db) return; // DBが初期化されていなければ何もしない
  console.log("初期データのセットアップを確認します...");

  // データをリセットする場合は、この行をコメントアウトしてください
  //await deleteDoc(doc(db, "metadata", "setupComplete"));

  const metadataDoc = await getDoc(doc(db, "metadata", "setupComplete"));
  if (!metadataDoc.exists()) {
    console.log("初期データを作成します...");
    const initialProducts = [
      {
        id: "vanilla",
        name: "濃厚バニラ",
        price: 300,
        stock: 50,
        maxStock: 100,
        imageUrl: "/images/choco-mint.jpg",
        description: "厳選されたマダガスカル産バニラビーンズを使用した、濃厚でクリーミーなアイスクリームです。口いっぱいに広がる上品な甘さをお楽しみください。",
        nutrition: "エネルギー: 180kcal, タンパク質: 3.2g, 脂質: 8.5g, 炭水化物: 22.1g, 食塩相当量: 0.15g (100g当たり)",
        allergens: "乳成分、卵を含む"
      },
      {
        id: "chocolate",
        name: "とろけるチョコ",
        price: 350,
        stock: 50,
        maxStock: 100,
        imageUrl: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&h=300&fit=crop",
        description: "ベルギー産高級カカオを贅沢に使用したチョコレートアイスクリーム。深いコクと滑らかな口当たりが特徴的な逸品です。",
        nutrition: "エネルギー: 195kcal, タンパク質: 4.1g, 脂質: 9.8g, 炭水化物: 21.5g, 食塩相当量: 0.18g (100g当たり)",
        allergens: "乳成分、卵、大豆を含む"
      },
      {
        id: "strawberry",
        name: "果肉いちご",
        price: 350,
        stock: 40,
        maxStock: 80,
        imageUrl: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop",
        description: "栃木県産とちおとめを丸ごと使用し、果肉の食感を残したフルーティーなアイスクリーム。いちご本来の甘酸っぱさが楽しめます。",
        nutrition: "エネルギー: 165kcal, タンパク質: 2.8g, 脂質: 7.2g, 炭水化物: 24.3g, 食塩相当量: 0.12g (100g当たり)",
        allergens: "乳成分、卵を含む"
      },
      {
        id: "matcha",
        name: "本格抹茶",
        price: 400,
        stock: 30,
        maxStock: 60,
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
        description: "京都宇治産の最高級抹茶を使用した本格的な和風アイスクリーム。抹茶の深い味わいと上品な苦味が楽しめる大人の味です。",
        nutrition: "エネルギー: 175kcal, タンパク質: 3.5g, 脂質: 8.1g, 炭水化物: 20.8g, 食塩相当量: 0.14g (100g当たり)",
        allergens: "乳成分、卵を含む"
      },
    ];
    await runTransaction(db, async (transaction) => {
      initialProducts.forEach((prod) => {
        transaction.set(doc(db, "products", prod.id), prod);
      });
      transaction.set(doc(db, "metadata", "setupComplete"), { done: true });
      transaction.set(doc(db, "metadata", "latestOrder"), { number: 0 });
    });
    console.log("初期データを作成しました。");
  } else {
    console.log("データは既に存在します。");
  }
};

// --- 管理画面ログインモーダル ---
const AdminLoginModal = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // パスワードをチェック（デフォルト: "admin123"）
    const correctPassword = "staff1fstd";

    if (password === correctPassword) {
      // ログイン成功
      onLogin();
      setPassword("");
    } else {
      setError("パスワードが正しくありません");
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/70 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <Lock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">管理者認証</h2>
          <p className="text-gray-600 mt-2">管理画面にアクセスするにはパスワードを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="パスワードを入力"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors bg-white"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "認証中..." : "ログイン"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ヘッダーコンポーネント ---
const AppHeader = ({ page, setPage, onAdminClick, cart, setCartModalOpen }) => (
  <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-40">
    <div className="container mx-auto px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800">🍦 Welcome to BlueRush</div>
        {/* カートボタン */}
        <button
          className="relative bg-blue-500 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center hover:bg-blue-600 transition-colors"
          onClick={() => setCartModalOpen(true)}
        >
          <ShoppingCart size={24} />
          {Object.keys(cart).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
              {Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>
    </div>
    <nav className="bg-gray-100">
      <div className="container mx-auto px-4 flex justify-around">
        <button
          onClick={() => setPage("customer")}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${page === "customer"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600"
            }`}
        >
          <ShoppingCart size={16} /> 注文
        </button>
        <button
          onClick={onAdminClick}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${page === "admin"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600"
            }`}
        >
          <BarChart2 size={16} /> 管理
        </button>
      </div>
    </nav>
  </header>
);

// --- 商品カードコンポーネント ---
const ProductCard = ({ product, onViewDetail }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
    <Image
      src={product.imageUrl}
      alt={product.name}
      width={400}
      height={160}
      className="w-full h-40 object-cover"
    />
    <div className="p-4">
      <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
      <p className="text-xl font-light text-gray-700 mt-1">¥{product.price}</p>
      <p
        className={`text-sm font-semibold mt-2 ${product.stock > 10
          ? "text-green-600"
          : product.stock > 0
            ? "text-yellow-600"
            : "text-red-600"
          }`}
      >
        在庫: {product.stock > 0 ? `あと ${product.stock} 個` : "売り切れ"}
      </p>
      <button
        onClick={e => { e.stopPropagation(); onViewDetail(product); }}
        disabled={product.stock === 0}
        className="w-full mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center gap-2"
      >
        <ShoppingCart size={16} />
        <span>詳細を見る</span>
      </button>
    </div>
  </div>
);

// --- 商品詳細画面 ---
const ProductDetailPage = ({ product, onAddToCart, onBack, setSuccessMessage }) => {
  const [quantity, setQuantity] = useState(1);

  // ページ遷移時に自動的に最上部にスクロール
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setSuccessMessage(`${product.name}を${quantity}個カートに追加しました！`);
    setTimeout(() => {
      setSuccessMessage("");
      onBack();
    }, 1500);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* ヘッダー */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800 truncate">{product.name}</h1>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* 商品画像 */}
        <div className="mb-6">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={300}
            className="w-full h-64 object-cover rounded-xl"
          />
        </div>

        {/* 商品情報 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
          <p className="text-3xl font-bold text-blue-600 mb-4">¥{product.price.toLocaleString()}</p>

          {/* 商品説明 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">商品説明</h3>
            <p className="text-gray-700">
              {product.description || "厳選された素材を使用した、こだわりのアイスクリームです。濃厚でなめらかな口当たりをお楽しみください。"}
            </p>
          </div>

          {/* 栄養成分 */}
          {product.nutrition && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">栄養成分</h3>
              <p className="text-gray-700 text-sm">
                {product.nutrition}
              </p>
            </div>
          )}

          {/* アレルゲン情報 */}
          {product.allergens && (
            <div className="bg-orange-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">アレルゲン情報</h3>
              <p className="text-gray-700 text-sm">
                <span className="font-medium text-orange-700">⚠️ 含まれるアレルゲン: </span>
                {product.allergens}
              </p>
            </div>
          )}

          {/* 在庫状況 */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${product.stock > 10 ? "bg-green-500" :
              product.stock > 0 ? "bg-yellow-500" : "bg-red-500"
              }`}></div>
            <span className={`font-semibold ${product.stock > 10 ? "text-green-600" :
              product.stock > 0 ? "text-yellow-600" : "text-red-600"
              }`}>
              {product.stock > 0 ? `在庫あり（あと${product.stock}個）` : "売り切れ"}
            </span>
          </div>
        </div>

        {/* 数量選択 */}
        {product.stock > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">数量を選択</h3>
            <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-lg p-4">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="w-12 h-12 rounded-full bg-white border border-gray-300 text-gray-600 text-xl font-bold flex items-center justify-center hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold text-gray-800 min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
                className="w-12 h-12 rounded-full bg-white border border-gray-300 text-gray-600 text-xl font-bold flex items-center justify-center hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                ＋
              </button>
            </div>
          </div>
        )}

        {/* 合計金額表示 */}
        {product.stock > 0 && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">小計</span>
              <span className="text-2xl font-bold text-blue-600">
                ¥{(product.price * quantity).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* カートに追加ボタン */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-300 text-lg flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} />
          <span>
            {product.stock > 0 ? "カートに追加" : "売り切れ"}
          </span>
        </button>
      </div>
    </div>
  );
};

// --- 成功メッセージコンポーネント ---
const SuccessMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down">
      <div className="flex items-center gap-2">
        <CheckCircle size={20} />
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
};

// --- カートモーダル ---
const CartModal = ({ cart, setCart, onCheckout, onClose }) => {
  if (Object.keys(cart).length === 0) return null;

  const totalAmount = Object.values(cart).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = Object.values(cart).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const updateQuantity = (productId, delta) => {
    const newCart = { ...cart };
    if (newCart[productId]) {
      newCart[productId].quantity += delta;
      if (newCart[productId].quantity <= 0) {
        delete newCart[productId];
      }
    }
    setCart(newCart);
  };

  const clearCart = () => {
    setCart({});
  };

  return (
    <div
      className="fixed inset-0 bg-white/70 flex justify-center items-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl p-6 shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">注文内容の確認</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={28} />
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto pr-2">
          {Object.values(cart).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between mb-4"
            >
              <div>
                <p className="font-semibold text-gray-700">{item.name}</p>
                <p className="text-sm text-gray-500">¥{item.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-2xl font-bold flex items-center justify-center hover:bg-blue-200 transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-extrabold text-xl text-gray-900">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-2xl font-bold flex items-center justify-center hover:bg-blue-200 transition-colors"
                >
                  ＋
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-gray-800">合計 <span className="text-blue-700">({totalItems}点)</span></span>
            <span className="text-green-700 text-2xl">¥{totalAmount}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full mt-4 bg-green-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-600 transition-colors duration-300 text-lg"
          >
            注文を確定して整理券を受け取る
          </button>
          <button
            onClick={clearCart}
            className="w-full mt-2 text-sm text-gray-500 hover:text-red-500"
          >
            カートを空にする
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 顧客向け注文ページ ---
const CustomerPage = ({ products, setPage, setLastOrder, cart, setCart, cartModalOpen, setCartModalOpen, setSelectedProduct }) => {
  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setPage("productDetail");
  };

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

        // 最新の注文番号を取得（読み取り）
        const latestOrderRef = doc(db, "metadata", "latestOrder");
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          商品をえらんでください
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
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

// --- スタッフ向け管理ページ ---
const AdminPage = ({ products, orders, onLogout, onOpenScanner, onOpenProductManagement, onCancelOrder }) => {
  // 完了した注文のみを売上計算に含める
  const completedOrders = orders.filter(order => order.status === "completed");
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  const salesByProduct = products.map((product) => {
    const soldQuantity = completedOrders.reduce((sum, order) => {
      const item = order.items.find((i) => i.productId === product.id);
      return sum + (item ? item.quantity : 0);
    }, 0);
    return {
      ...product,
      soldQuantity,
      revenue: soldQuantity * product.price,
    };
  });

  const pendingOrders = orders.filter(order => order.status === "pending");
  const cancelledOrders = orders.filter(order => order.status === "cancelled");

  const [isResetting, setIsResetting] = useState(false);
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [backups, setBackups] = useState([]);

  // バックアップ一覧を取得
  const fetchBackups = async () => {
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
  };

  // 注文データと売上データのみをリセット（商品データは保持）
  const handleResetOrdersOnly = async (executorName) => {
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
  };

  // バックアップからデータを復元
  const handleRestoreFromBackup = async (backupId, executorName) => {
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
  };



  const handleOpenResetModal = () => {
    setResetModalOpen(true);
  };

  const handleCloseResetModal = () => {
    setResetModalOpen(false);
  };

  const handleOpenRestoreModal = () => {
    fetchBackups();
    setRestoreModalOpen(true);
  };

  const handleCloseRestoreModal = () => {
    setRestoreModalOpen(false);
  };

  const handleOpenProxyModal = () => {
    setProxyModalOpen(true);
  };

  const handleProxyOrder = async (orderData) => {
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

      setProxyModalOpen(false);
      alert("代理注文を受け付けました。");
    } catch (error) {
      console.error("代理注文エラー:", error);
      alert("代理注文に失敗しました: " + error.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!confirm("この注文を受け渡し完了にしますか？")) {
      return;
    }

    try {
      // 注文ステータスを完了に更新
      await updateDoc(doc(db, "orders", orderId), {
        status: "completed",
        completedAt: new Date()
      });

      alert("注文を受け渡し完了にしました。");
    } catch (error) {
      console.error("注文完了エラー:", error);
      alert("注文の完了処理に失敗しました: " + error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* スマホ用ダッシュボードタイトルとボタン */}
      <div className="block sm:hidden mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">ダッシュボード</h2>
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            onClick={onOpenProductManagement}
            className="flex flex-col items-center justify-center aspect-square bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
          >
            <ShoppingCart className="w-8 h-8 mb-1" />
            <span className="text-xs">商品管理</span>
          </button>
          <button
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center aspect-square bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
          >
            <QrCode className="w-8 h-8 mb-1" />
            <span className="text-xs">QRスキャン</span>
          </button>
          <button
            onClick={handleOpenProxyModal}
            className="flex flex-col items-center justify-center aspect-square bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
          >
            <User className="w-8 h-8 mb-1" />
            <span className="text-xs">代理注文</span>
          </button>
          <button
            onClick={handleOpenResetModal}
            className="flex flex-col items-center justify-center aspect-square bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            <AlertTriangle className="w-8 h-8 mb-1" />
            <span className="text-xs">データリセット</span>
          </button>
          <button
            onClick={handleOpenRestoreModal}
            className="flex flex-col items-center justify-center aspect-square bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
          >
            <RotateCcw className="w-8 h-8 mb-1" />
            <span className="text-xs">データ復元</span>
          </button>
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center aspect-square bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            <Lock className="w-8 h-8 mb-1" />
            <span className="text-xs">ログアウト</span>
          </button>
        </div>
      </div>
      {/* PC用ダッシュボードタイトルとボタン */}
      <div className="hidden sm:flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ダッシュボード</h2>
        <div className="flex gap-3">
          <button
            onClick={onOpenProductManagement}
            className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <ShoppingCart size={16} />
            商品管理
          </button>
          <button
            onClick={onOpenScanner}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <QrCode size={16} />
            QRスキャン
          </button>
          <button
            onClick={handleOpenProxyModal}
            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <User size={16} />
            代理注文
          </button>
          <button
            onClick={handleOpenResetModal}
            className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            注文データリセット
          </button>
          <button
            onClick={handleOpenRestoreModal}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            データ復元
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Lock size={16} />
            ログアウト
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-lg font-bold text-gray-700 mb-4">完了済み注文の売上</h3>
        <p className="text-4xl font-extrabold text-blue-600">
          ¥{totalRevenue.toLocaleString()}
        </p>
        <p className="text-gray-500 mt-1">完了済み {completedOrders.length} 件の注文</p>
        <div className="flex gap-4 mt-4">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-yellow-800 font-semibold">対応中: {pendingOrders.length}件</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-green-800 font-semibold">完了: {completedOrders.length}件</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-red-800 font-semibold">取り消し: {cancelledOrders.length}件</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 在庫状況 */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-700 mb-4">
            リアルタイム在庫状況
          </h3>
          <div className="space-y-4">
            {products.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-600">{p.name}</span>
                  <span
                    className={`font-bold ${p.stock > 10
                      ? "text-green-600"
                      : p.stock > 0
                        ? "text-yellow-600"
                        : "text-red-600"
                      }`}
                  >
                    {p.stock} 個
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${p.stock > 10
                      ? "bg-green-500"
                      : p.stock > 0
                        ? "bg-yellow-500"
                        : "bg-red-500"
                      }`}
                    style={{ width: `${(p.stock / (p.maxStock || 50)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 商品別売上 */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-700 mb-4">
            商品別 売上レポート（完了済みのみ）
          </h3>
          <div className="space-y-3">
            {salesByProduct.map((p) => (
              <div key={p.id} className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">{p.name}</span>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{p.soldQuantity} 個</p>
                  <p className="text-sm text-gray-500">
                    ¥{p.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最新注文一覧 */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-700 mb-4">
            最新注文一覧
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {orders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className={`p-3 rounded-lg border ${order.status === "completed"
                  ? "bg-green-50 border-green-200"
                  : order.status === "cancelled"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">
                      整理番号: {String(order.ticketNumber).padStart(3, "0")}
                      {order.isProxy && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                          代理
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      ¥{order.totalAmount.toLocaleString()} ({order.items.reduce((sum, item) => sum + item.quantity, 0)}点)
                    </p>
                    {/* 商品詳細表示 */}
                    <div className="text-xs text-gray-600 mt-1">
                      {order.items.map((item, index) => (
                        <span key={index}>
                          {item.name || item.productName}×{item.quantity}
                          {index < order.items.length - 1 ? "、" : ""}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.createdAt?.toDate ?
                        order.createdAt.toDate().toLocaleString('ja-JP') :
                        new Date().toLocaleString('ja-JP')
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {order.status === "completed" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600 font-semibold">完了</span>
                      </>
                    ) : order.status === "cancelled" ? (
                      <>
                        <X className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-red-600 font-semibold">取り消し</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                        <span className="text-xs text-yellow-600 font-semibold">対応中</span>
                        <div className="ml-2 flex gap-1">
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors font-medium"
                          >
                            受け渡し完了
                          </button>
                          <button
                            onClick={() => onCancelOrder(order.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors font-medium"
                          >
                            取り消し
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleOpenResetModal}
          className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <AlertTriangle size={16} />
          注文データリセット
        </button>
        <button
          onClick={handleOpenRestoreModal}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <RotateCcw size={16} />
          データ復元
        </button>
      </div>

      {/* リセット確認モーダル */}
      <ResetConfirmModal
        isOpen={resetModalOpen}
        onClose={handleCloseResetModal}
        onConfirm={handleResetOrdersOnly}
        isProcessing={isResetting}
      />

      {/* 復元モーダル */}
      <RestoreModal
        isOpen={restoreModalOpen}
        onClose={handleCloseRestoreModal}
        backups={backups}
        onRestore={handleRestoreFromBackup}
        isProcessing={isResetting}
      />

      {/* 代理注文モーダル */}
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

// --- 整理券ページ ---
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
        <button
          onClick={() => setPage("customer")}
          className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded"
        >
          注文ページに戻る
        </button>
      </div>
    );
  }

  const ticketUrl = `${window.location.href.split("?")[0]
    }?page=ticket&orderId=${lastOrder.id}`;

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
          <button
            onClick={() => setPage("customer")}
            className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors duration-300"
          >
            新しい注文をする
          </button>
          <button
            onClick={() => {
              // 整理券を再表示するためのURLをコピー
              navigator.clipboard.writeText(ticketUrl);
              alert('整理券のURLをクリップボードにコピーしました。\n\nこのURLをブックマークしておくと、後で整理券を再表示できます。');
            }}
            className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors duration-300"
          >
            整理券URLをコピー
          </button>
          <button
            onClick={handleCancelOrder}
            disabled={isCancelling}
            className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {isCancelling ? "取り消し中..." : "注文を取り消す"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 受け渡し完了感謝メッセージページ ---
const ThankYouPage = ({ completedOrder, setPage }) => {
  if (!completedOrder) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>完了した注文情報が見つかりません。</p>
        <button
          onClick={() => setPage("customer")}
          className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded"
        >
          注文ページに戻る
        </button>
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
              completedOrder.completedAt.toDate().toLocaleString('ja-JP') :
              new Date().toLocaleString('ja-JP')
            }
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">ご注文内容</h3>
          <div className="space-y-1">
            {completedOrder.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-semibold text-green-600">{item.quantity}個</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span className="text-gray-800">合計金額</span>
              <span className="text-green-600">¥{completedOrder.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setPage("customer")}
            className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-600 transition-colors duration-300"
          >
            新しい注文をする
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ★ 新規追加: 設定案内コンポーネント ★ ---
const SetupGuide = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
    <div className="max-w-2xl w-full p-8 bg-white rounded-lg shadow-2xl text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
      <h1 className="mt-4 text-2xl font-bold text-gray-800">
        初期設定が必要です
      </h1>
      <p className="mt-2 text-gray-600">
        このアプリケーションを実行するには、Firebaseの接続情報（`firebaseConfig`）をあなたのプロジェクトのものに更新する必要があります。
      </p>
      <div className="mt-6 text-left bg-gray-800 text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
        <pre>
          <code>
            {`// このコードをあなたのFirebase設定に書き換えてください。
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};`}
          </code>
        </pre>
      </div>
      <p className="mt-4 text-gray-600">
        上記のコード内の{" "}
        <code className="bg-gray-200 p-1 rounded">&quot;YOUR_API_KEY&quot;</code>{" "}
        などの値を、
        <a
          href="https://console.firebase.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-semibold"
        >
          Firebaseコンソール
        </a>
        で取得した実際のキーに置き換えてください。
      </p>
    </div>
  </div>
);

// --- 代理注文モーダル ---
const ProxyOrderModal = ({ products, onClose, onOrder }) => {
  const [selectedItems, setSelectedItems] = useState({});
  const [isOrdering, setIsOrdering] = useState(false);

  const updateQuantity = (productId, delta) => {
    setSelectedItems(prev => {
      const currentQuantity = prev[productId] || 0;
      const newQuantity = Math.max(0, Math.min(currentQuantity + delta, 10));
      if (newQuantity === 0) {
        const { [productId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQuantity };
    });
  };

  const totalAmount = Object.entries(selectedItems).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    return sum + (product ? product.price * quantity : 0);
  }, 0);

  const totalItems = Object.values(selectedItems).reduce((sum, quantity) => sum + quantity, 0);

  const handleOrder = async () => {
    if (totalItems === 0) {
      alert("商品を選択してください");
      return;
    }

    setIsOrdering(true);
    try {
      const orderData = {
        items: Object.entries(selectedItems).map(([productId, quantity]) => {
          const product = products.find(p => p.id === productId);
          return {
            productId,
            name: product.name, // nameとproductNameの両方を保存
            productName: product.name,
            price: product.price,
            quantity,
          };
        }),
        totalAmount,
      };

      await onOrder(orderData);
    } catch (error) {
      console.error("注文エラー:", error);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">代理注文</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* 選択中の商品一覧 */}
          {totalItems > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-3">選択中の商品</h3>
              <div className="space-y-2">
                {Object.entries(selectedItems).map(([productId, quantity]) => {
                  const product = products.find(p => p.id === productId);
                  return (
                    <div key={productId} className="flex justify-between items-center bg-white rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover"
                        />
                        <div>
                          <span className="font-bold text-gray-800">{product.name}</span>
                          <p className="text-sm text-gray-600">¥{product.price} × {quantity}個</p>
                        </div>
                      </div>
                      <div className="font-bold text-green-600">
                        ¥{(product.price * quantity).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 商品選択エリア */}
          <h3 className="font-bold text-gray-800 mb-4">商品を選択してください</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => {
              const isSelected = selectedItems[product.id] > 0;
              return (
                <div key={product.id} className={`rounded-lg p-4 border-2 transition-all ${isSelected
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="flex items-center gap-4">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600">¥{product.price}</p>
                      <p className="text-xs text-gray-500">在庫: {product.stock}個</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        disabled={!selectedItems[product.id]}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-gray-300 transition-colors"
                      >
                        -
                      </button>
                      <span className={`w-8 text-center font-bold ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                        {selectedItems[product.id] || 0}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        disabled={product.stock === 0 || (selectedItems[product.id] || 0) >= Math.min(product.stock, 10)}
                        className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">合計: {totalItems}点</p>
              <p className="text-xl font-bold text-blue-600">¥{totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleOrder}
              disabled={totalItems === 0 || isOrdering}
              className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
            >
              {isOrdering ? "注文中..." : "注文確定"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- QRコード読み取り画面 ---
const QRScannerPage = ({ onClose, onOrderComplete, setPage }) => {
  const [scannedData, setScannedData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    // 既存のスキャナーがあればクリア
    if (scanner) {
      scanner.clear();
    }

    // QRコードスキャナーの初期化
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    html5QrcodeScanner.render((decodedText) => {
      handleQRCodeScanned(decodedText);
    }, (error) => {
      // エラーは無視（継続的にスキャン）
    });

    setScanner(html5QrcodeScanner);

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
      }
    };
  }, []); // 空の依存関係配列で一度だけ実行

  const handleQRCodeScanned = async (decodedText) => {
    try {
      setError(null);
      setScannedData(decodedText);

      // QRコードのデータを解析
      let orderInfo;
      try {
        orderInfo = JSON.parse(decodedText);
      } catch (e) {
        // JSONでない場合は、URLパラメータから注文IDを抽出
        const urlParams = new URLSearchParams(decodedText.split('?')[1]);
        const orderId = urlParams.get('orderId');
        if (!orderId) {
          throw new Error('無効なQRコードです');
        }
        orderInfo = { orderId };
      }

      // Firestoreから注文データを取得
      const orderDoc = await getDoc(doc(db, "orders", orderInfo.orderId));
      if (!orderDoc.exists()) {
        throw new Error('注文が見つかりません');
      }

      const order = { id: orderDoc.id, ...orderDoc.data() };

      // 既に完了済みの場合はエラー
      if (order.status === "completed") {
        throw new Error('この注文は既に完了済みです');
      }

      // 取り消し済みの場合はエラー
      if (order.status === "cancelled") {
        throw new Error('この注文は取り消し済みです。整理券が無効になっています。');
      }

      setOrderData(order);

      // スキャナーを停止
      if (scanner) {
        scanner.clear();
      }
    } catch (err) {
      setError(err.message);
      setOrderData(null);
    }
  };

  const handleCompleteOrder = async () => {
    if (!orderData) return;

    setIsProcessing(true);
    try {
      // 注文ステータスを完了に更新
      await updateDoc(doc(db, "orders", orderData.id), {
        status: "completed",
        completedAt: new Date()
      });

      // 完了コールバックを呼び出し
      onOrderComplete(orderData);

      // スタッフの画面を閉じる（客の画面遷移はFirestoreのリアルタイム更新で処理）
      onClose();
    } catch (err) {
      setError('注文の完了処理中にエラーが発生しました: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setScannedData(null);
    setOrderData(null);
    setError(null);

    // スキャナーを再初期化
    if (scanner) {
      scanner.clear();
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    html5QrcodeScanner.render((decodedText) => {
      handleQRCodeScanned(decodedText);
    }, (error) => {
      // エラーは無視
    });

    setScanner(html5QrcodeScanner);
  };

  return (
    <div className="fixed inset-0 bg-white/70 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Camera className="h-6 w-6" />
            QRコード読み取り
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={28} />
          </button>
        </div>

        {!orderData && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              お客様の整理券のQRコードをカメラにかざしてください
            </p>
            <div id="qr-reader" className="mx-auto"></div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  再試行
                </button>
              </div>
            )}
          </div>
        )}

        {orderData && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">QRコード読み取り成功</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">注文内容</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">整理番号:</span>
                  <span className="font-bold text-blue-600">
                    {String(orderData.ticketNumber).padStart(3, "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">注文時刻:</span>
                  <span className="font-bold text-gray-900">
                    {orderData.createdAt?.toDate ?
                      orderData.createdAt.toDate().toLocaleString('ja-JP') :
                      new Date().toLocaleString('ja-JP')
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">合計金額:</span>
                  <span className="font-bold text-green-600">
                    ¥{orderData.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-3">商品詳細</h4>
              <div className="space-y-3">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">{item.name}</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {item.quantity}個 × ¥{item.price} = ¥{(item.quantity * item.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCompleteOrder}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    処理中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    受け渡し完了
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 商品管理コンポーネント ---
const ProductManagement = ({ products, onClose, onProductUpdate }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    stock: 0,
    maxStock: 100,
    imageUrl: "",
    description: "",
    nutrition: "",
    allergens: ""
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
    setIsAddingProduct(false);
    setImagePreview(product.imageUrl);
    setSelectedFile(null);
  };

  const handleAddProduct = () => {
    setNewProduct({
      name: "",
      price: 0,
      stock: 0,
      maxStock: 100,
      imageUrl: "",
      description: "",
      nutrition: "",
      allergens: ""
    });
    setEditingProduct(null);
    setIsAddingProduct(true);
    setImagePreview(null);
    setSelectedFile(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);

      // プレビュー表示
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      let imageUrl = "";

      // 画像が選択されている場合はアップロード
      if (selectedFile) {
        const productId = isAddingProduct ? `product_${Date.now()}` : editingProduct.id;
        imageUrl = await uploadImage(selectedFile, productId);
        setUploadProgress(100);
      } else {
        // 既存の画像URLを使用
        imageUrl = isAddingProduct ? newProduct.imageUrl : editingProduct.imageUrl;
      }

      if (isAddingProduct) {
        // 新しい商品を追加
        const productId = `product_${Date.now()}`;
        await setDoc(doc(db, "products", productId), {
          ...newProduct,
          price: parseInt(newProduct.price),
          stock: parseInt(newProduct.stock),
          maxStock: parseInt(newProduct.maxStock),
          imageUrl: imageUrl
        });
        setNewProduct({ name: "", price: 0, stock: 0, maxStock: 100, imageUrl: "", description: "", nutrition: "", allergens: "" });
        setIsAddingProduct(false);
      } else if (editingProduct) {
        // 既存商品を更新
        await updateDoc(doc(db, "products", editingProduct.id), {
          name: editingProduct.name,
          price: parseInt(editingProduct.price),
          stock: parseInt(editingProduct.stock),
          maxStock: parseInt(editingProduct.maxStock),
          description: editingProduct.description || "",
          nutrition: editingProduct.nutrition || "",
          allergens: editingProduct.allergens || "",
          imageUrl: imageUrl
        });
        setEditingProduct(null);
      }

      // 状態をリセット
      setSelectedFile(null);
      setImagePreview(null);
      setUploadProgress(0);

      onProductUpdate();
    } catch (error) {
      console.error("商品の保存中にエラーが発生しました:", error);
      alert("商品の保存に失敗しました: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("この商品を削除しますか？")) return;

    setIsProcessing(true);
    try {
      // 商品の画像URLを取得して削除
      const product = products.find(p => p.id === productId);
      if (product && product.imageUrl) {
        await deleteImage(product.imageUrl);
      }

      await deleteDoc(doc(db, "products", productId));
      onProductUpdate();
    } catch (error) {
      console.error("商品の削除中にエラーが発生しました:", error);
      alert("商品の削除に失敗しました: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setIsAddingProduct(false);
    setNewProduct({
      name: "",
      price: 0,
      stock: 0,
      maxStock: 100,
      imageUrl: "",
      description: "",
      nutrition: "",
      allergens: ""
    });
    setSelectedFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  return (
    <div className="fixed inset-0 bg-white/70 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-4xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">商品管理</h2>
          <div className="flex gap-3">
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
            >
              新規追加
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* 商品一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
              {product.imageUrl && (
                <div className="mb-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
              )}
              <p className="text-sm text-gray-600">¥{product.price.toLocaleString()}</p>
              {product.description && (
                <p className="text-xs text-gray-500 mt-1 leading-tight">
                  {product.description.length > 50
                    ? product.description.substring(0, 50) + "..."
                    : product.description}
                </p>
              )}
              <p className={`text-sm font-semibold mt-2 ${product.stock > 10 ? "text-green-600" :
                product.stock > 0 ? "text-yellow-600" : "text-red-600"
                }`}>
                在庫: {product.stock}個 / {product.maxStock || 50}個
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full ${product.stock > 10
                    ? "bg-green-500"
                    : product.stock > 0
                      ? "bg-yellow-500"
                      : "bg-red-500"
                    }`}
                  style={{ width: `${(product.stock / (product.maxStock || 50)) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* 商品編集フォーム */}
        {(editingProduct || isAddingProduct) && (
          <div className="bg-gray-50 rounded-lg p-6 border">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {isAddingProduct ? "新規商品追加" : "商品編集"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品名
                </label>
                <input
                  type="text"
                  value={isAddingProduct ? newProduct.name : editingProduct.name}
                  onChange={(e) => {
                    if (isAddingProduct) {
                      setNewProduct({ ...newProduct, name: e.target.value });
                    } else {
                      setEditingProduct({ ...editingProduct, name: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="商品名を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  価格 (円)
                </label>
                <input
                  type="number"
                  value={isAddingProduct ? newProduct.price : editingProduct.price}
                  onChange={(e) => {
                    if (isAddingProduct) {
                      setNewProduct({ ...newProduct, price: e.target.value });
                    } else {
                      setEditingProduct({ ...editingProduct, price: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="価格を入力"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  在庫数
                </label>
                <input
                  type="number"
                  value={isAddingProduct ? newProduct.stock : editingProduct.stock}
                  onChange={(e) => {
                    if (isAddingProduct) {
                      setNewProduct({ ...newProduct, stock: e.target.value });
                    } else {
                      setEditingProduct({ ...editingProduct, stock: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="在庫数を入力"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  在庫上限
                </label>
                <input
                  type="number"
                  value={isAddingProduct ? newProduct.maxStock : editingProduct.maxStock}
                  onChange={(e) => {
                    if (isAddingProduct) {
                      setNewProduct({ ...newProduct, maxStock: e.target.value });
                    } else {
                      setEditingProduct({ ...editingProduct, maxStock: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="在庫上限を入力"
                  min="1"
                />
              </div>

            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品画像
              </label>
              <div className="space-y-3">
                {/* 画像アップロード */}
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>画像を選択</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  {selectedFile && (
                    <span className="text-sm text-gray-600">
                      {selectedFile.name}
                    </span>
                  )}
                </div>

                {/* 画像プレビュー */}
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="プレビュー"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* アップロード進捗 */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* 代替: 画像URL入力 */}
                <div className="text-sm text-gray-600">
                  <p>または画像URLを直接入力:</p>
                  <input
                    type="text"
                    value={isAddingProduct ? newProduct.imageUrl : editingProduct.imageUrl}
                    onChange={(e) => {
                      if (isAddingProduct) {
                        setNewProduct({ ...newProduct, imageUrl: e.target.value });
                      } else {
                        setEditingProduct({ ...editingProduct, imageUrl: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white mt-1"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* 商品説明 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品説明
              </label>
              <textarea
                value={isAddingProduct ? newProduct.description : (editingProduct.description || "")}
                onChange={(e) => {
                  if (isAddingProduct) {
                    setNewProduct({ ...newProduct, description: e.target.value });
                  } else {
                    setEditingProduct({ ...editingProduct, description: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="商品の詳細説明を入力してください"
                rows="3"
              />
            </div>

            {/* 栄養成分 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                栄養成分 (1個あたり)
              </label>
              <textarea
                value={isAddingProduct ? newProduct.nutrition : (editingProduct.nutrition || "")}
                onChange={(e) => {
                  if (isAddingProduct) {
                    setNewProduct({ ...newProduct, nutrition: e.target.value });
                  } else {
                    setEditingProduct({ ...editingProduct, nutrition: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="例: エネルギー: 180kcal, タンパク質: 3.2g, 脂質: 8.5g, 炭水化物: 22.1g, 食塩相当量: 0.15g"
                rows="2"
              />
            </div>

            {/* アレルゲン情報 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アレルゲン情報
              </label>
              <input
                type="text"
                value={isAddingProduct ? newProduct.allergens : (editingProduct.allergens || "")}
                onChange={(e) => {
                  if (isAddingProduct) {
                    setNewProduct({ ...newProduct, allergens: e.target.value });
                  } else {
                    setEditingProduct({ ...editingProduct, allergens: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="例: 乳成分、卵、大豆を含む"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveProduct}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? "保存中..." : "保存"}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- リセット確認モーダル ---
const ResetConfirmModal = ({ isOpen, onClose, onConfirm, isProcessing }) => {
  const [executorName, setExecutorName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (executorName.trim()) {
      onConfirm(executorName.trim());
      setExecutorName("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-xl mx-4">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">注文データリセット</h2>
          <p className="text-gray-600 mt-2">
            注文データと売上データをリセットします<br />
            <span className="font-semibold text-green-600">商品データは保持されます</span>
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
          <h3 className="font-semibold text-orange-800 mb-2">リセット内容:</h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• 全ての注文データを削除</li>
            <li>• 売上データをリセット</li>
            <li>• 整理番号をリセット</li>
            <li>• 実行前に自動バックアップを作成</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="executorName" className="block text-sm font-medium text-gray-700 mb-2">
              実行者名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="executorName"
              value={executorName}
              onChange={(e) => setExecutorName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="実行者名を入力してください"
              required
              disabled={isProcessing}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors bg-white disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isProcessing || !executorName.trim()}
              className="flex-1 py-3 px-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "処理中..." : "リセット実行"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 復元モーダル ---
const RestoreModal = ({ isOpen, onClose, backups, onRestore, isProcessing }) => {
  const [selectedBackup, setSelectedBackup] = useState("");
  const [executorName, setExecutorName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedBackup && executorName.trim()) {
      onRestore(selectedBackup, executorName.trim());
      setSelectedBackup("");
      setExecutorName("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <RotateCcw className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">データ復元</h2>
          <p className="text-gray-600 mt-2">
            バックアップから注文データを復元します
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="backup" className="block text-sm font-medium text-gray-700 mb-3">
              復元するバックアップを選択 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {backups.length === 0 ? (
                <p className="text-gray-500 text-center py-4">利用可能なバックアップがありません</p>
              ) : (
                backups.map((backup) => (
                  <label
                    key={backup.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedBackup === backup.id
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="backup"
                      value={backup.id}
                      checked={selectedBackup === backup.id}
                      onChange={(e) => setSelectedBackup(e.target.value)}
                      className="mr-3"
                      disabled={isProcessing}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {backup.createdAt.toDate().toLocaleString('ja-JP')}
                          </p>
                          <p className="text-sm text-gray-600">
                            実行者: {backup.executorName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-600">
                            注文件数: {backup.ordersData.length}件
                          </p>
                          <p className="text-sm text-gray-500">
                            整理番号: {backup.latestOrderNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label htmlFor="restoreExecutorName" className="block text-sm font-medium text-gray-700 mb-2">
              実行者名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="restoreExecutorName"
              value={executorName}
              onChange={(e) => setExecutorName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="実行者名を入力してください"
              required
              disabled={isProcessing}
            />
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 注意事項:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 現在の注文データは全て削除されます</li>
              <li>• バックアップ時点の状態に戻ります</li>
              <li>• 復元後は元に戻せません</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors bg-white disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isProcessing || !selectedBackup || !executorName.trim() || backups.length === 0}
              className="flex-1 py-3 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "復元中..." : "復元実行"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- メインコンポーネント ---
export default function App() {
  const [page, setPage] = useState("customer"); // 'customer', 'admin', 'ticket', 'productManagement', 'thankYou', 'productDetail'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null);
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cart, setCart] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // 商品詳細ページからのカート追加処理
  const handleAddToCartFromDetail = (product, quantity) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart[product.id]) {
        newCart[product.id].quantity += quantity;
      } else {
        newCart[product.id] = { ...product, quantity };
      }
      return newCart;
    });
  };

  // 管理画面ボタンクリック時の処理
  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      setPage("admin");
    } else {
      setAdminLoginModalOpen(true);
    }
  };

  // 管理画面ログイン成功時の処理
  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setAdminLoginModalOpen(false);
    setPage("admin");
  };

  // 管理画面ログインモーダルを閉じる
  const handleCloseAdminLoginModal = () => {
    setAdminLoginModalOpen(false);
  };

  // 管理画面ログアウト処理
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setPage("customer");
  };

  // QRスキャナーを開く
  const handleOpenScanner = () => {
    setQrScannerOpen(true);
  };

  // QRスキャナーを閉じる
  const handleCloseScanner = () => {
    setQrScannerOpen(false);
  };

  // 商品管理を開く
  const handleOpenProductManagement = () => {
    setPage("productManagement");
  };

  // 商品管理を閉じる
  const handleCloseProductManagement = () => {
    setPage("admin");
  };

  // 注文完了時の処理（スタッフ用）
  const handleOrderComplete = (completedOrderData) => {
    console.log('注文完了:', completedOrderData);
    setCompletedOrder(completedOrderData);
  };

  // 注文取り消し処理
  const handleCancelOrder = async (orderId) => {
    if (!confirm("この注文を取り消しますか？取り消し後は元に戻せません。")) {
      return;
    }

    try {
      // 在庫を戻す
      await runTransaction(db, async (transaction) => {
        // 1. まず全ての読み取り操作を実行
        const orderRef = doc(db, "orders", orderId);
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
    } catch (error) {
      console.error("注文取り消し中にエラーが発生しました:", error);
      alert("注文の取り消しに失敗しました: " + error.message);
    }
  };

  // 商品更新時の処理
  const handleProductUpdate = () => {
    console.log('商品が更新されました');
    // 必要に応じて更新通知などを追加
  };

  // Firestoreからデータをリアルタイムで購読する
  useEffect(() => {
    const initializeAppAndData = async () => {
      try {
        await setupInitialData();

        const unsubscribeProducts = onSnapshot(
          collection(db, "products"),
          (snapshot) => {
            const productsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setProducts(productsData);
            setLoading(false);
          }
        );

        const unsubscribeOrders = onSnapshot(
          collection(db, "orders"),
          (snapshot) => {
            const ordersData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            ordersData.sort((a, b) => {
              const dateA = a.createdAt?.toDate
                ? a.createdAt.toDate()
                : new Date(0);
              const dateB = b.createdAt?.toDate
                ? b.createdAt.toDate()
                : new Date(0);
              return dateB - dateA;
            });
            setOrders(ordersData);

            // 客の画面で整理券を表示している場合、注文ステータスの変更を監視
            if (page === "ticket" && lastOrder) {
              const currentOrder = ordersData.find(o => o.id === lastOrder.id);
              if (currentOrder) {
                // 注文が完了したら感謝メッセージページに遷移
                if (currentOrder.status === "completed") {
                  setCompletedOrder(currentOrder);
                  setPage("thankYou");
                }
                // 注文が取り消されたら注文ページに戻る
                else if (currentOrder.status === "cancelled") {
                  alert("この注文は取り消されました。");
                  setPage("customer");
                }
              }
            }
          }
        );

        return () => {
          unsubscribeProducts();
          unsubscribeOrders();
        };
      } catch (error) {
        console.error("Firebaseの初期化またはデータ取得でエラー:", error);
        if (error.code === "unavailable" || error.message.includes("offline")) {
          setFirebaseError(
            "Firebaseに接続できませんでした。ページを再読み込みするか、設定情報を確認してください。"
          );
        } else {
          setFirebaseError("データの読み込み中に不明なエラーが発生しました。");
        }
        setLoading(false);
      }
    };

    const cleanupPromise = initializeAppAndData();

    return () => {
      cleanupPromise.then((cleanup) => {
        if (cleanup) {
          cleanup();
        }
      });
    };
  }, [page, lastOrder]); // pageとlastOrderを依存関係に追加

  // URLクエリパラメータに基づいて初期ページを設定
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPage = params.get("page");
    const orderId = params.get("orderId");

    if (initialPage === "admin" || initialPage === "customer") {
      setPage(initialPage);
    } else if (initialPage === "ticket" && orderId) {
      // 整理券の再表示
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // 注文ステータスを確認
        if (order.status === "completed") {
          // 完了済みの場合は感謝メッセージページを表示
          setCompletedOrder(order);
          setPage("thankYou");
        } else if (order.status === "cancelled") {
          // 取り消し済みの場合は注文ページに戻る
          alert("この注文は取り消されました。");
          setPage("customer");
        } else {
          // 対応中の場合は整理券ページを表示
          setLastOrder(order);
          setPage("ticket");
        }
      }
    }
  }, [orders]);

  const renderPage = () => {
    if (firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.projectId) {
      return <SetupGuide />;
    }
    if (firebaseError) {
      return (
        <div className="container mx-auto px-4 py-8 text-center text-red-700">
          <div className="bg-red-100 border-l-4 border-red-500 p-6 rounded-lg max-w-2xl mx-auto">
            <div className="flex">
              <div className="py-1">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-4" />
              </div>
              <div>
                <p className="font-bold text-lg">接続エラー</p>
                <p className="text-sm">{firebaseError}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (page) {
      case "customer":
        return (
          <CustomerPage
            products={products}
            setPage={setPage}
            setLastOrder={setLastOrder}
            cart={cart}
            setCart={setCart}
            cartModalOpen={cartModalOpen}
            setCartModalOpen={setCartModalOpen}
            setSelectedProduct={setSelectedProduct}
          />
        );
      case "admin":
        return (
          <AdminPage
            products={products}
            orders={orders}
            onLogout={handleAdminLogout}
            onOpenScanner={handleOpenScanner}
            onOpenProductManagement={handleOpenProductManagement}
            onCancelOrder={handleCancelOrder}
          />
        );
      case "ticket":
        return <TicketPage lastOrder={lastOrder} setPage={setPage} orders={orders} setCompletedOrder={setCompletedOrder} />;
      case "thankYou":
        return <ThankYouPage completedOrder={completedOrder} setPage={setPage} />;
      case "productDetail":
        return (
          <ProductDetailPage
            product={selectedProduct}
            onAddToCart={handleAddToCartFromDetail}
            onBack={() => setPage("customer")}
            setSuccessMessage={setSuccessMessage}
          />
        );
      case "productManagement":
        return (
          <ProductManagement
            products={products}
            onClose={handleCloseProductManagement}
            onProductUpdate={handleProductUpdate}
          />
        );
      default:
        return (
          <CustomerPage
            products={products}
            setPage={setPage}
            setLastOrder={setLastOrder}
            cart={cart}
            setCart={setCart}
            cartModalOpen={cartModalOpen}
            setCartModalOpen={setCartModalOpen}
            setSelectedProduct={setSelectedProduct}
          />
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <SuccessMessage message={successMessage} />
      {page !== "ticket" && page !== "productManagement" && page !== "thankYou" && page !== "productDetail" && (
        <AppHeader
          page={page}
          setPage={setPage}
          onAdminClick={handleAdminClick}
          cart={cart}
          setCartModalOpen={setCartModalOpen}
        />
      )}
      <main>{renderPage()}</main>

      {/* 管理画面ログインモーダル */}
      <AdminLoginModal
        isOpen={adminLoginModalOpen}
        onClose={handleCloseAdminLoginModal}
        onLogin={handleAdminLogin}
      />

      {/* QRコード読み取り画面 */}
      {qrScannerOpen && (
        <QRScannerPage
          onClose={handleCloseScanner}
          onOrderComplete={handleOrderComplete}
          setPage={setPage}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap');
        body {
          font-family: 'Noto Sans JP', sans-serif;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
        @keyframes slide-down {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        
        /* QRスキャナーのカメラ選択UIのスタイル修正 */
        #qr-reader select {
          color: #1f2937 !important;
          background-color: #ffffff !important;
          border: 2px solid #d1d5db !important;
          border-radius: 0.5rem !important;
          padding: 0.5rem !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
        }
        
        #qr-reader button {
          color: #ffffff !important;
          background-color: #3b82f6 !important;
          border: none !important;
          border-radius: 0.5rem !important;
          padding: 0.5rem 1rem !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
        }
        
        #qr-reader button:hover {
          background-color: #2563eb !important;
        }
        
        #qr-reader span {
          color: #374151 !important;
          font-weight: 600 !important;
        }
        
        #qr-reader div {
          color: #374151 !important;
        }
        
        /* QRスキャナーのメッセージテキスト */
        #qr-reader__dashboard_section_csr {
          color: #374151 !important;
          font-weight: 600 !important;
        }
        
        /* QRスキャナーのヘッダー部分 */
        #qr-reader__header_message {
          color: #374151 !important;
          font-weight: 600 !important;
          background-color: #f9fafb !important;
          padding: 0.75rem !important;
          border-radius: 0.5rem !important;
          margin-bottom: 1rem !important;
        }
        
        /* QRスキャナーの設定やカメラ選択関連のテキスト */
        #qr-reader__dashboard_section_csr span,
        #qr-reader__dashboard_section_csr div,
        #qr-reader__dashboard_section_csr label {
          color: #1f2937 !important;
          font-weight: 600 !important;
        }
        
        /* QRスキャナー全体のコンテナ */
        #qr-reader {
          background-color: #ffffff !important;
          border-radius: 1rem !important;
          padding: 1rem !important;
        }
      `}</style>
    </div>
  );
}
