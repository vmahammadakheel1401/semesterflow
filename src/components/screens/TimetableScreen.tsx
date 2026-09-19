import React, { useState, useRef } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { CollegeClass, ClassType } from '../../types';
import {
  parseUploadedTimetableFile,
  exportClassesToCSV,
  DAY_NAMES,
} from '../../utils/timetableParser';
import {
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit2,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Layers,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const TimetableScreen: React.FC = () => {
  const { classes, addClass, updateClass, deleteClass, replaceClasses, semesterInfo, updateSemesterInfo } = useSemester();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday default
  const [editingClass, setEditingClass] = useState<CollegeClass | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Form states for add/edit
  const [subject, setSubject] = useState('');
  const [code, setCode] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('');
  const [faculty, setFaculty] = useState('');
  const [classType, setClassType] = useState<ClassType>('lecture');

  const days = [
    { num: 1, name: 'Monday', short: 'Mon' },
    { num: 2, name: 'Tuesday', short: 'Tue' },
    { num: 3, name: 'Wednesday', short: 'Wed' },
    { num: 4, name: 'Thursday', short: 'Thu' },
    { num: 5, name: 'Friday', short: 'Fri' },
    { num: 6, name: 'Saturday', short: 'Sat' },
    { num: 0, name: 'Sunday', short: 'Sun' },
  ];

  const handleOpenAddModal = (day?: number) => {
    setEditingClass(null);
    setSubject('');
    setCode('');
    setDayOfWeek(day !== undefined ? day : selectedDay);
    setStartTime('09:00');
    setEndTime('10:00');
    setRoom('');
    setFaculty('');
    setClassType('lecture');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cls: CollegeClass) => {
    setEditingClass(cls);
    setSubject(cls.subject);
    setCode(cls.code);
    setDayOfWeek(cls.dayOfWeek);
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setRoom(cls.room);
    setFaculty(cls.faculty);
    setClassType(cls.type);
    setIsAddModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    if (editingClass) {
      updateClass({
        id: editingClass.id,
        subject: subject.trim(),
        code: code.trim() || 'SUBJ',
        dayOfWeek,
        startTime,
        endTime,
        room: room.trim() || 'Room TBD',
        faculty: faculty.trim() || '',
        type: classType,
      });
      setImportNotice(`Updated class: "${subject.trim()}"`);
    } else {
      addClass({
        subject: subject.trim(),
        code: code.trim() || 'SUBJ',
        dayOfWeek,
        startTime,
        endTime,
        room: room.trim() || 'Room TBD',
        faculty: faculty.trim() || '',
        type: classType,
      });
      setImportNotice(`Added new class: "${subject.trim()}" to ${DAY_NAMES[dayOfWeek]}`);
    }
    setIsAddModalOpen(false);
    setTimeout(() => setImportNotice(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessingFile(true);
      setParseError(null);
      setImportNotice(null);
      try {
        const result = await parseUploadedTimetableFile(file, semesterInfo.branch);
        if (result.success && result.classes.length > 0) {
          // Immediately replace active schedule state
          replaceClasses(result.classes);
          updateSemesterInfo({ timetableFileName: file.name });
          setImportNotice(
            `Successfully loaded ${result.classes.length} classes from "${file.name}" (${result.summary.lectures} lectures, ${result.summary.labs} labs, ${result.summary.tutorials} tutorials across ${result.summary.daysCovered.length} days)`
          );
        } else {
          const warnMsg =
            result.warnings?.[0] ||
            `No valid class entries could be found in "${file.name}". Please upload a structured CSV, JSON, or text timetable file.`;
          setParseError(warnMsg);
        }
      } catch (err: any) {
        setParseError(`Failed to parse "${file.name}": ${err.message}`);
      } finally {
        setIsProcessingFile(false);
        if (e.target) e.target.value = ''; // Allow re-upload of same file
        setTimeout(() => setImportNotice(null), 7000);
      }
    }
  };

  const handleExportCSV = () => {
    const csv = exportClassesToCSV(classes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(semesterInfo.name || 'SemesterFlow').replace(/\s+/g, '_')}_Timetable.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setImportNotice(`Exported ${classes.length} classes as CSV spreadsheet.`);
    setTimeout(() => setImportNotice(null), 4000);
  };

  const handleDownloadTemplate = () => {
    const blankCSV = 'Day,Start Time,End Time,Subject,Code,Room,Faculty,Type\n';

    const blob = new Blob([blankCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'College_Timetable_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllClasses = () => {
    if (confirm('Are you sure you want to clear all classes from the timetable? You can upload a new file or add classes manually.')) {
      replaceClasses([]);
      updateSemesterInfo({ timetableFileName: undefined });
      setImportNotice('Timetable cleared. You can upload a new schedule or add classes manually.');
      setParseError(null);
      setTimeout(() => setImportNotice(null), 4000);
    }
  };

  // Compute gaps / available time for a given day
  const getDayScheduleWithGaps = (dayNum: number) => {
    const dayClasses = classes
      .filter((c) => c.dayOfWeek === dayNum)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const items: Array<{
      type: 'class' | 'free';
      classItem?: CollegeClass;
      startTime: string;
      endTime: string;
      durationMinutes: number;
    }> = [];

    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const toTimeStr = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    let cursor = toMins('09:00');

    dayClasses.forEach((cls) => {
      const startMins = toMins(cls.startTime);
      const endMins = toMins(cls.endTime);

      if (startMins > cursor) {
        const gap = startMins - cursor;
        if (gap >= 15) {
          items.push({
            type: 'free',
            startTime: toTimeStr(cursor),
            endTime: cls.startTime,
            durationMinutes: gap,
          });
        }
      }

      items.push({
        type: 'class',
        classItem: cls,
        startTime: cls.startTime,
        endTime: cls.endTime,
        durationMinutes: Math.max(15, endMins - startMins),
      });

      cursor = Math.max(cursor, endMins);
    });

    // If day ends before 17:00
    if (cursor < toMins('17:00') && dayClasses.length > 0) {
      items.push({
        type: 'free',
        startTime: toTimeStr(cursor),
        endTime: '17:00',
        durationMinutes: toMins('17:00') - cursor,
      });
    }

    return items;
  };

  const lecturesCount = classes.filter((c) => c.type === 'lecture').length;
  const labsCount = classes.filter((c) => c.type === 'lab').length;
  const tutorialsCount = classes.filter((c) => c.type === 'tutorial').length;

  return (
    <div id="screen-timetable" className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">
            <span>Weekly College Timetable</span>
            <span>•</span>
            <span>{semesterInfo.timetableFileName || semesterInfo.branch || 'Active Schedule'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            College Classes & Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lectures, practical labs, and free study gaps across Monday to Sunday.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden real file upload input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.json,.csv,.tsv,.txt"
            className="hidden"
            id="timetable-upload-real-input"
          />

          <button
            id="download-template-csv-btn"
            onClick={handleDownloadTemplate}
            title="Download blank timetable CSV template"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Template</span>
          </button>

          <button
            id="export-timetable-csv-btn"
            onClick={handleExportCSV}
            title="Export current timetable as CSV"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            id="import-timetable-btn"
            disabled={isProcessingFile}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-orange-600" />
            <span>{isProcessingFile ? 'Parsing...' : 'Upload / Replace Timetable'}</span>
          </button>

          <button
            id="add-class-btn"
            onClick={() => handleOpenAddModal(selectedDay)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* Schedule Summary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>Active Schedule:</span>
            <span className="font-bold text-slate-900">{classes.length} classes</span>
          </div>
          {classes.length > 0 && (
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <span className="bg-orange-100 text-orange-800 font-medium px-2 py-0.5 rounded">{lecturesCount} Lectures</span>
              <span className="bg-purple-100 text-purple-800 font-medium px-2 py-0.5 rounded">{labsCount} Labs</span>
              <span className="bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded">{tutorialsCount} Tutorials</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {classes.length > 0 && (
            <button
              type="button"
              id="clear-all-classes-btn"
              onClick={handleClearAllClasses}
              className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md text-[11px] transition-colors"
            >
              Clear Timetable
            </button>
          )}
        </div>
      </div>

      {parseError && (
        <div className="p-3.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-2 shadow-2xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-rose-900">Upload Parsing Error</span>
              <span className="block text-rose-700">{parseError}</span>
            </div>
          </div>
          <button onClick={() => setParseError(null)} className="text-rose-700 hover:text-rose-900 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {importNotice && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importNotice}</span>
          </div>
          <button onClick={() => setImportNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* When no classes exist, show prominent empty state banner */}
      {classes.length === 0 && (
        <div className="p-6 bg-orange-50/40 border border-dashed border-orange-300 rounded-xl text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-900">No Timetable Uploaded Yet</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your weekly class schedule is currently blank. Upload your college timetable file (CSV, JSON, or text format), download a blank CSV template, or add classes manually.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Timetable File</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Download CSV Template</span>
            </button>
            <button
              onClick={() => handleOpenAddModal(selectedDay)}
              className="px-3.5 py-2 text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Day Selector Tabs (Monday -> Sunday) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
        {days.map((day) => {
          const isSelected = selectedDay === day.num;
          const dayCount = classes.filter((c) => c.dayOfWeek === day.num).length;

          return (
            <button
              key={day.num}
              id={`tab-day-${day.num}`}
              onClick={() => setSelectedDay(day.num)}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                isSelected
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{day.name}</span>
              <span
                className={`text-[10px] font-normal ${
                  isSelected ? 'text-orange-100' : 'text-slate-400'
                }`}
              >
                {dayCount === 0 ? 'No classes' : `${dayCount} classes`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Daily Timeline View with Gaps/Available Time indicator */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Schedule for {days.find((d) => d.num === selectedDay)?.name}
            </h2>
            <span className="text-xs text-slate-500">
              ({classes.filter((c) => c.dayOfWeek === selectedDay).length} sessions scheduled)
            </span>
          </div>

          <button
            onClick={() => handleOpenAddModal(selectedDay)}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Class to {days.find((d) => d.num === selectedDay)?.short}</span>
          </button>
        </div>

        {/* Schedule List */}
        <div className="p-5 space-y-3">
          {classes.filter((c) => c.dayOfWeek === selectedDay).length === 0 ? (
            <div className="p-10 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                No classes on {days.find((d) => d.num === selectedDay)?.name}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                This is a completely free academic day. Ideal for project building, self-study, or rest.
              </p>
              <button
                onClick={() => handleOpenAddModal(selectedDay)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class</span>
              </button>
            </div>
          ) : (
            getDayScheduleWithGaps(selectedDay).map((item, idx) => {
              if (item.type === 'free') {
                return (
                  <div
                    key={`free-${idx}`}
                    className="p-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 text-emerald-800 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>
                        Available Time Window: {item.startTime} – {item.endTime}
                      </span>
                      <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        {item.durationMinutes} mins free
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 hidden sm:inline">
                      Ideal for library study or revision
                    </span>
                  </div>
                );
              }

              const cls = item.classItem!;
              return (
                <div
                  key={cls.id}
                  id={`class-item-${cls.id}`}
                  className="p-4 rounded-xl border border-orange-200 bg-orange-50/30 hover:bg-orange-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-24 shrink-0 text-center py-2 px-1 rounded-lg bg-orange-100 text-orange-900 border border-orange-200/80">
                      <div className="text-xs font-bold">{cls.startTime}</div>
                      <div className="text-[10px] text-orange-700">to {cls.endTime}</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">
                          {cls.subject}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {cls.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            cls.type === 'lab'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : cls.type === 'tutorial'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}
                        >
                          {cls.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                        {cls.room && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cls.room}</span>
                          </div>
                        )}
                        {cls.faculty && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cls.faculty}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      id={`edit-class-${cls.id}`}
                      onClick={() => handleOpenEditModal(cls)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-md transition-colors"
                      aria-label="Edit class"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-class-${cls.id}`}
                      onClick={() => {
                        if (confirm(`Remove class "${cls.subject}"?`)) {
                          deleteClass(cls.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      aria-label="Delete class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Class Modal */}
      {isAddModalOpen && (
        <div
          id="class-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingClass ? 'Edit College Class' : 'Add College Class'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CS201"
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Day of Week
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {days.map((d) => (
                      <option key={d.num} value={d.num}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Class Format
                  </label>
                  <select
                    value={classType}
                    onChange={(e) => setClassType(e.target.value as ClassType)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="lecture">Lecture (Theory)</option>
                    <option value="lab">Laboratory (Practical)</option>
                    <option value="tutorial">Tutorial / Discussion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Room / Lab
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Hall CS-204"
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Faculty / Professor (Optional)
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="e.g. Prof. K. Venkatesh"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs"
                >
                  {editingClass ? 'Update Class' : 'Add to Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
