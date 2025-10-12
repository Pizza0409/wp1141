import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Warning as WarningIcon
} from '@mui/icons-material';
import { CourseSelection } from '../types/course';

interface CourseScheduleProps {
  preSelectedCourses?: CourseSelection[];
  confirmedCourses?: CourseSelection[];
  selections?: CourseSelection[]; // 向後兼容
}

export function CourseSchedule({ 
  preSelectedCourses = [], 
  confirmedCourses = [], 
  selections = [] 
}: CourseScheduleProps) {
  // 向後兼容：如果只傳入 selections，則作為預選課程
  const actualPreSelected = selections.length > 0 ? selections : preSelectedCourses;

  // 生成課表
  const schedule = useMemo(() => {
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00-21:00
    
    const scheduleData: { [key: string]: { [key: string]: CourseSelection[] } } = {};
    
    // 初始化課表
    days.forEach(day => {
      scheduleData[day] = {};
      timeSlots.forEach(slot => {
        scheduleData[day][slot.toString()] = [];
      });
    });
    
    // 填入所有課程（預選和已選）
    const allCourses = [...actualPreSelected, ...confirmedCourses];
    allCourses.forEach(selection => {
      selection.course.times.forEach(time => {
        const dayIndex = parseInt(time.day) - 1;
        if (dayIndex >= 0 && dayIndex < days.length) {
          const day = days[dayIndex];
          const startHour = parseInt(time.startTime.split(':')[0]);
          const endHour = parseInt(time.endTime.split(':')[0]);
          
          // 填入課程時間段
          for (let hour = startHour; hour < endHour; hour++) {
            if (scheduleData[day] && scheduleData[day][hour.toString()]) {
              // 避免重複添加同一課程
              const exists = scheduleData[day][hour.toString()].some(course => 
                course.courseId === selection.courseId
              );
              if (!exists) {
                scheduleData[day][hour.toString()].push(selection);
              }
            }
          }
        }
      });
    });
    
    return { days, timeSlots, scheduleData };
  }, [actualPreSelected, confirmedCourses]);

  // 檢查衝突
  const conflicts = useMemo(() => {
    const conflictList: Array<{
      course1: CourseSelection;
      course2: CourseSelection;
      day: string;
      time: string;
      type: 'pre-pre' | 'pre-confirmed' | 'confirmed-confirmed';
    }> = [];
    
    const allCourses = [...actualPreSelected, ...confirmedCourses];
    
    allCourses.forEach(selection1 => {
      allCourses.forEach(selection2 => {
        if (selection1.courseId !== selection2.courseId) {
          selection1.course.times.forEach(time1 => {
            selection2.course.times.forEach(time2 => {
              if (time1.day === time2.day) {
                const start1 = parseInt(time1.startTime.split(':')[0]);
                const end1 = parseInt(time1.endTime.split(':')[0]);
                const start2 = parseInt(time2.startTime.split(':')[0]);
                const end2 = parseInt(time2.endTime.split(':')[0]);
                
                // 檢查時間重疊
                if (!(end1 <= start2 || end2 <= start1)) {
                  const dayName = ['一', '二', '三', '四', '五', '六', '日'][parseInt(time1.day) - 1];
                  const conflictTime = `${Math.max(start1, start2)}:00-${Math.min(end1, end2)}:00`;
                  
                  // 判斷衝突類型
                  const isPre1 = actualPreSelected.includes(selection1);
                  const isPre2 = actualPreSelected.includes(selection2);
                  let type: 'pre-pre' | 'pre-confirmed' | 'confirmed-confirmed';
                  
                  if (isPre1 && isPre2) type = 'pre-pre';
                  else if (isPre1 || isPre2) type = 'pre-confirmed';
                  else type = 'confirmed-confirmed';
                  
                  conflictList.push({
                    course1: selection1,
                    course2: selection2,
                    day: dayName,
                    time: conflictTime,
                    type
                  });
                }
              }
            });
          });
        }
      });
    });
    
    return conflictList;
  }, [actualPreSelected, confirmedCourses]);

  const getTimeSlotColor = (timeSlot: number) => {
    if (timeSlot < 9) return 'default';
    if (timeSlot < 12) return 'primary';
    if (timeSlot < 15) return 'secondary';
    if (timeSlot < 18) return 'success';
    return 'warning';
  };


  return (
    <Box>
      {/* 衝突警告 */}
      {conflicts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            發現 {conflicts.length} 個時間衝突
          </Typography>
          {conflicts.map((conflict, index) => (
            <Typography key={index} variant="body2">
              • 星期{conflict.day} {conflict.time}: {conflict.course1.course.cou_cname} 與 {conflict.course2.course.cou_cname}
            </Typography>
          ))}
        </Alert>
      )}

      {/* 課表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            課程時間表
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 80 }}>時間</TableCell>
                  {schedule.days.map(day => (
                    <TableCell key={day} align="center" sx={{ minWidth: 120 }}>
                      星期{day}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {schedule.timeSlots.map(timeSlot => (
                  <TableRow key={timeSlot}>
                    <TableCell>
                      <Chip
                        label={`${timeSlot}:00`}
                        color={getTimeSlotColor(timeSlot) as any}
                        size="small"
                      />
                    </TableCell>
                    {schedule.days.map(day => {
                      const courses = schedule.scheduleData[day][timeSlot.toString()];
                      
                      return (
                        <TableCell key={day} align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {courses.length > 0 ? (
                              courses.map((selection, index) => {
                                const isConfirmed = confirmedCourses.includes(selection);
                                const hasConflict = courses.length > 1;
                                
                                return (
                                  <Tooltip
                                    key={`${selection.courseId}-${index}`}
                                    title={
                                      <Box>
                                        <Typography variant="subtitle2" color={isConfirmed ? "success.main" : "primary.main"}>
                                          [{isConfirmed ? "已選" : "預選"}] {selection.course.cou_cname}
                                        </Typography>
                                        <Typography variant="body2">
                                          {selection.course.cou_ename}
                                        </Typography>
                                        <Typography variant="body2">
                                          教師: {selection.course.tea_cname}
                                        </Typography>
                                        <Typography variant="body2">
                                          學分: {selection.course.credit}
                                        </Typography>
                                        <Typography variant="body2">
                                          教室: {selection.course.times.find(t => 
                                            parseInt(t.startTime.split(':')[0]) === timeSlot
                                          )?.classroom || '未指定'}
                                        </Typography>
                                        {hasConflict && (
                                          <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                                            ⚠️ 與其他課程衝堂
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                    arrow
                                  >
                                    <Chip
                                      label={`[${isConfirmed ? "已選" : "預選"}] ${selection.course.cou_cname}`}
                                      color={hasConflict ? "error" : (isConfirmed ? "success" : "primary")}
                                      size="small"
                                      variant={hasConflict ? "filled" : (isConfirmed ? "filled" : "outlined")}
                                      sx={{ 
                                        maxWidth: 100,
                                        fontSize: '0.7rem',
                                        '& .MuiChip-label': {
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                );
                              })
                            ) : (
                              <Box sx={{ height: 24 }} />
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 課程統計 */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            選課統計
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {actualPreSelected.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  預選課程
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {actualPreSelected.reduce((total, s) => total + parseInt(s.course.credit), 0)} 學分
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {confirmedCourses.reduce((total, s) => total + parseInt(s.course.credit), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  總學分
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (已選課程)
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {new Set(confirmedCourses.map(s => s.course.dpt_abbr).filter(dpt => dpt && dpt.trim())).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  開課系所
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (已選課程)
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {conflicts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  時間衝突
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

