// public/rr-auth.js — shared login helpers for the scanner, Cart Builder, and Meal Planner.
(function () {
  // Until this date, phones unlocked with the old shared password keep working
  // (with a banner nudging them to switch to email login).
  const GRACE_UNTIL = new Date('2026-12-04T23:59:59-05:00').getTime();
  const CHECKOUT = 'https://restandrootholistichealth.systeme.io/87f9a7a0-346d5f81';

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }

  const RR = {
    CHECKOUT,
    graceActive: () => Date.now() < GRACE_UNTIL,
    session: () => read('rr_session'),
    email: () => read('rr_email'),
    ent: () => { try { return JSON.parse(read('rr_ent') || 'null'); } catch (e) { return null; } },
    save(data) {
      if (data.session) write('rr_session', data.session);
      if (data.ent) write('rr_ent', JSON.stringify(data.ent));
      if (data.email) write('rr_email', data.email);
      if (data.ent && data.ent.scanner) {
        write('rr_unlocked', 'true');
        write('rr_free_scan_available', null);
        write('rr_free_scan_used', null);
      }
    },
    logout() {
      ['rr_session', 'rr_ent', 'rr_email', 'rr_unlocked'].forEach(k => write(k, null));
    },
    // Old shared-password unlock, honored only during the grace period.
    legacyOnly: () => !read('rr_session') && read('rr_unlocked') === 'true',
    loginUrl: next => '/login' + (next ? '?next=' + encodeURIComponent(next) : ''),
    // ---- Saved settings (follow her across devices via her account) ----
    async getPrefs() {
      const session = read('rr_session');
      if (!session) return null;
      try {
        const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_prefs', session }) });
        const d = await r.json();
        if (d.session) write('rr_session', d.session);
        return d.prefs || null;
      } catch (e) { return null; }
    },
    savePrefs(patch) {
      const session = read('rr_session');
      if (!session) return;
      fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_prefs', session, prefs: patch }) }).catch(() => {});
    },
    // ---- Scan-to-cart list: swaps saved from scan results ----
    queue() { try { return JSON.parse(read('rr_cart_queue') || '[]'); } catch (e) { return []; } },
    queueAdd(item) {
      const q = RR.queue();
      const clean = String(item || '').trim();
      if (!clean || q.some(x => x.toLowerCase() === clean.toLowerCase())) return q.length;
      q.push(clean);
      write('rr_cart_queue', JSON.stringify(q));
      RR.savePrefs({ queue: q });
      return q.length;
    },
    queueMerge(serverQueue) {
      const q = RR.queue();
      (serverQueue || []).forEach(x => { if (!q.some(y => y.toLowerCase() === String(x).toLowerCase())) q.push(String(x)); });
      write('rr_cart_queue', JSON.stringify(q));
      return q;
    },
    queueClear() { write('rr_cart_queue', null); RR.savePrefs({ queue: [] }); },
    // Asks the server what she owns right now (re-checks Systeme.io once a day).
    async refresh() {
      const session = read('rr_session');
      if (!session) return { ok: false, code: 'login' };
      try {
        const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', session }) });
        const d = await r.json();
        if (d.session) write('rr_session', d.session);
        if (d.ent) write('rr_ent', JSON.stringify(d.ent));
        if (d.code === 'login') RR.logout();
        if (d.code === 'renew') write('rr_unlocked', null);
        return d;
      } catch (e) {
        return { ok: true, offline: true }; // no signal: don't lock her out
      }
    },
  };
  window.RR = RR;
})();
