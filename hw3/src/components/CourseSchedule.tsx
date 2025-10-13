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
  allConfirmedCourses?: CourseSelection[]; // 所有已確認的課程
  selections?: CourseSelection[]; // 向後兼容
}

export function CourseSchedule({ 
  preSelectedCourses = [], 
  confirmedCourses = [], 
  allConfirmedCourses = [],
  selections = [] 
}: CourseScheduleProps) {
  // 向後兼容：如果只傳入 selections，則作為預選課程
  const actualPreSelected = selections.length > 0 ? selections : preSelectedCourses;
  // 使用所有已確認課程，如果沒有提供則使用 confirmedCourses
  const actualConfirmedCourses = allConfirmedCourses.length > 0 ? allConfirmedCourses : confirmedCourses;

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
    const allCourses = [...actualPreSelected, ...actualConfirmedCourses];
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
  }, [actualPreSelected, actualConfirmedCourses]);

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
  }, [actualPreSelected, actualConfirmedCourses]);



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
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {timeSlot}:00
                      </Typography>
                    </TableCell>
                    {schedule.days.map(day => {
                      const courses = schedule.scheduleData[day][timeSlot.toString()];
                      
                      return (
                        <TableCell key={day} align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {courses.length > 0 ? (
                              courses.map((selection, index) => {
                                const isConfirmed = actualConfirmedCourses.includes(selection);
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
                                        fontWeight: isConfirmed ? 'bold' : 'normal',
                                        '& .MuiChip-label': {
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        },
                                        // 根據課程狀態和星期幾設定背景色
                                        backgroundColor: hasConflict ? undefined : (() => {
                                          if (isConfirmed) {
                                            // 已選課程使用飽和的顏色
                                            const confirmedColors = {
                                              '一': '#1976d2', // 深藍
                                              '二': '#7b1fa2', // 深紫
                                              '三': '#388e3c', // 深綠
                                              '四': '#f57c00', // 深橙
                                              '五': '#c2185b', // 深粉
                                              '六': '#689f38', // 深青綠
                                              '日': '#616161'  // 深灰
                                            };
                                            return confirmedColors[day as keyof typeof confirmedColors] || '#1976d2';
                                          } else {
                                            // 預選課程使用淺色
                                            const dayColors = {
                                              '一': '#e3f2fd', // 淺藍
                                              '二': '#f3e5f5', // 淺紫
                                              '三': '#e8f5e8', // 淺綠
                                              '四': '#fff3e0', // 淺橙
                                              '五': '#fce4ec', // 淺粉
                                              '六': '#f1f8e9', // 淺青綠
                                              '日': '#fafafa'  // 淺灰
                                            };
                                            return dayColors[day as keyof typeof dayColors] || '#f5f5f5';
                                          }
                                        })(),
                                        color: isConfirmed ? 'white' : '#333',
                                        '&:hover': {
                                          backgroundColor: hasConflict ? undefined : (() => {
                                            if (isConfirmed) {
                                              // 已選課程懸停效果
                                              const confirmedHoverColors = {
                                                '一': '#1565c0', // 更深藍
                                                '二': '#6a1b9a', // 更深紫
                                                '三': '#2e7d32', // 更深綠
                                                '四': '#ef6c00', // 更深橙
                                                '五': '#ad1457', // 更深粉
                                                '六': '#558b2f', // 更深青綠
                                                '日': '#424242'  // 更深灰
                                              };
                                              return confirmedHoverColors[day as keyof typeof confirmedHoverColors] || '#1565c0';
                                            } else {
                                              // 預選課程懸停效果
                                              const dayHoverColors = {
                                                '一': '#bbdefb', // 深藍
                                                '二': '#e1bee7', // 深紫
                                                '三': '#c8e6c9', // 深綠
                                                '四': '#ffcc02', // 深橙
                                                '五': '#f8bbd9', // 深粉
                                                '六': '#dcedc8', // 深青綠
                                                '日': '#e0e0e0'  // 深灰
                                              };
                                              return dayHoverColors[day as keyof typeof dayHoverColors] || '#e0e0e0';
                                            }
                                          })()
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
          
          {/* 無時間課程 */}
          {(() => {
            const allCourses = [...actualPreSelected, ...actualConfirmedCourses];
            const coursesWithoutTimes = allCourses.filter(selection => 
              !selection.course.times || selection.course.times.length === 0
            );
            
            return coursesWithoutTimes.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  無指定時間：
                  {coursesWithoutTimes.map((selection, index) => (
                    <span key={selection.courseId}>
                      {index > 0 && '、'}
                      <Chip
                        label={`[${actualConfirmedCourses.includes(selection) ? "已選" : "預選"}] ${selection.course.cou_cname}`}
                        size="small"
                        color={actualConfirmedCourses.includes(selection) ? "success" : "primary"}
                        variant={actualConfirmedCourses.includes(selection) ? "filled" : "outlined"}
                        sx={{ ml: 0.5, mr: 0.5 }}
                      />
                    </span>
                  ))}
                </Typography>
              </Box>
            );
          })()}
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
                  {actualConfirmedCourses.reduce((total, s) => total + parseInt(s.course.credit), 0)}
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
                  {new Set(actualConfirmedCourses.map(s => s.course.dpt_abbr).filter(dpt => dpt && dpt.trim())).size}
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

