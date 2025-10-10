import Papa from 'papaparse';
import { Course, CourseDetail, CourseTime } from '../types/course';

// 解析課程時間
export function parseCourseTimes(course: Course): CourseTime[] {
  const times: CourseTime[] = [];
  
  // 解析六個時間段
  for (let i = 1; i <= 6; i++) {
    const day = course[`day${i}` as keyof Course] as string;
    const startTime = course[`st${i}` as keyof Course] as string;
    const classroom = course[`clsrom_${i}` as keyof Course] as string;
    
    if (day && startTime && day !== '' && startTime !== '') {
      // 計算結束時間 (假設每堂課2小時)
      const startHour = parseInt(startTime);
      const endHour = startHour + 2;
      
      times.push({
        day,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        classroom: classroom || '未指定'
      });
    }
  }
  
  return times;
}

// 生成課程描述
export function generateCourseDescription(course: Course): string {
  const parts: string[] = [];
  
  if (course.cou_cname) {
    parts.push(`課程名稱：${course.cou_cname}`);
  }
  
  if (course.cou_ename) {
    parts.push(`英文名稱：${course.cou_ename}`);
  }
  
  if (course.tea_cname) {
    parts.push(`授課教師：${course.tea_cname}`);
  }
  
  if (course.credit) {
    parts.push(`學分數：${course.credit}`);
  }
  
  if (course.dpt_abbr) {
    parts.push(`開課系所：${course.dpt_abbr}`);
  }
  
  if (course.pre_course) {
    parts.push(`先修課程：${course.pre_course}`);
  }
  
  return parts.join('\n');
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

// 解析 CSV 檔案
export function parseCourseCSV(csvContent: string): CourseDetail[] {
  const parseResult = Papa.parse<Course>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });
  
  if (parseResult.errors.length > 0) {
    console.error('CSV parsing errors:', parseResult.errors);
  }
  
  return parseResult.data
    .filter(course => course.cou_cname && course.cou_cname.trim() !== '')
    .map((course, index) => transformCourseData(course, index));
}

// 載入 CSV 檔案
export async function loadCourseData(): Promise<CourseDetail[]> {
  try {
    const response = await fetch('/data/hw3-ntucourse-data-1002.csv');
    const csvContent = await response.text();
    return parseCourseCSV(csvContent);
  } catch (error) {
    console.error('Failed to load course data:', error);
    return [];
  }
}
