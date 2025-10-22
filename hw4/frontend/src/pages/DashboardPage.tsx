import { useState } from 'react';
import {
  Container,
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
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
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
  };

  const handleLocationSelect = (_location: Location) => {
    // 可以在此處添加選擇地點的邏輯
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            地點探索
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            歡迎，{user?.email}
          </Typography>
          <Button color="inherit" onClick={logout}>
            登出
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* 地圖區域 */}
          <Box sx={{ flex: { md: 2 } }}>
            <MapComponent
              locations={locations}
              onLocationSelect={handleLocationSelect}
            />
          </Box>

          {/* 地點列表區域 */}
          <Box sx={{ flex: { md: 1 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                我的地點 ({locations.length})
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {locations.length === 0 ? (
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" textAlign="center">
                        還沒有地點，點擊右下角按鈕新增第一個地點吧！
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  locations.map((location) => (
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

        {/* 新增地點按鈕 */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setFormDialogOpen(true)}
        >
          <AddIcon />
        </Fab>

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
          title={editingLocation ? '編輯地點' : '新增地點'}
        />
      </Container>
    </Box>
  );
};

export default DashboardPage;
