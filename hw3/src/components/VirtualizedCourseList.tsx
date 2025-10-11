import { memo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { CourseDetail } from '../types/course';
import CourseCard from './CourseCard';

interface VirtualizedCourseListProps {
  courses: CourseDetail[];
  isSelected: (courseId: string) => boolean;
  checkConflicts: (course: CourseDetail) => string[];
  expandedCourse: string | null;
  onCourseSelect: (course: CourseDetail) => void;
  onExpandCourse: (courseId: string) => void;
  getDayName: (day: string) => string;
  getTimeSlotColor: (timeSlot: string) => string;
}

const VirtualizedCourseList = memo(({
  courses,
  isSelected,
  checkConflicts,
  expandedCourse,
  onCourseSelect,
  onExpandCourse,
  getDayName,
  getTimeSlotColor
}: VirtualizedCourseListProps) => {
  if (courses.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          沒有找到符合條件的課程
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isSelected={isSelected(course.id)}
          hasConflicts={checkConflicts(course).length > 0}
          isExpanded={expandedCourse === course.id}
          onSelect={onCourseSelect}
          onExpand={onExpandCourse}
          getDayName={getDayName}
          getTimeSlotColor={getTimeSlotColor}
        />
      ))}
    </Grid>
  );
});

VirtualizedCourseList.displayName = 'VirtualizedCourseList';

export default VirtualizedCourseList;