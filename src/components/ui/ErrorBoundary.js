"use client";

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // エラーログの送信（本番環境では適切なログサービスに送信）
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            
            <p className="text-gray-600 mb-6">
              予期しないエラーが発生しました。ページを再読み込みしてもう一度お試しください。
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={this.handleReset}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4" />
                再試行
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                ページを再読み込み
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  エラー詳細（開発用）
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 