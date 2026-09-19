import React, { useState, useRef, useEffect } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { ColorBadge, LegendBar } from '../ColorBadge';
import {
  Calendar as CalendarIcon,
  Plus,
  Edit2,
  Trash2,
  Check,
  Filter,
  ArrowRight,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Download,
  RotateCcw,
  FileText,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { EventType } from '../../types';
import {
  parseUploadedCalendarFile,
  exportCalendarEventsToCSV,
} from '../../utils/calendarParser';

export const CalendarReviewScreen: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    deleteCalendarEvent,
    appendCalendarEvents,
    clearCalendarEvents,
    updateSemesterInfo,
    openModal,
    setActiveScreen,
  } = useSemester();

  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [viewAllMonths, setViewAllMonths] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedFilesHistory, setImportedFilesHistory] = useState<
    Array<{ name: string; count: number; time: string }>
  >([]);

  // Inline quick-add state
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineDate, setInlineDate] = useState('');
  const [inlineType, setInlineType] = useState<EventType>('holiday');
  const [inlineIsAllDay, setInlineIsAllDay] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevEventsLength = useRef(calendarEvents.length);
  const year = 2026;

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Category label helper
  const getCategoryLabel = (type?: string): string => {
    const t = type || filterType;
    switch (t) {
      case 'exam':
        return 'Exam';
      case 'holiday':
        return 'Holiday';
      case 'deadline':
        return 'Deadline';
      case 'event':
        return 'Event';
      case 'college_day':
        return 'Instructional Day';
      default:
        return 'Entry';
    }
  };

  // Robust timezone-safe date parsing
  const getEventMonth = (dateStr: string): number => {
    if (!dateStr) return 0;
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      if (parts[0].length === 4) {
        return parseInt(parts[1], 10) - 1; // YYYY-MM-DD
      } else if (parts[2] && parts[2].length === 4) {
        return parseInt(parts[1], 10) - 1; // DD-MM-YYYY
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : d.getMonth();
  };

  const getEventYear = (dateStr: string): number => {
    if (!dateStr) return 2026;
    const parts = dateStr.split('-');
    if (parts.length >= 1) {
      if (parts[0].length === 4) {
        return parseInt(parts[0], 10);
      } else if (parts[2] && parts[2].length === 4) {
        return parseInt(parts[2], 10);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 2026 : d.getFullYear();
  };

  const defaultDateForMonth = `${year}-${String(selectedMonth + 1).padStart(2, '0')}-01`;

  // Keep inline quick-add form prefilled with current month
  useEffect(() => {
    setInlineDate(defaultDateForMonth);
  }, [defaultDateForMonth]);

  // Sync inline event type when filter changes
  useEffect(() => {
    if (filterType !== 'all') {
      const mapped = filterType as EventType;
      setInlineType(mapped);
      setInlineIsAllDay(mapped === 'holiday');
    }
  }, [filterType]);

  // Auto-switch month and filter when a new event is added
  useEffect(() => {
    if (calendarEvents.length > prevEventsLength.current) {
      const latest = calendarEvents[calendarEvents.length - 1];
      if (latest && latest.date) {
        const evMonth = getEventMonth(latest.date);
        if (!viewAllMonths && selectedMonth !== evMonth) {
          setSelectedMonth(evMonth);
        }
        if (filterType !== 'all' && filterType !== latest.type) {
          setFilterType('all');
        }
        setStatusMessage(
          `Added ${getCategoryLabel(latest.type)}: "${latest.title}" on ${latest.date}. You can keep adding more entries below!`
        );
      }
    }
    prevEventsLength.current = calendarEvents.length;
  }, [calendarEvents.length]);

  const filteredEvents = calendarEvents
    .filter((ev) => {
      if (filterType !== 'all' && ev.type !== filterType) return false;
      if (viewAllMonths) return true;
      return getEventMonth(ev.date) === selectedMonth;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Category counts
  const countHolidays = calendarEvents.filter((e) => e.type === 'holiday').length;
  const countExams = calendarEvents.filter((e) => e.type === 'exam').length;
  const countDeadlines = calendarEvents.filter((e) => e.type === 'deadline').length;
  const countEvents = calendarEvents.filter((e) => e.type === 'event').length;
  const countCollegeDays = calendarEvents.filter((e) => e.type === 'college_day').length;

  const handleOpenAddModal = (overrideType?: EventType) => {
    const targetType: EventType =
      overrideType ||
      (filterType === 'all'
        ? 'event'
        : (filterType as EventType));

    openModal(targetType, 'create', {
      date: defaultDateForMonth,
      type: targetType,
      isAllDay: targetType === 'holiday',
    });
  };

  const handleInlineAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;

    const eventTitle = inlineTitle.trim();
    const eventType = inlineType;
    const eventDate = inlineDate || defaultDateForMonth;

    addCalendarEvent({
      title: eventTitle,
      date: eventDate,
      type: eventType,
      startTime: inlineIsAllDay ? undefined : '10:00',
      endTime: inlineIsAllDay ? undefined : '12:00',
    });

    setInlineTitle('');
    const targetMonth = getEventMonth(eventDate);
    if (!viewAllMonths && selectedMonth !== targetMonth) {
      setSelectedMonth(targetMonth);
    }
    if (filterType !== 'all' && filterType !== eventType) {
      setFilterType('all');
    }

    setStatusMessage(
      `Added ${getCategoryLabel(eventType)}: "${eventTitle}" on ${eventDate}. Ready for your next entry!`
    );
  };

  // Iteratively process single or multiple uploaded files and append events
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    const allNewEvents = [];
    const fileSummaries: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const result = await parseUploadedCalendarFile(file);
        if (result.events && result.events.length > 0) {
          allNewEvents.push(...result.events);
          fileSummaries.push(`${file.name} (+${result.events.length})`);
          setImportedFilesHistory((prev) => {
            const existsIdx = prev.findIndex((p) => p.name === file.name);
            const entry = {
              name: file.name,
              count: result.events.length,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            if (existsIdx >= 0) {
              const copy = [...prev];
              copy[existsIdx] = entry;
              return copy;
            }
            return [...prev, entry];
          });
        } else {
          fileSummaries.push(`${file.name} (0 dates detected)`);
        }
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message || 'Parse error'}`);
      }
    }

    if (allNewEvents.length > 0) {
      // Append instead of overwrite: merges seamlessly
      appendCalendarEvents(allNewEvents);
      updateSemesterInfo({ calendarFileName: files.map((f) => f.name).join(', ') });
      setStatusMessage(
        `Auto-committed ${allNewEvents.length} events from ${files.length} file(s): ${fileSummaries.join(', ')}. Instantly live across Calendar, Exams & Deadlines!`
      );
      // If current month has no events, auto-switch to the first imported event's month
      const currentMonthHasEvents = calendarEvents.some(
        (ev) => getEventMonth(ev.date) === selectedMonth
      );
      if (!currentMonthHasEvents) {
        const firstMonth = getEventMonth(allNewEvents[0].date);
        setSelectedMonth(firstMonth);
      }
    } else if (errors.length > 0) {
      setStatusMessage(`Error parsing file(s): ${errors.join('; ')}`);
    } else {
      updateSemesterInfo({ calendarFileName: files.map((f) => f.name).join(', ') });
      setStatusMessage(`Uploaded ${files.map((f) => f.name).join(', ')}. You can add specific calendar items below.`);
    }

    setIsProcessing(false);
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    if (e.target) e.target.value = '';
  };

  const handleExportCSV = () => {
    if (calendarEvents.length === 0) {
      setStatusMessage('Calendar is currently empty. Add events first before exporting.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    const csv = exportCalendarEventsToCSV(calendarEvents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Semester_Academic_Calendar_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = () => {
    clearCalendarEvents();
    setIsConfirmingClear(false);
    setStatusMessage('Calendar cleared. You now have a clean slate.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div id="screen-calendar-review" className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Hidden File Input supporting multiple files */}
      <input
        ref={fileInputRef}
        type="file"
        id="calendar-file-upload-input"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.tsv,.json,.txt"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <span>Step 2 of 2</span>
            <span>•</span>
            <span>Document Review</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Calendar Review & Import
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Build and refine your semester calendar. Add, edit, or remove deadlines, exams, fests, and holidays with full manual control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="review-upload-file-btn"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
            title="Upload college academic calendar document (CSV, JSON, PDF)"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Upload File</span>
          </button>

          <button
            id="review-add-event-btn"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add {getCategoryLabel()}</span>
          </button>

          <button
            id="review-save-calendar-btn"
            onClick={() => setActiveScreen('calendar')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Open Main Calendar</span>
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg animate-fadeIn">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="flex-1">{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-indigo-500 hover:text-indigo-800 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Persistent "Add Event" & File Upload Dropzone (Permanently visible at all times) */}
      <div
        id="calendar-persistent-upload-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
          }
        }}
        className={`relative p-5 rounded-xl border-2 transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/80 ring-4 ring-indigo-100 shadow-md'
            : 'border-dashed border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Dropzone trigger area */}
          <div
            className="flex items-start gap-3 cursor-pointer flex-1 select-none"
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className={`p-3 rounded-lg shrink-0 transition-colors ${
                isDragging ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  {isDragging ? 'Drop calendar files here to merge!' : 'Iterative File Upload & Dropzone'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Appends Without Overwriting
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Drag & drop files here, or{' '}
                <span className="text-indigo-600 font-semibold underline underline-offset-2">browse files</span> to upload multiple documents iteratively (e.g. holiday list first, then exam timetable next).
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 flex-wrap">
                <span>PDF, CSV, TSV, JSON, TXT</span>
                <span>•</span>
                <span>Auto-classifies Holidays (Green), Exams (Red), and Deadlines (Purple)</span>
              </div>
            </div>
          </div>

          {/* Persistent Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <button
              type="button"
              id="persistent-add-event-btn"
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add {getCategoryLabel()}</span>
            </button>

            <button
              type="button"
              id="persistent-browse-files-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>{isProcessing ? 'Merging...' : 'Browse File(s)'}</span>
            </button>
          </div>
        </div>

        {/* Consecutively Imported Source Files History */}
        {importedFilesHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1 text-[11px]">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Imported Source Files ({importedFilesHistory.length}):
            </span>
            {importedFilesHistory.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px]"
                title={`Imported at ${item.time}`}
              >
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="font-medium truncate max-w-[170px]">{item.name}</span>
                <span className="text-slate-400">({item.count} items)</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Month Switcher & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Month Navigation & All-Months Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <button
              id="review-prev-month"
              onClick={() => {
                setViewAllMonths(false);
                setSelectedMonth((prev) => Math.max(0, prev - 1));
              }}
              disabled={selectedMonth <= 0 || viewAllMonths}
              className="p-1 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-opacity"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-semibold text-slate-800 w-36 text-center select-none">
              {viewAllMonths ? 'All Months' : `${monthNames[selectedMonth]} ${year}`}
            </span>

            <button
              id="review-next-month"
              onClick={() => {
                setViewAllMonths(false);
                setSelectedMonth((prev) => Math.min(11, prev + 1));
              }}
              disabled={selectedMonth >= 11 || viewAllMonths}
              className="p-1 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-opacity"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="toggle-all-months-btn"
            onClick={() => setViewAllMonths((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              viewAllMonths
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewAllMonths ? 'Month-by-Month View' : 'Show All Months'}</span>
          </button>
        </div>

        {/* Quick Toolbar (Clear All / Export) */}
        <div className="flex items-center gap-2 flex-wrap">
          {calendarEvents.length > 0 && (
            <>
              <button
                id="export-calendar-csv-btn"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                title="Download academic calendar as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {isConfirmingClear ? (
                <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                  <span className="text-xs font-semibold text-rose-700">Clear all events?</span>
                  <button
                    id="confirm-clear-all-btn"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded transition-colors"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 px-1.5 py-0.5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id="clear-calendar-events-btn"
                  onClick={() => setIsConfirmingClear(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Clear all events to start with an empty slate"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <LegendBar />

      {/* Quick Summary Pill Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Exams Scheduled</div>
          <div className="text-xl font-bold text-rose-600 mt-0.5">{countExams}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">College Holidays</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{countHolidays}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Project Deadlines</div>
          <div className="text-xl font-bold text-purple-600 mt-0.5">{countDeadlines}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Events & Fests</div>
          <div className="text-xl font-bold text-indigo-600 mt-0.5">{countEvents}</div>
        </div>
      </div>

      {/* Category Filter Chips & Event Counts */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Entries', count: calendarEvents.length },
            { id: 'exam', label: 'Exams', count: countExams },
            { id: 'holiday', label: 'Holidays', count: countHolidays },
            { id: 'deadline', label: 'Deadlines', count: countDeadlines },
            { id: 'event', label: 'Events', count: countEvents },
            { id: 'college_day', label: 'Instructional Days', count: countCollegeDays },
          ].map((btn) => (
            <button
              key={btn.id}
              id={`filter-btn-${btn.id}`}
              onClick={() => setFilterType(btn.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors inline-flex items-center gap-1.5 ${
                filterType === btn.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{btn.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterType === btn.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Add shortcut matching current filter */}
        <button
          type="button"
          id="filter-bar-quick-add-btn"
          onClick={() => handleOpenAddModal()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Extra {getCategoryLabel()}</span>
        </button>
      </div>

      {/* Extracted Entries List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {viewAllMonths ? 'All Calendar Entries (Full Semester)' : `Entries for ${monthNames[selectedMonth]} ${year}`}
            </h2>
            <span className="text-xs text-slate-500">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'entry' : 'entries'} shown in current view
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="entries-card-add-btn"
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add {getCategoryLabel()}</span>
            </button>
          </div>
        </div>

        {/* Inline Quick Add Form - permanently available to swiftly add multiple events */}
        <form
          onSubmit={handleInlineAdd}
          id="calendar-inline-quick-add-form"
          className="p-3.5 bg-indigo-50/40 border-b border-indigo-100 flex flex-col md:flex-row items-stretch md:items-center gap-2.5"
        >
          <div className="flex-1 min-w-[200px]">
            <input
              id="inline-add-title-input"
              type="text"
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              placeholder={`Quick add ${getCategoryLabel()} (e.g. ${
                filterType === 'holiday'
                  ? 'Diwali Holiday'
                  : filterType === 'exam'
                  ? 'Midterm 2 Exam'
                  : filterType === 'deadline'
                  ? 'Research Paper Submission'
                  : 'Cultural Fest'
              })...`}
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <input
              id="inline-add-date-input"
              type="date"
              value={inlineDate}
              onChange={(e) => setInlineDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Event Date"
            />

            <select
              id="inline-add-type-select"
              value={inlineType}
              onChange={(e) => {
                const newT = e.target.value as EventType;
                setInlineType(newT);
                if (newT === 'holiday') setInlineIsAllDay(true);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="holiday">Holiday (Green)</option>
              <option value="exam">Exam (Red)</option>
              <option value="deadline">Deadline (Purple)</option>
              <option value="event">Event (Purple)</option>
              <option value="college_day">Instructional Day (Orange)</option>
            </select>

            <button
              type="submit"
              id="inline-add-submit-btn"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {filteredEvents.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                No entries match this filter for {viewAllMonths ? 'the semester' : `${monthNames[selectedMonth]} ${year}`}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {calendarEvents.length === 0
                  ? 'Your calendar is currently clean and empty. You have full manual control to add your real college exams, deadlines, holidays, and fests.'
                  : 'Add an extra event using the quick bar above, or click below to add an entry.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                id="empty-state-add-btn"
                onClick={() => handleOpenAddModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add {getCategoryLabel()}</span>
              </button>

              <button
                id="empty-state-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Upload Calendar File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((ev) => {
              const dateParts = ev.date.split('-').map(Number);
              const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
              const isDeletingThis = deletingId === ev.id;

              return (
                <div
                  key={ev.id}
                  id={`review-item-${ev.id}`}
                  onClick={() => openModal('event', 'edit', ev)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                  title="Click to edit or change category tag"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="shrink-0 w-20 text-center py-1.5 px-2 bg-slate-100/80 rounded-md border border-slate-200/60 group-hover:border-indigo-200 transition-colors">
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-lg font-bold text-slate-900 leading-tight">
                        {dateObj.getDate()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {ev.title}
                        </h3>
                        <ColorBadge type={ev.type} size="sm" />
                      </div>

                      {ev.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {ev.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                        {ev.startTime ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {ev.startTime} {ev.endTime ? `– ${ev.endTime}` : ''}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">All Day</span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete (With Safe Non-Modal Confirmation) */}
                  <div
                    className="flex items-center gap-2 self-end sm:self-center shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isDeletingThis ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md">
                        <span className="text-[11px] font-semibold text-rose-700">Delete?</span>
                        <button
                          id={`confirm-delete-${ev.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCalendarEvent(ev.id);
                            setDeletingId(null);
                          }}
                          className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="text-[11px] text-slate-600 hover:text-slate-900 px-1.5 py-0.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          id={`edit-review-item-${ev.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('event', 'edit', ev);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-md transition-colors"
                          aria-label="Edit event"
                          title="Edit event details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-review-item-${ev.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(ev.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          aria-label="Delete event"
                          title="Delete this event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setActiveScreen('setup')}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          Back to Setup
        </button>

        <button
          id="review-finish-save-btn"
          onClick={() => setActiveScreen('calendar')}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
        >
          <span>Save & View Semester Calendar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
