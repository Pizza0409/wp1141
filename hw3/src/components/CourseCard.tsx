import { memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Box
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { CourseDetail } from '../types/course';

interface CourseCardProps {
  course: CourseDetail;
  isSelected: boolean;
  isPreSelected: boolean;
  isConfirmed: boolean;
  hasConflicts: boolean;
  isExpanded: boolean;
  onSelect: (course: CourseDetail) => void;
  onExpand: (courseId: string) => void;
  getDayName: (day: string) => string;
}

const CourseCard = memo(({
  course,
  isSelected,
  isPreSelected,
  isConfirmed,
  hasConflicts,
  isExpanded,
  onSelect,
  onExpand,
  getDayName
}: CourseCardProps) => {
  return (
    <Grid item xs={12} key={course.id}>
      <Card 
        sx={{ 
          border: (() => {
            if (isConfirmed) return '2px solid #4caf50'; // 已確認課程：綠色邊框
            if (hasConflicts && !isConfirmed) return '2px solid #ff9800'; // 衝堂但未確認：橙色邊框
            if (isPreSelected) return '2px solid #2196f3'; // 預選課程：藍色邊框
            return '1px solid #e0e0e0'; // 一般課程：灰色邊框
          })(),
          borderRadius: 2,
          maxWidth: 1200, // 限制最大寬度
          mx: 'auto', // 居中
          '&:hover': { boxShadow: 2 }
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h6" component="div">
                    {course.cou_cname || course.cou_code || '未命名課程'}
                  </Typography>
                  {isConfirmed && (
                    <Chip 
                      label="已選" 
                      color="success" 
                      size="small" 
                      variant="filled"
                    />
                  )}
                  {isPreSelected && !isConfirmed && (
                    <Chip 
                      label="預選" 
                      color="primary" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                  {hasConflicts && !isConfirmed && (
                    <Chip 
                      label="衝堂" 
                      color="warning" 
                      size="small" 
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {course.cou_ename || course.cou_code || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  課程代碼: {course.cou_code} | 學分: {course.credit} | 教師: {course.tea_cname}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  系所: {course.dpt_abbr}
                </Typography>
                
                {/* 時間標籤 */}
                <Box sx={{ mt: 1 }}>
                  {course.times.map((time, index) => (
                    <Chip
                      key={index}
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
                <Tooltip title="查看詳細資訊">
                  <IconButton
                    onClick={() => onExpand(course.id)}
                    size="small"
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={
                  isConfirmed ? '已選' : 
                  isPreSelected ? '預選' : 
                  '選課'
                }>
                  <IconButton
                    onClick={() => onSelect(course)}
                    disabled={isSelected}
                    sx={{ 
                      bgcolor: (() => {
                        if (isConfirmed) return '#4caf50'; // 已確認：綠色
                        if (isPreSelected) return '#2196f3'; // 預選：藍色
                        if (hasConflicts) return '#ff9800'; // 衝堂：橙色
                        return '#1976d2'; // 一般：深藍色
                      })(),
                      color: 'white',
                      '&:hover': {
                        bgcolor: (() => {
                          if (isConfirmed) return '#45a049'; // 已確認懸停
                          if (isPreSelected) return '#1976d2'; // 預選懸停
                          if (hasConflicts) return '#f57c00'; // 衝堂懸停
                          return '#1565c0'; // 一般懸停
                        })()
                      }
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
          
          {/* 展開的詳細資訊 */}
          <Collapse in={isExpanded}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {course.description}
              </Typography>
              
              {hasConflicts && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="warning.dark">
                    此課程與已選課程時間衝突，請確認是否仍要選修
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Grid>
  );
});

CourseCard.displayName = 'CourseCard';

export default CourseCard;
