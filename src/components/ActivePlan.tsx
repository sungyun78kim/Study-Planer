import React, { useState } from "react";
import { StudyPlan, DailyTask } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Calendar as CalendarIcon, 
  Award, 
  ChevronRight, 
  ChevronLeft,
  BarChart2, 
  Plus, 
  Check, 
  Trash2, 
  Download 
} from "lucide-react";

interface ActivePlanProps {
  plan: StudyPlan;
  onUpdatePlan: (updatedPlan: StudyPlan) => void;
  onReset: () => void;
}

export function ActivePlan({ plan, onUpdatePlan, onReset }: ActivePlanProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "subjects" | "overview">("calendar");
  
  // Custom Task addition inside selected date sticky note
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState(plan.subjects[0]?.name || "기타");
  const [newTaskMinutes, setNewTaskMinutes] = useState(60);

  // Time logging popup state
  const [loggingTimeTask, setLoggingTimeTask] = useState<{
    dateString: string;
    subject: string;
    taskName: string;
  } | null>(null);
  const [loggedMinutes, setLoggedMinutes] = useState<string>("");

  // System reference date: 2026-05-23
  const systemTodayStr = "2026-05-23";
  const systemToday = new Date(systemTodayStr);

  // Extract all tasks across all phases to calculate statistics
  const getAllTasks = (): DailyTask[] => {
    const tasks: DailyTask[] = [];
    plan.phases.forEach((phase) => {
      phase.dailyTasks.forEach((task) => {
        tasks.push(task);
      });
    });
    return tasks.sort((a, b) => a.dayNumber - b.dayNumber);
  };

  const allTasks = getAllTasks();
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter((t) => t.completed).length;
  const completionPercentage = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Study hours stats
  const totalEstimatedMinutes = allTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalCompletedMinutes = allTasks.reduce((sum, t) => {
    if (t.completed) {
      return sum + (t.completedMinutes ?? t.estimatedMinutes);
    }
    return sum;
  }, 0);
  
  const studyEfficiency = totalEstimatedMinutes > 0
    ? Math.round((totalCompletedMinutes / totalEstimatedMinutes) * 100)
    : 0;

  // Derive unique study date strings
  const uniqueDates = Array.from(new Set(allTasks.map((t) => t.dateString))).sort();

  // Initialize Calendar Center Year and Month based on study periods
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (uniqueDates.length > 0) {
      return new Date(uniqueDates[0]).getFullYear();
    }
    return 2026;
  });
  
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (uniqueDates.length > 0) {
      return new Date(uniqueDates[0]).getMonth(); // 0-indexed
    }
    return 4; // May
  });

  // Decide selected date. Defaults to 2026-05-23 if present in study plan, or the first study date.
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (uniqueDates.includes(systemTodayStr)) {
      return systemTodayStr;
    }
    return uniqueDates[0] || systemTodayStr;
  });

  // Calculate D-Day from system reference date
  const calculateDDay = () => {
    const examDateObj = new Date(plan.examDate);
    systemToday.setHours(0, 0, 0, 0);
    examDateObj.setHours(0, 0, 0, 0);
    
    const diff = examDateObj.getTime() - systemToday.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "D-Day 🎉";
    if (days < 0) return `기말고사 완료 🌸`;
    return `시험까지 D-${days}`;
  };

  // Switch months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Toggle checklist complete
  const handleToggleTaskByDateAndIndex = (dateStr: string, subject: string, taskName: string) => {
    const updatedPhases = plan.phases.map((p) => {
      const updatedDailyTasks = p.dailyTasks.map((t) => {
        if (t.dateString === dateStr && t.subject === subject && t.taskName === taskName) {
          const newState = !t.completed;
          return {
            ...t,
            completed: newState,
            completedMinutes: newState ? t.estimatedMinutes : 0
          };
        }
        return t;
      });
      return { ...p, dailyTasks: updatedDailyTasks };
    });
    onUpdatePlan({ ...plan, phases: updatedPhases });
  };

  // Open Log Time custom modal
  const handleOpenTimeLogPopup = (dateStr: string, subject: string, taskName: string, curMin: number) => {
    setLoggingTimeTask({ dateString: dateStr, subject, taskName });
    setLoggedMinutes(String(curMin || 60));
  };

  // Save Logged duration in minutes
  const handleSaveTimeLog = () => {
    if (!loggingTimeTask) return;
    const minutesVal = parseInt(loggedMinutes, 10);
    if (isNaN(minutesVal) || minutesVal < 0) {
      return;
    }

    const updatedPhases = plan.phases.map((p) => {
      const updatedDailyTasks = p.dailyTasks.map((t) => {
        if (
          t.dateString === loggingTimeTask.dateString && 
          t.subject === loggingTimeTask.subject && 
          t.taskName === loggingTimeTask.taskName
        ) {
          return {
            ...t,
            completedMinutes: minutesVal,
            completed: minutesVal > 0 ? true : t.completed
          };
        }
        return t;
      });
      return { ...p, dailyTasks: updatedDailyTasks };
    });

    onUpdatePlan({ ...plan, phases: updatedPhases });
    setLoggingTimeTask(null);
  };

  // Add individual study schedules inline
  const handleAddCustomTaskToDate = () => {
    if (!newTaskName.trim()) {
      return;
    }

    // Identify matching phase or append to the first phase
    let matchedPhaseIdx = 0;
    plan.phases.forEach((p, idx) => {
      if (p.dailyTasks.some((t) => t.dateString === selectedDate)) {
        matchedPhaseIdx = idx;
      }
    });

    const dayNumForDate = allTasks.find((t) => t.dateString === selectedDate)?.dayNumber 
      || (allTasks.length > 0 ? allTasks[allTasks.length - 1].dayNumber + 1 : 1);

    const newTask: DailyTask = {
      dayNumber: dayNumForDate,
      dateString: selectedDate,
      subject: newTaskSubject,
      taskName: newTaskName.trim(),
      priority: "중",
      estimatedMinutes: newTaskMinutes || 60,
      completed: false,
      completedMinutes: 0
    };

    const updatedPhases = plan.phases.map((p, idx) => {
      if (idx === matchedPhaseIdx) {
        return {
          ...p,
          dailyTasks: [...p.dailyTasks, newTask].sort((a, b) => a.dayNumber - b.dayNumber)
        };
      }
      return p;
    });

    onUpdatePlan({ ...plan, phases: updatedPhases });
    setNewTaskName("");
  };

  // Delete study task
  const handleRemoveTaskByDateAndIndex = (dateStr: string, subject: string, taskName: string) => {
    const updatedPhases = plan.phases.map((p) => {
      const filteredTasks = p.dailyTasks.filter((t) => 
        !(t.dateString === dateStr && t.subject === subject && t.taskName === taskName)
      );
      return { ...p, dailyTasks: filteredTasks };
    });
    onUpdatePlan({ ...plan, phases: updatedPhases });
  };

  // CSV Backup Downloader
  const handleExportCSV = () => {
    const csvContent = [
      ["일차", "날짜", "과목", "공부 과업", "중요도", "계획시간(분)", "실제공부(분)", "완료상태"],
      ...allTasks.map(t => [
        `Day ${t.dayNumber}`,
        t.dateString,
        t.subject,
        t.taskName,
        t.priority,
        t.estimatedMinutes,
        t.completedMinutes ?? 0,
        t.completed ? "완료" : "대기"
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${plan.examName}_달콤캘린더_스케줄.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate full Gregorian calendar rows for current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const lastDateOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells = [];
  
  // Padding cells for previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayVal = lastDateOfPrevMonth - i;
    const mVal = currentMonth === 0 ? 11 : currentMonth - 1;
    const yVal = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarCells.push({
      date: new Date(yVal, mVal, dayVal),
      isCurrentMonth: false,
    });
  }

  // Active current month cells
  for (let d = 1; d <= lastDateOfMonth; d++) {
    calendarCells.push({
      date: new Date(currentYear, currentMonth, d),
      isCurrentMonth: true,
    });
  }

  // Padding cells for following month
  const totalCount = calendarCells.length;
  const nextMonthPaddingNeeded = totalCount % 7 === 0 ? 0 : 7 - (totalCount % 7);
  for (let d = 1; d <= nextMonthPaddingNeeded; d++) {
    const mVal = currentMonth === 11 ? 0 : currentMonth + 1;
    const yVal = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarCells.push({
      date: new Date(yVal, mVal, d),
      isCurrentMonth: false,
    });
  }

  // Helper: Date format string matching "YYYY-MM-DD"
  const formatDateString = (dt: Date): string => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Find tasks matching single date
  const selectedDateTasks = allTasks.filter((t) => t.dateString === selectedDate);

  const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

  // D-Day urgency calculation (D-7 or closer)
  const examDateObj = new Date(plan.examDate);
  const tempToday = new Date(systemTodayStr);
  tempToday.setHours(0, 0, 0, 0);
  examDateObj.setHours(0, 0, 0, 0);
  const dDayNum = Math.ceil((examDateObj.getTime() - tempToday.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = dDayNum >= 0 && dDayNum <= 7;

  return (
    <div className="space-y-6" id="active-plan-viewer">
      
      {/* Visual Top Dashboard - 3 simple columns containing vital stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Circle Card */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-150 shadow-3xs flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-300" />
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">나의 기특도 💜</p>
            <p className="text-xl font-black text-slate-800">{completionPercentage}% 달성</p>
            <p className="text-[10px] text-indigo-600 font-semibold">{completedTasksCount}/{totalTasksCount} 완료</p>
          </div>
        </div>

        {/* Study Flow Card */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-150 shadow-3xs flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-300" />
          <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">열정 텐션 🔥</p>
            <p className="text-xl font-black text-slate-800">{studyEfficiency}% 몰입</p>
            <p className="text-[10px] text-indigo-500 font-semibold">총 {Math.round(totalCompletedMinutes / 60)}시간 공부</p>
          </div>
        </div>

        {/* Exam D-Day Card with Vibrant Pastel Neon style for urgent states */}
        {isUrgent ? (
          <div className="bg-gradient-to-tr from-violet-50/90 via-fuchsia-50/60 to-indigo-50/80 border-2 border-indigo-300 p-4 rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-4 relative overflow-hidden animate-pulse">
            <div className="absolute -right-3 -top-3 w-12 h-12 bg-indigo-500/10 rounded-full blur-md" />
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-tight">{plan.examName} 📚</span>
                <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-md animate-pulse">D-7 네온 집입구간! ⏰</span>
              </div>
              <p className="text-xl font-black text-indigo-800 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] flex items-center gap-1">
                {calculateDDay()} ⚡
              </p>
              <p className="text-[10px] text-fuchsia-600 font-bold">집중할 시간! 온 힘을 다해서 멋지게 백점받자! 💕</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-indigo-150 shadow-3xs flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-400" />
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400">{plan.examName} 📚</p>
              <p className="text-xl font-black text-indigo-600">{calculateDDay()}</p>
              <p className="text-[10px] text-slate-500 font-semibold">목표일: {plan.examDate}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Menu in Soft Pastel Style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-indigo-100 pb-2 gap-3">
        <div className="flex gap-1 bg-indigo-50/40 p-1 rounded-xl w-fit border border-indigo-100/40">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "calendar"
                ? "bg-white text-indigo-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            기특한 파스텔 캘린더 📅
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "subjects"
                ? "bg-white text-indigo-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            과목 길잡이 🏫
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-white text-indigo-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            단계별 로드맵 🚀
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="text-[11px] px-3 py-2 bg-indigo-50 hover:bg-indigo-100/85 text-indigo-700 border border-indigo-200/50 rounded-xl font-bold flex items-center gap-1 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> CSV 백업하기
          </button>
          <button
            onClick={onReset}
            className="text-[11px] px-3 py-2 text-indigo-600 hover:bg-indigo-50 font-bold border border-indigo-200 rounded-xl transition-all"
          >
            새 일정 짜기 💜
          </button>
        </div>
      </div>

      {/* Tab Area content details */}
      <div className="min-h-[300px]">
        {/* Tab 1: Delightful Monthly Calendar Block */}
        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: 7-Column Grid Calendar */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-indigo-100 shadow-3xs space-y-4">
              
              {/* Calendar Selector Header */}
              <div className="flex items-center justify-between pb-2">
                <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span className="text-base">📅</span>
                  <span>{currentYear}년 {currentMonth + 1}월 스케줄</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl border border-indigo-100 text-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl border border-indigo-100 text-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid body */}
              <div className="space-y-1">
                {/* Week Day Labels */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] py-1 border-b border-indigo-50">
                  {WEEK_DAYS.map((d, index) => (
                    <span 
                      key={d} 
                      className={
                        index === 0 
                          ? "text-rose-500" 
                          : index === 6 
                          ? "text-indigo-500" 
                          : "text-slate-400"
                      }
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Cells */}
                <div className="grid grid-cols-7 gap-1.5 pt-1.5">
                  {calendarCells.map((cell, idx) => {
                    const cellKey = formatDateString(cell.date);
                    const isSelected = cellKey === selectedDate;
                    
                    // Filter tasks specifically for this cell date
                    const dayTasks = allTasks.filter((t) => t.dateString === cellKey);
                    const hasTasks = dayTasks.length > 0;
                    const isAllDone = hasTasks && dayTasks.every((t) => t.completed);

                    // Determine active cell styling
                    let cellBg = "bg-white text-slate-800 hover:bg-indigo-50/30 border-slate-100";
                    if (!cell.isCurrentMonth) {
                      cellBg = "bg-slate-50/40 text-slate-300 border-transparent pointer-events-none";
                    } else if (hasTasks) {
                      if (isAllDone) {
                        cellBg = "bg-indigo-100/60 text-indigo-800 border-indigo-200 hover:bg-indigo-150 font-bold";
                      } else {
                        cellBg = "bg-indigo-50/60 text-slate-850 border-indigo-100 hover:bg-indigo-100/40 font-bold";
                      }
                    }

                    // Selected ring highlight
                    const ringStyle = isSelected 
                      ? "ring-2 ring-indigo-400 ring-offset-2 border-transparent scale-102 z-10" 
                      : "border";

                    // Group unique subject tags on this day
                    const distinctSubjects = Array.from(new Set(dayTasks.map((t) => t.subject)));

                    return (
                      <button
                        key={`${cellKey}-${idx}`}
                        onClick={() => cell.isCurrentMonth && setSelectedDate(cellKey)}
                        disabled={!cell.isCurrentMonth}
                        className={`min-h-[66px] p-1 rounded-2xl flex flex-col justify-between items-start transition-all duration-200 cursor-pointer relative ${cellBg} ${ringStyle}`}
                      >
                        {/* Day Number */}
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full">
                            {cell.date.getDate()}
                          </span>
                          {isAllDone && (
                            <span className="text-[9px] text-indigo-500 mr-2">💜</span>
                          )}
                        </div>

                        {/* Miniature Pills representation of topics */}
                        {cell.isCurrentMonth && hasTasks && (
                          <div className="flex flex-wrap gap-0.5 w-full justify-start select-none">
                            {distinctSubjects.slice(0, 3).map((sub, sIdx) => (
                              <span 
                                key={sIdx} 
                                className={`text-[8px] px-1 py-0.2 rounded-md truncate font-extrabold scale-90 origin-left max-w-full ${
                                  isAllDone 
                                    ? "bg-indigo-200/50 text-indigo-800" 
                                    : "bg-indigo-100/50 text-indigo-700"
                                }`}
                              >
                                {sub.substring(0, 1)}
                              </span>
                            ))}
                            {distinctSubjects.length > 3 && (
                              <span className="text-[7.5px] text-indigo-400 font-bold leading-none">+</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gentle Helper indicator */}
              <div className="flex items-center gap-4 text-[10px] text-slate-400 justify-end pt-2 border-t border-indigo-50/50">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-50/60 border border-indigo-100" />
                  <span>공부 예정일</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-100/60 border border-indigo-200" />
                  <span>내신 백점 완성일 💜</span>
                </div>
              </div>

            </div>

            {/* Right Column: Today's Sticky Study Checklist Drawer */}
            <div className="lg:col-span-5 bg-slate-50/50 border-2 border-indigo-100/60 rounded-3xl p-5 shadow-3xs space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/30 rounded-full blur-2xl pointer-events-none" />
              
              {/* Sticker Date Indicator Pin */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-800 font-black text-sm tracking-tight flex items-center gap-1">
                    <span>🧸</span>
                    <span>{selectedDate.replace(/-/g, ". ")} 요약장</span>
                  </h3>
                  <p className="text-[11px] text-indigo-600/80 font-bold mt-0.5">
                    {selectedDate === systemTodayStr ? "기특하게 공부하는 '오늘'이야! ✨" : "선택한 날의 공부할 일들을 모아봤어!"}
                  </p>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full shadow-3xs">
                  {selectedDateTasks.length}개 할 일
                </span>
              </div>

              {/* Task Items Checklist */}
              {selectedDateTasks.length === 0 ? (
                <div className="bg-white/60 p-6 rounded-2xl border border-dashed border-indigo-100 text-center space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    이 날은 공식 공부 계획표가 비어 있단다!<br />
                    아래에서 직접 해결해야 할 맞춤 일정을 추가해봐 💜
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {selectedDateTasks.map((task, idx) => (
                    <div 
                      key={`${task.taskName}-${idx}`}
                      className={`p-3.5 bg-white rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                        task.completed 
                          ? "border-indigo-100 bg-indigo-50/15" 
                          : "border-indigo-50"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start min-w-0 flex-1">
                        {/* Check Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleTaskByDateAndIndex(selectedDate, task.subject, task.taskName)}
                          className="pt-0.5 text-indigo-300 hover:text-indigo-500 transition-colors cursor-pointer shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5.5 h-5.5 text-indigo-500 fill-indigo-50" />
                          ) : (
                            <Circle className="w-5.5 h-5.5 text-indigo-200 hover:text-indigo-400" />
                          )}
                        </button>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-indigo-100/55 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                              {task.subject}
                            </span>
                            {task.priority === "상" && (
                              <span className="bg-indigo-50 text-indigo-600 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-indigo-100">
                                필수 💯
                              </span>
                            )}
                          </div>
                          <p className={`text-slate-700 text-xs font-semibold leading-relaxed ${task.completed ? "line-through text-slate-400 animate-pulse" : ""}`}>
                            {task.taskName}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400 font-medium">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3 text-indigo-400" /> 목표 {task.estimatedMinutes}분
                            </span>
                            {task.completedMinutes !== undefined && task.completedMinutes > 0 && (
                              <span className="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.2 rounded">
                                실제 {task.completedMinutes}분 몰입 완료
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Small Quick Actions */}
                      <div className="flex items-center gap-1 shrink-0 self-center">
                        <button
                          onClick={() => handleOpenTimeLogPopup(selectedDate, task.subject, task.taskName, task.completedMinutes ?? task.estimatedMinutes)}
                          className="text-[9px] bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-100 rounded-lg px-1.5 py-1.5 font-bold cursor-pointer"
                          title="집중 시간 직접 쓰고 도장받기"
                        >
                          시간기록
                        </button>
                        <button
                          onClick={() => handleRemoveTaskByDateAndIndex(selectedDate, task.subject, task.taskName)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Drawer Extra Custom Sub-Task Adding Panel */}
              <div className="pt-3 border-t border-indigo-100/60 space-y-2.5">
                <span className="text-[11px] font-bold text-indigo-700 block">💜 이 날에 어울릴 비밀 일정 직접 끼워넣기</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold mb-1">어느 과목인가요?</label>
                    <select
                      value={newTaskSubject}
                      onChange={(e) => setNewTaskSubject(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-indigo-100 bg-white"
                    >
                      {plan.subjects.map((sub) => (
                        <option key={sub.name} value={sub.name}>{sub.name}</option>
                      ))}
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold mb-1">몇 분 몰입할 비밀 약속?</label>
                    <input
                      type="number"
                      value={newTaskMinutes}
                      onChange={(e) => setNewTaskMinutes(Math.max(1, parseInt(e.target.value, 10) || 30))}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-indigo-100 bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="예: 기출 문제 가볍게 20개 정독하기"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-indigo-100 bg-white placeholder-slate-400 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustomTaskToDate();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCustomTaskToDate}
                    className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    일정 추가
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Minimalist Subject Guidelines */}
        {activeTab === "subjects" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-indigo-50/20 p-4 rounded-2xl border border-indigo-100 mb-2">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                <span>🏫</span>
                <span>언니의 비밀 과목 마스터 기조</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">과목의 난이도 균형을 맞추어 기특하게 공략해보자!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plan.subjects.map((sub) => {
                const totalSubjectDays = allTasks.filter(t => t.subject === sub.name).length;
                return (
                  <div 
                    key={sub.name}
                    className="bg-white p-5 rounded-2xl border border-indigo-50 shadow-3xs hover:border-indigo-200 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-indigo-50/20 pb-2">
                      <span className="font-extrabold text-slate-800 text-sm">{sub.name} 📚</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        sub.difficulty === "상" 
                          ? "bg-rose-50 text-rose-600 border border-rose-100" 
                          : sub.difficulty === "중"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        피로감 {sub.difficulty}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-indigo-50/10 py-2 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">권장 몰입</span>
                        <span className="text-slate-800 font-black text-xs block mt-0.5">{sub.recommendedHours}분 / 일</span>
                      </div>
                      <div className="bg-indigo-50/10 py-2 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">스케줄 편성 일수</span>
                        <span className="text-slate-800 font-black text-xs block mt-0.5">{totalSubjectDays}일간</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 block">✨ 시험에서 꼭 건져야 할 단원들</span>
                      <div className="flex flex-col gap-1">
                        {sub.focusAreas.map((area, sIdx) => (
                          <div 
                            key={`${area}-${sIdx}`} 
                            className="text-[11px] text-slate-600 flex items-center gap-1.5 bg-indigo-50/10 px-2 py-1 rounded-lg border border-indigo-50/20"
                          >
                            <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                            <span className="truncate">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Timeline Step Roadmap */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-3xl max-w-4xl">
              <h4 className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-500" /> 시작해보자, 만점 도약 타임라인! ✨
              </h4>
              <p className="text-indigo-850/90 text-xs leading-relaxed mt-1 font-medium">
                날짜 <b>{plan.startDate}</b>부터 시험일인 <b>{plan.examDate}</b>까지 동생을 똑순이로 개조해줄 3단계 비밀 전략이란다!
              </p>
            </div>

            <div className="relative border-l border-indigo-100 ml-4 space-y-6 pl-5 max-w-3xl">
              {plan.phases.map((phase, idx) => {
                const phaseCompleted = phase.dailyTasks.filter(t => t.completed).length;
                const phaseTotal = phase.dailyTasks.length;
                const phasePercent = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;

                return (
                  <div key={phase.phaseName} className="relative">
                    <div className="absolute -left-9 top-0 bg-white border-2 border-indigo-300 w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-indigo-600 text-xs shadow-3xs">
                      {idx + 1}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-3xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <h4 className="font-extrabold text-slate-800 text-xs md:text-sm">{phase.phaseName}</h4>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100/40 px-2 py-0.5 rounded-full font-bold">
                          {phase.durationDays}일공부 ({phasePercent}% 완료)
                        </span>
                      </div>

                      <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                        {phase.description}
                      </p>

                      <div className="flex gap-2 text-[9px] text-indigo-700/80">
                        <span>Day {phase.dailyTasks[0]?.dayNumber || "1"} ~ Day {phase.dailyTasks[phase.dailyTasks.length - 1]?.dayNumber || "종료"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actual Study Hours Logger Modal popup */}
      {loggingTimeTask !== null && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-indigo-200 space-y-3.5 animate-in fade-in zoom-in-95 duration-100">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-indigo-600">
              ⏰ 실제 집중한 시간(분) 기록하기
            </h4>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              &quot;{loggingTimeTask.taskName}&quot; 과제를 마치는 데 진짜 몇 분 동안 몰입해서 공부했니?
            </p>

            <div className="space-y-1 rounded-lg">
              <label htmlFor="modal-minutes-input" className="block text-[10px] font-bold text-slate-400">몰입 시간 (분 단위)</label>
              <input
                id="modal-minutes-input"
                type="number"
                value={loggedMinutes}
                onChange={(e) => setLoggedMinutes(e.target.value)}
                placeholder="60"
                className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-100 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveTimeLog();
                  }
                }}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setLoggingTimeTask(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl text-[11px] cursor-pointer"
              >
                닫기
              </button>
              <button
                onClick={handleSaveTimeLog}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-[11px] cursor-pointer shadow-xs"
              >
                기록 저장 💜
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
