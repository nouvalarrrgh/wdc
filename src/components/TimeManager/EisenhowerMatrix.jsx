import React from 'react';
import { createPortal } from 'react-dom';
import { Target, Trash2, GripVertical, Calendar as CalendarIcon, Sparkles, CheckCircle } from 'lucide-react';
import { Droppable, Draggable } from "@hello-pangea/dnd";

const EisenhowerMatrix = ({
  clearCompletedTasks,
  quadrants,
  tasks,
  openScheduleModal,
  toggleTaskStatus,
  deleteTask,
  moveTaskToQuadrant,
}) => {
  return (
    <div className="liquid-glass dark:bg-slate-900/60 dark:border-slate-700/50 p-6 lg:p-8 rounded-3xl spatial-shadow transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <span className="w-9 h-9 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </span>
            Task &amp; Activity Manager
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 ml-12">
            Petakan semua tugas pentingmu di 4 kuadran ini sebelum dimasukkan ke kalender mingguan.
          </p>
        </div>

        <button
          onClick={clearCompletedTasks}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-bold transition-colors shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Bersihkan Selesai
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {quadrants.map((quad) => (
          <Droppable droppableId={quad.id} key={quad.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-4 rounded-2xl border-2 transition-colors min-h-[220px] flex flex-col ${quad.bg} ${snapshot.isDraggingOver ? "border-indigo-400 border-dashed bg-indigo-50/60 dark:bg-indigo-900/20" : quad.border}`}
              >
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <quad.icon className={`w-5 h-5 ${quad.color}`} />
                  <h3 className={`font-black text-sm ${quad.color}`}>{quad.title}</h3>
                  <span className="ml-auto bg-white/70 dark:bg-slate-900/50 px-2 py-0.5 rounded-md text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm">
                    {tasks.filter((t) => t.quadrant === quad.id).length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {tasks.filter((t) => t.quadrant === quad.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        (() => {
                          const child = (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                ...(snapshot.isDragging ? { zIndex: 9999 } : null),
                              }}
                              className={`group bg-white/85 dark:bg-slate-800/85 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-slate-100/80 dark:border-slate-700/80 flex items-center gap-2 transition-shadow transition-colors ${snapshot.isDragging ? "shadow-xl ring-2 ring-indigo-400 relative" : "md:hover:shadow-md md:hover:-translate-y-0.5 active:scale-[0.98] transition-all"}`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="text-slate-300 dark:text-slate-500 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 touch-none select-none"
                                title="Seret untuk pindah kuadran"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight break-words [overflow-wrap:anywhere] line-clamp-2 ${task.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}>
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <button
                                    onClick={() => openScheduleModal(task)}
                                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-500/20 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <CalendarIcon className="w-3 h-3" /> Jadwalkan
                                  </button>
                                  {/* Mobile fallback: no drag needed */}
                                  <select
                                    value={task.quadrant}
                                    onChange={(e) => moveTaskToQuadrant?.(task.id, e.target.value)}
                                    className="md:hidden text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 cursor-pointer"
                                    title="Pindah kuadran (mobile)"
                                  >
                                    {quadrants.map((q) => (
                                      <option key={q.id} value={q.id}>{q.title}</option>
                                    ))}
                                  </select>
                                  {task.tag === "Dari Catatan" && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" /> Catatan
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => toggleTaskStatus(task.id)}
                                  type="button"
                                  aria-label={task.completed ? "Batalkan selesai" : "Tandai selesai"}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${task.completed ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "text-slate-300 dark:text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  type="button"
                                  aria-label="Hapus tugas"
                                  className="p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );

                          if (snapshot.isDragging && typeof document !== 'undefined') {
                            return createPortal(child, document.body);
                          }
                          return child;
                        })()
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {tasks.filter((t) => t.quadrant === quad.id).length === 0 && !snapshot.isDraggingOver && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200/60 dark:border-slate-700/60 rounded-xl text-slate-400 dark:text-slate-500 text-xs font-medium">
                      Seret tugas ke sini
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
