/**
 * Birthday check — per spec §3.3, the birthday ribbon fires only on
 * the animal's birthday and disappears the next day.
 *
 * A DOB is a calendar date (YYYY-MM-DD), not an instant. Comparing
 * month+day from the string directly avoids timezone surprises —
 * converting DOB to a Date and formatting in America/Los_Angeles
 * shifted the day when DOB's UTC midnight fell in the previous PST
 * calendar day.
 *
 * "Today" uses America/Los_Angeles since the ranch operates in
 * California. A buyer in Tokyo should not see yesterday's birthday
 * ribbon when it's already tomorrow locally at the ranch — the
 * ribbon is a ranch-local ceremony.
 */

const RANCH_TIME_ZONE = "America/Los_Angeles";

function ranchMonthDay(date: Date): [number, number] {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RANCH_TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const day = Number(parts.find((p) => p.type === "day")!.value);
  return [month, day];
}

function dobMonthDay(iso: string): [number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return [Number(match[2]), Number(match[3])];
}

export function isBirthday(
  dateOfBirth: string | null,
  today: Date = new Date()
): boolean {
  if (!dateOfBirth) return false;
  const dob = dobMonthDay(dateOfBirth);
  if (!dob) return false;
  const [todayMonth, todayDay] = ranchMonthDay(today);
  return dob[0] === todayMonth && dob[1] === todayDay;
}
