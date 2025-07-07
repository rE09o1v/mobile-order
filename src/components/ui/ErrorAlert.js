"use client";

import React from 'react';
import { AlertTriangle, Wifi, RefreshCw, X } from 'lucide-react';
import { classifyError } from '../../lib/errorHandling';
import Button from './Button';

const ErrorAlert = ({ error, onRetry, onDismiss, className = '' }) => {
  if (!error) return null;
  
  const errorInfo = classifyError(error);
  
  const getIcon = () => {
    switch (errorInfo.type) {
      case 'network':
        return <Wifi className="text-red-500" size={20} />;
      default:
        return <AlertTriangle className="text-red-500" size={20} />;
    }
  };
  
  const getBackgroundColor = () => {
    switch (errorInfo.type) {
      case 'network':
        return 'bg-orange-50 border-orange-200';
      case 'validation':
        return 'bg-yellow-50 border-yellow-200';
      case 'permission':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };
  
  return (
    <div className={`${getBackgroundColor()} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {errorInfo.title}
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              {errorInfo.message}
            </p>
            
            {/* 技術的な詳細（開発環境のみ） */}
            {process.env.NODE_ENV === 'development' && error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  技術的な詳細を表示
                </summary>
                <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
            
            {/* アクションボタン */}
            <div className="flex gap-2 mt-3">
              {errorInfo.isRetryable && onRetry && (
                <Button 
                  onClick={onRetry} 
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  再試行
                </Button>
              )}
              
              {onDismiss && (
                <Button 
                  onClick={onDismiss} 
                  size="sm" 
                  variant="outline"
                >
                  閉じる
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="エラーを閉じる"
          >
            <X size={16} className="text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert; 