'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  StepBack,
  Github,
  Info,
  Code2,
  Zap,
  Lightbulb,
  Merge,
  Layers
} from 'lucide-react';

// --- Types ---
type SortState = 'divide' | 'compare' | 'merge' | 'sorted' | 'init' | 'complete';

interface SortingStep {
  array: number[];
  indices: number[]; // Working indices
  activeRange?: [number, number];
  type: SortState;
  description: string;
  codeLine?: number;
}

// --- Constants ---
const ARRAY_SIZE = 12;
const INITIAL_SPEED = 750;

const CODE_PYTHON = [
  "def merge_sort(arr):",
  "    if len(arr) > 1:",
  "        mid = len(arr) // 2",
  "        L = arr[:mid]",
  "        R = arr[mid:]",
  "        merge_sort(L)",
  "        merge_sort(R)",
  "        # Merge process ...",
  "        # (Logic for merging L and R back into arr)"
];

// Actual merge sort code usually shown in classrooms:
const FULL_CODE_PYTHON = [
  "def merge_sort(arr):",
  "    if len(arr) <= 1:",
  "        return arr",
  "    mid = len(arr) // 2",
  "    left = merge_sort(arr[:mid])",
  "    right = merge_sort(arr[mid:])",
  "    return merge(left, right)",
  "",
  "def merge(left, right):",
  "    result = []",
  "    while left and right:",
  "        if left[0] <= right[0]:",
  "            result.append(left.pop(0))",
  "        else:",
  "            result.append(right.pop(0))",
  "    return result + left + right"
];

// --- Algorithm Logic ---
const generateSteps = (initialArray: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const arr = [...initialArray];

  const pushStep = (type: SortState, desc: string, line: number, indices: number[], range?: [number, number]) => {
    steps.push({
      array: [...arr],
      indices,
      activeRange: range,
      type,
      description: desc,
      codeLine: line
    });
  };

  const merge = async (low: number, mid: number, high: number) => {
    const left = arr.slice(low, mid + 1);
    const right = arr.slice(mid + 1, high + 1);

    let i = 0, j = 0, k = low;

    pushStep('merge', `範囲 [${low} - ${high}] をマージ（合体）します。`, 8, [], [low, high]);

    while (i < left.length && j < right.length) {
      pushStep('compare', `左グループの ${left[i]} と右グループの ${right[j]} を比較します。`, 11, [low + i, mid + 1 + j], [low, high]);

      if (left[i] <= right[j]) {
        arr[k] = left[i];
        pushStep('merge', `小さい方の ${left[i]} を配列に戻します。`, 13, [k], [low, high]);
        i++;
      } else {
        arr[k] = right[j];
        pushStep('merge', `小さい方の ${right[j]} を配列に戻します。`, 15, [k], [low, high]);
        j++;
      }
      k++;
    }

    while (i < left.length) {
      arr[k] = left[i];
      pushStep('merge', `残った左グループの要素 ${left[i]} を追加します。`, 16, [k], [low, high]);
      i++;
      k++;
    }

    while (j < right.length) {
      arr[k] = right[j];
      pushStep('merge', `残った右グループの要素 ${right[j]} を追加します。`, 16, [k], [low, high]);
      j++;
      k++;
    }

    pushStep('sorted', `範囲 [${low} - ${high}] のマージが完了しました。`, 6, [], [low, high]);
  };

  const sort = async (low: number, high: number) => {
    if (low < high) {
      const mid = Math.floor((low + high) / 2);

      pushStep('divide', `範囲 [${low} - ${high}] を半分（${mid}）で分割します。`, 4, [], [low, high]);

      await sort(low, mid);
      await sort(mid + 1, high);
      await merge(low, mid, high);
    }
  };

  steps.push({
    array: [...arr],
    indices: [],
    type: 'init',
    description: 'マージソートを開始します。配列をバラバラに分解してから、整列しながら合体させていきます。',
    codeLine: 0
  });

  // Since it's pseudo-async (we are just collecting steps), simple recursion works.
  const runSort = (low: number, high: number) => {
    if (low < high) {
      const mid = Math.floor((low + high) / 2);
      pushStep('divide', `現在の範囲 [${low} - ${high}] を半分に分割します。`, 4, [], [low, high]);
      runSort(low, mid);
      runSort(mid + 1, high);

      // Merge logic
      const left = arr.slice(low, mid + 1);
      const right = arr.slice(mid + 1, high + 1);
      let i = 0, j = 0, k = low;

      pushStep('merge', `${low}番目から${high}番目までを整列しながら合体させます。`, 8, [], [low, high]);

      while (i < left.length && j < right.length) {
        pushStep('compare', `${left[i]} と ${right[j]} を比較。`, 11, [low + i, mid + 1 + j], [low, high]);
        if (left[i] <= right[j]) {
          arr[k] = left[i];
          pushStep('merge', `${left[i]} を移動。`, 13, [k], [low, high]);
          i++;
        } else {
          arr[k] = right[j];
          pushStep('merge', `${right[j]} を移動。`, 15, [k], [low, high]);
          j++;
        }
        k++;
      }
      while (i < left.length) {
        arr[k] = left[i];
        pushStep('merge', `残りの ${left[i]} を移動。`, 16, [k], [low, high]);
        i++; k++;
      }
      while (j < right.length) {
        arr[k] = right[j];
        pushStep('merge', `残りの ${right[j]} を移動。`, 16, [k], [low, high]);
        j++; k++;
      }
      pushStep('sorted', `一部の整列が完了しました。`, 6, [], [low, high]);
    }
  };

  runSort(0, arr.length - 1);

  steps.push({
    array: [...arr],
    indices: Array.from({ length: arr.length }, (_, k) => k),
    type: 'complete',
    description: 'すべての要素がマージされ、整列が完了しました！',
    codeLine: 0
  });

  return steps;
};


// --- Main App ---
export default function MergeSortStudio() {
  const [array, setArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<SortingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    const newArray = Array.from({ length: ARRAY_SIZE }, () => Math.floor(Math.random() * 80) + 15);
    const newSteps = generateSteps(newArray);
    setArray(newArray);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  const stepForward = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)), [steps.length]);
  const stepBackward = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1001 - speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentStep, steps.length, speed]);

  const step = steps[currentStep] || { array: [], indices: [], type: 'init', description: '' };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-violet-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Layers className="text-slate-950 w-5 h-5" />
            </div>
            <h1 className="font-black italic tracking-tighter text-xl uppercase tracking-widest text-violet-400">Merge_Sort_Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] mono uppercase text-slate-500 font-black tracking-widest">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-violet-400 animate-pulse' : 'bg-slate-700'}`} />
                {isPlaying ? 'Processing' : 'Standby'}
              </div>
              <span>Step: {currentStep} / {steps.length - 1}</span>
            </div>
            <a href="https://github.com/iidaatcnt/sorting-studio-merge" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          <div className="relative aspect-video lg:aspect-square max-h-[500px] bg-[#030712] rounded-[3rem] border border-white/5 p-16 flex items-end justify-center gap-3 overflow-hidden shadow-2xl">
            <div className="absolute top-8 left-12 flex items-center gap-3 mono text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">
              <Merge size={14} className="text-violet-500" />
              Recursive Branching & Merging
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {step.array.map((val, idx) => {
                const isSelected = step.indices.includes(idx);
                const inRange = step.activeRange ? (idx >= step.activeRange[0] && idx <= step.activeRange[1]) : false;

                let colorClass = "bg-slate-800/20 opacity-20";

                if (inRange) {
                  colorClass = "bg-slate-800/60 opacity-100";
                  if (isSelected) {
                    if (step.type === 'compare') colorClass = "bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]";
                    if (step.type === 'merge') colorClass = "bg-violet-400 shadow-[0_0_25px_rgba(167,139,250,0.5)]";
                  }
                }

                if (step.type === 'complete') {
                  colorClass = "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] opacity-100";
                }

                return (
                  <motion.div
                    key={`${idx}-${val}`}
                    layout
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    style={{ height: `${val}%` }}
                    className={`flex-1 min-w-[20px] rounded-t-xl relative ${colorClass} transition-all duration-300`}
                  >
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 mono text-[10px] font-black ${isSelected || inRange ? 'text-slate-200' : 'text-slate-800'}`}>
                      {val}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Range highlight */}
            {step.activeRange && step.type !== 'complete' && (
              <div
                className="absolute bottom-6 h-1.5 bg-violet-500/10 rounded-full transition-all duration-500"
                style={{
                  left: `${(step.activeRange[0] / ARRAY_SIZE) * 100}%`,
                  width: `${((step.activeRange[1] - step.activeRange[0] + 1) / ARRAY_SIZE) * 100}%`
                }}
              >
                <div className="absolute inset-0 bg-violet-500/30 blur-sm rounded-full" />
              </div>
            )}
          </div>

          <div className="px-10 py-8 bg-slate-900/50 rounded-[2.5rem] border border-white/10 flex flex-col gap-8 shadow-inner">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex items-center gap-2">
                <button onClick={stepBackward} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400"><StepBack size={20} /></button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-violet-600 text-white rounded-[2rem] flex items-center justify-center hover:bg-violet-400 transition-all active:scale-95 shadow-xl shadow-violet-500/20"
                >
                  {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
                </button>
                <button onClick={stepForward} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400"><StepForward size={20} /></button>
                <button onClick={reset} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400 ml-4"><RotateCcw size={20} /></button>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mono text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">
                  <span>Latency Tuning</span>
                  <span className="text-violet-400">{Math.round((speed / 980) * 100)} unit</span>
                </div>
                <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full appearance-none bg-slate-800 h-1.5 rounded-full accent-violet-500 cursor-pointer" />
              </div>
            </div>

            <div className="p-6 bg-violet-500/5 rounded-2xl border border-violet-500/10 flex gap-4">
              <div className="mt-1 p-2 bg-violet-500/10 rounded-xl shrink-0">
                <Info size={16} className="text-violet-400" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Code & Theory */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="p-10 bg-zinc-900/80 border border-white/5 rounded-[3rem] shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Lightbulb className="text-amber-400 w-5 h-5" />
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Theory_Brief</h2>
            </div>
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 mb-8">
              <h3 className="text-violet-400 font-black mb-3 text-sm">Merge Sort</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                配列を再帰的に半分に分割し、最小単位まで分解した後、それらを整列しながら合体（マージ）させていきます。常に O(n log n) の計算量を維持する安定した高速アルゴリズムです。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mono text-[9px] font-black uppercase tracking-tighter">
              <div className="p-4 bg-white/5 rounded-2xl text-center">
                <span className="text-slate-600 block mb-1">Complexity</span>
                <span className="text-violet-300">O(N log N)</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl text-center">
                <span className="text-slate-600 block mb-1">Stability</span>
                <span className="text-emerald-400 text-[10px]">Stable</span>
              </div>
            </div>
          </div>

          <div className="p-10 bg-black border border-white/5 rounded-[3rem] flex-1 flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Code2 className="text-slate-600 w-5 h-5" />
                <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Exec_Module</h2>
              </div>
              <div className="w-2 h-2 rounded-full bg-violet-500/50 shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
            </div>

            <div className="flex-1 bg-zinc-950/30 p-8 rounded-3xl mono text-[10px] leading-loose overflow-auto border border-white/5 whitespace-nowrap scrollbar-hide">
              {FULL_CODE_PYTHON.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-6 transition-all duration-300 ${step.codeLine === i ? 'text-violet-400 bg-violet-400/10 -mx-8 px-8 border-l-2 border-violet-400 font-bold' : 'text-slate-800'}`}
                >
                  <span className="text-slate-900 tabular-nums w-4 select-none opacity-50">{i + 1}</span>
                  <pre className="whitespace-pre">{line}</pre>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center opacity-20">
              <span className="text-[8px] mono text-slate-500 uppercase tracking-[0.5em]">recursive_merge_v1.0</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-16 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <Layers className="text-slate-900 w-8 h-8 opacity-20" />
          <p className="text-[8px] mono text-slate-700 uppercase tracking-[0.8em]">Interactive_Learning_Series // Informatics_I</p>
        </div>
      </footer>
    </div>
  );
}
