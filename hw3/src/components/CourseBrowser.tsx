import { useState, useCallback, useEffect } from 'react';
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
    triggerSearch,
    filterOptions
  } = useCourseSearch();

  const { addSelectedCourse, isSelected, checkConflicts } = useCourseSelection();
  const { state } = useCourseContext();

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inputValue, setInputValue] = useState<string>(''); // 本地輸入狀態

  // 只在重置時同步本地輸入狀態
  useEffect(() => {
    if (searchFilters.keyword === '' && inputValue !== '') {
      setInputValue('');
    }
  }, [searchFilters.keyword, inputValue]);

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
          return course.dpt_abbr?.includes('通識') || course.cou_cname?.includes('通識');
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
    addSelectedCourse(course);
    onCourseSelect?.(course);
  }, [addSelectedCourse, onCourseSelect]);

  const handleExpandCourse = useCallback((courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  }, [expandedCourse]);

  const getDayName = useCallback((day: string) => {
    const dayNames = ['', '一', '二', '三', '四', '五', '六', '日'];
    return dayNames[parseInt(day)] || day;
  }, []);

  const getTimeSlotColor = useCallback((timeSlot: string) => {
    const hour = parseInt(timeSlot.split(':')[0]);
    if (hour < 9) return 'default';
    if (hour < 12) return 'primary';
    if (hour < 15) return 'secondary';
    if (hour < 18) return 'success';
    return 'warning';
  }, []);

  const categoryFilteredCourses = getCategoryFilteredCourses();

  return (
    <Box>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="搜尋課程"
                placeholder="輸入課程名稱、代碼、教師..."
                value={inputValue}
                onChange={(e) => {
                  // 立即更新輸入框顯示
                  const value = e.target.value;
                  console.log('輸入框更新:', value);
                  setInputValue(value);
                  
                  // 只更新搜尋條件，不觸發搜尋
                  updateSearchFilters({ keyword: value });
                }}
                onKeyDown={(e) => {
                  // 按下 Enter 鍵觸發搜尋
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerSearch();
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<SearchIcon />}
                onClick={triggerSearch}
                disabled={isSearching}
              >
                {isSearching ? '搜尋中...' : '搜尋'}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                篩選
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setInputValue(''); // 重置本地輸入狀態
                  resetSearchFilters();
                }}
              >
                重置
              </Button>
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
              checkConflicts={checkConflicts}
              expandedCourse={expandedCourse}
              onCourseSelect={handleCourseSelect}
              onExpandCourse={handleExpandCourse}
              getDayName={getDayName}
              getTimeSlotColor={getTimeSlotColor}
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
