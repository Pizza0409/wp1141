import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CourseDetail, CourseSelection, SearchFilters, SubmissionRecord } from '../types/course';
import { loadCourseData } from '../utils/csvParser';

// Context 狀態型別
interface CourseState {
  courses: CourseDetail[];
  filteredCourses: CourseDetail[];
  selectedCourses: CourseSelection[];
  searchFilters: SearchFilters;
  submissionRecords: SubmissionRecord[];
  isLoading: boolean;
  error: string | null;
}

// Action 型別
type CourseAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_COURSES'; payload: CourseDetail[] }
  | { type: 'SET_FILTERED_COURSES'; payload: CourseDetail[] }
  | { type: 'UPDATE_SEARCH_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'ADD_SELECTED_COURSE'; payload: CourseSelection }
  | { type: 'REMOVE_SELECTED_COURSE'; payload: string }
  | { type: 'CLEAR_SELECTED_COURSES' }
  | { type: 'ADD_SUBMISSION_RECORD'; payload: SubmissionRecord }
  | { type: 'UPDATE_SUBMISSION_RECORD'; payload: SubmissionRecord }
  | { type: 'CLEAR_ALL_DATA' };

// 初始狀態
const initialState: CourseState = {
  courses: [],
  filteredCourses: [],
  selectedCourses: [],
  searchFilters: {
    keyword: '',
    department: '',
    credit: '',
    day: '',
    timeSlot: '',
    teacher: ''
  },
  submissionRecords: [],
  isLoading: false,
  error: null
};

// Reducer
function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_COURSES':
      return { ...state, courses: action.payload, filteredCourses: action.payload };
    
    case 'SET_FILTERED_COURSES':
      return { ...state, filteredCourses: action.payload };
    
    case 'UPDATE_SEARCH_FILTERS':
      return { 
        ...state, 
        searchFilters: { ...state.searchFilters, ...action.payload }
      };
    
    case 'ADD_SELECTED_COURSE':
      // 檢查是否已選
      const isAlreadySelected = state.selectedCourses.some(
        selection => selection.courseId === action.payload.courseId
      );
      
      if (isAlreadySelected) {
        return state;
      }
      
      return {
        ...state,
        selectedCourses: [...state.selectedCourses, action.payload]
      };
    
    case 'REMOVE_SELECTED_COURSE':
      return {
        ...state,
        selectedCourses: state.selectedCourses.filter(
          selection => selection.courseId !== action.payload
        )
      };
    
    case 'CLEAR_SELECTED_COURSES':
      return { ...state, selectedCourses: [] };
    
    case 'ADD_SUBMISSION_RECORD':
      return {
        ...state,
        submissionRecords: [...state.submissionRecords, action.payload]
      };
    
    case 'UPDATE_SUBMISSION_RECORD':
      return {
        ...state,
        submissionRecords: state.submissionRecords.map(record =>
          record.id === action.payload.id ? action.payload : record
        )
      };
    
    case 'CLEAR_ALL_DATA':
      return {
        ...state,
        selectedCourses: [],
        submissionRecords: [],
        searchFilters: {
          keyword: '',
          department: '',
          credit: '',
          day: '',
          timeSlot: '',
          teacher: ''
        }
      };
    
    default:
      return state;
  }
}

// Context
const CourseContext = createContext<{
  state: CourseState;
  dispatch: React.Dispatch<CourseAction>;
} | null>(null);

// Provider
export function CourseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(courseReducer, initialState);

  // 載入課程資料（只載入一次）
  useEffect(() => {
    const loadData = async () => {
      // 如果已經有資料，就不重新載入
      if (state.courses.length > 0) {
        console.log('Context: 課程資料已存在，跳過載入');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        console.log('Context: 開始載入課程資料...');
        const courses = await loadCourseData();
        console.log('Context: 載入課程資料完成', courses.length);
        
        if (courses.length === 0) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: '未找到任何課程資料，請檢查 CSV 檔案格式'
          });
        } else {
          dispatch({ type: 'SET_COURSES', payload: courses });
        }
      } catch (error) {
        console.error('Context: 載入課程資料失敗', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : '載入課程資料失敗'
        });
      }
    };

    loadData();
  }, [state.courses.length]);

  return (
    <CourseContext.Provider value={{ state, dispatch }}>
      {children}
    </CourseContext.Provider>
  );
}

// Hook
export function useCourseContext() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourseContext must be used within a CourseProvider');
  }
  return context;
}

