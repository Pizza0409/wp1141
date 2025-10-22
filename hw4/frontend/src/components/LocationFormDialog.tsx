import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Rating,
  Typography,
} from '@mui/material';
import type { Location, CreateLocationRequest, UpdateLocationRequest } from '../types';

interface LocationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLocationRequest | UpdateLocationRequest) => Promise<void>;
  location?: Location | null;
  title: string;
}

const LocationFormDialog: React.FC<LocationFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  location,
  title,
}) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || '',
    rating: location?.rating || 3,
    notes: location?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleRatingChange = (_event: React.SyntheticEvent, newValue: number | null) => {
    setFormData(prev => ({
      ...prev,
      rating: newValue || 3,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        name: '',
        address: '',
        rating: 3,
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        name: location?.name || '',
        address: location?.address || '',
        rating: location?.rating || 3,
        notes: location?.notes || '',
      });
      setError('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="地點名稱"
              value={formData.name}
              onChange={handleChange('name')}
              required
              fullWidth
              disabled={loading}
            />
            <TextField
              label="地址"
              value={formData.address}
              onChange={handleChange('address')}
              required
              fullWidth
              multiline
              rows={2}
              disabled={loading}
            />
            <Box>
              <Typography component="legend" sx={{ mb: 1 }}>
                評分
              </Typography>
              <Rating
                value={formData.rating}
                onChange={handleRatingChange}
                disabled={loading}
              />
            </Box>
            <TextField
              label="備註"
              value={formData.notes}
              onChange={handleChange('notes')}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? '處理中...' : '儲存'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LocationFormDialog;
