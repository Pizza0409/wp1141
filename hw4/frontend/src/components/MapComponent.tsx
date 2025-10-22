import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface MapComponentProps {
  locations: Array<{
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    rating: number;
    notes: string;
  }>;
  onLocationSelect?: (location: any) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ locations, onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string>('');

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) {
        setMapError('Google Maps API not loaded');
        return;
      }

      // 初始化地圖，以台灣為中心
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 23.9739, lng: 120.9820 }, // 台灣中心點
        zoom: 8,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      });

      // 清除現有標記
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // 添加地點標記
      locations.forEach(location => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: mapInstanceRef.current,
          title: location.name,
          label: {
            text: location.rating.toString(),
            color: 'white',
            fontWeight: 'bold',
          },
        });

        // 添加資訊視窗
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h3>${location.name}</h3>
              <p><strong>地址:</strong> ${location.address}</p>
              <p><strong>評分:</strong> ${'★'.repeat(location.rating)}${'☆'.repeat(5 - location.rating)}</p>
              ${location.notes ? `<p><strong>備註:</strong> ${location.notes}</p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        });

        markersRef.current.push(marker);
      });

      // 如果有地點，調整地圖視野以包含所有標記
      if (locations.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        locations.forEach(location => {
          bounds.extend({ lat: location.latitude, lng: location.longitude });
        });
        mapInstanceRef.current.fitBounds(bounds);
      }
    };

    // 檢查 Google Maps API 是否已載入
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // 載入 Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setMapError('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    }

    return () => {
      // 清理標記
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, [locations, onLocationSelect]);

  if (mapError) {
    return (
      <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">
          {mapError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        地點地圖
      </Typography>
      <Box
        ref={mapRef}
        sx={{
          height: '400px',
          width: '100%',
          borderRadius: 1,
          border: '1px solid #ddd',
        }}
      />
    </Box>
  );
};

export default MapComponent;
