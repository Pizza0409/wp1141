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
    getSubmissionRecords,
    checkPreSelectedConflicts
  } = useCourseSelection();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 檢查是否有衝堂的預選課程
  const hasConflicts = selectedCourses.some(selection => 
    checkPreSelectedConflicts(selection.courseId).length > 0
  );

  const getDayName = (day: string) => {
    const dayNames = ['', '一', '二', '三', '四', '五', '六', '日'];
    return dayNames[parseInt(day)] || day;
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
                  disabled={selectedCourses.length === 0 || hasConflicts}
                >
                  送出選課
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 衝堂警告 */}
      {hasConflicts && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            預選課程中有時間衝突，請先解決衝堂問題後再送出選課。
          </Typography>
        </Alert>
      )}

      {/* 已選課程統計 */}
      {(() => {
        const allConfirmedCourses = getSubmissionRecords().flatMap(record => record.selections);
        const totalConfirmedCredits = allConfirmedCourses.reduce((total, s) => total + parseInt(s.course.credit), 0);
        const confirmedDepartments = new Set(allConfirmedCourses.map(s => s.course.dpt_abbr).filter(dpt => dpt && dpt.trim()));
        
        return allConfirmedCourses.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" color="success.main">
                    已選課程 ({allConfirmedCourses.length} 門)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    總學分: {totalConfirmedCredits} 學分
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    開課系所: {confirmedDepartments.size} 個
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Chip
                      label="已確認"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      })()}

      {/* 選課列表 */}
      {selectedCourses.length === 0 ? (
        <Alert severity="info">尚未選擇任何課程</Alert>
      ) : (
        <Grid container spacing={2}>
          {selectedCourses.map((selection) => (
            <Grid item xs={12} key={selection.courseId}>
              <Card sx={{ 
                '&:hover': { boxShadow: 2 },
                border: checkPreSelectedConflicts(selection.courseId).length > 0 ? '2px solid #ff9800' : '1px solid #e0e0e0'
              }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" component="div">
                            {selection.course.cou_cname}
                          </Typography>
                          {checkPreSelectedConflicts(selection.courseId).length > 0 && (
                            <Chip
                              label="衝堂"
                              size="small"
                              color="warning"
                              variant="filled"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Box>
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
                              size="small"
                              sx={{ 
                                mr: 1, 
                                mb: 1,
                                // 根據星期幾設定背景色
                                backgroundColor: (() => {
                                  const dayColors = {
                                    '一': '#e3f2fd', // 淺藍
                                    '二': '#f3e5f5', // 淺紫
                                    '三': '#e8f5e8', // 淺綠
                                    '四': '#fff3e0', // 淺橙
                                    '五': '#fce4ec', // 淺粉
                                    '六': '#f1f8e9', // 淺青綠
                                    '日': '#fafafa'  // 淺灰
                                  };
                                  const dayName = getDayName(time.day);
                                  return dayColors[dayName as keyof typeof dayColors] || '#f5f5f5';
                                })(),
                                color: '#333',
                                border: '1px solid #ddd',
                                '&:hover': {
                                  backgroundColor: (() => {
                                    const dayHoverColors = {
                                      '一': '#bbdefb', // 深藍
                                      '二': '#e1bee7', // 深紫
                                      '三': '#c8e6c9', // 深綠
                                      '四': '#ffcc02', // 深橙
                                      '五': '#f8bbd9', // 深粉
                                      '六': '#dcedc8', // 深青綠
                                      '日': '#e0e0e0'  // 深灰
                                    };
                                    const dayName = getDayName(time.day);
                                    return dayHoverColors[dayName as keyof typeof dayHoverColors] || '#e0e0e0';
                                  })()
                                }
                              }}
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

