import Papa from 'papaparse';
import { Course, CourseDetail, CourseTime } from '../types/course';

// 解析課程時間
export function parseCourseTimes(course: Course): CourseTime[] {
  const times: CourseTime[] = [];
  
  // 解析六個時間段 (st1 day1, st2 day2, ..., st6 day6)
  for (let i = 1; i <= 6; i++) {
    const day = course[`day${i}` as keyof Course] as string;
    const startTime = course[`st${i}` as keyof Course] as string;
    const classroom = course[`clsrom_${i}` as keyof Course] as string;
    
    if (day && day !== '') {
      // day 欄位格式：數字組合表示節次
      // 例如：day1="567" 表示第5、6、7節
      //       day2="34" 表示第3、4節
      //       day3="12" 表示第1、2節
      
      // 解析節次 (day 欄位中的每個數字)
      const periods = day.split('').map(p => {
        // 處理特殊字符
        if (p === 'A') return 10; // A = 第10節
        if (p === 'B') return 11; // B = 第11節
        if (p === '@') return null; // 跳過無效字符
        return parseInt(p);
      }).filter(p => p !== null && p > 0) as number[];
      
      // 為每個節次創建時間段
      periods.forEach(period => {
        let startHour: number;
        let endHour: number;
        
        // 處理特殊節次
        if (period === 10) { // A = 第10節
          startHour = 8 + (10 - 1) * 1; // 第10節 = 17:00 (1小時制)
          endHour = startHour + 1;
        } else if (period === 11) { // B = 第11節
          startHour = 8 + (11 - 1) * 1; // 第11節 = 18:00 (1小時制)
          endHour = startHour + 1;
        } else if (period >= 10) { // 其他特殊節次
          startHour = 8 + (period - 1) * 1; // 1小時制
          endHour = startHour + 1;
        } else {
          // 一般節次 (1-9節，每節課1小時)
          startHour = 8 + (period - 1) * 1; // 第1節=8:00, 第2節=9:00, 第3節=10:00...
          endHour = startHour + 1;
        }
        
        // 確保時間在合理範圍內
        if (startHour >= 8 && startHour <= 22) {
          times.push({
            day: i.toString(), // 使用時間段編號作為星期幾 (1-6)
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`,
            classroom: classroom || '未指定'
          });
        }
      });
    }
  }
  
  return times;
}

// 生成課程描述
export function generateCourseDescription(course: Course): string {
  const parts: string[] = [];
  
  if (course.cou_cname && course.cou_cname.trim()) {
    parts.push(`課程名稱：${course.cou_cname}`);
  } else if (course.cou_code && course.cou_code.trim()) {
    parts.push(`課程代碼：${course.cou_code}`);
  }
  
  if (course.cou_ename && course.cou_ename.trim()) {
    parts.push(`英文名稱：${course.cou_ename}`);
  }
  
  if (course.tea_cname && course.tea_cname.trim()) {
    parts.push(`授課教師：${course.tea_cname}`);
  }
  
  if (course.credit && course.credit.trim()) {
    parts.push(`學分數：${course.credit}`);
  }
  
  if (course.dpt_abbr && course.dpt_abbr.trim()) {
    parts.push(`開課系所：${course.dpt_abbr}`);
  }
  
  if (course.pre_course && course.pre_course.trim()) {
    parts.push(`先修課程：${course.pre_course}`);
  }
  
  return parts.length > 0 ? parts.join('\n') : '課程資訊不完整';
}

// 檢查時間衝突
export function checkTimeConflict(time1: CourseTime, time2: CourseTime): boolean {
  if (time1.day !== time2.day) return false;
  
  const start1 = parseInt(time1.startTime.split(':')[0]);
  const end1 = parseInt(time1.endTime.split(':')[0]);
  const start2 = parseInt(time2.startTime.split(':')[0]);
  const end2 = parseInt(time2.endTime.split(':')[0]);
  
  return !(end1 <= start2 || end2 <= start1);
}

// 轉換原始課程資料為詳細課程資訊
export function transformCourseData(rawCourse: Course, index: number): CourseDetail {
  const times = parseCourseTimes(rawCourse);
  const description = generateCourseDescription(rawCourse);
  
  return {
    ...rawCourse,
    id: `course_${index}_${rawCourse.cou_code}_${rawCourse.ser_no}`,
    times,
    description,
    conflicts: []
  };
}

// 解析 CSV 檔案（修復版本）
export function parseCourseCSV(csvContent: string): CourseDetail[] {
  const parseResult = Papa.parse<Course>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    // 移除 worker 和 chunk 設定，避免同步問題
  });
  
  if (parseResult.errors.length > 0) {
    console.error('CSV parsing errors:', parseResult.errors);
  }
  
  console.log('CSV parsed, total rows:', parseResult.data.length);
  
  // 使用 Map 去重，根據 cou_code 篩選重複課程
  const courseMap = new Map<string, CourseDetail>();
  
  // 簡化篩選邏輯，先處理所有課程
  parseResult.data.forEach((course, index) => {
    // 確保課程有基本資訊
    if (!course.cou_cname && !course.cou_code) {
      console.warn('跳過無效課程:', course);
      return;
    }
    
    const transformedCourse = transformCourseData(course, index);
    const key = course.cou_code; // 使用 cou_code 作為去重鍵值
    
    // 避免重複課程，保留第一個出現的課程
    if (!courseMap.has(key)) {
      courseMap.set(key, transformedCourse);
    } else {
      console.log(`跳過重複課程: ${course.cou_code} - ${course.cou_cname}`);
    }
  });
  
  console.log('Courses after deduplication:', courseMap.size);
  return Array.from(courseMap.values());
}

// 載入 CSV 檔案（優化版本）
export async function loadCourseData(): Promise<CourseDetail[]> {
  try {
    console.log('開始載入 CSV 檔案...');
    const response = await fetch('/data/hw3-ntucourse-data-1002.csv');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvContent = await response.text();
    console.log('CSV 檔案載入完成，內容長度:', csvContent.length);
    
    // 使用 Web Worker 或分塊處理來避免阻塞 UI
    const courses = await parseCourseCSVAsync(csvContent);
    console.log('解析完成，課程數量:', courses.length);
    
    return courses;
  } catch (error) {
    console.error('Failed to load course data:', error);
    return [];
  }
}

// 異步解析 CSV，避免阻塞 UI
async function parseCourseCSVAsync(csvContent: string): Promise<CourseDetail[]> {
  return new Promise((resolve) => {
    // 使用 requestIdleCallback 或 setTimeout 將解析工作分到空閒時間
    const processChunk = () => {
      try {
        const courses = parseCourseCSV(csvContent);
        resolve(courses);
      } catch (error) {
        console.error('CSV 解析錯誤:', error);
        resolve([]);
      }
    };

    // 優先使用 requestIdleCallback，否則使用 setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(processChunk, { timeout: 5000 });
    } else {
      setTimeout(processChunk, 0);
    }
  });
}
