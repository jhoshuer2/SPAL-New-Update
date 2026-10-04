"use client";

/**
 * SwipeableRow — Gmail-style swipe actions for record rows.
 *
 * Swipe LEFT  → reveals Edit   button (navy, right side)
 * Swipe RIGHT → reveals Delete button (red,  left side)
 *
 * In selectMode: swipe is disabled, a checkbox is shown, onSelect fires on tap.
 */

import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { Delete01Icon, PencilEdit01Icon, Tick01Icon } from "hugeicons-react";

interface SwipeableRowProps {
  children:    React.ReactNode;
  onEdit:      () => void;
  onDelete:    () => void;
  selectMode?: boolean;
  selected?:   boolean;
  onSelect?:   () => void;
}

const REVEAL  = 72;
const TRIGGER = 120;

export function SwipeableRow({
  children,
  onEdit,
  onDelete,
  selectMode = false,
  selected   = false,
  onSelect,
}: SwipeableRowProps) {
  const x = useMotionValue(0);

  const deleteWidth = useTransform(x, [0, REVEAL], [0, REVEAL]);
  const deleteBg    = useTransform(x, [0, REVEAL * 0.5, REVEAL], ["#FEE2E2", "#FCA5A5", "#EF4444"]);
  const editWidth   = useTransform(x, [-REVEAL, 0], [REVEAL, 0]);
  const editBg      = useTransform(x, [-REVEAL, -REVEAL * 0.5, 0], ["#0F172A", "#1e2d40", "#e5e7eb"]);

  function snapTo(target: number) {
    animate(x, target, { type: "spring", stiffness: 500, damping: 45, restDelta: 0.5 });
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x;
    if      (offset >  TRIGGER)      { snapTo(0); onDelete(); }
    else if (offset < -TRIGGER)      { snapTo(0); onEdit();   }
    else if (offset >  REVEAL * 0.6) { snapTo(REVEAL); }
    else if (offset < -REVEAL * 0.6) { snapTo(-REVEAL); }
    else                             { snapTo(0); }
  }

  // ── Select mode: show checkbox, no swipe ──────────────────────────────────
  if (selectMode) {
    return (
      <div
        className="relative overflow-hidden bg-white flex items-center active:bg-neutral-50 transition-colors cursor-pointer"
        onClick={onSelect}
      >
        <div className="pl-3.5 pr-1 flex-shrink-0 flex items-center self-stretch">
          <div
            className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-150"
            style={{
              background:   selected ? "#22C55E" : "#fff",
              borderColor:  selected ? "#22C55E" : "#D1D5DB",
            }}
          >
            {selected && <Tick01Icon size={12} color="white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    );
  }

  // ── Normal swipe mode ─────────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden">

      {/* Delete panel — left side */}
      <motion.div
        className="absolute left-0 inset-y-0 flex items-center justify-center gap-1.5 cursor-pointer"
        style={{ width: deleteWidth, background: deleteBg, minWidth: 0 }}
        onClick={() => { snapTo(0); setTimeout(onDelete, 180); }}
      >
        <motion.div
          style={{ opacity: useTransform(x, [REVEAL * 0.4, REVEAL], [0, 1]) }}
          className="flex flex-col items-center gap-0.5"
        >
          <Delete01Icon size={18} color="white" />
          <span className="text-white text-[10px] font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>Delete</span>
        </motion.div>
      </motion.div>

      {/* Edit panel — right side */}
      <motion.div
        className="absolute right-0 inset-y-0 flex items-center justify-center gap-1.5 cursor-pointer"
        style={{ width: editWidth, background: editBg, minWidth: 0 }}
        onClick={() => { snapTo(0); setTimeout(onEdit, 180); }}
      >
        <motion.div
          style={{ opacity: useTransform(x, [-REVEAL, -REVEAL * 0.4], [1, 0]) }}
          className="flex flex-col items-center gap-0.5"
        >
          <PencilEdit01Icon size={18} color="white" />
          <span className="text-white text-[10px] font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>Edit</span>
        </motion.div>
      </motion.div>

      {/* Draggable row */}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -TRIGGER * 1.2, right: TRIGGER * 1.2 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className="relative bg-white"
        onTap={(e) => { if (Math.abs(x.get()) > 4) e.stopPropagation(); }}
      >
        {children}
      </motion.div>

    </div>
  );
}
