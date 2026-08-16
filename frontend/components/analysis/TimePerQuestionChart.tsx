"use client";

import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { AnswerItem } from "@/types";

interface TimePerQuestionChartProps {
  timePerQuestion: number[];        // seconds per question
  answers: (AnswerItem | null)[];                   // user's submitted answers
  correctAnswers: (AnswerItem | null)[];            // correct answers
}

interface TooltipPayloadItem {
  payload: {
    question: string;
    seconds: number;
    minutes: number;
    status: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

export function TimePerQuestionChart({
  timePerQuestion,
  answers,
  correctAnswers,
}: TimePerQuestionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = timePerQuestion.map((seconds, i) => {
    const userAns = answers[i];
    const correctAns = correctAnswers[i];
    const attempted = userAns !== null && userAns !== undefined && userAns.value !== null && userAns.value !== undefined;
    const correct =
      attempted &&
      correctAns !== null &&
      correctAns !== undefined &&
      String(userAns?.value).trim().toLowerCase() ===
      String(correctAns?.value).trim().toLowerCase();

    return {
      question: `Q${i + 1}`,
      seconds,
      minutes: parseFloat((seconds / 60).toFixed(2)),
      status: !attempted ? "unattempted" : correct ? "correct" : "wrong",
    };
  });

  const avgSeconds =
    timePerQuestion.length > 0
      ? timePerQuestion.reduce((a, b) => a + b, 0) / (timePerQuestion.length - timePerQuestion.filter((t) => t === 0).length) // exclude unattempted questions from average
      : 0;

  const colorMap: Record<string, string> = {
    correct: "#22C55E",
    wrong: "#EF4444",
    unattempted: "#9CA3AF",
  };

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const mins = Math.floor(d.seconds / 60);
    const secs = d.seconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return (
      <div className="bg-white border border-borderLight rounded shadow-md px-3 py-2 text-xs">
        <p className="font-semibold text-textPrimary mb-1">{d.question}</p>
        <p className="text-textSecondary">Time spent: <span className="font-medium text-textPrimary">{timeStr}</span></p>
        <p className="capitalize font-semibold mt-1" style={{ color: colorMap[d.status] }}>
          {d.status}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-borderLight rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-textPrimary">Time Per Question</h3>
        <span className="text-xs text-textSecondary bg-pageBg border border-borderLight rounded px-2 py-0.5 font-medium">
          Avg: {avgSeconds >= 60
            ? `${Math.floor(avgSeconds / 60)}m ${Math.round(avgSeconds % 60)}s`
            : `${Math.round(avgSeconds)}s`}
        </span>
      </div>
      <p className="text-xs text-textSecondary mb-5">
        Bar color: <span className="text-success font-medium">green</span> = correct,{" "}
        <span className="text-danger font-medium">red</span> = wrong,{" "}
        <span className="text-textSecondary font-medium">grey</span> = unattempted
      </p>

      <div className="w-full transition-all duration-200">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            onMouseLeave={() => setHoveredIndex(null)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="question"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              interval={data.length > 40 ? Math.floor(data.length / 20) : 0}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => v >= 60 ? `${Math.floor(v / 60)}m` : `${v}s`}
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(79,70,229,0.05)" }} />
            <ReferenceLine
              y={avgSeconds}
              stroke="#4F46E5"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: "avg",
                position: "insideTopRight",
                fontSize: 10,
                fill: "#4F46E5",
              }}
            />
            <Bar dataKey="seconds" radius={[3, 3, 0, 0]} maxBarSize={28}
              onMouseEnter={(_, index) => setHoveredIndex(index)}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colorMap[entry.status]}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.55}
                  style={{ transition: "opacity 0.15s ease" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats below chart */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-borderLight">
        {[
          {
            label: "Fastest question",
            value: (() => {
              const nonZero = timePerQuestion.filter(t => t > 0);
              if (!nonZero.length) return "—";
              const min = Math.min(...nonZero);
              const idx = timePerQuestion.indexOf(min);
              return `Q${idx + 1} (${min}s)`;
            })(),
            color: "text-success",
          },
          {
            label: "Slowest question",
            value: (() => {
              if (!timePerQuestion.length) return "—";
              const max = Math.max(...timePerQuestion);
              const idx = timePerQuestion.indexOf(max);
              const mins = Math.floor(max / 60);
              const secs = max % 60;
              return `Q${idx + 1} (${mins > 0 ? `${mins}m ${secs}s` : `${secs}s`})`;
            })(),
            color: "text-danger",
          },
          {
            label: "Questions > 3 min",
            value: `${timePerQuestion.filter(t => t > 180).length} questions`,
            color: "text-warning",
          },
        ].map(stat => (
          <div key={stat.label} className="text-center hover:scale-105 transition-transform duration-200">
            <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-textSecondary mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
