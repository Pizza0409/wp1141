import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { SubmissionRecord } from '../types/course';
import { useCourseSelection } from '../hooks/useCourseSelection';
import { CourseSchedule } from './CourseSchedule';

interface SubmissionHistoryProps {
  onModify?: (record: SubmissionRecord) => void;
}

export function SubmissionHistory({ onModify }: SubmissionHistoryProps) {
  const {
    getSubmissionRecords,
    canModifySubmission,
    modifySubmission
  } = useCourseSelection();

  const [selectedRecord, setSelectedRecord] = useState<SubmissionRecord | null>(null);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [modificationNote, setModificationNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const submissionRecords = getSubmissionRecords();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'submitted': return 'info';
      case 'confirmed': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'submitted': return '已送出';
      case 'confirmed': return '已確認';
      default: return '未知';
    }
  };

  const handleModify = async () => {
    if (!selectedRecord) return;
    
    setIsProcessing(true);
    try {
      const modifiedRecord = await modifySubmission(
        selectedRecord.id,
        selectedRecord.selections,
        modificationNote
      );
      setShowModifyDialog(false);
      setModificationNote('');
      onModify?.(modifiedRecord);
    } catch (error) {
      console.error('修改失敗:', error);
    } finally {
      setIsProcessing(false);
    }
  };


  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HistoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              送出記錄 ({submissionRecords.length} 筆)
            </Typography>
          </Box>
          
          {submissionRecords.length === 0 ? (
            <Alert severity="info">尚無送出記錄</Alert>
          ) : (
            <Box>
              {submissionRecords.map((record) => (
                <Accordion key={record.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6">
                          記錄 #{record.id.split('_')[1]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(record.submittedAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Chip
                            label={getStatusText(record.status)}
                            color={getStatusColor(record.status) as any}
                            size="small"
                          />
                          <Chip
                            label={`${record.selections.length} 門課程`}
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            label={`${record.selections.reduce((total, s) => total + parseInt(s.course.credit), 0)} 學分`}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Box sx={{ width: '100%' }}>
                      {/* 課程列表 */}
                      <List>
                        {record.selections.map((selection, index) => (
                          <React.Fragment key={selection.courseId}>
                            <ListItem>
                              <ListItemText
                                primary={selection.course.cou_cname}
                                secondary={
                                  <Box>
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
                                    <Box sx={{ mt: 1 }}>
                                      {selection.course.times.map((time, timeIndex) => (
                                        <Chip
                                          key={timeIndex}
                                          icon={<ScheduleIcon />}
                                          label={`星期${getDayName(time.day)} ${time.startTime}-${time.endTime} ${time.classroom}`}
                                          color={getTimeSlotColor(time.startTime) as any}
                                          size="small"
                                          sx={{ mr: 1, mb: 1 }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < record.selections.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                      
                      {/* 備註 */}
                      {record.note && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            備註:
                          </Typography>
                          <Typography variant="body2">
                            {record.note}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* 課程時間表 */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          課程時間表
                        </Typography>
                        <CourseSchedule selections={record.selections} />
                      </Box>
                      
                      {/* 操作按鈕 */}
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {canModifySubmission(record.id) && (
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setSelectedRecord(record);
                              setModificationNote(record.note || '');
                              setShowModifyDialog(true);
                            }}
                          >
                            修改
                          </Button>
                        )}
                        
                        {record.status === 'confirmed' && (
                          <Chip
                            label="已確認"
                            color="success"
                            variant="filled"
                            icon={<CheckCircleIcon />}
                          />
                        )}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 修改對話框 */}
      <Dialog open={showModifyDialog} onClose={() => setShowModifyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>修改送出記錄</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            修改送出記錄將會重置狀態為草稿，需要重新送出。
          </Alert>
          
          <TextField
            fullWidth
            label="備註"
            multiline
            rows={3}
            value={modificationNote}
            onChange={(e) => setModificationNote(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="請輸入修改說明..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModifyDialog(false)}>取消</Button>
          <Button
            onClick={handleModify}
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? '處理中...' : '確認修改'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

