import { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Grid,
  Alert,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { CourseDetail } from '../types/course';
import { useCourseSearch } from '../hooks/useCourseSearch';
import { useCourseSelection } from '../hooks/useCourseSelection';
import { useCourseContext } from '../context/CourseContext';
import VirtualizedCourseList from './VirtualizedCourseList';

interface CourseBrowserProps {
  onCourseSelect?: (course: CourseDetail) => void;
}

export function CourseBrowser({ onCourseSelect }: CourseBrowserProps) {
  const {
    filteredCourses,
    searchFilters,
    isSearching,
    updateSearchFilters,
    resetSearchFilters,
    filterOptions
  } = useCourseSearch();

  const { addSelectedCourse, isSelected, checkConflicts, getSubmissionRecords } = useCourseSelection();
  const { state } = useCourseContext();

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 課程分組
  const courseCategories = [
    { value: 'all', label: '全部課程', icon: <SchoolIcon /> },
    { value: 'general', label: '通識課程', icon: <PersonIcon /> },
    { value: 'freshman', label: '新生課程', icon: <ScheduleIcon /> },
    { value: 'program', label: '學程課程', icon: <SchoolIcon /> }
  ];

  // 根據分組篩選課程
  const getCategoryFilteredCourses = () => {
    if (selectedCategory === 'all') return filteredCourses;
    
    return filteredCourses.filter(course => {
      switch (selectedCategory) {
        case 'general':
          // 使用 mark 欄位識別通識課程
          return course.mark?.includes('通識') ||
                 course.mark?.includes('A1') ||
                 course.mark?.includes('A2') ||
                 course.mark?.includes('A3') ||
                 course.mark?.includes('A4') ||
                 course.mark?.includes('A5') ||
                 course.mark?.includes('A6') ||
                 course.mark?.includes('A7') ||
                 course.mark?.includes('A8') ||
                 course.mark?.includes('A9') ||
                 course.mark?.includes('B1') ||
                 course.mark?.includes('B2') ||
                 course.mark?.includes('B3') ||
                 course.mark?.includes('B4') ||
                 course.mark?.includes('B5') ||
                 course.mark?.includes('B6') ||
                 course.mark?.includes('B7') ||
                 course.mark?.includes('B8') ||
                 course.mark?.includes('B9') ||
                 course.mark?.includes('C1') ||
                 course.mark?.includes('C2') ||
                 course.mark?.includes('C3') ||
                 course.mark?.includes('C4') ||
                 course.mark?.includes('C5') ||
                 course.mark?.includes('C6') ||
                 course.mark?.includes('C7') ||
                 course.mark?.includes('C8') ||
                 course.mark?.includes('C9') ||
                 course.mark?.includes('D1') ||
                 course.mark?.includes('D2') ||
                 course.mark?.includes('D3') ||
                 course.mark?.includes('D4') ||
                 course.mark?.includes('D5') ||
                 course.mark?.includes('D6') ||
                 course.mark?.includes('D7') ||
                 course.mark?.includes('D8') ||
                 course.mark?.includes('D9') ||
                 // 備用識別方式
                 course.dpt_abbr?.includes('通識') || 
                 course.cou_cname?.includes('通識') ||
                 course.co_gmark?.includes('通識');
        case 'freshman':
          return course.year === '1' || course.cou_cname?.includes('新生');
        case 'program':
          return course.cou_cname?.includes('學程') || course.cou_cname?.includes('專題');
        default:
          return true;
      }
    });
  };

  const handleCourseSelect = useCallback((course: CourseDetail) => {
    // 檢查是否已經選中（預選或已確認）
    if (isSelected(course.id)) {
      return; // 已選中的課程不能重複選擇
    }
    addSelectedCourse(course);
    onCourseSelect?.(course);
  }, [addSelectedCourse, onCourseSelect, isSelected]);

  const handleExpandCourse = useCallback((courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  }, [expandedCourse]);

  const getDayName = useCallback((day: string) => {
    const dayNames = ['', '一', '二', '三', '四', '五', '六', '日'];
    return dayNames[parseInt(day)] || day;
  }, []);

  // 檢查課程是否為預選
  const isPreSelected = useCallback((courseId: string) => {
    return state.selectedCourses.some(selection => selection.courseId === courseId);
  }, [state.selectedCourses]);

  // 檢查課程是否為已確認
  const isConfirmed = useCallback((courseId: string) => {
    const allConfirmedCourses = getSubmissionRecords().flatMap(record => record.selections);
    return allConfirmedCourses.some(selection => selection.courseId === courseId);
  }, [getSubmissionRecords]);



  const categoryFilteredCourses = getCategoryFilteredCourses();

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 課程分組 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          課程分類
        </Typography>
        <ToggleButtonGroup
          value={selectedCategory}
          exclusive
          onChange={(_, value) => value && setSelectedCategory(value)}
          size="small"
          sx={{ flexWrap: 'wrap' }}
        >
          {courseCategories.map(category => (
            <ToggleButton key={category.value} value={category.value}>
              {category.icon}
              <Typography variant="body2" sx={{ ml: 1 }}>
                {category.label}
              </Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      {/* 搜尋列 */}
      <Card sx={{ mb: 2, boxShadow: 1 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                size="small"
                label="搜尋課程"
                placeholder="輸入課程名稱、代碼、教師..."
                value={searchFilters.keyword}
                onChange={(e) => {
                  // 立即更新搜尋條件，自動觸發防抖動搜尋
                  updateSearchFilters({ keyword: e.target.value });
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ minWidth: 150 }}
                >
                  篩選
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    resetSearchFilters();
                  }}
                  sx={{ minWidth: 150 }}
                >
                  重置
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* 篩選條件 */}
          <Collapse in={showFilters}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>系所</InputLabel>
                    <Select
                      value={searchFilters.department}
                      onChange={(e) => updateSearchFilters({ department: e.target.value })}
                      label="系所"
                    >
                      <MenuItem value="">全部</MenuItem>
                      {filterOptions.departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>學分</InputLabel>
                    <Select
                      value={searchFilters.credit}
                      onChange={(e) => updateSearchFilters({ credit: e.target.value })}
                      label="學分"
                    >
                      <MenuItem value="">全部</MenuItem>
                      {filterOptions.credits.map(credit => (
                        <MenuItem key={credit} value={credit}>{credit} 學分</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>星期</InputLabel>
                    <Select
                      value={searchFilters.day}
                      onChange={(e) => updateSearchFilters({ day: e.target.value })}
                      label="星期"
                    >
                      <MenuItem value="">全部</MenuItem>
                      {filterOptions.days.map(day => (
                        <MenuItem key={day} value={day}>星期{getDayName(day)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>時段</InputLabel>
                    <Select
                      value={searchFilters.timeSlot}
                      onChange={(e) => updateSearchFilters({ timeSlot: e.target.value })}
                      label="時段"
                    >
                      <MenuItem value="">全部</MenuItem>
                      {filterOptions.timeSlots.map(slot => (
                        <MenuItem key={slot.value} value={slot.value}>{slot.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* 課程列表 */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            搜尋結果 ({categoryFilteredCourses.length} 門課程)
          </Typography>
          {isSearching && (
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                搜尋中...
              </Typography>
            </Box>
          )}
        </Box>
        
        {state.courses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              正在載入課程資料...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              請稍候，我們正在為您準備課程資訊
            </Typography>
          </Box>
        ) : categoryFilteredCourses.length === 0 && !isSearching ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            沒有找到符合條件的課程
          </Alert>
        ) : (
          <Box sx={{ position: 'relative' }}>
            <VirtualizedCourseList
              courses={categoryFilteredCourses}
              isSelected={isSelected}
              isPreSelected={isPreSelected}
              isConfirmed={isConfirmed}
              checkConflicts={checkConflicts}
              expandedCourse={expandedCourse}
              onCourseSelect={handleCourseSelect}
              onExpandCourse={handleExpandCourse}
              getDayName={getDayName}
            />
            
            {/* 搜尋中的覆蓋層 */}
            {isSearching && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: 2
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    正在搜尋課程...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    請稍候，我們正在為您篩選最相關的課程
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
      
    </Box>
  );
}
