"use client";

import { useEffect } from 'react';

const StructuredData = ({ type = 'restaurant', data = {} }) => {
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type === 'restaurant' ? 'Restaurant' : 'WebApplication',
      ...getStructuredDataByType(type, data, baseUrl)
    };

    // 既存の構造化データを削除
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // 新しい構造化データを追加
    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
};

const getStructuredDataByType = (type, data, baseUrl) => {
  switch (type) {
    case 'restaurant':
      return {
        name: data.name || 'アイスクリーム注文アプリ',
        description: data.description || '美味しいアイスクリームをモバイルで簡単注文',
        url: baseUrl,
        telephone: data.phone || '',
        address: {
          '@type': 'PostalAddress',
          streetAddress: data.address || '',
          addressLocality: data.city || '',
          addressCountry: 'JP'
        },
        servesCuisine: 'アイスクリーム',
        priceRange: '¥¥',
        acceptsReservations: false,
        hasMenu: {
          '@type': 'Menu',
          hasMenuSection: {
            '@type': 'MenuSection',
            name: 'アイスクリーム',
            hasMenuItem: data.products?.map(product => ({
              '@type': 'MenuItem',
              name: product.name,
              description: product.description || '',
              offers: {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'JPY'
              }
            })) || []
          }
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.5',
          reviewCount: '100'
        }
      };

    case 'webapp':
      return {
        name: 'モバイルオーダーシステム',
        description: '飲食店向けモバイルオーダーシステム - 簡単注文、電子決済、QR整理券',
        url: baseUrl,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'JPY'
        },
        featureList: [
          'モバイル注文システム',
          'QR整理券',
          'リアルタイム在庫管理',
          '売上分析',
          '商品管理'
        ]
      };

    case 'product':
      return {
        name: data.name || '',
        description: data.description || '',
        image: data.imageUrl || '',
        offers: {
          '@type': 'Offer',
          price: data.price || 0,
          priceCurrency: 'JPY',
          availability: data.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        },
        nutrition: data.nutrition ? {
          '@type': 'NutritionInformation',
          description: data.nutrition
        } : undefined
      };

    default:
      return {};
  }
};

export default StructuredData; 