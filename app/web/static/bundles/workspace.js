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
	var ye = Array.isArray, j = r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, be = a.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, xe = {
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
	function Ee(e, t) {
		Ce++, Se[Ce] = e.current, e.current = t;
	}
	var M = we(null), De = we(null), Oe = we(null), ke = we(null);
	function N(e, t) {
		switch (Ee(Oe, t), Ee(De, e), Ee(M, null), t.nodeType) {
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
		Te(M), Ee(M, e);
	}
	function Ae() {
		Te(M), Te(De), Te(Oe);
	}
	function je(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, Ee(ke, e)), t = M.current;
		var n = dp(t, e.type);
		t !== n && (Ee(De, e), Ee(M, n));
	}
	function Me(e) {
		De.current === e && (Te(M), Te(De)), ke.current === e && (Te(ke), sh._currentValue = xe);
	}
	var Ne, Pe;
	function P(e) {
		if (Ne === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			Ne = t && t[1] || "", Pe = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + Ne + e + Pe;
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
		return (n = e ? e.displayName || e.name : "") ? P(n) : "";
	}
	function Le(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return P(e.type);
			case 16: return P("Lazy");
			case 13: return e.child !== t && t !== null ? P("Suspense Fallback") : P("Suspense");
			case 19: return P("SuspenseList");
			case 0:
			case 15: return Ie(e.type, !1);
			case 11: return Ie(e.type.render, !1);
			case 1: return Ie(e.type, !0);
			case 31: return P("Activity");
			case 30: return P("ViewTransition");
			default: return "";
		}
	}
	function Re(e) {
		try {
			var t = "", n = null;
			do
				t += Le(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var F = Object.prototype.hasOwnProperty, I = t.unstable_scheduleCallback, L = t.unstable_cancelCallback, R = t.unstable_shouldYield, z = t.unstable_requestPaint, B = t.unstable_now, ze = t.unstable_getCurrentPriorityLevel, V = t.unstable_ImmediatePriority, H = t.unstable_UserBlockingPriority, Be = t.unstable_NormalPriority, Ve = t.unstable_LowPriority, U = t.unstable_IdlePriority, He = t.log, Ue = t.unstable_setDisableYieldValue, We = null, Ge = null;
	function Ke(e) {
		if (typeof He == "function" && Ue(e), Ge && typeof Ge.setStrictMode == "function") try {
			Ge.setStrictMode(We, e);
		} catch {}
	}
	var qe = Math.clz32 ? Math.clz32 : W, Je = Math.log, Ye = Math.LN2;
	function W(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Je(e) / Ye | 0) | 0;
	}
	var Xe = 256, Ze = 262144, Qe = 4194304;
	function $e(e) {
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
	function et(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = $e(n))) : i = $e(o) : i = $e(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = $e(n))) : i = $e(o)) : i = $e(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function tt(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function nt(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - qe(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function rt(e, t) {
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
	function it() {
		var e = Qe;
		return Qe <<= 1, !(Qe & 62914560) && (Qe = 4194304), e;
	}
	function at(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function ot(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function st(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - qe(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && ct(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function ct(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - qe(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function lt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - qe(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function ut(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : dt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function dt(e) {
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
	function ft(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function pt() {
		var e = be.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function mt(e, t) {
		var n = be.p;
		try {
			return be.p = e, t();
		} finally {
			be.p = n;
		}
	}
	var ht = Math.random().toString(36).slice(2), gt = "__reactFiber$" + ht, _t = "__reactProps$" + ht, vt = "__reactContainer$" + ht, yt = "__reactEvents$" + ht, bt = "__reactListeners$" + ht, xt = "__reactHandles$" + ht, St = "__reactResources$" + ht, Ct = "__reactMarker$" + ht, wt = "__reactLoad$" + ht;
	function Tt(e) {
		delete e[gt], delete e[_t], delete e[bt], delete e[xt];
	}
	function Et(e) {
		var t;
		if (t = e[gt]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[vt] || n[gt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[gt]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Dt(e) {
		if (e = e[gt] || e[vt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function Ot(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(s(33));
	}
	function kt(e) {
		var t = e[St];
		return t ||= e[St] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function At(e) {
		e[Ct] = !0;
	}
	function jt(e) {
		e[wt] = void 0;
	}
	var Mt = /* @__PURE__ */ new Set(), Nt = {};
	function Pt(e, t) {
		Ft(e, t), Ft(e + "Capture", t);
	}
	function Ft(e, t) {
		for (Nt[e] = t, e = 0; e < t.length; e++) Mt.add(t[e]);
	}
	var It = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Lt = {}, Rt = {};
	function zt(e) {
		return F.call(Rt, e) ? !0 : F.call(Lt, e) ? !1 : It.test(e) ? Rt[e] = !0 : (Lt[e] = !0, !1);
	}
	var G = !1;
	function Bt() {
		var e = G;
		return G = !1, e;
	}
	function Vt(e, t, n) {
		if (zt(t)) {
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
	function Ht(e, t, n) {
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
	function Ut(e, t, n, r) {
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
	function Wt(e) {
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
	function Gt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Kt(e, t, n) {
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
	function qt(e) {
		if (!e._valueTracker) {
			var t = Gt(e) ? "checked" : "value";
			e._valueTracker = Kt(e, t, "" + e[t]);
		}
	}
	function Jt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Gt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var Yt = /[\n"\\]/g;
	function Xt(e) {
		return e.replace(Yt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Zt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Wt(t)) : e.value !== "" + Wt(t) && (e.value = "" + Wt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : $t(e, Wt(n)) : o === "number" && e.value == t ? $t(e, Wt(e.value)) : $t(e, Wt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Wt(s) : e.removeAttribute("name");
	}
	function Qt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				qt(e);
				return;
			}
			n = n == null ? "" : "" + Wt(n), t = t == null ? n : "" + Wt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), qt(e);
	}
	function $t(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function en(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Wt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function tn(e, t, n) {
		t != null && (t = "" + Wt(t), t !== e.value && (e.value = t), n == null) ? e.defaultValue !== t && (e.defaultValue = t) : e.defaultValue = n == null ? "" : "" + Wt(n);
	}
	function nn(e, t, n, r) {
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
		n = Wt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), qt(e);
	}
	function rn(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var an = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function on(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || an.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function sn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(s(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", G = !0);
			for (var i in t) r = t[i], t.hasOwnProperty(i) && n[i] !== r && (on(e, i, r), G = !0);
		} else for (var a in t) t.hasOwnProperty(a) && on(e, a, t[a]);
	}
	function cn(e) {
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
	var ln = /* @__PURE__ */ new Map([
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
	]), un = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function dn(e) {
		return un.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function K() {}
	var fn = null;
	function pn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var mn = null, hn = null;
	function gn(e) {
		var t = Dt(e);
		if (t && (e = t.stateNode)) {
			var n = e[_t] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Zt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Xt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var i = r[_t] || null;
								if (!i) throw Error(s(90));
								Zt(r, i.value, i.defaultValue, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Jt(r);
					}
					break a;
				case "textarea":
					tn(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && en(e, !!n.multiple, t, !1);
			}
		}
	}
	var q = !1;
	function _n(e, t, n) {
		if (q) return e(t, n);
		q = !0;
		try {
			return e(t);
		} finally {
			if (q = !1, (mn !== null || hn !== null) && (Ld(), mn && (t = mn, e = hn, hn = mn = null, gn(t), e))) for (t = 0; t < e.length; t++) gn(e[t]);
		}
	}
	function vn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[_t] || null;
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
	var yn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, bn = !1;
	if (yn) try {
		var xn = {};
		Object.defineProperty(xn, "passive", { get: function() {
			bn = !0;
		} }), window.addEventListener("test", xn, xn), window.removeEventListener("test", xn, xn);
	} catch {
		bn = !1;
	}
	var Sn = null, Cn = null, wn = null;
	function Tn() {
		if (wn) return wn;
		var e, t = Cn, n = t.length, r, i = "value" in Sn ? Sn.value : Sn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return wn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function En(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Dn() {
		return !0;
	}
	function On() {
		return !1;
	}
	function kn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Dn : On, this.isPropagationStopped = On, this;
		}
		return D(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Dn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Dn);
			},
			persist: function() {},
			isPersistent: Dn
		}), t;
	}
	var An = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, jn = kn(An), Mn = D({}, An, {
		view: 0,
		detail: 0
	}), Nn = kn(Mn), Pn, Fn, In, Ln = D({}, Mn, {
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
		getModifierState: Jn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== In && (In && e.type === "mousemove" ? (Pn = e.screenX - In.screenX, Fn = e.screenY - In.screenY) : Fn = Pn = 0, In = e), Pn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Fn;
		}
	}), Rn = kn(Ln), zn = kn(D({}, Ln, { dataTransfer: 0 })), Bn = kn(D({}, Mn, { relatedTarget: 0 })), Vn = kn(D({}, An, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Hn = kn(D({}, An, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Un = kn(D({}, An, { data: 0 })), Wn = {
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
	}, Gn = {
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
	}, Kn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function qn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Kn[e]) ? !!t[e] : !1;
	}
	function Jn() {
		return qn;
	}
	var Yn = kn(D({}, Mn, {
		key: function(e) {
			if (e.key) {
				var t = Wn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = En(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Gn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Jn,
		charCode: function(e) {
			return e.type === "keypress" ? En(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? En(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Xn = kn(D({}, Ln, {
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
	})), Zn = kn(D({}, An, { submitter: 0 })), Qn = kn(D({}, Mn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Jn
	})), $n = kn(D({}, An, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), er = kn(D({}, Ln, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), tr = kn(D({}, An, {
		newState: 0,
		oldState: 0,
		source: 0
	})), nr = [
		9,
		13,
		27,
		32
	], rr = yn && "CompositionEvent" in window, ir = null;
	yn && "documentMode" in document && (ir = document.documentMode);
	var ar = yn && "TextEvent" in window && !ir, or = yn && (!rr || ir && 8 < ir && 11 >= ir), sr = " ", cr = !1;
	function lr(e, t) {
		switch (e) {
			case "keyup": return nr.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function ur(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var dr = !1;
	function fr(e, t) {
		switch (e) {
			case "compositionend": return ur(t);
			case "keypress": return t.which === 32 ? (cr = !0, sr) : null;
			case "textInput": return e = t.data, e === sr && cr ? null : e;
			default: return null;
		}
	}
	function pr(e, t) {
		if (dr) return e === "compositionend" || !rr && lr(e, t) ? (e = Tn(), wn = Cn = Sn = null, dr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return or && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var mr = {
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
	function hr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!mr[e.type] : t === "textarea";
	}
	function gr(e, t, n, r) {
		mn ? hn ? hn.push(r) : hn = [r] : mn = r, t = qf(t, "onChange"), 0 < t.length && (n = new jn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var _r = null, vr = null;
	function yr(e) {
		Bf(e, 0);
	}
	function br(e) {
		if (Jt(Ot(e))) return e;
	}
	function xr(e, t) {
		if (e === "change") return t;
	}
	var Sr = !1;
	if (yn) {
		var Cr;
		if (yn) {
			var wr = "oninput" in document;
			if (!wr) {
				var Tr = document.createElement("div");
				Tr.setAttribute("oninput", "return;"), wr = typeof Tr.oninput == "function";
			}
			Cr = wr;
		} else Cr = !1;
		Sr = Cr && (!document.documentMode || 9 < document.documentMode);
	}
	function Er() {
		_r && (_r.detachEvent("onpropertychange", Dr), vr = _r = null);
	}
	function Dr(e) {
		if (e.propertyName === "value" && br(vr)) {
			var t = [];
			gr(t, vr, e, pn(e)), _n(yr, t);
		}
	}
	function Or(e, t, n) {
		e === "focusin" ? (Er(), _r = t, vr = n, _r.attachEvent("onpropertychange", Dr)) : e === "focusout" && Er();
	}
	function kr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return br(vr);
	}
	function Ar(e, t) {
		if (e === "click") return br(t);
	}
	function jr(e, t) {
		if (e === "input" || e === "change") return br(t);
	}
	function Mr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Nr = typeof Object.is == "function" ? Object.is : Mr;
	function Pr(e, t) {
		if (Nr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!F.call(t, i) || !Nr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Fr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function Ir(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Lr(e, t) {
		var n = Ir(e);
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
			n = Ir(n);
		}
	}
	function Rr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Rr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function zr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Fr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Fr(e.document);
		}
		return t;
	}
	function Br(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Vr = yn && "documentMode" in document && 11 >= document.documentMode, Hr = null, Ur = null, Wr = null, Gr = !1;
	function Kr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Gr || Hr == null || Hr !== Fr(r) || (r = Hr, "selectionStart" in r && Br(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Wr && Pr(Wr, r) || (Wr = r, r = qf(Ur, "onSelect"), 0 < r.length && (t = new jn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Hr)));
	}
	function qr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Jr = {
		animationend: qr("Animation", "AnimationEnd"),
		animationiteration: qr("Animation", "AnimationIteration"),
		animationstart: qr("Animation", "AnimationStart"),
		transitionrun: qr("Transition", "TransitionRun"),
		transitionstart: qr("Transition", "TransitionStart"),
		transitioncancel: qr("Transition", "TransitionCancel"),
		transitionend: qr("Transition", "TransitionEnd")
	}, Yr = {}, Xr = {};
	yn && (Xr = document.createElement("div").style, "AnimationEvent" in window || (delete Jr.animationend.animation, delete Jr.animationiteration.animation, delete Jr.animationstart.animation), "TransitionEvent" in window || delete Jr.transitionend.transition);
	function Zr(e) {
		if (Yr[e]) return Yr[e];
		if (!Jr[e]) return e;
		var t = Jr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Xr) return Yr[e] = t[n];
		return e;
	}
	var Qr = Zr("animationend"), $r = Zr("animationiteration"), ei = Zr("animationstart"), ti = Zr("transitionrun"), ni = Zr("transitionstart"), ri = Zr("transitioncancel"), ii = Zr("transitionend"), ai = /* @__PURE__ */ new Map(), oi = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	oi.push("scrollEnd");
	function si(e, t) {
		ai.set(e, t), Pt(t, [e]);
	}
	var ci = 0;
	function li(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = vd.identifierPrefix;
		var n = ci++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function ui(e) {
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
	function di(e, t) {
		return e = ui(e), t = ui(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var fi = typeof reportError == "function" ? reportError : function(e) {
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
	}, pi = [], mi = 0, hi = 0;
	function gi() {
		for (var e = mi, t = hi = mi = 0; t < e;) {
			var n = pi[t];
			pi[t++] = null;
			var r = pi[t];
			pi[t++] = null;
			var i = pi[t];
			pi[t++] = null;
			var a = pi[t];
			if (pi[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && bi(n, i, a);
		}
	}
	function _i(e, t, n, r) {
		pi[mi++] = e, pi[mi++] = t, pi[mi++] = n, pi[mi++] = r, hi |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function vi(e, t, n, r) {
		return _i(e, t, n, r), xi(e);
	}
	function yi(e, t) {
		return _i(e, null, null, t), xi(e);
	}
	function bi(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - qe(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function xi(e) {
		if (50 < Dd) throw Dd = 0, Od = null, Error(s(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var Si = {};
	function Ci(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function wi(e, t, n, r) {
		return new Ci(e, t, n, r);
	}
	function Ti(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Ei(e, t) {
		var n = e.alternate;
		return n === null ? (n = wi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function Di(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function Oi(e, t, n, r, i, a) {
		var o = 0;
		if (r = e, typeof r == "function") Ti(r) && (o = 1);
		else if (typeof r == "string") o = qm(e, n, M.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case fe: return e = wi(31, n, t, i), e.elementType = fe, e.lanes = a, e;
			case ne: return ki(n.children, i, a, t);
			case re:
				o = 8, i |= 24;
				break;
			case ie: return e = wi(12, n, t, i | 2), e.elementType = ie, e.lanes = a, e;
			case ce: return e = wi(13, n, t, i), e.elementType = ce, e.lanes = a, e;
			case le: return e = wi(19, n, t, i), e.elementType = le, e.lanes = a, e;
			case pe:
			case k: return e = i | 32, e = wi(30, n, t, e), e.elementType = k, e.lanes = a, e.stateNode = {
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
		return t = wi(o, n, t, i), t.elementType = e, t.type = r, t.lanes = a, t;
	}
	function ki(e, t, n, r) {
		return e = wi(7, e, r, t), e.lanes = n, e;
	}
	function Ai(e, t, n) {
		return e = wi(6, e, null, t), e.lanes = n, e;
	}
	function ji(e) {
		var t = wi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function Mi(e, t, n) {
		return t = wi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Ni = /* @__PURE__ */ new WeakMap();
	function Pi(e, t) {
		if (typeof e == "object" && e) {
			var n = Ni.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Re(t)
			}, Ni.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Re(t)
		};
	}
	var Fi = [], Ii = 0, Li = null, Ri = 0, zi = [], Bi = 0, Vi = null, Hi = 1, Ui = "";
	function Wi(e, t) {
		Fi[Ii++] = Ri, Fi[Ii++] = Li, Li = e, Ri = t;
	}
	function Gi(e, t, n) {
		zi[Bi++] = Hi, zi[Bi++] = Ui, zi[Bi++] = Vi, Vi = e;
		var r = Hi;
		e = Ui;
		var i = 32 - qe(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - qe(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Hi = 1 << 32 - qe(t) + i | n << i | r, Ui = a + e;
		} else Hi = 1 << a | n << i | r, Ui = e;
	}
	function Ki(e) {
		e.return !== null && (Wi(e, 1), Gi(e, 1, 0));
	}
	function qi(e) {
		for (; e === Li;) Li = Fi[--Ii], Fi[Ii] = null, Ri = Fi[--Ii], Fi[Ii] = null;
		for (; e === Vi;) Vi = zi[--Bi], zi[Bi] = null, Ui = zi[--Bi], zi[Bi] = null, Hi = zi[--Bi], zi[Bi] = null;
	}
	function Ji(e, t) {
		zi[Bi++] = Hi, zi[Bi++] = Ui, zi[Bi++] = Vi, Hi = t.id, Ui = t.overflow, Vi = e;
	}
	var Yi = null, Xi = null, J = !1, Zi = null, Qi = !1, $i = Error(s(519));
	function ea(e) {
		throw oa(Pi(Error(s(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), $i;
	}
	function ta(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[gt] = e, t[_t] = r, n) {
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
				$("invalid", t), Qt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				$("invalid", t);
				break;
			case "textarea": $("invalid", t), nn(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || $f(t.textContent, n) ? (r.popover != null && ($("beforetoggle", t), $("toggle", t)), r.onScroll != null && $("scroll", t), r.onScrollEnd != null && $("scrollend", t), r.onClick != null && (t.onclick = K), t = !0) : t = !1, t || ea(e, !0);
	}
	function na(e) {
		for (Yi = e.return; Yi;) switch (Yi.tag) {
			case 5:
			case 31:
			case 13:
				Qi = !1;
				return;
			case 27:
			case 3:
				Qi = !0;
				return;
			default: Yi = Yi.return;
		}
	}
	function ra(e) {
		if (e !== Yi) return !1;
		if (!J) return na(e), J = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && Xi && ea(e), na(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(317));
			Xi = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(317));
			Xi = dm(e);
		} else t === 27 ? (t = Xi, Sp(e.type) ? (e = um, um = null, Xi = e) : Xi = t) : Xi = Yi ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function ia() {
		Xi = Yi = null, J = !1;
	}
	function aa() {
		var e = Zi;
		return e !== null && (ud === null ? ud = e : ud.push.apply(ud, e), Zi = null), e;
	}
	function oa(e) {
		Zi === null ? Zi = [e] : Zi.push(e);
	}
	var sa = we(null), ca = null, la = null;
	function ua(e, t, n) {
		Ee(sa, t._currentValue), t._currentValue = n;
	}
	function da(e) {
		e._currentValue = sa.current, Te(sa);
	}
	function fa(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function pa(e, t, n, r) {
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
						a.lanes |= n, c = a.alternate, c !== null && (c.lanes |= n), fa(a.return, n, e), r || (o = null);
						break a;
					}
					a = c.next;
				}
			} else if (i.tag === 18) {
				if (o = i.return, o === null) throw Error(s(341));
				o.lanes |= n, a = o.alternate, a !== null && (a.lanes |= n), fa(o, n, e), o = null;
			} else i.tag === 13 && i.memoizedState !== null && i.memoizedState.dehydrated === null ? (i.lanes |= n, o = i.alternate, o !== null && (o.lanes |= n), fa(i.return, n, e), o = i.child, o = o === null ? null : o.sibling) : o = i.child;
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
	function ma(e, t, n, r) {
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
					Nr(i.pendingProps.value, o.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (i === ke.current) {
				if (o = i.alternate, o === null) throw Error(s(387));
				o.memoizedState.memoizedState !== i.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			i = i.return;
		}
		return e !== null && pa(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function ha(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Nr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function ga(e) {
		ca = e, la = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function _a(e) {
		return ya(ca, e);
	}
	function va(e, t) {
		return ca === null && ga(e), ya(e, t);
	}
	function ya(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, la === null) {
			if (e === null) throw Error(s(308));
			la = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else la = la.next = t;
		return n;
	}
	var ba = typeof AbortController < "u" ? AbortController : function() {
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
	}, xa = t.unstable_scheduleCallback, Sa = t.unstable_NormalPriority, Ca = {
		$$typeof: oe,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function wa() {
		return {
			controller: new ba(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function Ta(e) {
		e.refCount--, e.refCount === 0 && xa(Sa, function() {
			e.controller.abort();
		});
	}
	function Ea(e, t) {
		if (e.pendingLanes & 4194048) {
			var n = e.transitionTypes;
			for (n === null && (n = e.transitionTypes = []), e = 0; e < t.length; e++) {
				var r = t[e];
				n.indexOf(r) === -1 && n.push(r);
			}
		}
	}
	var Da = null;
	function Oa(e) {
		var t = e.transitionTypes;
		return e.transitionTypes = null, t;
	}
	var ka = null, Aa = 0, ja = 0, Ma = null;
	function Na(e, t) {
		if (ka === null) {
			var n = ka = [];
			Aa = 0, ja = Nf(), Ma = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return Aa++, t.then(Pa, Pa), t;
	}
	function Pa() {
		if (--Aa === 0 && (Da = null, ka !== null)) {
			Ma !== null && (Ma.status = "fulfilled");
			var e = ka;
			ka = null, ja = 0, Ma = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function Fa(e, t) {
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
	var Ia = j.S;
	j.S = function(e, t) {
		if (pd = B(), typeof t == "object" && t && typeof t.then == "function" && Na(e, t), Da !== null) for (var n = yf; n !== null;) Ea(n, Da), n = n.next;
		if (n = e.types, n !== null) {
			for (var r = yf; r !== null;) Ea(r, n), r = r.next;
			if (ja !== 0) {
				r = Da, r === null && (r = Da = []);
				for (var i = 0; i < n.length; i++) {
					var a = n[i];
					r.indexOf(a) === -1 && r.push(a);
				}
			}
		}
		Ia !== null && Ia(e, t);
	};
	var La = we(null);
	function Ra() {
		var e = La.current;
		return e === null ? Xu.pooledCache : e;
	}
	function za(e, t) {
		t === null ? Ee(La, La.current) : Ee(La, t.pool);
	}
	function Ba() {
		var e = Ra();
		return e === null ? null : {
			parent: Ca._currentValue,
			pool: e
		};
	}
	var Va = Error(s(460)), Ha = Error(s(474)), Ua = Error(s(542)), Wa = { then: function() {} };
	function Ga(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Ka(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(K, K), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Xa(e), e === void 0 && !("reason" in t) ? Error(s(600)) : e;
			default:
				if (typeof t.status == "string") t.then(K, K);
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
					case "rejected": throw e = t.reason, Xa(e), e;
				}
				throw Ja = t, Va;
		}
	}
	function qa(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Ja = e, Va) : e;
		}
	}
	var Ja = null;
	function Ya() {
		if (Ja === null) throw Error(s(459));
		var e = Ja;
		return Ja = null, e;
	}
	function Xa(e) {
		if (e === Va || e === Ua) throw Error(s(483));
	}
	var Za = null, Qa = 0;
	function $a(e) {
		var t = Qa;
		return Qa += 1, Za === null && (Za = []), Ka(Za, e, t);
	}
	function eo(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function to(e, t) {
		throw t.$$typeof === O ? Error(s(525)) : (e = Object.prototype.toString.call(t), Error(s(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function no(e) {
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
			return e = Ei(e, t), e.index = 0, e.sibling = null, e;
		}
		function a(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function o(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Ai(n, e.mode, r), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var a = n.type;
			return a === ne ? (e = d(e, t, n.props.children, r, n.key), eo(e, n), e) : t !== null && (t.elementType === a || typeof a == "object" && a && a.$$typeof === de && qa(a) === t.type) ? (t = i(t, n.props), eo(t, n), t.return = e, t) : (t = Oi(n.type, n.key, n.props, null, e.mode, r), eo(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = Mi(n, e.mode, r), t.return = e, t) : (t = i(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, a) {
			return t === null || t.tag !== 7 ? (t = ki(n, e.mode, r, a), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Ai("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case ee: return n = Oi(t.type, t.key, t.props, null, e.mode, n), eo(n, t), n.return = e, n;
					case te: return t = Mi(t, e.mode, n), t.return = e, t;
					case de: return t = qa(t), f(e, t, n);
				}
				if (ye(t) || _e(t)) return t = ki(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, $a(t), n);
				if (t.$$typeof === oe) return f(e, va(e, t), n);
				to(e, t);
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
					case de: return n = qa(n), p(e, t, n, r);
				}
				if (ye(n) || _e(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, $a(n), r);
				if (n.$$typeof === oe) return p(e, t, va(e, n), r);
				to(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case ee: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case te: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case de: return r = qa(r), m(e, t, n, r, i);
				}
				if (ye(r) || _e(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, $a(r), i);
				if (r.$$typeof === oe) return m(e, t, n, va(t, r), i);
				to(t, r);
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
			if (h === s.length) return n(i, d), J && Wi(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (o = a(d, o, h), u === null ? l = d : u.sibling = d, u = d);
				return J && Wi(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), o = a(g, o, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), J && Wi(i, h), l;
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
			if (v.done) return n(i, h), J && Wi(i, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(i, v.value, l), v !== null && (o = a(v, o, g), d === null ? u = v : d.sibling = v, d = v);
				return J && Wi(i, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, i, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), o = a(v, o, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(i, e);
			}), J && Wi(i, g), u;
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
											n(e, r.sibling), c = i(r, a.props.children), eo(c, a), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === de && qa(l) === r.type) {
										n(e, r.sibling), c = i(r, a.props), eo(c, a), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							a.type === ne ? (c = ki(a.props.children, e.mode, c, a.key), eo(c, a), c.return = e, e = c) : (c = Oi(a.type, a.key, a.props, null, e.mode, c), eo(c, a), c.return = e, e = c);
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
							c = Mi(a, e.mode, c), c.return = e, e = c;
						}
						return o(e);
					case de: return a = qa(a), _(e, r, a, c);
				}
				if (ye(a)) return h(e, r, a, c);
				if (_e(a)) {
					if (l = _e(a), typeof l != "function") throw Error(s(150));
					return a = l.call(a), g(e, r, a, c);
				}
				if (typeof a.then == "function") return _(e, r, $a(a), c);
				if (a.$$typeof === oe) return _(e, r, va(e, a), c);
				to(e, a);
			}
			return typeof a == "string" && a !== "" || typeof a == "number" || typeof a == "bigint" ? (a = "" + a, r !== null && r.tag === 6 ? (n(e, r.sibling), c = i(r, a), c.return = e, e = c) : (n(e, r), c = Ai(a, e.mode, c), c.return = e, e = c), o(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Qa = 0;
				var i = _(e, t, n, r);
				return Za = null, i;
			} catch (t) {
				if (t === Va || t === Ua) throw t;
				var a = wi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var ro = no(!0), io = no(!1), ao = !1;
	function oo(e) {
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
	function so(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function co(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function lo(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, Yu & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = xi(e), bi(e, null, n), t;
		}
		return _i(e, r, t, n), xi(e);
	}
	function uo(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, lt(e, n);
		}
	}
	function fo(e, t) {
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
	var po = !1;
	function mo() {
		if (po) {
			var e = Ma;
			if (e !== null) throw e;
		}
	}
	function ho(e, t, n, r) {
		po = !1;
		var i = e.updateQueue;
		ao = !1;
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
					f !== 0 && f === ja && (po = !0), u !== null && (u = u.next = {
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
							case 2: ao = !0;
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
	function go(e, t) {
		if (typeof e != "function") throw Error(s(191, e));
		e.call(t);
	}
	function _o(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) go(n[e], t);
	}
	var vo = we(null), yo = we(0);
	function bo(e, t) {
		e = nd, Ee(yo, e), Ee(vo, t), nd = e | t.baseLanes;
	}
	function xo() {
		Ee(yo, nd), Ee(vo, vo.current);
	}
	function So() {
		nd = yo.current, Te(vo), Te(yo);
	}
	var Co = we(null), wo = null;
	function To(e) {
		var t = e.alternate;
		Ee(Ao, Ao.current & 1), Ee(Co, e), wo === null && (t === null || vo.current !== null || t.memoizedState !== null) && (wo = e);
	}
	function Eo(e) {
		Ee(Ao, Ao.current), Ee(Co, e), wo === null && (wo = e);
	}
	function Do(e) {
		e.tag === 22 ? (Ee(Ao, Ao.current), Ee(Co, e), wo === null && (wo = e)) : Oo();
	}
	function Oo() {
		Ee(Ao, Ao.current), Ee(Co, Co.current);
	}
	function ko(e) {
		Te(Co), wo === e && (wo = null), Te(Ao);
	}
	var Ao = we(0);
	function jo(e, t) {
		Ee(Co, Co.current), Ee(Ao, t);
	}
	function Mo(e) {
		Te(Ao), Te(Co), wo === e && (wo = null);
	}
	function No(e) {
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
	var Po = 0, Y = null, Fo = null, Io = null, Lo = !1, Ro = !1, zo = !1, Bo = 0, Vo = 0, Ho = null, Uo = 0;
	function Wo() {
		throw Error(s(321));
	}
	function Go(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Nr(e[n], t[n])) return !1;
		return !0;
	}
	function Ko(e, t, n, r, i, a) {
		return Po = a, Y = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, j.H = e === null || e.memoizedState === null ? lc : uc, zo = !1, a = n(r, i), zo = !1, Ro && (a = Jo(t, n, r, i)), qo(e), a;
	}
	function qo(e) {
		j.H = cc;
		var t = Fo !== null && Fo.next !== null;
		if (Po = 0, Io = Fo = Y = null, Lo = !1, Vo = 0, Ho = null, t) throw Error(s(300));
		e === null || Dc || (e = e.dependencies, e !== null && ha(e) && (Dc = !0));
	}
	function Jo(e, t, n, r) {
		Y = e;
		var i = 0;
		do {
			if (Ro && (Ho = null), Vo = 0, Ro = !1, 25 <= i) throw Error(s(301));
			if (i += 1, Io = Fo = null, e.updateQueue != null) {
				var a = e.updateQueue;
				a.lastEffect = null, a.events = null, a.stores = null, a.memoCache != null && (a.memoCache.index = 0);
			}
			j.H = dc, a = t(n, r);
		} while (Ro);
		return a;
	}
	function Yo() {
		var e = j.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? ns(t) : t, e = e.useState()[0], (Fo === null ? null : Fo.memoizedState) !== e && (Y.flags |= 1024), t;
	}
	function Xo() {
		var e = Bo !== 0;
		return Bo = 0, e;
	}
	function Zo(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Qo(e) {
		if (Lo) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			Lo = !1;
		}
		Po = 0, Io = Fo = Y = null, Ro = !1, Vo = Bo = 0, Ho = null;
	}
	function $o() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return Io === null ? Y.memoizedState = Io = e : Io = Io.next = e, Io;
	}
	function es() {
		if (Fo === null) {
			var e = Y.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = Fo.next;
		var t = Io === null ? Y.memoizedState : Io.next;
		if (t !== null) Io = t, Fo = e;
		else {
			if (e === null) throw Y.alternate === null ? Error(s(467)) : Error(s(310));
			Fo = e, e = {
				memoizedState: Fo.memoizedState,
				baseState: Fo.baseState,
				baseQueue: Fo.baseQueue,
				queue: Fo.queue,
				next: null
			}, Io === null ? Y.memoizedState = Io = e : Io = Io.next = e;
		}
		return Io;
	}
	function ts() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function ns(e) {
		var t = Vo;
		return Vo += 1, Ho === null && (Ho = []), e = Ka(Ho, e, t), t = Y, (Io === null ? t.memoizedState : Io.next) === null && (t = t.alternate, j.H = t === null || t.memoizedState === null ? lc : uc), e;
	}
	function rs(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return ns(e);
			if (e.$$typeof === he) return;
			if (e.$$typeof === oe) return _a(e);
		}
		throw Error(s(438, String(e)));
	}
	function is(e) {
		var t = null, n = Y.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = Y.alternate;
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
		}, n === null && (n = ts(), Y.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = me;
		return t.index++, n;
	}
	function as(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function os(e) {
		return ss(es(), Fo, e);
	}
	function ss(e, t, n) {
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
				if (f === u.lane ? (Po & f) === f : (Q & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === ja && (d = !0);
					else if ((Po & p) === p) {
						u = u.next, p === ja && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, o = a) : l = l.next = f, Y.lanes |= p, id |= p;
					f = u.action, zo && n(a, f), a = u.hasEagerState ? u.eagerState : n(a, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, o = a) : l = l.next = p, Y.lanes |= f, id |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? o = a : l.next = c, !Nr(a, e.memoizedState) && (Dc = !0, d && (n = Ma, n !== null))) throw n;
			e.memoizedState = a, e.baseState = o, e.baseQueue = l, r.lastRenderedState = a;
		}
		return i === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function cs(e) {
		var t = es(), n = t.queue;
		if (n === null) throw Error(s(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, i = n.pending, a = t.memoizedState;
		if (i !== null) {
			n.pending = null;
			var o = i = i.next;
			do
				a = e(a, o.action), o = o.next;
			while (o !== i);
			Nr(a, t.memoizedState) || (Dc = !0), t.memoizedState = a, t.baseQueue === null && (t.baseState = a), n.lastRenderedState = a;
		}
		return [a, r];
	}
	function ls(e, t, n) {
		var r = Y, i = es(), a = J;
		if (a) {
			if (n === void 0) throw Error(s(407));
			n = n();
		} else n = t();
		var o = !Nr((Fo || i).memoizedState, n);
		if (o && (i.memoizedState = n, Dc = !0), i = i.queue, Ps(fs.bind(null, r, i, e), [e]), e = i.getSnapshot !== t || o || Io !== null && !!(Io.memoizedState.tag & 1), ks(e ? 9 : 8, { destroy: void 0 }, ds.bind(null, r, i, n, t), null), e) {
			if (r.flags |= 2048, Xu === null) throw Error(s(349));
			a || Po & 127 || us(r, t, n);
		}
		return n;
	}
	function us(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = Y.updateQueue, t === null ? (t = ts(), Y.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function ds(e, t, n, r) {
		t.value = n, t.getSnapshot = r, ps(t) && ms(e);
	}
	function fs(e, t, n) {
		return n(function() {
			ps(t) && ms(e);
		});
	}
	function ps(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Nr(e, n);
		} catch {
			return !0;
		}
	}
	function ms(e) {
		var t = yi(e, 2);
		t !== null && Md(t, e, 2);
	}
	function hs(e) {
		var t = $o();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), zo) {
				Ke(!0);
				try {
					n();
				} finally {
					Ke(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: as,
			lastRenderedState: e
		}, t;
	}
	function gs(e, t, n, r) {
		return e.baseState = n, ss(e, Fo, typeof r == "function" ? r : as);
	}
	function _s(e, t, n, r, i) {
		if (ac(e)) throw Error(s(485));
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
			j.T === null ? a.isTransition = !1 : n(!0), r(a), n = t.pending, n === null ? (a.next = t.pending = a, vs(t, a)) : (a.next = n.next, t.pending = n.next = a);
		}
	}
	function vs(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = j.T, o = {};
			o.types = a === null ? null : a.types, j.T = o;
			try {
				var s = n(i, r), c = j.S;
				c !== null && c(o, s), ys(e, t, s);
			} catch (n) {
				xs(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), j.T = a;
			}
		} else try {
			a = n(i, r), ys(e, t, a);
		} catch (n) {
			xs(e, t, n);
		}
	}
	function ys(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			bs(e, t, n);
		}, function(n) {
			return xs(e, t, n);
		}) : bs(e, t, n);
	}
	function bs(e, t, n) {
		t.status = "fulfilled", t.value = n, Ss(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, vs(e, n)));
	}
	function xs(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Ss(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Ss(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function Cs(e, t) {
		return t;
	}
	function ws(e, t) {
		if (J) {
			var n = Xu.formState;
			if (n !== null) {
				a: {
					var r = Y;
					if (J) {
						if (Xi) {
							b: {
								for (var i = Xi, a = Qi; i.nodeType !== 8;) if (!a || (i = lm(i.nextSibling), i === null)) {
									i = null;
									break b;
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								Xi = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						ea(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = $o(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Cs,
			lastRenderedState: t
		}, n.queue = r, n = nc.bind(null, Y, r), r.dispatch = n, r = hs(!1), a = ic.bind(null, Y, !1, r.queue), r = $o(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = _s.bind(null, Y, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Ts(e) {
		return Es(es(), Fo, e);
	}
	function Es(e, t, n) {
		if (t = ss(e, t, Cs)[0], e = os(as)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = ns(t);
		} catch (e) {
			throw e === Va ? Ua : e;
		}
		else r = t;
		t = es();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (Y.flags |= 2048, ks(9, { destroy: void 0 }, Ds.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Ds(e, t) {
		e.action = t;
	}
	function Os(e) {
		var t = es(), n = Fo;
		if (n !== null) return Es(t, n, e);
		es(), t = t.memoizedState, n = es();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function ks(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = Y.updateQueue, t === null && (t = ts(), Y.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function As() {
		return es().memoizedState;
	}
	function js(e, t, n, r) {
		var i = $o();
		Y.flags |= e, i.memoizedState = ks(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function Ms(e, t, n, r) {
		var i = es();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		Fo !== null && r !== null && Go(r, Fo.memoizedState.deps) ? i.memoizedState = ks(t, a, n, r) : (Y.flags |= e, i.memoizedState = ks(1 | t, a, n, r));
	}
	function Ns(e, t) {
		js(8390656, 8, e, t);
	}
	function Ps(e, t) {
		Ms(2048, 8, e, t);
	}
	function Fs(e) {
		Y.flags |= 4;
		var t = Y.updateQueue;
		if (t === null) t = ts(), Y.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function Is(e) {
		var t = es().memoizedState;
		return Fs({
			ref: t,
			nextImpl: e
		}), function() {
			if (Yu & 2) throw Error(s(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function Ls(e, t) {
		return Ms(4, 2, e, t);
	}
	function Rs(e, t) {
		return Ms(4, 4, e, t);
	}
	function zs(e, t) {
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
	function Bs(e, t, n) {
		n = n == null ? null : n.concat([e]), Ms(4, 4, zs.bind(null, t, e), n);
	}
	function Vs() {}
	function Hs(e, t) {
		var n = es();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && Go(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function Us(e, t) {
		var n = es();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && Go(t, r[1])) return r[0];
		if (r = e(), zo) {
			Ke(!0);
			try {
				e();
			} finally {
				Ke(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function Ws(e, t, n) {
		return n === void 0 || Po & 1073741824 && !(Q & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = Ad(), Y.lanes |= e, id |= e, n);
	}
	function Gs(e, t, n, r) {
		return Nr(n, t) ? n : vo.current === null ? !(Po & 106) || Po & 1073741824 && !(Q & 261930) ? (Dc = !0, e.memoizedState = n) : (e = Ad(), Y.lanes |= e, id |= e, t) : (e = Ws(e, n, r), Nr(e, t) || (Dc = !0), e);
	}
	function Ks(e, t, n, r, i) {
		var a = be.p;
		be.p = a !== 0 && 8 > a ? a : 8;
		var o = j.T, s = {};
		s.types = o === null ? null : o.types, j.T = s, ic(e, !1, t, n);
		try {
			var c = i(), l = j.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? rc(e, t, Fa(c, r), kd(e)) : rc(e, t, r, kd(e));
		} catch (n) {
			rc(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, kd());
		} finally {
			be.p = a, o !== null && s.types !== null && (o.types = s.types), j.T = o;
		}
	}
	function qs() {}
	function Js(e, t, n, r) {
		if (e.tag !== 5) throw Error(s(476));
		var i = Ys(e).queue;
		Ks(e, i, t, xe, n === null ? qs : function() {
			return Xs(e), n(r);
		});
	}
	function Ys(e) {
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
				lastRenderedReducer: as,
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
				lastRenderedReducer: as,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Xs(e) {
		var t = Ys(e);
		t.next === null && (t = e.alternate.memoizedState), rc(e, t.next.queue, {}, kd());
	}
	function Zs() {
		return _a(sh);
	}
	function Qs() {
		return es().memoizedState;
	}
	function $s() {
		return es().memoizedState;
	}
	function ec(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = kd();
					e = co(n);
					var r = lo(t, e, n);
					r !== null && (Md(r, t, n), uo(r, t, n)), t = { cache: wa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function tc(e, t, n) {
		var r = kd();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, ac(e) ? oc(t, n) : (n = vi(e, t, n, r), n !== null && (Md(n, e, r), sc(n, t, r)));
	}
	function nc(e, t, n) {
		rc(e, t, n, kd());
	}
	function rc(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (ac(e)) oc(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Nr(s, o)) return _i(e, t, i, 0), Xu === null && gi(), !1;
			} catch {}
			if (n = vi(e, t, i, r), n !== null) return Md(n, e, r), sc(n, t, r), !0;
		}
		return !1;
	}
	function ic(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: Nf(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, ac(e)) {
			if (t) throw Error(s(479));
		} else t = vi(e, n, r, 2), t !== null && Md(t, e, 2);
	}
	function ac(e) {
		var t = e.alternate;
		return e === Y || t !== null && t === Y;
	}
	function oc(e, t) {
		Ro = Lo = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function sc(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, lt(e, n);
		}
	}
	var cc = {
		readContext: _a,
		use: rs,
		useCallback: Wo,
		useContext: Wo,
		useEffect: Wo,
		useImperativeHandle: Wo,
		useLayoutEffect: Wo,
		useInsertionEffect: Wo,
		useMemo: Wo,
		useReducer: Wo,
		useRef: Wo,
		useState: Wo,
		useDebugValue: Wo,
		useDeferredValue: Wo,
		useTransition: Wo,
		useSyncExternalStore: Wo,
		useId: Wo,
		useHostTransitionStatus: Wo,
		useFormState: Wo,
		useActionState: Wo,
		useOptimistic: Wo,
		useMemoCache: Wo,
		useCacheRefresh: Wo,
		useEffectEvent: Wo
	}, lc = {
		readContext: _a,
		use: rs,
		useCallback: function(e, t) {
			return $o().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: _a,
		useEffect: Ns,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), js(4194308, 4, zs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return js(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			js(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = $o();
			t = t === void 0 ? null : t;
			var r = e();
			if (zo) {
				Ke(!0);
				try {
					e();
				} finally {
					Ke(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = $o();
			if (n !== void 0) {
				var i = n(t);
				if (zo) {
					Ke(!0);
					try {
						n(t);
					} finally {
						Ke(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = tc.bind(null, Y, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = $o();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = hs(e);
			var t = e.queue, n = nc.bind(null, Y, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Vs,
		useDeferredValue: function(e, t) {
			return Ws($o(), e, t);
		},
		useTransition: function() {
			var e = hs(!1);
			return e = Ks.bind(null, Y, e.queue, !0, !1), $o().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = Y, i = $o();
			if (J) {
				if (n === void 0) throw Error(s(407));
				n = n();
			} else {
				if (n = t(), Xu === null) throw Error(s(349));
				Q & 127 || us(r, t, n);
			}
			i.memoizedState = n;
			var a = {
				value: n,
				getSnapshot: t
			};
			return i.queue = a, Ns(fs.bind(null, r, a, e), [e]), r.flags |= 2048, ks(9, { destroy: void 0 }, ds.bind(null, r, a, n, t), null), n;
		},
		useId: function() {
			var e = $o(), t = Xu.identifierPrefix;
			if (J) {
				var n = Ui, r = Hi;
				n = (r & ~(1 << 32 - qe(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = Bo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = Uo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Zs,
		useFormState: ws,
		useActionState: ws,
		useOptimistic: function(e) {
			var t = $o();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = ic.bind(null, Y, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: is,
		useCacheRefresh: function() {
			return $o().memoizedState = ec.bind(null, Y);
		},
		useEffectEvent: function(e) {
			var t = $o(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (Yu & 2) throw Error(s(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, uc = {
		readContext: _a,
		use: rs,
		useCallback: Hs,
		useContext: _a,
		useEffect: Ps,
		useImperativeHandle: Bs,
		useInsertionEffect: Ls,
		useLayoutEffect: Rs,
		useMemo: Us,
		useReducer: os,
		useRef: As,
		useState: function() {
			return os(as);
		},
		useDebugValue: Vs,
		useDeferredValue: function(e, t) {
			return Gs(es(), Fo.memoizedState, e, t);
		},
		useTransition: function() {
			var e = os(as)[0], t = es().memoizedState;
			return [typeof e == "boolean" ? e : ns(e), t];
		},
		useSyncExternalStore: ls,
		useId: Qs,
		useHostTransitionStatus: Zs,
		useFormState: Ts,
		useActionState: Ts,
		useOptimistic: function(e, t) {
			return gs(es(), Fo, e, t);
		},
		useMemoCache: is,
		useCacheRefresh: $s,
		useEffectEvent: Is
	}, dc = {
		readContext: _a,
		use: rs,
		useCallback: Hs,
		useContext: _a,
		useEffect: Ps,
		useImperativeHandle: Bs,
		useInsertionEffect: Ls,
		useLayoutEffect: Rs,
		useMemo: Us,
		useReducer: cs,
		useRef: As,
		useState: function() {
			return cs(as);
		},
		useDebugValue: Vs,
		useDeferredValue: function(e, t) {
			var n = es();
			return Fo === null ? Ws(n, e, t) : Gs(n, Fo.memoizedState, e, t);
		},
		useTransition: function() {
			var e = cs(as)[0], t = es().memoizedState;
			return [typeof e == "boolean" ? e : ns(e), t];
		},
		useSyncExternalStore: ls,
		useId: Qs,
		useHostTransitionStatus: Zs,
		useFormState: Os,
		useActionState: Os,
		useOptimistic: function(e, t) {
			var n = es();
			return Fo === null ? (n.baseState = e, [e, n.queue.dispatch]) : gs(n, Fo, e, t);
		},
		useMemoCache: is,
		useCacheRefresh: $s,
		useEffectEvent: Is
	};
	function fc(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : D({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var pc = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = kd(), i = co(r);
			i.payload = t, n != null && (i.callback = n), t = lo(e, i, r), t !== null && (Md(t, e, r), uo(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = kd(), i = co(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = lo(e, i, r), t !== null && (Md(t, e, r), uo(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = kd(), r = co(n);
			r.tag = 2, t != null && (r.callback = t), t = lo(e, r, n), t !== null && (Md(t, e, n), uo(t, e, n));
		}
	};
	function mc(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Pr(n, r) || !Pr(i, a) : !0;
	}
	function hc(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && pc.enqueueReplaceState(t, t.state, null);
	}
	function gc(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = D({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function _c(e) {
		fi(e);
	}
	function vc(e) {
		console.error(e);
	}
	function yc(e) {
		fi(e);
	}
	function bc(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function xc(e, t, n) {
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
	function Sc(e, t, n) {
		return n = co(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			bc(e, t);
		}, n;
	}
	function Cc(e) {
		return e = co(e), e.tag = 3, e;
	}
	function wc(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				xc(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			xc(t, n, r), typeof i != "function" && (gd === null ? gd = /* @__PURE__ */ new Set([this]) : gd.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function Tc(e, t, n, r, i) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && ma(t, n, i, !0), n = Co.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13:
					case 19: return wo === null ? Wd() : n.alternate === null && rd === 0 && (rd = 3), n.flags &= -257, n.flags |= 65536, n.lanes = i, r === Wa ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), pf(e, r, i)), !1;
					case 22: return n.flags |= 65536, r === Wa ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), pf(e, r, i)), !1;
				}
				throw Error(s(435, n.tag));
			}
			return pf(e, r, i), Wd(), !1;
		}
		if (J) return t = Co.current, t === null ? (r !== $i && (t = Error(s(423), { cause: r }), oa(Pi(t, n))), e = e.current.alternate, e.flags |= 65536, i &= -i, e.lanes |= i, r = Pi(r, n), i = Sc(e.stateNode, r, i), fo(e, i), rd !== 4 && (rd = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = i, r !== $i && (e = Error(s(422), { cause: r }), oa(Pi(e, n)))), !1;
		var a = Error(s(520), { cause: r });
		if (a = Pi(a, n), ld === null ? ld = [a] : ld.push(a), rd !== 4 && (rd = 2), t === null) return !0;
		r = Pi(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = i & -i, n.lanes |= e, e = Sc(n.stateNode, r, e), fo(n, e), !1;
				case 1:
					if (t = n.type, a = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || a !== null && typeof a.componentDidCatch == "function" && (gd === null || !gd.has(a)))) return n.flags |= 65536, i &= -i, n.lanes |= i, i = Cc(i), wc(i, e, n, r), fo(n, i), !1;
					break;
				case 22: if (n.memoizedState !== null) return n.flags |= 65536, !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Ec = Error(s(461)), Dc = !1;
	function Oc(e, t, n, r) {
		t.child = e === null ? io(t, null, n, r) : ro(t, e.child, n, r);
	}
	function kc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return ga(t), r = Ko(e, t, n, o, a, i), s = Xo(), e !== null && !Dc ? (Zo(e, t, i), rl(e, t, i)) : (J && s && Ki(t), t.flags |= 1, Oc(e, t, r, i), t.child);
	}
	function Ac(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !Ti(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, jc(e, t, a, r, i)) : (e = Oi(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !il(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Pr : n, n(o, r) && e.ref === t.ref) return rl(e, t, i);
		}
		return t.flags |= 1, e = Ei(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function jc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Pr(a, r) && e.ref === t.ref) {
				if (Dc = !1, t.pendingProps = r = a, il(e, i)) e.flags & 131072 && (Dc = !0);
				else return t.lanes = e.lanes, rl(e, t, i);
			}
		}
		return zc(e, t, n, r, i);
	}
	function Mc(e, t, n, r) {
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
				return Pc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && za(t, a === null ? null : a.cachePool), a === null ? xo() : bo(t, a), Do(t);
			else return r = t.lanes = 536870912, Pc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && za(t, null), xo(), Oo()) : (za(t, a.cachePool), bo(t, a), Oo(), t.memoizedState = null);
		return Oc(e, t, i, n), t.child;
	}
	function Nc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function Pc(e, t, n, r, i) {
		var a = Ra();
		return a = a === null ? null : {
			parent: Ca._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && za(t, null), xo(), Do(t), e !== null && ma(e, t, r, !0), t.childLanes = i, null;
	}
	function Fc(e, t) {
		return t = Jc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function Ic(e, t, n) {
		return ro(t, e.child, null, n), e = Fc(t, t.pendingProps), e.flags |= 2, ko(t), t.memoizedState = null, e;
	}
	function Lc(e, t, n) {
		var r = t.pendingProps, i = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (J) {
				if (r.mode === "hidden") return e = Fc(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, Nc(null, e);
				if (Eo(t), (e = Xi) ? (e = am(e, Qi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Vi === null ? null : {
						id: Hi,
						overflow: Ui
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = ji(e), n.return = t, t.child = n, Yi = t, Xi = null)) : e = null, e === null) throw ea(t);
				return t.lanes = 536870912, null;
			}
			return Fc(t, r);
		}
		var a = e.memoizedState;
		if (a !== null) {
			var o = a.dehydrated;
			if (Eo(t), i) {
				if (t.flags & 256) t.flags &= -257, t = Ic(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(s(558));
			} else if (Dc || ma(e, t, n, !1), i = (n & e.childLanes) !== 0, Dc || i) {
				if (vo.current === null) {
					if (r = Xu, r !== null && (o = ut(r, n), o !== 0 && o !== a.retryLane)) throw a.retryLane = o, yi(e, o), Md(r, e, o), Ec;
					Wd();
				}
				t = Ic(e, t, n);
			} else e = a.treeContext, Xi = lm(o.nextSibling), Yi = t, J = !0, Zi = null, Qi = !1, e !== null && Ji(t, e), t = Fc(t, r), t.flags |= 134221824;
			return t;
		}
		return e = Ei(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function Rc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(s(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function zc(e, t, n, r, i) {
		return ga(t), n = Ko(e, t, n, r, void 0, i), r = Xo(), e !== null && !Dc ? (Zo(e, t, i), rl(e, t, i)) : (J && r && Ki(t), t.flags |= 1, Oc(e, t, n, i), t.child);
	}
	function Bc(e, t, n, r, i, a) {
		return ga(t), t.updateQueue = null, n = Jo(t, r, n, i), qo(e), r = Xo(), e !== null && !Dc ? (Zo(e, t, a), rl(e, t, a)) : (J && r && Ki(t), t.flags |= 1, Oc(e, t, n, a), t.child);
	}
	function Vc(e, t, n, r, i) {
		if (ga(t), t.stateNode === null) {
			var a = Si, o = n.contextType;
			typeof o == "object" && o && (a = _a(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = pc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, oo(t), o = n.contextType, a.context = typeof o == "object" && o ? _a(o) : Si, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (fc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && pc.enqueueReplaceState(a, a.state, null), ho(t, r, a, i), mo(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = gc(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = Si, typeof u == "object" && u && (o = _a(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && hc(t, a, r, o), ao = !1;
			var f = t.memoizedState;
			a.state = f, ho(t, r, a, i), mo(), l = t.memoizedState, s || f !== l || ao ? (typeof d == "function" && (fc(t, n, d, r), l = t.memoizedState), (c = ao || mc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, so(e, t), o = t.memoizedProps, u = gc(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = Si, typeof l == "object" && l && (c = _a(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && hc(t, a, r, c), ao = !1, f = t.memoizedState, a.state = f, ho(t, r, a, i), mo();
			var p = t.memoizedState;
			o !== d || f !== p || ao || e !== null && e.dependencies !== null && ha(e.dependencies) ? (typeof s == "function" && (fc(t, n, s, r), p = t.memoizedState), (u = ao || mc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && ha(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, Rc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = ro(t, e.child, null, i), t.child = ro(t, null, n, i)) : Oc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = rl(e, t, i), e;
	}
	function Hc(e, t, n, r) {
		return ia(), t.flags |= 256, Oc(e, t, n, r), t.child;
	}
	var Uc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function Wc(e) {
		return {
			baseLanes: e,
			cachePool: Ba()
		};
	}
	function Gc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= sd), e;
	}
	function Kc(e, t, n) {
		var r = t.pendingProps, i = !1, a = !!(t.flags & 128), o;
		if ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : !!(Ao.current & 2)), o && (i = !0, t.flags &= -129), o = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (J) {
				if (i ? To(t) : Oo(), (e = Xi) ? (e = am(e, Qi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Vi === null ? null : {
						id: Hi,
						overflow: Ui
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = ji(e), n.return = t, t.child = n, Yi = t, Xi = null)) : e = null, e === null) throw ea(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (Oo(), i = t.mode, a = Jc({
				mode: "hidden",
				children: a
			}, i), r = ki(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = Wc(n), r.childLanes = Gc(e, o, n), t.memoizedState = Uc, Nc(null, r)) : (To(t), qc(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return Xc(e, t, a, o, r, c, s, n);
		}
		return i ? (Oo(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = Ei(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = ki(i, a, n, null), i.flags |= 2) : i = Ei(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, Nc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = Wc(n) : (a = i.cachePool, a === null ? a = Ba() : (s = Ca._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = Gc(e, o, n), t.memoizedState = Uc, Nc(e.child, r)) : (To(t), n = e.child, e = n.sibling, n = Ei(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (o = t.deletions, o === null ? (t.deletions = [e], t.flags |= 16) : o.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function qc(e, t) {
		return t = Jc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function Jc(e, t) {
		return e = wi(22, e, null, t), e.lanes = 0, e;
	}
	function Yc(e, t, n) {
		return ro(t, e.child, null, n), e = qc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Xc(e, t, n, r, i, a, o, c) {
		if (n) return t.flags & 256 ? (To(t), t.flags &= -257, Yc(e, t, c)) : t.memoizedState === null ? (Oo(), a = i.fallback, o = t.mode, i = Jc({
			mode: "visible",
			children: i.children
		}, o), a = ki(a, o, c, null), a.flags |= 2, i.return = t, a.return = t, i.sibling = a, t.child = i, ro(t, e.child, null, c), i = t.child, i.memoizedState = Wc(c), i.childLanes = Gc(e, r, c), t.memoizedState = Uc, Nc(null, i)) : (Oo(), t.child = e.child, t.flags |= 128, null);
		if (To(t), sm(a)) {
			if (r = a.nextSibling && a.nextSibling.dataset, r) var l = r.dgst;
			return r = l, r !== "" && (i = Error(s(419)), i.stack = "", i.digest = r, oa({
				value: i,
				source: null,
				stack: null
			})), Yc(e, t, c);
		}
		if (Dc || ma(e, t, c, !1), r = (c & e.childLanes) !== 0, Dc || r) {
			if (vo.current !== null) return Yc(e, t, c);
			if (r = Xu, r !== null && (i = ut(r, c), i !== 0 && i !== o.retryLane)) throw o.retryLane = i, yi(e, i), Md(r, e, i), Ec;
			return om(a) || Wd(), Yc(e, t, c);
		}
		return om(a) ? (t.flags |= 192, t.child = e.child, null) : (e = o.treeContext, Xi = lm(a.nextSibling), Yi = t, J = !0, Zi = null, Qi = !1, e !== null && Ji(t, e), t = qc(t, i.children), t.flags |= 134221824, t);
	}
	function Zc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), fa(e.return, t, n);
	}
	function Qc(e) {
		for (var t = null; e !== null;) {
			var n = e.alternate;
			n !== null && No(n) === null && (t = e), e = e.sibling;
		}
		return t;
	}
	function $c(e, t, n, r, i, a) {
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
	function el(e) {
		var t = e.child;
		for (e.child = null; t !== null;) {
			var n = t.sibling;
			t.sibling = e.child, e.child = t, t = n;
		}
	}
	function tl(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = Ao.current;
		if (t.flags & 128) return jo(t, o), null;
		var s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, jo(t, o), i === "backwards" && e !== null ? (el(e), Oc(e, t, r, n), el(e)) : Oc(e, t, r, n), r = J ? Ri : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Zc(e, n, t);
			else if (e.tag === 19) Zc(e, n, t);
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
				n = Qc(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null, el(t)), $c(t, !0, i, null, a, r);
				break;
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && No(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				$c(t, !0, n, null, a, r);
				break;
			case "together":
				$c(t, !1, null, null, void 0, r);
				break;
			case "independent":
				t.memoizedState = null;
				break;
			default: n = Qc(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), $c(t, !1, i, n, a, r);
		}
		return t.child;
	}
	function nl(e, t, n) {
		var r = t.pendingProps;
		return ua(t, t.type, r.value), Oc(e, t, r.children, n), t.child;
	}
	function rl(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), id |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (ma(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(s(153));
		if (t.child !== null) {
			for (e = t.child, n = Ei(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Ei(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function il(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && ha(e)));
	}
	function al(e, t, n) {
		switch (t.tag) {
			case 3:
				N(t, t.stateNode.containerInfo), ua(t, Ca, e.memoizedState.cache), ia();
				break;
			case 27:
			case 5:
				je(t);
				break;
			case 4:
				N(t, t.stateNode.containerInfo);
				break;
			case 10:
				ua(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, Eo(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) {
					if (r.dehydrated !== null) return To(t), t.flags |= 128, null;
					r = ma(e, t, n, !1);
					var i = t.child.childLanes;
					return r || (n & i) !== 0 ? Kc(e, t, n) : (To(t), e = rl(e, t, n), e === null ? null : e.sibling);
				}
				To(t);
				break;
			case 19:
				if (t.flags & 128) return tl(e, t, n);
				if (i = !!(e.flags & 128), r = (n & t.childLanes) !== 0, r ||= (ma(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return tl(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), jo(t, Ao.current), r) break;
				return null;
			case 22: return t.lanes = 0, Mc(e, t, n, t.pendingProps);
			case 24: ua(t, Ca, e.memoizedState.cache);
		}
		return rl(e, t, n);
	}
	function ol(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) Dc = !0;
			else {
				if (!il(e, n) && !(t.flags & 128)) return Dc = !1, al(e, t, n);
				Dc = !!(e.flags & 131072);
			}
		} else Dc = !1, J && t.flags & 1048576 && Gi(t, Ri, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = qa(t.elementType), t.type = e, typeof e == "function") Ti(e) ? (r = gc(e, r), t.tag = 1, t = Vc(null, t, e, r, n)) : (t.tag = 0, t = zc(null, t, e, r, n));
					else {
						if (e != null) {
							var i = e.$$typeof;
							if (i === se) {
								t.tag = 11, t = kc(null, t, e, r, n);
								break a;
							}
							if (i === ue) {
								t.tag = 14, t = Ac(null, t, e, r, n);
								break a;
							}
							if (i === oe) {
								t.tag = 10, t.type = e, t = nl(null, t, n);
								break a;
							}
						}
						throw t = ve(e) || e, Error(s(306, t, ""));
					}
				}
				return t;
			case 0: return zc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, i = gc(r, t.pendingProps), Vc(e, t, r, i, n);
			case 3:
				a: {
					if (N(t, t.stateNode.containerInfo), e === null) throw Error(s(387));
					r = t.pendingProps;
					var a = t.memoizedState;
					i = a.element, so(e, t), ho(t, r, null, n);
					var o = t.memoizedState;
					if (r = o.cache, ua(t, Ca, r), r !== a.cache && pa(t, [Ca], n, !0), mo(), r = o.element, a.isDehydrated) {
						if (a = {
							element: r,
							isDehydrated: !1,
							cache: o.cache
						}, t.updateQueue.baseState = a, t.memoizedState = a, t.flags & 256) {
							t = Hc(e, t, r, n);
							break a;
						}
						if (r !== i) {
							i = Pi(Error(s(424)), t), oa(i), t = Hc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (Xi = lm(e.firstChild), Yi = t, J = !0, Zi = null, Qi = !0, n = io(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (ia(), r === i) {
							t = rl(e, t, n);
							break a;
						}
						Oc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return Rc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : J || (t.stateNode = fp(t.type, t.pendingProps, Oe.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return je(t), e === null && J && (r = t.stateNode = hm(t.type, t.pendingProps, Oe.current), Yi = t, Qi = !0, i = Xi, Sp(t.type) ? (um = i, Xi = lm(r.firstChild)) : Xi = i), Oc(e, t, t.pendingProps.children, n), Rc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && J && ((i = r = Xi) && (r = rm(r, t.type, t.pendingProps, Qi), r === null ? i = !1 : (t.stateNode = r, Yi = t, Xi = lm(r.firstChild), Qi = !1, i = !0)), i || ea(t)), je(t), i = t.type, a = t.pendingProps, o = e === null ? null : e.memoizedProps, r = a.children, pp(i, a) ? r = null : o !== null && pp(i, o) && (t.flags |= 32), t.memoizedState !== null && (i = Ko(e, t, Yo, null, null, n), sh._currentValue = i), Rc(e, t), Oc(e, t, r, n), t.child;
			case 6: return e === null && J && ((e = n = Xi) && (n = im(n, t.pendingProps, Qi), n === null ? e = !1 : (t.stateNode = n, Yi = t, Xi = null, e = !0)), e || ea(t)), null;
			case 13: return Kc(e, t, n);
			case 4: return N(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = ro(t, null, r, n) : Oc(e, t, r, n), t.child;
			case 11: return kc(e, t, t.type, t.pendingProps, n);
			case 7: return r = t.pendingProps, Rc(e, t), Oc(e, t, r, n), t.child;
			case 8: return Oc(e, t, t.pendingProps.children, n), t.child;
			case 12: return Oc(e, t, t.pendingProps.children, n), t.child;
			case 10: return nl(e, t, n);
			case 9: return i = t.type._context, r = t.pendingProps.children, ga(t), i = _a(i), r = r(i), t.flags |= 1, Oc(e, t, r, n), t.child;
			case 14: return Ac(e, t, t.type, t.pendingProps, n);
			case 15: return jc(e, t, t.type, t.pendingProps, n);
			case 19: return tl(e, t, n);
			case 31: return Lc(e, t, n);
			case 22: return Mc(e, t, n, t.pendingProps);
			case 24: return ga(t), r = _a(Ca), e === null ? (i = Ra(), i === null && (i = Xu, a = wa(), i.pooledCache = a, a.refCount++, a !== null && (i.pooledCacheLanes |= n), i = a), t.memoizedState = {
				parent: r,
				cache: i
			}, oo(t), ua(t, Ca, i)) : ((e.lanes & n) !== 0 && (so(e, t), ho(t, null, null, n), mo()), i = e.memoizedState, a = t.memoizedState, i.parent === r ? (r = a.cache, ua(t, Ca, r), r !== i.cache && pa(t, [Ca], n, !0)) : (i = {
				parent: r,
				cache: r
			}, t.memoizedState = i, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i), ua(t, Ca, r))), Oc(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : J && Ki(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : Rc(e, t), Oc(e, t, r.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(s(156, t.tag));
	}
	function sl(e) {
		e.flags |= 4;
	}
	function cl(e, t, n, r, i) {
		var a;
		if ((a = !!(e.mode & 32)) && (a = n === null ? Jm(t, r) : Jm(t, r) && (r.src !== n.src || r.srcSet !== n.srcSet)), a) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (Vd()) e.flags |= 8192;
				else throw Ja = Wa, Ha;
			}
		} else e.flags &= -16777217;
	}
	function ll(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ym(t)) {
			if (Vd()) e.flags |= 8192;
			else throw Ja = Wa, Ha;
		}
	}
	function ul(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : it(), e.lanes |= t, cd |= t);
	}
	function dl(e, t) {
		if (!J) switch (e.tailMode) {
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
	function fl(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 1206910976, r |= i.flags & 1206910976, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function pl(e, t, n) {
		var r = t.pendingProps;
		switch (qi(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return fl(t), null;
			case 1: return fl(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), da(Ca), Ae(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (ra(t) ? sl(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, aa())), fl(t), null;
			case 26:
				var i = t.type, a = t.memoizedState;
				return e === null ? (sl(t), a === null ? (fl(t), cl(t, i, null, r, n)) : (fl(t), ll(t, a))) : a ? a === e.memoizedState ? (fl(t), t.flags &= -16777217) : (sl(t), fl(t), ll(t, a)) : (e = e.memoizedProps, e !== r && sl(t), fl(t), cl(t, i, e, r, n)), null;
			case 27:
				if (Me(t), n = Oe.current, i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && sl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(s(166));
						return fl(t), t.subtreeFlags &= -33554433, null;
					}
					e = M.current, ra(t) ? ta(t, e) : (e = hm(i, r, n), t.stateNode = e, sl(t));
				}
				return fl(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (Me(t), i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && sl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(s(166));
						return fl(t), t.subtreeFlags &= -33554433, null;
					}
					if (a = M.current, ra(t)) ta(t, a);
					else {
						var o = lp(Oe.current);
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
						a[gt] = t, a[_t] = r;
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
						r && sl(t);
					}
				}
				return fl(t), t.subtreeFlags &= -33554433, cl(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && sl(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(s(166));
					if (e = Oe.current, ra(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, i = Yi, i !== null) switch (i.tag) {
							case 27:
							case 5: r = i.memoizedProps;
						}
						e[gt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || $f(e.nodeValue, n)), e || ea(t, !0);
					} else e = lp(e).createTextNode(r), e[gt] = t, t.stateNode = e;
				}
				return fl(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = ra(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(s(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(557));
							e[gt] = t;
						} else ia(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						fl(t), e = !1;
					} else n = aa(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (ko(t), t) : (ko(t), null);
					if (t.flags & 128) throw Error(s(558));
				}
				return fl(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (i = ra(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!i) throw Error(s(318));
							if (i = t.memoizedState, i = i === null ? null : i.dehydrated, !i) throw Error(s(317));
							i[gt] = t;
						} else ia(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						fl(t), i = !1;
					} else i = aa(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i), i = !0;
					if (!i) return t.flags & 256 ? (ko(t), t) : (ko(t), null);
				}
				return ko(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, i = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (i = r.alternate.memoizedState.cachePool.pool), a = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (a = r.memoizedState.cachePool.pool), a !== i && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), ul(t, t.updateQueue), fl(t), null);
			case 4: return Ae(), e === null && Uf(t.stateNode.containerInfo), t.flags |= 67108864, fl(t), null;
			case 10: return da(t.type), fl(t), null;
			case 19:
				if (Mo(t), r = t.memoizedState, r === null) return fl(t), null;
				if (i = !!(t.flags & 128), a = r.rendering, a === null) {
					if (i) dl(r, !1);
					else {
						if (rd !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (a = No(e), a !== null) {
								for (t.flags |= 128, dl(r, !1), e = a.updateQueue, t.updateQueue = e, ul(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Di(n, e), n = n.sibling;
								return jo(t, Ao.current & 1 | 2), J && Wi(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && B() > md && (t.flags |= 128, i = !0, dl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!i) {
						if (e = No(a), e !== null) {
							if (t.flags |= 128, i = !0, e = e.updateQueue, t.updateQueue = e, ul(t, e), dl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !a.alternate && !J) return fl(t), null;
						} else 2 * B() - r.renderingStartTime > md && n !== 536870912 && (t.flags |= 128, i = !0, dl(r, !1), t.lanes = 4194304);
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
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = B(), e.sibling = null, a = Ao.current, a = i ? a & 1 | 2 : a & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || J ? jo(t, a) : (n = a, Ee(Co, t), Ee(Ao, n), wo === null && (wo = t)), J && Wi(t, r.treeForkCount), e;
				}
				return fl(t), null;
			case 22:
			case 23: return ko(t), So(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (fl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : fl(t), n = t.updateQueue, n !== null && ul(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && Te(La), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), da(Ca), fl(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, fl(t), null;
		}
		throw Error(s(156, t.tag));
	}
	function ml(e, t) {
		switch (qi(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return da(Ca), Ae(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return Me(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (ko(t), t.alternate === null) throw Error(s(340));
					ia();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (ko(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(s(340));
					ia();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return Mo(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return Ae(), null;
			case 10: return da(t.type), null;
			case 22:
			case 23: return ko(t), So(), e !== null && Te(La), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return da(Ca), null;
			case 25: return null;
			default: return null;
		}
	}
	function hl(e, t) {
		switch (qi(t), t.tag) {
			case 3:
				da(Ca), Ae();
				break;
			case 26:
			case 27:
			case 5:
				Me(t);
				break;
			case 4:
				Ae();
				break;
			case 31:
				t.memoizedState !== null && ko(t);
				break;
			case 13:
				ko(t);
				break;
			case 19:
				Mo(t);
				break;
			case 10:
				da(t.type);
				break;
			case 22:
			case 23:
				ko(t), So(), e !== null && Te(La);
				break;
			case 24: da(Ca);
		}
	}
	function gl(e, t) {
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
	function _l(e, t, n) {
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
	function vl(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				_o(t, n);
			} catch (t) {
				ff(e, e.return, t);
			}
		}
	}
	function yl(e, t, n) {
		n.props = gc(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			ff(e, t, n);
		}
	}
	function bl(e, t) {
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
						var i = e.stateNode, a = li(e.memoizedProps, i);
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
	function xl(e, t) {
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
	function Sl(e, t) {
		if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null) for (var n = 0; n < t.length; n++) em(e.stateNode, t[n]);
	}
	function Cl(e) {
		for (var t = e.return; t !== null && (El(t) && em(e.stateNode, t.stateNode), !Tl(t));) t = t.return;
	}
	function wl(e) {
		for (var t = e.return; t !== null && (El(t) && tm(e.stateNode, t.stateNode), !Tl(t));) t = t.return;
	}
	function Tl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 27;
	}
	function El(e) {
		return e && e.tag === 7 && e.stateNode !== null;
	}
	function Dl(e) {
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
	function Ol(e, t, n) {
		try {
			var r = e.stateNode;
			ip(r, e.type, n, t), r[_t] = t;
		} catch (t) {
			ff(e, e.return, t);
		}
	}
	function kl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Sp(e.type) || e.tag === 4;
	}
	function Al(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || kl(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Sp(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function jl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = K)), Sl(e, r), G = !0;
		else if (i !== 4 && (i === 27 && (Sl(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (jl(e, t, n, r), e = e.sibling; e !== null;) jl(e, t, n, r), e = e.sibling;
	}
	function Ml(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), Sl(e, r), G = !0;
		else if (i !== 4 && (i === 27 && (Sl(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (Ml(e, t, n, r), e = e.sibling; e !== null;) Ml(e, t, n, r), e = e.sibling;
	}
	function Nl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			np(t, r, n), t[gt] = e, t[_t] = n;
		} catch (t) {
			ff(e, e.return, t);
		}
	}
	var Pl = !1, Fl = null;
	function Il(e) {
		(e.tag === 30 || e.subtreeFlags & 33554432) && (Pl = !0);
	}
	var Ll = null;
	function Rl() {
		var e = Ll;
		return Ll = null, e;
	}
	var zl = 0;
	function Bl(e, t, n, r, i) {
		return zl = 0, Vl(e.child, t, n, r, i);
	}
	function Vl(e, t, n, r, i) {
		for (var a = !1; e !== null;) {
			if (e.tag === 5) {
				var o = e.stateNode;
				if (r !== null) {
					var s = Op(o);
					r.push(s), s.view && (a = !0);
				} else a || Op(o).view && (a = !0);
				Pl = !0, Tp(o, zl === 0 ? t : t + "_" + zl, n), zl++;
			} else e.tag === 22 && e.memoizedState !== null || e.tag === 30 && i || Vl(e.child, t, n, r, i) && (a = !0);
			e = e.sibling;
		}
		return a;
	}
	function Hl(e, t) {
		for (; e !== null;) e.tag === 5 ? Ep(e.stateNode, e.memoizedProps) : e.tag === 22 && e.memoizedState !== null || e.tag === 30 && t || Hl(e.child, t), e = e.sibling;
	}
	function Ul(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if ((e.tag !== 22 || e.memoizedState === null) && (Ul(e), e.tag === 30 && e.flags & 18874368 && e.stateNode.paired)) {
				var t = e.memoizedProps;
				if (t.name == null || t.name === "auto") throw Error(s(544));
				var n = t.name;
				t = di(t.default, t.share), t !== "none" && (Bl(e, n, t, null, !1) || Hl(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function Wl(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = li(r, n), a = di(r.default, n.paired ? r.share : r.enter);
			a === "none" ? Ul(e) : Bl(e, i, a, null, !1) ? (Ul(e), n.paired || t || jd(e, r.onEnter)) : Hl(e.child, !1);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Wl(e, t), e = e.sibling;
		else Ul(e);
	}
	function Gl(e) {
		if (Fl !== null && Fl.size !== 0) {
			var t = Fl;
			if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
				if (e.tag !== 22 || e.memoizedState === null) {
					if (e.tag === 30 && e.flags & 18874368) {
						var n = e.memoizedProps, r = n.name;
						if (r != null && r !== "auto") {
							var i = t.get(r);
							if (i !== void 0) {
								var a = di(n.default, n.share);
								if (a !== "none" && (Bl(e, r, a, null, !1) ? (a = e.stateNode, i.paired = a, a.paired = i, jd(e, n.onShare)) : Hl(e.child, !1)), t.delete(r), t.size === 0) break;
							}
						}
					}
					Gl(e);
				}
				e = e.sibling;
			}
		}
	}
	function Kl(e) {
		if (e.tag === 30) {
			var t = e.memoizedProps, n = li(t, e.stateNode), r = Fl === null ? void 0 : Fl.get(n), i = di(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (Bl(e, n, i, null, !1) ? r === void 0 ? jd(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, Fl.delete(n), jd(e, t.onShare)) : Hl(e.child, !1)), Fl !== null && Gl(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Kl(e), e = e.sibling;
		else Fl !== null && Gl(e);
	}
	function ql(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = li(t, e.stateNode);
				t = di(t.default, t.update), e.flags &= -5, t !== "none" && Bl(e, n, t, e.memoizedState = [], !1);
			} else e.subtreeFlags & 33554432 && ql(e);
			e = e.sibling;
		}
	}
	function Jl(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if (e.tag !== 22 || e.memoizedState === null) {
				if (e.tag === 30 && e.flags & 18874368) {
					var t = e.stateNode;
					t.paired !== null && (t.paired = null, Hl(e.child, !1));
				}
				Jl(e);
			}
			e = e.sibling;
		}
	}
	function Yl(e) {
		if (e.tag === 30) e.stateNode.paired = null, Hl(e.child, !1), Jl(e);
		else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Yl(e), e = e.sibling;
		else Jl(e);
	}
	function Xl(e) {
		for (e = e.child; e !== null;) e.tag === 30 ? Hl(e.child, !1) : e.subtreeFlags & 33554432 && Xl(e), e = e.sibling;
	}
	function Zl(e, t, n, r, i, a, o) {
		for (var s = !1; t !== null;) {
			if (t.tag === 5) {
				var c = t.stateNode;
				if (a !== null && zl < a.length) {
					var l = a[zl], u = Op(c);
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
				e.flags & 4 && Tp(c, zl === 0 ? n : n + "_" + zl, i), s && e.flags & 4 || (Ll === null && (Ll = []), Ll.push(c, zl === 0 ? r : r + "_" + zl, t.memoizedProps)), zl++;
			} else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && o ? e.flags |= t.flags & 32 : Zl(e, t.child, n, r, i, a, o) && (s = !0));
			t = t.sibling;
		}
		return s;
	}
	function Ql(e, t) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var n = e.memoizedProps, r = e.stateNode, i = li(n, r), a = di(n.default, n.update);
				if (t) {
					r = r.clones;
					var o = r === null ? null : r.map(kp);
				} else o = e.memoizedState, e.memoizedState = null;
				r = e;
				var s = e.child;
				zl = 0, i = Zl(r, s, i, i, a, o, !1), e.flags & 4 && i && (t || jd(e, n.onUpdate));
			} else e.subtreeFlags & 33554432 && Ql(e, t);
			e = e.sibling;
		}
	}
	var $l = !1, X = !1, eu = !1, tu = !1, nu = typeof WeakSet == "function" ? WeakSet : Set, ru = null, iu = !1, au = !1, ou = !1, su = !1;
	function cu(e, t, n) {
		if (e = e.containerInfo, sp = gh, e = zr(e), Br(e)) {
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
			if (e = ru, n && (r = e.deletions, r !== null)) for (a = 0; a < r.length; a++) n && Kl(r[a]);
			if (e.alternate === null && e.flags & 2) n && Il(e), lu(n);
			else {
				if (e.tag === 22) {
					if (r = e.alternate, e.memoizedState !== null) {
						r !== null && r.memoizedState === null && n && Kl(r), lu(n);
						continue;
					}
					if (r !== null && r.memoizedState !== null) {
						n && Il(e), lu(n);
						continue;
					}
				}
				r = e.child, (e.subtreeFlags & t) !== 0 && r !== null ? (r.return = e, ru = r) : (n && ql(e), lu(n));
			}
		}
		Fl = null;
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
							var o = gc(t.type, i);
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
					n && r !== null && (n = li(r.memoizedProps, r.stateNode), i = t.memoizedProps, i = di(i.default, i.update), i !== "none" && Bl(r, n, i, r.memoizedState = [], !0));
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
				Au(e, n), r & 4 && gl(5, n);
				break;
			case 1:
				if (Au(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						ff(n, n.return, e);
					}
					else {
						var i = gc(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							ff(n, n.return, e);
						}
					}
				}
				r & 64 && vl(n), r & 512 && bl(n, n.return);
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
						_o(e, t);
					} catch (e) {
						ff(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Nl(n);
			case 26:
			case 5:
				Au(e, n), t === null && r & 4 && Dl(n), r & 512 && bl(n, n.return);
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
				if (r = n.memoizedState !== null || $l, !r) {
					var a = t !== null && t.memoizedState !== null || X;
					t = $l, i = X, $l = r, (X = a) && !i ? (r = 2, n.subtreeFlags & 8772 && (r |= 1), Mu(e, n, r)) : Au(e, n), $l = t, X = i;
				}
				break;
			case 30:
				Au(e, n), r & 512 && bl(n, n.return);
				break;
			case 7: r & 512 && bl(n, n.return);
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
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, G = !0;
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
		t !== null && (e.alternate = null, mu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Tt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var hu = null, gu = !1;
	function _u(e, t, n) {
		for (n = n.child; n !== null;) vu(e, t, n), n = n.sibling;
	}
	function vu(e, t, n) {
		if (Ge && typeof Ge.onCommitFiberUnmount == "function") try {
			Ge.onCommitFiberUnmount(We, n);
		} catch {}
		switch (n.tag) {
			case 26:
				X || xl(n, t), _u(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !X && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				X || xl(n, t), wl(n);
				var r = hu, i = gu;
				Sp(n.type) && (hu = n.stateNode, gu = !1), _u(e, t, n), gm(n.stateNode, n.type, n.memoizedProps), hu = r, gu = i;
				break;
			case 5: X || xl(n, t), wl(n);
			case 6:
				if (n.tag === 6 && wl(n), r = hu, i = gu, hu = null, _u(e, t, n), hu = r, gu = i, hu !== null) {
					if (gu) try {
						(hu.nodeType === 9 ? hu.body : hu.nodeName === "HTML" ? hu.ownerDocument.body : hu).removeChild(n.stateNode), G = !0;
					} catch (e) {
						ff(n, t, e);
					}
					else try {
						hu.removeChild(n.stateNode), G = !0;
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
				_l(2, n, t), X || _l(4, n, t), _u(e, t, n);
				break;
			case 1:
				X || (xl(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && yl(n, t, r)), _u(e, t, n);
				break;
			case 21:
				_u(e, t, n);
				break;
			case 22:
				X = (r = X) || n.memoizedState !== null, _u(e, t, n), X = r;
				break;
			case 30:
				xl(n, t), _u(e, t, n);
				break;
			case 7:
				X || xl(n, t), _u(e, t, n);
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
				Cu(t, e, n), Eu(e), i & 4 && (_l(3, e, e.return), gl(3, e), _l(5, e, e.return));
				break;
			case 1:
				Cu(t, e, n), Eu(e), i & 512 && (X || r === null || xl(r, r.return)), i & 64 && $l && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? t : n.concat(t))));
				break;
			case 26:
				if (a = wu, Cu(t, e, n), Eu(e), i & 512 && (X || r === null || xl(r, r.return)), i & 4) {
					if (i = r === null ? null : r.memoizedState, n = e.memoizedState, r === null) {
						if (n === null) {
							if (e.stateNode === null) {
								if ($l) e.stateNode = fp(e.type, e.memoizedProps, t.containerInfo, e);
								else {
									a: {
										t = e.type, n = e.memoizedProps, i = a.ownerDocument || a;
										b: switch (t) {
											case "title":
												r = i.getElementsByTagName("title")[0], (!r || r[Ct] || r[gt] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = i.createElement(t), i.head.insertBefore(r, i.querySelector("head > title"))), np(r, t, n), r[gt] = e, At(r), t = r;
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
										r[gt] = e, At(r), t = r;
									}
									e.stateNode = t;
								}
							} else $l || Km(a, e.type, e.stateNode);
						} else e.stateNode = Bm(a, n, e.memoizedProps);
					} else i === n ? n === null && e.stateNode !== null && Ol(e, e.memoizedProps, r.memoizedProps) : (i === null ? (t = r.stateNode, t === null || X || t.parentNode.removeChild(t)) : i.count--, n === null ? $l || Km(a, e.type, e.stateNode) : Bm(a, n, e.memoizedProps));
				}
				break;
			case 27:
				Cu(t, e, n), Eu(e), i & 512 && (X || r === null || xl(r, r.return)), r !== null && i & 4 && Ol(e, e.memoizedProps, r.memoizedProps);
				break;
			case 5:
				if (a = eu, eu = !1, Cu(t, e, n), eu = a, Eu(e), i & 512 && (X || r === null || xl(r, r.return)), e.flags & 32) {
					t = e.stateNode;
					try {
						rn(t, ""), G = !0;
					} catch (t) {
						ff(e, e.return, t);
					}
				}
				i & 4 && e.stateNode != null && (t = e.memoizedProps, Ol(e, t, r === null ? t : r.memoizedProps)), i & 1024 && (tu = !0);
				break;
			case 6:
				if (Cu(t, e, n), Eu(e), i & 4) {
					if (e.stateNode === null) throw Error(s(162));
					t = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = t, G = !0;
					} catch (t) {
						ff(e, e.return, t);
					}
				}
				break;
			case 3:
				if (G = !1, Wm = null, a = wu, wu = bm(t.containerInfo), Cu(t, e, n), wu = a, Eu(e), i & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					ff(e, e.return, t);
				}
				tu && (tu = !1, Du(e)), G = !1;
				break;
			case 4:
				i = eu, eu = $l, r = Bt(), a = wu, wu = bm(e.stateNode.containerInfo), Cu(t, e, n), Eu(e), wu = a, G && au && (ou = !0), G = r, eu = i;
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
				var c = $l, l = X, u = eu;
				$l = c || a, eu = u || a, X = l || o, Cu(t, e, n), X = l, eu = u, $l = c, Eu(e), i & 8192 && (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, !a || r === null || o || $l || X || (t = o || X, n = $l, r = X, $l = a || $l, X = t, ju(e, 2), $l = n, X = r), !a && eu || du(e, a)), i & 4 && (t = e.updateQueue, t !== null && (n = t.retryQueue, n !== null && (t.retryQueue = null, Su(e, n))));
				break;
			case 19:
				Cu(t, e, n), Eu(e), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Su(e, t)));
				break;
			case 30:
				i & 512 && (X || r === null || xl(r, r.return)), i = Bt(), a = au, o = (n & 335544064) === n, c = e.memoizedProps, au = o && di(c.default, c.update) !== "none", Cu(t, e, n), Eu(e), o && r !== null && G && (e.flags |= 4), au = a, G = i;
				break;
			case 21: break;
			case 7: i & 512 && (X || r === null || xl(r, r.return)), r && r.stateNode !== null && (r.stateNode._fragmentFiber = e);
			default: Cu(t, e, n), Eu(e);
		}
	}
	function Eu(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (kl(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				r = null;
				for (var i = e.return; i !== null;) {
					if (El(i)) {
						var a = i.stateNode;
						r === null ? r = [a] : r.push(a);
					}
					if (Tl(i)) break;
					i = i.return;
				}
				var o = r;
				if (n == null) throw Error(s(160));
				switch (n.tag) {
					case 27:
						var c = n.stateNode;
						Ml(e, Al(e), c, o);
						break;
					case 5:
						var l = n.stateNode;
						n.flags & 32 && (rn(l, ""), n.flags &= -33), Ml(e, Al(e), l, o);
						break;
					case 3:
					case 4:
						var u = n.stateNode.containerInfo;
						jl(e, Al(e), u, o);
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
		else Ql(t, !1);
	}
	function ku(e, t) {
		var n = e.alternate;
		if (n === null) Wl(e, !1);
		else switch (e.tag) {
			case 3:
				if (su = iu = !1, Rl(), Ou(t, e), !iu && !ou) {
					if (e = Ll, e !== null) for (var r = 0; r < e.length; r += 3) {
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
				Ll = null;
				break;
			case 5:
				Ou(t, e);
				break;
			case 4:
				r = iu, iu = !1, Ou(t, e), iu && (ou = !0), iu = r;
				break;
			case 22:
				e.memoizedState === null && (n.memoizedState === null ? Ou(t, e) : Wl(e, !1));
				break;
			case 30:
				r = iu, i = Rl(), iu = !1, Ou(t, e), iu && (e.flags |= 4);
				var a = e.memoizedProps, o = e.stateNode;
				t = li(a, o), o = li(n.memoizedProps, o);
				var s = di(a.default, a.update);
				s === "none" ? t = !1 : (a = n.memoizedState, n.memoizedState = null, n = e.child, zl = 0, t = Zl(e, n, t, o, s, a, !0), zl !== (a === null ? 0 : a.length) && (e.flags |= 32)), e.flags & 4 && t ? (jd(e, e.memoizedProps.onUpdate), Ll = i) : i !== null && (i.push.apply(i, Ll), Ll = i), iu = e.flags & 32 ? !0 : r;
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
					_l(4, n, n.return), ju(n, r);
					break;
				case 1:
					xl(n, n.return);
					var i = n.stateNode;
					typeof i.componentWillUnmount == "function" && yl(n, n.return, i), ju(n, r);
					break;
				case 27: r & 2 && gm(n.stateNode, n.type, n.memoizedProps);
				case 5:
					xl(n, n.return), n.tag !== 5 && n.tag !== 27 || wl(n), ju(n, r);
					break;
				case 6:
					wl(n);
					break;
				case 26:
					xl(n, n.return), i = n.stateNode, n.memoizedState !== null || i === null || X || i.parentNode.removeChild(i), ju(n, r);
					break;
				case 22:
					n.memoizedState === null && ju(n, r);
					break;
				case 30:
					xl(n, n.return), ju(n, r);
					break;
				case 7: xl(n, n.return);
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
					Mu(i, a, n), gl(4, a);
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
							if (l !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < l.length; i++) go(l[i], c);
						} catch (e) {
							ff(r, r.return, e);
						}
					}
					s && o & 64 && vl(a), bl(a, a.return);
					break;
				case 27: n & 2 && Nl(a);
				case 5:
					a.tag !== 5 && a.tag !== 27 || Cl(a), Mu(i, a, n), s && r === null && o & 4 && Dl(a), bl(a, a.return);
					break;
				case 6:
					Cl(a);
					break;
				case 26:
					c = a.stateNode, a.memoizedState !== null || c === null || $l || Km(bm(c.ownerDocument), a.type, c), Mu(i, a, n), s && r === null && o & 4 && Dl(a), bl(a, a.return);
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
					a.memoizedState === null && Mu(i, a, n), bl(a, a.return);
					break;
				case 30:
					Mu(i, a, n), bl(a, a.return);
					break;
				case 7: bl(a, a.return);
				default: Mu(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Nu(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && Ta(n));
	}
	function Pu(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ta(e));
	}
	function Fu(e, t, n, r) {
		var i = (n & 335544064) === n;
		if (t.subtreeFlags & (i ? 10262 : 10256)) for (t = t.child; t !== null;) Iu(e, t, n, r), t = t.sibling;
		else i && Xl(t);
	}
	function Iu(e, t, n, r) {
		var i = (n & 335544064) === n;
		i && t.alternate === null && t.return !== null && t.return.alternate !== null && Yl(t);
		var a = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Fu(e, t, n, r), a & 2048 && gl(9, t);
				break;
			case 1:
				Fu(e, t, n, r);
				break;
			case 3:
				Fu(e, t, n, r), i && su && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && Ta(a)));
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
				o = t.stateNode, s = t.alternate, t.memoizedState === null ? (i && s !== null && s.memoizedState !== null && Yl(t), o._visibility & 2 ? Fu(e, t, n, r) : (o._visibility |= 2, Lu(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))) : (i && s !== null && s.memoizedState === null && Yl(s), o._visibility & 2 ? Fu(e, t, n, r) : Ru(e, t)), a & 2048 && Nu(s, t);
				break;
			case 24:
				Fu(e, t, n, r), a & 2048 && Pu(t.alternate, t);
				break;
			case 30:
				i && (a = t.alternate, a !== null && (Hl(a.child, !0), Hl(t.child, !0))), Fu(e, t, n, r);
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
					Lu(a, o, s, c, i), gl(8, o);
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
					i.paired = null, Fl === null && (Fl = /* @__PURE__ */ new Map()), Fl.set(r, i);
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
				Uu(e), e.flags & 2048 && _l(9, e, e.return);
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
					_l(8, t, t.return), Gu(t);
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
					_l(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: Ta(n.memoizedState.cache);
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
			var t = _a(Ca), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return _a(Ca).controller.signal;
		}
	}, Ju = typeof WeakMap == "function" ? WeakMap : Map, Yu = 0, Xu = null, Z = null, Q = 0, Zu = 0, Qu = null, $u = !1, ed = !1, td = !1, nd = 0, rd = 0, id = 0, ad = 0, od = 0, sd = 0, cd = 0, ld = null, ud = null, dd = !1, fd = 0, pd = 0, md = Infinity, hd = null, gd = null, _d = 0, vd = null, yd = null, bd = 0, xd = 0, Sd = null, Cd = null, wd = null, Td = null, Ed = null, Dd = 0, Od = null;
	function kd() {
		return Yu & 2 && Q !== 0 ? Q & -Q : j.T === null ? pt() : Nf();
	}
	function Ad() {
		if (sd === 0) {
			if (!(Q & 536870912) || J) {
				var e = Ze;
				Ze <<= 1, !(Ze & 3932160) && (Ze = 262144), sd = e;
			} else sd = 536870912;
		}
		return e = Co.current, e !== null && (e.flags |= 32), sd;
	}
	function jd(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(li(e.memoizedProps, n))), Td === null && (Td = []), Td.push(t.bind(null, r));
		}
	}
	function Md(e, t, n) {
		(e === Xu && (Zu === 2 || Zu === 9) || e.cancelPendingCommit !== null) && (zd(e, 0), Id(e, Q, sd, !1)), ot(e, n), Yu & 2 && e === Xu || (e === Xu && (!(Yu & 2) && (ad |= n), rd === 4 && Id(e, Q, sd, !1)), Tf(e));
	}
	function Nd(e, t, n) {
		if (Yu & 6) throw Error(s(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || tt(e, t), i = r ? qd(e, t) : Gd(e, t, !0), a = r;
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
						if (Id(r, t, sd, !$u), et(r, 0, !0) !== 0) break a;
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
			unsuspend: K
		}, Fl = null, Vu(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? fd - B() : (a & 4194048) === a ? pd - B() : 0, m = eh(d, m), m !== null) ? (bd = a, e.cancelPendingCommit = m(ef.bind(null, e, t, a, n, r, i, o, s, c, l, u, d, null, f, p)), Id(e, a, o, !l)) : ef(e, t, a, n, r, i, o, s, c, l, u, d);
	}
	function Fd(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Nr(a(), i)) return !1;
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
		t = nt(e, t), t &= ~od, t &= ~ad, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - qe(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && ct(e, n, t);
	}
	function Ld() {
		return Yu & 6 ? !0 : (Ef(0, !1), !1);
	}
	function Rd() {
		if (Z !== null) {
			if (Zu === 0) var e = Z.return;
			else e = Z, la = ca = null, Qo(e), Za = null, Qa = 0, e = Z;
			for (; e !== null;) hl(e.alternate, e), e = e.return;
			Z = null;
		}
	}
	function zd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), bd = 0, Rd(), Xu = e, Z = n = Ei(e.current, null), Q = t, Zu = 0, Qu = null, $u = !1, ed = tt(e, t), td = !1, cd = sd = od = ad = id = rd = 0, ud = ld = null, dd = !1, nd = nt(e, t), gi(), n;
	}
	function Bd(e, t) {
		Y = null, j.H = cc, t === Va || t === Ua ? (t = Ya(), Zu = 3) : t === Ha ? (t = Ya(), Zu = 4) : Zu = t === Ec ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Qu = t, Z === null && (rd = 1, bc(e, Pi(t, e.current)));
	}
	function Vd() {
		var e = Co.current;
		return e === null ? !0 : (Q & 4194048) === Q ? wo === null : (Q & 62914560) === Q || Q & 536870912 ? e === wo : !1;
	}
	function Hd() {
		var e = j.H;
		return j.H = cc, e === null ? cc : e;
	}
	function Ud() {
		var e = j.A;
		return j.A = qu, e;
	}
	function Wd() {
		rd = 4, $u || (Q & 4194048) !== Q && Co.current !== null || (ed = !0), !(id & 134217727) && !(ad & 134217727) || Xu === null || Id(Xu, Q, sd, !1);
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
							Co.current === null && (t = !0);
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
		return t && e.shellSuspendCounter++, la = ca = null, Yu = r, j.H = i, j.A = a, Z === null && (Xu = null, Q = 0, gi()), o;
	}
	function Kd() {
		for (; Z !== null;) Yd(Z);
	}
	function qd(e, t) {
		var n = Yu;
		Yu |= 2;
		var r = Hd(), i = Ud();
		Xu !== e || Q !== t ? (hd = null, md = B() + 500, zd(e, t)) : ed = tt(e, t);
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
							if (Ga(a)) {
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
							Ga(a) ? (Zu = 0, Qu = null, Xd(t)) : (Zu = 0, Qu = null, Zd(e, t, a, 7));
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
		return la = ca = null, j.H = r, j.A = i, Yu = n, Z === null ? (Xu = null, Q = 0, gi(), rd) : 0;
	}
	function Jd() {
		for (; Z !== null && !R();) Yd(Z);
	}
	function Yd(e) {
		var t = ol(e.alternate, e, nd);
		e.memoizedProps = e.pendingProps, t === null ? Qd(e) : Z = t;
	}
	function Xd(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = Bc(n, t, t.pendingProps, t.type, void 0, Q);
				break;
			case 11:
				t = Bc(n, t, t.pendingProps, t.type.render, t.ref, Q);
				break;
			case 5:
				Qo(t);
				var r = t;
				r === Yi && (J ? (na(r), r.tag === 5 && r.stateNode != null && (Xi = r.stateNode)) : (na(r), J = !0));
			default: hl(n, t), t = Z = Di(t, nd), t = ol(n, t, nd);
		}
		e.memoizedProps = e.pendingProps, t === null ? Qd(e) : Z = t;
	}
	function Zd(e, t, n, r) {
		la = ca = null, Qo(t), Za = null, Qa = 0;
		var i = t.return;
		try {
			if (Tc(e, i, t, n, Q)) {
				rd = 1, bc(e, Pi(n, e.current)), Z = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw Z = i, t;
			rd = 1, bc(e, Pi(n, e.current)), Z = null;
			return;
		}
		t.flags & 32768 ? (J || r === 1 ? e = !0 : ed || Q & 536870912 ? e = !1 : ($u = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = Co.current, r !== null && r.tag === 13 && (r.flags |= 16384))), $d(t, e)) : Qd(t);
	}
	function Qd(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				$d(t, $u);
				return;
			}
			e = t.return;
			var n = pl(t.alternate, t, nd);
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
			var n = ml(e.alternate, e);
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
		if (xd = s, s |= hi, st(e, n, s, r, i, a), Td = null, (n & 335544064) === n ? (Ed = Oa(e), r = 10262) : (Ed = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, vf(Be, function() {
			return uf(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Pl = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = j.T, j.T = null, i = be.p, be.p = 2, a = Yu, Yu |= 4;
			try {
				cu(e, t, n);
			} finally {
				Yu = a, be.p = i, j.T = r;
			}
		}
		_d = 1, Pl ? wd = Mp(o, e.containerInfo, Ed, af, of, rf, sf, uf, nf, null, null) : (af(), of(), sf());
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
				var i = be.p;
				be.p = 2;
				var a = Yu;
				Yu |= 4;
				try {
					au = ou = !1, Tu(t, e, n), n = cp;
					var o = zr(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && Rr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Br(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Lr(s, h), v = Lr(s, g);
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
					Yu = a, be.p = i, j.T = r;
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
				var r = be.p;
				be.p = 2;
				var i = Yu;
				Yu |= 4;
				try {
					uu(e, t.alternate, t);
				} finally {
					Yu = i, be.p = r, j.T = n;
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
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? _d = 5 : (_d = 0, yd = vd = null, cf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (gd = null), ft(r), n = n.stateNode, Ge && typeof Ge.onCommitFiberRoot == "function") try {
				Ge.onCommitFiberRoot(We, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = j.T, a = be.p, be.p = 2, j.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					j.T = n, be.p = a;
				}
			}
			if (i = Td, o = Ed, Ed = null, i !== null && (Td = null, o === null && (o = []), e !== null)) for (c = 0; c < i.length; c++) n = (0, i[c])(o), n !== void 0 && e.finished.finally(n);
			bd & 3 && lf(), Tf(t), a = t.pendingLanes, r & 261930 && a & 42 ? t === Od ? Dd++ : (Dd = 0, Od = t) : (Dd = 0, Od = null), Ef(0, !1);
		}
	}
	function cf(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, Ta(t)));
	}
	function lf() {
		return wd !== null && (wd.skipTransition(), wd = null), af(), of(), sf(), uf();
	}
	function uf() {
		if (_d !== 5) return !1;
		var e = vd, t = xd;
		xd = 0;
		var n = ft(bd), r = j.T, i = be.p;
		try {
			be.p = 32 > n ? 32 : n, j.T = null, n = Sd, Sd = null;
			var a = vd, o = bd;
			if (_d = 0, yd = vd = null, bd = 0, Yu & 6) throw Error(s(331));
			var c = Yu;
			if (Yu |= 4, Wu(a.current), Iu(a, a.current, o, n), Yu = c, Ef(0, !1), Ge && typeof Ge.onPostCommitFiberRoot == "function") try {
				Ge.onPostCommitFiberRoot(We, a);
			} catch {}
			return !0;
		} finally {
			be.p = i, j.T = r, cf(e, t);
		}
	}
	function df(e, t, n) {
		t = Pi(n, t), t = Sc(e.stateNode, t, 2), e = lo(e, t, 2), e !== null && (ot(e, 2), Tf(e));
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
					e = Pi(n, e), n = Cc(2), r = lo(t, n, 2), r !== null && (wc(n, r, t, e), ot(r, 2), Tf(r));
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
		t === 0 && (t = it()), e = yi(e, t), e !== null && (ot(e, t), Tf(e));
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
		return I(e, t);
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
								a = (1 << 31 - qe(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, jf(r, a));
						} else a = Q, a = et(r, r === Xu ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || tt(r, a) || (n = !0, jf(r, a));
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
			var o = 31 - qe(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = rt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Xu, n = Q, n = et(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Zu === 2 || Zu === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && L(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || tt(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && L(r), ft(n)) {
				case 2:
				case 8:
					n = H;
					break;
				case 32:
					n = Be;
					break;
				case 268435456:
					n = U;
					break;
				default: n = Be;
			}
			return r = Af.bind(null, e), n = I(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && L(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function Af(e, t) {
		if (_d !== 0 && _d !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (lf() && e.callbackNode !== n) return null;
		var r = Q;
		return r = et(e, e === Xu ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Nd(e, r, t), kf(e, B()), e.callbackNode != null && e.callbackNode === n ? Af.bind(null, e) : null);
	}
	function jf(e, t) {
		if (lf()) return null;
		Nd(e, t, !0);
	}
	function Mf() {
		bp(function() {
			Yu & 6 ? I(V, Df) : Of();
		});
	}
	function Nf() {
		if (wf === 0) {
			var e = ja;
			e === 0 && (e = Xe, Xe <<= 1, !(Xe & 261888) && (Xe = 256)), wf = e;
		}
		return wf;
	}
	function Pf(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : dn(e);
	}
	function Ff(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Pf((i[_t] || null).action), o = r.submitter;
			o && (t = (t = o[_t] || null) ? Pf(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new jn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (wf !== 0) {
								var e = new FormData(i, o);
								Js(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = new FormData(i, o), Js(n, {
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
	for (var If = 0; If < oi.length; If++) {
		var Lf = oi[If];
		si(Lf.toLowerCase(), "on" + (Lf[0].toUpperCase() + Lf.slice(1)));
	}
	si(Qr, "onAnimationEnd"), si($r, "onAnimationIteration"), si(ei, "onAnimationStart"), si("dblclick", "onDoubleClick"), si("focusin", "onFocus"), si("focusout", "onBlur"), si(ti, "onTransitionRun"), si(ni, "onTransitionStart"), si(ri, "onTransitionCancel"), si(ii, "onTransitionEnd"), Ft("onMouseEnter", ["mouseout", "mouseover"]), Ft("onMouseLeave", ["mouseout", "mouseover"]), Ft("onPointerEnter", ["pointerout", "pointerover"]), Ft("onPointerLeave", ["pointerout", "pointerover"]), Pt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Pt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Pt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Pt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Pt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Pt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
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
						fi(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						fi(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function $(e, t) {
		var n = t[yt];
		n === void 0 && (n = t[yt] = /* @__PURE__ */ new Set());
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
			e[Hf] = !0, Mt.forEach(function(t) {
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
		n = i.bind(null, t, n, e), i = void 0, !bn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
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
					if (o = Et(s), o === null) return;
					if (c = o.tag, c === 5 || c === 6 || c === 26 || c === 27) {
						r = a = o;
						continue a;
					}
					s = s.parentNode;
				}
			}
			r = r.return;
		}
		_n(function() {
			var r = a, i = pn(n), o = [];
			a: {
				var s = ai.get(e);
				if (s !== void 0) {
					var c = jn, u = e;
					switch (e) {
						case "keypress": if (En(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = Yn;
							break;
						case "focusin":
							u = "focus", c = Bn;
							break;
						case "focusout":
							u = "blur", c = Bn;
							break;
						case "beforeblur":
						case "afterblur":
							c = Bn;
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
							c = Rn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = zn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = Qn;
							break;
						case Qr:
						case $r:
						case ei:
							c = Vn;
							break;
						case ii:
							c = $n;
							break;
						case "scroll":
						case "scrollend":
							c = Nn;
							break;
						case "wheel":
							c = er;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = Hn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							c = Xn;
							break;
						case "submit":
							c = Zn;
							break;
						case "toggle":
						case "beforetoggle": c = tr;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? s === null ? null : s + "Capture" : s;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = vn(m, p), g != null && d.push(Kf(m, g, h))), f) break;
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
					if (c = e === "mouseover" || e === "pointerover", s = e === "mouseout" || e === "pointerout", c && n !== fn && (u = n.relatedTarget || n.fromElement) && (Et(u) || u[vt])) break a;
					(s || c) && (u = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, s ? (c = n.relatedTarget || n.toElement, s = r, c = c ? Et(c) : null, c !== null && (f = l(c), d = c.tag, c !== f || d !== 5 && d !== 27 && d !== 6) && (c = null)) : (s = null, c = r), s !== c && (d = Rn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Xn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = s == null ? u : Ot(s), h = c == null ? u : Ot(c), u = new d(g, m + "leave", s, n, i), u.target = f, u.relatedTarget = h, g = null, Et(i) === r && (d = new d(p, m + "enter", c, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = s && c ? E(s, c, Jf) : null, s !== null && Yf(o, u, s, d, !1), c !== null && f !== null && Yf(o, f, c, d, !0)));
				}
				a: {
					if (s = r ? Ot(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var _ = xr;
					else if (hr(s)) {
						if (Sr) _ = jr;
						else {
							_ = kr;
							var v = Or;
						}
					} else c = s.nodeName, !c || c.toLowerCase() !== "input" || s.type !== "checkbox" && s.type !== "radio" ? r && cn(r.elementType) && (_ = xr) : _ = Ar;
					if (_ &&= _(e, r)) {
						gr(o, _, n, i);
						break a;
					}
					v && v(e, s, r);
				}
				switch (v = r ? Ot(r) : window, e) {
					case "focusin":
						(hr(v) || v.contentEditable === "true") && (Hr = v, Ur = r, Wr = null);
						break;
					case "focusout":
						Wr = Ur = Hr = null;
						break;
					case "mousedown":
						Gr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Gr = !1, Kr(o, n, i);
						break;
					case "selectionchange": if (Vr) break;
					case "keydown":
					case "keyup": Kr(o, n, i);
				}
				var y;
				if (rr) b: {
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
				else dr ? lr(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (or && n.locale !== "ko" && (dr || b !== "onCompositionStart" ? b === "onCompositionEnd" && dr && (y = Tn()) : (Sn = i, Cn = "value" in Sn ? Sn.value : Sn.textContent, dr = !0)), v = qf(r, b), 0 < v.length && (b = new Un(b, e, null, n, i), o.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = ur(n), y !== null && (b.data = y)))), (y = ar ? fr(e, n) : pr(e, n)) && (b = qf(r, "onBeforeInput"), 0 < b.length && (v = new Un("onBeforeInput", "beforeinput", null, n, i), o.push({
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
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = vn(e, n), i != null && r.unshift(Kf(e, i, a)), i = vn(e, t), i != null && r.push(Kf(e, i, a))), e.tag === 3) return r;
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
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = vn(n, a), l != null && o.unshift(Kf(n, l, c))) : i || (l = vn(n, a), l != null && o.push(Kf(n, l, c)))), n = n.return;
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
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || rn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && rn(e, "" + r);
				else return;
				break;
			case "className":
				Ht(e, "class", r);
				break;
			case "tabIndex":
				Ht(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Ht(e, n, r);
				break;
			case "style":
				sn(e, r, a);
				return;
			case "data": if (t !== "object") {
				Ht(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href") || r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = dn(r), e.setAttribute(n, r);
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
				r = dn(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = K);
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
				n = dn(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
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
				$("beforetoggle", e), $("toggle", e), Vt(e, "popover", r);
				break;
			case "xlinkActuate":
				Ut(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Ut(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Ut(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Ut(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Ut(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Ut(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Ut(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Ut(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Ut(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Vt(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = ln.get(n) || n, Vt(e, n, r);
			else return;
		}
		G = !0;
	}
	function tp(e, t, n, r, i, a) {
		switch (n) {
			case "style":
				sn(e, r, a);
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
				if (typeof r == "string") rn(e, r);
				else if (typeof r == "number" || typeof r == "bigint") rn(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && $("scroll", e);
				return;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = K);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!Nt.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (i = n.endsWith("Capture"), a = n.slice(2, i ? n.length - 7 : void 0), t = e[_t] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(a, t, i), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(a, r, i);
						break a;
					}
					G = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Vt(e, n, r);
				}
				return;
		}
		G = !0;
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
				Qt(e, a, c, l, u, o, i, !1);
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
				t = a, n = o, e.multiple = !!r, t == null ? n != null && en(e, !!r, n, !0) : en(e, !!r, t, !1);
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
				nn(e, r, i, a);
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
			default: if (cn(t)) {
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
							m !== f && (G = !0), a = m;
							break;
						case "name":
							m !== f && (G = !0), i = m;
							break;
						case "checked":
							m !== f && (G = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (G = !0), d = m;
							break;
						case "value":
							m !== f && (G = !0), o = m;
							break;
						case "defaultValue":
							m !== f && (G = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(s(137, t));
							break;
						default: m !== f && ep(e, t, p, m, r, f);
					}
				}
				Zt(e, o, c, l, u, d, a, i);
				return;
			case "select":
				for (a in m = o = c = p = null, n) if (l = n[a], n.hasOwnProperty(a) && l != null) switch (a) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(a) || ep(e, t, a, null, r, l);
				}
				for (i in r) if (a = r[i], l = n[i], r.hasOwnProperty(i) && (a != null || l != null)) switch (i) {
					case "value":
						a !== l && (G = !0), p = a;
						break;
					case "defaultValue":
						a !== l && (G = !0), c = a;
						break;
					case "multiple": a !== l && (G = !0), o = a;
					default: a !== l && ep(e, t, i, a, r, l);
				}
				t = c, n = o, r = m, p == null ? !!r != !!n && (t == null ? en(e, !!n, n ? [] : "", !1) : en(e, !!n, t, !0)) : en(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (i = n[c], n.hasOwnProperty(c) && i != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: ep(e, t, c, null, r, i);
				}
				for (o in r) if (i = r[o], a = n[o], r.hasOwnProperty(o) && (i != null || a != null)) switch (o) {
					case "value":
						i !== a && (G = !0), p = i;
						break;
					case "defaultValue":
						i !== a && (G = !0), m = i;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (i != null) throw Error(s(91));
						break;
					default: i !== a && ep(e, t, o, i, r, a);
				}
				tn(e, p, m);
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
						p !== m && (G = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
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
			default: if (cn(t)) {
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
		return n = lp(n).createElement(e), n[gt] = r, n[_t] = t, np(n, e, t), At(n), n;
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
						a[Ct] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
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
		var a = Et(i);
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
					nm(n), Tt(n);
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
			} else if (!e[Ct]) switch (t) {
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
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === K && (e.onclick = null), Tt(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		Tt(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = be.d;
	be.d = {
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
		var t = Dt(e);
		t !== null && t.tag === 5 && t.type === "form" ? Xs(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = Xt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), At(t), r.head.appendChild(t)));
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
			var i = "link[rel=\"preload\"][as=\"" + Xt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Xt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Xt(n.imageSizes) + "\"]")) : i += "[href=\"" + Xt(e) + "\"]";
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
				np(o, "link", e), t === "style" && (o[wt] = !0, o.onload = o.onerror = function() {
					jt(o);
				}), At(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Xt(r) + "\"][href=\"" + Xt(e) + "\"]", a = i;
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
				r = n.createElement("link"), np(r, "link", e), At(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = kt(r).hoistableStyles, a = Pm(e);
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
					At(c), np(c, "link", e), c._p = new Promise(function(e, t) {
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
			var r = kt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), At(a), np(a, "link", e), n.head.appendChild(a)), a = {
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
			var r = kt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), At(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var i = (i = Oe.current) ? bm(i) : null;
		if (!i) throw Error(s(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = kt(i).hoistableStyles, r = t.get(n), r || (r = {
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
					var a = kt(i).hoistableStyles, o = a.get(e);
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
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = kt(i).hoistableScripts, r = t.get(n), r || (r = {
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
		return "href=\"" + Xt(e) + "\"";
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
			if (!0 !== t[wt]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[wt] = !0, t.onload = t.onerror = jt.bind(null, t), np(t, "link", n), At(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + Xt(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Xt(n.href) + "\"]");
				if (r) return t.instance = r, At(r), r;
				var i = D({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), At(r), np(r, "style", i), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				i = Pm(n.href);
				var a = e.querySelector(Fm(i));
				if (a) return t.state.loading |= 4, t.instance = a, At(a), a;
				r = Im(n), (i = vm.get(i)) && Hm(r, i), a = (e.ownerDocument || e).createElement("link"), At(a);
				var o = a;
				return o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), np(a, "link", r), t.state.loading |= 4, Vm(a, n.precedence, e), t.instance = a;
			case "script": return a = Rm(n.src), (i = e.querySelector(zm(a))) ? (t.instance = i, At(i), i) : (r = n, (i = vm.get(a)) && (r = D({}, n), Um(r, i)), e = e.ownerDocument || e, i = e.createElement("script"), At(i), np(i, "link", r), e.head.appendChild(i), t.instance = i);
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
			if (!(a[Ct] || a[gt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
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
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, At(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), At(a);
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
		_currentValue: xe,
		_currentValue2: xe,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = at(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = at(0), this.hiddenUpdates = at(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = wi(3, null, null, t), e.current = a, a.stateNode = e, t = wa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, oo(a), e;
	}
	function uh(e) {
		return e ? (e = Si, e) : Si;
	}
	function dh(e, t, n, r, i, a) {
		i = uh(i), r.context === null ? r.context = i : r.pendingContext = i, r = co(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = lo(e, r, t), n !== null && (Md(n, e, t), uo(n, e, t));
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
			var t = yi(e, 67108864);
			t !== null && Md(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = kd();
			t = dt(t);
			var n = yi(e, t);
			n !== null && Md(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = j.T;
		j.T = null;
		var a = be.p;
		try {
			be.p = 2, yh(e, t, n, r);
		} finally {
			be.p = a, j.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = j.T;
		j.T = null;
		var a = be.p;
		try {
			be.p = 8, yh(e, t, n, r);
		} finally {
			be.p = a, j.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) Gf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = Dt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = $e(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - qe(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Tf(a), !(Yu & 6) && (md = B() + 500, Ef(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = yi(a, 2), s !== null && Md(s, a, 2), Ld(), ph(a, 2);
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
		if (xh = null, e = Et(e), e !== null) {
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
			case "message": switch (ze()) {
				case V: return 2;
				case H: return 8;
				case Be:
				case Ve: return 32;
				case U: return 268435456;
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
		}, t !== null && (t = Dt(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
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
		var t = Et(e.target);
		if (t !== null) {
			var n = l(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = u(n), t !== null) {
						e.blockedOn = t, mt(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = d(n), t !== null) {
						e.blockedOn = t, mt(e.priority, function() {
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
			} else return t = Dt(n), t !== null && mh(t), e.blockedOn = n, !1;
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
				var a = Dt(n);
				a !== null && (e.splice(t, 3), t -= 3, Js(a, {
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
			var i = n[r], a = n[r + 1], o = i[_t] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[_t] || null) s = o.formAction;
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
			dh(e.current, 2, null, e, null, null), Ld(), t[vt] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = pt();
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
	be.findDOMNode = function(e) {
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
			We = Jh.inject(qh), Ge = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!c(e)) throw Error(s(299));
		var n = !1, r = "", i = _c, a = vc, o = yc;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (i = t.onUncaughtError), t.onCaughtError !== void 0 && (a = t.onCaughtError), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, i, a, o, Uh), e[vt] = t.current, Uf(e), new Wh(t);
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
}, be = "legion.graphWorkspaceHeightPx", xe = 1600, Se = "#ff9f43", Ce = {
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
}, we = {
	observed: "observed",
	inferred: "inferred",
	ai_suggested: "ai suggested",
	user_entered: "user entered"
}, Te = {
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
}, Ee = {
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
}, De = [
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
], Oe = {
	critical: 0,
	high: 1,
	medium: 2,
	moderate: 2,
	low: 3,
	info: 4,
	informational: 4
}, ke = { modalOpen: !1 }, N = {
	scriptDbId: null,
	processId: 0,
	scriptId: "",
	source: "",
	output: "",
	command: "",
	status: "",
	downloadName: "",
	modalOpen: !1
}, Ae = {
	modalOpen: !1,
	url: "",
	filename: "",
	port: ""
}, je = {
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
}, Me = {
	modalOpen: !1,
	hostId: null,
	hostIp: "",
	hostName: ""
}, Ne = {
	step: 1,
	lastMode: "",
	lastEngagementPreset: "",
	postSubmitLock: !0,
	captureInterfacesLoaded: !1
}, Pe = {
	modalOpen: !1,
	busy: !1,
	pendingAction: null,
	pendingLabel: "",
	latestSummary: null
}, P = {
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
	let e = !!(ke.modalOpen || N.modalOpen || Ae.modalOpen || P.schedulerOpen || P.interfaceSettingsOpen || P.deviceCategorySettingsOpen || P.reportProviderOpen || P.settingsOpen || P.nmapScanOpen || P.manualScanOpen || P.hostSelectionOpen || P.scriptCveOpen || P.providerLogsOpen || P.credentialsOpen || P.credentialCaptureConfigOpen || P.jobsOpen || P.submittedScansOpen || P.schedulerDecisionsOpen || P.hostRemoveOpen || P.graphNoteOpen || P.workspaceSwitchGuardOpen);
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
function L(e, t) {
	let n = document.getElementById(e);
	n && (n.checked = !!t);
}
function R(e) {
	let t = document.getElementById(e);
	return t ? !!t.checked : !1;
}
function z(e) {
	let t = document.getElementById(e);
	return t ? t.value : "";
}
function B(e) {
	let t = document.createElement("td");
	return t.textContent = e ?? "", t;
}
function ze(e) {
	return String(e || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function V(e, t = !1) {
	let n = document.getElementById("action-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
function H(e, t = !1) {
	let n = document.getElementById("workspace-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
// ../app/web/static/js/workspace/project_view.js
function Be(e) {
	p(e), F("project-name", e.name || "");
	let t = document.getElementById("project-name");
	t && (t.dataset.displayName = e.display_name || ""), F("project-kind", e.is_temporary ? "temporary" : "saved"), F("project-output-folder", e.output_folder || ""), F("project-running-folder", e.running_folder || ""), !z("project-save-path").trim() && e.name && I("project-save-path", e.name);
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
})), U = (/* @__PURE__ */ e(((e, t) => {
	t.exports = Ve();
})))();
function He({ sidebar: e, title: t, sidebarEditor: n, titleEditor: r }) {
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
				_.getSnapshot().name === o.path && (b(t), Be(t), V("Workspace renamed")), S();
			} catch (e) {
				d(e instanceof Error ? e.message : "Rename failed."), requestAnimationFrame(() => g.current?.focus());
			} finally {
				m.current = !1, p(!1);
			}
		}
	}
	let D = o?.location === "sidebar", O = /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)("input", {
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
	}), /* @__PURE__ */ (0, U.jsx)("span", {
		role: "alert",
		className: `workspace-rename-error${D ? " workspace-rename-sidebar-error" : ""}`,
		children: u
	})] });
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
		(0, T.createPortal)(/* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)("strong", {
			id: "sidebar-project-name",
			title: "Double-click to rename workspace",
			style: { visibility: D ? "hidden" : void 0 },
			onDoubleClick: (e) => {
				e.preventDefault(), e.stopPropagation(), x("sidebar");
			},
			children: v
		}), /* @__PURE__ */ (0, U.jsx)("small", {
			id: "sidebar-project-kind",
			children: i.is_temporary ? "Temporary · save to keep your work" : "Saved project"
		})] }), e),
		(0, T.createPortal)(/* @__PURE__ */ (0, U.jsx)("button", {
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
function Ue() {
	let e = (0, w.useSyncExternalStore)(v.subscribe, v.getSnapshot), [t, n] = (0, w.useState)(/* @__PURE__ */ new Set()), [r, i] = (0, w.useState)(""), a = (0, w.useRef)(/* @__PURE__ */ new Set());
	async function o(e) {
		if (!a.current.has(e)) {
			a.current.add(e), n((t) => new Set(t).add(e)), i("");
			try {
				let t = await me(e);
				v.set(v.getSnapshot().map((e) => e.id === t.id ? t : e)), V("Job stop requested"), v.set(await pe());
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
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [r && /* @__PURE__ */ (0, U.jsx)("tr", {
		role: "alert",
		children: /* @__PURE__ */ (0, U.jsx)("td", {
			colSpan: 8,
			children: r
		})
	}), e.map((e) => {
		let n = e.status === "queued" || e.status === "running", r = e.cancel_requested || t.has(e.id), i = r && n ? e.status === "queued" ? "cancelling" : "stopping" : e.status, a = Array.isArray(e.result?.warnings) ? e.result.warnings.filter((e) => typeof e == "string") : [], s = e.error || a.join(" | ") || (r ? e.cancel_reason || "stop requested" : "");
		return /* @__PURE__ */ (0, U.jsxs)("tr", {
			"data-job-id": e.id,
			children: [
				/* @__PURE__ */ (0, U.jsx)("td", { children: e.id }),
				/* @__PURE__ */ (0, U.jsx)("td", { children: e.type }),
				/* @__PURE__ */ (0, U.jsx)("td", { children: i }),
				/* @__PURE__ */ (0, U.jsx)("td", { children: e.created_at }),
				/* @__PURE__ */ (0, U.jsx)("td", { children: e.started_at }),
				/* @__PURE__ */ (0, U.jsx)("td", { children: e.finished_at }),
				/* @__PURE__ */ (0, U.jsx)("td", { children: s }),
				/* @__PURE__ */ (0, U.jsx)("td", { children: n && /* @__PURE__ */ (0, U.jsx)("button", {
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
async function W(e, t) {
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
async function Xe(e) {
	let t = await fetch(e, { cache: "no-store" });
	if (!t.ok) throw Error(`Request failed (${t.status})`);
	return t.json();
}
// ../app/web/static/js/workspace/output_format.js
function Ze(e) {
	e.bold = !1, e.fg = "", e.bg = "";
}
function Qe(e, t) {
	let n = Array.isArray(e) && e.length ? e : [0];
	for (let e = 0; e < n.length; e += 1) {
		let r = Number(n[e]);
		if (Number.isFinite(r)) {
			if (r === 0) Ze(t);
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
function $e(e) {
	let t = ["ansi-segment"];
	return e.bold && t.push("ansi-bold"), e.fg && t.push(e.fg), e.bg && t.push(e.bg), t.join(" ");
}
function et(e) {
	let t = String(e || "").replace(/\r\n/g, "\n"), n = /\u001b\[([0-9;]*)m/g, r = {
		bold: !1,
		fg: "",
		bg: ""
	}, i = 0, a = "";
	return t.replace(n, (e, n, o) => {
		if (o > i) {
			let e = t.slice(i, o);
			a += `<span class="${$e(r)}">${ze(e)}</span>`;
		}
		return Qe(String(n || "").split(";").map((e) => e.trim()).filter((e) => e.length > 0).map((e) => parseInt(e, 10)).filter((e) => Number.isFinite(e)), r), i = o + e.length, e;
	}), i < t.length && (a += `<span class="${$e(r)}">${ze(t.slice(i))}</span>`), a || "";
}
function tt(e, t) {
	let n = document.getElementById(e);
	if (!n) return;
	let r = Math.abs(n.scrollTop + n.clientHeight - n.scrollHeight) < 24;
	n.innerHTML = et(t || ""), r && (n.scrollTop = n.scrollHeight);
}
function nt(e, t = "", n = "") {
	let r = String(e || "").trim(), i = String(t || "").trim(), a = String(n || "").trim();
	return !i && !a ? r : a ? i ? `${r}:${i}/${a}` : r ? `${r}/${a}` : `/${a}` : `${r}:${i}`;
}
function rt(e, t = 160) {
	let n = String(e || "").replace(/\s+/g, " ").trim();
	return n ? n.length <= t ? n : `${n.slice(0, t - 3)}...` : "";
}
function it(e) {
	let t = Array.isArray(e?.scripts) ? e.scripts : [], n = [
		(e) => e === "banner",
		(e) => e.includes("banner"),
		(e) => e === "http-title",
		(e) => e === "dns-nsid"
	];
	for (let e of n) for (let n of t) {
		let t = String(n?.script_id || "").trim().toLowerCase();
		if (!t || !e(t)) continue;
		let r = rt(n?.output || "");
		if (r) return r;
	}
	let r = e?.service || {};
	return rt([
		r.product,
		r.version,
		r.extrainfo
	].filter(Boolean).join(" "));
}
function at(e) {
	let t = Number(e);
	if (!Number.isFinite(t) || t <= 0) return "";
	let n = Math.max(0, Math.floor(t)), r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60), a = n % 60;
	return r > 0 ? `${r}h ${String(i).padStart(2, "0")}m ${String(a).padStart(2, "0")}s` : `${i}m ${String(a).padStart(2, "0")}s`;
}
function ot(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "running" || t === "waiting";
}
function st(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "running" ? "process-status-running" : t === "crashed" ? "process-status-crashed" : t === "problem" ? "process-status-problem" : "";
}
// ../app/web/static/js/workspace/process_output.js
var ct, lt;
function ut(e) {
	for (let t of ["setCredentialCaptureConfigModalOpen", "setCredentialsModalOpen"]) if (typeof e[t] != "function") throw TypeError(`Missing process_output callback: ${t}`);
	({setCredentialCaptureConfigModalOpen: ct, setCredentialsModalOpen: lt} = e);
}
function dt(e) {
	Je("processes", e || []);
}
function ft(e) {
	F("script-output-meta", e || "");
}
function pt(e) {
	N.output = String(e || ""), tt("script-output-text", N.output);
}
function mt(e) {
	F("script-output-command", e || "");
}
function ht(e) {
	let t = document.getElementById("process-output-modal");
	t && (ke.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function gt(e) {
	let t = document.getElementById("script-output-modal");
	t && (N.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function _t(e) {
	let t = document.getElementById("screenshot-modal");
	t && (Ae.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function vt() {
	return Ye("closeOutput");
}
function yt(e = !0) {
	gt(!1), e && (N.scriptDbId = null, N.processId = 0, N.scriptId = "", N.source = "", N.output = "", N.command = "", N.status = "", N.downloadName = "", F("script-output-modal-title", "Script Output"), ft("No script selected"), mt(""), pt(""));
}
function bt(e = !0) {
	if (_t(!1), e) {
		Ae.url = "", Ae.filename = "", Ae.port = "";
		let e = document.getElementById("screenshot-modal-image");
		e && e.removeAttribute("src"), F("screenshot-modal-meta", "No screenshot selected");
	}
}
function xt() {
	lt(!1);
}
function St() {
	ct(!1);
}
function Ct(e) {
	return Ye("openOutput", Number(e));
}
async function wt(e) {
	let t = parseInt(e, 10);
	if (t) {
		gt(!0), F("script-output-modal-title", "Script Output"), ft(`Script ${t} | loading...`), mt(""), pt(""), N.scriptDbId = t, N.processId = 0, N.scriptId = "", N.source = "", N.output = "", N.command = "", N.status = "", N.downloadName = "";
		try {
			let e = await Xe(`/api/workspace/scripts/${t}/output?max_chars=50000`), n = String(e.output || e.output_chunk || ""), r = e.source === "process" ? `Process ${e.process_id || "?"}` : "Script row output";
			N.processId = parseInt(e.process_id, 10) || 0, N.scriptId = String(e.script_id || ""), N.source = String(e.source || ""), N.output = n, N.command = String(e.command || ""), N.status = String(e.status || ""), N.downloadName = "", mt(e.command || "(no associated process command)"), pt(n), ft(`${e.script_id || `Script ${t}`} | ${r} | bytes ${e.output_length || n.length}`);
		} catch (e) {
			ft(`Script ${t} | load failed`), pt(`Failed to load script output: ${e.message || e}`);
		}
	}
}
function Tt({ title: e = "Artifact Preview", meta: t = "", command: n = "", output: r = "", downloadName: i = "" } = {}) {
	gt(!0), N.scriptDbId = null, N.processId = 0, N.scriptId = "", N.source = "graph", N.output = String(r || ""), N.command = String(n || ""), N.status = "", N.downloadName = String(i || ""), F("script-output-modal-title", e || "Artifact Preview"), ft(String(t || "Artifact preview")), mt(n || "(no associated command)"), pt(r || "");
}
function Et(e, t, n = "") {
	let r = String(e || "").trim();
	if (!r) {
		H("Screenshot URL is missing", !0);
		return;
	}
	Ae.url = r, Ae.filename = String(t || "").trim() || "screenshot.png", Ae.port = String(n || "").trim();
	let i = document.getElementById("screenshot-modal-image");
	i && (i.src = `${r}${r.includes("?") ? "&" : "?"}t=${Date.now()}`, i.alt = Ae.filename || "Screenshot preview");
	let a = Ae.port ? ` (${Ae.port})` : "";
	F("screenshot-modal-meta", `${Ae.filename}${a}`), _t(!0);
}
async function Dt() {
	await At(N.output || "", "Script output copied to clipboard", "No script output to copy");
}
async function Ot() {
	let e = document.getElementById("script-output-command");
	await At(e ? String(e.textContent || "") : "", "Command copied to clipboard", "No command to copy");
}
async function kt() {
	let e = String(Ae.url || "").trim();
	if (!e) H("No screenshot to copy", !0);
	else if (!(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write)) await At(e, "Screenshot URL copied to clipboard", "No screenshot to copy");
	else try {
		let t = await fetch(e);
		if (!t.ok) throw Error(`HTTP ${t.status}`);
		let n = await t.blob(), r = n.type || "image/png", i = new ClipboardItem({ [r]: n });
		await navigator.clipboard.write([i]), H("Screenshot copied to clipboard");
	} catch (e) {
		H(`Screenshot copy failed: ${e.message}`, !0);
	}
}
async function At(e, t, n) {
	let r = String(e || "");
	if (!r) H(n || "Nothing to copy", !0);
	else try {
		if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(r);
		else {
			let e = document.createElement("textarea");
			e.value = r, e.setAttribute("readonly", "readonly"), e.style.position = "absolute", e.style.left = "-9999px", document.body.appendChild(e), e.select(), document.execCommand("copy"), document.body.removeChild(e);
		}
		H(t || "Copied to clipboard");
	} catch (e) {
		H(`Copy failed: ${e.message}`, !0);
	}
}
function jt() {
	let e = N.output || "";
	if (!e) {
		H("No script output to download", !0);
		return;
	}
	if (N.downloadName) {
		let t = new Blob([e], { type: "text/plain;charset=utf-8" }), n = URL.createObjectURL(t), r = document.createElement("a");
		r.href = n, r.download = N.downloadName, document.body.appendChild(r), r.click(), r.remove(), URL.revokeObjectURL(n), H(`${N.downloadName} downloaded`);
		return;
	}
	let t = parseInt(N.scriptDbId, 10) || "unknown", n = (String(N.scriptId || "").trim() || `script-${t}`).replace(/[^a-zA-Z0-9._-]+/g, "-"), r = new Blob([e], { type: "text/plain;charset=utf-8" }), i = URL.createObjectURL(r), a = document.createElement("a");
	a.href = i, a.download = `${n}-${t}-output.txt`, document.body.appendChild(a), a.click(), a.remove(), URL.revokeObjectURL(i), H(`Script ${t} output downloaded`);
}
async function Mt() {
	let e = String(Ae.url || "").trim();
	if (!e) H("No screenshot to download", !0);
	else try {
		let t = await fetch(e);
		if (!t.ok) throw Error(`HTTP ${t.status}`);
		let n = await t.blob(), r = String(Ae.filename || "screenshot.png").replace(/[^a-zA-Z0-9._-]+/g, "-"), i = URL.createObjectURL(n), a = document.createElement("a");
		a.href = i, a.download = r || "screenshot.png", document.body.appendChild(a), a.click(), a.remove(), URL.revokeObjectURL(i), H(`Downloaded ${r}`);
	} catch (e) {
		H(`Screenshot download failed: ${e.message}`, !0);
	}
}
function Nt(e) {
	F("stat-hosts", e.hosts), F("stat-open-ports", e.open_ports), F("stat-services", e.services), F("stat-cves", e.cves), F("stat-running", e.running_processes), F("stat-finished", e.finished_processes);
}
// ../app/web/static/js/workspace/activity.js
function Pt(e) {
	if (e && typeof e == "object") {
		if (e.project && Be(e.project), e.summary && Nt(e.summary), e.scheduler) {
			let t = e.scheduler.engagement_policy || {};
			F("scheduler-mode", e.scheduler.mode || ""), F("scheduler-goal", t.preset_label || t.preset || e.scheduler.goal_profile || ""), F("scheduler-families", e.scheduler.preapproved_families_count || 0);
		}
		Array.isArray(e.scheduler_rationale_feed) && Ft(e.scheduler_rationale_feed);
	}
}
function Ft(e) {
	Je("rationale", e || []);
}
function It(e) {
	Je("decisions", e || []);
}
function Lt(e) {
	Je("approvals", e || []);
}
function Rt(e) {
	Je("scans", e || []);
}
function zt(e) {
	m(e || []), F("job-count", (e || []).length);
}
function G() {
	return Ye("loadOverview");
}
function Bt() {
	return Ye("loadProcesses");
}
function Vt() {
	return Ye("loadDecisions");
}
function Ht() {
	return Ye("loadScans");
}
function Ut() {
	return Ye("loadProviderLogs");
}
async function Wt() {
	zt((await Xe("/api/jobs?limit=20")).jobs || []);
}
// ../app/web/static/js/workspace/approvals.js
function Gt() {
	return Ye("loadApprovals");
}
// ../app/web/static/js/workspace/graph_selection.js
function Kt(e, t) {
	return e === "edge" ? (A.filtered.edges || []).find((e) => String(e?.edge_id || "") === String(t || "")) || null : (A.filtered.nodes || []).find((e) => String(e?.node_id || "") === String(t || "")) || null;
}
// ../app/web/static/js/workspace/graph_common.js
var qt, Jt;
function Yt(e) {
	for (let t of ["graphRenderWorkspace", "graphSyncDetailPresentation"]) if (typeof e[t] != "function") throw TypeError(`Missing graph_common callback: ${t}`);
	({graphRenderWorkspace: qt, graphSyncDetailPresentation: Jt} = e);
}
function Xt() {
	let e = document.getElementById("graph-workspace-panel");
	return String(e?.dataset?.graphEnabled || "").toLowerCase() === "true";
}
function Zt() {
	let e = document.getElementById("graph-workspace-canvas");
	return e ? e.closest(".graph-panel") : null;
}
function Qt() {
	return document.getElementById("graph-workspace-shell");
}
function $t() {
	let e = Qt();
	return e ? e.closest(".graph-panel") : null;
}
function en() {
	return document.querySelector(".graph-canvas-panel");
}
function tn() {
	return document.querySelector(".graph-canvas-scroll");
}
function nn() {
	return !!(A.selectedKind && A.selectedRef);
}
function rn({ allowRetainedSummary: e = !0 } = {}) {
	if (A.selectedKind !== "node" || !A.selectedRef) return null;
	let t = Kt("node", A.selectedRef);
	if (t) return t;
	if (!e) return null;
	let n = A.selectedPayload, r = String(A.selectedRef || ""), i = String(n?.node_id || "");
	return !n || i !== r || !q(n, "summary_kind") || !A.expandedSummaryIds[i] ? null : n;
}
function an(e) {
	let t = Number.parseInt(String(e || ""), 10);
	return Number.isFinite(t) ? Math.max(520, Math.min(xe, t)) : 680;
}
function on(e, { persist: t = !0 } = {}) {
	let n = Zt();
	if (!n) return;
	let r = an(e);
	if (n.style.setProperty("--graph-workspace-height", `${r}px`), t) try {
		window.localStorage.setItem(be, String(r));
	} catch {}
	Jt();
}
function sn() {
	try {
		let e = window.localStorage.getItem(be);
		if (e) {
			on(e, { persist: !1 });
			return;
		}
	} catch {}
	on(680, { persist: !1 });
}
function cn() {
	if (!A.resize) return;
	let e = A.resize.handle, t = A.resize.pointerId;
	if (document.body.classList.remove("graph-workspace-resizing"), window.removeEventListener("pointermove", ln), window.removeEventListener("pointerup", cn), window.removeEventListener("pointercancel", cn), window.removeEventListener("blur", cn), e && typeof e.releasePointerCapture == "function" && t != null) try {
		e.hasPointerCapture && e.hasPointerCapture(t) && e.releasePointerCapture(t);
	} catch {}
	on(A.resize.currentHeight || A.resize.startHeight), A.resize = null;
}
function ln(e) {
	if (!A.resize) return;
	let t = Number(e.clientY || 0) - A.resize.startY, n = A.resize.startHeight + t;
	A.resize.currentHeight = an(n), on(A.resize.currentHeight, { persist: !1 }), qt({ preserveDetail: !0 });
}
function un(e) {
	if (!Xt()) return;
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
	document.body.classList.add("graph-workspace-resizing"), window.addEventListener("pointermove", ln), window.addEventListener("pointerup", cn), window.addEventListener("pointercancel", cn), window.addEventListener("blur", cn);
}
function dn() {
	on(680);
}
function K(e, t = !1) {
	let n = document.getElementById("graph-workspace-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function fn(e) {
	return String(e || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
function pn(e) {
	let t = String(e || "").trim(), n = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
	return n ? `${n[1]}.${n[2]}.${n[3]}.0/24` : t || "other";
}
function mn(e) {
	let t = String(e || ""), n = 5381;
	for (let e = 0; e < t.length; e += 1) n = (n << 5) + n + t.charCodeAt(e), n &= 2147483647;
	return Math.abs(n).toString(36);
}
function hn(e) {
	let t = String(e || "").trim().toLowerCase().split(".").filter(Boolean);
	if (t.length <= 2) return t.join(".") || "";
	let n = t.slice(-2).join(".");
	return [
		"co.uk",
		"com.au",
		"co.jp"
	].includes(n) && t.length >= 3 ? t.slice(-3).join(".") : t.slice(-2).join(".");
}
function gn(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	try {
		return new URL(t).host || "";
	} catch {
		let e = t.match(/^[a-z]+:\/\/([^/?#]+)/i);
		return e ? String(e[1] || "").trim() : "";
	}
}
function q(e, t) {
	return !e || typeof e != "object" ? "" : (e.properties && typeof e.properties == "object" ? e.properties : {})[t];
}
function _n(e) {
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
function vn(e) {
	let t = String(e?.last_seen || "").trim(), n = String(e?.first_seen || "").trim();
	return t || n || "";
}
function yn(e) {
	let t = {
		"24h": 24,
		"7d": 168,
		"30d": 720,
		"90d": 2160
	}[String(e || "all").trim().toLowerCase()];
	return t ? Date.now() - t * 60 * 60 * 1e3 : 0;
}
function bn(e, t) {
	if (!t) return !0;
	let n = Date.parse(vn(e));
	return !Number.isFinite(n) || n >= t;
}
function xn(e, t) {
	let n = String(t || "").trim().toLowerCase();
	return !n || String(q(e, "severity") || "").trim().toLowerCase() === n;
}
function Sn(e, t) {
	let n = String(t || "").trim().toLowerCase();
	return !n || _n(e).some((e) => String(e || "").trim().toLowerCase() === n);
}
function Cn() {
	F("graph-min-confidence-value", z("graph-min-confidence") || "0");
}
function wn() {
	let e = Math.max(10, Math.min(400, parseInt(z("graph-zoom-slider"), 10) || A.zoomPercent || 100));
	A.zoomPercent = e, F("graph-zoom-value", `${e}%`);
}
function Tn() {
	return Ce[String(z("graph-view-select") || A.viewId || "attack_surface").trim()] || Ce.attack_surface;
}
function En(e, t, n) {
	let r = typeof e == "string" ? document.getElementById(e) : e;
	if (!r) return;
	let i = String(r.value || ""), a = Array.from(new Set((t || []).map((e) => String(e || "").trim()).filter(Boolean))).sort();
	r.innerHTML = "";
	let o = document.createElement("option");
	o.value = "", o.textContent = n, r.appendChild(o), a.forEach((e) => {
		let t = document.createElement("option");
		t.value = e, t.textContent = fn(e), r.appendChild(t);
	}), a.includes(i) && (r.value = i);
}
function Dn() {
	let e = document.getElementById("graph-layout-select");
	if (!e) return;
	let t = String(z("graph-view-select") || A.viewId || "attack_surface").trim(), n = String(A.activeLayoutId || e.value || ""), r = (A.layouts || []).filter((e) => String(e?.view_id || "").trim() === t);
	e.innerHTML = "";
	let i = document.createElement("option");
	i.value = "", i.textContent = "auto layout", e.appendChild(i), r.forEach((t) => {
		let n = document.createElement("option");
		n.value = String(t.layout_id || ""), n.textContent = `${t.name || "layout"}${t.updated_at ? ` (${t.updated_at})` : ""}`, e.appendChild(n);
	}), e.value = r.some((e) => String(e.layout_id || "") === n) ? n : "";
}
function On() {
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
function kn() {
	let e = A.data || {}, t = Array.isArray(e.nodes) ? e.nodes : [], n = Array.isArray(e.edges) ? e.edges : [];
	En("graph-node-type-filter", t.map((e) => String(e?.type || "").trim().toLowerCase()), "all node types"), En("graph-edge-type-filter", n.map((e) => String(e?.type || "").trim().toLowerCase()), "all edge types"), En("graph-source-kind-filter", t.concat(n).map((e) => String(e?.source_kind || "").trim().toLowerCase()), "all provenance"), En("graph-severity-filter", t.concat(n).map((e) => String(q(e, "severity") || "").trim().toLowerCase()), "all severities"), En("graph-pack-filter", t.concat(n).flatMap((e) => _n(e).map((e) => String(e || "").trim().toLowerCase())), "all packs");
}
function An(e) {
	return Ee[String(e?.type || "").trim().toLowerCase()] || "#b4bbdd";
}
function jn(e) {
	return Te[String(e?.source_kind || "observed").trim().toLowerCase()] || Te.observed;
}
function Mn() {
	return !!window.LEGION_OPAQUE_UI_ENABLED || !!document.body?.classList.contains("opaque-ui");
}
function Nn(e) {
	let t = jn(e);
	return String(t?.edgeStroke || t?.stroke || "#687691");
}
function Pn(e) {
	let t = jn(e);
	return Mn() ? String(t?.fillOpaque || "#18182a") : String(t?.fill || "#18182a");
}
function Fn(e) {
	let t = String(e || "").trim().split(/\s+/).filter(Boolean);
	if (!t.length) return ["unknown"];
	let n = [], r = "";
	return t.forEach((e) => {
		let t = r ? `${r} ${e}` : e;
		t.length <= 18 || !r ? r = t : (n.push(r), r = e);
	}), r && n.push(r), n.slice(0, 2);
}
function In(e, t = {}, n = "") {
	let r = document.createElementNS("http://www.w3.org/2000/svg", e);
	return Object.entries(t).forEach(([e, t]) => {
		t != null && t !== "" && r.setAttribute(e, String(t));
	}), n && (r.textContent = n), r;
}
function Ln(e, t) {
	let n = e.getBoundingClientRect(), r = e.viewBox.baseVal, i = n.width > 0 ? r.width / n.width : 1, a = n.height > 0 ? r.height / n.height : 1;
	return {
		x: r.x + (t.clientX - n.left) * i,
		y: r.y + (t.clientY - n.top) * a
	};
}
// ../app/web/static/js/workspace/host_scope.js
function Rn(e) {
	let t = parseInt(e, 10);
	if (!Number.isFinite(t) || t <= 0) return "";
	let n = (k.hosts || []).find((e) => String(e?.id || "") === String(t));
	return n ? String(n.hostname || n.ip || `host ${n.id || t}`).trim() : "";
}
function zn(e, t = "") {
	let n = parseInt(e, 10), r = Number.isFinite(n) && n > 0 ? n : 0, i = r ? String(t || Rn(r) || `host ${r}`).trim() : "", a = parseInt(k.servicesHostFilterId, 10), o = String(k.servicesHostFilterLabel || "").trim();
	return k.servicesHostFilterId = r, k.servicesHostFilterLabel = i, String(a || 0) !== String(r || 0) || o !== i;
}
// ../app/web/static/js/workspace/host_filters.js
var Bn, Vn, Hn, Un, Wn, Gn, Kn;
function qn(e) {
	for (let t of [
		"closeRibbonMenus",
		"graphLoadSnapshot",
		"loadHostDetail",
		"loadWorkspaceHosts",
		"loadWorkspaceServices",
		"renderHosts",
		"renderServices"
	]) if (typeof e[t] != "function") throw TypeError(`Missing host_filters callback: ${t}`);
	({closeRibbonMenus: Bn, graphLoadSnapshot: Vn, loadHostDetail: Hn, loadWorkspaceHosts: Un, loadWorkspaceServices: Wn, renderHosts: Gn, renderServices: Kn} = e);
}
function Jn(e) {
	if (!Array.isArray(e)) return [];
	let t = /* @__PURE__ */ new Set(), n = [];
	return e.forEach((e) => {
		let r = String(typeof e == "string" ? e : e?.name || "").trim();
		if (!r) return;
		let i = r.toLowerCase();
		t.has(i) || (t.add(i), n.push(r));
	}), n;
}
function Yn(e) {
	let t = Array.isArray(e) ? e : String(e || "").split(","), n = /* @__PURE__ */ new Set(), r = [];
	return t.forEach((e) => {
		let t = String(e || "").trim(), i = t.toLowerCase();
		t && !n.has(i) && (n.add(i), r.push(t));
	}), r;
}
function Xn() {
	let e = Yn(k.hostServiceFilters || []);
	return e.length ? e : Yn(k.hostServiceFilter || "");
}
function Zn() {
	return Xn().join(", ");
}
function Qn(e, t, n = "No categories") {
	let r = typeof e == "string" ? document.getElementById(e) : e;
	if (!r) return;
	let i = Jn(t);
	if (r.innerHTML = "", !i.length) {
		let e = document.createElement("span");
		e.className = "category-chip category-chip-empty", e.textContent = n, r.appendChild(e);
	} else i.forEach((e) => {
		let t = document.createElement("span");
		t.className = "category-chip", t.textContent = e, r.appendChild(t);
	});
}
function $n(e) {
	let t = document.createElement("td");
	return t.className = "category-cell", Qn(t, e, "Uncategorized"), t.title = Jn(e).join(", "), t;
}
function er() {
	let e = /* @__PURE__ */ new Set(), t = [];
	return (k.hosts || []).forEach((n) => {
		Jn(n?.categories || []).forEach((n) => {
			let r = n.toLowerCase();
			e.has(r) || (e.add(r), t.push(n));
		});
	}), t.sort((e, t) => e.localeCompare(t)), t;
}
function tr() {
	let e = er();
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
function nr() {
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
	}), Xn().forEach((e) => t(e, 0));
	let r = Array.from(e.values());
	return r.sort((e, t) => e.service.localeCompare(t.service)), r;
}
function rr() {
	let e = document.getElementById("hosts-service-filter-list"), t = document.getElementById("hosts-service-filter-button"), n = document.getElementById("hosts-service-filter-clear-button"), r = Xn(), i = new Set(r.map((e) => e.toLowerCase())), a = Zn();
	if (t && (t.textContent = r.length ? `Services (${r.length})` : "Services", t.classList.toggle("is-active", r.length > 0), t.title = r.length ? `Host service filters: ${a}` : "Filter hosts by open service", t.setAttribute("aria-label", t.title)), n && (n.disabled = r.length === 0), !e) return;
	let o = nr();
	if (e.innerHTML = "", !o.length) {
		let t = document.createElement("p");
		t.className = "meta-note", t.textContent = "No open services available.", e.appendChild(t);
	} else o.forEach((t) => {
		let n = document.createElement("label");
		n.className = "panel-filter-option";
		let r = document.createElement("input");
		r.type = "checkbox", r.value = t.service, r.checked = i.has(String(t.service || "").toLowerCase()), r.addEventListener("change", async () => {
			let e = Xn(), n = String(t.service || "").trim().toLowerCase(), i = e.some((e) => e.toLowerCase() === n);
			await dr(r.checked && !i ? e.concat([t.service]) : e.filter((e) => e.toLowerCase() !== n));
		});
		let a = document.createElement("span");
		a.className = "panel-filter-option-name", a.textContent = t.service, n.appendChild(r), n.appendChild(a);
		let o = document.createElement("span"), s = Number(t.host_count || 0);
		o.className = "panel-filter-option-count", o.textContent = String(Number.isFinite(s) ? s : 0), n.appendChild(o), e.appendChild(n);
	});
}
function ir(e) {
	let t = document.getElementById("hosts-service-filter-popover"), n = document.getElementById("hosts-service-filter-button"), r = !!e;
	t && (t.hidden = !r), n && n.setAttribute("aria-expanded", r ? "true" : "false"), r && rr();
}
function ar() {
	let e = new URLSearchParams(), t = String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down";
	e.set("filter", t), Xn().forEach((t) => {
		e.append("service", t);
	});
	let n = String(k.hostCategoryFilter || "").trim();
	return n && e.set("category", n), e.toString();
}
function or() {
	let e = new URLSearchParams(), t = parseInt(k.servicesHostFilterId, 10);
	Number.isFinite(t) && t > 0 && e.set("host_id", String(t));
	let n = String(k.servicesCategoryFilter || "").trim();
	return n && e.set("category", n), e.toString();
}
function sr() {
	let e = document.getElementById("hosts-filter-show-all-button"), t = document.getElementById("hosts-filter-hide-down-button"), n = document.getElementById("hosts-reset-filter-button"), r = String(k.hostFilter || "hide_down").trim().toLowerCase(), i = Zn(), a = String(k.hostCategoryFilter || "").trim(), o = String(k.servicesCategoryFilter || "").trim();
	I("hosts-category-filter-select", a), I("services-category-filter-select", o);
	let s = parseInt(k.servicesHostFilterId, 10), c = String(k.servicesHostFilterLabel || "").trim();
	if (e && e.classList.toggle("is-active", r === "show_all"), t && t.classList.toggle("is-active", r !== "show_all"), n) {
		let e = r === "hide_down" && !i && !a && (!Number.isFinite(s) || s <= 0);
		n.disabled = e, n.classList.toggle("is-active", !e);
		let t = "Reset host filters (show only up hosts)";
		i && a && c ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear category filter: ${a}, clear services filter: ${c})` : i && c ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear services filter: ${c})` : i && a ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear category filter: ${a})` : i ? t = `Reset host filters (show only up hosts, clear service filter: ${i})` : a ? t = `Reset host filters (show only up hosts, clear category filter: ${a})` : c && (t = `Reset host filters (show only up hosts, clear services filter: ${c})`), n.setAttribute("title", t), n.setAttribute("aria-label", t);
	}
}
async function cr(e) {
	k.hostFilter = String(e || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down", sr(), Bn(), await Un(), await Vn({ background: !1 }).catch(() => {});
}
async function lr(e) {
	k.hostCategoryFilter = String(e || "").trim(), sr(), Gn(k.hosts), await Promise.all([Un(), Wn()]), await Vn({ background: !1 }).catch(() => {});
}
async function ur(e) {
	let t = String(e || "").trim(), n = Xn(), r = n.map((e) => e.toLowerCase());
	t && n.length === 1 && r[0] === t.toLowerCase() ? await dr([]) : await dr(t ? [t] : []);
}
async function dr(e) {
	k.hostServiceFilters = Yn(e), k.hostServiceFilter = k.hostServiceFilters.join(","), sr(), rr(), Gn(k.hosts), Kn(k.services), await Promise.all([Un(), Wn()]), await Vn({ background: !1 }).catch(() => {});
}
async function fr(e) {
	k.servicesCategoryFilter = String(e || "").trim(), sr(), Kn(k.services), await Wn();
}
async function pr(e, t = "") {
	let n = parseInt(e, 10), r = parseInt(k.servicesHostFilterId, 10);
	Number.isFinite(n) && n > 0 && n === r ? zn(0) : Number.isFinite(n) && n > 0 ? (k.selectedHostId = n, zn(n, t)) : zn(0), sr(), Gn(k.hosts), await Promise.all([k.selectedHostId ? Hn(k.selectedHostId) : Promise.resolve(), Wn()]);
}
async function mr() {
	k.hostFilter = "hide_down", k.hostServiceFilter = "", k.hostServiceFilters = [], k.hostCategoryFilter = "", k.servicesHostFilterId = 0, k.servicesHostFilterLabel = "", k.servicesCategoryFilter = "", sr(), Gn(k.hosts), Kn(k.services), Bn(), await Promise.all([Un(), Wn()]), await Vn({ background: !1 }).catch(() => {});
}
// ../app/web/static/js/workspace/host_detail.js
function hr(e) {
	k.hostDetail = e || null;
	let t = e?.host || {}, n = e?.ports || [], r = e?.screenshots || [], i = e?.ai_analysis || {}, a = e?.target_state || {}, o = Array.isArray(i?.technologies) ? i.technologies : [], s = Array.isArray(i?.manual_tests) ? i.manual_tests : [], c = i?.host_updates || {}, l = Array.isArray(a?.attempted_actions) ? a.attempted_actions : [], u = Array.isArray(a?.coverage_gaps) ? a.coverage_gaps : [], d = Array.isArray(a?.urls) ? a.urls : [], f = Array.isArray(a?.credentials) ? a.credentials : [], p = Array.isArray(a?.sessions) ? a.sessions : [], m = Array.isArray(a?.device_categories) ? a.device_categories : [], h = Array.isArray(a?.manual_device_categories) ? a.manual_device_categories : [], g = !!a?.device_category_override;
	F("host-detail-name", t.ip ? `${t.ip} (${t.hostname || "no-hostname"})` : ""), I("workspace-note", e?.note || ""), I("workspace-tool-host-ip", t.ip || ""), I("workspace-host-categories", Jn(h).join(", ")), L("workspace-host-categories-override", g);
	let _ = document.getElementById("host-detail-ports");
	if (_) {
		_.innerHTML = "";
		let e = /* @__PURE__ */ new Map();
		r.forEach((t) => {
			let n = String(t?.port || "");
			n && (e.has(n) || e.set(n, []), e.get(n).push(t));
		}), n.forEach((t) => {
			let n = document.createElement("tr");
			n.appendChild(B(t.port || "")), n.appendChild(B(t.protocol || "")), n.appendChild(B(t.state || "")), n.appendChild(B(t.service?.name || "")), n.appendChild(B(`${t.service?.product || ""} ${t.service?.version || ""}`.trim())), n.appendChild(B(it(t)));
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
			t.appendChild(B(e.id || "")), t.appendChild(B(e.script_id || "")), t.appendChild(B(e.display_output || (e.output || "").slice(0, 140)));
			let n = document.createElement("td"), r = document.createElement("button");
			r.type = "button", r.textContent = "View", r.dataset.scriptViewId = String(e.id || ""), n.appendChild(r);
			let i = document.createElement("button");
			i.type = "button", i.textContent = "Delete", i.dataset.scriptDeleteId = String(e.id || ""), n.appendChild(i), t.appendChild(n), v.appendChild(t);
		});
	}));
	let y = document.getElementById("host-detail-ai-technologies");
	y && (y.innerHTML = "", o.forEach((e) => {
		let t = document.createElement("tr");
		t.appendChild(B(e.name || "")), t.appendChild(B(e.version || "")), t.appendChild(B(e.cpe || "")), t.appendChild(B(e.evidence || "")), y.appendChild(t);
	}));
	let b = document.getElementById("host-detail-ai-manual-tests");
	b && (b.innerHTML = "", s.forEach((e) => {
		let t = document.createElement("tr");
		t.appendChild(B(e.why || "")), t.appendChild(B(e.command || "")), t.appendChild(B(e.scope_note || "")), b.appendChild(t);
	}));
	let x = [];
	i?.provider && x.push(`provider: ${i.provider}`), i?.updated_at && x.push(`updated: ${i.updated_at}`), i?.next_phase && x.push(`next phase: ${i.next_phase}`), c?.hostname && x.push(`hostname: ${c.hostname}`), c?.os && x.push(`os: ${c.os}`), l.length > 0 && x.push(`attempted: ${l.length}`), u.length > 0 && x.push(`coverage gaps: ${u.length}`), d.length > 0 && x.push(`urls: ${d.length}`), f.length > 0 && x.push(`credentials: ${f.length}`), p.length > 0 && x.push(`sessions: ${p.length}`), F("host-ai-analysis-status", x.join(" | ")), F("host-ai-tech-count", o.length), F("host-ai-manual-count", s.length), Qn("host-detail-categories", m, "Uncategorized"), F("host-device-category-count", Jn(m).length), g ? F("host-detail-category-note", "Manual categories replace automatic classification for this host.") : Jn(h).length > 0 ? F("host-detail-category-note", "Manual categories are additive for this host.") : F("host-detail-category-note", "");
	let S = document.getElementById("host-detail-screenshots");
	S && (S.innerHTML = "", r.forEach((e) => {
		let t = document.createElement("a");
		t.href = e.url || "#", t.target = "_blank", t.rel = "noopener noreferrer", t.textContent = `${e.filename || "screenshot"} ${e.port ? `(${e.port})` : ""}`, S.appendChild(t);
	})), F("host-screenshot-count", r.length);
}
// ../app/web/static/js/workspace/invalidation_waiters.js
function gr(e, t = 5e3) {
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
function _r(e) {
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
async function vr({ service: e = "", port: t = "", protocol: n = "tcp", limit: r = 500, offset: i = 0 } = {}) {
	let a = new URLSearchParams();
	return a.set("limit", String(r)), a.set("offset", String(i)), e && a.set("service", String(e)), t && a.set("port", String(t)), n && a.set("protocol", String(n)), Xe(`/api/workspace/tools?${a.toString()}`);
}
async function yr({ service: e = "", port: t = "", protocol: n = "tcp" } = {}) {
	let r = [], i = 0, a = 0;
	for (; a < 200;) {
		let o = await vr({
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
var br, xr, Sr, Cr;
function wr(e) {
	for (let t of [
		"graphLoadSnapshot",
		"renderHosts",
		"renderServices",
		"renderTools"
	]) if (typeof e[t] != "function") throw TypeError(`Missing workspace_data callback: ${t}`);
	({graphLoadSnapshot: br, renderHosts: xr, renderServices: Sr, renderTools: Cr} = e);
}
function Tr(e) {
	return new Promise((t) => {
		window.setTimeout(t, Math.max(0, Number(e) || 0));
	});
}
async function Er(e, t = 12e4, n = 1200) {
	let r = Number(e);
	if (!Number.isFinite(r) || r <= 0) throw Error("Invalid job id.");
	let i = Date.now();
	for (; Date.now() - i < t;) {
		let e = await Xe(`/api/jobs/${r}`), a = String(e.status || "").toLowerCase();
		if (a === "completed") return e;
		if (a === "failed") throw Error(String(e.error || "Save job failed."));
		if (window.LEGION_WS_ENABLED) {
			let e = t - (Date.now() - i);
			if (e <= 0) break;
			try {
				await gr(["jobs"], Math.min(Math.max(e, 1), 3e4));
			} catch {
				await Tr(n);
			}
		} else await Tr(n);
	}
	throw Error("Timed out waiting for job completion.");
}
async function Dr() {
	let e = ar(), t = or(), n = await Xe(`/api/workspace/hosts?${e}`);
	if (e !== ar()) return;
	n && n.filter && (k.hostFilter = String(n.filter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down"), sr(), Sr(k.services), xr(n.hosts || []);
	let r = parseInt(k.servicesHostFilterId, 10), i = (Array.isArray(n.hosts) ? n.hosts : []).some((e) => String(e?.id || "") === String(r || ""));
	Number.isFinite(r) && r > 0 && !i && (zn(k.selectedHostId), sr(), xr(k.hosts)), t !== or() && await Or();
}
async function Or() {
	let e = or(), t = await Xe(`/api/workspace/services${e ? `?${e}` : ""}`);
	if (e !== or()) return;
	let n = parseInt(t?.host_id, 10);
	(!Number.isFinite(n) || n <= 0) && (k.servicesHostFilterId = 0, k.servicesHostFilterLabel = ""), k.servicesCategoryFilter = String(t?.category || "").trim(), sr(), Sr(t.services || []);
}
async function kr({ service: e = "", force: t = !1 } = {}) {
	if (!k.toolsLoading || t) {
		k.toolsLoading = !0;
		try {
			let t = await yr({ service: e });
			k.toolsHydrated = !0, Cr(t);
		} finally {
			k.toolsLoading = !1;
		}
	}
}
async function Ar(e) {
	e && hr(await Xe(`/api/workspace/hosts/${e}`));
}
async function jr() {
	H("Refreshing workspace...");
	try {
		await Promise.all([
			Dr(),
			Or(),
			kr()
		]), k.selectedHostId && await Ar(k.selectedHostId);
		try {
			await br({ background: !0 });
		} catch {}
		H("Workspace refreshed");
	} catch (e) {
		H(`Workspace refresh failed: ${e.message}`, !0);
	}
}
async function Mr() {
	let e = k.selectedHostId;
	if (!e) {
		H("No host selected", !0);
		return;
	}
	let t = z("workspace-note");
	try {
		await W(`/api/workspace/hosts/${e}/note`, { text: t }), H("Note saved");
	} catch (e) {
		H(`Save note failed: ${e.message}`, !0);
	}
}
function Nr(e) {
	return Array.from(new Set(String(e || "").split(",").map((e) => String(e || "").trim()).filter(Boolean)));
}
async function Pr() {
	let e = k.selectedHostId;
	if (!e) H("No host selected", !0);
	else try {
		await W(`/api/workspace/hosts/${e}/categories`, {
			manual_categories: Nr(z("workspace-host-categories")),
			override_auto: R("workspace-host-categories-override")
		}), H("Categories saved"), await Promise.all([
			Dr(),
			Or(),
			Ar(e)
		]), await br({ background: !1 }).catch(() => {});
	} catch (e) {
		H(`Save categories failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/device_categories.js
var Fr;
function Ir(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing device_categories callback: ${t}`);
	({applySchedulerPreferences: Fr} = e);
}
function Lr(e, t = !1) {
	let n = document.getElementById("device-category-save-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function Rr(e = {}) {
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
			e && e.appendChild(Rr({}));
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
function zr() {
	Qn("device-category-builtins-list", (k.builtInDeviceCategories || []).map((e) => e?.name || ""), "No built-in categories");
	let e = document.getElementById("device-category-rules-body");
	if (!e) return;
	e.innerHTML = "";
	let t = Array.isArray(k.deviceCategoryRules) ? k.deviceCategoryRules : [];
	t.length ? t.forEach((t) => {
		e.appendChild(Rr(t));
	}) : e.appendChild(Rr({}));
}
function Br() {
	return Array.from(document.querySelectorAll("#device-category-rules-body tr")).map((e) => {
		let t = (t) => {
			let n = e.querySelector(`[data-device-category-field="${t}"]`);
			return n ? String(n.value || "").trim() : "";
		};
		return {
			name: t("name"),
			ports: Nr(t("ports")),
			fingerprint_fragments: Nr(t("fingerprint_fragments")),
			cpe: Nr(t("cpe"))
		};
	}).filter((e) => e.name);
}
async function Vr() {
	Lr("Saving...");
	try {
		let e = await W("/api/scheduler/preferences", { device_categories: Br() });
		Fr(e), Lr("Saved");
	} catch (e) {
		Lr(`Save failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/engagement_policy.js
function Hr(e) {
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
function Ur(e, t) {
	let n = Wr(t), r = e && typeof e == "object" ? e : {}, i = Hr(r.preset || n);
	return {
		...i,
		...r,
		custom_overrides: r.custom_overrides && typeof r.custom_overrides == "object" ? r.custom_overrides : {},
		legacy_goal_profile: r.legacy_goal_profile || Gr({
			...i,
			...r
		})
	};
}
function Wr(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "external_pentest" ? "external_pentest" : t === "internal_pentest" ? "internal_pentest" : t === "external_recon" ? "external_recon" : "internal_recon";
}
function Gr(e) {
	let t = String(e?.preset || "").trim().toLowerCase();
	return t === "external_recon" || t === "external_pentest" ? "external_pentest" : "internal_asset_discovery";
}
function Kr(e, t) {
	return t ? "Custom lets you override scope and intent manually. Use the standard presets unless you need a non-standard combination." : {
		external_recon: "Low-noise external mapping focused on discovery, fingerprinting, and bounded validation.",
		external_pentest: "Broader external follow-up once recon shows a target is worth deeper assessment.",
		internal_quick_recon: "Fast internal low-hanging-fruit sweep focused on SMB, NetBIOS, NFS, printers, common admin panels, and other obvious exposure points.",
		internal_recon: "Broader internal discovery and validation across exposed services without moving into pentest depth.",
		internal_pentest: "Deeper internal assessment with wider follow-up and higher-noise exploration."
	}[String(e || "").trim().toLowerCase()] || "Preset drives scope and intent for most runs. Switch to custom only if you need a manual override.";
}
// ../app/web/static/js/workspace/scan_policy.js
var qr, Jr, Yr, Xr, Zr;
function Qr(e) {
	for (let t of [
		"applyNmapModeTargetDefaults",
		"refreshNmapModeOptions",
		"refreshNmapScanButtonState",
		"setNmapWizardStep",
		"updateNmapCommandPreview"
	]) if (typeof e[t] != "function") throw TypeError(`Missing scan_policy callback: ${t}`);
	({applyNmapModeTargetDefaults: qr, refreshNmapModeOptions: Jr, refreshNmapScanButtonState: Yr, setNmapWizardStep: Xr, updateNmapCommandPreview: Zr} = e);
}
function $r() {
	return String(z("scheduler-goal-select") || "internal_recon").trim().toLowerCase();
}
function ei() {
	return String(z("nmap-engagement-preset-select") || "").trim().toLowerCase() || $r();
}
function ti(e = "") {
	return String(e || "").trim().toLowerCase() === "internal_quick_recon";
}
function ni(e = "") {
	let t = ii(e, { fallbackGoalProfile: z("scheduler-goal-select") || "internal_recon" });
	return String(t.scope || "").trim().toLowerCase() === "internal";
}
function ri() {
	let e = parseInt(z("passive-capture-duration"), 10);
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
function ii(e, t = {}) {
	let n = String(e || "internal_recon").trim().toLowerCase();
	if (n !== "custom") return Ur(Hr(n), n);
	let r = String(t.fallbackGoalProfile || z("scheduler-goal-select") || "internal_recon");
	return Ur({
		preset: "custom",
		scope: z("engagement-scope-select") || "internal",
		intent: z("engagement-intent-select") || "recon",
		allow_exploitation: R("engagement-allow-exploitation"),
		allow_lateral_movement: R("engagement-allow-lateral"),
		credential_attack_mode: z("engagement-credential-mode"),
		lockout_risk_mode: z("engagement-lockout-mode"),
		stability_risk_mode: z("engagement-stability-mode"),
		detection_risk_mode: z("engagement-detection-mode"),
		approval_mode: z("engagement-approval-mode"),
		runner_preference: z("engagement-runner-preference"),
		noise_budget: z("engagement-noise-budget"),
		custom_overrides: {}
	}, r);
}
function ai() {
	let e = ei(), t = e === "custom", n = ii(e, { fallbackGoalProfile: z("scheduler-goal-select") || "internal_recon" });
	F("nmap-engagement-derived-scope", n.scope || "internal"), F("nmap-engagement-derived-intent", n.intent || "recon");
	let r = document.getElementById("nmap-engagement-preset-summary");
	r && (r.textContent = Kr(e, t));
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
function oi(e = {}) {
	let t = document.getElementById("passive-capture-interface"), n = document.getElementById("passive-capture-interface-note");
	if (!t) return;
	let r = Array.isArray(e.interfaces) ? e.interfaces : [], i = String(e.default_interface || "").trim(), a = String(t.value || "").trim();
	if (t.innerHTML = "", !r.length) {
		let e = document.createElement("option");
		e.value = "", e.textContent = "No capture-ready interfaces found", t.appendChild(e), t.value = "", n && (n.textContent = "Passive capture needs an active non-loopback IPv4 interface."), Zr();
	} else {
		if (r.forEach((e) => {
			let n = document.createElement("option");
			n.value = String(e.name || "").trim(), n.textContent = String(e.label || e.name || "").trim(), n.dataset.networks = Array.isArray(e.ipv4_networks) ? e.ipv4_networks.join(", ") : "", t.appendChild(n);
		}), t.value = a && r.some((e) => String(e.name || "").trim() === a) ? a : i && r.some((e) => String(e.name || "").trim() === i) ? i : String(r[0].name || "").trim(), n) {
			let e = t.options[t.selectedIndex], r = String(e?.dataset?.networks || "").trim();
			n.textContent = r ? `Connected networks: ${r}` : "Passive capture will watch discovery traffic on the selected interface.";
		}
		Zr();
	}
}
async function si() {
	if (document.getElementById("passive-capture-interface")) try {
		let e = await Xe("/api/network/interfaces");
		Ne.captureInterfacesLoaded = !0, oi(e || {});
	} catch {
		Ne.captureInterfacesLoaded = !1, oi({
			interfaces: [],
			default_interface: ""
		});
	}
}
function ci({ scrollIntoView: e = !1, focusPreset: t = !1, focusTargets: n = !1 } = {}) {
	let r = document.getElementById("nmap-scan-block");
	e && r && r.scrollIntoView({
		behavior: "smooth",
		block: "start"
	}), Ne.postSubmitLock = !0, Ne.lastMode = "", Ne.lastEngagementPreset = "", Ne.captureInterfacesLoaded = !1, I("nmap-targets", ""), L("nmap-run-actions", !0), I("passive-capture-duration", "15"), oi({
		interfaces: [],
		default_interface: ""
	});
	let i = document.querySelector("input[name='nmap-scan-mode'][value='easy']");
	i && (i.checked = !0), I("nmap-engagement-preset-select", z("scheduler-goal-select") || "internal_recon"), ai(), qr("easy"), Xr(1), Jr(), Yr(), si().catch(() => {});
	let a = t ? "nmap-engagement-preset-select" : n ? "nmap-targets" : "";
	if (a) {
		let e = document.getElementById(a);
		e && window.setTimeout(() => {
			e.focus();
		}, 220);
	}
}
// ../app/web/static/js/workspace/dialogs.js
var li, ui;
function di(e) {
	for (let t of ["openManualToolPicker", "pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing dialogs callback: ${t}`);
	({openManualToolPicker: li, pollSnapshot: ui} = e);
}
function fi(e) {
	let t = document.getElementById("nmap-scan-modal");
	t && (P.nmapScanOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function pi(e) {
	let t = document.getElementById("manual-scan-modal");
	t && (P.manualScanOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function mi(e) {
	let t = document.getElementById("host-selection-modal");
	t && (P.hostSelectionOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function hi(e) {
	let t = document.getElementById("script-cve-modal");
	t && (P.scriptCveOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function gi(e) {
	let t = document.getElementById("provider-logs-modal");
	t && (P.providerLogsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function _i(e) {
	let t = document.getElementById("jobs-modal");
	t && (P.jobsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function vi(e) {
	let t = document.getElementById("submitted-scans-modal");
	t && (P.submittedScansOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function yi(e) {
	let t = document.getElementById("scheduler-decisions-modal");
	t && (P.schedulerDecisionsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function bi(e) {
	let t = document.getElementById("host-remove-modal");
	t && (P.hostRemoveOpen = !!e, Me.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function xi(e) {
	let t = document.getElementById("graph-note-modal");
	t && (P.graphNoteOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re(), e && window.requestAnimationFrame(() => {
		let e = document.getElementById("graph-note-input");
		e && (e.focus(), e.setSelectionRange(e.value.length, e.value.length));
	}));
}
function Si() {
	fi(!1);
}
function Ci() {
	k.manualToolTargets = [];
	let e = document.getElementById("workspace-tool-target-wrapper"), t = document.getElementById("workspace-tool-target-select");
	e && (e.hidden = !0), t && (t.innerHTML = ""), F("workspace-tool-context", ""), pi(!1);
}
function wi() {
	pi(!1);
}
function Ti() {
	mi(!1);
}
function Ei() {
	hi(!1);
}
function Di() {
	gi(!1);
}
function Oi() {
	_i(!1);
}
function ki() {
	vi(!1);
}
function Ai() {
	yi(!1);
}
function ji(e = !0) {
	bi(!1), e && (Me.hostId = null, Me.hostIp = "", Me.hostName = "", F("host-remove-modal-target", ""));
}
function Mi(e = !1) {
	xi(!1), e && I("graph-note-input", "");
}
function Ni() {
	qi(), fi(!0), ci({
		scrollIntoView: !1,
		focusPreset: !0
	});
}
function Pi() {
	li({});
}
function Fi() {
	qi(), mi(!0);
}
function Ii() {
	qi(), hi(!0);
}
async function Li() {
	qi(), gi(!0), await Ut();
}
async function Ri() {
	qi(), _i(!0), await ui();
}
async function zi() {
	qi(), vi(!0), await ui();
}
async function Bi() {
	qi(), yi(!0), await ui();
}
function Vi(e) {
	let t = parseInt(e, 10);
	if (!t) return;
	let n = k.hosts.find((e) => parseInt(e.id, 10) === t);
	Me.hostId = t, Me.hostIp = String(n?.ip || ""), Me.hostName = String(n?.hostname || ""), F("host-remove-modal-target", (Me.hostName ? `${Me.hostIp} (${Me.hostName})` : Me.hostIp) || `Host ID ${t}`), bi(!0);
}
function Hi(e) {
	let t = document.getElementById("scheduler-settings-modal");
	t && (P.schedulerOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Ui(e) {
	let t = document.getElementById("device-category-settings-modal");
	t && (P.deviceCategorySettingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Wi(e) {
	let t = document.getElementById("report-provider-modal");
	t && (P.reportProviderOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Gi(e) {
	let t = document.getElementById("app-settings-modal");
	t && (P.settingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Ki(e, t) {
	let n = t ? String(e || "").trim() : "";
	Fe.openMenuId = n || null, document.querySelectorAll(".ribbon-menu[data-ribbon-menu]").forEach((e) => {
		let t = String(e.dataset.ribbonMenu || ""), r = n && t === n;
		e.classList.toggle("is-open", !!r);
		let i = e.querySelector("[data-ribbon-menu-toggle]");
		i && i.setAttribute("aria-expanded", r ? "true" : "false");
	});
}
function qi() {
	Ki("", !1), ir(!1);
}
function Ji(e) {
	let t = String(e || "").trim();
	t ? Ki(t, Fe.openMenuId !== t) : qi();
}
function Yi() {
	qi(), Hi(!0);
}
function Xi() {
	Hi(!1);
}
function J() {
	qi(), Lr("Idle"), zr(), Ui(!0);
}
function Zi() {
	Ui(!1);
}
function Qi() {
	qi(), Wi(!0);
}
function $i() {
	Wi(!1);
}
// ../app/web/static/js/workspace/graph_viewport.js
function ea(e) {
	return (A.filtered.groups || []).find((t) => String(t?.key || "") === String(e || "")) || null;
}
function ta(e) {
	if (!e || q(e, "summary_kind")) return 0;
	let t = parseInt(q(e, "host_id"), 10);
	if (Number.isFinite(t) && t > 0) return t;
	let n = String(e?.label || "").trim().toLowerCase(), r = String(q(e, "hostname") || "").trim().toLowerCase(), i = String(q(e, "ip") || "").trim(), a = (k.hosts || []).find((e) => n && String(e?.hostname || "").trim().toLowerCase() === n || r && String(e?.hostname || "").trim().toLowerCase() === r || i && String(e?.ip || "").trim() === i), o = parseInt(a?.id, 10);
	return Number.isFinite(o) && o > 0 ? o : 0;
}
function na(e) {
	let t = parseInt(k.selectedHostId, 10);
	return !Number.isFinite(t) || t <= 0 || String(e?.type || "").trim().toLowerCase() !== "host" ? !1 : ta(e) === t;
}
function ra() {
	return Math.max(10, Math.min(400, Number(A.zoomPercent || 100)));
}
function ia(e, t, n, r) {
	let i = Math.max(1, Number(e || 1)), a = Math.max(1, Number(t || 1)), o = Math.max(1, Number(n || 1)) / Math.max(1, Number(r || 1));
	return i / a >= o ? {
		width: i,
		height: i / o
	} : {
		width: a * o,
		height: a
	};
}
function aa(e, t, n, r, i, a) {
	let o = Math.max(1, Number(n || 1)), s = Math.max(1, Number(r || 1)), c = Math.max(1, Number(i || 1)), l = Math.max(1, Number(a || 1)), u = Number(e || 0), d = Number(t || 0);
	return u = c >= o ? o / 2 : Math.max(c / 2, Math.min(o - c / 2, u)), d = l >= s ? s / 2 : Math.max(l / 2, Math.min(s - l / 2, d)), {
		x: u,
		y: d
	};
}
function oa(e, t) {
	let n = A.filtered, r = (n.groups || []).map((e) => ({
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
function sa(e, t) {
	let n = document.getElementById("graph-workspace-canvas"), r = tn();
	if (!n || !r) return A.viewport = null, null;
	let i = Math.max(1, Number(r.clientWidth || r.getBoundingClientRect().width || 1)), a = Math.max(1, Number(r.clientHeight || r.getBoundingClientRect().height || 1)), o = oa(e, t), s = ia(o.width, o.height, i, a), c = Math.max(1, i / (s.width * 1.25), a / (s.height * 1.25));
	s.width *= c, s.height *= c;
	let l = ra() / 100, u = Math.max(1, s.width / l), d = Math.max(1, s.height / l), f = A.viewport || {}, p = o.x + o.width / 2, m = o.y + o.height / 2, h = aa((Number.isFinite(Number(f.centerX)) ? Number(f.centerX) : p) - o.x, (Number.isFinite(Number(f.centerY)) ? Number(f.centerY) : m) - o.y, o.width, o.height, u, d);
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
function ca() {
	return ra() >= 55;
}
function la(e = {}) {
	return e.isSelected || e.isHostSelected || e.isSummaryNode ? !0 : ra() >= 60;
}
function ua(e = {}) {
	return e.isSelected || e.isHostSelected || e.isSummaryNode ? !0 : ra() >= 78;
}
// ../app/web/static/js/workspace/host_actions.js
var da;
function fa(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing host_actions callback: ${t}`);
	({pollSnapshot: da} = e);
}
function pa(e = "Run supported tool") {
	let t = document.createElement("button");
	return t.type = "button", t.className = "icon-btn", t.title = e, t.setAttribute("aria-label", e), t.innerHTML = "<i class=\"fa-solid fa-screwdriver-wrench\" aria-hidden=\"true\"></i>", t;
}
function ma(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = "icon-btn", n.dataset.hostAction = String(e || ""), n.dataset.hostId = String(t || ""), e === "rescan" ? (n.title = "Rescan", n.setAttribute("aria-label", "Rescan"), n.innerHTML = "<i class=\"fa-solid fa-rotate-right\" aria-hidden=\"true\"></i>", n) : e === "refresh-screenshots" ? (n.title = "Refresh screenshots", n.setAttribute("aria-label", "Refresh screenshots"), n.innerHTML = "<i class=\"fa-solid fa-camera-retro\" aria-hidden=\"true\"></i>", n) : e === "dig-deeper" ? (n.title = "Dig Deeper", n.setAttribute("aria-label", "Dig Deeper"), n.innerHTML = "<i class=\"fa-solid fa-brain\" aria-hidden=\"true\"></i>", n) : (e === "remove" && (n.classList.add("icon-btn-danger"), n.title = "Remove host", n.setAttribute("aria-label", "Remove host"), n.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>"), n);
}
function ha(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = "icon-btn", n.dataset.subnetAction = String(e || ""), n.dataset.subnet = String(t || ""), e === "rescan" && (n.title = "Rescan subnet", n.setAttribute("aria-label", "Rescan subnet"), n.innerHTML = "<i class=\"fa-solid fa-rotate-right\" aria-hidden=\"true\"></i>"), n;
}
function ga(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = "icon-btn", n.dataset.screenshotAction = String(e || ""), n.dataset.hostId = String(t?.hostId || ""), n.dataset.port = String(t?.port || ""), n.dataset.protocol = String(t?.protocol || "tcp"), n.dataset.artifactRef = String(t?.artifactRef || ""), n.dataset.filename = String(t?.filename || ""), e === "refresh" ? (n.title = "Re-screenshot", n.setAttribute("aria-label", "Re-screenshot"), n.innerHTML = "<i class=\"fa-solid fa-camera-retro\" aria-hidden=\"true\"></i>", n) : (e === "delete" && (n.classList.add("icon-btn-danger"), n.title = "Delete screenshot", n.setAttribute("aria-label", "Delete screenshot"), n.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>"), n);
}
function _a(e) {
	let t = parseInt(e, 10);
	return !Number.isFinite(t) || t <= 0 ? null : (k.hosts || []).find((e) => parseInt(e?.id, 10) === t) || null;
}
function va(e) {
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
	let o = String(q(a, "service") || "").trim().replace(/\?+$/, "").toLowerCase();
	return {
		serviceName: o,
		serviceLabel: String(a?.label || o || "").trim()
	};
}
function ya(e) {
	if (!e) return null;
	let t = String(e?.type || "").trim().toLowerCase();
	if (!["port", "service"].includes(t)) return null;
	let n = ta(e), r = _a(n), i = String(r?.ip || q(e, "ip") || "").trim(), a = String(q(e, "port") || "").trim(), o = String(q(e, "protocol") || "tcp").trim().toLowerCase() || "tcp";
	if (!n || !i || !a) return null;
	let s = "", c = "";
	if (t === "service") s = String(q(e, "service") || e.label || "").trim().replace(/\?+$/, "").toLowerCase(), c = String(e.label || s || "").trim();
	else {
		let t = va(e);
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
function ba() {
	document.querySelectorAll(".graph-action-menu.is-open").forEach((e) => {
		e.classList.remove("is-open");
		let t = e.querySelector(".panel-menu-button");
		t && t.setAttribute("aria-expanded", "false");
	});
}
async function xa(e, { port: t = "", protocol: n = "tcp" } = {}) {
	let r = String(e || "").trim().toLowerCase(), i = String(t || "").trim(), a = String(n || "tcp").trim().toLowerCase() || "tcp", o = [
		r || "__all__",
		i || "__any_port__",
		a || "tcp"
	].join("|");
	if (Array.isArray(A.toolMenuCache[o])) return A.toolMenuCache[o];
	let s = new URLSearchParams();
	s.set("limit", "500"), r && s.set("service", r), i && s.set("port", i), a && s.set("protocol", a);
	let c = await Xe(`/api/workspace/tools?${s.toString()}`), l = Array.isArray(c?.tools) ? c.tools.filter((e) => !!e?.runnable) : [];
	return A.toolMenuCache[o] = l, l;
}
async function Sa(e, t) {
	if (e && t?.tool_id) try {
		let n = await W("/api/workspace/tools/run", {
			host_ip: e.hostIp,
			port: e.port,
			protocol: e.protocol,
			tool_id: String(t.tool_id || "")
		});
		H(`${t.label || t.tool_id} queued for ${e.hostIp}:${e.port}/${e.protocol} (job ${n?.job?.id || "?"})`), await da();
	} catch (e) {
		H(`Tool launch failed: ${e.message}`, !0);
	}
}
function Ca(e) {
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
		if (ba(), !s || (t.classList.add("is-open"), n.setAttribute("aria-expanded", "true"), a)) return;
		r.innerHTML = "";
		let c = document.createElement("div");
		c.className = "graph-action-menu-status", c.textContent = "Loading actions...", r.appendChild(c);
		try {
			let t = await xa(i, {
				port: e?.port || "",
				protocol: e?.protocol || "tcp"
			});
			if (r.innerHTML = "", t.length) t.forEach((t) => {
				let n = document.createElement("button");
				n.type = "button", n.className = "ribbon-submenu-item", n.textContent = String(t.label || t.tool_id || "tool"), n.title = String(t.command_template || t.tool_id || ""), n.addEventListener("click", async (n) => {
					n.preventDefault(), n.stopPropagation(), ba(), await Sa(e, t);
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
async function wa(e) {
	let t = parseInt(e?.dataset?.hostId, 10), n = String(e?.dataset?.hostAction || "");
	return t ? n === "rescan" ? (await ka(t), !0) : n === "refresh-screenshots" ? (await Ma(t), !0) : n === "dig-deeper" ? (await ja(t), !0) : n === "remove" && (Vi(t), !0) : !0;
}
async function Ta(e) {
	let t = String(e?.dataset?.subnet || "").trim(), n = String(e?.dataset?.subnetAction || "");
	return !t || n === "rescan" && (await Aa(t), !0);
}
async function Ea(e) {
	let t = parseInt(e?.dataset?.hostId, 10), n = String(e?.dataset?.screenshotAction || ""), r = String(e?.dataset?.port || "").trim(), i = String(e?.dataset?.protocol || "tcp").trim().toLowerCase() || "tcp", a = String(e?.dataset?.artifactRef || "").trim(), o = String(e?.dataset?.filename || "").trim();
	return t ? n === "refresh" ? (await Na({
		hostId: t,
		port: r,
		protocol: i
	}), !0) : n === "delete" && (await Pa({
		hostId: t,
		port: r,
		protocol: i,
		artifactRef: a,
		filename: o
	}), !0) : !0;
}
async function Da(e) {
	if (!e?.hostId || !e?.port) return;
	let t = `${e.hostIp}:${e.port}/${e.protocol}`;
	if (window.confirm(`Delete port ${t}?`)) try {
		await W("/api/workspace/ports/delete", {
			host_id: e.hostId,
			port: e.port,
			protocol: e.protocol
		}), H(`Deleted port ${t}`), await da();
	} catch (e) {
		H(`Delete port failed: ${e.message}`, !0);
	}
}
async function Oa(e) {
	if (!e?.hostId || !e?.port) return;
	let t = `${e.serviceLabel || e.serviceName || "service"} on ${e.hostIp}:${e.port}/${e.protocol}`;
	if (window.confirm(`Delete ${t}?`)) try {
		await W("/api/workspace/services/delete", {
			host_id: e.hostId,
			port: e.port,
			protocol: e.protocol,
			service: e.serviceName
		}), H(`Deleted ${t}`), await da();
	} catch (e) {
		H(`Delete service failed: ${e.message}`, !0);
	}
}
async function ka(e) {
	let t = parseInt(e, 10);
	if (t) try {
		H(`Rescan queued (job ${(await W(`/api/workspace/hosts/${t}/rescan`, {}))?.job?.id || "?"})`), await da();
	} catch (e) {
		H(`Rescan failed: ${e.message}`, !0);
	}
}
async function Aa(e) {
	let t = String(e || "").trim();
	if (t) try {
		let e = await W("/api/workspace/subnets/rescan", { subnet: t }), n = Number(e?.job?.id || 0);
		e?.job?.existing ? H(`Subnet rescan already queued/running (job ${n || "?"})`) : H(`Subnet rescan queued (job ${n || "?"})`), await da();
	} catch (e) {
		H(`Subnet rescan failed: ${e.message}`, !0);
	}
}
async function ja(e) {
	let t = parseInt(e, 10);
	if (t) try {
		let e = await W(`/api/workspace/hosts/${t}/dig-deeper`, {});
		e?.job?.existing ? H(`Dig deeper already queued/running (job ${e?.job?.id || "?"})`) : H(`Dig deeper queued (job ${e?.job?.id || "?"})`), await da();
	} catch (e) {
		H(`Dig deeper failed: ${e.message}`, !0);
	}
}
async function Ma(e) {
	let t = parseInt(e, 10);
	if (t) try {
		let e = await W(`/api/workspace/hosts/${t}/refresh-screenshots`, {}), n = Number(e?.job?.id || 0);
		if (e?.job?.existing) {
			H(`Screenshot refresh already queued/running (job ${n || "?"})`), await da();
			return;
		}
		H(`Screenshot refresh queued (job ${n || "?"})`), await da(), n > 0 && Er(n, 3e5, 1500).then(async (e) => {
			let n = e?.result || {}, r = Number(n.completed || 0), i = Number(n.target_count || 0);
			String(k.selectedHostId || "") === String(t) && await Ar(t), await da(), H(i > 0 ? `Screenshot refresh completed (${r}/${i})` : "Screenshot refresh completed");
		}).catch(async (e) => {
			String(k.selectedHostId || "") === String(t) && await Ar(t).catch(() => {}), await da(), H(`Screenshot refresh failed: ${e.message}`, !0);
		});
	} catch (e) {
		H(`Screenshot refresh failed: ${e.message}`, !0);
	}
}
async function Na(e) {
	let t = parseInt(e?.hostId, 10), n = String(e?.port || "").trim(), r = String(e?.protocol || "tcp").trim().toLowerCase() || "tcp";
	if (t && n) try {
		let e = await W("/api/workspace/screenshots/refresh", {
			host_id: t,
			port: n,
			protocol: r
		}), i = Number(e?.job?.id || 0);
		e?.job?.existing ? H(`Screenshot refresh already queued/running (job ${i || "?"})`) : H(`Screenshot refresh queued (job ${i || "?"})`), await da();
	} catch (e) {
		H(`Screenshot refresh failed: ${e.message}`, !0);
	}
}
async function Pa(e) {
	let t = parseInt(e?.hostId, 10), n = String(e?.port || "").trim(), r = String(e?.protocol || "tcp").trim().toLowerCase() || "tcp", i = String(e?.artifactRef || "").trim(), a = String(e?.filename || "").trim();
	if (!t || !i && !a) return;
	let o = a || i || "this screenshot";
	if (window.confirm(`Delete ${o}?`)) try {
		await W("/api/workspace/screenshots/delete", {
			host_id: t,
			port: n,
			protocol: r,
			artifact_ref: i,
			filename: a
		}), H(`Deleted screenshot ${o}`), await da();
	} catch (e) {
		H(`Delete screenshot failed: ${e.message}`, !0);
	}
}
async function Fa() {
	let e = parseInt(Me.hostId, 10);
	if (!e) ji(!0);
	else try {
		let t = await fetch(`/api/workspace/hosts/${e}`, { method: "DELETE" }), n = {};
		try {
			n = await t.json();
		} catch {}
		if (!t.ok) {
			let e = n.error || `Request failed (${t.status})`;
			throw Error(e);
		}
		let r = String(n.host_ip || Me.hostIp || "");
		ji(!0), k.selectedHostId === e && (k.selectedHostId = null, k.hostDetail = null, hr({
			host: {},
			note: "",
			ports: [],
			cves: [],
			screenshots: []
		})), H(`Removed host ${r || e}`), await Promise.all([
			jr(),
			da(),
			Gt()
		]);
	} catch (e) {
		H(`Remove host failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/tools.js
var Ia;
function La(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing tools callback: ${t}`);
	({pollSnapshot: Ia} = e);
}
function Ra() {
	if (z("workspace-tool-host-ip").trim()) return;
	let e = k.hosts.find((e) => String(e.id) === String(k.selectedHostId));
	e?.ip && I("workspace-tool-host-ip", e.ip);
}
function za(e) {
	return [
		String(e?.host_id || ""),
		String(e?.host_ip || ""),
		String(e?.port || ""),
		String(e?.protocol || "tcp"),
		String(e?.service || "")
	].join("|");
}
function Ba(e, t = "") {
	let n = document.getElementById("workspace-tool-select");
	if (!n) return;
	k.manualToolOptions = Array.isArray(e) ? e : [];
	let r = String(t || n.value || "").trim();
	n.innerHTML = "", k.manualToolOptions.filter((e) => e?.runnable !== !1).forEach((e) => {
		let t = document.createElement("option");
		t.value = String(e.tool_id || ""), t.textContent = `${e.label || e.tool_id} (${e.tool_id || ""})`, n.appendChild(t);
	}), r && Array.from(n.options).some((e) => e.value === r) && (n.value = r), Ha();
}
function Va() {
	let e = z("workspace-tool-select").trim();
	return e && (Array.isArray(k.manualToolOptions) ? k.manualToolOptions : []).find((t) => String(t?.tool_id || "") === e) || null;
}
function Ha() {
	let e = document.getElementById("workspace-tool-parameters-wrapper"), t = document.getElementById("workspace-tool-parameters");
	if (!e || !t) return;
	t.innerHTML = "";
	let n = Va(), r = Array.isArray(n?.parameters) ? n.parameters : [];
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
function Ua() {
	let e = document.getElementById("workspace-tool-parameters-wrapper"), t = document.getElementById("workspace-tool-parameters");
	if (!e || e.hidden || !t) return {};
	let n = {};
	return t.querySelectorAll("[data-parameter-name]").forEach((e) => {
		let t = String(e.dataset.parameterName || "").trim(), r = String(e.value || "").trim();
		t && r && (n[t] = r);
	}), n;
}
async function Wa({ hostId: e = 0, service: t = "", limit: n = 500 } = {}) {
	let r = new URLSearchParams();
	r.set("limit", String(n)), e && r.set("host_id", String(e)), t && r.set("service", String(t));
	let i = await Xe(`/api/workspace/tool-targets?${r.toString()}`);
	return Array.isArray(i?.targets) ? i.targets : [];
}
async function Ga(e = "", t = "", { port: n = "", protocol: r = "tcp" } = {}) {
	let i = await yr({
		service: e,
		port: n,
		protocol: r
	});
	return Ba(i, t), i;
}
async function Ka(e, { preferredToolId: t = "" } = {}) {
	let n = e && typeof e == "object" ? e : {};
	I("workspace-tool-host-ip", n.host_ip || ""), I("workspace-tool-port", n.port || ""), I("workspace-tool-protocol", n.protocol || "tcp"), await Ga(String(n.service || "").trim(), t, {
		port: String(n.port || "").trim(),
		protocol: String(n.protocol || "tcp").trim() || "tcp"
	});
}
async function qa(e, { preferredTargetKey: t = "", preferredToolId: n = "" } = {}) {
	k.manualToolTargets = Array.isArray(e) ? e : [];
	let r = document.getElementById("workspace-tool-target-wrapper"), i = document.getElementById("workspace-tool-target-select");
	if (!r || !i) return;
	if (i.innerHTML = "", !k.manualToolTargets.length) {
		r.hidden = !0;
		return;
	}
	k.manualToolTargets.forEach((e) => {
		let t = document.createElement("option");
		t.value = za(e), t.textContent = String(e?.label || `${e?.host_ip || ""}:${e?.port || ""}/${e?.protocol || "tcp"}`), i.appendChild(t);
	}), r.hidden = !1;
	let a = t && Array.from(i.options).some((e) => e.value === t) ? t : String(i.options[0]?.value || "");
	a && (i.value = a), await Ka(k.manualToolTargets.find((e) => za(e) === String(i.value || "")), { preferredToolId: n });
}
async function Ja({ contextLabel: e = "", targets: t = null, hostId: n = 0, service: r = "", preferredToolId: i = "" } = {}) {
	qi(), pi(!0), F("workspace-tool-context", e || "");
	try {
		let e = Array.isArray(t) ? t : [];
		if (!e.length && (Number(n) > 0 || String(r || "").trim()) && (e = await Wa({
			hostId: Number(n) || 0,
			service: String(r || "").trim(),
			limit: 2e3
		})), e.length) {
			await qa(e, { preferredToolId: i });
			return;
		}
	} catch (e) {
		H(`Load tool targets failed: ${e.message}`, !0);
	}
	k.manualToolTargets = [];
	let a = document.getElementById("workspace-tool-target-wrapper"), o = document.getElementById("workspace-tool-target-select");
	a && (a.hidden = !0), o && (o.innerHTML = ""), Ra(), Ba(k.tools, i);
}
async function Ya() {
	let e = document.getElementById("workspace-tool-target-select");
	if (!e) return;
	let t = k.manualToolTargets.find((t) => za(t) === String(e.value || ""));
	t && await Ka(t);
}
async function Xa() {
	if (!P.manualScanOpen) return;
	let e = document.getElementById("workspace-tool-target-select"), t = "";
	if (e && !e.closest("[hidden]")) {
		let n = k.manualToolTargets.find((t) => za(t) === String(e.value || ""));
		t = String(n?.service || "").trim();
	}
	await Ga(t, z("workspace-tool-select").trim(), {
		port: z("workspace-tool-port").trim(),
		protocol: z("workspace-tool-protocol").trim() || "tcp"
	});
}
async function Za() {
	let e = z("workspace-tool-host-ip").trim(), t = z("workspace-tool-port").trim(), n = z("workspace-tool-protocol").trim() || "tcp", r = z("workspace-tool-select").trim();
	if (!e || !t || !r) {
		H("host ip, port and tool are required", !0);
		return;
	}
	let i = Ua();
	wi(), H("Queueing tool run...");
	try {
		H(`Tool run queued (job ${(await W("/api/workspace/tools/run", {
			host_ip: e,
			port: t,
			protocol: n,
			tool_id: r,
			parameters: i
		}))?.job?.id || "?"})`), await Ia();
	} catch (e) {
		H(`Tool run failed: ${e.message}`, !0);
	}
}
async function Qa() {
	P.manualScanOpen && wi(), H("Queueing scheduler run...");
	try {
		H(`Scheduler run queued (job ${(await W("/api/scheduler/run", {}))?.job?.id || "?"})`), await Ia();
	} catch (e) {
		H(`Scheduler run failed: ${e.message}`, !0);
	}
}
async function $a() {
	let e = k.selectedHostId, t = z("workspace-script-id").trim(), n = z("workspace-script-output"), r = z("workspace-script-port").trim() || z("workspace-tool-port").trim(), i = z("workspace-script-protocol").trim() || z("workspace-tool-protocol").trim() || "tcp";
	if (!e || !t || !r) H("select host and provide script id + port", !0);
	else try {
		await W(`/api/workspace/hosts/${e}/scripts`, {
			script_id: t,
			output: n,
			port: r,
			protocol: i
		}), H("Script saved"), await Ar(e);
	} catch (e) {
		H(`Add script failed: ${e.message}`, !0);
	}
}
async function eo(e) {
	try {
		let t = await fetch(`/api/workspace/scripts/${e}`, { method: "DELETE" });
		if (!t.ok) throw Error(`Request failed (${t.status})`);
		H("Script deleted"), k.selectedHostId && await Ar(k.selectedHostId);
	} catch (e) {
		H(`Delete script failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/graph_detail.js
var to;
function no(e) {
	for (let t of ["graphRenderWorkspace"]) if (typeof e[t] != "function") throw TypeError(`Missing graph_detail callback: ${t}`);
	({graphRenderWorkspace: to} = e);
}
function ro() {
	Mi(!1), A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.relatedContent = [], to();
}
function io(e) {
	let t = !!e;
	A.filtersExpanded = t;
	let n = document.getElementById("graph-filters-panel"), r = document.getElementById("graph-filters-toggle-button");
	if (n && (n.hidden = !t), r) {
		let e = t ? "Hide Filters" : "Show Filters";
		r.setAttribute("title", e), r.setAttribute("aria-label", e), r.setAttribute("aria-expanded", t ? "true" : "false"), r.classList.toggle("is-active", t);
	}
}
function ao() {
	let e = en(), t = document.getElementById("graph-workspace-canvas");
	if (!e || !t || t.hidden) return null;
	let n = t.viewBox?.baseVal;
	if (!n || !Number(n.width) || !Number(n.height)) return null;
	let r = e.getBoundingClientRect(), i = t.getBoundingClientRect(), a = String(A.selectedKind || ""), o = String(A.selectedRef || "");
	if (!a || !o) return null;
	let s = 0, c = 0;
	if (a === "node") {
		let e = A.filtered.positions?.[o] || A.positions?.[o];
		if (!e) return null;
		s = Number(e.x || 0) + M.width, c = Number(e.y || 0) + M.height / 2;
	} else if (a === "edge") {
		let e = Kt("edge", o);
		if (!e) return null;
		let t = A.filtered.positions?.[String(e.from_node_id || "")], n = A.filtered.positions?.[String(e.to_node_id || "")];
		if (!t || !n) return null;
		let r = Number(t.x || 0) + M.width, i = Number(t.y || 0) + M.height / 2, a = Number(n.x || 0), l = Number(n.y || 0) + M.height / 2;
		s = (r + a) / 2, c = (i + l) / 2;
	} else return null;
	return {
		x: i.left - r.left + (s - Number(n.x || 0)) / Number(n.width || 1) * i.width,
		y: i.top - r.top + (c - Number(n.y || 0)) / Number(n.height || 1) * i.height
	};
}
function oo() {
	let e = Qt(), t = document.getElementById("graph-sidebar"), n = document.getElementById("graph-detail-dock-slot"), r = document.getElementById("graph-detail-floating-layer"), i = document.getElementById("graph-detail-panel"), a = document.getElementById("graph-detail-dock-toggle-button"), o = document.getElementById("graph-detail-close-button");
	if (!e || !t || !n || !r || !i || !a || !o) return;
	let s = String(A.detailMode || "floating") !== "docked", c = nn();
	e.classList.toggle("graph-workspace-detail-floating", s), e.classList.toggle("graph-workspace-detail-docked", !s), t.hidden = s, r.hidden = !s || !c, i.classList.toggle("is-floating", s), a.setAttribute("title", s ? "Dock Panel" : "Float Panel"), a.setAttribute("aria-label", s ? "Dock Panel" : "Float Panel"), o.hidden = !s, s ? i.parentElement !== r && r.appendChild(i) : i.parentElement !== n && n.appendChild(i), i.hidden = s ? !c : !1, !s || !c ? (i.style.left = "", i.style.top = "") : window.requestAnimationFrame(() => {
		let e = en();
		if (!e || i.hidden) return;
		let t = ao(), n = Math.min(i.offsetWidth || 430, Math.max(280, e.clientWidth - 16)), r = i.offsetHeight || 420, a = Math.max(320, e.clientWidth), o = Math.max(240, e.clientHeight), s = Math.max(8, a - n - 10), c = 12;
		t && (s = t.x + 18, c = t.y + 12, s + n > a - 8 && (s = Math.max(8, t.x - n - 18)), c + r > o - 8 && (c = Math.max(8, o - r - 8))), s = Math.max(8, Math.min(s, a - n - 8)), c = Math.max(8, Math.min(c, o - Math.min(r, o - 8) - 8)), i.style.left = `${Math.round(s)}px`, i.style.top = `${Math.round(c)}px`;
	});
}
function so(e) {
	A.detailMode = String(e || "floating").trim().toLowerCase() === "docked" ? "docked" : "floating", oo();
}
function co() {
	so(A.detailMode === "docked" ? "floating" : "docked");
}
function lo() {
	let e = document.getElementById("graph-focus-selection-button"), t = document.getElementById("graph-clear-focus-button"), n = document.getElementById("graph-expand-selection-button"), r = document.getElementById("graph-collapse-expanded-button"), i = rn(), a = i && q(i, "summary_kind") ? i : null, o = String(a?.node_id || ""), s = !!(o && A.expandedSummaryIds[o]);
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
function uo() {
	let e = document.getElementById("graph-detail-caption"), t = document.getElementById("graph-selection-badges"), n = document.getElementById("graph-detail-fields"), r = document.getElementById("graph-host-actions-block"), i = document.getElementById("graph-host-actions"), a = document.getElementById("graph-port-actions-block"), o = document.getElementById("graph-port-actions"), s = document.getElementById("graph-service-actions-block"), c = document.getElementById("graph-service-actions"), l = document.getElementById("graph-subnet-actions-block"), u = document.getElementById("graph-subnet-actions"), d = document.getElementById("graph-screenshot-actions-block"), f = document.getElementById("graph-screenshot-actions"), p = document.getElementById("graph-detail-evidence"), m = document.getElementById("graph-detail-properties"), h = document.getElementById("graph-annotations-list"), g = document.getElementById("graph-focus-selection-button"), _ = document.getElementById("graph-expand-selection-button"), v = document.getElementById("graph-collapse-expanded-button"), y = document.getElementById("graph-pin-toggle-button"), b = document.getElementById("graph-note-open-button");
	if (!e || !t || !n || !r || !i || !a || !o || !s || !c || !l || !u || !d || !f || !p || !m || !h || !g || !_ || !v || !y || !b) return;
	let x = String(A.selectedKind || ""), S = String(A.selectedRef || ""), C = x === "node" ? rn() : Kt(x, S);
	if (A.selectedPayload = C, t.innerHTML = "", n.innerHTML = "", i.innerHTML = "", o.innerHTML = "", c.innerHTML = "", u.innerHTML = "", f.innerHTML = "", r.hidden = !0, a.hidden = !0, s.hidden = !0, l.hidden = !0, d.hidden = !0, p.innerHTML = "", h.innerHTML = "", !C) {
		e.textContent = "Select a node or edge", m.textContent = "No graph selection", g.disabled = !0, g.setAttribute("title", "Select a node or summary to focus"), g.setAttribute("aria-label", "Select a node or summary to focus"), b.disabled = !0, b.setAttribute("title", "Select a node or edge to add a note"), b.setAttribute("aria-label", "Select a node or edge to add a note"), y.disabled = !0, y.classList.remove("is-active"), y.setAttribute("title", "Select a node to pin"), y.setAttribute("aria-label", "Select a node to pin"), fo("No related artifacts or screenshots."), lo(), oo();
		return;
	}
	let w = x === "node" && !!q(C, "summary_kind"), T = x === "edge" && !!q(C, "aggregate_kind"), E = x === "node" ? ta(C) : 0, D = x === "node" ? String(C.type || "").trim().toLowerCase() : "", O = [];
	if (x === "node") e.textContent = `${fn(C.type)}: ${C.label || C.node_id || ""}`, O.push(["Node ID", C.node_id || ""]), O.push(["Type", fn(C.type || "")]), w && (O.push(["Summary", "collapsed cluster"]), O.push(["Members", q(C, "member_count") || ""]), O.push(["Examples", (q(C, "sample_labels") || []).join(", ")]), O.push(["Expanded", A.expandedSummaryIds[String(C.node_id || "")] ? "yes" : "no"]));
	else {
		let t = Kt("node", C.from_node_id), n = Kt("node", C.to_node_id);
		e.textContent = `${fn(C.type)}: ${t?.label || C.from_node_id || ""} -> ${n?.label || C.to_node_id || ""}`, O.push(["Edge ID", C.edge_id || ""]), O.push(["Type", fn(C.type || "")]), O.push(["From", t?.label || C.from_node_id || ""]), O.push(["To", n?.label || C.to_node_id || ""]), T && (O.push(["Aggregate Count", q(C, "aggregate_count") || ""]), O.push(["Edge Types", (q(C, "edge_types") || []).join(", ")]));
	}
	if (O.push(["Confidence", C.confidence ?? ""]), O.push(["Provenance", we[String(C.source_kind || "").trim().toLowerCase()] || fn(C.source_kind || "")]), O.push(["First Seen", C.first_seen || ""]), O.push(["Last Seen", C.last_seen || ""]), O.push(["Source Ref", C.source_ref || ""]), O.forEach(([e, t]) => {
		if (t == null || t === "") return;
		let r = document.createElement("dt");
		r.textContent = e;
		let i = document.createElement("dd");
		i.textContent = String(t), n.appendChild(r), n.appendChild(i);
	}), [
		fn(C.type || ""),
		we[String(C.source_kind || "").trim().toLowerCase()] || fn(C.source_kind || ""),
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
		e.className = "graph-badge", e.textContent = `${q(C, "aggregate_count") || 0} merged edges`, t.appendChild(e);
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
		let e = pa("Run supported tool");
		e.addEventListener("click", async () => {
			await Ja({
				hostId: Number(E) || 0,
				contextLabel: `Supported tools for ${String(C.label || "host").trim()}`
			});
		}), i.appendChild(e), [
			"rescan",
			"refresh-screenshots",
			"dig-deeper",
			"remove"
		].forEach((e) => {
			let t = ma(e, E);
			t.addEventListener("click", async () => {
				await wa(t);
			}), i.appendChild(t);
		});
	}
	if (x === "node" && D === "port") {
		let e = ya(C);
		if (e) {
			a.hidden = !1;
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Delete Port", t.setAttribute("aria-label", "Delete Port"), t.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", t.addEventListener("click", async () => {
				await Da(e);
			}), o.appendChild(t), o.appendChild(Ca(e));
		}
	}
	if (x === "node" && D === "service") {
		let e = ya(C);
		if (e) {
			s.hidden = !1;
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Delete Service", t.setAttribute("aria-label", "Delete Service"), t.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", t.addEventListener("click", async () => {
				await Oa(e);
			}), c.appendChild(t), c.appendChild(Ca(e));
		}
	}
	if (x === "node" && D === "subnet") {
		let e = String(q(C, "cidr") || C.label || "").trim();
		if (e) {
			l.hidden = !1;
			let t = ha("rescan", e);
			t.addEventListener("click", async () => {
				await Ta(t);
			}), u.appendChild(t);
		}
	}
	if (x === "node" && D === "screenshot") {
		let e = {
			hostId: E,
			port: String(q(C, "port") || "").trim(),
			protocol: String(q(C, "protocol") || "tcp").trim().toLowerCase() || "tcp",
			artifactRef: String(q(C, "artifact_ref") || "").trim(),
			filename: String(q(C, "filename") || C.label || "").trim()
		};
		e.hostId > 0 && (d.hidden = !1, ["refresh", "delete"].forEach((t) => {
			let n = ga(t, e);
			n.addEventListener("click", async () => {
				await Ea(n);
			}), f.appendChild(n);
		}));
	}
	b.disabled = !1, b.setAttribute("title", "Add Note"), b.setAttribute("aria-label", "Add Note"), y.disabled = x !== "node" || w;
	let ae = x === "node" && !!A.pinnedNodeIds[String(C.node_id || "")];
	y.classList.toggle("is-active", ae), x === "node" ? w ? (y.setAttribute("title", "Summary nodes cannot be pinned"), y.setAttribute("aria-label", "Summary nodes cannot be pinned")) : (y.setAttribute("title", ae ? "Unpin Node" : "Pin Node"), y.setAttribute("aria-label", ae ? "Unpin Node" : "Pin Node")) : (y.setAttribute("title", "Pinning is available for nodes only"), y.setAttribute("aria-label", "Pinning is available for nodes only")), w ? fo("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.") : fo(), lo(), oo();
}
function fo(e = "") {
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
		a.className = "graph-content-kind", a.textContent = fn(e.kind || e.node_type || "artifact"), r.appendChild(a), n.appendChild(r);
		let o = document.createElement("div");
		if (o.className = "graph-content-meta", o.textContent = e.ref || e.filename || "", n.appendChild(o), e.kind === "image" && e.preview_url) {
			let t = document.createElement("img");
			t.className = "graph-content-image", t.src = `${e.preview_url}${e.preview_url.includes("?") ? "&" : "?"}t=${Date.now()}`, t.alt = e.filename || e.label || "Graph artifact preview", t.addEventListener("click", () => {
				Et(e.preview_url, e.filename || e.label || "screenshot.png", "");
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
			e.kind === "image" && e.preview_url ? (Ae.url = String(e.preview_url || ""), Ae.filename = String(e.filename || "screenshot.png"), Ae.port = "", await kt()) : await At(String(e.preview_text || e.ref || ""), `${e.filename || e.label || "Artifact"} copied to clipboard`, "Nothing to copy");
		}), s.appendChild(c);
		let l = document.createElement("button");
		if (l.type = "button", l.className = "icon-btn", l.title = "Download", l.setAttribute("aria-label", "Download"), l.innerHTML = "<i class=\"fa-solid fa-download\" aria-hidden=\"true\"></i>", l.addEventListener("click", () => {
			e.download_url && window.location.assign(`${e.download_url}${e.download_url.includes("?") ? "&" : "?"}t=${Date.now()}`);
		}), s.appendChild(l), e.kind === "image" && e.preview_url) {
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn", t.title = "Open", t.setAttribute("aria-label", "Open"), t.innerHTML = "<i class=\"fa-solid fa-up-right-from-square\" aria-hidden=\"true\"></i>", t.addEventListener("click", () => {
				Et(e.preview_url, e.filename || e.label || "screenshot.png", "");
			}), s.appendChild(t);
		} else if (e.kind === "text") {
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn", t.title = "Open", t.setAttribute("aria-label", "Open"), t.innerHTML = "<i class=\"fa-solid fa-up-right-from-square\" aria-hidden=\"true\"></i>", t.addEventListener("click", () => {
				Tt({
					title: "Artifact Preview",
					meta: e.filename || e.ref || "Artifact preview",
					command: e.ref || "",
					output: e.preview_text || "",
					downloadName: e.filename || "artifact.txt"
				});
			}), s.appendChild(t);
		}
		n.appendChild(s), t.appendChild(n);
	}), oo()) : (n.textContent = i, oo());
}
async function po() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || ""), n = e === "node" ? rn() : null;
	if (!e || !t || e !== "node" || !n) {
		A.relatedContent = [], fo("No related artifacts or screenshots.");
		return;
	}
	if (q(n, "summary_kind")) {
		A.relatedContent = [], fo("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.");
		return;
	}
	let r = Number(A.contentRequestId || 0) + 1;
	A.contentRequestId = r, A.relatedContent = [], fo("Loading related content...");
	try {
		let e = await Xe(`/api/graph/nodes/${encodeURIComponent(t)}/content?max_chars=20000`);
		if (r !== A.contentRequestId) return;
		A.relatedContent = Array.isArray(e?.entries) ? e.entries : [], fo();
	} catch (e) {
		if (r !== A.contentRequestId) return;
		A.relatedContent = [], fo(`Related content load failed: ${e.message}`);
	}
}
// ../app/web/static/js/workspace/graph_layout.js
function mo(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
	return (e || []).forEach((e) => {
		let o = parseInt(q(e, "host_id"), 10);
		if (!(!Number.isFinite(o) || o <= 0) && String(e.type || "") === "host") {
			t.set(o, e), n.set(o, String(e.label || q(e, "ip") || `host-${o}`));
			let s = String(q(e, "hostname") || "").trim();
			s && i.set(o, s);
			let c = String(q(e, "ip") || "").trim();
			c && r.set(o, pn(c));
			let l = q(e, "device_categories");
			Array.isArray(l) ? a.set(o, Jn(l)) : a.set(o, Jn(String(l || "").split(",")));
		}
	}), {
		hostById: t,
		hostLabelById: n,
		subnetByHostId: r,
		domainByHostId: i,
		categoriesByHostId: a
	};
}
function ho(e, t, n) {
	let r = String(q(e, "summary_group_key") || "").trim();
	if (r) return r;
	let i = String(e?.type || "").trim().toLowerCase(), a = parseInt(q(e, "host_id"), 10), o = String(q(e, "hostname") || "").trim(), s = String(q(e, "service") || q(e, "name") || q(e, "product") || "").trim();
	if (t === "host") return i === "host" ? String(e.label || "host") : n.hostLabelById.get(a) || "unassigned host";
	if (t === "category") {
		let t = Jn(i === "host" ? q(e, "device_categories") : n.categoriesByHostId.get(a) || []);
		return t.length ? t.join(", ") : "uncategorized";
	}
	if (t === "domain") return i === "fqdn" ? String(e.label || "domain") : o || n.domainByHostId.get(a) || "undisclosed domain";
	if (t === "service") return i === "service" ? s || String(e.label || "service") : i === "port" ? `${q(e, "port") || ""}/${q(e, "protocol") || ""}`.replace(/\/$/, "") || "port" : s || fn(i) || "other service";
	if (t === "finding") return String(i === "finding" ? q(e, "title") || e.label || "finding" : q(e, "cve") || q(e, "title") || q(e, "severity") || fn(i) || "other");
	if (i === "subnet") return String(e.label || "subnet");
	let c = String(q(e, "ip") || "").trim();
	return c ? pn(c) : n.subnetByHostId.get(a) || "other subnet";
}
function go(e, t) {
	let n = String(e?.type || "").trim().toLowerCase(), r = String(t?.type || "").trim().toLowerCase(), i = De.indexOf(n), a = De.indexOf(r);
	return i === a ? String(e?.label || "").localeCompare(String(t?.label || "")) : (i === -1 ? De.length : i) - (a === -1 ? De.length : a);
}
function _o(e) {
	let t = String(q(e, "severity") || "").trim().toLowerCase();
	return t ? Object.prototype.hasOwnProperty.call(Oe, t) ? Oe[t] : 80 : 99;
}
function vo(e, t) {
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
function yo(e, t) {
	return String(e || "").localeCompare(String(t || ""), void 0, {
		numeric: !0,
		sensitivity: "base"
	});
}
function bo(e, t) {
	return Array.from(e.entries()).sort((e, n) => {
		let [r, i] = e, [a, o] = n, s = Math.min(...i.map((e) => vo(e?.type, t)), 9), c = Math.min(...o.map((e) => vo(e?.type, t)), 9);
		if (s !== c) return s - c;
		let l = Math.min(...i.map((e) => _o(e)), 99), u = Math.min(...o.map((e) => _o(e)), 99);
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
		return d === f ? yo(r, a) : f - d;
	});
}
function xo(e) {
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
function So(e, t) {
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
function Co(e, t, n) {
	let r = String(e || "").trim().toLowerCase(), i = String(t || A.viewId || "attack_surface").trim().toLowerCase();
	return i === "attack_surface" ? r === "scope" || r === "subnet" ? 0 : r === "host" || r === "fqdn" ? 1 : r === "port" || r === "service" ? 2 : r === "url" || r === "screenshot" ? 3 : r === "technology" || r === "cpe" ? 4 : r === "finding" || r === "cve" || r === "exploit_reference" ? 5 : [
		"credential",
		"identity",
		"session",
		"action",
		"artifact",
		"evidence_record"
	].includes(r) ? 6 : 7 : i === "host_service_topology" ? r === "host" || r === "fqdn" || r === "subnet" ? 0 : r === "port" || r === "service" ? 1 : r === "url" || r === "screenshot" ? 2 : r === "technology" || r === "cpe" ? 3 : r === "finding" || r === "cve" || r === "exploit_reference" ? 4 : 5 : i === "web_application_map" ? r === "host" || r === "fqdn" || r === "service" ? 0 : r === "url" || r === "screenshot" ? 1 : r === "technology" || r === "cpe" ? 2 : r === "finding" || r === "cve" || r === "exploit_reference" ? 3 : 4 : i === "credential_identity_session" ? r === "host" ? 0 : r === "credential" || r === "identity" || r === "session" ? 1 : r === "action" || r === "artifact" || r === "evidence_record" ? 2 : 3 : i === "exploitation_chain" ? r === "host" ? 0 : r === "finding" || r === "cve" || r === "exploit_reference" ? 1 : r === "credential" || r === "identity" || r === "session" ? 2 : r === "action" || r === "artifact" || r === "screenshot" || r === "evidence_record" ? 3 : 4 : vo(r, n);
}
function wo(e, t, n) {
	let r = Math.sqrt(Math.max(e, 1)) * (t >= 5e3 ? 1.08 : 1.16);
	return Math.max(1100, Math.min(t >= 5e3 ? 5600 : 4200, Math.round(r + n * 120)));
}
function To(e, t, n, r, i) {
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
function Eo(e, t, n, r, i = {}) {
	let a = Array.isArray(e) ? e.length : 0, o = a >= 5e3 ? 10 : a >= 2500 ? 12 : 16, s = a >= 5e3 ? 8 : a >= 2500 ? 10 : 14, c = a >= 5e3 ? 20 : 26, l = a >= 5e3 ? 20 : 28, u = a >= 5e3 ? 14 : 18, d = a >= 5e3 ? 12 : 18, f = String(A.viewId || "attack_surface").trim(), p = new Map((e || []).map((e) => [String(e?.node_id || ""), e])), { neighborMap: m, degreeMap: h } = xo(t), g = bo(n, r), _ = /* @__PURE__ */ new Map();
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
			let n = vo(e?.type, r) - vo(t?.type, r);
			if (n !== 0) return n;
			let i = _o(e) - _o(t);
			if (i !== 0) return i;
			let a = Number(h.get(String(t?.node_id || "")) || 0) - Number(h.get(String(e?.node_id || "")) || 0);
			if (a !== 0) return a;
			let o = Number((m.get(String(t?.node_id || "")) || /* @__PURE__ */ new Set()).size) - Number((m.get(String(e?.node_id || "")) || /* @__PURE__ */ new Set()).size);
			return o === 0 ? yo(e?.label || "", t?.label || "") : o;
		}), c = Math.min(...i.map((e) => vo(e?.type, r)), 9), l = Math.min(...i.map((e) => _o(e)), 99), p = i.filter((e) => [
			"finding",
			"cve",
			"exploit_reference"
		].includes(String(e?.type || "").trim().toLowerCase())).length, { columns: g, rows: _ } = So(i.length, a), v = Math.max(220, Math.round(u * 2 + g * M.width + Math.max(0, g - 1) * o)), b = Math.max(132, Math.round(58 + _ * M.height + Math.max(0, _ - 1) * s + d));
		return {
			key: n,
			label: n,
			nodes: i,
			nodeIds: i.map((e) => String(e?.node_id || "")).filter(Boolean),
			priority: c,
			severity: l,
			findings: p,
			degree: Number(y.get(n) || 0),
			lane: Math.min(...i.map((e) => Co(e?.type, f, r)), 99),
			columns: g,
			rows: _,
			width: v,
			height: b,
			area: v * b,
			x: 20,
			y: 20
		};
	});
	b.sort((e, t) => e.lane === t.lane ? e.priority === t.priority ? e.severity === t.severity ? e.findings === t.findings ? e.degree === t.degree ? e.area === t.area ? yo(e.key, t.key) : t.area - e.area : t.degree - e.degree : t.findings - e.findings : e.severity - t.severity : e.priority - t.priority : e.lane - t.lane);
	let x = To(b, wo(b.reduce((e, t) => e + Number(t.area || 0), 0), a, new Set(b.map((e) => Number(e?.lane ?? 0))).size || 1), c, l, 20), S = {};
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
	}), T = Math.max(Math.round(x.width || 1200), 1200), E = Math.max(Math.round(x.height || 760), 760);
	return Object.values(S).forEach((e) => {
		T = Math.max(T, (Number(e?.x) || 0) + M.width + 80), E = Math.max(E, (Number(e?.y) || 0) + M.height + 120);
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
function Do(e) {
	if (!e || typeof e != "object") return [];
	let t = Array.isArray(q(e, "member_node_ids")) ? q(e, "member_node_ids") : [];
	if (t.length) return t.map((e) => String(e || "")).filter(Boolean);
	let n = String(e.node_id || "");
	return n ? [n] : [];
}
function Oo(e, t, n) {
	let r = String(n || A.renderMode || "auto").trim().toLowerCase();
	return r === "graph" ? !1 : r === "summary" || r === "matrix" || e >= 1e3 || t >= 3e3;
}
function ko(e, t, n) {
	let r = String(n || A.renderMode || "auto").trim().toLowerCase();
	return r === "matrix" ? !0 : r === "graph" || r === "summary" ? !1 : e >= 1600 || t >= 4500;
}
function Ao(e) {
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
function jo(e) {
	let t = "", n = Infinity;
	return (e || []).forEach((e) => {
		let r = String(q(e, "severity") || "").trim().toLowerCase();
		if (!r) return;
		let i = Object.prototype.hasOwnProperty.call(Oe, r) ? Oe[r] : 80;
		i < n && (n = i, t = r);
	}), t;
}
function Mo(e, t) {
	let n = String(e || "").trim().toLowerCase();
	return n === "scope" || n === "subnet" ? Infinity : n === "finding" || n === "cve" || n === "exploit_reference" ? t >= 5e3 ? 5 : 7 : n === "host" || n === "fqdn" ? t >= 5e3 ? 3 : 5 : n === "service" || n === "port" || n === "url" || n === "screenshot" ? t >= 5e3 ? 2 : 4 : n === "technology" || n === "cpe" ? t >= 5e3 ? 2 : 3 : t >= 5e3 ? 2 : 4;
}
function No(e, t) {
	let n = String(e?.type || "").trim().toLowerCase(), r = String(e?.label || "").trim(), i = parseInt(q(e, "host_id"), 10), a = String(q(e, "hostname") || "").trim(), o = String(q(e, "ip") || "").trim(), s = String(q(e, "service") || q(e, "name") || r || "").trim().toLowerCase(), c = gn(r).toLowerCase();
	return n === "host" ? {
		type: n,
		bucket: pn(o) || t.subnetByHostId.get(i) || hn(a) || "hosts"
	} : n === "fqdn" ? {
		type: n,
		bucket: hn(r || a) || t.domainByHostId.get(i) || "domains"
	} : n === "port" ? {
		type: n,
		bucket: `${q(e, "port") || r}/${q(e, "protocol") || "tcp"}`.replace(/\/$/, "")
	} : n === "service" ? {
		type: n,
		bucket: s || "service"
	} : n === "url" ? {
		type: n,
		bucket: c || hn(a) || "urls"
	} : n === "technology" || n === "cpe" || n === "credential" || n === "identity" || n === "session" ? {
		type: n,
		bucket: String(r || q(e, "name") || n).trim().toLowerCase() || n
	} : n === "screenshot" || n === "artifact" || n === "action" || n === "evidence_record" ? {
		type: n,
		bucket: a || t.hostLabelById.get(i) || pn(o) || n
	} : n === "finding" || n === "cve" || n === "exploit_reference" ? {
		type: n,
		bucket: String(r || q(e, "title") || q(e, "cve") || q(e, "severity") || n).trim().toLowerCase() || n
	} : {
		type: n,
		bucket: String(r || n).trim().toLowerCase() || n
	};
}
function Po(e, t, n) {
	let r = Array.isArray(n) ? n.length : 0, i = fn(String(t || "").replace(/^.+?:/, "")) || fn(e) || "summary", a = r === 1 ? "" : "s";
	return e === "host" ? `${i} ${r} host${a}` : e === "fqdn" ? `${i} ${r} fqdn${a}` : e === "service" || e === "port" || e === "technology" || e === "cpe" ? `${i} ${r}` : e === "url" ? `${i} ${r} url${a}` : e === "screenshot" ? `${i} ${r} screenshot${a}` : `${i} ${r}`;
}
function Y(e, t, n, r) {
	let i = jo(r), a = (r || []).map((e) => String(e?.label || "").trim()).filter(Boolean).slice(0, 3);
	return {
		node_id: e,
		type: n.type,
		label: Po(n.type, n.bucket, r),
		confidence: Math.max(...(r || []).map((e) => Number(e?.confidence || 0) || 0), 0),
		source_kind: Ao(r),
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
function Fo(e, t, n, r) {
	let i = (e || []).slice().sort((e, t) => {
		let n = Number(q(e, "aggregate_count") || 1), r = Number(q(t, "aggregate_count") || 1);
		return n === r ? yo(e?.edge_id || "", t?.edge_id || "") : r - n;
	});
	if (r) return i;
	let a = /* @__PURE__ */ new Map(), o = [];
	return i.forEach((e) => {
		let r = String(e?.from_node_id || ""), i = String(e?.to_node_id || ""), s = Number(q(e, "aggregate_count") || 1), c = t.has(r), l = t.has(i);
		if (n && (r === n || i === n) || c || l || s >= 3) {
			o.push(e);
			return;
		}
		let u = Number(a.get(r) || 0), d = Number(a.get(i) || 0);
		u >= 6 && d >= 6 || (a.set(r, u + 1), a.set(i, d + 1), o.push(e));
	}), o;
}
function Io(e, t, n, r) {
	let i = Array.isArray(e) ? e.length : 0, a = /* @__PURE__ */ new Map();
	(e || []).forEach((e) => {
		let t = ho(e, r, n) || "other";
		a.has(t) || a.set(t, []), a.get(t).push(e);
	});
	let o = [], s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map();
	a.forEach((e, t) => {
		let r = /* @__PURE__ */ new Map();
		(e || []).forEach((e) => {
			let t = No(e, n), i = `${t.type}|${t.bucket}`;
			r.has(i) || r.set(i, {
				descriptor: t,
				nodes: []
			}), r.get(i).nodes.push(e);
		}), s.set(t, /* @__PURE__ */ new Set()), r.forEach((e, n) => {
			let r = Mo(String(e.descriptor?.type || "").trim().toLowerCase(), i), a = `graph-summary-${mn(`${t}|${n}`)}`, d = !!A.expandedSummaryIds[a];
			if (e.nodes.length > r && !d) {
				let n = Y(a, t, e.descriptor, e.nodes);
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
			edge_id: `graph-edge-summary-${mn(i)}`,
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
		a.members.push(e), a.properties.aggregate_count += Number(q(e, "aggregate_count") || 1), a.properties.edge_types.push(r), a.confidence = Math.max(Number(a.confidence || 0), Number(e?.confidence || 0) || 0), a.source_kind = Ao(a.members);
	});
	let f = String(A.selectedRef || ""), p = Array.isArray(A.focusSeedNodeIds) && A.focusSeedNodeIds.length > 0, m = Fo(Array.from(d.values()).map((e) => ({
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
function Lo(e, t, n, r) {
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
function Ro(e, t, n) {
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
		let a = Number(q(e, "aggregate_count") || 1);
		i.set(t, Number(i.get(t) || 0) + a), i.set(n, Number(i.get(n) || 0) + a);
	});
	let a = (n || []).map((e) => ({
		key: String(e?.key || ""),
		label: String(e?.label || e?.key || ""),
		nodeCount: Array.isArray(e?.nodeIds) ? e.nodeIds.length : 0,
		activity: Number(i.get(String(e?.key || "")) || 0)
	})).sort((e, t) => e.activity === t.activity ? e.nodeCount === t.nodeCount ? yo(e.label, t.label) : t.nodeCount - e.nodeCount : t.activity - e.activity), o = a.slice(0, 24), s = new Set(o.map((e) => e.key)), c = a.length > o.length;
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
		let c = Number(q(e, "aggregate_count") || 1);
		u[i][a] += c, d = Math.max(d, u[i][a]);
	}), {
		groups: o,
		values: u,
		maxValue: d
	};
}
// ../app/web/static/js/workspace/graph_filters.js
function zo() {
	A.viewId = String(z("graph-view-select") || A.viewId || "attack_surface").trim(), A.groupBy = String(z("graph-group-select") || A.groupBy || Tn().defaultGroup || "subnet").trim(), A.renderMode = String(z("graph-render-mode-select") || A.renderMode || "auto").trim().toLowerCase(), A.focusDepth = Math.max(1, Math.min(3, parseInt(z("graph-focus-depth-select"), 10) || A.focusDepth || 1));
	let e = parseInt(z("graph-host-filter"), 10), t = Math.max(0, Math.min(100, parseInt(z("graph-min-confidence"), 10) || 0));
	return {
		viewId: A.viewId,
		groupBy: A.groupBy,
		renderMode: A.renderMode,
		focusDepth: A.focusDepth,
		hostId: Number.isFinite(e) && e > 0 ? e : 0,
		hostFilter: String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down",
		serviceFilters: Xn(),
		category: String(k.hostCategoryFilter || "").trim(),
		nodeType: String(z("graph-node-type-filter") || "").trim().toLowerCase(),
		edgeType: String(z("graph-edge-type-filter") || "").trim().toLowerCase(),
		sourceKind: String(z("graph-source-kind-filter") || "").trim().toLowerCase(),
		severity: String(z("graph-severity-filter") || "").trim().toLowerCase(),
		pack: String(z("graph-pack-filter") || "").trim().toLowerCase(),
		timeWindow: String(z("graph-time-window-filter") || "all").trim().toLowerCase(),
		search: String(z("graph-search-input") || "").trim(),
		minConfidence: t,
		hideAiSuggested: R("graph-hide-ai-suggested"),
		hideNmapXmlArtifacts: R("graph-hide-nmap-xml-artifacts")
	};
}
function Bo(e) {
	let t = Tn(), n = zo(), r = n.sourceKind, i = n.nodeType, a = n.edgeType, o = n.severity, s = n.pack, c = yn(n.timeWindow), l = Array.isArray(e?.nodes) ? e.nodes.slice() : [], u = Array.isArray(e?.edges) ? e.edges.slice() : [];
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
		return t && n && xn(e, o) && Sn(e, s) && bn(e, c);
	}, h = (e) => {
		let t = !r || String(e?.source_kind || "").trim().toLowerCase() === r, n = !a || String(e?.type || "").trim().toLowerCase() === a;
		return t && n && xn(e, o) && Sn(e, s) && bn(e, c);
	}, g = new Set(f ? l.filter(m).map((e) => String(e?.node_id || "")) : l.map((e) => String(e?.node_id || ""))), _ = p ? u.filter(h) : u.slice();
	p && _.forEach((e) => {
		g.add(String(e?.from_node_id || "")), g.add(String(e?.to_node_id || ""));
	}), l = l.filter((e) => g.has(String(e?.node_id || ""))), d = new Set(l.map((e) => String(e?.node_id || ""))), u = _.filter((e) => d.has(String(e?.from_node_id || "")) && d.has(String(e?.to_node_id || "")));
	let v = l.length, y = u.length, b = Lo(l, u, A.focusSeedNodeIds, n.focusDepth);
	l = b.nodes, u = b.edges;
	let x = mo(l), S = /* @__PURE__ */ new Map(), C = Oo(l.length, u.length, n.renderMode), w = !1, T = /* @__PURE__ */ new Set();
	if (C) {
		let e = Io(l, u, x, n.groupBy || t.defaultGroup || "subnet");
		l = e.nodes, u = e.edges, S = e.groupsMap, w = !!e.usedSummary, T = e.summaryNodeIds || /* @__PURE__ */ new Set();
	} else l.sort(go).forEach((e) => {
		let r = ho(e, n.groupBy || t.defaultGroup || "subnet", x) || "other";
		S.has(r) || S.set(r, []), S.get(r).push(e);
	});
	let E = Eo(l, u, S, n.groupBy || t.defaultGroup || "subnet", A.positions), D = ko(l.length, u.length, n.renderMode) && (E.groups || []).length > 2 ? "matrix" : "graph", O = D === "matrix" ? Ro(l, u, E.groups || []) : null;
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
function Vo(e) {
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
function Ho({ preserveDetail: e = !1 } = {}) {
	let t = document.getElementById("graph-workspace-canvas"), n = document.getElementById("graph-workspace-empty"), r = document.getElementById("graph-matrix-view");
	if (!t || !n || !r) return;
	let i = Bo(A.data);
	A.filtered = i;
	let a = i.nodes || [], o = i.edges || [], s = i.positions || {}, c = !1, l = A.selectedKind === "node" ? rn() : Kt(A.selectedKind, A.selectedRef);
	if (A.selectedKind && !l && (A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.relatedContent = [], c = !0), F("graph-workspace-summary", `${a.length} visible nodes | ${o.length} visible edges | ${Number(i?.meta?.baseNodeCount || A.data?.meta?.total_nodes || a.length)} filtered nodes${i?.meta?.summaryUsed ? " | summary mode" : ""}${i?.renderKind === "matrix" ? " | matrix fallback" : ""}${i?.meta?.focusActive ? ` | focus ${i.meta.focusDepth} hop` : ""}`), !a.length) {
		r.hidden = !0, t.innerHTML = "", t.setAttribute("viewBox", "0 0 1600 900"), t.style.width = "100%", t.style.height = `${Math.max(520, Number(tn()?.clientHeight || 680))}px`, A.viewport = null, t.hidden = !1, n.hidden = !1, uo(), oo();
		return;
	}
	if (n.hidden = !0, i.renderKind === "matrix") {
		t.hidden = !0, r.hidden = !1, Vo(i), e && !c && A.selectedKind || uo(), oo();
		return;
	}
	r.hidden = !0, r.innerHTML = "", t.hidden = !1, t.innerHTML = "";
	let u = ca(), d = In("defs");
	d.appendChild(In("marker", {
		id: "graph-arrow",
		markerWidth: 8,
		markerHeight: 8,
		refX: 7,
		refY: 4,
		orient: "auto",
		markerUnits: "strokeWidth"
	}));
	let f = In("path", {
		d: "M0,0 L8,4 L0,8 z",
		fill: "rgba(121, 133, 158, 0.65)"
	});
	d.firstChild.appendChild(f), d.appendChild(In("marker", {
		id: "graph-arrow-highlight",
		markerWidth: 9,
		markerHeight: 9,
		refX: 8,
		refY: 4.5,
		orient: "auto",
		markerUnits: "strokeWidth"
	}));
	let p = In("path", {
		d: "M0,0 L9,4.5 L0,9 z",
		fill: Se
	});
	d.lastChild.appendChild(p), t.appendChild(d), (i.groups || []).forEach((e) => {
		let n = In("g", {
			class: "graph-group",
			"data-graph-group-key": e.key || ""
		});
		n.appendChild(In("rect", {
			x: e.x,
			y: e.y,
			width: e.width,
			height: e.height,
			rx: 18,
			fill: Mn() ? "#131313" : "rgba(19, 19, 19, 0.75)",
			stroke: "rgba(160, 160, 160, 0.16)",
			"data-graph-group-key": e.key || ""
		})), u && n.appendChild(In("text", {
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
		let i = n.x + M.width, a = n.y + M.height / 2, o = r.x, c = r.y + M.height / 2, l = Math.max(36, Math.min(140, Math.abs(o - i) / 2)), u = o >= i ? 1 : -1, d = [
			`M ${i} ${a}`,
			`C ${i + l * u} ${a}`,
			`${o - l * u} ${c}`,
			`${o} ${c}`
		].join(" "), f = String(e?.edge_id || ""), p = h && h === f, g = !(!m || String(e?.from_node_id || "") !== m && String(e?.to_node_id || "") !== m), _ = jn(e), v = Math.max(1, Number(q(e, "aggregate_count") || 1)), y = p ? 4.2 : g ? Math.min(6.8, 2.5 + Math.log2(v + 1)) : Math.min(4.2, 1.05 + Math.log2(v + 1) * .7), b = p ? 1 : g ? .98 : Math.max(.18, Math.min(.34, .16 + Math.log2(v + 1) * .045)), x = p ? "#eef1ff" : g ? Se : Nn(e), S = p || g ? "url(#graph-arrow-highlight)" : "url(#graph-arrow)";
		t.appendChild(In("path", {
			d,
			stroke: "transparent",
			fill: "none",
			"stroke-width": 12,
			"data-graph-edge-id": e.edge_id || "",
			class: "graph-edge-hitbox"
		})), t.appendChild(In("path", {
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
		jn(e);
		let i = An(e), a = A.selectedKind === "node" && String(A.selectedRef || "") === n, o = na(e), c = !!q(e, "summary_kind"), l = ua({
			isSelected: a,
			isHostSelected: o,
			isSummaryNode: c
		}), u = la({
			isSelected: a,
			isHostSelected: o,
			isSummaryNode: c
		}), d = In("g", {
			transform: `translate(${r.x}, ${r.y})`,
			"data-graph-node-id": n,
			class: `graph-node${a ? " is-selected" : ""}${o ? " is-host-selected" : ""}${c ? " is-summary" : ""}`
		});
		if (d.appendChild(In("rect", {
			width: M.width,
			height: M.height,
			rx: 14,
			fill: Pn(e),
			stroke: a ? "#eef1ff" : i,
			"stroke-width": a ? 2.8 : 1.8,
			"data-graph-node-id": n
		})), d.appendChild(In("rect", {
			x: 10,
			y: 9,
			width: 8,
			height: M.height - 18,
			rx: 4,
			fill: i,
			opacity: .9,
			"data-graph-node-id": n
		})), l && d.appendChild(In("text", {
			x: 28,
			y: 18,
			class: "graph-node-type",
			"data-graph-node-id": n
		}, fn(e.type || ""))), u) {
			let t = In("text", {
				x: 28,
				y: l ? 34 : 30,
				class: "graph-node-label",
				"data-graph-node-id": n
			});
			Fn(e.label || n).forEach((e, r) => {
				let i = In("tspan", {
					x: 28,
					dy: r === 0 ? 0 : 14,
					"data-graph-node-id": n
				}, e);
				t.appendChild(i);
			}), d.appendChild(t);
		}
		A.pinnedNodeIds[n] && d.appendChild(In("circle", {
			cx: M.width - 16,
			cy: 14,
			r: 5,
			fill: "#eef1ff",
			opacity: .9,
			"data-graph-node-id": n
		})), c && d.appendChild(In("circle", {
			cx: M.width - 16,
			cy: M.height - 14,
			r: 7,
			fill: i,
			opacity: .95,
			"data-graph-node-id": n
		})), t.appendChild(d);
	}), sa(i.width, i.height), e && !c && A.selectedKind || uo(), oo();
}
// ../app/web/static/js/workspace/workspace_view.js
function Uo({ resetForms: e = !0 } = {}) {
	k.hostDetail = null, F("host-detail-name", ""), I("workspace-note", ""), I("workspace-tool-host-ip", ""), e && (I("workspace-tool-port", ""), I("workspace-tool-protocol", "tcp"), I("workspace-script-id", ""), I("workspace-script-port", ""), I("workspace-script-protocol", "tcp"), I("workspace-script-output", ""), I("workspace-cve-name", ""), I("workspace-cve-severity", "")), [
		"host-detail-ports",
		"host-detail-scripts",
		"host-detail-ai-technologies",
		"host-detail-ai-manual-tests",
		"host-detail-screenshots"
	].forEach((e) => {
		let t = document.getElementById(e);
		t && (t.innerHTML = "");
	}), F("host-ai-analysis-status", ""), F("host-ai-tech-count", 0), F("host-ai-manual-count", 0), F("host-screenshot-count", 0);
}
function Wo({ clearProjectPaths: e = !1 } = {}) {
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
	}, A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.metadataLoaded = !1, A.layouts = [], A.annotations = [], Nt({
		hosts: 0,
		open_ports: 0,
		services: 0,
		cves: 0,
		running_processes: 0,
		finished_processes: 0
	}), Ft([]), Jo([]), Xo([]), ns([]), dt([]), It([]), Lt([]), zt([]), Uo({ resetForms: !0 }), vt(!0), yt(!0), bt(!0), ji(!0), On(), Dn(), Ho(), e && (I("project-open-path", ""), I("project-save-path", ""));
}
function Go(e) {
	let t = document.getElementById("workspace-host-select");
	if (!t) return;
	let n = k.selectedHostId;
	t.innerHTML = "", e.forEach((e) => {
		let n = document.createElement("option");
		n.value = String(e.id), n.textContent = `${e.ip || ""} ${e.hostname ? `(${e.hostname})` : ""}`.trim(), t.appendChild(n);
	}), e.length ? (k.selectedHostId = e.some((e) => String(e.id) === String(n)) ? n : e[0].id, t.value = String(k.selectedHostId)) : (k.selectedHostId = null, Uo({ resetForms: !0 }));
}
function Ko({ syncGraph: e = !1, preserveGraphDetail: t = !0 } = {}) {
	let n = String(k.selectedHostId || ""), r = document.getElementById("workspace-host-select");
	r && (r.value = Array.from(r.options || []).some((e) => String(e.value || "") === n) ? n : "");
	let i = document.getElementById("hosts-body");
	i && Array.from(i.querySelectorAll("tr[data-host-id]")).forEach((e) => {
		let t = n && String(e.dataset.hostId || "") === n;
		e.classList.toggle("is-selected", !!t), e.setAttribute("aria-selected", t ? "true" : "false");
	}), e && Ho({ preserveDetail: t });
}
async function qo(e, { loadDetail: t = !0, syncGraph: n = !0, preserveGraphDetail: r = !0 } = {}) {
	let i = parseInt(e, 10);
	if (!Number.isFinite(i) || i <= 0) {
		k.selectedHostId = null, k.hostDetail = null;
		let e = zn(0);
		Uo({ resetForms: !0 }), Ko({
			syncGraph: n,
			preserveGraphDetail: r
		}), e && await Or();
		return;
	}
	let a = String(k.selectedHostId || "") !== String(i);
	k.selectedHostId = i;
	let o = zn(i);
	Ko({
		syncGraph: n,
		preserveGraphDetail: r
	});
	let s = [];
	o && (sr(), Jo(k.hosts), s.push(Or())), t && (a || !k.hostDetail) && (k.hostDetail = null, s.push(Ar(i)));
	try {
		await Promise.all(s);
	} catch (e) {
		H(`Load host detail failed: ${e.message}`, !0);
	}
}
function Jo(e) {
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
			t.stopPropagation(), await pr(e.id || 0, a);
		}), r.appendChild(i), n.appendChild(r);
		let c = document.createElement("td"), l = document.createElement("span"), u = document.createElement("i"), d = ts(e.os || "");
		u.className = `${d.className} host-os-icon`, u.setAttribute("aria-hidden", "true");
		let f = String(e.raw_os || "").trim(), p = String(e.os || "").trim();
		u.title = f && p && f !== p ? `${d.label}; imported OS: ${f}` : d.label, l.className = "host-ip-with-icon", l.appendChild(u), l.appendChild(document.createTextNode(e.ip || "")), c.appendChild(l), n.appendChild(c), n.appendChild(B(e.hostname)), n.appendChild(B(e.status));
		let m = B(e.os);
		f && p && f !== p && (m.title = `Resolved from stronger service evidence. Imported OS: ${f}`), n.appendChild(m), n.appendChild($n(e.categories || [])), n.appendChild(B(e.open_ports));
		let h = document.createElement("td");
		h.className = "host-actions";
		let g = pa(`Run supported tool for ${a}`);
		g.addEventListener("click", async (t) => {
			t.stopPropagation(), await Ja({
				hostId: Number(e.id) || 0,
				contextLabel: `Supported tools for ${a}`
			});
		}), h.appendChild(g), [
			"rescan",
			"refresh-screenshots",
			"dig-deeper",
			"remove"
		].forEach((t) => {
			h.appendChild(ma(t, e.id || ""));
		}), n.appendChild(h), t.appendChild(n);
	}), F("host-count", k.hosts.length), Go(k.hosts), Ko(), tr(), rr(), On());
}
function Yo(e, t) {
	let n = Yn(t);
	if (!n.length) return !0;
	let r = new Set(n.map((e) => e.toLowerCase()));
	return Array.isArray(e?.services) && e.services.some((e) => r.has(String(e || "").trim().toLowerCase()));
}
function Xo(e) {
	k.services = Array.isArray(e) ? e : [];
	let t = document.getElementById("services-body");
	if (!t) return;
	t.innerHTML = "", k.services.forEach((e) => {
		let n = document.createElement("tr"), r = document.createElement("td"), i = document.createElement("button");
		i.type = "button", i.className = "icon-btn", i.title = `Show hosts for ${e.service || "service"}`, i.setAttribute("aria-label", `Show hosts for ${e.service || "service"}`), i.innerHTML = "<i class=\"fa-solid fa-filter\" aria-hidden=\"true\"></i>", Xn().map((e) => e.toLowerCase()).includes(String(e.service || "").trim().toLowerCase()) && i.classList.add("is-active"), i.addEventListener("click", async () => {
			await ur(e.service || "");
		}), r.className = "service-filter-cell", r.appendChild(i), n.appendChild(r), n.appendChild(B(e.service || "")), n.appendChild(B(Array.isArray(e.ports) ? e.ports.join(", ") : "")), n.appendChild(B(e.host_count || 0)), n.appendChild(B(e.port_count || 0)), n.appendChild(B(Array.isArray(e.protocols) ? e.protocols.join(",") : "")), n.appendChild($n(e.categories || []));
		let a = document.createElement("td"), o = pa(`Run supported tool for ${e.service || "service"}`);
		o.addEventListener("click", async () => {
			await Ja({
				hostId: Number(k.servicesHostFilterId) || 0,
				service: String(e.service || "").trim(),
				contextLabel: k.servicesHostFilterId ? `Supported tools for ${e.service || "service"} on ${k.servicesHostFilterLabel || "selected host"}` : `Supported tools for ${e.service || "service"}`
			});
		}), a.appendChild(o), n.appendChild(a), t.appendChild(n);
	}), F("service-count", k.services.length);
	let n = document.getElementById("services-scope-label");
	if (n) {
		let e = String(k.servicesHostFilterLabel || "").trim();
		n.textContent = e ? `for ${e}` : "all hosts", n.hidden = !1;
	}
	rr();
}
function Zo(e) {
	let t = document.getElementById("services-panel-body"), n = document.getElementById("services-panel-toggle-button");
	if (!t || !n) return;
	let r = !!e;
	t.hidden = r, n.classList.toggle("is-collapsed", r), n.setAttribute("aria-expanded", r ? "false" : "true"), n.title = r ? "Show Services" : "Hide Services", n.setAttribute("aria-label", r ? "Show Services" : "Hide Services");
}
function Qo() {
	let e = document.getElementById("services-panel-body");
	e && Zo(!e.hidden);
}
function $o(e) {
	let t = document.getElementById("graph-panel-body"), n = document.getElementById("graph-panel-toggle-button");
	if (!t || !n) return;
	let r = !!e;
	t.hidden = r, n.classList.toggle("is-collapsed", r), n.setAttribute("aria-expanded", r ? "false" : "true"), n.title = r ? "Show Graph Workspace" : "Hide Graph Workspace", n.setAttribute("aria-label", r ? "Show Graph Workspace" : "Hide Graph Workspace");
}
function es() {
	let e = document.getElementById("graph-panel-body");
	e && $o(!e.hidden);
}
function ts(e) {
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
function ns(e) {
	k.tools = Array.isArray(e) ? e : [];
	let t = document.getElementById("tools-body");
	t && (t.innerHTML = "", k.tools.forEach((e) => {
		let n = document.createElement("tr");
		n.dataset.toolId = String(e.tool_id || ""), n.appendChild(B(e.label || "")), n.appendChild(B(e.tool_id || "")), n.appendChild(B(e.run_count || 0)), n.appendChild(B(e.last_status || "")), n.appendChild(B(Array.isArray(e.danger_categories) ? e.danger_categories.join(",") : "")), t.appendChild(n);
	})), k.manualToolTargets.length || Ba(k.tools), F("tool-count", k.tools.length);
}
// ../app/web/static/js/workspace/graph_data.js
function rs(e, t) {
	let n = Kt(e === "node" ? "node" : "edge", t), r = e === "node" ? ta(n) : 0;
	if (r > 0) {
		let e = String(k.selectedHostId || "") !== String(r);
		k.selectedHostId = r, Ko({ syncGraph: !1 }), (e || !k.hostDetail) && (k.hostDetail = null, Ar(r).catch((e) => {
			H(`Load host detail failed: ${e.message}`, !0);
		}));
	}
	A.selectedKind = String(e || ""), A.selectedRef = String(t || ""), A.selectedPayload = null, A.relatedContent = [], Ho(), po().catch(() => {});
}
async function is({ force: e = !1 } = {}) {
	if (!Xt()) return;
	if (A.metadataLoaded && !e) {
		Dn();
		return;
	}
	let [t, n] = await Promise.all([Xe("/api/graph/layouts"), Xe("/api/graph/annotations")]);
	A.layouts = Array.isArray(t?.layouts) ? t.layouts : [], A.annotations = Array.isArray(n?.annotations) ? n.annotations : [], A.metadataLoaded = !0;
	let r = String(z("graph-view-select") || A.viewId || "attack_surface").trim();
	if (!A.activeLayoutId) {
		let e = A.layouts.find((e) => String(e?.view_id || "") === r && String(e?.name || "").trim().toLowerCase() === "default") || A.layouts.find((e) => String(e?.view_id || "") === r);
		A.activeLayoutId = String(e?.layout_id || ""), e?.layout?.positions && typeof e.layout.positions == "object" && (A.positions = { ...e.layout.positions }), e?.layout?.pinned_node_ids && typeof e.layout.pinned_node_ids == "object" && (A.pinnedNodeIds = { ...e.layout.pinned_node_ids });
	}
	Dn();
}
async function as({ background: e = !1, forceMetadata: t = !1 } = {}) {
	if (Xt()) {
		if (A.loading) A.needsRefresh = !0;
		else {
			A.loading = !0, e || K("Loading graph...");
			try {
				(!A.metadataLoaded || t) && await is({ force: t });
				let n = zo(), r = new URLSearchParams();
				r.set("filter", String(n.hostFilter || "hide_down")), (Array.isArray(n.serviceFilters) ? n.serviceFilters : []).forEach((e) => {
					r.append("service", e);
				}), n.category && r.set("category", n.category), n.hostId > 0 && r.set("host_id", String(n.hostId)), n.nodeType && r.set("node_type", n.nodeType), n.edgeType && r.set("edge_type", n.edgeType), n.sourceKind && r.set("source_kind", n.sourceKind), n.search && r.set("q", n.search), n.minConfidence > 0 && r.set("min_confidence", String(n.minConfidence)), n.hideAiSuggested && r.set("hide_ai_suggested", "true"), n.hideNmapXmlArtifacts && r.set("hide_nmap_xml_artifacts", "true"), r.set("limit_nodes", "8000"), r.set("limit_edges", "24000");
				let i = await Xe(`/api/graph?${r.toString()}`);
				A.data = {
					nodes: Array.isArray(i?.nodes) ? i.nodes : [],
					edges: Array.isArray(i?.edges) ? i.edges : [],
					meta: i?.meta || {}
				}, kn(), Dn(), Ho({ preserveDetail: e && !!A.selectedKind }), A.selectedKind !== "node" || !A.selectedRef || e && Array.isArray(A.relatedContent) && A.relatedContent.length || po().catch(() => {}), e || K(`Graph loaded: ${A.filtered.nodes.length} nodes, ${A.filtered.edges.length} edges`);
			} catch (e) {
				K(`Graph load failed: ${e.message}`, !0);
			} finally {
				A.loading = !1, A.needsRefresh && (A.needsRefresh = !1, as({ background: !0 }).catch(() => {}));
			}
		}
	}
}
function os(e = 900) {
	Xt() && (A.refreshTimer && window.clearTimeout(A.refreshTimer), A.refreshTimer = window.setTimeout(() => {
		A.refreshTimer = null, as({ background: !0 }).catch(() => {});
	}, Math.max(100, Number(e) || 900)));
}
async function ss() {
	await as({ background: !1 });
}
async function cs() {
	let e = parseInt(z("graph-host-filter"), 10);
	K("Rebuilding graph...");
	try {
		let t = await W("/api/graph/rebuild", { host_id: Number.isFinite(e) && e > 0 ? e : 0 });
		K(`Graph rebuilt: ${Number(t?.mutation_count || 0)} mutations`), await as({
			background: !1,
			forceMetadata: !0
		});
	} catch (e) {
		K(`Graph rebuild failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/live_updates.js
var ls;
function us(e) {
	for (let t of ["renderCredentialCapturePanel"]) if (typeof e[t] != "function") throw TypeError(`Missing live_updates callback: ${t}`);
	({renderCredentialCapturePanel: ls} = e);
}
function ds(e) {
	if (e) {
		if (e.project && Be(e.project), e.summary && Nt(e.summary), sr(), Array.isArray(e.hosts)) {
			let t = String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down", n = Xn();
			t !== "show_all" && Jo(n.length ? e.hosts.filter((e) => Yo(e, n)) : e.hosts);
		}
		if (Array.isArray(e.services) && (parseInt(k.servicesHostFilterId, 10) > 0 || Xo(e.services)), Array.isArray(e.tools) && !k.toolsHydrated && ns(e.tools), e.tools_meta && typeof e.tools_meta == "object") {
			let t = Number(e.tools_meta.total || 0);
			Number.isFinite(t) && t >= 0 && (F("tool-count", t), k.toolsHydrated && !k.toolsLoading && t !== k.tools.length && kr().catch(() => {}));
		}
		if (Array.isArray(e.processes) && dt(e.processes), e.credential_capture && typeof e.credential_capture == "object" && ls(e.credential_capture), e.scheduler) {
			let t = e.scheduler.engagement_policy || {};
			F("scheduler-mode", e.scheduler.mode || ""), F("scheduler-goal", t.preset_label || t.preset || e.scheduler.goal_profile || ""), F("scheduler-families", e.scheduler.preapproved_families_count || 0);
		}
		Array.isArray(e.scheduler_rationale_feed) && Ft(e.scheduler_rationale_feed), Array.isArray(e.scheduler_decisions) && It(e.scheduler_decisions), Array.isArray(e.scheduler_approvals) && Lt(e.scheduler_approvals), Array.isArray(e.jobs) && zt(e.jobs), Array.isArray(e.scan_history) && Rt(e.scan_history), k.selectedHostId && !k.hostDetail && Ar(k.selectedHostId).catch(() => {}), os();
	}
}
function fs(e) {
	return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${e}`;
}
function ps(e, t) {
	let n = document.getElementById("live-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
async function ms(e) {
	let t = new Set((e || []).map((e) => String(e || "").trim()).filter(Boolean));
	if (!t.size) return;
	let n = [], r = t.has("hosts"), i = t.has("services"), a = k.selectedHostId && (r || i || t.has("graph"));
	t.has("overview") && n.push(G()), r ? (n.push(Dr()), parseInt(k.servicesHostFilterId, 10) > 0 && !i && n.push(Or())) : i && n.push(Or()), t.has("processes") && n.push(Bt()), t.has("jobs") && n.push(Wt()), t.has("approvals") && n.push(Gt()), t.has("decisions") && n.push(Vt()), t.has("scan_history") && n.push(Ht()), t.has("tools") && k.toolsHydrated && n.push(kr({ force: !0 })), t.has("graph") && n.push(as({ background: !0 })), a && n.push(Ar(k.selectedHostId)), n.length && await Promise.all(n.map((e) => Promise.resolve(e).catch(() => {})));
}
function hs(e) {
	(e || []).forEach((e) => {
		let t = String(e || "").trim();
		t && ve.pendingChannels.add(t);
	}), ve.timer || ve.running || (ve.timer = window.setTimeout(async () => {
		if (ve.timer = null, !ve.running) {
			ve.running = !0;
			try {
				for (; ve.pendingChannels.size;) {
					let e = Array.from(ve.pendingChannels);
					ve.pendingChannels.clear(), await ms(e);
				}
			} finally {
				ve.running = !1;
			}
		}
	}, 60));
}
function gs() {
	let e = new WebSocket(fs("/ws/snapshot"));
	e.onopen = () => ps("Live", !1), e.onmessage = (e) => {
		try {
			let t = JSON.parse(e.data);
			if (t && t.type === "invalidate") {
				_r(t.channels || []), hs(t.channels || []);
				return;
			}
			if (t && t.type === "heartbeat") return;
			ds(t);
		} catch {
			ps("Decode Error", !0);
		}
	}, e.onerror = () => ps("Socket Error", !0), e.onclose = () => {
		ps("Reconnecting", !0), window.setTimeout(gs, 1500);
	};
}
async function _s() {
	try {
		let e = await fetch("/api/snapshot", { cache: "no-store" });
		if (!e.ok) {
			ps("Polling Error", !0);
			return;
		}
		ds(await e.json());
	} catch {
		ps("Polling Error", !0);
	}
}
// src/api/activity.ts
function vs({ data: e, error: t, response: n }) {
	if (!e) throw de(t, n.status);
	return e;
}
async function ys() {
	return vs(await ue.GET("/api/workspace/overview"));
}
async function bs() {
	return vs(await ue.GET("/api/processes", { params: { query: { limit: 100 } } })).processes;
}
async function xs() {
	return vs(await ue.GET("/api/scheduler/decisions", { params: { query: { limit: 80 } } })).decisions;
}
async function Ss() {
	return vs(await ue.GET("/api/scans/history", { params: { query: { limit: 100 } } })).scans;
}
async function Cs() {
	return vs(await ue.GET("/api/scheduler/approvals", { params: { query: {
		limit: 200,
		status: "pending"
	} } })).approvals;
}
async function ws() {
	return vs(await ue.GET("/api/scheduler/provider/logs", { params: { query: { limit: 400 } } }));
}
async function Ts(e, t) {
	return vs(await ue.GET("/api/processes/{process_id}/output", { params: {
		path: { process_id: e },
		query: {
			offset: t,
			max_chars: 24e3
		}
	} }));
}
async function Es(e, t) {
	let n = { path: { process_id: t } };
	return vs(e === "kill" ? await ue.POST("/api/processes/{process_id}/kill", { params: n }) : e === "close" ? await ue.POST("/api/processes/{process_id}/close", { params: n }) : await ue.POST("/api/processes/{process_id}/retry", {
		params: n,
		body: {}
	}));
}
async function Ds(e) {
	return vs(await ue.POST("/api/processes/clear", { body: { reset_all: e } }));
}
async function Os(e, t = "") {
	return vs(await ue.POST("/api/scheduler/approvals/{approval_id}/approve", {
		params: { path: { approval_id: e } },
		body: {
			approve_family: t === "allowed",
			run_now: !0,
			family_action: t
		}
	}));
}
async function ks(e, t = "") {
	return vs(await ue.POST("/api/scheduler/approvals/{approval_id}/reject", {
		params: { path: { approval_id: e } },
		body: {
			reason: "rejected in web workspace",
			family_action: t
		}
	}));
}
// src/activity/state.ts
function As(e) {
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
var js = (e) => !!e && typeof e == "object", Ms = (e) => js(e) && Number.isInteger(e.id), Ns = As(Ms), Ps = As(Ms), Fs = As(Ms), Is = As(Ms), Ls = As(js), Rs = {
	processes: Ns,
	approvals: Ps,
	decisions: Fs,
	scans: Is,
	rationale: Ls
}, zs = g(/* @__PURE__ */ new Set());
function Bs(e, t) {
	Rs[e].update(t);
}
// src/activity/output.ts
var Vs = () => ({
	id: 0,
	text: "",
	command: "",
	progress: "",
	meta: "No process selected",
	loading: !1,
	error: "",
	offset: 0,
	complete: !0
}), Hs = class {
	setOpen;
	store = g(Vs());
	generation = 0;
	timer;
	constructor(e) {
		this.setOpen = e;
	}
	async open(e) {
		this.close(), this.store.set({
			...Vs(),
			id: e,
			complete: !1,
			meta: `Process ${e} | loading...`
		}), this.setOpen(!0), await this.refresh();
	}
	close() {
		this.generation++, clearTimeout(this.timer), this.store.set(Vs()), this.setOpen(!1);
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
			let n = await Ts(e.id, e.offset);
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
}, Us = class {
	shell;
	logs = g({
		logs: [],
		text: "",
		loading: !1,
		error: ""
	});
	output;
	actions;
	epoch = 0;
	overviewRequest = 0;
	logRequest = 0;
	pending = /* @__PURE__ */ new Map();
	unsubscribe;
	constructor(e) {
		this.shell = e, this.output = new Hs(e.setOutputOpen);
		let t = _.getSnapshot().name;
		this.unsubscribe = _.subscribe(() => {
			let e = _.getSnapshot().name;
			t !== e && (t = e, this.epoch++, this.overviewRequest++, this.logRequest++, Object.values(Rs).forEach((e) => e.reset()), this.logs.set({
				logs: [],
				text: "",
				loading: !1,
				error: ""
			}), this.pending.clear(), zs.set(/* @__PURE__ */ new Set()), this.output.close());
		}), this.actions = {
			loadOverview: () => this.loadOverview(),
			loadProcesses: () => Ns.load(bs),
			loadApprovals: () => Ps.load(Cs),
			loadDecisions: () => Fs.load(xs),
			loadScans: () => Is.load(Ss),
			loadProviderLogs: () => this.loadLogs(),
			approve: (e, t = "") => this.approvalAction(e, !1, t),
			reject: (e, t = "") => this.approvalAction(e, !0, t),
			openOutput: (e) => this.output.open(e),
			closeOutput: async () => this.output.close()
		};
	}
	dispose() {
		this.unsubscribe(), this.epoch++, this.logRequest++, this.overviewRequest++, this.output.close();
	}
	async loadOverview() {
		let e = ++this.overviewRequest;
		try {
			let t = await ys();
			e === this.overviewRequest && this.shell.applyOverview(t);
		} catch (t) {
			e === this.overviewRequest && Rs.rationale.error(`Failed to load workspace overview: ${t instanceof Error ? t.message : t}`);
		}
	}
	async loadLogs() {
		let e = ++this.logRequest;
		this.logs.set({
			...this.logs.getSnapshot(),
			loading: !0,
			error: ""
		});
		try {
			let t = await ws();
			e === this.logRequest && this.logs.set({
				...t,
				loading: !1,
				error: ""
			});
		} catch (t) {
			if (e !== this.logRequest) return;
			let n = `Failed to load provider logs: ${t instanceof Error ? t.message : t}`;
			this.logs.set({
				...this.logs.getSnapshot(),
				loading: !1,
				error: n
			}), this.shell.status(n, !0);
		}
	}
	async mutate(e, t, n, r) {
		if (this.pending.has(e)) return;
		let i = Symbol(e), a = this.epoch;
		this.pending.set(e, i), zs.set(new Set(this.pending.keys())), t.error("");
		try {
			let e = await n();
			if (a !== this.epoch) return;
			this.shell.status(e), await Promise.all([r(), this.shell.refreshSnapshot()]);
		} catch (e) {
			if (a !== this.epoch) return;
			let n = `Action failed: ${e instanceof Error ? e.message : e}`;
			t.error(n), this.shell.status(n, !0);
		} finally {
			this.pending.get(e) === i && (this.pending.delete(e), zs.set(new Set(this.pending.keys())));
		}
	}
	async approvalAction(e, t, n = "") {
		await this.mutate(`approval:${e}`, Ps, async () => (t ? await ks(e, n === "suppressed" ? n : "") : await Os(e, n === "allowed" ? n : ""), `Approval ${e} ${t ? "rejected" : "accepted"}${n ? ` and family ${n}` : ""}`), this.actions.loadApprovals);
	}
	async processAction(e, t) {
		await this.mutate(`process:${t}`, Ns, async () => (await Es(e, t), `Process ${t}: ${e === "close" ? "hidden" : e === "retry" ? "retry queued" : "kill requested"}`), async () => {
			await this.actions.loadProcesses(), this.output.store.getSnapshot().id === t && await this.output.refresh();
		});
	}
	async clearProcesses(e) {
		await this.mutate("process:clear", Ns, async () => (await Ds(e), e ? "Hidden all non-running processes" : "Hidden finished/issues processes"), this.actions.loadProcesses);
	}
};
// src/activity/shared.tsx
function Ws({ id: e, label: t, icon: n, disabled: r, danger: i, className: a = "icon-btn", onClick: o }) {
	return /* @__PURE__ */ (0, U.jsx)("button", {
		id: e,
		type: "button",
		className: `${a}${i ? " icon-btn-danger" : ""}`,
		title: t,
		"aria-label": t,
		disabled: r,
		onClick: o,
		children: /* @__PURE__ */ (0, U.jsx)("i", {
			className: n,
			"aria-hidden": "true"
		})
	});
}
function Gs({ error: e, loading: t, empty: n, columns: r }) {
	let i = e || (t ? "Loading..." : n ? "No entries yet." : "");
	return i ? /* @__PURE__ */ (0, U.jsx)("tr", {
		role: e ? "alert" : "status",
		children: /* @__PURE__ */ (0, U.jsx)("td", {
			colSpan: r,
			children: i
		})
	}) : null;
}
function Ks({ id: e, text: t }) {
	let n = (0, w.useRef)(null), r = (0, w.useRef)(!0);
	return (0, w.useLayoutEffect)(() => {
		r.current && n.current && (n.current.scrollTop = n.current.scrollHeight);
	}, [t]), /* @__PURE__ */ (0, U.jsx)("div", {
		ref: n,
		id: e,
		className: "ansi-output-view",
		role: "textbox",
		"aria-readonly": "true",
		onScroll: () => {
			let e = n.current;
			e && (r.current = e.scrollHeight - e.scrollTop - e.clientHeight < 24);
		},
		dangerouslySetInnerHTML: { __html: et(t) }
	});
}
// src/activity/ProcessesTable.tsx
function qs({ controller: e }) {
	let t = (0, w.useSyncExternalStore)(Ns.subscribe, Ns.getSnapshot), n = (0, w.useSyncExternalStore)(zs.subscribe, zs.getSnapshot);
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)(Gs, {
		...t,
		empty: !t.items.length,
		columns: 7
	}), t.items.map((t) => {
		let r = ot(t.status), i = n.has(`process:${t.id}`) || n.has("process:clear"), a = nt(t.hostIp, t.port, t.protocol), o = Number(String(t.percent ?? "").replace("%", "").trim()), s = t.percent == null || t.percent === "" ? "" : Number.isFinite(o) ? `${o.toFixed(1)}%` : t.percent;
		return /* @__PURE__ */ (0, U.jsxs)("tr", {
			"data-process-id": t.id,
			children: [
				/* @__PURE__ */ (0, U.jsx)("td", { children: t.id }),
				/* @__PURE__ */ (0, U.jsx)("td", {
					className: "process-name-cell",
					title: t.name || "",
					children: /* @__PURE__ */ (0, U.jsx)("span", {
						className: "cell-truncate",
						children: t.name
					})
				}),
				/* @__PURE__ */ (0, U.jsx)("td", {
					className: "process-target-cell",
					title: a,
					children: /* @__PURE__ */ (0, U.jsx)("span", {
						className: "cell-truncate",
						children: a
					})
				}),
				/* @__PURE__ */ (0, U.jsx)("td", {
					className: "process-status-cell",
					children: /* @__PURE__ */ (0, U.jsxs)("span", {
						className: `process-status ${st(t.status)}`,
						children: [r && /* @__PURE__ */ (0, U.jsx)("span", {
							className: "process-spinner",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, U.jsx)("span", { children: t.status })]
					})
				}),
				/* @__PURE__ */ (0, U.jsx)("td", {
					className: "process-percent-cell",
					children: s
				}),
				/* @__PURE__ */ (0, U.jsx)("td", {
					className: "process-eta-cell",
					children: at(t.estimatedRemaining)
				}),
				/* @__PURE__ */ (0, U.jsxs)("td", {
					className: "process-actions",
					children: [/* @__PURE__ */ (0, U.jsx)("button", {
						type: "button",
						className: "icon-btn",
						"aria-label": "Output",
						title: "Output",
						"data-process-action": "output",
						"data-process-id": t.id,
						onClick: () => {
							e.actions.openOutput(t.id);
						},
						children: /* @__PURE__ */ (0, U.jsx)("i", {
							className: "fa-solid fa-terminal",
							"aria-hidden": "true"
						})
					}), [
						"retry",
						...r ? ["kill"] : [],
						"close"
					].map((n) => /* @__PURE__ */ (0, U.jsx)("button", {
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
						children: /* @__PURE__ */ (0, U.jsx)("i", {
							className: `fa-solid ${n === "close" ? "fa-eye-slash" : n === "kill" ? "fa-stop" : "fa-rotate-right"}`,
							"aria-hidden": "true"
						})
					}, n))]
				})
			]
		}, t.id);
	})] });
}
function Js({ controller: e }) {
	let t = [...(0, w.useSyncExternalStore)(zs.subscribe, zs.getSnapshot)].some((e) => e.startsWith("process:"));
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)(Ws, {
		id: "process-clear-finished-button",
		label: "Hide Finished/Issues",
		icon: "fa-solid fa-broom",
		disabled: t,
		onClick: () => {
			e.clearProcesses(!1);
		}
	}), /* @__PURE__ */ (0, U.jsx)(Ws, {
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
function Ys({ label: e, value: t }) {
	return t?.trim() ? /* @__PURE__ */ (0, U.jsxs)("div", { children: [
		e,
		": ",
		t
	] }) : null;
}
function Xs({ controller: e }) {
	let t = (0, w.useSyncExternalStore)(Ps.subscribe, Ps.getSnapshot), n = (0, w.useSyncExternalStore)(zs.subscribe, zs.getSnapshot);
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)(Gs, {
		...t,
		empty: !t.items.length,
		columns: 6
	}), t.items.map((t) => /* @__PURE__ */ (0, U.jsxs)("tr", {
		"data-approval-id": t.id,
		children: [
			/* @__PURE__ */ (0, U.jsx)("td", { children: t.id }),
			/* @__PURE__ */ (0, U.jsx)("td", { children: nt(t.host_ip, t.port, t.protocol) }),
			/* @__PURE__ */ (0, U.jsxs)("td", { children: [
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "tool",
					value: t.label || t.tool_id
				}),
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "id",
					value: t.tool_id
				}),
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "command",
					value: t.command_template
				}),
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "status",
					value: t.status
				})
			] }),
			/* @__PURE__ */ (0, U.jsxs)("td", { children: [
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "risk tags",
					value: t.risk_tags || t.danger_categories
				}),
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "decision",
					value: t.policy_decision
				}),
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "why risky",
					value: t.risk_summary
				}),
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "policy",
					value: t.policy_reason
				}),
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "safer alternative",
					value: t.safer_alternative
				}),
				/* @__PURE__ */ (0, U.jsx)(Ys, {
					label: "family policy",
					value: t.family_policy_state
				})
			] }),
			/* @__PURE__ */ (0, U.jsxs)("td", { children: [/* @__PURE__ */ (0, U.jsx)(Ys, {
				label: "planner rationale",
				value: t.rationale
			}), /* @__PURE__ */ (0, U.jsx)(Ys, {
				label: "evidence",
				value: t.evidence_refs
			})] }),
			/* @__PURE__ */ (0, U.jsx)("td", {
				className: "approval-action-buttons",
				children: [
					"approve",
					"reject",
					"allow-family",
					"suppress-family"
				].map((r) => /* @__PURE__ */ (0, U.jsx)("button", {
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
function Zs() {
	let e = (0, w.useSyncExternalStore)(Fs.subscribe, Fs.getSnapshot);
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)(Gs, {
		...e,
		empty: !e.items.length,
		columns: 8
	}), e.items.map((e) => /* @__PURE__ */ (0, U.jsxs)("tr", { children: [
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.timestamp }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: nt(e.host_ip, e.port, e.protocol) }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.tool_id || e.label }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.scheduler_mode }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: String(e.approved ?? "") }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: String(e.executed ?? "") }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.reason }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.command_family_id })
	] }, e.id))] });
}
function Qs() {
	let e = (0, w.useSyncExternalStore)(Is.subscribe, Is.getSnapshot);
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)(Gs, {
		...e,
		empty: !e.items.length,
		columns: 8
	}), e.items.map((e) => /* @__PURE__ */ (0, U.jsxs)("tr", { children: [
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.id }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.submission_kind }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.status }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.target_summary }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.scope_summary }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.scan_mode }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.created_at }),
		/* @__PURE__ */ (0, U.jsx)("td", { children: e.result_summary })
	] }, e.id))] });
}
function $s(e) {
	if (!e) return "";
	let t = Date.parse(e);
	return Number.isFinite(t) ? new Date(t).toLocaleString([], {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	}) : e;
}
function ec() {
	let e = (0, w.useSyncExternalStore)(Ls.subscribe, Ls.getSnapshot);
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
		e.error && /* @__PURE__ */ (0, U.jsx)("p", {
			role: "alert",
			children: e.error
		}),
		!e.items.length && /* @__PURE__ */ (0, U.jsx)("p", {
			className: "meta-note rationale-empty",
			children: e.loading ? "Loading..." : "Scheduler rationale will appear here as tools are ranked, suppressed, and executed."
		}),
		e.items.map((e, t) => /* @__PURE__ */ (0, U.jsxs)("article", {
			className: "rationale-entry",
			children: [
				/* @__PURE__ */ (0, U.jsxs)("div", {
					className: "rationale-entry-top",
					children: [/* @__PURE__ */ (0, U.jsxs)("div", {
						className: "rationale-entry-heading",
						children: [/* @__PURE__ */ (0, U.jsx)("p", {
							className: "rationale-entry-prefix",
							children: nt(e.host_ip || "Project-wide", e.port, e.protocol)
						}), /* @__PURE__ */ (0, U.jsx)("strong", {
							className: "rationale-entry-title",
							children: e.headline || e.kind || "Decision"
						})]
					}), /* @__PURE__ */ (0, U.jsx)("span", {
						className: "rationale-entry-time",
						children: $s(e.timestamp)
					})]
				}),
				!!e.tags?.length && /* @__PURE__ */ (0, U.jsx)("div", {
					className: "rationale-entry-tags",
					children: e.tags.filter(Boolean).map((e, t) => /* @__PURE__ */ (0, U.jsx)("span", {
						className: "chip rationale-chip",
						children: e
					}, t))
				}),
				/* @__PURE__ */ (0, U.jsx)("p", {
					className: "rationale-entry-summary",
					children: e.summary || "Scheduler decision recorded."
				}),
				!!e.details?.length && /* @__PURE__ */ (0, U.jsx)("div", {
					className: "rationale-entry-details",
					children: e.details.filter(Boolean).map((e, t) => /* @__PURE__ */ (0, U.jsx)("div", {
						className: "rationale-entry-line",
						children: e
					}, t))
				})
			]
		}, `${e.timestamp}:${t}`))
	] });
}
// src/activity/OutputPanels.tsx
function tc(e, t) {
	if (!e) {
		H("No output to download", !0);
		return;
	}
	let n = URL.createObjectURL(new Blob([e], { type: "text/plain;charset=utf-8" })), r = document.createElement("a");
	r.href = n, r.download = t, document.body.appendChild(r), r.click(), r.remove(), URL.revokeObjectURL(n), H(`${t} downloaded`);
}
function nc({ controller: e }) {
	let t = (0, w.useSyncExternalStore)(e.output.store.subscribe, e.output.store.getSnapshot);
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
		/* @__PURE__ */ (0, U.jsxs)("div", {
			className: "panel-header modal-header",
			children: [
				/* @__PURE__ */ (0, U.jsx)("h2", {
					id: "process-output-modal-title",
					children: "Process Output"
				}),
				/* @__PURE__ */ (0, U.jsx)("p", {
					id: "process-output-meta",
					children: t.meta
				}),
				/* @__PURE__ */ (0, U.jsx)(Ws, {
					id: "process-output-modal-close",
					className: "modal-close-btn",
					label: "Close dialog",
					icon: "fa-solid fa-xmark",
					onClick: () => e.output.close()
				})
			]
		}),
		/* @__PURE__ */ (0, U.jsxs)("div", {
			className: "modal-actions modal-toolbar-actions",
			children: [
				/* @__PURE__ */ (0, U.jsx)(Ws, {
					id: "process-output-refresh-button",
					label: "Refresh",
					icon: "fa-solid fa-rotate-right",
					disabled: t.loading || !t.id,
					onClick: () => {
						e.output.refresh();
					}
				}),
				/* @__PURE__ */ (0, U.jsx)(Ws, {
					id: "process-output-copy-button",
					label: "Copy to Clipboard",
					icon: "fa-regular fa-copy",
					onClick: () => {
						At(t.text, "Process output copied to clipboard", "No process output to copy");
					}
				}),
				/* @__PURE__ */ (0, U.jsx)(Ws, {
					id: "process-output-download-button",
					label: "Download .txt",
					icon: "fa-solid fa-download",
					onClick: () => tc(t.text, `process-${t.id}-output.txt`)
				})
			]
		}),
		t.error && /* @__PURE__ */ (0, U.jsx)("p", {
			role: "alert",
			children: t.error
		}),
		/* @__PURE__ */ (0, U.jsxs)("div", {
			className: "process-command-block",
			children: [/* @__PURE__ */ (0, U.jsxs)("div", {
				className: "process-command-header",
				children: [/* @__PURE__ */ (0, U.jsx)("span", { children: "Command" }), /* @__PURE__ */ (0, U.jsx)(Ws, {
					id: "process-output-command-copy",
					label: "Copy command",
					icon: "fa-regular fa-copy",
					onClick: () => {
						At(t.command, "Command copied to clipboard", "No command to copy");
					}
				})]
			}), /* @__PURE__ */ (0, U.jsx)("div", {
				id: "process-output-command",
				className: "process-command-text",
				children: t.command
			})]
		}),
		/* @__PURE__ */ (0, U.jsxs)("div", {
			className: "process-command-block",
			children: [/* @__PURE__ */ (0, U.jsx)("div", {
				className: "process-command-header",
				children: /* @__PURE__ */ (0, U.jsx)("span", { children: "Progress" })
			}), /* @__PURE__ */ (0, U.jsx)("div", {
				id: "process-output-progress",
				className: "process-command-text",
				children: t.progress || "No structured progress reported"
			})]
		}),
		/* @__PURE__ */ (0, U.jsxs)("div", {
			className: "process-command-block process-output-block",
			children: [/* @__PURE__ */ (0, U.jsx)("div", {
				className: "process-command-header",
				children: /* @__PURE__ */ (0, U.jsx)("span", { children: "Output" })
			}), /* @__PURE__ */ (0, U.jsx)(Ks, {
				id: "process-output-text",
				text: t.text
			})]
		})
	] });
}
function rc({ controller: e, close: t }) {
	let n = (0, w.useSyncExternalStore)(e.logs.subscribe, e.logs.getSnapshot), r = n.logs.filter((e) => e.prompt_metadata?.structured_output_used).length, i = n.logs.filter((e) => e.prompt_metadata?.structured_output_fallback).length;
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
		/* @__PURE__ */ (0, U.jsxs)("div", {
			className: "panel-header modal-header",
			children: [
				/* @__PURE__ */ (0, U.jsx)("h2", {
					id: "provider-logs-modal-title",
					children: "Provider Logs"
				}),
				/* @__PURE__ */ (0, U.jsx)("p", {
					id: "provider-logs-meta",
					children: n.loading ? "Loading logs..." : `Entries ${n.logs.length} | structured ${r} | fallback ${i} | bytes ${n.text.length}`
				}),
				/* @__PURE__ */ (0, U.jsx)(Ws, {
					id: "provider-logs-modal-close",
					className: "modal-close-btn",
					label: "Close dialog",
					icon: "fa-solid fa-xmark",
					onClick: t
				})
			]
		}),
		/* @__PURE__ */ (0, U.jsxs)("div", {
			className: "modal-actions",
			children: [
				/* @__PURE__ */ (0, U.jsx)("button", {
					id: "provider-logs-refresh-button",
					type: "button",
					disabled: n.loading,
					onClick: () => {
						e.actions.loadProviderLogs();
					},
					children: "Refresh"
				}),
				/* @__PURE__ */ (0, U.jsx)("button", {
					id: "provider-logs-copy-button",
					type: "button",
					onClick: () => {
						At(n.text, "Provider logs copied to clipboard", "No provider logs to copy");
					},
					children: "Copy to Clipboard"
				}),
				/* @__PURE__ */ (0, U.jsx)("button", {
					id: "provider-logs-download-button",
					type: "button",
					onClick: () => tc(n.text, `provider-logs-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.txt`),
					children: "Download .txt"
				})
			]
		}),
		n.error && /* @__PURE__ */ (0, U.jsx)("p", {
			role: "alert",
			children: n.error
		}),
		/* @__PURE__ */ (0, U.jsxs)("label", { children: ["Log Output", /* @__PURE__ */ (0, U.jsx)(Ks, {
			id: "provider-logs-text",
			text: n.text
		})] })
	] });
}
// src/activity/PanelCount.tsx
function ic({ name: e }) {
	let t = Rs[e], n = (0, w.useSyncExternalStore)(t.subscribe, () => t.getSnapshot().items.length), r = {
		processes: "process-count",
		approvals: "approval-count",
		decisions: "decision-count",
		scans: "scan-history-count",
		rationale: "decision-rationale-count"
	}[e], i = document.getElementById(r);
	return i ? (0, T.createPortal)(String(n), i) : null;
}
// src/activity/mount.tsx
function ac() {
	let e = new Us({
		applyOverview: Pt,
		refreshSnapshot: _s,
		setOutputOpen: ht,
		status: H
	}), t = (e) => {
		let t = document.querySelector(e);
		if (!t) throw Error(`Activity mount point missing: ${e}`);
		return t.replaceChildren(), t.dataset.framework = "react", t;
	}, n = [
		{
			node: t("#processes-body"),
			content: /* @__PURE__ */ (0, U.jsx)(qs, { controller: e })
		},
		{
			node: t(".ribbon-process-actions"),
			content: /* @__PURE__ */ (0, U.jsx)(Js, { controller: e })
		},
		{
			node: t("#approvals-body"),
			content: /* @__PURE__ */ (0, U.jsx)(Xs, { controller: e })
		},
		{
			node: t("#decisions-body"),
			content: /* @__PURE__ */ (0, U.jsx)(Zs, {})
		},
		{
			node: t("#scan-history-body"),
			content: /* @__PURE__ */ (0, U.jsx)(Qs, {})
		},
		{
			node: t("#decision-rationale-body"),
			content: /* @__PURE__ */ (0, U.jsx)(ec, {})
		},
		{
			node: t("#process-output-modal > .legion-modal"),
			content: /* @__PURE__ */ (0, U.jsx)(nc, { controller: e })
		},
		{
			node: t("#provider-logs-modal > .legion-modal"),
			content: /* @__PURE__ */ (0, U.jsx)(rc, {
				controller: e,
				close: Di
			})
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
		update: Bs,
		actions: e.actions
	}), a = (0, c.createRoot)(r);
	a.render(/* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [Object.keys(Rs).map((e) => /* @__PURE__ */ (0, U.jsx)(ic, { name: e }, e)), n.map(({ node: e, content: t }, n) => (0, T.createPortal)(t, e, String(n)))] })), window.addEventListener("pagehide", () => {
		i(), e.dispose(), a.unmount();
	}, { once: !0 });
}
// ../app/web/static/js/workspace/tool_settings.js
var oc;
function sc(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing tool_settings callback: ${t}`);
	({applySchedulerPreferences: oc} = e);
}
function cc(e, t = !1) {
	let n = document.getElementById("settings-tool-audit-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function lc(e, t = !1) {
	let n = document.getElementById("settings-tool-install-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function uc(e, t = !1) {
	let n = document.getElementById("interface-settings-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function dc(e) {
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
function fc(e) {
	let t = !!e;
	window.LEGION_COLORFUL_ASCII_BACKGROUND_ENABLED = t, document.body?.classList.toggle("colorful-background", t), L("interface-colorful-ascii-background", t), dc(t);
}
function pc(e) {
	let t = !!e, n = document.getElementById("graph-workspace-panel"), r = document.getElementById("graph-workspace-shell"), i = document.getElementById("graph-workspace-disabled-state");
	n && (n.dataset.graphEnabled = t ? "true" : "false", n.hidden = !t), r && (r.hidden = !t), i && (i.hidden = t), L("interface-graph-workspace-enabled", t), t ? as({ background: !1 }).catch(() => {}) : (A.loading = !1, ro());
}
function mc(e) {
	let t = !!e;
	je.panelEnabled = t;
	let n = document.getElementById("credential-capture-panel"), r = document.getElementById("ribbon-credential-capture-toggle-button");
	n && (n.hidden = !t), r && (r.setAttribute("aria-pressed", t ? "true" : "false"), r.classList.toggle("is-active", t), r.title = `${t ? "Hide" : "Show"} Responder / NTLM Relay panel`), L("interface-credential-capture-panel-enabled", t);
}
async function hc() {
	let e = !je.panelEnabled;
	qi(), H(`${e ? "Showing" : "Hiding"} Responder / NTLM Relay panel...`);
	try {
		let t = await W("/api/scheduler/preferences", { feature_flags: { credential_capture_panel: e } });
		oc(t), H(`Responder / NTLM Relay panel ${e ? "enabled" : "hidden"}`);
	} catch (e) {
		H(`Responder / NTLM Relay toggle failed: ${e.message}`, !0);
	}
}
function gc() {
	let e = document.getElementById("settings-tool-install-platform");
	return String(e?.value || j.recommendedPlatform || "kali").trim().toLowerCase() === "ubuntu" ? "ubuntu" : "kali";
}
function _c(e = "") {
	let t = document.getElementById("settings-tool-install-platform");
	if (!t) return "kali";
	let n = String(t.value || "").trim().toLowerCase(), r = String(e || j.recommendedPlatform || "kali").trim().toLowerCase();
	return t.dataset.userSelected === "true" && (n === "kali" || n === "ubuntu") ? n : r === "ubuntu" ? (t.value = "ubuntu", "ubuntu") : (t.value = "kali", "kali");
}
function vc(e) {
	j.plan = e || null;
	let t = e || {};
	I("settings-tool-install-script", String(t?.script || ""));
	let n = Number(t?.command_count || 0), r = Number(t?.manual_count || 0), i = String(t?.platform || gc() || "kali");
	if (!n && !r) {
		lc(`No missing tool installs are queued for ${i}.`);
		return;
	}
	let a = `${n} install command${n === 1 ? "" : "s"} queued for ${i}`;
	r > 0 && (a += `; ${r} tool${r === 1 ? "" : "s"} still require manual follow-up`), lc(a);
}
function yc(e) {
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
                <td><code>${ze(e?.kali_install || "-")}</code></td>
                <td><code>${ze(e?.ubuntu_install || "-")}</code></td>
            </tr>
        `;
	}).join("") : "<tr><td colspan=\"6\" class=\"empty-cell\">No tool audit data.</td></tr>";
}
async function bc() {
	cc("Checking tools...");
	try {
		let e = await Xe("/api/settings/tool-audit");
		yc(e?.tools || []), j.recommendedPlatform = String(e?.recommended_platform || "kali").trim().toLowerCase() === "ubuntu" ? "ubuntu" : "kali", j.supportedPlatforms = Array.isArray(e?.supported_platforms) && e.supported_platforms.length ? e.supported_platforms : ["kali", "ubuntu"], _c(j.recommendedPlatform);
		let t = e?.summary || {};
		cc(`Installed ${t.installed || 0}/${t.total || 0}; missing ${t.missing || 0}; configured missing ${t.configured_missing || 0}`), await xc(!1);
	} catch (e) {
		yc([]), vc(null), cc(`Tool audit failed: ${e.message}`, !0), lc(`Install plan unavailable: ${e.message}`, !0);
	}
}
async function xc(e = !0) {
	e && lc("Building install plan...");
	let t = gc();
	try {
		vc(await Xe(`/api/settings/tool-audit/install-plan?platform=${encodeURIComponent(t)}&scope=missing`) || {});
	} catch (e) {
		vc(null), lc(`Install plan failed: ${e.message}`, !0);
	}
}
async function Sc() {
	let e = String(z("settings-tool-install-script") || "");
	if (e.trim() || (await xc(!1), e = String(z("settings-tool-install-script") || "")), !e.trim()) lc("No install script is available to copy.", !0);
	else try {
		if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(e);
		else {
			let t = document.createElement("textarea");
			t.value = e, t.setAttribute("readonly", "readonly"), t.style.position = "absolute", t.style.left = "-9999px", document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t);
		}
		lc("Install script copied to clipboard.");
	} catch (e) {
		lc(`Copy failed: ${e.message}`, !0);
	}
}
async function Cc() {
	let e = gc();
	lc("Queueing install job...");
	try {
		let t = await W("/api/settings/tool-audit/install", {
			platform: e,
			scope: "missing"
		}), n = Number(t?.job?.id || 0);
		lc(n > 0 ? `Install queued as job #${n}. Use Logging > Jobs to monitor progress.` : "Install job queued. Use Logging > Jobs to monitor progress.");
	} catch (e) {
		lc(`Install failed to queue: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/credential_capture.js
function wc(e) {
	let t = document.getElementById("credentials-modal");
	t && (je.modalOpen = !!e, P.credentialsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Tc(e) {
	let t = document.getElementById("credential-capture-config-modal");
	t && (je.configModalOpen = !!e, P.credentialCaptureConfigOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function Ec(e) {
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
function Dc(e) {
	let t = e && typeof e == "object" ? e : {};
	je.panelEnabled = t.panel_enabled !== !1, je.responder = t.responder || {
		config: {},
		session: {}
	}, je.ntlmrelayx = t.ntlmrelayx || {
		config: {},
		session: {}
	}, F("credential-capture-count", Number(t.capture_count || 0)), F("credential-capture-hash-count", Number(t.unique_hash_count || 0)), F("credential-capture-responder-status", String(t?.responder?.session?.status || "Idle").trim() || "Idle"), F("credential-capture-ntlmrelayx-status", String(t?.ntlmrelayx?.session?.status || "Idle").trim() || "Idle"), I("credential-capture-responder-mode-quick", String(t?.responder?.config?.mode || "active").trim().toLowerCase() === "passive" ? "passive" : "active");
	let n = String(t?.responder?.config?.interface_name || "").trim(), r = (t?.responder?.session || {})?.progress?.summary || "";
	F("credential-capture-responder-meta", r ? `Interface: ${n || "not configured"} | ${r}` : `Interface: ${n || "not configured"}`);
	let i = t?.ntlmrelayx?.config || {}, a = String(i.target || i.targets_file || "").trim(), o = (t?.ntlmrelayx?.session || {})?.progress?.summary || "";
	F("credential-capture-ntlmrelayx-meta", o ? `Target: ${a || "not configured"} | ${o}` : `Target: ${a || "not configured"}`), Ec(t.recent_captures || []), mc(t.panel_enabled !== !1);
}
function Oc(e) {
	let t = e && typeof e == "object" ? e : {};
	je.captures = Array.isArray(t.captures) ? t.captures : [], je.dedupedHashes = Array.isArray(t.deduped_hashes) ? t.deduped_hashes : [], F("credentials-modal-meta", `${Number(t.capture_count || je.captures.length || 0)} captures | ${je.dedupedHashes.length} unique hashes`);
	let n = document.getElementById("credential-captures-body");
	if (n) {
		if (n.innerHTML = "", !je.captures.length) {
			let e = document.createElement("tr"), t = document.createElement("td");
			t.colSpan = 6, t.textContent = "No captured credentials yet.", e.appendChild(t), n.appendChild(e);
		} else je.captures.forEach((e) => {
			let t = document.createElement("tr");
			t.appendChild(B(e.capturedAt || "")), t.appendChild(B(e.tool || "")), t.appendChild(B(e.source || "")), t.appendChild(B(e.username || "")), t.appendChild(B(e.hash || "")), t.appendChild(B(e.details || "")), n.appendChild(t);
		});
	}
}
function kc(e, t = "") {
	let n = document.getElementById("credential-config-responder-interface");
	if (!n) return;
	let r = e && typeof e == "object" ? e : {}, i = Array.isArray(r.interfaces) ? r.interfaces : [], a = String(r.default_interface || "").trim(), o = String(t || a || "").trim();
	n.innerHTML = "";
	let s = document.createElement("option");
	s.value = "", s.textContent = i.length ? "Auto-detect primary interface" : "No interfaces detected", n.appendChild(s), i.forEach((e) => {
		let t = document.createElement("option");
		t.value = String(e?.name || "").trim(), t.textContent = String(e?.label || e?.name || "").trim(), n.appendChild(t);
	}), I("credential-config-responder-interface", o);
}
async function Ac() {
	let e = await Xe("/api/workspace/credential-capture");
	return Dc(e || {}), e || {};
}
async function jc() {
	try {
		Oc(await Xe("/api/workspace/credentials?limit=5000") || {}), wc(!0);
	} catch (e) {
		H(`Credential load failed: ${e.message}`, !0);
	}
}
async function Mc() {
	await At((je.dedupedHashes || []).join("\n"), "Deduped hashes copied to clipboard", "No captured hashes to copy");
}
function Nc(e = "txt") {
	let t = String(e || "txt").trim().toLowerCase() === "json" ? "json" : "txt";
	window.location.assign(`/api/workspace/credentials/download?format=${t}&t=${Date.now()}`);
}
function Pc(e, t) {
	let n = e && typeof e == "object" ? e : {}, r = n?.responder?.config || {}, i = n?.ntlmrelayx?.config || {};
	kc(t, r.interface_name || ""), I("credential-config-responder-mode", r.mode || "active"), L("credential-config-responder-wpad", r.wpad !== !1), L("credential-config-responder-force-wpad-auth", r.force_wpad_auth !== !1), L("credential-config-responder-proxy-auth", !!r.proxy_auth), L("credential-config-responder-dhcp", !!r.dhcp), L("credential-config-responder-dhcp-dns", !!r.dhcp_dns), L("credential-config-responder-basic-auth", !!r.basic_auth), I("credential-config-responder-extra-args", r.extra_args || ""), I("credential-config-ntlmrelayx-target", i.target || ""), I("credential-config-ntlmrelayx-targets-file", i.targets_file || ""), I("credential-config-ntlmrelayx-interface-ip", i.interface_ip || ""), L("credential-config-ntlmrelayx-smb2support", i.smb2support !== !1), L("credential-config-ntlmrelayx-interactive", !!i.interactive), L("credential-config-ntlmrelayx-socks", !!i.socks), L("credential-config-ntlmrelayx-output-hashes", i.output_hashes !== !1), I("credential-config-ntlmrelayx-extra-args", i.extra_args || "");
}
function Fc() {
	return {
		responder: {
			interface_name: z("credential-config-responder-interface").trim(),
			mode: z("credential-config-responder-mode").trim() || "active",
			wpad: R("credential-config-responder-wpad"),
			force_wpad_auth: R("credential-config-responder-force-wpad-auth"),
			proxy_auth: R("credential-config-responder-proxy-auth"),
			dhcp: R("credential-config-responder-dhcp"),
			dhcp_dns: R("credential-config-responder-dhcp-dns"),
			basic_auth: R("credential-config-responder-basic-auth"),
			extra_args: z("credential-config-responder-extra-args").trim()
		},
		ntlmrelayx: {
			target: z("credential-config-ntlmrelayx-target").trim(),
			targets_file: z("credential-config-ntlmrelayx-targets-file").trim(),
			interface_ip: z("credential-config-ntlmrelayx-interface-ip").trim(),
			smb2support: R("credential-config-ntlmrelayx-smb2support"),
			interactive: R("credential-config-ntlmrelayx-interactive"),
			socks: R("credential-config-ntlmrelayx-socks"),
			output_hashes: R("credential-config-ntlmrelayx-output-hashes"),
			extra_args: z("credential-config-ntlmrelayx-extra-args").trim()
		}
	};
}
async function Ic() {
	F("credential-capture-config-status", "Loading...");
	try {
		let [e, t] = await Promise.all([Xe("/api/workspace/credential-capture"), Xe("/api/network/interfaces")]);
		Dc(e || {}), Pc(e || {}, t || {}), F("credential-capture-config-status", "Loaded"), Tc(!0);
	} catch (e) {
		H(`Credential capture config load failed: ${e.message}`, !0);
	}
}
async function Lc(e) {
	e && e.preventDefault(), F("credential-capture-config-status", "Saving...");
	try {
		Dc(await W("/api/workspace/credential-capture/config", Fc()) || {}), F("credential-capture-config-status", "Saved");
	} catch (e) {
		F("credential-capture-config-status", `Save failed: ${e.message}`), H(`Credential capture config save failed: ${e.message}`, !0);
	}
}
async function Rc() {
	let e = String(z("credential-capture-responder-mode-quick") || "active").trim().toLowerCase() === "passive" ? "passive" : "active";
	try {
		Dc(await W("/api/workspace/credential-capture/config", { responder: { mode: e } }) || {}), H(`Responder mode set to ${e}`);
	} catch (e) {
		H(`Responder mode update failed: ${e.message}`, !0);
	}
}
function zc(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "responder" ? Number(je?.responder?.session?.process_id || 0) : t === "ntlmrelayx" ? Number(je?.ntlmrelayx?.session?.process_id || 0) : 0;
}
async function Bc(e) {
	let t = zc(e);
	t ? await Ct(t) : H(`No ${e} session log available`, !0);
}
function Vc(e) {
	let t = String(e || "").trim().toLowerCase();
	t && window.location.assign(`/api/workspace/credential-capture/log?tool=${encodeURIComponent(t)}&t=${Date.now()}`);
}
async function Hc(e) {
	try {
		H(`${e} queued (job ${(await W("/api/workspace/credential-capture/start", { tool: e }))?.job?.id || "?"})`), await _s(), await Ac();
	} catch (t) {
		H(`Start ${e} failed: ${t.message}`, !0);
	}
}
async function Uc(e) {
	try {
		(await W("/api/workspace/credential-capture/stop", { tool: e }))?.stopped ? H(`${e} stop requested`) : H(`${e} is not running`, !0), await _s(), await Ac();
	} catch (t) {
		H(`Stop ${e} failed: ${t.message}`, !0);
	}
}
// ../app/web/static/js/workspace/scan.js
var Wc;
function Gc(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing scan callback: ${t}`);
	({applySchedulerPreferences: Wc} = e);
}
function Kc(e) {
	return (e || "").split(/[\s,]+/).map((e) => e.trim()).filter((e) => e.length > 0);
}
function qc() {
	let e = document.querySelector("input[name='nmap-scan-mode']:checked");
	return e ? String(e.value || "rfc1918_discovery") : "rfc1918_discovery";
}
function Jc(e, t = "T3") {
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
function Yc(e, t = 1e3) {
	let n = parseInt(e, 10);
	return Number.isFinite(n) ? Math.min(65535, Math.max(1, n)) : t;
}
function Xc() {
	let e = qc(), t = /* @__PURE__ */ new Set();
	return e === "rfc1918_discovery" ? (R("nmap-rfc-10") && t.add("10.0.0.0/8"), R("nmap-rfc-172") && t.add("172.16.0.0/12"), R("nmap-rfc-192") && t.add("192.168.0.0/16"), Array.from(t)) : (Kc(z("nmap-targets")).forEach((e) => t.add(e)), Array.from(t));
}
function Zc() {
	let e = document.getElementById("nmap-rfc-profile");
	return (e ? String(e.value || "quick").trim().toLowerCase() : "quick") === "comprehensive" ? "comprehensive" : "quick";
}
function Qc(e) {
	return e === "comprehensive" ? _e : ge;
}
function $c() {
	let e = document.getElementById("nmap-rfc-chunk-concurrency"), t = parseInt(e ? String(e.value || "1").trim() : "1", 10);
	return Number.isFinite(t) ? Math.max(1, Math.min(t, 4)) : 1;
}
function el(e) {
	if (e === "easy") {
		let e = ti(ei());
		return {
			discovery: R("nmap-easy-discovery"),
			skip_dns: R("nmap-easy-skip-dns"),
			force_pn: R("nmap-easy-force-pn"),
			timing: Jc(z("nmap-easy-timing"), "T3"),
			top_ports: e ? 0 : Yc(z("nmap-easy-top-ports"), 1e3),
			explicit_ports: e ? ge : "",
			service_detection: R("nmap-easy-service-detection"),
			default_scripts: R("nmap-easy-default-scripts"),
			os_detection: R("nmap-easy-os-detection"),
			aggressive: !1,
			full_ports: !1,
			vuln_scripts: !1,
			host_discovery_only: !1,
			arp_ping: !1
		};
	}
	if (e === "hard") return {
		discovery: R("nmap-hard-discovery"),
		skip_dns: R("nmap-hard-skip-dns"),
		force_pn: R("nmap-hard-force-pn"),
		timing: Jc(z("nmap-hard-timing"), "T4"),
		top_ports: Yc(z("nmap-hard-top-ports"), 1e3),
		service_detection: R("nmap-hard-service-detection"),
		default_scripts: R("nmap-hard-default-scripts"),
		os_detection: R("nmap-hard-os-detection"),
		aggressive: R("nmap-hard-aggressive"),
		full_ports: R("nmap-hard-full-ports"),
		vuln_scripts: R("nmap-hard-vuln-scripts"),
		host_discovery_only: !1,
		arp_ping: !1
	};
	let t = R("nmap-rfc-host-discovery-only"), n = Zc();
	return {
		discovery: R("nmap-rfc-discovery"),
		host_discovery_only: t,
		skip_dns: R("nmap-rfc-skip-dns"),
		arp_ping: R("nmap-rfc-arp-ping"),
		force_pn: !1,
		timing: Jc(z("nmap-rfc-timing"), "T3"),
		top_ports: 0,
		explicit_ports: t ? "" : Qc(n),
		scan_profile: n,
		chunk_concurrency: $c(),
		service_detection: R("nmap-rfc-service-detection"),
		default_scripts: R("nmap-rfc-default-scripts"),
		os_detection: R("nmap-rfc-os-detection"),
		aggressive: !1,
		full_ports: !1,
		vuln_scripts: !1
	};
}
function tl() {
	return [
		R("nmap-rfc-10"),
		R("nmap-rfc-172"),
		R("nmap-rfc-192")
	].filter(Boolean).length;
}
function nl(e) {
	[
		"nmap-rfc-10",
		"nmap-rfc-172",
		"nmap-rfc-192"
	].forEach((t) => {
		let n = document.getElementById(t);
		n && (n.disabled = !e);
	});
}
function rl(e) {
	e === "rfc1918_discovery" ? (L("nmap-rfc-discovery", !0), L("nmap-rfc-host-discovery-only", !0), L("nmap-rfc-arp-ping", !1), L("nmap-rfc-skip-dns", !0), I("nmap-rfc-timing", "T3"), I("nmap-rfc-profile", "quick"), I("nmap-rfc-chunk-concurrency", "1"), L("nmap-rfc-service-detection", !1), L("nmap-rfc-default-scripts", !1), L("nmap-rfc-os-detection", !1), L("nmap-rfc-force-pn", !1), L("nmap-rfc-10", !0), L("nmap-rfc-172", !0), L("nmap-rfc-192", !0), nl(!0)) : (L("nmap-rfc-10", !1), L("nmap-rfc-172", !1), L("nmap-rfc-192", !1), L("nmap-rfc-force-pn", !1), nl(!1));
}
function il(e) {
	let t = document.getElementById(e);
	if (!t || t.disabled) return !0;
	let n = String(t.value || "").trim();
	if (!n) return !1;
	let r = parseInt(n, 10);
	return Number.isInteger(r) && r >= 1 && r <= 65535;
}
function al() {
	let e = qc();
	if (e === "passive_capture") {
		if (!ni(ei())) return {
			valid: !1,
			reason: "Passive Capture is available only for internal engagement presets."
		};
		if (!String(z("passive-capture-interface") || "").trim()) return {
			valid: !1,
			reason: "Select a capture interface."
		};
		let e = ri();
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
	let t = (e === "rfc1918_discovery" ? [] : Kc(z("nmap-targets"))).length > 0, n = e === "rfc1918_discovery" && tl() > 0;
	return !t && !n ? {
		valid: !1,
		reason: "Add targets, or select RFC1918 ranges in RFC1918 mode."
	} : Xc().length ? e === "easy" ? !ti(ei()) && !il("nmap-easy-top-ports") ? {
		valid: !1,
		reason: "Easy mode Top Ports must be 1-65535."
	} : {
		valid: !0,
		reason: ""
	} : e === "hard" && !R("nmap-hard-full-ports") && !il("nmap-hard-top-ports") ? {
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
function ol() {
	let e = document.getElementById("nmap-scan-button");
	if (!e) return;
	let t = al(), n = !Ne.postSubmitLock;
	e.disabled = !t.valid || !n, e.title = n ? t.valid ? "" : t.reason : "Enter scan inputs to enable this action.";
}
function sl(e) {
	let t = String(e || "").trim();
	return t ? (t.match(/(?:[^\s"'`]+|"[^"]*"|'[^']*')+/g) || []).map((e) => e.trim()).map((e) => e.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")).filter((e) => e.length > 0) : [];
}
function cl(e) {
	return (e || []).map((e) => {
		let t = String(e ?? "");
		return t ? /^[A-Za-z0-9_./:=@-]+$/.test(t) ? t : `'${t.replace(/'/g, "'\\''")}'` : "''";
	}).join(" ");
}
function ll() {
	let e = document.getElementById("nmap-command-preview");
	if (!e) return;
	let t = qc(), n = document.getElementById("nmap-scan-button"), r = document.getElementById("nmap-run-actions-label"), i = document.getElementById("nmap-args-label");
	if (n && (n.textContent = t === "passive_capture" ? "Start Passive Capture Job" : "Start Nmap Scan Job"), r && (r.lastChild.textContent = t === "passive_capture" ? " Run scripted actions after spawned Easy scans" : " Run scripted actions after scan"), i && (i.hidden = t === "passive_capture"), t === "passive_capture") {
		e.textContent = `Command Preview: ${cl([
			"tshark",
			"-i",
			String(z("passive-capture-interface") || "<interface>").trim() || "<interface>",
			"-n",
			"-q",
			"-a",
			`duration:${ri() * 60}`,
			"-f",
			"arp or broadcast or multicast or udp port 67 or udp port 68 or udp port 137 or udp port 138 or udp port 5353 or udp port 5355 or udp port 1900",
			"-w",
			"<output_prefix>.pcapng"
		])}  |  Then queue Easy scans for discovered internal networks`, ol();
		return;
	}
	let a = Xc(), o = el(t), s = sl(z("nmap-args").trim()), c = s.some((e) => {
		let t = String(e || "").trim().toLowerCase();
		return t === "--stats-every" || t.startsWith("--stats-every=");
	}), l = s.some((e) => {
		let t = String(e || "").trim().toLowerCase();
		return t === "-v" || t === "-vv" || t === "-vvv" || t === "--verbose";
	}), u = a.length ? a : ["<targets>"], d = ["nmap"];
	o.host_discovery_only ? (d.push("-sn"), o.skip_dns && d.push("-n"), o.arp_ping && d.push("-PR"), d.push(`-${Jc(o.timing, "T3")}`)) : ((o.force_pn || !o.discovery) && d.push("-Pn"), o.skip_dns && d.push("-n"), d.push(`-${Jc(o.timing, "T3")}`), o.full_ports ? d.push("-p-") : String(o.explicit_ports || "").trim() ? d.push("-p", String(o.explicit_ports || "").trim()) : d.push("--top-ports", String(Yc(o.top_ports, 1e3))), o.aggressive ? d.push("-A") : (o.service_detection && d.push("-sV"), o.default_scripts && d.push("-sC"), o.os_detection && d.push("-O")), o.vuln_scripts && d.push("--script", "vuln"));
	let f = c ? s : [
		...s,
		"--stats-every",
		"15s"
	];
	l || (f = [...f, "-vv"]), d.push(...f, ...u, "-oA", "<output_prefix>"), e.textContent = `Command Preview: ${cl(d)}`, ol();
}
function ul() {
	let e = ei(), t = ti(e), n = e !== Ne.lastEngagementPreset, r = document.getElementById("nmap-easy-top-ports"), i = document.getElementById("nmap-easy-top-ports-label"), a = document.getElementById("nmap-easy-preset-note"), o = document.getElementById("nmap-easy-service-detection"), s = document.getElementById("nmap-easy-default-scripts");
	n && (o && (o.checked = !t), s && (s.checked = !t)), r && (r.disabled = t), i && (i.hidden = t), a && (a.hidden = !t, a.textContent = t ? `Internal Quick Recon uses a curated TCP port list instead of Top Ports: ${ge}. Add UDP-specific follow-up separately if needed.` : ""), Ne.lastEngagementPreset = e;
}
function dl(e) {
	let t = Math.max(1, Math.min(4, parseInt(e, 10) || 1));
	Ne.step = t, [
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
	n && (n.disabled = t <= 1), r && (r.disabled = t >= 4, r.style.display = t >= 4 ? "none" : ""), ol();
}
function fl() {
	let e = qc();
	e !== Ne.lastMode && (rl(e), Ne.lastMode = e), document.querySelectorAll("[data-mode-options]").forEach((t) => {
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
	i && (i.disabled = R("nmap-hard-full-ports"));
	let a = R("nmap-rfc-host-discovery-only"), o = document.getElementById("nmap-rfc-discovery");
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
		let e = Zc(), t = $c(), n = e === "comprehensive" ? "More comprehensive uses a broader common-internal-services TCP list" : "Quick uses the curated low-hanging-fruit TCP list", r = Qc(e), i = `${t} chunk scan${t === 1 ? "" : "s"} at a time`;
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
	ul(), ll(), ol();
}
async function pl() {
	if (Ne.postSubmitLock) {
		V("Scan failed: enter scan inputs before starting a job.", !0), ol();
		return;
	}
	let e = al();
	if (!e.valid) {
		V(`Scan failed: ${e.reason}`, !0);
		let t = String(e.reason || "").toLowerCase();
		t.includes("target") || t.includes("rfc1918") || t.includes("interface") ? dl(3) : dl(4);
		return;
	}
	let t = Xc(), n = qc(), r = el(n), i = !!r.discovery, a = ii(ei(), { fallbackGoalProfile: z("scheduler-goal-select") || "internal_recon" });
	V("Queueing Nmap scan job...");
	try {
		let e = await W("/api/scheduler/preferences", {
			engagement_policy: a,
			goal_profile: Gr(a)
		});
		Wc(e);
		let o = (n === "passive_capture" ? await W("/api/scan/passive-capture", {
			interface_name: z("passive-capture-interface").trim(),
			duration_minutes: ri(),
			run_actions: R("nmap-run-actions"),
			scan_mode: n
		}) : await W("/api/nmap/scan", {
			targets: t,
			discovery: i,
			staged: !1,
			run_actions: R("nmap-run-actions"),
			nmap_path: "nmap",
			nmap_args: z("nmap-args").trim(),
			scan_mode: n,
			scan_options: r
		}))?.job?.id;
		V(o ? `${n === "passive_capture" ? "Passive capture" : "Nmap scan"} queued (job ${o})` : n === "passive_capture" ? "Passive capture queued" : "Nmap scan queued"), Si(), I("nmap-targets", ""), Ne.postSubmitLock = !0, dl(1), ll(), ol(), await _s();
	} catch (e) {
		V(`Scan failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/scheduler_preferences.js
function ml(e) {
	if (!e) return;
	let t = hl(e.feature_flags), n = Ur(e.engagement_policy, e.goal_profile || "internal_asset_discovery");
	F("scheduler-mode", e.mode || ""), F("scheduler-goal", n.preset_label || n.preset || e.goal_profile || ""), F("scheduler-families", e.preapproved_families_count || 0), I("scheduler-mode-select", e.mode || "deterministic"), I("scheduler-goal-select", n.preset || "internal_recon"), I("engagement-scope-select", n.scope || "internal"), I("engagement-intent-select", n.intent || "recon"), _l(), L("engagement-allow-exploitation", !!n.allow_exploitation), L("engagement-allow-lateral", !!n.allow_lateral_movement), I("engagement-credential-mode", n.credential_attack_mode || "blocked"), I("engagement-lockout-mode", n.lockout_risk_mode || "blocked"), I("engagement-stability-mode", n.stability_risk_mode || "approval"), I("engagement-detection-mode", n.detection_risk_mode || "low"), I("engagement-approval-mode", n.approval_mode || "risky"), gl(t, n.runner_preference || "local"), I("engagement-noise-budget", n.noise_budget || "low"), I("scheduler-provider-select", e.provider || "none"), I("scheduler-concurrency-input", String(e.max_concurrency || 1)), I("scheduler-host-concurrency-input", String(e.max_host_concurrency || 1)), I("scheduler-max-jobs-input", String(e.max_jobs || 200));
	let r = e.providers || {}, i = e.integrations || {}, a = r.lm_studio || {}, o = r.openai || {}, s = r.claude || {}, c = i.grayhatwarfare || {}, l = i.chaos || {}, u = i.shodan || {};
	k.deviceCategoryRules = Array.isArray(e.device_categories) ? e.device_categories : [], k.builtInDeviceCategories = Array.isArray(e.built_in_device_categories) ? e.built_in_device_categories : [];
	let d = e.ai_feedback || {}, f = e.project_report_delivery || {}, p = f.mtls || {};
	I("provider-lmstudio-baseurl", a.base_url || ""), I("provider-lmstudio-model", a.model || ""), I("provider-lmstudio-apikey", "");
	let m = document.getElementById("provider-lmstudio-apikey");
	m && (m.placeholder = a.api_key_configured ? "Configured. Enter a new LM Studio API key to replace it" : "Enter a new LM Studio API key"), I("provider-openai-baseurl", o.base_url || ""), I("provider-openai-model", o.model || ""), I("provider-openai-apikey", "");
	let h = document.getElementById("provider-openai-apikey");
	h && (h.placeholder = o.api_key_configured ? "Configured. Enter a new OpenAI API key to replace it" : "Enter a new OpenAI API key"), L("provider-openai-structured-outputs", !!o.structured_outputs), I("provider-claude-baseurl", s.base_url || ""), I("provider-claude-model", s.model || ""), I("provider-claude-apikey", "");
	let g = document.getElementById("provider-claude-apikey");
	g && (g.placeholder = s.api_key_configured ? "Configured. Enter a new Claude API key to replace it" : "Enter a new Claude API key"), I("scheduler-integration-grayhatwarfare-apikey", "");
	let _ = document.getElementById("scheduler-integration-grayhatwarfare-apikey");
	_ && (_.placeholder = c.api_key_configured ? "Configured. Enter a new Grayhat Warfare API key to replace it" : "Enter a new Grayhat Warfare API key"), I("scheduler-integration-chaos-apikey", "");
	let v = document.getElementById("scheduler-integration-chaos-apikey");
	v && (v.placeholder = l.api_key_configured ? "Configured. Enter a new Chaos API key to replace it" : "Enter a new Chaos API key"), I("scheduler-integration-shodan-apikey", "");
	let y = document.getElementById("scheduler-integration-shodan-apikey");
	y && (y.placeholder = u.api_key_configured ? "Configured. Enter a new Shodan API key to replace it" : "Enter a new Shodan API key"), L("scheduler-ai-feedback-enabled", d.enabled !== !1), I("scheduler-ai-max-rounds", String(d.max_rounds_per_target || 5)), I("scheduler-ai-max-actions", String(d.max_actions_per_round || 6)), I("scheduler-ai-recent-output-chars", String(d.recent_output_chars || 900)), L("scheduler-ai-reflection-enabled", d.reflection_enabled !== !1), I("scheduler-ai-stall-rounds", String(d.stall_rounds_without_progress || 2)), I("scheduler-ai-repeat-threshold", String(d.stall_repeat_selection_threshold || 2)), I("scheduler-ai-max-reflections", String(d.max_reflections_per_target || 1)), pc(t.graph_workspace !== !1), mc(t.credential_capture_panel !== !1), L("interface-graph-workspace-enabled", t.graph_workspace !== !1), L("interface-credential-capture-panel-enabled", t.credential_capture_panel !== !1), L("feature-context-summary-enabled", t.context_summary_enabled !== !1), L("feature-scheduler-prompt-profiles", t.scheduler_prompt_profiles !== !1), L("feature-scheduler-web-followup-sidecar", !!t.scheduler_web_followup_sidecar), I("project-report-provider-name", f.provider_name || ""), I("project-report-endpoint", f.endpoint || ""), I("project-report-method", f.method || "POST"), I("project-report-format", f.format || "json"), I("project-report-timeout", String(f.timeout_seconds || 30)), L("project-report-mtls-enabled", p.enabled), I("project-report-mtls-cert", p.client_cert_path || ""), I("project-report-mtls-key", p.client_key_path || ""), I("project-report-mtls-ca", p.ca_cert_path || ""), I("project-report-headers", JSON.stringify(f.headers || {}, null, 2));
	let b = new Set(e.dangerous_categories || []);
	[
		"exploit_execution",
		"credential_bruteforce",
		"network_flooding",
		"destructive_write_actions"
	].forEach((e) => {
		L(`danger-${e}`, b.has(e));
	}), vl(e.provider || "none"), zr();
}
function hl(e) {
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
function gl(e, t) {
	let n = hl(e), r = document.getElementById("engagement-runner-preference"), i = new Set(n.optional_runners ? [] : ["container", "browser"]);
	if (!r) return;
	Array.from(r.options).forEach((e) => {
		let t = String(e?.value || "").trim().toLowerCase();
		e.disabled = i.has(t), e.textContent = e.disabled ? `${t} (disabled)` : t;
	});
	let a = String(t || "local").trim().toLowerCase();
	i.has(a) ? I("engagement-runner-preference", "local") : I("engagement-runner-preference", a || "local");
}
function _l() {
	let e = String(z("scheduler-goal-select") || "internal_recon").trim().toLowerCase(), t = e === "custom", n = t ? {
		scope: z("engagement-scope-select") || "internal",
		intent: z("engagement-intent-select") || "recon"
	} : Hr(e);
	t || (I("engagement-scope-select", n.scope || "internal"), I("engagement-intent-select", n.intent || "recon")), F("engagement-derived-scope", n.scope || "internal"), F("engagement-derived-intent", n.intent || "recon");
	let r = document.getElementById("engagement-preset-summary");
	r && (r.textContent = Kr(e, t));
	let i = document.getElementById("engagement-custom-scope-label"), a = document.getElementById("engagement-custom-intent-label"), o = document.getElementById("engagement-custom-note"), s = document.getElementById("engagement-scope-select"), c = document.getElementById("engagement-intent-select");
	[
		i,
		a,
		o
	].forEach((e) => {
		e && (e.hidden = !t);
	}), s && (s.disabled = !t), c && (c.disabled = !t), ul(), document.getElementById("nmap-command-preview") && ll();
}
function vl(e) {
	let t = String(e || "none").trim().toLowerCase();
	document.querySelectorAll(".scheduler-provider-field[data-scheduler-provider]").forEach((e) => {
		let n = String(e.getAttribute("data-scheduler-provider") || "").trim().toLowerCase();
		e.classList.toggle("is-active", n === t);
	});
}
function yl() {
	let e = z("scheduler-mode-select"), t = String(z("scheduler-goal-select") || "internal_recon").trim().toLowerCase(), n = Hr(t), r = z("scheduler-provider-select"), i = parseInt(z("scheduler-concurrency-input"), 10), a = Number.isFinite(i) ? Math.max(1, Math.min(16, i)) : 1, o = parseInt(z("scheduler-host-concurrency-input"), 10), s = Number.isFinite(o) ? Math.max(1, Math.min(8, o)) : 1, c = parseInt(z("scheduler-max-jobs-input"), 10), l = Number.isFinite(c) ? Math.max(20, Math.min(2e3, c)) : 200, u = parseInt(z("scheduler-ai-max-rounds"), 10), d = Number.isFinite(u) ? Math.max(1, Math.min(12, u)) : 5, f = parseInt(z("scheduler-ai-max-actions"), 10), p = Number.isFinite(f) ? Math.max(1, Math.min(8, f)) : 6, m = parseInt(z("scheduler-ai-recent-output-chars"), 10), h = Number.isFinite(m) ? Math.max(320, Math.min(4e3, m)) : 900, g = parseInt(z("scheduler-ai-stall-rounds"), 10), _ = Number.isFinite(g) ? Math.max(1, Math.min(6, g)) : 2, v = parseInt(z("scheduler-ai-repeat-threshold"), 10), y = Number.isFinite(v) ? Math.max(1, Math.min(8, v)) : 2, b = parseInt(z("scheduler-ai-max-reflections"), 10), x = Number.isFinite(b) ? Math.max(0, Math.min(4, b)) : 1, S = [
		"exploit_execution",
		"credential_bruteforce",
		"network_flooding",
		"destructive_write_actions"
	].filter((e) => R(`danger-${e}`)), C = {
		lm_studio: {
			enabled: r === "lm_studio",
			base_url: z("provider-lmstudio-baseurl"),
			model: z("provider-lmstudio-model")
		},
		openai: {
			enabled: r === "openai",
			base_url: z("provider-openai-baseurl"),
			model: z("provider-openai-model"),
			structured_outputs: R("provider-openai-structured-outputs")
		},
		claude: {
			enabled: r === "claude",
			base_url: z("provider-claude-baseurl"),
			model: z("provider-claude-model")
		}
	};
	r === "lm_studio" ? (C.lm_studio.base_url = C.lm_studio.base_url || "http://127.0.0.1:1234/v1", C.lm_studio.model = C.lm_studio.model || "o3-7b") : r === "openai" && (C.openai.base_url = C.openai.base_url || "https://api.openai.com/v1", C.openai.model = C.openai.model || "gpt-4.1-mini");
	let w = z("provider-lmstudio-apikey").trim(), T = z("provider-openai-apikey").trim(), E = z("provider-claude-apikey").trim();
	w && (C.lm_studio.api_key = w), T && (C.openai.api_key = T), E && (C.claude.api_key = E);
	let D = {
		grayhatwarfare: {},
		chaos: {},
		shodan: {}
	}, O = z("scheduler-integration-grayhatwarfare-apikey").trim();
	O && (D.grayhatwarfare.api_key = O);
	let ee = z("scheduler-integration-chaos-apikey").trim();
	ee && (D.chaos.api_key = ee);
	let te = z("scheduler-integration-shodan-apikey").trim();
	te && (D.shodan.api_key = te);
	let ne = document.getElementById("interface-graph-workspace-enabled"), re = ne ? !!ne.checked : Xt(), ie = document.getElementById("interface-credential-capture-panel-enabled"), ae = ie ? !!ie.checked : !!je.panelEnabled, oe = Ur({
		preset: t,
		scope: t === "custom" ? z("engagement-scope-select") : n.scope,
		intent: t === "custom" ? z("engagement-intent-select") : n.intent,
		allow_exploitation: R("engagement-allow-exploitation"),
		allow_lateral_movement: R("engagement-allow-lateral"),
		credential_attack_mode: z("engagement-credential-mode"),
		lockout_risk_mode: z("engagement-lockout-mode"),
		stability_risk_mode: z("engagement-stability-mode"),
		detection_risk_mode: z("engagement-detection-mode"),
		approval_mode: z("engagement-approval-mode"),
		runner_preference: z("engagement-runner-preference"),
		noise_budget: z("engagement-noise-budget"),
		custom_overrides: {}
	}, t);
	return {
		mode: e,
		goal_profile: Gr(oe),
		engagement_policy: oe,
		provider: r,
		max_concurrency: a,
		max_host_concurrency: s,
		max_jobs: l,
		ai_feedback: {
			enabled: R("scheduler-ai-feedback-enabled"),
			max_rounds_per_target: d,
			max_actions_per_round: p,
			recent_output_chars: h,
			reflection_enabled: R("scheduler-ai-reflection-enabled"),
			stall_rounds_without_progress: _,
			stall_repeat_selection_threshold: y,
			max_reflections_per_target: x
		},
		dangerous_categories: S,
		feature_flags: {
			graph_workspace: re,
			credential_capture_panel: ae,
			context_summary_enabled: R("feature-context-summary-enabled"),
			scheduler_prompt_profiles: R("feature-scheduler-prompt-profiles"),
			scheduler_web_followup_sidecar: R("feature-scheduler-web-followup-sidecar")
		},
		providers: C,
		integrations: D
	};
}
function bl() {
	let e = String(z("project-report-method") || "POST").toUpperCase(), t = String(z("project-report-format") || "json").toLowerCase() === "md" ? "md" : "json", n = parseInt(z("project-report-timeout"), 10), r = Number.isFinite(n) ? Math.max(5, Math.min(300, n)) : 30, i = {}, a = String(z("project-report-headers") || "").trim();
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
		provider_name: z("project-report-provider-name"),
		endpoint: z("project-report-endpoint"),
		method: [
			"POST",
			"PUT",
			"PATCH"
		].includes(e) ? e : "POST",
		format: t,
		headers: i,
		timeout_seconds: r,
		mtls: {
			enabled: R("project-report-mtls-enabled"),
			client_cert_path: z("project-report-mtls-cert"),
			client_key_path: z("project-report-mtls-key"),
			ca_cert_path: z("project-report-mtls-ca")
		}
	};
}
async function xl() {
	try {
		let e = await fetch("/api/scheduler/preferences");
		if (!e.ok) return;
		ml(await e.json());
	} catch {}
}
async function Sl(e) {
	e.preventDefault();
	let t = document.getElementById("scheduler-save-status");
	t && (t.textContent = "Saving...");
	let n;
	try {
		n = yl();
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
		ml(await e.json()), t && (t.textContent = "Saved");
	} catch {
		t && (t.textContent = "Save failed");
	}
}
async function Cl(e) {
	e && e.preventDefault();
	let t = document.getElementById("report-provider-save-status");
	t && (t.textContent = "Saving...");
	let n;
	try {
		n = bl();
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
		ml(await e.json()), t && (t.textContent = "Saved"), V("Report provider settings saved");
	} catch {
		t && (t.textContent = "Save failed");
	}
}
async function wl(e) {
	e && e.preventDefault();
	let t = document.getElementById("scheduler-save-status");
	t && (t.textContent = "Testing provider...");
	let n;
	try {
		n = yl();
	} catch (e) {
		t && (t.textContent = e.message || "Provider test failed");
		return;
	}
	try {
		let e = await W("/api/scheduler/provider/test", n);
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
var Tl = class {
	connect() {
		this.connected ||= (Ir({ applySchedulerPreferences: ml }), di({
			openManualToolPicker: Ja,
			pollSnapshot: _s
		}), Yt({
			graphRenderWorkspace: Ho,
			graphSyncDetailPresentation: oo
		}), no({ graphRenderWorkspace: Ho }), fa({ pollSnapshot: _s }), qn({
			closeRibbonMenus: qi,
			graphLoadSnapshot: as,
			loadHostDetail: Ar,
			loadWorkspaceHosts: Dr,
			loadWorkspaceServices: Or,
			renderHosts: Jo,
			renderServices: Xo
		}), us({ renderCredentialCapturePanel: Dc }), ut({
			setCredentialCaptureConfigModalOpen: Tc,
			setCredentialsModalOpen: wc
		}), Gc({ applySchedulerPreferences: ml }), Qr({
			applyNmapModeTargetDefaults: rl,
			refreshNmapModeOptions: fl,
			refreshNmapScanButtonState: ol,
			setNmapWizardStep: dl,
			updateNmapCommandPreview: ll
		}), sc({ applySchedulerPreferences: ml }), La({ pollSnapshot: _s }), wr({
			graphLoadSnapshot: as,
			renderHosts: Jo,
			renderServices: Xo,
			renderTools: ns
		}), !0);
	}
};
// ../app/web/static/js/workspace/graph_actions.js
function El(e) {
	let t = (A.layouts || []).find((t) => String(t?.layout_id || "") === String(e || ""));
	A.activeLayoutId = String(t?.layout_id || ""), A.positions = t?.layout?.positions && typeof t.layout.positions == "object" ? { ...t.layout.positions } : {}, A.pinnedNodeIds = t?.layout?.pinned_node_ids && typeof t.layout.pinned_node_ids == "object" ? { ...t.layout.pinned_node_ids } : {}, t?.layout?.group_by && I("graph-group-select", t.layout.group_by), t?.name && I("graph-layout-name", t.name), Dn(), Ho();
}
function Dl() {
	let e = Bo(A.data), t = /* @__PURE__ */ new Map();
	if ((e.nodes || []).forEach((n) => {
		let r = ho(n, A.groupBy || Tn().defaultGroup || "subnet", mo(e.nodes)) || "other";
		t.has(r) || t.set(r, []), t.get(r).push(n);
	}), !Array.isArray(e?.nodes) || !e.nodes.length || !t.size) {
		K("No graph nodes are available to tidy.", !0);
		return;
	}
	let n = Eo(e.nodes, e.edges, t, A.groupBy || Tn().defaultGroup || "subnet", {});
	Object.entries(n.positions || {}).forEach(([e, t]) => {
		A.positions[e] = {
			x: Number(t?.x) || 0,
			y: Number(t?.y) || 0
		};
	}), Ho({ preserveDetail: !0 }), K(`Layout tidied for ${e.nodes.length} nodes across ${(n.groups || []).length} groups`);
}
function Ol() {
	if (A.selectedKind !== "node" || !A.selectedRef) {
		K("Select a node or summary before focusing the neighborhood.", !0), lo();
		return;
	}
	let e = rn(), t = Do(e);
	t.length ? (A.focusSeedNodeIds = t, A.focusSeedLabel = String(e?.label || e?.node_id || "selection"), A.focusDepth = Math.max(1, Math.min(3, parseInt(z("graph-focus-depth-select"), 10) || A.focusDepth || 1)), q(e, "summary_kind") && (A.selectedKind = "node", A.selectedRef = t[0]), Ho(), lo(), K(`Focused ${A.focusDepth}-hop neighborhood around ${A.focusSeedLabel}`)) : (K("The selected graph node cannot be focused.", !0), lo());
}
function kl() {
	A.focusSeedNodeIds.length ? (A.focusSeedNodeIds = [], A.focusSeedLabel = "", Ho(), lo(), K("Graph focus cleared")) : (K("No graph focus is active.", !0), lo());
}
function Al() {
	if (A.selectedKind !== "node" || !A.selectedRef) {
		K("Select a summary node before expanding it.", !0), lo();
		return;
	}
	let e = rn();
	if (!q(e, "summary_kind")) {
		K("Selected node is already expanded.", !0), lo();
		return;
	}
	let t = String(e?.node_id || "");
	A.expandedSummaryIds[t] ? (delete A.expandedSummaryIds[t], A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = null, K(`Collapsed ${e.label || t}`)) : (A.expandedSummaryIds[t] = !0, A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = e, K(`Expanded ${e.label || t}`)), Ho(), lo();
}
function jl() {
	let e = rn(), t = String(e?.node_id || "");
	!q(e, "summary_kind") || !t || !A.expandedSummaryIds[t] ? (K("Select an expanded summary cluster to collapse.", !0), lo()) : (delete A.expandedSummaryIds[t], A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = null, Ho(), lo(), K(`Collapsed ${e.label || t}`));
}
async function Ml() {
	let e = String(z("graph-view-select") || A.viewId || "attack_surface").trim(), t = String(z("graph-layout-name") || "default").trim() || "default", n = String(A.activeLayoutId || ""), r = {
		positions: A.filtered?.positions && typeof A.filtered.positions == "object" ? A.filtered.positions : A.positions,
		pinned_node_ids: A.pinnedNodeIds,
		group_by: String(z("graph-group-select") || A.groupBy || Tn().defaultGroup || "subnet").trim(),
		filters: {
			view_id: e,
			host_id: z("graph-host-filter"),
			node_type: z("graph-node-type-filter"),
			edge_type: z("graph-edge-type-filter"),
			source_kind: z("graph-source-kind-filter"),
			severity: z("graph-severity-filter"),
			pack: z("graph-pack-filter"),
			time_window: z("graph-time-window-filter"),
			hide_ai_suggested: R("graph-hide-ai-suggested"),
			hide_nmap_xml_artifacts: R("graph-hide-nmap-xml-artifacts"),
			min_confidence: z("graph-min-confidence")
		}
	};
	try {
		let i = (await W("/api/graph/layouts", {
			layout_id: n,
			view_id: e,
			name: t,
			layout: r
		}))?.layout || {};
		A.layouts = (A.layouts || []).filter((e) => String(e?.layout_id || "") !== String(i.layout_id || "")), A.layouts.push(i), A.activeLayoutId = String(i.layout_id || ""), Dn(), I("graph-layout-select", A.activeLayoutId), K(`Layout saved: ${i.name || t}`);
	} catch (e) {
		K(`Layout save failed: ${e.message}`, !0);
	}
}
function Nl() {
	A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, I("graph-layout-select", ""), Ho(), K("Layout reset");
}
async function Pl() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || ""), n = String(z("graph-note-input") || "").trim();
	if (!e || !t) K("Select a node or edge before saving a note.", !0);
	else if (!n) K("Note text is required.", !0);
	else try {
		let r = (await W("/api/graph/annotations", {
			target_kind: e,
			target_ref: t,
			body: n,
			created_by: "web-operator",
			source_ref: `graph-workspace:${A.viewId}`
		}))?.annotation || {};
		A.annotations = (A.annotations || []).filter((e) => String(e?.annotation_id || "") !== String(r.annotation_id || "")), A.annotations.push(r), I("graph-note-input", ""), Mi(!1), uo(), K("Note saved");
	} catch (e) {
		K(`Note save failed: ${e.message}`, !0);
	}
}
function Fl() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || "");
	if (!e || !t) {
		K("Select a node or edge before adding a note.", !0);
		return;
	}
	let n = Kt(e === "node" ? "node" : "edge", t), r = String(n?.label || n?.edge_id || t || "").trim() || "selected item";
	F("graph-note-modal-target", `Target: ${fn(e)} | ${r}`), xi(!0);
}
function Il() {
	let e = A.selectedKind === "node" ? Kt("node", A.selectedRef) : null;
	if (!e) {
		K("Select a node to pin or unpin.", !0);
		return;
	}
	let t = String(e.node_id || "");
	if (A.pinnedNodeIds[t]) delete A.pinnedNodeIds[t], K(`Node unpinned: ${e.label || t}`);
	else {
		let n = A.filtered.positions?.[t] || A.positions?.[t];
		n && (A.positions[t] = {
			x: n.x,
			y: n.y
		}), A.pinnedNodeIds[t] = !0, K(`Node pinned: ${e.label || t}`);
	}
	Ho();
}
// ../app/web/static/js/workspace/interface_settings.js
function Ll(e) {
	let t = document.getElementById("interface-settings-modal");
	t && (P.interfaceSettingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
async function Rl() {
	uc("Loading interface settings...");
	try {
		let [e, t] = await Promise.all([Xe("/api/scheduler/preferences"), Xe("/api/settings/display")]), n = hl(e?.feature_flags), r = n.graph_workspace;
		L("interface-graph-workspace-enabled", r), L("interface-credential-capture-panel-enabled", n.credential_capture_panel), L("interface-colorful-ascii-background", !!t?.colorful_ascii_background), uc("Interface settings loaded");
	} catch (e) {
		uc(`Load failed: ${e.message}`, !0);
	}
}
async function zl() {
	let e = R("interface-graph-workspace-enabled"), t = R("interface-credential-capture-panel-enabled"), n = R("interface-colorful-ascii-background");
	uc("Saving interface settings...");
	try {
		let [r, i] = await Promise.all([W("/api/scheduler/preferences", { feature_flags: {
			graph_workspace: e,
			credential_capture_panel: t
		} }), W("/api/settings/display", { colorful_ascii_background: n })]);
		ml(r), fc(!!i?.colorful_ascii_background), uc("Interface settings saved");
	} catch (e) {
		uc(`Save failed: ${e.message}`, !0);
	}
}
async function Bl() {
	qi(), Gi(!0), await Promise.allSettled([bc()]);
}
function Vl() {
	Gi(!1);
}
async function Hl() {
	qi(), Ll(!0), await Rl();
}
function Ul() {
	Ll(!1);
}
// ../app/web/static/js/workspace/projects.js
async function Wl() {
	qi();
	let e = z("project-open-path").trim();
	if (!e) {
		let t = window.prompt("Enter existing project path (.legion):", "");
		if (e = String(t || "").trim(), !e) return;
		I("project-open-path", e);
	}
	await uu();
}
async function Gl(e = !1) {
	qi();
	let t = z("project-save-path").trim();
	if (e || !t) {
		let e = String(z("project-name") || "").trim(), n = window.prompt("Enter destination path (.legion):", e);
		if (t = String(n || "").trim(), !t) return;
		I("project-save-path", t);
	}
	await du();
}
async function Kl() {
	qi(), z("project-save-path").trim() ? await du() : V("Save failed: no destination path is set. Use Save As.", !0);
}
async function ql() {
	await Gl(!0);
}
function Jl() {
	qi(), window.location.assign(`/api/project/download-zip?t=${Date.now()}`);
}
async function Yl() {
	qi(), await ou("restoring a workspace bundle", async () => {
		let e = document.getElementById("project-restore-zip-file");
		e ? (e.value = "", e.click()) : V("Restore failed: ZIP input control missing.", !0);
	});
}
async function Xl(e) {
	let t = e?.target, n = t?.files && t.files.length ? t.files[0] : null;
	if (n) {
		V(`Uploading restore bundle (${n.name})...`);
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
				V(`Restore queued (job ${i})...`);
				let e = await Er(i, 12e5, 1500), t = String(e?.result?.project?.name || "").trim();
				t && (I("project-save-path", t), I("project-open-path", t));
			}
			V("Workspace restored"), Wo({ clearProjectPaths: !1 }), await jr(), await Promise.all([_s(), Gt()]);
		} catch (e) {
			V(`Restore failed: ${e.message}`, !0);
		} finally {
			t && (t.value = "");
		}
	}
}
async function Zl() {
	qi();
	let e = z("nmap-xml-path").trim();
	if (!e) {
		let t = window.prompt("Enter Nmap XML path:", "");
		if (e = String(t || "").trim(), !e) return;
		I("nmap-xml-path", e);
	}
	L("nmap-xml-run-actions", window.confirm("Run scripted actions after XML import?")), await pu();
}
async function Ql() {
	qi();
	let e = z("targets-file-path").trim();
	if (!e) {
		let t = window.prompt("Enter targets text file path:", "");
		if (e = String(t || "").trim(), !e) return;
		I("targets-file-path", e);
	}
	await fu();
}
function $l(e) {
	let t = document.getElementById("workspace-switch-guard-modal");
	t && (Pe.modalOpen = !!e, P.workspaceSwitchGuardOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Re());
}
function X(e, t = !1) {
	let n = document.getElementById("workspace-switch-guard-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function eu() {
	Pe.busy = !1, Pe.pendingAction = null, Pe.pendingLabel = "", Pe.latestSummary = null, X("Stop running jobs and processes before switching workspaces."), F("workspace-switch-guard-summary", "No active work detected."), F("workspace-switch-guard-details", ""), $l(!1);
}
async function tu() {
	let [e, t] = await Promise.all([Xe("/api/jobs?limit=500"), Xe("/api/processes?limit=500")]), n = Array.isArray(e?.jobs) ? e.jobs : [], r = Array.isArray(t?.processes) ? t.processes : [];
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
function nu(e) {
	let t = Array.isArray(e?.jobs) ? e.jobs : [], n = Array.isArray(e?.processes) ? e.processes : [], r = [];
	return t.slice(0, 6).forEach((e) => {
		r.push(`Job ${e.id} | ${e.type || "job"} | ${e.status || ""}`);
	}), n.slice(0, 8).forEach((e) => {
		r.push(`Process ${e.id} | ${e.name || "process"} | ${e.hostIp || ""}${e.port ? `:${e.port}/${e.protocol || "tcp"}` : ""} | ${e.status || ""}`);
	}), (t.length > 6 || n.length > 8) && r.push("..."), r.join("\n");
}
function ru(e, t, n) {
	Pe.pendingAction = n, Pe.pendingLabel = String(t || "switch workspaces"), Pe.latestSummary = e;
	let r = Array.isArray(e?.jobs) ? e.jobs.length : 0, i = Array.isArray(e?.processes) ? e.processes.length : 0;
	X("Active work must be stopped before switching workspaces."), F("workspace-switch-guard-summary", `${r} active job${r === 1 ? "" : "s"} and ${i} active process${i === 1 ? "" : "es"} detected before ${Pe.pendingLabel}.`), F("workspace-switch-guard-details", nu(e)), $l(!0);
}
async function iu(e = 2e4) {
	let t = Date.now() + Math.max(1e3, Number(e) || 2e4);
	for (; Date.now() < t;) {
		let e = await tu();
		if (!e.jobs.length && !e.processes.length) return e;
		await new Promise((e) => window.setTimeout(e, 600));
	}
	throw Error("Timed out waiting for running jobs and processes to stop.");
}
async function au() {
	if (!Pe.busy) {
		Pe.busy = !0, X("Stopping active jobs and processes...");
		try {
			let e = await tu();
			for (let t of e.jobs) {
				let e = Number(t?.id || 0);
				e > 0 && await W(`/api/jobs/${e}/stop`, {});
			}
			for (let t of e.processes) {
				let e = Number(t?.id || 0);
				if (e > 0) try {
					await W(`/api/processes/${e}/kill`, {});
				} catch {}
			}
			await iu(), await _s();
			let t = Pe.pendingAction;
			eu(), typeof t == "function" && await t();
		} catch (e) {
			Pe.busy = !1, X(`Stop failed: ${e.message}`, !0);
		}
	}
}
async function ou(e, t) {
	let n = await tu();
	n.jobs.length || n.processes.length ? ru(n, e, t) : await t();
}
async function su() {
	V("Creating temporary project...");
	let e = await W("/api/project/new-temp", {});
	V("Created temporary project"), Wo({ clearProjectPaths: !0 }), Be(e?.project || {}), await jr(), await Promise.all([_s(), Gt()]);
}
async function cu() {
	try {
		await ou("creating a new workspace", su);
	} catch (e) {
		if (String(e?.message || "").toLowerCase().includes("jobs/scans are active")) {
			await ou("creating a new workspace", su);
			return;
		}
		V(`Create failed: ${e.message}`, !0);
	}
}
async function lu() {
	let e = z("project-open-path").trim();
	if (!e) {
		V("Open failed: project path is required", !0);
		return;
	}
	V("Opening project...");
	let t = await W("/api/project/open", { path: e });
	V("Project opened"), Wo({ clearProjectPaths: !1 }), I("project-save-path", ""), Be(t?.project || {}), await jr(), await Promise.all([_s(), Gt()]);
}
async function uu() {
	try {
		await ou("opening a workspace", lu);
	} catch (e) {
		if (String(e?.message || "").toLowerCase().includes("jobs/scans are active")) {
			await ou("opening a workspace", lu);
			return;
		}
		V(`Open failed: ${e.message}`, !0);
	}
}
async function du() {
	let e = z("project-save-path").trim();
	if (!e) V("Save failed: destination path is required", !0);
	else {
		V("Saving project...");
		try {
			let t = await W("/api/project/save-as", {
				path: e,
				replace: R("project-save-replace")
			}), n = Number(t?.job?.id || 0);
			n > 0 && (V(`Save queued (job ${n})...`), await Er(n, 6e5, 1500)), V("Project saved"), await _s();
		} catch (e) {
			V(`Save failed: ${e.message}`, !0);
		}
	}
}
async function fu() {
	let e = z("targets-file-path").trim();
	if (!e) V("Import failed: targets file path is required", !0);
	else {
		V("Queueing targets import job...");
		try {
			let t = (await W("/api/targets/import-file", { path: e }))?.job?.id;
			V(t ? `Targets import queued (job ${t})` : "Targets import queued"), await _s();
		} catch (e) {
			V(`Import failed: ${e.message}`, !0);
		}
	}
}
async function pu() {
	let e = z("nmap-xml-path").trim();
	if (!e) V("Import failed: XML path is required", !0);
	else {
		V("Queueing Nmap XML import job...");
		try {
			let t = (await W("/api/nmap/import-xml", {
				path: e,
				run_actions: R("nmap-xml-run-actions")
			}))?.job?.id;
			V(t ? `Nmap XML import queued (job ${t})` : "Nmap XML import queued"), await _s();
		} catch (e) {
			V(`Import failed: ${e.message}`, !0);
		}
	}
}
// ../app/web/static/js/workspace/report_delivery.js
async function mu(e) {
	e && e.preventDefault(), qi();
	let t;
	try {
		t = bl();
	} catch (e) {
		let t = `Project report settings error: ${e.message}`;
		V(t, !0), F("report-provider-save-status", t);
		return;
	}
	V("Pushing project report..."), F("report-provider-save-status", "Pushing project report...");
	try {
		let e = await W("/api/workspace/project-ai-report/push", { project_report_delivery: t }), n = e?.status_code ? `Project report pushed (${e.status_code})` : "Project report pushed";
		V(n, !1), F("report-provider-save-status", n);
	} catch (e) {
		let t = `Project report push failed: ${e.message}`;
		V(t, !0), F("report-provider-save-status", t);
	}
}
// ../app/web/static/js/workspace/events.js
function hu() {
	let e = (e, t) => {
		let n = document.getElementById(e);
		n && n.addEventListener("click", t);
	};
	e("nmap-scan-button", pl), e("ribbon-workspace-new-action-button", cu), e("ribbon-workspace-open-action-button", Wl), e("ribbon-workspace-save-action-button", Kl), e("ribbon-workspace-save-as-action-button", ql), e("ribbon-workspace-download-action-button", Jl), e("ribbon-workspace-restore-action-button", Yl), e("ribbon-import-xml-action-button", Zl), e("ribbon-import-targets-action-button", Ql), e("hosts-reset-filter-button", mr), e("hosts-filter-show-all-button", () => cr("show_all")), e("hosts-filter-hide-down-button", () => cr("hide_down")), e("services-panel-toggle-button", Qo), e("graph-panel-toggle-button", es), e("ribbon-scan-add-action-button", Ni), e("ribbon-scan-manual-action-button", Pi), e("ribbon-misc-host-selection-action-button", Fi), e("ribbon-misc-script-cve-action-button", Ii), e("ribbon-logging-jobs-button", Ri), e("ribbon-logging-submitted-scans-button", zi), e("ribbon-logging-scheduler-decisions-button", Bi), e("ribbon-logging-ai-provider-button", Li), e("ribbon-credential-capture-toggle-button", hc), e("ribbon-scheduler-settings-button", Yi), e("ribbon-interface-settings-button", Hl), e("ribbon-device-category-settings-button", J), e("ribbon-report-provider-settings-button", Qi), e("ribbon-app-settings-button", Bl), e("credential-capture-open-credentials-button", jc), e("credential-capture-open-config-button", Ic), e("credential-capture-responder-start-button", () => Hc("responder")), e("credential-capture-responder-stop-button", () => Uc("responder")), e("credential-capture-responder-view-log-button", () => Bc("responder")), e("credential-capture-responder-download-log-button", () => Vc("responder")), e("credential-capture-ntlmrelayx-start-button", () => Hc("ntlmrelayx")), e("credential-capture-ntlmrelayx-stop-button", () => Uc("ntlmrelayx")), e("credential-capture-ntlmrelayx-view-log-button", () => Bc("ntlmrelayx")), e("credential-capture-ntlmrelayx-download-log-button", () => Vc("ntlmrelayx")), e("workspace-refresh-button", jr), e("workspace-save-note-button", Mr), e("workspace-save-categories-button", Pr), e("workspace-run-tool-button", Za), e("workspace-run-scheduler-button", Qa), e("workspace-add-script-button", $a), e("graph-refresh-button", ss), e("graph-rebuild-button", cs), e("graph-filters-toggle-button", () => io(!A.filtersExpanded)), e("graph-focus-selection-button", Ol), e("graph-clear-focus-button", kl), e("graph-expand-selection-button", Al), e("graph-collapse-expanded-button", jl), e("graph-layout-save-button", Ml), e("graph-layout-reset-button", Nl), e("graph-note-open-button", Fl), e("graph-note-save-button", Pl), e("graph-note-modal-close", () => Mi(!1)), e("graph-note-modal-cancel", () => Mi(!1)), e("graph-pin-toggle-button", Il), e("graph-detail-dock-toggle-button", co), e("graph-detail-close-button", ro), io(A.filtersExpanded), Zo(!0), $o(!1);
	let t = tn();
	t && t.addEventListener("scroll", () => {
		A.detailMode === "floating" && nn() && oo();
	}), window.addEventListener("resize", () => {
		Xt() && Ho({ preserveDetail: !0 });
	});
	let n = document.getElementById("workspace-host-select");
	n && n.addEventListener("change", async (e) => {
		await qo(e.target.value, {
			syncGraph: !0,
			preserveGraphDetail: !0
		});
	});
	let r = document.getElementById("hosts-category-filter-select");
	r && r.addEventListener("change", async (e) => {
		await lr(e.target.value);
	});
	let i = document.getElementById("hosts-service-filter-button");
	i && i.addEventListener("click", (e) => {
		e.stopPropagation(), ir(!!document.getElementById("hosts-service-filter-popover")?.hidden);
	});
	let a = document.getElementById("hosts-service-filter-clear-button");
	a && a.addEventListener("click", async (e) => {
		e.stopPropagation(), await dr([]);
	});
	let o = document.getElementById("hosts-service-filter-popover");
	o && o.addEventListener("click", (e) => {
		e.stopPropagation();
	}), document.addEventListener("click", () => {
		ir(!1);
	});
	let s = document.getElementById("services-category-filter-select");
	s && s.addEventListener("change", async (e) => {
		await fr(e.target.value);
	});
	let c = document.getElementById("workspace-tool-target-select");
	c && c.addEventListener("change", async () => {
		await Ya();
	}), ["workspace-tool-port", "workspace-tool-protocol"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", async () => {
			await Xa();
		});
	});
	let l = document.getElementById("workspace-tool-select");
	l && l.addEventListener("change", () => {
		Ha();
	});
	let u = document.getElementById("credential-capture-responder-mode-quick");
	u && u.addEventListener("change", async () => {
		await Rc();
	});
	let d = document.getElementById("credential-capture-config-form");
	d && d.addEventListener("submit", async (e) => {
		await Lc(e);
	});
	let f = document.getElementById("hosts-body");
	f && f.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-host-action]");
		if (t && await wa(t)) return;
		let n = e.target.closest("tr[data-host-id]");
		if (!n) return;
		let r = parseInt(n.dataset.hostId, 10);
		r && await qo(r, {
			syncGraph: !0,
			preserveGraphDetail: !0
		});
	});
	let p = document.getElementById("host-detail-ports");
	p && p.addEventListener("click", (e) => {
		let t = e.target.closest("button[data-screenshot-url]");
		t && Et(t.dataset.screenshotUrl, t.dataset.screenshotName, t.dataset.screenshotPort);
	});
	let m = document.getElementById("host-detail-scripts");
	m && m.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-script-view-id]");
		if (t) {
			let e = parseInt(t.dataset.scriptViewId, 10);
			if (!e) return;
			await wt(e);
			return;
		}
		let n = e.target.closest("button[data-script-delete-id]");
		if (!n) return;
		let r = parseInt(n.dataset.scriptDeleteId, 10);
		r && await eo(r);
	}), e("nmap-wizard-back", () => dl(Ne.step - 1)), e("nmap-wizard-next", () => dl(Ne.step + 1)), e("scheduler-test-provider-button", wl), e("project-report-push-button", mu), e("scheduler-modal-close", Xi), e("interface-settings-modal-close", Ul), e("interface-settings-save-button", zl), e("device-category-modal-close", Zi), e("device-category-add-rule-button", () => {
		let e = document.getElementById("device-category-rules-body");
		e && e.appendChild(Rr({}));
	}), e("device-category-save-button", Vr), e("report-provider-modal-close", $i), e("settings-modal-close", Vl), e("settings-tool-audit-refresh-button", bc), e("settings-tool-install-copy-button", Sc), e("settings-tool-install-run-button", Cc), e("workspace-switch-guard-close", eu), e("workspace-switch-guard-cancel-button", eu), e("workspace-switch-guard-stop-button", au), e("nmap-scan-modal-close", Si), e("manual-scan-modal-close", Ci), e("host-selection-modal-close", Ti), e("script-cve-modal-close", Ei), e("jobs-modal-close", Oi), e("submitted-scans-modal-close", ki), e("scheduler-decisions-modal-close", Ai), e("host-remove-modal-close", () => ji(!0)), e("host-remove-modal-cancel", () => ji(!0)), e("host-remove-modal-confirm", Fa), e("credentials-modal-close", xt), e("credentials-copy-hashes-button", Mc), e("credentials-download-hashes-button", () => Nc("txt")), e("credentials-download-json-button", () => Nc("json")), e("credential-capture-config-modal-close", St), e("script-output-modal-close", () => yt(!0)), e("script-output-copy-button", Dt), e("script-output-command-copy", Ot), e("script-output-download-button", jt), e("screenshot-modal-close", () => bt(!0)), e("screenshot-copy-button", kt), e("screenshot-download-button", Mt), e("graph-layout-tidy-button", Dl);
	let h = document.getElementById("project-restore-zip-file");
	h && h.addEventListener("change", Xl);
	let g = document.getElementById("settings-tool-install-platform");
	g && g.addEventListener("change", async () => {
		g.dataset.userSelected = "true", await xc(!1);
	}), document.querySelectorAll("[data-ribbon-menu-toggle]").forEach((e) => {
		e.addEventListener("click", (t) => {
			t.preventDefault(), t.stopPropagation(), Ji(e.getAttribute("data-ribbon-menu-toggle"));
		});
	}), document.addEventListener("click", (e) => {
		e.target.closest(".ribbon-menu") || qi();
	});
	let _ = document.getElementById("graph-resize-handle");
	_ && (_.addEventListener("pointerdown", un), _.addEventListener("dblclick", (e) => {
		e.preventDefault(), dn();
	})), sn();
	let v = document.getElementById("process-output-modal");
	v && v.addEventListener("click", (e) => {
		e.target === v && vt(!0);
	});
	let y = document.getElementById("script-output-modal");
	y && y.addEventListener("click", (e) => {
		e.target === y && yt(!0);
	});
	let b = document.getElementById("screenshot-modal");
	b && b.addEventListener("click", (e) => {
		e.target === b && bt(!0);
	});
	let x = document.getElementById("nmap-scan-modal");
	x && x.addEventListener("click", (e) => {
		e.target === x && Si();
	});
	let S = document.getElementById("manual-scan-modal");
	S && S.addEventListener("click", (e) => {
		e.target === S && Ci();
	});
	let C = document.getElementById("interface-settings-modal");
	C && C.addEventListener("click", (e) => {
		e.target === C && Ul();
	});
	let w = document.getElementById("workspace-switch-guard-modal");
	w && w.addEventListener("click", (e) => {
		e.target === w && eu();
	});
	let T = document.getElementById("host-selection-modal");
	T && T.addEventListener("click", (e) => {
		e.target === T && Ti();
	});
	let E = document.getElementById("script-cve-modal");
	E && E.addEventListener("click", (e) => {
		e.target === E && Ei();
	});
	let D = document.getElementById("provider-logs-modal");
	D && D.addEventListener("click", (e) => {
		e.target === D && Di();
	});
	let O = document.getElementById("credentials-modal");
	O && O.addEventListener("click", (e) => {
		e.target === O && xt();
	});
	let ee = document.getElementById("credential-capture-config-modal");
	ee && ee.addEventListener("click", (e) => {
		e.target === ee && St();
	});
	let te = document.getElementById("jobs-modal");
	te && te.addEventListener("click", (e) => {
		e.target === te && Oi();
	});
	let ne = document.getElementById("submitted-scans-modal");
	ne && ne.addEventListener("click", (e) => {
		e.target === ne && ki();
	});
	let re = document.getElementById("scheduler-decisions-modal");
	re && re.addEventListener("click", (e) => {
		e.target === re && Ai();
	});
	let ie = document.getElementById("host-remove-modal");
	ie && ie.addEventListener("click", (e) => {
		e.target === ie && ji(!0);
	});
	let ae = document.getElementById("graph-note-modal");
	ae && ae.addEventListener("click", (e) => {
		e.target === ae && Mi(!1);
	});
	let oe = document.getElementById("scheduler-settings-modal");
	oe && oe.addEventListener("click", (e) => {
		e.target === oe && Xi();
	});
	let se = document.getElementById("device-category-settings-modal");
	se && se.addEventListener("click", (e) => {
		e.target === se && Zi();
	});
	let ce = document.getElementById("report-provider-modal");
	ce && ce.addEventListener("click", (e) => {
		e.target === ce && $i();
	});
	let le = document.getElementById("app-settings-modal");
	le && le.addEventListener("click", (e) => {
		e.target === le && Vl();
	}), document.addEventListener("keydown", (e) => {
		e.key === "Escape" && (Fe.openMenuId ? qi() : ke.modalOpen ? vt(!0) : N.modalOpen ? yt(!0) : Ae.modalOpen ? bt(!0) : P.nmapScanOpen ? Si() : P.manualScanOpen ? Ci() : P.hostSelectionOpen ? Ti() : P.scriptCveOpen ? Ei() : P.providerLogsOpen ? Di() : P.credentialsOpen ? xt() : P.credentialCaptureConfigOpen ? St() : P.jobsOpen ? Oi() : P.submittedScansOpen ? ki() : P.schedulerDecisionsOpen ? Ai() : P.hostRemoveOpen ? ji(!0) : P.graphNoteOpen ? Mi(!1) : P.settingsOpen ? Vl() : P.deviceCategorySettingsOpen ? Zi() : P.schedulerOpen ? Xi() : P.reportProviderOpen ? $i() : A.detailMode === "floating" && nn() && ro());
	}), document.addEventListener("pointerdown", (e) => {
		if (A.detailMode !== "floating" || !nn() || Fe.openMenuId || ke.modalOpen || N.modalOpen || Ae.modalOpen || P.nmapScanOpen || P.manualScanOpen || P.hostSelectionOpen || P.scriptCveOpen || P.providerLogsOpen || P.credentialsOpen || P.credentialCaptureConfigOpen || P.jobsOpen || P.submittedScansOpen || P.schedulerDecisionsOpen || P.hostRemoveOpen || P.graphNoteOpen || P.interfaceSettingsOpen || P.workspaceSwitchGuardOpen || P.settingsOpen || P.deviceCategorySettingsOpen || P.schedulerOpen || P.reportProviderOpen) return;
		let t = e.target;
		if (!(t instanceof Element) || t.closest("#graph-detail-panel") || t.closest("[data-graph-node-id], [data-graph-edge-id]")) return;
		let n = $t();
		n && n.contains(t) || ro();
	}), document.querySelectorAll("[data-wizard-goto]").forEach((e) => {
		e.addEventListener("click", () => {
			dl(e.getAttribute("data-wizard-goto"));
		});
	});
	let ue = document.getElementById("nmap-wizard");
	ue && ue.querySelectorAll("input, select, textarea").forEach((e) => {
		let t = e.tagName === "INPUT" && (e.type === "checkbox" || e.type === "radio") || e.tagName === "SELECT" ? "change" : "input";
		e.addEventListener(t, () => {
			Ne.postSubmitLock = !1, e.name === "nmap-scan-mode" && dl(3), e.id === "nmap-engagement-preset-select" && ai(), fl();
		});
	}), ["nmap-args"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("input", () => {
			Ne.postSubmitLock = !1, ll();
		});
	}), ci({
		scrollIntoView: !1,
		focusPreset: !1,
		focusTargets: !1
	});
}
// ../app/web/static/js/workspace/graph_events.js
function gu(e) {
	if (!A.drag) return;
	e.preventDefault();
	let t = Number(e.clientX || 0) - Number(A.drag.startClientX || 0), n = Number(e.clientY || 0) - Number(A.drag.startClientY || 0);
	if (!A.drag.active && Math.hypot(t, n) < 4) return;
	if (A.drag.active = !0, A.drag.kind === "pan") {
		let e = document.getElementById("graph-workspace-canvas"), r = A.drag.viewport || A.viewport;
		if (!e || !r) return;
		let i = e.getBoundingClientRect();
		if (!i.width || !i.height) return;
		let a = Number(r.width || 1) / Math.max(1, i.width), o = Number(r.height || 1) / Math.max(1, i.height), s = aa(Number(A.drag.startCenterX || r.centerX || 0) - t * a - (r.boundsX || 0), Number(A.drag.startCenterY || r.centerY || 0) - n * o - (r.boundsY || 0), r.boundsWidth, r.boundsHeight, r.width, r.height);
		s.x += r.boundsX || 0, s.y += r.boundsY || 0;
		let c = s.x - Number(r.width || 1) / 2, l = s.y - Number(r.height || 1) / 2;
		A.viewport = {
			...r,
			x: c,
			y: l,
			centerX: s.x,
			centerY: s.y
		}, document.body.classList.add("graph-workspace-panning"), e.setAttribute("viewBox", `${c} ${l} ${r.width} ${r.height}`), A.detailMode === "floating" && nn() && oo();
		return;
	}
	let r = document.getElementById("graph-workspace-canvas");
	if (!r) return;
	let i = Ln(r, e), a = Number(i.x || 0) - Number(A.drag.startPointX || 0), o = Number(i.y || 0) - Number(A.drag.startPointY || 0);
	Object.entries(A.drag.initialPositions || {}).forEach(([e, t]) => {
		A.positions[e] = {
			x: Math.max(20, Math.round((Number(t?.x) || 0) + a)),
			y: Math.max(28, Math.round((Number(t?.y) || 0) + o))
		};
	}), Ho({ preserveDetail: !0 });
}
function _u() {
	if (!A.drag) return;
	let e = !!A.drag.active;
	document.body.classList.remove("graph-workspace-panning"), window.removeEventListener("pointermove", gu), window.removeEventListener("pointerup", _u), A.drag = null, e && (A.suppressClickUntil = Date.now() + 180);
}
function vu() {
	if (!Xt()) return;
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
			e === "graph-view-select" && (I("graph-group-select", (Ce[String(t.target.value || "attack_surface").trim()] || Ce.attack_surface).defaultGroup || "finding"), A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, Dn()), [
				"graph-group-select",
				"graph-render-mode-select",
				"graph-severity-filter",
				"graph-pack-filter",
				"graph-time-window-filter"
			].includes(e) ? Ho() : await as({ background: !1 });
		});
	});
	let e = document.getElementById("graph-search-input");
	if (e) {
		let t = null;
		e.addEventListener("input", () => {
			t && window.clearTimeout(t), t = window.setTimeout(() => {
				as({ background: !1 }).catch(() => {});
			}, 350);
		});
	}
	let t = document.getElementById("graph-min-confidence");
	t && t.addEventListener("input", () => {
		Cn(), as({ background: !1 }).catch(() => {});
	});
	let n = document.getElementById("graph-zoom-slider");
	n && n.addEventListener("input", () => {
		wn(), Ho();
	});
	let r = document.getElementById("graph-focus-depth-select");
	r && r.addEventListener("change", () => {
		A.focusDepth = Math.max(1, Math.min(3, parseInt(r.value, 10) || 1)), A.focusSeedNodeIds.length && Ho();
	}), ["graph-hide-ai-suggested", "graph-hide-nmap-xml-artifacts"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", () => {
			as({ background: !1 }).catch(() => {});
		});
	});
	let i = document.getElementById("graph-layout-select");
	i && i.addEventListener("change", () => {
		let e = String(i.value || "");
		e ? (El(e), K("Layout loaded")) : Nl();
	});
	let a = document.getElementById("graph-workspace-canvas");
	a && (a.addEventListener("click", (e) => {
		if (Number(A.suppressClickUntil || 0) > Date.now()) return;
		let t = e.target.closest("[data-graph-node-id]");
		if (t) {
			rs("node", t.getAttribute("data-graph-node-id"));
			return;
		}
		let n = e.target.closest("[data-graph-edge-id]");
		n ? rs("edge", n.getAttribute("data-graph-edge-id")) : e.target.closest("[data-graph-group-key]") || ro();
	}), a.addEventListener("dblclick", (e) => {
		let t = e.target.closest("[data-graph-node-id]");
		if (!t) return;
		let n = String(t.getAttribute("data-graph-node-id") || "");
		A.selectedKind = "node", A.selectedRef = n, q(Kt("node", n), "summary_kind") && Al();
	}), a.addEventListener("pointerdown", (e) => {
		let t = e.target.closest("[data-graph-node-id]");
		if (!t) return;
		let n = String(t.getAttribute("data-graph-node-id") || ""), r = Ln(a, e), i = A.filtered.positions?.[n] || A.positions?.[n];
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
		}, window.addEventListener("pointermove", gu), window.addEventListener("pointerup", _u), e.preventDefault());
	}), a.addEventListener("pointerdown", (e) => {
		let t = e.target.closest("[data-graph-group-key]");
		if (!t || e.target.closest("[data-graph-node-id]")) return;
		let n = String(t.getAttribute("data-graph-group-key") || ""), r = ea(n), i = Array.isArray(r?.nodeIds) ? r.nodeIds.filter(Boolean) : [];
		if (!i.length) return;
		let o = Ln(a, e), s = {};
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
		}, window.addEventListener("pointermove", gu), window.addEventListener("pointerup", _u), e.preventDefault());
	}), a.addEventListener("pointerdown", (e) => {
		if (e.target.closest("[data-graph-node-id], [data-graph-edge-id], [data-graph-group-key]")) return;
		let t = A.viewport || sa(A.filtered.width || 1600, A.filtered.height || 900);
		t && (A.drag = {
			kind: "pan",
			startClientX: Number(e.clientX || 0),
			startClientY: Number(e.clientY || 0),
			startCenterX: Number(t.centerX || 0),
			startCenterY: Number(t.centerY || 0),
			viewport: { ...t },
			active: !1
		}, window.addEventListener("pointermove", gu), window.addEventListener("pointerup", _u), e.preventDefault());
	})), Cn(), wn(), On(), Dn();
}
// src/main.tsx
new Tl().connect(), window.addEventListener("DOMContentLoaded", () => {
	let e = document.getElementById("initial-snapshot");
	if (e && e.textContent) try {
		ds(JSON.parse(e.textContent));
	} catch {
		ps("Init Error", !0);
	}
	window.LEGION_WS_ENABLED ? gs() : (ps("Polling/API", !1), _s(), window.setInterval(_s, 2e3)), xl(), Gt();
	let t = document.getElementById("scheduler-form");
	t && t.addEventListener("submit", Sl);
	let n = document.getElementById("scheduler-provider-select");
	n && (n.addEventListener("change", () => {
		vl(n.value);
	}), vl(n.value));
	let r = document.getElementById("scheduler-goal-select");
	r && r.addEventListener("change", _l);
	let i = document.getElementById("engagement-scope-select");
	i && i.addEventListener("change", _l);
	let a = document.getElementById("engagement-intent-select");
	a && a.addEventListener("change", _l), _l();
	let o = document.getElementById("report-provider-form");
	o && o.addEventListener("submit", Cl), hu(), vu(), jr();
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
		}), e("breadcrumb-view").textContent = t[r], document.body.dataset.workspaceView = r, r === "services" && typeof Zo == "function" && Zo(!1), r === "graph" && typeof Xt == "function" && Xt() && (typeof $o == "function" && $o(!1), typeof Ho == "function" && requestAnimationFrame(() => Ho({ preserveDetail: !0 }))), i && o("view", r), f();
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
	}), ac(), (0, c.createRoot)(i).render(/* @__PURE__ */ (0, U.jsx)(He, {
		sidebar: e,
		title: t,
		sidebarEditor: n,
		titleEditor: r
	})), (0, c.createRoot)(a).render(/* @__PURE__ */ (0, U.jsx)(Ue, {})), i.dataset.framework = "react", a.dataset.framework = "react";
});
