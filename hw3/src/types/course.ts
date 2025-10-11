// 課程資料型別定義
export interface Course {
  yyse: string;           // 學年度學期
  ser_no: string;         // 序號
  co_chg: string;         // 課程異動
  dpt_code: string;       // 系所代碼
  year: string;           // 年級
  cou_code: string;       // 課程代碼
  class: string;          // 班別
  credit: string;         // 學分
  tlec: string;           // 講授時數
  tlab: string;           // 實驗時數
  forh: string;           // 實習時數
  sel_code: string;       // 選課代碼
  cou_cname: string;      // 課程中文名稱
  cou_ename: string;       // 課程英文名稱
  tea_seq: string;        // 教師序號
  tea_code: string;       // 教師代碼
  tea_cname: string;      // 教師中文姓名
  tea_ename: string;      // 教師英文姓名
  clsrom_1: string;       // 教室1
  clsrom_2: string;       // 教室2
  clsrom_3: string;       // 教室3
  clsrom_4: string;       // 教室4
  clsrom_5: string;       // 教室5
  clsrom_6: string;       // 教室6
  st1: string;            // 開始時間1
  day1: string;           // 星期1
  st2: string;            // 開始時間2
  day2: string;           // 星期2
  st3: string;            // 開始時間3
  day3: string;           // 星期3
  st4: string;            // 開始時間4
  day4: string;           // 星期4
  st5: string;            // 開始時間5
  day5: string;           // 星期5
  st6: string;            // 開始時間6
  day6: string;           // 星期6
  limit: string;          // 人數限制
  tno: string;            // 教師編號
  eno: string;            // 員工編號
  co_select: string;      // 選課狀態
  sno: string;            // 學生編號
  mark: string;           // 標記
  co_rep: string;         // 課程代表
  co_tp: string;          // 課程類型
  co_gmark: string;       // 課程群組標記
  co_eng: string;         // 英文課程
  grpno: string;          // 群組編號
  initsel: string;        // 初始選課
  outside: string;        // 外系
  pre_course: string;     // 先修課程
  dpt_abbr: string;       // 系所簡稱
  cou_teacno: string;     // 課程教師編號
  chgitem: string;        // 異動項目
  engmark: string;        // 英文標記
}

// 課程時間段
export interface CourseTime {
  day: string;            // 星期 (1-7)
  startTime: string;      // 開始時間
  endTime: string;        // 結束時間
  classroom: string;      // 教室
}

// 課程詳細資訊
export interface CourseDetail extends Course {
  id: string;             // 唯一識別碼
  times: CourseTime[];    // 時間段列表
  description: string;    // 課程描述
  conflicts: string[];    // 衝堂課程ID列表
}

// 選課狀態
export interface CourseSelection {
  courseId: string;
  course: CourseDetail;
  selectedAt: Date;
}

// 搜尋條件
export interface SearchFilters {
  keyword: string;
  department: string;
  credit: string;
  day: string;
  timeSlot: string;
  teacher: string;
}

// 送出記錄
export interface SubmissionRecord {
  id: string;
  selections: CourseSelection[];
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'confirmed';
  note?: string;
}

