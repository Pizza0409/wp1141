import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { CourseDetail, SearchFilters } from '../types/course';
import { useCourseContext } from '../context/CourseContext';

export function useCourseSearch() {
  const { state, dispatch } = useCourseContext();
  const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>(state.searchFilters);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // 防抖動更新搜尋條件
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedFilters(state.searchFilters);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [state.searchFilters]);

  // 搜尋和篩選課程（優化版本）
  const filteredCourses = useMemo(() => {
    const { courses } = state;
    
    return courses.filter(course => {
      // 關鍵字搜尋
      if (debouncedFilters.keyword) {
        const keyword = debouncedFilters.keyword.toLowerCase();
        const matchesKeyword = 
          course.cou_cname.toLowerCase().includes(keyword) ||
          course.cou_ename.toLowerCase().includes(keyword) ||
          course.cou_code.toLowerCase().includes(keyword) ||
          course.tea_cname.toLowerCase().includes(keyword) ||
          course.dpt_abbr.toLowerCase().includes(keyword);
        
        if (!matchesKeyword) return false;
      }

      // 系所篩選
      if (debouncedFilters.department) {
        if (course.dpt_abbr !== debouncedFilters.department) return false;
      }

      // 學分篩選
      if (debouncedFilters.credit) {
        if (course.credit !== debouncedFilters.credit) return false;
      }

      // 星期篩選
      if (debouncedFilters.day) {
        const hasDay = course.times.some(time => time.day === debouncedFilters.day);
        if (!hasDay) return false;
      }

      // 時段篩選
      if (debouncedFilters.timeSlot) {
        const hasTimeSlot = course.times.some(time => {
          const startHour = parseInt(time.startTime.split(':')[0]);
          const timeSlotNum = parseInt(debouncedFilters.timeSlot);
          return startHour === timeSlotNum;
        });
        if (!hasTimeSlot) return false;
      }

      // 教師篩選
      if (debouncedFilters.teacher) {
        const teacher = debouncedFilters.teacher.toLowerCase();
        if (!course.tea_cname.toLowerCase().includes(teacher)) return false;
      }

      return true;
    });
  }, [state.courses, debouncedFilters]);

  // 立即更新搜尋條件（不防抖動）
  const updateSearchFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'UPDATE_SEARCH_FILTERS', payload: filters });
  }, [dispatch]);

  // 重置搜尋條件
  const resetSearchFilters = useCallback(() => {
    dispatch({ 
      type: 'UPDATE_SEARCH_FILTERS', 
      payload: {
        keyword: '',
        department: '',
        credit: '',
        day: '',
        timeSlot: '',
        teacher: ''
      }
    });
  }, [dispatch]);

  // 獲取可用的篩選選項
  const filterOptions = useMemo(() => {
    const { courses } = state;
    
    const departments = Array.from(new Set(courses.map(c => c.dpt_abbr).filter(Boolean)));
    const credits = Array.from(new Set(courses.map(c => c.credit).filter(Boolean)));
    const days = Array.from(new Set(courses.flatMap(c => c.times.map(t => t.day)).filter(Boolean)));
    const timeSlots = Array.from(new Set(
      courses.flatMap(c => c.times.map(t => parseInt(t.startTime.split(':')[0]))).filter(Boolean)
    )).sort((a, b) => a - b);

    return {
      departments: departments.sort(),
      credits: credits.sort((a, b) => parseInt(a) - parseInt(b)),
      days: days.sort((a, b) => parseInt(a) - parseInt(b)),
      timeSlots: timeSlots.map(slot => ({
        value: slot.toString(),
        label: `${slot}:00-${slot + 2}:00`
      }))
    };
  }, [state.courses]);

  return {
    filteredCourses,
    searchFilters: state.searchFilters, // 返回即時搜尋條件用於 UI 顯示
    updateSearchFilters,
    resetSearchFilters,
    filterOptions
  };
}