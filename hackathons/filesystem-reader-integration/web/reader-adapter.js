/* SPDX-License-Identifier: GPL-3.0-or-later */
(function (root) {
  'use strict';
  class ReaderAdapter {
    constructor({baseURL = location.origin, source = 'ssh-fixture', fetch: request = root.fetch.bind(root)} = {}) {
      this.baseURL = baseURL; this.source = source; this.fetch = request; this.sessionData = null;
    }
    async request(path, data, retryToken = true) {
      const url = new URL(path, this.baseURL);
      url.searchParams.set('source', this.source);
      let options = {cache: 'no-store'};
      if (data !== undefined) {
        const session = await this.session();
        options = {...options, method: 'POST', headers: {'Content-Type': 'application/json', 'X-Reader-Token': session.token}, body: JSON.stringify(data)};
      }
      const response = await this.fetch(url, options);
      const value = await response.json();
      if (!response.ok) {
        if (response.status === 403) this.sessionData = null;
        if (response.status === 403 && data !== undefined && retryToken && value.error?.message === 'Origin and reader token required') {
          // A restarted bridge rotates its nonce. The rejected request had no
          // effects; refresh once without discarding editor tabs or drafts.
          await this.session();
          return this.request(path, data, false);
        }
        throw Error(value.error?.message || 'Reader request failed (' + response.status + ')');
      }
      return value;
    }
    async session() {
      if (!this.sessionData) this.sessionData = await this.request('/api/session');
      return this.sessionData;
    }
    read() { return this.request('/api/status'); }
    setRunning(running) { return this.request('/api/control', {running}); }
    dismiss(id) { return this.request('/api/dismiss', {id}); }
    result(alert) { return this.request('/api/result?path=' + encodeURIComponent(alert.result_path)); }
    includeFolder(path, recursive) { return this.request('/api/scope', {path, recursive, running: true}); }
  }
  root.FlagMapWorkspace = {...root.FlagMapWorkspace, ReaderAdapter};
  if (typeof module !== 'undefined' && module.exports) module.exports = {ReaderAdapter};
})(globalThis);
