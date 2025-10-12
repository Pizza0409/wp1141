import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useCourseSelection } from '../hooks/useCourseSelection';

interface CourseSelectionProps {
  onSubmission?: () => void;
}

export function CourseSelection({ onSubmission }: CourseSelectionProps) {
  const {
    selectedCourses,
    removeSelectedCourse,
    clearSelectedCourses,
    totalCredits,
    submitSelection,
    getLatestSubmission
  } = useCourseSelection();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDayName = (day: string) => {
    const dayNames = ['', '一', '二', '三', '四', '五', '六', '日'];
    return dayNames[parseInt(day)] || day;
  };

  const getTimeSlotColor = (timeSlot: string) => {
    const hour = parseInt(timeSlot.split(':')[0]);
    if (hour < 9) return 'default';
    if (hour < 12) return 'primary';
    if (hour < 15) return 'secondary';
    if (hour < 18) return 'success';
    return 'warning';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitSelection(submissionNote);
      setShowSubmitDialog(false);
      setSubmissionNote('');
      onSubmission?.();
    } catch (error) {
      console.error('提交失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空所有選課嗎？')) {
      clearSelectedCourses();
    }
  };

  const latestSubmission = getLatestSubmission();

  return (
    <Box>
      {/* 預選課程統計 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="primary">
                預選課程 ({selectedCourses.length} 門)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                總學分: {totalCredits} 學分
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearAll}
                  disabled={selectedCourses.length === 0}
                >
                  清空選課
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={selectedCourses.length === 0}
                >
                  送出選課
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 已選課程統計 */}
      {latestSubmission && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h6" color="success.main">
                  已選課程 ({latestSubmission.selections.length} 門)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  總學分: {latestSubmission.selections.reduce((total, s) => total + parseInt(s.course.credit), 0)} 學分
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  送出時間: {latestSubmission.submittedAt.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Chip
                    label={latestSubmission.status === 'confirmed' ? '已確認' : '已送出'}
                    color={latestSubmission.status === 'confirmed' ? 'success' : 'primary'}
                    variant="outlined"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 選課列表 */}
      {selectedCourses.length === 0 ? (
        <Alert severity="info">尚未選擇任何課程</Alert>
      ) : (
        <Grid container spacing={2}>
          {selectedCourses.map((selection) => (
            <Grid item xs={12} key={selection.courseId}>
              <Card sx={{ '&:hover': { boxShadow: 2 } }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Box>
                        <Typography variant="h6" component="div">
                          {selection.course.cou_cname}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selection.course.cou_ename}
                        </Typography>
                        
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<SchoolIcon />}
                            label={`${selection.course.credit} 學分`}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            icon={<PersonIcon />}
                            label={selection.course.tea_cname}
                            size="small"
                            color="secondary"
                          />
                          <Chip
                            icon={<LocationIcon />}
                            label={selection.course.dpt_abbr}
                            size="small"
                            color="info"
                          />
                        </Box>
                        
                        {/* 時間標籤 */}
                        <Box sx={{ mt: 1 }}>
                          {selection.course.times.map((time, index) => (
                            <Chip
                              key={index}
                              icon={<ScheduleIcon />}
                              label={`星期${getDayName(time.day)} ${time.startTime}-${time.endTime} ${time.classroom}`}
                              color={getTimeSlotColor(time.startTime) as any}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="課程資訊">
                          <IconButton size="small">
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => removeSelectedCourse(selection.courseId)}
                          size="small"
                        >
                          移除
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 送出對話框 */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>送出選課記錄</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            請確認您的選課內容，送出後將無法修改。
          </Typography>
          
          <List>
            {selectedCourses.map((selection, index) => (
              <React.Fragment key={selection.courseId}>
                <ListItem>
                  <ListItemText
                    primary={selection.course.cou_cname}
                    secondary={`${selection.course.credit} 學分 | ${selection.course.tea_cname}`}
                  />
                </ListItem>
                {index < selectedCourses.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">
              總計: {selectedCourses.length} 門課程，{totalCredits} 學分
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            label="備註 (選填)"
            multiline
            rows={3}
            value={submissionNote}
            onChange={(e) => setSubmissionNote(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="請輸入任何備註或特殊需求..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>取消</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? '送出中...' : '確認送出'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

