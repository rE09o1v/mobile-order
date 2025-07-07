/**
 * エラーハンドリングユーティリティ
 */

// エラータイプの定義
export const ERROR_TYPES = {
  NETWORK: 'network',
  FIREBASE: 'firebase',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  NOT_FOUND: 'not_found',
  UNKNOWN: 'unknown'
};

// ネットワーク状態の管理
class NetworkManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    
    // オンライン/オフライン イベントリスナー
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }
  
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }
}

export const networkManager = new NetworkManager();

// エラー分類関数
export const classifyError = (error) => {
  if (!navigator.onLine) {
    return {
      type: ERROR_TYPES.NETWORK,
      title: 'インターネット接続エラー',
      message: 'インターネット接続を確認してください',
      isRetryable: true
    };
  }
  
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        return {
          type: ERROR_TYPES.PERMISSION,
          title: 'アクセス権限エラー',
          message: 'この操作を実行する権限がありません',
          isRetryable: false
        };
        
      case 'not-found':
        return {
          type: ERROR_TYPES.NOT_FOUND,
          title: 'データが見つかりません',
          message: '指定されたデータが存在しません',
          isRetryable: false
        };
        
      case 'unavailable':
        return {
          type: ERROR_TYPES.FIREBASE,
          title: 'サービス一時利用不可',
          message: 'サービスが一時的に利用できません。しばらく後に再試行してください',
          isRetryable: true
        };
        
      case 'deadline-exceeded':
        return {
          type: ERROR_TYPES.NETWORK,
          title: 'タイムアウトエラー',
          message: '処理がタイムアウトしました。再試行してください',
          isRetryable: true
        };
        
      default:
        return {
          type: ERROR_TYPES.FIREBASE,
          title: 'Firebase エラー',
          message: error.message || '予期しないエラーが発生しました',
          isRetryable: true
        };
    }
  }
  
  if (error.name === 'ValidationError') {
    return {
      type: ERROR_TYPES.VALIDATION,
      title: '入力エラー',
      message: error.message || '入力内容を確認してください',
      isRetryable: false
    };
  }
  
  return {
    type: ERROR_TYPES.UNKNOWN,
    title: '予期しないエラー',
    message: error.message || '予期しないエラーが発生しました',
    isRetryable: true
  };
};

// リトライ機能付きの関数実行
export const executeWithRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const errorInfo = classifyError(error);
      
      // リトライできないエラーの場合は即座に失敗
      if (!errorInfo.isRetryable) {
        throw error;
      }
      
      // 最後の試行の場合は失敗
      if (attempt === maxRetries) {
        break;
      }
      
      // オフラインの場合はオンラインになるまで待機
      if (!navigator.onLine) {
        await waitForOnline();
      }
      
      // 指数バックオフで待機
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
};

// オンラインになるまで待機
export const waitForOnline = () => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }
    
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
  });
};

// エラーログ送信（本番環境用）
export const logError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', error, context);
    return;
  }
  
  // 本番環境では適切なログサービスに送信
  // 例: Sentry, LogRocket, etc.
  try {
    // 実装例（実際のサービスに合わせて調整）
    /*
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });
    */
  } catch (logError) {
    // ログ送信に失敗してもアプリケーションを停止させない
    console.error('Failed to log error:', logError);
  }
};

// バリデーションエラー
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

// カスタムエラー作成
export const createError = (type, message, details = {}) => {
  const error = new Error(message);
  error.type = type;
  error.details = details;
  return error;
}; 