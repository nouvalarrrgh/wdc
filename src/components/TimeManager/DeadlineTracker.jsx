import React from 'react';
import { Plus, Check, Clock, Calendar as CalendarIcon, MoveRight, Trash2, BellRing } from 'lucide-react';

const DeadlineTracker = ({ 
  deadlineTasks, 
  newDeadlineTask, 
  setNewDeadlineTask, 
  newDeadlineTime, 
  setNewDeadlineTime, 
  handleAddDeadlineTask, 
  toggleDeadlineTask, 
  deleteDeadlineTask, 
  transferDeadlineTask, 
  calculateDeadlineStatus 
}) => {

  const sortedDeadlineTasks = [...deadlineTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return (
    <div className="liquid-glass dark:bg-slate-900/60 dark:border-slate-700/50 p-6 lg:p-8 rounded-3xl spatial-shadow transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <span className="w-9 h-9 bg-rose-100 dark:bg-rose-500/20 rounded-xl flex items-center justify-center">
              <BellRing className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </span>
            Manajemen Deadline Tugas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 ml-12">Pantau tenggat waktu, otomatis mengingatkan 2 jam sebelum hangus.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-bold shrink-0">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Notifikasi Aktif
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Add Deadline Form */}
        <div className="w-full lg:w-80 shrink-0">
          <form
            onSubmit={handleAddDeadlineTask}
            className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm lg:sticky lg:top-24 space-y-4 transition-colors"
          >
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Plus className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Tugas Baru
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nama Tugas</label>
              <input
                type="text"
                value={newDeadlineTask}
                onChange={(e) => setNewDeadlineTask(e.target.value)}
                placeholder="Mengerjakan laporan..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-white text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Deadline</label>
              <input
                type="datetime-local"
                value={newDeadlineTime}
                onChange={(e) => setNewDeadlineTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-slate-200 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambahkan
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="flex-1 flex flex-col gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
          {sortedDeadlineTasks.length === 0 ? (
            <div className="bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-12 text-center rounded-2xl flex flex-col items-center justify-center min-h-[250px]">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Tidak Ada Deadline Aktif!</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Kamu bebas! Semua tugasmu sudah terkendali.</p>
            </div>
          ) : (
            sortedDeadlineTasks.map((task) => {
              const status = calculateDeadlineStatus(task.deadline);
              const isExpired = new Date(task.deadline).getTime() < new Date().getTime();
              return (
                <div
                  key={task.id}
                  className={`group bg-white dark:bg-slate-800 p-4 rounded-2xl border transition-all flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm ${task.completed ? "border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 opacity-60" : isExpired ? "border-rose-200 dark:border-rose-500/30 bg-rose-50/30 dark:bg-rose-500/5" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md"}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleDeadlineTask(task.id)}
                      type="button"
                      aria-label={task.completed ? "Batalkan selesai" : "Tandai selesai"}
                      className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${task.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400"}`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-base leading-tight break-words [overflow-wrap:anywhere] line-clamp-2 ${task.completed ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-slate-200"}`}>
                        {task.text}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${task.completed ? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600" : status.border + " " + status.color + " " + status.bg}`}>
                          <Clock className="w-3 h-3" /> {status.label}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:ml-2">
                    {!task.completed && (
                      <button
                        onClick={() => transferDeadlineTask(task)}
                        type="button"
                        aria-label="Kirim ke Matrix"
                        className="shrink-0 p-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-xl transition-colors cursor-pointer"
                        title="Kirim ke Matrix"
                      >
                        <MoveRight className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteDeadlineTask(task.id)}
                      type="button"
                      aria-label="Hapus deadline"
                      className="shrink-0 p-2 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                      title="Hapus"
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
    </div>
  );
};

export default DeadlineTracker;
