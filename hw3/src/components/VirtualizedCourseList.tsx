import { memo, useState, useEffect, useRef, useCallback } from 'react';
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
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 200; // 每個課程卡片的高度
  const containerHeight = 600; // 容器高度
  const overscan = 5; // 預渲染的額外項目數

  // 計算可見範圍
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      courses.length
    );

    setVisibleRange({ start: Math.max(0, start - overscan), end });
  }, [courses.length, itemHeight, containerHeight, overscan]);

  // 滾動事件處理
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      requestAnimationFrame(calculateVisibleRange);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    calculateVisibleRange(); // 初始計算

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [calculateVisibleRange]);

  if (courses.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          沒有找到符合條件的課程
        </Typography>
      </Box>
    );
  }

  // 如果課程數量少於 50 個，直接渲染所有項目
  if (courses.length <= 50) {
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
  }

  // 虛擬化渲染
  const visibleCourses = courses.slice(visibleRange.start, visibleRange.end);
  const totalHeight = courses.length * itemHeight;

  return (
    <Box
      ref={containerRef}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <Box sx={{ height: totalHeight, position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: visibleRange.start * itemHeight,
            left: 0,
            right: 0
          }}
        >
          <Grid container spacing={2}>
            {visibleCourses.map((course) => (
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
        </Box>
      </Box>
    </Box>
  );
});

VirtualizedCourseList.displayName = 'VirtualizedCourseList';

export default VirtualizedCourseList;