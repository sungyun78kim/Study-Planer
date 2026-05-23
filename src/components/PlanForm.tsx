import React, { useState } from "react";
import { Plus, Trash2, Sparkles, BookOpen, Calendar, Info, Clock, AlertCircle } from "lucide-react";

interface PlanFormProps {
  onSubmit: (formData: {
    examName: string;
    examDate: string;
    startDate: string;
    subjects: string[];
    customNotes: string;
  }) => void;
  isLoading: boolean;
}

const PRESETS = [
  {
    name: "💜 중3 기말고사 올A 도전!",
    subjects: ["국어", "수학", "영어", "역사", "과학", "기술·가정"]
  },
  {
    name: "🍀 중3 중간고사 완벽대비",
    subjects: ["국어", "수학", "영어", "사회", "과학", "도덕"]
  },
  {
    name: "🧸 취약과목 밀착 마스터",
    subjects: ["수학 (함수와 기하)", "영어 문법 (관계사)", "과학 (유전과 화학)"]
  },
  {
    name: "✨ 고교 선행 & 방학 공부",
    subjects: ["고1 수학 (상)", "통합과학 기초", "예비고 영어독해"]
  }
];

export function PlanForm({ onSubmit, isLoading }: PlanFormProps) {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [startDate, setStartDate] = useState("2026-05-23"); // Preset current development time date
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);
    const trimmed = newSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setNewSubject("");
    }
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
    setActivePreset(null);
    setValidationError(null);
  };

  const applyPreset = (presetName: string, presetSubjects: string[]) => {
    setSubjects(presetSubjects);
    setActivePreset(presetName);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!examName.trim()) {
      setValidationError("시험 명칭(예: 중3 1학기 기말고사)을 적어주세요! 💜");
      return;
    }
    if (!examDate) {
      setValidationError("중요한 시험 날짜를 선택해주세요! 📅");
      return;
    }
    if (!startDate) {
      setValidationError("공부를 언제 시작할지 고르고 진행해줘! ✨");
      return;
    }
    if (subjects.length === 0) {
      setValidationError("공부할 목표 과목을 1개 이상 추가해주거나 아래 예쁜 프리셋 단추를 클릭해줘! 💜");
      return;
    }

    onSubmit({
      examName: examName.trim(),
      examDate,
      startDate,
      subjects,
      customNotes: customNotes.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden" id="planner-form">
      {/* Decorative top calm bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300" />
      
      {/* 1. Exam Basics */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" /> 1. 어떤 시험을 준비해볼까?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="exam-name" className="block text-xs font-semibold text-slate-500 mb-1.5">시험 이름</label>
            <input
              id="exam-name"
              type="text"
              placeholder="예: 중3 기말고사 💯, 수학 단원평가 등"
              value={examName}
              onChange={(e) => {
                setExamName(e.target.value);
                setValidationError(null);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all text-sm text-slate-800 bg-indigo-50/10 placeholder-slate-400"
              required
            />
          </div>

          <div>
            <label htmlFor="exam-date" className="block text-xs font-semibold text-slate-500 mb-1.5">시험 날짜 정하기 (D-Day)</label>
            <div className="relative">
              <input
                id="exam-date"
                type="date"
                value={examDate}
                onChange={(e) => {
                  setExamDate(e.target.value);
                  setValidationError(null);
                }}
                min={startDate}
                className="w-full px-4 py-2.5 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all text-sm text-slate-800 bg-indigo-50/10"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label htmlFor="prep-start-date" className="block text-xs font-semibold text-slate-500 mb-1.5">공부 시작할 날짜 📅</label>
            <input
              id="prep-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setValidationError(null);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all text-sm text-slate-800 bg-indigo-50/10"
              required
            />
          </div>
          <div className="flex items-center text-xs text-indigo-700/80 gap-2 bg-indigo-50/50 p-3.5 rounded-xl md:mt-5.5 border border-indigo-100/65 leading-relaxed font-medium">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>시작일과 시험 전날까지 공부 일정이 균형 있게 자동 스케줄링될 거야! 🍀</span>
          </div>
        </div>
      </div>

      {/* 2. Subjects Management */}
      <div className="space-y-4 pt-2 border-t border-indigo-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> 2. 이번 시험 과목 고르기 ⭐
          </h3>
          <span className="text-xs text-slate-400">등록한 과목들이 완벽하게 번갈아가며 스케줄링돼!</span>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">중3을 위한 추천 프리셋 한방에 채우기 💜</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset.name, preset.subjects)}
                className={`text-xs px-3.5 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
                  activePreset === preset.name
                    ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-bold shadow-xs scale-102"
                    : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 text-slate-600"
                }`}
                id={`preset-${preset.name}`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Enter new subject */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="직접 과목을 추가해봐! (예: 역사 📜, 도덕, 한문)"
            value={newSubject}
            onChange={(e) => {
              setNewSubject(e.target.value);
              setValidationError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject(e)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-sm text-slate-800 placeholder-slate-400"
            id="new-subject-input"
          />
          <button
            type="button"
            onClick={() => handleAddSubject()}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shadow-indigo-100"
            id="add-subject-button"
          >
            <Plus className="w-4 h-4" /> 추가하기
          </button>
        </div>

        {/* Selected Subjects Badge Display */}
        {subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2 p-3.5 bg-indigo-50/20 rounded-2xl border border-indigo-50">
            {subjects.map((sub, idx) => (
              <div
                key={`${sub}-${idx}`}
                className="flex items-center gap-1.5 bg-white text-slate-700 text-xs py-1.5 pl-3 pr-2 rounded-xl border border-indigo-100/80 shadow-3xs group hover:border-indigo-300 transition-all font-semibold"
                id={`subject-badge-${idx}`}
              >
                <span>{sub}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(idx)}
                  className="p-0.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-7 border border-dashed border-indigo-100 rounded-2xl text-slate-400 text-xs leading-relaxed">
            아직 추가된 과목이 없어요! 위의 <b className="text-indigo-500">라벤더 프리셋</b>을 눌러서 간편하게 채워보거나 과목을 직접 적어주세요 🧸💜
          </div>
        )}
      </div>

      {/* 3. Personalized Settings */}
      <div className="space-y-4 pt-2 border-t border-indigo-50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" /> 3. 나만을 위한 소중한 조율 코멘트 (선택) 🎀
        </h3>

        <div>
          <label htmlFor="custom-notes" className="block text-xs font-semibold text-slate-500 mb-1.5">학습 언니 플래너에게 속삭일 다짐 & 조율 요청</label>
          <textarea
            id="custom-notes"
            rows={3}
            placeholder="예: '수학 점수를 올리는 데 엄청 집중하고 싶어! ✏️', '주말 일요일은 편히 충전하게 일정 조절해줘 🍰', '하루 공부 분량 너무 많지 않게 짜줘요!'"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all text-sm text-slate-800 placeholder-slate-400 resize-none bg-indigo-50/5"
          />
        </div>
      </div>

      {/* Inline Validation Banner */}
      {validationError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold animate-pulse">
          <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-2xl text-white font-extrabold transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
            isLoading
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-indigo-100 hover:shadow-indigo-200"
          }`}
          id="generate-plan-submit"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>언니가 공부 계획을 머리 맞대며 그리는 중... 🧸💭</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-indigo-100 animate-pulse" />
              <span>나만을 위한 만점 AI 공부 플랜 생성하기! 💜✨</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
