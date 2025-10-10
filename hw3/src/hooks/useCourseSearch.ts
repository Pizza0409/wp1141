import { useMemo } from 'react';
import { CourseDetail, SearchFilters } from '../types/course';
import { useCourseContext } from '../context/CourseContext';

export function useCourseSearch() {
  const { state, dispatch } = useCourseContext();

  // 搜尋和篩選課程
  const filteredCourses = useMemo(() => {
    const { courses, searchFilters } = state;
    
    return courses.filter(course => {
      // 關鍵字搜尋
      if (searchFilters.keyword) {
        const keyword = searchFilters.keyword.toLowerCase();
        const matchesKeyword = 
          course.cou_cname.toLowerCase().includes(keyword) ||
          course.cou_ename.toLowerCase().includes(keyword) ||
          course.cou_code.toLowerCase().includes(keyword) ||
          course.tea_cname.toLowerCase().includes(keyword) ||
          course.dpt_abbr.toLowerCase().includes(keyword);
        
        if (!matchesKeyword) return false;
      }

      // 系所篩選
      if (searchFilters.department) {
        if (course.dpt_abbr !== searchFilters.department) return false;
      }

      // 學分篩選
      if (searchFilters.credit) {
        if (course.credit !== searchFilters.credit) return false;
      }

      // 星期篩選
      if (searchFilters.day) {
        const hasDay = course.times.some(time => time.day === searchFilters.day);
        if (!hasDay) return false;
      }

      // 時段篩選
      if (searchFilters.timeSlot) {
        const hasTimeSlot = course.times.some(time => {
          const startHour = parseInt(time.startTime.split(':')[0]);
          const timeSlotNum = parseInt(searchFilters.timeSlot);
          return startHour === timeSlotNum;
        });
        if (!hasTimeSlot) return false;
      }

      // 教師篩選
      if (searchFilters.teacher) {
        const teacher = searchFilters.teacher.toLowerCase();
        if (!course.tea_cname.toLowerCase().includes(teacher)) return false;
      }

      return true;
    });
  }, [state.courses, state.searchFilters]);

  // 更新搜尋條件
  const updateSearchFilters = (filters: Partial<SearchFilters>) => {
    dispatch({ type: 'UPDATE_SEARCH_FILTERS', payload: filters });
  };

  // 重置搜尋條件
  const resetSearchFilters = () => {
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
  };

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
    searchFilters: state.searchFilters,
    updateSearchFilters,
    resetSearchFilters,
    filterOptions
  };
}
