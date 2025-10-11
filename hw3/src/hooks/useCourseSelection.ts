import { useMemo } from 'react';
import { CourseDetail, CourseSelection, SubmissionRecord } from '../types/course';
import { useCourseContext } from '../context/CourseContext';
import { checkTimeConflict } from '../utils/csvParser';

export function useCourseSelection() {
  const { state, dispatch } = useCourseContext();

  // 添加選課
  const addSelectedCourse = (course: CourseDetail) => {
    const selection: CourseSelection = {
      courseId: course.id,
      course,
      selectedAt: new Date()
    };
    
    dispatch({ type: 'ADD_SELECTED_COURSE', payload: selection });
  };

  // 移除選課
  const removeSelectedCourse = (courseId: string) => {
    dispatch({ type: 'REMOVE_SELECTED_COURSE', payload: courseId });
  };

  // 清空選課
  const clearSelectedCourses = () => {
    dispatch({ type: 'CLEAR_SELECTED_COURSES' });
  };

  // 檢查是否已選
  const isSelected = (courseId: string) => {
    return state.selectedCourses.some(selection => selection.courseId === courseId);
  };

  // 檢查時間衝突
  const checkConflicts = (course: CourseDetail) => {
    const conflicts: string[] = [];
    
    state.selectedCourses.forEach(selection => {
      const hasConflict = course.times.some(courseTime =>
        selection.course.times.some(selectedTime =>
          checkTimeConflict(courseTime, selectedTime)
        )
      );
      
      if (hasConflict) {
        conflicts.push(selection.courseId);
      }
    });
    
    return conflicts;
  };

  // 獲取衝突課程
  const getConflictingCourses = (courseId: string) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return [];
    
    return state.selectedCourses.filter(selection => {
      return course.times.some(courseTime =>
        selection.course.times.some(selectedTime =>
          checkTimeConflict(courseTime, selectedTime)
        )
      );
    });
  };

  // 計算總學分
  const totalCredits = useMemo(() => {
    return state.selectedCourses.reduce((total, selection) => {
      const credits = parseInt(selection.course.credit) || 0;
      return total + credits;
    }, 0);
  }, [state.selectedCourses]);

  // 送出選課記錄
  const submitSelection = (note?: string) => {
    if (state.selectedCourses.length === 0) {
      throw new Error('請至少選擇一門課程');
    }

    const submissionRecord: SubmissionRecord = {
      id: `submission_${Date.now()}`,
      selections: [...state.selectedCourses],
      submittedAt: new Date(),
      status: 'submitted',
      note
    };

    dispatch({ type: 'ADD_SUBMISSION_RECORD', payload: submissionRecord });
    
    // 清空選課
    clearSelectedCourses();
    
    return submissionRecord;
  };

  // 獲取送出記錄
  const getSubmissionRecords = () => {
    return state.submissionRecords.sort((a, b) => 
      b.submittedAt.getTime() - a.submittedAt.getTime()
    );
  };

  // 獲取最新的送出記錄
  const getLatestSubmission = () => {
    const records = getSubmissionRecords();
    return records.length > 0 ? records[0] : null;
  };

  // 檢查是否可以修改送出記錄
  const canModifySubmission = (submissionId: string) => {
    const record = state.submissionRecords.find(r => r.id === submissionId);
    if (!record) return false;
    
    // 如果狀態是 confirmed，則不能修改
    if (record.status === 'confirmed') return false;
    
    // 如果送出時間超過24小時，則不能修改
    const hoursSinceSubmission = (Date.now() - record.submittedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceSubmission < 24;
  };

  // 修改送出記錄
  const modifySubmission = (submissionId: string, newSelections: CourseSelection[], note?: string) => {
    const record = state.submissionRecords.find(r => r.id === submissionId);
    if (!record) {
      throw new Error('找不到指定的送出記錄');
    }

    if (!canModifySubmission(submissionId)) {
      throw new Error('此記錄已無法修改');
    }

    const updatedRecord: SubmissionRecord = {
      ...record,
      selections: newSelections,
      note,
      status: 'draft'
    };

    dispatch({ type: 'UPDATE_SUBMISSION_RECORD', payload: updatedRecord });
    
    return updatedRecord;
  };

  // 確認送出記錄
  const confirmSubmission = (submissionId: string) => {
    const record = state.submissionRecords.find(r => r.id === submissionId);
    if (!record) {
      throw new Error('找不到指定的送出記錄');
    }

    const confirmedRecord: SubmissionRecord = {
      ...record,
      status: 'confirmed'
    };

    dispatch({ type: 'UPDATE_SUBMISSION_RECORD', payload: confirmedRecord });
    
    return confirmedRecord;
  };

  return {
    selectedCourses: state.selectedCourses,
    addSelectedCourse,
    removeSelectedCourse,
    clearSelectedCourses,
    isSelected,
    checkConflicts,
    getConflictingCourses,
    totalCredits,
    submitSelection,
    getSubmissionRecords,
    getLatestSubmission,
    canModifySubmission,
    modifySubmission,
    confirmSubmission
  };
}

