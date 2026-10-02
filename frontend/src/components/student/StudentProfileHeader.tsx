import React from 'react';
import { Award, BookOpen, Calendar, Mail, MapPin, School, Sparkles, UserCheck } from 'lucide-react';

interface StudentProfileHeaderProps {
  profile: {
    register_no: string;
    name: string;
    department: string;
    year: number;
    section: string;
    current_semester: number;
    admission_year: number;
    email: string;
  };
  overallCgpa?: number;
  overallAttendance?: number;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  profile,
  overallCgpa = 8.85,
  overallAttendance = 88.0,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-card bg-gradient-to-r from-[#5B5BD6] via-[#4F46E5] to-[#2DD4BF] transition-all duration-300">
      {/* Background Decorative Rings */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-32 -bottom-16 w-48 h-48 rounded-full bg-aqua/20 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left: Avatar & Identity Details */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-inner shrink-0">
            {profile.name.charAt(0)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-mono text-xs font-bold tracking-wider border border-white/25">
                {profile.register_no}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-aqua/30 text-white font-semibold text-xs border border-aqua/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Active Student
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              {profile.name}
            </h1>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs sm:text-sm text-white/90">
              <span className="flex items-center gap-1.5 font-semibold">
                <School className="w-4 h-4 text-aqua" />
                Department: {profile.department} (CSE)
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-white/80" />
                Year {profile.year} • Section {profile.section} (Semester {profile.current_semester})
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-white/80" />
                Batch {profile.admission_year}–{profile.admission_year + 4}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Key Performance Badges */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/20">
          <div className="text-center px-2 sm:px-4 border-r border-white/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 block">
              CGPA
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {overallCgpa.toFixed(2)}
            </span>
            <span className="text-[10px] text-aqua block font-bold">Scale 10.0</span>
          </div>

          <div className="text-center px-2 sm:px-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 block">
              Attendance
            </span>
            <span
              className={`text-xl sm:text-2xl font-black ${
                overallAttendance < 75 ? 'text-coral' : 'text-white'
              }`}
            >
              {overallAttendance.toFixed(1)}%
            </span>
            <span className="text-[10px] text-white/80 block">
              {overallAttendance < 75 ? '⚠️ Below 75%' : 'Eligible'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
