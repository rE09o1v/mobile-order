import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * 画像をFirebase Storageにアップロードする
 * @param {File} file - アップロードするファイル
 * @param {string} productId - 商品ID
 * @returns {Promise<string>} ダウンロードURL
 */
export const uploadImage = async (file, productId) => {
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

/**
 * Firebase StorageからURLで指定された画像を削除する
 * @param {string} imageUrl - 削除する画像のURL
 */
export const deleteImage = async (imageUrl) => {
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