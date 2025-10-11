import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { CourseSelection } from '../types/course';
import { useCourseSelection } from '../hooks/useCourseSelection';

interface CourseScheduleProps {
  selections: CourseSelection[];
}

export function CourseSchedule({ selections }: CourseScheduleProps) {
  const { getConflictingCourses } = useCourseSelection();

  // 生成課表
  const schedule = useMemo(() => {
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00-21:00
    
    const scheduleData: { [key: string]: { [key: string]: CourseSelection | null } } = {};
    
    // 初始化課表
    days.forEach(day => {
      scheduleData[day] = {};
      timeSlots.forEach(slot => {
        scheduleData[day][slot.toString()] = null;
      });
    });
    
    // 填入課程
    selections.forEach(selection => {
      selection.course.times.forEach(time => {
        const dayIndex = parseInt(time.day) - 1;
        if (dayIndex >= 0 && dayIndex < days.length) {
          const day = days[dayIndex];
          const startHour = parseInt(time.startTime.split(':')[0]);
          const endHour = parseInt(time.endTime.split(':')[0]);
          
          // 填入課程時間段
          for (let hour = startHour; hour < endHour; hour++) {
            if (scheduleData[day] && scheduleData[day][hour.toString()] === null) {
              scheduleData[day][hour.toString()] = selection;
            }
          }
        }
      });
    });
    
    return { days, timeSlots, scheduleData };
  }, [selections]);

  // 檢查衝突
  const conflicts = useMemo(() => {
    const conflictList: Array<{
      course1: CourseSelection;
      course2: CourseSelection;
      day: string;
      time: string;
    }> = [];
    
    selections.forEach(selection1 => {
      selections.forEach(selection2 => {
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
                  
                  conflictList.push({
                    course1: selection1,
                    course2: selection2,
                    day: dayName,
                    time: conflictTime
                  });
                }
              }
            });
          });
        }
      });
    });
    
    return conflictList;
  }, [selections]);

  const getTimeSlotColor = (timeSlot: number) => {
    if (timeSlot < 9) return 'default';
    if (timeSlot < 12) return 'primary';
    if (timeSlot < 15) return 'secondary';
    if (timeSlot < 18) return 'success';
    return 'warning';
  };

  const getCourseColor = (selection: CourseSelection) => {
    // 根據課程代碼生成顏色
    const hash = selection.course.cou_code.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
    return colors[Math.abs(hash) % colors.length];
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
                      const course = schedule.scheduleData[day][timeSlot.toString()];
                      return (
                        <TableCell key={day} align="center">
                          {course ? (
                            <Tooltip
                              title={
                                <Box>
                                  <Typography variant="subtitle2">
                                    {course.course.cou_cname}
                                  </Typography>
                                  <Typography variant="body2">
                                    {course.course.cou_ename}
                                  </Typography>
                                  <Typography variant="body2">
                                    教師: {course.course.tea_cname}
                                  </Typography>
                                  <Typography variant="body2">
                                    學分: {course.course.credit}
                                  </Typography>
                                  <Typography variant="body2">
                                    教室: {course.course.times.find(t => 
                                      parseInt(t.startTime.split(':')[0]) === timeSlot
                                    )?.classroom || '未指定'}
                                  </Typography>
                                </Box>
                              }
                              arrow
                            >
                              <Chip
                                label={course.course.cou_cname}
                                color={getCourseColor(course) as any}
                                size="small"
                                sx={{ 
                                  maxWidth: 100,
                                  '& .MuiChip-label': {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Box sx={{ height: 24 }} />
                          )}
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
                  {selections.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  已選課程
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {selections.reduce((total, s) => total + parseInt(s.course.credit), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  總學分
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {new Set(selections.map(s => s.course.dpt_abbr)).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  開課系所
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

