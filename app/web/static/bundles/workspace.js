// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = /* @__PURE__ */ e(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, S || (S = !0, te());
			else {
				var t = n(l);
				t !== null && ie(x, t.startTime - e);
			}
		}
	}
	var S = !1, ee = -1, C = 5, w = -1;
	function T() {
		return g ? !0 : !(e.unstable_now() - w < C);
	}
	function E() {
		if (g = !1, S) {
			var t = e.unstable_now();
			w = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(ee), ee = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && T());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && ie(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? te() : S = !1;
			}
		}
	}
	var te;
	if (typeof y == "function") te = function() {
		y(E);
	};
	else if (typeof MessageChannel < "u") {
		var ne = new MessageChannel(), re = ne.port2;
		ne.port1.onmessage = E, te = function() {
			re.postMessage(null);
		};
	} else te = function() {
		_(E, 0);
	};
	function ie(t, n) {
		ee = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : C = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(ee), ee = -1) : h = !0, ie(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, te()))), r;
	}, e.unstable_shouldYield = T, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), n = /* @__PURE__ */ e(((e, n) => {
	n.exports = t();
})), r = /* @__PURE__ */ e(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.for("react.view_transition"), m = Symbol.iterator;
	function h(e) {
		return typeof e != "object" || !e ? null : (e = m && e[m] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var g = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, _ = Object.assign, v = {};
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	y.prototype.isReactComponent = {}, y.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, y.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function b() {}
	b.prototype = y.prototype;
	function x(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	var S = x.prototype = new b();
	S.constructor = x, _(S, y.prototype), S.isPureReactComponent = !0;
	var ee = Array.isArray;
	function C() {}
	var w = {
		H: null,
		A: null,
		T: null,
		S: null
	}, T = Object.prototype.hasOwnProperty;
	function E(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function te(e, t) {
		return E(e.type, t, e.props);
	}
	function ne(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function re(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ie = /\/+/g;
	function ae(e, t) {
		return typeof e == "object" && e && e.key != null ? re("" + e.key) : t.toString(36);
	}
	function oe(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(C, C) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function se(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, se(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + ae(e, 0) : a, ee(o) ? (i = "", c != null && (i = c.replace(ie, "$&/") + "/"), se(o, r, i, "", function(e) {
			return e;
		})) : o != null && (ne(o) && (o = te(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(ie, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (ee(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + ae(a, u), c += se(a, r, i, s, o);
		else if (u = h(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + ae(a, u++), c += se(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return se(oe(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function ce(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return se(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function le(e) {
		if (e._status === -1) {
			var t = e._result, n = t();
			n.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t, n.status === void 0 && (n.status = "fulfilled", n.value = t));
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t, n.status === void 0 && (n.status = "rejected", n.reason = t));
			}), e._status === -1 && (e._status = 0, e._result = n);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var ue = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	};
	function de(e) {
		var t = w.T, n = {};
		n.types = t === null ? null : t.types, w.T = n;
		try {
			var r = e(), i = w.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(C, ue);
		} catch (e) {
			ue(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), w.T = t;
		}
	}
	function D(e) {
		var t = w.T;
		if (t !== null) {
			var n = t.types;
			n === null ? t.types = [e] : n.indexOf(e) === -1 && n.push(e);
		} else de(D.bind(null, e));
	}
	var fe = {
		map: ce,
		forEach: function(e, t, n) {
			ce(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return ce(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return ce(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!ne(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = fe, e.Component = y, e.Fragment = r, e.Profiler = a, e.PureComponent = x, e.StrictMode = i, e.Suspense = l, e.ViewTransition = p, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return w.H.useMemoCache(e);
		}
	}, e.addTransitionType = D, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = _({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !T.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return E(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) T.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return E(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = ne, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: le
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = de, e.unstable_useCacheRefresh = function() {
		return w.H.useCacheRefresh();
	}, e.use = function(e) {
		return w.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return w.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return w.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return w.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return w.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return w.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return w.H.useEffectEvent(e);
	}, e.useId = function() {
		return w.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return w.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return w.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return w.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return w.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return w.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return w.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return w.H.useRef(e);
	}, e.useState = function(e) {
		return w.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return w.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return w.H.useTransition();
	}, e.version = "19.3.1";
})), i = /* @__PURE__ */ e(((e, t) => {
	t.exports = r();
})), a = /* @__PURE__ */ e(((e) => {
	var t = i();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var a = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, o = Symbol.for("react.portal"), s = Symbol.for("react.recoverable"), c = Symbol.for("react.optimistic_key");
	function l(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: o,
			key: r == null ? null : r === c ? c : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var u = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function d(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = a, e.browser = function(e) {
		return {
			$$typeof: s,
			_reason: e
		};
	}, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return l(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = u.T, n = a.p;
		try {
			if (u.T = null, a.p = 2, e) return e();
		} finally {
			u.T = t, a.p = n, a.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, a.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && a.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = d(n, t.crossOrigin), i = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? a.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: i,
				fetchPriority: o
			}) : n === "script" && a.d.X(e, {
				crossOrigin: r,
				integrity: i,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") {
			if (typeof t == "object" && t) {
				if (t.as == null || t.as === "script") {
					var n = d(t.as, t.crossOrigin);
					a.d.M(e, {
						crossOrigin: n,
						integrity: typeof t.integrity == "string" ? t.integrity : void 0,
						nonce: typeof t.nonce == "string" ? t.nonce : void 0,
						fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
					});
				}
			} else t ?? a.d.M(e);
		}
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = d(n, t.crossOrigin);
			a.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") {
			if (t) {
				var n = d(t.as, t.crossOrigin);
				a.d.m(e, {
					as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0,
					fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
				});
			} else a.d.m(e);
		}
	}, e.requestFormReset = function(e) {
		a.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return u.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return u.H.useHostTransitionStatus();
	}, e.version = "19.3.1";
})), o = /* @__PURE__ */ e(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = a();
})), s = /* @__PURE__ */ e(((e) => {
	var t = n(), r = i(), a = o();
	function s(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function c(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function l(e) {
		for (var t = e, n = t; n && !n.alternate;) t = n, t.flags & 4098 && (e = t.return), n = t.return;
		for (; t.return;) t = t.return;
		return t.tag === 3 ? e : null;
	}
	function u(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function d(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function f(e) {
		if (l(e) !== e) throw Error(s(188));
	}
	function p(e) {
		var t = e.alternate;
		if (!t) {
			if (t = l(e), t === null) throw Error(s(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var i = n.return;
			if (i === null) break;
			var a = i.alternate;
			if (a === null) {
				if (r = i.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (i.child === a.child) {
				for (a = i.child; a;) {
					if (a === n) return f(i), e;
					if (a === r) return f(i), t;
					a = a.sibling;
				}
				throw Error(s(188));
			}
			if (n.return !== r.return) n = i, r = a;
			else {
				for (var o = !1, c = i.child; c;) {
					if (c === n) {
						o = !0, n = i, r = a;
						break;
					}
					if (c === r) {
						o = !0, r = i, n = a;
						break;
					}
					c = c.sibling;
				}
				if (!o) {
					for (c = a.child; c;) {
						if (c === n) {
							o = !0, n = a, r = i;
							break;
						}
						if (c === r) {
							o = !0, r = a, n = i;
							break;
						}
						c = c.sibling;
					}
					if (!o) throw Error(s(189));
				}
			}
			if (n.alternate !== r) throw Error(s(190));
		}
		if (n.tag !== 3) throw Error(s(188));
		return n.stateNode.current === n ? e : t;
	}
	function m(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = m(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	function h(e, t, n, r, i, a) {
		for (; e !== null;) {
			if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && n(e, r, i, a) || (e.tag !== 22 || e.memoizedState === null) && (t || e.tag !== 5 && e.tag !== 27) && h(e.child, t, n, r, i, a)) return !0;
			e = e.sibling;
		}
		return !1;
	}
	function g(e) {
		for (e = e.return; e !== null;) {
			if (e.tag === 3 || e.tag === 5 || e.tag === 27) return e;
			e = e.return;
		}
		return null;
	}
	function _(e) {
		var t = !1;
		for (e = e.return; e !== null && (e.tag === 4 && (t = !0), e.tag !== 3 && e.tag !== 5 && e.tag !== 27);) e = e.return;
		return t;
	}
	function v(e) {
		var t = [null, null], n = g(e);
		return n === null || y(t, e, n.child, { foundSelf: !1 }), t;
	}
	function y(e, t, n, r) {
		for (; n !== null;) {
			if (n === t) r.foundSelf = !0;
			else if (n.tag === 5 || n.tag === 27 || n.tag === 6) {
				if (r.foundSelf) return e[1] = n, !0;
				e[0] = n;
			} else if ((n.tag !== 22 || n.memoizedState === null) && y(e, t, n.child, r)) return !0;
			n = n.sibling;
		}
		return !1;
	}
	function b(e) {
		switch (e.tag) {
			case 5:
			case 27:
			case 6: return e.stateNode;
			case 3: return e.stateNode.containerInfo;
			default: throw Error(s(559));
		}
	}
	var x = null, S = null;
	function ee(e, t, n) {
		return e === n || e === t && (x = e, !0);
	}
	function C(e, t, n) {
		return e === n ? (S = e, !1) : e === t && (S !== null && (x = e), !0);
	}
	function w(e) {
		if (e === null) return null;
		do
			e = e === null ? null : e.return;
		while (e && e.tag !== 5 && e.tag !== 27 && e.tag !== 3);
		return e || null;
	}
	function T(e, t, n) {
		for (var r = 0, i = e; i; i = n(i)) r++;
		i = 0;
		for (var a = t; a; a = n(a)) i++;
		for (; 0 < r - i;) e = n(e), r--;
		for (; 0 < i - r;) t = n(t), i--;
		for (; r--;) {
			if (e === t || t !== null && e === t.alternate) return e;
			e = n(e), t = n(t);
		}
		return null;
	}
	var E = Object.assign, te = Symbol.for("react.element"), ne = Symbol.for("react.transitional.element"), re = Symbol.for("react.portal"), ie = Symbol.for("react.fragment"), ae = Symbol.for("react.strict_mode"), oe = Symbol.for("react.profiler"), se = Symbol.for("react.consumer"), ce = Symbol.for("react.context"), le = Symbol.for("react.forward_ref"), ue = Symbol.for("react.suspense"), de = Symbol.for("react.suspense_list"), D = Symbol.for("react.memo"), fe = Symbol.for("react.lazy"), pe = Symbol.for("react.activity"), me = Symbol.for("react.legacy_hidden"), he = Symbol.for("react.memo_cache_sentinel"), O = Symbol.for("react.view_transition"), ge = Symbol.for("react.recoverable"), _e = Symbol.iterator;
	function ve(e) {
		return typeof e != "object" || !e ? null : (e = _e && e[_e] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var k = Symbol.for("react.client.reference");
	function ye(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === k ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case ie: return "Fragment";
			case oe: return "Profiler";
			case ae: return "StrictMode";
			case ue: return "Suspense";
			case de: return "SuspenseList";
			case pe: return "Activity";
			case O: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case re: return "Portal";
			case ce: return e.displayName || "Context";
			case se: return (e._context.displayName || "Context") + ".Consumer";
			case le:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case D: return t = e.displayName || null, t === null ? ye(e.type) || "Memo" : t;
			case fe:
				t = e._payload, e = e._init;
				try {
					return ye(e(t));
				} catch {}
		}
		return null;
	}
	var be = Array.isArray, A = r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, j = a.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, xe = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, Se = [], Ce = -1;
	function we(e) {
		return { current: e };
	}
	function Te(e) {
		0 > Ce || (e.current = Se[Ce], Se[Ce] = null, Ce--);
	}
	function M(e, t) {
		Ce++, Se[Ce] = e.current, e.current = t;
	}
	var Ee = we(null), De = we(null), N = we(null), Oe = we(null);
	function ke(e, t) {
		switch (M(N, t), M(De, e), M(Ee, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? up(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = up(t), e = dp(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		Te(Ee), M(Ee, e);
	}
	function Ae() {
		Te(Ee), Te(De), Te(N);
	}
	function P(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, M(Oe, e)), t = Ee.current;
		var n = dp(t, e.type);
		t !== n && (M(De, e), M(Ee, n));
	}
	function je(e) {
		De.current === e && (Te(Ee), Te(De)), Oe.current === e && (Te(Oe), sh._currentValue = xe);
	}
	var Me, Ne;
	function Pe(e) {
		if (Me === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			Me = t && t[1] || "", Ne = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + Me + e + Ne;
	}
	var Fe = !1;
	function Ie(e, t) {
		if (!e || Fe) return "";
		Fe = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							n = !1;
							try {
								var i = Object.getOwnPropertyDescriptor(e.prototype, "props");
								Object.defineProperty(e.prototype, "props", {
									configurable: !0,
									set: function() {
										throw Error();
									}
								}), n = !0, new e();
							} finally {
								n && (i === void 0 ? delete e.prototype.props : Object.defineProperty(e.prototype, "props", i));
							}
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			Fe = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? Pe(n) : "";
	}
	function F(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return Pe(e.type);
			case 16: return Pe("Lazy");
			case 13: return e.child !== t && t !== null ? Pe("Suspense Fallback") : Pe("Suspense");
			case 19: return Pe("SuspenseList");
			case 0:
			case 15: return Ie(e.type, !1);
			case 11: return Ie(e.type.render, !1);
			case 1: return Ie(e.type, !0);
			case 31: return Pe("Activity");
			case 30: return Pe("ViewTransition");
			default: return "";
		}
	}
	function I(e) {
		try {
			var t = "", n = null;
			do
				t += F(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var Le = Object.prototype.hasOwnProperty, L = t.unstable_scheduleCallback, R = t.unstable_cancelCallback, Re = t.unstable_shouldYield, ze = t.unstable_requestPaint, z = t.unstable_now, B = t.unstable_getCurrentPriorityLevel, Be = t.unstable_ImmediatePriority, Ve = t.unstable_UserBlockingPriority, V = t.unstable_NormalPriority, He = t.unstable_LowPriority, Ue = t.unstable_IdlePriority, We = t.log, Ge = t.unstable_setDisableYieldValue, Ke = null, qe = null;
	function Je(e) {
		if (typeof We == "function" && Ge(e), qe && typeof qe.setStrictMode == "function") try {
			qe.setStrictMode(Ke, e);
		} catch {}
	}
	var Ye = Math.clz32 ? Math.clz32 : Qe, Xe = Math.log, Ze = Math.LN2;
	function Qe(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Xe(e) / Ze | 0) | 0;
	}
	var $e = 256, et = 262144, tt = 4194304;
	function nt(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & -e;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function rt(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = nt(n))) : i = nt(o) : i = nt(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = nt(n))) : i = nt(o)) : i = nt(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function it(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function at(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - Ye(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function ot(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function st() {
		var e = tt;
		return tt <<= 1, !(tt & 62914560) && (tt = 4194304), e;
	}
	function ct(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function lt(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function ut(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Ye(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && dt(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function dt(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Ye(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function ft(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Ye(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function pt(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : mt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function mt(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function ht(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function gt() {
		var e = j.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function _t(e, t) {
		var n = j.p;
		try {
			return j.p = e, t();
		} finally {
			j.p = n;
		}
	}
	var vt = Math.random().toString(36).slice(2), yt = "__reactFiber$" + vt, bt = "__reactProps$" + vt, xt = "__reactContainer$" + vt, St = "__reactEvents$" + vt, Ct = "__reactListeners$" + vt, wt = "__reactHandles$" + vt, Tt = "__reactResources$" + vt, Et = "__reactMarker$" + vt, Dt = "__reactLoad$" + vt;
	function Ot(e) {
		delete e[yt], delete e[bt], delete e[Ct], delete e[wt];
	}
	function kt(e) {
		var t;
		if (t = e[yt]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[xt] || n[yt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[yt]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function At(e) {
		if (e = e[yt] || e[xt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function jt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(s(33));
	}
	function Mt(e) {
		var t = e[Tt];
		return t ||= e[Tt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function Nt(e) {
		e[Et] = !0;
	}
	function Pt(e) {
		e[Dt] = void 0;
	}
	var Ft = /* @__PURE__ */ new Set(), It = {};
	function Lt(e, t) {
		Rt(e, t), Rt(e + "Capture", t);
	}
	function Rt(e, t) {
		for (It[e] = t, e = 0; e < t.length; e++) Ft.add(t[e]);
	}
	var zt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Bt = {}, Vt = {};
	function Ht(e) {
		return Le.call(Vt, e) ? !0 : Le.call(Bt, e) ? !1 : zt.test(e) ? Vt[e] = !0 : (Bt[e] = !0, !1);
	}
	var H = !1;
	function Ut() {
		var e = H;
		return H = !1, e;
	}
	function Wt(e, t, n) {
		if (Ht(t)) {
			if (n === null) e.removeAttribute(t);
			else {
				switch (typeof n) {
					case "undefined":
					case "function":
					case "symbol":
						e.removeAttribute(t);
						return;
					case "boolean":
						var r = t.toLowerCase().slice(0, 5);
						if (r !== "data-" && r !== "aria-") {
							e.removeAttribute(t);
							return;
						}
				}
				e.setAttribute(t, n);
			}
		}
	}
	function Gt(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, n);
		}
	}
	function Kt(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, r);
		}
	}
	function qt(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function Jt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Yt(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function Xt(e) {
		if (!e._valueTracker) {
			var t = Jt(e) ? "checked" : "value";
			e._valueTracker = Yt(e, t, "" + e[t]);
		}
	}
	function Zt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Jt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var Qt = /[\n"\\]/g;
	function $t(e) {
		return e.replace(Qt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function U(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + qt(t)) : e.value !== "" + qt(t) && (e.value = "" + qt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : tn(e, qt(n)) : o === "number" && e.value == t ? tn(e, qt(e.value)) : tn(e, qt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + qt(s) : e.removeAttribute("name");
	}
	function en(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Xt(e);
				return;
			}
			n = n == null ? "" : "" + qt(n), t = t == null ? n : "" + qt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Xt(e);
	}
	function tn(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function nn(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + qt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function rn(e, t, n) {
		t != null && (t = "" + qt(t), t !== e.value && (e.value = t), n == null) ? e.defaultValue !== t && (e.defaultValue = t) : e.defaultValue = n == null ? "" : "" + qt(n);
	}
	function an(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(s(92));
				if (be(r)) {
					if (1 < r.length) throw Error(s(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = qt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Xt(e);
	}
	function W(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var on = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function sn(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || on.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function cn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(s(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", H = !0);
			for (var i in t) r = t[i], t.hasOwnProperty(i) && n[i] !== r && (sn(e, i, r), H = !0);
		} else for (var a in t) t.hasOwnProperty(a) && sn(e, a, t[a]);
	}
	function ln(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var un = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["maskType", "mask-type"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), dn = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function fn(e) {
		return dn.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function pn() {}
	var mn = null;
	function hn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var gn = null, _n = null;
	function vn(e) {
		var t = At(e);
		if (t && (e = t.stateNode)) {
			var n = e[bt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (U(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + $t("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var i = r[bt] || null;
								if (!i) throw Error(s(90));
								U(r, i.value, i.defaultValue, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Zt(r);
					}
					break a;
				case "textarea":
					rn(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && nn(e, !!n.multiple, t, !1);
			}
		}
	}
	var yn = !1;
	function bn(e, t, n) {
		if (yn) return e(t, n);
		yn = !0;
		try {
			return e(t);
		} finally {
			if (yn = !1, (gn !== null || _n !== null) && (Ld(), gn && (t = gn, e = _n, _n = gn = null, vn(t), e))) for (t = 0; t < e.length; t++) vn(e[t]);
		}
	}
	function xn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[bt] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(s(231, t, typeof n));
		return n;
	}
	var Sn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, Cn = !1;
	if (Sn) try {
		var wn = {};
		Object.defineProperty(wn, "passive", { get: function() {
			Cn = !0;
		} }), window.addEventListener("test", wn, wn), window.removeEventListener("test", wn, wn);
	} catch {
		Cn = !1;
	}
	var Tn = null, En = null, Dn = null;
	function On() {
		if (Dn) return Dn;
		var e, t = En, n = t.length, r, i = "value" in Tn ? Tn.value : Tn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return Dn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function kn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function An() {
		return !0;
	}
	function jn() {
		return !1;
	}
	function Mn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? An : jn, this.isPropagationStopped = jn, this;
		}
		return E(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = An);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = An);
			},
			persist: function() {},
			isPersistent: An
		}), t;
	}
	var Nn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Pn = Mn(Nn), Fn = E({}, Nn, {
		view: 0,
		detail: 0
	}), In = Mn(Fn), Ln, Rn, zn, Bn = E({}, Fn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Zn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== zn && (zn && e.type === "mousemove" ? (Ln = e.screenX - zn.screenX, Rn = e.screenY - zn.screenY) : Rn = Ln = 0, zn = e), Ln);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Rn;
		}
	}), Vn = Mn(Bn), Hn = Mn(E({}, Bn, { dataTransfer: 0 })), Un = Mn(E({}, Fn, { relatedTarget: 0 })), Wn = Mn(E({}, Nn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Gn = Mn(E({}, Nn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Kn = Mn(E({}, Nn, { data: 0 })), qn = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, Jn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, Yn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Xn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Yn[e]) ? !!t[e] : !1;
	}
	function Zn() {
		return Xn;
	}
	var Qn = Mn(E({}, Fn, {
		key: function(e) {
			if (e.key) {
				var t = qn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = kn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Jn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Zn,
		charCode: function(e) {
			return e.type === "keypress" ? kn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? kn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), $n = Mn(E({}, Bn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), er = Mn(E({}, Nn, { submitter: 0 })), tr = Mn(E({}, Fn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Zn
	})), nr = Mn(E({}, Nn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), rr = Mn(E({}, Bn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), ir = Mn(E({}, Nn, {
		newState: 0,
		oldState: 0,
		source: 0
	})), ar = [
		9,
		13,
		27,
		32
	], or = Sn && "CompositionEvent" in window, sr = null;
	Sn && "documentMode" in document && (sr = document.documentMode);
	var cr = Sn && "TextEvent" in window && !sr, lr = Sn && (!or || sr && 8 < sr && 11 >= sr), ur = " ", dr = !1;
	function fr(e, t) {
		switch (e) {
			case "keyup": return ar.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function pr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var mr = !1;
	function hr(e, t) {
		switch (e) {
			case "compositionend": return pr(t);
			case "keypress": return t.which === 32 ? (dr = !0, ur) : null;
			case "textInput": return e = t.data, e === ur && dr ? null : e;
			default: return null;
		}
	}
	function gr(e, t) {
		if (mr) return e === "compositionend" || !or && fr(e, t) ? (e = On(), Dn = En = Tn = null, mr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return lr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var _r = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function vr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!_r[e.type] : t === "textarea";
	}
	function yr(e, t, n, r) {
		gn ? _n ? _n.push(r) : _n = [r] : gn = r, t = qf(t, "onChange"), 0 < t.length && (n = new Pn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var br = null, xr = null;
	function Sr(e) {
		Bf(e, 0);
	}
	function Cr(e) {
		if (Zt(jt(e))) return e;
	}
	function wr(e, t) {
		if (e === "change") return t;
	}
	var Tr = !1;
	if (Sn) {
		var Er;
		if (Sn) {
			var Dr = "oninput" in document;
			if (!Dr) {
				var Or = document.createElement("div");
				Or.setAttribute("oninput", "return;"), Dr = typeof Or.oninput == "function";
			}
			Er = Dr;
		} else Er = !1;
		Tr = Er && (!document.documentMode || 9 < document.documentMode);
	}
	function kr() {
		br && (br.detachEvent("onpropertychange", Ar), xr = br = null);
	}
	function Ar(e) {
		if (e.propertyName === "value" && Cr(xr)) {
			var t = [];
			yr(t, xr, e, hn(e)), bn(Sr, t);
		}
	}
	function jr(e, t, n) {
		e === "focusin" ? (kr(), br = t, xr = n, br.attachEvent("onpropertychange", Ar)) : e === "focusout" && kr();
	}
	function Mr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return Cr(xr);
	}
	function Nr(e, t) {
		if (e === "click") return Cr(t);
	}
	function Pr(e, t) {
		if (e === "input" || e === "change") return Cr(t);
	}
	function Fr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Ir = typeof Object.is == "function" ? Object.is : Fr;
	function Lr(e, t) {
		if (Ir(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!Le.call(t, i) || !Ir(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Rr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function zr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Br(e, t) {
		var n = zr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = zr(n);
		}
	}
	function Vr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Vr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Hr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Rr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Rr(e.document);
		}
		return t;
	}
	function Ur(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Wr = Sn && "documentMode" in document && 11 >= document.documentMode, Gr = null, Kr = null, qr = null, Jr = !1;
	function Yr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Jr || Gr == null || Gr !== Rr(r) || (r = Gr, "selectionStart" in r && Ur(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), qr && Lr(qr, r) || (qr = r, r = qf(Kr, "onSelect"), 0 < r.length && (t = new Pn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Gr)));
	}
	function Xr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Zr = {
		animationend: Xr("Animation", "AnimationEnd"),
		animationiteration: Xr("Animation", "AnimationIteration"),
		animationstart: Xr("Animation", "AnimationStart"),
		transitionrun: Xr("Transition", "TransitionRun"),
		transitionstart: Xr("Transition", "TransitionStart"),
		transitioncancel: Xr("Transition", "TransitionCancel"),
		transitionend: Xr("Transition", "TransitionEnd")
	}, Qr = {}, $r = {};
	Sn && ($r = document.createElement("div").style, "AnimationEvent" in window || (delete Zr.animationend.animation, delete Zr.animationiteration.animation, delete Zr.animationstart.animation), "TransitionEvent" in window || delete Zr.transitionend.transition);
	function ei(e) {
		if (Qr[e]) return Qr[e];
		if (!Zr[e]) return e;
		var t = Zr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in $r) return Qr[e] = t[n];
		return e;
	}
	var ti = ei("animationend"), ni = ei("animationiteration"), ri = ei("animationstart"), ii = ei("transitionrun"), ai = ei("transitionstart"), oi = ei("transitioncancel"), si = ei("transitionend"), ci = /* @__PURE__ */ new Map(), li = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	li.push("scrollEnd");
	function ui(e, t) {
		ci.set(e, t), Lt(t, [e]);
	}
	var di = 0;
	function fi(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = vd.identifierPrefix;
		var n = di++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function pi(e) {
		if (e == null || typeof e == "string") return e;
		var t = null, n = Ed;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = e[n[r]];
			if (i != null) {
				if (i === "none") return "none";
				t = t == null ? i : t + (" " + i);
			}
		}
		return t ?? e.default;
	}
	function mi(e, t) {
		return e = pi(e), t = pi(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var hi = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, gi = [], _i = 0, vi = 0;
	function yi() {
		for (var e = _i, t = vi = _i = 0; t < e;) {
			var n = gi[t];
			gi[t++] = null;
			var r = gi[t];
			gi[t++] = null;
			var i = gi[t];
			gi[t++] = null;
			var a = gi[t];
			if (gi[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && Ci(n, i, a);
		}
	}
	function bi(e, t, n, r) {
		gi[_i++] = e, gi[_i++] = t, gi[_i++] = n, gi[_i++] = r, vi |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function xi(e, t, n, r) {
		return bi(e, t, n, r), wi(e);
	}
	function Si(e, t) {
		return bi(e, null, null, t), wi(e);
	}
	function Ci(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Ye(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function wi(e) {
		if (50 < Dd) throw Dd = 0, Od = null, Error(s(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var Ti = {};
	function Ei(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function Di(e, t, n, r) {
		return new Ei(e, t, n, r);
	}
	function Oi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function ki(e, t) {
		var n = e.alternate;
		return n === null ? (n = Di(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function Ai(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function ji(e, t, n, r, i, a) {
		var o = 0;
		if (r = e, typeof r == "function") Oi(r) && (o = 1);
		else if (typeof r == "string") o = qm(e, n, Ee.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case pe: return e = Di(31, n, t, i), e.elementType = pe, e.lanes = a, e;
			case ie: return Mi(n.children, i, a, t);
			case ae:
				o = 8, i |= 24;
				break;
			case oe: return e = Di(12, n, t, i | 2), e.elementType = oe, e.lanes = a, e;
			case ue: return e = Di(13, n, t, i), e.elementType = ue, e.lanes = a, e;
			case de: return e = Di(19, n, t, i), e.elementType = de, e.lanes = a, e;
			case me:
			case O: return e = i | 32, e = Di(30, n, t, e), e.elementType = O, e.lanes = a, e.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, e;
			default:
				if (typeof r == "object" && r) switch (r.$$typeof) {
					case ce:
						o = 10;
						break a;
					case se:
						o = 9;
						break a;
					case le:
						o = 11;
						break a;
					case D:
						o = 14;
						break a;
					case fe:
						o = 16, r = null;
						break a;
				}
				o = 29, n = Error(s(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = Di(o, n, t, i), t.elementType = e, t.type = r, t.lanes = a, t;
	}
	function Mi(e, t, n, r) {
		return e = Di(7, e, r, t), e.lanes = n, e;
	}
	function Ni(e, t, n) {
		return e = Di(6, e, null, t), e.lanes = n, e;
	}
	function Pi(e) {
		var t = Di(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function Fi(e, t, n) {
		return t = Di(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Ii = /* @__PURE__ */ new WeakMap();
	function Li(e, t) {
		if (typeof e == "object" && e) {
			var n = Ii.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: I(t)
			}, Ii.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: I(t)
		};
	}
	var Ri = [], zi = 0, Bi = null, Vi = 0, Hi = [], Ui = 0, Wi = null, Gi = 1, Ki = "";
	function qi(e, t) {
		Ri[zi++] = Vi, Ri[zi++] = Bi, Bi = e, Vi = t;
	}
	function Ji(e, t, n) {
		Hi[Ui++] = Gi, Hi[Ui++] = Ki, Hi[Ui++] = Wi, Wi = e;
		var r = Gi;
		e = Ki;
		var i = 32 - Ye(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Ye(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Gi = 1 << 32 - Ye(t) + i | n << i | r, Ki = a + e;
		} else Gi = 1 << a | n << i | r, Ki = e;
	}
	function Yi(e) {
		e.return !== null && (qi(e, 1), Ji(e, 1, 0));
	}
	function Xi(e) {
		for (; e === Bi;) Bi = Ri[--zi], Ri[zi] = null, Vi = Ri[--zi], Ri[zi] = null;
		for (; e === Wi;) Wi = Hi[--Ui], Hi[Ui] = null, Ki = Hi[--Ui], Hi[Ui] = null, Gi = Hi[--Ui], Hi[Ui] = null;
	}
	function Zi(e, t) {
		Hi[Ui++] = Gi, Hi[Ui++] = Ki, Hi[Ui++] = Wi, Gi = t.id, Ki = t.overflow, Wi = e;
	}
	var Qi = null, G = null, K = !1, $i = null, ea = !1, ta = Error(s(519));
	function na(e) {
		throw ca(Li(Error(s(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), ta;
	}
	function ra(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[yt] = e, t[bt] = r, n) {
			case "dialog":
				$("cancel", t), $("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				$("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < Rf.length; n++) $(Rf[n], t);
				break;
			case "source":
				$("error", t);
				break;
			case "img":
			case "image":
			case "link":
				$("error", t), $("load", t);
				break;
			case "details":
				$("toggle", t);
				break;
			case "input":
				$("invalid", t), en(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				$("invalid", t);
				break;
			case "textarea": $("invalid", t), an(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || $f(t.textContent, n) ? (r.popover != null && ($("beforetoggle", t), $("toggle", t)), r.onScroll != null && $("scroll", t), r.onScrollEnd != null && $("scrollend", t), r.onClick != null && (t.onclick = pn), t = !0) : t = !1, t || na(e, !0);
	}
	function ia(e) {
		for (Qi = e.return; Qi;) switch (Qi.tag) {
			case 5:
			case 31:
			case 13:
				ea = !1;
				return;
			case 27:
			case 3:
				ea = !0;
				return;
			default: Qi = Qi.return;
		}
	}
	function aa(e) {
		if (e !== Qi) return !1;
		if (!K) return ia(e), K = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && G && na(e), ia(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(317));
			G = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(317));
			G = dm(e);
		} else t === 27 ? (t = G, Sp(e.type) ? (e = um, um = null, G = e) : G = t) : G = Qi ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function oa() {
		G = Qi = null, K = !1;
	}
	function sa() {
		var e = $i;
		return e !== null && (ud === null ? ud = e : ud.push.apply(ud, e), $i = null), e;
	}
	function ca(e) {
		$i === null ? $i = [e] : $i.push(e);
	}
	var la = we(null), ua = null, da = null;
	function fa(e, t, n) {
		M(la, t._currentValue), t._currentValue = n;
	}
	function pa(e) {
		e._currentValue = la.current, Te(la);
	}
	function ma(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function ha(e, t, n, r) {
		var i = e.child;
		for (i !== null && (i.return = e); i !== null;) {
			var a = i.dependencies;
			if (a !== null) {
				var o = i.child;
				a = a.firstContext;
				a: for (; a !== null;) {
					var c = a;
					a = i;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						a.lanes |= n, c = a.alternate, c !== null && (c.lanes |= n), ma(a.return, n, e), r || (o = null);
						break a;
					}
					a = c.next;
				}
			} else if (i.tag === 18) {
				if (o = i.return, o === null) throw Error(s(341));
				o.lanes |= n, a = o.alternate, a !== null && (a.lanes |= n), ma(o, n, e), o = null;
			} else i.tag === 13 && i.memoizedState !== null && i.memoizedState.dehydrated === null ? (i.lanes |= n, o = i.alternate, o !== null && (o.lanes |= n), ma(i.return, n, e), o = i.child, o = o === null ? null : o.sibling) : o = i.child;
			if (o !== null) o.return = i;
			else for (o = i; o !== null;) {
				if (o === e) {
					o = null;
					break;
				}
				if (i = o.sibling, i !== null) {
					i.return = o.return, o = i;
					break;
				}
				o = o.return;
			}
			i = o;
		}
	}
	function ga(e, t, n, r) {
		e = null;
		for (var i = t, a = !1; i !== null;) {
			if (!a) {
				if (i.flags & 524288) a = !0;
				else if (i.flags & 262144) break;
			}
			if (i.tag === 10) {
				var o = i.alternate;
				if (o === null) throw Error(s(387));
				if (o = o.memoizedProps, o !== null) {
					var c = i.type;
					Ir(i.pendingProps.value, o.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (i === Oe.current) {
				if (o = i.alternate, o === null) throw Error(s(387));
				o.memoizedState.memoizedState !== i.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			i = i.return;
		}
		return e !== null && ha(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function _a(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Ir(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function va(e) {
		ua = e, da = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function ya(e) {
		return xa(ua, e);
	}
	function ba(e, t) {
		return ua === null && va(e), xa(e, t);
	}
	function xa(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, da === null) {
			if (e === null) throw Error(s(308));
			da = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else da = da.next = t;
		return n;
	}
	var Sa = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, Ca = t.unstable_scheduleCallback, wa = t.unstable_NormalPriority, Ta = {
		$$typeof: ce,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function Ea() {
		return {
			controller: new Sa(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function Da(e) {
		e.refCount--, e.refCount === 0 && Ca(wa, function() {
			e.controller.abort();
		});
	}
	function Oa(e, t) {
		if (e.pendingLanes & 4194048) {
			var n = e.transitionTypes;
			for (n === null && (n = e.transitionTypes = []), e = 0; e < t.length; e++) {
				var r = t[e];
				n.indexOf(r) === -1 && n.push(r);
			}
		}
	}
	var ka = null;
	function Aa(e) {
		var t = e.transitionTypes;
		return e.transitionTypes = null, t;
	}
	var ja = null, Ma = 0, Na = 0, Pa = null;
	function Fa(e, t) {
		if (ja === null) {
			var n = ja = [];
			Ma = 0, Na = Nf(), Pa = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return Ma++, t.then(Ia, Ia), t;
	}
	function Ia() {
		if (--Ma === 0 && (ka = null, ja !== null)) {
			Pa !== null && (Pa.status = "fulfilled");
			var e = ja;
			ja = null, Na = 0, Pa = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function La(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var Ra = A.S;
	A.S = function(e, t) {
		if (pd = z(), typeof t == "object" && t && typeof t.then == "function" && Fa(e, t), ka !== null) for (var n = yf; n !== null;) Oa(n, ka), n = n.next;
		if (n = e.types, n !== null) {
			for (var r = yf; r !== null;) Oa(r, n), r = r.next;
			if (Na !== 0) {
				r = ka, r === null && (r = ka = []);
				for (var i = 0; i < n.length; i++) {
					var a = n[i];
					r.indexOf(a) === -1 && r.push(a);
				}
			}
		}
		Ra !== null && Ra(e, t);
	};
	var za = we(null);
	function Ba() {
		var e = za.current;
		return e === null ? Xu.pooledCache : e;
	}
	function Va(e, t) {
		t === null ? M(za, za.current) : M(za, t.pool);
	}
	function Ha() {
		var e = Ba();
		return e === null ? null : {
			parent: Ta._currentValue,
			pool: e
		};
	}
	var Ua = Error(s(460)), Wa = Error(s(474)), Ga = Error(s(542)), Ka = { then: function() {} };
	function qa(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Ja(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(pn, pn), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Qa(e), e === void 0 && !("reason" in t) ? Error(s(600)) : e;
			default:
				if (typeof t.status == "string") t.then(pn, pn);
				else {
					if (e = Xu, e !== null && 100 < e.shellSuspendCounter) throw Error(s(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, Qa(e), e;
				}
				throw Xa = t, Ua;
		}
	}
	function Ya(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Xa = e, Ua) : e;
		}
	}
	var Xa = null;
	function Za() {
		if (Xa === null) throw Error(s(459));
		var e = Xa;
		return Xa = null, e;
	}
	function Qa(e) {
		if (e === Ua || e === Ga) throw Error(s(483));
	}
	var $a = null, eo = 0;
	function to(e) {
		var t = eo;
		return eo += 1, $a === null && ($a = []), Ja($a, e, t);
	}
	function no(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function ro(e, t) {
		throw t.$$typeof === te ? Error(s(525)) : (e = Object.prototype.toString.call(t), Error(s(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function io(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function i(e, t) {
			return e = ki(e, t), e.index = 0, e.sibling = null, e;
		}
		function a(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function o(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Ni(n, e.mode, r), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var a = n.type;
			return a === ie ? (e = d(e, t, n.props.children, r, n.key), no(e, n), e) : t !== null && (t.elementType === a || typeof a == "object" && a && a.$$typeof === fe && Ya(a) === t.type) ? (t = i(t, n.props), no(t, n), t.return = e, t) : (t = ji(n.type, n.key, n.props, null, e.mode, r), no(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = Fi(n, e.mode, r), t.return = e, t) : (t = i(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, a) {
			return t === null || t.tag !== 7 ? (t = Mi(n, e.mode, r, a), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Ni("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case ne: return n = ji(t.type, t.key, t.props, null, e.mode, n), no(n, t), n.return = e, n;
					case re: return t = Fi(t, e.mode, n), t.return = e, t;
					case fe: return t = Ya(t), f(e, t, n);
				}
				if (be(t) || ve(t)) return t = Mi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, to(t), n);
				if (t.$$typeof === ce) return f(e, ba(e, t), n);
				ro(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case ne: return n.key === i ? l(e, t, n, r) : null;
					case re: return n.key === i ? u(e, t, n, r) : null;
					case fe: return n = Ya(n), p(e, t, n, r);
				}
				if (be(n) || ve(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, to(n), r);
				if (n.$$typeof === ce) return p(e, t, ba(e, n), r);
				ro(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case ne: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case re: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case fe: return r = Ya(r), m(e, t, n, r, i);
				}
				if (be(r) || ve(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, to(r), i);
				if (r.$$typeof === ce) return m(e, t, n, ba(t, r), i);
				ro(t, r);
			}
			return null;
		}
		function h(i, o, s, c) {
			for (var l = null, u = null, d = o, h = o = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), o = a(_, o, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), K && qi(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (o = a(d, o, h), u === null ? l = d : u.sibling = d, u = d);
				return K && qi(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), o = a(g, o, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), K && qi(i, h), l;
		}
		function g(i, o, c, l) {
			if (c == null) throw Error(s(151));
			for (var u = null, d = null, h = o, g = o = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(i, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(i, h), o = a(y, o, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(i, h), K && qi(i, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(i, v.value, l), v !== null && (o = a(v, o, g), d === null ? u = v : d.sibling = v, d = v);
				return K && qi(i, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, i, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), o = a(v, o, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(i, e);
			}), K && qi(i, g), u;
		}
		function _(e, r, a, c) {
			if (typeof a == "object" && a && a.type === ie && a.key === null && a.props.ref === void 0 && (a = a.props.children), typeof a == "object" && a) {
				switch (a.$$typeof) {
					case ne:
						a: {
							for (var l = a.key; r !== null;) {
								if (r.key === l) {
									if (l = a.type, l === ie) {
										if (r.tag === 7) {
											n(e, r.sibling), c = i(r, a.props.children), no(c, a), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === fe && Ya(l) === r.type) {
										n(e, r.sibling), c = i(r, a.props), no(c, a), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							a.type === ie ? (c = Mi(a.props.children, e.mode, c, a.key), no(c, a), c.return = e, e = c) : (c = ji(a.type, a.key, a.props, null, e.mode, c), no(c, a), c.return = e, e = c);
						}
						return o(e);
					case re:
						a: {
							for (l = a.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === a.containerInfo && r.stateNode.implementation === a.implementation) {
										n(e, r.sibling), c = i(r, a.children || []), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = Fi(a, e.mode, c), c.return = e, e = c;
						}
						return o(e);
					case fe: return a = Ya(a), _(e, r, a, c);
				}
				if (be(a)) return h(e, r, a, c);
				if (ve(a)) {
					if (l = ve(a), typeof l != "function") throw Error(s(150));
					return a = l.call(a), g(e, r, a, c);
				}
				if (typeof a.then == "function") return _(e, r, to(a), c);
				if (a.$$typeof === ce) return _(e, r, ba(e, a), c);
				ro(e, a);
			}
			return typeof a == "string" && a !== "" || typeof a == "number" || typeof a == "bigint" ? (a = "" + a, r !== null && r.tag === 6 ? (n(e, r.sibling), c = i(r, a), c.return = e, e = c) : (n(e, r), c = Ni(a, e.mode, c), c.return = e, e = c), o(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				eo = 0;
				var i = _(e, t, n, r);
				return $a = null, i;
			} catch (t) {
				if (t === Ua || t === Ga) throw t;
				var a = Di(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var ao = io(!0), oo = io(!1), so = !1;
	function co(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function lo(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function uo(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function fo(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, X & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = wi(e), Ci(e, null, n), t;
		}
		return bi(e, r, t, n), wi(e);
	}
	function po(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ft(e, n);
		}
	}
	function mo(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
		} else e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var ho = !1;
	function go() {
		if (ho) {
			var e = Pa;
			if (e !== null) throw e;
		}
	}
	function _o(e, t, n, r) {
		ho = !1;
		var i = e.updateQueue;
		so = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (Q & f) === f : (r & f) === f) {
					f !== 0 && f === Na && (ho = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, h = s;
						f = t;
						var g = n;
						switch (h.tag) {
							case 1:
								if (m = h.payload, typeof m == "function") {
									d = m.call(g, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = h.payload, f = typeof m == "function" ? m.call(g, d, f) : m, f == null) break a;
								d = E({}, d, f);
								break a;
							case 2: so = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), id |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function vo(e, t) {
		if (typeof e != "function") throw Error(s(191, e));
		e.call(t);
	}
	function yo(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) vo(n[e], t);
	}
	var bo = we(null), xo = we(0);
	function So(e, t) {
		e = nd, M(xo, e), M(bo, t), nd = e | t.baseLanes;
	}
	function Co() {
		M(xo, nd), M(bo, bo.current);
	}
	function wo() {
		nd = xo.current, Te(bo), Te(xo);
	}
	var q = we(null), To = null;
	function Eo(e) {
		var t = e.alternate;
		M(jo, jo.current & 1), M(q, e), To === null && (t === null || bo.current !== null || t.memoizedState !== null) && (To = e);
	}
	function Do(e) {
		M(jo, jo.current), M(q, e), To === null && (To = e);
	}
	function Oo(e) {
		e.tag === 22 ? (M(jo, jo.current), M(q, e), To === null && (To = e)) : ko();
	}
	function ko() {
		M(jo, jo.current), M(q, q.current);
	}
	function Ao(e) {
		Te(q), To === e && (To = null), Te(jo);
	}
	var jo = we(0);
	function Mo(e, t) {
		M(q, q.current), M(jo, t);
	}
	function No(e) {
		Te(jo), Te(q), To === e && (To = null);
	}
	function Po(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || om(n) || sm(n))) return t;
			} else if (t.tag === 19 && t.memoizedProps.revealOrder !== "independent") {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var Fo = 0, J = null, Io = null, Lo = null, Ro = !1, zo = !1, Bo = !1, Vo = 0, Ho = 0, Uo = null, Wo = 0;
	function Go() {
		throw Error(s(321));
	}
	function Ko(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Ir(e[n], t[n])) return !1;
		return !0;
	}
	function qo(e, t, n, r, i, a) {
		return Fo = a, J = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, A.H = e === null || e.memoizedState === null ? uc : dc, Bo = !1, a = n(r, i), Bo = !1, zo && (a = Yo(t, n, r, i)), Jo(e), a;
	}
	function Jo(e) {
		A.H = lc;
		var t = Io !== null && Io.next !== null;
		if (Fo = 0, Lo = Io = J = null, Ro = !1, Ho = 0, Uo = null, t) throw Error(s(300));
		e === null || Oc || (e = e.dependencies, e !== null && _a(e) && (Oc = !0));
	}
	function Yo(e, t, n, r) {
		J = e;
		var i = 0;
		do {
			if (zo && (Uo = null), Ho = 0, zo = !1, 25 <= i) throw Error(s(301));
			if (i += 1, Lo = Io = null, e.updateQueue != null) {
				var a = e.updateQueue;
				a.lastEffect = null, a.events = null, a.stores = null, a.memoCache != null && (a.memoCache.index = 0);
			}
			A.H = fc, a = t(n, r);
		} while (zo);
		return a;
	}
	function Xo() {
		var e = A.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? rs(t) : t, e = e.useState()[0], (Io === null ? null : Io.memoizedState) !== e && (J.flags |= 1024), t;
	}
	function Zo() {
		var e = Vo !== 0;
		return Vo = 0, e;
	}
	function Qo(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function $o(e) {
		if (Ro) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			Ro = !1;
		}
		Fo = 0, Lo = Io = J = null, zo = !1, Ho = Vo = 0, Uo = null;
	}
	function es() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return Lo === null ? J.memoizedState = Lo = e : Lo = Lo.next = e, Lo;
	}
	function ts() {
		if (Io === null) {
			var e = J.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = Io.next;
		var t = Lo === null ? J.memoizedState : Lo.next;
		if (t !== null) Lo = t, Io = e;
		else {
			if (e === null) throw J.alternate === null ? Error(s(467)) : Error(s(310));
			Io = e, e = {
				memoizedState: Io.memoizedState,
				baseState: Io.baseState,
				baseQueue: Io.baseQueue,
				queue: Io.queue,
				next: null
			}, Lo === null ? J.memoizedState = Lo = e : Lo = Lo.next = e;
		}
		return Lo;
	}
	function ns() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function rs(e) {
		var t = Ho;
		return Ho += 1, Uo === null && (Uo = []), e = Ja(Uo, e, t), t = J, (Lo === null ? t.memoizedState : Lo.next) === null && (t = t.alternate, A.H = t === null || t.memoizedState === null ? uc : dc), e;
	}
	function is(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return rs(e);
			if (e.$$typeof === ge) return;
			if (e.$$typeof === ce) return ya(e);
		}
		throw Error(s(438, String(e)));
	}
	function as(e) {
		var t = null, n = J.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = J.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = ns(), J.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = he;
		return t.index++, n;
	}
	function os(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function ss(e) {
		return cs(ts(), Io, e);
	}
	function cs(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(s(311));
		r.lastRenderedReducer = n;
		var i = e.baseQueue, a = r.pending;
		if (a !== null) {
			if (i !== null) {
				var o = i.next;
				i.next = a.next, a.next = o;
			}
			t.baseQueue = i = a, r.pending = null;
		}
		if (a = e.baseState, i === null) e.memoizedState = a;
		else {
			t = i.next;
			var c = o = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (Fo & f) === f : (Q & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === Na && (d = !0);
					else if ((Fo & p) === p) {
						u = u.next, p === Na && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, o = a) : l = l.next = f, J.lanes |= p, id |= p;
					f = u.action, Bo && n(a, f), a = u.hasEagerState ? u.eagerState : n(a, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, o = a) : l = l.next = p, J.lanes |= f, id |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? o = a : l.next = c, !Ir(a, e.memoizedState) && (Oc = !0, d && (n = Pa, n !== null))) throw n;
			e.memoizedState = a, e.baseState = o, e.baseQueue = l, r.lastRenderedState = a;
		}
		return i === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function ls(e) {
		var t = ts(), n = t.queue;
		if (n === null) throw Error(s(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, i = n.pending, a = t.memoizedState;
		if (i !== null) {
			n.pending = null;
			var o = i = i.next;
			do
				a = e(a, o.action), o = o.next;
			while (o !== i);
			Ir(a, t.memoizedState) || (Oc = !0), t.memoizedState = a, t.baseQueue === null && (t.baseState = a), n.lastRenderedState = a;
		}
		return [a, r];
	}
	function us(e, t, n) {
		var r = J, i = ts(), a = K;
		if (a) {
			if (n === void 0) throw Error(s(407));
			n = n();
		} else n = t();
		var o = !Ir((Io || i).memoizedState, n);
		if (o && (i.memoizedState = n, Oc = !0), i = i.queue, Fs(ps.bind(null, r, i, e), [e]), e = i.getSnapshot !== t || o || Lo !== null && !!(Lo.memoizedState.tag & 1), As(e ? 9 : 8, { destroy: void 0 }, fs.bind(null, r, i, n, t), null), e) {
			if (r.flags |= 2048, Xu === null) throw Error(s(349));
			a || Fo & 127 || ds(r, t, n);
		}
		return n;
	}
	function ds(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = J.updateQueue, t === null ? (t = ns(), J.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function fs(e, t, n, r) {
		t.value = n, t.getSnapshot = r, ms(t) && hs(e);
	}
	function ps(e, t, n) {
		return n(function() {
			ms(t) && hs(e);
		});
	}
	function ms(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Ir(e, n);
		} catch {
			return !0;
		}
	}
	function hs(e) {
		var t = Si(e, 2);
		t !== null && Md(t, e, 2);
	}
	function gs(e) {
		var t = es();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Bo) {
				Je(!0);
				try {
					n();
				} finally {
					Je(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: os,
			lastRenderedState: e
		}, t;
	}
	function _s(e, t, n, r) {
		return e.baseState = n, cs(e, Io, typeof r == "function" ? r : os);
	}
	function vs(e, t, n, r, i) {
		if (oc(e)) throw Error(s(485));
		if (e = t.action, e !== null) {
			var a = {
				payload: i,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					a.listeners.push(e);
				}
			};
			A.T === null ? a.isTransition = !1 : n(!0), r(a), n = t.pending, n === null ? (a.next = t.pending = a, ys(t, a)) : (a.next = n.next, t.pending = n.next = a);
		}
	}
	function ys(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = A.T, o = {};
			o.types = a === null ? null : a.types, A.T = o;
			try {
				var s = n(i, r), c = A.S;
				c !== null && c(o, s), bs(e, t, s);
			} catch (n) {
				Ss(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), A.T = a;
			}
		} else try {
			a = n(i, r), bs(e, t, a);
		} catch (n) {
			Ss(e, t, n);
		}
	}
	function bs(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			xs(e, t, n);
		}, function(n) {
			return Ss(e, t, n);
		}) : xs(e, t, n);
	}
	function xs(e, t, n) {
		t.status = "fulfilled", t.value = n, Cs(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, ys(e, n)));
	}
	function Ss(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Cs(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Cs(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function ws(e, t) {
		return t;
	}
	function Ts(e, t) {
		if (K) {
			var n = Xu.formState;
			if (n !== null) {
				a: {
					var r = J;
					if (K) {
						if (G) {
							b: {
								for (var i = G, a = ea; i.nodeType !== 8;) if (!a || (i = lm(i.nextSibling), i === null)) {
									i = null;
									break b;
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								G = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						na(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = es(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: ws,
			lastRenderedState: t
		}, n.queue = r, n = rc.bind(null, J, r), r.dispatch = n, r = gs(!1), a = ac.bind(null, J, !1, r.queue), r = es(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = vs.bind(null, J, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Es(e) {
		return Ds(ts(), Io, e);
	}
	function Ds(e, t, n) {
		if (t = cs(e, t, ws)[0], e = ss(os)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = rs(t);
		} catch (e) {
			throw e === Ua ? Ga : e;
		}
		else r = t;
		t = ts();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (J.flags |= 2048, As(9, { destroy: void 0 }, Os.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Os(e, t) {
		e.action = t;
	}
	function ks(e) {
		var t = ts(), n = Io;
		if (n !== null) return Ds(t, n, e);
		ts(), t = t.memoizedState, n = ts();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function As(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = J.updateQueue, t === null && (t = ns(), J.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function js() {
		return ts().memoizedState;
	}
	function Ms(e, t, n, r) {
		var i = es();
		J.flags |= e, i.memoizedState = As(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function Ns(e, t, n, r) {
		var i = ts();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		Io !== null && r !== null && Ko(r, Io.memoizedState.deps) ? i.memoizedState = As(t, a, n, r) : (J.flags |= e, i.memoizedState = As(1 | t, a, n, r));
	}
	function Ps(e, t) {
		Ms(8390656, 8, e, t);
	}
	function Fs(e, t) {
		Ns(2048, 8, e, t);
	}
	function Is(e) {
		J.flags |= 4;
		var t = J.updateQueue;
		if (t === null) t = ns(), J.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function Ls(e) {
		var t = ts().memoizedState;
		return Is({
			ref: t,
			nextImpl: e
		}), function() {
			if (X & 2) throw Error(s(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function Rs(e, t) {
		return Ns(4, 2, e, t);
	}
	function zs(e, t) {
		return Ns(4, 4, e, t);
	}
	function Bs(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function Vs(e, t, n) {
		n = n == null ? null : n.concat([e]), Ns(4, 4, Bs.bind(null, t, e), n);
	}
	function Hs() {}
	function Us(e, t) {
		var n = ts();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && Ko(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function Ws(e, t) {
		var n = ts();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && Ko(t, r[1])) return r[0];
		if (r = e(), Bo) {
			Je(!0);
			try {
				e();
			} finally {
				Je(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function Gs(e, t, n) {
		return n === void 0 || Fo & 1073741824 && !(Q & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = Ad(), J.lanes |= e, id |= e, n);
	}
	function Ks(e, t, n, r) {
		return Ir(n, t) ? n : bo.current === null ? !(Fo & 106) || Fo & 1073741824 && !(Q & 261930) ? (Oc = !0, e.memoizedState = n) : (e = Ad(), J.lanes |= e, id |= e, t) : (e = Gs(e, n, r), Ir(e, t) || (Oc = !0), e);
	}
	function qs(e, t, n, r, i) {
		var a = j.p;
		j.p = a !== 0 && 8 > a ? a : 8;
		var o = A.T, s = {};
		s.types = o === null ? null : o.types, A.T = s, ac(e, !1, t, n);
		try {
			var c = i(), l = A.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? ic(e, t, La(c, r), kd(e)) : ic(e, t, r, kd(e));
		} catch (n) {
			ic(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, kd());
		} finally {
			j.p = a, o !== null && s.types !== null && (o.types = s.types), A.T = o;
		}
	}
	function Js() {}
	function Ys(e, t, n, r) {
		if (e.tag !== 5) throw Error(s(476));
		var i = Xs(e).queue;
		qs(e, i, t, xe, n === null ? Js : function() {
			return Zs(e), n(r);
		});
	}
	function Xs(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: xe,
			baseState: xe,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: os,
				lastRenderedState: xe
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: os,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Zs(e) {
		var t = Xs(e);
		t.next === null && (t = e.alternate.memoizedState), ic(e, t.next.queue, {}, kd());
	}
	function Qs() {
		return ya(sh);
	}
	function $s() {
		return ts().memoizedState;
	}
	function ec() {
		return ts().memoizedState;
	}
	function tc(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = kd();
					e = uo(n);
					var r = fo(t, e, n);
					r !== null && (Md(r, t, n), po(r, t, n)), t = { cache: Ea() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function nc(e, t, n) {
		var r = kd();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, oc(e) ? sc(t, n) : (n = xi(e, t, n, r), n !== null && (Md(n, e, r), cc(n, t, r)));
	}
	function rc(e, t, n) {
		ic(e, t, n, kd());
	}
	function ic(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (oc(e)) sc(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Ir(s, o)) return bi(e, t, i, 0), Xu === null && yi(), !1;
			} catch {}
			if (n = xi(e, t, i, r), n !== null) return Md(n, e, r), cc(n, t, r), !0;
		}
		return !1;
	}
	function ac(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: Nf(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, oc(e)) {
			if (t) throw Error(s(479));
		} else t = xi(e, n, r, 2), t !== null && Md(t, e, 2);
	}
	function oc(e) {
		var t = e.alternate;
		return e === J || t !== null && t === J;
	}
	function sc(e, t) {
		zo = Ro = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function cc(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ft(e, n);
		}
	}
	var lc = {
		readContext: ya,
		use: is,
		useCallback: Go,
		useContext: Go,
		useEffect: Go,
		useImperativeHandle: Go,
		useLayoutEffect: Go,
		useInsertionEffect: Go,
		useMemo: Go,
		useReducer: Go,
		useRef: Go,
		useState: Go,
		useDebugValue: Go,
		useDeferredValue: Go,
		useTransition: Go,
		useSyncExternalStore: Go,
		useId: Go,
		useHostTransitionStatus: Go,
		useFormState: Go,
		useActionState: Go,
		useOptimistic: Go,
		useMemoCache: Go,
		useCacheRefresh: Go,
		useEffectEvent: Go
	}, uc = {
		readContext: ya,
		use: is,
		useCallback: function(e, t) {
			return es().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: ya,
		useEffect: Ps,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), Ms(4194308, 4, Bs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return Ms(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			Ms(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = es();
			t = t === void 0 ? null : t;
			var r = e();
			if (Bo) {
				Je(!0);
				try {
					e();
				} finally {
					Je(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = es();
			if (n !== void 0) {
				var i = n(t);
				if (Bo) {
					Je(!0);
					try {
						n(t);
					} finally {
						Je(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = nc.bind(null, J, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = es();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = gs(e);
			var t = e.queue, n = rc.bind(null, J, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Hs,
		useDeferredValue: function(e, t) {
			return Gs(es(), e, t);
		},
		useTransition: function() {
			var e = gs(!1);
			return e = qs.bind(null, J, e.queue, !0, !1), es().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = J, i = es();
			if (K) {
				if (n === void 0) throw Error(s(407));
				n = n();
			} else {
				if (n = t(), Xu === null) throw Error(s(349));
				Q & 127 || ds(r, t, n);
			}
			i.memoizedState = n;
			var a = {
				value: n,
				getSnapshot: t
			};
			return i.queue = a, Ps(ps.bind(null, r, a, e), [e]), r.flags |= 2048, As(9, { destroy: void 0 }, fs.bind(null, r, a, n, t), null), n;
		},
		useId: function() {
			var e = es(), t = Xu.identifierPrefix;
			if (K) {
				var n = Ki, r = Gi;
				n = (r & ~(1 << 32 - Ye(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = Vo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = Wo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Qs,
		useFormState: Ts,
		useActionState: Ts,
		useOptimistic: function(e) {
			var t = es();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = ac.bind(null, J, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: as,
		useCacheRefresh: function() {
			return es().memoizedState = tc.bind(null, J);
		},
		useEffectEvent: function(e) {
			var t = es(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (X & 2) throw Error(s(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, dc = {
		readContext: ya,
		use: is,
		useCallback: Us,
		useContext: ya,
		useEffect: Fs,
		useImperativeHandle: Vs,
		useInsertionEffect: Rs,
		useLayoutEffect: zs,
		useMemo: Ws,
		useReducer: ss,
		useRef: js,
		useState: function() {
			return ss(os);
		},
		useDebugValue: Hs,
		useDeferredValue: function(e, t) {
			return Ks(ts(), Io.memoizedState, e, t);
		},
		useTransition: function() {
			var e = ss(os)[0], t = ts().memoizedState;
			return [typeof e == "boolean" ? e : rs(e), t];
		},
		useSyncExternalStore: us,
		useId: $s,
		useHostTransitionStatus: Qs,
		useFormState: Es,
		useActionState: Es,
		useOptimistic: function(e, t) {
			return _s(ts(), Io, e, t);
		},
		useMemoCache: as,
		useCacheRefresh: ec,
		useEffectEvent: Ls
	}, fc = {
		readContext: ya,
		use: is,
		useCallback: Us,
		useContext: ya,
		useEffect: Fs,
		useImperativeHandle: Vs,
		useInsertionEffect: Rs,
		useLayoutEffect: zs,
		useMemo: Ws,
		useReducer: ls,
		useRef: js,
		useState: function() {
			return ls(os);
		},
		useDebugValue: Hs,
		useDeferredValue: function(e, t) {
			var n = ts();
			return Io === null ? Gs(n, e, t) : Ks(n, Io.memoizedState, e, t);
		},
		useTransition: function() {
			var e = ls(os)[0], t = ts().memoizedState;
			return [typeof e == "boolean" ? e : rs(e), t];
		},
		useSyncExternalStore: us,
		useId: $s,
		useHostTransitionStatus: Qs,
		useFormState: ks,
		useActionState: ks,
		useOptimistic: function(e, t) {
			var n = ts();
			return Io === null ? (n.baseState = e, [e, n.queue.dispatch]) : _s(n, Io, e, t);
		},
		useMemoCache: as,
		useCacheRefresh: ec,
		useEffectEvent: Ls
	};
	function pc(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : E({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var mc = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = kd(), i = uo(r);
			i.payload = t, n != null && (i.callback = n), t = fo(e, i, r), t !== null && (Md(t, e, r), po(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = kd(), i = uo(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = fo(e, i, r), t !== null && (Md(t, e, r), po(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = kd(), r = uo(n);
			r.tag = 2, t != null && (r.callback = t), t = fo(e, r, n), t !== null && (Md(t, e, n), po(t, e, n));
		}
	};
	function hc(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Lr(n, r) || !Lr(i, a) : !0;
	}
	function gc(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && mc.enqueueReplaceState(t, t.state, null);
	}
	function _c(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = E({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function vc(e) {
		hi(e);
	}
	function yc(e) {
		console.error(e);
	}
	function bc(e) {
		hi(e);
	}
	function xc(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Sc(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Cc(e, t, n) {
		return n = uo(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			xc(e, t);
		}, n;
	}
	function wc(e) {
		return e = uo(e), e.tag = 3, e;
	}
	function Tc(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Sc(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Sc(t, n, r), typeof i != "function" && (gd === null ? gd = /* @__PURE__ */ new Set([this]) : gd.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function Ec(e, t, n, r, i) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && ga(t, n, i, !0), n = q.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13:
					case 19: return To === null ? Wd() : n.alternate === null && rd === 0 && (rd = 3), n.flags &= -257, n.flags |= 65536, n.lanes = i, r === Ka ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), pf(e, r, i)), !1;
					case 22: return n.flags |= 65536, r === Ka ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), pf(e, r, i)), !1;
				}
				throw Error(s(435, n.tag));
			}
			return pf(e, r, i), Wd(), !1;
		}
		if (K) return t = q.current, t === null ? (r !== ta && (t = Error(s(423), { cause: r }), ca(Li(t, n))), e = e.current.alternate, e.flags |= 65536, i &= -i, e.lanes |= i, r = Li(r, n), i = Cc(e.stateNode, r, i), mo(e, i), rd !== 4 && (rd = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = i, r !== ta && (e = Error(s(422), { cause: r }), ca(Li(e, n)))), !1;
		var a = Error(s(520), { cause: r });
		if (a = Li(a, n), ld === null ? ld = [a] : ld.push(a), rd !== 4 && (rd = 2), t === null) return !0;
		r = Li(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = i & -i, n.lanes |= e, e = Cc(n.stateNode, r, e), mo(n, e), !1;
				case 1:
					if (t = n.type, a = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || a !== null && typeof a.componentDidCatch == "function" && (gd === null || !gd.has(a)))) return n.flags |= 65536, i &= -i, n.lanes |= i, i = wc(i), Tc(i, e, n, r), mo(n, i), !1;
					break;
				case 22: if (n.memoizedState !== null) return n.flags |= 65536, !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Dc = Error(s(461)), Oc = !1;
	function kc(e, t, n, r) {
		t.child = e === null ? oo(t, null, n, r) : ao(t, e.child, n, r);
	}
	function Ac(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return va(t), r = qo(e, t, n, o, a, i), s = Zo(), e !== null && !Oc ? (Qo(e, t, i), il(e, t, i)) : (K && s && Yi(t), t.flags |= 1, kc(e, t, r, i), t.child);
	}
	function jc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !Oi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, Mc(e, t, a, r, i)) : (e = ji(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !al(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Lr : n, n(o, r) && e.ref === t.ref) return il(e, t, i);
		}
		return t.flags |= 1, e = ki(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Mc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Lr(a, r) && e.ref === t.ref) {
				if (Oc = !1, t.pendingProps = r = a, al(e, i)) e.flags & 131072 && (Oc = !0);
				else return t.lanes = e.lanes, il(e, t, i);
			}
		}
		return Bc(e, t, n, r, i);
	}
	function Nc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return Fc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && Va(t, a === null ? null : a.cachePool), a === null ? Co() : So(t, a), Oo(t);
			else return r = t.lanes = 536870912, Fc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && Va(t, null), Co(), ko()) : (Va(t, a.cachePool), So(t, a), ko(), t.memoizedState = null);
		return kc(e, t, i, n), t.child;
	}
	function Pc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function Fc(e, t, n, r, i) {
		var a = Ba();
		return a = a === null ? null : {
			parent: Ta._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && Va(t, null), Co(), Oo(t), e !== null && ga(e, t, r, !0), t.childLanes = i, null;
	}
	function Ic(e, t) {
		return t = Yc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function Lc(e, t, n) {
		return ao(t, e.child, null, n), e = Ic(t, t.pendingProps), e.flags |= 2, Ao(t), t.memoizedState = null, e;
	}
	function Rc(e, t, n) {
		var r = t.pendingProps, i = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (K) {
				if (r.mode === "hidden") return e = Ic(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, Pc(null, e);
				if (Do(t), (e = G) ? (e = am(e, ea), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Wi === null ? null : {
						id: Gi,
						overflow: Ki
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Pi(e), n.return = t, t.child = n, Qi = t, G = null)) : e = null, e === null) throw na(t);
				return t.lanes = 536870912, null;
			}
			return Ic(t, r);
		}
		var a = e.memoizedState;
		if (a !== null) {
			var o = a.dehydrated;
			if (Do(t), i) {
				if (t.flags & 256) t.flags &= -257, t = Lc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(s(558));
			} else if (Oc || ga(e, t, n, !1), i = (n & e.childLanes) !== 0, Oc || i) {
				if (bo.current === null) {
					if (r = Xu, r !== null && (o = pt(r, n), o !== 0 && o !== a.retryLane)) throw a.retryLane = o, Si(e, o), Md(r, e, o), Dc;
					Wd();
				}
				t = Lc(e, t, n);
			} else e = a.treeContext, G = lm(o.nextSibling), Qi = t, K = !0, $i = null, ea = !1, e !== null && Zi(t, e), t = Ic(t, r), t.flags |= 134221824;
			return t;
		}
		return e = ki(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function zc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(s(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function Bc(e, t, n, r, i) {
		return va(t), n = qo(e, t, n, r, void 0, i), r = Zo(), e !== null && !Oc ? (Qo(e, t, i), il(e, t, i)) : (K && r && Yi(t), t.flags |= 1, kc(e, t, n, i), t.child);
	}
	function Vc(e, t, n, r, i, a) {
		return va(t), t.updateQueue = null, n = Yo(t, r, n, i), Jo(e), r = Zo(), e !== null && !Oc ? (Qo(e, t, a), il(e, t, a)) : (K && r && Yi(t), t.flags |= 1, kc(e, t, n, a), t.child);
	}
	function Hc(e, t, n, r, i) {
		if (va(t), t.stateNode === null) {
			var a = Ti, o = n.contextType;
			typeof o == "object" && o && (a = ya(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = mc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, co(t), o = n.contextType, a.context = typeof o == "object" && o ? ya(o) : Ti, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (pc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && mc.enqueueReplaceState(a, a.state, null), _o(t, r, a, i), go(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = _c(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = Ti, typeof u == "object" && u && (o = ya(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && gc(t, a, r, o), so = !1;
			var f = t.memoizedState;
			a.state = f, _o(t, r, a, i), go(), l = t.memoizedState, s || f !== l || so ? (typeof d == "function" && (pc(t, n, d, r), l = t.memoizedState), (c = so || hc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, lo(e, t), o = t.memoizedProps, u = _c(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = Ti, typeof l == "object" && l && (c = ya(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && gc(t, a, r, c), so = !1, f = t.memoizedState, a.state = f, _o(t, r, a, i), go();
			var p = t.memoizedState;
			o !== d || f !== p || so || e !== null && e.dependencies !== null && _a(e.dependencies) ? (typeof s == "function" && (pc(t, n, s, r), p = t.memoizedState), (u = so || hc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && _a(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, zc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = ao(t, e.child, null, i), t.child = ao(t, null, n, i)) : kc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = il(e, t, i), e;
	}
	function Uc(e, t, n, r) {
		return oa(), t.flags |= 256, kc(e, t, n, r), t.child;
	}
	var Wc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function Gc(e) {
		return {
			baseLanes: e,
			cachePool: Ha()
		};
	}
	function Kc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= sd), e;
	}
	function qc(e, t, n) {
		var r = t.pendingProps, i = !1, a = !!(t.flags & 128), o;
		if ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : !!(jo.current & 2)), o && (i = !0, t.flags &= -129), o = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (K) {
				if (i ? Eo(t) : ko(), (e = G) ? (e = am(e, ea), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Wi === null ? null : {
						id: Gi,
						overflow: Ki
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Pi(e), n.return = t, t.child = n, Qi = t, G = null)) : e = null, e === null) throw na(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (ko(), i = t.mode, a = Yc({
				mode: "hidden",
				children: a
			}, i), r = Mi(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = Gc(n), r.childLanes = Kc(e, o, n), t.memoizedState = Wc, Pc(null, r)) : (Eo(t), Jc(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return Zc(e, t, a, o, r, c, s, n);
		}
		return i ? (ko(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = ki(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = Mi(i, a, n, null), i.flags |= 2) : i = ki(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, Pc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = Gc(n) : (a = i.cachePool, a === null ? a = Ha() : (s = Ta._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = Kc(e, o, n), t.memoizedState = Wc, Pc(e.child, r)) : (Eo(t), n = e.child, e = n.sibling, n = ki(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (o = t.deletions, o === null ? (t.deletions = [e], t.flags |= 16) : o.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function Jc(e, t) {
		return t = Yc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function Yc(e, t) {
		return e = Di(22, e, null, t), e.lanes = 0, e;
	}
	function Xc(e, t, n) {
		return ao(t, e.child, null, n), e = Jc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Zc(e, t, n, r, i, a, o, c) {
		if (n) return t.flags & 256 ? (Eo(t), t.flags &= -257, Xc(e, t, c)) : t.memoizedState === null ? (ko(), a = i.fallback, o = t.mode, i = Yc({
			mode: "visible",
			children: i.children
		}, o), a = Mi(a, o, c, null), a.flags |= 2, i.return = t, a.return = t, i.sibling = a, t.child = i, ao(t, e.child, null, c), i = t.child, i.memoizedState = Gc(c), i.childLanes = Kc(e, r, c), t.memoizedState = Wc, Pc(null, i)) : (ko(), t.child = e.child, t.flags |= 128, null);
		if (Eo(t), sm(a)) {
			if (r = a.nextSibling && a.nextSibling.dataset, r) var l = r.dgst;
			return r = l, r !== "" && (i = Error(s(419)), i.stack = "", i.digest = r, ca({
				value: i,
				source: null,
				stack: null
			})), Xc(e, t, c);
		}
		if (Oc || ga(e, t, c, !1), r = (c & e.childLanes) !== 0, Oc || r) {
			if (bo.current !== null) return Xc(e, t, c);
			if (r = Xu, r !== null && (i = pt(r, c), i !== 0 && i !== o.retryLane)) throw o.retryLane = i, Si(e, i), Md(r, e, i), Dc;
			return om(a) || Wd(), Xc(e, t, c);
		}
		return om(a) ? (t.flags |= 192, t.child = e.child, null) : (e = o.treeContext, G = lm(a.nextSibling), Qi = t, K = !0, $i = null, ea = !1, e !== null && Zi(t, e), t = Jc(t, i.children), t.flags |= 134221824, t);
	}
	function Qc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), ma(e.return, t, n);
	}
	function $c(e) {
		for (var t = null; e !== null;) {
			var n = e.alternate;
			n !== null && Po(n) === null && (t = e), e = e.sibling;
		}
		return t;
	}
	function el(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function tl(e) {
		var t = e.child;
		for (e.child = null; t !== null;) {
			var n = t.sibling;
			t.sibling = e.child, e.child = t, t = n;
		}
	}
	function nl(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = jo.current;
		if (t.flags & 128) return Mo(t, o), null;
		var s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Mo(t, o), i === "backwards" && e !== null ? (tl(e), kc(e, t, r, n), tl(e)) : kc(e, t, r, n), r = K ? Vi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Qc(e, n, t);
			else if (e.tag === 19) Qc(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "backwards":
				n = $c(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null, tl(t)), el(t, !0, i, null, a, r);
				break;
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && Po(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				el(t, !0, n, null, a, r);
				break;
			case "together":
				el(t, !1, null, null, void 0, r);
				break;
			case "independent":
				t.memoizedState = null;
				break;
			default: n = $c(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), el(t, !1, i, n, a, r);
		}
		return t.child;
	}
	function rl(e, t, n) {
		var r = t.pendingProps;
		return fa(t, t.type, r.value), kc(e, t, r.children, n), t.child;
	}
	function il(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), id |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (ga(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(s(153));
		if (t.child !== null) {
			for (e = t.child, n = ki(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = ki(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function al(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && _a(e)));
	}
	function ol(e, t, n) {
		switch (t.tag) {
			case 3:
				ke(t, t.stateNode.containerInfo), fa(t, Ta, e.memoizedState.cache), oa();
				break;
			case 27:
			case 5:
				P(t);
				break;
			case 4:
				ke(t, t.stateNode.containerInfo);
				break;
			case 10:
				fa(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, Do(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) {
					if (r.dehydrated !== null) return Eo(t), t.flags |= 128, null;
					r = ga(e, t, n, !1);
					var i = t.child.childLanes;
					return r || (n & i) !== 0 ? qc(e, t, n) : (Eo(t), e = il(e, t, n), e === null ? null : e.sibling);
				}
				Eo(t);
				break;
			case 19:
				if (t.flags & 128) return nl(e, t, n);
				if (i = !!(e.flags & 128), r = (n & t.childLanes) !== 0, r ||= (ga(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return nl(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Mo(t, jo.current), r) break;
				return null;
			case 22: return t.lanes = 0, Nc(e, t, n, t.pendingProps);
			case 24: fa(t, Ta, e.memoizedState.cache);
		}
		return il(e, t, n);
	}
	function sl(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) Oc = !0;
			else {
				if (!al(e, n) && !(t.flags & 128)) return Oc = !1, ol(e, t, n);
				Oc = !!(e.flags & 131072);
			}
		} else Oc = !1, K && t.flags & 1048576 && Ji(t, Vi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ya(t.elementType), t.type = e, typeof e == "function") Oi(e) ? (r = _c(e, r), t.tag = 1, t = Hc(null, t, e, r, n)) : (t.tag = 0, t = Bc(null, t, e, r, n));
					else {
						if (e != null) {
							var i = e.$$typeof;
							if (i === le) {
								t.tag = 11, t = Ac(null, t, e, r, n);
								break a;
							}
							if (i === D) {
								t.tag = 14, t = jc(null, t, e, r, n);
								break a;
							}
							if (i === ce) {
								t.tag = 10, t.type = e, t = rl(null, t, n);
								break a;
							}
						}
						throw t = ye(e) || e, Error(s(306, t, ""));
					}
				}
				return t;
			case 0: return Bc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, i = _c(r, t.pendingProps), Hc(e, t, r, i, n);
			case 3:
				a: {
					if (ke(t, t.stateNode.containerInfo), e === null) throw Error(s(387));
					r = t.pendingProps;
					var a = t.memoizedState;
					i = a.element, lo(e, t), _o(t, r, null, n);
					var o = t.memoizedState;
					if (r = o.cache, fa(t, Ta, r), r !== a.cache && ha(t, [Ta], n, !0), go(), r = o.element, a.isDehydrated) {
						if (a = {
							element: r,
							isDehydrated: !1,
							cache: o.cache
						}, t.updateQueue.baseState = a, t.memoizedState = a, t.flags & 256) {
							t = Uc(e, t, r, n);
							break a;
						}
						if (r !== i) {
							i = Li(Error(s(424)), t), ca(i), t = Uc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (G = lm(e.firstChild), Qi = t, K = !0, $i = null, ea = !0, n = oo(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (oa(), r === i) {
							t = il(e, t, n);
							break a;
						}
						kc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return zc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : K || (t.stateNode = fp(t.type, t.pendingProps, N.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return P(t), e === null && K && (r = t.stateNode = hm(t.type, t.pendingProps, N.current), Qi = t, ea = !0, i = G, Sp(t.type) ? (um = i, G = lm(r.firstChild)) : G = i), kc(e, t, t.pendingProps.children, n), zc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && K && ((i = r = G) && (r = rm(r, t.type, t.pendingProps, ea), r === null ? i = !1 : (t.stateNode = r, Qi = t, G = lm(r.firstChild), ea = !1, i = !0)), i || na(t)), P(t), i = t.type, a = t.pendingProps, o = e === null ? null : e.memoizedProps, r = a.children, pp(i, a) ? r = null : o !== null && pp(i, o) && (t.flags |= 32), t.memoizedState !== null && (i = qo(e, t, Xo, null, null, n), sh._currentValue = i), zc(e, t), kc(e, t, r, n), t.child;
			case 6: return e === null && K && ((e = n = G) && (n = im(n, t.pendingProps, ea), n === null ? e = !1 : (t.stateNode = n, Qi = t, G = null, e = !0)), e || na(t)), null;
			case 13: return qc(e, t, n);
			case 4: return ke(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = ao(t, null, r, n) : kc(e, t, r, n), t.child;
			case 11: return Ac(e, t, t.type, t.pendingProps, n);
			case 7: return r = t.pendingProps, zc(e, t), kc(e, t, r, n), t.child;
			case 8: return kc(e, t, t.pendingProps.children, n), t.child;
			case 12: return kc(e, t, t.pendingProps.children, n), t.child;
			case 10: return rl(e, t, n);
			case 9: return i = t.type._context, r = t.pendingProps.children, va(t), i = ya(i), r = r(i), t.flags |= 1, kc(e, t, r, n), t.child;
			case 14: return jc(e, t, t.type, t.pendingProps, n);
			case 15: return Mc(e, t, t.type, t.pendingProps, n);
			case 19: return nl(e, t, n);
			case 31: return Rc(e, t, n);
			case 22: return Nc(e, t, n, t.pendingProps);
			case 24: return va(t), r = ya(Ta), e === null ? (i = Ba(), i === null && (i = Xu, a = Ea(), i.pooledCache = a, a.refCount++, a !== null && (i.pooledCacheLanes |= n), i = a), t.memoizedState = {
				parent: r,
				cache: i
			}, co(t), fa(t, Ta, i)) : ((e.lanes & n) !== 0 && (lo(e, t), _o(t, null, null, n), go()), i = e.memoizedState, a = t.memoizedState, i.parent === r ? (r = a.cache, fa(t, Ta, r), r !== i.cache && ha(t, [Ta], n, !0)) : (i = {
				parent: r,
				cache: r
			}, t.memoizedState = i, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i), fa(t, Ta, r))), kc(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : K && Yi(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : zc(e, t), kc(e, t, r.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(s(156, t.tag));
	}
	function cl(e) {
		e.flags |= 4;
	}
	function ll(e, t, n, r, i) {
		var a;
		if ((a = !!(e.mode & 32)) && (a = n === null ? Jm(t, r) : Jm(t, r) && (r.src !== n.src || r.srcSet !== n.srcSet)), a) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (Vd()) e.flags |= 8192;
				else throw Xa = Ka, Wa;
			}
		} else e.flags &= -16777217;
	}
	function ul(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ym(t)) {
			if (Vd()) e.flags |= 8192;
			else throw Xa = Ka, Wa;
		}
	}
	function dl(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : st(), e.lanes |= t, cd |= t);
	}
	function fl(e, t) {
		if (!K) switch (e.tailMode) {
			case "visible": break;
			case "collapsed":
				for (var n = e.tail, r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
				break;
			default:
				for (t = e.tail, n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
		}
	}
	function pl(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 1206910976, r |= i.flags & 1206910976, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function ml(e, t, n) {
		var r = t.pendingProps;
		switch (Xi(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return pl(t), null;
			case 1: return pl(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), pa(Ta), Ae(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (aa(t) ? cl(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, sa())), pl(t), null;
			case 26:
				var i = t.type, a = t.memoizedState;
				return e === null ? (cl(t), a === null ? (pl(t), ll(t, i, null, r, n)) : (pl(t), ul(t, a))) : a ? a === e.memoizedState ? (pl(t), t.flags &= -16777217) : (cl(t), pl(t), ul(t, a)) : (e = e.memoizedProps, e !== r && cl(t), pl(t), ll(t, i, e, r, n)), null;
			case 27:
				if (je(t), n = N.current, i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && cl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(s(166));
						return pl(t), t.subtreeFlags &= -33554433, null;
					}
					e = Ee.current, aa(t) ? ra(t, e) : (e = hm(i, r, n), t.stateNode = e, cl(t));
				}
				return pl(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (je(t), i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && cl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(s(166));
						return pl(t), t.subtreeFlags &= -33554433, null;
					}
					if (a = Ee.current, aa(t)) ra(t, a);
					else {
						var o = lp(N.current);
						switch (a) {
							case 1:
								a = o.createElementNS("http://www.w3.org/2000/svg", i);
								break;
							case 2:
								a = o.createElementNS("http://www.w3.org/1998/Math/MathML", i);
								break;
							default: switch (i) {
								case "svg":
									a = o.createElementNS("http://www.w3.org/2000/svg", i);
									break;
								case "math":
									a = o.createElementNS("http://www.w3.org/1998/Math/MathML", i);
									break;
								case "script":
									a = o.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild);
									break;
								case "select":
									a = typeof r.is == "string" ? o.createElement("select", { is: r.is }) : o.createElement("select"), r.multiple ? a.multiple = !0 : r.size && (a.size = r.size);
									break;
								default: a = typeof r.is == "string" ? o.createElement(i, { is: r.is }) : o.createElement(i);
							}
						}
						a[yt] = t, a[bt] = r;
						a: for (o = t.child; o !== null;) {
							if (o.tag === 5 || o.tag === 6) a.appendChild(o.stateNode);
							else if (o.tag !== 4 && o.tag !== 27 && o.child !== null) {
								o.child.return = o, o = o.child;
								continue;
							}
							if (o === t) break a;
							for (; o.sibling === null;) {
								if (o.return === null || o.return === t) break a;
								o = o.return;
							}
							o.sibling.return = o.return, o = o.sibling;
						}
						t.stateNode = a;
						a: switch (np(a, i, r), i) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && cl(t);
					}
				}
				return pl(t), t.subtreeFlags &= -33554433, ll(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && cl(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(s(166));
					if (e = N.current, aa(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, i = Qi, i !== null) switch (i.tag) {
							case 27:
							case 5: r = i.memoizedProps;
						}
						e[yt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || $f(e.nodeValue, n)), e || na(t, !0);
					} else e = lp(e).createTextNode(r), e[yt] = t, t.stateNode = e;
				}
				return pl(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = aa(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(s(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(557));
							e[yt] = t;
						} else oa(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						pl(t), e = !1;
					} else n = sa(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (Ao(t), t) : (Ao(t), null);
					if (t.flags & 128) throw Error(s(558));
				}
				return pl(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (i = aa(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!i) throw Error(s(318));
							if (i = t.memoizedState, i = i === null ? null : i.dehydrated, !i) throw Error(s(317));
							i[yt] = t;
						} else oa(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						pl(t), i = !1;
					} else i = sa(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i), i = !0;
					if (!i) return t.flags & 256 ? (Ao(t), t) : (Ao(t), null);
				}
				return Ao(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, i = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (i = r.alternate.memoizedState.cachePool.pool), a = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (a = r.memoizedState.cachePool.pool), a !== i && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), dl(t, t.updateQueue), pl(t), null);
			case 4: return Ae(), e === null && Uf(t.stateNode.containerInfo), t.flags |= 67108864, pl(t), null;
			case 10: return pa(t.type), pl(t), null;
			case 19:
				if (No(t), r = t.memoizedState, r === null) return pl(t), null;
				if (i = !!(t.flags & 128), a = r.rendering, a === null) {
					if (i) fl(r, !1);
					else {
						if (rd !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (a = Po(e), a !== null) {
								for (t.flags |= 128, fl(r, !1), e = a.updateQueue, t.updateQueue = e, dl(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Ai(n, e), n = n.sibling;
								return Mo(t, jo.current & 1 | 2), K && qi(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && z() > md && (t.flags |= 128, i = !0, fl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!i) {
						if (e = Po(a), e !== null) {
							if (t.flags |= 128, i = !0, e = e.updateQueue, t.updateQueue = e, dl(t, e), fl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !a.alternate && !K) return pl(t), null;
						} else 2 * z() - r.renderingStartTime > md && n !== 536870912 && (t.flags |= 128, i = !0, fl(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (a.sibling = t.child, t.child = a) : (e = r.last, e === null ? t.child = a : e.sibling = a, r.last = a);
				}
				if (r.tail !== null) {
					e = r.tail;
					a: {
						for (n = e; n !== null;) {
							if (n.alternate !== null) {
								n = !1;
								break a;
							}
							n = n.sibling;
						}
						n = !0;
					}
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = z(), e.sibling = null, a = jo.current, a = i ? a & 1 | 2 : a & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || K ? Mo(t, a) : (n = a, M(q, t), M(jo, n), To === null && (To = t)), K && qi(t, r.treeForkCount), e;
				}
				return pl(t), null;
			case 22:
			case 23: return Ao(t), wo(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (pl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : pl(t), n = t.updateQueue, n !== null && dl(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && Te(za), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), pa(Ta), pl(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, pl(t), null;
		}
		throw Error(s(156, t.tag));
	}
	function hl(e, t) {
		switch (Xi(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return pa(Ta), Ae(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return je(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (Ao(t), t.alternate === null) throw Error(s(340));
					oa();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (Ao(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(s(340));
					oa();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return No(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return Ae(), null;
			case 10: return pa(t.type), null;
			case 22:
			case 23: return Ao(t), wo(), e !== null && Te(za), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return pa(Ta), null;
			case 25: return null;
			default: return null;
		}
	}
	function gl(e, t) {
		switch (Xi(t), t.tag) {
			case 3:
				pa(Ta), Ae();
				break;
			case 26:
			case 27:
			case 5:
				je(t);
				break;
			case 4:
				Ae();
				break;
			case 31:
				t.memoizedState !== null && Ao(t);
				break;
			case 13:
				Ao(t);
				break;
			case 19:
				No(t);
				break;
			case 10:
				pa(t.type);
				break;
			case 22:
			case 23:
				Ao(t), wo(), e !== null && Te(za);
				break;
			case 24: pa(Ta);
		}
	}
	function _l(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			ff(t, t.return, e);
		}
	}
	function vl(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								ff(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			ff(t, t.return, e);
		}
	}
	function yl(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				yo(t, n);
			} catch (t) {
				ff(e, e.return, t);
			}
		}
	}
	function bl(e, t, n) {
		n.props = _c(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			ff(e, t, n);
		}
	}
	function xl(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						var i = e.stateNode, a = fi(e.memoizedProps, i);
						(i.ref === null || i.ref.name !== a) && (i.ref = Pp(a)), r = i.ref;
						break;
					case 7:
						if (e.stateNode === null) {
							var o = new Fp(e);
							h(e.child, !1, Qp, o, void 0, void 0), e.stateNode = o;
						}
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			ff(e, t, n);
		}
	}
	function Sl(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) {
			if (typeof r == "function") try {
				r();
			} catch (n) {
				ff(e, t, n);
			} finally {
				e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
			}
			else if (typeof n == "function") try {
				n(null);
			} catch (n) {
				ff(e, t, n);
			}
			else n.current = null;
		}
	}
	function Cl(e, t) {
		if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null) for (var n = 0; n < t.length; n++) em(e.stateNode, t[n]);
	}
	function wl(e) {
		for (var t = e.return; t !== null && (Dl(t) && em(e.stateNode, t.stateNode), !El(t));) t = t.return;
	}
	function Tl(e) {
		for (var t = e.return; t !== null && (Dl(t) && tm(e.stateNode, t.stateNode), !El(t));) t = t.return;
	}
	function El(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 27;
	}
	function Dl(e) {
		return e && e.tag === 7 && e.stateNode !== null;
	}
	function Ol(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			ff(e, e.return, t);
		}
	}
	function kl(e, t, n) {
		try {
			var r = e.stateNode;
			ip(r, e.type, n, t), r[bt] = t;
		} catch (t) {
			ff(e, e.return, t);
		}
	}
	function Al(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Sp(e.type) || e.tag === 4;
	}
	function jl(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Al(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Sp(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Ml(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = pn)), Cl(e, r), H = !0;
		else if (i !== 4 && (i === 27 && (Cl(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (Ml(e, t, n, r), e = e.sibling; e !== null;) Ml(e, t, n, r), e = e.sibling;
	}
	function Nl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), Cl(e, r), H = !0;
		else if (i !== 4 && (i === 27 && (Cl(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (Nl(e, t, n, r), e = e.sibling; e !== null;) Nl(e, t, n, r), e = e.sibling;
	}
	function Pl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			np(t, r, n), t[yt] = e, t[bt] = n;
		} catch (t) {
			ff(e, e.return, t);
		}
	}
	var Fl = !1, Il = null;
	function Ll(e) {
		(e.tag === 30 || e.subtreeFlags & 33554432) && (Fl = !0);
	}
	var Rl = null;
	function zl() {
		var e = Rl;
		return Rl = null, e;
	}
	var Bl = 0;
	function Vl(e, t, n, r, i) {
		return Bl = 0, Hl(e.child, t, n, r, i);
	}
	function Hl(e, t, n, r, i) {
		for (var a = !1; e !== null;) {
			if (e.tag === 5) {
				var o = e.stateNode;
				if (r !== null) {
					var s = Op(o);
					r.push(s), s.view && (a = !0);
				} else a || Op(o).view && (a = !0);
				Fl = !0, Tp(o, Bl === 0 ? t : t + "_" + Bl, n), Bl++;
			} else e.tag === 22 && e.memoizedState !== null || e.tag === 30 && i || Hl(e.child, t, n, r, i) && (a = !0);
			e = e.sibling;
		}
		return a;
	}
	function Ul(e, t) {
		for (; e !== null;) e.tag === 5 ? Ep(e.stateNode, e.memoizedProps) : e.tag === 22 && e.memoizedState !== null || e.tag === 30 && t || Ul(e.child, t), e = e.sibling;
	}
	function Wl(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if ((e.tag !== 22 || e.memoizedState === null) && (Wl(e), e.tag === 30 && e.flags & 18874368 && e.stateNode.paired)) {
				var t = e.memoizedProps;
				if (t.name == null || t.name === "auto") throw Error(s(544));
				var n = t.name;
				t = mi(t.default, t.share), t !== "none" && (Vl(e, n, t, null, !1) || Ul(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function Gl(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = fi(r, n), a = mi(r.default, n.paired ? r.share : r.enter);
			a === "none" ? Wl(e) : Vl(e, i, a, null, !1) ? (Wl(e), n.paired || t || jd(e, r.onEnter)) : Ul(e.child, !1);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Gl(e, t), e = e.sibling;
		else Wl(e);
	}
	function Kl(e) {
		if (Il !== null && Il.size !== 0) {
			var t = Il;
			if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
				if (e.tag !== 22 || e.memoizedState === null) {
					if (e.tag === 30 && e.flags & 18874368) {
						var n = e.memoizedProps, r = n.name;
						if (r != null && r !== "auto") {
							var i = t.get(r);
							if (i !== void 0) {
								var a = mi(n.default, n.share);
								if (a !== "none" && (Vl(e, r, a, null, !1) ? (a = e.stateNode, i.paired = a, a.paired = i, jd(e, n.onShare)) : Ul(e.child, !1)), t.delete(r), t.size === 0) break;
							}
						}
					}
					Kl(e);
				}
				e = e.sibling;
			}
		}
	}
	function ql(e) {
		if (e.tag === 30) {
			var t = e.memoizedProps, n = fi(t, e.stateNode), r = Il === null ? void 0 : Il.get(n), i = mi(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (Vl(e, n, i, null, !1) ? r === void 0 ? jd(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, Il.delete(n), jd(e, t.onShare)) : Ul(e.child, !1)), Il !== null && Kl(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) ql(e), e = e.sibling;
		else Il !== null && Kl(e);
	}
	function Jl(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = fi(t, e.stateNode);
				t = mi(t.default, t.update), e.flags &= -5, t !== "none" && Vl(e, n, t, e.memoizedState = [], !1);
			} else e.subtreeFlags & 33554432 && Jl(e);
			e = e.sibling;
		}
	}
	function Yl(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if (e.tag !== 22 || e.memoizedState === null) {
				if (e.tag === 30 && e.flags & 18874368) {
					var t = e.stateNode;
					t.paired !== null && (t.paired = null, Ul(e.child, !1));
				}
				Yl(e);
			}
			e = e.sibling;
		}
	}
	function Xl(e) {
		if (e.tag === 30) e.stateNode.paired = null, Ul(e.child, !1), Yl(e);
		else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Xl(e), e = e.sibling;
		else Yl(e);
	}
	function Zl(e) {
		for (e = e.child; e !== null;) e.tag === 30 ? Ul(e.child, !1) : e.subtreeFlags & 33554432 && Zl(e), e = e.sibling;
	}
	function Ql(e, t, n, r, i, a, o) {
		for (var s = !1; t !== null;) {
			if (t.tag === 5) {
				var c = t.stateNode;
				if (a !== null && Bl < a.length) {
					var l = a[Bl], u = Op(c);
					(l.view || u.view) && (s = !0);
					var d;
					if (d = !(e.flags & 4)) {
						if (u.clip) d = !0;
						else {
							d = l.rect;
							var f = u.rect;
							d = d.y !== f.y || d.x !== f.x || d.height !== f.height || d.width !== f.width;
						}
					}
					d && (e.flags |= 4), u.abs ? u = !l.abs : (l = l.rect, u = u.rect, u = l.height !== u.height || l.width !== u.width), u && (e.flags |= 32);
				} else e.flags |= 32;
				e.flags & 4 && Tp(c, Bl === 0 ? n : n + "_" + Bl, i), s && e.flags & 4 || (Rl === null && (Rl = []), Rl.push(c, Bl === 0 ? r : r + "_" + Bl, t.memoizedProps)), Bl++;
			} else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && o ? e.flags |= t.flags & 32 : Ql(e, t.child, n, r, i, a, o) && (s = !0));
			t = t.sibling;
		}
		return s;
	}
	function $l(e, t) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var n = e.memoizedProps, r = e.stateNode, i = fi(n, r), a = mi(n.default, n.update);
				if (t) {
					r = r.clones;
					var o = r === null ? null : r.map(kp);
				} else o = e.memoizedState, e.memoizedState = null;
				r = e;
				var s = e.child;
				Bl = 0, i = Ql(r, s, i, i, a, o, !1), e.flags & 4 && i && (t || jd(e, n.onUpdate));
			} else e.subtreeFlags & 33554432 && $l(e, t);
			e = e.sibling;
		}
	}
	var eu = !1, Y = !1, tu = !1, nu = !1, ru = typeof WeakSet == "function" ? WeakSet : Set, iu = null, au = !1, ou = !1, su = !1, cu = !1;
	function lu(e, t, n) {
		if (e = e.containerInfo, sp = gh, e = Hr(e), Ur(e)) {
			if ("selectionStart" in e) var r = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				r = (r = e.ownerDocument) && r.defaultView || window;
				var i = r.getSelection && r.getSelection();
				if (i && i.rangeCount !== 0) {
					r = i.anchorNode;
					var a = i.anchorOffset, o = i.focusNode;
					i = i.focusOffset;
					try {
						r.nodeType, o.nodeType;
					} catch {
						r = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== r || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || i !== 0 && f.nodeType !== 3 || (l = s + i), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === r && ++u === a && (c = s), p === o && ++d === i && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					r = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else r = null;
			}
			r ||= {
				start: 0,
				end: 0
			};
		} else r = null;
		for (cp = {
			focusedElem: e,
			selectionRange: r
		}, gh = !1, n = (n & 335544064) === n, iu = t, t = n ? 9270 : 1024; iu !== null;) {
			if (e = iu, n && (r = e.deletions, r !== null)) for (a = 0; a < r.length; a++) n && ql(r[a]);
			if (e.alternate === null && e.flags & 2) n && Ll(e), uu(n);
			else {
				if (e.tag === 22) {
					if (r = e.alternate, e.memoizedState !== null) {
						r !== null && r.memoizedState === null && n && ql(r), uu(n);
						continue;
					}
					if (r !== null && r.memoizedState !== null) {
						n && Ll(e), uu(n);
						continue;
					}
				}
				r = e.child, (e.subtreeFlags & t) !== 0 && r !== null ? (r.return = e, iu = r) : (n && Jl(e), uu(n));
			}
		}
		Il = null;
	}
	function uu(e) {
		for (; iu !== null;) {
			var t = iu, n = e, r = t.alternate, i = t.flags;
			switch (t.tag) {
				case 0:
				case 11:
				case 15: break;
				case 1:
					if (i & 1024 && r !== null) {
						n = void 0, i = r.memoizedProps, r = r.memoizedState;
						var a = t.stateNode;
						try {
							var o = _c(t.type, i);
							n = a.getSnapshotBeforeUpdate(o, r), a.__reactInternalSnapshotBeforeUpdate = n;
						} catch (e) {
							ff(t, t.return, e);
						}
					}
					break;
				case 3:
					if (i & 1024) {
						if (r = t.stateNode.containerInfo, n = r.nodeType, n === 9) nm(r);
						else if (n === 1) switch (r.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								nm(r);
								break;
							default: r.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				case 30:
					n && r !== null && (n = fi(r.memoizedProps, r.stateNode), i = t.memoizedProps, i = mi(i.default, i.update), i !== "none" && Vl(r, n, i, r.memoizedState = [], !0));
					break;
				default: if (i & 1024) throw Error(s(163));
			}
			if (r = t.sibling, r !== null) {
				r.return = t.return, iu = r;
				break;
			}
			iu = t.return;
		}
	}
	function du(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				ju(e, n), r & 4 && _l(5, n);
				break;
			case 1:
				if (ju(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						ff(n, n.return, e);
					}
					else {
						var i = _c(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							ff(n, n.return, e);
						}
					}
				}
				r & 64 && yl(n), r & 512 && xl(n, n.return);
				break;
			case 3:
				if (ju(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						yo(e, t);
					} catch (e) {
						ff(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Pl(n);
			case 26:
			case 5:
				ju(e, n), t === null && r & 4 && Ol(n), r & 512 && xl(n, n.return);
				break;
			case 12:
				ju(e, n);
				break;
			case 31:
				ju(e, n), r & 4 && bu(e, n);
				break;
			case 13:
				ju(e, n), r & 4 && xu(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = gf.bind(null, n), cm(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || eu, !r) {
					var a = t !== null && t.memoizedState !== null || Y;
					t = eu, i = Y, eu = r, (Y = a) && !i ? (r = 2, n.subtreeFlags & 8772 && (r |= 1), Nu(e, n, r)) : ju(e, n), eu = t, Y = i;
				}
				break;
			case 30:
				ju(e, n), r & 512 && xl(n, n.return);
				break;
			case 7: r & 512 && xl(n, n.return);
			default: ju(e, n);
		}
	}
	function fu(e, t) {
		for (e = e.child; e !== null;) pu(e, t), e = e.sibling;
	}
	function pu(e, t) {
		switch (e.tag) {
			case 5:
			case 26:
				try {
					var n = e.stateNode;
					if (t) {
						var r = n.style;
						typeof r.setProperty == "function" ? r.setProperty("display", "none", "important") : r.display = "none";
					} else {
						var i = e.stateNode, a = e.memoizedProps.style, o = a != null && a.hasOwnProperty("display") ? a.display : null;
						i.style.display = o == null || typeof o == "boolean" ? "" : ("" + o).trim();
					}
				} catch (t) {
					ff(e, e.return, t);
				}
				mu(e, t);
				break;
			case 6:
				try {
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, H = !0;
				} catch (t) {
					ff(e, e.return, t);
				}
				break;
			case 18:
				try {
					var s = e.stateNode;
					t ? wp(s, !0) : wp(e.stateNode, !1);
				} catch (t) {
					ff(e, e.return, t);
				}
				break;
			case 22:
			case 23:
				e.memoizedState === null && fu(e, t);
				break;
			default: fu(e, t);
		}
	}
	function mu(e, t) {
		if (e.subtreeFlags & 67108864) for (e = e.child; e !== null;) {
			a: {
				var n = e, r = t;
				switch (n.tag) {
					case 4:
						pu(n, r);
						break a;
					case 22:
						n.memoizedState === null && mu(n, r);
						break a;
					default: mu(n, r);
				}
			}
			e = e.sibling;
		}
	}
	function hu(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, hu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Ot(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var gu = null, _u = !1;
	function vu(e, t, n) {
		for (n = n.child; n !== null;) yu(e, t, n), n = n.sibling;
	}
	function yu(e, t, n) {
		if (qe && typeof qe.onCommitFiberUnmount == "function") try {
			qe.onCommitFiberUnmount(Ke, n);
		} catch {}
		switch (n.tag) {
			case 26:
				Y || Sl(n, t), vu(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !Y && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				Y || Sl(n, t), Tl(n);
				var r = gu, i = _u;
				Sp(n.type) && (gu = n.stateNode, _u = !1), vu(e, t, n), gm(n.stateNode, n.type, n.memoizedProps), gu = r, _u = i;
				break;
			case 5: Y || Sl(n, t), Tl(n);
			case 6:
				if (n.tag === 6 && Tl(n), r = gu, i = _u, gu = null, vu(e, t, n), gu = r, _u = i, gu !== null) {
					if (_u) try {
						(gu.nodeType === 9 ? gu.body : gu.nodeName === "HTML" ? gu.ownerDocument.body : gu).removeChild(n.stateNode), H = !0;
					} catch (e) {
						ff(n, t, e);
					}
					else try {
						gu.removeChild(n.stateNode), H = !0;
					} catch (e) {
						ff(n, t, e);
					}
				}
				break;
			case 18:
				gu !== null && (_u ? (e = gu, Cp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Hh(e)) : Cp(gu, n.stateNode));
				break;
			case 4:
				r = gu, i = _u, gu = n.stateNode.containerInfo, _u = !0, vu(e, t, n), gu = r, _u = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				vl(2, n, t), Y || vl(4, n, t), vu(e, t, n);
				break;
			case 1:
				Y || (Sl(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && bl(n, t, r)), vu(e, t, n);
				break;
			case 21:
				vu(e, t, n);
				break;
			case 22:
				Y = (r = Y) || n.memoizedState !== null, vu(e, t, n), Y = r;
				break;
			case 30:
				Sl(n, t), vu(e, t, n);
				break;
			case 7:
				Y || Sl(n, t), vu(e, t, n);
				break;
			default: vu(e, t, n);
		}
	}
	function bu(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Hh(e);
			} catch (e) {
				ff(t, t.return, e);
			}
		}
	}
	function xu(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Hh(e);
		} catch (e) {
			ff(t, t.return, e);
		}
	}
	function Su(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new ru()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new ru()), t;
			default: throw Error(s(435, e.tag));
		}
	}
	function Cu(e, t) {
		var n = Su(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = _f.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function wu(e, t, n) {
		var r = t.deletions;
		if (r !== null) for (var i = 0; i < r.length; i++) {
			var a = r[i], o = e, c = t, l = c;
			a: for (; l !== null;) {
				switch (l.tag) {
					case 27:
						if (Sp(l.type)) {
							gu = l.stateNode, _u = !1;
							break a;
						}
						break;
					case 5:
						gu = l.stateNode, _u = !1;
						break a;
					case 3:
					case 4:
						gu = l.stateNode.containerInfo, _u = !0;
						break a;
				}
				l = l.return;
			}
			if (gu === null) throw Error(s(160));
			yu(o, c, a), gu = null, _u = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) Eu(t, e, n), t = t.sibling;
	}
	var Tu = null;
	function Eu(e, t, n) {
		var r = e.alternate, i = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (i & 4 && (r = e.updateQueue, r = r === null ? null : r.events, r !== null)) for (var a = 0; a < r.length; a++) {
					var o = r[a];
					o.ref.impl = o.nextImpl;
				}
				wu(t, e, n), Du(e), i & 4 && (vl(3, e, e.return), _l(3, e), vl(5, e, e.return));
				break;
			case 1:
				wu(t, e, n), Du(e), i & 512 && (Y || r === null || Sl(r, r.return)), i & 64 && eu && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? t : n.concat(t))));
				break;
			case 26:
				if (a = Tu, wu(t, e, n), Du(e), i & 512 && (Y || r === null || Sl(r, r.return)), i & 4) {
					if (i = r === null ? null : r.memoizedState, n = e.memoizedState, r === null) {
						if (n === null) {
							if (e.stateNode === null) {
								if (eu) e.stateNode = fp(e.type, e.memoizedProps, t.containerInfo, e);
								else {
									a: {
										t = e.type, n = e.memoizedProps, i = a.ownerDocument || a;
										b: switch (t) {
											case "title":
												r = i.getElementsByTagName("title")[0], (!r || r[Et] || r[yt] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = i.createElement(t), i.head.insertBefore(r, i.querySelector("head > title"))), np(r, t, n), r[yt] = e, Nt(r), t = r;
												break a;
											case "link":
												if (a = Gm("link", "href", i).get(t + (n.href || ""))) {
													for (o = 0; o < a.length; o++) if (r = a[o], r.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && r.getAttribute("rel") === (n.rel == null ? null : n.rel) && r.getAttribute("title") === (n.title == null ? null : n.title) && r.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
														a.splice(o, 1);
														break b;
													}
												}
												r = i.createElement(t), np(r, t, n), i.head.appendChild(r);
												break;
											case "meta":
												if (a = Gm("meta", "content", i).get(t + (n.content || ""))) {
													for (o = 0; o < a.length; o++) if (r = a[o], r.getAttribute("content") === (n.content == null ? null : "" + n.content) && r.getAttribute("name") === (n.name == null ? null : n.name) && r.getAttribute("property") === (n.property == null ? null : n.property) && r.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && r.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
														a.splice(o, 1);
														break b;
													}
												}
												r = i.createElement(t), np(r, t, n), i.head.appendChild(r);
												break;
											default: throw Error(s(468, t));
										}
										r[yt] = e, Nt(r), t = r;
									}
									e.stateNode = t;
								}
							} else eu || Km(a, e.type, e.stateNode);
						} else e.stateNode = Bm(a, n, e.memoizedProps);
					} else i === n ? n === null && e.stateNode !== null && kl(e, e.memoizedProps, r.memoizedProps) : (i === null ? (t = r.stateNode, t === null || Y || t.parentNode.removeChild(t)) : i.count--, n === null ? eu || Km(a, e.type, e.stateNode) : Bm(a, n, e.memoizedProps));
				}
				break;
			case 27:
				wu(t, e, n), Du(e), i & 512 && (Y || r === null || Sl(r, r.return)), r !== null && i & 4 && kl(e, e.memoizedProps, r.memoizedProps);
				break;
			case 5:
				if (a = tu, tu = !1, wu(t, e, n), tu = a, Du(e), i & 512 && (Y || r === null || Sl(r, r.return)), e.flags & 32) {
					t = e.stateNode;
					try {
						W(t, ""), H = !0;
					} catch (t) {
						ff(e, e.return, t);
					}
				}
				i & 4 && e.stateNode != null && (t = e.memoizedProps, kl(e, t, r === null ? t : r.memoizedProps)), i & 1024 && (nu = !0);
				break;
			case 6:
				if (wu(t, e, n), Du(e), i & 4) {
					if (e.stateNode === null) throw Error(s(162));
					t = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = t, H = !0;
					} catch (t) {
						ff(e, e.return, t);
					}
				}
				break;
			case 3:
				if (H = !1, Wm = null, a = Tu, Tu = bm(t.containerInfo), wu(t, e, n), Tu = a, Du(e), i & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					ff(e, e.return, t);
				}
				nu && (nu = !1, Ou(e)), H = !1;
				break;
			case 4:
				i = tu, tu = eu, r = Ut(), a = Tu, Tu = bm(e.stateNode.containerInfo), wu(t, e, n), Du(e), Tu = a, H && ou && (su = !0), H = r, tu = i;
				break;
			case 12:
				wu(t, e, n), Du(e);
				break;
			case 31:
				wu(t, e, n), Du(e), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Cu(e, t)));
				break;
			case 13:
				wu(t, e, n), Du(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (fd = z()), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Cu(e, t)));
				break;
			case 22:
				a = e.memoizedState !== null, o = r !== null && r.memoizedState !== null;
				var c = eu, l = Y, u = tu;
				eu = c || a, tu = u || a, Y = l || o, wu(t, e, n), Y = l, tu = u, eu = c, Du(e), i & 8192 && (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, !a || r === null || o || eu || Y || (t = o || Y, n = eu, r = Y, eu = a || eu, Y = t, Mu(e, 2), eu = n, Y = r), !a && tu || fu(e, a)), i & 4 && (t = e.updateQueue, t !== null && (n = t.retryQueue, n !== null && (t.retryQueue = null, Cu(e, n))));
				break;
			case 19:
				wu(t, e, n), Du(e), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Cu(e, t)));
				break;
			case 30:
				i & 512 && (Y || r === null || Sl(r, r.return)), i = Ut(), a = ou, o = (n & 335544064) === n, c = e.memoizedProps, ou = o && mi(c.default, c.update) !== "none", wu(t, e, n), Du(e), o && r !== null && H && (e.flags |= 4), ou = a, H = i;
				break;
			case 21: break;
			case 7: i & 512 && (Y || r === null || Sl(r, r.return)), r && r.stateNode !== null && (r.stateNode._fragmentFiber = e);
			default: wu(t, e, n), Du(e);
		}
	}
	function Du(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Al(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				r = null;
				for (var i = e.return; i !== null;) {
					if (Dl(i)) {
						var a = i.stateNode;
						r === null ? r = [a] : r.push(a);
					}
					if (El(i)) break;
					i = i.return;
				}
				var o = r;
				if (n == null) throw Error(s(160));
				switch (n.tag) {
					case 27:
						var c = n.stateNode;
						Nl(e, jl(e), c, o);
						break;
					case 5:
						var l = n.stateNode;
						n.flags & 32 && (W(l, ""), n.flags &= -33), Nl(e, jl(e), l, o);
						break;
					case 3:
					case 4:
						var u = n.stateNode.containerInfo;
						Ml(e, jl(e), u, o);
						break;
					default: throw Error(s(161));
				}
			} catch (t) {
				ff(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function Ou(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			Ou(t), t.tag === 5 && t.flags & 1024 && (t = t.stateNode, gh = !0, t.reset(), gh = !1), e = e.sibling;
		}
	}
	function ku(e, t) {
		if (t.subtreeFlags & 9270) for (t = t.child; t !== null;) Au(t, e), t = t.sibling;
		else $l(t, !1);
	}
	function Au(e, t) {
		var n = e.alternate;
		if (n === null) Gl(e, !1);
		else switch (e.tag) {
			case 3:
				if (cu = au = !1, zl(), ku(t, e), !au && !su) {
					if (e = Rl, e !== null) for (var r = 0; r < e.length; r += 3) {
						n = e[r];
						var i = e[r + 1];
						Ep(n, e[r + 2]), n = n.ownerDocument.documentElement, n !== null && n.animate({
							opacity: [0, 0],
							pointerEvents: ["none", "none"]
						}, {
							duration: 0,
							fill: "forwards",
							pseudoElement: "::view-transition-group(" + i + ")"
						});
					}
					e = t.containerInfo, e = e.nodeType === 9 ? e.documentElement : e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "" && (e.style.viewTransitionName = "none", e.animate({
						opacity: [0, 0],
						pointerEvents: ["none", "none"]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition-group(root)"
					}), e.animate({
						width: [0, 0],
						height: [0, 0]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition"
					})), cu = !0;
				}
				Rl = null;
				break;
			case 5:
				ku(t, e);
				break;
			case 4:
				r = au, au = !1, ku(t, e), au && (su = !0), au = r;
				break;
			case 22:
				e.memoizedState === null && (n.memoizedState === null ? ku(t, e) : Gl(e, !1));
				break;
			case 30:
				r = au, i = zl(), au = !1, ku(t, e), au && (e.flags |= 4);
				var a = e.memoizedProps, o = e.stateNode;
				t = fi(a, o), o = fi(n.memoizedProps, o);
				var s = mi(a.default, a.update);
				s === "none" ? t = !1 : (a = n.memoizedState, n.memoizedState = null, n = e.child, Bl = 0, t = Ql(e, n, t, o, s, a, !0), Bl !== (a === null ? 0 : a.length) && (e.flags |= 32)), e.flags & 4 && t ? (jd(e, e.memoizedProps.onUpdate), Rl = i) : i !== null && (i.push.apply(i, Rl), Rl = i), au = e.flags & 32 ? !0 : r;
				break;
			default: ku(t, e);
		}
	}
	function ju(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) du(e, t.alternate, t), t = t.sibling;
	}
	function Mu(e, t) {
		for (e = e.child; e !== null;) {
			var n = e, r = t;
			switch (n.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					vl(4, n, n.return), Mu(n, r);
					break;
				case 1:
					Sl(n, n.return);
					var i = n.stateNode;
					typeof i.componentWillUnmount == "function" && bl(n, n.return, i), Mu(n, r);
					break;
				case 27: r & 2 && gm(n.stateNode, n.type, n.memoizedProps);
				case 5:
					Sl(n, n.return), n.tag !== 5 && n.tag !== 27 || Tl(n), Mu(n, r);
					break;
				case 6:
					Tl(n);
					break;
				case 26:
					Sl(n, n.return), i = n.stateNode, n.memoizedState !== null || i === null || Y || i.parentNode.removeChild(i), Mu(n, r);
					break;
				case 22:
					n.memoizedState === null && Mu(n, r);
					break;
				case 30:
					Sl(n, n.return), Mu(n, r);
					break;
				case 7: Sl(n, n.return);
				default: Mu(n, r);
			}
			e = e.sibling;
		}
	}
	function Nu(e, t, n) {
		for (n = t.subtreeFlags & 8772 ? n : n & -2, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags, s = !!(n & 1);
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Nu(i, a, n), _l(4, a);
					break;
				case 1:
					if (Nu(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						ff(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var c = r.stateNode;
						try {
							var l = i.shared.hiddenCallbacks;
							if (l !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < l.length; i++) vo(l[i], c);
						} catch (e) {
							ff(r, r.return, e);
						}
					}
					s && o & 64 && yl(a), xl(a, a.return);
					break;
				case 27: n & 2 && Pl(a);
				case 5:
					a.tag !== 5 && a.tag !== 27 || wl(a), Nu(i, a, n), s && r === null && o & 4 && Ol(a), xl(a, a.return);
					break;
				case 6:
					wl(a);
					break;
				case 26:
					c = a.stateNode, a.memoizedState !== null || c === null || eu || Km(bm(c.ownerDocument), a.type, c), Nu(i, a, n), s && r === null && o & 4 && Ol(a), xl(a, a.return);
					break;
				case 12:
					Nu(i, a, n);
					break;
				case 31:
					Nu(i, a, n), s && o & 4 && bu(i, a);
					break;
				case 13:
					Nu(i, a, n), s && o & 4 && xu(i, a);
					break;
				case 22:
					a.memoizedState === null && Nu(i, a, n), xl(a, a.return);
					break;
				case 30:
					Nu(i, a, n), xl(a, a.return);
					break;
				case 7: xl(a, a.return);
				default: Nu(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Pu(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && Da(n));
	}
	function Fu(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Da(e));
	}
	function Iu(e, t, n, r) {
		var i = (n & 335544064) === n;
		if (t.subtreeFlags & (i ? 10262 : 10256)) for (t = t.child; t !== null;) Lu(e, t, n, r), t = t.sibling;
		else i && Zl(t);
	}
	function Lu(e, t, n, r) {
		var i = (n & 335544064) === n;
		i && t.alternate === null && t.return !== null && t.return.alternate !== null && Xl(t);
		var a = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Iu(e, t, n, r), a & 2048 && _l(9, t);
				break;
			case 1:
				Iu(e, t, n, r);
				break;
			case 3:
				Iu(e, t, n, r), i && cu && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && Da(a)));
				break;
			case 12:
				if (a & 2048) {
					Iu(e, t, n, r), a = t.stateNode;
					try {
						var o = t.memoizedProps, s = o.id, c = o.onPostCommit;
						typeof c == "function" && c(s, t.alternate === null ? "mount" : "update", a.passiveEffectDuration, -0);
					} catch (e) {
						ff(t, t.return, e);
					}
				} else Iu(e, t, n, r);
				break;
			case 31:
				Iu(e, t, n, r);
				break;
			case 13:
				Iu(e, t, n, r);
				break;
			case 23: break;
			case 22:
				o = t.stateNode, s = t.alternate, t.memoizedState === null ? (i && s !== null && s.memoizedState !== null && Xl(t), o._visibility & 2 ? Iu(e, t, n, r) : (o._visibility |= 2, Ru(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))) : (i && s !== null && s.memoizedState === null && Xl(s), o._visibility & 2 ? Iu(e, t, n, r) : zu(e, t)), a & 2048 && Pu(s, t);
				break;
			case 24:
				Iu(e, t, n, r), a & 2048 && Fu(t.alternate, t);
				break;
			case 30:
				i && (a = t.alternate, a !== null && (Ul(a.child, !0), Ul(t.child, !0))), Iu(e, t, n, r);
				break;
			default: Iu(e, t, n, r);
		}
	}
	function Ru(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Ru(a, o, s, c, i), _l(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Ru(a, o, s, c, i)) : u._visibility & 2 ? Ru(a, o, s, c, i) : zu(a, o), i && l & 2048 && Pu(o.alternate, o);
					break;
				case 24:
					Ru(a, o, s, c, i), i && l & 2048 && Fu(o.alternate, o);
					break;
				default: Ru(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function zu(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					zu(n, r), i & 2048 && Pu(r.alternate, r);
					break;
				case 24:
					zu(n, r), i & 2048 && Fu(r.alternate, r);
					break;
				default: zu(n, r);
			}
			t = t.sibling;
		}
	}
	var Bu = 8192;
	function Vu(e, t, n) {
		if (e.subtreeFlags & Bu) for (e = e.child; e !== null;) Hu(e, t, n), e = e.sibling;
	}
	function Hu(e, t, n) {
		switch (e.tag) {
			case 26:
				Vu(e, t, n), e.flags & Bu && (e.memoizedState === null ? (e = e.stateNode, (t & 335544128) === t && Zm(n, e)) : Qm(n, Tu, e.memoizedState, e.memoizedProps));
				break;
			case 5:
				Vu(e, t, n), e.flags & Bu && (e = e.stateNode, (t & 335544128) === t && Zm(n, e));
				break;
			case 3:
			case 4:
				var r = Tu;
				Tu = bm(e.stateNode.containerInfo), Vu(e, t, n), Tu = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Bu, Bu = 16777216, Vu(e, t, n), Bu = r) : Vu(e, t, n));
				break;
			case 30:
				if ((e.flags & Bu) !== 0 && (r = e.memoizedProps.name, r != null && r !== "auto")) {
					var i = e.stateNode;
					i.paired = null, Il === null && (Il = /* @__PURE__ */ new Map()), Il.set(r, i);
				}
				Vu(e, t, n);
				break;
			default: Vu(e, t, n);
		}
	}
	function Uu(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Wu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				iu = r, qu(r, e);
			}
			Uu(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Gu(e), e = e.sibling;
	}
	function Gu(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Wu(e), e.flags & 2048 && vl(9, e, e.return);
				break;
			case 3:
				Wu(e);
				break;
			case 12:
				Wu(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Ku(e)) : Wu(e);
				break;
			default: Wu(e);
		}
	}
	function Ku(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				iu = r, qu(r, e);
			}
			Uu(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					vl(8, t, t.return), Ku(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Ku(t));
					break;
				default: Ku(t);
			}
			e = e.sibling;
		}
	}
	function qu(e, t) {
		for (; iu !== null;) {
			var n = iu;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					vl(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: Da(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, iu = r;
			else a: for (n = e; iu !== null;) {
				r = iu;
				var i = r.sibling, a = r.return;
				if (hu(r), r === n) {
					iu = null;
					break a;
				}
				if (i !== null) {
					i.return = a, iu = i;
					break a;
				}
				iu = a;
			}
		}
	}
	var Ju = {
		getCacheForType: function(e) {
			var t = ya(Ta), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return ya(Ta).controller.signal;
		}
	}, Yu = typeof WeakMap == "function" ? WeakMap : Map, X = 0, Xu = null, Z = null, Q = 0, Zu = 0, Qu = null, $u = !1, ed = !1, td = !1, nd = 0, rd = 0, id = 0, ad = 0, od = 0, sd = 0, cd = 0, ld = null, ud = null, dd = !1, fd = 0, pd = 0, md = Infinity, hd = null, gd = null, _d = 0, vd = null, yd = null, bd = 0, xd = 0, Sd = null, Cd = null, wd = null, Td = null, Ed = null, Dd = 0, Od = null;
	function kd() {
		return X & 2 && Q !== 0 ? Q & -Q : A.T === null ? gt() : Nf();
	}
	function Ad() {
		if (sd === 0) {
			if (!(Q & 536870912) || K) {
				var e = et;
				et <<= 1, !(et & 3932160) && (et = 262144), sd = e;
			} else sd = 536870912;
		}
		return e = q.current, e !== null && (e.flags |= 32), sd;
	}
	function jd(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(fi(e.memoizedProps, n))), Td === null && (Td = []), Td.push(t.bind(null, r));
		}
	}
	function Md(e, t, n) {
		(e === Xu && (Zu === 2 || Zu === 9) || e.cancelPendingCommit !== null) && (zd(e, 0), Id(e, Q, sd, !1)), lt(e, n), X & 2 && e === Xu || (e === Xu && (!(X & 2) && (ad |= n), rd === 4 && Id(e, Q, sd, !1)), Tf(e));
	}
	function Nd(e, t, n) {
		if (X & 6) throw Error(s(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || it(e, t), i = r ? qd(e, t) : Gd(e, t, !0), a = r;
		do {
			if (i === 0) {
				ed && !r && Id(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, a && !Fd(n)) i = Gd(e, t, !1), a = !1;
			else {
				if (i === 2) {
					if (a = t, e.errorRecoveryDisabledLanes & a) var o = 0;
					else o = e.pendingLanes & -536870913, o = o === 0 ? o & 536870912 ? 536870912 : 0 : o;
					if (o !== 0) {
						t = o;
						a: {
							var c = e;
							i = ld;
							var l = c.current.memoizedState.isDehydrated;
							if (l && (zd(c, o).flags |= 256), o = Gd(c, o, !1), o !== 2 && o !== 6) {
								if (td && !l) {
									c.errorRecoveryDisabledLanes |= a, ad |= a, i = 4;
									break a;
								}
								a = ud, ud = i, a !== null && (ud === null ? ud = a : ud.push.apply(ud, a));
							}
							i = o;
						}
						if (a = !1, i !== 2) continue;
					}
				}
				if (i === 1) {
					zd(e, 0), Id(e, t, 0, !0);
					break;
				}
				a: {
					switch (r = e, a = i, a) {
						case 0:
						case 1: throw Error(s(345));
						case 4: if ((t & 4194048) !== t && (t & 62914560) !== t) break;
						case 6:
							Id(r, t, sd, !$u);
							break a;
						case 2:
							ud = null;
							break;
						case 3:
						case 5: break;
						default: throw Error(s(329));
					}
					if ((t & 62914560) === t && (i = fd + 300 - z(), 10 < i)) {
						if (Id(r, t, sd, !$u), rt(r, 0, !0) !== 0) break a;
						bd = t, r.timeoutHandle = gp(Pd.bind(null, r, n, ud, hd, dd, t, sd, ad, cd, $u, a, "Throttled", -0, 0), i);
						break a;
					}
					Pd(r, n, ud, hd, dd, t, sd, ad, cd, $u, a, null, -0, 0);
				}
				break;
			}
		} while (1);
		Tf(e);
	}
	function Pd(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		e.timeoutHandle = -1;
		var m = t.subtreeFlags, h = (a & 335544064) === a;
		d = null, (h || m & 8192 || (m & 16785408) == 16785408) && (d = {
			stylesheets: null,
			count: 0,
			imgCount: 0,
			imgBytes: 0,
			suspenseyImages: [],
			waitingForImages: !0,
			waitingForViewTransition: !1,
			unsuspend: pn
		}, Il = null, Hu(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? fd - z() : (a & 4194048) === a ? pd - z() : 0, m = eh(d, m), m !== null) ? (bd = a, e.cancelPendingCommit = m(ef.bind(null, e, t, a, n, r, i, o, s, c, l, u, d, null, f, p)), Id(e, a, o, !l)) : ef(e, t, a, n, r, i, o, s, c, l, u, d);
	}
	function Fd(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Ir(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function Id(e, t, n, r) {
		t = at(e, t), t &= ~od, t &= ~ad, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - Ye(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && dt(e, n, t);
	}
	function Ld() {
		return X & 6 ? !0 : (Ef(0, !1), !1);
	}
	function Rd() {
		if (Z !== null) {
			if (Zu === 0) var e = Z.return;
			else e = Z, da = ua = null, $o(e), $a = null, eo = 0, e = Z;
			for (; e !== null;) gl(e.alternate, e), e = e.return;
			Z = null;
		}
	}
	function zd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), bd = 0, Rd(), Xu = e, Z = n = ki(e.current, null), Q = t, Zu = 0, Qu = null, $u = !1, ed = it(e, t), td = !1, cd = sd = od = ad = id = rd = 0, ud = ld = null, dd = !1, nd = at(e, t), yi(), n;
	}
	function Bd(e, t) {
		J = null, A.H = lc, t === Ua || t === Ga ? (t = Za(), Zu = 3) : t === Wa ? (t = Za(), Zu = 4) : Zu = t === Dc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Qu = t, Z === null && (rd = 1, xc(e, Li(t, e.current)));
	}
	function Vd() {
		var e = q.current;
		return e === null ? !0 : (Q & 4194048) === Q ? To === null : (Q & 62914560) === Q || Q & 536870912 ? e === To : !1;
	}
	function Hd() {
		var e = A.H;
		return A.H = lc, e === null ? lc : e;
	}
	function Ud() {
		var e = A.A;
		return A.A = Ju, e;
	}
	function Wd() {
		rd = 4, $u || (Q & 4194048) !== Q && q.current !== null || (ed = !0), !(id & 134217727) && !(ad & 134217727) || Xu === null || Id(Xu, Q, sd, !1);
	}
	function Gd(e, t, n) {
		var r = X;
		X |= 2;
		var i = Hd(), a = Ud();
		(Xu !== e || Q !== t) && (hd = null, zd(e, t)), t = !1;
		var o = rd;
		a: do
			try {
				if (Zu !== 0 && Z !== null) {
					var s = Z, c = Qu;
					switch (Zu) {
						case 8:
							Rd(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							q.current === null && (t = !0);
							var l = Zu;
							if (Zu = 0, Qu = null, Zd(e, s, c, l), n && ed) {
								o = 0;
								break a;
							}
							break;
						default: l = Zu, Zu = 0, Qu = null, Zd(e, s, c, l);
					}
				}
				Kd(), o = rd;
				break;
			} catch (t) {
				Bd(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, da = ua = null, X = r, A.H = i, A.A = a, Z === null && (Xu = null, Q = 0, yi()), o;
	}
	function Kd() {
		for (; Z !== null;) Yd(Z);
	}
	function qd(e, t) {
		var n = X;
		X |= 2;
		var r = Hd(), i = Ud();
		Xu !== e || Q !== t ? (hd = null, md = z() + 500, zd(e, t)) : ed = it(e, t);
		a: do
			try {
				if (Zu !== 0 && Z !== null) {
					t = Z;
					var a = Qu;
					b: switch (Zu) {
						case 1:
							Zu = 0, Qu = null, Zd(e, t, a, 1);
							break;
						case 2:
						case 9:
							if (qa(a)) {
								Zu = 0, Qu = null, Xd(t);
								break;
							}
							t = function() {
								Zu !== 2 && Zu !== 9 || Xu !== e || (Zu = 7), Tf(e);
							}, a.then(t, t);
							break a;
						case 3:
							Zu = 7;
							break a;
						case 4:
							Zu = 5;
							break a;
						case 7:
							qa(a) ? (Zu = 0, Qu = null, Xd(t)) : (Zu = 0, Qu = null, Zd(e, t, a, 7));
							break;
						case 5:
							var o = null;
							switch (Z.tag) {
								case 26: o = Z.memoizedState;
								case 5:
								case 27:
									var c = Z;
									if (o ? Ym(o) : c.stateNode.complete) {
										Zu = 0, Qu = null;
										var l = c.sibling;
										if (l !== null) Z = l;
										else {
											var u = c.return;
											u === null ? Z = null : (Z = u, Qd(u));
										}
										break b;
									}
							}
							Zu = 0, Qu = null, Zd(e, t, a, 5);
							break;
						case 6:
							Zu = 0, Qu = null, Zd(e, t, a, 6);
							break;
						case 8:
							Rd(), rd = 6;
							break a;
						default: throw Error(s(462));
					}
				}
				Jd();
				break;
			} catch (t) {
				Bd(e, t);
			}
		while (1);
		return da = ua = null, A.H = r, A.A = i, X = n, Z === null ? (Xu = null, Q = 0, yi(), rd) : 0;
	}
	function Jd() {
		for (; Z !== null && !Re();) Yd(Z);
	}
	function Yd(e) {
		var t = sl(e.alternate, e, nd);
		e.memoizedProps = e.pendingProps, t === null ? Qd(e) : Z = t;
	}
	function Xd(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = Vc(n, t, t.pendingProps, t.type, void 0, Q);
				break;
			case 11:
				t = Vc(n, t, t.pendingProps, t.type.render, t.ref, Q);
				break;
			case 5:
				$o(t);
				var r = t;
				r === Qi && (K ? (ia(r), r.tag === 5 && r.stateNode != null && (G = r.stateNode)) : (ia(r), K = !0));
			default: gl(n, t), t = Z = Ai(t, nd), t = sl(n, t, nd);
		}
		e.memoizedProps = e.pendingProps, t === null ? Qd(e) : Z = t;
	}
	function Zd(e, t, n, r) {
		da = ua = null, $o(t), $a = null, eo = 0;
		var i = t.return;
		try {
			if (Ec(e, i, t, n, Q)) {
				rd = 1, xc(e, Li(n, e.current)), Z = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw Z = i, t;
			rd = 1, xc(e, Li(n, e.current)), Z = null;
			return;
		}
		t.flags & 32768 ? (K || r === 1 ? e = !0 : ed || Q & 536870912 ? e = !1 : ($u = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = q.current, r !== null && r.tag === 13 && (r.flags |= 16384))), $d(t, e)) : Qd(t);
	}
	function Qd(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				$d(t, $u);
				return;
			}
			e = t.return;
			var n = ml(t.alternate, t, nd);
			if (n !== null) {
				Z = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				Z = t;
				return;
			}
			Z = t = e;
		} while (t !== null);
		rd === 0 && (rd = 5);
	}
	function $d(e, t) {
		do {
			var n = hl(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, Z = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				Z = e;
				return;
			}
			Z = e = n;
		} while (e !== null);
		rd = 6, Z = null;
	}
	function ef(e, t, n, r, i, a, o, c, l, u, d, f) {
		e.cancelPendingCommit = null;
		do
			lf();
		while (_d !== 0);
		if (X & 6) throw Error(s(327));
		if (t !== null) {
			if (t === e.current) throw Error(s(177));
			e === Xu && (Z = Xu = null, Q = 0), yd = t, vd = e, bd = n, Sd = i, Cd = r, tf(e, t, n, o, c, l, f);
		}
	}
	function tf(e, t, n, r, i, a, o) {
		var s = t.lanes | t.childLanes;
		if (xd = s, s |= vi, ut(e, n, s, r, i, a), Td = null, (n & 335544064) === n ? (Ed = Aa(e), r = 10262) : (Ed = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, vf(V, function() {
			return uf(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Fl = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = A.T, A.T = null, i = j.p, j.p = 2, a = X, X |= 4;
			try {
				lu(e, t, n);
			} finally {
				X = a, j.p = i, A.T = r;
			}
		}
		_d = 1, Fl ? wd = Mp(o, e.containerInfo, Ed, af, of, rf, sf, uf, nf, null, null) : (af(), of(), sf());
	}
	function nf(e) {
		if (_d !== 0) {
			var t = vd.onRecoverableError;
			t(e, { componentStack: null });
		}
	}
	function rf() {
		_d === 3 && (_d = 0, Au(yd, vd), _d = 4);
	}
	function af() {
		if (_d === 1) {
			_d = 0;
			var e = vd, t = yd, n = bd, r = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || r) {
				r = A.T, A.T = null;
				var i = j.p;
				j.p = 2;
				var a = X;
				X |= 4;
				try {
					ou = su = !1, Eu(t, e, n), n = cp;
					var o = Hr(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && Vr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Ur(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Br(s, h), v = Br(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					gh = !!sp, cp = sp = null;
				} finally {
					X = a, j.p = i, A.T = r;
				}
			}
			e.current = t, _d = 2;
		}
	}
	function of() {
		if (_d === 2) {
			_d = 0;
			var e = vd, t = yd, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = A.T, A.T = null;
				var r = j.p;
				j.p = 2;
				var i = X;
				X |= 4;
				try {
					du(e, t.alternate, t);
				} finally {
					X = i, j.p = r, A.T = n;
				}
			}
			_d = 3;
		}
	}
	function sf() {
		if (_d === 4 || _d === 3) {
			_d = 0;
			var e = wd;
			wd = null, ze();
			var t = vd, n = yd, r = bd, i = Cd, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? _d = 5 : (_d = 0, yd = vd = null, cf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (gd = null), ht(r), n = n.stateNode, qe && typeof qe.onCommitFiberRoot == "function") try {
				qe.onCommitFiberRoot(Ke, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = A.T, a = j.p, j.p = 2, A.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					A.T = n, j.p = a;
				}
			}
			if (i = Td, o = Ed, Ed = null, i !== null && (Td = null, o === null && (o = []), e !== null)) for (c = 0; c < i.length; c++) n = (0, i[c])(o), n !== void 0 && e.finished.finally(n);
			bd & 3 && lf(), Tf(t), a = t.pendingLanes, r & 261930 && a & 42 ? t === Od ? Dd++ : (Dd = 0, Od = t) : (Dd = 0, Od = null), Ef(0, !1);
		}
	}
	function cf(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, Da(t)));
	}
	function lf() {
		return wd !== null && (wd.skipTransition(), wd = null), af(), of(), sf(), uf();
	}
	function uf() {
		if (_d !== 5) return !1;
		var e = vd, t = xd;
		xd = 0;
		var n = ht(bd), r = A.T, i = j.p;
		try {
			j.p = 32 > n ? 32 : n, A.T = null, n = Sd, Sd = null;
			var a = vd, o = bd;
			if (_d = 0, yd = vd = null, bd = 0, X & 6) throw Error(s(331));
			var c = X;
			if (X |= 4, Gu(a.current), Lu(a, a.current, o, n), X = c, Ef(0, !1), qe && typeof qe.onPostCommitFiberRoot == "function") try {
				qe.onPostCommitFiberRoot(Ke, a);
			} catch {}
			return !0;
		} finally {
			j.p = i, A.T = r, cf(e, t);
		}
	}
	function df(e, t, n) {
		t = Li(n, t), t = Cc(e.stateNode, t, 2), e = fo(e, t, 2), e !== null && (lt(e, 2), Tf(e));
	}
	function ff(e, t, n) {
		if (e.tag === 3) df(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				df(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (gd === null || !gd.has(r))) {
					e = Li(n, e), n = wc(2), r = fo(t, n, 2), r !== null && (Tc(n, r, t, e), lt(r, 2), Tf(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function pf(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Yu();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (td = !0, i.add(n), e = mf.bind(null, e, t, n), t.then(e, e));
	}
	function mf(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, Xu === e && (Q & n) === n && (rd === 4 || rd === 3 && (Q & 62914560) === Q && 300 > z() - fd ? X & 2 ? od |= n : zd(e, 0) : od |= n, cd === Q && (cd = 0)), Tf(e);
	}
	function hf(e, t) {
		t === 0 && (t = st()), e = Si(e, t), e !== null && (lt(e, t), Tf(e));
	}
	function gf(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), hf(e, n);
	}
	function _f(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, i = e.memoizedState;
				i !== null && (n = i.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(s(314));
		}
		r !== null && r.delete(t), hf(e, n);
	}
	function vf(e, t) {
		return L(e, t);
	}
	var yf = null, bf = null, xf = !1, Sf = !1, Cf = !1, wf = 0;
	function Tf(e) {
		e !== bf && e.next === null && (bf === null ? yf = bf = e : bf = bf.next = e), Sf = !0, xf || (xf = !0, Mf());
	}
	function Ef(e, t) {
		if (!Cf && Sf) {
			Cf = !0;
			do
				for (var n = !1, r = yf; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - Ye(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, jf(r, a));
						} else a = Q, a = rt(r, r === Xu ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || it(r, a) || (n = !0, jf(r, a));
					}
					r = r.next;
				}
			while (n);
			Cf = !1;
		}
	}
	function Df() {
		Of();
	}
	function Of() {
		Sf = xf = !1;
		var e = 0;
		wf !== 0 && hp() && (e = wf);
		for (var t = z(), n = null, r = yf; r !== null;) {
			var i = r.next, a = kf(r, t);
			a === 0 ? (r.next = null, n === null ? yf = i : n.next = i, i === null && (bf = n)) : (n = r, (e !== 0 || a & 3) && (Sf = !0)), r = i;
		}
		_d !== 0 && _d !== 5 || Ef(e, !1), wf !== 0 && (wf = 0);
	}
	function kf(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - Ye(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = ot(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Xu, n = Q, n = rt(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Zu === 2 || Zu === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && R(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || it(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && R(r), ht(n)) {
				case 2:
				case 8:
					n = Ve;
					break;
				case 32:
					n = V;
					break;
				case 268435456:
					n = Ue;
					break;
				default: n = V;
			}
			return r = Af.bind(null, e), n = L(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && R(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function Af(e, t) {
		if (_d !== 0 && _d !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (lf() && e.callbackNode !== n) return null;
		var r = Q;
		return r = rt(e, e === Xu ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Nd(e, r, t), kf(e, z()), e.callbackNode != null && e.callbackNode === n ? Af.bind(null, e) : null);
	}
	function jf(e, t) {
		if (lf()) return null;
		Nd(e, t, !0);
	}
	function Mf() {
		bp(function() {
			X & 6 ? L(Be, Df) : Of();
		});
	}
	function Nf() {
		if (wf === 0) {
			var e = Na;
			e === 0 && (e = $e, $e <<= 1, !($e & 261888) && ($e = 256)), wf = e;
		}
		return wf;
	}
	function Pf(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : fn(e);
	}
	function Ff(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Pf((i[bt] || null).action), o = r.submitter;
			o && (t = (t = o[bt] || null) ? Pf(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new Pn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (wf !== 0) {
								var e = new FormData(i, o);
								Ys(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = new FormData(i, o), Ys(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var If = 0; If < li.length; If++) {
		var Lf = li[If];
		ui(Lf.toLowerCase(), "on" + (Lf[0].toUpperCase() + Lf.slice(1)));
	}
	ui(ti, "onAnimationEnd"), ui(ni, "onAnimationIteration"), ui(ri, "onAnimationStart"), ui("dblclick", "onDoubleClick"), ui("focusin", "onFocus"), ui("focusout", "onBlur"), ui(ii, "onTransitionRun"), ui(ai, "onTransitionStart"), ui(oi, "onTransitionCancel"), ui(si, "onTransitionEnd"), Rt("onMouseEnter", ["mouseout", "mouseover"]), Rt("onMouseLeave", ["mouseout", "mouseover"]), Rt("onPointerEnter", ["pointerout", "pointerover"]), Rt("onPointerLeave", ["pointerout", "pointerover"]), Lt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Lt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Lt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Lt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Lt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Lt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var Rf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), zf = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Rf));
	function Bf(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						hi(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						hi(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function $(e, t) {
		var n = t[St];
		n === void 0 && (n = t[St] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Wf(t, e, 2, !1), n.add(r));
	}
	function Vf(e, t, n) {
		var r = 0;
		t && (r |= 4), Wf(n, e, r, t);
	}
	var Hf = "_reactListening" + Math.random().toString(36).slice(2);
	function Uf(e) {
		if (!e[Hf]) {
			e[Hf] = !0, Ft.forEach(function(t) {
				t !== "selectionchange" && (zf.has(t) || Vf(t, !1, e), Vf(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[Hf] || (t[Hf] = !0, Vf("selectionchange", !1, t));
		}
	}
	function Wf(e, t, n, r) {
		switch (Ch(t)) {
			case 2:
				var i = _h;
				break;
			case 8:
				i = vh;
				break;
			default: i = yh;
		}
		n = i.bind(null, t, n, e), i = void 0, !Cn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function Gf(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var o = r.tag;
			if (o === 3 || o === 4) {
				var s = r.stateNode.containerInfo;
				if (s === i) break;
				if (o === 4) for (o = r.return; o !== null;) {
					var c = o.tag;
					if ((c === 3 || c === 4) && o.stateNode.containerInfo === i) return;
					o = o.return;
				}
				for (; s !== null;) {
					if (o = kt(s), o === null) return;
					if (c = o.tag, c === 5 || c === 6 || c === 26 || c === 27) {
						r = a = o;
						continue a;
					}
					s = s.parentNode;
				}
			}
			r = r.return;
		}
		bn(function() {
			var r = a, i = hn(n), o = [];
			a: {
				var s = ci.get(e);
				if (s !== void 0) {
					var c = Pn, u = e;
					switch (e) {
						case "keypress": if (kn(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = Qn;
							break;
						case "focusin":
							u = "focus", c = Un;
							break;
						case "focusout":
							u = "blur", c = Un;
							break;
						case "beforeblur":
						case "afterblur":
							c = Un;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							c = Vn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = Hn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = tr;
							break;
						case ti:
						case ni:
						case ri:
							c = Wn;
							break;
						case si:
							c = nr;
							break;
						case "scroll":
						case "scrollend":
							c = In;
							break;
						case "wheel":
							c = rr;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = Gn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							c = $n;
							break;
						case "submit":
							c = er;
							break;
						case "toggle":
						case "beforetoggle": c = ir;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? s === null ? null : s + "Capture" : s;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = xn(m, p), g != null && d.push(Kf(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (s = new c(s, u, null, n, i), o.push({
						event: s,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (c = e === "mouseover" || e === "pointerover", s = e === "mouseout" || e === "pointerout", c && n !== mn && (u = n.relatedTarget || n.fromElement) && (kt(u) || u[xt])) break a;
					(s || c) && (u = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, s ? (c = n.relatedTarget || n.toElement, s = r, c = c ? kt(c) : null, c !== null && (f = l(c), d = c.tag, c !== f || d !== 5 && d !== 27 && d !== 6) && (c = null)) : (s = null, c = r), s !== c && (d = Vn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = $n, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = s == null ? u : jt(s), h = c == null ? u : jt(c), u = new d(g, m + "leave", s, n, i), u.target = f, u.relatedTarget = h, g = null, kt(i) === r && (d = new d(p, m + "enter", c, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = s && c ? T(s, c, Jf) : null, s !== null && Yf(o, u, s, d, !1), c !== null && f !== null && Yf(o, f, c, d, !0)));
				}
				a: {
					if (s = r ? jt(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var _ = wr;
					else if (vr(s)) {
						if (Tr) _ = Pr;
						else {
							_ = Mr;
							var v = jr;
						}
					} else c = s.nodeName, !c || c.toLowerCase() !== "input" || s.type !== "checkbox" && s.type !== "radio" ? r && ln(r.elementType) && (_ = wr) : _ = Nr;
					if (_ &&= _(e, r)) {
						yr(o, _, n, i);
						break a;
					}
					v && v(e, s, r);
				}
				switch (v = r ? jt(r) : window, e) {
					case "focusin":
						(vr(v) || v.contentEditable === "true") && (Gr = v, Kr = r, qr = null);
						break;
					case "focusout":
						qr = Kr = Gr = null;
						break;
					case "mousedown":
						Jr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Jr = !1, Yr(o, n, i);
						break;
					case "selectionchange": if (Wr) break;
					case "keydown":
					case "keyup": Yr(o, n, i);
				}
				var y;
				if (or) b: {
					switch (e) {
						case "compositionstart":
							var b = "onCompositionStart";
							break b;
						case "compositionend":
							b = "onCompositionEnd";
							break b;
						case "compositionupdate":
							b = "onCompositionUpdate";
							break b;
					}
					b = void 0;
				}
				else mr ? fr(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (lr && n.locale !== "ko" && (mr || b !== "onCompositionStart" ? b === "onCompositionEnd" && mr && (y = On()) : (Tn = i, En = "value" in Tn ? Tn.value : Tn.textContent, mr = !0)), v = qf(r, b), 0 < v.length && (b = new Kn(b, e, null, n, i), o.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = pr(n), y !== null && (b.data = y)))), (y = cr ? hr(e, n) : gr(e, n)) && (b = qf(r, "onBeforeInput"), 0 < b.length && (v = new Kn("onBeforeInput", "beforeinput", null, n, i), o.push({
					event: v,
					listeners: b
				}), v.data = y)), Ff(o, e, r, n, i);
			}
			Bf(o, t);
		});
	}
	function Kf(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function qf(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = xn(e, n), i != null && r.unshift(Kf(e, i, a)), i = xn(e, t), i != null && r.push(Kf(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Jf(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Yf(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = xn(n, a), l != null && o.unshift(Kf(n, l, c))) : i || (l = xn(n, a), l != null && o.push(Kf(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Xf = /\r\n?/g, Zf = /\u0000|\uFFFD/g;
	function Qf(e) {
		return (typeof e == "string" ? e : "" + e).replace(Xf, "\n").replace(Zf, "");
	}
	function $f(e, t) {
		return t = Qf(t), Qf(e) === t;
	}
	function ep(e, t, n, r, i, a) {
		switch (n) {
			case "children":
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || W(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && W(e, "" + r);
				else return;
				break;
			case "className":
				Gt(e, "class", r);
				break;
			case "tabIndex":
				Gt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Gt(e, n, r);
				break;
			case "style":
				cn(e, r, a);
				return;
			case "data": if (t !== "object") {
				Gt(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href") || r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = fn(r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof a == "function" && (n === "formAction" ? (t !== "input" && ep(e, t, "name", i.name, i, null), ep(e, t, "formEncType", i.formEncType, i, null), ep(e, t, "formMethod", i.formMethod, i, null), ep(e, t, "formTarget", i.formTarget, i, null)) : (ep(e, t, "encType", i.encType, i, null), ep(e, t, "method", i.method, i, null), ep(e, t, "target", i.target, i, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = fn(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = pn);
				return;
			case "onScroll":
				r != null && $("scroll", e);
				return;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(s(61));
					if (n = r.__html, n != null) {
						if (i.children != null) throw Error(s(60));
						a?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = fn(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "credentialless":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				$("beforetoggle", e), $("toggle", e), Wt(e, "popover", r);
				break;
			case "xlinkActuate":
				Kt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Kt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Kt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Kt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Kt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Kt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Kt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Kt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Kt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Wt(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = un.get(n) || n, Wt(e, n, r);
			else return;
		}
		H = !0;
	}
	function tp(e, t, n, r, i, a) {
		switch (n) {
			case "style":
				cn(e, r, a);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(s(61));
					if (n = r.__html, n != null) {
						if (i.children != null) throw Error(s(60));
						a?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "children":
				if (typeof r == "string") W(e, r);
				else if (typeof r == "number" || typeof r == "bigint") W(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && $("scroll", e);
				return;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = pn);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!It.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (i = n.endsWith("Capture"), a = n.slice(2, i ? n.length - 7 : void 0), t = e[bt] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(a, t, i), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(a, r, i);
						break a;
					}
					H = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Wt(e, n, r);
				}
				return;
		}
		H = !0;
	}
	function np(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				$("error", e), $("load", e);
				var r = !1, i = !1, a;
				for (a in n) if (n.hasOwnProperty(a)) {
					var o = n[a];
					if (o != null) switch (a) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							i = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(s(137, t));
						default: ep(e, t, a, o, n, null);
					}
				}
				i && ep(e, t, "srcSet", n.srcSet, n, null), r && ep(e, t, "src", n.src, n, null);
				return;
			case "input":
				$("invalid", e);
				var c = a = o = i = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							i = d;
							break;
						case "type":
							o = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							a = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(s(137, t));
							break;
						default: ep(e, t, r, d, n, null);
					}
				}
				en(e, a, c, l, u, o, i, !1);
				return;
			case "select":
				for (i in $("invalid", e), r = o = a = null, n) if (n.hasOwnProperty(i) && (c = n[i], c != null)) switch (i) {
					case "value":
						a = c;
						break;
					case "defaultValue":
						o = c;
						break;
					case "multiple": r = c;
					default: ep(e, t, i, c, n, null);
				}
				t = a, n = o, e.multiple = !!r, t == null ? n != null && nn(e, !!r, n, !0) : nn(e, !!r, t, !1);
				return;
			case "textarea":
				for (o in $("invalid", e), a = i = r = null, n) if (n.hasOwnProperty(o) && (c = n[o], c != null)) switch (o) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						i = c;
						break;
					case "children":
						a = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(s(91));
						break;
					default: ep(e, t, o, c, n, null);
				}
				an(e, r, i, a);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: ep(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				$("beforetoggle", e), $("toggle", e), $("cancel", e), $("close", e);
				break;
			case "iframe":
			case "object":
				$("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < Rf.length; r++) $(Rf[r], e);
				break;
			case "image":
				$("error", e), $("load", e);
				break;
			case "details":
				$("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": $("error", e), $("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(s(137, t));
					default: ep(e, t, u, r, n, null);
				}
				return;
			default: if (ln(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && tp(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && ep(e, t, c, r, n, null));
	}
	var rp = {};
	function ip(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var i = null, a = null, o = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || ep(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							m !== f && (H = !0), a = m;
							break;
						case "name":
							m !== f && (H = !0), i = m;
							break;
						case "checked":
							m !== f && (H = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (H = !0), d = m;
							break;
						case "value":
							m !== f && (H = !0), o = m;
							break;
						case "defaultValue":
							m !== f && (H = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(s(137, t));
							break;
						default: m !== f && ep(e, t, p, m, r, f);
					}
				}
				U(e, o, c, l, u, d, a, i);
				return;
			case "select":
				for (a in m = o = c = p = null, n) if (l = n[a], n.hasOwnProperty(a) && l != null) switch (a) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(a) || ep(e, t, a, null, r, l);
				}
				for (i in r) if (a = r[i], l = n[i], r.hasOwnProperty(i) && (a != null || l != null)) switch (i) {
					case "value":
						a !== l && (H = !0), p = a;
						break;
					case "defaultValue":
						a !== l && (H = !0), c = a;
						break;
					case "multiple": a !== l && (H = !0), o = a;
					default: a !== l && ep(e, t, i, a, r, l);
				}
				t = c, n = o, r = m, p == null ? !!r != !!n && (t == null ? nn(e, !!n, n ? [] : "", !1) : nn(e, !!n, t, !0)) : nn(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (i = n[c], n.hasOwnProperty(c) && i != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: ep(e, t, c, null, r, i);
				}
				for (o in r) if (i = r[o], a = n[o], r.hasOwnProperty(o) && (i != null || a != null)) switch (o) {
					case "value":
						i !== a && (H = !0), p = i;
						break;
					case "defaultValue":
						i !== a && (H = !0), m = i;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (i != null) throw Error(s(91));
						break;
					default: i !== a && ep(e, t, o, i, r, a);
				}
				rn(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: ep(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						p !== m && (H = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: ep(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && ep(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(s(137, t));
						break;
					default: ep(e, t, u, p, r, m);
				}
				return;
			default: if (ln(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && tp(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || tp(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && ep(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || ep(e, t, f, p, r, m);
	}
	function ap(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function op() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && ap(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && ap(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var sp = null, cp = null;
	function lp(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function up(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function dp(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function fp(e, t, n, r) {
		return n = lp(n).createElement(e), n[yt] = r, n[bt] = t, np(n, e, t), Nt(n), n;
	}
	function pp(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var mp = null;
	function hp() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== mp && (mp = e, !0) : (mp = null, !1);
	}
	var gp = typeof setTimeout == "function" ? setTimeout : void 0, _p = typeof clearTimeout == "function" ? clearTimeout : void 0, vp = typeof Promise == "function" ? Promise : void 0, yp = typeof requestAnimationFrame == "function" ? requestAnimationFrame : gp, bp = typeof queueMicrotask == "function" ? queueMicrotask : vp === void 0 ? gp : function(e) {
		return vp.resolve(null).then(e).catch(xp);
	};
	function xp(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Sp(e) {
		return e === "head";
	}
	function Cp(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$" || n === "/&") {
					if (r === 0) {
						e.removeChild(i), Hh(t);
						return;
					}
					r--;
				} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
				else if (n === "html") _m(e.ownerDocument.documentElement);
				else if (n === "head") {
					n = e.ownerDocument.head, _m(n);
					for (var a = n.firstChild; a;) {
						var o = a.nextSibling, s = a.nodeName;
						a[Et] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
					}
				} else n === "body" && _m(e.ownerDocument.body);
			}
			n = i;
		} while (n);
		Hh(t);
	}
	function wp(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) {
				if (n = r.data, n === "/$") {
					if (e === 0) break;
					e--;
				} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			}
			n = r;
		} while (n);
	}
	function Tp(e, t, n) {
		if (t = CSS.escape(t) === t ? t : "r-" + btoa(t).replace(/=/g, ""), e.style.viewTransitionName = t, n != null && (e.style.viewTransitionClass = n), n = getComputedStyle(e), n.display === "inline") {
			if (t = e.getClientRects(), t.length === 1) var r = 1;
			else for (var i = r = 0; i < t.length; i++) {
				var a = t[i];
				0 < a.width && 0 < a.height && r++;
			}
			r === 1 && (e = e.style, e.display = t.length === 1 ? "inline-block" : "block", e.marginTop = "-" + n.paddingTop, e.marginBottom = "-" + n.paddingBottom);
		}
	}
	function Ep(e, t) {
		e = e.style, t = t.style;
		var n = t == null ? null : t.hasOwnProperty("viewTransitionName") ? t.viewTransitionName : t.hasOwnProperty("view-transition-name") ? t["view-transition-name"] : null;
		e.viewTransitionName = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), n = t == null ? null : t.hasOwnProperty("viewTransitionClass") ? t.viewTransitionClass : t.hasOwnProperty("view-transition-class") ? t["view-transition-class"] : null, e.viewTransitionClass = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), e.display === "inline-block" && (t == null ? e.display = e.margin = "" : (n = t.display, e.display = n == null || typeof n == "boolean" ? "" : n, n = t.margin, n == null ? (n = t.hasOwnProperty("marginTop") ? t.marginTop : t["margin-top"], e.marginTop = n == null || typeof n == "boolean" ? "" : n, t = t.hasOwnProperty("marginBottom") ? t.marginBottom : t["margin-bottom"], e.marginBottom = t == null || typeof t == "boolean" ? "" : t) : e.margin = n));
	}
	function Dp(e, t, n) {
		return n = n.ownerDocument.defaultView, {
			rect: e,
			abs: t.position === "absolute" || t.position === "fixed",
			clip: t.clipPath !== "none" || t.overflow !== "visible" || t.filter !== "none" || t.mask !== "none" || t.mask !== "none" || t.borderRadius !== "0px",
			view: 0 <= e.bottom && 0 <= e.right && e.top <= n.innerHeight && e.left <= n.innerWidth
		};
	}
	function Op(e) {
		return Dp(e.getBoundingClientRect(), getComputedStyle(e), e);
	}
	function kp(e) {
		var t = e.getBoundingClientRect();
		t = new DOMRect(t.x + 2e4, t.y + 2e4, t.width, t.height);
		var n = getComputedStyle(e);
		return Dp(t, n, e);
	}
	function Ap(e) {
		return e.documentElement.clientHeight;
	}
	function jp(e) {
		this.addEventListener("load", e), this.addEventListener("error", e);
	}
	function Mp(e, t, n, r, i, a, o, s, c) {
		var l = t.nodeType === 9 ? t : t.ownerDocument;
		try {
			var u = l.startViewTransition({
				update: function() {
					var t = l.defaultView, n = t.navigation && t.navigation.transition, o = l.fonts.status;
					r();
					var s = [];
					if (o === "loaded" && (Ap(l), l.fonts.status === "loading" && s.push(l.fonts.ready)), o = s.length, e !== null) for (var c = e.suspenseyImages, u = 0, d = 0; d < c.length; d++) {
						var f = c[d];
						if (!f.complete) {
							var p = f.getBoundingClientRect();
							if (0 < p.bottom && 0 < p.right && p.top < t.innerHeight && p.left < t.innerWidth) {
								if (u += Xm(f), u > $m) {
									s.length = o;
									break;
								}
								f = new Promise(jp.bind(f)), s.push(f);
							}
						}
					}
					if (0 < s.length) return t = Promise.race([Promise.all(s), new Promise(function(e) {
						return setTimeout(e, 500);
					})]).then(i, i), (n ? Promise.allSettled([n.finished, t]) : t).then(a, a);
					if (i(), n) return n.finished.then(a, a);
					a();
				},
				types: n
			});
			l.__reactViewTransition = u;
			var d = [];
			return u.ready.then(function() {
				for (var e = l.documentElement.getAnimations({ subtree: !0 }), t = 0; t < e.length; t++) {
					var n = e[t], r = n.effect, i = r.pseudoElement;
					if (i != null && i.startsWith("::view-transition")) {
						d.push(n), n = r.getKeyframes();
						for (var a = i = void 0, s = !0, c = 0; c < n.length; c++) {
							var u = n[c], f = u.width;
							if (i === void 0) i = f;
							else if (i !== f) {
								s = !1;
								break;
							}
							if (f = u.height, a === void 0) a = f;
							else if (a !== f) {
								s = !1;
								break;
							}
							delete u.width, delete u.height, u.transform === "none" && delete u.transform;
						}
						s && i !== void 0 && a !== void 0 && (r.setKeyframes(n), s = getComputedStyle(r.target, r.pseudoElement), s.width !== i || s.height !== a) && (s = n[0], s.width = i, s.height = a, s = n[n.length - 1], s.width = i, s.height = a, r.setKeyframes(n));
					}
				}
				o();
			}, function(e) {
				l.__reactViewTransition === u && (l.__reactViewTransition = null);
				try {
					if (typeof e == "object" && e) switch (e.name) {
						case "InvalidStateError": (e.message === "View transition was skipped because document visibility state is hidden." || e.message === "Skipping view transition because document visibility state has become hidden." || e.message === "Skipping view transition because viewport size changed." || e.message === "Transition was aborted because of invalid state") && (e = null);
					}
					e !== null && c(e);
				} finally {
					r(), i(), o();
				}
			}), u.finished.finally(function() {
				for (var e = 0; e < d.length; e++) d[e].cancel();
				l.__reactViewTransition === u && (l.__reactViewTransition = null), s();
			}), u;
		} catch {
			return r(), i(), o(), null;
		}
	}
	function Np(e, t) {
		this._scope = document.documentElement, this._selector = "::view-transition-" + e + "(" + t + ")";
	}
	Np.prototype.animate = function(e, t) {
		return t = typeof t == "number" ? { duration: t } : E({}, t), t.pseudoElement = this._selector, this._scope.animate(e, t);
	}, Np.prototype.getAnimations = function() {
		for (var e = this._scope, t = this._selector, n = e.getAnimations({ subtree: !0 }), r = [], i = 0; i < n.length; i++) {
			var a = n[i].effect;
			a !== null && a.target === e && a.pseudoElement === t && r.push(n[i]);
		}
		return r;
	}, Np.prototype.getComputedStyle = function() {
		return getComputedStyle(this._scope, this._selector);
	};
	function Pp(e) {
		return {
			name: e,
			group: new Np("group", e),
			imagePair: new Np("image-pair", e),
			old: new Np("old", e),
			new: new Np("new", e)
		};
	}
	function Fp(e) {
		this._fragmentFiber = e, this._observers = this._eventListeners = null;
	}
	Fp.prototype.addEventListener = function(e, t, n) {
		var r = null, i = null;
		if (!(n != null && typeof n != "boolean" && (r = n.signal || null, r !== null && r.aborted))) {
			this._eventListeners === null && (this._eventListeners = []);
			var a = this._eventListeners;
			if (Bp(a, e, t, n) === -1) {
				var o = this, s = t;
				n != null && typeof n != "boolean" && !0 === n.once && (s = function(r) {
					o.removeEventListener(e, t, n), typeof t == "function" ? t.call(this, r) : t.handleEvent(r);
				}), r !== null && (i = o.removeEventListener.bind(o, e, t, n), r.addEventListener("abort", i, { once: !0 }), i = r.removeEventListener.bind(r, "abort", i)), r = Rp(n), a.push({
					type: e,
					listener: t,
					optionsOrUseCapture: n,
					attachedListener: s,
					cleanup: i
				}), h(this._fragmentFiber.child, !1, Ip, e, s, r);
			}
			this._eventListeners = a;
		}
	};
	function Ip(e, t, n, r) {
		return b(e).addEventListener(t, n, r), !1;
	}
	Fp.prototype.removeEventListener = function(e, t, n) {
		var r = this._eventListeners;
		if (r !== null && (t = Bp(r, e, t, n), t !== -1)) {
			var i = r[t];
			n = i.attachedListener;
			var a = i.cleanup;
			i = Rp(i.optionsOrUseCapture), h(this._fragmentFiber.child, !1, Lp, e, n, i), r.splice(t, 1), a !== null && a();
		}
	};
	function Lp(e, t, n, r) {
		return b(e).removeEventListener(t, n, r), !1;
	}
	function Rp(e) {
		return e != null && typeof e != "boolean" && (!0 === e.once || e.signal instanceof AbortSignal) ? {
			capture: e.capture,
			passive: e.passive
		} : e;
	}
	function zp(e) {
		return e == null ? "c=0" : typeof e == "boolean" ? "c=" + (e ? "1" : "0") : "c=" + (e.capture ? "1" : "0");
	}
	function Bp(e, t, n, r) {
		if (e.length === 0) return -1;
		r = zp(r);
		for (var i = 0; i < e.length; i++) {
			var a = e[i];
			if (a.type === t && a.listener === n && zp(a.optionsOrUseCapture) === r) return i;
		}
		return -1;
	}
	Fp.prototype.dispatchEvent = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return !0;
		t = b(t);
		var n = this._eventListeners;
		if (n !== null && 0 < n.length || !e.bubbles) {
			var r = t.nodeType === 9 ? t.createComment("") : document.createTextNode("");
			if (n) for (var i = 0; i < n.length; i++) {
				var a = n[i];
				r.addEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			}
			if (t.appendChild(r), e = r.dispatchEvent(e), n) for (i = 0; i < n.length; i++) a = n[i], r.removeEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			return t.removeChild(r), e;
		}
		return t.dispatchEvent(e);
	}, Fp.prototype.focus = function(e) {
		h(this._fragmentFiber.child, !0, Vp, e, void 0, void 0);
	};
	function Vp(e, t) {
		return e.tag !== 6 && (e = b(e), pm(e, t));
	}
	Fp.prototype.focusLast = function(e) {
		var t = [];
		h(this._fragmentFiber.child, !0, Hp, t, void 0, void 0);
		for (var n = t.length - 1; 0 <= n && !Vp(t[n], e); n--);
	};
	function Hp(e, t) {
		return t.push(e), !1;
	}
	Fp.prototype.blur = function() {
		var e = g(this._fragmentFiber);
		e !== null && (e = b(e), e = lp(e).activeElement, e !== null && h(this._fragmentFiber.child, !1, Up, e, void 0, void 0));
	};
	function Up(e, t) {
		return e.tag !== 6 && (e = b(e), e === t || e.contains(t) ? (t.blur(), !0) : !1);
	}
	Fp.prototype.observeUsing = function(e) {
		this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(e), h(this._fragmentFiber.child, !1, Wp, e, void 0, void 0);
	};
	function Wp(e, t) {
		return e.tag === 6 || (e = b(e), t.observe(e)), !1;
	}
	Fp.prototype.unobserveUsing = function(e) {
		var t = this._observers;
		if (t !== null && t.has(e)) {
			t.delete(e), h(this._fragmentFiber.child, !1, Gp, e, void 0, void 0);
			for (var n = t = 0; n < Kp.length; n++) {
				var r = Kp[n];
				r.fragmentInstance === this && r.observer === e ? e.unobserve(r.instance) : Kp[t++] = r;
			}
			Kp.length = t;
		}
	};
	function Gp(e, t) {
		return e.tag === 6 || (e = b(e), t.unobserve(e)), !1;
	}
	var Kp = [], qp = !1;
	function Jp(e, t, n) {
		Kp.push({
			fragmentInstance: e,
			observer: t,
			instance: n
		}), qp || (qp = !0, mm(function() {
			qp = !1;
			var e = Kp;
			Kp = [];
			for (var t = 0; t < e.length; t++) {
				var n = e[t];
				n.observer.unobserve(n.instance);
			}
		}));
	}
	Fp.prototype.getClientRects = function() {
		var e = [];
		return h(this._fragmentFiber.child, !1, Yp, e, void 0, void 0), e;
	};
	function Yp(e, t) {
		if (e.tag === 6) {
			e = e.stateNode;
			var n = e.ownerDocument.createRange();
			n.selectNodeContents(e), t.push.apply(t, n.getClientRects());
		} else e = b(e), t.push.apply(t, e.getClientRects());
		return !1;
	}
	Fp.prototype.getRootNode = function(e) {
		var t = g(this._fragmentFiber);
		return t === null ? this : b(t).getRootNode(e);
	}, Fp.prototype.compareDocumentPosition = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		var n = [];
		h(this._fragmentFiber.child, !1, Hp, n, void 0, void 0);
		var r = b(t);
		if (n.length === 0) {
			if (n = r, _(this._fragmentFiber)) {
				a: {
					for (t = this._fragmentFiber.return; t !== null;) {
						if (t.tag === 4) {
							t = t.stateNode.containerInfo;
							break a;
						}
						if (t.tag === 3 || t.tag === 5 || t.tag === 27) break;
						t = t.return;
					}
					t = null;
				}
				t != null && (n = t);
			}
			t = this._fragmentFiber;
			var i = r = n.compareDocumentPosition(e);
			return n === e ? i = Node.DOCUMENT_POSITION_CONTAINS : r & Node.DOCUMENT_POSITION_CONTAINED_BY && (n = v(t)[1], n === null ? i = Node.DOCUMENT_POSITION_PRECEDING : (e = b(n).compareDocumentPosition(e), i = e === 0 || e & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), i |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
		}
		t = b(n[0]), i = b(n[n.length - 1]);
		var a = _(this._fragmentFiber) ? t.parentElement : r;
		if (a == null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		r = a.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_CONTAINED_BY, a = a.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_CONTAINED_BY;
		var o = t.compareDocumentPosition(e), s = i.compareDocumentPosition(e), c = o & Node.DOCUMENT_POSITION_CONTAINED_BY || s & Node.DOCUMENT_POSITION_CONTAINED_BY;
		return s = r && a && o & Node.DOCUMENT_POSITION_FOLLOWING && s & Node.DOCUMENT_POSITION_PRECEDING, t = r && t === e || a && i === e || c || s ? Node.DOCUMENT_POSITION_CONTAINED_BY : !r && t === e || !a && i === e ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : o, t & Node.DOCUMENT_POSITION_DISCONNECTED || t & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || Xp(t, this._fragmentFiber, n[0], n[n.length - 1], e) ? t : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
	};
	function Xp(e, t, n, r, i) {
		var a = kt(i);
		if (e & Node.DOCUMENT_POSITION_CONTAINED_BY) {
			if (n = !!a) a: {
				for (; a !== null;) {
					if (a.tag === 7 && (a === t || a.alternate === t)) {
						n = !0;
						break a;
					}
					a = a.return;
				}
				n = !1;
			}
			return n;
		}
		if (e & Node.DOCUMENT_POSITION_CONTAINS) {
			if (a === null) return a = i.ownerDocument, i === a || i === a.documentElement || i === a.body;
			a: {
				for (a = t, t = g(t); a !== null;) {
					if (!(a.tag !== 5 && a.tag !== 3 && a.tag !== 27 || a !== t && a.alternate !== t)) {
						a = !0;
						break a;
					}
					a = a.return;
				}
				a = !1;
			}
			return a;
		}
		return e & Node.DOCUMENT_POSITION_PRECEDING ? ((t = !!a) && !(t = a === n) && (t = T(n, a, w), t === null ? t = !1 : (h(t, !0, ee, a, n), a = x, x = null, t = a !== null)), t) : e & Node.DOCUMENT_POSITION_FOLLOWING ? ((t = !!a) && !(t = a === r) && (t = T(r, a, w), t === null ? t = !1 : (h(t, !0, C, a, r), a = x, S = x = null, t = a !== null)), t) : !1;
	}
	function Zp(e, t) {
		var n = e.ownerDocument.createRange();
		n.selectNodeContents(e), e = n.getBoundingClientRect(), window.scrollTo(window.scrollX + e.left, t ? window.scrollY + e.top : window.scrollY + e.bottom - window.innerHeight);
	}
	Fp.prototype.scrollIntoView = function(e) {
		if (typeof e == "object") throw Error(s(566));
		var t = [];
		h(this._fragmentFiber.child, !1, Hp, t, void 0, void 0);
		var n = !1 !== e;
		if (t.length === 0) {
			var r = v(this._fragmentFiber);
			if (r = n ? r[1] || r[0] || g(this._fragmentFiber) : r[0] || r[1], r === null) return;
			if (r.tag === 6) {
				e = b(r), Zp(e, n);
				return;
			}
			if (r = b(r), r.nodeType !== 9) {
				if (r.nodeType === 11) {
					n = "host" in r ? r.host : null, n !== null && n.scrollIntoView(e);
					return;
				}
				r.scrollIntoView(e);
			}
		}
		for (r = n ? t.length - 1 : 0; r !== (n ? -1 : t.length);) {
			var i = t[r];
			i.tag === 6 ? (i = b(i), Zp(i, n)) : b(i).scrollIntoView(e), r += n ? -1 : 1;
		}
	};
	function Qp(e, t) {
		return e = b(e), $p(e, t), !1;
	}
	function $p(e, t) {
		e.reactFragments ??= /* @__PURE__ */ new Set(), e.reactFragments.add(t);
	}
	function em(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.addEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			for (var r = 0, i = 0; i < Kp.length; i++) {
				var a = Kp[i];
				(a.fragmentInstance !== t || a.observer !== n || a.instance !== e) && (Kp[r++] = a);
			}
			Kp.length = r, n.observe(e);
		}), $p(e, t));
	}
	function tm(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.removeEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			typeof n.rootMargin == "string" ? Jp(t, n, e) : n.unobserve(e);
		}), e.reactFragments != null && e.reactFragments.delete(t));
	}
	function nm(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					nm(n), Ot(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function rm(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) {
				if (t === "input" && e.type === "hidden") {
					var a = i.name == null ? null : "" + i.name;
					if (i.type === "hidden" && e.getAttribute("name") === a) return e;
				} else return e;
			} else if (!e[Et]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = lm(e.nextSibling), e === null) break;
		}
		return null;
	}
	function im(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function am(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function om(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function sm(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function cm(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function lm(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var um = null;
	function dm(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return lm(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function fm(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function pm(e, t) {
		function n() {
			r = !0;
		}
		if (e.ownerDocument.activeElement === e) return !0;
		var r = !1;
		try {
			e.ownerDocument.addEventListener("focus", n, !0), (e.focus || HTMLElement.prototype.focus).call(e, t);
		} finally {
			e.ownerDocument.removeEventListener("focus", n, !0);
		}
		return r;
	}
	function mm(e) {
		yp(function() {
			yp(function(t) {
				return e(t);
			});
		});
	}
	function hm(e, t, n) {
		switch (t = lp(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(s(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(s(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(s(454));
				return e;
			default: throw Error(s(451));
		}
	}
	function gm(e, t, n) {
		for (var r in n) {
			var i = n[r];
			n.hasOwnProperty(r) && i != null && ep(e, t, r, null, rp, i);
		}
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === pn && (e.onclick = null), Ot(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		Ot(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = j.d;
	j.d = {
		f: Sm,
		r: Cm,
		D: Em,
		C: Dm,
		L: Om,
		m: km,
		X: jm,
		S: Am,
		M: Mm
	};
	function Sm() {
		var e = xm.f(), t = Ld();
		return e || t;
	}
	function Cm(e) {
		var t = At(e);
		t !== null && t.tag === 5 && t.type === "form" ? Zs(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = $t(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), Nt(t), r.head.appendChild(t)));
		}
	}
	function Em(e) {
		xm.D(e), Tm("dns-prefetch", e, null);
	}
	function Dm(e, t) {
		xm.C(e, t), Tm("preconnect", e, t);
	}
	function Om(e, t, n) {
		xm.L(e, t, n);
		var r = wm;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + $t(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + $t(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + $t(n.imageSizes) + "\"]")) : i += "[href=\"" + $t(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Pm(e);
					break;
				case "script": a = Rm(e);
			}
			if (!(vm.has(a) || (e = E({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), vm.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(Fm(a)) || t === "script" && r.querySelector(zm(a))))) {
				var o = r.createElement("link");
				np(o, "link", e), t === "style" && (o[Dt] = !0, o.onload = o.onerror = function() {
					Pt(o);
				}), Nt(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + $t(r) + "\"][href=\"" + $t(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Rm(e);
			}
			if (!vm.has(a) && (e = E({
				rel: "modulepreload",
				href: e
			}, t), vm.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(zm(a))) return;
				}
				r = n.createElement("link"), np(r, "link", e), Nt(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = Mt(r).hoistableStyles, a = Pm(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(Fm(a))) s.loading = 5;
				else {
					e = E({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = vm.get(a)) && Hm(e, n);
					var c = o = r.createElement("link");
					Nt(c), np(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Vm(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function jm(e, t) {
		xm.X(e, t);
		var n = wm;
		if (n && e) {
			var r = Mt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = E({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Nt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Mm(e, t) {
		xm.M(e, t);
		var n = wm;
		if (n && e) {
			var r = Mt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = E({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Nt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var i = (i = N.current) ? bm(i) : null;
		if (!i) throw Error(s(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = Mt(i).hoistableStyles, r = t.get(n), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Pm(n.href);
					var a = Mt(i).hoistableStyles, o = a.get(e);
					if (o || (i = i.ownerDocument || i, o = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, a.set(e, o), (a = i.querySelector(Fm(e))) ? a._p || (o.instance = a, o.state.loading = 5) : (a = vm.get(e), a || (a = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, vm.set(e, a)), Lm(i, e, a, o.state))), t && r === null) throw Error(s(528, ""));
					return o;
				}
				if (t && r !== null) throw Error(s(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = Mt(i).hoistableScripts, r = t.get(n), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(s(444, e));
		}
	}
	function Pm(e) {
		return "href=\"" + $t(e) + "\"";
	}
	function Fm(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Im(e) {
		return E({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Lm(e, t, n, r) {
		if (t = e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]")) {
			if (!0 !== t[Dt]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[Dt] = !0, t.onload = t.onerror = Pt.bind(null, t), np(t, "link", n), Nt(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + $t(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + $t(n.href) + "\"]");
				if (r) return t.instance = r, Nt(r), r;
				var i = E({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Nt(r), np(r, "style", i), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				i = Pm(n.href);
				var a = e.querySelector(Fm(i));
				if (a) return t.state.loading |= 4, t.instance = a, Nt(a), a;
				r = Im(n), (i = vm.get(i)) && Hm(r, i), a = (e.ownerDocument || e).createElement("link"), Nt(a);
				var o = a;
				return o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), np(a, "link", r), t.state.loading |= 4, Vm(a, n.precedence, e), t.instance = a;
			case "script": return a = Rm(n.src), (i = e.querySelector(zm(a))) ? (t.instance = i, Nt(i), i) : (r = n, (i = vm.get(a)) && (r = E({}, n), Um(r, i)), e = e.ownerDocument || e, i = e.createElement("script"), Nt(i), np(i, "link", r), e.head.appendChild(i), t.instance = i);
			case "void": return null;
			default: throw Error(s(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Vm(r, n.precedence, e));
		return t.instance;
	}
	function Vm(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Hm(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function Um(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Wm = null;
	function Gm(e, t, n) {
		if (Wm === null) {
			var r = /* @__PURE__ */ new Map(), i = Wm = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Wm, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[Et] || a[yt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Km(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function qm(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Jm(e, t) {
		return e === "img" && t.src != null && t.src !== "" && t.onLoad == null && t.loading !== "lazy";
	}
	function Ym(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Xm(e) {
		return (e.width || 100) * (e.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * .25;
	}
	function Zm(e, t) {
		typeof t.decode == "function" && (e.imgCount++, t.complete || (e.imgBytes += Xm(t), e.suspenseyImages.push(t)), e = rh.bind(e), t.decode().then(e, e));
	}
	function Qm(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Pm(r.href), a = t.querySelector(Fm(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Nt(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), Nt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), np(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = nh.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var $m = 0;
	function eh(e, t) {
		return e.stylesheets && e.count === 0 && ah(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && ah(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && $m === 0 && ($m = 62500 * op());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && ah(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > $m ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function th(e) {
		if (e.count === 0 && (e.imgCount === 0 || !e.waitingForImages)) {
			if (e.stylesheets) ah(e, e.stylesheets);
			else if (e.unsuspend) {
				var t = e.unsuspend;
				e.unsuspend = null, t();
			}
		}
	}
	function nh() {
		this.count--, th(this);
	}
	function rh() {
		this.imgCount--, th(this);
	}
	var ih = null;
	function ah(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, ih = /* @__PURE__ */ new Map(), t.forEach(oh, e), ih = null, nh.call(e));
	}
	function oh(e, t) {
		if (!(t.state.loading & 4)) {
			var n = ih.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), ih.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = nh.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var sh = {
		$$typeof: ce,
		Provider: null,
		Consumer: null,
		_currentValue: xe,
		_currentValue2: xe,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = ct(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = ct(0), this.hiddenUpdates = ct(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = Di(3, null, null, t), e.current = a, a.stateNode = e, t = Ea(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, co(a), e;
	}
	function uh(e) {
		return e ? (e = Ti, e) : Ti;
	}
	function dh(e, t, n, r, i, a) {
		i = uh(i), r.context === null ? r.context = i : r.pendingContext = i, r = uo(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = fo(e, r, t), n !== null && (Md(n, e, t), po(n, e, t));
	}
	function fh(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ph(e, t) {
		fh(e, t), (e = e.alternate) && fh(e, t);
	}
	function mh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = Si(e, 67108864);
			t !== null && Md(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = kd();
			t = mt(t);
			var n = Si(e, t);
			n !== null && Md(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = A.T;
		A.T = null;
		var a = j.p;
		try {
			j.p = 2, yh(e, t, n, r);
		} finally {
			j.p = a, A.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = A.T;
		A.T = null;
		var a = j.p;
		try {
			j.p = 8, yh(e, t, n, r);
		} finally {
			j.p = a, A.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) Gf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = At(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = nt(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Ye(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Tf(a), !(X & 6) && (md = z() + 500, Ef(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = Si(a, 2), s !== null && Md(s, a, 2), Ld(), ph(a, 2);
					}
					if (a = bh(r), a === null && Gf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Gf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = hn(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = kt(e), e !== null) {
			var t = l(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = u(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = d(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return xh = e, null;
	}
	function Ch(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "fullscreenerror":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "resize":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (B()) {
				case Be: return 2;
				case Ve: return 8;
				case V:
				case He: return 32;
				case Ue: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var wh = !1, Th = null, Eh = null, Dh = null, Oh = /* @__PURE__ */ new Map(), kh = /* @__PURE__ */ new Map(), Ah = [], jh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Mh(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Th = null;
				break;
			case "dragenter":
			case "dragleave":
				Eh = null;
				break;
			case "mouseover":
			case "mouseout":
				Dh = null;
				break;
			case "pointerover":
			case "pointerout":
				Oh.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": kh.delete(t.pointerId);
		}
	}
	function Nh(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = At(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Ph(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Th = Nh(Th, e, t, n, r, i), !0;
			case "dragenter": return Eh = Nh(Eh, e, t, n, r, i), !0;
			case "mouseover": return Dh = Nh(Dh, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Oh.set(a, Nh(Oh.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, kh.set(a, Nh(kh.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Fh(e) {
		var t = kt(e.target);
		if (t !== null) {
			var n = l(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = u(n), t !== null) {
						e.blockedOn = t, _t(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = d(n), t !== null) {
						e.blockedOn = t, _t(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Ih(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = bh(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				mn = r, n.target.dispatchEvent(r), mn = null;
			} else return t = At(n), t !== null && mh(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Lh(e, t, n) {
		Ih(e) && n.delete(t);
	}
	function Rh() {
		wh = !1, Th !== null && Ih(Th) && (Th = null), Eh !== null && Ih(Eh) && (Eh = null), Dh !== null && Ih(Dh) && (Dh = null), Oh.forEach(Lh), kh.forEach(Lh);
	}
	function zh(e, n) {
		e.blockedOn === n && (e.blockedOn = null, wh || (wh = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, Rh)));
	}
	var Bh = null;
	function Vh(e) {
		Bh !== e && (Bh = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			Bh === e && (Bh = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (Sh(r || n) === null) continue;
					break;
				}
				var a = At(n);
				a !== null && (e.splice(t, 3), t -= 3, Ys(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Hh(e) {
		function t(t) {
			return zh(t, e);
		}
		Th !== null && zh(Th, e), Eh !== null && zh(Eh, e), Dh !== null && zh(Dh, e), Oh.forEach(t), kh.forEach(t);
		for (var n = 0; n < Ah.length; n++) {
			var r = Ah[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < Ah.length && (n = Ah[0], n.blockedOn === null);) Fh(n), n.blockedOn === null && Ah.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[bt] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[bt] || null) s = o.formAction;
					else if (Sh(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Vh(n);
			}
		}
	}
	function Uh() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Wh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.render = Wh.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(s(409));
		var n = t.current;
		dh(n, kd(), e, t, null, null);
	}, Gh.prototype.unmount = Wh.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			dh(e.current, 2, null, e, null, null), Ld(), t[xt] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = gt();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Ah.length && t !== 0 && t < Ah[n].priority; n++);
			Ah.splice(n, 0, e), n === 0 && Fh(e);
		}
	};
	var Kh = r.version;
	if (Kh !== "19.3.1") throw Error(s(527, Kh, "19.3.1"));
	j.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(s(188)) : (e = Object.keys(e).join(","), Error(s(268, e)));
		return e = p(t), e = e === null ? null : m(e), e = e === null ? null : e.stateNode, e;
	};
	var qh = {
		bundleType: 0,
		version: "19.3.1",
		rendererPackageName: "react-dom",
		currentDispatcherRef: A,
		reconcilerVersion: "19.3.1"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Jh = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Jh.isDisabled && Jh.supportsFiber) try {
			Ke = Jh.inject(qh), qe = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!c(e)) throw Error(s(299));
		var n = !1, r = "", i = vc, a = yc, o = bc;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (i = t.onUncaughtError), t.onCaughtError !== void 0 && (a = t.onCaughtError), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, i, a, o, Uh), e[xt] = t.current, Uf(e), new Wh(t);
	};
})), c = (/* @__PURE__ */ e(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = s();
})))(), l = null, u = null, d = [];
function f(e) {
	return l = e, u && l.updateProject(u), l.updateJobs(d), () => {
		l === e && (l = null);
	};
}
function p(e) {
	u = e, l?.updateProject(e);
}
function m(e) {
	d = e, l?.updateJobs(e);
}
function h(e = "sidebar") {
	l?.beginRename(e);
}
// src/store.ts
function g(e) {
	let t = e, n = /* @__PURE__ */ new Set();
	return {
		getSnapshot: () => t,
		subscribe(e) {
			return n.add(e), () => {
				n.delete(e);
			};
		},
		set(e) {
			if (!Object.is(t, e)) {
				t = e;
				for (let e of n) e();
			}
		}
	};
}
var _ = g({
	name: "",
	is_temporary: !0
}), v = g([]), y = g({
	token: 0,
	location: "sidebar"
});
function b(e) {
	if (!e || typeof e != "object" || !("name" in e) || typeof e.name != "string") throw Error("Invalid workspace response: name must be a string.");
	_.set(e);
}
function x(e) {
	if (!Array.isArray(e) || e.some((e) => !e || !Number.isInteger(e.id) || typeof e.type != "string" || ![
		"queued",
		"running",
		"completed",
		"failed",
		"cancelled"
	].includes(e.status))) throw Error("Invalid job response.");
	v.set(e);
}
function S(e) {
	y.set({
		token: y.getSnapshot().token + 1,
		location: e
	});
}
function ee(e) {
	return e.display_name || (e.is_temporary ? "Untitled workspace" : e.name.split(/[\\/]/).pop()?.replace(/\.legion$/, "") || "Workspace");
}
// node_modules/openapi-fetch/dist/index.mjs
var C = i(), w = o(), T = /\{[^{}]+\}/g, E = () => typeof process == "object" && Number.parseInt(process?.versions?.node?.substring(0, 2)) >= 18 && process.versions.undici;
function te() {
	return Math.random().toString(36).slice(2, 11);
}
function ne(e) {
	let { baseUrl: t = "", Request: n = globalThis.Request, fetch: r = globalThis.fetch, querySerializer: i, bodySerializer: a, pathSerializer: o, headers: s, requestInitExt: c = void 0, ...l } = { ...e };
	c = E() ? c : void 0, t = de(t);
	let u = [];
	async function d(e, d) {
		let { baseUrl: f, fetch: p = r, Request: m = n, headers: h, params: g = {}, parseAs: _ = "json", querySerializer: v, bodySerializer: y = a ?? ce, pathSerializer: b, body: x, middleware: S = [], ...ee } = d || {}, C = t;
		f && (C = de(f) ?? t);
		let w = typeof i == "function" ? i : oe(i);
		v && (w = typeof v == "function" ? v : oe({
			...typeof i == "object" ? i : {},
			...v
		}));
		let T = b || o || se, E = x === void 0 ? void 0 : y(x, ue(s, h, g.header)), ne = ue(E === void 0 || E instanceof FormData ? {} : { "Content-Type": "application/json" }, s, h, g.header), re = [...u, ...S], ie = {
			redirect: "follow",
			...l,
			...ee,
			body: E,
			headers: ne
		}, ae, D, fe = new m(le(e, {
			baseUrl: C,
			params: g,
			querySerializer: w,
			pathSerializer: T
		}), ie), pe;
		for (let e in ee) e in fe || (fe[e] = ee[e]);
		if (re.length) {
			ae = te(), D = Object.freeze({
				baseUrl: C,
				fetch: p,
				parseAs: _,
				querySerializer: w,
				bodySerializer: y,
				pathSerializer: T
			});
			for (let t of re) if (t && typeof t == "object" && typeof t.onRequest == "function") {
				let n = await t.onRequest({
					request: fe,
					schemaPath: e,
					params: g,
					options: D,
					id: ae
				});
				if (n) {
					if (n instanceof m) fe = n;
					else if (n instanceof Response) {
						pe = n;
						break;
					} else throw Error("onRequest: must return new Request() or Response() when modifying the request");
				}
			}
		}
		if (!pe) {
			try {
				pe = await p(fe, c);
			} catch (t) {
				let n = t;
				if (re.length) for (let t = re.length - 1; t >= 0; t--) {
					let r = re[t];
					if (r && typeof r == "object" && typeof r.onError == "function") {
						let t = await r.onError({
							request: fe,
							error: n,
							schemaPath: e,
							params: g,
							options: D,
							id: ae
						});
						if (t) {
							if (t instanceof Response) {
								n = void 0, pe = t;
								break;
							}
							if (t instanceof Error) {
								n = t;
								continue;
							}
							throw Error("onError: must return new Response() or instance of Error");
						}
					}
				}
				if (n) throw n;
			}
			if (re.length) for (let t = re.length - 1; t >= 0; t--) {
				let n = re[t];
				if (n && typeof n == "object" && typeof n.onResponse == "function") {
					let t = await n.onResponse({
						request: fe,
						response: pe,
						schemaPath: e,
						params: g,
						options: D,
						id: ae
					});
					if (t) {
						if (!(t instanceof Response)) throw Error("onResponse: must return new Response() when modifying the response");
						pe = t;
					}
				}
			}
		}
		let me = pe.headers.get("Content-Length");
		if (pe.status === 204 || fe.method === "HEAD" || me === "0" && !pe.headers.get("Transfer-Encoding")?.includes("chunked")) return pe.ok ? {
			data: void 0,
			response: pe
		} : {
			error: void 0,
			response: pe
		};
		if (pe.ok) return {
			data: await (async () => {
				if (_ === "stream") return pe.body;
				if (_ === "json" && !me) {
					let e = await pe.text();
					return e ? JSON.parse(e) : void 0;
				}
				return await pe[_]();
			})(),
			response: pe
		};
		let he = await pe.text();
		try {
			he = JSON.parse(he);
		} catch {}
		return {
			error: he,
			response: pe
		};
	}
	return {
		request(e, t, n) {
			return d(t, {
				...n,
				method: e.toUpperCase()
			});
		},
		GET(e, t) {
			return d(e, {
				...t,
				method: "GET"
			});
		},
		PUT(e, t) {
			return d(e, {
				...t,
				method: "PUT"
			});
		},
		POST(e, t) {
			return d(e, {
				...t,
				method: "POST"
			});
		},
		DELETE(e, t) {
			return d(e, {
				...t,
				method: "DELETE"
			});
		},
		OPTIONS(e, t) {
			return d(e, {
				...t,
				method: "OPTIONS"
			});
		},
		HEAD(e, t) {
			return d(e, {
				...t,
				method: "HEAD"
			});
		},
		PATCH(e, t) {
			return d(e, {
				...t,
				method: "PATCH"
			});
		},
		TRACE(e, t) {
			return d(e, {
				...t,
				method: "TRACE"
			});
		},
		use(...e) {
			for (let t of e) if (t) {
				if (typeof t != "object" || !("onRequest" in t || "onResponse" in t || "onError" in t)) throw Error("Middleware must be an object with one of `onRequest()`, `onResponse() or `onError()`");
				u.push(t);
			}
		},
		eject(...e) {
			for (let t of e) {
				let e = u.indexOf(t);
				e !== -1 && u.splice(e, 1);
			}
		}
	};
}
function re(e, t, n) {
	if (t == null) return "";
	if (typeof t == "object") throw Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
	return `${e}=${n?.allowReserved === !0 ? t : encodeURIComponent(t)}`;
}
function ie(e, t, n) {
	if (!t || typeof t != "object") return "";
	let r = [], i = {
		simple: ",",
		label: ".",
		matrix: ";"
	}[n.style] || "&";
	if (n.style !== "deepObject" && n.explode === !1) {
		for (let e in t) r.push(e, n.allowReserved === !0 ? t[e] : encodeURIComponent(t[e]));
		let i = r.join(",");
		switch (n.style) {
			case "form": return `${e}=${i}`;
			case "label": return `.${i}`;
			case "matrix": return `;${e}=${i}`;
			default: return i;
		}
	}
	for (let i in t) {
		let a = n.style === "deepObject" ? `${e}[${i}]` : i;
		r.push(re(a, t[i], n));
	}
	let a = r.join(i);
	return n.style === "label" || n.style === "matrix" ? `${i}${a}` : a;
}
function ae(e, t, n) {
	if (!Array.isArray(t)) return "";
	if (n.explode === !1) {
		let r = {
			form: ",",
			spaceDelimited: "%20",
			pipeDelimited: "|"
		}[n.style] || ",", i = (n.allowReserved === !0 ? t : t.map((e) => encodeURIComponent(e))).join(r);
		switch (n.style) {
			case "simple": return i;
			case "label": return `.${i}`;
			case "matrix": return `;${e}=${i}`;
			default: return `${e}=${i}`;
		}
	}
	let r = {
		simple: ",",
		label: ".",
		matrix: ";"
	}[n.style] || "&", i = [];
	for (let r of t) n.style === "simple" || n.style === "label" ? i.push(n.allowReserved === !0 ? r : encodeURIComponent(r)) : i.push(re(e, r, n));
	return n.style === "label" || n.style === "matrix" ? `${r}${i.join(r)}` : i.join(r);
}
function oe(e) {
	return function(t) {
		let n = [];
		if (t && typeof t == "object") for (let r in t) {
			let i = t[r];
			if (i != null) {
				if (Array.isArray(i)) {
					if (i.length === 0) continue;
					n.push(ae(r, i, {
						style: "form",
						explode: !0,
						...e?.array,
						allowReserved: e?.allowReserved || !1
					}));
				} else typeof i == "object" ? n.push(ie(r, i, {
					style: "deepObject",
					explode: !0,
					...e?.object,
					allowReserved: e?.allowReserved || !1
				})) : n.push(re(r, i, e));
			}
		}
		return n.join("&");
	};
}
function se(e, t) {
	let n = e;
	for (let r of e.match(T) ?? []) {
		let e = r.substring(1, r.length - 1), i = !1, a = "simple";
		if (e.endsWith("*") && (i = !0, e = e.substring(0, e.length - 1)), e.startsWith(".") ? (a = "label", e = e.substring(1)) : e.startsWith(";") && (a = "matrix", e = e.substring(1)), !t || t[e] === void 0 || t[e] === null) continue;
		let o = t[e];
		n = Array.isArray(o) ? n.replace(r, ae(e, o, {
			style: a,
			explode: i
		})) : typeof o == "object" ? n.replace(r, ie(e, o, {
			style: a,
			explode: i
		})) : a === "matrix" ? n.replace(r, `;${re(e, o)}`) : n.replace(r, a === "label" ? `.${encodeURIComponent(o)}` : encodeURIComponent(o));
	}
	return n;
}
function ce(e, t) {
	return e instanceof FormData ? e : t && (t.get instanceof Function ? t.get("Content-Type") ?? t.get("content-type") : t["Content-Type"] ?? t["content-type"]) === "application/x-www-form-urlencoded" ? new URLSearchParams(e).toString() : JSON.stringify(e);
}
function le(e, t) {
	let n = `${t.baseUrl}${e}`;
	t.params?.path && (n = t.pathSerializer(n, t.params.path));
	let r = t.querySerializer(t.params.query ?? {});
	return r.startsWith("?") && (r = r.substring(1)), r && (n += `?${r}`), n;
}
function ue(...e) {
	let t = new Headers();
	for (let n of e) {
		if (!n || typeof n != "object") continue;
		let e = n instanceof Headers ? n.entries() : Object.entries(n);
		for (let [n, r] of e) if (r === null) t.delete(n);
		else if (Array.isArray(r)) for (let e of r) t.append(n, e);
		else r !== void 0 && t.set(n, r);
	}
	return t;
}
function de(e) {
	return e.endsWith("/") ? e.substring(0, e.length - 1) : e;
}
// src/api/client.ts
var D = ne({
	baseUrl: window.location.origin,
	fetch: (e) => globalThis.fetch(e)
});
function fe(e, t) {
	let n = e && typeof e == "object" && "error" in e ? String(e.error) : `Request failed (${t})`;
	return Error(n);
}
async function pe(e, t) {
	let { data: n, error: r, response: i } = await D.POST("/api/project/rename", { body: {
		name: e,
		expected_path: t
	} });
	if (!n) throw fe(r, i.status);
	return n.project;
}
async function me() {
	let { data: e, error: t, response: n } = await D.GET("/api/jobs", { params: { query: { limit: 100 } } });
	if (!e) throw fe(t, n.status);
	return e.jobs;
}
async function he(e) {
	let { data: t, error: n, response: r } = await D.POST("/api/jobs/{job_id}/stop", { params: { path: { job_id: e } } });
	if (!t) throw fe(n, r.status);
	return t.job;
}
// ../app/web/static/js/workspace/state.js
var O = {
	hosts: [],
	hostFilter: "hide_down",
	hostServiceFilter: "",
	hostServiceFilters: [],
	hostCategoryFilter: "",
	servicesHostFilterId: 0,
	servicesHostFilterLabel: "",
	servicesCategoryFilter: "",
	services: [],
	tools: [],
	toolsHydrated: !1,
	toolsLoading: !1,
	selectedHostId: null,
	hostDetail: null,
	manualToolTargets: [],
	manualToolOptions: [],
	deviceCategoryRules: [],
	builtInDeviceCategories: []
}, ge = JSON.parse(document.getElementById("scan-presets")?.textContent || "{}"), _e = ge.quick || "", ve = ge.comprehensive || "", k = {
	resize: null,
	viewId: "attack_surface",
	groupBy: "finding",
	renderMode: "auto",
	zoomPercent: 100,
	detailMode: "floating",
	filtersExpanded: !1,
	data: {
		nodes: [],
		edges: [],
		meta: {}
	},
	filtered: {
		nodes: [],
		edges: [],
		groups: [],
		positions: {},
		width: 1600,
		height: 900
	},
	loading: !1,
	needsRefresh: !1,
	refreshTimer: null,
	focusDepth: 1,
	focusSeedNodeIds: [],
	focusSeedLabel: "",
	expandedSummaryIds: {},
	metadataLoaded: !1,
	layouts: [],
	activeLayoutId: "",
	positions: {},
	pinnedNodeIds: {},
	selectedKind: "",
	selectedRef: "",
	selectedPayload: null,
	relatedContent: [],
	toolMenuCache: {},
	contentRequestId: 0,
	annotations: [],
	drag: null,
	suppressClickUntil: 0,
	viewport: null
}, ye = {
	pendingChannels: /* @__PURE__ */ new Set(),
	running: !1,
	timer: null
}, be = [], A = {
	recommendedPlatform: "",
	supportedPlatforms: ["kali", "ubuntu"],
	plan: null
}, j = "legion.graphWorkspaceHeightPx", xe = 1600, Se = "#ff9f43", Ce = {
	observed: "observed",
	inferred: "inferred",
	ai_suggested: "ai suggested",
	user_entered: "user entered"
}, we = {
	observed: {
		stroke: "#7ee3cb",
		edgeStroke: "#5f8f89",
		fill: "rgba(126, 227, 203, 0.16)",
		fillOpaque: "#17322f",
		dash: ""
	},
	inferred: {
		stroke: "#f1cd6b",
		edgeStroke: "#9d8555",
		fill: "rgba(241, 205, 107, 0.16)",
		fillOpaque: "#3a3118",
		dash: "7 5"
	},
	ai_suggested: {
		stroke: "#a38dff",
		edgeStroke: "#756ca8",
		fill: "rgba(163, 141, 255, 0.16)",
		fillOpaque: "#282042",
		dash: "2 5"
	},
	user_entered: {
		stroke: "#9ad2ff",
		edgeStroke: "#6e93ac",
		fill: "rgba(154, 210, 255, 0.16)",
		fillOpaque: "#1d3141",
		dash: ""
	}
}, Te = {
	scope: "#9ad2ff",
	subnet: "#7b83ff",
	host: "#86d993",
	fqdn: "#98d6ff",
	port: "#f0c96f",
	service: "#ff9c6f",
	url: "#6ce0c7",
	technology: "#8ac7ff",
	cpe: "#b4bbdd",
	cve: "#ff7c99",
	finding: "#ff6f91",
	credential: "#ffd37b",
	identity: "#ffe7a8",
	session: "#69d4ff",
	exploit_reference: "#ffb16f",
	screenshot: "#8fd0ff",
	artifact: "#9bc9b7",
	action: "#d1a8ff",
	evidence_record: "#b7bdd8"
}, M = {
	width: 148,
	height: 58
}, Ee = {
	critical: 0,
	high: 1,
	medium: 2,
	moderate: 2,
	low: 3,
	info: 4,
	informational: 4
}, De = { modalOpen: !1 }, N = {
	scriptDbId: null,
	processId: 0,
	scriptId: "",
	source: "",
	output: "",
	command: "",
	status: "",
	downloadName: "",
	modalOpen: !1
}, Oe = {
	modalOpen: !1,
	hostId: null,
	hostIp: "",
	hostName: ""
}, ke = {
	step: 1,
	lastMode: "",
	lastEngagementPreset: "",
	postSubmitLock: !0,
	captureInterfacesLoaded: !1
}, Ae = {
	modalOpen: !1,
	busy: !1,
	pendingAction: null,
	pendingLabel: "",
	latestSummary: null
}, P = {
	schedulerOpen: !1,
	interfaceSettingsOpen: !1,
	deviceCategorySettingsOpen: !1,
	settingsOpen: !1,
	nmapScanOpen: !1,
	manualScanOpen: !1,
	hostRemoveOpen: !1,
	graphNoteOpen: !1,
	workspaceSwitchGuardOpen: !1
}, je = { openMenuId: null }, Me = {
	30: "ansi-fg-black",
	31: "ansi-fg-red",
	32: "ansi-fg-green",
	33: "ansi-fg-yellow",
	34: "ansi-fg-blue",
	35: "ansi-fg-magenta",
	36: "ansi-fg-cyan",
	37: "ansi-fg-white",
	90: "ansi-fg-bright-black",
	91: "ansi-fg-bright-red",
	92: "ansi-fg-bright-green",
	93: "ansi-fg-bright-yellow",
	94: "ansi-fg-bright-blue",
	95: "ansi-fg-bright-magenta",
	96: "ansi-fg-bright-cyan",
	97: "ansi-fg-bright-white"
}, Ne = {
	40: "ansi-bg-black",
	41: "ansi-bg-red",
	42: "ansi-bg-green",
	43: "ansi-bg-yellow",
	44: "ansi-bg-blue",
	45: "ansi-bg-magenta",
	46: "ansi-bg-cyan",
	47: "ansi-bg-white",
	100: "ansi-bg-bright-black",
	101: "ansi-bg-bright-red",
	102: "ansi-bg-bright-green",
	103: "ansi-bg-bright-yellow",
	104: "ansi-bg-bright-blue",
	105: "ansi-bg-bright-magenta",
	106: "ansi-bg-bright-cyan",
	107: "ansi-bg-bright-white"
}, Pe = {
	attack_surface: {
		label: "attack surface",
		defaultGroup: "finding",
		nodeTypes: [
			"scope",
			"subnet",
			"host",
			"fqdn",
			"port",
			"service",
			"url",
			"technology",
			"finding",
			"cpe",
			"cve"
		]
	},
	host_service_topology: {
		label: "host/service topology",
		defaultGroup: "host",
		nodeTypes: [
			"host",
			"fqdn",
			"port",
			"service",
			"technology",
			"url",
			"action",
			"evidence_record",
			"artifact"
		]
	},
	exploitation_chain: {
		label: "exploitation chain",
		defaultGroup: "finding",
		nodeTypes: [
			"host",
			"finding",
			"cve",
			"exploit_reference",
			"credential",
			"identity",
			"session",
			"action",
			"artifact",
			"evidence_record"
		],
		edgeTypes: [
			"contains",
			"affected_by",
			"supports_exploit",
			"validated_by",
			"authenticated_as",
			"pivoted_to",
			"produced",
			"derived_from"
		]
	}
}, Fe = [
	"finding",
	"cve",
	"exploit_reference",
	"credential",
	"identity",
	"session",
	"scope",
	"subnet",
	"host",
	"fqdn",
	"service",
	"url",
	"port",
	"technology",
	"cpe",
	"action",
	"artifact",
	"evidence_record"
];
// ../app/web/static/js/workspace/dom.js
function Ie() {
	let e = De.modalOpen || N.modalOpen || Object.values(P).some(Boolean);
	document.body.classList.toggle("modal-open", e);
}
function F(e, t) {
	let n = document.getElementById(e);
	n && (n.textContent = t ?? "");
}
function I(e, t) {
	let n = document.getElementById(e);
	n && (n.value = t ?? "");
}
function Le(e, t) {
	let n = document.getElementById(e);
	n && (n.checked = !!t);
}
function L(e) {
	let t = document.getElementById(e);
	return t ? !!t.checked : !1;
}
function R(e) {
	let t = document.getElementById(e);
	return t ? t.value : "";
}
function Re(e) {
	let t = document.createElement("td");
	return t.textContent = e ?? "", t;
}
function ze(e) {
	return String(e || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function z(e, t = !1) {
	let n = document.getElementById("action-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
function B(e, t = !1) {
	let n = document.getElementById("workspace-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
// ../app/web/static/js/workspace/project_view.js
function Be(e) {
	p(e), F("project-name", e.name || "");
	let t = document.getElementById("project-name");
	t && (t.dataset.displayName = e.display_name || ""), F("project-kind", e.is_temporary ? "temporary" : "saved"), F("project-output-folder", e.output_folder || ""), F("project-running-folder", e.running_folder || ""), !R("project-save-path").trim() && e.name && I("project-save-path", e.name);
}
// node_modules/react/cjs/react-jsx-runtime.production.js
var Ve = /* @__PURE__ */ e(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), V = (/* @__PURE__ */ e(((e, t) => {
	t.exports = Ve();
})))();
function He({ sidebar: e, title: t, sidebarEditor: n, titleEditor: r }) {
	let i = (0, C.useSyncExternalStore)(_.subscribe, _.getSnapshot), a = (0, C.useSyncExternalStore)(y.subscribe, y.getSnapshot), [o, s] = (0, C.useState)(null), [c, l] = (0, C.useState)(""), [u, d] = (0, C.useState)(""), [f, p] = (0, C.useState)(!1), m = (0, C.useRef)(!1), h = (0, C.useRef)(null), g = (0, C.useRef)(null), v = ee(i);
	function x(e) {
		if (m.current || !i.name) return;
		let t = {
			path: i.name,
			originalName: v,
			location: e
		};
		h.current = t, s(t), l(v), d("");
	}
	function S(n = !1) {
		let r = o?.location === "sidebar" ? e.closest("button") : t.querySelector("button");
		h.current = null, s(null), d(""), n && requestAnimationFrame(() => r?.focus());
	}
	(0, C.useEffect)(() => {
		a.token && x(a.location);
	}, [a.token]), (0, C.useLayoutEffect)(() => {
		o && (g.current?.focus(), g.current?.select());
	}, [o?.path, o?.location]), (0, C.useEffect)(() => {
		o && o.path !== i.name && S();
	}, [i.name]);
	async function T() {
		if (!o || h.current !== o || m.current) return;
		if (_.getSnapshot().name !== o.path) {
			S();
			return;
		}
		let e = c.trim();
		if (e === o.originalName) S();
		else if (!e) d("Enter a workspace name."), g.current?.focus();
		else {
			m.current = !0, p(!0), d("");
			try {
				let t = await pe(e, o.path);
				_.getSnapshot().name === o.path && (b(t), Be(t), z("Workspace renamed")), S();
			} catch (e) {
				d(e instanceof Error ? e.message : "Rename failed."), requestAnimationFrame(() => g.current?.focus());
			} finally {
				m.current = !1, p(!1);
			}
		}
	}
	let E = o?.location === "sidebar", te = /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)("input", {
		id: "workspace-rename-input",
		type: "text",
		maxLength: 120,
		"aria-label": "Workspace name",
		ref: g,
		hidden: !o,
		disabled: f,
		value: c,
		"aria-invalid": u ? !0 : void 0,
		className: E ? "workspace-rename-sidebar" : void 0,
		onChange: (e) => l(e.target.value),
		onBlur: () => {
			T();
		},
		onKeyDown: (e) => {
			e.key === "Enter" && (e.preventDefault(), T()), e.key === "Escape" && !m.current && (e.preventDefault(), S(!0));
		}
	}), /* @__PURE__ */ (0, V.jsx)("span", {
		role: "alert",
		className: `workspace-rename-error${E ? " workspace-rename-sidebar-error" : ""}`,
		children: u
	})] });
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
		(0, w.createPortal)(/* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)("strong", {
			id: "sidebar-project-name",
			title: "Double-click to rename workspace",
			style: { visibility: E ? "hidden" : void 0 },
			onDoubleClick: (e) => {
				e.preventDefault(), e.stopPropagation(), x("sidebar");
			},
			children: v
		}), /* @__PURE__ */ (0, V.jsx)("small", {
			id: "sidebar-project-kind",
			children: i.is_temporary ? "Temporary · save to keep your work" : "Saved project"
		})] }), e),
		(0, w.createPortal)(/* @__PURE__ */ (0, V.jsx)("button", {
			id: "breadcrumb-project",
			type: "button",
			title: "Rename workspace",
			"aria-label": "Rename workspace",
			hidden: o?.location === "title",
			onClick: () => x("title"),
			children: v
		}), t),
		(0, w.createPortal)(te, E ? n : r)
	] });
}
// src/JobsTable.tsx
function Ue() {
	let e = (0, C.useSyncExternalStore)(v.subscribe, v.getSnapshot), [t, n] = (0, C.useState)(/* @__PURE__ */ new Set()), [r, i] = (0, C.useState)(""), a = (0, C.useRef)(/* @__PURE__ */ new Set());
	async function o(e) {
		if (!a.current.has(e)) {
			a.current.add(e), n((t) => new Set(t).add(e)), i("");
			try {
				let t = await he(e);
				v.set(v.getSnapshot().map((e) => e.id === t.id ? t : e)), z("Job stop requested"), v.set(await me());
			} catch (e) {
				i(e instanceof Error ? e.message : "Unable to stop job.");
			} finally {
				a.current.delete(e), n((t) => {
					let n = new Set(t);
					return n.delete(e), n;
				});
			}
		}
	}
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [r && /* @__PURE__ */ (0, V.jsx)("tr", {
		role: "alert",
		children: /* @__PURE__ */ (0, V.jsx)("td", {
			colSpan: 8,
			children: r
		})
	}), e.map((e) => {
		let n = e.status === "queued" || e.status === "running", r = e.cancel_requested || t.has(e.id), i = r && n ? e.status === "queued" ? "cancelling" : "stopping" : e.status, a = Array.isArray(e.result?.warnings) ? e.result.warnings.filter((e) => typeof e == "string") : [], s = e.error || a.join(" | ") || (r ? e.cancel_reason || "stop requested" : "");
		return /* @__PURE__ */ (0, V.jsxs)("tr", {
			"data-job-id": e.id,
			children: [
				/* @__PURE__ */ (0, V.jsx)("td", { children: e.id }),
				/* @__PURE__ */ (0, V.jsx)("td", { children: e.type }),
				/* @__PURE__ */ (0, V.jsx)("td", { children: i }),
				/* @__PURE__ */ (0, V.jsx)("td", { children: e.created_at }),
				/* @__PURE__ */ (0, V.jsx)("td", { children: e.started_at }),
				/* @__PURE__ */ (0, V.jsx)("td", { children: e.finished_at }),
				/* @__PURE__ */ (0, V.jsx)("td", { children: s }),
				/* @__PURE__ */ (0, V.jsx)("td", { children: n && /* @__PURE__ */ (0, V.jsx)("button", {
					type: "button",
					"data-job-action": "stop",
					"data-job-id": e.id,
					disabled: r,
					onClick: (t) => {
						t.stopPropagation(), o(e.id);
					},
					children: r ? e.status === "queued" ? "Cancelling..." : "Stopping..." : "Stop"
				}) })
			]
		}, e.id);
	})] });
}
// ../app/web/static/js/workspace/activity_bridge.js
var We = null, Ge = /* @__PURE__ */ new Map(), Ke = [];
function qe(e) {
	return We = e, Ge.forEach((e, t) => We.update(t, e)), Ke.splice(0).forEach(({ action: t, args: n, resolve: r, reject: i }) => {
		Promise.resolve().then(() => e.actions[t](...n)).then(r, i);
	}), () => {
		We === e && (We = null);
	};
}
function Je(e, t) {
	Ge.set(e, t), We?.update(e, t);
}
function Ye(e, ...t) {
	return We ? We.actions[e](...t) : new Promise((n, r) => Ke.push({
		action: e,
		args: t,
		resolve: n,
		reject: r
	}));
}
// ../app/web/static/js/workspace/http.js
async function Xe(e, t) {
	let n = await fetch(e, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t || {})
	}), r = {};
	try {
		r = await n.json();
	} catch {}
	if (!n.ok) {
		let e = r.error || `Request failed (${n.status})`;
		throw Error(e);
	}
	return r;
}
async function Ze(e) {
	let t = await fetch(e, { cache: "no-store" });
	if (!t.ok) throw Error(`Request failed (${t.status})`);
	return t.json();
}
// ../app/web/static/js/workspace/output_format.js
function Qe(e) {
	e.bold = !1, e.fg = "", e.bg = "";
}
function $e(e, t) {
	let n = Array.isArray(e) && e.length ? e : [0];
	for (let e = 0; e < n.length; e += 1) {
		let r = Number(n[e]);
		if (Number.isFinite(r)) {
			if (r === 0) Qe(t);
			else if (r === 1) t.bold = !0;
			else if (r === 22) t.bold = !1;
			else if (r === 39) t.fg = "";
			else if (r === 49) t.bg = "";
			else if (Me[r]) t.fg = Me[r];
			else if (Ne[r]) t.bg = Ne[r];
			else if (r === 38 || r === 48 || r === 58) {
				let t = Number(n[e + 1]);
				t === 5 ? e += 2 : t === 2 && (e += 4);
			}
		}
	}
}
function et(e) {
	let t = ["ansi-segment"];
	return e.bold && t.push("ansi-bold"), e.fg && t.push(e.fg), e.bg && t.push(e.bg), t.join(" ");
}
function tt(e) {
	let t = String(e || "").replace(/\r\n/g, "\n"), n = /\u001b\[([0-9;]*)m/g, r = {
		bold: !1,
		fg: "",
		bg: ""
	}, i = 0, a = "";
	return t.replace(n, (e, n, o) => {
		if (o > i) {
			let e = t.slice(i, o);
			a += `<span class="${et(r)}">${ze(e)}</span>`;
		}
		return $e(String(n || "").split(";").map((e) => e.trim()).filter((e) => e.length > 0).map((e) => parseInt(e, 10)).filter((e) => Number.isFinite(e)), r), i = o + e.length, e;
	}), i < t.length && (a += `<span class="${et(r)}">${ze(t.slice(i))}</span>`), a || "";
}
function nt(e, t) {
	let n = document.getElementById(e);
	if (!n) return;
	let r = Math.abs(n.scrollTop + n.clientHeight - n.scrollHeight) < 24;
	n.innerHTML = tt(t || ""), r && (n.scrollTop = n.scrollHeight);
}
function rt(e, t = "", n = "") {
	let r = String(e || "").trim(), i = String(t || "").trim(), a = String(n || "").trim();
	return !i && !a ? r : a ? i ? `${r}:${i}/${a}` : r ? `${r}/${a}` : `/${a}` : `${r}:${i}`;
}
function it(e, t = 160) {
	let n = String(e || "").replace(/\s+/g, " ").trim();
	return n ? n.length <= t ? n : `${n.slice(0, t - 3)}...` : "";
}
function at(e) {
	let t = Array.isArray(e?.scripts) ? e.scripts : [], n = [
		(e) => e === "banner",
		(e) => e.includes("banner"),
		(e) => e === "http-title",
		(e) => e === "dns-nsid"
	];
	for (let e of n) for (let n of t) {
		let t = String(n?.script_id || "").trim().toLowerCase();
		if (!t || !e(t)) continue;
		let r = it(n?.output || "");
		if (r) return r;
	}
	let r = e?.service || {};
	return it([
		r.product,
		r.version,
		r.extrainfo
	].filter(Boolean).join(" "));
}
function ot(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t <= 0) return "";
	let n = Math.max(0, Math.floor(t)), r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), a = n % 60;
	return r > 0 ? `${r}h ${String(i).padStart(2, "0")}m ${String(a).padStart(2, "0")}s` : `${i}m ${String(a).padStart(2, "0")}s`;
}
function st(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "running" || t === "waiting";
}
function ct(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "running" ? "process-status-running" : t === "crashed" ? "process-status-crashed" : t === "problem" ? "process-status-problem" : "";
}
// ../app/web/static/js/workspace/process_output.js
function lt(e) {
	Je("processes", e || []);
}
function ut(e) {
	F("script-output-meta", e || "");
}
function dt(e) {
	N.output = String(e || ""), nt("script-output-text", N.output);
}
function ft(e) {
	F("script-output-command", e || "");
}
function pt(e) {
	let t = document.getElementById("process-output-modal");
	t && (De.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function mt(e) {
	let t = document.getElementById("script-output-modal");
	t && (N.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function ht() {
	return Ye("closeOutput");
}
function gt(e = !0) {
	mt(!1), e && (N.scriptDbId = null, N.processId = 0, N.scriptId = "", N.source = "", N.output = "", N.command = "", N.status = "", N.downloadName = "", F("script-output-modal-title", "Script Output"), ut("No script selected"), ft(""), dt(""));
}
async function _t(e) {
	let t = parseInt(e, 10);
	if (t) {
		mt(!0), F("script-output-modal-title", "Script Output"), ut(`Script ${t} | loading...`), ft(""), dt(""), N.scriptDbId = t, N.processId = 0, N.scriptId = "", N.source = "", N.output = "", N.command = "", N.status = "", N.downloadName = "";
		try {
			let e = await Ze(`/api/workspace/scripts/${t}/output?max_chars=50000`), n = String(e.output || e.output_chunk || ""), r = e.source === "process" ? `Process ${e.process_id || "?"}` : "Script row output";
			N.processId = parseInt(e.process_id, 10) || 0, N.scriptId = String(e.script_id || ""), N.source = String(e.source || ""), N.output = n, N.command = String(e.command || ""), N.status = String(e.status || ""), N.downloadName = "", ft(e.command || "(no associated process command)"), dt(n), ut(`${e.script_id || `Script ${t}`} | ${r} | bytes ${e.output_length || n.length}`);
		} catch (e) {
			ut(`Script ${t} | load failed`), dt(`Failed to load script output: ${e.message || e}`);
		}
	}
}
function vt({ title: e = "Artifact Preview", meta: t = "", command: n = "", output: r = "", downloadName: i = "" } = {}) {
	mt(!0), N.scriptDbId = null, N.processId = 0, N.scriptId = "", N.source = "graph", N.output = String(r || ""), N.command = String(n || ""), N.status = "", N.downloadName = String(i || ""), F("script-output-modal-title", e || "Artifact Preview"), ut(String(t || "Artifact preview")), ft(n || "(no associated command)"), dt(r || "");
}
async function yt() {
	await xt(N.output || "", "Script output copied to clipboard", "No script output to copy");
}
async function bt() {
	let e = document.getElementById("script-output-command");
	await xt(e ? String(e.textContent || "") : "", "Command copied to clipboard", "No command to copy");
}
async function xt(e, t, n) {
	let r = String(e || "");
	if (!r) B(n || "Nothing to copy", !0);
	else try {
		if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(r);
		else {
			let e = document.createElement("textarea");
			e.value = r, e.setAttribute("readonly", "readonly"), e.style.position = "absolute", e.style.left = "-9999px", document.body.appendChild(e), e.select(), document.execCommand("copy"), document.body.removeChild(e);
		}
		B(t || "Copied to clipboard");
	} catch (e) {
		B(`Copy failed: ${e.message}`, !0);
	}
}
function St() {
	let e = N.output || "";
	if (!e) {
		B("No script output to download", !0);
		return;
	}
	if (N.downloadName) {
		let t = new Blob([e], { type: "text/plain;charset=utf-8" }), n = URL.createObjectURL(t), r = document.createElement("a");
		r.href = n, r.download = N.downloadName, document.body.appendChild(r), r.click(), r.remove(), URL.revokeObjectURL(n), B(`${N.downloadName} downloaded`);
		return;
	}
	let t = parseInt(N.scriptDbId, 10) || "unknown", n = (String(N.scriptId || "").trim() || `script-${t}`).replace(/[^a-zA-Z0-9._-]+/g, "-"), r = new Blob([e], { type: "text/plain;charset=utf-8" }), i = URL.createObjectURL(r), a = document.createElement("a");
	a.href = i, a.download = `${n}-${t}-output.txt`, document.body.appendChild(a), a.click(), a.remove(), URL.revokeObjectURL(i), B(`Script ${t} output downloaded`);
}
function Ct(e) {
	F("stat-hosts", e.hosts), F("stat-open-ports", e.open_ports), F("stat-services", e.services), F("stat-cves", e.cves), F("stat-running", e.running_processes), F("stat-finished", e.finished_processes);
}
// ../app/web/static/js/workspace/activity.js
function wt(e) {
	if (e && typeof e == "object") {
		if (e.project && Be(e.project), e.summary && Ct(e.summary), e.scheduler) {
			let t = e.scheduler.engagement_policy || {};
			F("scheduler-mode", e.scheduler.mode || ""), F("scheduler-goal", t.preset_label || t.preset || e.scheduler.goal_profile || ""), F("scheduler-families", e.scheduler.preapproved_families_count || 0);
		}
		Array.isArray(e.scheduler_rationale_feed) && Tt(e.scheduler_rationale_feed);
	}
}
function Tt(e) {
	Je("rationale", e || []);
}
function Et(e) {
	Je("decisions", e || []);
}
function Dt(e) {
	Je("approvals", e || []);
}
function Ot(e) {
	Je("scans", e || []);
}
function kt(e) {
	m(e || []), F("job-count", (e || []).length);
}
function At() {
	return Ye("loadOverview");
}
function jt() {
	return Ye("loadProcesses");
}
function Mt() {
	return Ye("loadDecisions");
}
function Nt() {
	return Ye("loadScans");
}
async function Pt() {
	kt((await Ze("/api/jobs?limit=20")).jobs || []);
}
// ../app/web/static/js/workspace/approvals.js
function Ft() {
	return Ye("loadApprovals");
}
// ../app/web/static/js/workspace/graph_selection.js
function It(e, t) {
	return e === "edge" ? (k.filtered.edges || []).find((e) => String(e?.edge_id || "") === String(t || "")) || null : (k.filtered.nodes || []).find((e) => String(e?.node_id || "") === String(t || "")) || null;
}
// ../app/web/static/js/workspace/graph_common.js
var Lt, Rt;
function zt(e) {
	for (let t of ["graphRenderWorkspace", "graphSyncDetailPresentation"]) if (typeof e[t] != "function") throw TypeError(`Missing graph_common callback: ${t}`);
	({graphRenderWorkspace: Lt, graphSyncDetailPresentation: Rt} = e);
}
function Bt() {
	let e = document.getElementById("graph-workspace-panel");
	return String(e?.dataset?.graphEnabled || "").toLowerCase() === "true";
}
function Vt() {
	let e = document.getElementById("graph-workspace-canvas");
	return e ? e.closest(".graph-panel") : null;
}
function Ht() {
	return document.getElementById("graph-workspace-shell");
}
function H() {
	let e = Ht();
	return e ? e.closest(".graph-panel") : null;
}
function Ut() {
	return document.querySelector(".graph-canvas-panel");
}
function Wt() {
	return document.querySelector(".graph-canvas-scroll");
}
function Gt() {
	return !!(k.selectedKind && k.selectedRef);
}
function Kt({ allowRetainedSummary: e = !0 } = {}) {
	if (k.selectedKind !== "node" || !k.selectedRef) return null;
	let t = It("node", k.selectedRef);
	if (t) return t;
	if (!e) return null;
	let n = k.selectedPayload, r = String(k.selectedRef || ""), i = String(n?.node_id || "");
	return !n || i !== r || !W(n, "summary_kind") || !k.expandedSummaryIds[i] ? null : n;
}
function qt(e) {
	let t = Number.parseInt(String(e || ""), 10);
	return Number.isFinite(t) ? Math.max(520, Math.min(xe, t)) : 680;
}
function Jt(e, { persist: t = !0 } = {}) {
	let n = Vt();
	if (!n) return;
	let r = qt(e);
	if (n.style.setProperty("--graph-workspace-height", `${r}px`), t) try {
		window.localStorage.setItem(j, String(r));
	} catch {}
	Rt();
}
function Yt() {
	try {
		let e = window.localStorage.getItem(j);
		if (e) {
			Jt(e, { persist: !1 });
			return;
		}
	} catch {}
	Jt(680, { persist: !1 });
}
function Xt() {
	if (!k.resize) return;
	let e = k.resize.handle, t = k.resize.pointerId;
	if (document.body.classList.remove("graph-workspace-resizing"), window.removeEventListener("pointermove", Zt), window.removeEventListener("pointerup", Xt), window.removeEventListener("pointercancel", Xt), window.removeEventListener("blur", Xt), e && typeof e.releasePointerCapture == "function" && t != null) try {
		e.hasPointerCapture && e.hasPointerCapture(t) && e.releasePointerCapture(t);
	} catch {}
	Jt(k.resize.currentHeight || k.resize.startHeight), k.resize = null;
}
function Zt(e) {
	if (!k.resize) return;
	let t = Number(e.clientY || 0) - k.resize.startY, n = k.resize.startHeight + t;
	k.resize.currentHeight = qt(n), Jt(k.resize.currentHeight, { persist: !1 }), Lt({ preserveDetail: !0 });
}
function Qt(e) {
	if (!Bt()) return;
	let t = document.querySelector(".graph-canvas-scroll");
	if (!t) return;
	e.preventDefault();
	let n = e.currentTarget || document.getElementById("graph-resize-handle"), r = e.pointerId;
	if (k.resize = {
		startY: Number(e.clientY || 0),
		startHeight: Math.max(520, Math.round(t.getBoundingClientRect().height || 680)),
		currentHeight: 0,
		handle: n,
		pointerId: r
	}, n && typeof n.setPointerCapture == "function" && r != null) try {
		n.setPointerCapture(r);
	} catch {}
	document.body.classList.add("graph-workspace-resizing"), window.addEventListener("pointermove", Zt), window.addEventListener("pointerup", Xt), window.addEventListener("pointercancel", Xt), window.addEventListener("blur", Xt);
}
function $t() {
	Jt(680);
}
function U(e, t = !1) {
	let n = document.getElementById("graph-workspace-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function en(e) {
	return String(e || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
function tn(e) {
	let t = String(e || "").trim(), n = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
	return n ? `${n[1]}.${n[2]}.${n[3]}.0/24` : t || "other";
}
function nn(e) {
	let t = String(e || ""), n = 5381;
	for (let e = 0; e < t.length; e += 1) n = (n << 5) + n + t.charCodeAt(e), n &= 2147483647;
	return Math.abs(n).toString(36);
}
function rn(e) {
	let t = String(e || "").trim().toLowerCase().split(".").filter(Boolean);
	if (t.length <= 2) return t.join(".") || "";
	let n = t.slice(-2).join(".");
	return [
		"co.uk",
		"com.au",
		"co.jp"
	].includes(n) && t.length >= 3 ? t.slice(-3).join(".") : t.slice(-2).join(".");
}
function an(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	try {
		return new URL(t).host || "";
	} catch {
		let e = t.match(/^[a-z]+:\/\/([^/?#]+)/i);
		return e ? String(e[1] || "").trim() : "";
	}
}
function W(e, t) {
	return !e || typeof e != "object" ? "" : (e.properties && typeof e.properties == "object" ? e.properties : {})[t];
}
function on(e) {
	let t = e?.properties && typeof e.properties == "object" ? e.properties : {}, n = [];
	return [
		"pack_id",
		"pack",
		"strategy_pack"
	].forEach((e) => {
		let r = String(t[e] || "").trim();
		r && n.push(r);
	}), (Array.isArray(t.pack_tags) ? t.pack_tags : []).forEach((e) => {
		let t = String(e || "").trim();
		t && n.push(t);
	}), Array.from(new Set(n));
}
function sn(e) {
	let t = String(e?.last_seen || "").trim(), n = String(e?.first_seen || "").trim();
	return t || n || "";
}
function cn(e) {
	let t = {
		"24h": 24,
		"7d": 168,
		"30d": 720,
		"90d": 2160
	}[String(e || "all").trim().toLowerCase()];
	return t ? Date.now() - t * 60 * 60 * 1e3 : 0;
}
function ln(e, t) {
	if (!t) return !0;
	let n = Date.parse(sn(e));
	return !Number.isFinite(n) || n >= t;
}
function un(e, t) {
	let n = String(t || "").trim().toLowerCase();
	return !n || String(W(e, "severity") || "").trim().toLowerCase() === n;
}
function dn(e, t) {
	let n = String(t || "").trim().toLowerCase();
	return !n || on(e).some((e) => String(e || "").trim().toLowerCase() === n);
}
function fn() {
	F("graph-min-confidence-value", R("graph-min-confidence") || "0");
}
function pn() {
	let e = Math.max(10, Math.min(400, parseInt(R("graph-zoom-slider"), 10) || k.zoomPercent || 100));
	k.zoomPercent = e, F("graph-zoom-value", `${e}%`);
}
function mn() {
	return Pe[String(R("graph-view-select") || k.viewId || "attack_surface").trim()] || Pe.attack_surface;
}
function hn(e, t, n) {
	let r = typeof e == "string" ? document.getElementById(e) : e;
	if (!r) return;
	let i = String(r.value || ""), a = Array.from(new Set((t || []).map((e) => String(e || "").trim()).filter(Boolean))).sort();
	r.innerHTML = "";
	let o = document.createElement("option");
	o.value = "", o.textContent = n, r.appendChild(o), a.forEach((e) => {
		let t = document.createElement("option");
		t.value = e, t.textContent = en(e), r.appendChild(t);
	}), a.includes(i) && (r.value = i);
}
function gn() {
	let e = document.getElementById("graph-layout-select");
	if (!e) return;
	let t = String(R("graph-view-select") || k.viewId || "attack_surface").trim(), n = String(k.activeLayoutId || e.value || ""), r = (k.layouts || []).filter((e) => String(e?.view_id || "").trim() === t);
	e.innerHTML = "";
	let i = document.createElement("option");
	i.value = "", i.textContent = "auto layout", e.appendChild(i), r.forEach((t) => {
		let n = document.createElement("option");
		n.value = String(t.layout_id || ""), n.textContent = `${t.name || "layout"}${t.updated_at ? ` (${t.updated_at})` : ""}`, e.appendChild(n);
	}), e.value = r.some((e) => String(e.layout_id || "") === n) ? n : "";
}
function _n() {
	let e = document.getElementById("graph-host-filter");
	if (!e) return;
	let t = String(e.value || "");
	e.innerHTML = "";
	let n = document.createElement("option");
	n.value = "", n.textContent = "all hosts", e.appendChild(n), (O.hosts || []).forEach((t) => {
		let n = document.createElement("option");
		n.value = String(t.id || ""), n.textContent = `${t.ip || ""}${t.hostname ? ` (${t.hostname})` : ""}`, e.appendChild(n);
	}), (O.hosts || []).some((e) => String(e.id || "") === t) && (e.value = t);
}
function vn() {
	let e = k.data || {}, t = Array.isArray(e.nodes) ? e.nodes : [], n = Array.isArray(e.edges) ? e.edges : [];
	hn("graph-node-type-filter", t.map((e) => String(e?.type || "").trim().toLowerCase()), "all node types"), hn("graph-edge-type-filter", n.map((e) => String(e?.type || "").trim().toLowerCase()), "all edge types"), hn("graph-source-kind-filter", t.concat(n).map((e) => String(e?.source_kind || "").trim().toLowerCase()), "all provenance"), hn("graph-severity-filter", t.concat(n).map((e) => String(W(e, "severity") || "").trim().toLowerCase()), "all severities"), hn("graph-pack-filter", t.concat(n).flatMap((e) => on(e).map((e) => String(e || "").trim().toLowerCase())), "all packs");
}
function yn(e) {
	return Te[String(e?.type || "").trim().toLowerCase()] || "#b4bbdd";
}
function bn(e) {
	return we[String(e?.source_kind || "observed").trim().toLowerCase()] || we.observed;
}
function xn() {
	return !!window.LEGION_OPAQUE_UI_ENABLED || !!document.body?.classList.contains("opaque-ui");
}
function Sn(e) {
	let t = bn(e);
	return String(t?.edgeStroke || t?.stroke || "#687691");
}
function Cn(e) {
	let t = bn(e);
	return xn() ? String(t?.fillOpaque || "#18182a") : String(t?.fill || "#18182a");
}
function wn(e) {
	let t = String(e || "").trim().split(/\s+/).filter(Boolean);
	if (!t.length) return ["unknown"];
	let n = [], r = "";
	return t.forEach((e) => {
		let t = r ? `${r} ${e}` : e;
		t.length <= 18 || !r ? r = t : (n.push(r), r = e);
	}), r && n.push(r), n.slice(0, 2);
}
function Tn(e, t = {}, n = "") {
	let r = document.createElementNS("http://www.w3.org/2000/svg", e);
	return Object.entries(t).forEach(([e, t]) => {
		t != null && t !== "" && r.setAttribute(e, String(t));
	}), n && (r.textContent = n), r;
}
function En(e, t) {
	let n = e.getBoundingClientRect(), r = e.viewBox.baseVal, i = n.width > 0 ? r.width / n.width : 1, a = n.height > 0 ? r.height / n.height : 1;
	return {
		x: r.x + (t.clientX - n.left) * i,
		y: r.y + (t.clientY - n.top) * a
	};
}
// ../app/web/static/js/workspace/host_scope.js
function Dn(e) {
	let t = parseInt(e, 10);
	if (!Number.isFinite(t) || t <= 0) return "";
	let n = (O.hosts || []).find((e) => String(e?.id || "") === String(t));
	return n ? String(n.hostname || n.ip || `host ${n.id || t}`).trim() : "";
}
function On(e, t = "") {
	let n = parseInt(e, 10), r = Number.isFinite(n) && n > 0 ? n : 0, i = r ? String(t || Dn(r) || `host ${r}`).trim() : "", a = parseInt(O.servicesHostFilterId, 10), o = String(O.servicesHostFilterLabel || "").trim();
	return O.servicesHostFilterId = r, O.servicesHostFilterLabel = i, String(a || 0) !== String(r || 0) || o !== i;
}
// ../app/web/static/js/workspace/host_filters.js
var kn, An, jn, Mn, Nn, Pn, Fn;
function In(e) {
	for (let t of [
		"closeRibbonMenus",
		"graphLoadSnapshot",
		"loadHostDetail",
		"loadWorkspaceHosts",
		"loadWorkspaceServices",
		"renderHosts",
		"renderServices"
	]) if (typeof e[t] != "function") throw TypeError(`Missing host_filters callback: ${t}`);
	({closeRibbonMenus: kn, graphLoadSnapshot: An, loadHostDetail: jn, loadWorkspaceHosts: Mn, loadWorkspaceServices: Nn, renderHosts: Pn, renderServices: Fn} = e);
}
function Ln(e) {
	if (!Array.isArray(e)) return [];
	let t = /* @__PURE__ */ new Set(), n = [];
	return e.forEach((e) => {
		let r = String(typeof e == "string" ? e : e?.name || "").trim();
		if (!r) return;
		let i = r.toLowerCase();
		t.has(i) || (t.add(i), n.push(r));
	}), n;
}
function Rn(e) {
	let t = Array.isArray(e) ? e : String(e || "").split(","), n = /* @__PURE__ */ new Set(), r = [];
	return t.forEach((e) => {
		let t = String(e || "").trim(), i = t.toLowerCase();
		t && !n.has(i) && (n.add(i), r.push(t));
	}), r;
}
function zn() {
	let e = Rn(O.hostServiceFilters || []);
	return e.length ? e : Rn(O.hostServiceFilter || "");
}
function Bn() {
	return zn().join(", ");
}
function Vn(e, t, n = "No categories") {
	let r = typeof e == "string" ? document.getElementById(e) : e;
	if (!r) return;
	let i = Ln(t);
	if (r.innerHTML = "", !i.length) {
		let e = document.createElement("span");
		e.className = "category-chip category-chip-empty", e.textContent = n, r.appendChild(e);
	} else i.forEach((e) => {
		let t = document.createElement("span");
		t.className = "category-chip", t.textContent = e, r.appendChild(t);
	});
}
function Hn(e) {
	let t = document.createElement("td");
	return t.className = "category-cell", Vn(t, e, "Uncategorized"), t.title = Ln(e).join(", "), t;
}
function Un() {
	let e = /* @__PURE__ */ new Set(), t = [];
	return (O.hosts || []).forEach((n) => {
		Ln(n?.categories || []).forEach((n) => {
			let r = n.toLowerCase();
			e.has(r) || (e.add(r), t.push(n));
		});
	}), t.sort((e, t) => e.localeCompare(t)), t;
}
function Wn() {
	let e = Un();
	["hosts-category-filter-select", "services-category-filter-select"].forEach((t) => {
		let n = document.getElementById(t);
		if (!n) return;
		let r = String(n.value || "");
		n.innerHTML = "";
		let i = document.createElement("option");
		i.value = "", i.textContent = "all categories", n.appendChild(i), e.forEach((e) => {
			let t = document.createElement("option");
			t.value = e, t.textContent = e, n.appendChild(t);
		}), e.some((e) => String(e || "") === r) && (n.value = r);
	});
}
function Gn() {
	let e = /* @__PURE__ */ new Map(), t = (t, n = 0) => {
		let r = String(t || "").trim(), i = r.toLowerCase();
		if (!r) return;
		let a = Number(n || 0);
		e.get(i) || e.set(i, {
			service: r,
			host_count: Number.isFinite(a) ? a : 0
		});
	}, n = /* @__PURE__ */ new Map();
	(O.hosts || []).forEach((e) => {
		let t = /* @__PURE__ */ new Map();
		(e?.services || []).forEach((e) => {
			let n = String(e || "").trim(), r = n.toLowerCase();
			n && !t.has(r) && t.set(r, n);
		}), t.forEach((e, t) => {
			let r = n.get(t) || {
				service: e,
				host_count: 0
			};
			r.host_count += 1, n.set(t, r);
		});
	}), n.forEach((e) => {
		t(e.service, e.host_count);
	}), (O.services || []).forEach((e) => {
		t(e?.service || "", e?.host_count || 0);
	}), zn().forEach((e) => t(e, 0));
	let r = Array.from(e.values());
	return r.sort((e, t) => e.service.localeCompare(t.service)), r;
}
function Kn() {
	let e = document.getElementById("hosts-service-filter-list"), t = document.getElementById("hosts-service-filter-button"), n = document.getElementById("hosts-service-filter-clear-button"), r = zn(), i = new Set(r.map((e) => e.toLowerCase())), a = Bn();
	if (t && (t.textContent = r.length ? `Services (${r.length})` : "Services", t.classList.toggle("is-active", r.length > 0), t.title = r.length ? `Host service filters: ${a}` : "Filter hosts by open service", t.setAttribute("aria-label", t.title)), n && (n.disabled = r.length === 0), !e) return;
	let o = Gn();
	if (e.innerHTML = "", !o.length) {
		let t = document.createElement("p");
		t.className = "meta-note", t.textContent = "No open services available.", e.appendChild(t);
	} else o.forEach((t) => {
		let n = document.createElement("label");
		n.className = "panel-filter-option";
		let r = document.createElement("input");
		r.type = "checkbox", r.value = t.service, r.checked = i.has(String(t.service || "").toLowerCase()), r.addEventListener("change", async () => {
			let e = zn(), n = String(t.service || "").trim().toLowerCase(), i = e.some((e) => e.toLowerCase() === n);
			await er(r.checked && !i ? e.concat([t.service]) : e.filter((e) => e.toLowerCase() !== n));
		});
		let a = document.createElement("span");
		a.className = "panel-filter-option-name", a.textContent = t.service, n.appendChild(r), n.appendChild(a);
		let o = document.createElement("span"), s = Number(t.host_count || 0);
		o.className = "panel-filter-option-count", o.textContent = String(Number.isFinite(s) ? s : 0), n.appendChild(o), e.appendChild(n);
	});
}
function qn(e) {
	let t = document.getElementById("hosts-service-filter-popover"), n = document.getElementById("hosts-service-filter-button"), r = !!e;
	t && (t.hidden = !r), n && n.setAttribute("aria-expanded", r ? "true" : "false"), r && Kn();
}
function Jn() {
	let e = new URLSearchParams(), t = String(O.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down";
	e.set("filter", t), zn().forEach((t) => {
		e.append("service", t);
	});
	let n = String(O.hostCategoryFilter || "").trim();
	return n && e.set("category", n), e.toString();
}
function Yn() {
	let e = new URLSearchParams(), t = parseInt(O.servicesHostFilterId, 10);
	Number.isFinite(t) && t > 0 && e.set("host_id", String(t));
	let n = String(O.servicesCategoryFilter || "").trim();
	return n && e.set("category", n), e.toString();
}
function Xn() {
	let e = document.getElementById("hosts-filter-show-all-button"), t = document.getElementById("hosts-filter-hide-down-button"), n = document.getElementById("hosts-reset-filter-button"), r = String(O.hostFilter || "hide_down").trim().toLowerCase(), i = Bn(), a = String(O.hostCategoryFilter || "").trim(), o = String(O.servicesCategoryFilter || "").trim();
	I("hosts-category-filter-select", a), I("services-category-filter-select", o);
	let s = parseInt(O.servicesHostFilterId, 10), c = String(O.servicesHostFilterLabel || "").trim();
	if (e && e.classList.toggle("is-active", r === "show_all"), t && t.classList.toggle("is-active", r !== "show_all"), n) {
		let e = r === "hide_down" && !i && !a && (!Number.isFinite(s) || s <= 0);
		n.disabled = e, n.classList.toggle("is-active", !e);
		let t = "Reset host filters (show only up hosts)";
		i && a && c ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear category filter: ${a}, clear services filter: ${c})` : i && c ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear services filter: ${c})` : i && a ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear category filter: ${a})` : i ? t = `Reset host filters (show only up hosts, clear service filter: ${i})` : a ? t = `Reset host filters (show only up hosts, clear category filter: ${a})` : c && (t = `Reset host filters (show only up hosts, clear services filter: ${c})`), n.setAttribute("title", t), n.setAttribute("aria-label", t);
	}
}
async function Zn(e) {
	O.hostFilter = String(e || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down", Xn(), kn(), await Mn(), await An({ background: !1 }).catch(() => {});
}
async function Qn(e) {
	O.hostCategoryFilter = String(e || "").trim(), Xn(), Pn(O.hosts), await Promise.all([Mn(), Nn()]), await An({ background: !1 }).catch(() => {});
}
async function $n(e) {
	let t = String(e || "").trim(), n = zn(), r = n.map((e) => e.toLowerCase());
	t && n.length === 1 && r[0] === t.toLowerCase() ? await er([]) : await er(t ? [t] : []);
}
async function er(e) {
	O.hostServiceFilters = Rn(e), O.hostServiceFilter = O.hostServiceFilters.join(","), Xn(), Kn(), Pn(O.hosts), Fn(O.services), await Promise.all([Mn(), Nn()]), await An({ background: !1 }).catch(() => {});
}
async function tr(e) {
	O.servicesCategoryFilter = String(e || "").trim(), Xn(), Fn(O.services), await Nn();
}
async function nr(e, t = "") {
	let n = parseInt(e, 10), r = parseInt(O.servicesHostFilterId, 10);
	Number.isFinite(n) && n > 0 && n === r ? On(0) : Number.isFinite(n) && n > 0 ? (O.selectedHostId = n, On(n, t)) : On(0), Xn(), Pn(O.hosts), await Promise.all([O.selectedHostId ? jn(O.selectedHostId) : Promise.resolve(), Nn()]);
}
async function rr() {
	O.hostFilter = "hide_down", O.hostServiceFilter = "", O.hostServiceFilters = [], O.hostCategoryFilter = "", O.servicesHostFilterId = 0, O.servicesHostFilterLabel = "", O.servicesCategoryFilter = "", Xn(), Pn(O.hosts), Fn(O.services), kn(), await Promise.all([Mn(), Nn()]), await An({ background: !1 }).catch(() => {});
}
// ../app/web/static/js/workspace/host_detail.js
function ir(e) {
	O.hostDetail = e || null;
	let t = e?.host || {}, n = e?.ports || [], r = e?.observations || {}, i = e?.target_state || {}, a = Array.isArray(r?.technologies) ? r.technologies : [], o = Array.isArray(i?.device_categories) ? i.device_categories : [];
	F("host-detail-name", t.ip ? `${t.ip} (${t.hostname || "no-hostname"})` : ""), I("workspace-tool-host-ip", t.ip || "");
	let s = document.getElementById("host-detail-ports");
	s && (s.innerHTML = "", n.forEach((e) => {
		let t = document.createElement("tr");
		t.appendChild(Re(e.port || "")), t.appendChild(Re(e.protocol || "")), t.appendChild(Re(e.state || "")), t.appendChild(Re(e.service?.name || "")), t.appendChild(Re(`${e.service?.product || ""} ${e.service?.version || ""}`.trim())), t.appendChild(Re(at(e))), s.appendChild(t);
	}));
	let c = document.getElementById("host-detail-scripts");
	c && (c.innerHTML = "", n.forEach((e) => {
		(e.scripts || []).forEach((e) => {
			let t = document.createElement("tr");
			t.appendChild(Re(e.id || "")), t.appendChild(Re(e.script_id || "")), t.appendChild(Re(e.display_output || (e.output || "").slice(0, 140)));
			let n = document.createElement("td"), r = document.createElement("button");
			r.type = "button", r.textContent = "View", r.dataset.scriptViewId = String(e.id || ""), n.appendChild(r), t.appendChild(n), c.appendChild(t);
		});
	}));
	let l = document.getElementById("host-detail-ai-technologies");
	l && (l.innerHTML = "", a.forEach((e) => {
		let t = document.createElement("tr");
		t.appendChild(Re(e.name || "")), t.appendChild(Re(e.version || "")), t.appendChild(Re(e.cpe || "")), t.appendChild(Re(e.evidence || "")), l.appendChild(t);
	})), F("host-ai-tech-count", a.length), Vn("host-detail-categories", o, "Uncategorized"), F("host-device-category-count", Ln(o).length);
}
// ../app/web/static/js/workspace/invalidation_waiters.js
function ar(e, t = 5e3) {
	let n = new Set((e || []).map((e) => String(e || "").trim()).filter(Boolean));
	return n.size ? new Promise((e, r) => {
		let i = {
			channels: n,
			resolve: e,
			timeoutId: 0
		};
		i.timeoutId = window.setTimeout(() => {
			let e = be.indexOf(i);
			e >= 0 && be.splice(e, 1), r(/* @__PURE__ */ Error("Timed out waiting for workspace update."));
		}, Math.max(1, Number(t) || 1)), be.push(i);
	}) : Promise.resolve([]);
}
function or(e) {
	let t = new Set((e || []).map((e) => String(e || "").trim()).filter(Boolean));
	if (t.size && be.length) for (let e = be.length - 1; e >= 0; --e) {
		let n = be[e];
		if (Array.from(n.channels || []).some((e) => t.has(e))) {
			be.splice(e, 1), n.timeoutId && window.clearTimeout(n.timeoutId);
			try {
				n.resolve(Array.from(t));
			} catch {}
		}
	}
}
// ../app/web/static/js/workspace/tool_api.js
async function sr({ service: e = "", port: t = "", protocol: n = "tcp", limit: r = 500, offset: i = 0 } = {}) {
	let a = new URLSearchParams();
	return a.set("limit", String(r)), a.set("offset", String(i)), e && a.set("service", String(e)), t && a.set("port", String(t)), n && a.set("protocol", String(n)), Ze(`/api/workspace/tools?${a.toString()}`);
}
async function cr({ service: e = "", port: t = "", protocol: n = "tcp" } = {}) {
	let r = [], i = 0, a = 0;
	for (; a < 200;) {
		let o = await sr({
			service: e,
			port: t,
			protocol: n,
			limit: 500,
			offset: i
		}), s = Array.isArray(o?.tools) ? o.tools : [];
		if (r.push(...s), !o?.has_more) break;
		let c = Number(o.next_offset);
		if (!Number.isFinite(c) || c <= i) break;
		i = c, a += 1;
	}
	return r;
}
// ../app/web/static/js/workspace/workspace_data.js
var lr, ur, dr, fr;
function pr(e) {
	for (let t of [
		"graphLoadSnapshot",
		"renderHosts",
		"renderServices",
		"renderTools"
	]) if (typeof e[t] != "function") throw TypeError(`Missing workspace_data callback: ${t}`);
	({graphLoadSnapshot: lr, renderHosts: ur, renderServices: dr, renderTools: fr} = e);
}
function mr(e) {
	return new Promise((t) => {
		window.setTimeout(t, Math.max(0, Number(e) || 0));
	});
}
async function hr(e, t = 12e4, n = 1200) {
	let r = Number(e);
	if (!Number.isFinite(r) || r <= 0) throw Error("Invalid job id.");
	let i = Date.now();
	for (; Date.now() - i < t;) {
		let e = await Ze(`/api/jobs/${r}`), a = String(e.status || "").toLowerCase();
		if (a === "completed") return e;
		if (a === "failed") throw Error(String(e.error || "Save job failed."));
		if (window.LEGION_WS_ENABLED) {
			let e = t - (Date.now() - i);
			if (e <= 0) break;
			try {
				await ar(["jobs"], Math.min(Math.max(e, 1), 3e4));
			} catch {
				await mr(n);
			}
		} else await mr(n);
	}
	throw Error("Timed out waiting for job completion.");
}
async function gr() {
	let e = Jn(), t = Yn(), n = await Ze(`/api/workspace/hosts?${e}`);
	if (e !== Jn()) return;
	n && n.filter && (O.hostFilter = String(n.filter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down"), Xn(), dr(O.services), ur(n.hosts || []);
	let r = parseInt(O.servicesHostFilterId, 10), i = (Array.isArray(n.hosts) ? n.hosts : []).some((e) => String(e?.id || "") === String(r || ""));
	Number.isFinite(r) && r > 0 && !i && (On(O.selectedHostId), Xn(), ur(O.hosts)), t !== Yn() && await _r();
}
async function _r() {
	let e = Yn(), t = await Ze(`/api/workspace/services${e ? `?${e}` : ""}`);
	if (e !== Yn()) return;
	let n = parseInt(t?.host_id, 10);
	(!Number.isFinite(n) || n <= 0) && (O.servicesHostFilterId = 0, O.servicesHostFilterLabel = ""), O.servicesCategoryFilter = String(t?.category || "").trim(), Xn(), dr(t.services || []);
}
async function vr({ service: e = "", force: t = !1 } = {}) {
	if (!O.toolsLoading || t) {
		O.toolsLoading = !0;
		try {
			let t = await cr({ service: e });
			O.toolsHydrated = !0, fr(t);
		} finally {
			O.toolsLoading = !1;
		}
	}
}
async function yr(e) {
	e && ir(await Ze(`/api/workspace/hosts/${e}`));
}
async function br() {
	B("Refreshing workspace...");
	try {
		await Promise.all([
			gr(),
			_r(),
			vr()
		]), O.selectedHostId && await yr(O.selectedHostId);
		try {
			await lr({ background: !0 });
		} catch {}
		B("Workspace refreshed");
	} catch (e) {
		B(`Workspace refresh failed: ${e.message}`, !0);
	}
}
function xr(e) {
	return Array.from(new Set(String(e || "").split(",").map((e) => String(e || "").trim()).filter(Boolean)));
}
// ../app/web/static/js/workspace/device_categories.js
var Sr;
function Cr(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing device_categories callback: ${t}`);
	({applySchedulerPreferences: Sr} = e);
}
function wr(e, t = !1) {
	let n = document.getElementById("device-category-save-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function Tr(e = {}) {
	let t = document.createElement("tr"), n = document.createElement("input");
	n.type = "text", n.value = String(e?.name || ""), n.dataset.deviceCategoryField = "name", n.placeholder = "Category name";
	let r = document.createElement("input");
	r.type = "text", r.value = Array.isArray(e?.ports) ? e.ports.join(", ") : "", r.dataset.deviceCategoryField = "ports", r.placeholder = "445, 3389";
	let i = document.createElement("input");
	i.type = "text", i.value = Array.isArray(e?.fingerprint_fragments) ? e.fingerprint_fragments.join(", ") : "", i.dataset.deviceCategoryField = "fingerprint_fragments", i.placeholder = "iis, microsoft windows rpc";
	let a = document.createElement("input");
	a.type = "text", a.value = Array.isArray(e?.cpe) ? e.cpe.join(", ") : "", a.dataset.deviceCategoryField = "cpe", a.placeholder = "cpe:/o:microsoft:windows";
	let o = document.createElement("button");
	o.type = "button", o.className = "icon-btn icon-btn-danger", o.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", o.title = "Remove category", o.setAttribute("aria-label", "Remove category"), o.addEventListener("click", () => {
		if (t.remove(), !document.querySelector("#device-category-rules-body tr")) {
			let e = document.getElementById("device-category-rules-body");
			e && e.appendChild(Tr({}));
		}
	}), [
		n,
		r,
		i,
		a
	].forEach((e) => {
		let n = document.createElement("td");
		n.appendChild(e), t.appendChild(n);
	});
	let s = document.createElement("td");
	return s.appendChild(o), t.appendChild(s), t;
}
function Er() {
	Vn("device-category-builtins-list", (O.builtInDeviceCategories || []).map((e) => e?.name || ""), "No built-in categories");
	let e = document.getElementById("device-category-rules-body");
	if (!e) return;
	e.innerHTML = "";
	let t = Array.isArray(O.deviceCategoryRules) ? O.deviceCategoryRules : [];
	t.length ? t.forEach((t) => {
		e.appendChild(Tr(t));
	}) : e.appendChild(Tr({}));
}
function Dr() {
	return Array.from(document.querySelectorAll("#device-category-rules-body tr")).map((e) => {
		let t = (t) => {
			let n = e.querySelector(`[data-device-category-field="${t}"]`);
			return n ? String(n.value || "").trim() : "";
		};
		return {
			name: t("name"),
			ports: xr(t("ports")),
			fingerprint_fragments: xr(t("fingerprint_fragments")),
			cpe: xr(t("cpe"))
		};
	}).filter((e) => e.name);
}
async function Or() {
	wr("Saving...");
	try {
		let e = await Xe("/api/scheduler/preferences", { device_categories: Dr() });
		Sr(e), wr("Saved");
	} catch (e) {
		wr(`Save failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/engagement_policy.js
function kr(e) {
	let t = String(e || "").trim().toLowerCase(), n = {
		external_recon: {
			preset: "external_recon",
			preset_label: "External Recon",
			scope: "external",
			intent: "recon",
			allow_exploitation: !1,
			allow_lateral_movement: !1,
			credential_attack_mode: "blocked",
			lockout_risk_mode: "blocked",
			stability_risk_mode: "approval",
			detection_risk_mode: "low",
			approval_mode: "risky",
			runner_preference: "local",
			noise_budget: "low",
			custom_overrides: {},
			legacy_goal_profile: "external_pentest"
		},
		external_pentest: {
			preset: "external_pentest",
			preset_label: "External Pentest",
			scope: "external",
			intent: "pentest",
			allow_exploitation: !0,
			allow_lateral_movement: !1,
			credential_attack_mode: "approval",
			lockout_risk_mode: "approval",
			stability_risk_mode: "approval",
			detection_risk_mode: "medium",
			approval_mode: "risky",
			runner_preference: "local",
			noise_budget: "medium",
			custom_overrides: {},
			legacy_goal_profile: "external_pentest"
		},
		internal_quick_recon: {
			preset: "internal_quick_recon",
			preset_label: "Internal Quick Recon",
			scope: "internal",
			intent: "recon",
			allow_exploitation: !1,
			allow_lateral_movement: !1,
			credential_attack_mode: "blocked",
			lockout_risk_mode: "blocked",
			stability_risk_mode: "approval",
			detection_risk_mode: "low",
			approval_mode: "risky",
			runner_preference: "local",
			noise_budget: "low",
			custom_overrides: {},
			legacy_goal_profile: "internal_asset_discovery"
		},
		internal_recon: {
			preset: "internal_recon",
			preset_label: "Internal Recon",
			scope: "internal",
			intent: "recon",
			allow_exploitation: !1,
			allow_lateral_movement: !1,
			credential_attack_mode: "blocked",
			lockout_risk_mode: "blocked",
			stability_risk_mode: "approval",
			detection_risk_mode: "low",
			approval_mode: "risky",
			runner_preference: "local",
			noise_budget: "low",
			custom_overrides: {},
			legacy_goal_profile: "internal_asset_discovery"
		},
		internal_pentest: {
			preset: "internal_pentest",
			preset_label: "Internal Pentest",
			scope: "internal",
			intent: "pentest",
			allow_exploitation: !0,
			allow_lateral_movement: !0,
			credential_attack_mode: "approval",
			lockout_risk_mode: "approval",
			stability_risk_mode: "approval",
			detection_risk_mode: "medium",
			approval_mode: "risky",
			runner_preference: "local",
			noise_budget: "medium",
			custom_overrides: {},
			legacy_goal_profile: "internal_asset_discovery"
		}
	};
	return n[t] || {
		...n.internal_recon,
		preset: t || "custom",
		preset_label: t ? t.replace(/_/g, " ") : "Custom"
	};
}
function Ar(e, t) {
	let n = jr(t), r = e && typeof e == "object" ? e : {}, i = kr(r.preset || n);
	return {
		...i,
		...r,
		custom_overrides: r.custom_overrides && typeof r.custom_overrides == "object" ? r.custom_overrides : {},
		legacy_goal_profile: r.legacy_goal_profile || Mr({
			...i,
			...r
		})
	};
}
function jr(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "external_pentest" ? "external_pentest" : t === "internal_pentest" ? "internal_pentest" : t === "external_recon" ? "external_recon" : "internal_recon";
}
function Mr(e) {
	let t = String(e?.preset || "").trim().toLowerCase();
	return t === "external_recon" || t === "external_pentest" ? "external_pentest" : "internal_asset_discovery";
}
function Nr(e, t) {
	return t ? "Custom lets you override scope and intent manually. Use the standard presets unless you need a non-standard combination." : {
		external_recon: "Low-noise external mapping focused on discovery, fingerprinting, and bounded validation.",
		external_pentest: "Broader external follow-up once recon shows a target is worth deeper assessment.",
		internal_quick_recon: "Fast internal low-hanging-fruit sweep focused on SMB, NetBIOS, NFS, printers, common admin panels, and other obvious exposure points.",
		internal_recon: "Broader internal discovery and validation across exposed services without moving into pentest depth.",
		internal_pentest: "Deeper internal assessment with wider follow-up and higher-noise exploration."
	}[String(e || "").trim().toLowerCase()] || "Preset drives scope and intent for most runs. Switch to custom only if you need a manual override.";
}
// ../app/web/static/js/workspace/scan_policy.js
var Pr, Fr, Ir, Lr, Rr;
function zr(e) {
	for (let t of [
		"applyNmapModeTargetDefaults",
		"refreshNmapModeOptions",
		"refreshNmapScanButtonState",
		"setNmapWizardStep",
		"updateNmapCommandPreview"
	]) if (typeof e[t] != "function") throw TypeError(`Missing scan_policy callback: ${t}`);
	({applyNmapModeTargetDefaults: Pr, refreshNmapModeOptions: Fr, refreshNmapScanButtonState: Ir, setNmapWizardStep: Lr, updateNmapCommandPreview: Rr} = e);
}
function Br() {
	return String(R("scheduler-goal-select") || "internal_recon").trim().toLowerCase();
}
function Vr() {
	return String(R("nmap-engagement-preset-select") || "").trim().toLowerCase() || Br();
}
function Hr(e = "") {
	return String(e || "").trim().toLowerCase() === "internal_quick_recon";
}
function Ur(e = "") {
	let t = Gr(e, { fallbackGoalProfile: R("scheduler-goal-select") || "internal_recon" });
	return String(t.scope || "").trim().toLowerCase() === "internal";
}
function Wr() {
	let e = parseInt(R("passive-capture-duration"), 10);
	return (/* @__PURE__ */ new Set([
		5,
		15,
		30,
		45,
		60,
		75,
		90,
		105,
		120
	])).has(e) ? e : 15;
}
function Gr(e, t = {}) {
	let n = String(e || "internal_recon").trim().toLowerCase();
	if (n !== "custom") return Ar(kr(n), n);
	let r = String(t.fallbackGoalProfile || R("scheduler-goal-select") || "internal_recon");
	return Ar({
		preset: "custom",
		scope: R("engagement-scope-select") || "internal",
		intent: R("engagement-intent-select") || "recon",
		allow_exploitation: L("engagement-allow-exploitation"),
		allow_lateral_movement: L("engagement-allow-lateral"),
		credential_attack_mode: R("engagement-credential-mode"),
		lockout_risk_mode: R("engagement-lockout-mode"),
		stability_risk_mode: R("engagement-stability-mode"),
		detection_risk_mode: R("engagement-detection-mode"),
		approval_mode: R("engagement-approval-mode"),
		runner_preference: R("engagement-runner-preference"),
		noise_budget: R("engagement-noise-budget"),
		custom_overrides: {}
	}, r);
}
function Kr() {
	let e = Vr(), t = e === "custom", n = Gr(e, { fallbackGoalProfile: R("scheduler-goal-select") || "internal_recon" });
	F("nmap-engagement-derived-scope", n.scope || "internal"), F("nmap-engagement-derived-intent", n.intent || "recon");
	let r = document.getElementById("nmap-engagement-preset-summary");
	r && (r.textContent = Nr(e, t));
	let i = document.getElementById("nmap-engagement-custom-note");
	i && (i.hidden = !t);
	let a = document.getElementById("nmap-mode-card-passive"), o = String(n.scope || "").trim().toLowerCase() === "internal";
	if (a && (a.hidden = !o), !o) {
		let e = document.querySelector("input[name='nmap-scan-mode'][value='passive_capture']");
		if (e && e.checked) {
			let e = document.querySelector("input[name='nmap-scan-mode'][value='easy']");
			e && (e.checked = !0);
		}
	}
}
function qr(e = {}) {
	let t = document.getElementById("passive-capture-interface"), n = document.getElementById("passive-capture-interface-note");
	if (!t) return;
	let r = Array.isArray(e.interfaces) ? e.interfaces : [], i = String(e.default_interface || "").trim(), a = String(t.value || "").trim();
	if (t.innerHTML = "", !r.length) {
		let e = document.createElement("option");
		e.value = "", e.textContent = "No capture-ready interfaces found", t.appendChild(e), t.value = "", n && (n.textContent = "Passive capture needs an active non-loopback IPv4 interface."), Rr();
	} else {
		if (r.forEach((e) => {
			let n = document.createElement("option");
			n.value = String(e.name || "").trim(), n.textContent = String(e.label || e.name || "").trim(), n.dataset.networks = Array.isArray(e.ipv4_networks) ? e.ipv4_networks.join(", ") : "", t.appendChild(n);
		}), t.value = a && r.some((e) => String(e.name || "").trim() === a) ? a : i && r.some((e) => String(e.name || "").trim() === i) ? i : String(r[0].name || "").trim(), n) {
			let e = t.options[t.selectedIndex], r = String(e?.dataset?.networks || "").trim();
			n.textContent = r ? `Connected networks: ${r}` : "Passive capture will watch discovery traffic on the selected interface.";
		}
		Rr();
	}
}
async function Jr() {
	if (document.getElementById("passive-capture-interface")) try {
		let e = await Ze("/api/network/interfaces");
		ke.captureInterfacesLoaded = !0, qr(e || {});
	} catch {
		ke.captureInterfacesLoaded = !1, qr({
			interfaces: [],
			default_interface: ""
		});
	}
}
function Yr({ scrollIntoView: e = !1, focusPreset: t = !1, focusTargets: n = !1 } = {}) {
	let r = document.getElementById("nmap-scan-block");
	e && r && r.scrollIntoView({
		behavior: "smooth",
		block: "start"
	}), ke.postSubmitLock = !0, ke.lastMode = "", ke.lastEngagementPreset = "", ke.captureInterfacesLoaded = !1, I("nmap-targets", ""), Le("nmap-run-actions", !0), I("passive-capture-duration", "15"), qr({
		interfaces: [],
		default_interface: ""
	});
	let i = document.querySelector("input[name='nmap-scan-mode'][value='easy']");
	i && (i.checked = !0), I("nmap-engagement-preset-select", R("scheduler-goal-select") || "internal_recon"), Kr(), Pr("easy"), Lr(1), Fr(), Ir(), Jr().catch(() => {});
	let a = t ? "nmap-engagement-preset-select" : n ? "nmap-targets" : "";
	if (a) {
		let e = document.getElementById(a);
		e && window.setTimeout(() => {
			e.focus();
		}, 220);
	}
}
// ../app/web/static/js/workspace/dialogs.js
var Xr, Zr;
function Qr(e) {
	for (let t of ["openManualToolPicker", "pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing dialogs callback: ${t}`);
	({openManualToolPicker: Xr, pollSnapshot: Zr} = e);
}
function $r(e) {
	let t = document.getElementById("nmap-scan-modal");
	t && (P.nmapScanOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function ei(e) {
	let t = document.getElementById("manual-scan-modal");
	t && (P.manualScanOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function ti(e) {
	let t = document.getElementById("host-remove-modal");
	t && (P.hostRemoveOpen = !!e, Oe.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function ni(e) {
	let t = document.getElementById("graph-note-modal");
	t && (P.graphNoteOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie(), e && window.requestAnimationFrame(() => {
		let e = document.getElementById("graph-note-input");
		e && (e.focus(), e.setSelectionRange(e.value.length, e.value.length));
	}));
}
function ri() {
	$r(!1);
}
function ii() {
	O.manualToolTargets = [];
	let e = document.getElementById("workspace-tool-target-wrapper"), t = document.getElementById("workspace-tool-target-select");
	e && (e.hidden = !0), t && (t.innerHTML = ""), F("workspace-tool-context", ""), ei(!1);
}
function ai() {
	ei(!1);
}
function oi(e = !0) {
	ti(!1), e && (Oe.hostId = null, Oe.hostIp = "", Oe.hostName = "", F("host-remove-modal-target", ""));
}
function si(e = !1) {
	ni(!1), e && I("graph-note-input", "");
}
function ci() {
	hi(), $r(!0), Yr({
		scrollIntoView: !1,
		focusPreset: !0
	});
}
function li() {
	Xr({});
}
function ui(e) {
	let t = parseInt(e, 10);
	if (!t) return;
	let n = O.hosts.find((e) => parseInt(e.id, 10) === t);
	Oe.hostId = t, Oe.hostIp = String(n?.ip || ""), Oe.hostName = String(n?.hostname || ""), F("host-remove-modal-target", (Oe.hostName ? `${Oe.hostIp} (${Oe.hostName})` : Oe.hostIp) || `Host ID ${t}`), ti(!0);
}
function di(e) {
	let t = document.getElementById("scheduler-settings-modal");
	t && (P.schedulerOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function fi(e) {
	let t = document.getElementById("device-category-settings-modal");
	t && (P.deviceCategorySettingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function pi(e) {
	let t = document.getElementById("app-settings-modal");
	t && (P.settingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function mi(e, t) {
	let n = t ? String(e || "").trim() : "";
	je.openMenuId = n || null, document.querySelectorAll(".ribbon-menu[data-ribbon-menu]").forEach((e) => {
		let t = String(e.dataset.ribbonMenu || ""), r = n && t === n;
		e.classList.toggle("is-open", !!r);
		let i = e.querySelector("[data-ribbon-menu-toggle]");
		i && i.setAttribute("aria-expanded", r ? "true" : "false");
	});
}
function hi() {
	mi("", !1), qn(!1);
}
function gi(e) {
	let t = String(e || "").trim();
	t ? mi(t, je.openMenuId !== t) : hi();
}
function _i() {
	hi(), di(!0);
}
function vi() {
	di(!1);
}
function yi() {
	hi(), wr("Idle"), Er(), fi(!0);
}
function bi() {
	fi(!1);
}
// ../app/web/static/js/workspace/graph_viewport.js
function xi(e) {
	return (k.filtered.groups || []).find((t) => String(t?.key || "") === String(e || "")) || null;
}
function Si(e) {
	if (!e || W(e, "summary_kind")) return 0;
	let t = parseInt(W(e, "host_id"), 10);
	if (Number.isFinite(t) && t > 0) return t;
	let n = String(e?.label || "").trim().toLowerCase(), r = String(W(e, "hostname") || "").trim().toLowerCase(), i = String(W(e, "ip") || "").trim(), a = (O.hosts || []).find((e) => n && String(e?.hostname || "").trim().toLowerCase() === n || r && String(e?.hostname || "").trim().toLowerCase() === r || i && String(e?.ip || "").trim() === i), o = parseInt(a?.id, 10);
	return Number.isFinite(o) && o > 0 ? o : 0;
}
function Ci(e) {
	let t = parseInt(O.selectedHostId, 10);
	return !Number.isFinite(t) || t <= 0 || String(e?.type || "").trim().toLowerCase() !== "host" ? !1 : Si(e) === t;
}
function wi() {
	return Math.max(10, Math.min(400, Number(k.zoomPercent || 100)));
}
function Ti(e, t, n, r) {
	let i = Math.max(1, Number(e || 1)), a = Math.max(1, Number(t || 1)), o = Math.max(1, Number(n || 1)) / Math.max(1, Number(r || 1));
	return i / a >= o ? {
		width: i,
		height: i / o
	} : {
		width: a * o,
		height: a
	};
}
function Ei(e, t, n, r, i, a) {
	let o = Math.max(1, Number(n || 1)), s = Math.max(1, Number(r || 1)), c = Math.max(1, Number(i || 1)), l = Math.max(1, Number(a || 1)), u = Number(e || 0), d = Number(t || 0);
	return u = c >= o ? o / 2 : Math.max(c / 2, Math.min(o - c / 2, u)), d = l >= s ? s / 2 : Math.max(l / 2, Math.min(s - l / 2, d)), {
		x: u,
		y: d
	};
}
function Di(e, t) {
	let n = k.filtered, r = (n.groups || []).map((e) => ({
		x: e.x,
		y: e.y,
		width: e.width,
		height: e.height
	}));
	Object.values(n.positions || {}).forEach((e) => r.push({
		x: e.x,
		y: e.y,
		width: M.width,
		height: M.height
	}));
	let i = r.filter((e) => Object.values(e).every(Number.isFinite));
	if (!i.length) return {
		x: 0,
		y: 0,
		width: e,
		height: t
	};
	let a = Math.min(...i.map((e) => e.x)) - 36, o = Math.min(...i.map((e) => e.y)) - 36;
	return {
		x: a,
		y: o,
		width: Math.max(...i.map((e) => e.x + e.width)) - a + 36,
		height: Math.max(...i.map((e) => e.y + e.height)) - o + 36
	};
}
function Oi(e, t) {
	let n = document.getElementById("graph-workspace-canvas"), r = Wt();
	if (!n || !r) return k.viewport = null, null;
	let i = Math.max(1, Number(r.clientWidth || r.getBoundingClientRect().width || 1)), a = Math.max(1, Number(r.clientHeight || r.getBoundingClientRect().height || 1)), o = Di(e, t), s = Ti(o.width, o.height, i, a), c = Math.max(1, i / (s.width * 1.25), a / (s.height * 1.25));
	s.width *= c, s.height *= c;
	let l = wi() / 100, u = Math.max(1, s.width / l), d = Math.max(1, s.height / l), f = k.viewport || {}, p = o.x + o.width / 2, m = o.y + o.height / 2, h = Ei((Number.isFinite(Number(f.centerX)) ? Number(f.centerX) : p) - o.x, (Number.isFinite(Number(f.centerY)) ? Number(f.centerY) : m) - o.y, o.width, o.height, u, d);
	h.x += o.x, h.y += o.y;
	let g = h.x - u / 2, _ = h.y - d / 2;
	return k.viewport = {
		x: g,
		y: _,
		width: u,
		height: d,
		centerX: h.x,
		centerY: h.y,
		boundsWidth: o.width,
		boundsHeight: o.height,
		boundsX: o.x,
		boundsY: o.y,
		containerWidth: i,
		containerHeight: a
	}, n.setAttribute("viewBox", `${g} ${_} ${u} ${d}`), n.style.width = "100%", n.style.height = `${Math.max(120, Math.round(a))}px`, k.viewport;
}
function ki() {
	return wi() >= 55;
}
function Ai(e = {}) {
	return e.isSelected || e.isHostSelected || e.isSummaryNode ? !0 : wi() >= 60;
}
function ji(e = {}) {
	return e.isSelected || e.isHostSelected || e.isSummaryNode ? !0 : wi() >= 78;
}
// ../app/web/static/js/workspace/host_actions.js
var Mi;
function Ni(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing host_actions callback: ${t}`);
	({pollSnapshot: Mi} = e);
}
function Pi(e = "Run supported tool") {
	let t = document.createElement("button");
	return t.type = "button", t.className = "icon-btn", t.title = e, t.setAttribute("aria-label", e), t.innerHTML = "<i class=\"fa-solid fa-screwdriver-wrench\" aria-hidden=\"true\"></i>", t;
}
function Fi(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = "icon-btn", n.dataset.subnetAction = String(e || ""), n.dataset.subnet = String(t || ""), e === "rescan" && (n.title = "Rescan subnet", n.setAttribute("aria-label", "Rescan subnet"), n.innerHTML = "<i class=\"fa-solid fa-rotate-right\" aria-hidden=\"true\"></i>"), n;
}
function Ii(e) {
	let t = parseInt(e, 10);
	return !Number.isFinite(t) || t <= 0 ? null : (O.hosts || []).find((e) => parseInt(e?.id, 10) === t) || null;
}
function Li(e) {
	let t = String(e?.node_id || "");
	if (!t) return {
		serviceName: "",
		serviceLabel: ""
	};
	let n = Array.isArray(k.data?.edges) ? k.data.edges : [], r = Array.isArray(k.data?.nodes) ? k.data.nodes : [], i = n.find((e) => String(e?.from_node_id || "") === t && String(e?.type || "").trim().toLowerCase() === "exposes");
	if (!i) return {
		serviceName: "",
		serviceLabel: ""
	};
	let a = r.find((e) => String(e?.node_id || "") === String(i.to_node_id || ""));
	if (!a || String(a?.type || "").trim().toLowerCase() !== "service") return {
		serviceName: "",
		serviceLabel: ""
	};
	let o = String(W(a, "service") || "").trim().replace(/\?+$/, "").toLowerCase();
	return {
		serviceName: o,
		serviceLabel: String(a?.label || o || "").trim()
	};
}
function Ri(e) {
	if (!e) return null;
	let t = String(e?.type || "").trim().toLowerCase();
	if (!["port", "service"].includes(t)) return null;
	let n = Si(e), r = Ii(n), i = String(r?.ip || W(e, "ip") || "").trim(), a = String(W(e, "port") || "").trim(), o = String(W(e, "protocol") || "tcp").trim().toLowerCase() || "tcp";
	if (!n || !i || !a) return null;
	let s = "", c = "";
	if (t === "service") s = String(W(e, "service") || e.label || "").trim().replace(/\?+$/, "").toLowerCase(), c = String(e.label || s || "").trim();
	else {
		let t = Li(e);
		s = t.serviceName, c = t.serviceLabel;
	}
	return {
		entityType: t,
		hostId: n,
		hostIp: i,
		hostname: String(r?.hostname || "").trim(),
		port: a,
		protocol: o,
		serviceName: s,
		serviceLabel: c || s || ""
	};
}
function zi() {
	document.querySelectorAll(".graph-action-menu.is-open").forEach((e) => {
		e.classList.remove("is-open");
		let t = e.querySelector(".panel-menu-button");
		t && t.setAttribute("aria-expanded", "false");
	});
}
async function Bi(e, { port: t = "", protocol: n = "tcp" } = {}) {
	let r = String(e || "").trim().toLowerCase(), i = String(t || "").trim(), a = String(n || "tcp").trim().toLowerCase() || "tcp", o = [
		r || "__all__",
		i || "__any_port__",
		a || "tcp"
	].join("|");
	if (Array.isArray(k.toolMenuCache[o])) return k.toolMenuCache[o];
	let s = new URLSearchParams();
	s.set("limit", "500"), r && s.set("service", r), i && s.set("port", i), a && s.set("protocol", a);
	let c = await Ze(`/api/workspace/tools?${s.toString()}`), l = Array.isArray(c?.tools) ? c.tools.filter((e) => !!e?.runnable) : [];
	return k.toolMenuCache[o] = l, l;
}
async function Vi(e, t) {
	if (e && t?.tool_id) try {
		let n = await Xe("/api/workspace/tools/run", {
			host_ip: e.hostIp,
			port: e.port,
			protocol: e.protocol,
			tool_id: String(t.tool_id || "")
		});
		B(`${t.label || t.tool_id} queued for ${e.hostIp}:${e.port}/${e.protocol} (job ${n?.job?.id || "?"})`), await Mi();
	} catch (e) {
		B(`Tool launch failed: ${e.message}`, !0);
	}
}
function Hi(e) {
	let t = document.createElement("div");
	t.className = "panel-menu graph-action-menu";
	let n = document.createElement("button");
	n.type = "button", n.className = "panel-menu-button", n.title = "Launch Action", n.setAttribute("aria-label", "Launch Action"), n.setAttribute("aria-haspopup", "menu"), n.setAttribute("aria-expanded", "false"), n.innerHTML = "<i class=\"fa-solid fa-bars\" aria-hidden=\"true\"></i>", t.appendChild(n);
	let r = document.createElement("div");
	r.className = "ribbon-submenu panel-submenu", r.setAttribute("role", "menu"), r.setAttribute("aria-label", "Applicable actions"), t.appendChild(r);
	let i = String(e?.serviceName || "").trim(), a = !1;
	return n.addEventListener("click", async (o) => {
		o.preventDefault(), o.stopPropagation();
		let s = !t.classList.contains("is-open");
		if (zi(), !s || (t.classList.add("is-open"), n.setAttribute("aria-expanded", "true"), a)) return;
		r.innerHTML = "";
		let c = document.createElement("div");
		c.className = "graph-action-menu-status", c.textContent = "Loading actions...", r.appendChild(c);
		try {
			let t = await Bi(i, {
				port: e?.port || "",
				protocol: e?.protocol || "tcp"
			});
			if (r.innerHTML = "", t.length) t.forEach((t) => {
				let n = document.createElement("button");
				n.type = "button", n.className = "ribbon-submenu-item", n.textContent = String(t.label || t.tool_id || "tool"), n.title = String(t.command_template || t.tool_id || ""), n.addEventListener("click", async (n) => {
					n.preventDefault(), n.stopPropagation(), zi(), await Vi(e, t);
				}), r.appendChild(n);
			});
			else {
				let e = document.createElement("div");
				e.className = "graph-action-menu-status", e.textContent = "No supported actions.", r.appendChild(e);
			}
			a = !0;
		} catch (e) {
			r.innerHTML = "";
			let t = document.createElement("div");
			t.className = "graph-action-menu-status", t.textContent = `Failed to load actions: ${e.message}`, r.appendChild(t);
		}
	}), r.addEventListener("click", (e) => {
		e.stopPropagation();
	}), t;
}
async function Ui(e) {
	let t = parseInt(e?.dataset?.hostId, 10), n = String(e?.dataset?.hostAction || "");
	return t ? n === "rescan" ? (await qi(t), !0) : n === "remove" && (ui(t), !0) : !0;
}
async function Wi(e) {
	let t = String(e?.dataset?.subnet || "").trim(), n = String(e?.dataset?.subnetAction || "");
	return !t || n === "rescan" && (await Ji(t), !0);
}
async function Gi(e) {
	if (!e?.hostId || !e?.port) return;
	let t = `${e.hostIp}:${e.port}/${e.protocol}`;
	if (window.confirm(`Delete port ${t}?`)) try {
		await Xe("/api/workspace/ports/delete", {
			host_id: e.hostId,
			port: e.port,
			protocol: e.protocol
		}), B(`Deleted port ${t}`), await Mi();
	} catch (e) {
		B(`Delete port failed: ${e.message}`, !0);
	}
}
async function Ki(e) {
	if (!e?.hostId || !e?.port) return;
	let t = `${e.serviceLabel || e.serviceName || "service"} on ${e.hostIp}:${e.port}/${e.protocol}`;
	if (window.confirm(`Delete ${t}?`)) try {
		await Xe("/api/workspace/services/delete", {
			host_id: e.hostId,
			port: e.port,
			protocol: e.protocol,
			service: e.serviceName
		}), B(`Deleted ${t}`), await Mi();
	} catch (e) {
		B(`Delete service failed: ${e.message}`, !0);
	}
}
async function qi(e) {
	let t = parseInt(e, 10);
	if (t) try {
		B(`Rescan queued (job ${(await Xe(`/api/workspace/hosts/${t}/rescan`, {}))?.job?.id || "?"})`), await Mi();
	} catch (e) {
		B(`Rescan failed: ${e.message}`, !0);
	}
}
async function Ji(e) {
	let t = String(e || "").trim();
	if (t) try {
		let e = await Xe("/api/workspace/subnets/rescan", { subnet: t }), n = Number(e?.job?.id || 0);
		e?.job?.existing ? B(`Subnet rescan already queued/running (job ${n || "?"})`) : B(`Subnet rescan queued (job ${n || "?"})`), await Mi();
	} catch (e) {
		B(`Subnet rescan failed: ${e.message}`, !0);
	}
}
async function Yi() {
	let e = parseInt(Oe.hostId, 10);
	if (!e) oi(!0);
	else try {
		let t = await fetch(`/api/workspace/hosts/${e}`, { method: "DELETE" }), n = {};
		try {
			n = await t.json();
		} catch {}
		if (!t.ok) {
			let e = n.error || `Request failed (${t.status})`;
			throw Error(e);
		}
		let r = String(n.host_ip || Oe.hostIp || "");
		oi(!0), O.selectedHostId === e && (O.selectedHostId = null, O.hostDetail = null), B(`Removed host ${r || e}`), await Promise.all([
			br(),
			Mi(),
			Ft()
		]);
	} catch (e) {
		B(`Remove host failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/tools.js
var Xi;
function Zi(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing tools callback: ${t}`);
	({pollSnapshot: Xi} = e);
}
function Qi() {
	if (R("workspace-tool-host-ip").trim()) return;
	let e = O.hosts.find((e) => String(e.id) === String(O.selectedHostId));
	e?.ip && I("workspace-tool-host-ip", e.ip);
}
function G(e) {
	return [
		String(e?.host_id || ""),
		String(e?.host_ip || ""),
		String(e?.port || ""),
		String(e?.protocol || "tcp"),
		String(e?.service || "")
	].join("|");
}
function K(e, t = "") {
	let n = document.getElementById("workspace-tool-select");
	if (!n) return;
	O.manualToolOptions = Array.isArray(e) ? e : [];
	let r = String(t || n.value || "").trim();
	n.innerHTML = "", O.manualToolOptions.filter((e) => e?.runnable !== !1).forEach((e) => {
		let t = document.createElement("option");
		t.value = String(e.tool_id || ""), t.textContent = `${e.label || e.tool_id} (${e.tool_id || ""})`, n.appendChild(t);
	}), r && Array.from(n.options).some((e) => e.value === r) && (n.value = r), ea();
}
function $i() {
	let e = R("workspace-tool-select").trim();
	return e && (Array.isArray(O.manualToolOptions) ? O.manualToolOptions : []).find((t) => String(t?.tool_id || "") === e) || null;
}
function ea() {
	let e = document.getElementById("workspace-tool-parameters-wrapper"), t = document.getElementById("workspace-tool-parameters");
	if (!e || !t) return;
	t.innerHTML = "";
	let n = $i(), r = Array.isArray(n?.parameters) ? n.parameters : [];
	r.length ? (r.forEach((e) => {
		let n = String(e?.name || "").trim();
		if (!n) return;
		let r = document.createElement("label");
		r.textContent = String(e?.label || n);
		let i = document.createElement("input");
		i.type = "text", i.dataset.parameterName = n, i.placeholder = String(e?.placeholder || ""), i.required = !!e?.required;
		let a = String(e?.description || "").trim();
		if (a && (i.title = a), r.appendChild(i), a) {
			let e = document.createElement("span");
			e.className = "meta-note", e.textContent = a, r.appendChild(e);
		}
		t.appendChild(r);
	}), e.hidden = !1) : e.hidden = !0;
}
function ta() {
	let e = document.getElementById("workspace-tool-parameters-wrapper"), t = document.getElementById("workspace-tool-parameters");
	if (!e || e.hidden || !t) return {};
	let n = {};
	return t.querySelectorAll("[data-parameter-name]").forEach((e) => {
		let t = String(e.dataset.parameterName || "").trim(), r = String(e.value || "").trim();
		t && r && (n[t] = r);
	}), n;
}
async function na({ hostId: e = 0, service: t = "", limit: n = 500 } = {}) {
	let r = new URLSearchParams();
	r.set("limit", String(n)), e && r.set("host_id", String(e)), t && r.set("service", String(t));
	let i = await Ze(`/api/workspace/tool-targets?${r.toString()}`);
	return Array.isArray(i?.targets) ? i.targets : [];
}
async function ra(e = "", t = "", { port: n = "", protocol: r = "tcp" } = {}) {
	let i = await cr({
		service: e,
		port: n,
		protocol: r
	});
	return K(i, t), i;
}
async function ia(e, { preferredToolId: t = "" } = {}) {
	let n = e && typeof e == "object" ? e : {};
	I("workspace-tool-host-ip", n.host_ip || ""), I("workspace-tool-port", n.port || ""), I("workspace-tool-protocol", n.protocol || "tcp"), await ra(String(n.service || "").trim(), t, {
		port: String(n.port || "").trim(),
		protocol: String(n.protocol || "tcp").trim() || "tcp"
	});
}
async function aa(e, { preferredTargetKey: t = "", preferredToolId: n = "" } = {}) {
	O.manualToolTargets = Array.isArray(e) ? e : [];
	let r = document.getElementById("workspace-tool-target-wrapper"), i = document.getElementById("workspace-tool-target-select");
	if (!r || !i) return;
	if (i.innerHTML = "", !O.manualToolTargets.length) {
		r.hidden = !0;
		return;
	}
	O.manualToolTargets.forEach((e) => {
		let t = document.createElement("option");
		t.value = G(e), t.textContent = String(e?.label || `${e?.host_ip || ""}:${e?.port || ""}/${e?.protocol || "tcp"}`), i.appendChild(t);
	}), r.hidden = !1;
	let a = t && Array.from(i.options).some((e) => e.value === t) ? t : String(i.options[0]?.value || "");
	a && (i.value = a), await ia(O.manualToolTargets.find((e) => G(e) === String(i.value || "")), { preferredToolId: n });
}
async function oa({ contextLabel: e = "", targets: t = null, hostId: n = 0, service: r = "", preferredToolId: i = "" } = {}) {
	hi(), ei(!0), F("workspace-tool-context", e || "");
	try {
		let e = Array.isArray(t) ? t : [];
		if (!e.length && (Number(n) > 0 || String(r || "").trim()) && (e = await na({
			hostId: Number(n) || 0,
			service: String(r || "").trim(),
			limit: 2e3
		})), e.length) {
			await aa(e, { preferredToolId: i });
			return;
		}
	} catch (e) {
		B(`Load tool targets failed: ${e.message}`, !0);
	}
	O.manualToolTargets = [];
	let a = document.getElementById("workspace-tool-target-wrapper"), o = document.getElementById("workspace-tool-target-select");
	a && (a.hidden = !0), o && (o.innerHTML = ""), Qi(), K(O.tools, i);
}
async function sa() {
	let e = document.getElementById("workspace-tool-target-select");
	if (!e) return;
	let t = O.manualToolTargets.find((t) => G(t) === String(e.value || ""));
	t && await ia(t);
}
async function ca() {
	if (!P.manualScanOpen) return;
	let e = document.getElementById("workspace-tool-target-select"), t = "";
	if (e && !e.closest("[hidden]")) {
		let n = O.manualToolTargets.find((t) => G(t) === String(e.value || ""));
		t = String(n?.service || "").trim();
	}
	await ra(t, R("workspace-tool-select").trim(), {
		port: R("workspace-tool-port").trim(),
		protocol: R("workspace-tool-protocol").trim() || "tcp"
	});
}
async function la() {
	let e = R("workspace-tool-host-ip").trim(), t = R("workspace-tool-port").trim(), n = R("workspace-tool-protocol").trim() || "tcp", r = R("workspace-tool-select").trim();
	if (!e || !t || !r) {
		B("host ip, port and tool are required", !0);
		return;
	}
	let i = ta();
	ai(), B("Queueing tool run...");
	try {
		B(`Tool run queued (job ${(await Xe("/api/workspace/tools/run", {
			host_ip: e,
			port: t,
			protocol: n,
			tool_id: r,
			parameters: i
		}))?.job?.id || "?"})`), await Xi();
	} catch (e) {
		B(`Tool run failed: ${e.message}`, !0);
	}
}
async function ua() {
	P.manualScanOpen && ai(), B("Queueing scheduler run...");
	try {
		B(`Scheduler run queued (job ${(await Xe("/api/scheduler/run", {}))?.job?.id || "?"})`), await Xi();
	} catch (e) {
		B(`Scheduler run failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/graph_detail.js
var da;
function fa(e) {
	for (let t of ["graphRenderWorkspace"]) if (typeof e[t] != "function") throw TypeError(`Missing graph_detail callback: ${t}`);
	({graphRenderWorkspace: da} = e);
}
function pa() {
	si(!1), k.selectedKind = "", k.selectedRef = "", k.selectedPayload = null, k.relatedContent = [], da();
}
function ma(e) {
	let t = !!e;
	k.filtersExpanded = t;
	let n = document.getElementById("graph-filters-panel"), r = document.getElementById("graph-filters-toggle-button");
	if (n && (n.hidden = !t), r) {
		let e = t ? "Hide Filters" : "Show Filters";
		r.setAttribute("title", e), r.setAttribute("aria-label", e), r.setAttribute("aria-expanded", t ? "true" : "false"), r.classList.toggle("is-active", t);
	}
}
function ha() {
	let e = Ut(), t = document.getElementById("graph-workspace-canvas");
	if (!e || !t || t.hidden) return null;
	let n = t.viewBox?.baseVal;
	if (!n || !Number(n.width) || !Number(n.height)) return null;
	let r = e.getBoundingClientRect(), i = t.getBoundingClientRect(), a = String(k.selectedKind || ""), o = String(k.selectedRef || "");
	if (!a || !o) return null;
	let s = 0, c = 0;
	if (a === "node") {
		let e = k.filtered.positions?.[o] || k.positions?.[o];
		if (!e) return null;
		s = Number(e.x || 0) + M.width, c = Number(e.y || 0) + M.height / 2;
	} else if (a === "edge") {
		let e = It("edge", o);
		if (!e) return null;
		let t = k.filtered.positions?.[String(e.from_node_id || "")], n = k.filtered.positions?.[String(e.to_node_id || "")];
		if (!t || !n) return null;
		let r = Number(t.x || 0) + M.width, i = Number(t.y || 0) + M.height / 2, a = Number(n.x || 0), l = Number(n.y || 0) + M.height / 2;
		s = (r + a) / 2, c = (i + l) / 2;
	} else return null;
	return {
		x: i.left - r.left + (s - Number(n.x || 0)) / Number(n.width || 1) * i.width,
		y: i.top - r.top + (c - Number(n.y || 0)) / Number(n.height || 1) * i.height
	};
}
function ga() {
	let e = Ht(), t = document.getElementById("graph-sidebar"), n = document.getElementById("graph-detail-dock-slot"), r = document.getElementById("graph-detail-floating-layer"), i = document.getElementById("graph-detail-panel"), a = document.getElementById("graph-detail-dock-toggle-button"), o = document.getElementById("graph-detail-close-button");
	if (!e || !t || !n || !r || !i || !a || !o) return;
	let s = String(k.detailMode || "floating") !== "docked", c = Gt();
	e.classList.toggle("graph-workspace-detail-floating", s), e.classList.toggle("graph-workspace-detail-docked", !s), t.hidden = s, r.hidden = !s || !c, i.classList.toggle("is-floating", s), a.setAttribute("title", s ? "Dock Panel" : "Float Panel"), a.setAttribute("aria-label", s ? "Dock Panel" : "Float Panel"), o.hidden = !s, s ? i.parentElement !== r && r.appendChild(i) : i.parentElement !== n && n.appendChild(i), i.hidden = s ? !c : !1, !s || !c ? (i.style.left = "", i.style.top = "") : window.requestAnimationFrame(() => {
		let e = Ut();
		if (!e || i.hidden) return;
		let t = ha(), n = Math.min(i.offsetWidth || 430, Math.max(280, e.clientWidth - 16)), r = i.offsetHeight || 420, a = Math.max(320, e.clientWidth), o = Math.max(240, e.clientHeight), s = Math.max(8, a - n - 10), c = 12;
		t && (s = t.x + 18, c = t.y + 12, s + n > a - 8 && (s = Math.max(8, t.x - n - 18)), c + r > o - 8 && (c = Math.max(8, o - r - 8))), s = Math.max(8, Math.min(s, a - n - 8)), c = Math.max(8, Math.min(c, o - Math.min(r, o - 8) - 8)), i.style.left = `${Math.round(s)}px`, i.style.top = `${Math.round(c)}px`;
	});
}
function _a(e) {
	k.detailMode = String(e || "floating").trim().toLowerCase() === "docked" ? "docked" : "floating", ga();
}
function va() {
	_a(k.detailMode === "docked" ? "floating" : "docked");
}
function ya() {
	let e = document.getElementById("graph-focus-selection-button"), t = document.getElementById("graph-clear-focus-button"), n = document.getElementById("graph-expand-selection-button"), r = document.getElementById("graph-collapse-expanded-button"), i = Kt(), a = i && W(i, "summary_kind") ? i : null, o = String(a?.node_id || ""), s = !!(o && k.expandedSummaryIds[o]);
	if (e) {
		let t = !!i;
		e.disabled = !t;
		let n = t ? "Focus Selected" : "Select a node or summary to focus";
		e.setAttribute("title", n), e.setAttribute("aria-label", n);
	}
	if (t) {
		let e = Array.isArray(k.focusSeedNodeIds) && k.focusSeedNodeIds.length > 0;
		t.disabled = !e;
		let n = e ? "Clear Focus" : "No graph focus is active";
		t.setAttribute("title", n), t.setAttribute("aria-label", n);
	}
	if (n) {
		let e = !!a && !s;
		n.hidden = !e, n.disabled = !e;
		let t = e ? "Expand Cluster" : "Select a collapsed summary cluster to expand";
		n.setAttribute("title", t), n.setAttribute("aria-label", t);
	}
	if (r) {
		let e = !!a && s;
		r.hidden = !e, r.disabled = !e;
		let t = e ? "Collapse Cluster" : "Select an expanded summary cluster to collapse";
		r.setAttribute("title", t), r.setAttribute("aria-label", t);
	}
}
function ba() {
	let e = document.getElementById("graph-detail-caption"), t = document.getElementById("graph-selection-badges"), n = document.getElementById("graph-detail-fields"), r = document.getElementById("graph-host-actions-block"), i = document.getElementById("graph-host-actions"), a = document.getElementById("graph-port-actions-block"), o = document.getElementById("graph-port-actions"), s = document.getElementById("graph-service-actions-block"), c = document.getElementById("graph-service-actions"), l = document.getElementById("graph-subnet-actions-block"), u = document.getElementById("graph-subnet-actions"), d = document.getElementById("graph-detail-evidence"), f = document.getElementById("graph-detail-properties"), p = document.getElementById("graph-annotations-list"), m = document.getElementById("graph-focus-selection-button");
	document.getElementById("graph-expand-selection-button"), document.getElementById("graph-collapse-expanded-button");
	let h = document.getElementById("graph-pin-toggle-button"), g = document.getElementById("graph-note-open-button"), _ = String(k.selectedKind || ""), v = String(k.selectedRef || ""), y = _ === "node" ? Kt() : It(_, v);
	if (k.selectedPayload = y, t.innerHTML = "", n.innerHTML = "", i.innerHTML = "", o.innerHTML = "", c.innerHTML = "", u.innerHTML = "", r.hidden = !0, a.hidden = !0, s.hidden = !0, l.hidden = !0, d.innerHTML = "", p.innerHTML = "", !y) {
		e.textContent = "Select a node or edge", f.textContent = "No graph selection", m.disabled = !0, m.setAttribute("title", "Select a node or summary to focus"), m.setAttribute("aria-label", "Select a node or summary to focus"), g.disabled = !0, g.setAttribute("title", "Select a node or edge to add a note"), g.setAttribute("aria-label", "Select a node or edge to add a note"), h.disabled = !0, h.classList.remove("is-active"), h.setAttribute("title", "Select a node to pin"), h.setAttribute("aria-label", "Select a node to pin"), ya(), ga();
		return;
	}
	let b = _ === "node" && !!W(y, "summary_kind"), x = _ === "edge" && !!W(y, "aggregate_kind"), S = _ === "node" ? Si(y) : 0, ee = _ === "node" ? String(y.type || "").trim().toLowerCase() : "", C = [];
	if (_ === "node") e.textContent = `${en(y.type)}: ${y.label || y.node_id || ""}`, C.push(["Node ID", y.node_id || ""]), C.push(["Type", en(y.type || "")]), b && (C.push(["Summary", "collapsed cluster"]), C.push(["Members", W(y, "member_count") || ""]), C.push(["Examples", (W(y, "sample_labels") || []).join(", ")]), C.push(["Expanded", k.expandedSummaryIds[String(y.node_id || "")] ? "yes" : "no"]));
	else {
		let t = It("node", y.from_node_id), n = It("node", y.to_node_id);
		e.textContent = `${en(y.type)}: ${t?.label || y.from_node_id || ""} -> ${n?.label || y.to_node_id || ""}`, C.push(["Edge ID", y.edge_id || ""]), C.push(["Type", en(y.type || "")]), C.push(["From", t?.label || y.from_node_id || ""]), C.push(["To", n?.label || y.to_node_id || ""]), x && (C.push(["Aggregate Count", W(y, "aggregate_count") || ""]), C.push(["Edge Types", (W(y, "edge_types") || []).join(", ")]));
	}
	if (C.push(["Confidence", y.confidence ?? ""]), C.push(["Provenance", Ce[String(y.source_kind || "").trim().toLowerCase()] || en(y.source_kind || "")]), C.push(["First Seen", y.first_seen || ""]), C.push(["Last Seen", y.last_seen || ""]), C.push(["Source Ref", y.source_ref || ""]), C.forEach(([e, t]) => {
		if (t == null || t === "") return;
		let r = document.createElement("dt");
		r.textContent = e;
		let i = document.createElement("dd");
		i.textContent = String(t), n.appendChild(r), n.appendChild(i);
	}), [
		en(y.type || ""),
		Ce[String(y.source_kind || "").trim().toLowerCase()] || en(y.source_kind || ""),
		`${Math.round(Number(y.confidence || 0))}% confidence`
	].forEach((e) => {
		let n = document.createElement("span");
		n.className = "graph-badge", n.textContent = e, t.appendChild(n);
	}), _ === "node" && k.pinnedNodeIds[String(y.node_id || "")]) {
		let e = document.createElement("span");
		e.className = "graph-badge graph-badge-pinned", e.textContent = "pinned", t.appendChild(e);
	}
	if (b) {
		let e = document.createElement("span");
		e.className = "graph-badge", e.textContent = "summary", t.appendChild(e);
	}
	if (x) {
		let e = document.createElement("span");
		e.className = "graph-badge", e.textContent = `${W(y, "aggregate_count") || 0} merged edges`, t.appendChild(e);
	}
	let w = [], T = /* @__PURE__ */ new Set(), E = (e) => {
		let t = String(e || "").trim();
		if (!t) return;
		let n = t.toLowerCase();
		T.has(n) || (T.add(n), w.push(t));
	};
	if (E(y?.properties?.evidence || ""), (Array.isArray(y?.evidence_refs) ? y.evidence_refs : []).forEach(E), (Array.isArray(y?.properties?.evidence_items) ? y.properties.evidence_items : []).forEach(E), w.length) w.forEach((e) => {
		let t = document.createElement("li");
		t.textContent = String(e || ""), d.appendChild(t);
	});
	else {
		let e = document.createElement("li");
		e.textContent = "No explicit evidence refs", d.appendChild(e);
	}
	let te = y.properties && typeof y.properties == "object" ? JSON.parse(JSON.stringify(y.properties)) : {};
	Array.isArray(te.member_node_ids) && te.member_node_ids.length > 24 && (te.member_node_ids = [`${te.member_node_ids.length} members hidden from inline view`]), f.textContent = JSON.stringify(te, null, 2);
	let ne = (k.annotations || []).filter((e) => String(e?.target_kind || "") === _ && String(e?.target_ref || "") === v);
	if (ne.length) ne.forEach((e) => {
		let t = document.createElement("article");
		t.className = "graph-annotation-card";
		let n = document.createElement("div");
		n.className = "graph-annotation-meta", n.textContent = `${e.created_by || "operator"} | ${e.updated_at || e.created_at || ""}`;
		let r = document.createElement("div");
		r.className = "graph-annotation-body", r.textContent = e.body || "", t.appendChild(n), t.appendChild(r), p.appendChild(t);
	});
	else {
		let e = document.createElement("p");
		e.className = "text-muted", e.textContent = "No notes yet.", p.appendChild(e);
	}
	if (_ === "node" && ee === "host" && S > 0) {
		r.hidden = !1;
		let e = Pi("Run supported tool");
		e.addEventListener("click", async () => {
			await oa({
				hostId: Number(S) || 0,
				contextLabel: `Supported tools for ${String(y.label || "host").trim()}`
			});
		}), i.appendChild(e);
	}
	if (_ === "node" && ee === "port") {
		let e = Ri(y);
		if (e) {
			a.hidden = !1;
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Delete Port", t.setAttribute("aria-label", "Delete Port"), t.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", t.addEventListener("click", async () => {
				await Gi(e);
			}), o.appendChild(t), o.appendChild(Hi(e));
		}
	}
	if (_ === "node" && ee === "service") {
		let e = Ri(y);
		if (e) {
			s.hidden = !1;
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Delete Service", t.setAttribute("aria-label", "Delete Service"), t.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", t.addEventListener("click", async () => {
				await Ki(e);
			}), c.appendChild(t), c.appendChild(Hi(e));
		}
	}
	if (_ === "node" && ee === "subnet") {
		let e = String(W(y, "cidr") || y.label || "").trim();
		if (e) {
			l.hidden = !1;
			let t = Fi("rescan", e);
			t.addEventListener("click", async () => {
				await Wi(t);
			}), u.appendChild(t);
		}
	}
	g.disabled = !1, g.setAttribute("title", "Add Note"), g.setAttribute("aria-label", "Add Note"), h.disabled = _ !== "node" || b;
	let re = _ === "node" && !!k.pinnedNodeIds[String(y.node_id || "")];
	h.classList.toggle("is-active", re), _ === "node" ? b ? (h.setAttribute("title", "Summary nodes cannot be pinned"), h.setAttribute("aria-label", "Summary nodes cannot be pinned")) : (h.setAttribute("title", re ? "Unpin Node" : "Pin Node"), h.setAttribute("aria-label", re ? "Unpin Node" : "Pin Node")) : (h.setAttribute("title", "Pinning is available for nodes only"), h.setAttribute("aria-label", "Pinning is available for nodes only")), b ? xa("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.") : xa(), ya(), ga();
}
function xa(e = "") {
	let t = document.getElementById("graph-detail-content-list"), n = document.getElementById("graph-detail-content-status");
	if (!t || !n) return;
	t.innerHTML = "";
	let r = Array.isArray(k.relatedContent) ? k.relatedContent : [];
	r.length ? (n.textContent = `${r.length} related item${r.length === 1 ? "" : "s"}`, r.forEach((e) => {
		let n = document.createElement("article");
		n.className = "graph-content-card";
		let r = document.createElement("div");
		r.className = "graph-content-header";
		let i = document.createElement("strong");
		i.textContent = e.label || e.filename || e.node_id || "artifact", r.appendChild(i);
		let a = document.createElement("span");
		a.className = "graph-content-kind", a.textContent = en(e.kind || e.node_type || "artifact"), r.appendChild(a), n.appendChild(r);
		let o = document.createElement("div");
		if (o.className = "graph-content-meta", o.textContent = e.ref || e.filename || "", n.appendChild(o), e.kind === "image" && e.preview_url) {
			let t = document.createElement("img");
			t.className = "graph-content-image", t.src = `${e.preview_url}${e.preview_url.includes("?") ? "&" : "?"}t=${Date.now()}`, t.alt = e.filename || e.label || "Graph artifact preview", t.addEventListener("click", () => {}), n.appendChild(t);
		} else if (e.kind === "text") {
			let t = document.createElement("pre");
			t.className = "graph-content-text", t.textContent = String(e.preview_text || e.message || "").trim() || "No text preview available.", n.appendChild(t);
		} else {
			let t = document.createElement("p");
			t.className = "text-muted", t.textContent = e.message || "Preview unavailable.", n.appendChild(t);
		}
		let s = document.createElement("div");
		s.className = "graph-content-actions host-actions";
		let c = document.createElement("button");
		c.type = "button", c.className = "icon-btn", c.title = "Copy", c.setAttribute("aria-label", "Copy"), c.innerHTML = "<i class=\"fa-solid fa-copy\" aria-hidden=\"true\"></i>", c.addEventListener("click", async () => {
			e.kind === "image" && e.preview_url || await xt(String(e.preview_text || e.ref || ""), `${e.filename || e.label || "Artifact"} copied to clipboard`, "Nothing to copy");
		}), s.appendChild(c);
		let l = document.createElement("button");
		if (l.type = "button", l.className = "icon-btn", l.title = "Download", l.setAttribute("aria-label", "Download"), l.innerHTML = "<i class=\"fa-solid fa-download\" aria-hidden=\"true\"></i>", l.addEventListener("click", () => {
			e.download_url && window.location.assign(`${e.download_url}${e.download_url.includes("?") ? "&" : "?"}t=${Date.now()}`);
		}), s.appendChild(l), e.kind === "image" && e.preview_url) {
			let e = document.createElement("button");
			e.type = "button", e.className = "icon-btn", e.title = "Open", e.setAttribute("aria-label", "Open"), e.innerHTML = "<i class=\"fa-solid fa-up-right-from-square\" aria-hidden=\"true\"></i>", e.addEventListener("click", () => {}), s.appendChild(e);
		} else if (e.kind === "text") {
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn", t.title = "Open", t.setAttribute("aria-label", "Open"), t.innerHTML = "<i class=\"fa-solid fa-up-right-from-square\" aria-hidden=\"true\"></i>", t.addEventListener("click", () => {
				vt({
					title: "Artifact Preview",
					meta: e.filename || e.ref || "Artifact preview",
					command: e.ref || "",
					output: e.preview_text || "",
					downloadName: e.filename || "artifact.txt"
				});
			}), s.appendChild(t);
		}
		n.appendChild(s), t.appendChild(n);
	}), ga()) : (n.textContent = e || "No related files", ga());
}
async function Sa() {
	let e = String(k.selectedKind || ""), t = String(k.selectedRef || ""), n = e === "node" ? Kt() : null;
	if (!e || !t || e !== "node" || !n) {
		k.relatedContent = [];
		return;
	}
	if (W(n, "summary_kind")) {
		k.relatedContent = [], xa("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.");
		return;
	}
	let r = Number(k.contentRequestId || 0) + 1;
	k.contentRequestId = r, k.relatedContent = [], xa("Loading related content...");
	try {
		let e = await Ze(`/api/graph/nodes/${encodeURIComponent(t)}/content?max_chars=20000`);
		if (r !== k.contentRequestId) return;
		k.relatedContent = Array.isArray(e?.entries) ? e.entries : [], xa();
	} catch (e) {
		if (r !== k.contentRequestId) return;
		k.relatedContent = [], xa(`Related content load failed: ${e.message}`);
	}
}
// ../app/web/static/js/workspace/graph_layout.js
function Ca(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
	return (e || []).forEach((e) => {
		let o = parseInt(W(e, "host_id"), 10);
		if (!(!Number.isFinite(o) || o <= 0) && String(e.type || "") === "host") {
			t.set(o, e), n.set(o, String(e.label || W(e, "ip") || `host-${o}`));
			let s = String(W(e, "hostname") || "").trim();
			s && i.set(o, s);
			let c = String(W(e, "ip") || "").trim();
			c && r.set(o, tn(c));
			let l = W(e, "device_categories");
			Array.isArray(l) ? a.set(o, Ln(l)) : a.set(o, Ln(String(l || "").split(",")));
		}
	}), {
		hostById: t,
		hostLabelById: n,
		subnetByHostId: r,
		domainByHostId: i,
		categoriesByHostId: a
	};
}
function wa(e, t, n) {
	let r = String(W(e, "summary_group_key") || "").trim();
	if (r) return r;
	let i = String(e?.type || "").trim().toLowerCase(), a = parseInt(W(e, "host_id"), 10), o = String(W(e, "hostname") || "").trim(), s = String(W(e, "service") || W(e, "name") || W(e, "product") || "").trim();
	if (t === "host") return i === "host" ? String(e.label || "host") : n.hostLabelById.get(a) || "unassigned host";
	if (t === "category") {
		let t = Ln(i === "host" ? W(e, "device_categories") : n.categoriesByHostId.get(a) || []);
		return t.length ? t.join(", ") : "uncategorized";
	}
	if (t === "domain") return i === "fqdn" ? String(e.label || "domain") : o || n.domainByHostId.get(a) || "undisclosed domain";
	if (t === "service") return i === "service" ? s || String(e.label || "service") : i === "port" ? `${W(e, "port") || ""}/${W(e, "protocol") || ""}`.replace(/\/$/, "") || "port" : s || en(i) || "other service";
	if (t === "finding") return String(i === "finding" ? W(e, "title") || e.label || "finding" : W(e, "cve") || W(e, "title") || W(e, "severity") || en(i) || "other");
	if (i === "subnet") return String(e.label || "subnet");
	let c = String(W(e, "ip") || "").trim();
	return c ? tn(c) : n.subnetByHostId.get(a) || "other subnet";
}
function Ta(e, t) {
	let n = String(e?.type || "").trim().toLowerCase(), r = String(t?.type || "").trim().toLowerCase(), i = Fe.indexOf(n), a = Fe.indexOf(r);
	return i === a ? String(e?.label || "").localeCompare(String(t?.label || "")) : (i === -1 ? Fe.length : i) - (a === -1 ? Fe.length : a);
}
function Ea(e) {
	let t = String(W(e, "severity") || "").trim().toLowerCase();
	return t ? Object.prototype.hasOwnProperty.call(Ee, t) ? Ee[t] : 80 : 99;
}
function Da(e, t) {
	let n = String(e || "").trim().toLowerCase();
	return t === "finding" ? n === "finding" ? 0 : n === "cve" || n === "exploit_reference" ? 1 : [
		"credential",
		"identity",
		"session"
	].includes(n) ? 2 : ["service", "url"].includes(n) ? 3 : n === "technology" || n === "cpe" ? 4 : [
		"host",
		"fqdn",
		"port",
		"subnet",
		"scope"
	].includes(n) ? 6 : 7 : t === "service" ? ["service", "url"].includes(n) ? 0 : n === "technology" || n === "cpe" ? 1 : [
		"finding",
		"cve",
		"exploit_reference"
	].includes(n) ? 2 : [
		"host",
		"fqdn",
		"port"
	].includes(n) ? 4 : 5 : t === "host" || t === "domain" || t === "subnet" || t === "category" ? [
		"host",
		"fqdn",
		"subnet",
		"scope"
	].includes(n) ? 0 : [
		"service",
		"url",
		"port"
	].includes(n) ? 1 : [
		"finding",
		"cve",
		"exploit_reference"
	].includes(n) ? 2 : [
		"credential",
		"identity",
		"session"
	].includes(n) ? 3 : 5 : 9;
}
function Oa(e, t) {
	return String(e || "").localeCompare(String(t || ""), void 0, {
		numeric: !0,
		sensitivity: "base"
	});
}
function ka(e, t) {
	return Array.from(e.entries()).sort((e, n) => {
		let [r, i] = e, [a, o] = n, s = Math.min(...i.map((e) => Da(e?.type, t)), 9), c = Math.min(...o.map((e) => Da(e?.type, t)), 9);
		if (s !== c) return s - c;
		let l = Math.min(...i.map((e) => Ea(e)), 99), u = Math.min(...o.map((e) => Ea(e)), 99);
		if (l !== u) return l - u;
		let d = i.filter((e) => [
			"finding",
			"cve",
			"exploit_reference"
		].includes(String(e?.type || "").trim().toLowerCase())).length, f = o.filter((e) => [
			"finding",
			"cve",
			"exploit_reference"
		].includes(String(e?.type || "").trim().toLowerCase())).length;
		return d === f ? Oa(r, a) : f - d;
	});
}
function Aa(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
	return (e || []).forEach((e) => {
		let n = String(e?.from_node_id || ""), r = String(e?.to_node_id || "");
		n && r && (t.has(n) || t.set(n, /* @__PURE__ */ new Set()), t.has(r) || t.set(r, /* @__PURE__ */ new Set()), t.get(n).add(r), t.get(r).add(n));
	}), t.forEach((e, t) => {
		n.set(String(t || ""), e.size);
	}), {
		neighborMap: t,
		degreeMap: n
	};
}
function ja(e, t) {
	let n = Math.max(1, Number(e || 0));
	if (n <= 4) return {
		columns: 1,
		rows: n
	};
	let r = t >= 5e3, i = n >= 240, a = r ? .62 : t >= 2500 ? .56 : .48, o = r ? 24 : t >= 2500 ? 20 : i ? 18 : 14, s = n >= 80 ? 7 : n >= 20 ? 4 : 2, c = Math.max(1, Math.ceil(Math.sqrt(n * a))), l = Math.max(1, Math.ceil(n / c));
	return l > o ? (l = o, c = Math.max(1, Math.ceil(n / l))) : l < s && n > s && (l = s, c = Math.max(1, Math.ceil(n / l))), {
		columns: c,
		rows: l
	};
}
function Ma(e, t, n) {
	let r = String(e || "").trim().toLowerCase(), i = String(t || k.viewId || "attack_surface").trim().toLowerCase();
	return i === "attack_surface" ? r === "scope" || r === "subnet" ? 0 : r === "host" || r === "fqdn" ? 1 : r === "port" || r === "service" ? 2 : r === "technology" || r === "cpe" ? 4 : r === "finding" || r === "cve" || r === "exploit_reference" ? 5 : [
		"credential",
		"identity",
		"session",
		"action",
		"artifact",
		"evidence_record"
	].includes(r) ? 6 : 7 : i === "host_service_topology" ? r === "host" || r === "fqdn" || r === "subnet" ? 0 : r === "port" || r === "service" ? 1 : r === "technology" || r === "cpe" ? 3 : r === "finding" || r === "cve" || r === "exploit_reference" ? 4 : 5 : i === "web_application_map" ? r === "host" || r === "fqdn" || r === "service" ? 0 : r === "technology" || r === "cpe" ? 2 : r === "finding" || r === "cve" || r === "exploit_reference" ? 3 : 4 : i === "credential_identity_session" ? r === "host" ? 0 : r === "credential" || r === "identity" || r === "session" ? 1 : r === "action" || r === "artifact" || r === "evidence_record" ? 2 : 3 : i === "exploitation_chain" ? r === "host" ? 0 : r === "finding" || r === "cve" || r === "exploit_reference" ? 1 : r === "credential" || r === "identity" || r === "session" ? 2 : 4 : Da(r, n);
}
function Na(e, t, n) {
	let r = Math.sqrt(Math.max(e, 1)) * (t >= 5e3 ? 1.08 : 1.16);
	return Math.max(1100, Math.min(t >= 5e3 ? 5600 : 4200, Math.round(r + n * 120)));
}
function Pa(e, t, n, r, i) {
	let a = /* @__PURE__ */ new Map();
	e.forEach((e) => {
		let t = Number(e?.lane ?? 0);
		a.has(t) || a.set(t, []), a.get(t).push(e);
	});
	let o = Array.from(a.entries()).sort((e, t) => Number(e[0]) - Number(t[0])), s = i, c = 0;
	return o.forEach(([, e]) => {
		let a = 0, o = i, l = 0, u = 0, d = 0;
		e.forEach((e) => {
			o > i && o + e.height > t && (a += l + n, o = i, l = 0), e.x = s + a, e.y = o, o += e.height + r, l = Math.max(l, e.width), u = Math.max(u, a + l), d = Math.max(d, e.y + e.height);
		}), s += u + n * 2, c = Math.max(c, d + i);
	}), {
		width: s,
		height: Math.max(c, 760)
	};
}
function Fa(e, t, n, r, i = {}) {
	let a = Array.isArray(e) ? e.length : 0, o = a >= 5e3 ? 10 : a >= 2500 ? 12 : 16, s = a >= 5e3 ? 8 : a >= 2500 ? 10 : 14, c = a >= 5e3 ? 20 : 26, l = a >= 5e3 ? 20 : 28, u = a >= 5e3 ? 14 : 18, d = a >= 5e3 ? 12 : 18, f = String(k.viewId || "attack_surface").trim(), p = new Map((e || []).map((e) => [String(e?.node_id || ""), e])), { neighborMap: m, degreeMap: h } = Aa(t), g = ka(n, r), _ = /* @__PURE__ */ new Map();
	g.forEach(([e, t]) => {
		(t || []).forEach((t) => {
			_.set(String(t?.node_id || ""), String(e || ""));
		});
	});
	let v = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map();
	(t || []).forEach((e) => {
		let t = String(e?.from_node_id || ""), n = String(e?.to_node_id || ""), r = _.get(t), i = _.get(n);
		if (!r || !i || r === i) return;
		let a = `${r}::${i}`, o = `${i}::${r}`;
		v.set(a, Number(v.get(a) || 0) + 1), v.set(o, Number(v.get(o) || 0) + 1), y.set(r, Number(y.get(r) || 0) + 1), y.set(i, Number(y.get(i) || 0) + 1);
	});
	let b = g.map(([e, t]) => {
		let n = String(e || ""), i = (t || []).slice().sort((e, t) => {
			let n = Da(e?.type, r) - Da(t?.type, r);
			if (n !== 0) return n;
			let i = Ea(e) - Ea(t);
			if (i !== 0) return i;
			let a = Number(h.get(String(t?.node_id || "")) || 0) - Number(h.get(String(e?.node_id || "")) || 0);
			if (a !== 0) return a;
			let o = Number((m.get(String(t?.node_id || "")) || /* @__PURE__ */ new Set()).size) - Number((m.get(String(e?.node_id || "")) || /* @__PURE__ */ new Set()).size);
			return o === 0 ? Oa(e?.label || "", t?.label || "") : o;
		}), c = Math.min(...i.map((e) => Da(e?.type, r)), 9), l = Math.min(...i.map((e) => Ea(e)), 99), p = i.filter((e) => [
			"finding",
			"cve",
			"exploit_reference"
		].includes(String(e?.type || "").trim().toLowerCase())).length, { columns: g, rows: _ } = ja(i.length, a), v = Math.max(220, Math.round(u * 2 + g * M.width + Math.max(0, g - 1) * o)), b = Math.max(132, Math.round(58 + _ * M.height + Math.max(0, _ - 1) * s + d));
		return {
			key: n,
			label: n,
			nodes: i,
			nodeIds: i.map((e) => String(e?.node_id || "")).filter(Boolean),
			priority: c,
			severity: l,
			findings: p,
			degree: Number(y.get(n) || 0),
			lane: Math.min(...i.map((e) => Ma(e?.type, f, r)), 99),
			columns: g,
			rows: _,
			width: v,
			height: b,
			area: v * b,
			x: 20,
			y: 20
		};
	});
	b.sort((e, t) => e.lane === t.lane ? e.priority === t.priority ? e.severity === t.severity ? e.findings === t.findings ? e.degree === t.degree ? e.area === t.area ? Oa(e.key, t.key) : t.area - e.area : t.degree - e.degree : t.findings - e.findings : e.severity - t.severity : e.priority - t.priority : e.lane - t.lane);
	let x = Pa(b, Na(b.reduce((e, t) => e + Number(t.area || 0), 0), a, new Set(b.map((e) => Number(e?.lane ?? 0))).size || 1), c, l, 20), S = {};
	b.forEach((e) => {
		let t = Math.max(1, Number(e.rows || 1));
		(e.nodes || []).forEach((n, r) => {
			let i = String(n?.node_id || ""), a = Math.floor(r / t), c = r % t;
			S[i] = {
				x: Math.round(e.x + u + a * (M.width + o)),
				y: Math.round(e.y + 42 + c * (M.height + s))
			};
		});
	});
	let ee = i && typeof i == "object" ? i : {};
	Object.keys(ee).forEach((e) => {
		p.has(String(e || "")) && (S[e] = {
			x: Math.max(20, Math.round(Number(ee[e]?.x) || 0)),
			y: Math.max(20, Math.round(Number(ee[e]?.y) || 0))
		});
	});
	let C = b.map((e) => {
		let t = Array.isArray(e.nodeIds) ? e.nodeIds : [], n = Infinity, r = Infinity, i = 0, a = 0;
		return t.forEach((e) => {
			let t = S[String(e || "")];
			t && (n = Math.min(n, Number(t.x) || 0), r = Math.min(r, Number(t.y) || 0), i = Math.max(i, (Number(t.x) || 0) + M.width), a = Math.max(a, (Number(t.y) || 0) + M.height));
		}), !Number.isFinite(n) || !Number.isFinite(r) ? {
			key: e.key,
			label: e.label,
			x: e.x,
			y: e.y,
			width: e.width,
			height: e.height,
			nodeIds: t
		} : {
			key: e.key,
			label: e.label,
			x: Math.max(12, Math.round(n - u)),
			y: Math.max(12, Math.round(r - 42 + 12)),
			width: Math.max(220, Math.round(i - n + u * 2)),
			height: Math.max(132, Math.round(a - r + 42 + d + 12)),
			nodeIds: t
		};
	}), w = Math.max(Math.round(x.width || 1200), 1200), T = Math.max(Math.round(x.height || 760), 760);
	return Object.values(S).forEach((e) => {
		w = Math.max(w, (Number(e?.x) || 0) + M.width + 80), T = Math.max(T, (Number(e?.y) || 0) + M.height + 120);
	}), C.forEach((e) => {
		w = Math.max(w, (Number(e?.x) || 0) + (Number(e?.width) || 0) + 48), T = Math.max(T, (Number(e?.y) || 0) + (Number(e?.height) || 0) + 48);
	}), {
		positions: S,
		groups: C,
		width: Math.round(w),
		height: Math.round(T)
	};
}
// ../app/web/static/js/workspace/graph_projection.js
function Ia(e) {
	if (!e || typeof e != "object") return [];
	let t = Array.isArray(W(e, "member_node_ids")) ? W(e, "member_node_ids") : [];
	if (t.length) return t.map((e) => String(e || "")).filter(Boolean);
	let n = String(e.node_id || "");
	return n ? [n] : [];
}
function La(e, t, n) {
	let r = String(n || k.renderMode || "auto").trim().toLowerCase();
	return r === "graph" ? !1 : r === "summary" || r === "matrix" || e >= 1e3 || t >= 3e3;
}
function Ra(e, t, n) {
	let r = String(n || k.renderMode || "auto").trim().toLowerCase();
	return r === "matrix" ? !0 : r === "graph" || r === "summary" ? !1 : e >= 1600 || t >= 4500;
}
function za(e) {
	let t = /* @__PURE__ */ new Map(), n = {
		observed: 4,
		user_entered: 3,
		inferred: 2,
		ai_suggested: 1
	};
	return (e || []).forEach((e) => {
		let r = String(e?.source_kind || "observed").trim().toLowerCase() || "observed", i = Number(t.get(r) || 0);
		t.set(r, i + 10 + Number(n[r] || 0));
	}), Array.from(t.entries()).sort((e, t) => t[1] - e[1])[0]?.[0] || "observed";
}
function Ba(e) {
	let t = "", n = Infinity;
	return (e || []).forEach((e) => {
		let r = String(W(e, "severity") || "").trim().toLowerCase();
		if (!r) return;
		let i = Object.prototype.hasOwnProperty.call(Ee, r) ? Ee[r] : 80;
		i < n && (n = i, t = r);
	}), t;
}
function Va(e, t) {
	let n = String(e || "").trim().toLowerCase();
	return n === "scope" || n === "subnet" ? Infinity : n === "finding" || n === "cve" || n === "exploit_reference" ? t >= 5e3 ? 5 : 7 : n === "host" || n === "fqdn" ? t >= 5e3 ? 3 : 5 : n === "technology" || n === "cpe" ? t >= 5e3 ? 2 : 3 : t >= 5e3 ? 2 : 4;
}
function Ha(e, t) {
	let n = String(e?.type || "").trim().toLowerCase(), r = String(e?.label || "").trim(), i = parseInt(W(e, "host_id"), 10), a = String(W(e, "hostname") || "").trim(), o = String(W(e, "ip") || "").trim(), s = String(W(e, "service") || W(e, "name") || r || "").trim().toLowerCase(), c = an(r).toLowerCase();
	return n === "host" ? {
		type: n,
		bucket: tn(o) || t.subnetByHostId.get(i) || rn(a) || "hosts"
	} : n === "fqdn" ? {
		type: n,
		bucket: rn(r || a) || t.domainByHostId.get(i) || "domains"
	} : n === "port" ? {
		type: n,
		bucket: `${W(e, "port") || r}/${W(e, "protocol") || "tcp"}`.replace(/\/$/, "")
	} : n === "service" ? {
		type: n,
		bucket: s || "service"
	} : n === "url" ? {
		type: n,
		bucket: c || rn(a) || "urls"
	} : n === "technology" || n === "cpe" || n === "credential" || n === "identity" || n === "session" ? {
		type: n,
		bucket: String(r || W(e, "name") || n).trim().toLowerCase() || n
	} : n === "finding" || n === "cve" || n === "exploit_reference" ? {
		type: n,
		bucket: String(r || W(e, "title") || W(e, "cve") || W(e, "severity") || n).trim().toLowerCase() || n
	} : {
		type: n,
		bucket: String(r || n).trim().toLowerCase() || n
	};
}
function Ua(e, t, n) {
	let r = Array.isArray(n) ? n.length : 0, i = en(String(t || "").replace(/^.+?:/, "")) || en(e) || "summary", a = r === 1 ? "" : "s";
	return e === "host" ? `${i} ${r} host${a}` : e === "fqdn" ? `${i} ${r} fqdn${a}` : e === "service" || e === "port" || e === "technology" || e === "cpe" ? `${i} ${r}` : e === "url" ? `${i} ${r} url${a}` : `${i} ${r}`;
}
function Wa(e, t, n, r) {
	let i = Ba(r), a = (r || []).map((e) => String(e?.label || "").trim()).filter(Boolean).slice(0, 3);
	return {
		node_id: e,
		type: n.type,
		label: Ua(n.type, n.bucket, r),
		confidence: Math.max(...(r || []).map((e) => Number(e?.confidence || 0) || 0), 0),
		source_kind: za(r),
		properties: {
			summary_kind: !0,
			summary_group_key: t,
			member_count: r.length,
			member_node_ids: r.map((e) => String(e?.node_id || "")).filter(Boolean),
			member_types: Array.from(new Set(r.map((e) => String(e?.type || "").trim().toLowerCase()).filter(Boolean))),
			sample_labels: a,
			collapsed_type: n.type,
			severity: i
		},
		evidence_refs: []
	};
}
function Ga(e, t, n, r) {
	let i = (e || []).slice().sort((e, t) => {
		let n = Number(W(e, "aggregate_count") || 1), r = Number(W(t, "aggregate_count") || 1);
		return n === r ? Oa(e?.edge_id || "", t?.edge_id || "") : r - n;
	});
	if (r) return i;
	let a = /* @__PURE__ */ new Map(), o = [];
	return i.forEach((e) => {
		let r = String(e?.from_node_id || ""), i = String(e?.to_node_id || ""), s = Number(W(e, "aggregate_count") || 1), c = t.has(r), l = t.has(i);
		if (n && (r === n || i === n) || c || l || s >= 3) {
			o.push(e);
			return;
		}
		let u = Number(a.get(r) || 0), d = Number(a.get(i) || 0);
		u >= 6 && d >= 6 || (a.set(r, u + 1), a.set(i, d + 1), o.push(e));
	}), o;
}
function Ka(e, t, n, r) {
	let i = Array.isArray(e) ? e.length : 0, a = /* @__PURE__ */ new Map();
	(e || []).forEach((e) => {
		let t = wa(e, r, n) || "other";
		a.has(t) || a.set(t, []), a.get(t).push(e);
	});
	let o = [], s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map();
	a.forEach((e, t) => {
		let r = /* @__PURE__ */ new Map();
		(e || []).forEach((e) => {
			let t = Ha(e, n), i = `${t.type}|${t.bucket}`;
			r.has(i) || r.set(i, {
				descriptor: t,
				nodes: []
			}), r.get(i).nodes.push(e);
		}), s.set(t, /* @__PURE__ */ new Set()), r.forEach((e, n) => {
			let r = Va(String(e.descriptor?.type || "").trim().toLowerCase(), i), a = `graph-summary-${nn(`${t}|${n}`)}`, d = !!k.expandedSummaryIds[a];
			if (e.nodes.length > r && !d) {
				let n = Wa(a, t, e.descriptor, e.nodes);
				o.push(n), u.set(a, n), s.get(t).add(a), l.add(a), e.nodes.forEach((e) => {
					c.set(String(e?.node_id || ""), a);
				});
			} else e.nodes.forEach((e) => {
				let n = String(e?.node_id || "");
				o.push(e), u.set(n, e), s.get(t).add(n), c.set(n, n);
			});
		});
	});
	let d = /* @__PURE__ */ new Map();
	(t || []).forEach((e) => {
		let t = c.get(String(e?.from_node_id || "")), n = c.get(String(e?.to_node_id || ""));
		if (!t || !n || t === n) return;
		let r = String(e?.type || "").trim().toLowerCase() || "related", i = `${t}|${n}|${r}`;
		d.has(i) || d.set(i, {
			edge_id: `graph-edge-summary-${nn(i)}`,
			type: r,
			from_node_id: t,
			to_node_id: n,
			source_kind: "observed",
			confidence: 0,
			members: [],
			properties: {
				aggregate_kind: !0,
				aggregate_count: 0,
				edge_types: []
			}
		});
		let a = d.get(i);
		a.members.push(e), a.properties.aggregate_count += Number(W(e, "aggregate_count") || 1), a.properties.edge_types.push(r), a.confidence = Math.max(Number(a.confidence || 0), Number(e?.confidence || 0) || 0), a.source_kind = za(a.members);
	});
	let f = String(k.selectedRef || ""), p = Array.isArray(k.focusSeedNodeIds) && k.focusSeedNodeIds.length > 0, m = Ga(Array.from(d.values()).map((e) => ({
		edge_id: e.edge_id,
		type: e.type,
		from_node_id: e.from_node_id,
		to_node_id: e.to_node_id,
		source_kind: e.source_kind,
		confidence: e.confidence,
		properties: {
			...e.properties,
			edge_types: Array.from(new Set(e.properties.edge_types))
		}
	})), l, f, p), h = /* @__PURE__ */ new Map();
	return s.forEach((e, t) => {
		let n = Array.from(e).map((e) => u.get(String(e || ""))).filter(Boolean);
		n.length && h.set(t, n);
	}), {
		nodes: o,
		edges: m,
		groupsMap: h,
		usedSummary: l.size > 0,
		summaryNodeIds: l
	};
}
function qa(e, t, n, r) {
	let i = Array.isArray(n) ? n.map((e) => String(e || "")).filter(Boolean) : [];
	if (!i.length) return {
		nodes: e,
		edges: t,
		active: !1
	};
	let a = new Map((e || []).map((e) => [String(e?.node_id || ""), e])), o = i.filter((e) => a.has(e));
	if (!o.length) return {
		nodes: e,
		edges: t,
		active: !1
	};
	let s = /* @__PURE__ */ new Map();
	(t || []).forEach((e) => {
		let t = String(e?.from_node_id || ""), n = String(e?.to_node_id || "");
		t && n && (s.has(t) || s.set(t, /* @__PURE__ */ new Set()), s.has(n) || s.set(n, /* @__PURE__ */ new Set()), s.get(t).add(n), s.get(n).add(t));
	});
	let c = new Set(o), l = o.slice(), u = Math.max(1, Math.min(3, Number(r || 1)));
	for (let e = 0; e < u; e += 1) {
		let e = [];
		if (l.forEach((t) => {
			Array.from(s.get(t) || []).forEach((t) => {
				c.has(t) || (c.add(t), e.push(t));
			});
		}), l = e, !l.length) break;
	}
	return {
		nodes: (e || []).filter((e) => c.has(String(e?.node_id || ""))),
		edges: (t || []).filter((e) => c.has(String(e?.from_node_id || "")) && c.has(String(e?.to_node_id || ""))),
		active: !0
	};
}
function Ja(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	(n || []).forEach((e) => {
		(e.nodeIds || []).forEach((t) => {
			r.set(String(t || ""), String(e.key || ""));
		});
	});
	let i = /* @__PURE__ */ new Map();
	(t || []).forEach((e) => {
		let t = r.get(String(e?.from_node_id || "")), n = r.get(String(e?.to_node_id || ""));
		if (!t || !n) return;
		let a = Number(W(e, "aggregate_count") || 1);
		i.set(t, Number(i.get(t) || 0) + a), i.set(n, Number(i.get(n) || 0) + a);
	});
	let a = (n || []).map((e) => ({
		key: String(e?.key || ""),
		label: String(e?.label || e?.key || ""),
		nodeCount: Array.isArray(e?.nodeIds) ? e.nodeIds.length : 0,
		activity: Number(i.get(String(e?.key || "")) || 0)
	})).sort((e, t) => e.activity === t.activity ? e.nodeCount === t.nodeCount ? Oa(e.label, t.label) : t.nodeCount - e.nodeCount : t.activity - e.activity), o = a.slice(0, 24), s = new Set(o.map((e) => e.key)), c = a.length > o.length;
	new Map(o.map((e, t) => [e.key, t])), c && o.push({
		key: "__other__",
		label: "other",
		nodeCount: a.slice(24).reduce((e, t) => e + t.nodeCount, 0),
		activity: a.slice(24).reduce((e, t) => e + t.activity, 0)
	});
	let l = o.length, u = Array.from({ length: l }, () => Array.from({ length: l }, () => 0)), d = 0;
	return (t || []).forEach((e) => {
		let t = r.get(String(e?.from_node_id || "")), n = r.get(String(e?.to_node_id || ""));
		if (!t || !n) return;
		s.has(t) || (t = "__other__"), s.has(n) || (n = "__other__");
		let i = o.findIndex((e) => e.key === t), a = o.findIndex((e) => e.key === n);
		if (i < 0 || a < 0) return;
		let c = Number(W(e, "aggregate_count") || 1);
		u[i][a] += c, d = Math.max(d, u[i][a]);
	}), {
		groups: o,
		values: u,
		maxValue: d
	};
}
// ../app/web/static/js/workspace/graph_filters.js
function Ya() {
	k.viewId = String(R("graph-view-select") || k.viewId || "attack_surface").trim(), k.groupBy = String(R("graph-group-select") || k.groupBy || mn().defaultGroup || "subnet").trim(), k.renderMode = String(R("graph-render-mode-select") || k.renderMode || "auto").trim().toLowerCase(), k.focusDepth = Math.max(1, Math.min(3, parseInt(R("graph-focus-depth-select"), 10) || k.focusDepth || 1));
	let e = parseInt(R("graph-host-filter"), 10), t = Math.max(0, Math.min(100, parseInt(R("graph-min-confidence"), 10) || 0));
	return {
		viewId: k.viewId,
		groupBy: k.groupBy,
		renderMode: k.renderMode,
		focusDepth: k.focusDepth,
		hostId: Number.isFinite(e) && e > 0 ? e : 0,
		hostFilter: String(O.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down",
		serviceFilters: zn(),
		category: String(O.hostCategoryFilter || "").trim(),
		nodeType: String(R("graph-node-type-filter") || "").trim().toLowerCase(),
		edgeType: String(R("graph-edge-type-filter") || "").trim().toLowerCase(),
		sourceKind: String(R("graph-source-kind-filter") || "").trim().toLowerCase(),
		severity: String(R("graph-severity-filter") || "").trim().toLowerCase(),
		pack: String(R("graph-pack-filter") || "").trim().toLowerCase(),
		timeWindow: String(R("graph-time-window-filter") || "all").trim().toLowerCase(),
		search: String(R("graph-search-input") || "").trim(),
		minConfidence: t,
		hideAiSuggested: L("graph-hide-ai-suggested"),
		hideNmapXmlArtifacts: L("graph-hide-nmap-xml-artifacts")
	};
}
function Xa(e) {
	let t = mn(), n = Ya(), r = n.sourceKind, i = n.nodeType, a = n.edgeType, o = n.severity, s = n.pack, c = cn(n.timeWindow), l = Array.isArray(e?.nodes) ? e.nodes.slice() : [], u = Array.isArray(e?.edges) ? e.edges.slice() : [];
	if (Array.isArray(t.nodeTypes) && t.nodeTypes.length > 0) {
		let e = new Set(t.nodeTypes);
		l = l.filter((t) => e.has(String(t?.type || "").trim().toLowerCase()));
	}
	let d = new Set(l.map((e) => String(e?.node_id || "")));
	if (Array.isArray(t.edgeTypes) && t.edgeTypes.length > 0) {
		let e = new Set(t.edgeTypes);
		u = u.filter((t) => e.has(String(t?.type || "").trim().toLowerCase()));
	}
	u = u.filter((e) => d.has(String(e?.from_node_id || "")) && d.has(String(e?.to_node_id || "")));
	let f = !!(r || i || o || s || c), p = !!(r || a || o || s || c), m = (e) => {
		let t = !r || String(e?.source_kind || "").trim().toLowerCase() === r, n = !i || String(e?.type || "").trim().toLowerCase() === i;
		return t && n && un(e, o) && dn(e, s) && ln(e, c);
	}, h = (e) => {
		let t = !r || String(e?.source_kind || "").trim().toLowerCase() === r, n = !a || String(e?.type || "").trim().toLowerCase() === a;
		return t && n && un(e, o) && dn(e, s) && ln(e, c);
	}, g = new Set(f ? l.filter(m).map((e) => String(e?.node_id || "")) : l.map((e) => String(e?.node_id || ""))), _ = p ? u.filter(h) : u.slice();
	p && _.forEach((e) => {
		g.add(String(e?.from_node_id || "")), g.add(String(e?.to_node_id || ""));
	}), l = l.filter((e) => g.has(String(e?.node_id || ""))), d = new Set(l.map((e) => String(e?.node_id || ""))), u = _.filter((e) => d.has(String(e?.from_node_id || "")) && d.has(String(e?.to_node_id || "")));
	let v = l.length, y = u.length, b = qa(l, u, k.focusSeedNodeIds, n.focusDepth);
	l = b.nodes, u = b.edges;
	let x = Ca(l), S = /* @__PURE__ */ new Map(), ee = La(l.length, u.length, n.renderMode), C = !1, w = /* @__PURE__ */ new Set();
	if (ee) {
		let e = Ka(l, u, x, n.groupBy || t.defaultGroup || "subnet");
		l = e.nodes, u = e.edges, S = e.groupsMap, C = !!e.usedSummary, w = e.summaryNodeIds || /* @__PURE__ */ new Set();
	} else l.sort(Ta).forEach((e) => {
		let r = wa(e, n.groupBy || t.defaultGroup || "subnet", x) || "other";
		S.has(r) || S.set(r, []), S.get(r).push(e);
	});
	let T = Fa(l, u, S, n.groupBy || t.defaultGroup || "subnet", k.positions), E = Ra(l.length, u.length, n.renderMode) && (T.groups || []).length > 2 ? "matrix" : "graph", te = E === "matrix" ? Ja(l, u, T.groups || []) : null;
	return {
		nodes: l,
		edges: u,
		groups: T.groups,
		positions: T.positions,
		width: T.width,
		height: T.height,
		renderKind: E,
		matrix: te,
		meta: {
			largeGraphMode: ee,
			summaryUsed: C,
			focusActive: b.active,
			focusDepth: n.focusDepth,
			baseNodeCount: v,
			baseEdgeCount: y,
			summaryNodeCount: w.size
		}
	};
}
// ../app/web/static/js/workspace/graph_render.js
function Za(e) {
	let t = document.getElementById("graph-matrix-view");
	if (!t) return;
	let n = e?.matrix || {}, r = Array.isArray(n.groups) ? n.groups : [], i = Array.isArray(n.values) ? n.values : [], a = Math.max(1, Number(n.maxValue || 0));
	if (t.innerHTML = "", !r.length || !i.length) {
		let e = document.createElement("p");
		e.className = "text-muted", e.textContent = "No dense matrix data is available for the current filters.", t.appendChild(e);
		return;
	}
	let o = document.createElement("p");
	o.className = "graph-matrix-note", o.textContent = "Dense matrix fallback: group-to-group relationship intensity", t.appendChild(o);
	let s = document.createElement("table");
	s.className = "graph-matrix-table";
	let c = document.createElement("thead"), l = document.createElement("tr"), u = document.createElement("th");
	u.textContent = "Source", l.appendChild(u), r.forEach((e) => {
		let t = document.createElement("th");
		t.textContent = e.label || e.key || "", t.title = `${e.label || e.key || ""} (${e.nodeCount || 0} nodes)`, l.appendChild(t);
	}), c.appendChild(l), s.appendChild(c);
	let d = document.createElement("tbody");
	r.forEach((e, t) => {
		let n = document.createElement("tr"), o = document.createElement("th");
		o.textContent = e.label || e.key || "", o.title = `${e.label || e.key || ""} (${e.nodeCount || 0} nodes)`, n.appendChild(o), r.forEach((r, o) => {
			let s = Number(i?.[t]?.[o] || 0), c = s > 0 ? Math.max(.08, Math.min(1, s / a)) : 0, l = document.createElement("td");
			l.className = "graph-matrix-cell", l.title = `${e.label || e.key || ""} -> ${r.label || r.key || ""}: ${s}`, l.style.background = s > 0 ? `rgba(126, 227, 203, ${Math.max(.12, c * .88)})` : "rgba(255, 255, 255, 0.03)", l.textContent = s > 0 ? String(s) : "", n.appendChild(l);
		}), d.appendChild(n);
	}), s.appendChild(d), t.appendChild(s);
}
function Qa({ preserveDetail: e = !1 } = {}) {
	let t = document.getElementById("graph-workspace-canvas"), n = document.getElementById("graph-workspace-empty"), r = document.getElementById("graph-matrix-view");
	if (!t || !n || !r) return;
	let i = Xa(k.data);
	k.filtered = i;
	let a = i.nodes || [], o = i.edges || [], s = i.positions || {}, c = !1, l = k.selectedKind === "node" ? Kt() : It(k.selectedKind, k.selectedRef);
	if (k.selectedKind && !l && (k.selectedKind = "", k.selectedRef = "", k.selectedPayload = null, k.relatedContent = [], c = !0), F("graph-workspace-summary", `${a.length} visible nodes | ${o.length} visible edges | ${Number(i?.meta?.baseNodeCount || k.data?.meta?.total_nodes || a.length)} filtered nodes${i?.meta?.summaryUsed ? " | summary mode" : ""}${i?.renderKind === "matrix" ? " | matrix fallback" : ""}${i?.meta?.focusActive ? ` | focus ${i.meta.focusDepth} hop` : ""}`), !a.length) {
		r.hidden = !0, t.innerHTML = "", t.setAttribute("viewBox", "0 0 1600 900"), t.style.width = "100%", t.style.height = `${Math.max(520, Number(Wt()?.clientHeight || 680))}px`, k.viewport = null, t.hidden = !1, n.hidden = !1, ba(), ga();
		return;
	}
	if (n.hidden = !0, i.renderKind === "matrix") {
		t.hidden = !0, r.hidden = !1, Za(i), e && !c && k.selectedKind || ba(), ga();
		return;
	}
	r.hidden = !0, r.innerHTML = "", t.hidden = !1, t.innerHTML = "";
	let u = ki(), d = Tn("defs");
	d.appendChild(Tn("marker", {
		id: "graph-arrow",
		markerWidth: 8,
		markerHeight: 8,
		refX: 7,
		refY: 4,
		orient: "auto",
		markerUnits: "strokeWidth"
	}));
	let f = Tn("path", {
		d: "M0,0 L8,4 L0,8 z",
		fill: "rgba(121, 133, 158, 0.65)"
	});
	d.firstChild.appendChild(f), d.appendChild(Tn("marker", {
		id: "graph-arrow-highlight",
		markerWidth: 9,
		markerHeight: 9,
		refX: 8,
		refY: 4.5,
		orient: "auto",
		markerUnits: "strokeWidth"
	}));
	let p = Tn("path", {
		d: "M0,0 L9,4.5 L0,9 z",
		fill: Se
	});
	d.lastChild.appendChild(p), t.appendChild(d), (i.groups || []).forEach((e) => {
		let n = Tn("g", {
			class: "graph-group",
			"data-graph-group-key": e.key || ""
		});
		n.appendChild(Tn("rect", {
			x: e.x,
			y: e.y,
			width: e.width,
			height: e.height,
			rx: 18,
			fill: xn() ? "#131313" : "rgba(19, 19, 19, 0.75)",
			stroke: "rgba(160, 160, 160, 0.16)",
			"data-graph-group-key": e.key || ""
		})), u && n.appendChild(Tn("text", {
			x: e.x + 16,
			y: e.y + 28,
			class: "graph-group-label",
			"data-graph-group-key": e.key || ""
		}, e.label)), t.appendChild(n);
	});
	let m = k.selectedKind === "node" ? String(k.selectedRef || "") : "", h = k.selectedKind === "edge" ? String(k.selectedRef || "") : "";
	[...o].sort((e, t) => {
		let n = String(e?.edge_id || ""), r = String(t?.edge_id || "");
		return (h && n === h ? 2 : m && (String(e?.from_node_id || "") === m || String(e?.to_node_id || "") === m) ? 1 : 0) - (h && r === h ? 2 : m && (String(t?.from_node_id || "") === m || String(t?.to_node_id || "") === m) ? 1 : 0);
	}).forEach((e) => {
		let n = s[String(e?.from_node_id || "")], r = s[String(e?.to_node_id || "")];
		if (!n || !r) return;
		let i = n.x + M.width, a = n.y + M.height / 2, o = r.x, c = r.y + M.height / 2, l = Math.max(36, Math.min(140, Math.abs(o - i) / 2)), u = o >= i ? 1 : -1, d = [
			`M ${i} ${a}`,
			`C ${i + l * u} ${a}`,
			`${o - l * u} ${c}`,
			`${o} ${c}`
		].join(" "), f = String(e?.edge_id || ""), p = h && h === f, g = !(!m || String(e?.from_node_id || "") !== m && String(e?.to_node_id || "") !== m), _ = bn(e), v = Math.max(1, Number(W(e, "aggregate_count") || 1)), y = p ? 4.2 : g ? Math.min(6.8, 2.5 + Math.log2(v + 1)) : Math.min(4.2, 1.05 + Math.log2(v + 1) * .7), b = p ? 1 : g ? .98 : Math.max(.18, Math.min(.34, .16 + Math.log2(v + 1) * .045)), x = p ? "#eef1ff" : g ? Se : Sn(e), S = p || g ? "url(#graph-arrow-highlight)" : "url(#graph-arrow)";
		t.appendChild(Tn("path", {
			d,
			stroke: "transparent",
			fill: "none",
			"stroke-width": 12,
			"data-graph-edge-id": e.edge_id || "",
			class: "graph-edge-hitbox"
		})), t.appendChild(Tn("path", {
			d,
			stroke: x,
			fill: "none",
			"stroke-width": y,
			"stroke-dasharray": _.dash,
			"marker-end": S,
			opacity: b,
			"data-graph-edge-id": e.edge_id || "",
			class: `graph-edge${p ? " is-selected" : ""}${g ? " is-connected-selected" : ""}`
		}));
	}), a.forEach((e) => {
		let n = String(e?.node_id || ""), r = s[n];
		if (!r) return;
		bn(e);
		let i = yn(e), a = k.selectedKind === "node" && String(k.selectedRef || "") === n, o = Ci(e), c = !!W(e, "summary_kind"), l = ji({
			isSelected: a,
			isHostSelected: o,
			isSummaryNode: c
		}), u = Ai({
			isSelected: a,
			isHostSelected: o,
			isSummaryNode: c
		}), d = Tn("g", {
			transform: `translate(${r.x}, ${r.y})`,
			"data-graph-node-id": n,
			class: `graph-node${a ? " is-selected" : ""}${o ? " is-host-selected" : ""}${c ? " is-summary" : ""}`
		});
		if (d.appendChild(Tn("rect", {
			width: M.width,
			height: M.height,
			rx: 14,
			fill: Cn(e),
			stroke: a ? "#eef1ff" : i,
			"stroke-width": a ? 2.8 : 1.8,
			"data-graph-node-id": n
		})), d.appendChild(Tn("rect", {
			x: 10,
			y: 9,
			width: 8,
			height: M.height - 18,
			rx: 4,
			fill: i,
			opacity: .9,
			"data-graph-node-id": n
		})), l && d.appendChild(Tn("text", {
			x: 28,
			y: 18,
			class: "graph-node-type",
			"data-graph-node-id": n
		}, en(e.type || ""))), u) {
			let t = Tn("text", {
				x: 28,
				y: l ? 34 : 30,
				class: "graph-node-label",
				"data-graph-node-id": n
			});
			wn(e.label || n).forEach((e, r) => {
				let i = Tn("tspan", {
					x: 28,
					dy: r === 0 ? 0 : 14,
					"data-graph-node-id": n
				}, e);
				t.appendChild(i);
			}), d.appendChild(t);
		}
		k.pinnedNodeIds[n] && d.appendChild(Tn("circle", {
			cx: M.width - 16,
			cy: 14,
			r: 5,
			fill: "#eef1ff",
			opacity: .9,
			"data-graph-node-id": n
		})), c && d.appendChild(Tn("circle", {
			cx: M.width - 16,
			cy: M.height - 14,
			r: 7,
			fill: i,
			opacity: .95,
			"data-graph-node-id": n
		})), t.appendChild(d);
	}), Oi(i.width, i.height), e && !c && k.selectedKind || ba(), ga();
}
// ../app/web/static/js/workspace/graph_data.js
function $a(e, t) {
	let n = It(e === "node" ? "node" : "edge", t), r = e === "node" ? Si(n) : 0;
	if (r > 0) {
		let e = String(O.selectedHostId || "") !== String(r);
		O.selectedHostId = r, (e || !O.hostDetail) && (O.hostDetail = null, yr(r).catch((e) => {
			B(`Load host detail failed: ${e.message}`, !0);
		}));
	}
	k.selectedKind = String(e || ""), k.selectedRef = String(t || ""), k.selectedPayload = null, k.relatedContent = [], Qa(), Sa().catch(() => {});
}
async function eo({ force: e = !1 } = {}) {
	if (!Bt()) return;
	if (k.metadataLoaded && !e) {
		gn();
		return;
	}
	let [t, n] = await Promise.all([Ze("/api/graph/layouts"), Ze("/api/graph/annotations")]);
	k.layouts = Array.isArray(t?.layouts) ? t.layouts : [], k.annotations = Array.isArray(n?.annotations) ? n.annotations : [], k.metadataLoaded = !0;
	let r = String(R("graph-view-select") || k.viewId || "attack_surface").trim();
	if (!k.activeLayoutId) {
		let e = k.layouts.find((e) => String(e?.view_id || "") === r && String(e?.name || "").trim().toLowerCase() === "default") || k.layouts.find((e) => String(e?.view_id || "") === r);
		k.activeLayoutId = String(e?.layout_id || ""), e?.layout?.positions && typeof e.layout.positions == "object" && (k.positions = { ...e.layout.positions }), e?.layout?.pinned_node_ids && typeof e.layout.pinned_node_ids == "object" && (k.pinnedNodeIds = { ...e.layout.pinned_node_ids });
	}
	gn();
}
async function to({ background: e = !1, forceMetadata: t = !1 } = {}) {
	if (Bt()) {
		if (k.loading) k.needsRefresh = !0;
		else {
			k.loading = !0, e || U("Loading graph...");
			try {
				(!k.metadataLoaded || t) && await eo({ force: t });
				let n = Ya(), r = new URLSearchParams();
				r.set("filter", String(n.hostFilter || "hide_down")), (Array.isArray(n.serviceFilters) ? n.serviceFilters : []).forEach((e) => {
					r.append("service", e);
				}), n.category && r.set("category", n.category), n.hostId > 0 && r.set("host_id", String(n.hostId)), n.nodeType && r.set("node_type", n.nodeType), n.edgeType && r.set("edge_type", n.edgeType), n.sourceKind && r.set("source_kind", n.sourceKind), n.search && r.set("q", n.search), n.minConfidence > 0 && r.set("min_confidence", String(n.minConfidence)), n.hideAiSuggested && r.set("hide_ai_suggested", "true"), n.hideNmapXmlArtifacts && r.set("hide_nmap_xml_artifacts", "true"), r.set("limit_nodes", "8000"), r.set("limit_edges", "24000");
				let i = await Ze(`/api/graph?${r.toString()}`);
				k.data = {
					nodes: Array.isArray(i?.nodes) ? i.nodes : [],
					edges: Array.isArray(i?.edges) ? i.edges : [],
					meta: i?.meta || {}
				}, vn(), gn(), Qa({ preserveDetail: e && !!k.selectedKind }), k.selectedKind !== "node" || !k.selectedRef || e && Array.isArray(k.relatedContent) && k.relatedContent.length || Sa().catch(() => {}), e || U(`Graph loaded: ${k.filtered.nodes.length} nodes, ${k.filtered.edges.length} edges`);
			} catch (e) {
				U(`Graph load failed: ${e.message}`, !0);
			} finally {
				k.loading = !1, k.needsRefresh && (k.needsRefresh = !1, to({ background: !0 }).catch(() => {}));
			}
		}
	}
}
function no(e = 900) {
	Bt() && (k.refreshTimer && window.clearTimeout(k.refreshTimer), k.refreshTimer = window.setTimeout(() => {
		k.refreshTimer = null, to({ background: !0 }).catch(() => {});
	}, Math.max(100, Number(e) || 900)));
}
async function ro() {
	await to({ background: !1 });
}
async function io() {
	let e = parseInt(R("graph-host-filter"), 10);
	U("Rebuilding graph...");
	try {
		let t = await Xe("/api/graph/rebuild", { host_id: Number.isFinite(e) && e > 0 ? e : 0 });
		U(`Graph rebuilt: ${Number(t?.mutation_count || 0)} mutations`), await to({
			background: !1,
			forceMetadata: !0
		});
	} catch (e) {
		U(`Graph rebuild failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/workspace_view.js
function ao({ resetForms: e = !0 } = {}) {
	O.hostDetail = null, F("host-detail-name", ""), I("workspace-note", ""), I("workspace-tool-host-ip", ""), e && (I("workspace-tool-port", ""), I("workspace-tool-protocol", "tcp"), I("workspace-script-id", ""), I("workspace-script-port", ""), I("workspace-script-protocol", "tcp"), I("workspace-script-output", ""), I("workspace-cve-name", ""), I("workspace-cve-severity", "")), F("host-ai-analysis-status", ""), F("host-ai-tech-count", 0), F("host-ai-manual-count", 0);
}
function oo({ clearProjectPaths: e = !1 } = {}) {
	O.hosts = [], O.hostFilter = "hide_down", O.hostServiceFilter = "", O.hostCategoryFilter = "", O.servicesHostFilterId = 0, O.servicesHostFilterLabel = "", O.servicesCategoryFilter = "", O.deviceCategoryRules = [], O.builtInDeviceCategories = [], O.services = [], O.tools = [], O.toolsHydrated = !1, O.toolsLoading = !1, O.selectedHostId = null, O.hostDetail = null, k.data = {
		nodes: [],
		edges: [],
		meta: {}
	}, k.filtered = {
		nodes: [],
		edges: [],
		groups: [],
		positions: {},
		width: 1600,
		height: 900
	}, k.activeLayoutId = "", k.positions = {}, k.pinnedNodeIds = {}, k.selectedKind = "", k.selectedRef = "", k.selectedPayload = null, k.metadataLoaded = !1, k.layouts = [], k.annotations = [], Ct({
		hosts: 0,
		open_ports: 0,
		services: 0,
		cves: 0,
		running_processes: 0,
		finished_processes: 0
	}), Tt([]), lo([]), fo([]), vo([]), lt([]), Et([]), Dt([]), kt([]), ao({ resetForms: !0 }), ht(!0), gt(!0), oi(!0), _n(), gn(), Qa(), e && (I("project-open-path", ""), I("project-save-path", ""));
}
function so(e) {
	let t = document.getElementById("workspace-host-select");
	if (!t) return;
	let n = O.selectedHostId;
	t.innerHTML = "", e.forEach((e) => {
		let n = document.createElement("option");
		n.value = String(e.id), n.textContent = `${e.ip || ""} ${e.hostname ? `(${e.hostname})` : ""}`.trim(), t.appendChild(n);
	}), e.length ? (O.selectedHostId = e.some((e) => String(e.id) === String(n)) ? n : e[0].id, t.value = String(O.selectedHostId)) : (O.selectedHostId = null, ao({ resetForms: !0 }));
}
async function co(e, { loadDetail: t = !0, syncGraph: n = !0, preserveGraphDetail: r = !0 } = {}) {
	let i = parseInt(e, 10);
	if (!Number.isFinite(i) || i <= 0) {
		O.selectedHostId = null, O.hostDetail = null;
		let e = On(0);
		ao({ resetForms: !0 }), e && await _r();
		return;
	}
	let a = String(O.selectedHostId || "") !== String(i);
	O.selectedHostId = i;
	let o = On(i), s = [];
	o && (Xn(), lo(O.hosts), s.push(_r())), t && (a || !O.hostDetail) && (O.hostDetail = null, s.push(yr(i)));
	try {
		await Promise.all(s);
	} catch (e) {
		B(`Load host detail failed: ${e.message}`, !0);
	}
}
function lo(e) {
	O.hosts = Array.isArray(e) ? e : [];
	let t = document.getElementById("hosts-body");
	t && (t.innerHTML = "", O.hosts.forEach((e) => {
		let n = document.createElement("tr");
		n.dataset.hostId = String(e.id || "");
		let r = document.createElement("td");
		r.className = "host-filter-cell";
		let i = document.createElement("button");
		i.type = "button", i.className = "icon-btn";
		let a = String(e.hostname || e.ip || `host ${e.id || ""}`).trim(), o = parseInt(O.servicesHostFilterId, 10) === parseInt(e.id, 10), s = o ? `Clear services filter for ${a}` : `Show services for ${a}`;
		i.title = s, i.setAttribute("aria-label", s), i.innerHTML = "<i class=\"fa-solid fa-filter\" aria-hidden=\"true\"></i>", i.classList.toggle("is-active", o), i.addEventListener("click", async (t) => {
			t.stopPropagation(), await nr(e.id || 0, a);
		}), r.appendChild(i), n.appendChild(r);
		let c = document.createElement("td"), l = document.createElement("span"), u = document.createElement("i"), d = _o(e.os || "");
		u.className = `${d.className} host-os-icon`, u.setAttribute("aria-hidden", "true");
		let f = String(e.raw_os || "").trim(), p = String(e.os || "").trim();
		u.title = f && p && f !== p ? `${d.label}; imported OS: ${f}` : d.label, l.className = "host-ip-with-icon", l.appendChild(u), l.appendChild(document.createTextNode(e.ip || "")), c.appendChild(l), n.appendChild(c), n.appendChild(Re(e.hostname)), n.appendChild(Re(e.status));
		let m = Re(e.os);
		f && p && f !== p && (m.title = `Resolved from stronger service evidence. Imported OS: ${f}`), n.appendChild(m), n.appendChild(Hn(e.categories || [])), n.appendChild(Re(e.open_ports));
		let h = document.createElement("td");
		h.className = "host-actions";
		let g = Pi(`Run supported tool for ${a}`);
		g.addEventListener("click", async (t) => {
			t.stopPropagation(), await oa({
				hostId: Number(e.id) || 0,
				contextLabel: `Supported tools for ${a}`
			});
		}), h.appendChild(g), n.appendChild(h), t.appendChild(n);
	}), F("host-count", O.hosts.length), so(O.hosts), Wn(), Kn(), _n());
}
function uo(e, t) {
	let n = Rn(t);
	if (!n.length) return !0;
	let r = new Set(n.map((e) => e.toLowerCase()));
	return Array.isArray(e?.services) && e.services.some((e) => r.has(String(e || "").trim().toLowerCase()));
}
function fo(e) {
	O.services = Array.isArray(e) ? e : [];
	let t = document.getElementById("services-body");
	if (!t) return;
	t.innerHTML = "", O.services.forEach((e) => {
		let n = document.createElement("tr"), r = document.createElement("td"), i = document.createElement("button");
		i.type = "button", i.className = "icon-btn", i.title = `Show hosts for ${e.service || "service"}`, i.setAttribute("aria-label", `Show hosts for ${e.service || "service"}`), i.innerHTML = "<i class=\"fa-solid fa-filter\" aria-hidden=\"true\"></i>", zn().map((e) => e.toLowerCase()).includes(String(e.service || "").trim().toLowerCase()) && i.classList.add("is-active"), i.addEventListener("click", async () => {
			await $n(e.service || "");
		}), r.className = "service-filter-cell", r.appendChild(i), n.appendChild(r), n.appendChild(Re(e.service || "")), n.appendChild(Re(Array.isArray(e.ports) ? e.ports.join(", ") : "")), n.appendChild(Re(e.host_count || 0)), n.appendChild(Re(e.port_count || 0)), n.appendChild(Re(Array.isArray(e.protocols) ? e.protocols.join(",") : "")), n.appendChild(Hn(e.categories || []));
		let a = document.createElement("td"), o = Pi(`Run supported tool for ${e.service || "service"}`);
		o.addEventListener("click", async () => {
			await oa({
				hostId: Number(O.servicesHostFilterId) || 0,
				service: String(e.service || "").trim(),
				contextLabel: O.servicesHostFilterId ? `Supported tools for ${e.service || "service"} on ${O.servicesHostFilterLabel || "selected host"}` : `Supported tools for ${e.service || "service"}`
			});
		}), a.appendChild(o), n.appendChild(a), t.appendChild(n);
	}), F("service-count", O.services.length);
	let n = document.getElementById("services-scope-label");
	if (n) {
		let e = String(O.servicesHostFilterLabel || "").trim();
		n.textContent = e ? `for ${e}` : "all hosts", n.hidden = !1;
	}
	Kn();
}
function po(e) {
	let t = document.getElementById("services-panel-body"), n = document.getElementById("services-panel-toggle-button");
	if (!t || !n) return;
	let r = !!e;
	t.hidden = r, n.classList.toggle("is-collapsed", r), n.setAttribute("aria-expanded", r ? "false" : "true"), n.title = r ? "Show Services" : "Hide Services", n.setAttribute("aria-label", r ? "Show Services" : "Hide Services");
}
function mo() {
	let e = document.getElementById("services-panel-body");
	e && po(!e.hidden);
}
function ho(e) {
	let t = document.getElementById("graph-panel-body"), n = document.getElementById("graph-panel-toggle-button");
	if (!t || !n) return;
	let r = !!e;
	t.hidden = r, n.classList.toggle("is-collapsed", r), n.setAttribute("aria-expanded", r ? "false" : "true"), n.title = r ? "Show Graph Workspace" : "Hide Graph Workspace", n.setAttribute("aria-label", r ? "Show Graph Workspace" : "Hide Graph Workspace");
}
function go() {
	let e = document.getElementById("graph-panel-body");
	e && ho(!e.hidden);
}
function _o(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("windows") || t.includes("microsoft") ? {
		className: "fa-brands fa-windows",
		label: "Windows"
	} : t.includes("linux") || t.includes("ubuntu") || t.includes("debian") || t.includes("centos") ? {
		className: "fa-brands fa-linux",
		label: "Linux"
	} : t.includes("darwin") || t.includes("mac os") || t.includes("osx") || t.includes("macos") ? {
		className: "fa-brands fa-apple",
		label: "macOS"
	} : t.includes("solaris") || t.includes("sunos") ? {
		className: "fa-solid fa-sun",
		label: "Solaris"
	} : t.includes("freebsd") || t.includes("openbsd") || t.includes("netbsd") || t.includes("unix") ? {
		className: "fa-solid fa-terminal",
		label: "Unix"
	} : t.includes("cisco") ? {
		className: "fa-solid fa-network-wired",
		label: "Network device"
	} : {
		className: "fa-solid fa-computer",
		label: "Unknown OS"
	};
}
function vo(e) {
	O.tools = Array.isArray(e) ? e : [];
	let t = document.getElementById("tools-body");
	t && (t.innerHTML = "", O.tools.forEach((e) => {
		let n = document.createElement("tr");
		n.dataset.toolId = String(e.tool_id || ""), n.appendChild(Re(e.label || "")), n.appendChild(Re(e.tool_id || "")), n.appendChild(Re(e.run_count || 0)), n.appendChild(Re(e.last_status || "")), n.appendChild(Re(Array.isArray(e.danger_categories) ? e.danger_categories.join(",") : "")), t.appendChild(n);
	})), O.manualToolTargets.length || K(O.tools), F("tool-count", O.tools.length);
}
// ../app/web/static/js/workspace/live_updates.js
function yo(e) {
	if (e) {
		if (e.project && Be(e.project), e.summary && Ct(e.summary), Xn(), Array.isArray(e.hosts)) {
			let t = String(O.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down", n = zn();
			t !== "show_all" && lo(n.length ? e.hosts.filter((e) => uo(e, n)) : e.hosts);
		}
		if (Array.isArray(e.services) && (parseInt(O.servicesHostFilterId, 10) > 0 || fo(e.services)), Array.isArray(e.tools) && !O.toolsHydrated && vo(e.tools), e.tools_meta && typeof e.tools_meta == "object") {
			let t = Number(e.tools_meta.total || 0);
			Number.isFinite(t) && t >= 0 && (F("tool-count", t), O.toolsHydrated && !O.toolsLoading && t !== O.tools.length && vr().catch(() => {}));
		}
		if (Array.isArray(e.processes) && lt(e.processes), e.credential_capture && e.credential_capture, e.scheduler) {
			let t = e.scheduler.engagement_policy || {};
			F("scheduler-mode", e.scheduler.mode || ""), F("scheduler-goal", t.preset_label || t.preset || e.scheduler.goal_profile || ""), F("scheduler-families", e.scheduler.preapproved_families_count || 0);
		}
		Array.isArray(e.scheduler_rationale_feed) && Tt(e.scheduler_rationale_feed), Array.isArray(e.scheduler_decisions) && Et(e.scheduler_decisions), Array.isArray(e.scheduler_approvals) && Dt(e.scheduler_approvals), Array.isArray(e.jobs) && kt(e.jobs), Array.isArray(e.scan_history) && Ot(e.scan_history), O.selectedHostId && !O.hostDetail && yr(O.selectedHostId).catch(() => {}), no();
	}
}
function bo(e) {
	return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${e}`;
}
function xo(e, t) {
	let n = document.getElementById("live-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
async function So(e) {
	let t = new Set((e || []).map((e) => String(e || "").trim()).filter(Boolean));
	if (!t.size) return;
	let n = [], r = t.has("hosts"), i = t.has("services"), a = O.selectedHostId && (r || i || t.has("graph"));
	t.has("overview") && n.push(At()), r ? (n.push(gr()), parseInt(O.servicesHostFilterId, 10) > 0 && !i && n.push(_r())) : i && n.push(_r()), t.has("processes") && n.push(jt()), t.has("jobs") && n.push(Pt()), t.has("approvals") && n.push(Ft()), t.has("decisions") && n.push(Mt()), t.has("scan_history") && n.push(Nt()), t.has("tools") && O.toolsHydrated && n.push(vr({ force: !0 })), t.has("graph") && n.push(to({ background: !0 })), a && n.push(yr(O.selectedHostId)), n.length && await Promise.all(n.map((e) => Promise.resolve(e).catch(() => {})));
}
function Co(e) {
	(e || []).forEach((e) => {
		let t = String(e || "").trim();
		t && ye.pendingChannels.add(t);
	}), ye.timer || ye.running || (ye.timer = window.setTimeout(async () => {
		if (ye.timer = null, !ye.running) {
			ye.running = !0;
			try {
				for (; ye.pendingChannels.size;) {
					let e = Array.from(ye.pendingChannels);
					ye.pendingChannels.clear(), await So(e);
				}
			} finally {
				ye.running = !1;
			}
		}
	}, 60));
}
function wo() {
	let e = new WebSocket(bo("/ws/snapshot"));
	e.onopen = () => xo("Live", !1), e.onmessage = (e) => {
		try {
			let t = JSON.parse(e.data);
			if (t && t.type === "invalidate") {
				or(t.channels || []), Co(t.channels || []);
				return;
			}
			if (t && t.type === "heartbeat") return;
			yo(t);
		} catch {
			xo("Decode Error", !0);
		}
	}, e.onerror = () => xo("Socket Error", !0), e.onclose = () => {
		xo("Reconnecting", !0), window.setTimeout(wo, 1500);
	};
}
async function q() {
	try {
		let e = await fetch("/api/snapshot", { cache: "no-store" });
		if (!e.ok) {
			xo("Polling Error", !0);
			return;
		}
		yo(await e.json());
	} catch {
		xo("Polling Error", !0);
	}
}
// src/api/activity.ts
function To({ data: e, error: t, response: n }) {
	if (!e) throw fe(t, n.status);
	return e;
}
async function Eo() {
	return To(await D.GET("/api/workspace/overview"));
}
async function Do() {
	return To(await D.GET("/api/processes", { params: { query: { limit: 100 } } })).processes;
}
async function Oo() {
	return To(await D.GET("/api/scheduler/decisions", { params: { query: { limit: 80 } } })).decisions;
}
async function ko() {
	return To(await D.GET("/api/scans/history", { params: { query: { limit: 100 } } })).scans;
}
async function Ao() {
	return To(await D.GET("/api/scheduler/approvals", { params: { query: {
		limit: 200,
		status: "pending"
	} } })).approvals;
}
async function jo(e, t) {
	return To(await D.GET("/api/processes/{process_id}/output", { params: {
		path: { process_id: e },
		query: {
			offset: t,
			max_chars: 24e3
		}
	} }));
}
async function Mo(e, t) {
	let n = { path: { process_id: t } };
	return To(e === "kill" ? await D.POST("/api/processes/{process_id}/kill", { params: n }) : e === "close" ? await D.POST("/api/processes/{process_id}/close", { params: n }) : await D.POST("/api/processes/{process_id}/retry", {
		params: n,
		body: {}
	}));
}
async function No(e) {
	return To(await D.POST("/api/processes/clear", { body: { reset_all: e } }));
}
async function Po(e, t = "") {
	return To(await D.POST("/api/scheduler/approvals/{approval_id}/approve", {
		params: { path: { approval_id: e } },
		body: {
			approve_family: t === "allowed",
			run_now: !0,
			family_action: t
		}
	}));
}
async function Fo(e, t = "") {
	return To(await D.POST("/api/scheduler/approvals/{approval_id}/reject", {
		params: { path: { approval_id: e } },
		body: {
			reason: "rejected in web workspace",
			family_action: t
		}
	}));
}
// src/activity/state.ts
function J(e) {
	let t = g({
		items: [],
		loading: !1,
		error: ""
	}), n = 0;
	function r(r) {
		if (!Array.isArray(r) || !r.every(e)) throw Error("Invalid activity response.");
		n++, t.set({
			items: r,
			loading: !1,
			error: ""
		});
	}
	return {
		...t,
		update: r,
		reset() {
			n++, t.set({
				items: [],
				loading: !1,
				error: ""
			});
		},
		error(e) {
			t.set({
				...t.getSnapshot(),
				loading: !1,
				error: e
			});
		},
		async load(e) {
			let i = ++n;
			t.set({
				...t.getSnapshot(),
				loading: !0,
				error: ""
			});
			try {
				let t = await e();
				i === n && r(t);
			} catch (e) {
				i === n && t.set({
					...t.getSnapshot(),
					loading: !1,
					error: String(e instanceof Error ? e.message : e)
				});
			}
		}
	};
}
var Io = (e) => !!e && typeof e == "object", Lo = (e) => Io(e) && Number.isInteger(e.id), Ro = J(Lo), zo = J(Lo), Bo = J(Lo), Vo = J(Lo), Ho = J(Io), Uo = {
	processes: Ro,
	approvals: zo,
	decisions: Bo,
	scans: Vo,
	rationale: Ho
}, Wo = g(/* @__PURE__ */ new Set());
function Go(e, t) {
	Uo[e].update(t);
}
// src/activity/output.ts
var Ko = () => ({
	id: 0,
	text: "",
	command: "",
	progress: "",
	meta: "No process selected",
	loading: !1,
	error: "",
	offset: 0,
	complete: !0
}), qo = class {
	setOpen;
	store = g(Ko());
	generation = 0;
	timer;
	constructor(e) {
		this.setOpen = e;
	}
	async open(e) {
		this.close(), this.store.set({
			...Ko(),
			id: e,
			complete: !1,
			meta: `Process ${e} | loading...`
		}), this.setOpen(!0), await this.refresh();
	}
	close() {
		this.generation++, clearTimeout(this.timer), this.store.set(Ko()), this.setOpen(!1);
	}
	async refresh() {
		let e = this.store.getSnapshot();
		if (!e.id || e.loading) return;
		clearTimeout(this.timer);
		let t = this.generation;
		this.store.set({
			...e,
			loading: !0,
			error: ""
		});
		try {
			let n = await jo(e.id, e.offset);
			if (t !== this.generation) return;
			let r = n.progress, i = [r?.source, r?.updated_at && `updated ${r.updated_at}`].filter(Boolean).join(" | ");
			this.store.set({
				...e,
				text: e.text + n.output_chunk,
				command: n.command || "",
				progress: [r?.summary, i].filter(Boolean).join("\n"),
				meta: `Process ${n.id} | ${n.status || ""} | bytes ${n.next_offset}/${n.output_length}`,
				offset: n.next_offset,
				complete: n.completed && n.next_offset >= n.output_length,
				loading: !1,
				error: ""
			});
		} catch (n) {
			if (t !== this.generation) return;
			this.store.set({
				...e,
				loading: !1,
				error: `Failed to load process output: ${n instanceof Error ? n.message : n}`
			});
		}
		t === this.generation && !this.store.getSnapshot().complete && (this.timer = setTimeout(() => {
			this.refresh();
		}, 1200));
	}
}, Jo = class {
	shell;
	output;
	actions;
	epoch = 0;
	overviewRequest = 0;
	pending = /* @__PURE__ */ new Map();
	unsubscribe;
	constructor(e) {
		this.shell = e, this.output = new qo(e.setOutputOpen);
		let t = _.getSnapshot().name;
		this.unsubscribe = _.subscribe(() => {
			let e = _.getSnapshot().name;
			t !== e && (t = e, this.epoch++, this.overviewRequest++, Object.values(Uo).forEach((e) => e.reset()), this.pending.clear(), Wo.set(/* @__PURE__ */ new Set()), this.output.close());
		}), this.actions = {
			loadOverview: () => this.loadOverview(),
			loadProcesses: () => Ro.load(Do),
			loadApprovals: () => zo.load(Ao),
			loadDecisions: () => Bo.load(Oo),
			loadScans: () => Vo.load(ko),
			approve: (e, t = "") => this.approvalAction(e, !1, t),
			reject: (e, t = "") => this.approvalAction(e, !0, t),
			openOutput: (e) => this.output.open(e),
			closeOutput: async () => this.output.close()
		};
	}
	dispose() {
		this.unsubscribe(), this.epoch++, this.overviewRequest++, this.output.close();
	}
	async loadOverview() {
		let e = ++this.overviewRequest;
		try {
			let t = await Eo();
			e === this.overviewRequest && this.shell.applyOverview(t);
		} catch (t) {
			e === this.overviewRequest && Uo.rationale.error(`Failed to load workspace overview: ${t instanceof Error ? t.message : t}`);
		}
	}
	async mutate(e, t, n, r) {
		if (this.pending.has(e)) return;
		let i = Symbol(e), a = this.epoch;
		this.pending.set(e, i), Wo.set(new Set(this.pending.keys())), t.error("");
		try {
			let e = await n();
			if (a !== this.epoch) return;
			this.shell.status(e), await Promise.all([r(), this.shell.refreshSnapshot()]);
		} catch (e) {
			if (a !== this.epoch) return;
			let n = `Action failed: ${e instanceof Error ? e.message : e}`;
			t.error(n), this.shell.status(n, !0);
		} finally {
			this.pending.get(e) === i && (this.pending.delete(e), Wo.set(new Set(this.pending.keys())));
		}
	}
	async approvalAction(e, t, n = "") {
		await this.mutate(`approval:${e}`, zo, async () => (t ? await Fo(e, n === "suppressed" ? n : "") : await Po(e, n === "allowed" ? n : ""), `Approval ${e} ${t ? "rejected" : "accepted"}${n ? ` and family ${n}` : ""}`), this.actions.loadApprovals);
	}
	async processAction(e, t) {
		await this.mutate(`process:${t}`, Ro, async () => (await Mo(e, t), `Process ${t}: ${e === "close" ? "hidden" : e === "retry" ? "retry queued" : "kill requested"}`), async () => {
			await this.actions.loadProcesses(), this.output.store.getSnapshot().id === t && await this.output.refresh();
		});
	}
	async clearProcesses(e) {
		await this.mutate("process:clear", Ro, async () => (await No(e), e ? "Hidden all non-running processes" : "Hidden finished/issues processes"), this.actions.loadProcesses);
	}
};
// src/activity/shared.tsx
function Yo({ id: e, label: t, icon: n, disabled: r, danger: i, className: a = "icon-btn", onClick: o }) {
	return /* @__PURE__ */ (0, V.jsx)("button", {
		id: e,
		type: "button",
		className: `${a}${i ? " icon-btn-danger" : ""}`,
		title: t,
		"aria-label": t,
		disabled: r,
		onClick: o,
		children: /* @__PURE__ */ (0, V.jsx)("i", {
			className: n,
			"aria-hidden": "true"
		})
	});
}
function Xo({ error: e, loading: t, empty: n, columns: r }) {
	let i = e || (t ? "Loading..." : n ? "No entries yet." : "");
	return i ? /* @__PURE__ */ (0, V.jsx)("tr", {
		role: e ? "alert" : "status",
		children: /* @__PURE__ */ (0, V.jsx)("td", {
			colSpan: r,
			children: i
		})
	}) : null;
}
function Zo({ id: e, text: t }) {
	let n = (0, C.useRef)(null), r = (0, C.useRef)(!0);
	return (0, C.useLayoutEffect)(() => {
		r.current && n.current && (n.current.scrollTop = n.current.scrollHeight);
	}, [t]), /* @__PURE__ */ (0, V.jsx)("div", {
		ref: n,
		id: e,
		className: "ansi-output-view",
		role: "textbox",
		"aria-readonly": "true",
		onScroll: () => {
			let e = n.current;
			e && (r.current = e.scrollHeight - e.scrollTop - e.clientHeight < 24);
		},
		dangerouslySetInnerHTML: { __html: tt(t) }
	});
}
// src/activity/ProcessesTable.tsx
function Qo({ controller: e }) {
	let t = (0, C.useSyncExternalStore)(Ro.subscribe, Ro.getSnapshot), n = (0, C.useSyncExternalStore)(Wo.subscribe, Wo.getSnapshot);
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)(Xo, {
		...t,
		empty: !t.items.length,
		columns: 7
	}), t.items.map((t) => {
		let r = st(t.status), i = n.has(`process:${t.id}`) || n.has("process:clear"), a = rt(t.hostIp, t.port, t.protocol), o = Number(String(t.percent ?? "").replace("%", "").trim()), s = t.percent == null || t.percent === "" ? "" : Number.isFinite(o) ? `${o.toFixed(1)}%` : t.percent;
		return /* @__PURE__ */ (0, V.jsxs)("tr", {
			"data-process-id": t.id,
			children: [
				/* @__PURE__ */ (0, V.jsx)("td", { children: t.id }),
				/* @__PURE__ */ (0, V.jsx)("td", {
					className: "process-name-cell",
					title: t.name || "",
					children: /* @__PURE__ */ (0, V.jsx)("span", {
						className: "cell-truncate",
						children: t.name
					})
				}),
				/* @__PURE__ */ (0, V.jsx)("td", {
					className: "process-target-cell",
					title: a,
					children: /* @__PURE__ */ (0, V.jsx)("span", {
						className: "cell-truncate",
						children: a
					})
				}),
				/* @__PURE__ */ (0, V.jsx)("td", {
					className: "process-status-cell",
					children: /* @__PURE__ */ (0, V.jsxs)("span", {
						className: `process-status ${ct(t.status)}`,
						children: [r && /* @__PURE__ */ (0, V.jsx)("span", {
							className: "process-spinner",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, V.jsx)("span", { children: t.status })]
					})
				}),
				/* @__PURE__ */ (0, V.jsx)("td", {
					className: "process-percent-cell",
					children: s
				}),
				/* @__PURE__ */ (0, V.jsx)("td", {
					className: "process-eta-cell",
					children: ot(t.estimatedRemaining)
				}),
				/* @__PURE__ */ (0, V.jsxs)("td", {
					className: "process-actions",
					children: [/* @__PURE__ */ (0, V.jsx)("button", {
						type: "button",
						className: "icon-btn",
						"aria-label": "Output",
						title: "Output",
						"data-process-action": "output",
						"data-process-id": t.id,
						onClick: () => {
							e.actions.openOutput(t.id);
						},
						children: /* @__PURE__ */ (0, V.jsx)("i", {
							className: "fa-solid fa-terminal",
							"aria-hidden": "true"
						})
					}), [
						"retry",
						...r ? ["kill"] : [],
						"close"
					].map((n) => /* @__PURE__ */ (0, V.jsx)("button", {
						type: "button",
						className: `icon-btn${n === "kill" ? " icon-btn-danger" : ""}`,
						"data-process-action": n,
						"data-process-id": t.id,
						title: n === "close" ? "Hide" : n === "kill" ? "Kill" : "Retry",
						"aria-label": n === "close" ? "Hide" : n === "kill" ? "Kill" : "Retry",
						disabled: i,
						onClick: () => {
							e.processAction(n, t.id);
						},
						children: /* @__PURE__ */ (0, V.jsx)("i", {
							className: `fa-solid ${n === "close" ? "fa-eye-slash" : n === "kill" ? "fa-stop" : "fa-rotate-right"}`,
							"aria-hidden": "true"
						})
					}, n))]
				})
			]
		}, t.id);
	})] });
}
function $o({ controller: e }) {
	let t = [...(0, C.useSyncExternalStore)(Wo.subscribe, Wo.getSnapshot)].some((e) => e.startsWith("process:"));
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)(Yo, {
		id: "process-clear-finished-button",
		label: "Hide Finished/Issues",
		icon: "fa-solid fa-broom",
		disabled: t,
		onClick: () => {
			e.clearProcesses(!1);
		}
	}), /* @__PURE__ */ (0, V.jsx)(Yo, {
		id: "process-clear-all-button",
		label: "Hide All Non-Running",
		icon: "fa-solid fa-eye-slash",
		disabled: t,
		onClick: () => {
			e.clearProcesses(!0);
		}
	})] });
}
// src/activity/ApprovalsTable.tsx
function es({ label: e, value: t }) {
	return t?.trim() ? /* @__PURE__ */ (0, V.jsxs)("div", { children: [
		e,
		": ",
		t
	] }) : null;
}
function ts({ controller: e }) {
	let t = (0, C.useSyncExternalStore)(zo.subscribe, zo.getSnapshot), n = (0, C.useSyncExternalStore)(Wo.subscribe, Wo.getSnapshot);
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)(Xo, {
		...t,
		empty: !t.items.length,
		columns: 6
	}), t.items.map((t) => /* @__PURE__ */ (0, V.jsxs)("tr", {
		"data-approval-id": t.id,
		children: [
			/* @__PURE__ */ (0, V.jsx)("td", { children: t.id }),
			/* @__PURE__ */ (0, V.jsx)("td", { children: rt(t.host_ip, t.port, t.protocol) }),
			/* @__PURE__ */ (0, V.jsxs)("td", { children: [
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "tool",
					value: t.label || t.tool_id
				}),
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "id",
					value: t.tool_id
				}),
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "command",
					value: t.command_template
				}),
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "status",
					value: t.status
				})
			] }),
			/* @__PURE__ */ (0, V.jsxs)("td", { children: [
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "risk tags",
					value: t.risk_tags || t.danger_categories
				}),
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "decision",
					value: t.policy_decision
				}),
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "why risky",
					value: t.risk_summary
				}),
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "policy",
					value: t.policy_reason
				}),
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "safer alternative",
					value: t.safer_alternative
				}),
				/* @__PURE__ */ (0, V.jsx)(es, {
					label: "family policy",
					value: t.family_policy_state
				})
			] }),
			/* @__PURE__ */ (0, V.jsxs)("td", { children: [/* @__PURE__ */ (0, V.jsx)(es, {
				label: "planner rationale",
				value: t.rationale
			}), /* @__PURE__ */ (0, V.jsx)(es, {
				label: "evidence",
				value: t.evidence_refs
			})] }),
			/* @__PURE__ */ (0, V.jsx)("td", {
				className: "approval-action-buttons",
				children: [
					"approve",
					"reject",
					"allow-family",
					"suppress-family"
				].map((r) => /* @__PURE__ */ (0, V.jsx)("button", {
					type: "button",
					"data-action": r,
					"data-approval-id": t.id,
					disabled: n.has(`approval:${t.id}`),
					onClick: () => {
						e.approvalAction(t.id, r === "reject" || r === "suppress-family", r === "allow-family" ? "allowed" : r === "suppress-family" ? "suppressed" : "");
					},
					children: r === "approve" ? "Approve+Run" : r === "reject" ? "Reject" : r === "allow-family" ? "Allow Family" : "Suppress Family"
				}, r))
			})
		]
	}, t.id))] });
}
// src/activity/HistoryTables.tsx
function ns() {
	let e = (0, C.useSyncExternalStore)(Bo.subscribe, Bo.getSnapshot);
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)(Xo, {
		...e,
		empty: !e.items.length,
		columns: 8
	}), e.items.map((e) => /* @__PURE__ */ (0, V.jsxs)("tr", { children: [
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.timestamp }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: rt(e.host_ip, e.port, e.protocol) }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.tool_id || e.label }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.scheduler_mode }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: String(e.approved ?? "") }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: String(e.executed ?? "") }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.reason }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.command_family_id })
	] }, e.id))] });
}
function rs() {
	let e = (0, C.useSyncExternalStore)(Vo.subscribe, Vo.getSnapshot);
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)(Xo, {
		...e,
		empty: !e.items.length,
		columns: 8
	}), e.items.map((e) => /* @__PURE__ */ (0, V.jsxs)("tr", { children: [
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.id }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.submission_kind }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.status }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.target_summary }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.scope_summary }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.scan_mode }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.created_at }),
		/* @__PURE__ */ (0, V.jsx)("td", { children: e.result_summary })
	] }, e.id))] });
}
function is(e) {
	if (!e) return "";
	let t = Date.parse(e);
	return Number.isFinite(t) ? new Date(t).toLocaleString([], {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	}) : e;
}
function as() {
	let e = (0, C.useSyncExternalStore)(Ho.subscribe, Ho.getSnapshot);
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
		e.error && /* @__PURE__ */ (0, V.jsx)("p", {
			role: "alert",
			children: e.error
		}),
		!e.items.length && /* @__PURE__ */ (0, V.jsx)("p", {
			className: "meta-note rationale-empty",
			children: e.loading ? "Loading..." : "Scheduler rationale will appear here as tools are ranked, suppressed, and executed."
		}),
		e.items.map((e, t) => /* @__PURE__ */ (0, V.jsxs)("article", {
			className: "rationale-entry",
			children: [
				/* @__PURE__ */ (0, V.jsxs)("div", {
					className: "rationale-entry-top",
					children: [/* @__PURE__ */ (0, V.jsxs)("div", {
						className: "rationale-entry-heading",
						children: [/* @__PURE__ */ (0, V.jsx)("p", {
							className: "rationale-entry-prefix",
							children: rt(e.host_ip || "Project-wide", e.port, e.protocol)
						}), /* @__PURE__ */ (0, V.jsx)("strong", {
							className: "rationale-entry-title",
							children: e.headline || e.kind || "Decision"
						})]
					}), /* @__PURE__ */ (0, V.jsx)("span", {
						className: "rationale-entry-time",
						children: is(e.timestamp)
					})]
				}),
				!!e.tags?.length && /* @__PURE__ */ (0, V.jsx)("div", {
					className: "rationale-entry-tags",
					children: e.tags.filter(Boolean).map((e, t) => /* @__PURE__ */ (0, V.jsx)("span", {
						className: "chip rationale-chip",
						children: e
					}, t))
				}),
				/* @__PURE__ */ (0, V.jsx)("p", {
					className: "rationale-entry-summary",
					children: e.summary || "Scheduler decision recorded."
				}),
				!!e.details?.length && /* @__PURE__ */ (0, V.jsx)("div", {
					className: "rationale-entry-details",
					children: e.details.filter(Boolean).map((e, t) => /* @__PURE__ */ (0, V.jsx)("div", {
						className: "rationale-entry-line",
						children: e
					}, t))
				})
			]
		}, `${e.timestamp}:${t}`))
	] });
}
// src/activity/OutputPanels.tsx
function os(e, t) {
	if (!e) {
		B("No output to download", !0);
		return;
	}
	let n = URL.createObjectURL(new Blob([e], { type: "text/plain;charset=utf-8" })), r = document.createElement("a");
	r.href = n, r.download = t, document.body.appendChild(r), r.click(), r.remove(), URL.revokeObjectURL(n), B(`${t} downloaded`);
}
function ss({ controller: e }) {
	let t = (0, C.useSyncExternalStore)(e.output.store.subscribe, e.output.store.getSnapshot);
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
		/* @__PURE__ */ (0, V.jsxs)("div", {
			className: "panel-header modal-header",
			children: [
				/* @__PURE__ */ (0, V.jsx)("h2", {
					id: "process-output-modal-title",
					children: "Process Output"
				}),
				/* @__PURE__ */ (0, V.jsx)("p", {
					id: "process-output-meta",
					children: t.meta
				}),
				/* @__PURE__ */ (0, V.jsx)(Yo, {
					id: "process-output-modal-close",
					className: "modal-close-btn",
					label: "Close dialog",
					icon: "fa-solid fa-xmark",
					onClick: () => e.output.close()
				})
			]
		}),
		/* @__PURE__ */ (0, V.jsxs)("div", {
			className: "modal-actions modal-toolbar-actions",
			children: [
				/* @__PURE__ */ (0, V.jsx)(Yo, {
					id: "process-output-refresh-button",
					label: "Refresh",
					icon: "fa-solid fa-rotate-right",
					disabled: t.loading || !t.id,
					onClick: () => {
						e.output.refresh();
					}
				}),
				/* @__PURE__ */ (0, V.jsx)(Yo, {
					id: "process-output-copy-button",
					label: "Copy to Clipboard",
					icon: "fa-regular fa-copy",
					onClick: () => {
						xt(t.text, "Process output copied to clipboard", "No process output to copy");
					}
				}),
				/* @__PURE__ */ (0, V.jsx)(Yo, {
					id: "process-output-download-button",
					label: "Download .txt",
					icon: "fa-solid fa-download",
					onClick: () => os(t.text, `process-${t.id}-output.txt`)
				})
			]
		}),
		t.error && /* @__PURE__ */ (0, V.jsx)("p", {
			role: "alert",
			children: t.error
		}),
		/* @__PURE__ */ (0, V.jsxs)("div", {
			className: "process-command-block",
			children: [/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "process-command-header",
				children: [/* @__PURE__ */ (0, V.jsx)("span", { children: "Command" }), /* @__PURE__ */ (0, V.jsx)(Yo, {
					id: "process-output-command-copy",
					label: "Copy command",
					icon: "fa-regular fa-copy",
					onClick: () => {
						xt(t.command, "Command copied to clipboard", "No command to copy");
					}
				})]
			}), /* @__PURE__ */ (0, V.jsx)("div", {
				id: "process-output-command",
				className: "process-command-text",
				children: t.command
			})]
		}),
		/* @__PURE__ */ (0, V.jsxs)("div", {
			className: "process-command-block",
			children: [/* @__PURE__ */ (0, V.jsx)("div", {
				className: "process-command-header",
				children: /* @__PURE__ */ (0, V.jsx)("span", { children: "Progress" })
			}), /* @__PURE__ */ (0, V.jsx)("div", {
				id: "process-output-progress",
				className: "process-command-text",
				children: t.progress || "No structured progress reported"
			})]
		}),
		/* @__PURE__ */ (0, V.jsxs)("div", {
			className: "process-command-block process-output-block",
			children: [/* @__PURE__ */ (0, V.jsx)("div", {
				className: "process-command-header",
				children: /* @__PURE__ */ (0, V.jsx)("span", { children: "Output" })
			}), /* @__PURE__ */ (0, V.jsx)(Zo, {
				id: "process-output-text",
				text: t.text
			})]
		})
	] });
}
// src/activity/PanelCount.tsx
function cs({ name: e }) {
	let t = Uo[e], n = (0, C.useSyncExternalStore)(t.subscribe, () => t.getSnapshot().items.length), r = {
		processes: "process-count",
		approvals: "approval-count",
		decisions: "decision-count",
		scans: "scan-history-count",
		rationale: "decision-rationale-count"
	}[e], i = document.getElementById(r);
	return i ? (0, w.createPortal)(String(n), i) : null;
}
// src/activity/mount.tsx
function ls() {
	let e = new Jo({
		applyOverview: wt,
		refreshSnapshot: q,
		setOutputOpen: pt,
		status: B
	}), t = (e) => {
		let t = document.querySelector(e);
		if (!t) throw Error(`Activity mount point missing: ${e}`);
		return t.replaceChildren(), t.dataset.framework = "react", t;
	}, n = [
		{
			node: t("#processes-body"),
			content: /* @__PURE__ */ (0, V.jsx)(Qo, { controller: e })
		},
		{
			node: t(".ribbon-process-actions"),
			content: /* @__PURE__ */ (0, V.jsx)($o, { controller: e })
		},
		{
			node: t("#approvals-body"),
			content: /* @__PURE__ */ (0, V.jsx)(ts, { controller: e })
		},
		{
			node: t("#decisions-body"),
			content: /* @__PURE__ */ (0, V.jsx)(ns, {})
		},
		{
			node: t("#scan-history-body"),
			content: /* @__PURE__ */ (0, V.jsx)(rs, {})
		},
		{
			node: t("#decision-rationale-body"),
			content: /* @__PURE__ */ (0, V.jsx)(as, {})
		},
		{
			node: t("#process-output-modal > .legion-modal"),
			content: /* @__PURE__ */ (0, V.jsx)(ss, { controller: e })
		}
	];
	[
		"process-count",
		"approval-count",
		"decision-count",
		"scan-history-count",
		"decision-rationale-count"
	].forEach((e) => document.getElementById(e)?.replaceChildren());
	let r = document.createElement("div");
	r.id = "activity-react-root", document.body.appendChild(r);
	let i = qe({
		update: Go,
		actions: e.actions
	}), a = (0, c.createRoot)(r);
	a.render(/* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [Object.keys(Uo).map((e) => /* @__PURE__ */ (0, V.jsx)(cs, { name: e }, e)), n.map(({ node: e, content: t }, n) => (0, w.createPortal)(t, e, String(n)))] })), window.addEventListener("pagehide", () => {
		i(), e.dispose(), a.unmount();
	}, { once: !0 });
}
// src/hub/api.ts
function us({ data: e, error: t, response: n }) {
	if (!e) throw fe(t, n.status);
	return e;
}
async function ds() {
	return us(await D.GET("/api/hub/projects")).projects;
}
async function fs() {
	return us(await D.GET("/api/hub/settings"));
}
async function ps(e) {
	return us(await D.POST("/api/hub/projects", { body: { name: e } }));
}
async function ms(e) {
	return us(await D.POST("/api/hub/projects/{identifier}/open", { params: { path: { identifier: e } } }));
}
async function hs(e) {
	return us(await D.GET("/api/hub/projects/{identifier}/files", { params: { path: { identifier: e } } }));
}
async function gs(e, t) {
	return us(await D.POST("/api/hub/projects/{identifier}/vpn", {
		params: { path: { identifier: e } },
		body: { selection: t }
	}));
}
function _s(e, t) {
	return `/api/hub/projects/${encodeURIComponent(e)}/file?${new URLSearchParams({ path: t })}`;
}
async function vs(e, t) {
	return us(await D.POST("/api/hub/projects/{identifier}/rename", {
		params: { path: { identifier: e } },
		body: { name: t }
	}));
}
async function ys(e) {
	return us(await D.POST("/api/hub/projects/{identifier}/save", { params: { path: { identifier: e } } }));
}
async function bs(e, t) {
	return us(await D.POST("/api/hub/projects/{identifier}/save-as", {
		params: { path: { identifier: e } },
		body: { name: t }
	}));
}
async function xs(e) {
	return us(await D.POST("/api/hub/open-path", { body: { path: e } }));
}
async function Ss(e) {
	let t = await fetch("/api/hub/restore-zip", {
		method: "POST",
		headers: { "Content-Type": "application/zip" },
		body: e
	}), n = await t.json();
	if (!t.ok) throw fe(n, t.status);
	return n;
}
function Cs(e) {
	return `/api/hub/projects/${encodeURIComponent(e)}/bundle`;
}
async function ws() {
	return us(await D.GET("/api/snapshot"));
}
// src/hub/Icon.tsx
function Ts({ kind: e }) {
	return /* @__PURE__ */ (0, V.jsx)("svg", {
		width: "17",
		height: "17",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.4",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, V.jsx)("path", { d: {
			home: "m3 10 9-7 9 7v11h-7v-7h-4v7H3Z",
			computer: "M3 3h18v13H3ZM8 21h8M12 16v5",
			gear: "m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3ZM9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
			file: "M5 3h9l5 5v13H5ZM14 3v6h5",
			search: "M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14Zm5 12 6 6",
			left: "M3 3h18v18H3ZM8 3v18m8-11-4 4 4 4",
			right: "M3 3h18v18H3ZM8 3v18m4-11 4 4-4 4"
		}[e] })
	});
}
// src/hub/desktop.ts
function Es() {
	let [e, t] = (0, C.useState)(() => window.legionDesktop);
	return (0, C.useEffect)(() => {
		let e = () => t(window.legionDesktop ? { ...window.legionDesktop } : void 0);
		return window.addEventListener("legion-desktop-changed", e), e(), () => window.removeEventListener("legion-desktop-changed", e);
	}, []), e;
}
// src/hub/WindowControls.tsx
function Ds({ desktop: e }) {
	return /* @__PURE__ */ (0, V.jsxs)("div", {
		className: "hub-window-controls",
		"aria-label": "Window controls",
		children: [
			/* @__PURE__ */ (0, V.jsx)("button", {
				"aria-label": "Minimise window",
				title: "Minimise",
				onClick: () => e.minimize(),
				children: /* @__PURE__ */ (0, V.jsx)("svg", {
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, V.jsx)("path", { d: "M4 8h8" })
				})
			}),
			/* @__PURE__ */ (0, V.jsx)("button", {
				"aria-label": e.maximized ? "Restore window" : "Maximise window",
				title: e.maximized ? "Restore" : "Maximise",
				onClick: () => e.toggleMaximize(),
				children: /* @__PURE__ */ (0, V.jsx)("svg", {
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, V.jsx)("path", { d: e.maximized ? "M5 3h8v8M3 5h8v8H3Z" : "M4 4h8v8H4Z" })
				})
			}),
			/* @__PURE__ */ (0, V.jsx)("button", {
				"aria-label": "Close window",
				title: "Close",
				onClick: () => e.close(),
				children: /* @__PURE__ */ (0, V.jsx)("svg", {
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, V.jsx)("path", { d: "m5 5 6 6m0-6-6 6" })
				})
			})
		]
	});
}
// src/hub/ProjectLabel.tsx
function Os({ name: e, onRename: t, request: n = 0, doubleClick: r = !1 }) {
	let [i, a] = (0, C.useState)(!1), [o, s] = (0, C.useState)(e), [c, l] = (0, C.useState)(""), [u, d] = (0, C.useState)(!1), f = (0, C.useRef)(!1), p = (0, C.useRef)(null);
	function m() {
		s(e), l(""), a(!0);
	}
	(0, C.useEffect)(() => {
		n && m();
	}, [n]), (0, C.useEffect)(() => {
		i && (p.current?.focus(), p.current?.select());
	}, [i]);
	async function h() {
		if (!f.current) {
			if (o.trim() === e) a(!1);
			else if (!o.trim()) l("Enter a project name."), p.current?.focus();
			else {
				f.current = !0, d(!0), l("");
				try {
					await t(o.trim()), a(!1);
				} catch (e) {
					l(e instanceof Error ? e.message : String(e)), p.current?.focus();
				} finally {
					f.current = !1, d(!1);
				}
			}
		}
	}
	return /* @__PURE__ */ (0, V.jsxs)("span", {
		className: "hub-project-label",
		children: [i ? /* @__PURE__ */ (0, V.jsx)("input", {
			ref: p,
			"aria-label": "Project name",
			maxLength: 120,
			value: o,
			disabled: u,
			onChange: (e) => s(e.target.value),
			onBlur: () => {
				h();
			},
			onKeyDown: (e) => {
				e.key === "Enter" && (e.preventDefault(), h()), e.key === "Escape" && !f.current && (e.preventDefault(), e.stopPropagation(), a(!1));
			}
		}) : /* @__PURE__ */ (0, V.jsx)("button", {
			className: "hub-name",
			"aria-label": `Rename ${e}`,
			title: r ? "Double-click to rename" : "Rename project",
			onClick: r ? void 0 : m,
			onDoubleClick: r ? m : void 0,
			children: e
		}), c && /* @__PURE__ */ (0, V.jsx)("span", {
			className: "hub-inline-error",
			role: "alert",
			children: c
		})]
	});
}
// src/hub/parts.tsx
var ks = {
	"app-settings": "Application settings",
	"interface-settings": "Interface settings",
	"scheduler-settings": "Scheduler settings",
	"device-category-settings": "Device categories"
}, As = {
	hosts: "Hosts",
	services: "Services",
	graph: "Graph",
	activity: "Activity",
	approvals: "Approvals"
}, js = {
	scan: "New scan",
	tool: "Run a tool",
	import: "Import results"
}, Ms = {
	...As,
	...ks,
	...js
};
function Ns({ part: e, host: t, close: n, displayChanged: r, statusChanged: i }) {
	let a = (0, C.useRef)(null);
	return (0, C.useEffect)(() => {
		let e = (e) => {
			e.origin === location.origin && e.source === a.current?.contentWindow && (e.data?.type === "legion-part-closed" && n(), e.data?.type === "legion-display" && r(!!e.data.enabled), e.data?.type === "legion-status" && typeof e.data.text == "string" && i(e.data.text === "Idle" ? "Ready" : e.data.text));
		};
		return window.addEventListener("message", e), () => window.removeEventListener("message", e);
	}, [
		n,
		r,
		i
	]), /* @__PURE__ */ (0, V.jsxs)("section", {
		className: "hub-reused-panel",
		"aria-label": Ms[e],
		children: [!ks[e] && e !== "scan" && e !== "tool" && /* @__PURE__ */ (0, V.jsx)("button", {
			className: "hub-part-close",
			"aria-label": `Close ${Ms[e]}`,
			onClick: n,
			children: "×"
		}), /* @__PURE__ */ (0, V.jsx)("iframe", {
			ref: a,
			title: Ms[e],
			src: `/?part=${encodeURIComponent(e)}${t ? `&host=${t}` : ""}`
		})]
	});
}
// src/hub/pages.tsx
var Ps = (e) => e instanceof Error ? e.message : String(e);
function Fs({ project: e, onChange: t }) {
	let [n, r] = (0, C.useState)([]), [i, a] = (0, C.useState)(""), [o, s] = (0, C.useState)(!1), [c, l] = (0, C.useState)(!1);
	(0, C.useEffect)(() => {
		let t = !0;
		return hs(e.id).then((e) => {
			t && (r(e.files), s(e.truncated));
		}).catch((e) => {
			t && a(Ps(e));
		}), () => {
			t = !1;
		};
	}, [e.id]);
	async function u(n) {
		l(!0), a("");
		try {
			await gs(e.id, n), t({
				...e,
				vpn: n
			});
		} catch (e) {
			a(Ps(e));
		} finally {
			l(!1);
		}
	}
	return /* @__PURE__ */ (0, V.jsxs)("section", {
		className: "hub-overview",
		"aria-label": "Project overview",
		children: [
			/* @__PURE__ */ (0, V.jsx)("h1", { children: e.name }),
			/* @__PURE__ */ (0, V.jsx)("p", {
				className: "hub-folder",
				children: e.folder
			}),
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "hub-property",
				children: [
					/* @__PURE__ */ (0, V.jsx)("label", {
						htmlFor: "hub-project-vpn",
						children: "VPN"
					}),
					/* @__PURE__ */ (0, V.jsxs)("select", {
						id: "hub-project-vpn",
						value: e.vpn,
						disabled: c,
						onChange: (e) => {
							u(e.target.value);
						},
						children: [/* @__PURE__ */ (0, V.jsx)("option", {
							value: "inherit",
							children: "Use default"
						}), /* @__PURE__ */ (0, V.jsx)("option", {
							value: "none",
							children: "None"
						})]
					}),
					/* @__PURE__ */ (0, V.jsx)("span", {
						className: "hub-muted",
						children: "Not configured"
					})
				]
			}),
			i && /* @__PURE__ */ (0, V.jsx)("p", {
				className: "hub-error",
				role: "alert",
				children: i
			}),
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "hub-files-header",
				children: [/* @__PURE__ */ (0, V.jsx)("h2", { children: "Files" }), /* @__PURE__ */ (0, V.jsx)("button", {
					className: "hub-quiet",
					"aria-label": "Refresh files",
					onClick: () => {
						hs(e.id).then((e) => {
							r(e.files), s(e.truncated), a("");
						}).catch((e) => a(Ps(e)));
					},
					children: "↻"
				})]
			}),
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "hub-files",
				children: [n.map((t) => /* @__PURE__ */ (0, V.jsxs)("a", {
					href: _s(e.id, t.path),
					download: !0,
					children: [
						/* @__PURE__ */ (0, V.jsx)(Ts, { kind: "file" }),
						/* @__PURE__ */ (0, V.jsx)("span", { children: t.path }),
						/* @__PURE__ */ (0, V.jsx)("small", { children: t.size < 1024 ? `${t.size} B` : `${Math.ceil(t.size / 1024)} KB` })
					]
				}, t.path)), !n.length && /* @__PURE__ */ (0, V.jsx)("span", {
					className: "hub-muted",
					children: "—"
				})]
			}),
			o && /* @__PURE__ */ (0, V.jsx)("p", {
				className: "hub-muted",
				children: "First 500 files"
			})
		]
	});
}
function Is({ settings: e, openPart: t }) {
	return /* @__PURE__ */ (0, V.jsxs)("section", {
		className: "hub-setup-page",
		"aria-label": "Computer setup",
		children: [
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "hub-computer",
				children: [/* @__PURE__ */ (0, V.jsx)(Ts, { kind: "computer" }), /* @__PURE__ */ (0, V.jsxs)("div", { children: [/* @__PURE__ */ (0, V.jsx)("h1", { children: e?.computer.name || "This computer" }), /* @__PURE__ */ (0, V.jsx)("span", {
					className: "hub-muted",
					children: e?.computer.system || "—"
				})] })]
			}),
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "hub-property",
				children: [/* @__PURE__ */ (0, V.jsx)("span", { children: "VPN" }), /* @__PURE__ */ (0, V.jsx)("span", {
					className: "hub-vpn-unconfigured",
					children: "Not configured"
				})]
			}),
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "hub-property",
				children: [
					/* @__PURE__ */ (0, V.jsx)("label", {
						htmlFor: "hub-default-vpn",
						children: "Default VPN"
					}),
					/* @__PURE__ */ (0, V.jsx)("select", {
						id: "hub-default-vpn",
						disabled: !0,
						value: "none",
						children: /* @__PURE__ */ (0, V.jsx)("option", {
							value: "none",
							children: "No default"
						})
					}),
					/* @__PURE__ */ (0, V.jsx)("button", {
						className: "hub-quiet",
						disabled: !0,
						"aria-label": "Refresh VPNs — not available yet",
						children: "↻"
					})
				]
			}),
			/* @__PURE__ */ (0, V.jsx)("div", {
				className: "hub-settings-links",
				children: Object.entries(ks).map(([e, n]) => /* @__PURE__ */ (0, V.jsx)("button", {
					onClick: () => t(e),
					children: n
				}, e))
			})
		]
	});
}
// src/hub/Dialog.tsx
function Ls({ title: e, close: t, children: n }) {
	let r = (0, C.useRef)(null), i = (0, C.useRef)(document.activeElement);
	return (0, C.useEffect)(() => (r.current?.querySelector("input,button")?.focus(), () => i.current?.focus()), []), /* @__PURE__ */ (0, V.jsx)("div", {
		className: "hub-modal-backdrop",
		onClick: (e) => {
			e.target === e.currentTarget && t();
		},
		children: /* @__PURE__ */ (0, V.jsxs)("div", {
			className: "hub-modal",
			role: "dialog",
			"aria-modal": "true",
			"aria-label": e,
			ref: r,
			onKeyDown: (e) => {
				if (e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), t()), e.key === "Tab") {
					let t = [...r.current.querySelectorAll("input:not(:disabled),button:not(:disabled),select:not(:disabled),a[href]")], n = t[0], i = t.at(-1);
					e.shiftKey && document.activeElement === n && (e.preventDefault(), i?.focus()), !e.shiftKey && document.activeElement === i && (e.preventDefault(), n?.focus());
				}
			},
			children: [/* @__PURE__ */ (0, V.jsx)("h2", { children: e }), n]
		})
	});
}
// src/hub/Menu.tsx
function Rs({ items: e, x: t, y: n, close: r }) {
	let i = (0, C.useRef)(null), a = (0, C.useRef)(document.activeElement);
	return (0, C.useLayoutEffect)(() => {
		let e = i.current;
		return e.style.left = `${Math.max(8, Math.min(t, window.innerWidth - e.offsetWidth - 8))}px`, e.style.top = `${Math.max(8, Math.min(n, window.innerHeight - e.offsetHeight - 8))}px`, e.querySelector("button:not(:disabled)")?.focus(), () => a.current?.focus();
	}, []), (0, C.useEffect)(() => {
		let e = (e) => {
			i.current?.contains(e.target) || r();
		};
		return window.addEventListener("pointerdown", e), window.addEventListener("blur", r), window.addEventListener("resize", r), () => {
			window.removeEventListener("pointerdown", e), window.removeEventListener("blur", r), window.removeEventListener("resize", r);
		};
	}, [r]), /* @__PURE__ */ (0, V.jsx)("div", {
		className: "hub-context-menu",
		role: "menu",
		"aria-label": "Project actions",
		ref: i,
		style: {
			left: t,
			top: n
		},
		onKeyDown: (e) => {
			if ((e.key === "Escape" || e.key === "Tab") && (e.preventDefault(), r()), ![
				"ArrowDown",
				"ArrowUp",
				"Home",
				"End"
			].includes(e.key)) return;
			e.preventDefault();
			let t = [...i.current.querySelectorAll("button:not(:disabled)")], n = t.indexOf(document.activeElement);
			t[e.key === "Home" ? 0 : e.key === "End" ? t.length - 1 : (n + (e.key === "ArrowDown" ? 1 : -1) + t.length) % t.length]?.focus();
		},
		children: e.map((e) => /* @__PURE__ */ (0, V.jsx)("button", {
			role: "menuitem",
			disabled: e.disabled,
			onClick: () => {
				r(), e.run();
			},
			children: e.label
		}, e.label))
	});
}
// src/hub/Palette.tsx
function zs({ commands: e, close: t }) {
	let [n, r] = (0, C.useState)(""), [i, a] = (0, C.useState)(0), o = (0, C.useMemo)(() => e.filter((e) => `${e.label} ${e.detail || ""}`.toLowerCase().includes(n.toLowerCase())).slice(0, 30), [e, n]), s = (0, C.useRef)(null);
	function c(e) {
		let n = o[e];
		n && (t(), n.run());
	}
	return /* @__PURE__ */ (0, V.jsx)(Ls, {
		title: "Search workspace",
		close: t,
		children: /* @__PURE__ */ (0, V.jsxs)("div", {
			onKeyDown: (e) => {
				(e.key === "ArrowDown" || e.key === "ArrowUp") && (e.preventDefault(), a((t) => {
					let n = (t + (e.key === "ArrowDown" ? 1 : -1) + o.length) % Math.max(1, o.length);
					return s.current?.children[n]?.scrollIntoView?.({ block: "nearest" }), n;
				})), e.key === "Enter" && (e.preventDefault(), c(i));
			},
			children: [/* @__PURE__ */ (0, V.jsx)("input", {
				"aria-label": "Search views, actions, and hosts",
				placeholder: "Search…",
				value: n,
				onChange: (e) => {
					r(e.target.value), a(0);
				},
				"aria-controls": "hub-search-results",
				"aria-activedescendant": o[i] ? `hub-command-${i}` : void 0
			}), /* @__PURE__ */ (0, V.jsx)("div", {
				id: "hub-search-results",
				className: "hub-palette-results",
				ref: s,
				role: "listbox",
				children: o.map((e, t) => /* @__PURE__ */ (0, V.jsxs)("button", {
					id: `hub-command-${t}`,
					role: "option",
					"aria-selected": t === i,
					onClick: () => c(t),
					children: [/* @__PURE__ */ (0, V.jsx)("span", { children: e.label }), /* @__PURE__ */ (0, V.jsx)("small", { children: e.detail })]
				}, e.id))
			})]
		})
	});
}
// src/hub/preferences.ts
function Bs(e, t) {
	try {
		let n = localStorage.getItem(`legion.workspace.${e}`);
		return n === null ? t : JSON.parse(n);
	} catch {
		return t;
	}
}
function Vs(e, t) {
	try {
		localStorage.setItem(`legion.workspace.${e}`, JSON.stringify(t));
	} catch {}
}
var Hs = (e) => Math.max(210, Math.min(340, e));
function Us() {
	let [e, t] = (0, C.useState)(() => {
		let e = Bs("sidebarWidth", 260);
		return typeof e == "number" && Number.isFinite(e) ? Hs(e) : 260;
	}), n = (0, C.useRef)(null);
	return (0, C.useEffect)(() => Vs("sidebarWidth", e), [e]), {
		width: e,
		resize: {
			onPointerDown(t) {
				t.button === 0 && (n.current = {
					x: t.clientX,
					width: e
				}, t.currentTarget.setPointerCapture(t.pointerId), t.preventDefault());
			},
			onPointerMove(e) {
				n.current && t(Hs(n.current.width + e.clientX - n.current.x));
			},
			onPointerUp() {
				n.current = null;
			},
			onPointerCancel() {
				n.current = null;
			},
			onKeyDown(e) {
				[
					"ArrowLeft",
					"ArrowRight",
					"Home",
					"End"
				].includes(e.key) && (e.preventDefault(), t((t) => e.key === "Home" ? 210 : e.key === "End" ? 340 : Hs(t + (e.key === "ArrowLeft" ? -10 : 10))));
			}
		}
	};
}
// src/hub/live.ts
function Ws() {
	let [e, t] = (0, C.useState)(null), [n, r] = (0, C.useState)("Connecting"), i = (0, C.useRef)(() => {});
	return (0, C.useEffect)(() => {
		let e = !0, n = !1, a = null, o, s = !1;
		async function c() {
			if (n) s = !0;
			else {
				n = !0;
				try {
					let n = await ws();
					e && (t(n), r(a?.readyState === 1 ? "Live" : "Polling/API"));
				} catch {
					e && r("Offline");
				} finally {
					n = !1, e && s && (s = !1, c());
				}
			}
		}
		i.current = () => {
			c();
		};
		function l() {
			document.getElementById("project-hub-root")?.dataset.wsEnabled === "true" && typeof WebSocket < "u" && (a = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/snapshot`), a.onopen = () => {
				e && (r("Live"), c());
			}, a.onmessage = (e) => {
				try {
					JSON.parse(e.data).type === "invalidate" && c();
				} catch {}
			}, a.onclose = () => {
				e && (r("Polling/API"), o = setTimeout(l, 3e3));
			}, a.onerror = () => a?.close());
		}
		c(), l();
		let u = setInterval(() => {
			a?.readyState !== 1 && c();
		}, 2e3), d = setInterval(() => {
			c();
		}, 3e4);
		return () => {
			e = !1, clearInterval(u), clearInterval(d), clearTimeout(o), a?.close(), i.current = () => {};
		};
	}, []), {
		snapshot: e,
		connection: n,
		refresh: () => i.current()
	};
}
// src/hub/ProjectHub.tsx
var Gs = (e) => e instanceof Error ? e.message : String(e);
function Ks() {
	let e = Es(), t = (e) => e instanceof Element && !e.closest("button,input,select,a,[role=\"button\"]"), n = (n) => {
		n.button === 0 && t(n.target) && e?.startMove();
	}, r = (n) => {
		t(n.target) && e?.toggleMaximize();
	}, [i, a] = (0, C.useState)([]), [o, s] = (0, C.useState)(null), [c, l] = (0, C.useState)(null), [u, d] = (0, C.useState)("home"), [f, p] = (0, C.useState)(""), [m, h] = (0, C.useState)(null), [g, _] = (0, C.useState)(""), [v, y] = (0, C.useState)(""), [b, x] = (0, C.useState)("Ready"), [S, ee] = (0, C.useState)(!1), [w, T] = (0, C.useState)(!1), [E, te] = (0, C.useState)(!1), [ne, re] = (0, C.useState)(0), [ie, ae] = (0, C.useState)(""), [oe, se] = (0, C.useState)(), [ce, le] = (0, C.useState)(document.body.classList.contains("colorful-background")), [ue, de] = (0, C.useState)(null), [D, fe] = (0, C.useState)(() => Bs("sidebarCollapsed", !1) === !0), { width: pe, resize: me } = Us(), he = Ws(), O = (0, C.useRef)(!1), ge = (0, C.useRef)(0), _e = (0, C.useRef)(0), ve = (0, C.useRef)(!1), k = (0, C.useRef)(null), ye = (0, C.useRef)("project"), be = (0, C.useRef)(void 0);
	async function A() {
		let e = ++_e.current, t = await ds();
		return e === _e.current && a(t), t;
	}
	async function j(e, t = !1) {
		if (O.current) throw Error("A project operation is already running.");
		let n = ++ge.current;
		O.current = !0, ee(!0), y("");
		try {
			let r = await e();
			return await A(), he.refresh(), n === ge.current && (l(r.project), t || d("project"), x("Ready")), r;
		} catch (e) {
			throw n === ge.current && y(Gs(e)), e;
		} finally {
			O.current = !1, ee(!1);
		}
	}
	function xe(e) {
		e.catch(() => {});
	}
	(0, C.useEffect)(() => {
		let e = !0;
		return A().then(async (t) => {
			let n = Bs("hubNavigation", null);
			if (!e || ge.current || !n) return;
			let r = n.setupOrigin;
			r && [
				"home",
				"project",
				"part"
			].includes(r.page) && (r.page !== "part" || r.part && Ms[r.part]) && (be.current = r);
			let i = t.find((e) => e.id === n.project);
			if (i) {
				if (await j(() => ms(i.id)), !e || ge.current !== 1) return;
				n.page === "setup" && d("setup"), n.page === "part" && n.part && Ms[n.part] && (ae(n.part), se(n.host), d("part"));
			} else n.page === "setup" && !n.project && d("setup");
		}).catch((t) => {
			e && y(Gs(t));
		}).finally(() => {
			e && te(!0);
		}), fs().then(s).catch((t) => {
			e && y(Gs(t));
		}), () => {
			e = !1;
		};
	}, []), (0, C.useEffect)(() => {
		E && Vs("hubNavigation", {
			project: c?.id,
			page: u,
			part: ie,
			host: oe,
			setupOrigin: be.current
		});
	}, [
		E,
		c?.id,
		u,
		ie,
		oe
	]), (0, C.useEffect)(() => {
		Vs("sidebarCollapsed", D), ve.current && (ve.current = !1, document.getElementById(D ? "hub-sidebar-reopen" : "hub-sidebar-toggle")?.focus());
	}, [D]), (0, C.useEffect)(() => {
		let e = (e) => {
			(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && (e.preventDefault(), e.stopImmediatePropagation(), T((e) => !e)), (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && c && !m && !w && (e.preventDefault(), e.stopImmediatePropagation(), e.shiftKey ? M("save-as", `${c.name} copy`) : xe(ke(c)));
		};
		return document.addEventListener("keydown", e, !0), () => document.removeEventListener("keydown", e, !0);
	}, [
		c,
		m,
		w
	]);
	function Se() {
		ge.current++, d("home"), l(null), y(""), de(null);
	}
	function Ce() {
		if (ge.current++, y(""), u === "setup") {
			let e = be.current;
			ae(e?.part || ""), se(e?.host), ye.current = e?.panelReturn || (c ? "project" : "home"), d(e?.page === "project" && !c ? "home" : e?.page || (c ? "project" : "home"));
		} else be.current = {
			page: u,
			part: ie,
			host: oe,
			panelReturn: ye.current
		}, d("setup");
	}
	function we() {
		ge.current++, d("project"), y("");
	}
	function Te(e) {
		ve.current = !0, fe(e);
	}
	function M(e, t = "") {
		de(null), y(""), _(t), h(e);
	}
	function Ee(e, t) {
		ge.current++, ye.current = u === "setup" ? "setup" : c ? "project" : "home", ae(e), se(t), d("part"), y("");
	}
	function De() {
		d(ye.current), he.refresh();
	}
	function N(e) {
		document.body.classList.toggle("colorful-background", e), le(e);
	}
	async function Oe(e) {
		c?.id !== e.id && await j(() => ms(e.id));
	}
	async function ke(e) {
		await Oe(e), await j(() => ys(e.id), !0), x("Saved");
	}
	async function Ae(e) {
		c && await j(() => vs(c.id, e), !0);
	}
	function P(e, t) {
		if ("key" in e && e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
		e.preventDefault();
		let n = e.currentTarget.getBoundingClientRect();
		de({
			project: t,
			x: "clientX" in e ? e.clientX : n.left,
			y: "clientY" in e ? e.clientY : n.bottom
		});
	}
	async function je() {
		if (g.trim() && !S) try {
			m === "open" ? await j(() => xs(g.trim())) : m === "save-as" && c ? await j(() => bs(c.id, g.trim())) : await j(() => ps(g.trim())), h(null);
		} catch {}
	}
	async function Me(e, t) {
		try {
			if (await Oe(e), t === "rename" && (fe(!1), re((e) => e + 1)), t === "save" && await ke(e), t === "save-as" && M("save-as", `${e.name} copy`), t === "details" && M("details"), t === "export") {
				let t = document.createElement("a");
				t.href = Cs(e.id), t.download = "", t.click();
			}
		} catch (e) {
			y(Gs(e));
		}
	}
	let Ne = i.filter((e) => e.name.toLowerCase().includes(f.toLowerCase())), Pe = [
		...i.map((e) => ({
			id: `project-${e.id}`,
			label: e.name,
			detail: "Project",
			run: () => xe(j(() => ms(e.id)))
		})),
		{
			id: "home",
			label: "Projects",
			detail: "View",
			run: Se
		},
		{
			id: "setup",
			label: "Setup",
			detail: "View",
			run: Ce
		},
		{
			id: "create",
			label: "New project",
			detail: "Action",
			run: () => M("create")
		},
		{
			id: "open",
			label: "Open project",
			detail: "Action",
			run: () => M("open")
		},
		{
			id: "restore",
			label: "Restore ZIP",
			detail: "Action",
			run: () => k.current?.click()
		},
		...Object.entries(ks).map(([e, t]) => ({
			id: e,
			label: t,
			detail: "Settings",
			run: () => Ee(e)
		}))
	];
	if (c) {
		Pe.push({
			id: "overview",
			label: "Overview",
			detail: "View",
			run: we
		});
		for (let [e, t] of Object.entries({
			...As,
			...js
		})) Pe.push({
			id: e,
			label: t,
			detail: As[e] ? "View" : "Action",
			run: () => Ee(e)
		});
		for (let [e, t] of Object.entries({
			rename: "Rename project",
			save: "Save project",
			"save-as": "Save project as",
			export: "Export ZIP",
			details: "Workspace details"
		})) Pe.push({
			id: e,
			label: t,
			detail: "Action",
			run: () => xe(Me(c, e))
		});
		let e = he.snapshot?.hosts;
		if (Array.isArray(e)) for (let t of e) t && typeof t == "object" && "id" in t && "ip" in t && Pe.push({
			id: `host-${t.id}`,
			label: `${t.ip} ${"hostname" in t && t.hostname || ""}`.trim(),
			detail: "Host",
			run: () => Ee("hosts", Number(t.id))
		});
	}
	let Fe = he.snapshot?.jobs?.filter((e) => e.status === "running" || e.status === "queued") || [], Ie = document.getElementById("project-hub-root")?.dataset, F = he.snapshot?.project.name === c?.path ? he.snapshot?.project : null, I = ue ? Object.entries({
		rename: "Rename project",
		save: "Save",
		"save-as": "Save as…",
		export: "Export ZIP",
		details: "Workspace details"
	}).map(([e, t]) => ({
		label: t,
		disabled: S,
		run: () => xe(Me(ue.project, e))
	})) : [], Le = u === "setup" ? "Setup" : u === "part" ? Ms[ie] : "Overview";
	return /* @__PURE__ */ (0, V.jsxs)("div", {
		className: `hub-app${D ? " hub-collapsed" : ""}${e ? " hub-desktop" : ""}`,
		style: { "--hub-sidebar-width": `${pe}px` },
		children: [
			ce && /* @__PURE__ */ (0, V.jsx)("div", {
				className: "logo-watermark",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, V.jsx)("pre", { children: window.LEGION_CONSOLE_LOGO_ART || "" })
			}),
			/* @__PURE__ */ (0, V.jsxs)("aside", {
				id: "hub-sidebar",
				className: "hub-sidebar",
				"aria-label": "Projects",
				hidden: D,
				children: [
					/* @__PURE__ */ (0, V.jsxs)("div", {
						className: "hub-brand-row",
						onPointerDown: n,
						onDoubleClick: r,
						children: [/* @__PURE__ */ (0, V.jsxs)("button", {
							className: "hub-brand",
							onClick: Se,
							children: [/* @__PURE__ */ (0, V.jsx)("span", {
								className: "hub-logo",
								"aria-hidden": "true",
								children: "L"
							}), "Legion"]
						}), /* @__PURE__ */ (0, V.jsx)("button", {
							id: "hub-sidebar-toggle",
							className: "hub-sidebar-toggle",
							"aria-label": "Collapse sidebar",
							title: "Collapse sidebar",
							"aria-controls": "hub-sidebar",
							"aria-expanded": !D,
							onClick: () => Te(!0),
							children: /* @__PURE__ */ (0, V.jsx)(Ts, { kind: "left" })
						})]
					}),
					c ? /* @__PURE__ */ (0, V.jsxs)("div", {
						className: "hub-project-context",
						children: [
							/* @__PURE__ */ (0, V.jsxs)("div", {
								className: "hub-project-heading",
								onContextMenu: (e) => P(e, c),
								onKeyDown: (e) => P(e, c),
								tabIndex: 0,
								"aria-label": `${c.name} project actions`,
								children: [/* @__PURE__ */ (0, V.jsx)("span", {
									className: "hub-avatar",
									"aria-hidden": "true",
									children: "LG"
								}), /* @__PURE__ */ (0, V.jsx)(Os, {
									name: c.name,
									onRename: Ae,
									request: ne,
									doubleClick: !0
								}, c.id)]
							}),
							/* @__PURE__ */ (0, V.jsxs)("button", {
								className: "hub-search",
								onClick: () => T(!0),
								children: [
									/* @__PURE__ */ (0, V.jsx)(Ts, { kind: "search" }),
									/* @__PURE__ */ (0, V.jsx)("span", { children: "Search workspace" }),
									/* @__PURE__ */ (0, V.jsx)("kbd", { children: "Ctrl K" })
								]
							}),
							/* @__PURE__ */ (0, V.jsx)("nav", {
								"aria-label": `${c.name} tabs`,
								children: /* @__PURE__ */ (0, V.jsxs)("button", {
									className: "hub-overview-tab",
									"aria-current": u === "project" ? "page" : void 0,
									onClick: we,
									children: [/* @__PURE__ */ (0, V.jsx)(Ts, { kind: "home" }), "Overview"]
								})
							})
						]
					}) : /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
						/* @__PURE__ */ (0, V.jsxs)("label", {
							className: "hub-search",
							children: [
								/* @__PURE__ */ (0, V.jsx)(Ts, { kind: "search" }),
								/* @__PURE__ */ (0, V.jsx)("input", {
									id: "hub-search",
									"aria-label": "Search projects",
									placeholder: "Search projects",
									value: f,
									onChange: (e) => p(e.target.value)
								}),
								/* @__PURE__ */ (0, V.jsx)("button", {
									"aria-label": "Search workspace",
									onClick: () => T(!0),
									children: /* @__PURE__ */ (0, V.jsx)("kbd", { children: "Ctrl K" })
								})
							]
						}),
						/* @__PURE__ */ (0, V.jsxs)("div", {
							className: "hub-section-label",
							children: [/* @__PURE__ */ (0, V.jsx)("span", { children: "Projects" }), /* @__PURE__ */ (0, V.jsx)("button", {
								id: "hub-new-project",
								"aria-label": "New project",
								disabled: S,
								onClick: () => M("create"),
								children: "+"
							})]
						}),
						/* @__PURE__ */ (0, V.jsx)("div", {
							className: "hub-projects",
							children: Ne.map((e) => /* @__PURE__ */ (0, V.jsxs)("button", {
								className: "hub-project",
								"data-hub-project": e.id,
								disabled: S,
								onContextMenu: (t) => P(t, e),
								onKeyDown: (t) => P(t, e),
								onClick: () => xe(j(() => ms(e.id))),
								children: [/* @__PURE__ */ (0, V.jsx)("span", {
									className: "hub-avatar",
									"aria-hidden": "true",
									children: "LG"
								}), /* @__PURE__ */ (0, V.jsx)("span", { children: e.name })]
							}, e.id))
						})
					] }),
					/* @__PURE__ */ (0, V.jsxs)("button", {
						id: "hub-setup",
						className: "hub-setup needs-setup",
						onClick: Ce,
						"aria-label": "Setup — VPN not configured",
						"aria-current": u === "setup" ? "page" : void 0,
						children: [
							/* @__PURE__ */ (0, V.jsx)(Ts, { kind: "gear" }),
							/* @__PURE__ */ (0, V.jsx)("span", { children: "Setup" }),
							/* @__PURE__ */ (0, V.jsx)("span", { className: "hub-dot" })
						]
					}),
					/* @__PURE__ */ (0, V.jsx)("div", {
						className: "hub-resizer",
						role: "separator",
						"aria-label": "Resize sidebar",
						"aria-orientation": "vertical",
						"aria-valuemin": 210,
						"aria-valuemax": 340,
						"aria-valuenow": pe,
						tabIndex: 0,
						...me
					})
				]
			}),
			/* @__PURE__ */ (0, V.jsxs)("main", {
				className: "hub-main",
				children: [
					/* @__PURE__ */ (0, V.jsxs)("header", {
						className: "hub-header",
						onPointerDown: n,
						onDoubleClick: r,
						children: [
							D && /* @__PURE__ */ (0, V.jsx)("button", {
								id: "hub-sidebar-reopen",
								className: "hub-sidebar-toggle",
								"aria-label": "Show sidebar",
								title: "Show sidebar",
								"aria-controls": "hub-sidebar",
								"aria-expanded": "false",
								onClick: () => Te(!1),
								children: /* @__PURE__ */ (0, V.jsx)(Ts, { kind: "right" })
							}),
							D && /* @__PURE__ */ (0, V.jsx)("button", {
								className: "hub-collapsed-brand",
								onClick: Se,
								children: "Legion"
							}),
							c ? /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
								/* @__PURE__ */ (0, V.jsx)("span", {
									className: "hub-avatar",
									"aria-hidden": "true",
									children: "LG"
								}),
								/* @__PURE__ */ (0, V.jsx)(Os, {
									name: c.name,
									onRename: Ae
								}, c.id),
								/* @__PURE__ */ (0, V.jsx)("span", {
									className: "hub-divider",
									children: "/"
								}),
								/* @__PURE__ */ (0, V.jsx)("span", { children: Le })
							] }) : /* @__PURE__ */ (0, V.jsx)("span", { children: u === "setup" || u === "part" ? Le : "Projects" }),
							/* @__PURE__ */ (0, V.jsx)("button", {
								className: "hub-header-details",
								"aria-label": "Workspace details",
								title: "Workspace details",
								onClick: () => M("details"),
								children: "ⓘ"
							}),
							e && /* @__PURE__ */ (0, V.jsx)(Ds, { desktop: e })
						]
					}),
					v && !m && /* @__PURE__ */ (0, V.jsx)("p", {
						className: "hub-error",
						role: "alert",
						children: v
					}),
					/* @__PURE__ */ (0, V.jsxs)("div", {
						className: `hub-content${u === "part" ? " hub-content-part" : ""}`,
						children: [
							u === "home" && /* @__PURE__ */ (0, V.jsxs)("section", {
								className: "hub-home",
								"aria-label": "Project home",
								children: [
									/* @__PURE__ */ (0, V.jsx)("span", {
										className: "hub-home-mark",
										children: "L"
									}),
									/* @__PURE__ */ (0, V.jsx)("h1", { children: "Projects" }),
									/* @__PURE__ */ (0, V.jsx)("div", {
										className: "hub-home-list",
										children: Ne.map((e) => /* @__PURE__ */ (0, V.jsxs)("button", {
											disabled: S,
											onContextMenu: (t) => P(t, e),
											onKeyDown: (t) => P(t, e),
											onClick: () => xe(j(() => ms(e.id))),
											children: [/* @__PURE__ */ (0, V.jsx)("span", {
												className: "hub-avatar",
												"aria-hidden": "true",
												children: "LG"
											}), /* @__PURE__ */ (0, V.jsx)("span", { children: e.name })]
										}, e.id))
									}),
									/* @__PURE__ */ (0, V.jsxs)("div", {
										className: "hub-home-actions",
										children: [
											/* @__PURE__ */ (0, V.jsx)("button", {
												className: "hub-create-link",
												disabled: S,
												onClick: () => M("create"),
												children: "+ New project"
											}),
											/* @__PURE__ */ (0, V.jsx)("button", {
												disabled: S,
												onClick: () => M("open"),
												children: "Open project"
											}),
											/* @__PURE__ */ (0, V.jsx)("button", {
												disabled: S,
												onClick: () => k.current?.click(),
												children: "Restore ZIP"
											})
										]
									})
								]
							}),
							u === "project" && c && /* @__PURE__ */ (0, V.jsx)(Fs, {
								project: c,
								onChange: (e) => l((t) => t?.id === e.id ? e : t)
							}, c.id),
							u === "setup" && /* @__PURE__ */ (0, V.jsx)(Is, {
								settings: o,
								openPart: Ee
							}),
							u === "part" && /* @__PURE__ */ (0, V.jsx)(Ns, {
								part: ie,
								host: oe,
								close: De,
								displayChanged: N,
								statusChanged: x
							})
						]
					}),
					/* @__PURE__ */ (0, V.jsx)("span", {
						className: "hub-status-announcement",
						role: "status",
						children: S ? "Working…" : b
					})
				]
			}),
			e && !e.maximized && /* @__PURE__ */ (0, V.jsx)("div", {
				className: "hub-window-edges",
				"aria-hidden": "true",
				children: [
					"top",
					"bottom",
					"left",
					"right",
					"top-left",
					"top-right",
					"bottom-left",
					"bottom-right"
				].map((t) => /* @__PURE__ */ (0, V.jsx)("div", {
					"data-window-edge": t,
					onPointerDown: (n) => {
						n.button === 0 && (n.preventDefault(), e.resizeEdge(t));
					}
				}, t))
			}),
			/* @__PURE__ */ (0, V.jsx)("input", {
				ref: k,
				type: "file",
				accept: ".zip,application/zip",
				hidden: !0,
				"aria-label": "Restore workspace ZIP",
				onChange: (e) => {
					let t = e.target.files?.[0];
					t && xe(j(() => Ss(t))), e.target.value = "";
				}
			}),
			ue && /* @__PURE__ */ (0, V.jsx)(Rs, {
				items: I,
				x: ue.x,
				y: ue.y,
				close: () => de(null)
			}),
			w && /* @__PURE__ */ (0, V.jsx)(zs, {
				commands: Pe,
				close: () => T(!1)
			}),
			m && /* @__PURE__ */ (0, V.jsx)(Ls, {
				title: m === "create" ? "New project" : m === "save-as" ? "Save project as" : m === "open" ? "Open project" : "Workspace details",
				close: () => {
					S || h(null);
				},
				children: m === "details" ? /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)("dl", {
					className: "hub-details",
					children: Object.entries({
						Project: c?.name,
						File: c?.path,
						Folder: c?.folder,
						Output: F?.output_folder,
						Running: F?.running_folder,
						Autosave: F?.autosave?.last_saved_at || "—",
						"Autosave error": F?.autosave?.last_error || "—",
						Status: S ? "Working…" : b,
						"Running / queued jobs": String(Fe.length),
						Connection: he.connection,
						Version: Ie?.version,
						Bind: Ie?.bind || "Localhost only",
						Authentication: Ie?.auth || "No auth"
					}).map(([e, t]) => /* @__PURE__ */ (0, V.jsxs)("div", { children: [/* @__PURE__ */ (0, V.jsx)("dt", { children: e }), /* @__PURE__ */ (0, V.jsx)("dd", { children: t || "—" })] }, e))
				}), /* @__PURE__ */ (0, V.jsx)("div", {
					className: "hub-modal-actions",
					children: /* @__PURE__ */ (0, V.jsx)("button", {
						onClick: () => h(null),
						children: "Close"
					})
				})] }) : /* @__PURE__ */ (0, V.jsxs)("form", {
					onSubmit: (e) => {
						e.preventDefault(), je();
					},
					children: [
						/* @__PURE__ */ (0, V.jsx)("input", {
							"aria-label": m === "open" ? "Project path" : "Project name",
							maxLength: m === "open" ? void 0 : 120,
							autoComplete: "off",
							value: g,
							disabled: S,
							onChange: (e) => _(e.target.value)
						}),
						v && /* @__PURE__ */ (0, V.jsx)("p", {
							className: "hub-error",
							role: "alert",
							children: v
						}),
						/* @__PURE__ */ (0, V.jsxs)("div", {
							className: "hub-modal-actions",
							children: [/* @__PURE__ */ (0, V.jsx)("button", {
								type: "button",
								disabled: S,
								onClick: () => h(null),
								children: "Cancel"
							}), /* @__PURE__ */ (0, V.jsx)("button", {
								className: "hub-primary",
								disabled: S || !g.trim(),
								children: S ? "Working…" : m === "open" ? "Open" : m === "save-as" ? "Save" : "Create"
							})]
						})
					]
				})
			})
		]
	});
}
// ../app/web/static/js/workspace/scan.js
var qs;
function Js(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing scan callback: ${t}`);
	({applySchedulerPreferences: qs} = e);
}
function Ys(e) {
	return (e || "").split(/[\s,]+/).map((e) => e.trim()).filter((e) => e.length > 0);
}
function Xs() {
	let e = document.querySelector("input[name='nmap-scan-mode']:checked");
	return e ? String(e.value || "rfc1918_discovery") : "rfc1918_discovery";
}
function Zs(e, t = "T3") {
	let n = String(e || t).toUpperCase(), r = n.startsWith("T") ? n : `T${n}`;
	return [
		"T0",
		"T1",
		"T2",
		"T3",
		"T4",
		"T5"
	].includes(r) ? r : t;
}
function Qs(e, t = 1e3) {
	let n = parseInt(e, 10);
	return Number.isFinite(n) ? Math.min(65535, Math.max(1, n)) : t;
}
function $s() {
	let e = Xs(), t = /* @__PURE__ */ new Set();
	return e === "rfc1918_discovery" ? (L("nmap-rfc-10") && t.add("10.0.0.0/8"), L("nmap-rfc-172") && t.add("172.16.0.0/12"), L("nmap-rfc-192") && t.add("192.168.0.0/16"), Array.from(t)) : (Ys(R("nmap-targets")).forEach((e) => t.add(e)), Array.from(t));
}
function ec() {
	let e = document.getElementById("nmap-rfc-profile");
	return (e ? String(e.value || "quick").trim().toLowerCase() : "quick") === "comprehensive" ? "comprehensive" : "quick";
}
function tc(e) {
	return e === "comprehensive" ? ve : _e;
}
function nc() {
	let e = document.getElementById("nmap-rfc-chunk-concurrency"), t = parseInt(e ? String(e.value || "1").trim() : "1", 10);
	return Number.isFinite(t) ? Math.max(1, Math.min(t, 4)) : 1;
}
function rc(e) {
	if (e === "easy") {
		let e = Hr(Vr());
		return {
			discovery: L("nmap-easy-discovery"),
			skip_dns: L("nmap-easy-skip-dns"),
			force_pn: L("nmap-easy-force-pn"),
			timing: Zs(R("nmap-easy-timing"), "T3"),
			top_ports: e ? 0 : Qs(R("nmap-easy-top-ports"), 1e3),
			explicit_ports: e ? _e : "",
			service_detection: L("nmap-easy-service-detection"),
			default_scripts: L("nmap-easy-default-scripts"),
			os_detection: L("nmap-easy-os-detection"),
			aggressive: !1,
			full_ports: !1,
			vuln_scripts: !1,
			host_discovery_only: !1,
			arp_ping: !1
		};
	}
	if (e === "hard") return {
		discovery: L("nmap-hard-discovery"),
		skip_dns: L("nmap-hard-skip-dns"),
		force_pn: L("nmap-hard-force-pn"),
		timing: Zs(R("nmap-hard-timing"), "T4"),
		top_ports: Qs(R("nmap-hard-top-ports"), 1e3),
		service_detection: L("nmap-hard-service-detection"),
		default_scripts: L("nmap-hard-default-scripts"),
		os_detection: L("nmap-hard-os-detection"),
		aggressive: L("nmap-hard-aggressive"),
		full_ports: L("nmap-hard-full-ports"),
		vuln_scripts: L("nmap-hard-vuln-scripts"),
		host_discovery_only: !1,
		arp_ping: !1
	};
	let t = L("nmap-rfc-host-discovery-only"), n = ec();
	return {
		discovery: L("nmap-rfc-discovery"),
		host_discovery_only: t,
		skip_dns: L("nmap-rfc-skip-dns"),
		arp_ping: L("nmap-rfc-arp-ping"),
		force_pn: !1,
		timing: Zs(R("nmap-rfc-timing"), "T3"),
		top_ports: 0,
		explicit_ports: t ? "" : tc(n),
		scan_profile: n,
		chunk_concurrency: nc(),
		service_detection: L("nmap-rfc-service-detection"),
		default_scripts: L("nmap-rfc-default-scripts"),
		os_detection: L("nmap-rfc-os-detection"),
		aggressive: !1,
		full_ports: !1,
		vuln_scripts: !1
	};
}
function ic() {
	return [
		L("nmap-rfc-10"),
		L("nmap-rfc-172"),
		L("nmap-rfc-192")
	].filter(Boolean).length;
}
function ac(e) {
	[
		"nmap-rfc-10",
		"nmap-rfc-172",
		"nmap-rfc-192"
	].forEach((t) => {
		let n = document.getElementById(t);
		n && (n.disabled = !e);
	});
}
function oc(e) {
	e === "rfc1918_discovery" ? (Le("nmap-rfc-discovery", !0), Le("nmap-rfc-host-discovery-only", !0), Le("nmap-rfc-arp-ping", !1), Le("nmap-rfc-skip-dns", !0), I("nmap-rfc-timing", "T3"), I("nmap-rfc-profile", "quick"), I("nmap-rfc-chunk-concurrency", "1"), Le("nmap-rfc-service-detection", !1), Le("nmap-rfc-default-scripts", !1), Le("nmap-rfc-os-detection", !1), Le("nmap-rfc-force-pn", !1), Le("nmap-rfc-10", !0), Le("nmap-rfc-172", !0), Le("nmap-rfc-192", !0), ac(!0)) : (Le("nmap-rfc-10", !1), Le("nmap-rfc-172", !1), Le("nmap-rfc-192", !1), Le("nmap-rfc-force-pn", !1), ac(!1));
}
function sc(e) {
	let t = document.getElementById(e);
	if (!t || t.disabled) return !0;
	let n = String(t.value || "").trim();
	if (!n) return !1;
	let r = parseInt(n, 10);
	return Number.isInteger(r) && r >= 1 && r <= 65535;
}
function cc() {
	let e = Xs();
	if (e === "passive_capture") {
		if (!Ur(Vr())) return {
			valid: !1,
			reason: "Passive Capture is available only for internal engagement presets."
		};
		if (!String(R("passive-capture-interface") || "").trim()) return {
			valid: !1,
			reason: "Select a capture interface."
		};
		let e = Wr();
		return [
			5,
			15,
			30,
			45,
			60,
			75,
			90,
			105,
			120
		].includes(e) ? {
			valid: !0,
			reason: ""
		} : {
			valid: !1,
			reason: "Select a valid capture duration."
		};
	}
	let t = (e === "rfc1918_discovery" ? [] : Ys(R("nmap-targets"))).length > 0, n = e === "rfc1918_discovery" && ic() > 0;
	return !t && !n ? {
		valid: !1,
		reason: "Add targets, or select RFC1918 ranges in RFC1918 mode."
	} : $s().length ? e === "easy" ? !Hr(Vr()) && !sc("nmap-easy-top-ports") ? {
		valid: !1,
		reason: "Easy mode Top Ports must be 1-65535."
	} : {
		valid: !0,
		reason: ""
	} : e === "hard" && !L("nmap-hard-full-ports") && !sc("nmap-hard-top-ports") ? {
		valid: !1,
		reason: "Hard mode Top Ports must be 1-65535 when full scan is disabled."
	} : {
		valid: !0,
		reason: ""
	} : {
		valid: !1,
		reason: "Provide at least one target."
	};
}
function lc() {
	let e = document.getElementById("nmap-scan-button");
	if (!e) return;
	let t = cc(), n = !ke.postSubmitLock;
	e.disabled = !t.valid || !n, e.title = n ? t.valid ? "" : t.reason : "Enter scan inputs to enable this action.";
}
function uc(e) {
	let t = String(e || "").trim();
	return t ? (t.match(/(?:[^\s"'`]+|"[^"]*"|'[^']*')+/g) || []).map((e) => e.trim()).map((e) => e.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")).filter((e) => e.length > 0) : [];
}
function dc(e) {
	return (e || []).map((e) => {
		let t = String(e ?? "");
		return t ? /^[A-Za-z0-9_./:=@-]+$/.test(t) ? t : `'${t.replace(/'/g, "'\\''")}'` : "''";
	}).join(" ");
}
function fc() {
	let e = document.getElementById("nmap-command-preview");
	if (!e) return;
	let t = Xs(), n = document.getElementById("nmap-scan-button"), r = document.getElementById("nmap-run-actions-label"), i = document.getElementById("nmap-args-label");
	if (n && (n.textContent = t === "passive_capture" ? "Start Passive Capture Job" : "Start Nmap Scan Job"), r && (r.lastChild.textContent = t === "passive_capture" ? " Run scripted actions after spawned Easy scans" : " Run scripted actions after scan"), i && (i.hidden = t === "passive_capture"), t === "passive_capture") {
		e.textContent = `Command Preview: ${dc([
			"tshark",
			"-i",
			String(R("passive-capture-interface") || "<interface>").trim() || "<interface>",
			"-n",
			"-q",
			"-a",
			`duration:${Wr() * 60}`,
			"-f",
			"arp or broadcast or multicast or udp port 67 or udp port 68 or udp port 137 or udp port 138 or udp port 5353 or udp port 5355 or udp port 1900",
			"-w",
			"<output_prefix>.pcapng"
		])}  |  Then queue Easy scans for discovered internal networks`, lc();
		return;
	}
	let a = $s(), o = rc(t), s = uc(R("nmap-args").trim()), c = s.some((e) => {
		let t = String(e || "").trim().toLowerCase();
		return t === "--stats-every" || t.startsWith("--stats-every=");
	}), l = s.some((e) => {
		let t = String(e || "").trim().toLowerCase();
		return t === "-v" || t === "-vv" || t === "-vvv" || t === "--verbose";
	}), u = a.length ? a : ["<targets>"], d = ["nmap"];
	o.host_discovery_only ? (d.push("-sn"), o.skip_dns && d.push("-n"), o.arp_ping && d.push("-PR"), d.push(`-${Zs(o.timing, "T3")}`)) : ((o.force_pn || !o.discovery) && d.push("-Pn"), o.skip_dns && d.push("-n"), d.push(`-${Zs(o.timing, "T3")}`), o.full_ports ? d.push("-p-") : String(o.explicit_ports || "").trim() ? d.push("-p", String(o.explicit_ports || "").trim()) : d.push("--top-ports", String(Qs(o.top_ports, 1e3))), o.aggressive ? d.push("-A") : (o.service_detection && d.push("-sV"), o.default_scripts && d.push("-sC"), o.os_detection && d.push("-O")), o.vuln_scripts && d.push("--script", "vuln"));
	let f = c ? s : [
		...s,
		"--stats-every",
		"15s"
	];
	l || (f = [...f, "-vv"]), d.push(...f, ...u, "-oA", "<output_prefix>"), e.textContent = `Command Preview: ${dc(d)}`, lc();
}
function pc() {
	let e = Vr(), t = Hr(e), n = e !== ke.lastEngagementPreset, r = document.getElementById("nmap-easy-top-ports"), i = document.getElementById("nmap-easy-top-ports-label"), a = document.getElementById("nmap-easy-preset-note"), o = document.getElementById("nmap-easy-service-detection"), s = document.getElementById("nmap-easy-default-scripts");
	n && (o && (o.checked = !t), s && (s.checked = !t)), r && (r.disabled = t), i && (i.hidden = t), a && (a.hidden = !t, a.textContent = t ? `Internal Quick Recon uses a curated TCP port list instead of Top Ports: ${_e}. Add UDP-specific follow-up separately if needed.` : ""), ke.lastEngagementPreset = e;
}
function mc(e) {
	let t = Math.max(1, Math.min(4, parseInt(e, 10) || 1));
	ke.step = t, [
		1,
		2,
		3,
		4
	].forEach((e) => {
		let n = document.getElementById(`nmap-wizard-indicator-${e}`);
		n && n.classList.toggle("is-active", e === t);
		let r = document.getElementById(`nmap-wizard-step-${e}`);
		r && r.classList.toggle("is-active", e === t);
	});
	let n = document.getElementById("nmap-wizard-back"), r = document.getElementById("nmap-wizard-next");
	n && (n.disabled = t <= 1), r && (r.disabled = t >= 4, r.style.display = t >= 4 ? "none" : ""), lc();
}
function hc() {
	let e = Xs();
	e !== ke.lastMode && (oc(e), ke.lastMode = e), document.querySelectorAll("[data-mode-options]").forEach((t) => {
		let n = String(t.getAttribute("data-mode-options") || "");
		t.classList.toggle("is-active", n === e);
	});
	let t = document.getElementById("nmap-standard-target-controls");
	t && (t.hidden = e === "passive_capture" || e === "rfc1918_discovery");
	let n = document.getElementById("nmap-passive-target-controls");
	n && (n.hidden = e !== "passive_capture");
	let r = document.getElementById("nmap-rfc-target-controls");
	r && (r.hidden = e !== "rfc1918_discovery");
	let i = document.getElementById("nmap-hard-top-ports");
	i && (i.disabled = L("nmap-hard-full-ports"));
	let a = L("nmap-rfc-host-discovery-only"), o = document.getElementById("nmap-rfc-discovery");
	o && (o.checked = !0, o.disabled = e === "rfc1918_discovery");
	let s = document.getElementById("nmap-rfc-force-pn");
	s && (s.checked = !1, s.disabled = !0), [
		"nmap-rfc-profile",
		"nmap-rfc-service-detection",
		"nmap-rfc-default-scripts",
		"nmap-rfc-os-detection"
	].forEach((e) => {
		let t = document.getElementById(e);
		t && (t.disabled = a);
	});
	let c = document.getElementById("nmap-rfc-profile-note");
	if (c) {
		let e = ec(), t = nc(), n = e === "comprehensive" ? "More comprehensive uses a broader common-internal-services TCP list" : "Quick uses the curated low-hanging-fruit TCP list", r = tc(e), i = `${t} chunk scan${t === 1 ? "" : "s"} at a time`;
		c.textContent = a ? `${n}. RFC sweeps run in /24 chunks, up to 2 subnets per Nmap run, with ${i}. Disable discovery-only to scan responsive hosts on: ${r}.` : `${n}. RFC sweeps run in /24 chunks, up to 2 subnets per Nmap run, with ${i}: ${r}.`;
	}
	let l = document.getElementById("passive-capture-interface-note"), u = document.getElementById("passive-capture-interface");
	if (e === "passive_capture" && u && l) {
		let e = u.options[u.selectedIndex];
		if (e) {
			let t = String(e.dataset.networks || "").trim();
			l.textContent = t ? `Connected networks: ${t}` : "Passive capture will watch discovery traffic on the selected interface.";
		}
	}
	pc(), fc(), lc();
}
async function gc() {
	if (ke.postSubmitLock) {
		z("Scan failed: enter scan inputs before starting a job.", !0), lc();
		return;
	}
	let e = cc();
	if (!e.valid) {
		z(`Scan failed: ${e.reason}`, !0);
		let t = String(e.reason || "").toLowerCase();
		t.includes("target") || t.includes("rfc1918") || t.includes("interface") ? mc(3) : mc(4);
		return;
	}
	let t = $s(), n = Xs(), r = rc(n), i = !!r.discovery, a = Gr(Vr(), { fallbackGoalProfile: R("scheduler-goal-select") || "internal_recon" });
	z("Queueing Nmap scan job...");
	try {
		let e = await Xe("/api/scheduler/preferences", {
			engagement_policy: a,
			goal_profile: Mr(a)
		});
		qs(e);
		let o = (n === "passive_capture" ? await Xe("/api/scan/passive-capture", {
			interface_name: R("passive-capture-interface").trim(),
			duration_minutes: Wr(),
			run_actions: L("nmap-run-actions"),
			scan_mode: n
		}) : await Xe("/api/nmap/scan", {
			targets: t,
			discovery: i,
			staged: !1,
			run_actions: L("nmap-run-actions"),
			nmap_path: "nmap",
			nmap_args: R("nmap-args").trim(),
			scan_mode: n,
			scan_options: r
		}))?.job?.id;
		z(o ? `${n === "passive_capture" ? "Passive capture" : "Nmap scan"} queued (job ${o})` : n === "passive_capture" ? "Passive capture queued" : "Nmap scan queued"), ri(), I("nmap-targets", ""), ke.postSubmitLock = !0, mc(1), fc(), lc(), await q();
	} catch (e) {
		z(`Scan failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/tool_settings.js
var _c;
function vc(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing tool_settings callback: ${t}`);
	({applySchedulerPreferences: _c} = e);
}
function yc(e, t = !1) {
	let n = document.getElementById("settings-tool-audit-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function bc(e, t = !1) {
	let n = document.getElementById("settings-tool-install-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function xc(e, t = !1) {
	let n = document.getElementById("interface-settings-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function Sc(e) {
	let t = document.querySelector(".logo-watermark");
	if (!e) {
		t && t.remove();
		return;
	}
	let n = String(window.LEGION_CONSOLE_LOGO_ART || "");
	if (!n.trim() || t) return;
	let r = document.querySelector(".shell");
	if (!r || !r.parentNode) return;
	let i = document.createElement("div");
	i.className = "logo-watermark", i.setAttribute("aria-hidden", "true");
	let a = document.createElement("pre");
	a.textContent = n, i.appendChild(a), r.parentNode.insertBefore(i, r);
}
function Cc(e) {
	let t = !!e;
	window.LEGION_COLORFUL_ASCII_BACKGROUND_ENABLED = t, document.body?.classList.toggle("colorful-background", t), Le("interface-colorful-ascii-background", t), Sc(t);
}
function wc(e) {
	let t = !!e, n = document.getElementById("graph-workspace-panel"), r = document.getElementById("graph-workspace-shell"), i = document.getElementById("graph-workspace-disabled-state");
	n && (n.dataset.graphEnabled = t ? "true" : "false", n.hidden = !t), r && (r.hidden = !t), i && (i.hidden = t), Le("interface-graph-workspace-enabled", t), t ? to({ background: !1 }).catch(() => {}) : (k.loading = !1, pa());
}
function Tc() {
	return A.recommendedPlatform;
}
function Ec(e) {
	A.plan = e || null;
	let t = e || {}, n = String(t?.script || "");
	I("settings-tool-install-script", n);
	let r = Number(t?.command_count || 0), i = Number(t?.manual_count || 0), a = String(t?.platform || Tc() || "this system"), o = ["kali", "ubuntu"].includes(Tc());
	if (document.getElementById("settings-tool-install-run-button").disabled = !o || !e || r === 0, document.getElementById("settings-tool-install-copy-button").disabled = !n.trim(), !r && !i) {
		bc(`No missing tool installs are queued for ${a}.`);
		return;
	}
	let s = `${r} install command${r === 1 ? "" : "s"} queued for ${a}`;
	i > 0 && (s += `; ${i} tool${i === 1 ? "" : "s"} still require manual follow-up`), bc(s);
}
function Dc(e) {
	let t = document.getElementById("settings-tool-audit-body");
	if (!t) return;
	let n = Array.isArray(e) ? e : [];
	t.innerHTML = n.length ? n.map((e) => {
		let t = String(e?.status || "unknown"), n = e?.resolved_path || e?.configured_value || "-", r = t === "installed" ? "tool-audit-status-ok" : t === "configured-missing" ? "tool-audit-status-warn" : "tool-audit-status-missing";
		return `
            <tr>
                <td>
                    <strong>${ze(e?.label || e?.key || "tool")}</strong>
                    <div class="meta-note">${ze(e?.purpose || "")}</div>
                    ${e?.notes ? `<div class="meta-note">${ze(e.notes)}</div>` : ""}
                </td>
                <td>${ze(e?.category || "")}</td>
                <td><span class="${r}">${ze(t)}</span></td>
                <td><code>${ze(n)}</code></td>
                <td><code>${ze(e?.[`${Tc()}_install`] || "-")}</code></td>
            </tr>
        `;
	}).join("") : "<tr><td colspan=\"5\" class=\"empty-cell\">No tool audit data.</td></tr>";
}
async function Oc() {
	yc("Checking tools...");
	try {
		let e = await Ze("/api/settings/tool-audit"), t = String(e?.recommended_platform || "").trim().toLowerCase();
		A.recommendedPlatform = ["kali", "ubuntu"].includes(t) ? t : "", Dc(e?.tools || []), A.supportedPlatforms = Array.isArray(e?.supported_platforms) && e.supported_platforms.length ? e.supported_platforms : ["kali", "ubuntu"];
		let n = e?.summary || {};
		yc(`Installed ${n.installed || 0}/${n.total || 0}; missing ${n.missing || 0}; configured missing ${n.configured_missing || 0}`), await kc(!1);
	} catch (e) {
		Dc([]), Ec(null), yc(`Tool audit failed: ${e.message}`, !0), bc(`Install plan unavailable: ${e.message}`, !0);
	}
}
async function kc(e = !0) {
	e && bc("Building install plan...");
	try {
		if (!Tc()) throw Error("Automatic installation supports Kali and Ubuntu only.");
		Ec(await Ze("/api/settings/tool-audit/install-plan?scope=missing") || {});
	} catch (e) {
		Ec(null), bc(`Install plan failed: ${e.message}`, !0);
	}
}
async function Ac() {
	let e = String(R("settings-tool-install-script") || "");
	if (e.trim() || (await kc(!1), e = String(R("settings-tool-install-script") || "")), !e.trim()) bc("No install script is available to copy.", !0);
	else try {
		if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(e);
		else {
			let t = document.createElement("textarea");
			t.value = e, t.setAttribute("readonly", "readonly"), t.style.position = "absolute", t.style.left = "-9999px", document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t);
		}
		bc("Install script copied to clipboard.");
	} catch (e) {
		bc(`Copy failed: ${e.message}`, !0);
	}
}
async function jc() {
	bc("Queueing install job...");
	try {
		if (!Tc()) throw Error("Automatic installation supports Kali and Ubuntu only.");
		let e = await Xe("/api/settings/tool-audit/install", { scope: "missing" }), t = Number(e?.job?.id || 0);
		bc(t > 0 ? `Install queued as job #${t}. Use Logging > Jobs to monitor progress.` : "Install job queued. Use Logging > Jobs to monitor progress.");
	} catch (e) {
		bc(`Install failed to queue: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/scheduler_preferences.js
function Mc(e = {}) {
	return {
		graph_workspace: !!e.graph_workspace,
		context_summary_enabled: e.context_summary_enabled !== !1
	};
}
function Nc(e) {
	if (!e) return;
	let t = Ar(e.engagement_policy, e.goal_profile);
	O.deviceCategoryRules = e.device_categories || [], O.builtInDeviceCategories = e.built_in_device_categories || [], F("scheduler-mode", "deterministic"), F("scheduler-goal", t.preset_label || t.preset), F("scheduler-families", e.preapproved_families_count || 0), I("scheduler-goal-select", t.preset), I("engagement-scope-select", t.scope), I("engagement-intent-select", t.intent);
	for (let [e, n] of Object.entries({
		"engagement-credential-mode": "credential_attack_mode",
		"engagement-lockout-mode": "lockout_risk_mode",
		"engagement-stability-mode": "stability_risk_mode",
		"engagement-detection-mode": "detection_risk_mode",
		"engagement-approval-mode": "approval_mode",
		"engagement-noise-budget": "noise_budget"
	})) I(e, t[n]);
	Le("engagement-allow-exploitation", t.allow_exploitation), Le("engagement-allow-lateral", t.allow_lateral_movement);
	for (let t of [
		"max_concurrency",
		"max_host_concurrency",
		"max_jobs"
	]) I({
		max_concurrency: "scheduler-concurrency-input",
		max_host_concurrency: "scheduler-host-concurrency-input",
		max_jobs: "scheduler-max-jobs-input"
	}[t], e[t]);
	document.querySelectorAll(".danger-group input[value]").forEach((t) => {
		t.checked = (e.dangerous_categories || []).includes(t.value);
	}), wc(!!e.feature_flags?.graph_workspace), Pc(), Er();
}
function Pc() {
	let e = String(R("scheduler-goal-select") || "internal_recon").trim().toLowerCase(), t = e === "custom", n = t ? {
		scope: R("engagement-scope-select") || "internal",
		intent: R("engagement-intent-select") || "recon"
	} : kr(e);
	t || (I("engagement-scope-select", n.scope || "internal"), I("engagement-intent-select", n.intent || "recon")), F("engagement-derived-scope", n.scope || "internal"), F("engagement-derived-intent", n.intent || "recon");
	let r = document.getElementById("engagement-preset-summary");
	r && (r.textContent = Nr(e, t));
	let i = document.getElementById("engagement-custom-scope-label"), a = document.getElementById("engagement-custom-intent-label"), o = document.getElementById("engagement-custom-note"), s = document.getElementById("engagement-scope-select"), c = document.getElementById("engagement-intent-select");
	[
		i,
		a,
		o
	].forEach((e) => {
		e && (e.hidden = !t);
	}), s && (s.disabled = !t), c && (c.disabled = !t), pc(), document.getElementById("nmap-command-preview") && fc();
}
function Fc() {
	return {
		engagement_policy: Ar({
			preset: R("scheduler-goal-select"),
			scope: R("engagement-scope-select"),
			intent: R("engagement-intent-select"),
			allow_exploitation: L("engagement-allow-exploitation"),
			allow_lateral_movement: L("engagement-allow-lateral"),
			credential_attack_mode: R("engagement-credential-mode"),
			lockout_risk_mode: R("engagement-lockout-mode"),
			stability_risk_mode: R("engagement-stability-mode"),
			detection_risk_mode: R("engagement-detection-mode"),
			approval_mode: R("engagement-approval-mode"),
			noise_budget: R("engagement-noise-budget")
		}),
		max_concurrency: Number(R("scheduler-concurrency-input") || 1),
		max_host_concurrency: Number(R("scheduler-host-concurrency-input") || 1),
		max_jobs: Number(R("scheduler-max-jobs-input") || 200),
		dangerous_categories: [...document.querySelectorAll(".danger-group input[value]:checked")].map((e) => e.value)
	};
}
async function Ic() {
	try {
		Nc(await Ze("/api/scheduler/preferences"));
	} catch (e) {
		z(`Settings: ${e.message}`, !0);
	}
}
async function Lc(e) {
	e?.preventDefault();
	try {
		Nc(await Xe("/api/scheduler/preferences", Fc())), F("scheduler-save-status", "Saved");
	} catch (e) {
		F("scheduler-save-status", e.message);
	}
}
// ../app/web/static/js/workspace/controller.js
var Rc = class {
	connect() {
		this.connected ||= (Cr({ applySchedulerPreferences: Nc }), Qr({
			openManualToolPicker: oa,
			pollSnapshot: q
		}), zt({
			graphRenderWorkspace: Qa,
			graphSyncDetailPresentation: ga
		}), fa({ graphRenderWorkspace: Qa }), Ni({ pollSnapshot: q }), In({
			closeRibbonMenus: hi,
			graphLoadSnapshot: to,
			loadHostDetail: yr,
			loadWorkspaceHosts: gr,
			loadWorkspaceServices: _r,
			renderHosts: lo,
			renderServices: fo
		}), Js({ applySchedulerPreferences: Nc }), zr({
			applyNmapModeTargetDefaults: oc,
			refreshNmapModeOptions: hc,
			refreshNmapScanButtonState: lc,
			setNmapWizardStep: mc,
			updateNmapCommandPreview: fc
		}), vc({ applySchedulerPreferences: Nc }), Zi({ pollSnapshot: q }), pr({
			graphLoadSnapshot: to,
			renderHosts: lo,
			renderServices: fo,
			renderTools: vo
		}), !0);
	}
};
// ../app/web/static/js/workspace/graph_actions.js
function zc(e) {
	let t = (k.layouts || []).find((t) => String(t?.layout_id || "") === String(e || ""));
	k.activeLayoutId = String(t?.layout_id || ""), k.positions = t?.layout?.positions && typeof t.layout.positions == "object" ? { ...t.layout.positions } : {}, k.pinnedNodeIds = t?.layout?.pinned_node_ids && typeof t.layout.pinned_node_ids == "object" ? { ...t.layout.pinned_node_ids } : {}, t?.layout?.group_by && I("graph-group-select", t.layout.group_by), t?.name && I("graph-layout-name", t.name), gn(), Qa();
}
function Bc() {
	let e = Xa(k.data), t = /* @__PURE__ */ new Map();
	if ((e.nodes || []).forEach((n) => {
		let r = wa(n, k.groupBy || mn().defaultGroup || "subnet", Ca(e.nodes)) || "other";
		t.has(r) || t.set(r, []), t.get(r).push(n);
	}), !Array.isArray(e?.nodes) || !e.nodes.length || !t.size) {
		U("No graph nodes are available to tidy.", !0);
		return;
	}
	let n = Fa(e.nodes, e.edges, t, k.groupBy || mn().defaultGroup || "subnet", {});
	Object.entries(n.positions || {}).forEach(([e, t]) => {
		k.positions[e] = {
			x: Number(t?.x) || 0,
			y: Number(t?.y) || 0
		};
	}), Qa({ preserveDetail: !0 }), U(`Layout tidied for ${e.nodes.length} nodes across ${(n.groups || []).length} groups`);
}
function Vc() {
	if (k.selectedKind !== "node" || !k.selectedRef) {
		U("Select a node or summary before focusing the neighborhood.", !0), ya();
		return;
	}
	let e = Kt(), t = Ia(e);
	t.length ? (k.focusSeedNodeIds = t, k.focusSeedLabel = String(e?.label || e?.node_id || "selection"), k.focusDepth = Math.max(1, Math.min(3, parseInt(R("graph-focus-depth-select"), 10) || k.focusDepth || 1)), W(e, "summary_kind") && (k.selectedKind = "node", k.selectedRef = t[0]), Qa(), ya(), U(`Focused ${k.focusDepth}-hop neighborhood around ${k.focusSeedLabel}`)) : (U("The selected graph node cannot be focused.", !0), ya());
}
function Hc() {
	k.focusSeedNodeIds.length ? (k.focusSeedNodeIds = [], k.focusSeedLabel = "", Qa(), ya(), U("Graph focus cleared")) : (U("No graph focus is active.", !0), ya());
}
function Uc() {
	if (k.selectedKind !== "node" || !k.selectedRef) {
		U("Select a summary node before expanding it.", !0), ya();
		return;
	}
	let e = Kt();
	if (!W(e, "summary_kind")) {
		U("Selected node is already expanded.", !0), ya();
		return;
	}
	let t = String(e?.node_id || "");
	k.expandedSummaryIds[t] ? (delete k.expandedSummaryIds[t], k.selectedKind = "node", k.selectedRef = t, k.selectedPayload = null, U(`Collapsed ${e.label || t}`)) : (k.expandedSummaryIds[t] = !0, k.selectedKind = "node", k.selectedRef = t, k.selectedPayload = e, U(`Expanded ${e.label || t}`)), Qa(), ya();
}
function Wc() {
	let e = Kt(), t = String(e?.node_id || "");
	!W(e, "summary_kind") || !t || !k.expandedSummaryIds[t] ? (U("Select an expanded summary cluster to collapse.", !0), ya()) : (delete k.expandedSummaryIds[t], k.selectedKind = "node", k.selectedRef = t, k.selectedPayload = null, Qa(), ya(), U(`Collapsed ${e.label || t}`));
}
async function Gc() {
	let e = String(R("graph-view-select") || k.viewId || "attack_surface").trim(), t = String(R("graph-layout-name") || "default").trim() || "default", n = String(k.activeLayoutId || ""), r = {
		positions: k.filtered?.positions && typeof k.filtered.positions == "object" ? k.filtered.positions : k.positions,
		pinned_node_ids: k.pinnedNodeIds,
		group_by: String(R("graph-group-select") || k.groupBy || mn().defaultGroup || "subnet").trim(),
		filters: {
			view_id: e,
			host_id: R("graph-host-filter"),
			node_type: R("graph-node-type-filter"),
			edge_type: R("graph-edge-type-filter"),
			source_kind: R("graph-source-kind-filter"),
			severity: R("graph-severity-filter"),
			pack: R("graph-pack-filter"),
			time_window: R("graph-time-window-filter"),
			hide_ai_suggested: L("graph-hide-ai-suggested"),
			hide_nmap_xml_artifacts: L("graph-hide-nmap-xml-artifacts"),
			min_confidence: R("graph-min-confidence")
		}
	};
	try {
		let i = (await Xe("/api/graph/layouts", {
			layout_id: n,
			view_id: e,
			name: t,
			layout: r
		}))?.layout || {};
		k.layouts = (k.layouts || []).filter((e) => String(e?.layout_id || "") !== String(i.layout_id || "")), k.layouts.push(i), k.activeLayoutId = String(i.layout_id || ""), gn(), I("graph-layout-select", k.activeLayoutId), U(`Layout saved: ${i.name || t}`);
	} catch (e) {
		U(`Layout save failed: ${e.message}`, !0);
	}
}
function Kc() {
	k.activeLayoutId = "", k.positions = {}, k.pinnedNodeIds = {}, I("graph-layout-select", ""), Qa(), U("Layout reset");
}
async function qc() {
	let e = String(k.selectedKind || ""), t = String(k.selectedRef || ""), n = String(R("graph-note-input") || "").trim();
	if (!e || !t) U("Select a node or edge before saving a note.", !0);
	else if (!n) U("Note text is required.", !0);
	else try {
		let r = (await Xe("/api/graph/annotations", {
			target_kind: e,
			target_ref: t,
			body: n,
			created_by: "web-operator",
			source_ref: `graph-workspace:${k.viewId}`
		}))?.annotation || {};
		k.annotations = (k.annotations || []).filter((e) => String(e?.annotation_id || "") !== String(r.annotation_id || "")), k.annotations.push(r), I("graph-note-input", ""), si(!1), ba(), U("Note saved");
	} catch (e) {
		U(`Note save failed: ${e.message}`, !0);
	}
}
function Jc() {
	let e = String(k.selectedKind || ""), t = String(k.selectedRef || "");
	if (!e || !t) {
		U("Select a node or edge before adding a note.", !0);
		return;
	}
	let n = It(e === "node" ? "node" : "edge", t), r = String(n?.label || n?.edge_id || t || "").trim() || "selected item";
	F("graph-note-modal-target", `Target: ${en(e)} | ${r}`), ni(!0);
}
function Yc() {
	let e = k.selectedKind === "node" ? It("node", k.selectedRef) : null;
	if (!e) {
		U("Select a node to pin or unpin.", !0);
		return;
	}
	let t = String(e.node_id || "");
	if (k.pinnedNodeIds[t]) delete k.pinnedNodeIds[t], U(`Node unpinned: ${e.label || t}`);
	else {
		let n = k.filtered.positions?.[t] || k.positions?.[t];
		n && (k.positions[t] = {
			x: n.x,
			y: n.y
		}), k.pinnedNodeIds[t] = !0, U(`Node pinned: ${e.label || t}`);
	}
	Qa();
}
// ../app/web/static/js/workspace/interface_settings.js
function Xc(e) {
	let t = document.getElementById("interface-settings-modal");
	t && (P.interfaceSettingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
async function Zc() {
	xc("Loading interface settings...");
	try {
		let [e, t] = await Promise.all([Ze("/api/scheduler/preferences"), Ze("/api/settings/display")]), n = Mc(e?.feature_flags).graph_workspace;
		Le("interface-graph-workspace-enabled", n), Le("interface-colorful-ascii-background", !!t?.colorful_ascii_background), xc("Interface settings loaded");
	} catch (e) {
		xc(`Load failed: ${e.message}`, !0);
	}
}
async function Qc() {
	let e = L("interface-graph-workspace-enabled"), t = L("interface-colorful-ascii-background");
	xc("Saving interface settings...");
	try {
		let [n, r] = await Promise.all([Xe("/api/scheduler/preferences", { feature_flags: { graph_workspace: e } }), Xe("/api/settings/display", { colorful_ascii_background: t })]);
		Nc(n), Cc(!!r?.colorful_ascii_background), xc("Interface settings saved");
	} catch (e) {
		xc(`Save failed: ${e.message}`, !0);
	}
}
async function $c() {
	hi(), pi(!0), await Promise.allSettled([Oc()]);
}
function el() {
	pi(!1);
}
async function tl() {
	hi(), Xc(!0), await Zc();
}
function nl() {
	Xc(!1);
}
// ../app/web/static/js/workspace/projects.js
async function rl() {
	hi();
	let e = R("project-open-path").trim();
	if (!e) {
		let t = window.prompt("Enter existing project path (.legion):", "");
		if (e = String(t || "").trim(), !e) return;
		I("project-open-path", e);
	}
	await Cl();
}
async function il(e = !1) {
	hi();
	let t = R("project-save-path").trim();
	if (e || !t) {
		let e = String(R("project-name") || "").trim(), n = window.prompt("Enter destination path (.legion):", e);
		if (t = String(n || "").trim(), !t) return;
		I("project-save-path", t);
	}
	await wl();
}
async function al() {
	hi(), R("project-save-path").trim() ? await wl() : z("Save failed: no destination path is set. Use Save As.", !0);
}
async function ol() {
	await il(!0);
}
function sl() {
	hi(), window.location.assign(`/api/project/download-zip?t=${Date.now()}`);
}
async function cl() {
	hi(), await yl("restoring a workspace bundle", async () => {
		let e = document.getElementById("project-restore-zip-file");
		e ? (e.value = "", e.click()) : z("Restore failed: ZIP input control missing.", !0);
	});
}
async function ll(e) {
	let t = e?.target, n = t?.files && t.files.length ? t.files[0] : null;
	if (n) {
		z(`Uploading restore bundle (${n.name})...`);
		try {
			let e = new FormData();
			e.append("bundle", n, n.name || "workspace.zip");
			let t = await fetch("/api/project/restore-zip", {
				method: "POST",
				body: e
			}), r = {};
			try {
				r = await t.json();
			} catch {}
			if (!t.ok) {
				let e = r.error || `Request failed (${t.status})`;
				throw Error(e);
			}
			let i = Number(r?.job?.id || 0);
			if (i > 0) {
				z(`Restore queued (job ${i})...`);
				let e = await hr(i, 12e5, 1500), t = String(e?.result?.project?.name || "").trim();
				t && (I("project-save-path", t), I("project-open-path", t));
			}
			z("Workspace restored"), oo({ clearProjectPaths: !1 }), await br(), await Promise.all([q(), Ft()]);
		} catch (e) {
			z(`Restore failed: ${e.message}`, !0);
		} finally {
			t && (t.value = "");
		}
	}
}
async function ul() {
	hi();
	let e = R("nmap-xml-path").trim();
	if (!e) {
		let t = window.prompt("Enter Nmap XML path:", "");
		if (e = String(t || "").trim(), !e) return;
		I("nmap-xml-path", e);
	}
	Le("nmap-xml-run-actions", window.confirm("Run scripted actions after XML import?")), await Tl();
}
function dl(e) {
	let t = document.getElementById("workspace-switch-guard-modal");
	t && (Ae.modalOpen = !!e, P.workspaceSwitchGuardOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function fl(e, t = !1) {
	let n = document.getElementById("workspace-switch-guard-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function pl() {
	Ae.busy = !1, Ae.pendingAction = null, Ae.pendingLabel = "", Ae.latestSummary = null, fl("Stop running jobs and processes before switching workspaces."), F("workspace-switch-guard-summary", "No active work detected."), F("workspace-switch-guard-details", ""), dl(!1);
}
async function ml() {
	let [e, t] = await Promise.all([Ze("/api/jobs?limit=500"), Ze("/api/processes?limit=500")]), n = Array.isArray(e?.jobs) ? e.jobs : [], r = Array.isArray(t?.processes) ? t.processes : [];
	return {
		jobs: n.filter((e) => {
			let t = String(e?.status || "").trim().toLowerCase();
			return t === "queued" || t === "running";
		}),
		processes: r.filter((e) => {
			let t = String(e?.status || "").trim().toLowerCase();
			return t === "running" || t === "waiting";
		})
	};
}
function hl(e) {
	let t = Array.isArray(e?.jobs) ? e.jobs : [], n = Array.isArray(e?.processes) ? e.processes : [], r = [];
	return t.slice(0, 6).forEach((e) => {
		r.push(`Job ${e.id} | ${e.type || "job"} | ${e.status || ""}`);
	}), n.slice(0, 8).forEach((e) => {
		r.push(`Process ${e.id} | ${e.name || "process"} | ${e.hostIp || ""}${e.port ? `:${e.port}/${e.protocol || "tcp"}` : ""} | ${e.status || ""}`);
	}), (t.length > 6 || n.length > 8) && r.push("..."), r.join("\n");
}
function gl(e, t, n) {
	Ae.pendingAction = n, Ae.pendingLabel = String(t || "switch workspaces"), Ae.latestSummary = e;
	let r = Array.isArray(e?.jobs) ? e.jobs.length : 0, i = Array.isArray(e?.processes) ? e.processes.length : 0;
	fl("Active work must be stopped before switching workspaces."), F("workspace-switch-guard-summary", `${r} active job${r === 1 ? "" : "s"} and ${i} active process${i === 1 ? "" : "es"} detected before ${Ae.pendingLabel}.`), F("workspace-switch-guard-details", hl(e)), dl(!0);
}
async function _l(e = 2e4) {
	let t = Date.now() + Math.max(1e3, Number(e) || 2e4);
	for (; Date.now() < t;) {
		let e = await ml();
		if (!e.jobs.length && !e.processes.length) return e;
		await new Promise((e) => window.setTimeout(e, 600));
	}
	throw Error("Timed out waiting for running jobs and processes to stop.");
}
async function vl() {
	if (!Ae.busy) {
		Ae.busy = !0, fl("Stopping active jobs and processes...");
		try {
			let e = await ml();
			for (let t of e.jobs) {
				let e = Number(t?.id || 0);
				e > 0 && await Xe(`/api/jobs/${e}/stop`, {});
			}
			for (let t of e.processes) {
				let e = Number(t?.id || 0);
				if (e > 0) try {
					await Xe(`/api/processes/${e}/kill`, {});
				} catch {}
			}
			await _l(), await q();
			let t = Ae.pendingAction;
			pl(), typeof t == "function" && await t();
		} catch (e) {
			Ae.busy = !1, fl(`Stop failed: ${e.message}`, !0);
		}
	}
}
async function yl(e, t) {
	let n = await ml();
	n.jobs.length || n.processes.length ? gl(n, e, t) : await t();
}
async function bl() {
	z("Creating temporary project...");
	let e = await Xe("/api/project/new-temp", {});
	z("Created temporary project"), oo({ clearProjectPaths: !0 }), Be(e?.project || {}), await br(), await Promise.all([q(), Ft()]);
}
async function xl() {
	try {
		await yl("creating a new workspace", bl);
	} catch (e) {
		if (String(e?.message || "").toLowerCase().includes("jobs/scans are active")) {
			await yl("creating a new workspace", bl);
			return;
		}
		z(`Create failed: ${e.message}`, !0);
	}
}
async function Sl() {
	let e = R("project-open-path").trim();
	if (!e) {
		z("Open failed: project path is required", !0);
		return;
	}
	z("Opening project...");
	let t = await Xe("/api/project/open", { path: e });
	z("Project opened"), oo({ clearProjectPaths: !1 }), I("project-save-path", ""), Be(t?.project || {}), await br(), await Promise.all([q(), Ft()]);
}
async function Cl() {
	try {
		await yl("opening a workspace", Sl);
	} catch (e) {
		if (String(e?.message || "").toLowerCase().includes("jobs/scans are active")) {
			await yl("opening a workspace", Sl);
			return;
		}
		z(`Open failed: ${e.message}`, !0);
	}
}
async function wl() {
	let e = R("project-save-path").trim();
	if (!e) z("Save failed: destination path is required", !0);
	else {
		z("Saving project...");
		try {
			let t = await Xe("/api/project/save-as", {
				path: e,
				replace: L("project-save-replace")
			}), n = Number(t?.job?.id || 0);
			n > 0 && (z(`Save queued (job ${n})...`), await hr(n, 6e5, 1500)), z("Project saved"), await q();
		} catch (e) {
			z(`Save failed: ${e.message}`, !0);
		}
	}
}
async function Tl() {
	let e = R("nmap-xml-path").trim();
	if (!e) z("Import failed: XML path is required", !0);
	else {
		z("Queueing Nmap XML import job...");
		try {
			let t = (await Xe("/api/nmap/import-xml", {
				path: e,
				run_actions: L("nmap-xml-run-actions")
			}))?.job?.id;
			z(t ? `Nmap XML import queued (job ${t})` : "Nmap XML import queued"), await q();
		} catch (e) {
			z(`Import failed: ${e.message}`, !0);
		}
	}
}
// ../app/web/static/js/workspace/events.js
function El() {
	let e = (e, t) => {
		let n = document.getElementById(e);
		n && n.addEventListener("click", t);
	};
	e("nmap-scan-button", gc), e("ribbon-workspace-new-action-button", xl), e("ribbon-workspace-open-action-button", rl), e("ribbon-workspace-save-action-button", al), e("ribbon-workspace-save-as-action-button", ol), e("ribbon-workspace-download-action-button", sl), e("ribbon-workspace-restore-action-button", cl), e("ribbon-import-xml-action-button", ul), e("hosts-reset-filter-button", rr), e("hosts-filter-show-all-button", () => Zn("show_all")), e("hosts-filter-hide-down-button", () => Zn("hide_down")), e("services-panel-toggle-button", mo), e("graph-panel-toggle-button", go), e("ribbon-scan-add-action-button", ci), e("ribbon-scan-manual-action-button", li), e("ribbon-scheduler-settings-button", _i), e("ribbon-interface-settings-button", tl), e("ribbon-device-category-settings-button", yi), e("ribbon-app-settings-button", $c), e("workspace-refresh-button", br), e("workspace-run-tool-button", la), e("workspace-run-scheduler-button", ua), e("graph-refresh-button", ro), e("graph-rebuild-button", io), e("graph-filters-toggle-button", () => ma(!k.filtersExpanded)), e("graph-focus-selection-button", Vc), e("graph-clear-focus-button", Hc), e("graph-expand-selection-button", Uc), e("graph-collapse-expanded-button", Wc), e("graph-layout-save-button", Gc), e("graph-layout-reset-button", Kc), e("graph-note-open-button", Jc), e("graph-note-save-button", qc), e("graph-note-modal-close", () => si(!1)), e("graph-note-modal-cancel", () => si(!1)), e("graph-pin-toggle-button", Yc), e("graph-detail-dock-toggle-button", va), e("graph-detail-close-button", pa), ma(k.filtersExpanded), po(!0), ho(!1);
	let t = Wt();
	t && t.addEventListener("scroll", () => {
		k.detailMode === "floating" && Gt() && ga();
	}), window.addEventListener("resize", () => {
		Bt() && Qa({ preserveDetail: !0 });
	});
	let n = document.getElementById("workspace-host-select");
	n && n.addEventListener("change", async (e) => {
		await co(e.target.value, {
			syncGraph: !0,
			preserveGraphDetail: !0
		});
	});
	let r = document.getElementById("hosts-category-filter-select");
	r && r.addEventListener("change", async (e) => {
		await Qn(e.target.value);
	});
	let i = document.getElementById("hosts-service-filter-button");
	i && i.addEventListener("click", (e) => {
		e.stopPropagation(), qn(!!document.getElementById("hosts-service-filter-popover")?.hidden);
	});
	let a = document.getElementById("hosts-service-filter-clear-button");
	a && a.addEventListener("click", async (e) => {
		e.stopPropagation(), await er([]);
	});
	let o = document.getElementById("hosts-service-filter-popover");
	o && o.addEventListener("click", (e) => {
		e.stopPropagation();
	}), document.addEventListener("click", () => {
		qn(!1);
	});
	let s = document.getElementById("services-category-filter-select");
	s && s.addEventListener("change", async (e) => {
		await tr(e.target.value);
	});
	let c = document.getElementById("workspace-tool-target-select");
	c && c.addEventListener("change", async () => {
		await sa();
	}), ["workspace-tool-port", "workspace-tool-protocol"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", async () => {
			await ca();
		});
	});
	let l = document.getElementById("workspace-tool-select");
	l && l.addEventListener("change", () => {
		ea();
	});
	let u = document.getElementById("hosts-body");
	u && u.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-host-action]");
		if (t && await Ui(t)) return;
		let n = e.target.closest("tr[data-host-id]");
		if (!n) return;
		let r = parseInt(n.dataset.hostId, 10);
		r && await co(r, {
			syncGraph: !0,
			preserveGraphDetail: !0
		});
	});
	let d = document.getElementById("host-detail-scripts");
	d && d.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-script-view-id]");
		if (t) {
			let e = parseInt(t.dataset.scriptViewId, 10);
			if (!e) return;
			await _t(e);
			return;
		}
		let n = e.target.closest("button[data-script-delete-id]");
		n && parseInt(n.dataset.scriptDeleteId, 10);
	}), e("nmap-wizard-back", () => mc(ke.step - 1)), e("nmap-wizard-next", () => mc(ke.step + 1)), e("scheduler-modal-close", vi), e("interface-settings-modal-close", nl), e("interface-settings-save-button", Qc), e("device-category-modal-close", bi), e("device-category-add-rule-button", () => {
		let e = document.getElementById("device-category-rules-body");
		e && e.appendChild(Tr({}));
	}), e("device-category-save-button", Or), e("settings-modal-close", el), e("settings-tool-audit-refresh-button", Oc), e("settings-tool-install-copy-button", Ac), e("settings-tool-install-run-button", jc), e("workspace-switch-guard-close", pl), e("workspace-switch-guard-cancel-button", pl), e("workspace-switch-guard-stop-button", vl), e("nmap-scan-modal-close", ri), e("manual-scan-modal-close", ii), e("host-remove-modal-close", () => oi(!0)), e("host-remove-modal-cancel", () => oi(!0)), e("host-remove-modal-confirm", Yi), e("script-output-modal-close", () => gt(!0)), e("script-output-copy-button", yt), e("script-output-command-copy", bt), e("script-output-download-button", St), e("graph-layout-tidy-button", Bc);
	let f = document.getElementById("project-restore-zip-file");
	f && f.addEventListener("change", ll), document.querySelectorAll("[data-ribbon-menu-toggle]").forEach((e) => {
		e.addEventListener("click", (t) => {
			t.preventDefault(), t.stopPropagation(), gi(e.getAttribute("data-ribbon-menu-toggle"));
		});
	}), document.addEventListener("click", (e) => {
		e.target.closest(".ribbon-menu") || hi();
	});
	let p = document.getElementById("graph-resize-handle");
	p && (p.addEventListener("pointerdown", Qt), p.addEventListener("dblclick", (e) => {
		e.preventDefault(), $t();
	})), Yt();
	let m = document.getElementById("process-output-modal");
	m && m.addEventListener("click", (e) => {
		e.target === m && ht(!0);
	});
	let h = document.getElementById("script-output-modal");
	h && h.addEventListener("click", (e) => {
		e.target === h && gt(!0);
	});
	let g = document.getElementById("nmap-scan-modal");
	g && g.addEventListener("click", (e) => {
		e.target === g && ri();
	});
	let _ = document.getElementById("manual-scan-modal");
	_ && _.addEventListener("click", (e) => {
		e.target === _ && ii();
	});
	let v = document.getElementById("interface-settings-modal");
	v && v.addEventListener("click", (e) => {
		e.target === v && nl();
	});
	let y = document.getElementById("workspace-switch-guard-modal");
	y && y.addEventListener("click", (e) => {
		e.target === y && pl();
	});
	let b = document.getElementById("host-remove-modal");
	b && b.addEventListener("click", (e) => {
		e.target === b && oi(!0);
	});
	let x = document.getElementById("graph-note-modal");
	x && x.addEventListener("click", (e) => {
		e.target === x && si(!1);
	});
	let S = document.getElementById("scheduler-settings-modal");
	S && S.addEventListener("click", (e) => {
		e.target === S && vi();
	});
	let ee = document.getElementById("device-category-settings-modal");
	ee && ee.addEventListener("click", (e) => {
		e.target === ee && bi();
	});
	let C = document.getElementById("app-settings-modal");
	C && C.addEventListener("click", (e) => {
		e.target === C && el();
	}), document.addEventListener("keydown", (e) => {
		e.key === "Escape" && (je.openMenuId ? hi() : De.modalOpen ? ht(!0) : N.modalOpen ? gt(!0) : P.nmapScanOpen ? ri() : P.manualScanOpen ? ii() : !P.submittedScansOpen && !P.schedulerDecisionsOpen && (P.hostRemoveOpen ? oi(!0) : P.graphNoteOpen ? si(!1) : P.settingsOpen ? el() : P.deviceCategorySettingsOpen ? bi() : P.schedulerOpen ? vi() : k.detailMode === "floating" && Gt() && pa()));
	}), document.addEventListener("pointerdown", (e) => {
		if (k.detailMode !== "floating" || !Gt()) return;
		let t = e.target;
		if (!(t instanceof Element) || t.closest("#graph-detail-panel") || t.closest("[data-graph-node-id], [data-graph-edge-id]")) return;
		let n = H();
		n && n.contains(t) || pa();
	}), document.querySelectorAll("[data-wizard-goto]").forEach((e) => {
		e.addEventListener("click", () => {
			mc(e.getAttribute("data-wizard-goto"));
		});
	});
	let w = document.getElementById("nmap-wizard");
	w && w.querySelectorAll("input, select, textarea").forEach((e) => {
		let t = e.tagName === "INPUT" && (e.type === "checkbox" || e.type === "radio") || e.tagName === "SELECT" ? "change" : "input";
		e.addEventListener(t, () => {
			ke.postSubmitLock = !1, e.name === "nmap-scan-mode" && mc(3), e.id === "nmap-engagement-preset-select" && Kr(), hc();
		});
	}), ["nmap-args"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("input", () => {
			ke.postSubmitLock = !1, fc();
		});
	}), Yr({
		scrollIntoView: !1,
		focusPreset: !1,
		focusTargets: !1
	});
}
// ../app/web/static/js/workspace/graph_events.js
function Dl(e) {
	if (!k.drag) return;
	e.preventDefault();
	let t = Number(e.clientX || 0) - Number(k.drag.startClientX || 0), n = Number(e.clientY || 0) - Number(k.drag.startClientY || 0);
	if (!k.drag.active && Math.hypot(t, n) < 4) return;
	if (k.drag.active = !0, k.drag.kind === "pan") {
		let e = document.getElementById("graph-workspace-canvas"), r = k.drag.viewport || k.viewport;
		if (!e || !r) return;
		let i = e.getBoundingClientRect();
		if (!i.width || !i.height) return;
		let a = Number(r.width || 1) / Math.max(1, i.width), o = Number(r.height || 1) / Math.max(1, i.height), s = Ei(Number(k.drag.startCenterX || r.centerX || 0) - t * a - (r.boundsX || 0), Number(k.drag.startCenterY || r.centerY || 0) - n * o - (r.boundsY || 0), r.boundsWidth, r.boundsHeight, r.width, r.height);
		s.x += r.boundsX || 0, s.y += r.boundsY || 0;
		let c = s.x - Number(r.width || 1) / 2, l = s.y - Number(r.height || 1) / 2;
		k.viewport = {
			...r,
			x: c,
			y: l,
			centerX: s.x,
			centerY: s.y
		}, document.body.classList.add("graph-workspace-panning"), e.setAttribute("viewBox", `${c} ${l} ${r.width} ${r.height}`), k.detailMode === "floating" && Gt() && ga();
		return;
	}
	let r = document.getElementById("graph-workspace-canvas");
	if (!r) return;
	let i = En(r, e), a = Number(i.x || 0) - Number(k.drag.startPointX || 0), o = Number(i.y || 0) - Number(k.drag.startPointY || 0);
	Object.entries(k.drag.initialPositions || {}).forEach(([e, t]) => {
		k.positions[e] = {
			x: Math.max(20, Math.round((Number(t?.x) || 0) + a)),
			y: Math.max(28, Math.round((Number(t?.y) || 0) + o))
		};
	}), Qa({ preserveDetail: !0 });
}
function Ol() {
	if (!k.drag) return;
	let e = !!k.drag.active;
	document.body.classList.remove("graph-workspace-panning"), window.removeEventListener("pointermove", Dl), window.removeEventListener("pointerup", Ol), k.drag = null, e && (k.suppressClickUntil = Date.now() + 180);
}
function kl() {
	if (!Bt()) return;
	[
		"graph-view-select",
		"graph-group-select",
		"graph-render-mode-select",
		"graph-host-filter",
		"graph-node-type-filter",
		"graph-edge-type-filter",
		"graph-source-kind-filter",
		"graph-severity-filter",
		"graph-pack-filter",
		"graph-time-window-filter"
	].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", async (t) => {
			e === "graph-view-select" && (I("graph-group-select", (Pe[String(t.target.value || "attack_surface").trim()] || Pe.attack_surface).defaultGroup || "finding"), k.activeLayoutId = "", k.positions = {}, k.pinnedNodeIds = {}, gn()), [
				"graph-group-select",
				"graph-render-mode-select",
				"graph-severity-filter",
				"graph-pack-filter",
				"graph-time-window-filter"
			].includes(e) ? Qa() : await to({ background: !1 });
		});
	});
	let e = document.getElementById("graph-search-input");
	if (e) {
		let t = null;
		e.addEventListener("input", () => {
			t && window.clearTimeout(t), t = window.setTimeout(() => {
				to({ background: !1 }).catch(() => {});
			}, 350);
		});
	}
	let t = document.getElementById("graph-min-confidence");
	t && t.addEventListener("input", () => {
		fn(), to({ background: !1 }).catch(() => {});
	});
	let n = document.getElementById("graph-zoom-slider");
	n && n.addEventListener("input", () => {
		pn(), Qa();
	});
	let r = document.getElementById("graph-focus-depth-select");
	r && r.addEventListener("change", () => {
		k.focusDepth = Math.max(1, Math.min(3, parseInt(r.value, 10) || 1)), k.focusSeedNodeIds.length && Qa();
	}), ["graph-hide-ai-suggested", "graph-hide-nmap-xml-artifacts"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", () => {
			to({ background: !1 }).catch(() => {});
		});
	});
	let i = document.getElementById("graph-layout-select");
	i && i.addEventListener("change", () => {
		let e = String(i.value || "");
		e ? (zc(e), U("Layout loaded")) : Kc();
	});
	let a = document.getElementById("graph-workspace-canvas");
	a && (a.addEventListener("click", (e) => {
		if (Number(k.suppressClickUntil || 0) > Date.now()) return;
		let t = e.target.closest("[data-graph-node-id]");
		if (t) {
			$a("node", t.getAttribute("data-graph-node-id"));
			return;
		}
		let n = e.target.closest("[data-graph-edge-id]");
		n ? $a("edge", n.getAttribute("data-graph-edge-id")) : e.target.closest("[data-graph-group-key]") || pa();
	}), a.addEventListener("dblclick", (e) => {
		let t = e.target.closest("[data-graph-node-id]");
		if (!t) return;
		let n = String(t.getAttribute("data-graph-node-id") || "");
		k.selectedKind = "node", k.selectedRef = n, W(It("node", n), "summary_kind") && Uc();
	}), a.addEventListener("pointerdown", (e) => {
		let t = e.target.closest("[data-graph-node-id]");
		if (!t) return;
		let n = String(t.getAttribute("data-graph-node-id") || ""), r = En(a, e), i = k.filtered.positions?.[n] || k.positions?.[n];
		i && (k.drag = {
			kind: "node",
			nodeIds: [n],
			initialPositions: { [n]: {
				x: Number(i.x) || 0,
				y: Number(i.y) || 0
			} },
			startPointX: Number(r.x || 0),
			startPointY: Number(r.y || 0),
			startClientX: Number(e.clientX || 0),
			startClientY: Number(e.clientY || 0),
			active: !1
		}, window.addEventListener("pointermove", Dl), window.addEventListener("pointerup", Ol), e.preventDefault());
	}), a.addEventListener("pointerdown", (e) => {
		let t = e.target.closest("[data-graph-group-key]");
		if (!t || e.target.closest("[data-graph-node-id]")) return;
		let n = String(t.getAttribute("data-graph-group-key") || ""), r = xi(n), i = Array.isArray(r?.nodeIds) ? r.nodeIds.filter(Boolean) : [];
		if (!i.length) return;
		let o = En(a, e), s = {};
		i.forEach((e) => {
			let t = k.filtered.positions?.[e] || k.positions?.[e];
			t && (s[e] = {
				x: Number(t.x) || 0,
				y: Number(t.y) || 0
			});
		}), Object.keys(s).length && (k.drag = {
			kind: "group",
			groupKey: n,
			nodeIds: Object.keys(s),
			initialPositions: s,
			startPointX: Number(o.x || 0),
			startPointY: Number(o.y || 0),
			startClientX: Number(e.clientX || 0),
			startClientY: Number(e.clientY || 0),
			active: !1
		}, window.addEventListener("pointermove", Dl), window.addEventListener("pointerup", Ol), e.preventDefault());
	}), a.addEventListener("pointerdown", (e) => {
		if (e.target.closest("[data-graph-node-id], [data-graph-edge-id], [data-graph-group-key]")) return;
		let t = k.viewport || Oi(k.filtered.width || 1600, k.filtered.height || 900);
		t && (k.drag = {
			kind: "pan",
			startClientX: Number(e.clientX || 0),
			startClientY: Number(e.clientY || 0),
			startCenterX: Number(t.centerX || 0),
			startCenterY: Number(t.centerY || 0),
			viewport: { ...t },
			active: !1
		}, window.addEventListener("pointermove", Dl), window.addEventListener("pointerup", Ol), e.preventDefault());
	})), fn(), pn(), _n(), gn();
}
// ../app/web/static/js/legion.js
var Al = new Rc();
// src/main.tsx
window.addEventListener("DOMContentLoaded", () => {
	if (document.body.classList.contains("project-foundation")) return;
	Al.connect();
	let e = document.getElementById("initial-snapshot");
	if (e && e.textContent) try {
		yo(JSON.parse(e.textContent));
	} catch {
		xo("Init Error", !0);
	}
	window.LEGION_WS_ENABLED ? wo() : (xo("Polling/API", !1), q(), window.setInterval(q, 2e3)), Ic(), Ft();
	let t = document.getElementById("scheduler-form");
	t && t.addEventListener("submit", Lc);
	let n = document.getElementById("scheduler-provider-select");
	n && n.addEventListener("change", () => {});
	let r = document.getElementById("scheduler-goal-select");
	r && r.addEventListener("change", Pc);
	let i = document.getElementById("engagement-scope-select");
	i && i.addEventListener("change", Pc);
	let a = document.getElementById("engagement-intent-select");
	a && a.addEventListener("change", Pc), Pc(), El(), kl(), br();
}), (() => {
	let e = (e) => document.getElementById(e), t = {
		overview: "Overview",
		hosts: "Hosts",
		services: "Services",
		graph: "Graph",
		activity: "Activity",
		approvals: "Approvals"
	}, n = {}, r = null, i = !1, a = (e, t) => {
		try {
			return localStorage.getItem(`legion.workspace.${e}`) || t;
		} catch {
			return t;
		}
	}, o = (e, t) => {
		try {
			localStorage.setItem(`legion.workspace.${e}`, t);
		} catch {}
	}, s = (t) => {
		let n = e(t);
		n && !n.disabled && n.click();
	};
	function c(r, i = "") {
		let a = document.createElement("section");
		return a.className = `workspace-view ${i}`, a.dataset.workspaceView = r, a.setAttribute("aria-label", t[r]), a.hidden = !0, e("workspace-views").appendChild(a), n[r] = a, a;
	}
	function l(r, i = !0) {
		if (!n[r]) return;
		let a = e("workspace-host-detail-panel");
		(r === "hosts" || r === "services") && n[r].appendChild(a), Object.entries(n).forEach(([e, t]) => {
			t.hidden = e !== r;
		}), document.querySelectorAll("[data-view]").forEach((e) => {
			e.closest(".workspace-nav") && (e.dataset.view === r ? e.setAttribute("aria-current", "page") : e.removeAttribute("aria-current"));
		}), e("breadcrumb-view").textContent = t[r], document.body.dataset.workspaceView = r, r === "services" && typeof po == "function" && po(!1), r === "graph" && typeof Bt == "function" && Bt() && (typeof ho == "function" && ho(!1), typeof Qa == "function" && requestAnimationFrame(() => Qa({ preserveDetail: !0 }))), i && o("view", r), f();
	}
	function u(e, t, n, r) {
		let i = document.createElement("div");
		i.id = e, i.className = "workspace-empty";
		let a = document.createElement("h3");
		a.textContent = t;
		let o = document.createElement("p");
		if (o.textContent = n, i.append(a, o), r) {
			let e = document.createElement("button");
			e.type = "button", e.textContent = r.label, e.dataset.proxy = r.target, i.appendChild(e);
		}
		return i;
	}
	function d(t, n) {
		let r = e(t);
		r && r.textContent !== n && (r.textContent = n);
	}
	function f() {
		document.querySelectorAll("[data-mirror]").forEach((t) => {
			let n = e(t.dataset.mirror)?.textContent?.trim() || "0";
			t.textContent !== n && (t.textContent = n);
		});
		let t = Number(e("stat-running")?.textContent || 0);
		d("statusbar-running", t ? `${t} running ${t === 1 ? "job" : "jobs"}` : "No running jobs");
		let n = e("action-status")?.textContent?.trim() || "Ready";
		d("statusbar-action", n === "Idle" ? "Ready" : n);
		let r = Number(e("stat-hosts")?.textContent || 0);
		e("welcome-no-hosts").hidden = r > 0, e("welcome-has-hosts").hidden = r === 0;
		let i = e("host-detail-name")?.textContent?.trim();
		e("workspace-detail-empty").hidden = !!i, e("workspace-host-detail-panel").classList.toggle("is-empty-detail", !i);
		let a = e("graph-workspace-panel").dataset.graphEnabled !== "true";
		e("graph-disabled-message").hidden = !a;
	}
	function p() {
		i || (i = !0, requestAnimationFrame(() => {
			i = !1, f();
		}));
	}
	function m(t) {
		document.body.classList.toggle("sidebar-collapsed", t), e("sidebar-toggle").setAttribute("aria-expanded", String(!t)), o("sidebarCollapsed", String(t));
	}
	function g(t, n, r, i, s, c) {
		let l = e(t), u = Number(a(s, c)), d = Number.isFinite(u) ? Math.max(r, Math.min(i, u)) : c, f = (e) => {
			let t = Math.round(Math.max(r, Math.min(i, e)));
			document.documentElement.style.setProperty(n, `${t}px`), l.setAttribute("aria-valuenow", String(t)), o(s, String(t));
		};
		f(d), l.addEventListener("pointerdown", (e) => {
			if (e.button !== 0) return;
			l.setPointerCapture(e.pointerId);
			let t = e.clientX, n = Number(l.getAttribute("aria-valuenow"));
			document.body.classList.add("workspace-resizing");
			let r = (e) => f(n + e.clientX - t), i = () => {
				l.removeEventListener("pointermove", r), document.body.classList.remove("workspace-resizing");
			};
			l.addEventListener("pointermove", r), l.addEventListener("pointerup", i, { once: !0 }), l.addEventListener("pointercancel", i, { once: !0 });
		}), l.addEventListener("keydown", (e) => {
			if (![
				"ArrowLeft",
				"ArrowRight",
				"Home",
				"End"
			].includes(e.key)) return;
			e.preventDefault();
			let t = Number(l.getAttribute("aria-valuenow"));
			f(e.key === "Home" ? r : e.key === "End" ? i : t + (e.key === "ArrowLeft" ? -10 : 10));
		});
	}
	function _() {
		e("workspace-search").hidden = !0, r?.focus();
	}
	function v() {
		let n = e("workspace-search-input").value.trim().toLowerCase(), r = e("workspace-search-results");
		r.replaceChildren();
		let i = Object.entries(t).map(([e, t]) => ({
			label: t,
			detail: "View",
			run: () => l(e)
		}));
		document.querySelectorAll("#workspace-commandbar .ribbon-submenu-item").forEach((e) => {
			i.push({
				label: e.textContent.trim(),
				detail: "Action",
				run: () => s(e.id)
			});
		}), document.querySelectorAll("#hosts-body tr").forEach((e) => {
			i.push({
				label: e.textContent.trim().replace(/\s+/g, " "),
				detail: "Host",
				run: () => {
					l("hosts"), e.click();
				}
			});
		});
		let a = i.filter((e) => !n || e.label.toLowerCase().includes(n)).slice(0, 20);
		a.forEach((e) => {
			let t = document.createElement("button");
			t.type = "button";
			let n = document.createElement("span");
			n.textContent = e.label;
			let i = document.createElement("small");
			i.textContent = e.detail, t.append(n, i), t.addEventListener("click", () => {
				_(), e.run();
			}), r.appendChild(t);
		}), a.length || (r.textContent = "No matching views, actions, or hosts.");
	}
	function y() {
		r = document.activeElement, e("workspace-search").hidden = !1, e("workspace-search-input").value = "", v(), e("workspace-search-input").focus();
	}
	function b() {
		let t = document.querySelector(".workspace-project"), n = document.createElement("div");
		n.className = "workspace-project-shell", t.before(n), n.appendChild(t);
		let r = (e) => {
			a(), h(e);
		}, i = document.createElement("div");
		i.id = "workspace-context-menu", i.className = "workspace-context-menu", i.setAttribute("role", "menu"), i.setAttribute("aria-label", "Workspace actions"), i.hidden = !0, document.body.appendChild(i), t.setAttribute("aria-haspopup", "menu"), t.setAttribute("aria-expanded", "false");
		function a(e = !1) {
			i.hidden = !0, t.setAttribute("aria-expanded", "false"), e && t.focus();
		}
		[
			["Rename workspace…", () => r("sidebar")],
			["Save workspace", () => s("ribbon-workspace-save-action-button")],
			["Save workspace as…", () => s("ribbon-workspace-save-as-action-button")],
			["Export workspace ZIP", () => s("ribbon-workspace-download-action-button")],
			["Workspace details", () => {
				e("workspace-context").hidden && e("workspace-context-toggle").click();
			}]
		].forEach(([e, t]) => {
			let n = document.createElement("button");
			n.type = "button", n.textContent = e, n.setAttribute("role", "menuitem"), n.addEventListener("click", () => {
				a(), t();
			}), i.appendChild(n);
		});
		function o(e, n) {
			i.hidden = !1, t.setAttribute("aria-expanded", "true"), i.style.left = `${Math.max(8, Math.min(e, innerWidth - i.offsetWidth - 8))}px`, i.style.top = `${Math.max(8, Math.min(n, innerHeight - i.offsetHeight - 8))}px`, i.querySelector("button").focus();
		}
		t.addEventListener("contextmenu", (e) => {
			e.preventDefault(), o(e.clientX, e.clientY);
		}), t.addEventListener("keydown", (e) => {
			if (e.key === "ContextMenu" || e.shiftKey && e.key === "F10") {
				e.preventDefault();
				let n = t.getBoundingClientRect();
				o(n.left, n.bottom);
			}
		}), i.addEventListener("keydown", (e) => {
			let t = [...i.querySelectorAll("button")], n = t.indexOf(document.activeElement);
			e.key === "Escape" && (e.preventDefault(), a(!0)), e.key === "Tab" && a(), [
				"ArrowDown",
				"ArrowUp",
				"Home",
				"End"
			].includes(e.key) && (e.preventDefault(), t[e.key === "Home" ? 0 : e.key === "End" ? t.length - 1 : (n + (e.key === "ArrowDown" ? 1 : -1) + t.length) % t.length].focus());
		}), document.addEventListener("pointerdown", (e) => {
			i.contains(e.target) || a();
		}), window.addEventListener("resize", () => a()), window.addEventListener("blur", () => a());
	}
	function x() {
		let t = document.querySelector(".graph-canvas-panel"), n = document.createElement("div");
		n.className = "workspace-graph-zoom", n.setAttribute("role", "group"), n.setAttribute("aria-label", "Graph zoom");
		let r = e("graph-zoom-slider"), i = (e) => {
			r.value = String(e), r.dispatchEvent(new Event("input", { bubbles: !0 }));
		};
		[
			[
				"−",
				"Zoom graph out",
				() => i(Number(r.value) - 10)
			],
			[
				"100%",
				"Reset graph zoom",
				() => i(100)
			],
			[
				"+",
				"Zoom graph in",
				() => i(Number(r.value) + 10)
			]
		].forEach(([e, t, r], i) => {
			let a = document.createElement("button");
			a.type = "button", a.textContent = e, a.setAttribute("aria-label", t), a.title = t, i === 1 && (a.id = "workspace-graph-zoom-value"), a.addEventListener("click", r), n.appendChild(a);
		});
		let a = () => {
			n.hidden = e("graph-workspace-canvas").hidden, e("workspace-graph-zoom-value").textContent = `${r.value}%`, n.firstElementChild.disabled = Number(r.value) <= Number(r.min), n.lastElementChild.disabled = Number(r.value) >= Number(r.max);
		};
		t.appendChild(n), r.addEventListener("input", a), a(), new MutationObserver(a).observe(e("graph-workspace-canvas"), {
			attributes: !0,
			attributeFilter: ["hidden"]
		});
	}
	window.addEventListener("DOMContentLoaded", () => {
		if (document.body.classList.contains("project-foundation")) return;
		let t = document.querySelectorAll("#graph-workspace-shell");
		t.length > 1 && (t[0].id = "graph-panel-layout");
		let r = e("workspace-views").querySelector(".ribbon-panel"), i = r.querySelector(".ribbon-menu-group");
		e("workspace-commandbar").appendChild(i), e("workspace-commandbar").appendChild(r.querySelector(".ribbon-summary-group"));
		let o = e("workspace-context");
		o.appendChild(r.querySelector(".ribbon-project-group")), b(), x();
		let d = r.querySelector(".ribbon-rationale-group"), f = r.querySelector(".ribbon-process-group"), h = c("overview", "overview-view");
		h.innerHTML = "<div class=\"welcome-workspace\"><span class=\"welcome-mark\" aria-hidden=\"true\">L</span><div id=\"welcome-no-hosts\"><h1>What would you like to investigate?</h1><p>A clear view of your hosts, services, and evidence.</p></div><div id=\"welcome-has-hosts\" hidden><h1>Your workspace, connected.</h1><p>Pick up an investigation or bring in new results.</p></div><div class=\"welcome-action-card\"><span class=\"welcome-card-label\">Start with a target. Build the picture.</span><div class=\"welcome-actions\"><button type=\"button\" class=\"primary-action\" data-proxy=\"ribbon-scan-add-action-button\"><i class=\"fa-solid fa-plus\" aria-hidden=\"true\"></i> New scan</button><button type=\"button\" data-proxy=\"ribbon-import-xml-action-button\">Import Nmap XML</button><button type=\"button\" data-proxy=\"ribbon-workspace-open-action-button\">Open workspace</button></div></div><div class=\"welcome-shortcuts\"><span><kbd>Ctrl K</kbd> Search views and actions</span><span>Results and evidence stay in your workspace</span></div></div>", c("hosts", "inspection-view").appendChild(e("workspace-hosts-panel")), c("services", "inspection-view").appendChild(e("workspace-services-panel"));
		let S = e("workspace-host-detail-panel"), ee = u("workspace-detail-empty", "Select a host to inspect", "Ports and scripts will appear here.");
		S.insertBefore(ee, S.children[1]), n.hosts.appendChild(S);
		let C = c("graph", "graph-view");
		C.appendChild(e("graph-workspace-panel")), C.appendChild(u("graph-disabled-message", "Graph workspace is disabled", "Enable Graph Workspace in Interface settings to explore relationships and evidence.", {
			label: "Interface settings",
			target: "ribbon-interface-settings-button"
		}));
		let w = c("activity", "activity-view");
		w.append(f, d), document.querySelectorAll(".activity-history-panel").forEach((e) => w.appendChild(e)), c("capture", "capture-view"), c("approvals", "approvals-view").appendChild(e("workspace-approvals-panel")), r.hidden = !0;
		let T = document.createElement("div");
		T.id = "inspection-resizer", T.className = "inspection-resizer", T.tabIndex = 0, T.setAttribute("role", "separator"), T.setAttribute("aria-label", "Resize host list"), T.setAttribute("aria-orientation", "vertical"), T.setAttribute("aria-valuemin", "320"), T.setAttribute("aria-valuemax", "900"), n.hosts.insertBefore(T, S), g("sidebar-resizer", "--sidebar-width", 210, 340, "sidebarWidth", 250), g("inspection-resizer", "--list-width", 320, 900, "listWidth", 540), e("sidebar-toggle").addEventListener("click", () => m(!0)), e("sidebar-reopen").addEventListener("click", () => m(!1)), m(a("sidebarCollapsed", "false") === "true"), e("workspace-context-toggle").addEventListener("click", () => {
			o.hidden = !o.hidden, e("workspace-context-toggle").setAttribute("aria-expanded", String(!o.hidden));
		}), document.addEventListener("click", (e) => {
			let t = e.target.closest("[data-view]");
			t && l(t.dataset.view);
			let n = e.target.closest("[data-proxy]");
			n && s(n.dataset.proxy);
		}), e("workspace-search-button").addEventListener("click", y), document.addEventListener("click", (e) => {
			e.target.closest(".host-filter-cell button") ? l("services") : e.target.closest(".service-filter-cell button") && l("hosts");
		}, !0), e("workspace-search-close").addEventListener("click", _), e("workspace-search-input").addEventListener("input", v), e("workspace-search").addEventListener("click", (t) => {
			t.target === e("workspace-search") && _();
		}), e("workspace-search").addEventListener("keydown", (t) => {
			if (t.key === "Escape" && (t.preventDefault(), _()), t.key === "ArrowDown") {
				t.preventDefault();
				let n = [...e("workspace-search-results").querySelectorAll("button")];
				n[(n.indexOf(document.activeElement) + 1) % n.length]?.focus();
			}
			if (t.key === "ArrowUp") {
				t.preventDefault();
				let n = [...e("workspace-search-results").querySelectorAll("button")];
				n[(n.indexOf(document.activeElement) - 1 + n.length) % n.length]?.focus();
			}
			if (t.key === "Enter" && document.activeElement === e("workspace-search-input") && (t.preventDefault(), e("workspace-search-results").querySelector("button")?.click()), t.key === "Tab") {
				let n = [...e("workspace-search").querySelectorAll("button, input")], r = n[0], i = n[n.length - 1];
				t.shiftKey && document.activeElement === r && (t.preventDefault(), i.focus()), !t.shiftKey && document.activeElement === i && (t.preventDefault(), r.focus());
			}
		}), document.addEventListener("keydown", (e) => {
			(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && (e.preventDefault(), y());
		});
		let E = new MutationObserver(p);
		[
			"project-name",
			"project-kind",
			"stat-hosts",
			"stat-open-ports",
			"stat-services",
			"stat-running",
			"approval-count",
			"action-status",
			"host-detail-name"
		].forEach((t) => {
			let n = e(t);
			n && E.observe(n, {
				childList: !0,
				characterData: !0,
				subtree: !0,
				attributes: !0,
				attributeFilter: ["data-display-name"]
			});
		}), ["graph-workspace-panel"].forEach((t) => e(t) && E.observe(e(t), {
			attributes: !0,
			attributeFilter: ["hidden", "data-graph-enabled"]
		}));
		let te = document.body.dataset.workspacePart;
		if (l(te && n[te] ? te : a("view", "overview"), !1), te) {
			new MutationObserver(() => window.parent.postMessage({
				type: "legion-display",
				enabled: document.body.classList.contains("colorful-background")
			}, location.origin)).observe(document.body, {
				attributes: !0,
				attributeFilter: ["class"]
			}), ["action-status", "workspace-status"].forEach((t) => {
				let n = e(t);
				n && new MutationObserver(() => window.parent.postMessage({
					type: "legion-status",
					text: n.textContent.trim()
				}, location.origin)).observe(n, {
					childList: !0,
					characterData: !0,
					subtree: !0
				});
			});
			let t = {
				"app-settings": "ribbon-app-settings-button",
				"interface-settings": "ribbon-interface-settings-button",
				"scheduler-settings": "ribbon-scheduler-settings-button",
				"device-category-settings": "ribbon-device-category-settings-button",
				scan: "ribbon-scan-add-action-button",
				tool: "ribbon-scan-manual-action-button",
				import: "ribbon-import-xml-action-button"
			}, n = {
				"app-settings": "app-settings-modal",
				"interface-settings": "interface-settings-modal",
				"scheduler-settings": "scheduler-settings-modal",
				"device-category-settings": "device-category-settings-modal",
				scan: "nmap-scan-modal",
				tool: "manual-scan-modal"
			}[te];
			if (t[te] && s(t[te]), n) {
				let t = e(n);
				new MutationObserver(() => {
					t.classList.contains("is-open") || window.parent.postMessage({ type: "legion-part-closed" }, location.origin);
				}).observe(t, {
					attributes: !0,
					attributeFilter: ["class"]
				});
			}
			let r = Number(new URLSearchParams(location.search).get("host"));
			if (r > 0) {
				let t = new MutationObserver(() => {
					let e = document.querySelector(`#hosts-body tr[data-host-id="${r}"]`);
					e && (e.click(), t.disconnect());
				});
				t.observe(e("hosts-body"), { childList: !0 });
				let n = document.querySelector(`#hosts-body tr[data-host-id="${r}"]`);
				n && (n.click(), t.disconnect());
			}
		}
	});
})(), window.addEventListener("DOMContentLoaded", () => {
	let e = document.getElementById("project-hub-root");
	if (e) {
		(0, c.createRoot)(e).render(/* @__PURE__ */ (0, V.jsx)(Ks, {}));
		return;
	}
	let t = document.getElementById("workspace-identity-sidebar"), n = document.getElementById("workspace-identity-title"), r = document.querySelector(".workspace-project-shell"), i = document.querySelector(".workspace-breadcrumb"), a = document.getElementById("workspace-react-root"), o = document.getElementById("jobs-body");
	if (!t || !n || !r || !i || !a || !o) throw Error("Workspace component mount points are missing.");
	t.replaceChildren(), n.replaceChildren(), o.replaceChildren(), f({
		updateJobs: x,
		updateProject: b,
		beginRename: S
	}), ls(), (0, c.createRoot)(a).render(/* @__PURE__ */ (0, V.jsx)(He, {
		sidebar: t,
		title: n,
		sidebarEditor: r,
		titleEditor: i
	})), (0, c.createRoot)(o).render(/* @__PURE__ */ (0, V.jsx)(Ue, {})), a.dataset.framework = "react", o.dataset.framework = "react";
});
