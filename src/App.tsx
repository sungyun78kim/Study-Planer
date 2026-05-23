/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { StudyPlan } from "./types";
import { PlanForm } from "./components/PlanForm";
import { ActivePlan } from "./components/ActivePlan";
import { Calendar, HelpCircle, Archive, Compass, BookOpen, Star, AlertCircle, RefreshCw } from "lucide-react";

export default function App() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planToDeleteId, setPlanToDeleteId] = useState<string | null>(null);

  // Load plans from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("exam_study_plans_v1");
      if (stored) {
        const parsed: StudyPlan[] = JSON.parse(stored);
        setPlans(parsed);
        if (parsed.length > 0) {
          setActivePlanId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading plans from localStorage:", e);
    }
  }, []);

  // Save plans to local storage whenever they change
  const savePlansToStorage = (updatedPlans: StudyPlan[]) => {
    try {
      setPlans(updatedPlans);
      localStorage.setItem("exam_study_plans_v1", JSON.stringify(updatedPlans));
    } catch (e) {
      console.error("Error saving plans to localStorage:", e);
    }
  };

  // Submit and request plan from the express Node backend
  const handleGeneratePlan = async (formData: {
    examName: string;
    examDate: string;
    startDate: string;
    subjects: string[];
    customNotes: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error ?? "AI 공부 계획표를 생성하는 데 실패했습니다. 다시 시도해 주세요.");
      }

      const generatedData = await response.json();
      
      // Inject local management fields
      const newPlan: StudyPlan = {
        ...generatedData,
        id: `plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
        examName: formData.examName,
        examDate: formData.examDate,
        startDate: formData.startDate,
      };

      // Add default completed parameters to keep checklist state robust
      newPlan.phases = newPlan.phases.map((phase) => ({
        ...phase,
        dailyTasks: phase.dailyTasks.map((task) => ({
          ...task,
          completed: false,
          completedMinutes: 0
        }))
      }));

      const newPlansList = [newPlan, ...plans];
      savePlansToStorage(newPlansList);
      setActivePlanId(newPlan.id);
    } catch (err: any) {
      console.error("Plan generation error:", err);
      setError(err.message || "공부 계획 수립 모델에 접근할 수 없습니다. 서버 구성을 확인해 주십시오.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update a single plan (e.g. when checklist or actual study time is modified)
  const handleUpdateActivePlan = (updatedPlan: StudyPlan) => {
    const updatedList = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    savePlansToStorage(updatedList);
  };

  const activePlan = plans.find((p) => p.id === activePlanId) || null;

  return (
    <div className="min-h-screen bg-indigo-50/10 text-slate-800 flex flex-col font-sans animate-fade-in">
      {/* 1. Header Area with Lovely Lavender/Indigo Gradient Icon */}
      <header className="bg-white border-b border-indigo-100 py-4 px-6 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 text-white p-2.5 rounded-2xl shadow-xs shadow-indigo-100">
              <Calendar className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                언니의 AI 공부 플래너 <span className="text-base select-none">💜🧸</span>
              </h1>
              <p className="text-xs text-indigo-600/80 font-semibold">우리 소중한 동생을 똑순이 만점으로 채워 줄 스마트 프랜드 💜</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline-block font-medium">현재 일자: 2026-05-23</span>
            <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100">
              친언니 AI 구동중 🧸
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Sidebar for Saved Plans List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-600/80 uppercase tracking-wider flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-400" /> 나의 보물 공부 스케줄첩 📖
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{plans.length}</span>
            </div>

            {plans.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-semibold leading-relaxed">
                보관된 계획표가 없어요.<br />스케줄표를 먼저 만들어봐요 ✨
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {plans.map((p) => {
                  const isActive = p.id === activePlanId;
                  return (
                    <div
                      key={p.id}
                      className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold shadow-2xs scale-102"
                          : "bg-white border-slate-100 hover:bg-indigo-50/10 text-slate-700"
                      }`}
                      onClick={() => {
                        setActivePlanId(p.id);
                        setError(null);
                      }}
                      id={`sidebar-plan-item-${p.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs truncate font-bold text-slate-800">{p.examName} 💜</p>
                        <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{p.examDate} 까지 ({p.totalDays}일용)</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToDeleteId(p.id);
                        }}
                        className="p-1 px-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer ml-1.5 font-bold text-sm"
                        title="계획 삭제"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {plans.length > 0 && !activePlan && (
              <button
                onClick={() => {
                  setActivePlanId(plans[0].id);
                  setError(null);
                }}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs shadow-indigo-100"
              >
                계획 다시 들여다보기 💕
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Primary Content Panel */}
        <div className="lg:col-span-9 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-start gap-3 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-sm">오류 발생</p>
                <p className="text-xs leading-relaxed text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-600 underline font-semibold cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-indigo-100 shadow-sm text-center flex flex-col items-center justify-center space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 animate-pulse" />
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center text-indigo-500 font-extrabold text-xs">
                  AI ✨
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <p className="font-extrabold text-slate-800 text-base">언니가 공부 계획표를 그리는 중... 🧸💭</p>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                  시험 범위 과목들을 달콤하고 똑소리나게 조율하는 중이야! 복습 사이클까지 꼭꼭 채운 예쁜 캘린더를 들고올 테니, 잠시만 기다려줘! 💜
                </p>
              </div>
            </div>
          ) : activePlan ? (
            <ActivePlan
              plan={activePlan}
              onUpdatePlan={handleUpdateActivePlan}
              onReset={() => {
                setActivePlanId(null);
                setError(null);
              }}
            />
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50/70 via-violet-50/30 to-white p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-2xl border border-indigo-200 text-indigo-500 shrink-0 shadow-2xs">
                  <Compass className="w-5 h-5 animate-spin-slow text-indigo-500" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800 text-base">아직 생성된 공부 플랜이 없단다! ✨</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                    벌써부터 기특하게 시험을 미리 대비해보려는 거야? 멋진 동생을 위해 실질적이고 예쁜 계획을 만들어줄게! <br />
                    준비하는 <b>시험 이름</b>, <b>시험 날짜</b>, <b>공부할 과목들</b>을 골라주고 아래에서 단추를 꾹 눌러줘! 💜
                  </p>
                </div>
              </div>

              <PlanForm onSubmit={handleGeneratePlan} isLoading={isLoading} />
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-indigo-50 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-semibold">
          <p>© 2026 언니의 AI Study Planner. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-indigo-600/80">공부 통계 & 캘린더 동기화 내장 🌟</span>
            <span>중학교 전용 합격 맞춤 학습 로드맵 🏫</span>
          </div>
        </div>
      </footer>

      {/* 4. Custom Delete Confirmation Modal */}
      {planToDeleteId && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-3xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-indigo-100 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 text-indigo-600">
              🗑️ 공부 계획표 삭제 확인
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              이 시험 공부 계획을 완전히 삭제할까? 지워진 스케줄표와 완수 도장은 복원할 수 없어!
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setPlanToDeleteId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  const filtered = plans.filter((p) => p.id !== planToDeleteId);
                  savePlansToStorage(filtered);
                  if (activePlanId === planToDeleteId) {
                    setActivePlanId(filtered.length > 0 ? filtered[0].id : null);
                  }
                  setPlanToDeleteId(null);
                }}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs shadow-indigo-100"
              >
                삭제할래요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

