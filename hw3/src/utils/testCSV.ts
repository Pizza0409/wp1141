// 測試 CSV 載入
import { loadCourseData } from './csvParser';

export async function testCSVLoading() {
  try {
    console.log('開始測試 CSV 載入...');
    const courses = await loadCourseData();
    console.log('載入完成，課程數量:', courses.length);
    
    if (courses.length > 0) {
      console.log('第一個課程:', courses[0]);
      console.log('課程名稱:', courses[0].cou_cname);
      console.log('課程代碼:', courses[0].cou_code);
    }
    
    return courses;
  } catch (error) {
    console.error('CSV 載入測試失敗:', error);
    return [];
  }
}
