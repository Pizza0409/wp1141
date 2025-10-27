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
    name?: string;
    address: string;
    latitude: number;
    longitude: number;
    rating?: number;
    notes?: string;
  }) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ locations, onLocationSelect, onAddLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const placeInfoWindowRef = useRef<any>(null);
  const searchInfoWindowRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const tempMarkerRef = useRef<any>(null);
  const tempInfoWindowRef = useRef<any>(null);
  const previousLocationsCountRef = useRef<number>(0);

  useEffect(() => {
    // 設定全域函數供 InfoWindow 按鈕使用
    (window as any).addLocationFromMap = (name: string, address: string, lat: number, lng: number, rating: number, notes: string = '') => {
      if (onAddLocation) {
        onAddLocation({ name, address, latitude: lat, longitude: lng, rating, notes });
      }
    };

    (window as any).addLocationFromClick = (name: string, address: string, lat: number, lng: number, rating: number, notes: string = '') => {
      if (onAddLocation) {
        onAddLocation({ name, address, latitude: lat, longitude: lng, rating, notes });
      }
      // Clear temporary marker after adding
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null);
        tempMarkerRef.current = null;
      }
      if (tempInfoWindowRef.current) {
        tempInfoWindowRef.current.close();
        tempInfoWindowRef.current = null;
      }
    };

    (window as any).cancelTempMarker = () => {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null);
        tempMarkerRef.current = null;
      }
      if (tempInfoWindowRef.current) {
        tempInfoWindowRef.current.close();
        tempInfoWindowRef.current = null;
      }
    };

    (window as any).closeSearchInfoWindow = () => {
      // 清除搜尋結果標記
      if (searchResult) {
        searchResult.setMap(null);
        setSearchResult(null);
      }
      // 關閉搜尋 InfoWindow
      if (searchInfoWindowRef.current) {
        searchInfoWindowRef.current.close();
        searchInfoWindowRef.current = null;
      }
    };

    (window as any).closePlaceInfoWindow = () => {
      // 關閉地標 InfoWindow
      if (placeInfoWindowRef.current) {
        placeInfoWindowRef.current.close();
        placeInfoWindowRef.current = null;
      }
    };

    const initMap = () => {
      console.log('Initializing map...', { mapRef: mapRef.current, google: !!window.google });
      if (!mapRef.current || !window.google) {
        setMapError('Google Maps API not loaded');
        return;
      }

      // 初始化地圖，以台灣為中心
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 23.9739, lng: 120.9820 }, // 台灣中心點
          zoom: 8,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          clickableIcons: true, // 啟用點擊地標功能
        });
        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapError('Failed to initialize map: ' + (error instanceof Error ? error.message : String(error)));
        return;
      }

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

      // 調整地圖視野
      const currentCount = locations.length;
      if (currentCount > previousLocationsCountRef.current) {
        // 新增了地點，將地圖移動到最後新增的地點
        const lastLocation = locations[0]; // 新地點在陣列最前面
        if (lastLocation) {
          mapInstanceRef.current.setCenter({ lat: lastLocation.latitude, lng: lastLocation.longitude });
          mapInstanceRef.current.setZoom(15); // 設定適當的縮放級別
        }
      } else if (currentCount > 0 && previousLocationsCountRef.current === 0) {
        // 首次載入時，調整視野包含所有地點
        const bounds = new window.google.maps.LatLngBounds();
        locations.forEach(location => {
          bounds.extend({ lat: location.latitude, lng: location.longitude });
        });
        mapInstanceRef.current.fitBounds(bounds);
      }
      // 更新記錄
      previousLocationsCountRef.current = currentCount;

      // 添加地圖點擊事件 - 直接響應點擊
      mapInstanceRef.current.addListener('click', (event: any) => {
        // 如果點擊的是地標，會有 placeId，由另一個 listener 處理
        if (event.placeId) {
          return;
        }
        
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // 清除之前的臨時標記
        if (tempMarkerRef.current) {
          tempMarkerRef.current.setMap(null);
        }
        if (tempInfoWindowRef.current) {
          tempInfoWindowRef.current.close();
        }
        
        // 創建臨時標記
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }
        });
        
        tempMarkerRef.current = marker;
        
        // 反向地理編碼獲取地址
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            
            // 創建資訊視窗
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; min-width: 250px;">
                  <h3 style="margin: 0 0 10px 0; color: #1976d2;">新增地點</h3>
                  <p style="margin: 5px 0;"><strong>地址:</strong> ${address}</p>
                  <div style="margin: 10px 0;">
                    <label style="display: block; margin-bottom: 5px;"><strong>地點名稱:</strong></label>
                    <input type="text" id="locationName" placeholder="輸入地點名稱..." style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                  </div>
                  <div style="margin: 10px 0;">
                    <label style="display: block; margin-bottom: 5px;"><strong>評分:</strong></label>
                    <select id="locationRating" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                      <option value="1">1 星</option>
                      <option value="2">2 星</option>
                      <option value="3" selected>3 星</option>
                      <option value="4">4 星</option>
                      <option value="5">5 星</option>
                    </select>
                  </div>
                  <div style="margin: 10px 0;">
                    <label style="display: block; margin-bottom: 5px;"><strong>備註:</strong></label>
                    <textarea id="clickLocationNotes" placeholder="添加備註..." style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px; height: 60px;"></textarea>
                  </div>
                  <div style="margin-top: 15px;">
                    <button 
                      onclick="const name = document.getElementById('locationName').value; const rating = parseInt(document.getElementById('locationRating').value); const notes = document.getElementById('clickLocationNotes').value; if(name.trim()) { window.addLocationFromClick(name.trim(), '${address}', ${lat}, ${lng}, rating, notes); } else { alert('請輸入地點名稱'); }"
                      style="
                        background: #1976d2; 
                        color: white; 
                        border: none; 
                        padding: 8px 16px; 
                        border-radius: 4px; 
                        cursor: pointer; 
                        margin-right: 10px;
                        font-size: 14px;
                      "
                      onmouseover="this.style.background='#1565c0'"
                      onmouseout="this.style.background='#1976d2'"
                    >
                      ➕ 新增到我的清單
                    </button>
                    <button 
                      onclick="window.cancelTempMarker()"
                      style="
                        background: #666; 
                        color: white; 
                        border: none; 
                        padding: 8px 16px; 
                        border-radius: 4px; 
                        cursor: pointer; 
                        font-size: 14px;
                      "
                      onmouseover="this.style.background='#555'"
                      onmouseout="this.style.background='#666'"
                    >
                      取消
                    </button>
                  </div>
                </div>
              `,
            });
            
            tempInfoWindowRef.current = infoWindow;
            infoWindow.open(mapInstanceRef.current, marker);
          }
        });
      });

      // 添加地標點擊事件處理
      mapInstanceRef.current.addListener('click', (event: any) => {
        // 檢查是否點擊了地標
        if (event.placeId) {
          const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
          service.getDetails({
            placeId: event.placeId,
            fields: ['name', 'formatted_address', 'geometry', 'rating', 'types']
          }, (place: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              // 創建地標資訊視窗
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 10px; min-width: 250px;">
                    <h3 style="margin: 0 0 10px 0; color: #1976d2;">${place.name}</h3>
                    <p style="margin: 5px 0;"><strong>地址:</strong> ${place.formatted_address}</p>
                    ${place.rating ? `<p style="margin: 5px 0;"><strong>Google 評分:</strong> ${place.rating}/5</p>` : ''}
                    <div style="margin: 10px 0;">
                      <label style="display: block; margin-bottom: 5px;"><strong>我的評分:</strong></label>
                      <select id="placeRating" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        <option value="1">1 星</option>
                        <option value="2">2 星</option>
                        <option value="3" selected>3 星</option>
                        <option value="4">4 星</option>
                        <option value="5">5 星</option>
                      </select>
                    </div>
                    <div style="margin: 10px 0;">
                      <label style="display: block; margin-bottom: 5px;"><strong>備註:</strong></label>
                      <textarea id="placeNotes" placeholder="添加備註..." style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px; height: 60px;"></textarea>
                    </div>
                    <div style="margin-top: 15px;">
                      <button 
                        onclick="const rating = parseInt(document.getElementById('placeRating').value); const notes = document.getElementById('placeNotes').value; window.addLocationFromMap('${place.name}', '${place.formatted_address}', ${place.geometry.location.lat()}, ${place.geometry.location.lng()}, rating, notes);"
                        style="
                          background: #1976d2; 
                          color: white; 
                          border: none; 
                          padding: 8px 16px; 
                          border-radius: 4px; 
                          cursor: pointer; 
                          margin-right: 10px;
                          font-size: 14px;
                        "
                        onmouseover="this.style.background='#1565c0'"
                        onmouseout="this.style.background='#1976d2'"
                      >
                        ➕ 新增到我的清單
                      </button>
                      <button 
                        onclick="window.closePlaceInfoWindow()"
                        style="
                          background: #666; 
                          color: white; 
                          border: none; 
                          padding: 8px 16px; 
                          border-radius: 4px; 
                          cursor: pointer; 
                          font-size: 14px;
                        "
                        onmouseover="this.style.background='#555'"
                        onmouseout="this.style.background='#666'"
                      >
                        關閉
                      </button>
                    </div>
                  </div>
                `,
              });
              
              // Store the InfoWindow in ref for proper closing
              placeInfoWindowRef.current = infoWindow;
              infoWindow.setPosition(place.geometry.location);
              infoWindow.open(mapInstanceRef.current);
            }
          });
        }
      });
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
      // 清理臨時標記
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null);
      }
      if (tempInfoWindowRef.current) {
        tempInfoWindowRef.current.close();
      }
      // 清理地標 InfoWindow
      if (placeInfoWindowRef.current) {
        placeInfoWindowRef.current.close();
        placeInfoWindowRef.current = null;
      }
      // 清理搜尋 InfoWindow
      if (searchInfoWindowRef.current) {
        searchInfoWindowRef.current.close();
        searchInfoWindowRef.current = null;
      }
      // 清理全域函數
      delete (window as any).addLocationFromMap;
      delete (window as any).addLocationFromClick;
      delete (window as any).cancelTempMarker;
      delete (window as any).closeSearchInfoWindow;
      delete (window as any).closePlaceInfoWindow;
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
        
        // 嘗試從 geocoding 結果中提取地點名稱
        // 使用 Google Places API 獲取更準確的地點名稱
        let placeName = searchQuery;
        
        // 如果有 place_id，使用 Places API 獲取詳細資訊
        if (results[0].place_id) {
          const placesService = new window.google.maps.places.PlacesService(mapInstanceRef.current);
          placesService.getDetails({
            placeId: results[0].place_id,
            fields: ['name']
          }, (place: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.name) {
              placeName = place.name;
            }
          });
        }
        
        // 如果 geocoding 結果有 name 且不等於完整地址，使用它
        if (!results[0].place_id && results[0].name && results[0].name !== results[0].formatted_address) {
          placeName = results[0].name;
        }
        
        
        // 移動地圖到搜尋結果
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(15);
        
        // 顯示資訊視窗
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 250px;">
              <h3 style="margin: 0 0 10px 0; color: #1976d2;">搜尋結果</h3>
              <p style="margin: 5px 0;"><strong>地址:</strong> ${results[0].formatted_address}</p>
              <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px;"><strong>地點名稱:</strong></label>
                <input type="text" id="searchLocationName" value="${placeName}" placeholder="輸入地點名稱..." style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
              </div>
              <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px;"><strong>評分:</strong></label>
                <select id="searchLocationRating" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                  <option value="1">1 星</option>
                  <option value="2">2 星</option>
                  <option value="3" selected>3 星</option>
                  <option value="4">4 星</option>
                  <option value="5">5 星</option>
                </select>
              </div>
              <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px;"><strong>備註:</strong></label>
                <textarea id="searchLocationNotes" placeholder="添加備註..." style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px; height: 60px;"></textarea>
              </div>
              <div style="margin-top: 15px;">
                <button 
                  onclick="const name = document.getElementById('searchLocationName').value; const rating = parseInt(document.getElementById('searchLocationRating').value); const notes = document.getElementById('searchLocationNotes').value; if(name.trim()) { window.addLocationFromMap(name.trim(), '${results[0].formatted_address}', ${location.lat()}, ${location.lng()}, rating, notes); } else { alert('請輸入地點名稱'); }"
                  style="
                    background: #1976d2; 
                    color: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    margin-right: 10px;
                    font-size: 14px;
                  "
                  onmouseover="this.style.background='#1565c0'"
                  onmouseout="this.style.background='#1976d2'"
                >
                  ➕ 新增到我的清單
                </button>
                <button 
                  onclick="window.closeSearchInfoWindow()"
                  style="
                    background: #666; 
                    color: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-size: 14px;
                  "
                  onmouseover="this.style.background='#555'"
                  onmouseout="this.style.background='#666'"
                >
                  關閉
                </button>
              </div>
            </div>
          `,
        });
        
        // 儲存 InfoWindow 實例
        searchInfoWindowRef.current = infoWindow;
        
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
          height: { xs: '400px', lg: '600px' },
          width: '100%',
          borderRadius: 1,
          border: '1px solid #ddd',
          position: 'relative',
          flex: 1,
          minHeight: 0
        }}
      />
    </Box>
  );
};

export default MapComponent;
