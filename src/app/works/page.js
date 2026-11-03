"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive, Check, Heart, Laptop, Plus, RotateCcw, Trash, X,
} from "lucide-react";
import ConfirmDelete from "@/components/ConfirmDelete";
import { Fade, Page } from "@/components/Motion";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { useToast } from "@/lib/toast";

export default function WorksPage() {
  const { me, mePerson, partner } = usePeople();
  const { rows: projects } = useTable("projects");
  const { rows: allTasks } = useTable("project_tasks");
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const activeProjects = projects.filter((p) => p.status === "active");
  const doneProjects = projects.filter((p) => p.status === "done");
  const selected =
    activeProjects.find((p) => p.id === selectedId) || activeProjects[0] || null;

  const projectTasks = selected
    ? allTasks.filter((t) => t.project_id === selected.id)
    : [];

  const setStatus = async (p, status) => {
    if (!supabase) return;
    await runQuery(
      supabase
        .from("projects")
        .update({
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
        })
        .eq("id", p.id),
      toast,
      status === "done" ? "Project complete! 🎉" : "Project reopened"
    );
  };

  const removeProject = async (p) => {
    if (!supabase) return false;
    return runQuery(supabase.from("projects").delete().eq("id", p.id), toast);
  };

  return (
    <Page className="pt-8">
      <h1 className="font-romantic text-6xl text-wine text-center">Our Little Office</h1>
      <p className="text-center text-sm opacity-70 mt-2">
        Two desks, one team — pick a project and get to work side by side.
      </p>

      {/* project tabs */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {activeProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
              selected?.id === p.id
                ? "border-rose-deep bg-gradient-to-r from-rose to-rose-deep text-on-accent shadow-lg"
                : "border-line text-wine hover:border-rose"
            }`}
          >
            💼 {p.title}
          </button>
        ))}
        <button className="btn-ghost text-sm" onClick={() => setShowForm(true)} disabled={!me}>
          <Plus size={14} /> New project
        </button>
      </div>

      {selected ? (
        <>
          <div className="mt-5 text-center">
            {selected.description && (
              <p className="text-sm opacity-70">{selected.description}</p>
            )}
            <div className="mt-2 flex justify-center gap-3 text-xs">
              <button
                onClick={() => setStatus(selected, "done")}
                className="text-rose-deep font-semibold hover:underline"
              >
                ✓ Mark project complete
              </button>
              <ConfirmDelete
                onConfirm={() => removeProject(selected)}
                label={selected.title}
                className="text-rose/60 hover:text-rose-deep"
              >
                delete
              </ConfirmDelete>
            </div>
          </div>

          {/* the office */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <Fade delay={0.15}>
              <WorkStation
                person={mePerson}
                fallback="Heart One"
                tasks={projectTasks.filter((t) => t.owner === (me?.slot || "a"))}
                editable={Boolean(me)}
                projectId={selected.id}
                owner={me?.slot || "a"}
              />
            </Fade>
            <Fade delay={0.3}>
              <WorkStation
                person={partner}
                fallback="Heart Two"
                tasks={projectTasks.filter((t) => t.owner === otherSlot(me?.slot || "a"))}
                editable={false}
                projectId={selected.id}
                owner={otherSlot(me?.slot || "a")}
              />
            </Fade>
          </div>

          {/* meeting table for shared tasks */}
          <MeetingTable
            tasks={projectTasks.filter((t) => t.owner === "shared")}
            editable={Boolean(me)}
            projectId={selected.id}
          />
        </>
      ) : (
        <div className="card mt-10 p-10 text-center">
          <Laptop className="mx-auto text-rose-deep" size={40} />
          <p className="mt-3 text-sm opacity-70">
            No active projects — start your first one together!
          </p>
          <button className="btn-love mt-4" onClick={() => setShowForm(true)} disabled={!me}>
            <Plus size={15} /> New project
          </button>
        </div>
      )}

      {/* records */}
      {doneProjects.length > 0 && (
        <div className="card mt-10 p-5">
          <h2 className="font-bold text-wine text-lg flex items-center gap-2">
            <Archive size={18} className="text-rose-deep" /> Project records
          </h2>
          <div className="mt-3 space-y-2">
            {doneProjects.map((p) => {
              const pts = allTasks.filter((t) => t.project_id === p.id);
              const doneCount = pts.filter((t) => t.done).length;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-blush/50 border border-line"
                >
                  <Check size={15} className="text-rose-deep shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-wine text-sm">{p.title}</span>
                    {p.description && (
                      <span className="text-xs opacity-60"> — {p.description}</span>
                    )}
                    <div className="text-xs opacity-60">
                      {doneCount}/{pts.length} tasks done · finished{" "}
                      {new Date(p.completed_at || p.created_at).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => setStatus(p, "active")}
                    title="Reopen project"
                    className="text-rose-deep/70 hover:text-rose-deep"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </Page>
  );
}

function WorkStation({ person, fallback, tasks, editable, projectId, owner }) {
  const [title, setTitle] = useState("");
  const toast = useToast();
  const name = person?.name || fallback;
  const emoji = person?.emoji || "💗";
  const pending = tasks.filter((t) => !t.done);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || !supabase) return;
    const ok = await runQuery(
      supabase
        .from("project_tasks")
        .insert({ project_id: projectId, title: title.trim(), owner }),
      toast
    );
    if (ok) setTitle("");
  };

  const toggle = async (t) => {
    if (!editable || !supabase) return;
    await runQuery(
      supabase.from("project_tasks").update({ done: !t.done }).eq("id", t.id),
      toast
    );
  };

  const remove = async (id) => {
    if (!editable || !supabase) return false;
    return runQuery(supabase.from("project_tasks").delete().eq("id", id), toast);
  };

  return (
    <div className="flex flex-col items-center">
      {/* monitor */}
      <div className="w-full rounded-2xl border-[6px] border-desk bg-field shadow-xl overflow-hidden">
        <div className="bg-desk text-white text-xs px-3 py-2 flex items-center gap-2">
          <span>{emoji}</span>
          <span className="font-bold">{name}&apos;s workstation</span>
          <span className="ml-auto flex gap-1">
            <span className="w-2 h-2 rounded-full bg-rose" />
            <span className="w-2 h-2 rounded-full bg-gold" />
            <span className="w-2 h-2 rounded-full bg-[#8ce99a]" />
          </span>
        </div>

        <div className="p-3 min-h-44 max-h-64 overflow-y-auto">
          <AnimatePresence initial={false}>
            {tasks.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className={`flex items-center gap-2.5 py-2 px-2 rounded-lg mb-1 ${
                  t.done ? "opacity-50 bg-blush/40" : "bg-card border border-line"
                }`}
              >
                <button
                  onClick={() => toggle(t)}
                  disabled={!editable}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    t.done ? "bg-rose-deep border-rose-deep" : "border-rose"
                  } ${editable ? "cursor-pointer" : "cursor-default"}`}
                >
                  {t.done && <Heart size={10} className="fill-on-accent text-on-accent" />}
                </button>
                <span className={`flex-1 text-sm ${t.done ? "line-through" : ""}`}>{t.title}</span>
                {editable && (
                  <ConfirmDelete onConfirm={() => remove(t.id)} label={t.title} className="text-rose/50 hover:text-rose-deep">
                    <Trash size={13} />
                  </ConfirmDelete>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {!tasks.length && (
            <p className="text-xs opacity-50 text-center py-8">
              {editable ? "Add your first task for this project ✨" : "Nothing on their desk yet"}
            </p>
          )}
        </div>

        {editable && (
          <form onSubmit={add} className="px-3 pb-3 flex gap-2">
            <input
              className="input-love text-sm"
              placeholder="Add a task…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button type="submit" className="btn-love px-3" aria-label="Add task">
              <Plus size={15} />
            </button>
          </form>
        )}
      </div>

      {/* stand + desk */}
      <div className="w-12 h-4 bg-desk rounded-b-lg" />
      <div className="w-full h-4 rounded-xl bg-gradient-to-r from-[#e8b98a] via-[#d4a373] to-[#c68b59] shadow-md" />
      <div className="w-full flex justify-between px-6 mt-1 text-xl select-none" aria-hidden>
        <span title="chair">🪑</span>
        <span className="text-xs font-bold text-[#8a5a33] self-center">
          {pending.length ? `${pending.length} to do` : "all clear!"}
        </span>
        <span title="coffee">☕</span>
        <span title="plant">🪴</span>
      </div>
    </div>
  );
}

function MeetingTable({ tasks, editable, projectId }) {
  const [title, setTitle] = useState("");
  const toast = useToast();

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || !supabase) return;
    const ok = await runQuery(
      supabase
        .from("project_tasks")
        .insert({ project_id: projectId, title: title.trim(), owner: "shared" }),
      toast
    );
    if (ok) setTitle("");
  };

  const toggle = async (t) => {
    if (!editable || !supabase) return;
    await runQuery(
      supabase.from("project_tasks").update({ done: !t.done }).eq("id", t.id),
      toast
    );
  };

  const remove = async (id) => {
    if (!editable || !supabase) return false;
    return runQuery(supabase.from("project_tasks").delete().eq("id", id), toast);
  };

  return (
    <div className="mt-8 mx-auto max-w-xl card p-5 border-2 border-dashed border-rose">
      <h3 className="font-bold text-wine text-center flex items-center justify-center gap-2">
        💞 Meeting table <span className="text-xs font-normal opacity-60">— tasks for both of you</span>
      </h3>
      <div className="mt-3 space-y-1.5">
        {tasks.map((t) => (
          <div key={t.id} className={`flex items-center gap-2.5 p-2 rounded-lg ${t.done ? "opacity-50" : ""}`}>
            <button
              onClick={() => toggle(t)}
              disabled={!editable}
              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                t.done ? "bg-rose-deep border-rose-deep" : "border-rose"
              }`}
            >
              {t.done && <Heart size={10} className="fill-on-accent text-on-accent" />}
            </button>
            <span className={`flex-1 text-sm ${t.done ? "line-through" : ""}`}>{t.title}</span>
            {editable && (
              <ConfirmDelete onConfirm={() => remove(t.id)} label={t.title} className="text-rose/50 hover:text-rose-deep">
                <Trash size={13} />
              </ConfirmDelete>
            )}
          </div>
        ))}
        {!tasks.length && (
          <p className="text-xs opacity-50 text-center py-2">Nothing shared yet</p>
        )}
      </div>
      {editable && (
        <form onSubmit={add} className="mt-3 flex gap-2">
          <input
            className="input-love text-sm"
            placeholder="A task for both of you…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="btn-love px-3" aria-label="Add shared task">
            <Plus size={15} />
          </button>
        </form>
      )}
    </div>
  );
}

function ProjectForm({ onClose }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !supabase) return;
    const ok = await runQuery(
      supabase.from("projects").insert({ title: title.trim(), description: desc.trim() }),
      toast,
      "Project opened 💼"
    );
    if (ok) onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="card w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-wine text-lg">New project</h3>
          <button type="button" onClick={onClose} className="text-rose-deep/60 hover:text-rose-deep">
            <X size={18} />
          </button>
        </div>
        <input
          autoFocus
          className="input-love mt-4"
          placeholder="Project name (e.g. Portfolio site)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input-love mt-3 h-20 resize-none"
          placeholder="What are we building? (optional)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button className="btn-love w-full justify-center mt-5" disabled={!title.trim()}>
          <Laptop size={15} /> Open the office
        </button>
      </motion.form>
    </motion.div>
  );
}
