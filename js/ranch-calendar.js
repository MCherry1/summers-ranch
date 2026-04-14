/*
 * Ranch calendar system — reads ranch-calendar.json and drives:
 *   - #siteBanner     (all pages)     birthday/event/season banner
 *   - #ranchStatus    (index)         quiet caption under intro
 *   - #upcoming       (index/roadmap) next 90-day event list
 *   - --hero-image    (index)         seasonal hero photo swap
 *   - #mascotAge      (index)         auto-age on mascot section
 *   - window.__ranchCalendar.promise  (cattle.html uses this to wait for
 *                                      calving-season + data for New Arrivals)
 *
 * Feature-detects every DOM hook, so the same script works on every page.
 * Override today's date for testing with ?date=YYYY-MM-DD.
 *
 * Behavior-driven calving season (docs/BEHAVIOR-DRIVEN-SPEC.md § 1):
 * If cattle-data.json has animals born within the last 90 days that qualify
 * as calves, the banner/status/New Arrivals react to the actual herd rather
 * than to hardcoded Feb-Apr dates. See computeCalvingState() below.
 */
window.__ranchCalendar = (function() {
    function getToday() {
        var param = new URLSearchParams(location.search).get('date');
        if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
            return new Date(param + 'T12:00:00');
        }
        return new Date();
    }
    function mmdd(d) {
        return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function inSeason(todayMMDD, start, end) {
        if (start <= end) return todayMMDD >= start && todayMMDD <= end;
        // wrap-around (e.g. winter 11-16 → 02-14)
        return todayMMDD >= start || todayMMDD <= end;
    }
    function parseISO(s) {
        if (!s) return null;
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        if (!m) return null;
        return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0);
    }
    // Admins enter `born` loosely ("Spring 2024", "March 2025"). For calving
    // detection we need a real date, so fall back to any parseable string and
    // return null when it's clearly not a recent specific date.
    function parseBornLoose(s) {
        if (!s) return null;
        var iso = parseISO(s);
        if (iso) return iso;
        // Accept YYYY/MM/DD as a common alternate
        var m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0);
        return null;
    }
    function daysBetween(a, b) {
        return Math.round((b - a) / 86400000);
    }
    function showBanner(html) {
        var el = document.getElementById('siteBanner');
        if (!el) return;
        el.innerHTML = html;
        el.style.display = '';
        document.body.classList.add('has-banner');
    }
    function renderUpcoming(events, today) {
        var list = document.getElementById('upcomingList');
        var section = document.getElementById('upcoming');
        if (!list || !section) return;
        var items = [];
        events.forEach(function(ev) {
            if (!ev.show_in_upcoming) return;
            var d = parseISO(ev.date);
            if (!d) return;
            var endD = parseISO(ev.end_date) || d;
            if (endD < today) return; // already over
            var diff = daysBetween(today, d);
            if (diff > 90) return;
            items.push({ date: d, end: endD, ev: ev });
        });
        if (items.length === 0) return;
        items.sort(function(a, b) { return a.date - b.date; });
        var fmt = { month: 'short', day: 'numeric' };
        list.innerHTML = items.map(function(it) {
            var dateStr = it.date.toLocaleDateString(undefined, fmt);
            if (it.end && it.end.getTime() !== it.date.getTime()) {
                dateStr += ' – ' + it.end.toLocaleDateString(undefined, fmt);
            }
            return '<li class="upcoming-item">' +
                '<span class="upcoming-dot"></span>' +
                '<p class="upcoming-title">' + it.ev.name + '</p>' +
                '<span class="upcoming-date">' + dateStr + '</span>' +
                '</li>';
        }).join('');
        section.classList.add('visible');
    }
    function swapHero(heroImage) {
        if (!heroImage) return;
        var probe = new Image();
        probe.onload = function() {
            document.documentElement.style.setProperty('--hero-image', "url('" + heroImage + "')");
        };
        probe.src = heroImage;
    }

    // -----------------------------------------------------------------
    // Behavior-driven calving detection (BEHAVIOR-DRIVEN-SPEC.md § 1)
    // -----------------------------------------------------------------
    // Sex values that make an animal count as a "calf" for detection.
    // Also accepted: any animal whose age is < 60 days regardless of sex.
    var CALF_SEX = { 'calf': 1, 'bull calf': 1, 'heifer': 1, 'heifer calf': 1 };

    function isCalfForDetection(animal, today) {
        var born = parseBornLoose(animal.born);
        if (!born) return { calf: false, born: null };
        var ageDays = daysBetween(born, today);
        if (ageDays < 0) return { calf: false, born: born }; // future date
        var sex = String(animal.sex || '').toLowerCase();
        var byAge = ageDays < 60;
        var bySex = !!CALF_SEX[sex];
        return { calf: byAge || bySex, born: born, ageDays: ageDays };
    }

    // Round a day count into the spec's human-friendly buckets:
    //   1-7  → "this week"
    //   8-22 → "15 days"  (and so on in 15-day increments up to 90)
    function roundDaysPhrase(days) {
        if (days <= 7) return 'this week';
        var buckets = [15, 30, 45, 60, 75, 90];
        for (var i = 0; i < buckets.length; i++) {
            var center = buckets[i];
            var low  = center - 7;
            var high = center + 7;
            // Last bucket (90) catches everything up through 90
            if (i === buckets.length - 1) {
                if (days >= low) return center + ' days';
            } else if (days >= low && days <= high) {
                return center + ' days';
            }
        }
        return days + ' days';
    }

    function pluralCalves(n) { return n === 1 ? 'calf' : 'calves'; }

    // Given the animals list and today's date, compute:
    //   active        boolean — calving season is running now
    //   count         number  — calves in the sliding window
    //   windowDays    number  — days between first calf and today, capped 90
    //   phrase        string  — "this week" / "15 days" / ...
    //   newArrivals   array   — animals qualifying for the new-arrivals row
    //   bannerHtml    string  — ready-to-render banner when active
    // Rules per spec lines 34–51:
    //   - calves = animals born within the last 90 days AND qualifying as calves
    //   - if empty → inactive
    //   - if (today - most_recent_calf) > 30 days → inactive (season over)
    //   - otherwise active: first_calf = min(born), window = min(today-first, 90),
    //     count = calves born within that window
    function computeCalvingState(animals, today) {
        var out = { active: false, count: 0, windowDays: 0, phrase: '',
                    newArrivals: [], bannerHtml: null };
        if (!Array.isArray(animals) || animals.length === 0) return out;

        var hiddenStatuses = { culled: 1, deceased: 1, reference: 1 };
        var candidates = [];
        animals.forEach(function(a) {
            if (hiddenStatuses[a.status]) return;
            if (a.source === 'reference') return;
            var r = isCalfForDetection(a, today);
            if (!r.calf || !r.born) return;
            if (r.ageDays > 90) return;
            candidates.push({ animal: a, born: r.born, ageDays: r.ageDays });
        });
        if (candidates.length === 0) return out;

        // most_recent = smallest ageDays, first = largest ageDays
        var mostRecent = candidates[0], first = candidates[0];
        candidates.forEach(function(c) {
            if (c.ageDays < mostRecent.ageDays) mostRecent = c;
            if (c.ageDays > first.ageDays) first = c;
        });

        if (mostRecent.ageDays > 30) return out; // season over

        var windowDays = Math.min(first.ageDays, 90);
        // Window must be at least 1 so a brand-new calf still produces a
        // meaningful phrase ("this week").
        if (windowDays < 1) windowDays = 1;
        var inWindow = candidates.filter(function(c) { return c.ageDays <= windowDays; });
        var count = inWindow.length;
        var phrase = roundDaysPhrase(windowDays);

        out.active = true;
        out.count = count;
        out.windowDays = windowDays;
        out.phrase = phrase;
        out.newArrivals = inWindow.map(function(c) { return c.animal; });
        out.bannerHtml = 'Calving season is underway — <strong>' + count + ' ' +
            pluralCalves(count) + '</strong> ' +
            (phrase === 'this week' ? 'this week' : 'in the last ' + phrase) + '!';
        return out;
    }

    var today = getToday();
    var todayKey = mmdd(today);

    var state = {
        today: today,
        todayKey: todayKey,
        data: null,
        activeSeason: null,
        activeEvent: null,
        birthdays: [],
        mascotAge: null,
        // Populated once cattle-data.json resolves. The cattle page reads this
        // to decide whether to render the "New Arrivals" row regardless of the
        // hardcoded Feb-Apr calving dates.
        calving: { active: false, count: 0, windowDays: 0, phrase: '',
                   newArrivals: [], bannerHtml: null }
    };

    // Fetch cattle-data.json in parallel with the calendar JSON so the
    // behavior-driven calving detection can run without slowing down the page.
    // Failures here are non-fatal — we just skip the override.
    var cattlePromise = fetch('cattle-data.json', { cache: 'no-cache' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .catch(function() { return null; });

    var p = Promise.all([
            fetch('ranch-calendar.json', { cache: 'no-cache' })
                .then(function(r) { return r.ok ? r.json() : null; })
                .catch(function() { return null; }),
            cattlePromise
        ])
        .then(function(results) {
            var data = results[0];
            var cattle = results[1];

            // Compute behavior-driven calving state first so later banner
            // resolution can prefer it over the hardcoded season.
            if (cattle && Array.isArray(cattle.animals)) {
                state.calving = computeCalvingState(cattle.animals, today);
            }

            if (!data) return state;
            state.data = data;

            // 1. Birthdays
            (data.birthdays || []).forEach(function(b) {
                if (!b.date) return;
                if (b.date === todayKey) {
                    state.birthdays.push(b);
                }
                if (b.role === 'mascot' && b.year) {
                    var birth = new Date(b.year, +b.date.slice(0, 2) - 1, +b.date.slice(3, 5));
                    var age = today.getFullYear() - birth.getFullYear();
                    if (today.getMonth() < birth.getMonth() ||
                       (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
                        age--;
                    }
                    state.mascotAge = age;
                    var ageEl = document.getElementById('mascotAge');
                    if (ageEl) ageEl.textContent = age === 1 ? 'a year' : age + ' years';
                }
            });

            // 2. Active season
            (data.seasons || []).forEach(function(s) {
                if (inSeason(todayKey, s.start, s.end)) state.activeSeason = s;
            });

            // 2b. Behavior-driven calving overrides the hardcoded calving
            // season. We build a synthetic season-like object so downstream
            // consumers (cattle.html's New Arrivals row, the status line) see
            // it as an activeSeason with the same priority (2).
            if (state.calving.active) {
                var baseCalving = null;
                (data.seasons || []).forEach(function(s) {
                    if (/calving/i.test(s.name || '')) baseCalving = s;
                });
                state.activeSeason = {
                    name: 'Calving Season',
                    start: baseCalving ? baseCalving.start : '02-15',
                    end:   baseCalving ? baseCalving.end   : '04-30',
                    banner: state.calving.bannerHtml,
                    hero_image: baseCalving ? baseCalving.hero_image : null,
                    status_text: 'Calving season — ' + state.calving.count + ' ' +
                                 pluralCalves(state.calving.count) +
                                 (state.calving.phrase === 'this week'
                                    ? ' this week.'
                                    : ' in the last ' + state.calving.phrase + '.'),
                    priority: 2,
                    _behaviorDriven: true
                };
            }

            // 3. Active event (today is within advance_days..end_date window)
            (data.events || []).forEach(function(ev) {
                var d = parseISO(ev.date);
                if (!d) return;
                var endD = parseISO(ev.end_date) || d;
                var advance = (ev.advance_days != null) ? ev.advance_days : 0;
                var windowStart = new Date(d);
                windowStart.setDate(windowStart.getDate() - advance);
                if (today >= windowStart && today <= endD && ev.banner) {
                    if (!state.activeEvent || (ev.priority || 3) > (state.activeEvent.priority || 3)) {
                        state.activeEvent = ev;
                    }
                }
            });

            // 4. Resolve banner by priority: birthday (10) > event (3) > season (2)
            if (state.birthdays.length > 0) {
                var msg = '';
                if (state.birthdays.length === 1) {
                    var person = state.birthdays[0];
                    msg = person.message ||
                        (person.role === 'mascot'
                            ? 'Happy Birthday to our Junior Ranch Hand, <strong>' + person.name + '</strong>!'
                            : 'Happy Birthday to <strong>' + person.name + '</strong> from the Summers Ranch family!');
                } else {
                    var names = state.birthdays.map(function(b) { return b.name; });
                    msg = 'Happy Birthday to <strong>' + names.join('</strong> and <strong>') + '</strong>!';
                }
                showBanner('<span>🎂</span> ' + msg + ' <span>🎂</span>');
            } else if (state.activeEvent) {
                showBanner(state.activeEvent.banner);
            } else if (state.activeSeason && state.activeSeason.banner) {
                showBanner(state.activeSeason.banner);
            }

            // 5. Status line
            if (state.activeSeason && state.activeSeason.status_text) {
                var statusEl = document.getElementById('ranchStatus');
                if (statusEl) {
                    statusEl.textContent = state.activeSeason.status_text;
                    statusEl.classList.add('visible');
                }
            }

            // 6. Hero image swap
            if (state.activeSeason && state.activeSeason.hero_image) {
                swapHero(state.activeSeason.hero_image);
            }

            // 7. Upcoming list
            renderUpcoming(data.events || [], today);

            return state;
        })
        .catch(function() { return state; });

    return { promise: p, today: today, todayKey: todayKey };
})();
