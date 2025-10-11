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
  hasConflicts: boolean;
  isExpanded: boolean;
  onSelect: (course: CourseDetail) => void;
  onExpand: (courseId: string) => void;
  getDayName: (day: string) => string;
  getTimeSlotColor: (timeSlot: string) => string;
}

const CourseCard = memo(({
  course,
  isSelected,
  hasConflicts,
  isExpanded,
  onSelect,
  onExpand,
  getDayName,
  getTimeSlotColor
}: CourseCardProps) => {
  return (
    <Grid item xs={12} key={course.id}>
      <Card 
        sx={{ 
          border: hasConflicts ? '2px solid #ff9800' : '1px solid #e0e0e0',
          borderRadius: 2,
          '&:hover': { boxShadow: 2 }
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box>
                <Typography variant="h6" component="div">
                  {course.cou_cname || course.cou_code || '未命名課程'}
                  {hasConflicts && (
                    <Chip 
                      label="衝堂" 
                      color="warning" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
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
                      label={`星期${getDayName(time.day)} ${time.startTime}-${time.endTime}`}
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
                <Tooltip title="查看詳細資訊">
                  <IconButton
                    onClick={() => onExpand(course.id)}
                    size="small"
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={isSelected ? '已選' : '選課'}>
                  <IconButton
                    onClick={() => onSelect(course)}
                    disabled={isSelected}
                    sx={{ 
                      bgcolor: isSelected ? 'grey.300' : hasConflicts ? 'warning.main' : 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: isSelected ? 'grey.400' : hasConflicts ? 'warning.dark' : 'primary.dark'
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
