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

    var today = getToday();
    var todayKey = mmdd(today);

    var state = {
        today: today,
        todayKey: todayKey,
        data: null,
        activeSeason: null,
        activeEvent: null,
        birthdays: [],
        mascotAge: null
    };

    var p = fetch('ranch-calendar.json', { cache: 'no-cache' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
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
