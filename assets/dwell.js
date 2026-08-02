// Pure dwell-time reducer. Given a time-ordered list of section enter/exit
// events, returns how many milliseconds each section was on screen. Multiple
// enter/exit cycles for the same section are summed. An "enter" with no
// matching "exit" contributes nothing (the beacon adds a synthetic exit for
// any still-visible section when it flushes).
//
//   events: Array<{ section: string, type: "enter" | "exit", t: number }>
//   returns: { [section: string]: number }  // integer milliseconds
export function accumulateDwell(events) {
  const openAt = Object.create(null); // section -> enter timestamp
  const total = Object.create(null); // section -> accumulated ms

  for (const e of events) {
    if (!e || typeof e.section !== "string") continue;

    if (e.type === "enter") {
      if (openAt[e.section] == null) openAt[e.section] = e.t;
    } else if (e.type === "exit") {
      const start = openAt[e.section];
      if (start != null) {
        total[e.section] = (total[e.section] || 0) + Math.max(0, e.t - start);
        delete openAt[e.section];
      }
    }
  }

  for (const section of Object.keys(total)) {
    total[section] = Math.round(total[section]);
  }
  return total;
}
