import { useEffect, useState } from 'react';
import { loadCourseData } from '../utils/csvParser';
import { CourseDetail } from '../types/course';

export function useCSVReload() {
  const [courses, setCourses] = useState<CourseDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<Date | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await loadCourseData();
      setCourses(data);
      setLastModified(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入資料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadData();
  }, []);

  // 定期檢查檔案更新 (每30秒)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 檢查檔案是否有更新
        const response = await fetch('/data/hw3-ntucourse-data-1002.csv', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        const lastModifiedHeader = response.headers.get('last-modified');
        if (lastModifiedHeader) {
          const fileLastModified = new Date(lastModifiedHeader);
          if (!lastModified || fileLastModified > lastModified) {
            console.log('檢測到 CSV 檔案更新，重新載入資料...');
            await loadData();
          }
        }
      } catch (err) {
        console.warn('檢查檔案更新失敗:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [lastModified]);

  // 手動重新載入
  const reload = () => {
    loadData();
  };

  return {
    courses,
    isLoading,
    error,
    lastModified,
    reload
  };
}
