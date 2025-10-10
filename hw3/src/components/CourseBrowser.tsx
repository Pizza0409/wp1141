import React, { useState } from 'react';
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
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { CourseDetail } from '../types/course';
import { useCourseSearch } from '../hooks/useCourseSearch';
import { useCourseSelection } from '../hooks/useCourseSelection';

interface CourseBrowserProps {
  onCourseSelect?: (course: CourseDetail) => void;
}

export function CourseBrowser({ onCourseSelect }: CourseBrowserProps) {
  const {
    filteredCourses,
    searchFilters,
    updateSearchFilters,
    resetSearchFilters,
    filterOptions
  } = useCourseSearch();

  const { addSelectedCourse, isSelected, checkConflicts } = useCourseSelection();

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleCourseSelect = (course: CourseDetail) => {
    addSelectedCourse(course);
    onCourseSelect?.(course);
  };

  const handleExpandCourse = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const getDayName = (day: string) => {
    const dayNames = ['', '一', '二', '三', '四', '五', '六', '日'];
    return dayNames[parseInt(day)] || day;
  };

  const getTimeSlotColor = (timeSlot: string) => {
    const hour = parseInt(timeSlot.split(':')[0]);
    if (hour < 9) return 'default';
    if (hour < 12) return 'primary';
    if (hour < 15) return 'secondary';
    if (hour < 18) return 'success';
    return 'warning';
  };

  return (
    <Box>
      {/* 搜尋列 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="搜尋課程"
                placeholder="輸入課程名稱、代碼、教師..."
                value={searchFilters.keyword}
                onChange={(e) => updateSearchFilters({ keyword: e.target.value })}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                篩選條件
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={resetSearchFilters}
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
        <Typography variant="h6" sx={{ mb: 2 }}>
          搜尋結果 ({filteredCourses.length} 門課程)
        </Typography>
        
        {filteredCourses.length === 0 ? (
          <Alert severity="info">沒有找到符合條件的課程</Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredCourses.map((course) => {
              const conflicts = checkConflicts(course);
              const hasConflicts = conflicts.length > 0;
              const isExpanded = expandedCourse === course.id;
              
              return (
                <Grid item xs={12} key={course.id}>
                  <Card 
                    sx={{ 
                      border: hasConflicts ? '2px solid #ff9800' : '1px solid #e0e0e0',
                      '&:hover': { boxShadow: 2 }
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Box>
                            <Typography variant="h6" component="div">
                              {course.cou_cname}
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
                              {course.cou_ename}
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
                                onClick={() => handleExpandCourse(course.id)}
                                size="small"
                              >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </Tooltip>
                            
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => handleCourseSelect(course)}
                              disabled={isSelected(course.id)}
                              color={hasConflicts ? 'warning' : 'primary'}
                            >
                              {isSelected(course.id) ? '已選' : '選課'}
                            </Button>
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
                            <Alert severity="warning" sx={{ mt: 2 }}>
                              此課程與已選課程時間衝突，請確認是否仍要選修
                            </Alert>
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
