import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Rating,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useLocations } from '../hooks/useLocations';
import MapComponent from '../components/MapComponent';
import LocationFormDialog from '../components/LocationFormDialog';
import type { Location, CreateLocationRequest, UpdateLocationRequest } from '../types';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { locations, loading, error, createLocation, updateLocation, deleteLocation } = useLocations();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [prefilledLocationData, setPrefilledLocationData] = useState<{
    name?: string;
    address: string;
    latitude: number;
    longitude: number;
    rating?: number;
    notes?: string;
  } | null>(null);

  const handleCreateLocation = async (data: CreateLocationRequest) => {
    await createLocation(data);
  };

  const handleUpdateLocation = async (data: UpdateLocationRequest) => {
    if (editingLocation) {
      await updateLocation(editingLocation.id, data);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (window.confirm('確定要刪除這個地點嗎？')) {
      await deleteLocation(id);
    }
  };

  const handleEditClick = (location: Location) => {
    setEditingLocation(location);
    setFormDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditingLocation(null);
    setPrefilledLocationData(null);
  };

  const handleAddFromMap = async (locationData: {
    name?: string;
    address: string;
    latitude: number;
    longitude: number;
    rating?: number;
    notes?: string;
  }) => {
    // Check for duplicate address
    const isDuplicate = locations.some(loc => 
      loc.address.toLowerCase().trim() === locationData.address.toLowerCase().trim()
    );

    if (isDuplicate) {
      const confirmAdd = window.confirm(
        `地址「${locationData.address}」已存在於您的清單中。\n\n是否仍要新增？`
      );
      if (!confirmAdd) {
        return; // User cancelled
      }
    }

    // If all required data is provided, create location directly
    if (locationData.name && locationData.rating !== undefined) {
      try {
        await createLocation({
          name: locationData.name,
          address: locationData.address,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          rating: locationData.rating,
          notes: locationData.notes || ''
        });
        return;
      } catch (error) {
        console.error('Failed to create location:', error);
        // Fall through to open dialog
      }
    }
    
    // Otherwise, open dialog with prefilled data
    setPrefilledLocationData(locationData);
    setFormDialogOpen(true);
  };

  const handleLocationSelect = (_location: Location) => {
    // 可以在此處添加選擇地點的邏輯
  };

  // 過濾地點列表
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            地點探索
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            歡迎，{user?.email || user?.username || '使用者'}
          </Typography>
          <Button color="inherit" onClick={logout}>
            登出
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        bgcolor: 'background.default',
        py: 4,
        px: 2
      }}>
        <Box sx={{ 
          width: '100%', 
          maxWidth: '100%',
          mx: 0,
          px: { xs: 1, sm: 2, md: 3 }
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' }, 
            gap: 3,
            width: '100%',
            minHeight: 'calc(100vh - 120px)'
          }}>
          {/* 地圖區域 */}
          <Box sx={{ 
            flex: { lg: 2 },
            minWidth: 0,
            height: { xs: '400px', lg: '600px' }
          }}>
            <MapComponent
              locations={locations}
              onLocationSelect={handleLocationSelect}
              onAddLocation={handleAddFromMap}
            />
          </Box>

          {/* 地點列表區域 */}
          <Box sx={{ 
            flex: { lg: 1 },
            minWidth: 0,
            height: { xs: 'auto', lg: '600px' },
            maxHeight: { xs: '400px', lg: '600px' },
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                我的地點 ({filteredLocations.length})
              </Typography>
            </Box>

            {/* 搜尋框 */}
            <TextField
              fullWidth
              size="small"
              placeholder="搜尋地點名稱或地址..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ 
                flex: 1,
                overflow: 'auto',
                minHeight: 0
              }}>
                {filteredLocations.length === 0 ? (
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" textAlign="center">
                        {searchQuery ? '找不到符合搜尋條件的地點' : '還沒有地點，點擊右下角按鈕新增第一個地點吧！'}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  filteredLocations.map((location) => (
                    <Card key={location.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" component="div" gutterBottom>
                          {location.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {location.address}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating value={location.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({location.rating}/5)
                          </Typography>
                        </Box>
                        {location.notes && (
                          <Typography variant="body2" color="text.secondary">
                            {location.notes}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(location)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteLocation(location.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  ))
                )}
              </Box>
            )}
          </Box>
        </Box>
        </Box>
      </Box>


      {/* 地點表單對話框 */}
      <LocationFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        onSubmit={editingLocation ? handleUpdateLocation : (data: CreateLocationRequest | UpdateLocationRequest) => {
          if ('name' in data && data.name) {
            return handleCreateLocation(data as CreateLocationRequest);
          }
          return Promise.resolve();
        }}
        location={editingLocation}
        prefilledData={prefilledLocationData}
        title={editingLocation ? '編輯地點' : '新增地點'}
      />
    </Box>
  );
};

export default DashboardPage;
