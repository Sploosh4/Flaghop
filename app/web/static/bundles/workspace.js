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
			if (n(c) !== null) m = !0, S || (S = !0, O());
			else {
				var t = n(l);
				t !== null && ne(x, t.startTime - e);
			}
		}
	}
	var S = !1, C = -1, w = 5, T = -1;
	function E() {
		return g ? !0 : !(e.unstable_now() - T < w);
	}
	function D() {
		if (g = !1, S) {
			var t = e.unstable_now();
			T = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && E());) {
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
								u !== null && ne(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? O() : S = !1;
			}
		}
	}
	var O;
	if (typeof y == "function") O = function() {
		y(D);
	};
	else if (typeof MessageChannel < "u") {
		var ee = new MessageChannel(), te = ee.port2;
		ee.port1.onmessage = D, O = function() {
			te.postMessage(null);
		};
	} else O = function() {
		_(D, 0);
	};
	function ne(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
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
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, ne(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, O()))), r;
	}, e.unstable_shouldYield = E, e.unstable_wrapCallback = function(e) {
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
	var C = Array.isArray;
	function w() {}
	var T = {
		H: null,
		A: null,
		T: null,
		S: null
	}, E = Object.prototype.hasOwnProperty;
	function D(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function O(e, t) {
		return D(e.type, t, e.props);
	}
	function ee(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function te(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ne = /\/+/g;
	function re(e, t) {
		return typeof e == "object" && e && e.key != null ? te("" + e.key) : t.toString(36);
	}
	function ie(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(w, w) : (e.status = "pending", e.then(function(t) {
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
	function ae(e, r, i, a, o) {
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
				case d: return c = e._init, ae(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + re(e, 0) : a, C(o) ? (i = "", c != null && (i = c.replace(ne, "$&/") + "/"), ae(o, r, i, "", function(e) {
			return e;
		})) : o != null && (ee(o) && (o = O(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(ne, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (C(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + re(a, u), c += ae(a, r, i, s, o);
		else if (u = h(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + re(a, u++), c += ae(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return ae(ie(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function oe(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return ae(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function se(e) {
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
	var ce = typeof reportError == "function" ? reportError : function(e) {
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
	function le(e) {
		var t = T.T, n = {};
		n.types = t === null ? null : t.types, T.T = n;
		try {
			var r = e(), i = T.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(w, ce);
		} catch (e) {
			ce(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), T.T = t;
		}
	}
	function ue(e) {
		var t = T.T;
		if (t !== null) {
			var n = t.types;
			n === null ? t.types = [e] : n.indexOf(e) === -1 && n.push(e);
		} else le(ue.bind(null, e));
	}
	var de = {
		map: oe,
		forEach: function(e, t, n) {
			oe(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return oe(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return oe(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!ee(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = de, e.Component = y, e.Fragment = r, e.Profiler = a, e.PureComponent = x, e.StrictMode = i, e.Suspense = l, e.ViewTransition = p, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = T, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return T.H.useMemoCache(e);
		}
	}, e.addTransitionType = ue, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = _({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !E.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return D(e.type, i, r);
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
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) E.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return D(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = ee, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: se
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = le, e.unstable_useCacheRefresh = function() {
		return T.H.useCacheRefresh();
	}, e.use = function(e) {
		return T.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return T.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return T.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return T.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return T.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return T.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return T.H.useEffectEvent(e);
	}, e.useId = function() {
		return T.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return T.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return T.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return T.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return T.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return T.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return T.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return T.H.useRef(e);
	}, e.useState = function(e) {
		return T.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return T.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return T.H.useTransition();
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
	function C(e, t, n) {
		return e === n || e === t && (x = e, !0);
	}
	function w(e, t, n) {
		return e === n ? (S = e, !1) : e === t && (S !== null && (x = e), !0);
	}
	function T(e) {
		if (e === null) return null;
		do
			e = e === null ? null : e.return;
		while (e && e.tag !== 5 && e.tag !== 27 && e.tag !== 3);
		return e || null;
	}
	function E(e, t, n) {
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
	var D = Object.assign, O = Symbol.for("react.element"), ee = Symbol.for("react.transitional.element"), te = Symbol.for("react.portal"), ne = Symbol.for("react.fragment"), re = Symbol.for("react.strict_mode"), ie = Symbol.for("react.profiler"), ae = Symbol.for("react.consumer"), oe = Symbol.for("react.context"), se = Symbol.for("react.forward_ref"), ce = Symbol.for("react.suspense"), le = Symbol.for("react.suspense_list"), ue = Symbol.for("react.memo"), de = Symbol.for("react.lazy"), fe = Symbol.for("react.activity"), pe = Symbol.for("react.legacy_hidden"), me = Symbol.for("react.memo_cache_sentinel"), k = Symbol.for("react.view_transition"), he = Symbol.for("react.recoverable"), ge = Symbol.iterator;
	function _e(e) {
		return typeof e != "object" || !e ? null : (e = ge && e[ge] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var A = Symbol.for("react.client.reference");
	function ve(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === A ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case ne: return "Fragment";
			case ie: return "Profiler";
			case re: return "StrictMode";
			case ce: return "Suspense";
			case le: return "SuspenseList";
			case fe: return "Activity";
			case k: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case te: return "Portal";
			case oe: return e.displayName || "Context";
			case ae: return (e._context.displayName || "Context") + ".Consumer";
			case se:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case ue: return t = e.displayName || null, t === null ? ve(e.type) || "Memo" : t;
			case de:
				t = e._payload, e = e._init;
				try {
					return ve(e(t));
				} catch {}
		}
		return null;
	}
	var ye = Array.isArray, j = r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, M = a.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, be = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, xe = [], Se = -1;
	function Ce(e) {
		return { current: e };
	}
	function we(e) {
		0 > Se || (e.current = xe[Se], xe[Se] = null, Se--);
	}
	function Te(e, t) {
		Se++, xe[Se] = e.current, e.current = t;
	}
	var N = Ce(null), Ee = Ce(null), De = Ce(null), P = Ce(null);
	function F(e, t) {
		switch (Te(De, t), Te(Ee, e), Te(N, null), t.nodeType) {
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
		we(N), Te(N, e);
	}
	function Oe() {
		we(N), we(Ee), we(De);
	}
	function ke(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, Te(P, e)), t = N.current;
		var n = dp(t, e.type);
		t !== n && (Te(Ee, e), Te(N, n));
	}
	function Ae(e) {
		Ee.current === e && (we(N), we(Ee)), P.current === e && (we(P), sh._currentValue = be);
	}
	var je, Me;
	function Ne(e) {
		if (je === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			je = t && t[1] || "", Me = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + je + e + Me;
	}
	var Pe = !1;
	function I(e, t) {
		if (!e || Pe) return "";
		Pe = !0;
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
			Pe = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? Ne(n) : "";
	}
	function Fe(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return Ne(e.type);
			case 16: return Ne("Lazy");
			case 13: return e.child !== t && t !== null ? Ne("Suspense Fallback") : Ne("Suspense");
			case 19: return Ne("SuspenseList");
			case 0:
			case 15: return I(e.type, !1);
			case 11: return I(e.type.render, !1);
			case 1: return I(e.type, !0);
			case 31: return Ne("Activity");
			case 30: return Ne("ViewTransition");
			default: return "";
		}
	}
	function Ie(e) {
		try {
			var t = "", n = null;
			do
				t += Fe(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var Le = Object.prototype.hasOwnProperty, Re = t.unstable_scheduleCallback, L = t.unstable_cancelCallback, R = t.unstable_shouldYield, z = t.unstable_requestPaint, B = t.unstable_now, V = t.unstable_getCurrentPriorityLevel, H = t.unstable_ImmediatePriority, ze = t.unstable_UserBlockingPriority, Be = t.unstable_NormalPriority, U = t.unstable_LowPriority, W = t.unstable_IdlePriority, Ve = t.log, He = t.unstable_setDisableYieldValue, Ue = null, We = null;
	function Ge(e) {
		if (typeof Ve == "function" && He(e), We && typeof We.setStrictMode == "function") try {
			We.setStrictMode(Ue, e);
		} catch {}
	}
	var G = Math.clz32 ? Math.clz32 : Je, Ke = Math.log, qe = Math.LN2;
	function Je(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Ke(e) / qe | 0) | 0;
	}
	var Ye = 256, Xe = 262144, Ze = 4194304;
	function Qe(e) {
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
	function $e(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Qe(n))) : i = Qe(o) : i = Qe(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Qe(n))) : i = Qe(o)) : i = Qe(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function et(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function tt(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - G(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function nt(e, t) {
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
	function rt() {
		var e = Ze;
		return Ze <<= 1, !(Ze & 62914560) && (Ze = 4194304), e;
	}
	function it(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function at(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function ot(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - G(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && st(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function st(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - G(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function ct(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - G(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function lt(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : ut(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function ut(e) {
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
	function dt(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function ft() {
		var e = M.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function pt(e, t) {
		var n = M.p;
		try {
			return M.p = e, t();
		} finally {
			M.p = n;
		}
	}
	var mt = Math.random().toString(36).slice(2), ht = "__reactFiber$" + mt, gt = "__reactProps$" + mt, _t = "__reactContainer$" + mt, vt = "__reactEvents$" + mt, yt = "__reactListeners$" + mt, bt = "__reactHandles$" + mt, xt = "__reactResources$" + mt, St = "__reactMarker$" + mt, Ct = "__reactLoad$" + mt;
	function wt(e) {
		delete e[ht], delete e[gt], delete e[yt], delete e[bt];
	}
	function Tt(e) {
		var t;
		if (t = e[ht]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[_t] || n[ht]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[ht]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Et(e) {
		if (e = e[ht] || e[_t]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function Dt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(s(33));
	}
	function Ot(e) {
		var t = e[xt];
		return t ||= e[xt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function kt(e) {
		e[St] = !0;
	}
	function At(e) {
		e[Ct] = void 0;
	}
	var jt = /* @__PURE__ */ new Set(), Mt = {};
	function Nt(e, t) {
		Pt(e, t), Pt(e + "Capture", t);
	}
	function Pt(e, t) {
		for (Mt[e] = t, e = 0; e < t.length; e++) jt.add(t[e]);
	}
	var Ft = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), It = {}, Lt = {};
	function Rt(e) {
		return Le.call(Lt, e) ? !0 : Le.call(It, e) ? !1 : Ft.test(e) ? Lt[e] = !0 : (It[e] = !0, !1);
	}
	var K = !1;
	function zt() {
		var e = K;
		return K = !1, e;
	}
	function Bt(e, t, n) {
		if (Rt(t)) {
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
	function Vt(e, t, n) {
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
	function Ht(e, t, n, r) {
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
	function Ut(e) {
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
	function Wt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Gt(e, t, n) {
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
	function Kt(e) {
		if (!e._valueTracker) {
			var t = Wt(e) ? "checked" : "value";
			e._valueTracker = Gt(e, t, "" + e[t]);
		}
	}
	function qt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Wt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var Jt = /[\n"\\]/g;
	function Yt(e) {
		return e.replace(Jt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Xt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Ut(t)) : e.value !== "" + Ut(t) && (e.value = "" + Ut(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Qt(e, Ut(n)) : o === "number" && e.value == t ? Qt(e, Ut(e.value)) : Qt(e, Ut(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Ut(s) : e.removeAttribute("name");
	}
	function Zt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Kt(e);
				return;
			}
			n = n == null ? "" : "" + Ut(n), t = t == null ? n : "" + Ut(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Kt(e);
	}
	function Qt(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function $t(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Ut(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function en(e, t, n) {
		t != null && (t = "" + Ut(t), t !== e.value && (e.value = t), n == null) ? e.defaultValue !== t && (e.defaultValue = t) : e.defaultValue = n == null ? "" : "" + Ut(n);
	}
	function tn(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(s(92));
				if (ye(r)) {
					if (1 < r.length) throw Error(s(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Ut(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Kt(e);
	}
	function nn(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var rn = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function an(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || rn.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function on(e, t, n) {
		if (t != null && typeof t != "object") throw Error(s(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", K = !0);
			for (var i in t) r = t[i], t.hasOwnProperty(i) && n[i] !== r && (an(e, i, r), K = !0);
		} else for (var a in t) t.hasOwnProperty(a) && an(e, a, t[a]);
	}
	function sn(e) {
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
	var cn = /* @__PURE__ */ new Map([
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
	]), ln = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function un(e) {
		return ln.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function dn() {}
	var fn = null;
	function pn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var mn = null, hn = null;
	function gn(e) {
		var t = Et(e);
		if (t && (e = t.stateNode)) {
			var n = e[gt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Xt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Yt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var i = r[gt] || null;
								if (!i) throw Error(s(90));
								Xt(r, i.value, i.defaultValue, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && qt(r);
					}
					break a;
				case "textarea":
					en(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && $t(e, !!n.multiple, t, !1);
			}
		}
	}
	var _n = !1;
	function vn(e, t, n) {
		if (_n) return e(t, n);
		_n = !0;
		try {
			return e(t);
		} finally {
			if (_n = !1, (mn !== null || hn !== null) && (Ld(), mn && (t = mn, e = hn, hn = mn = null, gn(t), e))) for (t = 0; t < e.length; t++) gn(e[t]);
		}
	}
	function yn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[gt] || null;
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
	var bn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, xn = !1;
	if (bn) try {
		var Sn = {};
		Object.defineProperty(Sn, "passive", { get: function() {
			xn = !0;
		} }), window.addEventListener("test", Sn, Sn), window.removeEventListener("test", Sn, Sn);
	} catch {
		xn = !1;
	}
	var Cn = null, wn = null, Tn = null;
	function En() {
		if (Tn) return Tn;
		var e, t = wn, n = t.length, r, i = "value" in Cn ? Cn.value : Cn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return Tn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Dn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function On() {
		return !0;
	}
	function kn() {
		return !1;
	}
	function An(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? On : kn, this.isPropagationStopped = kn, this;
		}
		return D(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = On);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = On);
			},
			persist: function() {},
			isPersistent: On
		}), t;
	}
	var q = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, jn = An(q), Mn = D({}, q, {
		view: 0,
		detail: 0
	}), Nn = An(Mn), Pn, Fn, J, In = D({}, Mn, {
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
		getModifierState: qn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== J && (J && e.type === "mousemove" ? (Pn = e.screenX - J.screenX, Fn = e.screenY - J.screenY) : Fn = Pn = 0, J = e), Pn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Fn;
		}
	}), Ln = An(In), Rn = An(D({}, In, { dataTransfer: 0 })), zn = An(D({}, Mn, { relatedTarget: 0 })), Bn = An(D({}, q, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Vn = An(D({}, q, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Hn = An(D({}, q, { data: 0 })), Un = {
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
	}, Wn = {
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
	}, Gn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Kn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Gn[e]) ? !!t[e] : !1;
	}
	function qn() {
		return Kn;
	}
	var Jn = An(D({}, Mn, {
		key: function(e) {
			if (e.key) {
				var t = Un[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Dn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Wn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: qn,
		charCode: function(e) {
			return e.type === "keypress" ? Dn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Dn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Yn = An(D({}, In, {
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
	})), Xn = An(D({}, q, { submitter: 0 })), Zn = An(D({}, Mn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: qn
	})), Qn = An(D({}, q, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), $n = An(D({}, In, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), er = An(D({}, q, {
		newState: 0,
		oldState: 0,
		source: 0
	})), tr = [
		9,
		13,
		27,
		32
	], nr = bn && "CompositionEvent" in window, rr = null;
	bn && "documentMode" in document && (rr = document.documentMode);
	var ir = bn && "TextEvent" in window && !rr, ar = bn && (!nr || rr && 8 < rr && 11 >= rr), or = " ", sr = !1;
	function cr(e, t) {
		switch (e) {
			case "keyup": return tr.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function lr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var ur = !1;
	function dr(e, t) {
		switch (e) {
			case "compositionend": return lr(t);
			case "keypress": return t.which === 32 ? (sr = !0, or) : null;
			case "textInput": return e = t.data, e === or && sr ? null : e;
			default: return null;
		}
	}
	function fr(e, t) {
		if (ur) return e === "compositionend" || !nr && cr(e, t) ? (e = En(), Tn = wn = Cn = null, ur = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return ar && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var pr = {
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
	function mr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!pr[e.type] : t === "textarea";
	}
	function hr(e, t, n, r) {
		mn ? hn ? hn.push(r) : hn = [r] : mn = r, t = qf(t, "onChange"), 0 < t.length && (n = new jn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var gr = null, _r = null;
	function vr(e) {
		Bf(e, 0);
	}
	function yr(e) {
		if (qt(Dt(e))) return e;
	}
	function br(e, t) {
		if (e === "change") return t;
	}
	var xr = !1;
	if (bn) {
		var Sr;
		if (bn) {
			var Cr = "oninput" in document;
			if (!Cr) {
				var wr = document.createElement("div");
				wr.setAttribute("oninput", "return;"), Cr = typeof wr.oninput == "function";
			}
			Sr = Cr;
		} else Sr = !1;
		xr = Sr && (!document.documentMode || 9 < document.documentMode);
	}
	function Tr() {
		gr && (gr.detachEvent("onpropertychange", Er), _r = gr = null);
	}
	function Er(e) {
		if (e.propertyName === "value" && yr(_r)) {
			var t = [];
			hr(t, _r, e, pn(e)), vn(vr, t);
		}
	}
	function Dr(e, t, n) {
		e === "focusin" ? (Tr(), gr = t, _r = n, gr.attachEvent("onpropertychange", Er)) : e === "focusout" && Tr();
	}
	function Or(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return yr(_r);
	}
	function kr(e, t) {
		if (e === "click") return yr(t);
	}
	function Ar(e, t) {
		if (e === "input" || e === "change") return yr(t);
	}
	function jr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Mr = typeof Object.is == "function" ? Object.is : jr;
	function Nr(e, t) {
		if (Mr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!Le.call(t, i) || !Mr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Pr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function Fr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Ir(e, t) {
		var n = Fr(e);
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
			n = Fr(n);
		}
	}
	function Lr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Lr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Rr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Pr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Pr(e.document);
		}
		return t;
	}
	function zr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Br = bn && "documentMode" in document && 11 >= document.documentMode, Vr = null, Hr = null, Ur = null, Wr = !1;
	function Gr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Wr || Vr == null || Vr !== Pr(r) || (r = Vr, "selectionStart" in r && zr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Ur && Nr(Ur, r) || (Ur = r, r = qf(Hr, "onSelect"), 0 < r.length && (t = new jn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Vr)));
	}
	function Kr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var qr = {
		animationend: Kr("Animation", "AnimationEnd"),
		animationiteration: Kr("Animation", "AnimationIteration"),
		animationstart: Kr("Animation", "AnimationStart"),
		transitionrun: Kr("Transition", "TransitionRun"),
		transitionstart: Kr("Transition", "TransitionStart"),
		transitioncancel: Kr("Transition", "TransitionCancel"),
		transitionend: Kr("Transition", "TransitionEnd")
	}, Jr = {}, Yr = {};
	bn && (Yr = document.createElement("div").style, "AnimationEvent" in window || (delete qr.animationend.animation, delete qr.animationiteration.animation, delete qr.animationstart.animation), "TransitionEvent" in window || delete qr.transitionend.transition);
	function Xr(e) {
		if (Jr[e]) return Jr[e];
		if (!qr[e]) return e;
		var t = qr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Yr) return Jr[e] = t[n];
		return e;
	}
	var Zr = Xr("animationend"), Qr = Xr("animationiteration"), $r = Xr("animationstart"), ei = Xr("transitionrun"), ti = Xr("transitionstart"), ni = Xr("transitioncancel"), ri = Xr("transitionend"), ii = /* @__PURE__ */ new Map(), ai = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	ai.push("scrollEnd");
	function oi(e, t) {
		ii.set(e, t), Nt(t, [e]);
	}
	var si = 0;
	function ci(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = vd.identifierPrefix;
		var n = si++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function li(e) {
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
	function ui(e, t) {
		return e = li(e), t = li(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var di = typeof reportError == "function" ? reportError : function(e) {
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
	}, fi = [], pi = 0, mi = 0;
	function hi() {
		for (var e = pi, t = mi = pi = 0; t < e;) {
			var n = fi[t];
			fi[t++] = null;
			var r = fi[t];
			fi[t++] = null;
			var i = fi[t];
			fi[t++] = null;
			var a = fi[t];
			if (fi[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && yi(n, i, a);
		}
	}
	function gi(e, t, n, r) {
		fi[pi++] = e, fi[pi++] = t, fi[pi++] = n, fi[pi++] = r, mi |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function _i(e, t, n, r) {
		return gi(e, t, n, r), bi(e);
	}
	function vi(e, t) {
		return gi(e, null, null, t), bi(e);
	}
	function yi(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - G(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function bi(e) {
		if (50 < Dd) throw Dd = 0, Od = null, Error(s(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var xi = {};
	function Si(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function Ci(e, t, n, r) {
		return new Si(e, t, n, r);
	}
	function wi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Ti(e, t) {
		var n = e.alternate;
		return n === null ? (n = Ci(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function Ei(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function Di(e, t, n, r, i, a) {
		var o = 0;
		if (r = e, typeof r == "function") wi(r) && (o = 1);
		else if (typeof r == "string") o = qm(e, n, N.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case fe: return e = Ci(31, n, t, i), e.elementType = fe, e.lanes = a, e;
			case ne: return Oi(n.children, i, a, t);
			case re:
				o = 8, i |= 24;
				break;
			case ie: return e = Ci(12, n, t, i | 2), e.elementType = ie, e.lanes = a, e;
			case ce: return e = Ci(13, n, t, i), e.elementType = ce, e.lanes = a, e;
			case le: return e = Ci(19, n, t, i), e.elementType = le, e.lanes = a, e;
			case pe:
			case k: return e = i | 32, e = Ci(30, n, t, e), e.elementType = k, e.lanes = a, e.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, e;
			default:
				if (typeof r == "object" && r) switch (r.$$typeof) {
					case oe:
						o = 10;
						break a;
					case ae:
						o = 9;
						break a;
					case se:
						o = 11;
						break a;
					case ue:
						o = 14;
						break a;
					case de:
						o = 16, r = null;
						break a;
				}
				o = 29, n = Error(s(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = Ci(o, n, t, i), t.elementType = e, t.type = r, t.lanes = a, t;
	}
	function Oi(e, t, n, r) {
		return e = Ci(7, e, r, t), e.lanes = n, e;
	}
	function ki(e, t, n) {
		return e = Ci(6, e, null, t), e.lanes = n, e;
	}
	function Ai(e) {
		var t = Ci(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function ji(e, t, n) {
		return t = Ci(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Mi = /* @__PURE__ */ new WeakMap();
	function Ni(e, t) {
		if (typeof e == "object" && e) {
			var n = Mi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Ie(t)
			}, Mi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Ie(t)
		};
	}
	var Pi = [], Fi = 0, Ii = null, Li = 0, Ri = [], zi = 0, Bi = null, Vi = 1, Hi = "";
	function Ui(e, t) {
		Pi[Fi++] = Li, Pi[Fi++] = Ii, Ii = e, Li = t;
	}
	function Wi(e, t, n) {
		Ri[zi++] = Vi, Ri[zi++] = Hi, Ri[zi++] = Bi, Bi = e;
		var r = Vi;
		e = Hi;
		var i = 32 - G(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - G(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Vi = 1 << 32 - G(t) + i | n << i | r, Hi = a + e;
		} else Vi = 1 << a | n << i | r, Hi = e;
	}
	function Gi(e) {
		e.return !== null && (Ui(e, 1), Wi(e, 1, 0));
	}
	function Ki(e) {
		for (; e === Ii;) Ii = Pi[--Fi], Pi[Fi] = null, Li = Pi[--Fi], Pi[Fi] = null;
		for (; e === Bi;) Bi = Ri[--zi], Ri[zi] = null, Hi = Ri[--zi], Ri[zi] = null, Vi = Ri[--zi], Ri[zi] = null;
	}
	function qi(e, t) {
		Ri[zi++] = Vi, Ri[zi++] = Hi, Ri[zi++] = Bi, Vi = t.id, Hi = t.overflow, Bi = e;
	}
	var Ji = null, Yi = null, Y = !1, Xi = null, Zi = !1, Qi = Error(s(519));
	function $i(e) {
		throw aa(Ni(Error(s(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Qi;
	}
	function ea(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[ht] = e, t[gt] = r, n) {
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
				$("invalid", t), Zt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				$("invalid", t);
				break;
			case "textarea": $("invalid", t), tn(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || $f(t.textContent, n) ? (r.popover != null && ($("beforetoggle", t), $("toggle", t)), r.onScroll != null && $("scroll", t), r.onScrollEnd != null && $("scrollend", t), r.onClick != null && (t.onclick = dn), t = !0) : t = !1, t || $i(e, !0);
	}
	function ta(e) {
		for (Ji = e.return; Ji;) switch (Ji.tag) {
			case 5:
			case 31:
			case 13:
				Zi = !1;
				return;
			case 27:
			case 3:
				Zi = !0;
				return;
			default: Ji = Ji.return;
		}
	}
	function na(e) {
		if (e !== Ji) return !1;
		if (!Y) return ta(e), Y = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && Yi && $i(e), ta(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(317));
			Yi = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(317));
			Yi = dm(e);
		} else t === 27 ? (t = Yi, Sp(e.type) ? (e = um, um = null, Yi = e) : Yi = t) : Yi = Ji ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function ra() {
		Yi = Ji = null, Y = !1;
	}
	function ia() {
		var e = Xi;
		return e !== null && (ud === null ? ud = e : ud.push.apply(ud, e), Xi = null), e;
	}
	function aa(e) {
		Xi === null ? Xi = [e] : Xi.push(e);
	}
	var oa = Ce(null), sa = null, ca = null;
	function la(e, t, n) {
		Te(oa, t._currentValue), t._currentValue = n;
	}
	function ua(e) {
		e._currentValue = oa.current, we(oa);
	}
	function da(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function fa(e, t, n, r) {
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
						a.lanes |= n, c = a.alternate, c !== null && (c.lanes |= n), da(a.return, n, e), r || (o = null);
						break a;
					}
					a = c.next;
				}
			} else if (i.tag === 18) {
				if (o = i.return, o === null) throw Error(s(341));
				o.lanes |= n, a = o.alternate, a !== null && (a.lanes |= n), da(o, n, e), o = null;
			} else i.tag === 13 && i.memoizedState !== null && i.memoizedState.dehydrated === null ? (i.lanes |= n, o = i.alternate, o !== null && (o.lanes |= n), da(i.return, n, e), o = i.child, o = o === null ? null : o.sibling) : o = i.child;
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
	function pa(e, t, n, r) {
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
					Mr(i.pendingProps.value, o.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (i === P.current) {
				if (o = i.alternate, o === null) throw Error(s(387));
				o.memoizedState.memoizedState !== i.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			i = i.return;
		}
		return e !== null && fa(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function ma(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Mr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function ha(e) {
		sa = e, ca = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function ga(e) {
		return va(sa, e);
	}
	function _a(e, t) {
		return sa === null && ha(e), va(e, t);
	}
	function va(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, ca === null) {
			if (e === null) throw Error(s(308));
			ca = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else ca = ca.next = t;
		return n;
	}
	var ya = typeof AbortController < "u" ? AbortController : function() {
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
	}, ba = t.unstable_scheduleCallback, xa = t.unstable_NormalPriority, Sa = {
		$$typeof: oe,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function Ca() {
		return {
			controller: new ya(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function wa(e) {
		e.refCount--, e.refCount === 0 && ba(xa, function() {
			e.controller.abort();
		});
	}
	function Ta(e, t) {
		if (e.pendingLanes & 4194048) {
			var n = e.transitionTypes;
			for (n === null && (n = e.transitionTypes = []), e = 0; e < t.length; e++) {
				var r = t[e];
				n.indexOf(r) === -1 && n.push(r);
			}
		}
	}
	var Ea = null;
	function Da(e) {
		var t = e.transitionTypes;
		return e.transitionTypes = null, t;
	}
	var Oa = null, ka = 0, Aa = 0, ja = null;
	function Ma(e, t) {
		if (Oa === null) {
			var n = Oa = [];
			ka = 0, Aa = Nf(), ja = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return ka++, t.then(Na, Na), t;
	}
	function Na() {
		if (--ka === 0 && (Ea = null, Oa !== null)) {
			ja !== null && (ja.status = "fulfilled");
			var e = Oa;
			Oa = null, Aa = 0, ja = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function Pa(e, t) {
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
	var Fa = j.S;
	j.S = function(e, t) {
		if (pd = B(), typeof t == "object" && t && typeof t.then == "function" && Ma(e, t), Ea !== null) for (var n = yf; n !== null;) Ta(n, Ea), n = n.next;
		if (n = e.types, n !== null) {
			for (var r = yf; r !== null;) Ta(r, n), r = r.next;
			if (Aa !== 0) {
				r = Ea, r === null && (r = Ea = []);
				for (var i = 0; i < n.length; i++) {
					var a = n[i];
					r.indexOf(a) === -1 && r.push(a);
				}
			}
		}
		Fa !== null && Fa(e, t);
	};
	var Ia = Ce(null);
	function La() {
		var e = Ia.current;
		return e === null ? Xu.pooledCache : e;
	}
	function Ra(e, t) {
		t === null ? Te(Ia, Ia.current) : Te(Ia, t.pool);
	}
	function za() {
		var e = La();
		return e === null ? null : {
			parent: Sa._currentValue,
			pool: e
		};
	}
	var Ba = Error(s(460)), Va = Error(s(474)), Ha = Error(s(542)), Ua = { then: function() {} };
	function Wa(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Ga(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(dn, dn), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Ya(e), e === void 0 && !("reason" in t) ? Error(s(600)) : e;
			default:
				if (typeof t.status == "string") t.then(dn, dn);
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
					case "rejected": throw e = t.reason, Ya(e), e;
				}
				throw qa = t, Ba;
		}
	}
	function Ka(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (qa = e, Ba) : e;
		}
	}
	var qa = null;
	function Ja() {
		if (qa === null) throw Error(s(459));
		var e = qa;
		return qa = null, e;
	}
	function Ya(e) {
		if (e === Ba || e === Ha) throw Error(s(483));
	}
	var Xa = null, Za = 0;
	function Qa(e) {
		var t = Za;
		return Za += 1, Xa === null && (Xa = []), Ga(Xa, e, t);
	}
	function $a(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function eo(e, t) {
		throw t.$$typeof === O ? Error(s(525)) : (e = Object.prototype.toString.call(t), Error(s(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function to(e) {
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
			return e = Ti(e, t), e.index = 0, e.sibling = null, e;
		}
		function a(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function o(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = ki(n, e.mode, r), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var a = n.type;
			return a === ne ? (e = d(e, t, n.props.children, r, n.key), $a(e, n), e) : t !== null && (t.elementType === a || typeof a == "object" && a && a.$$typeof === de && Ka(a) === t.type) ? (t = i(t, n.props), $a(t, n), t.return = e, t) : (t = Di(n.type, n.key, n.props, null, e.mode, r), $a(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = ji(n, e.mode, r), t.return = e, t) : (t = i(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, a) {
			return t === null || t.tag !== 7 ? (t = Oi(n, e.mode, r, a), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = ki("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case ee: return n = Di(t.type, t.key, t.props, null, e.mode, n), $a(n, t), n.return = e, n;
					case te: return t = ji(t, e.mode, n), t.return = e, t;
					case de: return t = Ka(t), f(e, t, n);
				}
				if (ye(t) || _e(t)) return t = Oi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Qa(t), n);
				if (t.$$typeof === oe) return f(e, _a(e, t), n);
				eo(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case ee: return n.key === i ? l(e, t, n, r) : null;
					case te: return n.key === i ? u(e, t, n, r) : null;
					case de: return n = Ka(n), p(e, t, n, r);
				}
				if (ye(n) || _e(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Qa(n), r);
				if (n.$$typeof === oe) return p(e, t, _a(e, n), r);
				eo(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case ee: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case te: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case de: return r = Ka(r), m(e, t, n, r, i);
				}
				if (ye(r) || _e(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Qa(r), i);
				if (r.$$typeof === oe) return m(e, t, n, _a(t, r), i);
				eo(t, r);
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
			if (h === s.length) return n(i, d), Y && Ui(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (o = a(d, o, h), u === null ? l = d : u.sibling = d, u = d);
				return Y && Ui(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), o = a(g, o, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), Y && Ui(i, h), l;
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
			if (v.done) return n(i, h), Y && Ui(i, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(i, v.value, l), v !== null && (o = a(v, o, g), d === null ? u = v : d.sibling = v, d = v);
				return Y && Ui(i, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, i, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), o = a(v, o, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(i, e);
			}), Y && Ui(i, g), u;
		}
		function _(e, r, a, c) {
			if (typeof a == "object" && a && a.type === ne && a.key === null && a.props.ref === void 0 && (a = a.props.children), typeof a == "object" && a) {
				switch (a.$$typeof) {
					case ee:
						a: {
							for (var l = a.key; r !== null;) {
								if (r.key === l) {
									if (l = a.type, l === ne) {
										if (r.tag === 7) {
											n(e, r.sibling), c = i(r, a.props.children), $a(c, a), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === de && Ka(l) === r.type) {
										n(e, r.sibling), c = i(r, a.props), $a(c, a), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							a.type === ne ? (c = Oi(a.props.children, e.mode, c, a.key), $a(c, a), c.return = e, e = c) : (c = Di(a.type, a.key, a.props, null, e.mode, c), $a(c, a), c.return = e, e = c);
						}
						return o(e);
					case te:
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
							c = ji(a, e.mode, c), c.return = e, e = c;
						}
						return o(e);
					case de: return a = Ka(a), _(e, r, a, c);
				}
				if (ye(a)) return h(e, r, a, c);
				if (_e(a)) {
					if (l = _e(a), typeof l != "function") throw Error(s(150));
					return a = l.call(a), g(e, r, a, c);
				}
				if (typeof a.then == "function") return _(e, r, Qa(a), c);
				if (a.$$typeof === oe) return _(e, r, _a(e, a), c);
				eo(e, a);
			}
			return typeof a == "string" && a !== "" || typeof a == "number" || typeof a == "bigint" ? (a = "" + a, r !== null && r.tag === 6 ? (n(e, r.sibling), c = i(r, a), c.return = e, e = c) : (n(e, r), c = ki(a, e.mode, c), c.return = e, e = c), o(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Za = 0;
				var i = _(e, t, n, r);
				return Xa = null, i;
			} catch (t) {
				if (t === Ba || t === Ha) throw t;
				var a = Ci(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var no = to(!0), ro = to(!1), io = !1;
	function ao(e) {
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
	function oo(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function so(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function co(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, Yu & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = bi(e), yi(e, null, n), t;
		}
		return gi(e, r, t, n), bi(e);
	}
	function lo(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ct(e, n);
		}
	}
	function uo(e, t) {
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
	var fo = !1;
	function po() {
		if (fo) {
			var e = ja;
			if (e !== null) throw e;
		}
	}
	function mo(e, t, n, r) {
		fo = !1;
		var i = e.updateQueue;
		io = !1;
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
					f !== 0 && f === Aa && (fo = !0), u !== null && (u = u.next = {
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
								d = D({}, d, f);
								break a;
							case 2: io = !0;
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
	function ho(e, t) {
		if (typeof e != "function") throw Error(s(191, e));
		e.call(t);
	}
	function go(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) ho(n[e], t);
	}
	var _o = Ce(null), vo = Ce(0);
	function yo(e, t) {
		e = nd, Te(vo, e), Te(_o, t), nd = e | t.baseLanes;
	}
	function bo() {
		Te(vo, nd), Te(_o, _o.current);
	}
	function xo() {
		nd = vo.current, we(_o), we(vo);
	}
	var So = Ce(null), Co = null;
	function wo(e) {
		var t = e.alternate;
		Te(ko, ko.current & 1), Te(So, e), Co === null && (t === null || _o.current !== null || t.memoizedState !== null) && (Co = e);
	}
	function To(e) {
		Te(ko, ko.current), Te(So, e), Co === null && (Co = e);
	}
	function Eo(e) {
		e.tag === 22 ? (Te(ko, ko.current), Te(So, e), Co === null && (Co = e)) : Do();
	}
	function Do() {
		Te(ko, ko.current), Te(So, So.current);
	}
	function Oo(e) {
		we(So), Co === e && (Co = null), we(ko);
	}
	var ko = Ce(0);
	function Ao(e, t) {
		Te(So, So.current), Te(ko, t);
	}
	function jo(e) {
		we(ko), we(So), Co === e && (Co = null);
	}
	function Mo(e) {
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
	var No = 0, X = null, Po = null, Fo = null, Io = !1, Lo = !1, Ro = !1, zo = 0, Bo = 0, Vo = null, Ho = 0;
	function Uo() {
		throw Error(s(321));
	}
	function Wo(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Mr(e[n], t[n])) return !1;
		return !0;
	}
	function Go(e, t, n, r, i, a) {
		return No = a, X = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, j.H = e === null || e.memoizedState === null ? cc : lc, Ro = !1, a = n(r, i), Ro = !1, Lo && (a = qo(t, n, r, i)), Ko(e), a;
	}
	function Ko(e) {
		j.H = sc;
		var t = Po !== null && Po.next !== null;
		if (No = 0, Fo = Po = X = null, Io = !1, Bo = 0, Vo = null, t) throw Error(s(300));
		e === null || Ec || (e = e.dependencies, e !== null && ma(e) && (Ec = !0));
	}
	function qo(e, t, n, r) {
		X = e;
		var i = 0;
		do {
			if (Lo && (Vo = null), Bo = 0, Lo = !1, 25 <= i) throw Error(s(301));
			if (i += 1, Fo = Po = null, e.updateQueue != null) {
				var a = e.updateQueue;
				a.lastEffect = null, a.events = null, a.stores = null, a.memoCache != null && (a.memoCache.index = 0);
			}
			j.H = uc, a = t(n, r);
		} while (Lo);
		return a;
	}
	function Jo() {
		var e = j.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? ts(t) : t, e = e.useState()[0], (Po === null ? null : Po.memoizedState) !== e && (X.flags |= 1024), t;
	}
	function Yo() {
		var e = zo !== 0;
		return zo = 0, e;
	}
	function Xo(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Zo(e) {
		if (Io) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			Io = !1;
		}
		No = 0, Fo = Po = X = null, Lo = !1, Bo = zo = 0, Vo = null;
	}
	function Qo() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return Fo === null ? X.memoizedState = Fo = e : Fo = Fo.next = e, Fo;
	}
	function $o() {
		if (Po === null) {
			var e = X.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = Po.next;
		var t = Fo === null ? X.memoizedState : Fo.next;
		if (t !== null) Fo = t, Po = e;
		else {
			if (e === null) throw X.alternate === null ? Error(s(467)) : Error(s(310));
			Po = e, e = {
				memoizedState: Po.memoizedState,
				baseState: Po.baseState,
				baseQueue: Po.baseQueue,
				queue: Po.queue,
				next: null
			}, Fo === null ? X.memoizedState = Fo = e : Fo = Fo.next = e;
		}
		return Fo;
	}
	function es() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function ts(e) {
		var t = Bo;
		return Bo += 1, Vo === null && (Vo = []), e = Ga(Vo, e, t), t = X, (Fo === null ? t.memoizedState : Fo.next) === null && (t = t.alternate, j.H = t === null || t.memoizedState === null ? cc : lc), e;
	}
	function ns(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return ts(e);
			if (e.$$typeof === he) return;
			if (e.$$typeof === oe) return ga(e);
		}
		throw Error(s(438, String(e)));
	}
	function rs(e) {
		var t = null, n = X.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = X.alternate;
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
		}, n === null && (n = es(), X.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = me;
		return t.index++, n;
	}
	function is(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function as(e) {
		return os($o(), Po, e);
	}
	function os(e, t, n) {
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
				if (f === u.lane ? (No & f) === f : (Q & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === Aa && (d = !0);
					else if ((No & p) === p) {
						u = u.next, p === Aa && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, o = a) : l = l.next = f, X.lanes |= p, id |= p;
					f = u.action, Ro && n(a, f), a = u.hasEagerState ? u.eagerState : n(a, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, o = a) : l = l.next = p, X.lanes |= f, id |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? o = a : l.next = c, !Mr(a, e.memoizedState) && (Ec = !0, d && (n = ja, n !== null))) throw n;
			e.memoizedState = a, e.baseState = o, e.baseQueue = l, r.lastRenderedState = a;
		}
		return i === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function ss(e) {
		var t = $o(), n = t.queue;
		if (n === null) throw Error(s(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, i = n.pending, a = t.memoizedState;
		if (i !== null) {
			n.pending = null;
			var o = i = i.next;
			do
				a = e(a, o.action), o = o.next;
			while (o !== i);
			Mr(a, t.memoizedState) || (Ec = !0), t.memoizedState = a, t.baseQueue === null && (t.baseState = a), n.lastRenderedState = a;
		}
		return [a, r];
	}
	function cs(e, t, n) {
		var r = X, i = $o(), a = Y;
		if (a) {
			if (n === void 0) throw Error(s(407));
			n = n();
		} else n = t();
		var o = !Mr((Po || i).memoizedState, n);
		if (o && (i.memoizedState = n, Ec = !0), i = i.queue, Ns(ds.bind(null, r, i, e), [e]), e = i.getSnapshot !== t || o || Fo !== null && !!(Fo.memoizedState.tag & 1), Os(e ? 9 : 8, { destroy: void 0 }, us.bind(null, r, i, n, t), null), e) {
			if (r.flags |= 2048, Xu === null) throw Error(s(349));
			a || No & 127 || ls(r, t, n);
		}
		return n;
	}
	function ls(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = X.updateQueue, t === null ? (t = es(), X.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function us(e, t, n, r) {
		t.value = n, t.getSnapshot = r, fs(t) && ps(e);
	}
	function ds(e, t, n) {
		return n(function() {
			fs(t) && ps(e);
		});
	}
	function fs(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Mr(e, n);
		} catch {
			return !0;
		}
	}
	function ps(e) {
		var t = vi(e, 2);
		t !== null && Md(t, e, 2);
	}
	function ms(e) {
		var t = Qo();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Ro) {
				Ge(!0);
				try {
					n();
				} finally {
					Ge(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: is,
			lastRenderedState: e
		}, t;
	}
	function hs(e, t, n, r) {
		return e.baseState = n, os(e, Po, typeof r == "function" ? r : is);
	}
	function gs(e, t, n, r, i) {
		if (ic(e)) throw Error(s(485));
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
			j.T === null ? a.isTransition = !1 : n(!0), r(a), n = t.pending, n === null ? (a.next = t.pending = a, _s(t, a)) : (a.next = n.next, t.pending = n.next = a);
		}
	}
	function _s(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = j.T, o = {};
			o.types = a === null ? null : a.types, j.T = o;
			try {
				var s = n(i, r), c = j.S;
				c !== null && c(o, s), vs(e, t, s);
			} catch (n) {
				bs(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), j.T = a;
			}
		} else try {
			a = n(i, r), vs(e, t, a);
		} catch (n) {
			bs(e, t, n);
		}
	}
	function vs(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			ys(e, t, n);
		}, function(n) {
			return bs(e, t, n);
		}) : ys(e, t, n);
	}
	function ys(e, t, n) {
		t.status = "fulfilled", t.value = n, xs(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, _s(e, n)));
	}
	function bs(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, xs(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function xs(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function Ss(e, t) {
		return t;
	}
	function Cs(e, t) {
		if (Y) {
			var n = Xu.formState;
			if (n !== null) {
				a: {
					var r = X;
					if (Y) {
						if (Yi) {
							b: {
								for (var i = Yi, a = Zi; i.nodeType !== 8;) if (!a || (i = lm(i.nextSibling), i === null)) {
									i = null;
									break b;
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								Yi = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						$i(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = Qo(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Ss,
			lastRenderedState: t
		}, n.queue = r, n = tc.bind(null, X, r), r.dispatch = n, r = ms(!1), a = rc.bind(null, X, !1, r.queue), r = Qo(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = gs.bind(null, X, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function ws(e) {
		return Ts($o(), Po, e);
	}
	function Ts(e, t, n) {
		if (t = os(e, t, Ss)[0], e = as(is)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = ts(t);
		} catch (e) {
			throw e === Ba ? Ha : e;
		}
		else r = t;
		t = $o();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (X.flags |= 2048, Os(9, { destroy: void 0 }, Es.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Es(e, t) {
		e.action = t;
	}
	function Ds(e) {
		var t = $o(), n = Po;
		if (n !== null) return Ts(t, n, e);
		$o(), t = t.memoizedState, n = $o();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function Os(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = X.updateQueue, t === null && (t = es(), X.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function ks() {
		return $o().memoizedState;
	}
	function As(e, t, n, r) {
		var i = Qo();
		X.flags |= e, i.memoizedState = Os(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function js(e, t, n, r) {
		var i = $o();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		Po !== null && r !== null && Wo(r, Po.memoizedState.deps) ? i.memoizedState = Os(t, a, n, r) : (X.flags |= e, i.memoizedState = Os(1 | t, a, n, r));
	}
	function Ms(e, t) {
		As(8390656, 8, e, t);
	}
	function Ns(e, t) {
		js(2048, 8, e, t);
	}
	function Ps(e) {
		X.flags |= 4;
		var t = X.updateQueue;
		if (t === null) t = es(), X.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function Fs(e) {
		var t = $o().memoizedState;
		return Ps({
			ref: t,
			nextImpl: e
		}), function() {
			if (Yu & 2) throw Error(s(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function Is(e, t) {
		return js(4, 2, e, t);
	}
	function Ls(e, t) {
		return js(4, 4, e, t);
	}
	function Rs(e, t) {
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
	function zs(e, t, n) {
		n = n == null ? null : n.concat([e]), js(4, 4, Rs.bind(null, t, e), n);
	}
	function Bs() {}
	function Vs(e, t) {
		var n = $o();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && Wo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function Hs(e, t) {
		var n = $o();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && Wo(t, r[1])) return r[0];
		if (r = e(), Ro) {
			Ge(!0);
			try {
				e();
			} finally {
				Ge(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function Us(e, t, n) {
		return n === void 0 || No & 1073741824 && !(Q & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = Ad(), X.lanes |= e, id |= e, n);
	}
	function Ws(e, t, n, r) {
		return Mr(n, t) ? n : _o.current === null ? !(No & 106) || No & 1073741824 && !(Q & 261930) ? (Ec = !0, e.memoizedState = n) : (e = Ad(), X.lanes |= e, id |= e, t) : (e = Us(e, n, r), Mr(e, t) || (Ec = !0), e);
	}
	function Gs(e, t, n, r, i) {
		var a = M.p;
		M.p = a !== 0 && 8 > a ? a : 8;
		var o = j.T, s = {};
		s.types = o === null ? null : o.types, j.T = s, rc(e, !1, t, n);
		try {
			var c = i(), l = j.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? nc(e, t, Pa(c, r), kd(e)) : nc(e, t, r, kd(e));
		} catch (n) {
			nc(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, kd());
		} finally {
			M.p = a, o !== null && s.types !== null && (o.types = s.types), j.T = o;
		}
	}
	function Ks() {}
	function qs(e, t, n, r) {
		if (e.tag !== 5) throw Error(s(476));
		var i = Js(e).queue;
		Gs(e, i, t, be, n === null ? Ks : function() {
			return Ys(e), n(r);
		});
	}
	function Js(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: be,
			baseState: be,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: is,
				lastRenderedState: be
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
				lastRenderedReducer: is,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Ys(e) {
		var t = Js(e);
		t.next === null && (t = e.alternate.memoizedState), nc(e, t.next.queue, {}, kd());
	}
	function Xs() {
		return ga(sh);
	}
	function Zs() {
		return $o().memoizedState;
	}
	function Qs() {
		return $o().memoizedState;
	}
	function $s(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = kd();
					e = so(n);
					var r = co(t, e, n);
					r !== null && (Md(r, t, n), lo(r, t, n)), t = { cache: Ca() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function ec(e, t, n) {
		var r = kd();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, ic(e) ? ac(t, n) : (n = _i(e, t, n, r), n !== null && (Md(n, e, r), oc(n, t, r)));
	}
	function tc(e, t, n) {
		nc(e, t, n, kd());
	}
	function nc(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (ic(e)) ac(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Mr(s, o)) return gi(e, t, i, 0), Xu === null && hi(), !1;
			} catch {}
			if (n = _i(e, t, i, r), n !== null) return Md(n, e, r), oc(n, t, r), !0;
		}
		return !1;
	}
	function rc(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: Nf(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, ic(e)) {
			if (t) throw Error(s(479));
		} else t = _i(e, n, r, 2), t !== null && Md(t, e, 2);
	}
	function ic(e) {
		var t = e.alternate;
		return e === X || t !== null && t === X;
	}
	function ac(e, t) {
		Lo = Io = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function oc(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ct(e, n);
		}
	}
	var sc = {
		readContext: ga,
		use: ns,
		useCallback: Uo,
		useContext: Uo,
		useEffect: Uo,
		useImperativeHandle: Uo,
		useLayoutEffect: Uo,
		useInsertionEffect: Uo,
		useMemo: Uo,
		useReducer: Uo,
		useRef: Uo,
		useState: Uo,
		useDebugValue: Uo,
		useDeferredValue: Uo,
		useTransition: Uo,
		useSyncExternalStore: Uo,
		useId: Uo,
		useHostTransitionStatus: Uo,
		useFormState: Uo,
		useActionState: Uo,
		useOptimistic: Uo,
		useMemoCache: Uo,
		useCacheRefresh: Uo,
		useEffectEvent: Uo
	}, cc = {
		readContext: ga,
		use: ns,
		useCallback: function(e, t) {
			return Qo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: ga,
		useEffect: Ms,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), As(4194308, 4, Rs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return As(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			As(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = Qo();
			t = t === void 0 ? null : t;
			var r = e();
			if (Ro) {
				Ge(!0);
				try {
					e();
				} finally {
					Ge(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = Qo();
			if (n !== void 0) {
				var i = n(t);
				if (Ro) {
					Ge(!0);
					try {
						n(t);
					} finally {
						Ge(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = ec.bind(null, X, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = Qo();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = ms(e);
			var t = e.queue, n = tc.bind(null, X, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Bs,
		useDeferredValue: function(e, t) {
			return Us(Qo(), e, t);
		},
		useTransition: function() {
			var e = ms(!1);
			return e = Gs.bind(null, X, e.queue, !0, !1), Qo().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = X, i = Qo();
			if (Y) {
				if (n === void 0) throw Error(s(407));
				n = n();
			} else {
				if (n = t(), Xu === null) throw Error(s(349));
				Q & 127 || ls(r, t, n);
			}
			i.memoizedState = n;
			var a = {
				value: n,
				getSnapshot: t
			};
			return i.queue = a, Ms(ds.bind(null, r, a, e), [e]), r.flags |= 2048, Os(9, { destroy: void 0 }, us.bind(null, r, a, n, t), null), n;
		},
		useId: function() {
			var e = Qo(), t = Xu.identifierPrefix;
			if (Y) {
				var n = Hi, r = Vi;
				n = (r & ~(1 << 32 - G(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = zo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = Ho++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Xs,
		useFormState: Cs,
		useActionState: Cs,
		useOptimistic: function(e) {
			var t = Qo();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = rc.bind(null, X, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: rs,
		useCacheRefresh: function() {
			return Qo().memoizedState = $s.bind(null, X);
		},
		useEffectEvent: function(e) {
			var t = Qo(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (Yu & 2) throw Error(s(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, lc = {
		readContext: ga,
		use: ns,
		useCallback: Vs,
		useContext: ga,
		useEffect: Ns,
		useImperativeHandle: zs,
		useInsertionEffect: Is,
		useLayoutEffect: Ls,
		useMemo: Hs,
		useReducer: as,
		useRef: ks,
		useState: function() {
			return as(is);
		},
		useDebugValue: Bs,
		useDeferredValue: function(e, t) {
			return Ws($o(), Po.memoizedState, e, t);
		},
		useTransition: function() {
			var e = as(is)[0], t = $o().memoizedState;
			return [typeof e == "boolean" ? e : ts(e), t];
		},
		useSyncExternalStore: cs,
		useId: Zs,
		useHostTransitionStatus: Xs,
		useFormState: ws,
		useActionState: ws,
		useOptimistic: function(e, t) {
			return hs($o(), Po, e, t);
		},
		useMemoCache: rs,
		useCacheRefresh: Qs,
		useEffectEvent: Fs
	}, uc = {
		readContext: ga,
		use: ns,
		useCallback: Vs,
		useContext: ga,
		useEffect: Ns,
		useImperativeHandle: zs,
		useInsertionEffect: Is,
		useLayoutEffect: Ls,
		useMemo: Hs,
		useReducer: ss,
		useRef: ks,
		useState: function() {
			return ss(is);
		},
		useDebugValue: Bs,
		useDeferredValue: function(e, t) {
			var n = $o();
			return Po === null ? Us(n, e, t) : Ws(n, Po.memoizedState, e, t);
		},
		useTransition: function() {
			var e = ss(is)[0], t = $o().memoizedState;
			return [typeof e == "boolean" ? e : ts(e), t];
		},
		useSyncExternalStore: cs,
		useId: Zs,
		useHostTransitionStatus: Xs,
		useFormState: Ds,
		useActionState: Ds,
		useOptimistic: function(e, t) {
			var n = $o();
			return Po === null ? (n.baseState = e, [e, n.queue.dispatch]) : hs(n, Po, e, t);
		},
		useMemoCache: rs,
		useCacheRefresh: Qs,
		useEffectEvent: Fs
	};
	function dc(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : D({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var fc = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = kd(), i = so(r);
			i.payload = t, n != null && (i.callback = n), t = co(e, i, r), t !== null && (Md(t, e, r), lo(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = kd(), i = so(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = co(e, i, r), t !== null && (Md(t, e, r), lo(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = kd(), r = so(n);
			r.tag = 2, t != null && (r.callback = t), t = co(e, r, n), t !== null && (Md(t, e, n), lo(t, e, n));
		}
	};
	function pc(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Nr(n, r) || !Nr(i, a) : !0;
	}
	function mc(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && fc.enqueueReplaceState(t, t.state, null);
	}
	function hc(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = D({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function gc(e) {
		di(e);
	}
	function _c(e) {
		console.error(e);
	}
	function vc(e) {
		di(e);
	}
	function yc(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function bc(e, t, n) {
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
	function xc(e, t, n) {
		return n = so(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			yc(e, t);
		}, n;
	}
	function Sc(e) {
		return e = so(e), e.tag = 3, e;
	}
	function Cc(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				bc(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			bc(t, n, r), typeof i != "function" && (gd === null ? gd = /* @__PURE__ */ new Set([this]) : gd.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function wc(e, t, n, r, i) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && pa(t, n, i, !0), n = So.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13:
					case 19: return Co === null ? Wd() : n.alternate === null && rd === 0 && (rd = 3), n.flags &= -257, n.flags |= 65536, n.lanes = i, r === Ua ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), pf(e, r, i)), !1;
					case 22: return n.flags |= 65536, r === Ua ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), pf(e, r, i)), !1;
				}
				throw Error(s(435, n.tag));
			}
			return pf(e, r, i), Wd(), !1;
		}
		if (Y) return t = So.current, t === null ? (r !== Qi && (t = Error(s(423), { cause: r }), aa(Ni(t, n))), e = e.current.alternate, e.flags |= 65536, i &= -i, e.lanes |= i, r = Ni(r, n), i = xc(e.stateNode, r, i), uo(e, i), rd !== 4 && (rd = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = i, r !== Qi && (e = Error(s(422), { cause: r }), aa(Ni(e, n)))), !1;
		var a = Error(s(520), { cause: r });
		if (a = Ni(a, n), ld === null ? ld = [a] : ld.push(a), rd !== 4 && (rd = 2), t === null) return !0;
		r = Ni(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = i & -i, n.lanes |= e, e = xc(n.stateNode, r, e), uo(n, e), !1;
				case 1:
					if (t = n.type, a = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || a !== null && typeof a.componentDidCatch == "function" && (gd === null || !gd.has(a)))) return n.flags |= 65536, i &= -i, n.lanes |= i, i = Sc(i), Cc(i, e, n, r), uo(n, i), !1;
					break;
				case 22: if (n.memoizedState !== null) return n.flags |= 65536, !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Tc = Error(s(461)), Ec = !1;
	function Dc(e, t, n, r) {
		t.child = e === null ? ro(t, null, n, r) : no(t, e.child, n, r);
	}
	function Oc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return ha(t), r = Go(e, t, n, o, a, i), s = Yo(), e !== null && !Ec ? (Xo(e, t, i), nl(e, t, i)) : (Y && s && Gi(t), t.flags |= 1, Dc(e, t, r, i), t.child);
	}
	function kc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !wi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, Ac(e, t, a, r, i)) : (e = Di(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !rl(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Nr : n, n(o, r) && e.ref === t.ref) return nl(e, t, i);
		}
		return t.flags |= 1, e = Ti(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Ac(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Nr(a, r) && e.ref === t.ref) {
				if (Ec = !1, t.pendingProps = r = a, rl(e, i)) e.flags & 131072 && (Ec = !0);
				else return t.lanes = e.lanes, nl(e, t, i);
			}
		}
		return Rc(e, t, n, r, i);
	}
	function jc(e, t, n, r) {
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
				return Nc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && Ra(t, a === null ? null : a.cachePool), a === null ? bo() : yo(t, a), Eo(t);
			else return r = t.lanes = 536870912, Nc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && Ra(t, null), bo(), Do()) : (Ra(t, a.cachePool), yo(t, a), Do(), t.memoizedState = null);
		return Dc(e, t, i, n), t.child;
	}
	function Mc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function Nc(e, t, n, r, i) {
		var a = La();
		return a = a === null ? null : {
			parent: Sa._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && Ra(t, null), bo(), Eo(t), e !== null && pa(e, t, r, !0), t.childLanes = i, null;
	}
	function Pc(e, t) {
		return t = qc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function Fc(e, t, n) {
		return no(t, e.child, null, n), e = Pc(t, t.pendingProps), e.flags |= 2, Oo(t), t.memoizedState = null, e;
	}
	function Ic(e, t, n) {
		var r = t.pendingProps, i = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (Y) {
				if (r.mode === "hidden") return e = Pc(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, Mc(null, e);
				if (To(t), (e = Yi) ? (e = am(e, Zi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Bi === null ? null : {
						id: Vi,
						overflow: Hi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ai(e), n.return = t, t.child = n, Ji = t, Yi = null)) : e = null, e === null) throw $i(t);
				return t.lanes = 536870912, null;
			}
			return Pc(t, r);
		}
		var a = e.memoizedState;
		if (a !== null) {
			var o = a.dehydrated;
			if (To(t), i) {
				if (t.flags & 256) t.flags &= -257, t = Fc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(s(558));
			} else if (Ec || pa(e, t, n, !1), i = (n & e.childLanes) !== 0, Ec || i) {
				if (_o.current === null) {
					if (r = Xu, r !== null && (o = lt(r, n), o !== 0 && o !== a.retryLane)) throw a.retryLane = o, vi(e, o), Md(r, e, o), Tc;
					Wd();
				}
				t = Fc(e, t, n);
			} else e = a.treeContext, Yi = lm(o.nextSibling), Ji = t, Y = !0, Xi = null, Zi = !1, e !== null && qi(t, e), t = Pc(t, r), t.flags |= 134221824;
			return t;
		}
		return e = Ti(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function Lc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(s(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function Rc(e, t, n, r, i) {
		return ha(t), n = Go(e, t, n, r, void 0, i), r = Yo(), e !== null && !Ec ? (Xo(e, t, i), nl(e, t, i)) : (Y && r && Gi(t), t.flags |= 1, Dc(e, t, n, i), t.child);
	}
	function zc(e, t, n, r, i, a) {
		return ha(t), t.updateQueue = null, n = qo(t, r, n, i), Ko(e), r = Yo(), e !== null && !Ec ? (Xo(e, t, a), nl(e, t, a)) : (Y && r && Gi(t), t.flags |= 1, Dc(e, t, n, a), t.child);
	}
	function Bc(e, t, n, r, i) {
		if (ha(t), t.stateNode === null) {
			var a = xi, o = n.contextType;
			typeof o == "object" && o && (a = ga(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = fc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, ao(t), o = n.contextType, a.context = typeof o == "object" && o ? ga(o) : xi, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (dc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && fc.enqueueReplaceState(a, a.state, null), mo(t, r, a, i), po(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = hc(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = xi, typeof u == "object" && u && (o = ga(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && mc(t, a, r, o), io = !1;
			var f = t.memoizedState;
			a.state = f, mo(t, r, a, i), po(), l = t.memoizedState, s || f !== l || io ? (typeof d == "function" && (dc(t, n, d, r), l = t.memoizedState), (c = io || pc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, oo(e, t), o = t.memoizedProps, u = hc(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = xi, typeof l == "object" && l && (c = ga(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && mc(t, a, r, c), io = !1, f = t.memoizedState, a.state = f, mo(t, r, a, i), po();
			var p = t.memoizedState;
			o !== d || f !== p || io || e !== null && e.dependencies !== null && ma(e.dependencies) ? (typeof s == "function" && (dc(t, n, s, r), p = t.memoizedState), (u = io || pc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && ma(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, Lc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = no(t, e.child, null, i), t.child = no(t, null, n, i)) : Dc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = nl(e, t, i), e;
	}
	function Vc(e, t, n, r) {
		return ra(), t.flags |= 256, Dc(e, t, n, r), t.child;
	}
	var Hc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function Uc(e) {
		return {
			baseLanes: e,
			cachePool: za()
		};
	}
	function Wc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= sd), e;
	}
	function Gc(e, t, n) {
		var r = t.pendingProps, i = !1, a = !!(t.flags & 128), o;
		if ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : !!(ko.current & 2)), o && (i = !0, t.flags &= -129), o = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (Y) {
				if (i ? wo(t) : Do(), (e = Yi) ? (e = am(e, Zi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Bi === null ? null : {
						id: Vi,
						overflow: Hi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ai(e), n.return = t, t.child = n, Ji = t, Yi = null)) : e = null, e === null) throw $i(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (Do(), i = t.mode, a = qc({
				mode: "hidden",
				children: a
			}, i), r = Oi(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = Uc(n), r.childLanes = Wc(e, o, n), t.memoizedState = Hc, Mc(null, r)) : (wo(t), Kc(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return Yc(e, t, a, o, r, c, s, n);
		}
		return i ? (Do(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = Ti(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = Oi(i, a, n, null), i.flags |= 2) : i = Ti(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, Mc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = Uc(n) : (a = i.cachePool, a === null ? a = za() : (s = Sa._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = Wc(e, o, n), t.memoizedState = Hc, Mc(e.child, r)) : (wo(t), n = e.child, e = n.sibling, n = Ti(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (o = t.deletions, o === null ? (t.deletions = [e], t.flags |= 16) : o.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function Kc(e, t) {
		return t = qc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function qc(e, t) {
		return e = Ci(22, e, null, t), e.lanes = 0, e;
	}
	function Jc(e, t, n) {
		return no(t, e.child, null, n), e = Kc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Yc(e, t, n, r, i, a, o, c) {
		if (n) return t.flags & 256 ? (wo(t), t.flags &= -257, Jc(e, t, c)) : t.memoizedState === null ? (Do(), a = i.fallback, o = t.mode, i = qc({
			mode: "visible",
			children: i.children
		}, o), a = Oi(a, o, c, null), a.flags |= 2, i.return = t, a.return = t, i.sibling = a, t.child = i, no(t, e.child, null, c), i = t.child, i.memoizedState = Uc(c), i.childLanes = Wc(e, r, c), t.memoizedState = Hc, Mc(null, i)) : (Do(), t.child = e.child, t.flags |= 128, null);
		if (wo(t), sm(a)) {
			if (r = a.nextSibling && a.nextSibling.dataset, r) var l = r.dgst;
			return r = l, r !== "" && (i = Error(s(419)), i.stack = "", i.digest = r, aa({
				value: i,
				source: null,
				stack: null
			})), Jc(e, t, c);
		}
		if (Ec || pa(e, t, c, !1), r = (c & e.childLanes) !== 0, Ec || r) {
			if (_o.current !== null) return Jc(e, t, c);
			if (r = Xu, r !== null && (i = lt(r, c), i !== 0 && i !== o.retryLane)) throw o.retryLane = i, vi(e, i), Md(r, e, i), Tc;
			return om(a) || Wd(), Jc(e, t, c);
		}
		return om(a) ? (t.flags |= 192, t.child = e.child, null) : (e = o.treeContext, Yi = lm(a.nextSibling), Ji = t, Y = !0, Xi = null, Zi = !1, e !== null && qi(t, e), t = Kc(t, i.children), t.flags |= 134221824, t);
	}
	function Xc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), da(e.return, t, n);
	}
	function Zc(e) {
		for (var t = null; e !== null;) {
			var n = e.alternate;
			n !== null && Mo(n) === null && (t = e), e = e.sibling;
		}
		return t;
	}
	function Qc(e, t, n, r, i, a) {
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
	function $c(e) {
		var t = e.child;
		for (e.child = null; t !== null;) {
			var n = t.sibling;
			t.sibling = e.child, e.child = t, t = n;
		}
	}
	function el(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = ko.current;
		if (t.flags & 128) return Ao(t, o), null;
		var s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Ao(t, o), i === "backwards" && e !== null ? ($c(e), Dc(e, t, r, n), $c(e)) : Dc(e, t, r, n), r = Y ? Li : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Xc(e, n, t);
			else if (e.tag === 19) Xc(e, n, t);
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
				n = Zc(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null, $c(t)), Qc(t, !0, i, null, a, r);
				break;
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && Mo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Qc(t, !0, n, null, a, r);
				break;
			case "together":
				Qc(t, !1, null, null, void 0, r);
				break;
			case "independent":
				t.memoizedState = null;
				break;
			default: n = Zc(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Qc(t, !1, i, n, a, r);
		}
		return t.child;
	}
	function tl(e, t, n) {
		var r = t.pendingProps;
		return la(t, t.type, r.value), Dc(e, t, r.children, n), t.child;
	}
	function nl(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), id |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (pa(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(s(153));
		if (t.child !== null) {
			for (e = t.child, n = Ti(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Ti(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function rl(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && ma(e)));
	}
	function il(e, t, n) {
		switch (t.tag) {
			case 3:
				F(t, t.stateNode.containerInfo), la(t, Sa, e.memoizedState.cache), ra();
				break;
			case 27:
			case 5:
				ke(t);
				break;
			case 4:
				F(t, t.stateNode.containerInfo);
				break;
			case 10:
				la(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, To(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) {
					if (r.dehydrated !== null) return wo(t), t.flags |= 128, null;
					r = pa(e, t, n, !1);
					var i = t.child.childLanes;
					return r || (n & i) !== 0 ? Gc(e, t, n) : (wo(t), e = nl(e, t, n), e === null ? null : e.sibling);
				}
				wo(t);
				break;
			case 19:
				if (t.flags & 128) return el(e, t, n);
				if (i = !!(e.flags & 128), r = (n & t.childLanes) !== 0, r ||= (pa(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return el(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Ao(t, ko.current), r) break;
				return null;
			case 22: return t.lanes = 0, jc(e, t, n, t.pendingProps);
			case 24: la(t, Sa, e.memoizedState.cache);
		}
		return nl(e, t, n);
	}
	function al(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) Ec = !0;
			else {
				if (!rl(e, n) && !(t.flags & 128)) return Ec = !1, il(e, t, n);
				Ec = !!(e.flags & 131072);
			}
		} else Ec = !1, Y && t.flags & 1048576 && Wi(t, Li, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ka(t.elementType), t.type = e, typeof e == "function") wi(e) ? (r = hc(e, r), t.tag = 1, t = Bc(null, t, e, r, n)) : (t.tag = 0, t = Rc(null, t, e, r, n));
					else {
						if (e != null) {
							var i = e.$$typeof;
							if (i === se) {
								t.tag = 11, t = Oc(null, t, e, r, n);
								break a;
							}
							if (i === ue) {
								t.tag = 14, t = kc(null, t, e, r, n);
								break a;
							}
							if (i === oe) {
								t.tag = 10, t.type = e, t = tl(null, t, n);
								break a;
							}
						}
						throw t = ve(e) || e, Error(s(306, t, ""));
					}
				}
				return t;
			case 0: return Rc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, i = hc(r, t.pendingProps), Bc(e, t, r, i, n);
			case 3:
				a: {
					if (F(t, t.stateNode.containerInfo), e === null) throw Error(s(387));
					r = t.pendingProps;
					var a = t.memoizedState;
					i = a.element, oo(e, t), mo(t, r, null, n);
					var o = t.memoizedState;
					if (r = o.cache, la(t, Sa, r), r !== a.cache && fa(t, [Sa], n, !0), po(), r = o.element, a.isDehydrated) {
						if (a = {
							element: r,
							isDehydrated: !1,
							cache: o.cache
						}, t.updateQueue.baseState = a, t.memoizedState = a, t.flags & 256) {
							t = Vc(e, t, r, n);
							break a;
						}
						if (r !== i) {
							i = Ni(Error(s(424)), t), aa(i), t = Vc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (Yi = lm(e.firstChild), Ji = t, Y = !0, Xi = null, Zi = !0, n = ro(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (ra(), r === i) {
							t = nl(e, t, n);
							break a;
						}
						Dc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return Lc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : Y || (t.stateNode = fp(t.type, t.pendingProps, De.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return ke(t), e === null && Y && (r = t.stateNode = hm(t.type, t.pendingProps, De.current), Ji = t, Zi = !0, i = Yi, Sp(t.type) ? (um = i, Yi = lm(r.firstChild)) : Yi = i), Dc(e, t, t.pendingProps.children, n), Lc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && Y && ((i = r = Yi) && (r = rm(r, t.type, t.pendingProps, Zi), r === null ? i = !1 : (t.stateNode = r, Ji = t, Yi = lm(r.firstChild), Zi = !1, i = !0)), i || $i(t)), ke(t), i = t.type, a = t.pendingProps, o = e === null ? null : e.memoizedProps, r = a.children, pp(i, a) ? r = null : o !== null && pp(i, o) && (t.flags |= 32), t.memoizedState !== null && (i = Go(e, t, Jo, null, null, n), sh._currentValue = i), Lc(e, t), Dc(e, t, r, n), t.child;
			case 6: return e === null && Y && ((e = n = Yi) && (n = im(n, t.pendingProps, Zi), n === null ? e = !1 : (t.stateNode = n, Ji = t, Yi = null, e = !0)), e || $i(t)), null;
			case 13: return Gc(e, t, n);
			case 4: return F(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = no(t, null, r, n) : Dc(e, t, r, n), t.child;
			case 11: return Oc(e, t, t.type, t.pendingProps, n);
			case 7: return r = t.pendingProps, Lc(e, t), Dc(e, t, r, n), t.child;
			case 8: return Dc(e, t, t.pendingProps.children, n), t.child;
			case 12: return Dc(e, t, t.pendingProps.children, n), t.child;
			case 10: return tl(e, t, n);
			case 9: return i = t.type._context, r = t.pendingProps.children, ha(t), i = ga(i), r = r(i), t.flags |= 1, Dc(e, t, r, n), t.child;
			case 14: return kc(e, t, t.type, t.pendingProps, n);
			case 15: return Ac(e, t, t.type, t.pendingProps, n);
			case 19: return el(e, t, n);
			case 31: return Ic(e, t, n);
			case 22: return jc(e, t, n, t.pendingProps);
			case 24: return ha(t), r = ga(Sa), e === null ? (i = La(), i === null && (i = Xu, a = Ca(), i.pooledCache = a, a.refCount++, a !== null && (i.pooledCacheLanes |= n), i = a), t.memoizedState = {
				parent: r,
				cache: i
			}, ao(t), la(t, Sa, i)) : ((e.lanes & n) !== 0 && (oo(e, t), mo(t, null, null, n), po()), i = e.memoizedState, a = t.memoizedState, i.parent === r ? (r = a.cache, la(t, Sa, r), r !== i.cache && fa(t, [Sa], n, !0)) : (i = {
				parent: r,
				cache: r
			}, t.memoizedState = i, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i), la(t, Sa, r))), Dc(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : Y && Gi(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : Lc(e, t), Dc(e, t, r.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(s(156, t.tag));
	}
	function ol(e) {
		e.flags |= 4;
	}
	function sl(e, t, n, r, i) {
		var a;
		if ((a = !!(e.mode & 32)) && (a = n === null ? Jm(t, r) : Jm(t, r) && (r.src !== n.src || r.srcSet !== n.srcSet)), a) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (Vd()) e.flags |= 8192;
				else throw qa = Ua, Va;
			}
		} else e.flags &= -16777217;
	}
	function cl(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ym(t)) {
			if (Vd()) e.flags |= 8192;
			else throw qa = Ua, Va;
		}
	}
	function ll(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : rt(), e.lanes |= t, cd |= t);
	}
	function ul(e, t) {
		if (!Y) switch (e.tailMode) {
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
	function dl(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 1206910976, r |= i.flags & 1206910976, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function fl(e, t, n) {
		var r = t.pendingProps;
		switch (Ki(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return dl(t), null;
			case 1: return dl(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), ua(Sa), Oe(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (na(t) ? ol(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, ia())), dl(t), null;
			case 26:
				var i = t.type, a = t.memoizedState;
				return e === null ? (ol(t), a === null ? (dl(t), sl(t, i, null, r, n)) : (dl(t), cl(t, a))) : a ? a === e.memoizedState ? (dl(t), t.flags &= -16777217) : (ol(t), dl(t), cl(t, a)) : (e = e.memoizedProps, e !== r && ol(t), dl(t), sl(t, i, e, r, n)), null;
			case 27:
				if (Ae(t), n = De.current, i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && ol(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(s(166));
						return dl(t), t.subtreeFlags &= -33554433, null;
					}
					e = N.current, na(t) ? ea(t, e) : (e = hm(i, r, n), t.stateNode = e, ol(t));
				}
				return dl(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (Ae(t), i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && ol(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(s(166));
						return dl(t), t.subtreeFlags &= -33554433, null;
					}
					if (a = N.current, na(t)) ea(t, a);
					else {
						var o = lp(De.current);
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
						a[ht] = t, a[gt] = r;
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
						r && ol(t);
					}
				}
				return dl(t), t.subtreeFlags &= -33554433, sl(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && ol(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(s(166));
					if (e = De.current, na(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, i = Ji, i !== null) switch (i.tag) {
							case 27:
							case 5: r = i.memoizedProps;
						}
						e[ht] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || $f(e.nodeValue, n)), e || $i(t, !0);
					} else e = lp(e).createTextNode(r), e[ht] = t, t.stateNode = e;
				}
				return dl(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = na(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(s(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(557));
							e[ht] = t;
						} else ra(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						dl(t), e = !1;
					} else n = ia(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (Oo(t), t) : (Oo(t), null);
					if (t.flags & 128) throw Error(s(558));
				}
				return dl(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (i = na(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!i) throw Error(s(318));
							if (i = t.memoizedState, i = i === null ? null : i.dehydrated, !i) throw Error(s(317));
							i[ht] = t;
						} else ra(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						dl(t), i = !1;
					} else i = ia(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i), i = !0;
					if (!i) return t.flags & 256 ? (Oo(t), t) : (Oo(t), null);
				}
				return Oo(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, i = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (i = r.alternate.memoizedState.cachePool.pool), a = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (a = r.memoizedState.cachePool.pool), a !== i && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), ll(t, t.updateQueue), dl(t), null);
			case 4: return Oe(), e === null && Uf(t.stateNode.containerInfo), t.flags |= 67108864, dl(t), null;
			case 10: return ua(t.type), dl(t), null;
			case 19:
				if (jo(t), r = t.memoizedState, r === null) return dl(t), null;
				if (i = !!(t.flags & 128), a = r.rendering, a === null) {
					if (i) ul(r, !1);
					else {
						if (rd !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (a = Mo(e), a !== null) {
								for (t.flags |= 128, ul(r, !1), e = a.updateQueue, t.updateQueue = e, ll(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Ei(n, e), n = n.sibling;
								return Ao(t, ko.current & 1 | 2), Y && Ui(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && B() > md && (t.flags |= 128, i = !0, ul(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!i) {
						if (e = Mo(a), e !== null) {
							if (t.flags |= 128, i = !0, e = e.updateQueue, t.updateQueue = e, ll(t, e), ul(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !a.alternate && !Y) return dl(t), null;
						} else 2 * B() - r.renderingStartTime > md && n !== 536870912 && (t.flags |= 128, i = !0, ul(r, !1), t.lanes = 4194304);
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
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = B(), e.sibling = null, a = ko.current, a = i ? a & 1 | 2 : a & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || Y ? Ao(t, a) : (n = a, Te(So, t), Te(ko, n), Co === null && (Co = t)), Y && Ui(t, r.treeForkCount), e;
				}
				return dl(t), null;
			case 22:
			case 23: return Oo(t), xo(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (dl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : dl(t), n = t.updateQueue, n !== null && ll(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && we(Ia), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), ua(Sa), dl(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, dl(t), null;
		}
		throw Error(s(156, t.tag));
	}
	function pl(e, t) {
		switch (Ki(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return ua(Sa), Oe(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return Ae(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (Oo(t), t.alternate === null) throw Error(s(340));
					ra();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (Oo(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(s(340));
					ra();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return jo(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return Oe(), null;
			case 10: return ua(t.type), null;
			case 22:
			case 23: return Oo(t), xo(), e !== null && we(Ia), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return ua(Sa), null;
			case 25: return null;
			default: return null;
		}
	}
	function ml(e, t) {
		switch (Ki(t), t.tag) {
			case 3:
				ua(Sa), Oe();
				break;
			case 26:
			case 27:
			case 5:
				Ae(t);
				break;
			case 4:
				Oe();
				break;
			case 31:
				t.memoizedState !== null && Oo(t);
				break;
			case 13:
				Oo(t);
				break;
			case 19:
				jo(t);
				break;
			case 10:
				ua(t.type);
				break;
			case 22:
			case 23:
				Oo(t), xo(), e !== null && we(Ia);
				break;
			case 24: ua(Sa);
		}
	}
	function hl(e, t) {
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
	function gl(e, t, n) {
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
	function _l(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				go(t, n);
			} catch (t) {
				ff(e, e.return, t);
			}
		}
	}
	function vl(e, t, n) {
		n.props = hc(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			ff(e, t, n);
		}
	}
	function yl(e, t) {
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
						var i = e.stateNode, a = ci(e.memoizedProps, i);
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
	function bl(e, t) {
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
	function xl(e, t) {
		if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null) for (var n = 0; n < t.length; n++) em(e.stateNode, t[n]);
	}
	function Sl(e) {
		for (var t = e.return; t !== null && (Tl(t) && em(e.stateNode, t.stateNode), !wl(t));) t = t.return;
	}
	function Cl(e) {
		for (var t = e.return; t !== null && (Tl(t) && tm(e.stateNode, t.stateNode), !wl(t));) t = t.return;
	}
	function wl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 27;
	}
	function Tl(e) {
		return e && e.tag === 7 && e.stateNode !== null;
	}
	function El(e) {
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
	function Dl(e, t, n) {
		try {
			var r = e.stateNode;
			ip(r, e.type, n, t), r[gt] = t;
		} catch (t) {
			ff(e, e.return, t);
		}
	}
	function Ol(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Sp(e.type) || e.tag === 4;
	}
	function kl(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Ol(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Sp(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Al(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = dn)), xl(e, r), K = !0;
		else if (i !== 4 && (i === 27 && (xl(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (Al(e, t, n, r), e = e.sibling; e !== null;) Al(e, t, n, r), e = e.sibling;
	}
	function jl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), xl(e, r), K = !0;
		else if (i !== 4 && (i === 27 && (xl(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (jl(e, t, n, r), e = e.sibling; e !== null;) jl(e, t, n, r), e = e.sibling;
	}
	function Ml(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			np(t, r, n), t[ht] = e, t[gt] = n;
		} catch (t) {
			ff(e, e.return, t);
		}
	}
	var Nl = !1, Pl = null;
	function Fl(e) {
		(e.tag === 30 || e.subtreeFlags & 33554432) && (Nl = !0);
	}
	var Il = null;
	function Ll() {
		var e = Il;
		return Il = null, e;
	}
	var Rl = 0;
	function zl(e, t, n, r, i) {
		return Rl = 0, Bl(e.child, t, n, r, i);
	}
	function Bl(e, t, n, r, i) {
		for (var a = !1; e !== null;) {
			if (e.tag === 5) {
				var o = e.stateNode;
				if (r !== null) {
					var s = Op(o);
					r.push(s), s.view && (a = !0);
				} else a || Op(o).view && (a = !0);
				Nl = !0, Tp(o, Rl === 0 ? t : t + "_" + Rl, n), Rl++;
			} else e.tag === 22 && e.memoizedState !== null || e.tag === 30 && i || Bl(e.child, t, n, r, i) && (a = !0);
			e = e.sibling;
		}
		return a;
	}
	function Vl(e, t) {
		for (; e !== null;) e.tag === 5 ? Ep(e.stateNode, e.memoizedProps) : e.tag === 22 && e.memoizedState !== null || e.tag === 30 && t || Vl(e.child, t), e = e.sibling;
	}
	function Hl(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if ((e.tag !== 22 || e.memoizedState === null) && (Hl(e), e.tag === 30 && e.flags & 18874368 && e.stateNode.paired)) {
				var t = e.memoizedProps;
				if (t.name == null || t.name === "auto") throw Error(s(544));
				var n = t.name;
				t = ui(t.default, t.share), t !== "none" && (zl(e, n, t, null, !1) || Vl(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function Ul(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = ci(r, n), a = ui(r.default, n.paired ? r.share : r.enter);
			a === "none" ? Hl(e) : zl(e, i, a, null, !1) ? (Hl(e), n.paired || t || jd(e, r.onEnter)) : Vl(e.child, !1);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Ul(e, t), e = e.sibling;
		else Hl(e);
	}
	function Wl(e) {
		if (Pl !== null && Pl.size !== 0) {
			var t = Pl;
			if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
				if (e.tag !== 22 || e.memoizedState === null) {
					if (e.tag === 30 && e.flags & 18874368) {
						var n = e.memoizedProps, r = n.name;
						if (r != null && r !== "auto") {
							var i = t.get(r);
							if (i !== void 0) {
								var a = ui(n.default, n.share);
								if (a !== "none" && (zl(e, r, a, null, !1) ? (a = e.stateNode, i.paired = a, a.paired = i, jd(e, n.onShare)) : Vl(e.child, !1)), t.delete(r), t.size === 0) break;
							}
						}
					}
					Wl(e);
				}
				e = e.sibling;
			}
		}
	}
	function Gl(e) {
		if (e.tag === 30) {
			var t = e.memoizedProps, n = ci(t, e.stateNode), r = Pl === null ? void 0 : Pl.get(n), i = ui(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (zl(e, n, i, null, !1) ? r === void 0 ? jd(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, Pl.delete(n), jd(e, t.onShare)) : Vl(e.child, !1)), Pl !== null && Wl(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Gl(e), e = e.sibling;
		else Pl !== null && Wl(e);
	}
	function Kl(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = ci(t, e.stateNode);
				t = ui(t.default, t.update), e.flags &= -5, t !== "none" && zl(e, n, t, e.memoizedState = [], !1);
			} else e.subtreeFlags & 33554432 && Kl(e);
			e = e.sibling;
		}
	}
	function ql(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if (e.tag !== 22 || e.memoizedState === null) {
				if (e.tag === 30 && e.flags & 18874368) {
					var t = e.stateNode;
					t.paired !== null && (t.paired = null, Vl(e.child, !1));
				}
				ql(e);
			}
			e = e.sibling;
		}
	}
	function Jl(e) {
		if (e.tag === 30) e.stateNode.paired = null, Vl(e.child, !1), ql(e);
		else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Jl(e), e = e.sibling;
		else ql(e);
	}
	function Yl(e) {
		for (e = e.child; e !== null;) e.tag === 30 ? Vl(e.child, !1) : e.subtreeFlags & 33554432 && Yl(e), e = e.sibling;
	}
	function Xl(e, t, n, r, i, a, o) {
		for (var s = !1; t !== null;) {
			if (t.tag === 5) {
				var c = t.stateNode;
				if (a !== null && Rl < a.length) {
					var l = a[Rl], u = Op(c);
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
				e.flags & 4 && Tp(c, Rl === 0 ? n : n + "_" + Rl, i), s && e.flags & 4 || (Il === null && (Il = []), Il.push(c, Rl === 0 ? r : r + "_" + Rl, t.memoizedProps)), Rl++;
			} else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && o ? e.flags |= t.flags & 32 : Xl(e, t.child, n, r, i, a, o) && (s = !0));
			t = t.sibling;
		}
		return s;
	}
	function Zl(e, t) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var n = e.memoizedProps, r = e.stateNode, i = ci(n, r), a = ui(n.default, n.update);
				if (t) {
					r = r.clones;
					var o = r === null ? null : r.map(kp);
				} else o = e.memoizedState, e.memoizedState = null;
				r = e;
				var s = e.child;
				Rl = 0, i = Xl(r, s, i, i, a, o, !1), e.flags & 4 && i && (t || jd(e, n.onUpdate));
			} else e.subtreeFlags & 33554432 && Zl(e, t);
			e = e.sibling;
		}
	}
	var Ql = !1, $l = !1, eu = !1, tu = !1, nu = typeof WeakSet == "function" ? WeakSet : Set, ru = null, iu = !1, au = !1, ou = !1, su = !1;
	function cu(e, t, n) {
		if (e = e.containerInfo, sp = gh, e = Rr(e), zr(e)) {
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
		}, gh = !1, n = (n & 335544064) === n, ru = t, t = n ? 9270 : 1024; ru !== null;) {
			if (e = ru, n && (r = e.deletions, r !== null)) for (a = 0; a < r.length; a++) n && Gl(r[a]);
			if (e.alternate === null && e.flags & 2) n && Fl(e), lu(n);
			else {
				if (e.tag === 22) {
					if (r = e.alternate, e.memoizedState !== null) {
						r !== null && r.memoizedState === null && n && Gl(r), lu(n);
						continue;
					}
					if (r !== null && r.memoizedState !== null) {
						n && Fl(e), lu(n);
						continue;
					}
				}
				r = e.child, (e.subtreeFlags & t) !== 0 && r !== null ? (r.return = e, ru = r) : (n && Kl(e), lu(n));
			}
		}
		Pl = null;
	}
	function lu(e) {
		for (; ru !== null;) {
			var t = ru, n = e, r = t.alternate, i = t.flags;
			switch (t.tag) {
				case 0:
				case 11:
				case 15: break;
				case 1:
					if (i & 1024 && r !== null) {
						n = void 0, i = r.memoizedProps, r = r.memoizedState;
						var a = t.stateNode;
						try {
							var o = hc(t.type, i);
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
					n && r !== null && (n = ci(r.memoizedProps, r.stateNode), i = t.memoizedProps, i = ui(i.default, i.update), i !== "none" && zl(r, n, i, r.memoizedState = [], !0));
					break;
				default: if (i & 1024) throw Error(s(163));
			}
			if (r = t.sibling, r !== null) {
				r.return = t.return, ru = r;
				break;
			}
			ru = t.return;
		}
	}
	function uu(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				Au(e, n), r & 4 && hl(5, n);
				break;
			case 1:
				if (Au(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						ff(n, n.return, e);
					}
					else {
						var i = hc(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							ff(n, n.return, e);
						}
					}
				}
				r & 64 && _l(n), r & 512 && yl(n, n.return);
				break;
			case 3:
				if (Au(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						go(e, t);
					} catch (e) {
						ff(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Ml(n);
			case 26:
			case 5:
				Au(e, n), t === null && r & 4 && El(n), r & 512 && yl(n, n.return);
				break;
			case 12:
				Au(e, n);
				break;
			case 31:
				Au(e, n), r & 4 && yu(e, n);
				break;
			case 13:
				Au(e, n), r & 4 && bu(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = gf.bind(null, n), cm(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || Ql, !r) {
					var a = t !== null && t.memoizedState !== null || $l;
					t = Ql, i = $l, Ql = r, ($l = a) && !i ? (r = 2, n.subtreeFlags & 8772 && (r |= 1), Mu(e, n, r)) : Au(e, n), Ql = t, $l = i;
				}
				break;
			case 30:
				Au(e, n), r & 512 && yl(n, n.return);
				break;
			case 7: r & 512 && yl(n, n.return);
			default: Au(e, n);
		}
	}
	function du(e, t) {
		for (e = e.child; e !== null;) fu(e, t), e = e.sibling;
	}
	function fu(e, t) {
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
				pu(e, t);
				break;
			case 6:
				try {
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, K = !0;
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
				e.memoizedState === null && du(e, t);
				break;
			default: du(e, t);
		}
	}
	function pu(e, t) {
		if (e.subtreeFlags & 67108864) for (e = e.child; e !== null;) {
			a: {
				var n = e, r = t;
				switch (n.tag) {
					case 4:
						fu(n, r);
						break a;
					case 22:
						n.memoizedState === null && pu(n, r);
						break a;
					default: pu(n, r);
				}
			}
			e = e.sibling;
		}
	}
	function mu(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, mu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && wt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var hu = null, gu = !1;
	function _u(e, t, n) {
		for (n = n.child; n !== null;) vu(e, t, n), n = n.sibling;
	}
	function vu(e, t, n) {
		if (We && typeof We.onCommitFiberUnmount == "function") try {
			We.onCommitFiberUnmount(Ue, n);
		} catch {}
		switch (n.tag) {
			case 26:
				$l || bl(n, t), _u(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !$l && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				$l || bl(n, t), Cl(n);
				var r = hu, i = gu;
				Sp(n.type) && (hu = n.stateNode, gu = !1), _u(e, t, n), gm(n.stateNode, n.type, n.memoizedProps), hu = r, gu = i;
				break;
			case 5: $l || bl(n, t), Cl(n);
			case 6:
				if (n.tag === 6 && Cl(n), r = hu, i = gu, hu = null, _u(e, t, n), hu = r, gu = i, hu !== null) {
					if (gu) try {
						(hu.nodeType === 9 ? hu.body : hu.nodeName === "HTML" ? hu.ownerDocument.body : hu).removeChild(n.stateNode), K = !0;
					} catch (e) {
						ff(n, t, e);
					}
					else try {
						hu.removeChild(n.stateNode), K = !0;
					} catch (e) {
						ff(n, t, e);
					}
				}
				break;
			case 18:
				hu !== null && (gu ? (e = hu, Cp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Hh(e)) : Cp(hu, n.stateNode));
				break;
			case 4:
				r = hu, i = gu, hu = n.stateNode.containerInfo, gu = !0, _u(e, t, n), hu = r, gu = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				gl(2, n, t), $l || gl(4, n, t), _u(e, t, n);
				break;
			case 1:
				$l || (bl(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && vl(n, t, r)), _u(e, t, n);
				break;
			case 21:
				_u(e, t, n);
				break;
			case 22:
				$l = (r = $l) || n.memoizedState !== null, _u(e, t, n), $l = r;
				break;
			case 30:
				bl(n, t), _u(e, t, n);
				break;
			case 7:
				$l || bl(n, t), _u(e, t, n);
				break;
			default: _u(e, t, n);
		}
	}
	function yu(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Hh(e);
			} catch (e) {
				ff(t, t.return, e);
			}
		}
	}
	function bu(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Hh(e);
		} catch (e) {
			ff(t, t.return, e);
		}
	}
	function xu(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new nu()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new nu()), t;
			default: throw Error(s(435, e.tag));
		}
	}
	function Su(e, t) {
		var n = xu(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = _f.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function Cu(e, t, n) {
		var r = t.deletions;
		if (r !== null) for (var i = 0; i < r.length; i++) {
			var a = r[i], o = e, c = t, l = c;
			a: for (; l !== null;) {
				switch (l.tag) {
					case 27:
						if (Sp(l.type)) {
							hu = l.stateNode, gu = !1;
							break a;
						}
						break;
					case 5:
						hu = l.stateNode, gu = !1;
						break a;
					case 3:
					case 4:
						hu = l.stateNode.containerInfo, gu = !0;
						break a;
				}
				l = l.return;
			}
			if (hu === null) throw Error(s(160));
			vu(o, c, a), hu = null, gu = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) Tu(t, e, n), t = t.sibling;
	}
	var wu = null;
	function Tu(e, t, n) {
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
				Cu(t, e, n), Eu(e), i & 4 && (gl(3, e, e.return), hl(3, e), gl(5, e, e.return));
				break;
			case 1:
				Cu(t, e, n), Eu(e), i & 512 && ($l || r === null || bl(r, r.return)), i & 64 && Ql && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? t : n.concat(t))));
				break;
			case 26:
				if (a = wu, Cu(t, e, n), Eu(e), i & 512 && ($l || r === null || bl(r, r.return)), i & 4) {
					if (i = r === null ? null : r.memoizedState, n = e.memoizedState, r === null) {
						if (n === null) {
							if (e.stateNode === null) {
								if (Ql) e.stateNode = fp(e.type, e.memoizedProps, t.containerInfo, e);
								else {
									a: {
										t = e.type, n = e.memoizedProps, i = a.ownerDocument || a;
										b: switch (t) {
											case "title":
												r = i.getElementsByTagName("title")[0], (!r || r[St] || r[ht] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = i.createElement(t), i.head.insertBefore(r, i.querySelector("head > title"))), np(r, t, n), r[ht] = e, kt(r), t = r;
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
										r[ht] = e, kt(r), t = r;
									}
									e.stateNode = t;
								}
							} else Ql || Km(a, e.type, e.stateNode);
						} else e.stateNode = Bm(a, n, e.memoizedProps);
					} else i === n ? n === null && e.stateNode !== null && Dl(e, e.memoizedProps, r.memoizedProps) : (i === null ? (t = r.stateNode, t === null || $l || t.parentNode.removeChild(t)) : i.count--, n === null ? Ql || Km(a, e.type, e.stateNode) : Bm(a, n, e.memoizedProps));
				}
				break;
			case 27:
				Cu(t, e, n), Eu(e), i & 512 && ($l || r === null || bl(r, r.return)), r !== null && i & 4 && Dl(e, e.memoizedProps, r.memoizedProps);
				break;
			case 5:
				if (a = eu, eu = !1, Cu(t, e, n), eu = a, Eu(e), i & 512 && ($l || r === null || bl(r, r.return)), e.flags & 32) {
					t = e.stateNode;
					try {
						nn(t, ""), K = !0;
					} catch (t) {
						ff(e, e.return, t);
					}
				}
				i & 4 && e.stateNode != null && (t = e.memoizedProps, Dl(e, t, r === null ? t : r.memoizedProps)), i & 1024 && (tu = !0);
				break;
			case 6:
				if (Cu(t, e, n), Eu(e), i & 4) {
					if (e.stateNode === null) throw Error(s(162));
					t = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = t, K = !0;
					} catch (t) {
						ff(e, e.return, t);
					}
				}
				break;
			case 3:
				if (K = !1, Wm = null, a = wu, wu = bm(t.containerInfo), Cu(t, e, n), wu = a, Eu(e), i & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					ff(e, e.return, t);
				}
				tu && (tu = !1, Du(e)), K = !1;
				break;
			case 4:
				i = eu, eu = Ql, r = zt(), a = wu, wu = bm(e.stateNode.containerInfo), Cu(t, e, n), Eu(e), wu = a, K && au && (ou = !0), K = r, eu = i;
				break;
			case 12:
				Cu(t, e, n), Eu(e);
				break;
			case 31:
				Cu(t, e, n), Eu(e), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Su(e, t)));
				break;
			case 13:
				Cu(t, e, n), Eu(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (fd = B()), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Su(e, t)));
				break;
			case 22:
				a = e.memoizedState !== null, o = r !== null && r.memoizedState !== null;
				var c = Ql, l = $l, u = eu;
				Ql = c || a, eu = u || a, $l = l || o, Cu(t, e, n), $l = l, eu = u, Ql = c, Eu(e), i & 8192 && (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, !a || r === null || o || Ql || $l || (t = o || $l, n = Ql, r = $l, Ql = a || Ql, $l = t, ju(e, 2), Ql = n, $l = r), !a && eu || du(e, a)), i & 4 && (t = e.updateQueue, t !== null && (n = t.retryQueue, n !== null && (t.retryQueue = null, Su(e, n))));
				break;
			case 19:
				Cu(t, e, n), Eu(e), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Su(e, t)));
				break;
			case 30:
				i & 512 && ($l || r === null || bl(r, r.return)), i = zt(), a = au, o = (n & 335544064) === n, c = e.memoizedProps, au = o && ui(c.default, c.update) !== "none", Cu(t, e, n), Eu(e), o && r !== null && K && (e.flags |= 4), au = a, K = i;
				break;
			case 21: break;
			case 7: i & 512 && ($l || r === null || bl(r, r.return)), r && r.stateNode !== null && (r.stateNode._fragmentFiber = e);
			default: Cu(t, e, n), Eu(e);
		}
	}
	function Eu(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Ol(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				r = null;
				for (var i = e.return; i !== null;) {
					if (Tl(i)) {
						var a = i.stateNode;
						r === null ? r = [a] : r.push(a);
					}
					if (wl(i)) break;
					i = i.return;
				}
				var o = r;
				if (n == null) throw Error(s(160));
				switch (n.tag) {
					case 27:
						var c = n.stateNode;
						jl(e, kl(e), c, o);
						break;
					case 5:
						var l = n.stateNode;
						n.flags & 32 && (nn(l, ""), n.flags &= -33), jl(e, kl(e), l, o);
						break;
					case 3:
					case 4:
						var u = n.stateNode.containerInfo;
						Al(e, kl(e), u, o);
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
	function Du(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			Du(t), t.tag === 5 && t.flags & 1024 && (t = t.stateNode, gh = !0, t.reset(), gh = !1), e = e.sibling;
		}
	}
	function Ou(e, t) {
		if (t.subtreeFlags & 9270) for (t = t.child; t !== null;) ku(t, e), t = t.sibling;
		else Zl(t, !1);
	}
	function ku(e, t) {
		var n = e.alternate;
		if (n === null) Ul(e, !1);
		else switch (e.tag) {
			case 3:
				if (su = iu = !1, Ll(), Ou(t, e), !iu && !ou) {
					if (e = Il, e !== null) for (var r = 0; r < e.length; r += 3) {
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
					})), su = !0;
				}
				Il = null;
				break;
			case 5:
				Ou(t, e);
				break;
			case 4:
				r = iu, iu = !1, Ou(t, e), iu && (ou = !0), iu = r;
				break;
			case 22:
				e.memoizedState === null && (n.memoizedState === null ? Ou(t, e) : Ul(e, !1));
				break;
			case 30:
				r = iu, i = Ll(), iu = !1, Ou(t, e), iu && (e.flags |= 4);
				var a = e.memoizedProps, o = e.stateNode;
				t = ci(a, o), o = ci(n.memoizedProps, o);
				var s = ui(a.default, a.update);
				s === "none" ? t = !1 : (a = n.memoizedState, n.memoizedState = null, n = e.child, Rl = 0, t = Xl(e, n, t, o, s, a, !0), Rl !== (a === null ? 0 : a.length) && (e.flags |= 32)), e.flags & 4 && t ? (jd(e, e.memoizedProps.onUpdate), Il = i) : i !== null && (i.push.apply(i, Il), Il = i), iu = e.flags & 32 ? !0 : r;
				break;
			default: Ou(t, e);
		}
	}
	function Au(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) uu(e, t.alternate, t), t = t.sibling;
	}
	function ju(e, t) {
		for (e = e.child; e !== null;) {
			var n = e, r = t;
			switch (n.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					gl(4, n, n.return), ju(n, r);
					break;
				case 1:
					bl(n, n.return);
					var i = n.stateNode;
					typeof i.componentWillUnmount == "function" && vl(n, n.return, i), ju(n, r);
					break;
				case 27: r & 2 && gm(n.stateNode, n.type, n.memoizedProps);
				case 5:
					bl(n, n.return), n.tag !== 5 && n.tag !== 27 || Cl(n), ju(n, r);
					break;
				case 6:
					Cl(n);
					break;
				case 26:
					bl(n, n.return), i = n.stateNode, n.memoizedState !== null || i === null || $l || i.parentNode.removeChild(i), ju(n, r);
					break;
				case 22:
					n.memoizedState === null && ju(n, r);
					break;
				case 30:
					bl(n, n.return), ju(n, r);
					break;
				case 7: bl(n, n.return);
				default: ju(n, r);
			}
			e = e.sibling;
		}
	}
	function Mu(e, t, n) {
		for (n = t.subtreeFlags & 8772 ? n : n & -2, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags, s = !!(n & 1);
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Mu(i, a, n), hl(4, a);
					break;
				case 1:
					if (Mu(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						ff(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var c = r.stateNode;
						try {
							var l = i.shared.hiddenCallbacks;
							if (l !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < l.length; i++) ho(l[i], c);
						} catch (e) {
							ff(r, r.return, e);
						}
					}
					s && o & 64 && _l(a), yl(a, a.return);
					break;
				case 27: n & 2 && Ml(a);
				case 5:
					a.tag !== 5 && a.tag !== 27 || Sl(a), Mu(i, a, n), s && r === null && o & 4 && El(a), yl(a, a.return);
					break;
				case 6:
					Sl(a);
					break;
				case 26:
					c = a.stateNode, a.memoizedState !== null || c === null || Ql || Km(bm(c.ownerDocument), a.type, c), Mu(i, a, n), s && r === null && o & 4 && El(a), yl(a, a.return);
					break;
				case 12:
					Mu(i, a, n);
					break;
				case 31:
					Mu(i, a, n), s && o & 4 && yu(i, a);
					break;
				case 13:
					Mu(i, a, n), s && o & 4 && bu(i, a);
					break;
				case 22:
					a.memoizedState === null && Mu(i, a, n), yl(a, a.return);
					break;
				case 30:
					Mu(i, a, n), yl(a, a.return);
					break;
				case 7: yl(a, a.return);
				default: Mu(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Nu(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && wa(n));
	}
	function Pu(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && wa(e));
	}
	function Fu(e, t, n, r) {
		var i = (n & 335544064) === n;
		if (t.subtreeFlags & (i ? 10262 : 10256)) for (t = t.child; t !== null;) Iu(e, t, n, r), t = t.sibling;
		else i && Yl(t);
	}
	function Iu(e, t, n, r) {
		var i = (n & 335544064) === n;
		i && t.alternate === null && t.return !== null && t.return.alternate !== null && Jl(t);
		var a = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Fu(e, t, n, r), a & 2048 && hl(9, t);
				break;
			case 1:
				Fu(e, t, n, r);
				break;
			case 3:
				Fu(e, t, n, r), i && su && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && wa(a)));
				break;
			case 12:
				if (a & 2048) {
					Fu(e, t, n, r), a = t.stateNode;
					try {
						var o = t.memoizedProps, s = o.id, c = o.onPostCommit;
						typeof c == "function" && c(s, t.alternate === null ? "mount" : "update", a.passiveEffectDuration, -0);
					} catch (e) {
						ff(t, t.return, e);
					}
				} else Fu(e, t, n, r);
				break;
			case 31:
				Fu(e, t, n, r);
				break;
			case 13:
				Fu(e, t, n, r);
				break;
			case 23: break;
			case 22:
				o = t.stateNode, s = t.alternate, t.memoizedState === null ? (i && s !== null && s.memoizedState !== null && Jl(t), o._visibility & 2 ? Fu(e, t, n, r) : (o._visibility |= 2, Lu(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))) : (i && s !== null && s.memoizedState === null && Jl(s), o._visibility & 2 ? Fu(e, t, n, r) : Ru(e, t)), a & 2048 && Nu(s, t);
				break;
			case 24:
				Fu(e, t, n, r), a & 2048 && Pu(t.alternate, t);
				break;
			case 30:
				i && (a = t.alternate, a !== null && (Vl(a.child, !0), Vl(t.child, !0))), Fu(e, t, n, r);
				break;
			default: Fu(e, t, n, r);
		}
	}
	function Lu(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Lu(a, o, s, c, i), hl(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Lu(a, o, s, c, i)) : u._visibility & 2 ? Lu(a, o, s, c, i) : Ru(a, o), i && l & 2048 && Nu(o.alternate, o);
					break;
				case 24:
					Lu(a, o, s, c, i), i && l & 2048 && Pu(o.alternate, o);
					break;
				default: Lu(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Ru(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Ru(n, r), i & 2048 && Nu(r.alternate, r);
					break;
				case 24:
					Ru(n, r), i & 2048 && Pu(r.alternate, r);
					break;
				default: Ru(n, r);
			}
			t = t.sibling;
		}
	}
	var zu = 8192;
	function Bu(e, t, n) {
		if (e.subtreeFlags & zu) for (e = e.child; e !== null;) Vu(e, t, n), e = e.sibling;
	}
	function Vu(e, t, n) {
		switch (e.tag) {
			case 26:
				Bu(e, t, n), e.flags & zu && (e.memoizedState === null ? (e = e.stateNode, (t & 335544128) === t && Zm(n, e)) : Qm(n, wu, e.memoizedState, e.memoizedProps));
				break;
			case 5:
				Bu(e, t, n), e.flags & zu && (e = e.stateNode, (t & 335544128) === t && Zm(n, e));
				break;
			case 3:
			case 4:
				var r = wu;
				wu = bm(e.stateNode.containerInfo), Bu(e, t, n), wu = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = zu, zu = 16777216, Bu(e, t, n), zu = r) : Bu(e, t, n));
				break;
			case 30:
				if ((e.flags & zu) !== 0 && (r = e.memoizedProps.name, r != null && r !== "auto")) {
					var i = e.stateNode;
					i.paired = null, Pl === null && (Pl = /* @__PURE__ */ new Map()), Pl.set(r, i);
				}
				Bu(e, t, n);
				break;
			default: Bu(e, t, n);
		}
	}
	function Hu(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Uu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				ru = r, Ku(r, e);
			}
			Hu(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Wu(e), e = e.sibling;
	}
	function Wu(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Uu(e), e.flags & 2048 && gl(9, e, e.return);
				break;
			case 3:
				Uu(e);
				break;
			case 12:
				Uu(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Gu(e)) : Uu(e);
				break;
			default: Uu(e);
		}
	}
	function Gu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				ru = r, Ku(r, e);
			}
			Hu(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					gl(8, t, t.return), Gu(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Gu(t));
					break;
				default: Gu(t);
			}
			e = e.sibling;
		}
	}
	function Ku(e, t) {
		for (; ru !== null;) {
			var n = ru;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					gl(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: wa(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, ru = r;
			else a: for (n = e; ru !== null;) {
				r = ru;
				var i = r.sibling, a = r.return;
				if (mu(r), r === n) {
					ru = null;
					break a;
				}
				if (i !== null) {
					i.return = a, ru = i;
					break a;
				}
				ru = a;
			}
		}
	}
	var qu = {
		getCacheForType: function(e) {
			var t = ga(Sa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return ga(Sa).controller.signal;
		}
	}, Ju = typeof WeakMap == "function" ? WeakMap : Map, Yu = 0, Xu = null, Z = null, Q = 0, Zu = 0, Qu = null, $u = !1, ed = !1, td = !1, nd = 0, rd = 0, id = 0, ad = 0, od = 0, sd = 0, cd = 0, ld = null, ud = null, dd = !1, fd = 0, pd = 0, md = Infinity, hd = null, gd = null, _d = 0, vd = null, yd = null, bd = 0, xd = 0, Sd = null, Cd = null, wd = null, Td = null, Ed = null, Dd = 0, Od = null;
	function kd() {
		return Yu & 2 && Q !== 0 ? Q & -Q : j.T === null ? ft() : Nf();
	}
	function Ad() {
		if (sd === 0) {
			if (!(Q & 536870912) || Y) {
				var e = Xe;
				Xe <<= 1, !(Xe & 3932160) && (Xe = 262144), sd = e;
			} else sd = 536870912;
		}
		return e = So.current, e !== null && (e.flags |= 32), sd;
	}
	function jd(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(ci(e.memoizedProps, n))), Td === null && (Td = []), Td.push(t.bind(null, r));
		}
	}
	function Md(e, t, n) {
		(e === Xu && (Zu === 2 || Zu === 9) || e.cancelPendingCommit !== null) && (zd(e, 0), Id(e, Q, sd, !1)), at(e, n), Yu & 2 && e === Xu || (e === Xu && (!(Yu & 2) && (ad |= n), rd === 4 && Id(e, Q, sd, !1)), Tf(e));
	}
	function Nd(e, t, n) {
		if (Yu & 6) throw Error(s(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || et(e, t), i = r ? qd(e, t) : Gd(e, t, !0), a = r;
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
					if ((t & 62914560) === t && (i = fd + 300 - B(), 10 < i)) {
						if (Id(r, t, sd, !$u), $e(r, 0, !0) !== 0) break a;
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
			unsuspend: dn
		}, Pl = null, Vu(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? fd - B() : (a & 4194048) === a ? pd - B() : 0, m = eh(d, m), m !== null) ? (bd = a, e.cancelPendingCommit = m(ef.bind(null, e, t, a, n, r, i, o, s, c, l, u, d, null, f, p)), Id(e, a, o, !l)) : ef(e, t, a, n, r, i, o, s, c, l, u, d);
	}
	function Fd(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Mr(a(), i)) return !1;
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
		t = tt(e, t), t &= ~od, t &= ~ad, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - G(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && st(e, n, t);
	}
	function Ld() {
		return Yu & 6 ? !0 : (Ef(0, !1), !1);
	}
	function Rd() {
		if (Z !== null) {
			if (Zu === 0) var e = Z.return;
			else e = Z, ca = sa = null, Zo(e), Xa = null, Za = 0, e = Z;
			for (; e !== null;) ml(e.alternate, e), e = e.return;
			Z = null;
		}
	}
	function zd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), bd = 0, Rd(), Xu = e, Z = n = Ti(e.current, null), Q = t, Zu = 0, Qu = null, $u = !1, ed = et(e, t), td = !1, cd = sd = od = ad = id = rd = 0, ud = ld = null, dd = !1, nd = tt(e, t), hi(), n;
	}
	function Bd(e, t) {
		X = null, j.H = sc, t === Ba || t === Ha ? (t = Ja(), Zu = 3) : t === Va ? (t = Ja(), Zu = 4) : Zu = t === Tc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Qu = t, Z === null && (rd = 1, yc(e, Ni(t, e.current)));
	}
	function Vd() {
		var e = So.current;
		return e === null ? !0 : (Q & 4194048) === Q ? Co === null : (Q & 62914560) === Q || Q & 536870912 ? e === Co : !1;
	}
	function Hd() {
		var e = j.H;
		return j.H = sc, e === null ? sc : e;
	}
	function Ud() {
		var e = j.A;
		return j.A = qu, e;
	}
	function Wd() {
		rd = 4, $u || (Q & 4194048) !== Q && So.current !== null || (ed = !0), !(id & 134217727) && !(ad & 134217727) || Xu === null || Id(Xu, Q, sd, !1);
	}
	function Gd(e, t, n) {
		var r = Yu;
		Yu |= 2;
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
							So.current === null && (t = !0);
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
		return t && e.shellSuspendCounter++, ca = sa = null, Yu = r, j.H = i, j.A = a, Z === null && (Xu = null, Q = 0, hi()), o;
	}
	function Kd() {
		for (; Z !== null;) Yd(Z);
	}
	function qd(e, t) {
		var n = Yu;
		Yu |= 2;
		var r = Hd(), i = Ud();
		Xu !== e || Q !== t ? (hd = null, md = B() + 500, zd(e, t)) : ed = et(e, t);
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
							if (Wa(a)) {
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
							Wa(a) ? (Zu = 0, Qu = null, Xd(t)) : (Zu = 0, Qu = null, Zd(e, t, a, 7));
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
		return ca = sa = null, j.H = r, j.A = i, Yu = n, Z === null ? (Xu = null, Q = 0, hi(), rd) : 0;
	}
	function Jd() {
		for (; Z !== null && !R();) Yd(Z);
	}
	function Yd(e) {
		var t = al(e.alternate, e, nd);
		e.memoizedProps = e.pendingProps, t === null ? Qd(e) : Z = t;
	}
	function Xd(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = zc(n, t, t.pendingProps, t.type, void 0, Q);
				break;
			case 11:
				t = zc(n, t, t.pendingProps, t.type.render, t.ref, Q);
				break;
			case 5:
				Zo(t);
				var r = t;
				r === Ji && (Y ? (ta(r), r.tag === 5 && r.stateNode != null && (Yi = r.stateNode)) : (ta(r), Y = !0));
			default: ml(n, t), t = Z = Ei(t, nd), t = al(n, t, nd);
		}
		e.memoizedProps = e.pendingProps, t === null ? Qd(e) : Z = t;
	}
	function Zd(e, t, n, r) {
		ca = sa = null, Zo(t), Xa = null, Za = 0;
		var i = t.return;
		try {
			if (wc(e, i, t, n, Q)) {
				rd = 1, yc(e, Ni(n, e.current)), Z = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw Z = i, t;
			rd = 1, yc(e, Ni(n, e.current)), Z = null;
			return;
		}
		t.flags & 32768 ? (Y || r === 1 ? e = !0 : ed || Q & 536870912 ? e = !1 : ($u = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = So.current, r !== null && r.tag === 13 && (r.flags |= 16384))), $d(t, e)) : Qd(t);
	}
	function Qd(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				$d(t, $u);
				return;
			}
			e = t.return;
			var n = fl(t.alternate, t, nd);
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
			var n = pl(e.alternate, e);
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
		if (Yu & 6) throw Error(s(327));
		if (t !== null) {
			if (t === e.current) throw Error(s(177));
			e === Xu && (Z = Xu = null, Q = 0), yd = t, vd = e, bd = n, Sd = i, Cd = r, tf(e, t, n, o, c, l, f);
		}
	}
	function tf(e, t, n, r, i, a, o) {
		var s = t.lanes | t.childLanes;
		if (xd = s, s |= mi, ot(e, n, s, r, i, a), Td = null, (n & 335544064) === n ? (Ed = Da(e), r = 10262) : (Ed = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, vf(Be, function() {
			return uf(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Nl = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = j.T, j.T = null, i = M.p, M.p = 2, a = Yu, Yu |= 4;
			try {
				cu(e, t, n);
			} finally {
				Yu = a, M.p = i, j.T = r;
			}
		}
		_d = 1, Nl ? wd = Mp(o, e.containerInfo, Ed, af, of, rf, sf, uf, nf, null, null) : (af(), of(), sf());
	}
	function nf(e) {
		if (_d !== 0) {
			var t = vd.onRecoverableError;
			t(e, { componentStack: null });
		}
	}
	function rf() {
		_d === 3 && (_d = 0, ku(yd, vd), _d = 4);
	}
	function af() {
		if (_d === 1) {
			_d = 0;
			var e = vd, t = yd, n = bd, r = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || r) {
				r = j.T, j.T = null;
				var i = M.p;
				M.p = 2;
				var a = Yu;
				Yu |= 4;
				try {
					au = ou = !1, Tu(t, e, n), n = cp;
					var o = Rr(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && Lr(s.ownerDocument.documentElement, s)) {
						if (c !== null && zr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Ir(s, h), v = Ir(s, g);
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
					Yu = a, M.p = i, j.T = r;
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
				n = j.T, j.T = null;
				var r = M.p;
				M.p = 2;
				var i = Yu;
				Yu |= 4;
				try {
					uu(e, t.alternate, t);
				} finally {
					Yu = i, M.p = r, j.T = n;
				}
			}
			_d = 3;
		}
	}
	function sf() {
		if (_d === 4 || _d === 3) {
			_d = 0;
			var e = wd;
			wd = null, z();
			var t = vd, n = yd, r = bd, i = Cd, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? _d = 5 : (_d = 0, yd = vd = null, cf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (gd = null), dt(r), n = n.stateNode, We && typeof We.onCommitFiberRoot == "function") try {
				We.onCommitFiberRoot(Ue, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = j.T, a = M.p, M.p = 2, j.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					j.T = n, M.p = a;
				}
			}
			if (i = Td, o = Ed, Ed = null, i !== null && (Td = null, o === null && (o = []), e !== null)) for (c = 0; c < i.length; c++) n = (0, i[c])(o), n !== void 0 && e.finished.finally(n);
			bd & 3 && lf(), Tf(t), a = t.pendingLanes, r & 261930 && a & 42 ? t === Od ? Dd++ : (Dd = 0, Od = t) : (Dd = 0, Od = null), Ef(0, !1);
		}
	}
	function cf(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, wa(t)));
	}
	function lf() {
		return wd !== null && (wd.skipTransition(), wd = null), af(), of(), sf(), uf();
	}
	function uf() {
		if (_d !== 5) return !1;
		var e = vd, t = xd;
		xd = 0;
		var n = dt(bd), r = j.T, i = M.p;
		try {
			M.p = 32 > n ? 32 : n, j.T = null, n = Sd, Sd = null;
			var a = vd, o = bd;
			if (_d = 0, yd = vd = null, bd = 0, Yu & 6) throw Error(s(331));
			var c = Yu;
			if (Yu |= 4, Wu(a.current), Iu(a, a.current, o, n), Yu = c, Ef(0, !1), We && typeof We.onPostCommitFiberRoot == "function") try {
				We.onPostCommitFiberRoot(Ue, a);
			} catch {}
			return !0;
		} finally {
			M.p = i, j.T = r, cf(e, t);
		}
	}
	function df(e, t, n) {
		t = Ni(n, t), t = xc(e.stateNode, t, 2), e = co(e, t, 2), e !== null && (at(e, 2), Tf(e));
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
					e = Ni(n, e), n = Sc(2), r = co(t, n, 2), r !== null && (Cc(n, r, t, e), at(r, 2), Tf(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function pf(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Ju();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (td = !0, i.add(n), e = mf.bind(null, e, t, n), t.then(e, e));
	}
	function mf(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, Xu === e && (Q & n) === n && (rd === 4 || rd === 3 && (Q & 62914560) === Q && 300 > B() - fd ? Yu & 2 ? od |= n : zd(e, 0) : od |= n, cd === Q && (cd = 0)), Tf(e);
	}
	function hf(e, t) {
		t === 0 && (t = rt()), e = vi(e, t), e !== null && (at(e, t), Tf(e));
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
		return Re(e, t);
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
								a = (1 << 31 - G(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, jf(r, a));
						} else a = Q, a = $e(r, r === Xu ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || et(r, a) || (n = !0, jf(r, a));
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
		for (var t = B(), n = null, r = yf; r !== null;) {
			var i = r.next, a = kf(r, t);
			a === 0 ? (r.next = null, n === null ? yf = i : n.next = i, i === null && (bf = n)) : (n = r, (e !== 0 || a & 3) && (Sf = !0)), r = i;
		}
		_d !== 0 && _d !== 5 || Ef(e, !1), wf !== 0 && (wf = 0);
	}
	function kf(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - G(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = nt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Xu, n = Q, n = $e(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Zu === 2 || Zu === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && L(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || et(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && L(r), dt(n)) {
				case 2:
				case 8:
					n = ze;
					break;
				case 32:
					n = Be;
					break;
				case 268435456:
					n = W;
					break;
				default: n = Be;
			}
			return r = Af.bind(null, e), n = Re(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && L(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function Af(e, t) {
		if (_d !== 0 && _d !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (lf() && e.callbackNode !== n) return null;
		var r = Q;
		return r = $e(e, e === Xu ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Nd(e, r, t), kf(e, B()), e.callbackNode != null && e.callbackNode === n ? Af.bind(null, e) : null);
	}
	function jf(e, t) {
		if (lf()) return null;
		Nd(e, t, !0);
	}
	function Mf() {
		bp(function() {
			Yu & 6 ? Re(H, Df) : Of();
		});
	}
	function Nf() {
		if (wf === 0) {
			var e = Aa;
			e === 0 && (e = Ye, Ye <<= 1, !(Ye & 261888) && (Ye = 256)), wf = e;
		}
		return wf;
	}
	function Pf(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : un(e);
	}
	function Ff(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Pf((i[gt] || null).action), o = r.submitter;
			o && (t = (t = o[gt] || null) ? Pf(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new jn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (wf !== 0) {
								var e = new FormData(i, o);
								qs(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = new FormData(i, o), qs(n, {
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
	for (var If = 0; If < ai.length; If++) {
		var Lf = ai[If];
		oi(Lf.toLowerCase(), "on" + (Lf[0].toUpperCase() + Lf.slice(1)));
	}
	oi(Zr, "onAnimationEnd"), oi(Qr, "onAnimationIteration"), oi($r, "onAnimationStart"), oi("dblclick", "onDoubleClick"), oi("focusin", "onFocus"), oi("focusout", "onBlur"), oi(ei, "onTransitionRun"), oi(ti, "onTransitionStart"), oi(ni, "onTransitionCancel"), oi(ri, "onTransitionEnd"), Pt("onMouseEnter", ["mouseout", "mouseover"]), Pt("onMouseLeave", ["mouseout", "mouseover"]), Pt("onPointerEnter", ["pointerout", "pointerover"]), Pt("onPointerLeave", ["pointerout", "pointerover"]), Nt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Nt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Nt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Nt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Nt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Nt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
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
						di(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						di(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function $(e, t) {
		var n = t[vt];
		n === void 0 && (n = t[vt] = /* @__PURE__ */ new Set());
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
			e[Hf] = !0, jt.forEach(function(t) {
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
		n = i.bind(null, t, n, e), i = void 0, !xn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
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
					if (o = Tt(s), o === null) return;
					if (c = o.tag, c === 5 || c === 6 || c === 26 || c === 27) {
						r = a = o;
						continue a;
					}
					s = s.parentNode;
				}
			}
			r = r.return;
		}
		vn(function() {
			var r = a, i = pn(n), o = [];
			a: {
				var s = ii.get(e);
				if (s !== void 0) {
					var c = jn, u = e;
					switch (e) {
						case "keypress": if (Dn(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = Jn;
							break;
						case "focusin":
							u = "focus", c = zn;
							break;
						case "focusout":
							u = "blur", c = zn;
							break;
						case "beforeblur":
						case "afterblur":
							c = zn;
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
							c = Ln;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = Rn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = Zn;
							break;
						case Zr:
						case Qr:
						case $r:
							c = Bn;
							break;
						case ri:
							c = Qn;
							break;
						case "scroll":
						case "scrollend":
							c = Nn;
							break;
						case "wheel":
							c = $n;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = Vn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							c = Yn;
							break;
						case "submit":
							c = Xn;
							break;
						case "toggle":
						case "beforetoggle": c = er;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? s === null ? null : s + "Capture" : s;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = yn(m, p), g != null && d.push(Kf(m, g, h))), f) break;
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
					if (c = e === "mouseover" || e === "pointerover", s = e === "mouseout" || e === "pointerout", c && n !== fn && (u = n.relatedTarget || n.fromElement) && (Tt(u) || u[_t])) break a;
					(s || c) && (u = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, s ? (c = n.relatedTarget || n.toElement, s = r, c = c ? Tt(c) : null, c !== null && (f = l(c), d = c.tag, c !== f || d !== 5 && d !== 27 && d !== 6) && (c = null)) : (s = null, c = r), s !== c && (d = Ln, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Yn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = s == null ? u : Dt(s), h = c == null ? u : Dt(c), u = new d(g, m + "leave", s, n, i), u.target = f, u.relatedTarget = h, g = null, Tt(i) === r && (d = new d(p, m + "enter", c, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = s && c ? E(s, c, Jf) : null, s !== null && Yf(o, u, s, d, !1), c !== null && f !== null && Yf(o, f, c, d, !0)));
				}
				a: {
					if (s = r ? Dt(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var _ = br;
					else if (mr(s)) {
						if (xr) _ = Ar;
						else {
							_ = Or;
							var v = Dr;
						}
					} else c = s.nodeName, !c || c.toLowerCase() !== "input" || s.type !== "checkbox" && s.type !== "radio" ? r && sn(r.elementType) && (_ = br) : _ = kr;
					if (_ &&= _(e, r)) {
						hr(o, _, n, i);
						break a;
					}
					v && v(e, s, r);
				}
				switch (v = r ? Dt(r) : window, e) {
					case "focusin":
						(mr(v) || v.contentEditable === "true") && (Vr = v, Hr = r, Ur = null);
						break;
					case "focusout":
						Ur = Hr = Vr = null;
						break;
					case "mousedown":
						Wr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Wr = !1, Gr(o, n, i);
						break;
					case "selectionchange": if (Br) break;
					case "keydown":
					case "keyup": Gr(o, n, i);
				}
				var y;
				if (nr) b: {
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
				else ur ? cr(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (ar && n.locale !== "ko" && (ur || b !== "onCompositionStart" ? b === "onCompositionEnd" && ur && (y = En()) : (Cn = i, wn = "value" in Cn ? Cn.value : Cn.textContent, ur = !0)), v = qf(r, b), 0 < v.length && (b = new Hn(b, e, null, n, i), o.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = lr(n), y !== null && (b.data = y)))), (y = ir ? dr(e, n) : fr(e, n)) && (b = qf(r, "onBeforeInput"), 0 < b.length && (v = new Hn("onBeforeInput", "beforeinput", null, n, i), o.push({
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
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = yn(e, n), i != null && r.unshift(Kf(e, i, a)), i = yn(e, t), i != null && r.push(Kf(e, i, a))), e.tag === 3) return r;
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
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = yn(n, a), l != null && o.unshift(Kf(n, l, c))) : i || (l = yn(n, a), l != null && o.push(Kf(n, l, c)))), n = n.return;
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
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || nn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && nn(e, "" + r);
				else return;
				break;
			case "className":
				Vt(e, "class", r);
				break;
			case "tabIndex":
				Vt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Vt(e, n, r);
				break;
			case "style":
				on(e, r, a);
				return;
			case "data": if (t !== "object") {
				Vt(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href") || r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = un(r), e.setAttribute(n, r);
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
				r = un(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = dn);
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
				n = un(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
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
				$("beforetoggle", e), $("toggle", e), Bt(e, "popover", r);
				break;
			case "xlinkActuate":
				Ht(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Ht(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Ht(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Ht(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Ht(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Ht(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Ht(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Ht(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Ht(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Bt(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = cn.get(n) || n, Bt(e, n, r);
			else return;
		}
		K = !0;
	}
	function tp(e, t, n, r, i, a) {
		switch (n) {
			case "style":
				on(e, r, a);
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
				if (typeof r == "string") nn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") nn(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && $("scroll", e);
				return;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = dn);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!Mt.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (i = n.endsWith("Capture"), a = n.slice(2, i ? n.length - 7 : void 0), t = e[gt] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(a, t, i), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(a, r, i);
						break a;
					}
					K = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Bt(e, n, r);
				}
				return;
		}
		K = !0;
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
				Zt(e, a, c, l, u, o, i, !1);
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
				t = a, n = o, e.multiple = !!r, t == null ? n != null && $t(e, !!r, n, !0) : $t(e, !!r, t, !1);
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
				tn(e, r, i, a);
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
			default: if (sn(t)) {
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
							m !== f && (K = !0), a = m;
							break;
						case "name":
							m !== f && (K = !0), i = m;
							break;
						case "checked":
							m !== f && (K = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (K = !0), d = m;
							break;
						case "value":
							m !== f && (K = !0), o = m;
							break;
						case "defaultValue":
							m !== f && (K = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(s(137, t));
							break;
						default: m !== f && ep(e, t, p, m, r, f);
					}
				}
				Xt(e, o, c, l, u, d, a, i);
				return;
			case "select":
				for (a in m = o = c = p = null, n) if (l = n[a], n.hasOwnProperty(a) && l != null) switch (a) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(a) || ep(e, t, a, null, r, l);
				}
				for (i in r) if (a = r[i], l = n[i], r.hasOwnProperty(i) && (a != null || l != null)) switch (i) {
					case "value":
						a !== l && (K = !0), p = a;
						break;
					case "defaultValue":
						a !== l && (K = !0), c = a;
						break;
					case "multiple": a !== l && (K = !0), o = a;
					default: a !== l && ep(e, t, i, a, r, l);
				}
				t = c, n = o, r = m, p == null ? !!r != !!n && (t == null ? $t(e, !!n, n ? [] : "", !1) : $t(e, !!n, t, !0)) : $t(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (i = n[c], n.hasOwnProperty(c) && i != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: ep(e, t, c, null, r, i);
				}
				for (o in r) if (i = r[o], a = n[o], r.hasOwnProperty(o) && (i != null || a != null)) switch (o) {
					case "value":
						i !== a && (K = !0), p = i;
						break;
					case "defaultValue":
						i !== a && (K = !0), m = i;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (i != null) throw Error(s(91));
						break;
					default: i !== a && ep(e, t, o, i, r, a);
				}
				en(e, p, m);
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
						p !== m && (K = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
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
			default: if (sn(t)) {
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
		return n = lp(n).createElement(e), n[ht] = r, n[gt] = t, np(n, e, t), kt(n), n;
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
						a[St] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
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
		return t = typeof t == "number" ? { duration: t } : D({}, t), t.pseudoElement = this._selector, this._scope.animate(e, t);
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
		var a = Tt(i);
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
		return e & Node.DOCUMENT_POSITION_PRECEDING ? ((t = !!a) && !(t = a === n) && (t = E(n, a, T), t === null ? t = !1 : (h(t, !0, C, a, n), a = x, x = null, t = a !== null)), t) : e & Node.DOCUMENT_POSITION_FOLLOWING ? ((t = !!a) && !(t = a === r) && (t = E(r, a, T), t === null ? t = !1 : (h(t, !0, w, a, r), a = x, S = x = null, t = a !== null)), t) : !1;
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
					nm(n), wt(n);
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
			} else if (!e[St]) switch (t) {
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
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === dn && (e.onclick = null), wt(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		wt(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = M.d;
	M.d = {
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
		var t = Et(e);
		t !== null && t.tag === 5 && t.type === "form" ? Ys(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = Yt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), kt(t), r.head.appendChild(t)));
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
			var i = "link[rel=\"preload\"][as=\"" + Yt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Yt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Yt(n.imageSizes) + "\"]")) : i += "[href=\"" + Yt(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Pm(e);
					break;
				case "script": a = Rm(e);
			}
			if (!(vm.has(a) || (e = D({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), vm.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(Fm(a)) || t === "script" && r.querySelector(zm(a))))) {
				var o = r.createElement("link");
				np(o, "link", e), t === "style" && (o[Ct] = !0, o.onload = o.onerror = function() {
					At(o);
				}), kt(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Yt(r) + "\"][href=\"" + Yt(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Rm(e);
			}
			if (!vm.has(a) && (e = D({
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
				r = n.createElement("link"), np(r, "link", e), kt(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = Ot(r).hoistableStyles, a = Pm(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(Fm(a))) s.loading = 5;
				else {
					e = D({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = vm.get(a)) && Hm(e, n);
					var c = o = r.createElement("link");
					kt(c), np(c, "link", e), c._p = new Promise(function(e, t) {
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
			var r = Ot(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), kt(a), np(a, "link", e), n.head.appendChild(a)), a = {
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
			var r = Ot(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), kt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var i = (i = De.current) ? bm(i) : null;
		if (!i) throw Error(s(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = Ot(i).hoistableStyles, r = t.get(n), r || (r = {
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
					var a = Ot(i).hoistableStyles, o = a.get(e);
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
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = Ot(i).hoistableScripts, r = t.get(n), r || (r = {
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
		return "href=\"" + Yt(e) + "\"";
	}
	function Fm(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Im(e) {
		return D({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Lm(e, t, n, r) {
		if (t = e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]")) {
			if (!0 !== t[Ct]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[Ct] = !0, t.onload = t.onerror = At.bind(null, t), np(t, "link", n), kt(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + Yt(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Yt(n.href) + "\"]");
				if (r) return t.instance = r, kt(r), r;
				var i = D({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), kt(r), np(r, "style", i), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				i = Pm(n.href);
				var a = e.querySelector(Fm(i));
				if (a) return t.state.loading |= 4, t.instance = a, kt(a), a;
				r = Im(n), (i = vm.get(i)) && Hm(r, i), a = (e.ownerDocument || e).createElement("link"), kt(a);
				var o = a;
				return o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), np(a, "link", r), t.state.loading |= 4, Vm(a, n.precedence, e), t.instance = a;
			case "script": return a = Rm(n.src), (i = e.querySelector(zm(a))) ? (t.instance = i, kt(i), i) : (r = n, (i = vm.get(a)) && (r = D({}, n), Um(r, i)), e = e.ownerDocument || e, i = e.createElement("script"), kt(i), np(i, "link", r), e.head.appendChild(i), t.instance = i);
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
			if (!(a[St] || a[ht] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
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
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, kt(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), kt(a);
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
		$$typeof: oe,
		Provider: null,
		Consumer: null,
		_currentValue: be,
		_currentValue2: be,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = it(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = it(0), this.hiddenUpdates = it(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = Ci(3, null, null, t), e.current = a, a.stateNode = e, t = Ca(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, ao(a), e;
	}
	function uh(e) {
		return e ? (e = xi, e) : xi;
	}
	function dh(e, t, n, r, i, a) {
		i = uh(i), r.context === null ? r.context = i : r.pendingContext = i, r = so(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = co(e, r, t), n !== null && (Md(n, e, t), lo(n, e, t));
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
			var t = vi(e, 67108864);
			t !== null && Md(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = kd();
			t = ut(t);
			var n = vi(e, t);
			n !== null && Md(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = j.T;
		j.T = null;
		var a = M.p;
		try {
			M.p = 2, yh(e, t, n, r);
		} finally {
			M.p = a, j.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = j.T;
		j.T = null;
		var a = M.p;
		try {
			M.p = 8, yh(e, t, n, r);
		} finally {
			M.p = a, j.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) Gf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = Et(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Qe(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - G(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Tf(a), !(Yu & 6) && (md = B() + 500, Ef(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = vi(a, 2), s !== null && Md(s, a, 2), Ld(), ph(a, 2);
					}
					if (a = bh(r), a === null && Gf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Gf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = pn(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = Tt(e), e !== null) {
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
			case "message": switch (V()) {
				case H: return 2;
				case ze: return 8;
				case Be:
				case U: return 32;
				case W: return 268435456;
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
		}, t !== null && (t = Et(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
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
		var t = Tt(e.target);
		if (t !== null) {
			var n = l(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = u(n), t !== null) {
						e.blockedOn = t, pt(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = d(n), t !== null) {
						e.blockedOn = t, pt(e.priority, function() {
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
				fn = r, n.target.dispatchEvent(r), fn = null;
			} else return t = Et(n), t !== null && mh(t), e.blockedOn = n, !1;
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
				var a = Et(n);
				a !== null && (e.splice(t, 3), t -= 3, qs(a, {
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
			var i = n[r], a = n[r + 1], o = i[gt] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[gt] || null) s = o.formAction;
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
			dh(e.current, 2, null, e, null, null), Ld(), t[_t] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = ft();
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
	M.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(s(188)) : (e = Object.keys(e).join(","), Error(s(268, e)));
		return e = p(t), e = e === null ? null : m(e), e = e === null ? null : e.stateNode, e;
	};
	var qh = {
		bundleType: 0,
		version: "19.3.1",
		rendererPackageName: "react-dom",
		currentDispatcherRef: j,
		reconcilerVersion: "19.3.1"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Jh = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Jh.isDisabled && Jh.supportsFiber) try {
			Ue = Jh.inject(qh), We = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!c(e)) throw Error(s(299));
		var n = !1, r = "", i = gc, a = _c, o = vc;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (i = t.onUncaughtError), t.onCaughtError !== void 0 && (a = t.onCaughtError), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, i, a, o, Uh), e[_t] = t.current, Uf(e), new Wh(t);
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
function C(e) {
	return e.display_name || (e.is_temporary ? "Untitled workspace" : e.name.split(/[\\/]/).pop()?.replace(/\.legion$/, "") || "Workspace");
}
// node_modules/openapi-fetch/dist/index.mjs
var w = i(), T = o(), E = /\{[^{}]+\}/g, D = () => typeof process == "object" && Number.parseInt(process?.versions?.node?.substring(0, 2)) >= 18 && process.versions.undici;
function O() {
	return Math.random().toString(36).slice(2, 11);
}
function ee(e) {
	let { baseUrl: t = "", Request: n = globalThis.Request, fetch: r = globalThis.fetch, querySerializer: i, bodySerializer: a, pathSerializer: o, headers: s, requestInitExt: c = void 0, ...l } = { ...e };
	c = D() ? c : void 0, t = le(t);
	let u = [];
	async function d(e, d) {
		let { baseUrl: f, fetch: p = r, Request: m = n, headers: h, params: g = {}, parseAs: _ = "json", querySerializer: v, bodySerializer: y = a ?? oe, pathSerializer: b, body: x, middleware: S = [], ...C } = d || {}, w = t;
		f && (w = le(f) ?? t);
		let T = typeof i == "function" ? i : ie(i);
		v && (T = typeof v == "function" ? v : ie({
			...typeof i == "object" ? i : {},
			...v
		}));
		let E = b || o || ae, D = x === void 0 ? void 0 : y(x, ce(s, h, g.header)), ee = ce(D === void 0 || D instanceof FormData ? {} : { "Content-Type": "application/json" }, s, h, g.header), te = [...u, ...S], ne = {
			redirect: "follow",
			...l,
			...C,
			body: D,
			headers: ee
		}, re, ue, de = new m(se(e, {
			baseUrl: w,
			params: g,
			querySerializer: T,
			pathSerializer: E
		}), ne), fe;
		for (let e in C) e in de || (de[e] = C[e]);
		if (te.length) {
			re = O(), ue = Object.freeze({
				baseUrl: w,
				fetch: p,
				parseAs: _,
				querySerializer: T,
				bodySerializer: y,
				pathSerializer: E
			});
			for (let t of te) if (t && typeof t == "object" && typeof t.onRequest == "function") {
				let n = await t.onRequest({
					request: de,
					schemaPath: e,
					params: g,
					options: ue,
					id: re
				});
				if (n) {
					if (n instanceof m) de = n;
					else if (n instanceof Response) {
						fe = n;
						break;
					} else throw Error("onRequest: must return new Request() or Response() when modifying the request");
				}
			}
		}
		if (!fe) {
			try {
				fe = await p(de, c);
			} catch (t) {
				let n = t;
				if (te.length) for (let t = te.length - 1; t >= 0; t--) {
					let r = te[t];
					if (r && typeof r == "object" && typeof r.onError == "function") {
						let t = await r.onError({
							request: de,
							error: n,
							schemaPath: e,
							params: g,
							options: ue,
							id: re
						});
						if (t) {
							if (t instanceof Response) {
								n = void 0, fe = t;
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
			if (te.length) for (let t = te.length - 1; t >= 0; t--) {
				let n = te[t];
				if (n && typeof n == "object" && typeof n.onResponse == "function") {
					let t = await n.onResponse({
						request: de,
						response: fe,
						schemaPath: e,
						params: g,
						options: ue,
						id: re
					});
					if (t) {
						if (!(t instanceof Response)) throw Error("onResponse: must return new Response() when modifying the response");
						fe = t;
					}
				}
			}
		}
		let pe = fe.headers.get("Content-Length");
		if (fe.status === 204 || de.method === "HEAD" || pe === "0" && !fe.headers.get("Transfer-Encoding")?.includes("chunked")) return fe.ok ? {
			data: void 0,
			response: fe
		} : {
			error: void 0,
			response: fe
		};
		if (fe.ok) return {
			data: await (async () => {
				if (_ === "stream") return fe.body;
				if (_ === "json" && !pe) {
					let e = await fe.text();
					return e ? JSON.parse(e) : void 0;
				}
				return await fe[_]();
			})(),
			response: fe
		};
		let me = await fe.text();
		try {
			me = JSON.parse(me);
		} catch {}
		return {
			error: me,
			response: fe
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
function te(e, t, n) {
	if (t == null) return "";
	if (typeof t == "object") throw Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
	return `${e}=${n?.allowReserved === !0 ? t : encodeURIComponent(t)}`;
}
function ne(e, t, n) {
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
		r.push(te(a, t[i], n));
	}
	let a = r.join(i);
	return n.style === "label" || n.style === "matrix" ? `${i}${a}` : a;
}
function re(e, t, n) {
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
	for (let r of t) n.style === "simple" || n.style === "label" ? i.push(n.allowReserved === !0 ? r : encodeURIComponent(r)) : i.push(te(e, r, n));
	return n.style === "label" || n.style === "matrix" ? `${r}${i.join(r)}` : i.join(r);
}
function ie(e) {
	return function(t) {
		let n = [];
		if (t && typeof t == "object") for (let r in t) {
			let i = t[r];
			if (i != null) {
				if (Array.isArray(i)) {
					if (i.length === 0) continue;
					n.push(re(r, i, {
						style: "form",
						explode: !0,
						...e?.array,
						allowReserved: e?.allowReserved || !1
					}));
				} else typeof i == "object" ? n.push(ne(r, i, {
					style: "deepObject",
					explode: !0,
					...e?.object,
					allowReserved: e?.allowReserved || !1
				})) : n.push(te(r, i, e));
			}
		}
		return n.join("&");
	};
}
function ae(e, t) {
	let n = e;
	for (let r of e.match(E) ?? []) {
		let e = r.substring(1, r.length - 1), i = !1, a = "simple";
		if (e.endsWith("*") && (i = !0, e = e.substring(0, e.length - 1)), e.startsWith(".") ? (a = "label", e = e.substring(1)) : e.startsWith(";") && (a = "matrix", e = e.substring(1)), !t || t[e] === void 0 || t[e] === null) continue;
		let o = t[e];
		n = Array.isArray(o) ? n.replace(r, re(e, o, {
			style: a,
			explode: i
		})) : typeof o == "object" ? n.replace(r, ne(e, o, {
			style: a,
			explode: i
		})) : a === "matrix" ? n.replace(r, `;${te(e, o)}`) : n.replace(r, a === "label" ? `.${encodeURIComponent(o)}` : encodeURIComponent(o));
	}
	return n;
}
function oe(e, t) {
	return e instanceof FormData ? e : t && (t.get instanceof Function ? t.get("Content-Type") ?? t.get("content-type") : t["Content-Type"] ?? t["content-type"]) === "application/x-www-form-urlencoded" ? new URLSearchParams(e).toString() : JSON.stringify(e);
}
function se(e, t) {
	let n = `${t.baseUrl}${e}`;
	t.params?.path && (n = t.pathSerializer(n, t.params.path));
	let r = t.querySerializer(t.params.query ?? {});
	return r.startsWith("?") && (r = r.substring(1)), r && (n += `?${r}`), n;
}
function ce(...e) {
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
function le(e) {
	return e.endsWith("/") ? e.substring(0, e.length - 1) : e;
}
// src/api/client.ts
var ue = ee({
	baseUrl: window.location.origin,
	fetch: (e) => globalThis.fetch(e)
});
function de(e, t) {
	let n = e && typeof e == "object" && "error" in e ? String(e.error) : `Request failed (${t})`;
	return Error(n);
}
async function fe(e, t) {
	let { data: n, error: r, response: i } = await ue.POST("/api/project/rename", { body: {
		name: e,
		expected_path: t
	} });
	if (!n) throw de(r, i.status);
	return n.project;
}
async function pe() {
	let { data: e, error: t, response: n } = await ue.GET("/api/jobs", { params: { query: { limit: 100 } } });
	if (!e) throw de(t, n.status);
	return e.jobs;
}
async function me(e) {
	let { data: t, error: n, response: r } = await ue.POST("/api/jobs/{job_id}/stop", { params: { path: { job_id: e } } });
	if (!t) throw de(n, r.status);
	return t.job;
}
// ../app/web/static/js/workspace/state.js
var k = {
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
}, he = JSON.parse(document.getElementById("scan-presets")?.textContent || "{}"), ge = he.quick || "", _e = he.comprehensive || "", A = {
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
}, ve = {
	pendingChannels: /* @__PURE__ */ new Set(),
	running: !1,
	timer: null
}, ye = [], j = {
	recommendedPlatform: "kali",
	supportedPlatforms: ["kali", "ubuntu"],
	plan: null
}, M = "legion.graphWorkspaceHeightPx", be = 1600, xe = "#ff9f43", Se = {
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
			"cve",
			"screenshot"
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
			"artifact",
			"screenshot"
		]
	},
	web_application_map: {
		label: "web application map",
		defaultGroup: "service",
		nodeTypes: [
			"host",
			"fqdn",
			"service",
			"url",
			"technology",
			"finding",
			"cpe",
			"cve",
			"screenshot",
			"artifact",
			"action"
		]
	},
	credential_identity_session: {
		label: "credential / identity / session",
		defaultGroup: "host",
		nodeTypes: [
			"host",
			"credential",
			"identity",
			"session",
			"action",
			"artifact",
			"evidence_record"
		],
		edgeTypes: [
			"contains",
			"authenticated_as",
			"captured",
			"produced",
			"pivoted_to",
			"validated_by"
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
			"screenshot",
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
}, Ce = {
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
}, N = {
	width: 148,
	height: 58
}, Ee = [
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
	"screenshot",
	"action",
	"artifact",
	"evidence_record"
], De = {
	critical: 0,
	high: 1,
	medium: 2,
	moderate: 2,
	low: 3,
	info: 4,
	informational: 4
}, P = {
	processId: null,
	offset: 0,
	complete: !0,
	status: "",
	text: "",
	modalOpen: !1,
	refreshTimer: null,
	refreshInFlight: !1
}, F = {
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
	url: "",
	filename: "",
	port: ""
}, ke = {
	modalOpen: !1,
	text: "",
	count: 0
}, Ae = {
	panelEnabled: !0,
	captures: [],
	dedupedHashes: [],
	responder: {
		config: {},
		session: {}
	},
	ntlmrelayx: {
		config: {},
		session: {}
	},
	modalOpen: !1,
	configModalOpen: !1
}, je = {
	modalOpen: !1,
	hostId: null,
	hostIp: "",
	hostName: ""
}, Me = {
	step: 1,
	lastMode: "",
	lastEngagementPreset: "",
	postSubmitLock: !0,
	captureInterfacesLoaded: !1
}, Ne = 2e3, Pe = {
	modalOpen: !1,
	busy: !1,
	pendingAction: null,
	pendingLabel: "",
	latestSummary: null
}, I = {
	schedulerOpen: !1,
	interfaceSettingsOpen: !1,
	deviceCategorySettingsOpen: !1,
	reportProviderOpen: !1,
	settingsOpen: !1,
	nmapScanOpen: !1,
	manualScanOpen: !1,
	hostSelectionOpen: !1,
	scriptCveOpen: !1,
	providerLogsOpen: !1,
	credentialsOpen: !1,
	credentialCaptureConfigOpen: !1,
	jobsOpen: !1,
	submittedScansOpen: !1,
	schedulerDecisionsOpen: !1,
	hostRemoveOpen: !1,
	graphNoteOpen: !1,
	workspaceSwitchGuardOpen: !1
}, Fe = { openMenuId: null }, Ie = {
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
}, Le = {
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
};
// ../app/web/static/js/workspace/dom.js
function Re() {
	let e = !!(P.modalOpen || F.modalOpen || Oe.modalOpen || I.schedulerOpen || I.interfaceSettingsOpen || I.deviceCategorySettingsOpen || I.reportProviderOpen || I.settingsOpen || I.nmapScanOpen || I.manualScanOpen || I.hostSelectionOpen || I.scriptCveOpen || I.providerLogsOpen || I.credentialsOpen || I.credentialCaptureConfigOpen || I.jobsOpen || I.submittedScansOpen || I.schedulerDecisionsOpen || I.hostRemoveOpen || I.graphNoteOpen || I.workspaceSwitchGuardOpen);
	document.body.classList.toggle("modal-open", e);
}
function L(e, t) {
	let n = document.getElementById(e);
	n && (n.textContent = t ?? "");
}
function R(e, t) {
	let n = document.getElementById(e);
	n && (n.value = t ?? "");
}
function z(e, t) {
	let n = document.getElementById(e);
	n && (n.checked = !!t);
}
function B(e) {
	let t = document.getElementById(e);
	return t ? !!t.checked : !1;
}
function V(e) {
	let t = document.getElementById(e);
	return t ? t.value : "";
}
function H(e) {
	let t = document.createElement("td");
	return t.textContent = e ?? "", t;
}
function ze(e, t = "") {
	let n = document.createElement("td");
	t && (n.className = t);
	let r = String(e ?? ""), i = document.createElement("span");
	return i.className = "cell-truncate", i.textContent = r, r && (n.title = r), n.appendChild(i), n;
}
function Be(e) {
	return String(e || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function U(e, t = !1) {
	let n = document.getElementById("action-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
function W(e, t = !1) {
	let n = document.getElementById("workspace-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
// ../app/web/static/js/workspace/project_view.js
function Ve(e) {
	p(e), L("project-name", e.name || "");
	let t = document.getElementById("project-name");
	t && (t.dataset.displayName = e.display_name || ""), L("project-kind", e.is_temporary ? "temporary" : "saved"), L("project-output-folder", e.output_folder || ""), L("project-running-folder", e.running_folder || ""), !V("project-save-path").trim() && e.name && R("project-save-path", e.name);
}
// node_modules/react/cjs/react-jsx-runtime.production.js
var He = /* @__PURE__ */ e(((e) => {
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
})), Ue = (/* @__PURE__ */ e(((e, t) => {
	t.exports = He();
})))();
function We({ sidebar: e, title: t, sidebarEditor: n, titleEditor: r }) {
	let i = (0, w.useSyncExternalStore)(_.subscribe, _.getSnapshot), a = (0, w.useSyncExternalStore)(y.subscribe, y.getSnapshot), [o, s] = (0, w.useState)(null), [c, l] = (0, w.useState)(""), [u, d] = (0, w.useState)(""), [f, p] = (0, w.useState)(!1), m = (0, w.useRef)(!1), h = (0, w.useRef)(null), g = (0, w.useRef)(null), v = C(i);
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
	(0, w.useEffect)(() => {
		a.token && x(a.location);
	}, [a.token]), (0, w.useLayoutEffect)(() => {
		o && (g.current?.focus(), g.current?.select());
	}, [o?.path, o?.location]), (0, w.useEffect)(() => {
		o && o.path !== i.name && S();
	}, [i.name]);
	async function E() {
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
				let t = await fe(e, o.path);
				_.getSnapshot().name === o.path && (b(t), Ve(t), U("Workspace renamed")), S();
			} catch (e) {
				d(e instanceof Error ? e.message : "Rename failed."), requestAnimationFrame(() => g.current?.focus());
			} finally {
				m.current = !1, p(!1);
			}
		}
	}
	let D = o?.location === "sidebar", O = /* @__PURE__ */ (0, Ue.jsxs)(Ue.Fragment, { children: [/* @__PURE__ */ (0, Ue.jsx)("input", {
		id: "workspace-rename-input",
		type: "text",
		maxLength: 120,
		"aria-label": "Workspace name",
		ref: g,
		hidden: !o,
		disabled: f,
		value: c,
		"aria-invalid": u ? !0 : void 0,
		className: D ? "workspace-rename-sidebar" : void 0,
		onChange: (e) => l(e.target.value),
		onBlur: () => {
			E();
		},
		onKeyDown: (e) => {
			e.key === "Enter" && (e.preventDefault(), E()), e.key === "Escape" && !m.current && (e.preventDefault(), S(!0));
		}
	}), /* @__PURE__ */ (0, Ue.jsx)("span", {
		role: "alert",
		className: `workspace-rename-error${D ? " workspace-rename-sidebar-error" : ""}`,
		children: u
	})] });
	return /* @__PURE__ */ (0, Ue.jsxs)(Ue.Fragment, { children: [
		(0, T.createPortal)(/* @__PURE__ */ (0, Ue.jsxs)(Ue.Fragment, { children: [/* @__PURE__ */ (0, Ue.jsx)("strong", {
			id: "sidebar-project-name",
			title: "Double-click to rename workspace",
			style: { visibility: D ? "hidden" : void 0 },
			onDoubleClick: (e) => {
				e.preventDefault(), e.stopPropagation(), x("sidebar");
			},
			children: v
		}), /* @__PURE__ */ (0, Ue.jsx)("small", {
			id: "sidebar-project-kind",
			children: i.is_temporary ? "Temporary · save to keep your work" : "Saved project"
		})] }), e),
		(0, T.createPortal)(/* @__PURE__ */ (0, Ue.jsx)("button", {
			id: "breadcrumb-project",
			type: "button",
			title: "Rename workspace",
			"aria-label": "Rename workspace",
			hidden: o?.location === "title",
			onClick: () => x("title"),
			children: v
		}), t),
		(0, T.createPortal)(O, D ? n : r)
	] });
}
// src/JobsTable.tsx
function Ge() {
	let e = (0, w.useSyncExternalStore)(v.subscribe, v.getSnapshot), [t, n] = (0, w.useState)(/* @__PURE__ */ new Set()), [r, i] = (0, w.useState)(""), a = (0, w.useRef)(/* @__PURE__ */ new Set());
	async function o(e) {
		if (!a.current.has(e)) {
			a.current.add(e), n((t) => new Set(t).add(e)), i("");
			try {
				let t = await me(e);
				v.set(v.getSnapshot().map((e) => e.id === t.id ? t : e)), U("Job stop requested"), v.set(await pe());
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
	return /* @__PURE__ */ (0, Ue.jsxs)(Ue.Fragment, { children: [r && /* @__PURE__ */ (0, Ue.jsx)("tr", {
		role: "alert",
		children: /* @__PURE__ */ (0, Ue.jsx)("td", {
			colSpan: 8,
			children: r
		})
	}), e.map((e) => {
		let n = e.status === "queued" || e.status === "running", r = e.cancel_requested || t.has(e.id), i = r && n ? e.status === "queued" ? "cancelling" : "stopping" : e.status, a = Array.isArray(e.result?.warnings) ? e.result.warnings.filter((e) => typeof e == "string") : [], s = e.error || a.join(" | ") || (r ? e.cancel_reason || "stop requested" : "");
		return /* @__PURE__ */ (0, Ue.jsxs)("tr", {
			"data-job-id": e.id,
			children: [
				/* @__PURE__ */ (0, Ue.jsx)("td", { children: e.id }),
				/* @__PURE__ */ (0, Ue.jsx)("td", { children: e.type }),
				/* @__PURE__ */ (0, Ue.jsx)("td", { children: i }),
				/* @__PURE__ */ (0, Ue.jsx)("td", { children: e.created_at }),
				/* @__PURE__ */ (0, Ue.jsx)("td", { children: e.started_at }),
				/* @__PURE__ */ (0, Ue.jsx)("td", { children: e.finished_at }),
				/* @__PURE__ */ (0, Ue.jsx)("td", { children: s }),
				/* @__PURE__ */ (0, Ue.jsx)("td", { children: n && /* @__PURE__ */ (0, Ue.jsx)("button", {
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
// ../app/web/static/js/workspace/http.js
async function G(e, t) {
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
async function Ke(e) {
	let t = await fetch(e, { cache: "no-store" });
	if (!t.ok) throw Error(`Request failed (${t.status})`);
	return t.json();
}
// ../app/web/static/js/workspace/output_format.js
function qe(e) {
	e.bold = !1, e.fg = "", e.bg = "";
}
function Je(e, t) {
	let n = Array.isArray(e) && e.length ? e : [0];
	for (let e = 0; e < n.length; e += 1) {
		let r = Number(n[e]);
		if (Number.isFinite(r)) {
			if (r === 0) qe(t);
			else if (r === 1) t.bold = !0;
			else if (r === 22) t.bold = !1;
			else if (r === 39) t.fg = "";
			else if (r === 49) t.bg = "";
			else if (Ie[r]) t.fg = Ie[r];
			else if (Le[r]) t.bg = Le[r];
			else if (r === 38 || r === 48 || r === 58) {
				let t = Number(n[e + 1]);
				t === 5 ? e += 2 : t === 2 && (e += 4);
			}
		}
	}
}
function Ye(e) {
	let t = ["ansi-segment"];
	return e.bold && t.push("ansi-bold"), e.fg && t.push(e.fg), e.bg && t.push(e.bg), t.join(" ");
}
function Xe(e) {
	let t = String(e || "").replace(/\r\n/g, "\n"), n = /\u001b\[([0-9;]*)m/g, r = {
		bold: !1,
		fg: "",
		bg: ""
	}, i = 0, a = "";
	return t.replace(n, (e, n, o) => {
		if (o > i) {
			let e = t.slice(i, o);
			a += `<span class="${Ye(r)}">${Be(e)}</span>`;
		}
		return Je(String(n || "").split(";").map((e) => e.trim()).filter((e) => e.length > 0).map((e) => parseInt(e, 10)).filter((e) => Number.isFinite(e)), r), i = o + e.length, e;
	}), i < t.length && (a += `<span class="${Ye(r)}">${Be(t.slice(i))}</span>`), a || "";
}
function Ze(e, t) {
	let n = document.getElementById(e);
	if (!n) return;
	let r = Math.abs(n.scrollTop + n.clientHeight - n.scrollHeight) < 24;
	n.innerHTML = Xe(t || ""), r && (n.scrollTop = n.scrollHeight);
}
function Qe(e, t = "", n = "") {
	let r = String(e || "").trim(), i = String(t || "").trim(), a = String(n || "").trim();
	return !i && !a ? r : a ? i ? `${r}:${i}/${a}` : r ? `${r}/${a}` : `/${a}` : `${r}:${i}`;
}
function $e(e, t = 160) {
	let n = String(e || "").replace(/\s+/g, " ").trim();
	return n ? n.length <= t ? n : `${n.slice(0, t - 3)}...` : "";
}
function et(e) {
	let t = Array.isArray(e?.scripts) ? e.scripts : [], n = [
		(e) => e === "banner",
		(e) => e.includes("banner"),
		(e) => e === "http-title",
		(e) => e === "dns-nsid"
	];
	for (let e of n) for (let n of t) {
		let t = String(n?.script_id || "").trim().toLowerCase();
		if (!t || !e(t)) continue;
		let r = $e(n?.output || "");
		if (r) return r;
	}
	let r = e?.service || {};
	return $e([
		r.product,
		r.version,
		r.extrainfo
	].filter(Boolean).join(" "));
}
function tt(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t <= 0) return "";
	let n = Math.max(0, Math.floor(t)), r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), a = n % 60;
	return r > 0 ? `${r}h ${String(i).padStart(2, "0")}m ${String(a).padStart(2, "0")}s` : `${i}m ${String(a).padStart(2, "0")}s`;
}
function nt(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "running" || t === "waiting";
}
function rt(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "running" ? "process-status-running" : t === "crashed" ? "process-status-crashed" : t === "problem" ? "process-status-problem" : "";
}
// ../app/web/static/js/workspace/process_output.js
var it, at, ot;
function st(e) {
	for (let t of [
		"pollSnapshot",
		"setCredentialCaptureConfigModalOpen",
		"setCredentialsModalOpen"
	]) if (typeof e[t] != "function") throw TypeError(`Missing process_output callback: ${t}`);
	({pollSnapshot: it, setCredentialCaptureConfigModalOpen: at, setCredentialsModalOpen: ot} = e);
}
function ct(e) {
	let t = document.getElementById("processes-body");
	t && (t.innerHTML = "", (e || []).forEach((e) => {
		let n = document.createElement("tr");
		n.dataset.processId = String(e.id || ""), n.appendChild(H(e.id)), n.appendChild(ze(e.name, "process-name-cell"));
		let r = Qe(e.hostIp, e.port, e.protocol);
		n.appendChild(ze(r, "process-target-cell"));
		let i = document.createElement("td");
		i.className = "process-status-cell";
		let a = document.createElement("span");
		a.className = "process-status";
		let o = rt(e.status);
		if (o && a.classList.add(o), nt(e.status)) {
			let e = document.createElement("span");
			e.className = "process-spinner", e.setAttribute("aria-hidden", "true"), a.appendChild(e);
		}
		let s = document.createElement("span");
		s.textContent = e.status || "", a.appendChild(s), i.appendChild(a), n.appendChild(i);
		let c = e.percent || "", l = Number(String(c).replace("%", "").trim());
		Number.isFinite(l) && (c = `${l.toFixed(1)}%`);
		let u = H(c);
		u.className = "process-percent-cell", n.appendChild(u);
		let d = H(tt(e.estimatedRemaining));
		d.className = "process-eta-cell", n.appendChild(d);
		let f = document.createElement("td");
		f.className = "process-actions";
		let p = document.createElement("button");
		p.type = "button", p.className = "icon-btn", p.title = "Output", p.setAttribute("aria-label", "Output"), p.innerHTML = "<i class=\"fa-solid fa-terminal\" aria-hidden=\"true\"></i>", p.dataset.processAction = "output", p.dataset.processId = String(e.id || ""), f.appendChild(p);
		let m = document.createElement("button");
		if (m.type = "button", m.className = "icon-btn", m.title = "Retry", m.setAttribute("aria-label", "Retry"), m.innerHTML = "<i class=\"fa-solid fa-rotate-right\" aria-hidden=\"true\"></i>", m.dataset.processAction = "retry", m.dataset.processId = String(e.id || ""), f.appendChild(m), nt(e.status)) {
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Kill", t.setAttribute("aria-label", "Kill"), t.innerHTML = "<i class=\"fa-solid fa-stop\" aria-hidden=\"true\"></i>", t.dataset.processAction = "kill", t.dataset.processId = String(e.id || ""), f.appendChild(t);
		}
		let h = document.createElement("button");
		h.type = "button", h.className = "icon-btn", h.title = "Hide", h.setAttribute("aria-label", "Hide"), h.innerHTML = "<i class=\"fa-solid fa-eye-slash\" aria-hidden=\"true\"></i>", h.dataset.processAction = "close", h.dataset.processId = String(e.id || ""), f.appendChild(h), n.appendChild(f), t.appendChild(n);
	}), L("process-count", (e || []).length));
}
function lt(e) {
	L("process-output-meta", e || "");
}
function ut(e) {
	P.text = String(e || ""), Ze("process-output-text", P.text);
}
function dt(e) {
	L("process-output-command", e || "");
}
function ft(e) {
	L("process-output-progress", e || "No structured progress reported");
}
function pt(e) {
	L("script-output-meta", e || "");
}
function mt(e) {
	F.output = String(e || ""), Ze("script-output-text", F.output);
}
function ht(e) {
	L("script-output-command", e || "");
}
function gt(e) {
	let t = document.getElementById("process-output-modal");
	t && (P.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function _t(e) {
	let t = document.getElementById("script-output-modal");
	t && (F.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function vt(e) {
	let t = document.getElementById("screenshot-modal");
	t && (Oe.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function yt() {
	P.refreshTimer &&= (window.clearInterval(P.refreshTimer), null);
}
function bt() {
	yt(), P.refreshTimer = window.setInterval(() => {
		P.modalOpen && At(!1, !1).catch(() => {});
	}, Ne);
}
function xt(e = !0) {
	yt(), P.refreshInFlight = !1, gt(!1), e && (P.processId = null, P.offset = 0, P.complete = !0, P.status = "", P.text = "", lt("No process selected"), dt(""), ft(""), ut(""));
}
function St(e = !0) {
	_t(!1), e && (F.scriptDbId = null, F.processId = 0, F.scriptId = "", F.source = "", F.output = "", F.command = "", F.status = "", F.downloadName = "", L("script-output-modal-title", "Script Output"), pt("No script selected"), ht(""), mt(""));
}
function Ct(e = !0) {
	if (vt(!1), e) {
		Oe.url = "", Oe.filename = "", Oe.port = "";
		let e = document.getElementById("screenshot-modal-image");
		e && e.removeAttribute("src"), L("screenshot-modal-meta", "No screenshot selected");
	}
}
function wt() {
	ot(!1);
}
function Tt() {
	at(!1);
}
async function Et(e) {
	let t = parseInt(e, 10);
	if (t) {
		gt(!0), lt(`Process ${t} | loading...`), dt(""), ft(""), ut(""), P.processId = t, P.offset = 0, P.complete = !1, P.status = "", bt();
		try {
			await At(!0, !0);
		} catch (e) {
			lt(`Process ${t} | load failed`), ft("No structured progress reported"), ut(`Failed to load process output: ${e.message || e}`);
		}
	}
}
async function Dt(e) {
	let t = parseInt(e, 10);
	if (t) {
		_t(!0), L("script-output-modal-title", "Script Output"), pt(`Script ${t} | loading...`), ht(""), mt(""), F.scriptDbId = t, F.processId = 0, F.scriptId = "", F.source = "", F.output = "", F.command = "", F.status = "", F.downloadName = "";
		try {
			let e = await Ke(`/api/workspace/scripts/${t}/output?max_chars=50000`), n = String(e.output || e.output_chunk || ""), r = e.source === "process" ? `Process ${e.process_id || "?"}` : "Script row output";
			F.processId = parseInt(e.process_id, 10) || 0, F.scriptId = String(e.script_id || ""), F.source = String(e.source || ""), F.output = n, F.command = String(e.command || ""), F.status = String(e.status || ""), F.downloadName = "", ht(e.command || "(no associated process command)"), mt(n), pt(`${e.script_id || `Script ${t}`} | ${r} | bytes ${e.output_length || n.length}`);
		} catch (e) {
			pt(`Script ${t} | load failed`), mt(`Failed to load script output: ${e.message || e}`);
		}
	}
}
function Ot({ title: e = "Artifact Preview", meta: t = "", command: n = "", output: r = "", downloadName: i = "" } = {}) {
	_t(!0), F.scriptDbId = null, F.processId = 0, F.scriptId = "", F.source = "graph", F.output = String(r || ""), F.command = String(n || ""), F.status = "", F.downloadName = String(i || ""), L("script-output-modal-title", e || "Artifact Preview"), pt(String(t || "Artifact preview")), ht(n || "(no associated command)"), mt(r || "");
}
function kt(e, t, n = "") {
	let r = String(e || "").trim();
	if (!r) {
		W("Screenshot URL is missing", !0);
		return;
	}
	Oe.url = r, Oe.filename = String(t || "").trim() || "screenshot.png", Oe.port = String(n || "").trim();
	let i = document.getElementById("screenshot-modal-image");
	i && (i.src = `${r}${r.includes("?") ? "&" : "?"}t=${Date.now()}`, i.alt = Oe.filename || "Screenshot preview");
	let a = Oe.port ? ` (${Oe.port})` : "";
	L("screenshot-modal-meta", `${Oe.filename}${a}`), vt(!0);
}
async function At(e = !1, t = !1) {
	let n = parseInt(P.processId, 10);
	if (n && (e || !P.complete) && !P.refreshInFlight) {
		P.refreshInFlight = !0;
		try {
			await zt(n, !!t);
		} finally {
			P.refreshInFlight = !1;
		}
	}
}
async function jt() {
	await It(P.text || "", "Process output copied to clipboard", "No process output to copy");
}
async function Mt() {
	let e = document.getElementById("process-output-command");
	await It(e ? String(e.textContent || "") : "", "Command copied to clipboard", "No command to copy");
}
async function Nt() {
	await It(F.output || "", "Script output copied to clipboard", "No script output to copy");
}
async function Pt() {
	let e = document.getElementById("script-output-command");
	await It(e ? String(e.textContent || "") : "", "Command copied to clipboard", "No command to copy");
}
async function Ft() {
	let e = String(Oe.url || "").trim();
	if (!e) W("No screenshot to copy", !0);
	else if (!(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write)) await It(e, "Screenshot URL copied to clipboard", "No screenshot to copy");
	else try {
		let t = await fetch(e);
		if (!t.ok) throw Error(`HTTP ${t.status}`);
		let n = await t.blob(), r = n.type || "image/png", i = new ClipboardItem({ [r]: n });
		await navigator.clipboard.write([i]), W("Screenshot copied to clipboard");
	} catch (e) {
		W(`Screenshot copy failed: ${e.message}`, !0);
	}
}
async function It(e, t, n) {
	let r = String(e || "");
	if (!r) W(n || "Nothing to copy", !0);
	else try {
		if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(r);
		else {
			let e = document.createElement("textarea");
			e.value = r, e.setAttribute("readonly", "readonly"), e.style.position = "absolute", e.style.left = "-9999px", document.body.appendChild(e), e.select(), document.execCommand("copy"), document.body.removeChild(e);
		}
		W(t || "Copied to clipboard");
	} catch (e) {
		W(`Copy failed: ${e.message}`, !0);
	}
}
function Lt() {
	let e = P.text || "";
	if (!e) {
		W("No process output to download", !0);
		return;
	}
	let t = parseInt(P.processId, 10) || "unknown", n = new Blob([e], { type: "text/plain;charset=utf-8" }), r = URL.createObjectURL(n), i = document.createElement("a");
	i.href = r, i.download = `process-${t}-output.txt`, document.body.appendChild(i), i.click(), i.remove(), URL.revokeObjectURL(r), W(`Process ${t} output downloaded`);
}
function Rt() {
	let e = F.output || "";
	if (!e) {
		W("No script output to download", !0);
		return;
	}
	if (F.downloadName) {
		let t = new Blob([e], { type: "text/plain;charset=utf-8" }), n = URL.createObjectURL(t), r = document.createElement("a");
		r.href = n, r.download = F.downloadName, document.body.appendChild(r), r.click(), r.remove(), URL.revokeObjectURL(n), W(`${F.downloadName} downloaded`);
		return;
	}
	let t = parseInt(F.scriptDbId, 10) || "unknown", n = (String(F.scriptId || "").trim() || `script-${t}`).replace(/[^a-zA-Z0-9._-]+/g, "-"), r = new Blob([e], { type: "text/plain;charset=utf-8" }), i = URL.createObjectURL(r), a = document.createElement("a");
	a.href = i, a.download = `${n}-${t}-output.txt`, document.body.appendChild(a), a.click(), a.remove(), URL.revokeObjectURL(i), W(`Script ${t} output downloaded`);
}
async function K() {
	let e = String(Oe.url || "").trim();
	if (!e) W("No screenshot to download", !0);
	else try {
		let t = await fetch(e);
		if (!t.ok) throw Error(`HTTP ${t.status}`);
		let n = await t.blob(), r = String(Oe.filename || "screenshot.png").replace(/[^a-zA-Z0-9._-]+/g, "-"), i = URL.createObjectURL(n), a = document.createElement("a");
		a.href = i, a.download = r || "screenshot.png", document.body.appendChild(a), a.click(), a.remove(), URL.revokeObjectURL(i), W(`Downloaded ${r}`);
	} catch (e) {
		W(`Screenshot download failed: ${e.message}`, !0);
	}
}
async function zt(e, t = !0) {
	let n = parseInt(e, 10);
	if (!n) return;
	(t || P.processId !== n) && (P.processId = n, P.offset = 0, P.complete = !1, P.status = "", ut(""), ft(""));
	let r = await Ke(`/api/processes/${n}/output?${new URLSearchParams({
		offset: String(P.offset || 0),
		max_chars: "24000"
	}).toString()}`);
	dt(r.command || "");
	let i = r.output_chunk || "", a = Number(r.next_offset || 0), o = P.text || "";
	i ? ut(`${o}${i}`) : t && r.output && ut(r.output || ""), P.offset = a, P.complete = !!r.completed, P.status = String(r.status || "");
	let s = r.progress || {}, c = [];
	if (s.summary && c.push(s.summary), s.source || s.updated_at) {
		let e = [];
		s.source && e.push(String(s.source)), s.updated_at && e.push(`updated ${s.updated_at}`), c.push(e.join(" | "));
	}
	ft(c.join("\n")), lt(`Process ${r.id} | ${r.status || ""} | bytes ${P.offset}/${r.output_length || 0}`);
}
async function Bt(e) {
	try {
		await G(`/api/processes/${e}/kill`, {}), W(`Process ${e} kill requested`), await it(), P.modalOpen && parseInt(P.processId, 10) === parseInt(e, 10) && await zt(e, !1);
	} catch (e) {
		W(`Kill failed: ${e.message}`, !0);
	}
}
async function Vt(e) {
	try {
		W(`Retry queued for process ${e} (job ${(await G(`/api/processes/${e}/retry`, {}))?.job?.id || "?"})`), await it();
	} catch (e) {
		W(`Retry failed: ${e.message}`, !0);
	}
}
async function Ht(e) {
	try {
		await G(`/api/processes/${e}/close`, {}), W(`Process ${e} hidden`), await it();
	} catch (e) {
		W(`Hide failed: ${e.message}`, !0);
	}
}
async function Ut(e) {
	try {
		await G("/api/processes/clear", { reset_all: !!e }), W(e ? "Hidden all non-running processes" : "Hidden finished/issues processes"), await it();
	} catch (e) {
		W(`Clear failed: ${e.message}`, !0);
	}
}
function Wt(e) {
	L("stat-hosts", e.hosts), L("stat-open-ports", e.open_ports), L("stat-services", e.services), L("stat-cves", e.cves), L("stat-running", e.running_processes), L("stat-finished", e.finished_processes);
}
// ../app/web/static/js/workspace/activity.js
async function Gt() {
	L("provider-logs-meta", "Loading logs...");
	try {
		let e = await Ke("/api/scheduler/provider/logs?limit=400");
		ke.text = String(e.text || ""), ke.count = Array.isArray(e.logs) ? e.logs.length : 0;
		let t = Array.isArray(e.logs) ? e.logs.filter((e) => !!e?.prompt_metadata?.structured_output_fallback).length : 0, n = Array.isArray(e.logs) ? e.logs.filter((e) => !!e?.prompt_metadata?.structured_output_used).length : 0;
		Ze("provider-logs-text", ke.text), L("provider-logs-meta", `Entries ${ke.count} | structured ${n} | fallback ${t} | bytes ${ke.text.length}`);
	} catch (e) {
		let t = `Failed to load provider logs: ${e.message}`;
		ke.text = t, Ze("provider-logs-text", t), L("provider-logs-meta", "Load failed"), W(t, !0);
	}
}
async function Kt() {
	await It(ke.text || "", "Provider logs copied to clipboard", "No provider logs to copy");
}
function qt() {
	let e = ke.text || "";
	if (!e) {
		W("No provider logs to download", !0);
		return;
	}
	let t = new Blob([e], { type: "text/plain;charset=utf-8" }), n = URL.createObjectURL(t), r = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), i = document.createElement("a");
	i.href = n, i.download = `provider-logs-${r}.txt`, document.body.appendChild(i), i.click(), i.remove(), URL.revokeObjectURL(n), W("Provider logs downloaded");
}
function Jt(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = Date.parse(t);
	return Number.isFinite(n) ? new Date(n).toLocaleString([], {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	}) : t;
}
function Yt(e) {
	let t = document.getElementById("decision-rationale-body");
	if (!t) return;
	let n = Array.isArray(e) ? e : [];
	if (t.innerHTML = "", L("decision-rationale-count", n.length), !n.length) {
		let e = document.createElement("p");
		e.className = "meta-note rationale-empty", e.textContent = "Scheduler rationale will appear here as tools are ranked, suppressed, and executed.", t.appendChild(e);
		return;
	}
	let r = document.createDocumentFragment();
	n.forEach((e) => {
		let t = document.createElement("article");
		t.className = "rationale-entry";
		let n = document.createElement("div");
		n.className = "rationale-entry-top";
		let i = document.createElement("div");
		i.className = "rationale-entry-heading";
		let a = document.createElement("p");
		a.className = "rationale-entry-prefix", a.textContent = Qe(e?.host_ip || "Project-wide", e?.port || "", e?.protocol || "") || "Project-wide", i.appendChild(a);
		let o = document.createElement("strong");
		o.className = "rationale-entry-title", o.textContent = String(e?.headline || e?.kind || "Decision").trim(), i.appendChild(o), n.appendChild(i);
		let s = document.createElement("span");
		s.className = "rationale-entry-time", s.textContent = Jt(e?.timestamp || ""), n.appendChild(s), t.appendChild(n);
		let c = Array.isArray(e?.tags) ? e.tags.filter((e) => String(e || "").trim()) : [];
		if (c.length) {
			let e = document.createElement("div");
			e.className = "rationale-entry-tags", c.forEach((t) => {
				let n = document.createElement("span");
				n.className = "chip rationale-chip", n.textContent = String(t || "").trim(), e.appendChild(n);
			}), t.appendChild(e);
		}
		let l = document.createElement("p");
		l.className = "rationale-entry-summary", l.textContent = String(e?.summary || "").trim() || "Scheduler decision recorded.", t.appendChild(l);
		let u = Array.isArray(e?.details) ? e.details.filter((e) => String(e || "").trim()) : [];
		if (u.length) {
			let e = document.createElement("div");
			e.className = "rationale-entry-details", u.forEach((t) => {
				let n = document.createElement("div");
				n.className = "rationale-entry-line", n.textContent = String(t || "").trim(), e.appendChild(n);
			}), t.appendChild(e);
		}
		r.appendChild(t);
	}), t.appendChild(r);
}
function Xt(e) {
	if (e && typeof e == "object") {
		if (e.project && Ve(e.project), e.summary && Wt(e.summary), e.scheduler) {
			let t = e.scheduler.engagement_policy || {};
			L("scheduler-mode", e.scheduler.mode || ""), L("scheduler-goal", t.preset_label || t.preset || e.scheduler.goal_profile || ""), L("scheduler-families", e.scheduler.preapproved_families_count || 0);
		}
		Array.isArray(e.scheduler_rationale_feed) && Yt(e.scheduler_rationale_feed);
	}
}
function Zt(e) {
	let t = document.getElementById("decisions-body");
	t && (t.innerHTML = "", (e || []).forEach((e) => {
		let n = document.createElement("tr"), r = Qe(e.host_ip, e.port, e.protocol);
		n.appendChild(H(e.timestamp || "")), n.appendChild(H(r)), n.appendChild(H(e.tool_id || e.label || "")), n.appendChild(H(e.scheduler_mode || "")), n.appendChild(H(e.approved || "")), n.appendChild(H(e.executed || "")), n.appendChild(H(e.reason || "")), n.appendChild(H(e.command_family_id || "")), t.appendChild(n);
	}), L("decision-count", (e || []).length));
}
function Qt(e) {
	let t = document.getElementById("approvals-body");
	t && (t.innerHTML = "", (e || []).forEach((e) => {
		let n = document.createElement("tr");
		n.dataset.approvalId = String(e.id || "");
		let r = (e, t, n) => {
			let r = String(n || "").trim();
			if (!r) return;
			let i = document.createElement("div");
			i.textContent = `${t}: ${r}`, e.appendChild(i);
		}, i = document.createElement("td");
		r(i, "tool", e.label || e.tool_id || ""), r(i, "id", e.tool_id || ""), r(i, "command", e.command_template || ""), r(i, "status", e.status || "");
		let a = document.createElement("td");
		r(a, "risk tags", e.risk_tags || e.danger_categories || ""), r(a, "decision", e.policy_decision || ""), r(a, "why risky", e.risk_summary || ""), r(a, "policy", e.policy_reason || ""), r(a, "safer alternative", e.safer_alternative || ""), r(a, "family policy", e.family_policy_state || "");
		let o = document.createElement("td");
		r(o, "planner rationale", e.rationale || ""), r(o, "evidence", e.evidence_refs || "");
		let s = document.createElement("td"), c = document.createElement("button");
		c.type = "button", c.textContent = "Approve+Run", c.dataset.action = "approve", c.dataset.approvalId = String(e.id || "");
		let l = document.createElement("button");
		l.type = "button", l.textContent = "Reject", l.dataset.action = "reject", l.dataset.approvalId = String(e.id || "");
		let u = document.createElement("button");
		u.type = "button", u.textContent = "Allow Family", u.dataset.action = "allow-family", u.dataset.approvalId = String(e.id || "");
		let d = document.createElement("button");
		d.type = "button", d.textContent = "Suppress Family", d.dataset.action = "suppress-family", d.dataset.approvalId = String(e.id || ""), s.className = "approval-action-buttons", s.appendChild(c), s.appendChild(l), s.appendChild(u), s.appendChild(d);
		let f = Qe(e.host_ip, e.port, e.protocol);
		n.appendChild(H(e.id || "")), n.appendChild(H(f)), n.appendChild(i), n.appendChild(a), n.appendChild(o), n.appendChild(s), t.appendChild(n);
	}), L("approval-count", (e || []).length));
}
function $t(e) {
	m(e || []), L("job-count", (e || []).length);
}
function en(e) {
	let t = document.getElementById("scan-history-body");
	t && (t.innerHTML = "", (e || []).forEach((e) => {
		let n = document.createElement("tr");
		n.appendChild(H(e.id || "")), n.appendChild(H(e.submission_kind || "")), n.appendChild(H(e.status || "")), n.appendChild(H(e.target_summary || "")), n.appendChild(H(e.scope_summary || "")), n.appendChild(H(e.scan_mode || "")), n.appendChild(H(e.created_at || "")), n.appendChild(H(e.result_summary || "")), t.appendChild(n);
	}), L("scan-history-count", (e || []).length));
}
async function tn() {
	Xt(await Ke("/api/workspace/overview") || {});
}
async function nn() {
	ct((await Ke("/api/processes?limit=100")).processes || []);
}
async function rn() {
	Zt((await Ke("/api/scheduler/decisions?limit=80")).decisions || []);
}
async function an() {
	$t((await Ke("/api/jobs?limit=20")).jobs || []);
}
async function on() {
	en((await Ke("/api/scans/history?limit=100")).scans || []);
}
// ../app/web/static/js/workspace/approvals.js
var sn;
function cn(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing approvals callback: ${t}`);
	({pollSnapshot: sn} = e);
}
async function ln() {
	try {
		Qt((await Ke("/api/scheduler/approvals?status=pending&limit=200")).approvals || []);
	} catch {}
}
async function un(e, t = "") {
	let n = String(t || ""), r = n === "allowed";
	try {
		await G(`/api/scheduler/approvals/${e}/approve`, {
			approve_family: r,
			run_now: !0,
			family_action: n
		}), W(n === "allowed" ? `Approval ${e} accepted and family allowed` : `Approval ${e} accepted`), await Promise.all([ln(), sn()]);
	} catch (e) {
		W(`Approve failed: ${e.message}`, !0);
	}
}
async function dn(e, t = "") {
	let n = String(t || "");
	try {
		await G(`/api/scheduler/approvals/${e}/reject`, {
			reason: "rejected in web workspace",
			family_action: n
		}), W(n === "suppressed" ? `Approval ${e} rejected and family suppressed` : `Approval ${e} rejected`), await Promise.all([ln(), sn()]);
	} catch (e) {
		W(`Reject failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/graph_selection.js
function fn(e, t) {
	return e === "edge" ? (A.filtered.edges || []).find((e) => String(e?.edge_id || "") === String(t || "")) || null : (A.filtered.nodes || []).find((e) => String(e?.node_id || "") === String(t || "")) || null;
}
// ../app/web/static/js/workspace/graph_common.js
var pn, mn;
function hn(e) {
	for (let t of ["graphRenderWorkspace", "graphSyncDetailPresentation"]) if (typeof e[t] != "function") throw TypeError(`Missing graph_common callback: ${t}`);
	({graphRenderWorkspace: pn, graphSyncDetailPresentation: mn} = e);
}
function gn() {
	let e = document.getElementById("graph-workspace-panel");
	return String(e?.dataset?.graphEnabled || "").toLowerCase() === "true";
}
function _n() {
	let e = document.getElementById("graph-workspace-canvas");
	return e ? e.closest(".graph-panel") : null;
}
function vn() {
	return document.getElementById("graph-workspace-shell");
}
function yn() {
	let e = vn();
	return e ? e.closest(".graph-panel") : null;
}
function bn() {
	return document.querySelector(".graph-canvas-panel");
}
function xn() {
	return document.querySelector(".graph-canvas-scroll");
}
function Sn() {
	return !!(A.selectedKind && A.selectedRef);
}
function Cn({ allowRetainedSummary: e = !0 } = {}) {
	if (A.selectedKind !== "node" || !A.selectedRef) return null;
	let t = fn("node", A.selectedRef);
	if (t) return t;
	if (!e) return null;
	let n = A.selectedPayload, r = String(A.selectedRef || ""), i = String(n?.node_id || "");
	return !n || i !== r || !J(n, "summary_kind") || !A.expandedSummaryIds[i] ? null : n;
}
function wn(e) {
	let t = Number.parseInt(String(e || ""), 10);
	return Number.isFinite(t) ? Math.max(520, Math.min(be, t)) : 680;
}
function Tn(e, { persist: t = !0 } = {}) {
	let n = _n();
	if (!n) return;
	let r = wn(e);
	if (n.style.setProperty("--graph-workspace-height", `${r}px`), t) try {
		window.localStorage.setItem(M, String(r));
	} catch {}
	mn();
}
function En() {
	try {
		let e = window.localStorage.getItem(M);
		if (e) {
			Tn(e, { persist: !1 });
			return;
		}
	} catch {}
	Tn(680, { persist: !1 });
}
function Dn() {
	if (!A.resize) return;
	let e = A.resize.handle, t = A.resize.pointerId;
	if (document.body.classList.remove("graph-workspace-resizing"), window.removeEventListener("pointermove", On), window.removeEventListener("pointerup", Dn), window.removeEventListener("pointercancel", Dn), window.removeEventListener("blur", Dn), e && typeof e.releasePointerCapture == "function" && t != null) try {
		e.hasPointerCapture && e.hasPointerCapture(t) && e.releasePointerCapture(t);
	} catch {}
	Tn(A.resize.currentHeight || A.resize.startHeight), A.resize = null;
}
function On(e) {
	if (!A.resize) return;
	let t = Number(e.clientY || 0) - A.resize.startY, n = A.resize.startHeight + t;
	A.resize.currentHeight = wn(n), Tn(A.resize.currentHeight, { persist: !1 }), pn({ preserveDetail: !0 });
}
function kn(e) {
	if (!gn()) return;
	let t = document.querySelector(".graph-canvas-scroll");
	if (!t) return;
	e.preventDefault();
	let n = e.currentTarget || document.getElementById("graph-resize-handle"), r = e.pointerId;
	if (A.resize = {
		startY: Number(e.clientY || 0),
		startHeight: Math.max(520, Math.round(t.getBoundingClientRect().height || 680)),
		currentHeight: 0,
		handle: n,
		pointerId: r
	}, n && typeof n.setPointerCapture == "function" && r != null) try {
		n.setPointerCapture(r);
	} catch {}
	document.body.classList.add("graph-workspace-resizing"), window.addEventListener("pointermove", On), window.addEventListener("pointerup", Dn), window.addEventListener("pointercancel", Dn), window.addEventListener("blur", Dn);
}
function An() {
	Tn(680);
}
function q(e, t = !1) {
	let n = document.getElementById("graph-workspace-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function jn(e) {
	return String(e || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
function Mn(e) {
	let t = String(e || "").trim(), n = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
	return n ? `${n[1]}.${n[2]}.${n[3]}.0/24` : t || "other";
}
function Nn(e) {
	let t = String(e || ""), n = 5381;
	for (let e = 0; e < t.length; e += 1) n = (n << 5) + n + t.charCodeAt(e), n &= 2147483647;
	return Math.abs(n).toString(36);
}
function Pn(e) {
	let t = String(e || "").trim().toLowerCase().split(".").filter(Boolean);
	if (t.length <= 2) return t.join(".") || "";
	let n = t.slice(-2).join(".");
	return [
		"co.uk",
		"com.au",
		"co.jp"
	].includes(n) && t.length >= 3 ? t.slice(-3).join(".") : t.slice(-2).join(".");
}
function Fn(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	try {
		return new URL(t).host || "";
	} catch {
		let e = t.match(/^[a-z]+:\/\/([^/?#]+)/i);
		return e ? String(e[1] || "").trim() : "";
	}
}
function J(e, t) {
	return !e || typeof e != "object" ? "" : (e.properties && typeof e.properties == "object" ? e.properties : {})[t];
}
function In(e) {
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
function Ln(e) {
	let t = String(e?.last_seen || "").trim(), n = String(e?.first_seen || "").trim();
	return t || n || "";
}
function Rn(e) {
	let t = {
		"24h": 24,
		"7d": 168,
		"30d": 720,
		"90d": 2160
	}[String(e || "all").trim().toLowerCase()];
	return t ? Date.now() - t * 60 * 60 * 1e3 : 0;
}
function zn(e, t) {
	if (!t) return !0;
	let n = Date.parse(Ln(e));
	return !Number.isFinite(n) || n >= t;
}
function Bn(e, t) {
	let n = String(t || "").trim().toLowerCase();
	return !n || String(J(e, "severity") || "").trim().toLowerCase() === n;
}
function Vn(e, t) {
	let n = String(t || "").trim().toLowerCase();
	return !n || In(e).some((e) => String(e || "").trim().toLowerCase() === n);
}
function Hn() {
	L("graph-min-confidence-value", V("graph-min-confidence") || "0");
}
function Un() {
	let e = Math.max(10, Math.min(400, parseInt(V("graph-zoom-slider"), 10) || A.zoomPercent || 100));
	A.zoomPercent = e, L("graph-zoom-value", `${e}%`);
}
function Wn() {
	return Se[String(V("graph-view-select") || A.viewId || "attack_surface").trim()] || Se.attack_surface;
}
function Gn(e, t, n) {
	let r = typeof e == "string" ? document.getElementById(e) : e;
	if (!r) return;
	let i = String(r.value || ""), a = Array.from(new Set((t || []).map((e) => String(e || "").trim()).filter(Boolean))).sort();
	r.innerHTML = "";
	let o = document.createElement("option");
	o.value = "", o.textContent = n, r.appendChild(o), a.forEach((e) => {
		let t = document.createElement("option");
		t.value = e, t.textContent = jn(e), r.appendChild(t);
	}), a.includes(i) && (r.value = i);
}
function Kn() {
	let e = document.getElementById("graph-layout-select");
	if (!e) return;
	let t = String(V("graph-view-select") || A.viewId || "attack_surface").trim(), n = String(A.activeLayoutId || e.value || ""), r = (A.layouts || []).filter((e) => String(e?.view_id || "").trim() === t);
	e.innerHTML = "";
	let i = document.createElement("option");
	i.value = "", i.textContent = "auto layout", e.appendChild(i), r.forEach((t) => {
		let n = document.createElement("option");
		n.value = String(t.layout_id || ""), n.textContent = `${t.name || "layout"}${t.updated_at ? ` (${t.updated_at})` : ""}`, e.appendChild(n);
	}), e.value = r.some((e) => String(e.layout_id || "") === n) ? n : "";
}
function qn() {
	let e = document.getElementById("graph-host-filter");
	if (!e) return;
	let t = String(e.value || "");
	e.innerHTML = "";
	let n = document.createElement("option");
	n.value = "", n.textContent = "all hosts", e.appendChild(n), (k.hosts || []).forEach((t) => {
		let n = document.createElement("option");
		n.value = String(t.id || ""), n.textContent = `${t.ip || ""}${t.hostname ? ` (${t.hostname})` : ""}`, e.appendChild(n);
	}), (k.hosts || []).some((e) => String(e.id || "") === t) && (e.value = t);
}
function Jn() {
	let e = A.data || {}, t = Array.isArray(e.nodes) ? e.nodes : [], n = Array.isArray(e.edges) ? e.edges : [];
	Gn("graph-node-type-filter", t.map((e) => String(e?.type || "").trim().toLowerCase()), "all node types"), Gn("graph-edge-type-filter", n.map((e) => String(e?.type || "").trim().toLowerCase()), "all edge types"), Gn("graph-source-kind-filter", t.concat(n).map((e) => String(e?.source_kind || "").trim().toLowerCase()), "all provenance"), Gn("graph-severity-filter", t.concat(n).map((e) => String(J(e, "severity") || "").trim().toLowerCase()), "all severities"), Gn("graph-pack-filter", t.concat(n).flatMap((e) => In(e).map((e) => String(e || "").trim().toLowerCase())), "all packs");
}
function Yn(e) {
	return Te[String(e?.type || "").trim().toLowerCase()] || "#b4bbdd";
}
function Xn(e) {
	return we[String(e?.source_kind || "observed").trim().toLowerCase()] || we.observed;
}
function Zn() {
	return !!window.LEGION_OPAQUE_UI_ENABLED || !!document.body?.classList.contains("opaque-ui");
}
function Qn(e) {
	let t = Xn(e);
	return String(t?.edgeStroke || t?.stroke || "#687691");
}
function $n(e) {
	let t = Xn(e);
	return Zn() ? String(t?.fillOpaque || "#18182a") : String(t?.fill || "#18182a");
}
function er(e) {
	let t = String(e || "").trim().split(/\s+/).filter(Boolean);
	if (!t.length) return ["unknown"];
	let n = [], r = "";
	return t.forEach((e) => {
		let t = r ? `${r} ${e}` : e;
		t.length <= 18 || !r ? r = t : (n.push(r), r = e);
	}), r && n.push(r), n.slice(0, 2);
}
function tr(e, t = {}, n = "") {
	let r = document.createElementNS("http://www.w3.org/2000/svg", e);
	return Object.entries(t).forEach(([e, t]) => {
		t != null && t !== "" && r.setAttribute(e, String(t));
	}), n && (r.textContent = n), r;
}
function nr(e, t) {
	let n = e.getBoundingClientRect(), r = e.viewBox.baseVal, i = n.width > 0 ? r.width / n.width : 1, a = n.height > 0 ? r.height / n.height : 1;
	return {
		x: r.x + (t.clientX - n.left) * i,
		y: r.y + (t.clientY - n.top) * a
	};
}
// ../app/web/static/js/workspace/host_scope.js
function rr(e) {
	let t = parseInt(e, 10);
	if (!Number.isFinite(t) || t <= 0) return "";
	let n = (k.hosts || []).find((e) => String(e?.id || "") === String(t));
	return n ? String(n.hostname || n.ip || `host ${n.id || t}`).trim() : "";
}
function ir(e, t = "") {
	let n = parseInt(e, 10), r = Number.isFinite(n) && n > 0 ? n : 0, i = r ? String(t || rr(r) || `host ${r}`).trim() : "", a = parseInt(k.servicesHostFilterId, 10), o = String(k.servicesHostFilterLabel || "").trim();
	return k.servicesHostFilterId = r, k.servicesHostFilterLabel = i, String(a || 0) !== String(r || 0) || o !== i;
}
// ../app/web/static/js/workspace/host_filters.js
var ar, or, sr, cr, lr, ur, dr;
function fr(e) {
	for (let t of [
		"closeRibbonMenus",
		"graphLoadSnapshot",
		"loadHostDetail",
		"loadWorkspaceHosts",
		"loadWorkspaceServices",
		"renderHosts",
		"renderServices"
	]) if (typeof e[t] != "function") throw TypeError(`Missing host_filters callback: ${t}`);
	({closeRibbonMenus: ar, graphLoadSnapshot: or, loadHostDetail: sr, loadWorkspaceHosts: cr, loadWorkspaceServices: lr, renderHosts: ur, renderServices: dr} = e);
}
function pr(e) {
	if (!Array.isArray(e)) return [];
	let t = /* @__PURE__ */ new Set(), n = [];
	return e.forEach((e) => {
		let r = String(typeof e == "string" ? e : e?.name || "").trim();
		if (!r) return;
		let i = r.toLowerCase();
		t.has(i) || (t.add(i), n.push(r));
	}), n;
}
function mr(e) {
	let t = Array.isArray(e) ? e : String(e || "").split(","), n = /* @__PURE__ */ new Set(), r = [];
	return t.forEach((e) => {
		let t = String(e || "").trim(), i = t.toLowerCase();
		t && !n.has(i) && (n.add(i), r.push(t));
	}), r;
}
function hr() {
	let e = mr(k.hostServiceFilters || []);
	return e.length ? e : mr(k.hostServiceFilter || "");
}
function gr() {
	return hr().join(", ");
}
function _r(e, t, n = "No categories") {
	let r = typeof e == "string" ? document.getElementById(e) : e;
	if (!r) return;
	let i = pr(t);
	if (r.innerHTML = "", !i.length) {
		let e = document.createElement("span");
		e.className = "category-chip category-chip-empty", e.textContent = n, r.appendChild(e);
	} else i.forEach((e) => {
		let t = document.createElement("span");
		t.className = "category-chip", t.textContent = e, r.appendChild(t);
	});
}
function vr(e) {
	let t = document.createElement("td");
	return t.className = "category-cell", _r(t, e, "Uncategorized"), t.title = pr(e).join(", "), t;
}
function yr() {
	let e = /* @__PURE__ */ new Set(), t = [];
	return (k.hosts || []).forEach((n) => {
		pr(n?.categories || []).forEach((n) => {
			let r = n.toLowerCase();
			e.has(r) || (e.add(r), t.push(n));
		});
	}), t.sort((e, t) => e.localeCompare(t)), t;
}
function br() {
	let e = yr();
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
function xr() {
	let e = /* @__PURE__ */ new Map(), t = (t, n = 0) => {
		let r = String(t || "").trim(), i = r.toLowerCase();
		if (!r) return;
		let a = Number(n || 0);
		e.get(i) || e.set(i, {
			service: r,
			host_count: Number.isFinite(a) ? a : 0
		});
	}, n = /* @__PURE__ */ new Map();
	(k.hosts || []).forEach((e) => {
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
	}), (k.services || []).forEach((e) => {
		t(e?.service || "", e?.host_count || 0);
	}), hr().forEach((e) => t(e, 0));
	let r = Array.from(e.values());
	return r.sort((e, t) => e.service.localeCompare(t.service)), r;
}
function Sr() {
	let e = document.getElementById("hosts-service-filter-list"), t = document.getElementById("hosts-service-filter-button"), n = document.getElementById("hosts-service-filter-clear-button"), r = hr(), i = new Set(r.map((e) => e.toLowerCase())), a = gr();
	if (t && (t.textContent = r.length ? `Services (${r.length})` : "Services", t.classList.toggle("is-active", r.length > 0), t.title = r.length ? `Host service filters: ${a}` : "Filter hosts by open service", t.setAttribute("aria-label", t.title)), n && (n.disabled = r.length === 0), !e) return;
	let o = xr();
	if (e.innerHTML = "", !o.length) {
		let t = document.createElement("p");
		t.className = "meta-note", t.textContent = "No open services available.", e.appendChild(t);
	} else o.forEach((t) => {
		let n = document.createElement("label");
		n.className = "panel-filter-option";
		let r = document.createElement("input");
		r.type = "checkbox", r.value = t.service, r.checked = i.has(String(t.service || "").toLowerCase()), r.addEventListener("change", async () => {
			let e = hr(), n = String(t.service || "").trim().toLowerCase(), i = e.some((e) => e.toLowerCase() === n);
			await Ar(r.checked && !i ? e.concat([t.service]) : e.filter((e) => e.toLowerCase() !== n));
		});
		let a = document.createElement("span");
		a.className = "panel-filter-option-name", a.textContent = t.service, n.appendChild(r), n.appendChild(a);
		let o = document.createElement("span"), s = Number(t.host_count || 0);
		o.className = "panel-filter-option-count", o.textContent = String(Number.isFinite(s) ? s : 0), n.appendChild(o), e.appendChild(n);
	});
}
function Cr(e) {
	let t = document.getElementById("hosts-service-filter-popover"), n = document.getElementById("hosts-service-filter-button"), r = !!e;
	t && (t.hidden = !r), n && n.setAttribute("aria-expanded", r ? "true" : "false"), r && Sr();
}
function wr() {
	let e = new URLSearchParams(), t = String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down";
	e.set("filter", t), hr().forEach((t) => {
		e.append("service", t);
	});
	let n = String(k.hostCategoryFilter || "").trim();
	return n && e.set("category", n), e.toString();
}
function Tr() {
	let e = new URLSearchParams(), t = parseInt(k.servicesHostFilterId, 10);
	Number.isFinite(t) && t > 0 && e.set("host_id", String(t));
	let n = String(k.servicesCategoryFilter || "").trim();
	return n && e.set("category", n), e.toString();
}
function Er() {
	let e = document.getElementById("hosts-filter-show-all-button"), t = document.getElementById("hosts-filter-hide-down-button"), n = document.getElementById("hosts-reset-filter-button"), r = String(k.hostFilter || "hide_down").trim().toLowerCase(), i = gr(), a = String(k.hostCategoryFilter || "").trim(), o = String(k.servicesCategoryFilter || "").trim();
	R("hosts-category-filter-select", a), R("services-category-filter-select", o);
	let s = parseInt(k.servicesHostFilterId, 10), c = String(k.servicesHostFilterLabel || "").trim();
	if (e && e.classList.toggle("is-active", r === "show_all"), t && t.classList.toggle("is-active", r !== "show_all"), n) {
		let e = r === "hide_down" && !i && !a && (!Number.isFinite(s) || s <= 0);
		n.disabled = e, n.classList.toggle("is-active", !e);
		let t = "Reset host filters (show only up hosts)";
		i && a && c ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear category filter: ${a}, clear services filter: ${c})` : i && c ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear services filter: ${c})` : i && a ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear category filter: ${a})` : i ? t = `Reset host filters (show only up hosts, clear service filter: ${i})` : a ? t = `Reset host filters (show only up hosts, clear category filter: ${a})` : c && (t = `Reset host filters (show only up hosts, clear services filter: ${c})`), n.setAttribute("title", t), n.setAttribute("aria-label", t);
	}
}
async function Dr(e) {
	k.hostFilter = String(e || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down", Er(), ar(), await cr(), await or({ background: !1 }).catch(() => {});
}
async function Or(e) {
	k.hostCategoryFilter = String(e || "").trim(), Er(), ur(k.hosts), await Promise.all([cr(), lr()]), await or({ background: !1 }).catch(() => {});
}
async function kr(e) {
	let t = String(e || "").trim(), n = hr(), r = n.map((e) => e.toLowerCase());
	t && n.length === 1 && r[0] === t.toLowerCase() ? await Ar([]) : await Ar(t ? [t] : []);
}
async function Ar(e) {
	k.hostServiceFilters = mr(e), k.hostServiceFilter = k.hostServiceFilters.join(","), Er(), Sr(), ur(k.hosts), dr(k.services), await Promise.all([cr(), lr()]), await or({ background: !1 }).catch(() => {});
}
async function jr(e) {
	k.servicesCategoryFilter = String(e || "").trim(), Er(), dr(k.services), await lr();
}
async function Mr(e, t = "") {
	let n = parseInt(e, 10), r = parseInt(k.servicesHostFilterId, 10);
	Number.isFinite(n) && n > 0 && n === r ? ir(0) : Number.isFinite(n) && n > 0 ? (k.selectedHostId = n, ir(n, t)) : ir(0), Er(), ur(k.hosts), await Promise.all([k.selectedHostId ? sr(k.selectedHostId) : Promise.resolve(), lr()]);
}
async function Nr() {
	k.hostFilter = "hide_down", k.hostServiceFilter = "", k.hostServiceFilters = [], k.hostCategoryFilter = "", k.servicesHostFilterId = 0, k.servicesHostFilterLabel = "", k.servicesCategoryFilter = "", Er(), ur(k.hosts), dr(k.services), ar(), await Promise.all([cr(), lr()]), await or({ background: !1 }).catch(() => {});
}
// ../app/web/static/js/workspace/host_detail.js
function Pr(e) {
	k.hostDetail = e || null;
	let t = e?.host || {}, n = e?.ports || [], r = e?.screenshots || [], i = e?.ai_analysis || {}, a = e?.target_state || {}, o = Array.isArray(i?.technologies) ? i.technologies : [], s = Array.isArray(i?.manual_tests) ? i.manual_tests : [], c = i?.host_updates || {}, l = Array.isArray(a?.attempted_actions) ? a.attempted_actions : [], u = Array.isArray(a?.coverage_gaps) ? a.coverage_gaps : [], d = Array.isArray(a?.urls) ? a.urls : [], f = Array.isArray(a?.credentials) ? a.credentials : [], p = Array.isArray(a?.sessions) ? a.sessions : [], m = Array.isArray(a?.device_categories) ? a.device_categories : [], h = Array.isArray(a?.manual_device_categories) ? a.manual_device_categories : [], g = !!a?.device_category_override;
	L("host-detail-name", t.ip ? `${t.ip} (${t.hostname || "no-hostname"})` : ""), R("workspace-note", e?.note || ""), R("workspace-tool-host-ip", t.ip || ""), R("workspace-host-categories", pr(h).join(", ")), z("workspace-host-categories-override", g);
	let _ = document.getElementById("host-detail-ports");
	if (_) {
		_.innerHTML = "";
		let e = /* @__PURE__ */ new Map();
		r.forEach((t) => {
			let n = String(t?.port || "");
			n && (e.has(n) || e.set(n, []), e.get(n).push(t));
		}), n.forEach((t) => {
			let n = document.createElement("tr");
			n.appendChild(H(t.port || "")), n.appendChild(H(t.protocol || "")), n.appendChild(H(t.state || "")), n.appendChild(H(t.service?.name || "")), n.appendChild(H(`${t.service?.product || ""} ${t.service?.version || ""}`.trim())), n.appendChild(H(et(t)));
			let r = document.createElement("td"), i = e.get(String(t.port || "")) || [];
			if (i.length > 0) {
				let e = i[0], n = document.createElement("button");
				if (n.type = "button", n.className = "host-screenshot-trigger", n.textContent = String(e.filename || "screenshot.png"), n.dataset.screenshotUrl = String(e.url || ""), n.dataset.screenshotName = String(e.filename || ""), n.dataset.screenshotPort = String(e.port || t.port || ""), r.appendChild(n), i.length > 1) {
					let e = document.createElement("span");
					e.className = "text-muted", e.textContent = ` (+${i.length - 1})`, r.appendChild(e);
				}
			}
			n.appendChild(r), _.appendChild(n);
		});
	}
	let v = document.getElementById("host-detail-scripts");
	v && (v.innerHTML = "", n.forEach((e) => {
		(e.scripts || []).forEach((e) => {
			let t = document.createElement("tr");
			t.appendChild(H(e.id || "")), t.appendChild(H(e.script_id || "")), t.appendChild(H(e.display_output || (e.output || "").slice(0, 140)));
			let n = document.createElement("td"), r = document.createElement("button");
			r.type = "button", r.textContent = "View", r.dataset.scriptViewId = String(e.id || ""), n.appendChild(r);
			let i = document.createElement("button");
			i.type = "button", i.textContent = "Delete", i.dataset.scriptDeleteId = String(e.id || ""), n.appendChild(i), t.appendChild(n), v.appendChild(t);
		});
	}));
	let y = document.getElementById("host-detail-ai-technologies");
	y && (y.innerHTML = "", o.forEach((e) => {
		let t = document.createElement("tr");
		t.appendChild(H(e.name || "")), t.appendChild(H(e.version || "")), t.appendChild(H(e.cpe || "")), t.appendChild(H(e.evidence || "")), y.appendChild(t);
	}));
	let b = document.getElementById("host-detail-ai-manual-tests");
	b && (b.innerHTML = "", s.forEach((e) => {
		let t = document.createElement("tr");
		t.appendChild(H(e.why || "")), t.appendChild(H(e.command || "")), t.appendChild(H(e.scope_note || "")), b.appendChild(t);
	}));
	let x = [];
	i?.provider && x.push(`provider: ${i.provider}`), i?.updated_at && x.push(`updated: ${i.updated_at}`), i?.next_phase && x.push(`next phase: ${i.next_phase}`), c?.hostname && x.push(`hostname: ${c.hostname}`), c?.os && x.push(`os: ${c.os}`), l.length > 0 && x.push(`attempted: ${l.length}`), u.length > 0 && x.push(`coverage gaps: ${u.length}`), d.length > 0 && x.push(`urls: ${d.length}`), f.length > 0 && x.push(`credentials: ${f.length}`), p.length > 0 && x.push(`sessions: ${p.length}`), L("host-ai-analysis-status", x.join(" | ")), L("host-ai-tech-count", o.length), L("host-ai-manual-count", s.length), _r("host-detail-categories", m, "Uncategorized"), L("host-device-category-count", pr(m).length), g ? L("host-detail-category-note", "Manual categories replace automatic classification for this host.") : pr(h).length > 0 ? L("host-detail-category-note", "Manual categories are additive for this host.") : L("host-detail-category-note", "");
	let S = document.getElementById("host-detail-screenshots");
	S && (S.innerHTML = "", r.forEach((e) => {
		let t = document.createElement("a");
		t.href = e.url || "#", t.target = "_blank", t.rel = "noopener noreferrer", t.textContent = `${e.filename || "screenshot"} ${e.port ? `(${e.port})` : ""}`, S.appendChild(t);
	})), L("host-screenshot-count", r.length);
}
// ../app/web/static/js/workspace/invalidation_waiters.js
function Fr(e, t = 5e3) {
	let n = new Set((e || []).map((e) => String(e || "").trim()).filter(Boolean));
	return n.size ? new Promise((e, r) => {
		let i = {
			channels: n,
			resolve: e,
			timeoutId: 0
		};
		i.timeoutId = window.setTimeout(() => {
			let e = ye.indexOf(i);
			e >= 0 && ye.splice(e, 1), r(/* @__PURE__ */ Error("Timed out waiting for workspace update."));
		}, Math.max(1, Number(t) || 1)), ye.push(i);
	}) : Promise.resolve([]);
}
function Ir(e) {
	let t = new Set((e || []).map((e) => String(e || "").trim()).filter(Boolean));
	if (t.size && ye.length) for (let e = ye.length - 1; e >= 0; --e) {
		let n = ye[e];
		if (Array.from(n.channels || []).some((e) => t.has(e))) {
			ye.splice(e, 1), n.timeoutId && window.clearTimeout(n.timeoutId);
			try {
				n.resolve(Array.from(t));
			} catch {}
		}
	}
}
// ../app/web/static/js/workspace/tool_api.js
async function Lr({ service: e = "", port: t = "", protocol: n = "tcp", limit: r = 500, offset: i = 0 } = {}) {
	let a = new URLSearchParams();
	return a.set("limit", String(r)), a.set("offset", String(i)), e && a.set("service", String(e)), t && a.set("port", String(t)), n && a.set("protocol", String(n)), Ke(`/api/workspace/tools?${a.toString()}`);
}
async function Rr({ service: e = "", port: t = "", protocol: n = "tcp" } = {}) {
	let r = [], i = 0, a = 0;
	for (; a < 200;) {
		let o = await Lr({
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
var zr, Br, Vr, Hr;
function Ur(e) {
	for (let t of [
		"graphLoadSnapshot",
		"renderHosts",
		"renderServices",
		"renderTools"
	]) if (typeof e[t] != "function") throw TypeError(`Missing workspace_data callback: ${t}`);
	({graphLoadSnapshot: zr, renderHosts: Br, renderServices: Vr, renderTools: Hr} = e);
}
function Wr(e) {
	return new Promise((t) => {
		window.setTimeout(t, Math.max(0, Number(e) || 0));
	});
}
async function Gr(e, t = 12e4, n = 1200) {
	let r = Number(e);
	if (!Number.isFinite(r) || r <= 0) throw Error("Invalid job id.");
	let i = Date.now();
	for (; Date.now() - i < t;) {
		let e = await Ke(`/api/jobs/${r}`), a = String(e.status || "").toLowerCase();
		if (a === "completed") return e;
		if (a === "failed") throw Error(String(e.error || "Save job failed."));
		if (window.LEGION_WS_ENABLED) {
			let e = t - (Date.now() - i);
			if (e <= 0) break;
			try {
				await Fr(["jobs"], Math.min(Math.max(e, 1), 3e4));
			} catch {
				await Wr(n);
			}
		} else await Wr(n);
	}
	throw Error("Timed out waiting for job completion.");
}
async function Kr() {
	let e = wr(), t = Tr(), n = await Ke(`/api/workspace/hosts?${e}`);
	if (e !== wr()) return;
	n && n.filter && (k.hostFilter = String(n.filter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down"), Er(), Vr(k.services), Br(n.hosts || []);
	let r = parseInt(k.servicesHostFilterId, 10), i = (Array.isArray(n.hosts) ? n.hosts : []).some((e) => String(e?.id || "") === String(r || ""));
	Number.isFinite(r) && r > 0 && !i && (ir(k.selectedHostId), Er(), Br(k.hosts)), t !== Tr() && await qr();
}
async function qr() {
	let e = Tr(), t = await Ke(`/api/workspace/services${e ? `?${e}` : ""}`);
	if (e !== Tr()) return;
	let n = parseInt(t?.host_id, 10);
	(!Number.isFinite(n) || n <= 0) && (k.servicesHostFilterId = 0, k.servicesHostFilterLabel = ""), k.servicesCategoryFilter = String(t?.category || "").trim(), Er(), Vr(t.services || []);
}
async function Jr({ service: e = "", force: t = !1 } = {}) {
	if (!k.toolsLoading || t) {
		k.toolsLoading = !0;
		try {
			let t = await Rr({ service: e });
			k.toolsHydrated = !0, Hr(t);
		} finally {
			k.toolsLoading = !1;
		}
	}
}
async function Yr(e) {
	e && Pr(await Ke(`/api/workspace/hosts/${e}`));
}
async function Xr() {
	W("Refreshing workspace...");
	try {
		await Promise.all([
			Kr(),
			qr(),
			Jr()
		]), k.selectedHostId && await Yr(k.selectedHostId);
		try {
			await zr({ background: !0 });
		} catch {}
		W("Workspace refreshed");
	} catch (e) {
		W(`Workspace refresh failed: ${e.message}`, !0);
	}
}
async function Zr() {
	let e = k.selectedHostId;
	if (!e) {
		W("No host selected", !0);
		return;
	}
	let t = V("workspace-note");
	try {
		await G(`/api/workspace/hosts/${e}/note`, { text: t }), W("Note saved");
	} catch (e) {
		W(`Save note failed: ${e.message}`, !0);
	}
}
function Qr(e) {
	return Array.from(new Set(String(e || "").split(",").map((e) => String(e || "").trim()).filter(Boolean)));
}
async function $r() {
	let e = k.selectedHostId;
	if (!e) W("No host selected", !0);
	else try {
		await G(`/api/workspace/hosts/${e}/categories`, {
			manual_categories: Qr(V("workspace-host-categories")),
			override_auto: B("workspace-host-categories-override")
		}), W("Categories saved"), await Promise.all([
			Kr(),
			qr(),
			Yr(e)
		]), await zr({ background: !1 }).catch(() => {});
	} catch (e) {
		W(`Save categories failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/device_categories.js
var ei;
function ti(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing device_categories callback: ${t}`);
	({applySchedulerPreferences: ei} = e);
}
function ni(e, t = !1) {
	let n = document.getElementById("device-category-save-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function ri(e = {}) {
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
			e && e.appendChild(ri({}));
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
function ii() {
	_r("device-category-builtins-list", (k.builtInDeviceCategories || []).map((e) => e?.name || ""), "No built-in categories");
	let e = document.getElementById("device-category-rules-body");
	if (!e) return;
	e.innerHTML = "";
	let t = Array.isArray(k.deviceCategoryRules) ? k.deviceCategoryRules : [];
	t.length ? t.forEach((t) => {
		e.appendChild(ri(t));
	}) : e.appendChild(ri({}));
}
function ai() {
	return Array.from(document.querySelectorAll("#device-category-rules-body tr")).map((e) => {
		let t = (t) => {
			let n = e.querySelector(`[data-device-category-field="${t}"]`);
			return n ? String(n.value || "").trim() : "";
		};
		return {
			name: t("name"),
			ports: Qr(t("ports")),
			fingerprint_fragments: Qr(t("fingerprint_fragments")),
			cpe: Qr(t("cpe"))
		};
	}).filter((e) => e.name);
}
async function oi() {
	ni("Saving...");
	try {
		let e = await G("/api/scheduler/preferences", { device_categories: ai() });
		ei(e), ni("Saved");
	} catch (e) {
		ni(`Save failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/engagement_policy.js
function si(e) {
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
function ci(e, t) {
	let n = li(t), r = e && typeof e == "object" ? e : {}, i = si(r.preset || n);
	return {
		...i,
		...r,
		custom_overrides: r.custom_overrides && typeof r.custom_overrides == "object" ? r.custom_overrides : {},
		legacy_goal_profile: r.legacy_goal_profile || ui({
			...i,
			...r
		})
	};
}
function li(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "external_pentest" ? "external_pentest" : t === "internal_pentest" ? "internal_pentest" : t === "external_recon" ? "external_recon" : "internal_recon";
}
function ui(e) {
	let t = String(e?.preset || "").trim().toLowerCase();
	return t === "external_recon" || t === "external_pentest" ? "external_pentest" : "internal_asset_discovery";
}
function di(e, t) {
	return t ? "Custom lets you override scope and intent manually. Use the standard presets unless you need a non-standard combination." : {
		external_recon: "Low-noise external mapping focused on discovery, fingerprinting, and bounded validation.",
		external_pentest: "Broader external follow-up once recon shows a target is worth deeper assessment.",
		internal_quick_recon: "Fast internal low-hanging-fruit sweep focused on SMB, NetBIOS, NFS, printers, common admin panels, and other obvious exposure points.",
		internal_recon: "Broader internal discovery and validation across exposed services without moving into pentest depth.",
		internal_pentest: "Deeper internal assessment with wider follow-up and higher-noise exploration."
	}[String(e || "").trim().toLowerCase()] || "Preset drives scope and intent for most runs. Switch to custom only if you need a manual override.";
}
// ../app/web/static/js/workspace/scan_policy.js
var fi, pi, mi, hi, gi;
function _i(e) {
	for (let t of [
		"applyNmapModeTargetDefaults",
		"refreshNmapModeOptions",
		"refreshNmapScanButtonState",
		"setNmapWizardStep",
		"updateNmapCommandPreview"
	]) if (typeof e[t] != "function") throw TypeError(`Missing scan_policy callback: ${t}`);
	({applyNmapModeTargetDefaults: fi, refreshNmapModeOptions: pi, refreshNmapScanButtonState: mi, setNmapWizardStep: hi, updateNmapCommandPreview: gi} = e);
}
function vi() {
	return String(V("scheduler-goal-select") || "internal_recon").trim().toLowerCase();
}
function yi() {
	return String(V("nmap-engagement-preset-select") || "").trim().toLowerCase() || vi();
}
function bi(e = "") {
	return String(e || "").trim().toLowerCase() === "internal_quick_recon";
}
function xi(e = "") {
	let t = Ci(e, { fallbackGoalProfile: V("scheduler-goal-select") || "internal_recon" });
	return String(t.scope || "").trim().toLowerCase() === "internal";
}
function Si() {
	let e = parseInt(V("passive-capture-duration"), 10);
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
function Ci(e, t = {}) {
	let n = String(e || "internal_recon").trim().toLowerCase();
	if (n !== "custom") return ci(si(n), n);
	let r = String(t.fallbackGoalProfile || V("scheduler-goal-select") || "internal_recon");
	return ci({
		preset: "custom",
		scope: V("engagement-scope-select") || "internal",
		intent: V("engagement-intent-select") || "recon",
		allow_exploitation: B("engagement-allow-exploitation"),
		allow_lateral_movement: B("engagement-allow-lateral"),
		credential_attack_mode: V("engagement-credential-mode"),
		lockout_risk_mode: V("engagement-lockout-mode"),
		stability_risk_mode: V("engagement-stability-mode"),
		detection_risk_mode: V("engagement-detection-mode"),
		approval_mode: V("engagement-approval-mode"),
		runner_preference: V("engagement-runner-preference"),
		noise_budget: V("engagement-noise-budget"),
		custom_overrides: {}
	}, r);
}
function wi() {
	let e = yi(), t = e === "custom", n = Ci(e, { fallbackGoalProfile: V("scheduler-goal-select") || "internal_recon" });
	L("nmap-engagement-derived-scope", n.scope || "internal"), L("nmap-engagement-derived-intent", n.intent || "recon");
	let r = document.getElementById("nmap-engagement-preset-summary");
	r && (r.textContent = di(e, t));
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
function Ti(e = {}) {
	let t = document.getElementById("passive-capture-interface"), n = document.getElementById("passive-capture-interface-note");
	if (!t) return;
	let r = Array.isArray(e.interfaces) ? e.interfaces : [], i = String(e.default_interface || "").trim(), a = String(t.value || "").trim();
	if (t.innerHTML = "", !r.length) {
		let e = document.createElement("option");
		e.value = "", e.textContent = "No capture-ready interfaces found", t.appendChild(e), t.value = "", n && (n.textContent = "Passive capture needs an active non-loopback IPv4 interface."), gi();
	} else {
		if (r.forEach((e) => {
			let n = document.createElement("option");
			n.value = String(e.name || "").trim(), n.textContent = String(e.label || e.name || "").trim(), n.dataset.networks = Array.isArray(e.ipv4_networks) ? e.ipv4_networks.join(", ") : "", t.appendChild(n);
		}), t.value = a && r.some((e) => String(e.name || "").trim() === a) ? a : i && r.some((e) => String(e.name || "").trim() === i) ? i : String(r[0].name || "").trim(), n) {
			let e = t.options[t.selectedIndex], r = String(e?.dataset?.networks || "").trim();
			n.textContent = r ? `Connected networks: ${r}` : "Passive capture will watch discovery traffic on the selected interface.";
		}
		gi();
	}
}
async function Ei() {
	if (document.getElementById("passive-capture-interface")) try {
		let e = await Ke("/api/network/interfaces");
		Me.captureInterfacesLoaded = !0, Ti(e || {});
	} catch {
		Me.captureInterfacesLoaded = !1, Ti({
			interfaces: [],
			default_interface: ""
		});
	}
}
function Di({ scrollIntoView: e = !1, focusPreset: t = !1, focusTargets: n = !1 } = {}) {
	let r = document.getElementById("nmap-scan-block");
	e && r && r.scrollIntoView({
		behavior: "smooth",
		block: "start"
	}), Me.postSubmitLock = !0, Me.lastMode = "", Me.lastEngagementPreset = "", Me.captureInterfacesLoaded = !1, R("nmap-targets", ""), z("nmap-run-actions", !0), R("passive-capture-duration", "15"), Ti({
		interfaces: [],
		default_interface: ""
	});
	let i = document.querySelector("input[name='nmap-scan-mode'][value='easy']");
	i && (i.checked = !0), R("nmap-engagement-preset-select", V("scheduler-goal-select") || "internal_recon"), wi(), fi("easy"), hi(1), pi(), mi(), Ei().catch(() => {});
	let a = t ? "nmap-engagement-preset-select" : n ? "nmap-targets" : "";
	if (a) {
		let e = document.getElementById(a);
		e && window.setTimeout(() => {
			e.focus();
		}, 220);
	}
}
// ../app/web/static/js/workspace/dialogs.js
var Oi, ki;
function Ai(e) {
	for (let t of ["openManualToolPicker", "pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing dialogs callback: ${t}`);
	({openManualToolPicker: Oi, pollSnapshot: ki} = e);
}
function ji(e) {
	let t = document.getElementById("nmap-scan-modal");
	t && (I.nmapScanOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Mi(e) {
	let t = document.getElementById("manual-scan-modal");
	t && (I.manualScanOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Ni(e) {
	let t = document.getElementById("host-selection-modal");
	t && (I.hostSelectionOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Pi(e) {
	let t = document.getElementById("script-cve-modal");
	t && (I.scriptCveOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Fi(e) {
	let t = document.getElementById("provider-logs-modal");
	t && (I.providerLogsOpen = !!e, ke.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Ii(e) {
	let t = document.getElementById("jobs-modal");
	t && (I.jobsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Li(e) {
	let t = document.getElementById("submitted-scans-modal");
	t && (I.submittedScansOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Ri(e) {
	let t = document.getElementById("scheduler-decisions-modal");
	t && (I.schedulerDecisionsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function zi(e) {
	let t = document.getElementById("host-remove-modal");
	t && (I.hostRemoveOpen = !!e, je.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Bi(e) {
	let t = document.getElementById("graph-note-modal");
	t && (I.graphNoteOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re(), e && window.requestAnimationFrame(() => {
		let e = document.getElementById("graph-note-input");
		e && (e.focus(), e.setSelectionRange(e.value.length, e.value.length));
	}));
}
function Vi() {
	ji(!1);
}
function Hi() {
	k.manualToolTargets = [];
	let e = document.getElementById("workspace-tool-target-wrapper"), t = document.getElementById("workspace-tool-target-select");
	e && (e.hidden = !0), t && (t.innerHTML = ""), L("workspace-tool-context", ""), Mi(!1);
}
function Ui() {
	Mi(!1);
}
function Wi() {
	Ni(!1);
}
function Gi() {
	Pi(!1);
}
function Ki() {
	Fi(!1);
}
function qi() {
	Ii(!1);
}
function Ji() {
	Li(!1);
}
function Yi() {
	Ri(!1);
}
function Y(e = !0) {
	zi(!1), e && (je.hostId = null, je.hostIp = "", je.hostName = "", L("host-remove-modal-target", ""));
}
function Xi(e = !1) {
	Bi(!1), e && R("graph-note-input", "");
}
function Zi() {
	da(), ji(!0), Di({
		scrollIntoView: !1,
		focusPreset: !0
	});
}
function Qi() {
	Oi({});
}
function $i() {
	da(), Ni(!0);
}
function ea() {
	da(), Pi(!0);
}
async function ta() {
	da(), Fi(!0), await Gt();
}
async function na() {
	da(), Ii(!0), await ki();
}
async function ra() {
	da(), Li(!0), await ki();
}
async function ia() {
	da(), Ri(!0), await ki();
}
function aa(e) {
	let t = parseInt(e, 10);
	if (!t) return;
	let n = k.hosts.find((e) => parseInt(e.id, 10) === t);
	je.hostId = t, je.hostIp = String(n?.ip || ""), je.hostName = String(n?.hostname || ""), L("host-remove-modal-target", (je.hostName ? `${je.hostIp} (${je.hostName})` : je.hostIp) || `Host ID ${t}`), zi(!0);
}
function oa(e) {
	let t = document.getElementById("scheduler-settings-modal");
	t && (I.schedulerOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function sa(e) {
	let t = document.getElementById("device-category-settings-modal");
	t && (I.deviceCategorySettingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function ca(e) {
	let t = document.getElementById("report-provider-modal");
	t && (I.reportProviderOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function la(e) {
	let t = document.getElementById("app-settings-modal");
	t && (I.settingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function ua(e, t) {
	let n = t ? String(e || "").trim() : "";
	Fe.openMenuId = n || null, document.querySelectorAll(".ribbon-menu[data-ribbon-menu]").forEach((e) => {
		let t = String(e.dataset.ribbonMenu || ""), r = n && t === n;
		e.classList.toggle("is-open", !!r);
		let i = e.querySelector("[data-ribbon-menu-toggle]");
		i && i.setAttribute("aria-expanded", r ? "true" : "false");
	});
}
function da() {
	ua("", !1), Cr(!1);
}
function fa(e) {
	let t = String(e || "").trim();
	t ? ua(t, Fe.openMenuId !== t) : da();
}
function pa() {
	da(), oa(!0);
}
function ma() {
	oa(!1);
}
function ha() {
	da(), ni("Idle"), ii(), sa(!0);
}
function ga() {
	sa(!1);
}
function _a() {
	da(), ca(!0);
}
function va() {
	ca(!1);
}
// ../app/web/static/js/workspace/graph_viewport.js
function ya(e) {
	return (A.filtered.groups || []).find((t) => String(t?.key || "") === String(e || "")) || null;
}
function ba(e) {
	if (!e || J(e, "summary_kind")) return 0;
	let t = parseInt(J(e, "host_id"), 10);
	if (Number.isFinite(t) && t > 0) return t;
	let n = String(e?.label || "").trim().toLowerCase(), r = String(J(e, "hostname") || "").trim().toLowerCase(), i = String(J(e, "ip") || "").trim(), a = (k.hosts || []).find((e) => n && String(e?.hostname || "").trim().toLowerCase() === n || r && String(e?.hostname || "").trim().toLowerCase() === r || i && String(e?.ip || "").trim() === i), o = parseInt(a?.id, 10);
	return Number.isFinite(o) && o > 0 ? o : 0;
}
function xa(e) {
	let t = parseInt(k.selectedHostId, 10);
	return !Number.isFinite(t) || t <= 0 || String(e?.type || "").trim().toLowerCase() !== "host" ? !1 : ba(e) === t;
}
function Sa() {
	return Math.max(10, Math.min(400, Number(A.zoomPercent || 100)));
}
function Ca(e, t, n, r) {
	let i = Math.max(1, Number(e || 1)), a = Math.max(1, Number(t || 1)), o = Math.max(1, Number(n || 1)) / Math.max(1, Number(r || 1));
	return i / a >= o ? {
		width: i,
		height: i / o
	} : {
		width: a * o,
		height: a
	};
}
function wa(e, t, n, r, i, a) {
	let o = Math.max(1, Number(n || 1)), s = Math.max(1, Number(r || 1)), c = Math.max(1, Number(i || 1)), l = Math.max(1, Number(a || 1)), u = Number(e || 0), d = Number(t || 0);
	return u = c >= o ? o / 2 : Math.max(c / 2, Math.min(o - c / 2, u)), d = l >= s ? s / 2 : Math.max(l / 2, Math.min(s - l / 2, d)), {
		x: u,
		y: d
	};
}
function Ta(e, t) {
	let n = A.filtered, r = (n.groups || []).map((e) => ({
		x: e.x,
		y: e.y,
		width: e.width,
		height: e.height
	}));
	Object.values(n.positions || {}).forEach((e) => r.push({
		x: e.x,
		y: e.y,
		width: N.width,
		height: N.height
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
function Ea(e, t) {
	let n = document.getElementById("graph-workspace-canvas"), r = xn();
	if (!n || !r) return A.viewport = null, null;
	let i = Math.max(1, Number(r.clientWidth || r.getBoundingClientRect().width || 1)), a = Math.max(1, Number(r.clientHeight || r.getBoundingClientRect().height || 1)), o = Ta(e, t), s = Ca(o.width, o.height, i, a), c = Math.max(1, i / (s.width * 1.25), a / (s.height * 1.25));
	s.width *= c, s.height *= c;
	let l = Sa() / 100, u = Math.max(1, s.width / l), d = Math.max(1, s.height / l), f = A.viewport || {}, p = o.x + o.width / 2, m = o.y + o.height / 2, h = wa((Number.isFinite(Number(f.centerX)) ? Number(f.centerX) : p) - o.x, (Number.isFinite(Number(f.centerY)) ? Number(f.centerY) : m) - o.y, o.width, o.height, u, d);
	h.x += o.x, h.y += o.y;
	let g = h.x - u / 2, _ = h.y - d / 2;
	return A.viewport = {
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
	}, n.setAttribute("viewBox", `${g} ${_} ${u} ${d}`), n.style.width = "100%", n.style.height = `${Math.max(120, Math.round(a))}px`, A.viewport;
}
function Da() {
	return Sa() >= 55;
}
function Oa(e = {}) {
	return e.isSelected || e.isHostSelected || e.isSummaryNode ? !0 : Sa() >= 60;
}
function ka(e = {}) {
	return e.isSelected || e.isHostSelected || e.isSummaryNode ? !0 : Sa() >= 78;
}
// ../app/web/static/js/workspace/host_actions.js
var Aa;
function ja(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing host_actions callback: ${t}`);
	({pollSnapshot: Aa} = e);
}
function Ma(e = "Run supported tool") {
	let t = document.createElement("button");
	return t.type = "button", t.className = "icon-btn", t.title = e, t.setAttribute("aria-label", e), t.innerHTML = "<i class=\"fa-solid fa-screwdriver-wrench\" aria-hidden=\"true\"></i>", t;
}
function Na(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = "icon-btn", n.dataset.hostAction = String(e || ""), n.dataset.hostId = String(t || ""), e === "rescan" ? (n.title = "Rescan", n.setAttribute("aria-label", "Rescan"), n.innerHTML = "<i class=\"fa-solid fa-rotate-right\" aria-hidden=\"true\"></i>", n) : e === "refresh-screenshots" ? (n.title = "Refresh screenshots", n.setAttribute("aria-label", "Refresh screenshots"), n.innerHTML = "<i class=\"fa-solid fa-camera-retro\" aria-hidden=\"true\"></i>", n) : e === "dig-deeper" ? (n.title = "Dig Deeper", n.setAttribute("aria-label", "Dig Deeper"), n.innerHTML = "<i class=\"fa-solid fa-brain\" aria-hidden=\"true\"></i>", n) : (e === "remove" && (n.classList.add("icon-btn-danger"), n.title = "Remove host", n.setAttribute("aria-label", "Remove host"), n.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>"), n);
}
function Pa(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = "icon-btn", n.dataset.subnetAction = String(e || ""), n.dataset.subnet = String(t || ""), e === "rescan" && (n.title = "Rescan subnet", n.setAttribute("aria-label", "Rescan subnet"), n.innerHTML = "<i class=\"fa-solid fa-rotate-right\" aria-hidden=\"true\"></i>"), n;
}
function Fa(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = "icon-btn", n.dataset.screenshotAction = String(e || ""), n.dataset.hostId = String(t?.hostId || ""), n.dataset.port = String(t?.port || ""), n.dataset.protocol = String(t?.protocol || "tcp"), n.dataset.artifactRef = String(t?.artifactRef || ""), n.dataset.filename = String(t?.filename || ""), e === "refresh" ? (n.title = "Re-screenshot", n.setAttribute("aria-label", "Re-screenshot"), n.innerHTML = "<i class=\"fa-solid fa-camera-retro\" aria-hidden=\"true\"></i>", n) : (e === "delete" && (n.classList.add("icon-btn-danger"), n.title = "Delete screenshot", n.setAttribute("aria-label", "Delete screenshot"), n.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>"), n);
}
function Ia(e) {
	let t = parseInt(e, 10);
	return !Number.isFinite(t) || t <= 0 ? null : (k.hosts || []).find((e) => parseInt(e?.id, 10) === t) || null;
}
function La(e) {
	let t = String(e?.node_id || "");
	if (!t) return {
		serviceName: "",
		serviceLabel: ""
	};
	let n = Array.isArray(A.data?.edges) ? A.data.edges : [], r = Array.isArray(A.data?.nodes) ? A.data.nodes : [], i = n.find((e) => String(e?.from_node_id || "") === t && String(e?.type || "").trim().toLowerCase() === "exposes");
	if (!i) return {
		serviceName: "",
		serviceLabel: ""
	};
	let a = r.find((e) => String(e?.node_id || "") === String(i.to_node_id || ""));
	if (!a || String(a?.type || "").trim().toLowerCase() !== "service") return {
		serviceName: "",
		serviceLabel: ""
	};
	let o = String(J(a, "service") || "").trim().replace(/\?+$/, "").toLowerCase();
	return {
		serviceName: o,
		serviceLabel: String(a?.label || o || "").trim()
	};
}
function Ra(e) {
	if (!e) return null;
	let t = String(e?.type || "").trim().toLowerCase();
	if (!["port", "service"].includes(t)) return null;
	let n = ba(e), r = Ia(n), i = String(r?.ip || J(e, "ip") || "").trim(), a = String(J(e, "port") || "").trim(), o = String(J(e, "protocol") || "tcp").trim().toLowerCase() || "tcp";
	if (!n || !i || !a) return null;
	let s = "", c = "";
	if (t === "service") s = String(J(e, "service") || e.label || "").trim().replace(/\?+$/, "").toLowerCase(), c = String(e.label || s || "").trim();
	else {
		let t = La(e);
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
function za() {
	document.querySelectorAll(".graph-action-menu.is-open").forEach((e) => {
		e.classList.remove("is-open");
		let t = e.querySelector(".panel-menu-button");
		t && t.setAttribute("aria-expanded", "false");
	});
}
async function Ba(e, { port: t = "", protocol: n = "tcp" } = {}) {
	let r = String(e || "").trim().toLowerCase(), i = String(t || "").trim(), a = String(n || "tcp").trim().toLowerCase() || "tcp", o = [
		r || "__all__",
		i || "__any_port__",
		a || "tcp"
	].join("|");
	if (Array.isArray(A.toolMenuCache[o])) return A.toolMenuCache[o];
	let s = new URLSearchParams();
	s.set("limit", "500"), r && s.set("service", r), i && s.set("port", i), a && s.set("protocol", a);
	let c = await Ke(`/api/workspace/tools?${s.toString()}`), l = Array.isArray(c?.tools) ? c.tools.filter((e) => !!e?.runnable) : [];
	return A.toolMenuCache[o] = l, l;
}
async function Va(e, t) {
	if (e && t?.tool_id) try {
		let n = await G("/api/workspace/tools/run", {
			host_ip: e.hostIp,
			port: e.port,
			protocol: e.protocol,
			tool_id: String(t.tool_id || "")
		});
		W(`${t.label || t.tool_id} queued for ${e.hostIp}:${e.port}/${e.protocol} (job ${n?.job?.id || "?"})`), await Aa();
	} catch (e) {
		W(`Tool launch failed: ${e.message}`, !0);
	}
}
function Ha(e) {
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
		if (za(), !s || (t.classList.add("is-open"), n.setAttribute("aria-expanded", "true"), a)) return;
		r.innerHTML = "";
		let c = document.createElement("div");
		c.className = "graph-action-menu-status", c.textContent = "Loading actions...", r.appendChild(c);
		try {
			let t = await Ba(i, {
				port: e?.port || "",
				protocol: e?.protocol || "tcp"
			});
			if (r.innerHTML = "", t.length) t.forEach((t) => {
				let n = document.createElement("button");
				n.type = "button", n.className = "ribbon-submenu-item", n.textContent = String(t.label || t.tool_id || "tool"), n.title = String(t.command_template || t.tool_id || ""), n.addEventListener("click", async (n) => {
					n.preventDefault(), n.stopPropagation(), za(), await Va(e, t);
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
async function Ua(e) {
	let t = parseInt(e?.dataset?.hostId, 10), n = String(e?.dataset?.hostAction || "");
	return t ? n === "rescan" ? (await Ja(t), !0) : n === "refresh-screenshots" ? (await Za(t), !0) : n === "dig-deeper" ? (await Xa(t), !0) : n === "remove" && (aa(t), !0) : !0;
}
async function Wa(e) {
	let t = String(e?.dataset?.subnet || "").trim(), n = String(e?.dataset?.subnetAction || "");
	return !t || n === "rescan" && (await Ya(t), !0);
}
async function Ga(e) {
	let t = parseInt(e?.dataset?.hostId, 10), n = String(e?.dataset?.screenshotAction || ""), r = String(e?.dataset?.port || "").trim(), i = String(e?.dataset?.protocol || "tcp").trim().toLowerCase() || "tcp", a = String(e?.dataset?.artifactRef || "").trim(), o = String(e?.dataset?.filename || "").trim();
	return t ? n === "refresh" ? (await Qa({
		hostId: t,
		port: r,
		protocol: i
	}), !0) : n === "delete" && (await $a({
		hostId: t,
		port: r,
		protocol: i,
		artifactRef: a,
		filename: o
	}), !0) : !0;
}
async function Ka(e) {
	if (!e?.hostId || !e?.port) return;
	let t = `${e.hostIp}:${e.port}/${e.protocol}`;
	if (window.confirm(`Delete port ${t}?`)) try {
		await G("/api/workspace/ports/delete", {
			host_id: e.hostId,
			port: e.port,
			protocol: e.protocol
		}), W(`Deleted port ${t}`), await Aa();
	} catch (e) {
		W(`Delete port failed: ${e.message}`, !0);
	}
}
async function qa(e) {
	if (!e?.hostId || !e?.port) return;
	let t = `${e.serviceLabel || e.serviceName || "service"} on ${e.hostIp}:${e.port}/${e.protocol}`;
	if (window.confirm(`Delete ${t}?`)) try {
		await G("/api/workspace/services/delete", {
			host_id: e.hostId,
			port: e.port,
			protocol: e.protocol,
			service: e.serviceName
		}), W(`Deleted ${t}`), await Aa();
	} catch (e) {
		W(`Delete service failed: ${e.message}`, !0);
	}
}
async function Ja(e) {
	let t = parseInt(e, 10);
	if (t) try {
		W(`Rescan queued (job ${(await G(`/api/workspace/hosts/${t}/rescan`, {}))?.job?.id || "?"})`), await Aa();
	} catch (e) {
		W(`Rescan failed: ${e.message}`, !0);
	}
}
async function Ya(e) {
	let t = String(e || "").trim();
	if (t) try {
		let e = await G("/api/workspace/subnets/rescan", { subnet: t }), n = Number(e?.job?.id || 0);
		e?.job?.existing ? W(`Subnet rescan already queued/running (job ${n || "?"})`) : W(`Subnet rescan queued (job ${n || "?"})`), await Aa();
	} catch (e) {
		W(`Subnet rescan failed: ${e.message}`, !0);
	}
}
async function Xa(e) {
	let t = parseInt(e, 10);
	if (t) try {
		let e = await G(`/api/workspace/hosts/${t}/dig-deeper`, {});
		e?.job?.existing ? W(`Dig deeper already queued/running (job ${e?.job?.id || "?"})`) : W(`Dig deeper queued (job ${e?.job?.id || "?"})`), await Aa();
	} catch (e) {
		W(`Dig deeper failed: ${e.message}`, !0);
	}
}
async function Za(e) {
	let t = parseInt(e, 10);
	if (t) try {
		let e = await G(`/api/workspace/hosts/${t}/refresh-screenshots`, {}), n = Number(e?.job?.id || 0);
		if (e?.job?.existing) {
			W(`Screenshot refresh already queued/running (job ${n || "?"})`), await Aa();
			return;
		}
		W(`Screenshot refresh queued (job ${n || "?"})`), await Aa(), n > 0 && Gr(n, 3e5, 1500).then(async (e) => {
			let n = e?.result || {}, r = Number(n.completed || 0), i = Number(n.target_count || 0);
			String(k.selectedHostId || "") === String(t) && await Yr(t), await Aa(), W(i > 0 ? `Screenshot refresh completed (${r}/${i})` : "Screenshot refresh completed");
		}).catch(async (e) => {
			String(k.selectedHostId || "") === String(t) && await Yr(t).catch(() => {}), await Aa(), W(`Screenshot refresh failed: ${e.message}`, !0);
		});
	} catch (e) {
		W(`Screenshot refresh failed: ${e.message}`, !0);
	}
}
async function Qa(e) {
	let t = parseInt(e?.hostId, 10), n = String(e?.port || "").trim(), r = String(e?.protocol || "tcp").trim().toLowerCase() || "tcp";
	if (t && n) try {
		let e = await G("/api/workspace/screenshots/refresh", {
			host_id: t,
			port: n,
			protocol: r
		}), i = Number(e?.job?.id || 0);
		e?.job?.existing ? W(`Screenshot refresh already queued/running (job ${i || "?"})`) : W(`Screenshot refresh queued (job ${i || "?"})`), await Aa();
	} catch (e) {
		W(`Screenshot refresh failed: ${e.message}`, !0);
	}
}
async function $a(e) {
	let t = parseInt(e?.hostId, 10), n = String(e?.port || "").trim(), r = String(e?.protocol || "tcp").trim().toLowerCase() || "tcp", i = String(e?.artifactRef || "").trim(), a = String(e?.filename || "").trim();
	if (!t || !i && !a) return;
	let o = a || i || "this screenshot";
	if (window.confirm(`Delete ${o}?`)) try {
		await G("/api/workspace/screenshots/delete", {
			host_id: t,
			port: n,
			protocol: r,
			artifact_ref: i,
			filename: a
		}), W(`Deleted screenshot ${o}`), await Aa();
	} catch (e) {
		W(`Delete screenshot failed: ${e.message}`, !0);
	}
}
async function eo() {
	let e = parseInt(je.hostId, 10);
	if (!e) Y(!0);
	else try {
		let t = await fetch(`/api/workspace/hosts/${e}`, { method: "DELETE" }), n = {};
		try {
			n = await t.json();
		} catch {}
		if (!t.ok) {
			let e = n.error || `Request failed (${t.status})`;
			throw Error(e);
		}
		let r = String(n.host_ip || je.hostIp || "");
		Y(!0), k.selectedHostId === e && (k.selectedHostId = null, k.hostDetail = null, Pr({
			host: {},
			note: "",
			ports: [],
			cves: [],
			screenshots: []
		})), W(`Removed host ${r || e}`), await Promise.all([
			Xr(),
			Aa(),
			ln()
		]);
	} catch (e) {
		W(`Remove host failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/tools.js
var to;
function no(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing tools callback: ${t}`);
	({pollSnapshot: to} = e);
}
function ro() {
	if (V("workspace-tool-host-ip").trim()) return;
	let e = k.hosts.find((e) => String(e.id) === String(k.selectedHostId));
	e?.ip && R("workspace-tool-host-ip", e.ip);
}
function io(e) {
	return [
		String(e?.host_id || ""),
		String(e?.host_ip || ""),
		String(e?.port || ""),
		String(e?.protocol || "tcp"),
		String(e?.service || "")
	].join("|");
}
function ao(e, t = "") {
	let n = document.getElementById("workspace-tool-select");
	if (!n) return;
	k.manualToolOptions = Array.isArray(e) ? e : [];
	let r = String(t || n.value || "").trim();
	n.innerHTML = "", k.manualToolOptions.filter((e) => e?.runnable !== !1).forEach((e) => {
		let t = document.createElement("option");
		t.value = String(e.tool_id || ""), t.textContent = `${e.label || e.tool_id} (${e.tool_id || ""})`, n.appendChild(t);
	}), r && Array.from(n.options).some((e) => e.value === r) && (n.value = r), so();
}
function oo() {
	let e = V("workspace-tool-select").trim();
	return e && (Array.isArray(k.manualToolOptions) ? k.manualToolOptions : []).find((t) => String(t?.tool_id || "") === e) || null;
}
function so() {
	let e = document.getElementById("workspace-tool-parameters-wrapper"), t = document.getElementById("workspace-tool-parameters");
	if (!e || !t) return;
	t.innerHTML = "";
	let n = oo(), r = Array.isArray(n?.parameters) ? n.parameters : [];
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
function co() {
	let e = document.getElementById("workspace-tool-parameters-wrapper"), t = document.getElementById("workspace-tool-parameters");
	if (!e || e.hidden || !t) return {};
	let n = {};
	return t.querySelectorAll("[data-parameter-name]").forEach((e) => {
		let t = String(e.dataset.parameterName || "").trim(), r = String(e.value || "").trim();
		t && r && (n[t] = r);
	}), n;
}
async function lo({ hostId: e = 0, service: t = "", limit: n = 500 } = {}) {
	let r = new URLSearchParams();
	r.set("limit", String(n)), e && r.set("host_id", String(e)), t && r.set("service", String(t));
	let i = await Ke(`/api/workspace/tool-targets?${r.toString()}`);
	return Array.isArray(i?.targets) ? i.targets : [];
}
async function uo(e = "", t = "", { port: n = "", protocol: r = "tcp" } = {}) {
	let i = await Rr({
		service: e,
		port: n,
		protocol: r
	});
	return ao(i, t), i;
}
async function fo(e, { preferredToolId: t = "" } = {}) {
	let n = e && typeof e == "object" ? e : {};
	R("workspace-tool-host-ip", n.host_ip || ""), R("workspace-tool-port", n.port || ""), R("workspace-tool-protocol", n.protocol || "tcp"), await uo(String(n.service || "").trim(), t, {
		port: String(n.port || "").trim(),
		protocol: String(n.protocol || "tcp").trim() || "tcp"
	});
}
async function po(e, { preferredTargetKey: t = "", preferredToolId: n = "" } = {}) {
	k.manualToolTargets = Array.isArray(e) ? e : [];
	let r = document.getElementById("workspace-tool-target-wrapper"), i = document.getElementById("workspace-tool-target-select");
	if (!r || !i) return;
	if (i.innerHTML = "", !k.manualToolTargets.length) {
		r.hidden = !0;
		return;
	}
	k.manualToolTargets.forEach((e) => {
		let t = document.createElement("option");
		t.value = io(e), t.textContent = String(e?.label || `${e?.host_ip || ""}:${e?.port || ""}/${e?.protocol || "tcp"}`), i.appendChild(t);
	}), r.hidden = !1;
	let a = t && Array.from(i.options).some((e) => e.value === t) ? t : String(i.options[0]?.value || "");
	a && (i.value = a), await fo(k.manualToolTargets.find((e) => io(e) === String(i.value || "")), { preferredToolId: n });
}
async function mo({ contextLabel: e = "", targets: t = null, hostId: n = 0, service: r = "", preferredToolId: i = "" } = {}) {
	da(), Mi(!0), L("workspace-tool-context", e || "");
	try {
		let e = Array.isArray(t) ? t : [];
		if (!e.length && (Number(n) > 0 || String(r || "").trim()) && (e = await lo({
			hostId: Number(n) || 0,
			service: String(r || "").trim(),
			limit: 2e3
		})), e.length) {
			await po(e, { preferredToolId: i });
			return;
		}
	} catch (e) {
		W(`Load tool targets failed: ${e.message}`, !0);
	}
	k.manualToolTargets = [];
	let a = document.getElementById("workspace-tool-target-wrapper"), o = document.getElementById("workspace-tool-target-select");
	a && (a.hidden = !0), o && (o.innerHTML = ""), ro(), ao(k.tools, i);
}
async function ho() {
	let e = document.getElementById("workspace-tool-target-select");
	if (!e) return;
	let t = k.manualToolTargets.find((t) => io(t) === String(e.value || ""));
	t && await fo(t);
}
async function go() {
	if (!I.manualScanOpen) return;
	let e = document.getElementById("workspace-tool-target-select"), t = "";
	if (e && !e.closest("[hidden]")) {
		let n = k.manualToolTargets.find((t) => io(t) === String(e.value || ""));
		t = String(n?.service || "").trim();
	}
	await uo(t, V("workspace-tool-select").trim(), {
		port: V("workspace-tool-port").trim(),
		protocol: V("workspace-tool-protocol").trim() || "tcp"
	});
}
async function _o() {
	let e = V("workspace-tool-host-ip").trim(), t = V("workspace-tool-port").trim(), n = V("workspace-tool-protocol").trim() || "tcp", r = V("workspace-tool-select").trim();
	if (!e || !t || !r) {
		W("host ip, port and tool are required", !0);
		return;
	}
	let i = co();
	Ui(), W("Queueing tool run...");
	try {
		W(`Tool run queued (job ${(await G("/api/workspace/tools/run", {
			host_ip: e,
			port: t,
			protocol: n,
			tool_id: r,
			parameters: i
		}))?.job?.id || "?"})`), await to();
	} catch (e) {
		W(`Tool run failed: ${e.message}`, !0);
	}
}
async function vo() {
	I.manualScanOpen && Ui(), W("Queueing scheduler run...");
	try {
		W(`Scheduler run queued (job ${(await G("/api/scheduler/run", {}))?.job?.id || "?"})`), await to();
	} catch (e) {
		W(`Scheduler run failed: ${e.message}`, !0);
	}
}
async function yo() {
	let e = k.selectedHostId, t = V("workspace-script-id").trim(), n = V("workspace-script-output"), r = V("workspace-script-port").trim() || V("workspace-tool-port").trim(), i = V("workspace-script-protocol").trim() || V("workspace-tool-protocol").trim() || "tcp";
	if (!e || !t || !r) W("select host and provide script id + port", !0);
	else try {
		await G(`/api/workspace/hosts/${e}/scripts`, {
			script_id: t,
			output: n,
			port: r,
			protocol: i
		}), W("Script saved"), await Yr(e);
	} catch (e) {
		W(`Add script failed: ${e.message}`, !0);
	}
}
async function bo(e) {
	try {
		let t = await fetch(`/api/workspace/scripts/${e}`, { method: "DELETE" });
		if (!t.ok) throw Error(`Request failed (${t.status})`);
		W("Script deleted"), k.selectedHostId && await Yr(k.selectedHostId);
	} catch (e) {
		W(`Delete script failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/graph_detail.js
var xo;
function So(e) {
	for (let t of ["graphRenderWorkspace"]) if (typeof e[t] != "function") throw TypeError(`Missing graph_detail callback: ${t}`);
	({graphRenderWorkspace: xo} = e);
}
function Co() {
	Xi(!1), A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.relatedContent = [], xo();
}
function wo(e) {
	let t = !!e;
	A.filtersExpanded = t;
	let n = document.getElementById("graph-filters-panel"), r = document.getElementById("graph-filters-toggle-button");
	if (n && (n.hidden = !t), r) {
		let e = t ? "Hide Filters" : "Show Filters";
		r.setAttribute("title", e), r.setAttribute("aria-label", e), r.setAttribute("aria-expanded", t ? "true" : "false"), r.classList.toggle("is-active", t);
	}
}
function To() {
	let e = bn(), t = document.getElementById("graph-workspace-canvas");
	if (!e || !t || t.hidden) return null;
	let n = t.viewBox?.baseVal;
	if (!n || !Number(n.width) || !Number(n.height)) return null;
	let r = e.getBoundingClientRect(), i = t.getBoundingClientRect(), a = String(A.selectedKind || ""), o = String(A.selectedRef || "");
	if (!a || !o) return null;
	let s = 0, c = 0;
	if (a === "node") {
		let e = A.filtered.positions?.[o] || A.positions?.[o];
		if (!e) return null;
		s = Number(e.x || 0) + N.width, c = Number(e.y || 0) + N.height / 2;
	} else if (a === "edge") {
		let e = fn("edge", o);
		if (!e) return null;
		let t = A.filtered.positions?.[String(e.from_node_id || "")], n = A.filtered.positions?.[String(e.to_node_id || "")];
		if (!t || !n) return null;
		let r = Number(t.x || 0) + N.width, i = Number(t.y || 0) + N.height / 2, a = Number(n.x || 0), l = Number(n.y || 0) + N.height / 2;
		s = (r + a) / 2, c = (i + l) / 2;
	} else return null;
	return {
		x: i.left - r.left + (s - Number(n.x || 0)) / Number(n.width || 1) * i.width,
		y: i.top - r.top + (c - Number(n.y || 0)) / Number(n.height || 1) * i.height
	};
}
function Eo() {
	let e = vn(), t = document.getElementById("graph-sidebar"), n = document.getElementById("graph-detail-dock-slot"), r = document.getElementById("graph-detail-floating-layer"), i = document.getElementById("graph-detail-panel"), a = document.getElementById("graph-detail-dock-toggle-button"), o = document.getElementById("graph-detail-close-button");
	if (!e || !t || !n || !r || !i || !a || !o) return;
	let s = String(A.detailMode || "floating") !== "docked", c = Sn();
	e.classList.toggle("graph-workspace-detail-floating", s), e.classList.toggle("graph-workspace-detail-docked", !s), t.hidden = s, r.hidden = !s || !c, i.classList.toggle("is-floating", s), a.setAttribute("title", s ? "Dock Panel" : "Float Panel"), a.setAttribute("aria-label", s ? "Dock Panel" : "Float Panel"), o.hidden = !s, s ? i.parentElement !== r && r.appendChild(i) : i.parentElement !== n && n.appendChild(i), i.hidden = s ? !c : !1, !s || !c ? (i.style.left = "", i.style.top = "") : window.requestAnimationFrame(() => {
		let e = bn();
		if (!e || i.hidden) return;
		let t = To(), n = Math.min(i.offsetWidth || 430, Math.max(280, e.clientWidth - 16)), r = i.offsetHeight || 420, a = Math.max(320, e.clientWidth), o = Math.max(240, e.clientHeight), s = Math.max(8, a - n - 10), c = 12;
		t && (s = t.x + 18, c = t.y + 12, s + n > a - 8 && (s = Math.max(8, t.x - n - 18)), c + r > o - 8 && (c = Math.max(8, o - r - 8))), s = Math.max(8, Math.min(s, a - n - 8)), c = Math.max(8, Math.min(c, o - Math.min(r, o - 8) - 8)), i.style.left = `${Math.round(s)}px`, i.style.top = `${Math.round(c)}px`;
	});
}
function Do(e) {
	A.detailMode = String(e || "floating").trim().toLowerCase() === "docked" ? "docked" : "floating", Eo();
}
function Oo() {
	Do(A.detailMode === "docked" ? "floating" : "docked");
}
function ko() {
	let e = document.getElementById("graph-focus-selection-button"), t = document.getElementById("graph-clear-focus-button"), n = document.getElementById("graph-expand-selection-button"), r = document.getElementById("graph-collapse-expanded-button"), i = Cn(), a = i && J(i, "summary_kind") ? i : null, o = String(a?.node_id || ""), s = !!(o && A.expandedSummaryIds[o]);
	if (e) {
		let t = !!i;
		e.disabled = !t;
		let n = t ? "Focus Selected" : "Select a node or summary to focus";
		e.setAttribute("title", n), e.setAttribute("aria-label", n);
	}
	if (t) {
		let e = Array.isArray(A.focusSeedNodeIds) && A.focusSeedNodeIds.length > 0;
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
function Ao() {
	let e = document.getElementById("graph-detail-caption"), t = document.getElementById("graph-selection-badges"), n = document.getElementById("graph-detail-fields"), r = document.getElementById("graph-host-actions-block"), i = document.getElementById("graph-host-actions"), a = document.getElementById("graph-port-actions-block"), o = document.getElementById("graph-port-actions"), s = document.getElementById("graph-service-actions-block"), c = document.getElementById("graph-service-actions"), l = document.getElementById("graph-subnet-actions-block"), u = document.getElementById("graph-subnet-actions"), d = document.getElementById("graph-screenshot-actions-block"), f = document.getElementById("graph-screenshot-actions"), p = document.getElementById("graph-detail-evidence"), m = document.getElementById("graph-detail-properties"), h = document.getElementById("graph-annotations-list"), g = document.getElementById("graph-focus-selection-button"), _ = document.getElementById("graph-expand-selection-button"), v = document.getElementById("graph-collapse-expanded-button"), y = document.getElementById("graph-pin-toggle-button"), b = document.getElementById("graph-note-open-button");
	if (!e || !t || !n || !r || !i || !a || !o || !s || !c || !l || !u || !d || !f || !p || !m || !h || !g || !_ || !v || !y || !b) return;
	let x = String(A.selectedKind || ""), S = String(A.selectedRef || ""), C = x === "node" ? Cn() : fn(x, S);
	if (A.selectedPayload = C, t.innerHTML = "", n.innerHTML = "", i.innerHTML = "", o.innerHTML = "", c.innerHTML = "", u.innerHTML = "", f.innerHTML = "", r.hidden = !0, a.hidden = !0, s.hidden = !0, l.hidden = !0, d.hidden = !0, p.innerHTML = "", h.innerHTML = "", !C) {
		e.textContent = "Select a node or edge", m.textContent = "No graph selection", g.disabled = !0, g.setAttribute("title", "Select a node or summary to focus"), g.setAttribute("aria-label", "Select a node or summary to focus"), b.disabled = !0, b.setAttribute("title", "Select a node or edge to add a note"), b.setAttribute("aria-label", "Select a node or edge to add a note"), y.disabled = !0, y.classList.remove("is-active"), y.setAttribute("title", "Select a node to pin"), y.setAttribute("aria-label", "Select a node to pin"), jo("No related artifacts or screenshots."), ko(), Eo();
		return;
	}
	let w = x === "node" && !!J(C, "summary_kind"), T = x === "edge" && !!J(C, "aggregate_kind"), E = x === "node" ? ba(C) : 0, D = x === "node" ? String(C.type || "").trim().toLowerCase() : "", O = [];
	if (x === "node") e.textContent = `${jn(C.type)}: ${C.label || C.node_id || ""}`, O.push(["Node ID", C.node_id || ""]), O.push(["Type", jn(C.type || "")]), w && (O.push(["Summary", "collapsed cluster"]), O.push(["Members", J(C, "member_count") || ""]), O.push(["Examples", (J(C, "sample_labels") || []).join(", ")]), O.push(["Expanded", A.expandedSummaryIds[String(C.node_id || "")] ? "yes" : "no"]));
	else {
		let t = fn("node", C.from_node_id), n = fn("node", C.to_node_id);
		e.textContent = `${jn(C.type)}: ${t?.label || C.from_node_id || ""} -> ${n?.label || C.to_node_id || ""}`, O.push(["Edge ID", C.edge_id || ""]), O.push(["Type", jn(C.type || "")]), O.push(["From", t?.label || C.from_node_id || ""]), O.push(["To", n?.label || C.to_node_id || ""]), T && (O.push(["Aggregate Count", J(C, "aggregate_count") || ""]), O.push(["Edge Types", (J(C, "edge_types") || []).join(", ")]));
	}
	if (O.push(["Confidence", C.confidence ?? ""]), O.push(["Provenance", Ce[String(C.source_kind || "").trim().toLowerCase()] || jn(C.source_kind || "")]), O.push(["First Seen", C.first_seen || ""]), O.push(["Last Seen", C.last_seen || ""]), O.push(["Source Ref", C.source_ref || ""]), O.forEach(([e, t]) => {
		if (t == null || t === "") return;
		let r = document.createElement("dt");
		r.textContent = e;
		let i = document.createElement("dd");
		i.textContent = String(t), n.appendChild(r), n.appendChild(i);
	}), [
		jn(C.type || ""),
		Ce[String(C.source_kind || "").trim().toLowerCase()] || jn(C.source_kind || ""),
		`${Math.round(Number(C.confidence || 0))}% confidence`
	].forEach((e) => {
		let n = document.createElement("span");
		n.className = "graph-badge", n.textContent = e, t.appendChild(n);
	}), x === "node" && A.pinnedNodeIds[String(C.node_id || "")]) {
		let e = document.createElement("span");
		e.className = "graph-badge graph-badge-pinned", e.textContent = "pinned", t.appendChild(e);
	}
	if (w) {
		let e = document.createElement("span");
		e.className = "graph-badge", e.textContent = "summary", t.appendChild(e);
	}
	if (T) {
		let e = document.createElement("span");
		e.className = "graph-badge", e.textContent = `${J(C, "aggregate_count") || 0} merged edges`, t.appendChild(e);
	}
	let ee = [], te = /* @__PURE__ */ new Set(), ne = (e) => {
		let t = String(e || "").trim();
		if (!t) return;
		let n = t.toLowerCase();
		te.has(n) || (te.add(n), ee.push(t));
	};
	if (ne(C?.properties?.evidence || ""), (Array.isArray(C?.evidence_refs) ? C.evidence_refs : []).forEach(ne), (Array.isArray(C?.properties?.evidence_items) ? C.properties.evidence_items : []).forEach(ne), ee.length) ee.forEach((e) => {
		let t = document.createElement("li");
		t.textContent = String(e || ""), p.appendChild(t);
	});
	else {
		let e = document.createElement("li");
		e.textContent = "No explicit evidence refs", p.appendChild(e);
	}
	let re = C.properties && typeof C.properties == "object" ? JSON.parse(JSON.stringify(C.properties)) : {};
	Array.isArray(re.member_node_ids) && re.member_node_ids.length > 24 && (re.member_node_ids = [`${re.member_node_ids.length} members hidden from inline view`]), m.textContent = JSON.stringify(re, null, 2);
	let ie = (A.annotations || []).filter((e) => String(e?.target_kind || "") === x && String(e?.target_ref || "") === S);
	if (ie.length) ie.forEach((e) => {
		let t = document.createElement("article");
		t.className = "graph-annotation-card";
		let n = document.createElement("div");
		n.className = "graph-annotation-meta", n.textContent = `${e.created_by || "operator"} | ${e.updated_at || e.created_at || ""}`;
		let r = document.createElement("div");
		r.className = "graph-annotation-body", r.textContent = e.body || "", t.appendChild(n), t.appendChild(r), h.appendChild(t);
	});
	else {
		let e = document.createElement("p");
		e.className = "text-muted", e.textContent = "No notes yet.", h.appendChild(e);
	}
	if (x === "node" && D === "host" && E > 0) {
		r.hidden = !1;
		let e = Ma("Run supported tool");
		e.addEventListener("click", async () => {
			await mo({
				hostId: Number(E) || 0,
				contextLabel: `Supported tools for ${String(C.label || "host").trim()}`
			});
		}), i.appendChild(e), [
			"rescan",
			"refresh-screenshots",
			"dig-deeper",
			"remove"
		].forEach((e) => {
			let t = Na(e, E);
			t.addEventListener("click", async () => {
				await Ua(t);
			}), i.appendChild(t);
		});
	}
	if (x === "node" && D === "port") {
		let e = Ra(C);
		if (e) {
			a.hidden = !1;
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Delete Port", t.setAttribute("aria-label", "Delete Port"), t.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", t.addEventListener("click", async () => {
				await Ka(e);
			}), o.appendChild(t), o.appendChild(Ha(e));
		}
	}
	if (x === "node" && D === "service") {
		let e = Ra(C);
		if (e) {
			s.hidden = !1;
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Delete Service", t.setAttribute("aria-label", "Delete Service"), t.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", t.addEventListener("click", async () => {
				await qa(e);
			}), c.appendChild(t), c.appendChild(Ha(e));
		}
	}
	if (x === "node" && D === "subnet") {
		let e = String(J(C, "cidr") || C.label || "").trim();
		if (e) {
			l.hidden = !1;
			let t = Pa("rescan", e);
			t.addEventListener("click", async () => {
				await Wa(t);
			}), u.appendChild(t);
		}
	}
	if (x === "node" && D === "screenshot") {
		let e = {
			hostId: E,
			port: String(J(C, "port") || "").trim(),
			protocol: String(J(C, "protocol") || "tcp").trim().toLowerCase() || "tcp",
			artifactRef: String(J(C, "artifact_ref") || "").trim(),
			filename: String(J(C, "filename") || C.label || "").trim()
		};
		e.hostId > 0 && (d.hidden = !1, ["refresh", "delete"].forEach((t) => {
			let n = Fa(t, e);
			n.addEventListener("click", async () => {
				await Ga(n);
			}), f.appendChild(n);
		}));
	}
	b.disabled = !1, b.setAttribute("title", "Add Note"), b.setAttribute("aria-label", "Add Note"), y.disabled = x !== "node" || w;
	let ae = x === "node" && !!A.pinnedNodeIds[String(C.node_id || "")];
	y.classList.toggle("is-active", ae), x === "node" ? w ? (y.setAttribute("title", "Summary nodes cannot be pinned"), y.setAttribute("aria-label", "Summary nodes cannot be pinned")) : (y.setAttribute("title", ae ? "Unpin Node" : "Pin Node"), y.setAttribute("aria-label", ae ? "Unpin Node" : "Pin Node")) : (y.setAttribute("title", "Pinning is available for nodes only"), y.setAttribute("aria-label", "Pinning is available for nodes only")), w ? jo("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.") : jo(), ko(), Eo();
}
function jo(e = "") {
	let t = document.getElementById("graph-detail-content-list"), n = document.getElementById("graph-detail-content-status");
	if (!t || !n) return;
	t.innerHTML = "";
	let r = Array.isArray(A.relatedContent) ? A.relatedContent : [], i = e || "No related artifacts or screenshots.";
	r.length ? (n.textContent = `${r.length} related item${r.length === 1 ? "" : "s"}`, r.forEach((e) => {
		let n = document.createElement("article");
		n.className = "graph-content-card";
		let r = document.createElement("div");
		r.className = "graph-content-header";
		let i = document.createElement("strong");
		i.textContent = e.label || e.filename || e.node_id || "artifact", r.appendChild(i);
		let a = document.createElement("span");
		a.className = "graph-content-kind", a.textContent = jn(e.kind || e.node_type || "artifact"), r.appendChild(a), n.appendChild(r);
		let o = document.createElement("div");
		if (o.className = "graph-content-meta", o.textContent = e.ref || e.filename || "", n.appendChild(o), e.kind === "image" && e.preview_url) {
			let t = document.createElement("img");
			t.className = "graph-content-image", t.src = `${e.preview_url}${e.preview_url.includes("?") ? "&" : "?"}t=${Date.now()}`, t.alt = e.filename || e.label || "Graph artifact preview", t.addEventListener("click", () => {
				kt(e.preview_url, e.filename || e.label || "screenshot.png", "");
			}), n.appendChild(t);
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
			e.kind === "image" && e.preview_url ? (Oe.url = String(e.preview_url || ""), Oe.filename = String(e.filename || "screenshot.png"), Oe.port = "", await Ft()) : await It(String(e.preview_text || e.ref || ""), `${e.filename || e.label || "Artifact"} copied to clipboard`, "Nothing to copy");
		}), s.appendChild(c);
		let l = document.createElement("button");
		if (l.type = "button", l.className = "icon-btn", l.title = "Download", l.setAttribute("aria-label", "Download"), l.innerHTML = "<i class=\"fa-solid fa-download\" aria-hidden=\"true\"></i>", l.addEventListener("click", () => {
			e.download_url && window.location.assign(`${e.download_url}${e.download_url.includes("?") ? "&" : "?"}t=${Date.now()}`);
		}), s.appendChild(l), e.kind === "image" && e.preview_url) {
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn", t.title = "Open", t.setAttribute("aria-label", "Open"), t.innerHTML = "<i class=\"fa-solid fa-up-right-from-square\" aria-hidden=\"true\"></i>", t.addEventListener("click", () => {
				kt(e.preview_url, e.filename || e.label || "screenshot.png", "");
			}), s.appendChild(t);
		} else if (e.kind === "text") {
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn", t.title = "Open", t.setAttribute("aria-label", "Open"), t.innerHTML = "<i class=\"fa-solid fa-up-right-from-square\" aria-hidden=\"true\"></i>", t.addEventListener("click", () => {
				Ot({
					title: "Artifact Preview",
					meta: e.filename || e.ref || "Artifact preview",
					command: e.ref || "",
					output: e.preview_text || "",
					downloadName: e.filename || "artifact.txt"
				});
			}), s.appendChild(t);
		}
		n.appendChild(s), t.appendChild(n);
	}), Eo()) : (n.textContent = i, Eo());
}
async function Mo() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || ""), n = e === "node" ? Cn() : null;
	if (!e || !t || e !== "node" || !n) {
		A.relatedContent = [], jo("No related artifacts or screenshots.");
		return;
	}
	if (J(n, "summary_kind")) {
		A.relatedContent = [], jo("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.");
		return;
	}
	let r = Number(A.contentRequestId || 0) + 1;
	A.contentRequestId = r, A.relatedContent = [], jo("Loading related content...");
	try {
		let e = await Ke(`/api/graph/nodes/${encodeURIComponent(t)}/content?max_chars=20000`);
		if (r !== A.contentRequestId) return;
		A.relatedContent = Array.isArray(e?.entries) ? e.entries : [], jo();
	} catch (e) {
		if (r !== A.contentRequestId) return;
		A.relatedContent = [], jo(`Related content load failed: ${e.message}`);
	}
}
// ../app/web/static/js/workspace/graph_layout.js
function No(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
	return (e || []).forEach((e) => {
		let o = parseInt(J(e, "host_id"), 10);
		if (!(!Number.isFinite(o) || o <= 0) && String(e.type || "") === "host") {
			t.set(o, e), n.set(o, String(e.label || J(e, "ip") || `host-${o}`));
			let s = String(J(e, "hostname") || "").trim();
			s && i.set(o, s);
			let c = String(J(e, "ip") || "").trim();
			c && r.set(o, Mn(c));
			let l = J(e, "device_categories");
			Array.isArray(l) ? a.set(o, pr(l)) : a.set(o, pr(String(l || "").split(",")));
		}
	}), {
		hostById: t,
		hostLabelById: n,
		subnetByHostId: r,
		domainByHostId: i,
		categoriesByHostId: a
	};
}
function X(e, t, n) {
	let r = String(J(e, "summary_group_key") || "").trim();
	if (r) return r;
	let i = String(e?.type || "").trim().toLowerCase(), a = parseInt(J(e, "host_id"), 10), o = String(J(e, "hostname") || "").trim(), s = String(J(e, "service") || J(e, "name") || J(e, "product") || "").trim();
	if (t === "host") return i === "host" ? String(e.label || "host") : n.hostLabelById.get(a) || "unassigned host";
	if (t === "category") {
		let t = pr(i === "host" ? J(e, "device_categories") : n.categoriesByHostId.get(a) || []);
		return t.length ? t.join(", ") : "uncategorized";
	}
	if (t === "domain") return i === "fqdn" ? String(e.label || "domain") : o || n.domainByHostId.get(a) || "undisclosed domain";
	if (t === "service") return i === "service" ? s || String(e.label || "service") : i === "port" ? `${J(e, "port") || ""}/${J(e, "protocol") || ""}`.replace(/\/$/, "") || "port" : s || jn(i) || "other service";
	if (t === "finding") return String(i === "finding" ? J(e, "title") || e.label || "finding" : J(e, "cve") || J(e, "title") || J(e, "severity") || jn(i) || "other");
	if (i === "subnet") return String(e.label || "subnet");
	let c = String(J(e, "ip") || "").trim();
	return c ? Mn(c) : n.subnetByHostId.get(a) || "other subnet";
}
function Po(e, t) {
	let n = String(e?.type || "").trim().toLowerCase(), r = String(t?.type || "").trim().toLowerCase(), i = Ee.indexOf(n), a = Ee.indexOf(r);
	return i === a ? String(e?.label || "").localeCompare(String(t?.label || "")) : (i === -1 ? Ee.length : i) - (a === -1 ? Ee.length : a);
}
function Fo(e) {
	let t = String(J(e, "severity") || "").trim().toLowerCase();
	return t ? Object.prototype.hasOwnProperty.call(De, t) ? De[t] : 80 : 99;
}
function Io(e, t) {
	let n = String(e || "").trim().toLowerCase();
	return t === "finding" ? n === "finding" ? 0 : n === "cve" || n === "exploit_reference" ? 1 : [
		"credential",
		"identity",
		"session"
	].includes(n) ? 2 : ["service", "url"].includes(n) ? 3 : n === "technology" || n === "cpe" ? 4 : n === "screenshot" ? 5 : [
		"host",
		"fqdn",
		"port",
		"subnet",
		"scope"
	].includes(n) ? 6 : 7 : t === "service" ? ["service", "url"].includes(n) ? 0 : n === "technology" || n === "cpe" ? 1 : [
		"finding",
		"cve",
		"exploit_reference"
	].includes(n) ? 2 : n === "screenshot" ? 3 : [
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
	].includes(n) ? 3 : n === "screenshot" ? 4 : 5 : 9;
}
function Lo(e, t) {
	return String(e || "").localeCompare(String(t || ""), void 0, {
		numeric: !0,
		sensitivity: "base"
	});
}
function Ro(e, t) {
	return Array.from(e.entries()).sort((e, n) => {
		let [r, i] = e, [a, o] = n, s = Math.min(...i.map((e) => Io(e?.type, t)), 9), c = Math.min(...o.map((e) => Io(e?.type, t)), 9);
		if (s !== c) return s - c;
		let l = Math.min(...i.map((e) => Fo(e)), 99), u = Math.min(...o.map((e) => Fo(e)), 99);
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
		return d === f ? Lo(r, a) : f - d;
	});
}
function zo(e) {
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
function Bo(e, t) {
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
function Vo(e, t, n) {
	let r = String(e || "").trim().toLowerCase(), i = String(t || A.viewId || "attack_surface").trim().toLowerCase();
	return i === "attack_surface" ? r === "scope" || r === "subnet" ? 0 : r === "host" || r === "fqdn" ? 1 : r === "port" || r === "service" ? 2 : r === "url" || r === "screenshot" ? 3 : r === "technology" || r === "cpe" ? 4 : r === "finding" || r === "cve" || r === "exploit_reference" ? 5 : [
		"credential",
		"identity",
		"session",
		"action",
		"artifact",
		"evidence_record"
	].includes(r) ? 6 : 7 : i === "host_service_topology" ? r === "host" || r === "fqdn" || r === "subnet" ? 0 : r === "port" || r === "service" ? 1 : r === "url" || r === "screenshot" ? 2 : r === "technology" || r === "cpe" ? 3 : r === "finding" || r === "cve" || r === "exploit_reference" ? 4 : 5 : i === "web_application_map" ? r === "host" || r === "fqdn" || r === "service" ? 0 : r === "url" || r === "screenshot" ? 1 : r === "technology" || r === "cpe" ? 2 : r === "finding" || r === "cve" || r === "exploit_reference" ? 3 : 4 : i === "credential_identity_session" ? r === "host" ? 0 : r === "credential" || r === "identity" || r === "session" ? 1 : r === "action" || r === "artifact" || r === "evidence_record" ? 2 : 3 : i === "exploitation_chain" ? r === "host" ? 0 : r === "finding" || r === "cve" || r === "exploit_reference" ? 1 : r === "credential" || r === "identity" || r === "session" ? 2 : r === "action" || r === "artifact" || r === "screenshot" || r === "evidence_record" ? 3 : 4 : Io(r, n);
}
function Ho(e, t, n) {
	let r = Math.sqrt(Math.max(e, 1)) * (t >= 5e3 ? 1.08 : 1.16);
	return Math.max(1100, Math.min(t >= 5e3 ? 5600 : 4200, Math.round(r + n * 120)));
}
function Uo(e, t, n, r, i) {
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
function Wo(e, t, n, r, i = {}) {
	let a = Array.isArray(e) ? e.length : 0, o = a >= 5e3 ? 10 : a >= 2500 ? 12 : 16, s = a >= 5e3 ? 8 : a >= 2500 ? 10 : 14, c = a >= 5e3 ? 20 : 26, l = a >= 5e3 ? 20 : 28, u = a >= 5e3 ? 14 : 18, d = a >= 5e3 ? 12 : 18, f = String(A.viewId || "attack_surface").trim(), p = new Map((e || []).map((e) => [String(e?.node_id || ""), e])), { neighborMap: m, degreeMap: h } = zo(t), g = Ro(n, r), _ = /* @__PURE__ */ new Map();
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
			let n = Io(e?.type, r) - Io(t?.type, r);
			if (n !== 0) return n;
			let i = Fo(e) - Fo(t);
			if (i !== 0) return i;
			let a = Number(h.get(String(t?.node_id || "")) || 0) - Number(h.get(String(e?.node_id || "")) || 0);
			if (a !== 0) return a;
			let o = Number((m.get(String(t?.node_id || "")) || /* @__PURE__ */ new Set()).size) - Number((m.get(String(e?.node_id || "")) || /* @__PURE__ */ new Set()).size);
			return o === 0 ? Lo(e?.label || "", t?.label || "") : o;
		}), c = Math.min(...i.map((e) => Io(e?.type, r)), 9), l = Math.min(...i.map((e) => Fo(e)), 99), p = i.filter((e) => [
			"finding",
			"cve",
			"exploit_reference"
		].includes(String(e?.type || "").trim().toLowerCase())).length, { columns: g, rows: _ } = Bo(i.length, a), v = Math.max(220, Math.round(u * 2 + g * N.width + Math.max(0, g - 1) * o)), b = Math.max(132, Math.round(58 + _ * N.height + Math.max(0, _ - 1) * s + d));
		return {
			key: n,
			label: n,
			nodes: i,
			nodeIds: i.map((e) => String(e?.node_id || "")).filter(Boolean),
			priority: c,
			severity: l,
			findings: p,
			degree: Number(y.get(n) || 0),
			lane: Math.min(...i.map((e) => Vo(e?.type, f, r)), 99),
			columns: g,
			rows: _,
			width: v,
			height: b,
			area: v * b,
			x: 20,
			y: 20
		};
	});
	b.sort((e, t) => e.lane === t.lane ? e.priority === t.priority ? e.severity === t.severity ? e.findings === t.findings ? e.degree === t.degree ? e.area === t.area ? Lo(e.key, t.key) : t.area - e.area : t.degree - e.degree : t.findings - e.findings : e.severity - t.severity : e.priority - t.priority : e.lane - t.lane);
	let x = Uo(b, Ho(b.reduce((e, t) => e + Number(t.area || 0), 0), a, new Set(b.map((e) => Number(e?.lane ?? 0))).size || 1), c, l, 20), S = {};
	b.forEach((e) => {
		let t = Math.max(1, Number(e.rows || 1));
		(e.nodes || []).forEach((n, r) => {
			let i = String(n?.node_id || ""), a = Math.floor(r / t), c = r % t;
			S[i] = {
				x: Math.round(e.x + u + a * (N.width + o)),
				y: Math.round(e.y + 42 + c * (N.height + s))
			};
		});
	});
	let C = i && typeof i == "object" ? i : {};
	Object.keys(C).forEach((e) => {
		p.has(String(e || "")) && (S[e] = {
			x: Math.max(20, Math.round(Number(C[e]?.x) || 0)),
			y: Math.max(20, Math.round(Number(C[e]?.y) || 0))
		});
	});
	let w = b.map((e) => {
		let t = Array.isArray(e.nodeIds) ? e.nodeIds : [], n = Infinity, r = Infinity, i = 0, a = 0;
		return t.forEach((e) => {
			let t = S[String(e || "")];
			t && (n = Math.min(n, Number(t.x) || 0), r = Math.min(r, Number(t.y) || 0), i = Math.max(i, (Number(t.x) || 0) + N.width), a = Math.max(a, (Number(t.y) || 0) + N.height));
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
	}), T = Math.max(Math.round(x.width || 1200), 1200), E = Math.max(Math.round(x.height || 760), 760);
	return Object.values(S).forEach((e) => {
		T = Math.max(T, (Number(e?.x) || 0) + N.width + 80), E = Math.max(E, (Number(e?.y) || 0) + N.height + 120);
	}), w.forEach((e) => {
		T = Math.max(T, (Number(e?.x) || 0) + (Number(e?.width) || 0) + 48), E = Math.max(E, (Number(e?.y) || 0) + (Number(e?.height) || 0) + 48);
	}), {
		positions: S,
		groups: w,
		width: Math.round(T),
		height: Math.round(E)
	};
}
// ../app/web/static/js/workspace/graph_projection.js
function Go(e) {
	if (!e || typeof e != "object") return [];
	let t = Array.isArray(J(e, "member_node_ids")) ? J(e, "member_node_ids") : [];
	if (t.length) return t.map((e) => String(e || "")).filter(Boolean);
	let n = String(e.node_id || "");
	return n ? [n] : [];
}
function Ko(e, t, n) {
	let r = String(n || A.renderMode || "auto").trim().toLowerCase();
	return r === "graph" ? !1 : r === "summary" || r === "matrix" || e >= 1e3 || t >= 3e3;
}
function qo(e, t, n) {
	let r = String(n || A.renderMode || "auto").trim().toLowerCase();
	return r === "matrix" ? !0 : r === "graph" || r === "summary" ? !1 : e >= 1600 || t >= 4500;
}
function Jo(e) {
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
function Yo(e) {
	let t = "", n = Infinity;
	return (e || []).forEach((e) => {
		let r = String(J(e, "severity") || "").trim().toLowerCase();
		if (!r) return;
		let i = Object.prototype.hasOwnProperty.call(De, r) ? De[r] : 80;
		i < n && (n = i, t = r);
	}), t;
}
function Xo(e, t) {
	let n = String(e || "").trim().toLowerCase();
	return n === "scope" || n === "subnet" ? Infinity : n === "finding" || n === "cve" || n === "exploit_reference" ? t >= 5e3 ? 5 : 7 : n === "host" || n === "fqdn" ? t >= 5e3 ? 3 : 5 : n === "service" || n === "port" || n === "url" || n === "screenshot" ? t >= 5e3 ? 2 : 4 : n === "technology" || n === "cpe" ? t >= 5e3 ? 2 : 3 : t >= 5e3 ? 2 : 4;
}
function Zo(e, t) {
	let n = String(e?.type || "").trim().toLowerCase(), r = String(e?.label || "").trim(), i = parseInt(J(e, "host_id"), 10), a = String(J(e, "hostname") || "").trim(), o = String(J(e, "ip") || "").trim(), s = String(J(e, "service") || J(e, "name") || r || "").trim().toLowerCase(), c = Fn(r).toLowerCase();
	return n === "host" ? {
		type: n,
		bucket: Mn(o) || t.subnetByHostId.get(i) || Pn(a) || "hosts"
	} : n === "fqdn" ? {
		type: n,
		bucket: Pn(r || a) || t.domainByHostId.get(i) || "domains"
	} : n === "port" ? {
		type: n,
		bucket: `${J(e, "port") || r}/${J(e, "protocol") || "tcp"}`.replace(/\/$/, "")
	} : n === "service" ? {
		type: n,
		bucket: s || "service"
	} : n === "url" ? {
		type: n,
		bucket: c || Pn(a) || "urls"
	} : n === "technology" || n === "cpe" || n === "credential" || n === "identity" || n === "session" ? {
		type: n,
		bucket: String(r || J(e, "name") || n).trim().toLowerCase() || n
	} : n === "screenshot" || n === "artifact" || n === "action" || n === "evidence_record" ? {
		type: n,
		bucket: a || t.hostLabelById.get(i) || Mn(o) || n
	} : n === "finding" || n === "cve" || n === "exploit_reference" ? {
		type: n,
		bucket: String(r || J(e, "title") || J(e, "cve") || J(e, "severity") || n).trim().toLowerCase() || n
	} : {
		type: n,
		bucket: String(r || n).trim().toLowerCase() || n
	};
}
function Qo(e, t, n) {
	let r = Array.isArray(n) ? n.length : 0, i = jn(String(t || "").replace(/^.+?:/, "")) || jn(e) || "summary", a = r === 1 ? "" : "s";
	return e === "host" ? `${i} ${r} host${a}` : e === "fqdn" ? `${i} ${r} fqdn${a}` : e === "service" || e === "port" || e === "technology" || e === "cpe" ? `${i} ${r}` : e === "url" ? `${i} ${r} url${a}` : e === "screenshot" ? `${i} ${r} screenshot${a}` : `${i} ${r}`;
}
function $o(e, t, n, r) {
	let i = Yo(r), a = (r || []).map((e) => String(e?.label || "").trim()).filter(Boolean).slice(0, 3);
	return {
		node_id: e,
		type: n.type,
		label: Qo(n.type, n.bucket, r),
		confidence: Math.max(...(r || []).map((e) => Number(e?.confidence || 0) || 0), 0),
		source_kind: Jo(r),
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
function es(e, t, n, r) {
	let i = (e || []).slice().sort((e, t) => {
		let n = Number(J(e, "aggregate_count") || 1), r = Number(J(t, "aggregate_count") || 1);
		return n === r ? Lo(e?.edge_id || "", t?.edge_id || "") : r - n;
	});
	if (r) return i;
	let a = /* @__PURE__ */ new Map(), o = [];
	return i.forEach((e) => {
		let r = String(e?.from_node_id || ""), i = String(e?.to_node_id || ""), s = Number(J(e, "aggregate_count") || 1), c = t.has(r), l = t.has(i);
		if (n && (r === n || i === n) || c || l || s >= 3) {
			o.push(e);
			return;
		}
		let u = Number(a.get(r) || 0), d = Number(a.get(i) || 0);
		u >= 6 && d >= 6 || (a.set(r, u + 1), a.set(i, d + 1), o.push(e));
	}), o;
}
function ts(e, t, n, r) {
	let i = Array.isArray(e) ? e.length : 0, a = /* @__PURE__ */ new Map();
	(e || []).forEach((e) => {
		let t = X(e, r, n) || "other";
		a.has(t) || a.set(t, []), a.get(t).push(e);
	});
	let o = [], s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map();
	a.forEach((e, t) => {
		let r = /* @__PURE__ */ new Map();
		(e || []).forEach((e) => {
			let t = Zo(e, n), i = `${t.type}|${t.bucket}`;
			r.has(i) || r.set(i, {
				descriptor: t,
				nodes: []
			}), r.get(i).nodes.push(e);
		}), s.set(t, /* @__PURE__ */ new Set()), r.forEach((e, n) => {
			let r = Xo(String(e.descriptor?.type || "").trim().toLowerCase(), i), a = `graph-summary-${Nn(`${t}|${n}`)}`, d = !!A.expandedSummaryIds[a];
			if (e.nodes.length > r && !d) {
				let n = $o(a, t, e.descriptor, e.nodes);
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
			edge_id: `graph-edge-summary-${Nn(i)}`,
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
		a.members.push(e), a.properties.aggregate_count += Number(J(e, "aggregate_count") || 1), a.properties.edge_types.push(r), a.confidence = Math.max(Number(a.confidence || 0), Number(e?.confidence || 0) || 0), a.source_kind = Jo(a.members);
	});
	let f = String(A.selectedRef || ""), p = Array.isArray(A.focusSeedNodeIds) && A.focusSeedNodeIds.length > 0, m = es(Array.from(d.values()).map((e) => ({
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
function ns(e, t, n, r) {
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
function rs(e, t, n) {
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
		let a = Number(J(e, "aggregate_count") || 1);
		i.set(t, Number(i.get(t) || 0) + a), i.set(n, Number(i.get(n) || 0) + a);
	});
	let a = (n || []).map((e) => ({
		key: String(e?.key || ""),
		label: String(e?.label || e?.key || ""),
		nodeCount: Array.isArray(e?.nodeIds) ? e.nodeIds.length : 0,
		activity: Number(i.get(String(e?.key || "")) || 0)
	})).sort((e, t) => e.activity === t.activity ? e.nodeCount === t.nodeCount ? Lo(e.label, t.label) : t.nodeCount - e.nodeCount : t.activity - e.activity), o = a.slice(0, 24), s = new Set(o.map((e) => e.key)), c = a.length > o.length;
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
		let c = Number(J(e, "aggregate_count") || 1);
		u[i][a] += c, d = Math.max(d, u[i][a]);
	}), {
		groups: o,
		values: u,
		maxValue: d
	};
}
// ../app/web/static/js/workspace/graph_filters.js
function is() {
	A.viewId = String(V("graph-view-select") || A.viewId || "attack_surface").trim(), A.groupBy = String(V("graph-group-select") || A.groupBy || Wn().defaultGroup || "subnet").trim(), A.renderMode = String(V("graph-render-mode-select") || A.renderMode || "auto").trim().toLowerCase(), A.focusDepth = Math.max(1, Math.min(3, parseInt(V("graph-focus-depth-select"), 10) || A.focusDepth || 1));
	let e = parseInt(V("graph-host-filter"), 10), t = Math.max(0, Math.min(100, parseInt(V("graph-min-confidence"), 10) || 0));
	return {
		viewId: A.viewId,
		groupBy: A.groupBy,
		renderMode: A.renderMode,
		focusDepth: A.focusDepth,
		hostId: Number.isFinite(e) && e > 0 ? e : 0,
		hostFilter: String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down",
		serviceFilters: hr(),
		category: String(k.hostCategoryFilter || "").trim(),
		nodeType: String(V("graph-node-type-filter") || "").trim().toLowerCase(),
		edgeType: String(V("graph-edge-type-filter") || "").trim().toLowerCase(),
		sourceKind: String(V("graph-source-kind-filter") || "").trim().toLowerCase(),
		severity: String(V("graph-severity-filter") || "").trim().toLowerCase(),
		pack: String(V("graph-pack-filter") || "").trim().toLowerCase(),
		timeWindow: String(V("graph-time-window-filter") || "all").trim().toLowerCase(),
		search: String(V("graph-search-input") || "").trim(),
		minConfidence: t,
		hideAiSuggested: B("graph-hide-ai-suggested"),
		hideNmapXmlArtifacts: B("graph-hide-nmap-xml-artifacts")
	};
}
function as(e) {
	let t = Wn(), n = is(), r = n.sourceKind, i = n.nodeType, a = n.edgeType, o = n.severity, s = n.pack, c = Rn(n.timeWindow), l = Array.isArray(e?.nodes) ? e.nodes.slice() : [], u = Array.isArray(e?.edges) ? e.edges.slice() : [];
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
		return t && n && Bn(e, o) && Vn(e, s) && zn(e, c);
	}, h = (e) => {
		let t = !r || String(e?.source_kind || "").trim().toLowerCase() === r, n = !a || String(e?.type || "").trim().toLowerCase() === a;
		return t && n && Bn(e, o) && Vn(e, s) && zn(e, c);
	}, g = new Set(f ? l.filter(m).map((e) => String(e?.node_id || "")) : l.map((e) => String(e?.node_id || ""))), _ = p ? u.filter(h) : u.slice();
	p && _.forEach((e) => {
		g.add(String(e?.from_node_id || "")), g.add(String(e?.to_node_id || ""));
	}), l = l.filter((e) => g.has(String(e?.node_id || ""))), d = new Set(l.map((e) => String(e?.node_id || ""))), u = _.filter((e) => d.has(String(e?.from_node_id || "")) && d.has(String(e?.to_node_id || "")));
	let v = l.length, y = u.length, b = ns(l, u, A.focusSeedNodeIds, n.focusDepth);
	l = b.nodes, u = b.edges;
	let x = No(l), S = /* @__PURE__ */ new Map(), C = Ko(l.length, u.length, n.renderMode), w = !1, T = /* @__PURE__ */ new Set();
	if (C) {
		let e = ts(l, u, x, n.groupBy || t.defaultGroup || "subnet");
		l = e.nodes, u = e.edges, S = e.groupsMap, w = !!e.usedSummary, T = e.summaryNodeIds || /* @__PURE__ */ new Set();
	} else l.sort(Po).forEach((e) => {
		let r = X(e, n.groupBy || t.defaultGroup || "subnet", x) || "other";
		S.has(r) || S.set(r, []), S.get(r).push(e);
	});
	let E = Wo(l, u, S, n.groupBy || t.defaultGroup || "subnet", A.positions), D = qo(l.length, u.length, n.renderMode) && (E.groups || []).length > 2 ? "matrix" : "graph", O = D === "matrix" ? rs(l, u, E.groups || []) : null;
	return {
		nodes: l,
		edges: u,
		groups: E.groups,
		positions: E.positions,
		width: E.width,
		height: E.height,
		renderKind: D,
		matrix: O,
		meta: {
			largeGraphMode: C,
			summaryUsed: w,
			focusActive: b.active,
			focusDepth: n.focusDepth,
			baseNodeCount: v,
			baseEdgeCount: y,
			summaryNodeCount: T.size
		}
	};
}
// ../app/web/static/js/workspace/graph_render.js
function os(e) {
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
function ss({ preserveDetail: e = !1 } = {}) {
	let t = document.getElementById("graph-workspace-canvas"), n = document.getElementById("graph-workspace-empty"), r = document.getElementById("graph-matrix-view");
	if (!t || !n || !r) return;
	let i = as(A.data);
	A.filtered = i;
	let a = i.nodes || [], o = i.edges || [], s = i.positions || {}, c = !1, l = A.selectedKind === "node" ? Cn() : fn(A.selectedKind, A.selectedRef);
	if (A.selectedKind && !l && (A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.relatedContent = [], c = !0), L("graph-workspace-summary", `${a.length} visible nodes | ${o.length} visible edges | ${Number(i?.meta?.baseNodeCount || A.data?.meta?.total_nodes || a.length)} filtered nodes${i?.meta?.summaryUsed ? " | summary mode" : ""}${i?.renderKind === "matrix" ? " | matrix fallback" : ""}${i?.meta?.focusActive ? ` | focus ${i.meta.focusDepth} hop` : ""}`), !a.length) {
		r.hidden = !0, t.innerHTML = "", t.setAttribute("viewBox", "0 0 1600 900"), t.style.width = "100%", t.style.height = `${Math.max(520, Number(xn()?.clientHeight || 680))}px`, A.viewport = null, t.hidden = !1, n.hidden = !1, Ao(), Eo();
		return;
	}
	if (n.hidden = !0, i.renderKind === "matrix") {
		t.hidden = !0, r.hidden = !1, os(i), e && !c && A.selectedKind || Ao(), Eo();
		return;
	}
	r.hidden = !0, r.innerHTML = "", t.hidden = !1, t.innerHTML = "";
	let u = Da(), d = tr("defs");
	d.appendChild(tr("marker", {
		id: "graph-arrow",
		markerWidth: 8,
		markerHeight: 8,
		refX: 7,
		refY: 4,
		orient: "auto",
		markerUnits: "strokeWidth"
	}));
	let f = tr("path", {
		d: "M0,0 L8,4 L0,8 z",
		fill: "rgba(121, 133, 158, 0.65)"
	});
	d.firstChild.appendChild(f), d.appendChild(tr("marker", {
		id: "graph-arrow-highlight",
		markerWidth: 9,
		markerHeight: 9,
		refX: 8,
		refY: 4.5,
		orient: "auto",
		markerUnits: "strokeWidth"
	}));
	let p = tr("path", {
		d: "M0,0 L9,4.5 L0,9 z",
		fill: xe
	});
	d.lastChild.appendChild(p), t.appendChild(d), (i.groups || []).forEach((e) => {
		let n = tr("g", {
			class: "graph-group",
			"data-graph-group-key": e.key || ""
		});
		n.appendChild(tr("rect", {
			x: e.x,
			y: e.y,
			width: e.width,
			height: e.height,
			rx: 18,
			fill: Zn() ? "#131313" : "rgba(19, 19, 19, 0.75)",
			stroke: "rgba(160, 160, 160, 0.16)",
			"data-graph-group-key": e.key || ""
		})), u && n.appendChild(tr("text", {
			x: e.x + 16,
			y: e.y + 28,
			class: "graph-group-label",
			"data-graph-group-key": e.key || ""
		}, e.label)), t.appendChild(n);
	});
	let m = A.selectedKind === "node" ? String(A.selectedRef || "") : "", h = A.selectedKind === "edge" ? String(A.selectedRef || "") : "";
	[...o].sort((e, t) => {
		let n = String(e?.edge_id || ""), r = String(t?.edge_id || "");
		return (h && n === h ? 2 : m && (String(e?.from_node_id || "") === m || String(e?.to_node_id || "") === m) ? 1 : 0) - (h && r === h ? 2 : m && (String(t?.from_node_id || "") === m || String(t?.to_node_id || "") === m) ? 1 : 0);
	}).forEach((e) => {
		let n = s[String(e?.from_node_id || "")], r = s[String(e?.to_node_id || "")];
		if (!n || !r) return;
		let i = n.x + N.width, a = n.y + N.height / 2, o = r.x, c = r.y + N.height / 2, l = Math.max(36, Math.min(140, Math.abs(o - i) / 2)), u = o >= i ? 1 : -1, d = [
			`M ${i} ${a}`,
			`C ${i + l * u} ${a}`,
			`${o - l * u} ${c}`,
			`${o} ${c}`
		].join(" "), f = String(e?.edge_id || ""), p = h && h === f, g = !(!m || String(e?.from_node_id || "") !== m && String(e?.to_node_id || "") !== m), _ = Xn(e), v = Math.max(1, Number(J(e, "aggregate_count") || 1)), y = p ? 4.2 : g ? Math.min(6.8, 2.5 + Math.log2(v + 1)) : Math.min(4.2, 1.05 + Math.log2(v + 1) * .7), b = p ? 1 : g ? .98 : Math.max(.18, Math.min(.34, .16 + Math.log2(v + 1) * .045)), x = p ? "#eef1ff" : g ? xe : Qn(e), S = p || g ? "url(#graph-arrow-highlight)" : "url(#graph-arrow)";
		t.appendChild(tr("path", {
			d,
			stroke: "transparent",
			fill: "none",
			"stroke-width": 12,
			"data-graph-edge-id": e.edge_id || "",
			class: "graph-edge-hitbox"
		})), t.appendChild(tr("path", {
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
		Xn(e);
		let i = Yn(e), a = A.selectedKind === "node" && String(A.selectedRef || "") === n, o = xa(e), c = !!J(e, "summary_kind"), l = ka({
			isSelected: a,
			isHostSelected: o,
			isSummaryNode: c
		}), u = Oa({
			isSelected: a,
			isHostSelected: o,
			isSummaryNode: c
		}), d = tr("g", {
			transform: `translate(${r.x}, ${r.y})`,
			"data-graph-node-id": n,
			class: `graph-node${a ? " is-selected" : ""}${o ? " is-host-selected" : ""}${c ? " is-summary" : ""}`
		});
		if (d.appendChild(tr("rect", {
			width: N.width,
			height: N.height,
			rx: 14,
			fill: $n(e),
			stroke: a ? "#eef1ff" : i,
			"stroke-width": a ? 2.8 : 1.8,
			"data-graph-node-id": n
		})), d.appendChild(tr("rect", {
			x: 10,
			y: 9,
			width: 8,
			height: N.height - 18,
			rx: 4,
			fill: i,
			opacity: .9,
			"data-graph-node-id": n
		})), l && d.appendChild(tr("text", {
			x: 28,
			y: 18,
			class: "graph-node-type",
			"data-graph-node-id": n
		}, jn(e.type || ""))), u) {
			let t = tr("text", {
				x: 28,
				y: l ? 34 : 30,
				class: "graph-node-label",
				"data-graph-node-id": n
			});
			er(e.label || n).forEach((e, r) => {
				let i = tr("tspan", {
					x: 28,
					dy: r === 0 ? 0 : 14,
					"data-graph-node-id": n
				}, e);
				t.appendChild(i);
			}), d.appendChild(t);
		}
		A.pinnedNodeIds[n] && d.appendChild(tr("circle", {
			cx: N.width - 16,
			cy: 14,
			r: 5,
			fill: "#eef1ff",
			opacity: .9,
			"data-graph-node-id": n
		})), c && d.appendChild(tr("circle", {
			cx: N.width - 16,
			cy: N.height - 14,
			r: 7,
			fill: i,
			opacity: .95,
			"data-graph-node-id": n
		})), t.appendChild(d);
	}), Ea(i.width, i.height), e && !c && A.selectedKind || Ao(), Eo();
}
// ../app/web/static/js/workspace/workspace_view.js
function cs({ resetForms: e = !0 } = {}) {
	k.hostDetail = null, L("host-detail-name", ""), R("workspace-note", ""), R("workspace-tool-host-ip", ""), e && (R("workspace-tool-port", ""), R("workspace-tool-protocol", "tcp"), R("workspace-script-id", ""), R("workspace-script-port", ""), R("workspace-script-protocol", "tcp"), R("workspace-script-output", ""), R("workspace-cve-name", ""), R("workspace-cve-severity", "")), [
		"host-detail-ports",
		"host-detail-scripts",
		"host-detail-ai-technologies",
		"host-detail-ai-manual-tests",
		"host-detail-screenshots"
	].forEach((e) => {
		let t = document.getElementById(e);
		t && (t.innerHTML = "");
	}), L("host-ai-analysis-status", ""), L("host-ai-tech-count", 0), L("host-ai-manual-count", 0), L("host-screenshot-count", 0);
}
function ls({ clearProjectPaths: e = !1 } = {}) {
	k.hosts = [], k.hostFilter = "hide_down", k.hostServiceFilter = "", k.hostCategoryFilter = "", k.servicesHostFilterId = 0, k.servicesHostFilterLabel = "", k.servicesCategoryFilter = "", k.deviceCategoryRules = [], k.builtInDeviceCategories = [], k.services = [], k.tools = [], k.toolsHydrated = !1, k.toolsLoading = !1, k.selectedHostId = null, k.hostDetail = null, A.data = {
		nodes: [],
		edges: [],
		meta: {}
	}, A.filtered = {
		nodes: [],
		edges: [],
		groups: [],
		positions: {},
		width: 1600,
		height: 900
	}, A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.metadataLoaded = !1, A.layouts = [], A.annotations = [], Wt({
		hosts: 0,
		open_ports: 0,
		services: 0,
		cves: 0,
		running_processes: 0,
		finished_processes: 0
	}), Yt([]), ps([]), hs([]), xs([]), ct([]), Zt([]), Qt([]), $t([]), cs({ resetForms: !0 }), xt(!0), St(!0), Ct(!0), Y(!0), qn(), Kn(), ss(), e && (R("project-open-path", ""), R("project-save-path", ""));
}
function us(e) {
	let t = document.getElementById("workspace-host-select");
	if (!t) return;
	let n = k.selectedHostId;
	t.innerHTML = "", e.forEach((e) => {
		let n = document.createElement("option");
		n.value = String(e.id), n.textContent = `${e.ip || ""} ${e.hostname ? `(${e.hostname})` : ""}`.trim(), t.appendChild(n);
	}), e.length ? (k.selectedHostId = e.some((e) => String(e.id) === String(n)) ? n : e[0].id, t.value = String(k.selectedHostId)) : (k.selectedHostId = null, cs({ resetForms: !0 }));
}
function ds({ syncGraph: e = !1, preserveGraphDetail: t = !0 } = {}) {
	let n = String(k.selectedHostId || ""), r = document.getElementById("workspace-host-select");
	r && (r.value = Array.from(r.options || []).some((e) => String(e.value || "") === n) ? n : "");
	let i = document.getElementById("hosts-body");
	i && Array.from(i.querySelectorAll("tr[data-host-id]")).forEach((e) => {
		let t = n && String(e.dataset.hostId || "") === n;
		e.classList.toggle("is-selected", !!t), e.setAttribute("aria-selected", t ? "true" : "false");
	}), e && ss({ preserveDetail: t });
}
async function fs(e, { loadDetail: t = !0, syncGraph: n = !0, preserveGraphDetail: r = !0 } = {}) {
	let i = parseInt(e, 10);
	if (!Number.isFinite(i) || i <= 0) {
		k.selectedHostId = null, k.hostDetail = null;
		let e = ir(0);
		cs({ resetForms: !0 }), ds({
			syncGraph: n,
			preserveGraphDetail: r
		}), e && await qr();
		return;
	}
	let a = String(k.selectedHostId || "") !== String(i);
	k.selectedHostId = i;
	let o = ir(i);
	ds({
		syncGraph: n,
		preserveGraphDetail: r
	});
	let s = [];
	o && (Er(), ps(k.hosts), s.push(qr())), t && (a || !k.hostDetail) && (k.hostDetail = null, s.push(Yr(i)));
	try {
		await Promise.all(s);
	} catch (e) {
		W(`Load host detail failed: ${e.message}`, !0);
	}
}
function ps(e) {
	k.hosts = Array.isArray(e) ? e : [];
	let t = document.getElementById("hosts-body");
	t && (t.innerHTML = "", k.hosts.forEach((e) => {
		let n = document.createElement("tr");
		n.dataset.hostId = String(e.id || "");
		let r = document.createElement("td");
		r.className = "host-filter-cell";
		let i = document.createElement("button");
		i.type = "button", i.className = "icon-btn";
		let a = String(e.hostname || e.ip || `host ${e.id || ""}`).trim(), o = parseInt(k.servicesHostFilterId, 10) === parseInt(e.id, 10), s = o ? `Clear services filter for ${a}` : `Show services for ${a}`;
		i.title = s, i.setAttribute("aria-label", s), i.innerHTML = "<i class=\"fa-solid fa-filter\" aria-hidden=\"true\"></i>", i.classList.toggle("is-active", o), i.addEventListener("click", async (t) => {
			t.stopPropagation(), await Mr(e.id || 0, a);
		}), r.appendChild(i), n.appendChild(r);
		let c = document.createElement("td"), l = document.createElement("span"), u = document.createElement("i"), d = bs(e.os || "");
		u.className = `${d.className} host-os-icon`, u.setAttribute("aria-hidden", "true");
		let f = String(e.raw_os || "").trim(), p = String(e.os || "").trim();
		u.title = f && p && f !== p ? `${d.label}; imported OS: ${f}` : d.label, l.className = "host-ip-with-icon", l.appendChild(u), l.appendChild(document.createTextNode(e.ip || "")), c.appendChild(l), n.appendChild(c), n.appendChild(H(e.hostname)), n.appendChild(H(e.status));
		let m = H(e.os);
		f && p && f !== p && (m.title = `Resolved from stronger service evidence. Imported OS: ${f}`), n.appendChild(m), n.appendChild(vr(e.categories || [])), n.appendChild(H(e.open_ports));
		let h = document.createElement("td");
		h.className = "host-actions";
		let g = Ma(`Run supported tool for ${a}`);
		g.addEventListener("click", async (t) => {
			t.stopPropagation(), await mo({
				hostId: Number(e.id) || 0,
				contextLabel: `Supported tools for ${a}`
			});
		}), h.appendChild(g), [
			"rescan",
			"refresh-screenshots",
			"dig-deeper",
			"remove"
		].forEach((t) => {
			h.appendChild(Na(t, e.id || ""));
		}), n.appendChild(h), t.appendChild(n);
	}), L("host-count", k.hosts.length), us(k.hosts), ds(), br(), Sr(), qn());
}
function ms(e, t) {
	let n = mr(t);
	if (!n.length) return !0;
	let r = new Set(n.map((e) => e.toLowerCase()));
	return Array.isArray(e?.services) && e.services.some((e) => r.has(String(e || "").trim().toLowerCase()));
}
function hs(e) {
	k.services = Array.isArray(e) ? e : [];
	let t = document.getElementById("services-body");
	if (!t) return;
	t.innerHTML = "", k.services.forEach((e) => {
		let n = document.createElement("tr"), r = document.createElement("td"), i = document.createElement("button");
		i.type = "button", i.className = "icon-btn", i.title = `Show hosts for ${e.service || "service"}`, i.setAttribute("aria-label", `Show hosts for ${e.service || "service"}`), i.innerHTML = "<i class=\"fa-solid fa-filter\" aria-hidden=\"true\"></i>", hr().map((e) => e.toLowerCase()).includes(String(e.service || "").trim().toLowerCase()) && i.classList.add("is-active"), i.addEventListener("click", async () => {
			await kr(e.service || "");
		}), r.className = "service-filter-cell", r.appendChild(i), n.appendChild(r), n.appendChild(H(e.service || "")), n.appendChild(H(Array.isArray(e.ports) ? e.ports.join(", ") : "")), n.appendChild(H(e.host_count || 0)), n.appendChild(H(e.port_count || 0)), n.appendChild(H(Array.isArray(e.protocols) ? e.protocols.join(",") : "")), n.appendChild(vr(e.categories || []));
		let a = document.createElement("td"), o = Ma(`Run supported tool for ${e.service || "service"}`);
		o.addEventListener("click", async () => {
			await mo({
				hostId: Number(k.servicesHostFilterId) || 0,
				service: String(e.service || "").trim(),
				contextLabel: k.servicesHostFilterId ? `Supported tools for ${e.service || "service"} on ${k.servicesHostFilterLabel || "selected host"}` : `Supported tools for ${e.service || "service"}`
			});
		}), a.appendChild(o), n.appendChild(a), t.appendChild(n);
	}), L("service-count", k.services.length);
	let n = document.getElementById("services-scope-label");
	if (n) {
		let e = String(k.servicesHostFilterLabel || "").trim();
		n.textContent = e ? `for ${e}` : "all hosts", n.hidden = !1;
	}
	Sr();
}
function gs(e) {
	let t = document.getElementById("services-panel-body"), n = document.getElementById("services-panel-toggle-button");
	if (!t || !n) return;
	let r = !!e;
	t.hidden = r, n.classList.toggle("is-collapsed", r), n.setAttribute("aria-expanded", r ? "false" : "true"), n.title = r ? "Show Services" : "Hide Services", n.setAttribute("aria-label", r ? "Show Services" : "Hide Services");
}
function _s() {
	let e = document.getElementById("services-panel-body");
	e && gs(!e.hidden);
}
function vs(e) {
	let t = document.getElementById("graph-panel-body"), n = document.getElementById("graph-panel-toggle-button");
	if (!t || !n) return;
	let r = !!e;
	t.hidden = r, n.classList.toggle("is-collapsed", r), n.setAttribute("aria-expanded", r ? "false" : "true"), n.title = r ? "Show Graph Workspace" : "Hide Graph Workspace", n.setAttribute("aria-label", r ? "Show Graph Workspace" : "Hide Graph Workspace");
}
function ys() {
	let e = document.getElementById("graph-panel-body");
	e && vs(!e.hidden);
}
function bs(e) {
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
function xs(e) {
	k.tools = Array.isArray(e) ? e : [];
	let t = document.getElementById("tools-body");
	t && (t.innerHTML = "", k.tools.forEach((e) => {
		let n = document.createElement("tr");
		n.dataset.toolId = String(e.tool_id || ""), n.appendChild(H(e.label || "")), n.appendChild(H(e.tool_id || "")), n.appendChild(H(e.run_count || 0)), n.appendChild(H(e.last_status || "")), n.appendChild(H(Array.isArray(e.danger_categories) ? e.danger_categories.join(",") : "")), t.appendChild(n);
	})), k.manualToolTargets.length || ao(k.tools), L("tool-count", k.tools.length);
}
// ../app/web/static/js/workspace/graph_data.js
function Ss(e, t) {
	let n = fn(e === "node" ? "node" : "edge", t), r = e === "node" ? ba(n) : 0;
	if (r > 0) {
		let e = String(k.selectedHostId || "") !== String(r);
		k.selectedHostId = r, ds({ syncGraph: !1 }), (e || !k.hostDetail) && (k.hostDetail = null, Yr(r).catch((e) => {
			W(`Load host detail failed: ${e.message}`, !0);
		}));
	}
	A.selectedKind = String(e || ""), A.selectedRef = String(t || ""), A.selectedPayload = null, A.relatedContent = [], ss(), Mo().catch(() => {});
}
async function Cs({ force: e = !1 } = {}) {
	if (!gn()) return;
	if (A.metadataLoaded && !e) {
		Kn();
		return;
	}
	let [t, n] = await Promise.all([Ke("/api/graph/layouts"), Ke("/api/graph/annotations")]);
	A.layouts = Array.isArray(t?.layouts) ? t.layouts : [], A.annotations = Array.isArray(n?.annotations) ? n.annotations : [], A.metadataLoaded = !0;
	let r = String(V("graph-view-select") || A.viewId || "attack_surface").trim();
	if (!A.activeLayoutId) {
		let e = A.layouts.find((e) => String(e?.view_id || "") === r && String(e?.name || "").trim().toLowerCase() === "default") || A.layouts.find((e) => String(e?.view_id || "") === r);
		A.activeLayoutId = String(e?.layout_id || ""), e?.layout?.positions && typeof e.layout.positions == "object" && (A.positions = { ...e.layout.positions }), e?.layout?.pinned_node_ids && typeof e.layout.pinned_node_ids == "object" && (A.pinnedNodeIds = { ...e.layout.pinned_node_ids });
	}
	Kn();
}
async function ws({ background: e = !1, forceMetadata: t = !1 } = {}) {
	if (gn()) {
		if (A.loading) A.needsRefresh = !0;
		else {
			A.loading = !0, e || q("Loading graph...");
			try {
				(!A.metadataLoaded || t) && await Cs({ force: t });
				let n = is(), r = new URLSearchParams();
				r.set("filter", String(n.hostFilter || "hide_down")), (Array.isArray(n.serviceFilters) ? n.serviceFilters : []).forEach((e) => {
					r.append("service", e);
				}), n.category && r.set("category", n.category), n.hostId > 0 && r.set("host_id", String(n.hostId)), n.nodeType && r.set("node_type", n.nodeType), n.edgeType && r.set("edge_type", n.edgeType), n.sourceKind && r.set("source_kind", n.sourceKind), n.search && r.set("q", n.search), n.minConfidence > 0 && r.set("min_confidence", String(n.minConfidence)), n.hideAiSuggested && r.set("hide_ai_suggested", "true"), n.hideNmapXmlArtifacts && r.set("hide_nmap_xml_artifacts", "true"), r.set("limit_nodes", "8000"), r.set("limit_edges", "24000");
				let i = await Ke(`/api/graph?${r.toString()}`);
				A.data = {
					nodes: Array.isArray(i?.nodes) ? i.nodes : [],
					edges: Array.isArray(i?.edges) ? i.edges : [],
					meta: i?.meta || {}
				}, Jn(), Kn(), ss({ preserveDetail: e && !!A.selectedKind }), A.selectedKind !== "node" || !A.selectedRef || e && Array.isArray(A.relatedContent) && A.relatedContent.length || Mo().catch(() => {}), e || q(`Graph loaded: ${A.filtered.nodes.length} nodes, ${A.filtered.edges.length} edges`);
			} catch (e) {
				q(`Graph load failed: ${e.message}`, !0);
			} finally {
				A.loading = !1, A.needsRefresh && (A.needsRefresh = !1, ws({ background: !0 }).catch(() => {}));
			}
		}
	}
}
function Ts(e = 900) {
	gn() && (A.refreshTimer && window.clearTimeout(A.refreshTimer), A.refreshTimer = window.setTimeout(() => {
		A.refreshTimer = null, ws({ background: !0 }).catch(() => {});
	}, Math.max(100, Number(e) || 900)));
}
async function Es() {
	await ws({ background: !1 });
}
async function Ds() {
	let e = parseInt(V("graph-host-filter"), 10);
	q("Rebuilding graph...");
	try {
		let t = await G("/api/graph/rebuild", { host_id: Number.isFinite(e) && e > 0 ? e : 0 });
		q(`Graph rebuilt: ${Number(t?.mutation_count || 0)} mutations`), await ws({
			background: !1,
			forceMetadata: !0
		});
	} catch (e) {
		q(`Graph rebuild failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/live_updates.js
var Os;
function ks(e) {
	for (let t of ["renderCredentialCapturePanel"]) if (typeof e[t] != "function") throw TypeError(`Missing live_updates callback: ${t}`);
	({renderCredentialCapturePanel: Os} = e);
}
function As(e) {
	if (e) {
		if (e.project && Ve(e.project), e.summary && Wt(e.summary), Er(), Array.isArray(e.hosts)) {
			let t = String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down", n = hr();
			t !== "show_all" && ps(n.length ? e.hosts.filter((e) => ms(e, n)) : e.hosts);
		}
		if (Array.isArray(e.services) && (parseInt(k.servicesHostFilterId, 10) > 0 || hs(e.services)), Array.isArray(e.tools) && !k.toolsHydrated && xs(e.tools), e.tools_meta && typeof e.tools_meta == "object") {
			let t = Number(e.tools_meta.total || 0);
			Number.isFinite(t) && t >= 0 && (L("tool-count", t), k.toolsHydrated && !k.toolsLoading && t !== k.tools.length && Jr().catch(() => {}));
		}
		if (Array.isArray(e.processes) && ct(e.processes), e.credential_capture && typeof e.credential_capture == "object" && Os(e.credential_capture), e.scheduler) {
			let t = e.scheduler.engagement_policy || {};
			L("scheduler-mode", e.scheduler.mode || ""), L("scheduler-goal", t.preset_label || t.preset || e.scheduler.goal_profile || ""), L("scheduler-families", e.scheduler.preapproved_families_count || 0);
		}
		Array.isArray(e.scheduler_rationale_feed) && Yt(e.scheduler_rationale_feed), Array.isArray(e.scheduler_decisions) && Zt(e.scheduler_decisions), Array.isArray(e.scheduler_approvals) && Qt(e.scheduler_approvals), Array.isArray(e.jobs) && $t(e.jobs), Array.isArray(e.scan_history) && en(e.scan_history), k.selectedHostId && !k.hostDetail && Yr(k.selectedHostId).catch(() => {}), Ts();
	}
}
function js(e) {
	return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${e}`;
}
function Ms(e, t) {
	let n = document.getElementById("live-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
async function Ns(e) {
	let t = new Set((e || []).map((e) => String(e || "").trim()).filter(Boolean));
	if (!t.size) return;
	let n = [], r = t.has("hosts"), i = t.has("services"), a = k.selectedHostId && (r || i || t.has("graph"));
	t.has("overview") && n.push(tn()), r ? (n.push(Kr()), parseInt(k.servicesHostFilterId, 10) > 0 && !i && n.push(qr())) : i && n.push(qr()), t.has("processes") && n.push(nn()), t.has("jobs") && n.push(an()), t.has("approvals") && n.push(ln()), t.has("decisions") && n.push(rn()), t.has("scan_history") && n.push(on()), t.has("tools") && k.toolsHydrated && n.push(Jr({ force: !0 })), t.has("graph") && n.push(ws({ background: !0 })), a && n.push(Yr(k.selectedHostId)), n.length && await Promise.all(n.map((e) => Promise.resolve(e).catch(() => {})));
}
function Ps(e) {
	(e || []).forEach((e) => {
		let t = String(e || "").trim();
		t && ve.pendingChannels.add(t);
	}), ve.timer || ve.running || (ve.timer = window.setTimeout(async () => {
		if (ve.timer = null, !ve.running) {
			ve.running = !0;
			try {
				for (; ve.pendingChannels.size;) {
					let e = Array.from(ve.pendingChannels);
					ve.pendingChannels.clear(), await Ns(e);
				}
			} finally {
				ve.running = !1;
			}
		}
	}, 60));
}
function Fs() {
	let e = new WebSocket(js("/ws/snapshot"));
	e.onopen = () => Ms("Live", !1), e.onmessage = (e) => {
		try {
			let t = JSON.parse(e.data);
			if (t && t.type === "invalidate") {
				Ir(t.channels || []), Ps(t.channels || []);
				return;
			}
			if (t && t.type === "heartbeat") return;
			As(t);
		} catch {
			Ms("Decode Error", !0);
		}
	}, e.onerror = () => Ms("Socket Error", !0), e.onclose = () => {
		Ms("Reconnecting", !0), window.setTimeout(Fs, 1500);
	};
}
async function Is() {
	try {
		let e = await fetch("/api/snapshot", { cache: "no-store" });
		if (!e.ok) {
			Ms("Polling Error", !0);
			return;
		}
		As(await e.json());
	} catch {
		Ms("Polling Error", !0);
	}
}
// ../app/web/static/js/workspace/tool_settings.js
var Ls;
function Rs(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing tool_settings callback: ${t}`);
	({applySchedulerPreferences: Ls} = e);
}
function zs(e, t = !1) {
	let n = document.getElementById("settings-tool-audit-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function Bs(e, t = !1) {
	let n = document.getElementById("settings-tool-install-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function Vs(e, t = !1) {
	let n = document.getElementById("interface-settings-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function Hs(e) {
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
function Us(e) {
	let t = !!e;
	window.LEGION_COLORFUL_ASCII_BACKGROUND_ENABLED = t, document.body?.classList.toggle("colorful-background", t), z("interface-colorful-ascii-background", t), Hs(t);
}
function Ws(e) {
	let t = !!e, n = document.getElementById("graph-workspace-panel"), r = document.getElementById("graph-workspace-shell"), i = document.getElementById("graph-workspace-disabled-state");
	n && (n.dataset.graphEnabled = t ? "true" : "false", n.hidden = !t), r && (r.hidden = !t), i && (i.hidden = t), z("interface-graph-workspace-enabled", t), t ? ws({ background: !1 }).catch(() => {}) : (A.loading = !1, Co());
}
function Gs(e) {
	let t = !!e;
	Ae.panelEnabled = t;
	let n = document.getElementById("credential-capture-panel"), r = document.getElementById("ribbon-credential-capture-toggle-button");
	n && (n.hidden = !t), r && (r.setAttribute("aria-pressed", t ? "true" : "false"), r.classList.toggle("is-active", t), r.title = `${t ? "Hide" : "Show"} Responder / NTLM Relay panel`), z("interface-credential-capture-panel-enabled", t);
}
async function Ks() {
	let e = !Ae.panelEnabled;
	da(), W(`${e ? "Showing" : "Hiding"} Responder / NTLM Relay panel...`);
	try {
		let t = await G("/api/scheduler/preferences", { feature_flags: { credential_capture_panel: e } });
		Ls(t), W(`Responder / NTLM Relay panel ${e ? "enabled" : "hidden"}`);
	} catch (e) {
		W(`Responder / NTLM Relay toggle failed: ${e.message}`, !0);
	}
}
function qs() {
	let e = document.getElementById("settings-tool-install-platform");
	return String(e?.value || j.recommendedPlatform || "kali").trim().toLowerCase() === "ubuntu" ? "ubuntu" : "kali";
}
function Js(e = "") {
	let t = document.getElementById("settings-tool-install-platform");
	if (!t) return "kali";
	let n = String(t.value || "").trim().toLowerCase(), r = String(e || j.recommendedPlatform || "kali").trim().toLowerCase();
	return t.dataset.userSelected === "true" && (n === "kali" || n === "ubuntu") ? n : r === "ubuntu" ? (t.value = "ubuntu", "ubuntu") : (t.value = "kali", "kali");
}
function Ys(e) {
	j.plan = e || null;
	let t = e || {};
	R("settings-tool-install-script", String(t?.script || ""));
	let n = Number(t?.command_count || 0), r = Number(t?.manual_count || 0), i = String(t?.platform || qs() || "kali");
	if (!n && !r) {
		Bs(`No missing tool installs are queued for ${i}.`);
		return;
	}
	let a = `${n} install command${n === 1 ? "" : "s"} queued for ${i}`;
	r > 0 && (a += `; ${r} tool${r === 1 ? "" : "s"} still require manual follow-up`), Bs(a);
}
function Xs(e) {
	let t = document.getElementById("settings-tool-audit-body");
	if (!t) return;
	let n = Array.isArray(e) ? e : [];
	t.innerHTML = n.length ? n.map((e) => {
		let t = String(e?.status || "unknown"), n = e?.resolved_path || e?.configured_value || "-", r = t === "installed" ? "tool-audit-status-ok" : t === "configured-missing" ? "tool-audit-status-warn" : "tool-audit-status-missing";
		return `
            <tr>
                <td>
                    <strong>${Be(e?.label || e?.key || "tool")}</strong>
                    <div class="meta-note">${Be(e?.purpose || "")}</div>
                    ${e?.notes ? `<div class="meta-note">${Be(e.notes)}</div>` : ""}
                </td>
                <td>${Be(e?.category || "")}</td>
                <td><span class="${r}">${Be(t)}</span></td>
                <td><code>${Be(n)}</code></td>
                <td><code>${Be(e?.kali_install || "-")}</code></td>
                <td><code>${Be(e?.ubuntu_install || "-")}</code></td>
            </tr>
        `;
	}).join("") : "<tr><td colspan=\"6\" class=\"empty-cell\">No tool audit data.</td></tr>";
}
async function Zs() {
	zs("Checking tools...");
	try {
		let e = await Ke("/api/settings/tool-audit");
		Xs(e?.tools || []), j.recommendedPlatform = String(e?.recommended_platform || "kali").trim().toLowerCase() === "ubuntu" ? "ubuntu" : "kali", j.supportedPlatforms = Array.isArray(e?.supported_platforms) && e.supported_platforms.length ? e.supported_platforms : ["kali", "ubuntu"], Js(j.recommendedPlatform);
		let t = e?.summary || {};
		zs(`Installed ${t.installed || 0}/${t.total || 0}; missing ${t.missing || 0}; configured missing ${t.configured_missing || 0}`), await Qs(!1);
	} catch (e) {
		Xs([]), Ys(null), zs(`Tool audit failed: ${e.message}`, !0), Bs(`Install plan unavailable: ${e.message}`, !0);
	}
}
async function Qs(e = !0) {
	e && Bs("Building install plan...");
	let t = qs();
	try {
		Ys(await Ke(`/api/settings/tool-audit/install-plan?platform=${encodeURIComponent(t)}&scope=missing`) || {});
	} catch (e) {
		Ys(null), Bs(`Install plan failed: ${e.message}`, !0);
	}
}
async function $s() {
	let e = String(V("settings-tool-install-script") || "");
	if (e.trim() || (await Qs(!1), e = String(V("settings-tool-install-script") || "")), !e.trim()) Bs("No install script is available to copy.", !0);
	else try {
		if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(e);
		else {
			let t = document.createElement("textarea");
			t.value = e, t.setAttribute("readonly", "readonly"), t.style.position = "absolute", t.style.left = "-9999px", document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t);
		}
		Bs("Install script copied to clipboard.");
	} catch (e) {
		Bs(`Copy failed: ${e.message}`, !0);
	}
}
async function ec() {
	let e = qs();
	Bs("Queueing install job...");
	try {
		let t = await G("/api/settings/tool-audit/install", {
			platform: e,
			scope: "missing"
		}), n = Number(t?.job?.id || 0);
		Bs(n > 0 ? `Install queued as job #${n}. Use Logging > Jobs to monitor progress.` : "Install job queued. Use Logging > Jobs to monitor progress.");
	} catch (e) {
		Bs(`Install failed to queue: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/credential_capture.js
function tc(e) {
	let t = document.getElementById("credentials-modal");
	t && (Ae.modalOpen = !!e, I.credentialsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function nc(e) {
	let t = document.getElementById("credential-capture-config-modal");
	t && (Ae.configModalOpen = !!e, I.credentialCaptureConfigOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function rc(e) {
	let t = document.getElementById("credential-capture-recent-list");
	if (!t) return;
	t.innerHTML = "";
	let n = Array.isArray(e) ? e : [];
	if (n.length) n.forEach((e) => {
		let n = document.createElement("div");
		n.className = "credential-capture-recent-item";
		let r = document.createElement("strong");
		r.textContent = String(e?.username || "").trim() || "unknown-user", n.appendChild(r);
		let i = document.createElement("span");
		i.textContent = String(e?.source || e?.tool || "").trim() || "unknown source", n.appendChild(i);
		let a = document.createElement("small");
		a.textContent = String(e?.capturedAt || "").trim(), n.appendChild(a), t.appendChild(n);
	});
	else {
		let e = document.createElement("p");
		e.className = "meta-note credential-capture-empty", e.textContent = "No captured credentials yet.", t.appendChild(e);
	}
}
function ic(e) {
	let t = e && typeof e == "object" ? e : {};
	Ae.panelEnabled = t.panel_enabled !== !1, Ae.responder = t.responder || {
		config: {},
		session: {}
	}, Ae.ntlmrelayx = t.ntlmrelayx || {
		config: {},
		session: {}
	}, L("credential-capture-count", Number(t.capture_count || 0)), L("credential-capture-hash-count", Number(t.unique_hash_count || 0)), L("credential-capture-responder-status", String(t?.responder?.session?.status || "Idle").trim() || "Idle"), L("credential-capture-ntlmrelayx-status", String(t?.ntlmrelayx?.session?.status || "Idle").trim() || "Idle"), R("credential-capture-responder-mode-quick", String(t?.responder?.config?.mode || "active").trim().toLowerCase() === "passive" ? "passive" : "active");
	let n = String(t?.responder?.config?.interface_name || "").trim(), r = (t?.responder?.session || {})?.progress?.summary || "";
	L("credential-capture-responder-meta", r ? `Interface: ${n || "not configured"} | ${r}` : `Interface: ${n || "not configured"}`);
	let i = t?.ntlmrelayx?.config || {}, a = String(i.target || i.targets_file || "").trim(), o = (t?.ntlmrelayx?.session || {})?.progress?.summary || "";
	L("credential-capture-ntlmrelayx-meta", o ? `Target: ${a || "not configured"} | ${o}` : `Target: ${a || "not configured"}`), rc(t.recent_captures || []), Gs(t.panel_enabled !== !1);
}
function ac(e) {
	let t = e && typeof e == "object" ? e : {};
	Ae.captures = Array.isArray(t.captures) ? t.captures : [], Ae.dedupedHashes = Array.isArray(t.deduped_hashes) ? t.deduped_hashes : [], L("credentials-modal-meta", `${Number(t.capture_count || Ae.captures.length || 0)} captures | ${Ae.dedupedHashes.length} unique hashes`);
	let n = document.getElementById("credential-captures-body");
	if (n) {
		if (n.innerHTML = "", !Ae.captures.length) {
			let e = document.createElement("tr"), t = document.createElement("td");
			t.colSpan = 6, t.textContent = "No captured credentials yet.", e.appendChild(t), n.appendChild(e);
		} else Ae.captures.forEach((e) => {
			let t = document.createElement("tr");
			t.appendChild(H(e.capturedAt || "")), t.appendChild(H(e.tool || "")), t.appendChild(H(e.source || "")), t.appendChild(H(e.username || "")), t.appendChild(H(e.hash || "")), t.appendChild(H(e.details || "")), n.appendChild(t);
		});
	}
}
function oc(e, t = "") {
	let n = document.getElementById("credential-config-responder-interface");
	if (!n) return;
	let r = e && typeof e == "object" ? e : {}, i = Array.isArray(r.interfaces) ? r.interfaces : [], a = String(r.default_interface || "").trim(), o = String(t || a || "").trim();
	n.innerHTML = "";
	let s = document.createElement("option");
	s.value = "", s.textContent = i.length ? "Auto-detect primary interface" : "No interfaces detected", n.appendChild(s), i.forEach((e) => {
		let t = document.createElement("option");
		t.value = String(e?.name || "").trim(), t.textContent = String(e?.label || e?.name || "").trim(), n.appendChild(t);
	}), R("credential-config-responder-interface", o);
}
async function sc() {
	let e = await Ke("/api/workspace/credential-capture");
	return ic(e || {}), e || {};
}
async function cc() {
	try {
		ac(await Ke("/api/workspace/credentials?limit=5000") || {}), tc(!0);
	} catch (e) {
		W(`Credential load failed: ${e.message}`, !0);
	}
}
async function lc() {
	await It((Ae.dedupedHashes || []).join("\n"), "Deduped hashes copied to clipboard", "No captured hashes to copy");
}
function uc(e = "txt") {
	let t = String(e || "txt").trim().toLowerCase() === "json" ? "json" : "txt";
	window.location.assign(`/api/workspace/credentials/download?format=${t}&t=${Date.now()}`);
}
function dc(e, t) {
	let n = e && typeof e == "object" ? e : {}, r = n?.responder?.config || {}, i = n?.ntlmrelayx?.config || {};
	oc(t, r.interface_name || ""), R("credential-config-responder-mode", r.mode || "active"), z("credential-config-responder-wpad", r.wpad !== !1), z("credential-config-responder-force-wpad-auth", r.force_wpad_auth !== !1), z("credential-config-responder-proxy-auth", !!r.proxy_auth), z("credential-config-responder-dhcp", !!r.dhcp), z("credential-config-responder-dhcp-dns", !!r.dhcp_dns), z("credential-config-responder-basic-auth", !!r.basic_auth), R("credential-config-responder-extra-args", r.extra_args || ""), R("credential-config-ntlmrelayx-target", i.target || ""), R("credential-config-ntlmrelayx-targets-file", i.targets_file || ""), R("credential-config-ntlmrelayx-interface-ip", i.interface_ip || ""), z("credential-config-ntlmrelayx-smb2support", i.smb2support !== !1), z("credential-config-ntlmrelayx-interactive", !!i.interactive), z("credential-config-ntlmrelayx-socks", !!i.socks), z("credential-config-ntlmrelayx-output-hashes", i.output_hashes !== !1), R("credential-config-ntlmrelayx-extra-args", i.extra_args || "");
}
function fc() {
	return {
		responder: {
			interface_name: V("credential-config-responder-interface").trim(),
			mode: V("credential-config-responder-mode").trim() || "active",
			wpad: B("credential-config-responder-wpad"),
			force_wpad_auth: B("credential-config-responder-force-wpad-auth"),
			proxy_auth: B("credential-config-responder-proxy-auth"),
			dhcp: B("credential-config-responder-dhcp"),
			dhcp_dns: B("credential-config-responder-dhcp-dns"),
			basic_auth: B("credential-config-responder-basic-auth"),
			extra_args: V("credential-config-responder-extra-args").trim()
		},
		ntlmrelayx: {
			target: V("credential-config-ntlmrelayx-target").trim(),
			targets_file: V("credential-config-ntlmrelayx-targets-file").trim(),
			interface_ip: V("credential-config-ntlmrelayx-interface-ip").trim(),
			smb2support: B("credential-config-ntlmrelayx-smb2support"),
			interactive: B("credential-config-ntlmrelayx-interactive"),
			socks: B("credential-config-ntlmrelayx-socks"),
			output_hashes: B("credential-config-ntlmrelayx-output-hashes"),
			extra_args: V("credential-config-ntlmrelayx-extra-args").trim()
		}
	};
}
async function pc() {
	L("credential-capture-config-status", "Loading...");
	try {
		let [e, t] = await Promise.all([Ke("/api/workspace/credential-capture"), Ke("/api/network/interfaces")]);
		ic(e || {}), dc(e || {}, t || {}), L("credential-capture-config-status", "Loaded"), nc(!0);
	} catch (e) {
		W(`Credential capture config load failed: ${e.message}`, !0);
	}
}
async function mc(e) {
	e && e.preventDefault(), L("credential-capture-config-status", "Saving...");
	try {
		ic(await G("/api/workspace/credential-capture/config", fc()) || {}), L("credential-capture-config-status", "Saved");
	} catch (e) {
		L("credential-capture-config-status", `Save failed: ${e.message}`), W(`Credential capture config save failed: ${e.message}`, !0);
	}
}
async function hc() {
	let e = String(V("credential-capture-responder-mode-quick") || "active").trim().toLowerCase() === "passive" ? "passive" : "active";
	try {
		ic(await G("/api/workspace/credential-capture/config", { responder: { mode: e } }) || {}), W(`Responder mode set to ${e}`);
	} catch (e) {
		W(`Responder mode update failed: ${e.message}`, !0);
	}
}
function gc(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "responder" ? Number(Ae?.responder?.session?.process_id || 0) : t === "ntlmrelayx" ? Number(Ae?.ntlmrelayx?.session?.process_id || 0) : 0;
}
async function _c(e) {
	let t = gc(e);
	t ? await Et(t) : W(`No ${e} session log available`, !0);
}
function vc(e) {
	let t = String(e || "").trim().toLowerCase();
	t && window.location.assign(`/api/workspace/credential-capture/log?tool=${encodeURIComponent(t)}&t=${Date.now()}`);
}
async function yc(e) {
	try {
		W(`${e} queued (job ${(await G("/api/workspace/credential-capture/start", { tool: e }))?.job?.id || "?"})`), await Is(), await sc();
	} catch (t) {
		W(`Start ${e} failed: ${t.message}`, !0);
	}
}
async function bc(e) {
	try {
		(await G("/api/workspace/credential-capture/stop", { tool: e }))?.stopped ? W(`${e} stop requested`) : W(`${e} is not running`, !0), await Is(), await sc();
	} catch (t) {
		W(`Stop ${e} failed: ${t.message}`, !0);
	}
}
// ../app/web/static/js/workspace/scan.js
var xc;
function Sc(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing scan callback: ${t}`);
	({applySchedulerPreferences: xc} = e);
}
function Cc(e) {
	return (e || "").split(/[\s,]+/).map((e) => e.trim()).filter((e) => e.length > 0);
}
function wc() {
	let e = document.querySelector("input[name='nmap-scan-mode']:checked");
	return e ? String(e.value || "rfc1918_discovery") : "rfc1918_discovery";
}
function Tc(e, t = "T3") {
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
function Ec(e, t = 1e3) {
	let n = parseInt(e, 10);
	return Number.isFinite(n) ? Math.min(65535, Math.max(1, n)) : t;
}
function Dc() {
	let e = wc(), t = /* @__PURE__ */ new Set();
	return e === "rfc1918_discovery" ? (B("nmap-rfc-10") && t.add("10.0.0.0/8"), B("nmap-rfc-172") && t.add("172.16.0.0/12"), B("nmap-rfc-192") && t.add("192.168.0.0/16"), Array.from(t)) : (Cc(V("nmap-targets")).forEach((e) => t.add(e)), Array.from(t));
}
function Oc() {
	let e = document.getElementById("nmap-rfc-profile");
	return (e ? String(e.value || "quick").trim().toLowerCase() : "quick") === "comprehensive" ? "comprehensive" : "quick";
}
function kc(e) {
	return e === "comprehensive" ? _e : ge;
}
function Ac() {
	let e = document.getElementById("nmap-rfc-chunk-concurrency"), t = parseInt(e ? String(e.value || "1").trim() : "1", 10);
	return Number.isFinite(t) ? Math.max(1, Math.min(t, 4)) : 1;
}
function jc(e) {
	if (e === "easy") {
		let e = bi(yi());
		return {
			discovery: B("nmap-easy-discovery"),
			skip_dns: B("nmap-easy-skip-dns"),
			force_pn: B("nmap-easy-force-pn"),
			timing: Tc(V("nmap-easy-timing"), "T3"),
			top_ports: e ? 0 : Ec(V("nmap-easy-top-ports"), 1e3),
			explicit_ports: e ? ge : "",
			service_detection: B("nmap-easy-service-detection"),
			default_scripts: B("nmap-easy-default-scripts"),
			os_detection: B("nmap-easy-os-detection"),
			aggressive: !1,
			full_ports: !1,
			vuln_scripts: !1,
			host_discovery_only: !1,
			arp_ping: !1
		};
	}
	if (e === "hard") return {
		discovery: B("nmap-hard-discovery"),
		skip_dns: B("nmap-hard-skip-dns"),
		force_pn: B("nmap-hard-force-pn"),
		timing: Tc(V("nmap-hard-timing"), "T4"),
		top_ports: Ec(V("nmap-hard-top-ports"), 1e3),
		service_detection: B("nmap-hard-service-detection"),
		default_scripts: B("nmap-hard-default-scripts"),
		os_detection: B("nmap-hard-os-detection"),
		aggressive: B("nmap-hard-aggressive"),
		full_ports: B("nmap-hard-full-ports"),
		vuln_scripts: B("nmap-hard-vuln-scripts"),
		host_discovery_only: !1,
		arp_ping: !1
	};
	let t = B("nmap-rfc-host-discovery-only"), n = Oc();
	return {
		discovery: B("nmap-rfc-discovery"),
		host_discovery_only: t,
		skip_dns: B("nmap-rfc-skip-dns"),
		arp_ping: B("nmap-rfc-arp-ping"),
		force_pn: !1,
		timing: Tc(V("nmap-rfc-timing"), "T3"),
		top_ports: 0,
		explicit_ports: t ? "" : kc(n),
		scan_profile: n,
		chunk_concurrency: Ac(),
		service_detection: B("nmap-rfc-service-detection"),
		default_scripts: B("nmap-rfc-default-scripts"),
		os_detection: B("nmap-rfc-os-detection"),
		aggressive: !1,
		full_ports: !1,
		vuln_scripts: !1
	};
}
function Mc() {
	return [
		B("nmap-rfc-10"),
		B("nmap-rfc-172"),
		B("nmap-rfc-192")
	].filter(Boolean).length;
}
function Nc(e) {
	[
		"nmap-rfc-10",
		"nmap-rfc-172",
		"nmap-rfc-192"
	].forEach((t) => {
		let n = document.getElementById(t);
		n && (n.disabled = !e);
	});
}
function Pc(e) {
	e === "rfc1918_discovery" ? (z("nmap-rfc-discovery", !0), z("nmap-rfc-host-discovery-only", !0), z("nmap-rfc-arp-ping", !1), z("nmap-rfc-skip-dns", !0), R("nmap-rfc-timing", "T3"), R("nmap-rfc-profile", "quick"), R("nmap-rfc-chunk-concurrency", "1"), z("nmap-rfc-service-detection", !1), z("nmap-rfc-default-scripts", !1), z("nmap-rfc-os-detection", !1), z("nmap-rfc-force-pn", !1), z("nmap-rfc-10", !0), z("nmap-rfc-172", !0), z("nmap-rfc-192", !0), Nc(!0)) : (z("nmap-rfc-10", !1), z("nmap-rfc-172", !1), z("nmap-rfc-192", !1), z("nmap-rfc-force-pn", !1), Nc(!1));
}
function Fc(e) {
	let t = document.getElementById(e);
	if (!t || t.disabled) return !0;
	let n = String(t.value || "").trim();
	if (!n) return !1;
	let r = parseInt(n, 10);
	return Number.isInteger(r) && r >= 1 && r <= 65535;
}
function Ic() {
	let e = wc();
	if (e === "passive_capture") {
		if (!xi(yi())) return {
			valid: !1,
			reason: "Passive Capture is available only for internal engagement presets."
		};
		if (!String(V("passive-capture-interface") || "").trim()) return {
			valid: !1,
			reason: "Select a capture interface."
		};
		let e = Si();
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
	let t = (e === "rfc1918_discovery" ? [] : Cc(V("nmap-targets"))).length > 0, n = e === "rfc1918_discovery" && Mc() > 0;
	return !t && !n ? {
		valid: !1,
		reason: "Add targets, or select RFC1918 ranges in RFC1918 mode."
	} : Dc().length ? e === "easy" ? !bi(yi()) && !Fc("nmap-easy-top-ports") ? {
		valid: !1,
		reason: "Easy mode Top Ports must be 1-65535."
	} : {
		valid: !0,
		reason: ""
	} : e === "hard" && !B("nmap-hard-full-ports") && !Fc("nmap-hard-top-ports") ? {
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
function Lc() {
	let e = document.getElementById("nmap-scan-button");
	if (!e) return;
	let t = Ic(), n = !Me.postSubmitLock;
	e.disabled = !t.valid || !n, e.title = n ? t.valid ? "" : t.reason : "Enter scan inputs to enable this action.";
}
function Rc(e) {
	let t = String(e || "").trim();
	return t ? (t.match(/(?:[^\s"'`]+|"[^"]*"|'[^']*')+/g) || []).map((e) => e.trim()).map((e) => e.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")).filter((e) => e.length > 0) : [];
}
function zc(e) {
	return (e || []).map((e) => {
		let t = String(e ?? "");
		return t ? /^[A-Za-z0-9_./:=@-]+$/.test(t) ? t : `'${t.replace(/'/g, "'\\''")}'` : "''";
	}).join(" ");
}
function Bc() {
	let e = document.getElementById("nmap-command-preview");
	if (!e) return;
	let t = wc(), n = document.getElementById("nmap-scan-button"), r = document.getElementById("nmap-run-actions-label"), i = document.getElementById("nmap-args-label");
	if (n && (n.textContent = t === "passive_capture" ? "Start Passive Capture Job" : "Start Nmap Scan Job"), r && (r.lastChild.textContent = t === "passive_capture" ? " Run scripted actions after spawned Easy scans" : " Run scripted actions after scan"), i && (i.hidden = t === "passive_capture"), t === "passive_capture") {
		e.textContent = `Command Preview: ${zc([
			"tshark",
			"-i",
			String(V("passive-capture-interface") || "<interface>").trim() || "<interface>",
			"-n",
			"-q",
			"-a",
			`duration:${Si() * 60}`,
			"-f",
			"arp or broadcast or multicast or udp port 67 or udp port 68 or udp port 137 or udp port 138 or udp port 5353 or udp port 5355 or udp port 1900",
			"-w",
			"<output_prefix>.pcapng"
		])}  |  Then queue Easy scans for discovered internal networks`, Lc();
		return;
	}
	let a = Dc(), o = jc(t), s = Rc(V("nmap-args").trim()), c = s.some((e) => {
		let t = String(e || "").trim().toLowerCase();
		return t === "--stats-every" || t.startsWith("--stats-every=");
	}), l = s.some((e) => {
		let t = String(e || "").trim().toLowerCase();
		return t === "-v" || t === "-vv" || t === "-vvv" || t === "--verbose";
	}), u = a.length ? a : ["<targets>"], d = ["nmap"];
	o.host_discovery_only ? (d.push("-sn"), o.skip_dns && d.push("-n"), o.arp_ping && d.push("-PR"), d.push(`-${Tc(o.timing, "T3")}`)) : ((o.force_pn || !o.discovery) && d.push("-Pn"), o.skip_dns && d.push("-n"), d.push(`-${Tc(o.timing, "T3")}`), o.full_ports ? d.push("-p-") : String(o.explicit_ports || "").trim() ? d.push("-p", String(o.explicit_ports || "").trim()) : d.push("--top-ports", String(Ec(o.top_ports, 1e3))), o.aggressive ? d.push("-A") : (o.service_detection && d.push("-sV"), o.default_scripts && d.push("-sC"), o.os_detection && d.push("-O")), o.vuln_scripts && d.push("--script", "vuln"));
	let f = c ? s : [
		...s,
		"--stats-every",
		"15s"
	];
	l || (f = [...f, "-vv"]), d.push(...f, ...u, "-oA", "<output_prefix>"), e.textContent = `Command Preview: ${zc(d)}`, Lc();
}
function Vc() {
	let e = yi(), t = bi(e), n = e !== Me.lastEngagementPreset, r = document.getElementById("nmap-easy-top-ports"), i = document.getElementById("nmap-easy-top-ports-label"), a = document.getElementById("nmap-easy-preset-note"), o = document.getElementById("nmap-easy-service-detection"), s = document.getElementById("nmap-easy-default-scripts");
	n && (o && (o.checked = !t), s && (s.checked = !t)), r && (r.disabled = t), i && (i.hidden = t), a && (a.hidden = !t, a.textContent = t ? `Internal Quick Recon uses a curated TCP port list instead of Top Ports: ${ge}. Add UDP-specific follow-up separately if needed.` : ""), Me.lastEngagementPreset = e;
}
function Hc(e) {
	let t = Math.max(1, Math.min(4, parseInt(e, 10) || 1));
	Me.step = t, [
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
	n && (n.disabled = t <= 1), r && (r.disabled = t >= 4, r.style.display = t >= 4 ? "none" : ""), Lc();
}
function Uc() {
	let e = wc();
	e !== Me.lastMode && (Pc(e), Me.lastMode = e), document.querySelectorAll("[data-mode-options]").forEach((t) => {
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
	i && (i.disabled = B("nmap-hard-full-ports"));
	let a = B("nmap-rfc-host-discovery-only"), o = document.getElementById("nmap-rfc-discovery");
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
		let e = Oc(), t = Ac(), n = e === "comprehensive" ? "More comprehensive uses a broader common-internal-services TCP list" : "Quick uses the curated low-hanging-fruit TCP list", r = kc(e), i = `${t} chunk scan${t === 1 ? "" : "s"} at a time`;
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
	Vc(), Bc(), Lc();
}
async function Wc() {
	if (Me.postSubmitLock) {
		U("Scan failed: enter scan inputs before starting a job.", !0), Lc();
		return;
	}
	let e = Ic();
	if (!e.valid) {
		U(`Scan failed: ${e.reason}`, !0);
		let t = String(e.reason || "").toLowerCase();
		t.includes("target") || t.includes("rfc1918") || t.includes("interface") ? Hc(3) : Hc(4);
		return;
	}
	let t = Dc(), n = wc(), r = jc(n), i = !!r.discovery, a = Ci(yi(), { fallbackGoalProfile: V("scheduler-goal-select") || "internal_recon" });
	U("Queueing Nmap scan job...");
	try {
		let e = await G("/api/scheduler/preferences", {
			engagement_policy: a,
			goal_profile: ui(a)
		});
		xc(e);
		let o = (n === "passive_capture" ? await G("/api/scan/passive-capture", {
			interface_name: V("passive-capture-interface").trim(),
			duration_minutes: Si(),
			run_actions: B("nmap-run-actions"),
			scan_mode: n
		}) : await G("/api/nmap/scan", {
			targets: t,
			discovery: i,
			staged: !1,
			run_actions: B("nmap-run-actions"),
			nmap_path: "nmap",
			nmap_args: V("nmap-args").trim(),
			scan_mode: n,
			scan_options: r
		}))?.job?.id;
		U(o ? `${n === "passive_capture" ? "Passive capture" : "Nmap scan"} queued (job ${o})` : n === "passive_capture" ? "Passive capture queued" : "Nmap scan queued"), Vi(), R("nmap-targets", ""), Me.postSubmitLock = !0, Hc(1), Bc(), Lc(), await Is();
	} catch (e) {
		U(`Scan failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/scheduler_preferences.js
function Gc(e) {
	if (!e) return;
	let t = Kc(e.feature_flags), n = ci(e.engagement_policy, e.goal_profile || "internal_asset_discovery");
	L("scheduler-mode", e.mode || ""), L("scheduler-goal", n.preset_label || n.preset || e.goal_profile || ""), L("scheduler-families", e.preapproved_families_count || 0), R("scheduler-mode-select", e.mode || "deterministic"), R("scheduler-goal-select", n.preset || "internal_recon"), R("engagement-scope-select", n.scope || "internal"), R("engagement-intent-select", n.intent || "recon"), Jc(), z("engagement-allow-exploitation", !!n.allow_exploitation), z("engagement-allow-lateral", !!n.allow_lateral_movement), R("engagement-credential-mode", n.credential_attack_mode || "blocked"), R("engagement-lockout-mode", n.lockout_risk_mode || "blocked"), R("engagement-stability-mode", n.stability_risk_mode || "approval"), R("engagement-detection-mode", n.detection_risk_mode || "low"), R("engagement-approval-mode", n.approval_mode || "risky"), qc(t, n.runner_preference || "local"), R("engagement-noise-budget", n.noise_budget || "low"), R("scheduler-provider-select", e.provider || "none"), R("scheduler-concurrency-input", String(e.max_concurrency || 1)), R("scheduler-host-concurrency-input", String(e.max_host_concurrency || 1)), R("scheduler-max-jobs-input", String(e.max_jobs || 200));
	let r = e.providers || {}, i = e.integrations || {}, a = r.lm_studio || {}, o = r.openai || {}, s = r.claude || {}, c = i.grayhatwarfare || {}, l = i.chaos || {}, u = i.shodan || {};
	k.deviceCategoryRules = Array.isArray(e.device_categories) ? e.device_categories : [], k.builtInDeviceCategories = Array.isArray(e.built_in_device_categories) ? e.built_in_device_categories : [];
	let d = e.ai_feedback || {}, f = e.project_report_delivery || {}, p = f.mtls || {};
	R("provider-lmstudio-baseurl", a.base_url || ""), R("provider-lmstudio-model", a.model || ""), R("provider-lmstudio-apikey", "");
	let m = document.getElementById("provider-lmstudio-apikey");
	m && (m.placeholder = a.api_key_configured ? "Configured. Enter a new LM Studio API key to replace it" : "Enter a new LM Studio API key"), R("provider-openai-baseurl", o.base_url || ""), R("provider-openai-model", o.model || ""), R("provider-openai-apikey", "");
	let h = document.getElementById("provider-openai-apikey");
	h && (h.placeholder = o.api_key_configured ? "Configured. Enter a new OpenAI API key to replace it" : "Enter a new OpenAI API key"), z("provider-openai-structured-outputs", !!o.structured_outputs), R("provider-claude-baseurl", s.base_url || ""), R("provider-claude-model", s.model || ""), R("provider-claude-apikey", "");
	let g = document.getElementById("provider-claude-apikey");
	g && (g.placeholder = s.api_key_configured ? "Configured. Enter a new Claude API key to replace it" : "Enter a new Claude API key"), R("scheduler-integration-grayhatwarfare-apikey", "");
	let _ = document.getElementById("scheduler-integration-grayhatwarfare-apikey");
	_ && (_.placeholder = c.api_key_configured ? "Configured. Enter a new Grayhat Warfare API key to replace it" : "Enter a new Grayhat Warfare API key"), R("scheduler-integration-chaos-apikey", "");
	let v = document.getElementById("scheduler-integration-chaos-apikey");
	v && (v.placeholder = l.api_key_configured ? "Configured. Enter a new Chaos API key to replace it" : "Enter a new Chaos API key"), R("scheduler-integration-shodan-apikey", "");
	let y = document.getElementById("scheduler-integration-shodan-apikey");
	y && (y.placeholder = u.api_key_configured ? "Configured. Enter a new Shodan API key to replace it" : "Enter a new Shodan API key"), z("scheduler-ai-feedback-enabled", d.enabled !== !1), R("scheduler-ai-max-rounds", String(d.max_rounds_per_target || 5)), R("scheduler-ai-max-actions", String(d.max_actions_per_round || 6)), R("scheduler-ai-recent-output-chars", String(d.recent_output_chars || 900)), z("scheduler-ai-reflection-enabled", d.reflection_enabled !== !1), R("scheduler-ai-stall-rounds", String(d.stall_rounds_without_progress || 2)), R("scheduler-ai-repeat-threshold", String(d.stall_repeat_selection_threshold || 2)), R("scheduler-ai-max-reflections", String(d.max_reflections_per_target || 1)), Ws(t.graph_workspace !== !1), Gs(t.credential_capture_panel !== !1), z("interface-graph-workspace-enabled", t.graph_workspace !== !1), z("interface-credential-capture-panel-enabled", t.credential_capture_panel !== !1), z("feature-context-summary-enabled", t.context_summary_enabled !== !1), z("feature-scheduler-prompt-profiles", t.scheduler_prompt_profiles !== !1), z("feature-scheduler-web-followup-sidecar", !!t.scheduler_web_followup_sidecar), R("project-report-provider-name", f.provider_name || ""), R("project-report-endpoint", f.endpoint || ""), R("project-report-method", f.method || "POST"), R("project-report-format", f.format || "json"), R("project-report-timeout", String(f.timeout_seconds || 30)), z("project-report-mtls-enabled", p.enabled), R("project-report-mtls-cert", p.client_cert_path || ""), R("project-report-mtls-key", p.client_key_path || ""), R("project-report-mtls-ca", p.ca_cert_path || ""), R("project-report-headers", JSON.stringify(f.headers || {}, null, 2));
	let b = new Set(e.dangerous_categories || []);
	[
		"exploit_execution",
		"credential_bruteforce",
		"network_flooding",
		"destructive_write_actions"
	].forEach((e) => {
		z(`danger-${e}`, b.has(e));
	}), Yc(e.provider || "none"), ii();
}
function Kc(e) {
	let t = e && typeof e == "object" ? e : {};
	return {
		graph_workspace: t.graph_workspace !== !1,
		credential_capture_panel: t.credential_capture_panel !== !1,
		optional_runners: t.optional_runners !== !1,
		context_summary_enabled: t.context_summary_enabled !== !1,
		scheduler_prompt_profiles: t.scheduler_prompt_profiles !== !1,
		scheduler_web_followup_sidecar: !!t.scheduler_web_followup_sidecar
	};
}
function qc(e, t) {
	let n = Kc(e), r = document.getElementById("engagement-runner-preference"), i = new Set(n.optional_runners ? [] : ["container", "browser"]);
	if (!r) return;
	Array.from(r.options).forEach((e) => {
		let t = String(e?.value || "").trim().toLowerCase();
		e.disabled = i.has(t), e.textContent = e.disabled ? `${t} (disabled)` : t;
	});
	let a = String(t || "local").trim().toLowerCase();
	i.has(a) ? R("engagement-runner-preference", "local") : R("engagement-runner-preference", a || "local");
}
function Jc() {
	let e = String(V("scheduler-goal-select") || "internal_recon").trim().toLowerCase(), t = e === "custom", n = t ? {
		scope: V("engagement-scope-select") || "internal",
		intent: V("engagement-intent-select") || "recon"
	} : si(e);
	t || (R("engagement-scope-select", n.scope || "internal"), R("engagement-intent-select", n.intent || "recon")), L("engagement-derived-scope", n.scope || "internal"), L("engagement-derived-intent", n.intent || "recon");
	let r = document.getElementById("engagement-preset-summary");
	r && (r.textContent = di(e, t));
	let i = document.getElementById("engagement-custom-scope-label"), a = document.getElementById("engagement-custom-intent-label"), o = document.getElementById("engagement-custom-note"), s = document.getElementById("engagement-scope-select"), c = document.getElementById("engagement-intent-select");
	[
		i,
		a,
		o
	].forEach((e) => {
		e && (e.hidden = !t);
	}), s && (s.disabled = !t), c && (c.disabled = !t), Vc(), document.getElementById("nmap-command-preview") && Bc();
}
function Yc(e) {
	let t = String(e || "none").trim().toLowerCase();
	document.querySelectorAll(".scheduler-provider-field[data-scheduler-provider]").forEach((e) => {
		let n = String(e.getAttribute("data-scheduler-provider") || "").trim().toLowerCase();
		e.classList.toggle("is-active", n === t);
	});
}
function Xc() {
	let e = V("scheduler-mode-select"), t = String(V("scheduler-goal-select") || "internal_recon").trim().toLowerCase(), n = si(t), r = V("scheduler-provider-select"), i = parseInt(V("scheduler-concurrency-input"), 10), a = Number.isFinite(i) ? Math.max(1, Math.min(16, i)) : 1, o = parseInt(V("scheduler-host-concurrency-input"), 10), s = Number.isFinite(o) ? Math.max(1, Math.min(8, o)) : 1, c = parseInt(V("scheduler-max-jobs-input"), 10), l = Number.isFinite(c) ? Math.max(20, Math.min(2e3, c)) : 200, u = parseInt(V("scheduler-ai-max-rounds"), 10), d = Number.isFinite(u) ? Math.max(1, Math.min(12, u)) : 5, f = parseInt(V("scheduler-ai-max-actions"), 10), p = Number.isFinite(f) ? Math.max(1, Math.min(8, f)) : 6, m = parseInt(V("scheduler-ai-recent-output-chars"), 10), h = Number.isFinite(m) ? Math.max(320, Math.min(4e3, m)) : 900, g = parseInt(V("scheduler-ai-stall-rounds"), 10), _ = Number.isFinite(g) ? Math.max(1, Math.min(6, g)) : 2, v = parseInt(V("scheduler-ai-repeat-threshold"), 10), y = Number.isFinite(v) ? Math.max(1, Math.min(8, v)) : 2, b = parseInt(V("scheduler-ai-max-reflections"), 10), x = Number.isFinite(b) ? Math.max(0, Math.min(4, b)) : 1, S = [
		"exploit_execution",
		"credential_bruteforce",
		"network_flooding",
		"destructive_write_actions"
	].filter((e) => B(`danger-${e}`)), C = {
		lm_studio: {
			enabled: r === "lm_studio",
			base_url: V("provider-lmstudio-baseurl"),
			model: V("provider-lmstudio-model")
		},
		openai: {
			enabled: r === "openai",
			base_url: V("provider-openai-baseurl"),
			model: V("provider-openai-model"),
			structured_outputs: B("provider-openai-structured-outputs")
		},
		claude: {
			enabled: r === "claude",
			base_url: V("provider-claude-baseurl"),
			model: V("provider-claude-model")
		}
	};
	r === "lm_studio" ? (C.lm_studio.base_url = C.lm_studio.base_url || "http://127.0.0.1:1234/v1", C.lm_studio.model = C.lm_studio.model || "o3-7b") : r === "openai" && (C.openai.base_url = C.openai.base_url || "https://api.openai.com/v1", C.openai.model = C.openai.model || "gpt-4.1-mini");
	let w = V("provider-lmstudio-apikey").trim(), T = V("provider-openai-apikey").trim(), E = V("provider-claude-apikey").trim();
	w && (C.lm_studio.api_key = w), T && (C.openai.api_key = T), E && (C.claude.api_key = E);
	let D = {
		grayhatwarfare: {},
		chaos: {},
		shodan: {}
	}, O = V("scheduler-integration-grayhatwarfare-apikey").trim();
	O && (D.grayhatwarfare.api_key = O);
	let ee = V("scheduler-integration-chaos-apikey").trim();
	ee && (D.chaos.api_key = ee);
	let te = V("scheduler-integration-shodan-apikey").trim();
	te && (D.shodan.api_key = te);
	let ne = document.getElementById("interface-graph-workspace-enabled"), re = ne ? !!ne.checked : gn(), ie = document.getElementById("interface-credential-capture-panel-enabled"), ae = ie ? !!ie.checked : !!Ae.panelEnabled, oe = ci({
		preset: t,
		scope: t === "custom" ? V("engagement-scope-select") : n.scope,
		intent: t === "custom" ? V("engagement-intent-select") : n.intent,
		allow_exploitation: B("engagement-allow-exploitation"),
		allow_lateral_movement: B("engagement-allow-lateral"),
		credential_attack_mode: V("engagement-credential-mode"),
		lockout_risk_mode: V("engagement-lockout-mode"),
		stability_risk_mode: V("engagement-stability-mode"),
		detection_risk_mode: V("engagement-detection-mode"),
		approval_mode: V("engagement-approval-mode"),
		runner_preference: V("engagement-runner-preference"),
		noise_budget: V("engagement-noise-budget"),
		custom_overrides: {}
	}, t);
	return {
		mode: e,
		goal_profile: ui(oe),
		engagement_policy: oe,
		provider: r,
		max_concurrency: a,
		max_host_concurrency: s,
		max_jobs: l,
		ai_feedback: {
			enabled: B("scheduler-ai-feedback-enabled"),
			max_rounds_per_target: d,
			max_actions_per_round: p,
			recent_output_chars: h,
			reflection_enabled: B("scheduler-ai-reflection-enabled"),
			stall_rounds_without_progress: _,
			stall_repeat_selection_threshold: y,
			max_reflections_per_target: x
		},
		dangerous_categories: S,
		feature_flags: {
			graph_workspace: re,
			credential_capture_panel: ae,
			context_summary_enabled: B("feature-context-summary-enabled"),
			scheduler_prompt_profiles: B("feature-scheduler-prompt-profiles"),
			scheduler_web_followup_sidecar: B("feature-scheduler-web-followup-sidecar")
		},
		providers: C,
		integrations: D
	};
}
function Zc() {
	let e = String(V("project-report-method") || "POST").toUpperCase(), t = String(V("project-report-format") || "json").toLowerCase() === "md" ? "md" : "json", n = parseInt(V("project-report-timeout"), 10), r = Number.isFinite(n) ? Math.max(5, Math.min(300, n)) : 30, i = {}, a = String(V("project-report-headers") || "").trim();
	if (a) {
		let e;
		try {
			e = JSON.parse(a);
		} catch {
			throw Error("Project report headers must be valid JSON.");
		}
		if (typeof e != "object" || !e || Array.isArray(e)) throw Error("Project report headers must be a JSON object.");
		i = Object.fromEntries(Object.entries(e).map(([e, t]) => [String(e || "").trim(), String(t ?? "")]).filter(([e]) => e.length > 0));
	}
	return {
		provider_name: V("project-report-provider-name"),
		endpoint: V("project-report-endpoint"),
		method: [
			"POST",
			"PUT",
			"PATCH"
		].includes(e) ? e : "POST",
		format: t,
		headers: i,
		timeout_seconds: r,
		mtls: {
			enabled: B("project-report-mtls-enabled"),
			client_cert_path: V("project-report-mtls-cert"),
			client_key_path: V("project-report-mtls-key"),
			ca_cert_path: V("project-report-mtls-ca")
		}
	};
}
async function Qc() {
	try {
		let e = await fetch("/api/scheduler/preferences");
		if (!e.ok) return;
		Gc(await e.json());
	} catch {}
}
async function $c(e) {
	e.preventDefault();
	let t = document.getElementById("scheduler-save-status");
	t && (t.textContent = "Saving...");
	let n;
	try {
		n = Xc();
	} catch (e) {
		t && (t.textContent = e.message || "Save failed");
		return;
	}
	try {
		let e = await fetch("/api/scheduler/preferences", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(n)
		});
		if (!e.ok) {
			let n = "Save failed";
			try {
				let t = await e.json();
				t && t.error && (n = `Save failed: ${t.error}`);
			} catch {}
			t && (t.textContent = n);
			return;
		}
		Gc(await e.json()), t && (t.textContent = "Saved");
	} catch {
		t && (t.textContent = "Save failed");
	}
}
async function el(e) {
	e && e.preventDefault();
	let t = document.getElementById("report-provider-save-status");
	t && (t.textContent = "Saving...");
	let n;
	try {
		n = Zc();
	} catch (e) {
		t && (t.textContent = e.message || "Save failed");
		return;
	}
	try {
		let e = await fetch("/api/scheduler/preferences", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ project_report_delivery: n })
		});
		if (!e.ok) {
			t && (t.textContent = "Save failed");
			return;
		}
		Gc(await e.json()), t && (t.textContent = "Saved"), U("Report provider settings saved");
	} catch {
		t && (t.textContent = "Save failed");
	}
}
async function tl(e) {
	e && e.preventDefault();
	let t = document.getElementById("scheduler-save-status");
	t && (t.textContent = "Testing provider...");
	let n;
	try {
		n = Xc();
	} catch (e) {
		t && (t.textContent = e.message || "Provider test failed");
		return;
	}
	try {
		let e = await G("/api/scheduler/provider/test", n);
		if (!e.ok) {
			t && (t.textContent = `Provider test failed: ${e.error || "unknown error"}`);
			return;
		}
		let r = [];
		e.provider && r.push(e.provider), e.model && r.push(`model=${e.model}`), e.api_style && r.push(`api=${e.api_style}`), e.endpoint && r.push(e.endpoint), e.structured_output_used ? r.push("structured") : e.structured_output_fallback && r.push("structured-fallback"), e.auto_selected_model && r.push("auto-selected"), typeof e.latency_ms == "number" && r.push(`${e.latency_ms}ms`), t && (t.textContent = `Provider OK${r.length ? ` (${r.join(" | ")})` : ""}`);
	} catch (e) {
		t && (t.textContent = `Provider test failed: ${e.message}`);
	}
}
// ../app/web/static/js/workspace/controller.js
var nl = class {
	connect() {
		this.connected ||= (cn({ pollSnapshot: Is }), ti({ applySchedulerPreferences: Gc }), Ai({
			openManualToolPicker: mo,
			pollSnapshot: Is
		}), hn({
			graphRenderWorkspace: ss,
			graphSyncDetailPresentation: Eo
		}), So({ graphRenderWorkspace: ss }), ja({ pollSnapshot: Is }), fr({
			closeRibbonMenus: da,
			graphLoadSnapshot: ws,
			loadHostDetail: Yr,
			loadWorkspaceHosts: Kr,
			loadWorkspaceServices: qr,
			renderHosts: ps,
			renderServices: hs
		}), ks({ renderCredentialCapturePanel: ic }), st({
			pollSnapshot: Is,
			setCredentialCaptureConfigModalOpen: nc,
			setCredentialsModalOpen: tc
		}), Sc({ applySchedulerPreferences: Gc }), _i({
			applyNmapModeTargetDefaults: Pc,
			refreshNmapModeOptions: Uc,
			refreshNmapScanButtonState: Lc,
			setNmapWizardStep: Hc,
			updateNmapCommandPreview: Bc
		}), Rs({ applySchedulerPreferences: Gc }), no({ pollSnapshot: Is }), Ur({
			graphLoadSnapshot: ws,
			renderHosts: ps,
			renderServices: hs,
			renderTools: xs
		}), !0);
	}
};
// ../app/web/static/js/workspace/graph_actions.js
function rl(e) {
	let t = (A.layouts || []).find((t) => String(t?.layout_id || "") === String(e || ""));
	A.activeLayoutId = String(t?.layout_id || ""), A.positions = t?.layout?.positions && typeof t.layout.positions == "object" ? { ...t.layout.positions } : {}, A.pinnedNodeIds = t?.layout?.pinned_node_ids && typeof t.layout.pinned_node_ids == "object" ? { ...t.layout.pinned_node_ids } : {}, t?.layout?.group_by && R("graph-group-select", t.layout.group_by), t?.name && R("graph-layout-name", t.name), Kn(), ss();
}
function il() {
	let e = as(A.data), t = /* @__PURE__ */ new Map();
	if ((e.nodes || []).forEach((n) => {
		let r = X(n, A.groupBy || Wn().defaultGroup || "subnet", No(e.nodes)) || "other";
		t.has(r) || t.set(r, []), t.get(r).push(n);
	}), !Array.isArray(e?.nodes) || !e.nodes.length || !t.size) {
		q("No graph nodes are available to tidy.", !0);
		return;
	}
	let n = Wo(e.nodes, e.edges, t, A.groupBy || Wn().defaultGroup || "subnet", {});
	Object.entries(n.positions || {}).forEach(([e, t]) => {
		A.positions[e] = {
			x: Number(t?.x) || 0,
			y: Number(t?.y) || 0
		};
	}), ss({ preserveDetail: !0 }), q(`Layout tidied for ${e.nodes.length} nodes across ${(n.groups || []).length} groups`);
}
function al() {
	if (A.selectedKind !== "node" || !A.selectedRef) {
		q("Select a node or summary before focusing the neighborhood.", !0), ko();
		return;
	}
	let e = Cn(), t = Go(e);
	t.length ? (A.focusSeedNodeIds = t, A.focusSeedLabel = String(e?.label || e?.node_id || "selection"), A.focusDepth = Math.max(1, Math.min(3, parseInt(V("graph-focus-depth-select"), 10) || A.focusDepth || 1)), J(e, "summary_kind") && (A.selectedKind = "node", A.selectedRef = t[0]), ss(), ko(), q(`Focused ${A.focusDepth}-hop neighborhood around ${A.focusSeedLabel}`)) : (q("The selected graph node cannot be focused.", !0), ko());
}
function ol() {
	A.focusSeedNodeIds.length ? (A.focusSeedNodeIds = [], A.focusSeedLabel = "", ss(), ko(), q("Graph focus cleared")) : (q("No graph focus is active.", !0), ko());
}
function sl() {
	if (A.selectedKind !== "node" || !A.selectedRef) {
		q("Select a summary node before expanding it.", !0), ko();
		return;
	}
	let e = Cn();
	if (!J(e, "summary_kind")) {
		q("Selected node is already expanded.", !0), ko();
		return;
	}
	let t = String(e?.node_id || "");
	A.expandedSummaryIds[t] ? (delete A.expandedSummaryIds[t], A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = null, q(`Collapsed ${e.label || t}`)) : (A.expandedSummaryIds[t] = !0, A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = e, q(`Expanded ${e.label || t}`)), ss(), ko();
}
function cl() {
	let e = Cn(), t = String(e?.node_id || "");
	!J(e, "summary_kind") || !t || !A.expandedSummaryIds[t] ? (q("Select an expanded summary cluster to collapse.", !0), ko()) : (delete A.expandedSummaryIds[t], A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = null, ss(), ko(), q(`Collapsed ${e.label || t}`));
}
async function ll() {
	let e = String(V("graph-view-select") || A.viewId || "attack_surface").trim(), t = String(V("graph-layout-name") || "default").trim() || "default", n = String(A.activeLayoutId || ""), r = {
		positions: A.filtered?.positions && typeof A.filtered.positions == "object" ? A.filtered.positions : A.positions,
		pinned_node_ids: A.pinnedNodeIds,
		group_by: String(V("graph-group-select") || A.groupBy || Wn().defaultGroup || "subnet").trim(),
		filters: {
			view_id: e,
			host_id: V("graph-host-filter"),
			node_type: V("graph-node-type-filter"),
			edge_type: V("graph-edge-type-filter"),
			source_kind: V("graph-source-kind-filter"),
			severity: V("graph-severity-filter"),
			pack: V("graph-pack-filter"),
			time_window: V("graph-time-window-filter"),
			hide_ai_suggested: B("graph-hide-ai-suggested"),
			hide_nmap_xml_artifacts: B("graph-hide-nmap-xml-artifacts"),
			min_confidence: V("graph-min-confidence")
		}
	};
	try {
		let i = (await G("/api/graph/layouts", {
			layout_id: n,
			view_id: e,
			name: t,
			layout: r
		}))?.layout || {};
		A.layouts = (A.layouts || []).filter((e) => String(e?.layout_id || "") !== String(i.layout_id || "")), A.layouts.push(i), A.activeLayoutId = String(i.layout_id || ""), Kn(), R("graph-layout-select", A.activeLayoutId), q(`Layout saved: ${i.name || t}`);
	} catch (e) {
		q(`Layout save failed: ${e.message}`, !0);
	}
}
function ul() {
	A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, R("graph-layout-select", ""), ss(), q("Layout reset");
}
async function dl() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || ""), n = String(V("graph-note-input") || "").trim();
	if (!e || !t) q("Select a node or edge before saving a note.", !0);
	else if (!n) q("Note text is required.", !0);
	else try {
		let r = (await G("/api/graph/annotations", {
			target_kind: e,
			target_ref: t,
			body: n,
			created_by: "web-operator",
			source_ref: `graph-workspace:${A.viewId}`
		}))?.annotation || {};
		A.annotations = (A.annotations || []).filter((e) => String(e?.annotation_id || "") !== String(r.annotation_id || "")), A.annotations.push(r), R("graph-note-input", ""), Xi(!1), Ao(), q("Note saved");
	} catch (e) {
		q(`Note save failed: ${e.message}`, !0);
	}
}
function fl() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || "");
	if (!e || !t) {
		q("Select a node or edge before adding a note.", !0);
		return;
	}
	let n = fn(e === "node" ? "node" : "edge", t), r = String(n?.label || n?.edge_id || t || "").trim() || "selected item";
	L("graph-note-modal-target", `Target: ${jn(e)} | ${r}`), Bi(!0);
}
function pl() {
	let e = A.selectedKind === "node" ? fn("node", A.selectedRef) : null;
	if (!e) {
		q("Select a node to pin or unpin.", !0);
		return;
	}
	let t = String(e.node_id || "");
	if (A.pinnedNodeIds[t]) delete A.pinnedNodeIds[t], q(`Node unpinned: ${e.label || t}`);
	else {
		let n = A.filtered.positions?.[t] || A.positions?.[t];
		n && (A.positions[t] = {
			x: n.x,
			y: n.y
		}), A.pinnedNodeIds[t] = !0, q(`Node pinned: ${e.label || t}`);
	}
	ss();
}
// ../app/web/static/js/workspace/interface_settings.js
function ml(e) {
	let t = document.getElementById("interface-settings-modal");
	t && (I.interfaceSettingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
async function hl() {
	Vs("Loading interface settings...");
	try {
		let [e, t] = await Promise.all([Ke("/api/scheduler/preferences"), Ke("/api/settings/display")]), n = Kc(e?.feature_flags), r = n.graph_workspace;
		z("interface-graph-workspace-enabled", r), z("interface-credential-capture-panel-enabled", n.credential_capture_panel), z("interface-colorful-ascii-background", !!t?.colorful_ascii_background), Vs("Interface settings loaded");
	} catch (e) {
		Vs(`Load failed: ${e.message}`, !0);
	}
}
async function gl() {
	let e = B("interface-graph-workspace-enabled"), t = B("interface-credential-capture-panel-enabled"), n = B("interface-colorful-ascii-background");
	Vs("Saving interface settings...");
	try {
		let [r, i] = await Promise.all([G("/api/scheduler/preferences", { feature_flags: {
			graph_workspace: e,
			credential_capture_panel: t
		} }), G("/api/settings/display", { colorful_ascii_background: n })]);
		Gc(r), Us(!!i?.colorful_ascii_background), Vs("Interface settings saved");
	} catch (e) {
		Vs(`Save failed: ${e.message}`, !0);
	}
}
async function _l() {
	da(), la(!0), await Promise.allSettled([Zs()]);
}
function vl() {
	la(!1);
}
async function yl() {
	da(), ml(!0), await hl();
}
function bl() {
	ml(!1);
}
// ../app/web/static/js/workspace/projects.js
async function xl() {
	da();
	let e = V("project-open-path").trim();
	if (!e) {
		let t = window.prompt("Enter existing project path (.legion):", "");
		if (e = String(t || "").trim(), !e) return;
		R("project-open-path", e);
	}
	await Hl();
}
async function Sl(e = !1) {
	da();
	let t = V("project-save-path").trim();
	if (e || !t) {
		let e = String(V("project-name") || "").trim(), n = window.prompt("Enter destination path (.legion):", e);
		if (t = String(n || "").trim(), !t) return;
		R("project-save-path", t);
	}
	await Ul();
}
async function Cl() {
	da(), V("project-save-path").trim() ? await Ul() : U("Save failed: no destination path is set. Use Save As.", !0);
}
async function wl() {
	await Sl(!0);
}
function Tl() {
	da(), window.location.assign(`/api/project/download-zip?t=${Date.now()}`);
}
async function El() {
	da(), await Rl("restoring a workspace bundle", async () => {
		let e = document.getElementById("project-restore-zip-file");
		e ? (e.value = "", e.click()) : U("Restore failed: ZIP input control missing.", !0);
	});
}
async function Dl(e) {
	let t = e?.target, n = t?.files && t.files.length ? t.files[0] : null;
	if (n) {
		U(`Uploading restore bundle (${n.name})...`);
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
				U(`Restore queued (job ${i})...`);
				let e = await Gr(i, 12e5, 1500), t = String(e?.result?.project?.name || "").trim();
				t && (R("project-save-path", t), R("project-open-path", t));
			}
			U("Workspace restored"), ls({ clearProjectPaths: !1 }), await Xr(), await Promise.all([Is(), ln()]);
		} catch (e) {
			U(`Restore failed: ${e.message}`, !0);
		} finally {
			t && (t.value = "");
		}
	}
}
async function Ol() {
	da();
	let e = V("nmap-xml-path").trim();
	if (!e) {
		let t = window.prompt("Enter Nmap XML path:", "");
		if (e = String(t || "").trim(), !e) return;
		R("nmap-xml-path", e);
	}
	z("nmap-xml-run-actions", window.confirm("Run scripted actions after XML import?")), await Gl();
}
async function kl() {
	da();
	let e = V("targets-file-path").trim();
	if (!e) {
		let t = window.prompt("Enter targets text file path:", "");
		if (e = String(t || "").trim(), !e) return;
		R("targets-file-path", e);
	}
	await Wl();
}
function Al(e) {
	let t = document.getElementById("workspace-switch-guard-modal");
	t && (Pe.modalOpen = !!e, I.workspaceSwitchGuardOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function jl(e, t = !1) {
	let n = document.getElementById("workspace-switch-guard-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function Ml() {
	Pe.busy = !1, Pe.pendingAction = null, Pe.pendingLabel = "", Pe.latestSummary = null, jl("Stop running jobs and processes before switching workspaces."), L("workspace-switch-guard-summary", "No active work detected."), L("workspace-switch-guard-details", ""), Al(!1);
}
async function Nl() {
	let [e, t] = await Promise.all([Ke("/api/jobs?limit=500"), Ke("/api/processes?limit=500")]), n = Array.isArray(e?.jobs) ? e.jobs : [], r = Array.isArray(t?.processes) ? t.processes : [];
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
function Pl(e) {
	let t = Array.isArray(e?.jobs) ? e.jobs : [], n = Array.isArray(e?.processes) ? e.processes : [], r = [];
	return t.slice(0, 6).forEach((e) => {
		r.push(`Job ${e.id} | ${e.type || "job"} | ${e.status || ""}`);
	}), n.slice(0, 8).forEach((e) => {
		r.push(`Process ${e.id} | ${e.name || "process"} | ${e.hostIp || ""}${e.port ? `:${e.port}/${e.protocol || "tcp"}` : ""} | ${e.status || ""}`);
	}), (t.length > 6 || n.length > 8) && r.push("..."), r.join("\n");
}
function Fl(e, t, n) {
	Pe.pendingAction = n, Pe.pendingLabel = String(t || "switch workspaces"), Pe.latestSummary = e;
	let r = Array.isArray(e?.jobs) ? e.jobs.length : 0, i = Array.isArray(e?.processes) ? e.processes.length : 0;
	jl("Active work must be stopped before switching workspaces."), L("workspace-switch-guard-summary", `${r} active job${r === 1 ? "" : "s"} and ${i} active process${i === 1 ? "" : "es"} detected before ${Pe.pendingLabel}.`), L("workspace-switch-guard-details", Pl(e)), Al(!0);
}
async function Il(e = 2e4) {
	let t = Date.now() + Math.max(1e3, Number(e) || 2e4);
	for (; Date.now() < t;) {
		let e = await Nl();
		if (!e.jobs.length && !e.processes.length) return e;
		await new Promise((e) => window.setTimeout(e, 600));
	}
	throw Error("Timed out waiting for running jobs and processes to stop.");
}
async function Ll() {
	if (!Pe.busy) {
		Pe.busy = !0, jl("Stopping active jobs and processes...");
		try {
			let e = await Nl();
			for (let t of e.jobs) {
				let e = Number(t?.id || 0);
				e > 0 && await G(`/api/jobs/${e}/stop`, {});
			}
			for (let t of e.processes) {
				let e = Number(t?.id || 0);
				if (e > 0) try {
					await G(`/api/processes/${e}/kill`, {});
				} catch {}
			}
			await Il(), await Is();
			let t = Pe.pendingAction;
			Ml(), typeof t == "function" && await t();
		} catch (e) {
			Pe.busy = !1, jl(`Stop failed: ${e.message}`, !0);
		}
	}
}
async function Rl(e, t) {
	let n = await Nl();
	n.jobs.length || n.processes.length ? Fl(n, e, t) : await t();
}
async function zl() {
	U("Creating temporary project...");
	let e = await G("/api/project/new-temp", {});
	U("Created temporary project"), ls({ clearProjectPaths: !0 }), Ve(e?.project || {}), await Xr(), await Promise.all([Is(), ln()]);
}
async function Bl() {
	try {
		await Rl("creating a new workspace", zl);
	} catch (e) {
		if (String(e?.message || "").toLowerCase().includes("jobs/scans are active")) {
			await Rl("creating a new workspace", zl);
			return;
		}
		U(`Create failed: ${e.message}`, !0);
	}
}
async function Vl() {
	let e = V("project-open-path").trim();
	if (!e) {
		U("Open failed: project path is required", !0);
		return;
	}
	U("Opening project...");
	let t = await G("/api/project/open", { path: e });
	U("Project opened"), ls({ clearProjectPaths: !1 }), R("project-save-path", ""), Ve(t?.project || {}), await Xr(), await Promise.all([Is(), ln()]);
}
async function Hl() {
	try {
		await Rl("opening a workspace", Vl);
	} catch (e) {
		if (String(e?.message || "").toLowerCase().includes("jobs/scans are active")) {
			await Rl("opening a workspace", Vl);
			return;
		}
		U(`Open failed: ${e.message}`, !0);
	}
}
async function Ul() {
	let e = V("project-save-path").trim();
	if (!e) U("Save failed: destination path is required", !0);
	else {
		U("Saving project...");
		try {
			let t = await G("/api/project/save-as", {
				path: e,
				replace: B("project-save-replace")
			}), n = Number(t?.job?.id || 0);
			n > 0 && (U(`Save queued (job ${n})...`), await Gr(n, 6e5, 1500)), U("Project saved"), await Is();
		} catch (e) {
			U(`Save failed: ${e.message}`, !0);
		}
	}
}
async function Wl() {
	let e = V("targets-file-path").trim();
	if (!e) U("Import failed: targets file path is required", !0);
	else {
		U("Queueing targets import job...");
		try {
			let t = (await G("/api/targets/import-file", { path: e }))?.job?.id;
			U(t ? `Targets import queued (job ${t})` : "Targets import queued"), await Is();
		} catch (e) {
			U(`Import failed: ${e.message}`, !0);
		}
	}
}
async function Gl() {
	let e = V("nmap-xml-path").trim();
	if (!e) U("Import failed: XML path is required", !0);
	else {
		U("Queueing Nmap XML import job...");
		try {
			let t = (await G("/api/nmap/import-xml", {
				path: e,
				run_actions: B("nmap-xml-run-actions")
			}))?.job?.id;
			U(t ? `Nmap XML import queued (job ${t})` : "Nmap XML import queued"), await Is();
		} catch (e) {
			U(`Import failed: ${e.message}`, !0);
		}
	}
}
// ../app/web/static/js/workspace/report_delivery.js
async function Kl(e) {
	e && e.preventDefault(), da();
	let t;
	try {
		t = Zc();
	} catch (e) {
		let t = `Project report settings error: ${e.message}`;
		U(t, !0), L("report-provider-save-status", t);
		return;
	}
	U("Pushing project report..."), L("report-provider-save-status", "Pushing project report...");
	try {
		let e = await G("/api/workspace/project-ai-report/push", { project_report_delivery: t }), n = e?.status_code ? `Project report pushed (${e.status_code})` : "Project report pushed";
		U(n, !1), L("report-provider-save-status", n);
	} catch (e) {
		let t = `Project report push failed: ${e.message}`;
		U(t, !0), L("report-provider-save-status", t);
	}
}
// ../app/web/static/js/workspace/events.js
function ql() {
	let e = (e, t) => {
		let n = document.getElementById(e);
		n && n.addEventListener("click", t);
	};
	e("nmap-scan-button", Wc), e("ribbon-workspace-new-action-button", Bl), e("ribbon-workspace-open-action-button", xl), e("ribbon-workspace-save-action-button", Cl), e("ribbon-workspace-save-as-action-button", wl), e("ribbon-workspace-download-action-button", Tl), e("ribbon-workspace-restore-action-button", El), e("ribbon-import-xml-action-button", Ol), e("ribbon-import-targets-action-button", kl), e("hosts-reset-filter-button", Nr), e("hosts-filter-show-all-button", () => Dr("show_all")), e("hosts-filter-hide-down-button", () => Dr("hide_down")), e("services-panel-toggle-button", _s), e("graph-panel-toggle-button", ys), e("ribbon-scan-add-action-button", Zi), e("ribbon-scan-manual-action-button", Qi), e("ribbon-misc-host-selection-action-button", $i), e("ribbon-misc-script-cve-action-button", ea), e("ribbon-logging-jobs-button", na), e("ribbon-logging-submitted-scans-button", ra), e("ribbon-logging-scheduler-decisions-button", ia), e("ribbon-logging-ai-provider-button", ta), e("ribbon-credential-capture-toggle-button", Ks), e("ribbon-scheduler-settings-button", pa), e("ribbon-interface-settings-button", yl), e("ribbon-device-category-settings-button", ha), e("ribbon-report-provider-settings-button", _a), e("ribbon-app-settings-button", _l), e("credential-capture-open-credentials-button", cc), e("credential-capture-open-config-button", pc), e("credential-capture-responder-start-button", () => yc("responder")), e("credential-capture-responder-stop-button", () => bc("responder")), e("credential-capture-responder-view-log-button", () => _c("responder")), e("credential-capture-responder-download-log-button", () => vc("responder")), e("credential-capture-ntlmrelayx-start-button", () => yc("ntlmrelayx")), e("credential-capture-ntlmrelayx-stop-button", () => bc("ntlmrelayx")), e("credential-capture-ntlmrelayx-view-log-button", () => _c("ntlmrelayx")), e("credential-capture-ntlmrelayx-download-log-button", () => vc("ntlmrelayx")), e("workspace-refresh-button", Xr), e("workspace-save-note-button", Zr), e("workspace-save-categories-button", $r), e("workspace-run-tool-button", _o), e("workspace-run-scheduler-button", vo), e("workspace-add-script-button", yo), e("process-clear-finished-button", () => Ut(!1)), e("process-clear-all-button", () => Ut(!0)), e("graph-refresh-button", Es), e("graph-rebuild-button", Ds), e("graph-filters-toggle-button", () => wo(!A.filtersExpanded)), e("graph-focus-selection-button", al), e("graph-clear-focus-button", ol), e("graph-expand-selection-button", sl), e("graph-collapse-expanded-button", cl), e("graph-layout-save-button", ll), e("graph-layout-reset-button", ul), e("graph-note-open-button", fl), e("graph-note-save-button", dl), e("graph-note-modal-close", () => Xi(!1)), e("graph-note-modal-cancel", () => Xi(!1)), e("graph-pin-toggle-button", pl), e("graph-detail-dock-toggle-button", Oo), e("graph-detail-close-button", Co), wo(A.filtersExpanded), gs(!0), vs(!1);
	let t = xn();
	t && t.addEventListener("scroll", () => {
		A.detailMode === "floating" && Sn() && Eo();
	}), window.addEventListener("resize", () => {
		gn() && ss({ preserveDetail: !0 });
	});
	let n = document.getElementById("workspace-host-select");
	n && n.addEventListener("change", async (e) => {
		await fs(e.target.value, {
			syncGraph: !0,
			preserveGraphDetail: !0
		});
	});
	let r = document.getElementById("hosts-category-filter-select");
	r && r.addEventListener("change", async (e) => {
		await Or(e.target.value);
	});
	let i = document.getElementById("hosts-service-filter-button");
	i && i.addEventListener("click", (e) => {
		e.stopPropagation(), Cr(!!document.getElementById("hosts-service-filter-popover")?.hidden);
	});
	let a = document.getElementById("hosts-service-filter-clear-button");
	a && a.addEventListener("click", async (e) => {
		e.stopPropagation(), await Ar([]);
	});
	let o = document.getElementById("hosts-service-filter-popover");
	o && o.addEventListener("click", (e) => {
		e.stopPropagation();
	}), document.addEventListener("click", () => {
		Cr(!1);
	});
	let s = document.getElementById("services-category-filter-select");
	s && s.addEventListener("change", async (e) => {
		await jr(e.target.value);
	});
	let c = document.getElementById("workspace-tool-target-select");
	c && c.addEventListener("change", async () => {
		await ho();
	}), ["workspace-tool-port", "workspace-tool-protocol"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", async () => {
			await go();
		});
	});
	let l = document.getElementById("workspace-tool-select");
	l && l.addEventListener("change", () => {
		so();
	});
	let u = document.getElementById("credential-capture-responder-mode-quick");
	u && u.addEventListener("change", async () => {
		await hc();
	});
	let d = document.getElementById("credential-capture-config-form");
	d && d.addEventListener("submit", async (e) => {
		await mc(e);
	});
	let f = document.getElementById("hosts-body");
	f && f.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-host-action]");
		if (t && await Ua(t)) return;
		let n = e.target.closest("tr[data-host-id]");
		if (!n) return;
		let r = parseInt(n.dataset.hostId, 10);
		r && await fs(r, {
			syncGraph: !0,
			preserveGraphDetail: !0
		});
	});
	let p = document.getElementById("approvals-body");
	p && p.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-action]");
		if (!t) return;
		let n = parseInt(t.dataset.approvalId, 10);
		n && (t.dataset.action === "approve" ? await un(n) : t.dataset.action === "allow-family" ? await un(n, "allowed") : t.dataset.action === "reject" ? await dn(n) : t.dataset.action === "suppress-family" && await dn(n, "suppressed"));
	});
	let m = document.getElementById("host-detail-ports");
	m && m.addEventListener("click", (e) => {
		let t = e.target.closest("button[data-screenshot-url]");
		t && kt(t.dataset.screenshotUrl, t.dataset.screenshotName, t.dataset.screenshotPort);
	});
	let h = document.getElementById("host-detail-scripts");
	h && h.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-script-view-id]");
		if (t) {
			let e = parseInt(t.dataset.scriptViewId, 10);
			if (!e) return;
			await Dt(e);
			return;
		}
		let n = e.target.closest("button[data-script-delete-id]");
		if (!n) return;
		let r = parseInt(n.dataset.scriptDeleteId, 10);
		r && await bo(r);
	});
	let g = document.getElementById("processes-body");
	g && g.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-process-action]");
		if (!t) return;
		let n = parseInt(t.dataset.processId, 10);
		if (!n) return;
		let r = t.dataset.processAction;
		r === "output" ? await Et(n) : r === "kill" ? await Bt(n) : r === "retry" ? await Vt(n) : r === "close" && await Ht(n);
	}), e("nmap-wizard-back", () => Hc(Me.step - 1)), e("nmap-wizard-next", () => Hc(Me.step + 1)), e("scheduler-test-provider-button", tl), e("project-report-push-button", Kl), e("scheduler-modal-close", ma), e("interface-settings-modal-close", bl), e("interface-settings-save-button", gl), e("device-category-modal-close", ga), e("device-category-add-rule-button", () => {
		let e = document.getElementById("device-category-rules-body");
		e && e.appendChild(ri({}));
	}), e("device-category-save-button", oi), e("report-provider-modal-close", va), e("settings-modal-close", vl), e("settings-tool-audit-refresh-button", Zs), e("settings-tool-install-copy-button", $s), e("settings-tool-install-run-button", ec), e("workspace-switch-guard-close", Ml), e("workspace-switch-guard-cancel-button", Ml), e("workspace-switch-guard-stop-button", Ll), e("nmap-scan-modal-close", Vi), e("manual-scan-modal-close", Hi), e("host-selection-modal-close", Wi), e("script-cve-modal-close", Gi), e("provider-logs-modal-close", Ki), e("jobs-modal-close", qi), e("submitted-scans-modal-close", Ji), e("scheduler-decisions-modal-close", Yi), e("provider-logs-refresh-button", Gt), e("provider-logs-copy-button", Kt), e("provider-logs-download-button", qt), e("host-remove-modal-close", () => Y(!0)), e("host-remove-modal-cancel", () => Y(!0)), e("host-remove-modal-confirm", eo), e("process-output-modal-close", () => xt(!0)), e("process-output-refresh-button", () => At(!0, !1)), e("process-output-copy-button", jt), e("process-output-command-copy", Mt), e("process-output-download-button", Lt), e("credentials-modal-close", wt), e("credentials-copy-hashes-button", lc), e("credentials-download-hashes-button", () => uc("txt")), e("credentials-download-json-button", () => uc("json")), e("credential-capture-config-modal-close", Tt), e("script-output-modal-close", () => St(!0)), e("script-output-copy-button", Nt), e("script-output-command-copy", Pt), e("script-output-download-button", Rt), e("screenshot-modal-close", () => Ct(!0)), e("screenshot-copy-button", Ft), e("screenshot-download-button", K), e("graph-layout-tidy-button", il);
	let _ = document.getElementById("project-restore-zip-file");
	_ && _.addEventListener("change", Dl);
	let v = document.getElementById("settings-tool-install-platform");
	v && v.addEventListener("change", async () => {
		v.dataset.userSelected = "true", await Qs(!1);
	}), document.querySelectorAll("[data-ribbon-menu-toggle]").forEach((e) => {
		e.addEventListener("click", (t) => {
			t.preventDefault(), t.stopPropagation(), fa(e.getAttribute("data-ribbon-menu-toggle"));
		});
	}), document.addEventListener("click", (e) => {
		e.target.closest(".ribbon-menu") || da();
	});
	let y = document.getElementById("graph-resize-handle");
	y && (y.addEventListener("pointerdown", kn), y.addEventListener("dblclick", (e) => {
		e.preventDefault(), An();
	})), En();
	let b = document.getElementById("process-output-modal");
	b && b.addEventListener("click", (e) => {
		e.target === b && xt(!0);
	});
	let x = document.getElementById("script-output-modal");
	x && x.addEventListener("click", (e) => {
		e.target === x && St(!0);
	});
	let S = document.getElementById("screenshot-modal");
	S && S.addEventListener("click", (e) => {
		e.target === S && Ct(!0);
	});
	let C = document.getElementById("nmap-scan-modal");
	C && C.addEventListener("click", (e) => {
		e.target === C && Vi();
	});
	let w = document.getElementById("manual-scan-modal");
	w && w.addEventListener("click", (e) => {
		e.target === w && Hi();
	});
	let T = document.getElementById("interface-settings-modal");
	T && T.addEventListener("click", (e) => {
		e.target === T && bl();
	});
	let E = document.getElementById("workspace-switch-guard-modal");
	E && E.addEventListener("click", (e) => {
		e.target === E && Ml();
	});
	let D = document.getElementById("host-selection-modal");
	D && D.addEventListener("click", (e) => {
		e.target === D && Wi();
	});
	let O = document.getElementById("script-cve-modal");
	O && O.addEventListener("click", (e) => {
		e.target === O && Gi();
	});
	let ee = document.getElementById("provider-logs-modal");
	ee && ee.addEventListener("click", (e) => {
		e.target === ee && Ki();
	});
	let te = document.getElementById("credentials-modal");
	te && te.addEventListener("click", (e) => {
		e.target === te && wt();
	});
	let ne = document.getElementById("credential-capture-config-modal");
	ne && ne.addEventListener("click", (e) => {
		e.target === ne && Tt();
	});
	let re = document.getElementById("jobs-modal");
	re && re.addEventListener("click", (e) => {
		e.target === re && qi();
	});
	let ie = document.getElementById("submitted-scans-modal");
	ie && ie.addEventListener("click", (e) => {
		e.target === ie && Ji();
	});
	let ae = document.getElementById("scheduler-decisions-modal");
	ae && ae.addEventListener("click", (e) => {
		e.target === ae && Yi();
	});
	let oe = document.getElementById("host-remove-modal");
	oe && oe.addEventListener("click", (e) => {
		e.target === oe && Y(!0);
	});
	let se = document.getElementById("graph-note-modal");
	se && se.addEventListener("click", (e) => {
		e.target === se && Xi(!1);
	});
	let ce = document.getElementById("scheduler-settings-modal");
	ce && ce.addEventListener("click", (e) => {
		e.target === ce && ma();
	});
	let le = document.getElementById("device-category-settings-modal");
	le && le.addEventListener("click", (e) => {
		e.target === le && ga();
	});
	let ue = document.getElementById("report-provider-modal");
	ue && ue.addEventListener("click", (e) => {
		e.target === ue && va();
	});
	let de = document.getElementById("app-settings-modal");
	de && de.addEventListener("click", (e) => {
		e.target === de && vl();
	}), document.addEventListener("keydown", (e) => {
		e.key === "Escape" && (Fe.openMenuId ? da() : P.modalOpen ? xt(!0) : F.modalOpen ? St(!0) : Oe.modalOpen ? Ct(!0) : I.nmapScanOpen ? Vi() : I.manualScanOpen ? Hi() : I.hostSelectionOpen ? Wi() : I.scriptCveOpen ? Gi() : I.providerLogsOpen ? Ki() : I.credentialsOpen ? wt() : I.credentialCaptureConfigOpen ? Tt() : I.jobsOpen ? qi() : I.submittedScansOpen ? Ji() : I.schedulerDecisionsOpen ? Yi() : I.hostRemoveOpen ? Y(!0) : I.graphNoteOpen ? Xi(!1) : I.settingsOpen ? vl() : I.deviceCategorySettingsOpen ? ga() : I.schedulerOpen ? ma() : I.reportProviderOpen ? va() : A.detailMode === "floating" && Sn() && Co());
	}), document.addEventListener("pointerdown", (e) => {
		if (A.detailMode !== "floating" || !Sn() || Fe.openMenuId || P.modalOpen || F.modalOpen || Oe.modalOpen || I.nmapScanOpen || I.manualScanOpen || I.hostSelectionOpen || I.scriptCveOpen || I.providerLogsOpen || I.credentialsOpen || I.credentialCaptureConfigOpen || I.jobsOpen || I.submittedScansOpen || I.schedulerDecisionsOpen || I.hostRemoveOpen || I.graphNoteOpen || I.interfaceSettingsOpen || I.workspaceSwitchGuardOpen || I.settingsOpen || I.deviceCategorySettingsOpen || I.schedulerOpen || I.reportProviderOpen) return;
		let t = e.target;
		if (!(t instanceof Element) || t.closest("#graph-detail-panel") || t.closest("[data-graph-node-id], [data-graph-edge-id]")) return;
		let n = yn();
		n && n.contains(t) || Co();
	}), document.querySelectorAll("[data-wizard-goto]").forEach((e) => {
		e.addEventListener("click", () => {
			Hc(e.getAttribute("data-wizard-goto"));
		});
	});
	let fe = document.getElementById("nmap-wizard");
	fe && fe.querySelectorAll("input, select, textarea").forEach((e) => {
		let t = e.tagName === "INPUT" && (e.type === "checkbox" || e.type === "radio") || e.tagName === "SELECT" ? "change" : "input";
		e.addEventListener(t, () => {
			Me.postSubmitLock = !1, e.name === "nmap-scan-mode" && Hc(3), e.id === "nmap-engagement-preset-select" && wi(), Uc();
		});
	}), ["nmap-args"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("input", () => {
			Me.postSubmitLock = !1, Bc();
		});
	}), Di({
		scrollIntoView: !1,
		focusPreset: !1,
		focusTargets: !1
	});
}
// ../app/web/static/js/workspace/graph_events.js
function Jl(e) {
	if (!A.drag) return;
	e.preventDefault();
	let t = Number(e.clientX || 0) - Number(A.drag.startClientX || 0), n = Number(e.clientY || 0) - Number(A.drag.startClientY || 0);
	if (!A.drag.active && Math.hypot(t, n) < 4) return;
	if (A.drag.active = !0, A.drag.kind === "pan") {
		let e = document.getElementById("graph-workspace-canvas"), r = A.drag.viewport || A.viewport;
		if (!e || !r) return;
		let i = e.getBoundingClientRect();
		if (!i.width || !i.height) return;
		let a = Number(r.width || 1) / Math.max(1, i.width), o = Number(r.height || 1) / Math.max(1, i.height), s = wa(Number(A.drag.startCenterX || r.centerX || 0) - t * a - (r.boundsX || 0), Number(A.drag.startCenterY || r.centerY || 0) - n * o - (r.boundsY || 0), r.boundsWidth, r.boundsHeight, r.width, r.height);
		s.x += r.boundsX || 0, s.y += r.boundsY || 0;
		let c = s.x - Number(r.width || 1) / 2, l = s.y - Number(r.height || 1) / 2;
		A.viewport = {
			...r,
			x: c,
			y: l,
			centerX: s.x,
			centerY: s.y
		}, document.body.classList.add("graph-workspace-panning"), e.setAttribute("viewBox", `${c} ${l} ${r.width} ${r.height}`), A.detailMode === "floating" && Sn() && Eo();
		return;
	}
	let r = document.getElementById("graph-workspace-canvas");
	if (!r) return;
	let i = nr(r, e), a = Number(i.x || 0) - Number(A.drag.startPointX || 0), o = Number(i.y || 0) - Number(A.drag.startPointY || 0);
	Object.entries(A.drag.initialPositions || {}).forEach(([e, t]) => {
		A.positions[e] = {
			x: Math.max(20, Math.round((Number(t?.x) || 0) + a)),
			y: Math.max(28, Math.round((Number(t?.y) || 0) + o))
		};
	}), ss({ preserveDetail: !0 });
}
function Yl() {
	if (!A.drag) return;
	let e = !!A.drag.active;
	document.body.classList.remove("graph-workspace-panning"), window.removeEventListener("pointermove", Jl), window.removeEventListener("pointerup", Yl), A.drag = null, e && (A.suppressClickUntil = Date.now() + 180);
}
function Xl() {
	if (!gn()) return;
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
			e === "graph-view-select" && (R("graph-group-select", (Se[String(t.target.value || "attack_surface").trim()] || Se.attack_surface).defaultGroup || "finding"), A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, Kn()), [
				"graph-group-select",
				"graph-render-mode-select",
				"graph-severity-filter",
				"graph-pack-filter",
				"graph-time-window-filter"
			].includes(e) ? ss() : await ws({ background: !1 });
		});
	});
	let e = document.getElementById("graph-search-input");
	if (e) {
		let t = null;
		e.addEventListener("input", () => {
			t && window.clearTimeout(t), t = window.setTimeout(() => {
				ws({ background: !1 }).catch(() => {});
			}, 350);
		});
	}
	let t = document.getElementById("graph-min-confidence");
	t && t.addEventListener("input", () => {
		Hn(), ws({ background: !1 }).catch(() => {});
	});
	let n = document.getElementById("graph-zoom-slider");
	n && n.addEventListener("input", () => {
		Un(), ss();
	});
	let r = document.getElementById("graph-focus-depth-select");
	r && r.addEventListener("change", () => {
		A.focusDepth = Math.max(1, Math.min(3, parseInt(r.value, 10) || 1)), A.focusSeedNodeIds.length && ss();
	}), ["graph-hide-ai-suggested", "graph-hide-nmap-xml-artifacts"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", () => {
			ws({ background: !1 }).catch(() => {});
		});
	});
	let i = document.getElementById("graph-layout-select");
	i && i.addEventListener("change", () => {
		let e = String(i.value || "");
		e ? (rl(e), q("Layout loaded")) : ul();
	});
	let a = document.getElementById("graph-workspace-canvas");
	a && (a.addEventListener("click", (e) => {
		if (Number(A.suppressClickUntil || 0) > Date.now()) return;
		let t = e.target.closest("[data-graph-node-id]");
		if (t) {
			Ss("node", t.getAttribute("data-graph-node-id"));
			return;
		}
		let n = e.target.closest("[data-graph-edge-id]");
		n ? Ss("edge", n.getAttribute("data-graph-edge-id")) : e.target.closest("[data-graph-group-key]") || Co();
	}), a.addEventListener("dblclick", (e) => {
		let t = e.target.closest("[data-graph-node-id]");
		if (!t) return;
		let n = String(t.getAttribute("data-graph-node-id") || "");
		A.selectedKind = "node", A.selectedRef = n, J(fn("node", n), "summary_kind") && sl();
	}), a.addEventListener("pointerdown", (e) => {
		let t = e.target.closest("[data-graph-node-id]");
		if (!t) return;
		let n = String(t.getAttribute("data-graph-node-id") || ""), r = nr(a, e), i = A.filtered.positions?.[n] || A.positions?.[n];
		i && (A.drag = {
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
		}, window.addEventListener("pointermove", Jl), window.addEventListener("pointerup", Yl), e.preventDefault());
	}), a.addEventListener("pointerdown", (e) => {
		let t = e.target.closest("[data-graph-group-key]");
		if (!t || e.target.closest("[data-graph-node-id]")) return;
		let n = String(t.getAttribute("data-graph-group-key") || ""), r = ya(n), i = Array.isArray(r?.nodeIds) ? r.nodeIds.filter(Boolean) : [];
		if (!i.length) return;
		let o = nr(a, e), s = {};
		i.forEach((e) => {
			let t = A.filtered.positions?.[e] || A.positions?.[e];
			t && (s[e] = {
				x: Number(t.x) || 0,
				y: Number(t.y) || 0
			});
		}), Object.keys(s).length && (A.drag = {
			kind: "group",
			groupKey: n,
			nodeIds: Object.keys(s),
			initialPositions: s,
			startPointX: Number(o.x || 0),
			startPointY: Number(o.y || 0),
			startClientX: Number(e.clientX || 0),
			startClientY: Number(e.clientY || 0),
			active: !1
		}, window.addEventListener("pointermove", Jl), window.addEventListener("pointerup", Yl), e.preventDefault());
	}), a.addEventListener("pointerdown", (e) => {
		if (e.target.closest("[data-graph-node-id], [data-graph-edge-id], [data-graph-group-key]")) return;
		let t = A.viewport || Ea(A.filtered.width || 1600, A.filtered.height || 900);
		t && (A.drag = {
			kind: "pan",
			startClientX: Number(e.clientX || 0),
			startClientY: Number(e.clientY || 0),
			startCenterX: Number(t.centerX || 0),
			startCenterY: Number(t.centerY || 0),
			viewport: { ...t },
			active: !1
		}, window.addEventListener("pointermove", Jl), window.addEventListener("pointerup", Yl), e.preventDefault());
	})), Hn(), Un(), qn(), Kn();
}
// src/main.tsx
new nl().connect(), window.addEventListener("DOMContentLoaded", () => {
	let e = document.getElementById("initial-snapshot");
	if (e && e.textContent) try {
		As(JSON.parse(e.textContent));
	} catch {
		Ms("Init Error", !0);
	}
	window.LEGION_WS_ENABLED ? Fs() : (Ms("Polling/API", !1), Is(), window.setInterval(Is, 2e3)), Qc(), ln();
	let t = document.getElementById("scheduler-form");
	t && t.addEventListener("submit", $c);
	let n = document.getElementById("scheduler-provider-select");
	n && (n.addEventListener("change", () => {
		Yc(n.value);
	}), Yc(n.value));
	let r = document.getElementById("scheduler-goal-select");
	r && r.addEventListener("change", Jc);
	let i = document.getElementById("engagement-scope-select");
	i && i.addEventListener("change", Jc);
	let a = document.getElementById("engagement-intent-select");
	a && a.addEventListener("change", Jc), Jc();
	let o = document.getElementById("report-provider-form");
	o && o.addEventListener("submit", el), ql(), Xl(), Xr();
}), (() => {
	let e = (e) => document.getElementById(e), t = {
		overview: "Overview",
		hosts: "Hosts",
		services: "Services",
		graph: "Graph",
		activity: "Activity",
		capture: "Credentials & relay",
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
		}), e("breadcrumb-view").textContent = t[r], document.body.dataset.workspaceView = r, r === "services" && typeof gs == "function" && gs(!1), r === "graph" && typeof gn == "function" && gn() && (typeof vs == "function" && vs(!1), typeof ss == "function" && requestAnimationFrame(() => ss({ preserveDetail: !0 }))), i && o("view", r), f();
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
		let o = e("credential-capture-panel");
		e("capture-disabled-message").hidden = !o.hidden;
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
		let t = document.querySelectorAll("#graph-workspace-shell");
		t.length > 1 && (t[0].id = "graph-panel-layout");
		let r = e("workspace-views").querySelector(".ribbon-panel"), i = r.querySelector(".ribbon-menu-group");
		e("workspace-commandbar").appendChild(i), e("workspace-commandbar").appendChild(r.querySelector(".ribbon-summary-group"));
		let o = e("workspace-context");
		o.appendChild(r.querySelector(".ribbon-project-group")), b(), x();
		let d = r.querySelector(".ribbon-rationale-group"), f = r.querySelector(".ribbon-process-group"), h = c("overview", "overview-view");
		h.innerHTML = "<div class=\"welcome-workspace\"><span class=\"welcome-mark\" aria-hidden=\"true\">L</span><div id=\"welcome-no-hosts\"><h1>What would you like to investigate?</h1><p>A clear view of your hosts, services, and evidence.</p></div><div id=\"welcome-has-hosts\" hidden><h1>Your workspace, connected.</h1><p>Pick up an investigation or bring in new results.</p></div><div class=\"welcome-action-card\"><span class=\"welcome-card-label\">Start with a target. Build the picture.</span><div class=\"welcome-actions\"><button type=\"button\" class=\"primary-action\" data-proxy=\"ribbon-scan-add-action-button\"><i class=\"fa-solid fa-plus\" aria-hidden=\"true\"></i> New scan</button><button type=\"button\" data-proxy=\"ribbon-import-xml-action-button\">Import Nmap XML</button><button type=\"button\" data-proxy=\"ribbon-workspace-open-action-button\">Open workspace</button></div></div><div class=\"welcome-shortcuts\"><span><kbd>Ctrl K</kbd> Search views and actions</span><span>Results and evidence stay in your workspace</span></div></div>", c("hosts", "inspection-view").appendChild(e("workspace-hosts-panel")), c("services", "inspection-view").appendChild(e("workspace-services-panel"));
		let S = e("workspace-host-detail-panel"), C = u("workspace-detail-empty", "Select a host to inspect", "Ports, scripts, screenshots, and notes will appear here.");
		S.insertBefore(C, S.children[1]), n.hosts.appendChild(S);
		let w = c("graph", "graph-view");
		w.appendChild(e("graph-workspace-panel")), w.appendChild(u("graph-disabled-message", "Graph workspace is disabled", "Enable Graph Workspace in Interface settings to explore relationships and evidence.", {
			label: "Interface settings",
			target: "ribbon-interface-settings-button"
		})), c("activity", "activity-view").append(f, d);
		let T = c("capture", "capture-view");
		T.appendChild(e("credential-capture-panel")), T.appendChild(u("capture-disabled-message", "Credential workspace is hidden", "Show the existing credential and relay workspace to access its controls.", {
			label: "Show workspace",
			target: "ribbon-credential-capture-toggle-button"
		})), c("approvals", "approvals-view").appendChild(e("workspace-approvals-panel")), r.hidden = !0;
		let E = document.createElement("div");
		E.id = "inspection-resizer", E.className = "inspection-resizer", E.tabIndex = 0, E.setAttribute("role", "separator"), E.setAttribute("aria-label", "Resize host list"), E.setAttribute("aria-orientation", "vertical"), E.setAttribute("aria-valuemin", "320"), E.setAttribute("aria-valuemax", "900"), n.hosts.insertBefore(E, S), g("sidebar-resizer", "--sidebar-width", 210, 340, "sidebarWidth", 250), g("inspection-resizer", "--list-width", 320, 900, "listWidth", 540), e("sidebar-toggle").addEventListener("click", () => m(!0)), e("sidebar-reopen").addEventListener("click", () => m(!1)), m(a("sidebarCollapsed", "false") === "true"), e("workspace-context-toggle").addEventListener("click", () => {
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
		let D = new MutationObserver(p);
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
			n && D.observe(n, {
				childList: !0,
				characterData: !0,
				subtree: !0,
				attributes: !0,
				attributeFilter: ["data-display-name"]
			});
		}), ["graph-workspace-panel", "credential-capture-panel"].forEach((t) => D.observe(e(t), {
			attributes: !0,
			attributeFilter: ["hidden", "data-graph-enabled"]
		})), l(a("view", "overview"), !1);
	});
})(), window.addEventListener("DOMContentLoaded", () => {
	let e = document.getElementById("workspace-identity-sidebar"), t = document.getElementById("workspace-identity-title"), n = document.querySelector(".workspace-project-shell"), r = document.querySelector(".workspace-breadcrumb"), i = document.getElementById("workspace-react-root"), a = document.getElementById("jobs-body");
	if (!e || !t || !n || !r || !i || !a) throw Error("Workspace component mount points are missing.");
	e.replaceChildren(), t.replaceChildren(), a.replaceChildren(), f({
		updateJobs: x,
		updateProject: b,
		beginRename: S
	}), (0, c.createRoot)(i).render(/* @__PURE__ */ (0, Ue.jsx)(We, {
		sidebar: e,
		title: t,
		sidebarEditor: n,
		titleEditor: r
	})), (0, c.createRoot)(a).render(/* @__PURE__ */ (0, Ue.jsx)(Ge, {})), i.dataset.framework = "react", a.dataset.framework = "react";
});
