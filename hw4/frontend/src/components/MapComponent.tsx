import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, TextField, Button, Paper } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

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
  onAddLocation?: (locationData: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ locations, onLocationSelect, onAddLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);

  useEffect(() => {
    // 設定全域函數供 InfoWindow 按鈕使用
    (window as any).addLocationFromMap = (address: string, lat: number, lng: number) => {
      if (onAddLocation) {
        onAddLocation({ address, latitude: lat, longitude: lng });
      }
    };

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
      // 清理全域函數
      delete (window as any).addLocationFromMap;
    };
  }, [locations, onLocationSelect, onAddLocation]);

  const handleSearch = () => {
    if (!searchQuery.trim() || !window.google || !mapInstanceRef.current) {
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        
        // 清除之前的搜尋結果標記
        if (searchResult) {
          searchResult.setMap(null);
        }
        
        // 新增搜尋結果標記
        const marker = new window.google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          title: searchQuery,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });
        
        setSearchResult(marker);
        
        // 移動地圖到搜尋結果
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(15);
        
        // 顯示資訊視窗
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; color: #1976d2;">搜尋結果</h3>
              <p style="margin: 5px 0;"><strong>地址:</strong> ${results[0].formatted_address}</p>
              <button 
                onclick="window.addLocationFromMap('${results[0].formatted_address}', ${location.lat()}, ${location.lng()})"
                style="
                  background: #1976d2; 
                  color: white; 
                  border: none; 
                  padding: 8px 16px; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  margin-top: 10px;
                  font-size: 14px;
                "
                onmouseover="this.style.background='#1565c0'"
                onmouseout="this.style.background='#1976d2'"
              >
                ➕ 新增到我的清單
              </button>
            </div>
          `,
        });
        
        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });
        
        infoWindow.open(mapInstanceRef.current, marker);
      } else {
        alert('找不到該地址，請嘗試其他關鍵字');
      }
    });
  };

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
      
      {/* 搜尋框 */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            label="搜尋地址"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder="輸入地址或地名..."
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
            disabled={!searchQuery.trim()}
          >
            搜尋
          </Button>
        </Box>
      </Paper>
      
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
