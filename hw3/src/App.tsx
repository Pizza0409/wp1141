import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Tabs,
  Tab,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { CourseProvider } from './context/CourseContext';
import { CourseBrowser } from './components/CourseBrowser';
import { CourseSelection } from './components/CourseSelection';
import { SubmissionHistory } from './components/SubmissionHistory';
import { CourseSchedule } from './components/CourseSchedule';
import { ScrollToTop } from './components/ScrollToTop';
import { useCourseContext } from './context/CourseContext';
import { useCSVReload } from './hooks/useCSVReload';
import { useCourseSelection } from './hooks/useCourseSelection';

// 主題設定（簡化版本）
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AppContent() {
  const { state } = useCourseContext();
  const { reload } = useCSVReload();
  const { getLatestSubmission, getSubmissionRecords } = useCourseSelection();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCourseSelect = () => {
    // 選課後不自動跳轉，讓使用者繼續瀏覽課程
    // setTabValue(1);
  };

  const handleSubmission = () => {
    // 送出後自動切換到記錄頁面
    setTabValue(2);
  };

  if (state.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            載入課程資料中...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            正在解析超過 10,000 門課程，請稍候...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            這可能需要幾秒鐘時間
          </Typography>
        </Box>
      </Box>
    );
  }

  if (state.error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            載入課程資料失敗
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            請檢查 CSV 檔案是否存在於 public/data 目錄中
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            NTU 課程選課系統
          </Typography>
          <Tooltip title="重新載入課程資料">
            <IconButton color="inherit" onClick={reload}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="選課系統標籤">
            <Tab 
              icon={<SchoolIcon />} 
              label="課程瀏覽" 
              iconPosition="start"
            />
            <Tab 
              icon={<ScheduleIcon />} 
              label="選課管理" 
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="送出記錄" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CourseBrowser onCourseSelect={handleCourseSelect} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <CourseSelection onSubmission={handleSubmission} />
          </Box>
          <CourseSchedule 
            preSelectedCourses={state.selectedCourses}
            confirmedCourses={getLatestSubmission()?.selections || []}
            allConfirmedCourses={getSubmissionRecords().flatMap(record => record.selections)}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <SubmissionHistory />
        </TabPanel>
      </Container>
      
      {/* 回到頂部按鈕 */}
      <ScrollToTop />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CourseProvider>
        <AppContent />
      </CourseProvider>
    </ThemeProvider>
  );
}

export default App;
