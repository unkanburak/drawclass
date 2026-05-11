"use client";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { TeacherGate } from "@/components/TeacherGate";

export default function TeacherPage() {
  return (
    <TeacherGate>
      <TeacherDashboard />
    </TeacherGate>
  );
}
