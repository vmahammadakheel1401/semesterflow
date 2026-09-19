import React, { useState } from 'react';
import { useSemester } from '../../context/SemesterContext';
import {
  parseUploadedTimetableFile,
  TimetableParseResult,
} from '../../utils/timetableParser';
import { parseUploadedCalendarFile } from '../../utils/calendarParser';
import {
  Calendar,
  Building,
  UploadCloud,
  FileText,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Check,
} from 'lucide-react';

export const SemesterSetupScreen: React.FC = () => {
  const {
    semesterInfo,
    updateSemesterInfo,
    setActiveScreen,
    replaceClasses,
    appendCalendarEvents,
    clearCalendarEvents,
  } = useSemester();

  const [name, setName] = useState(semesterInfo.name || 'Semester 3 (Fall 2026)');
  const [college, setCollege] = useState(semesterInfo.college || 'National Institute of Technology');
  const [branch, setBranch] = useState(semesterInfo.branch || 'Computer Science and Engineering');
  const [startDate, setStartDate] = useState(semesterInfo.startDate || '2026-08-17');
  const [endDate, setEndDate] = useState(semesterInfo.endDate || '2026-12-18');
  const [calendarFile, setCalendarFile] = useState<string | null>(
    semesterInfo.calendarFileName || null
  );
  const [timetableFile, setTimetableFile] = useState<string | null>(
    semesterInfo.timetableFileName || 'CSE_Sem3_BatchA_Timetable.pdf'
  );
  const [parseResult, setParseResult] = useState<TimetableParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [calendarParseSummary, setCalendarParseSummary] = useState<{
    total: number;
    exams: number;
    holidays: number;
    deadlines: number;
    events: number;
  } | null>(null);
  const [isCalendarParsing, setIsCalendarParsing] = useState(false);

  const handleCalendarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setIsCalendarParsing(true);
      setError(null);
      setCalendarFile(files.map((f) => f.name).join(', '));
      try {
        const allEvents = [];
        let examCount = 0;
        let holidayCount = 0;
        let deadlineCount = 0;
        let eventCount = 0;

        for (const file of files) {
          const result = await parseUploadedCalendarFile(file);
          if (result.events && result.events.length > 0) {
            allEvents.push(...result.events);
            examCount += result.summary?.exams || result.events.filter((ev) => ev.type === 'exam').length;
            holidayCount += result.summary?.holidays || result.events.filter((ev) => ev.type === 'holiday').length;
            deadlineCount += result.summary?.deadlines || result.events.filter((ev) => ev.type === 'deadline').length;
            eventCount += result.summary?.events || result.events.filter((ev) => ev.type === 'event' || ev.type === 'college_day').length;
          }
        }

        if (allEvents.length > 0) {
          // Instant Auto-Commit: Immediately inject into main calendar & exams state
          appendCalendarEvents(allEvents);
          updateSemesterInfo({ calendarFileName: files.map((f) => f.name).join(', ') });
          setCalendarParseSummary({
            total: allEvents.length,
            exams: examCount,
            holidays: holidayCount,
            deadlines: deadlineCount,
            events: eventCount,
          });
        } else {
          updateSemesterInfo({ calendarFileName: files.map((f) => f.name).join(', ') });
          setCalendarParseSummary(null);
        }
      } catch (err: any) {
        console.error('Failed to parse uploaded calendar file', err);
        setError(`Failed to read calendar document: ${err.message || 'Unknown error'}`);
      } finally {
        setIsCalendarParsing(false);
        if (e.target) e.target.value = '';
      }
    }
  };

  const handleRemoveCalendar = () => {
    setCalendarFile(null);
    setCalendarParseSummary(null);
    clearCalendarEvents();
    updateSemesterInfo({ calendarFileName: undefined });
  };

  const handleTimetableUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsParsing(true);
      setError(null);
      try {
        const result = await parseUploadedTimetableFile(file, branch);
        if (result.success && result.classes.length > 0) {
          setTimetableFile(file.name);
          setParseResult(result);
          replaceClasses(result.classes);
          updateSemesterInfo({ timetableFileName: file.name });
        } else {
          const warningMsg =
            result.warnings?.[0] ||
            `Could not extract structured classes from "${file.name}". Please ensure the file is a valid CSV (with Day, Start Time, End Time, Subject columns), JSON, or text schedule.`;
          setError(warningMsg);
          setTimetableFile(null);
          setParseResult(null);
          replaceClasses([]);
          updateSemesterInfo({ timetableFileName: undefined });
        }
      } catch (err: any) {
        setError(`Failed to read "${file.name}". Please check the file and try again.`);
        setTimetableFile(null);
        setParseResult(null);
        replaceClasses([]);
        updateSemesterInfo({ timetableFileName: undefined });
      } finally {
        setIsParsing(false);
        if (e.target) e.target.value = '';
      }
    }
  };

  const handleRemoveTimetable = () => {
    setTimetableFile(null);
    setParseResult(null);
    replaceClasses([]);
    updateSemesterInfo({ timetableFileName: undefined });
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = 'Day,Start Time,End Time,Subject,Code,Room,Faculty,Type\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Semester_Timetable_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !college.trim()) {
      setError('Please provide semester name and college/university.');
      return;
    }

    if (parseResult && parseResult.classes.length > 0) {
      replaceClasses(parseResult.classes);
    }

    updateSemesterInfo({
      name,
      college,
      branch,
      startDate,
      endDate,
      calendarFileName: calendarFile || undefined,
      timetableFileName: timetableFile || undefined,
      isSetupComplete: true,
    });

    // Direct access to calendar with all uploaded entries live
    setActiveScreen('calendar');
  };

  return (
    <div id="screen-semester-setup" className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          <span>Step 1 of 2</span>
          <span>•</span>
          <span>Semester Configuration</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Semester Setup
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tell us about your upcoming semester and upload your official college documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic Information Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
            College & Semester Details
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Semester Name
            </label>
            <input
              id="setup-semester-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Semester 3 (Fall 2026) or B.Tech CSE Year 2"
              className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                College / University
              </label>
              <div className="relative">
                <input
                  id="setup-college-name"
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Branch / Specialization
              </label>
              <input
                id="setup-branch-name"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science and Engineering"
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Semester Start Date
              </label>
              <div className="relative">
                <input
                  id="setup-start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Semester End Date
              </label>
              <div className="relative">
                <input
                  id="setup-end-date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Uploads Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Upload Official Documents
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your college academic calendar and class timetable PDF or image.
            </p>
          </div>

          {/* College Semester Calendar Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              College Semester Academic Calendar
            </label>
            {calendarFile ? (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {calendarFile}
                      </p>
                      <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {isCalendarParsing
                          ? 'Auto-committing entries...'
                          : 'Auto-committed & active in Calendar, Exams & Deadlines'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="remove-calendar-file-btn"
                    onClick={handleRemoveCalendar}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    aria-label="Remove calendar file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {calendarParseSummary && (
                  <div className="pt-2 border-t border-indigo-200/60 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white/80 py-1.5 px-1.5 rounded border border-indigo-100">
                      <span className="text-slate-500 text-[10px] block">Dates Saved</span>
                      <span className="font-bold text-slate-900">{calendarParseSummary.total}</span>
                    </div>
                    <div className="bg-white/80 py-1.5 px-1.5 rounded border border-indigo-100">
                      <span className="text-slate-500 text-[10px] block">Exams</span>
                      <span className="font-bold text-rose-600">{calendarParseSummary.exams}</span>
                    </div>
                    <div className="bg-white/80 py-1.5 px-1.5 rounded border border-indigo-100">
                      <span className="text-slate-500 text-[10px] block">Holidays</span>
                      <span className="font-bold text-emerald-600">{calendarParseSummary.holidays}</span>
                    </div>
                    <div className="bg-white/80 py-1.5 px-1.5 rounded border border-indigo-100">
                      <span className="text-slate-500 text-[10px] block">Deadlines</span>
                      <span className="font-bold text-amber-600">{calendarParseSummary.deadlines}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-colors">
                <UploadCloud className="w-7 h-7 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-700">
                  Click or drag and drop college calendar (PDF, CSV, JSON, TXT)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Automatically parses and instantly syncs exams, holidays, and deadlines
                </span>
                <input
                  id="upload-calendar-input"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.csv,.tsv,.json,.txt"
                  className="hidden"
                  onChange={handleCalendarUpload}
                />
              </label>
            )}
          </div>

          {/* College Timetable Upload & Parsing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-700">
                College Class Timetable
              </label>
              <button
                type="button"
                id="download-timetable-template-btn"
                onClick={handleDownloadSampleCSV}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Download Blank CSV Template</span>
              </button>
            </div>

            {timetableFile ? (
              <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Clock className="w-5 h-5 text-orange-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {timetableFile}
                      </p>
                      <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {isParsing ? 'Parsing classes...' : 'Class timetable parsed & active'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="remove-timetable-file-btn"
                    onClick={handleRemoveTimetable}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    aria-label="Remove timetable file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {parseResult && (
                  <div className="pt-2 border-t border-orange-200/60 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/80 py-1.5 px-2 rounded border border-orange-100">
                      <span className="text-slate-500 text-[10px] block">Total Classes</span>
                      <span className="font-bold text-slate-900">{parseResult.summary.totalClasses}</span>
                    </div>
                    <div className="bg-white/80 py-1.5 px-2 rounded border border-orange-100">
                      <span className="text-slate-500 text-[10px] block">Lectures / Labs</span>
                      <span className="font-bold text-orange-600">{parseResult.summary.lectures} / {parseResult.summary.labs}</span>
                    </div>
                    <div className="bg-white/80 py-1.5 px-2 rounded border border-orange-100">
                      <span className="text-slate-500 text-[10px] block">Days Covered</span>
                      <span className="font-bold text-indigo-600">{parseResult.summary.daysCovered.length} Days</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-orange-50/20 transition-colors">
                <UploadCloud className="w-7 h-7 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-700">
                  Click or drag and drop weekly timetable (CSV, JSON, PDF, Image)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Directly parses class times, room numbers, faculty, and lab blocks
                </span>
                <input
                  id="upload-timetable-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.json,.csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleTimetableUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* Form Submit Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveScreen('welcome')}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="setup-review-button"
              onClick={() => {
                if (parseResult && parseResult.classes.length > 0) replaceClasses(parseResult.classes);
                updateSemesterInfo({
                  name,
                  college,
                  branch,
                  startDate,
                  endDate,
                  calendarFileName: calendarFile || undefined,
                  timetableFileName: timetableFile || undefined,
                  isSetupComplete: true,
                });
                setActiveScreen('calendar-review');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Review / Edit Dates
            </button>

            <button
              type="submit"
              id="setup-continue-button"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <span>Save & View Live Calendar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
