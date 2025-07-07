"use client";

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const NetworkStatus = ({ isOnline }) => {
  if (isOnline) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white z-50">
      <div className="flex items-center justify-center py-2 px-4">
        <WifiOff size={16} className="mr-2" />
        <span className="text-sm font-medium">
          インターネット接続がありません。オンラインになると自動的に同期されます。
        </span>
      </div>
    </div>
  );
};

export default NetworkStatus; 