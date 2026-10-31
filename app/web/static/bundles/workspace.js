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
	var E = Object.assign, te = Symbol.for("react.element"), ne = Symbol.for("react.transitional.element"), re = Symbol.for("react.portal"), ie = Symbol.for("react.fragment"), ae = Symbol.for("react.strict_mode"), oe = Symbol.for("react.profiler"), se = Symbol.for("react.consumer"), ce = Symbol.for("react.context"), le = Symbol.for("react.forward_ref"), ue = Symbol.for("react.suspense"), de = Symbol.for("react.suspense_list"), D = Symbol.for("react.memo"), fe = Symbol.for("react.lazy"), O = Symbol.for("react.activity"), pe = Symbol.for("react.legacy_hidden"), me = Symbol.for("react.memo_cache_sentinel"), k = Symbol.for("react.view_transition"), he = Symbol.for("react.recoverable"), ge = Symbol.iterator;
	function _e(e) {
		return typeof e != "object" || !e ? null : (e = ge && e[ge] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var A = Symbol.for("react.client.reference");
	function ve(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === A ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case ie: return "Fragment";
			case oe: return "Profiler";
			case ae: return "StrictMode";
			case ue: return "Suspense";
			case de: return "SuspenseList";
			case O: return "Activity";
			case k: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case re: return "Portal";
			case ce: return e.displayName || "Context";
			case se: return (e._context.displayName || "Context") + ".Consumer";
			case le:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case D: return t = e.displayName || null, t === null ? ve(e.type) || "Memo" : t;
			case fe:
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
	function N(e, t) {
		Se++, xe[Se] = e.current, e.current = t;
	}
	var Te = Ce(null), Ee = Ce(null), P = Ce(null), De = Ce(null);
	function Oe(e, t) {
		switch (N(P, t), N(Ee, e), N(Te, null), t.nodeType) {
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
		we(Te), N(Te, e);
	}
	function ke() {
		we(Te), we(Ee), we(P);
	}
	function Ae(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, N(De, e)), t = Te.current;
		var n = dp(t, e.type);
		t !== n && (N(Ee, e), N(Te, n));
	}
	function je(e) {
		Ee.current === e && (we(Te), we(Ee)), De.current === e && (we(De), sh._currentValue = be);
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
	var L = Object.prototype.hasOwnProperty, R = t.unstable_scheduleCallback, z = t.unstable_cancelCallback, Le = t.unstable_shouldYield, Re = t.unstable_requestPaint, B = t.unstable_now, V = t.unstable_getCurrentPriorityLevel, ze = t.unstable_ImmediatePriority, Be = t.unstable_UserBlockingPriority, H = t.unstable_NormalPriority, Ve = t.unstable_LowPriority, He = t.unstable_IdlePriority, Ue = t.log, We = t.unstable_setDisableYieldValue, Ge = null, Ke = null;
	function qe(e) {
		if (typeof Ue == "function" && We(e), Ke && typeof Ke.setStrictMode == "function") try {
			Ke.setStrictMode(Ge, e);
		} catch {}
	}
	var Je = Math.clz32 ? Math.clz32 : Ze, Ye = Math.log, Xe = Math.LN2;
	function Ze(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Ye(e) / Xe | 0) | 0;
	}
	var Qe = 256, $e = 262144, et = 4194304;
	function tt(e) {
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
	function nt(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = tt(n))) : i = tt(o) : i = tt(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = tt(n))) : i = tt(o)) : i = tt(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function rt(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function it(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - Je(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function at(e, t) {
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
	function ot() {
		var e = et;
		return et <<= 1, !(et & 62914560) && (et = 4194304), e;
	}
	function st(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function ct(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function lt(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Je(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && ut(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function ut(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Je(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function dt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Je(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function ft(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : pt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function pt(e) {
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
	function mt(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function ht() {
		var e = M.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function gt(e, t) {
		var n = M.p;
		try {
			return M.p = e, t();
		} finally {
			M.p = n;
		}
	}
	var _t = Math.random().toString(36).slice(2), vt = "__reactFiber$" + _t, yt = "__reactProps$" + _t, bt = "__reactContainer$" + _t, xt = "__reactEvents$" + _t, St = "__reactListeners$" + _t, Ct = "__reactHandles$" + _t, wt = "__reactResources$" + _t, Tt = "__reactMarker$" + _t, Et = "__reactLoad$" + _t;
	function Dt(e) {
		delete e[vt], delete e[yt], delete e[St], delete e[Ct];
	}
	function Ot(e) {
		var t;
		if (t = e[vt]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[bt] || n[vt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[vt]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function kt(e) {
		if (e = e[vt] || e[bt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function At(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(s(33));
	}
	function jt(e) {
		var t = e[wt];
		return t ||= e[wt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function Mt(e) {
		e[Tt] = !0;
	}
	function Nt(e) {
		e[Et] = void 0;
	}
	var Pt = /* @__PURE__ */ new Set(), Ft = {};
	function It(e, t) {
		Lt(e, t), Lt(e + "Capture", t);
	}
	function Lt(e, t) {
		for (Ft[e] = t, e = 0; e < t.length; e++) Pt.add(t[e]);
	}
	var Rt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), zt = {}, Bt = {};
	function Vt(e) {
		return L.call(Bt, e) ? !0 : L.call(zt, e) ? !1 : Rt.test(e) ? Bt[e] = !0 : (zt[e] = !0, !1);
	}
	var U = !1;
	function Ht() {
		var e = U;
		return U = !1, e;
	}
	function Ut(e, t, n) {
		if (Vt(t)) {
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
	function Wt(e, t, n) {
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
	function Gt(e, t, n, r) {
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
	function Kt(e) {
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
	function qt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Jt(e, t, n) {
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
	function Yt(e) {
		if (!e._valueTracker) {
			var t = qt(e) ? "checked" : "value";
			e._valueTracker = Jt(e, t, "" + e[t]);
		}
	}
	function Xt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = qt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var Zt = /[\n"\\]/g;
	function Qt(e) {
		return e.replace(Zt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function W(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Kt(t)) : e.value !== "" + Kt(t) && (e.value = "" + Kt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : en(e, Kt(n)) : o === "number" && e.value == t ? en(e, Kt(e.value)) : en(e, Kt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Kt(s) : e.removeAttribute("name");
	}
	function $t(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Yt(e);
				return;
			}
			n = n == null ? "" : "" + Kt(n), t = t == null ? n : "" + Kt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Yt(e);
	}
	function en(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function tn(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Kt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function nn(e, t, n) {
		t != null && (t = "" + Kt(t), t !== e.value && (e.value = t), n == null) ? e.defaultValue !== t && (e.defaultValue = t) : e.defaultValue = n == null ? "" : "" + Kt(n);
	}
	function rn(e, t, n, r) {
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
		n = Kt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Yt(e);
	}
	function G(e, t) {
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
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", U = !0);
			for (var i in t) r = t[i], t.hasOwnProperty(i) && n[i] !== r && (on(e, i, r), U = !0);
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
	function fn() {}
	var pn = null;
	function mn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var hn = null, gn = null;
	function _n(e) {
		var t = kt(e);
		if (t && (e = t.stateNode)) {
			var n = e[yt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (W(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Qt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var i = r[yt] || null;
								if (!i) throw Error(s(90));
								W(r, i.value, i.defaultValue, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Xt(r);
					}
					break a;
				case "textarea":
					nn(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && tn(e, !!n.multiple, t, !1);
			}
		}
	}
	var vn = !1;
	function yn(e, t, n) {
		if (vn) return e(t, n);
		vn = !0;
		try {
			return e(t);
		} finally {
			if (vn = !1, (hn !== null || gn !== null) && (Ld(), hn && (t = hn, e = gn, gn = hn = null, _n(t), e))) for (t = 0; t < e.length; t++) _n(e[t]);
		}
	}
	function bn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[yt] || null;
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
	var xn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, Sn = !1;
	if (xn) try {
		var Cn = {};
		Object.defineProperty(Cn, "passive", { get: function() {
			Sn = !0;
		} }), window.addEventListener("test", Cn, Cn), window.removeEventListener("test", Cn, Cn);
	} catch {
		Sn = !1;
	}
	var wn = null, Tn = null, En = null;
	function Dn() {
		if (En) return En;
		var e, t = Tn, n = t.length, r, i = "value" in wn ? wn.value : wn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return En = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function On(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function kn() {
		return !0;
	}
	function An() {
		return !1;
	}
	function jn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? kn : An, this.isPropagationStopped = An, this;
		}
		return E(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = kn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = kn);
			},
			persist: function() {},
			isPersistent: kn
		}), t;
	}
	var Mn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Nn = jn(Mn), Pn = E({}, Mn, {
		view: 0,
		detail: 0
	}), Fn = jn(Pn), In, Ln, Rn, zn = E({}, Pn, {
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
		getModifierState: Xn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Rn && (Rn && e.type === "mousemove" ? (In = e.screenX - Rn.screenX, Ln = e.screenY - Rn.screenY) : Ln = In = 0, Rn = e), In);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Ln;
		}
	}), Bn = jn(zn), Vn = jn(E({}, zn, { dataTransfer: 0 })), Hn = jn(E({}, Pn, { relatedTarget: 0 })), Un = jn(E({}, Mn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Wn = jn(E({}, Mn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Gn = jn(E({}, Mn, { data: 0 })), Kn = {
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
	}, qn = {
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
	}, Jn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Yn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Jn[e]) ? !!t[e] : !1;
	}
	function Xn() {
		return Yn;
	}
	var Zn = jn(E({}, Pn, {
		key: function(e) {
			if (e.key) {
				var t = Kn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = On(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? qn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Xn,
		charCode: function(e) {
			return e.type === "keypress" ? On(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? On(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Qn = jn(E({}, zn, {
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
	})), $n = jn(E({}, Mn, { submitter: 0 })), er = jn(E({}, Pn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Xn
	})), tr = jn(E({}, Mn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), nr = jn(E({}, zn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), rr = jn(E({}, Mn, {
		newState: 0,
		oldState: 0,
		source: 0
	})), ir = [
		9,
		13,
		27,
		32
	], ar = xn && "CompositionEvent" in window, or = null;
	xn && "documentMode" in document && (or = document.documentMode);
	var sr = xn && "TextEvent" in window && !or, cr = xn && (!ar || or && 8 < or && 11 >= or), lr = " ", ur = !1;
	function dr(e, t) {
		switch (e) {
			case "keyup": return ir.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function fr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var pr = !1;
	function mr(e, t) {
		switch (e) {
			case "compositionend": return fr(t);
			case "keypress": return t.which === 32 ? (ur = !0, lr) : null;
			case "textInput": return e = t.data, e === lr && ur ? null : e;
			default: return null;
		}
	}
	function hr(e, t) {
		if (pr) return e === "compositionend" || !ar && dr(e, t) ? (e = Dn(), En = Tn = wn = null, pr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return cr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var gr = {
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
	function _r(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!gr[e.type] : t === "textarea";
	}
	function vr(e, t, n, r) {
		hn ? gn ? gn.push(r) : gn = [r] : hn = r, t = qf(t, "onChange"), 0 < t.length && (n = new Nn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var yr = null, br = null;
	function xr(e) {
		Bf(e, 0);
	}
	function Sr(e) {
		if (Xt(At(e))) return e;
	}
	function Cr(e, t) {
		if (e === "change") return t;
	}
	var wr = !1;
	if (xn) {
		var Tr;
		if (xn) {
			var Er = "oninput" in document;
			if (!Er) {
				var Dr = document.createElement("div");
				Dr.setAttribute("oninput", "return;"), Er = typeof Dr.oninput == "function";
			}
			Tr = Er;
		} else Tr = !1;
		wr = Tr && (!document.documentMode || 9 < document.documentMode);
	}
	function Or() {
		yr && (yr.detachEvent("onpropertychange", kr), br = yr = null);
	}
	function kr(e) {
		if (e.propertyName === "value" && Sr(br)) {
			var t = [];
			vr(t, br, e, mn(e)), yn(xr, t);
		}
	}
	function Ar(e, t, n) {
		e === "focusin" ? (Or(), yr = t, br = n, yr.attachEvent("onpropertychange", kr)) : e === "focusout" && Or();
	}
	function jr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return Sr(br);
	}
	function Mr(e, t) {
		if (e === "click") return Sr(t);
	}
	function Nr(e, t) {
		if (e === "input" || e === "change") return Sr(t);
	}
	function Pr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Fr = typeof Object.is == "function" ? Object.is : Pr;
	function Ir(e, t) {
		if (Fr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!L.call(t, i) || !Fr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Lr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function Rr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function zr(e, t) {
		var n = Rr(e);
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
			n = Rr(n);
		}
	}
	function Br(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Br(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Vr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Lr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Lr(e.document);
		}
		return t;
	}
	function Hr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Ur = xn && "documentMode" in document && 11 >= document.documentMode, Wr = null, Gr = null, Kr = null, qr = !1;
	function Jr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		qr || Wr == null || Wr !== Lr(r) || (r = Wr, "selectionStart" in r && Hr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Kr && Ir(Kr, r) || (Kr = r, r = qf(Gr, "onSelect"), 0 < r.length && (t = new Nn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Wr)));
	}
	function Yr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Xr = {
		animationend: Yr("Animation", "AnimationEnd"),
		animationiteration: Yr("Animation", "AnimationIteration"),
		animationstart: Yr("Animation", "AnimationStart"),
		transitionrun: Yr("Transition", "TransitionRun"),
		transitionstart: Yr("Transition", "TransitionStart"),
		transitioncancel: Yr("Transition", "TransitionCancel"),
		transitionend: Yr("Transition", "TransitionEnd")
	}, Zr = {}, Qr = {};
	xn && (Qr = document.createElement("div").style, "AnimationEvent" in window || (delete Xr.animationend.animation, delete Xr.animationiteration.animation, delete Xr.animationstart.animation), "TransitionEvent" in window || delete Xr.transitionend.transition);
	function $r(e) {
		if (Zr[e]) return Zr[e];
		if (!Xr[e]) return e;
		var t = Xr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Qr) return Zr[e] = t[n];
		return e;
	}
	var ei = $r("animationend"), ti = $r("animationiteration"), ni = $r("animationstart"), ri = $r("transitionrun"), ii = $r("transitionstart"), ai = $r("transitioncancel"), oi = $r("transitionend"), si = /* @__PURE__ */ new Map(), ci = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	ci.push("scrollEnd");
	function li(e, t) {
		si.set(e, t), It(t, [e]);
	}
	var ui = 0;
	function di(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = vd.identifierPrefix;
		var n = ui++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function fi(e) {
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
	function pi(e, t) {
		return e = fi(e), t = fi(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var mi = typeof reportError == "function" ? reportError : function(e) {
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
	}, hi = [], gi = 0, _i = 0;
	function vi() {
		for (var e = gi, t = _i = gi = 0; t < e;) {
			var n = hi[t];
			hi[t++] = null;
			var r = hi[t];
			hi[t++] = null;
			var i = hi[t];
			hi[t++] = null;
			var a = hi[t];
			if (hi[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && Si(n, i, a);
		}
	}
	function yi(e, t, n, r) {
		hi[gi++] = e, hi[gi++] = t, hi[gi++] = n, hi[gi++] = r, _i |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function bi(e, t, n, r) {
		return yi(e, t, n, r), Ci(e);
	}
	function xi(e, t) {
		return yi(e, null, null, t), Ci(e);
	}
	function Si(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Je(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function Ci(e) {
		if (50 < Dd) throw Dd = 0, Od = null, Error(s(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var wi = {};
	function Ti(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function Ei(e, t, n, r) {
		return new Ti(e, t, n, r);
	}
	function Di(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Oi(e, t) {
		var n = e.alternate;
		return n === null ? (n = Ei(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function ki(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function Ai(e, t, n, r, i, a) {
		var o = 0;
		if (r = e, typeof r == "function") Di(r) && (o = 1);
		else if (typeof r == "string") o = qm(e, n, Te.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case O: return e = Ei(31, n, t, i), e.elementType = O, e.lanes = a, e;
			case ie: return ji(n.children, i, a, t);
			case ae:
				o = 8, i |= 24;
				break;
			case oe: return e = Ei(12, n, t, i | 2), e.elementType = oe, e.lanes = a, e;
			case ue: return e = Ei(13, n, t, i), e.elementType = ue, e.lanes = a, e;
			case de: return e = Ei(19, n, t, i), e.elementType = de, e.lanes = a, e;
			case pe:
			case k: return e = i | 32, e = Ei(30, n, t, e), e.elementType = k, e.lanes = a, e.stateNode = {
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
		return t = Ei(o, n, t, i), t.elementType = e, t.type = r, t.lanes = a, t;
	}
	function ji(e, t, n, r) {
		return e = Ei(7, e, r, t), e.lanes = n, e;
	}
	function Mi(e, t, n) {
		return e = Ei(6, e, null, t), e.lanes = n, e;
	}
	function Ni(e) {
		var t = Ei(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function Pi(e, t, n) {
		return t = Ei(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Fi = /* @__PURE__ */ new WeakMap();
	function Ii(e, t) {
		if (typeof e == "object" && e) {
			var n = Fi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: I(t)
			}, Fi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: I(t)
		};
	}
	var Li = [], Ri = 0, zi = null, Bi = 0, Vi = [], Hi = 0, Ui = null, Wi = 1, Gi = "";
	function Ki(e, t) {
		Li[Ri++] = Bi, Li[Ri++] = zi, zi = e, Bi = t;
	}
	function qi(e, t, n) {
		Vi[Hi++] = Wi, Vi[Hi++] = Gi, Vi[Hi++] = Ui, Ui = e;
		var r = Wi;
		e = Gi;
		var i = 32 - Je(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Je(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Wi = 1 << 32 - Je(t) + i | n << i | r, Gi = a + e;
		} else Wi = 1 << a | n << i | r, Gi = e;
	}
	function Ji(e) {
		e.return !== null && (Ki(e, 1), qi(e, 1, 0));
	}
	function Yi(e) {
		for (; e === zi;) zi = Li[--Ri], Li[Ri] = null, Bi = Li[--Ri], Li[Ri] = null;
		for (; e === Ui;) Ui = Vi[--Hi], Vi[Hi] = null, Gi = Vi[--Hi], Vi[Hi] = null, Wi = Vi[--Hi], Vi[Hi] = null;
	}
	function Xi(e, t) {
		Vi[Hi++] = Wi, Vi[Hi++] = Gi, Vi[Hi++] = Ui, Wi = t.id, Gi = t.overflow, Ui = e;
	}
	var Zi = null, K = null, q = !1, Qi = null, $i = !1, ea = Error(s(519));
	function ta(e) {
		throw sa(Ii(Error(s(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), ea;
	}
	function na(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[vt] = e, t[yt] = r, n) {
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
				$("invalid", t), $t(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				$("invalid", t);
				break;
			case "textarea": $("invalid", t), rn(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || $f(t.textContent, n) ? (r.popover != null && ($("beforetoggle", t), $("toggle", t)), r.onScroll != null && $("scroll", t), r.onScrollEnd != null && $("scrollend", t), r.onClick != null && (t.onclick = fn), t = !0) : t = !1, t || ta(e, !0);
	}
	function ra(e) {
		for (Zi = e.return; Zi;) switch (Zi.tag) {
			case 5:
			case 31:
			case 13:
				$i = !1;
				return;
			case 27:
			case 3:
				$i = !0;
				return;
			default: Zi = Zi.return;
		}
	}
	function ia(e) {
		if (e !== Zi) return !1;
		if (!q) return ra(e), q = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && K && ta(e), ra(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(317));
			K = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(317));
			K = dm(e);
		} else t === 27 ? (t = K, Sp(e.type) ? (e = um, um = null, K = e) : K = t) : K = Zi ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function aa() {
		K = Zi = null, q = !1;
	}
	function oa() {
		var e = Qi;
		return e !== null && (ud === null ? ud = e : ud.push.apply(ud, e), Qi = null), e;
	}
	function sa(e) {
		Qi === null ? Qi = [e] : Qi.push(e);
	}
	var ca = Ce(null), la = null, ua = null;
	function da(e, t, n) {
		N(ca, t._currentValue), t._currentValue = n;
	}
	function fa(e) {
		e._currentValue = ca.current, we(ca);
	}
	function pa(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function ma(e, t, n, r) {
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
						a.lanes |= n, c = a.alternate, c !== null && (c.lanes |= n), pa(a.return, n, e), r || (o = null);
						break a;
					}
					a = c.next;
				}
			} else if (i.tag === 18) {
				if (o = i.return, o === null) throw Error(s(341));
				o.lanes |= n, a = o.alternate, a !== null && (a.lanes |= n), pa(o, n, e), o = null;
			} else i.tag === 13 && i.memoizedState !== null && i.memoizedState.dehydrated === null ? (i.lanes |= n, o = i.alternate, o !== null && (o.lanes |= n), pa(i.return, n, e), o = i.child, o = o === null ? null : o.sibling) : o = i.child;
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
	function ha(e, t, n, r) {
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
					Fr(i.pendingProps.value, o.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (i === De.current) {
				if (o = i.alternate, o === null) throw Error(s(387));
				o.memoizedState.memoizedState !== i.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			i = i.return;
		}
		return e !== null && ma(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function ga(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Fr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function _a(e) {
		la = e, ua = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function va(e) {
		return ba(la, e);
	}
	function ya(e, t) {
		return la === null && _a(e), ba(e, t);
	}
	function ba(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, ua === null) {
			if (e === null) throw Error(s(308));
			ua = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else ua = ua.next = t;
		return n;
	}
	var xa = typeof AbortController < "u" ? AbortController : function() {
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
	}, Sa = t.unstable_scheduleCallback, Ca = t.unstable_NormalPriority, wa = {
		$$typeof: ce,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function Ta() {
		return {
			controller: new xa(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function Ea(e) {
		e.refCount--, e.refCount === 0 && Sa(Ca, function() {
			e.controller.abort();
		});
	}
	function Da(e, t) {
		if (e.pendingLanes & 4194048) {
			var n = e.transitionTypes;
			for (n === null && (n = e.transitionTypes = []), e = 0; e < t.length; e++) {
				var r = t[e];
				n.indexOf(r) === -1 && n.push(r);
			}
		}
	}
	var Oa = null;
	function ka(e) {
		var t = e.transitionTypes;
		return e.transitionTypes = null, t;
	}
	var Aa = null, ja = 0, Ma = 0, Na = null;
	function Pa(e, t) {
		if (Aa === null) {
			var n = Aa = [];
			ja = 0, Ma = Nf(), Na = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return ja++, t.then(Fa, Fa), t;
	}
	function Fa() {
		if (--ja === 0 && (Oa = null, Aa !== null)) {
			Na !== null && (Na.status = "fulfilled");
			var e = Aa;
			Aa = null, Ma = 0, Na = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function Ia(e, t) {
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
	var La = j.S;
	j.S = function(e, t) {
		if (pd = B(), typeof t == "object" && t && typeof t.then == "function" && Pa(e, t), Oa !== null) for (var n = yf; n !== null;) Da(n, Oa), n = n.next;
		if (n = e.types, n !== null) {
			for (var r = yf; r !== null;) Da(r, n), r = r.next;
			if (Ma !== 0) {
				r = Oa, r === null && (r = Oa = []);
				for (var i = 0; i < n.length; i++) {
					var a = n[i];
					r.indexOf(a) === -1 && r.push(a);
				}
			}
		}
		La !== null && La(e, t);
	};
	var Ra = Ce(null);
	function za() {
		var e = Ra.current;
		return e === null ? Xu.pooledCache : e;
	}
	function Ba(e, t) {
		t === null ? N(Ra, Ra.current) : N(Ra, t.pool);
	}
	function Va() {
		var e = za();
		return e === null ? null : {
			parent: wa._currentValue,
			pool: e
		};
	}
	var Ha = Error(s(460)), Ua = Error(s(474)), Wa = Error(s(542)), Ga = { then: function() {} };
	function Ka(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function qa(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(fn, fn), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Za(e), e === void 0 && !("reason" in t) ? Error(s(600)) : e;
			default:
				if (typeof t.status == "string") t.then(fn, fn);
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
					case "rejected": throw e = t.reason, Za(e), e;
				}
				throw Ya = t, Ha;
		}
	}
	function Ja(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Ya = e, Ha) : e;
		}
	}
	var Ya = null;
	function Xa() {
		if (Ya === null) throw Error(s(459));
		var e = Ya;
		return Ya = null, e;
	}
	function Za(e) {
		if (e === Ha || e === Wa) throw Error(s(483));
	}
	var Qa = null, $a = 0;
	function eo(e) {
		var t = $a;
		return $a += 1, Qa === null && (Qa = []), qa(Qa, e, t);
	}
	function to(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function no(e, t) {
		throw t.$$typeof === te ? Error(s(525)) : (e = Object.prototype.toString.call(t), Error(s(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function ro(e) {
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
			return e = Oi(e, t), e.index = 0, e.sibling = null, e;
		}
		function a(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function o(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Mi(n, e.mode, r), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var a = n.type;
			return a === ie ? (e = d(e, t, n.props.children, r, n.key), to(e, n), e) : t !== null && (t.elementType === a || typeof a == "object" && a && a.$$typeof === fe && Ja(a) === t.type) ? (t = i(t, n.props), to(t, n), t.return = e, t) : (t = Ai(n.type, n.key, n.props, null, e.mode, r), to(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = Pi(n, e.mode, r), t.return = e, t) : (t = i(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, a) {
			return t === null || t.tag !== 7 ? (t = ji(n, e.mode, r, a), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Mi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case ne: return n = Ai(t.type, t.key, t.props, null, e.mode, n), to(n, t), n.return = e, n;
					case re: return t = Pi(t, e.mode, n), t.return = e, t;
					case fe: return t = Ja(t), f(e, t, n);
				}
				if (ye(t) || _e(t)) return t = ji(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, eo(t), n);
				if (t.$$typeof === ce) return f(e, ya(e, t), n);
				no(e, t);
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
					case fe: return n = Ja(n), p(e, t, n, r);
				}
				if (ye(n) || _e(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, eo(n), r);
				if (n.$$typeof === ce) return p(e, t, ya(e, n), r);
				no(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case ne: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case re: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case fe: return r = Ja(r), m(e, t, n, r, i);
				}
				if (ye(r) || _e(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, eo(r), i);
				if (r.$$typeof === ce) return m(e, t, n, ya(t, r), i);
				no(t, r);
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
			if (h === s.length) return n(i, d), q && Ki(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (o = a(d, o, h), u === null ? l = d : u.sibling = d, u = d);
				return q && Ki(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), o = a(g, o, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), q && Ki(i, h), l;
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
			if (v.done) return n(i, h), q && Ki(i, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(i, v.value, l), v !== null && (o = a(v, o, g), d === null ? u = v : d.sibling = v, d = v);
				return q && Ki(i, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, i, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), o = a(v, o, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(i, e);
			}), q && Ki(i, g), u;
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
											n(e, r.sibling), c = i(r, a.props.children), to(c, a), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === fe && Ja(l) === r.type) {
										n(e, r.sibling), c = i(r, a.props), to(c, a), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							a.type === ie ? (c = ji(a.props.children, e.mode, c, a.key), to(c, a), c.return = e, e = c) : (c = Ai(a.type, a.key, a.props, null, e.mode, c), to(c, a), c.return = e, e = c);
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
							c = Pi(a, e.mode, c), c.return = e, e = c;
						}
						return o(e);
					case fe: return a = Ja(a), _(e, r, a, c);
				}
				if (ye(a)) return h(e, r, a, c);
				if (_e(a)) {
					if (l = _e(a), typeof l != "function") throw Error(s(150));
					return a = l.call(a), g(e, r, a, c);
				}
				if (typeof a.then == "function") return _(e, r, eo(a), c);
				if (a.$$typeof === ce) return _(e, r, ya(e, a), c);
				no(e, a);
			}
			return typeof a == "string" && a !== "" || typeof a == "number" || typeof a == "bigint" ? (a = "" + a, r !== null && r.tag === 6 ? (n(e, r.sibling), c = i(r, a), c.return = e, e = c) : (n(e, r), c = Mi(a, e.mode, c), c.return = e, e = c), o(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				$a = 0;
				var i = _(e, t, n, r);
				return Qa = null, i;
			} catch (t) {
				if (t === Ha || t === Wa) throw t;
				var a = Ei(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var io = ro(!0), ao = ro(!1), oo = !1;
	function so(e) {
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
	function co(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function lo(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function uo(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, X & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = Ci(e), Si(e, null, n), t;
		}
		return yi(e, r, t, n), Ci(e);
	}
	function fo(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, dt(e, n);
		}
	}
	function po(e, t) {
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
	var mo = !1;
	function ho() {
		if (mo) {
			var e = Na;
			if (e !== null) throw e;
		}
	}
	function go(e, t, n, r) {
		mo = !1;
		var i = e.updateQueue;
		oo = !1;
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
					f !== 0 && f === Ma && (mo = !0), u !== null && (u = u.next = {
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
							case 2: oo = !0;
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
	function _o(e, t) {
		if (typeof e != "function") throw Error(s(191, e));
		e.call(t);
	}
	function vo(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) _o(n[e], t);
	}
	var yo = Ce(null), bo = Ce(0);
	function xo(e, t) {
		e = nd, N(bo, e), N(yo, t), nd = e | t.baseLanes;
	}
	function So() {
		N(bo, nd), N(yo, yo.current);
	}
	function Co() {
		nd = bo.current, we(yo), we(bo);
	}
	var wo = Ce(null), To = null;
	function Eo(e) {
		var t = e.alternate;
		N(jo, jo.current & 1), N(wo, e), To === null && (t === null || yo.current !== null || t.memoizedState !== null) && (To = e);
	}
	function Do(e) {
		N(jo, jo.current), N(wo, e), To === null && (To = e);
	}
	function Oo(e) {
		e.tag === 22 ? (N(jo, jo.current), N(wo, e), To === null && (To = e)) : ko();
	}
	function ko() {
		N(jo, jo.current), N(wo, wo.current);
	}
	function Ao(e) {
		we(wo), To === e && (To = null), we(jo);
	}
	var jo = Ce(0);
	function Mo(e, t) {
		N(wo, wo.current), N(jo, t);
	}
	function No(e) {
		we(jo), we(wo), To === e && (To = null);
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
		for (var n = 0; n < t.length && n < e.length; n++) if (!Fr(e[n], t[n])) return !1;
		return !0;
	}
	function qo(e, t, n, r, i, a) {
		return Fo = a, J = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, j.H = e === null || e.memoizedState === null ? uc : dc, Bo = !1, a = n(r, i), Bo = !1, zo && (a = Yo(t, n, r, i)), Jo(e), a;
	}
	function Jo(e) {
		j.H = lc;
		var t = Io !== null && Io.next !== null;
		if (Fo = 0, Lo = Io = J = null, Ro = !1, Ho = 0, Uo = null, t) throw Error(s(300));
		e === null || Oc || (e = e.dependencies, e !== null && ga(e) && (Oc = !0));
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
			j.H = fc, a = t(n, r);
		} while (zo);
		return a;
	}
	function Xo() {
		var e = j.H, t = e.useState()[0];
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
		return Ho += 1, Uo === null && (Uo = []), e = qa(Uo, e, t), t = J, (Lo === null ? t.memoizedState : Lo.next) === null && (t = t.alternate, j.H = t === null || t.memoizedState === null ? uc : dc), e;
	}
	function is(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return rs(e);
			if (e.$$typeof === he) return;
			if (e.$$typeof === ce) return va(e);
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
		}, n === null && (n = ns(), J.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = me;
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
					}), f === Ma && (d = !0);
					else if ((Fo & p) === p) {
						u = u.next, p === Ma && (d = !0);
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
			if (l === null ? o = a : l.next = c, !Fr(a, e.memoizedState) && (Oc = !0, d && (n = Na, n !== null))) throw n;
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
			Fr(a, t.memoizedState) || (Oc = !0), t.memoizedState = a, t.baseQueue === null && (t.baseState = a), n.lastRenderedState = a;
		}
		return [a, r];
	}
	function us(e, t, n) {
		var r = J, i = ts(), a = q;
		if (a) {
			if (n === void 0) throw Error(s(407));
			n = n();
		} else n = t();
		var o = !Fr((Io || i).memoizedState, n);
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
			return !Fr(e, n);
		} catch {
			return !0;
		}
	}
	function hs(e) {
		var t = xi(e, 2);
		t !== null && Md(t, e, 2);
	}
	function gs(e) {
		var t = es();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Bo) {
				qe(!0);
				try {
					n();
				} finally {
					qe(!1);
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
			j.T === null ? a.isTransition = !1 : n(!0), r(a), n = t.pending, n === null ? (a.next = t.pending = a, ys(t, a)) : (a.next = n.next, t.pending = n.next = a);
		}
	}
	function ys(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = j.T, o = {};
			o.types = a === null ? null : a.types, j.T = o;
			try {
				var s = n(i, r), c = j.S;
				c !== null && c(o, s), bs(e, t, s);
			} catch (n) {
				Ss(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), j.T = a;
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
		if (q) {
			var n = Xu.formState;
			if (n !== null) {
				a: {
					var r = J;
					if (q) {
						if (K) {
							b: {
								for (var i = K, a = $i; i.nodeType !== 8;) if (!a || (i = lm(i.nextSibling), i === null)) {
									i = null;
									break b;
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								K = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						ta(r);
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
			throw e === Ha ? Wa : e;
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
			qe(!0);
			try {
				e();
			} finally {
				qe(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function Gs(e, t, n) {
		return n === void 0 || Fo & 1073741824 && !(Q & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = Ad(), J.lanes |= e, id |= e, n);
	}
	function Ks(e, t, n, r) {
		return Fr(n, t) ? n : yo.current === null ? !(Fo & 106) || Fo & 1073741824 && !(Q & 261930) ? (Oc = !0, e.memoizedState = n) : (e = Ad(), J.lanes |= e, id |= e, t) : (e = Gs(e, n, r), Fr(e, t) || (Oc = !0), e);
	}
	function qs(e, t, n, r, i) {
		var a = M.p;
		M.p = a !== 0 && 8 > a ? a : 8;
		var o = j.T, s = {};
		s.types = o === null ? null : o.types, j.T = s, ac(e, !1, t, n);
		try {
			var c = i(), l = j.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? ic(e, t, Ia(c, r), kd(e)) : ic(e, t, r, kd(e));
		} catch (n) {
			ic(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, kd());
		} finally {
			M.p = a, o !== null && s.types !== null && (o.types = s.types), j.T = o;
		}
	}
	function Js() {}
	function Ys(e, t, n, r) {
		if (e.tag !== 5) throw Error(s(476));
		var i = Xs(e).queue;
		qs(e, i, t, be, n === null ? Js : function() {
			return Zs(e), n(r);
		});
	}
	function Xs(e) {
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
				lastRenderedReducer: os,
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
		return va(sh);
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
					e = lo(n);
					var r = uo(t, e, n);
					r !== null && (Md(r, t, n), fo(r, t, n)), t = { cache: Ta() }, e.payload = t;
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
		}, oc(e) ? sc(t, n) : (n = bi(e, t, n, r), n !== null && (Md(n, e, r), cc(n, t, r)));
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
				if (i.hasEagerState = !0, i.eagerState = s, Fr(s, o)) return yi(e, t, i, 0), Xu === null && vi(), !1;
			} catch {}
			if (n = bi(e, t, i, r), n !== null) return Md(n, e, r), cc(n, t, r), !0;
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
		} else t = bi(e, n, r, 2), t !== null && Md(t, e, 2);
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
			r &= e.pendingLanes, n |= r, t.lanes = n, dt(e, n);
		}
	}
	var lc = {
		readContext: va,
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
		readContext: va,
		use: is,
		useCallback: function(e, t) {
			return es().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: va,
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
				qe(!0);
				try {
					e();
				} finally {
					qe(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = es();
			if (n !== void 0) {
				var i = n(t);
				if (Bo) {
					qe(!0);
					try {
						n(t);
					} finally {
						qe(!1);
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
			if (q) {
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
			if (q) {
				var n = Gi, r = Wi;
				n = (r & ~(1 << 32 - Je(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = Vo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
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
		readContext: va,
		use: is,
		useCallback: Us,
		useContext: va,
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
		readContext: va,
		use: is,
		useCallback: Us,
		useContext: va,
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
			var r = kd(), i = lo(r);
			i.payload = t, n != null && (i.callback = n), t = uo(e, i, r), t !== null && (Md(t, e, r), fo(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = kd(), i = lo(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = uo(e, i, r), t !== null && (Md(t, e, r), fo(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = kd(), r = lo(n);
			r.tag = 2, t != null && (r.callback = t), t = uo(e, r, n), t !== null && (Md(t, e, n), fo(t, e, n));
		}
	};
	function hc(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Ir(n, r) || !Ir(i, a) : !0;
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
		mi(e);
	}
	function yc(e) {
		console.error(e);
	}
	function bc(e) {
		mi(e);
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
		return n = lo(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			xc(e, t);
		}, n;
	}
	function wc(e) {
		return e = lo(e), e.tag = 3, e;
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
			if (t = n.alternate, t !== null && ha(t, n, i, !0), n = wo.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13:
					case 19: return To === null ? Wd() : n.alternate === null && rd === 0 && (rd = 3), n.flags &= -257, n.flags |= 65536, n.lanes = i, r === Ga ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), pf(e, r, i)), !1;
					case 22: return n.flags |= 65536, r === Ga ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), pf(e, r, i)), !1;
				}
				throw Error(s(435, n.tag));
			}
			return pf(e, r, i), Wd(), !1;
		}
		if (q) return t = wo.current, t === null ? (r !== ea && (t = Error(s(423), { cause: r }), sa(Ii(t, n))), e = e.current.alternate, e.flags |= 65536, i &= -i, e.lanes |= i, r = Ii(r, n), i = Cc(e.stateNode, r, i), po(e, i), rd !== 4 && (rd = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = i, r !== ea && (e = Error(s(422), { cause: r }), sa(Ii(e, n)))), !1;
		var a = Error(s(520), { cause: r });
		if (a = Ii(a, n), ld === null ? ld = [a] : ld.push(a), rd !== 4 && (rd = 2), t === null) return !0;
		r = Ii(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = i & -i, n.lanes |= e, e = Cc(n.stateNode, r, e), po(n, e), !1;
				case 1:
					if (t = n.type, a = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || a !== null && typeof a.componentDidCatch == "function" && (gd === null || !gd.has(a)))) return n.flags |= 65536, i &= -i, n.lanes |= i, i = wc(i), Tc(i, e, n, r), po(n, i), !1;
					break;
				case 22: if (n.memoizedState !== null) return n.flags |= 65536, !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Dc = Error(s(461)), Oc = !1;
	function kc(e, t, n, r) {
		t.child = e === null ? ao(t, null, n, r) : io(t, e.child, n, r);
	}
	function Ac(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return _a(t), r = qo(e, t, n, o, a, i), s = Zo(), e !== null && !Oc ? (Qo(e, t, i), il(e, t, i)) : (q && s && Ji(t), t.flags |= 1, kc(e, t, r, i), t.child);
	}
	function jc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !Di(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, Mc(e, t, a, r, i)) : (e = Ai(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !al(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Ir : n, n(o, r) && e.ref === t.ref) return il(e, t, i);
		}
		return t.flags |= 1, e = Oi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Mc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Ir(a, r) && e.ref === t.ref) {
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
			}, e !== null && Ba(t, a === null ? null : a.cachePool), a === null ? So() : xo(t, a), Oo(t);
			else return r = t.lanes = 536870912, Fc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && Ba(t, null), So(), ko()) : (Ba(t, a.cachePool), xo(t, a), ko(), t.memoizedState = null);
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
		var a = za();
		return a = a === null ? null : {
			parent: wa._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && Ba(t, null), So(), Oo(t), e !== null && ha(e, t, r, !0), t.childLanes = i, null;
	}
	function Ic(e, t) {
		return t = Yc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function Lc(e, t, n) {
		return io(t, e.child, null, n), e = Ic(t, t.pendingProps), e.flags |= 2, Ao(t), t.memoizedState = null, e;
	}
	function Rc(e, t, n) {
		var r = t.pendingProps, i = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (q) {
				if (r.mode === "hidden") return e = Ic(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, Pc(null, e);
				if (Do(t), (e = K) ? (e = am(e, $i), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Ui === null ? null : {
						id: Wi,
						overflow: Gi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ni(e), n.return = t, t.child = n, Zi = t, K = null)) : e = null, e === null) throw ta(t);
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
			} else if (Oc || ha(e, t, n, !1), i = (n & e.childLanes) !== 0, Oc || i) {
				if (yo.current === null) {
					if (r = Xu, r !== null && (o = ft(r, n), o !== 0 && o !== a.retryLane)) throw a.retryLane = o, xi(e, o), Md(r, e, o), Dc;
					Wd();
				}
				t = Lc(e, t, n);
			} else e = a.treeContext, K = lm(o.nextSibling), Zi = t, q = !0, Qi = null, $i = !1, e !== null && Xi(t, e), t = Ic(t, r), t.flags |= 134221824;
			return t;
		}
		return e = Oi(e.child, {
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
		return _a(t), n = qo(e, t, n, r, void 0, i), r = Zo(), e !== null && !Oc ? (Qo(e, t, i), il(e, t, i)) : (q && r && Ji(t), t.flags |= 1, kc(e, t, n, i), t.child);
	}
	function Vc(e, t, n, r, i, a) {
		return _a(t), t.updateQueue = null, n = Yo(t, r, n, i), Jo(e), r = Zo(), e !== null && !Oc ? (Qo(e, t, a), il(e, t, a)) : (q && r && Ji(t), t.flags |= 1, kc(e, t, n, a), t.child);
	}
	function Hc(e, t, n, r, i) {
		if (_a(t), t.stateNode === null) {
			var a = wi, o = n.contextType;
			typeof o == "object" && o && (a = va(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = mc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, so(t), o = n.contextType, a.context = typeof o == "object" && o ? va(o) : wi, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (pc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && mc.enqueueReplaceState(a, a.state, null), go(t, r, a, i), ho(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = _c(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = wi, typeof u == "object" && u && (o = va(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && gc(t, a, r, o), oo = !1;
			var f = t.memoizedState;
			a.state = f, go(t, r, a, i), ho(), l = t.memoizedState, s || f !== l || oo ? (typeof d == "function" && (pc(t, n, d, r), l = t.memoizedState), (c = oo || hc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, co(e, t), o = t.memoizedProps, u = _c(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = wi, typeof l == "object" && l && (c = va(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && gc(t, a, r, c), oo = !1, f = t.memoizedState, a.state = f, go(t, r, a, i), ho();
			var p = t.memoizedState;
			o !== d || f !== p || oo || e !== null && e.dependencies !== null && ga(e.dependencies) ? (typeof s == "function" && (pc(t, n, s, r), p = t.memoizedState), (u = oo || hc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && ga(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, zc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = io(t, e.child, null, i), t.child = io(t, null, n, i)) : kc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = il(e, t, i), e;
	}
	function Uc(e, t, n, r) {
		return aa(), t.flags |= 256, kc(e, t, n, r), t.child;
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
			cachePool: Va()
		};
	}
	function Kc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= sd), e;
	}
	function qc(e, t, n) {
		var r = t.pendingProps, i = !1, a = !!(t.flags & 128), o;
		if ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : !!(jo.current & 2)), o && (i = !0, t.flags &= -129), o = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (q) {
				if (i ? Eo(t) : ko(), (e = K) ? (e = am(e, $i), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Ui === null ? null : {
						id: Wi,
						overflow: Gi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ni(e), n.return = t, t.child = n, Zi = t, K = null)) : e = null, e === null) throw ta(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (ko(), i = t.mode, a = Yc({
				mode: "hidden",
				children: a
			}, i), r = ji(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = Gc(n), r.childLanes = Kc(e, o, n), t.memoizedState = Wc, Pc(null, r)) : (Eo(t), Jc(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return Zc(e, t, a, o, r, c, s, n);
		}
		return i ? (ko(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = Oi(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = ji(i, a, n, null), i.flags |= 2) : i = Oi(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, Pc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = Gc(n) : (a = i.cachePool, a === null ? a = Va() : (s = wa._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = Kc(e, o, n), t.memoizedState = Wc, Pc(e.child, r)) : (Eo(t), n = e.child, e = n.sibling, n = Oi(n, {
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
		return e = Ei(22, e, null, t), e.lanes = 0, e;
	}
	function Xc(e, t, n) {
		return io(t, e.child, null, n), e = Jc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Zc(e, t, n, r, i, a, o, c) {
		if (n) return t.flags & 256 ? (Eo(t), t.flags &= -257, Xc(e, t, c)) : t.memoizedState === null ? (ko(), a = i.fallback, o = t.mode, i = Yc({
			mode: "visible",
			children: i.children
		}, o), a = ji(a, o, c, null), a.flags |= 2, i.return = t, a.return = t, i.sibling = a, t.child = i, io(t, e.child, null, c), i = t.child, i.memoizedState = Gc(c), i.childLanes = Kc(e, r, c), t.memoizedState = Wc, Pc(null, i)) : (ko(), t.child = e.child, t.flags |= 128, null);
		if (Eo(t), sm(a)) {
			if (r = a.nextSibling && a.nextSibling.dataset, r) var l = r.dgst;
			return r = l, r !== "" && (i = Error(s(419)), i.stack = "", i.digest = r, sa({
				value: i,
				source: null,
				stack: null
			})), Xc(e, t, c);
		}
		if (Oc || ha(e, t, c, !1), r = (c & e.childLanes) !== 0, Oc || r) {
			if (yo.current !== null) return Xc(e, t, c);
			if (r = Xu, r !== null && (i = ft(r, c), i !== 0 && i !== o.retryLane)) throw o.retryLane = i, xi(e, i), Md(r, e, i), Dc;
			return om(a) || Wd(), Xc(e, t, c);
		}
		return om(a) ? (t.flags |= 192, t.child = e.child, null) : (e = o.treeContext, K = lm(a.nextSibling), Zi = t, q = !0, Qi = null, $i = !1, e !== null && Xi(t, e), t = Jc(t, i.children), t.flags |= 134221824, t);
	}
	function Qc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), pa(e.return, t, n);
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
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Mo(t, o), i === "backwards" && e !== null ? (tl(e), kc(e, t, r, n), tl(e)) : kc(e, t, r, n), r = q ? Bi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
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
		return da(t, t.type, r.value), kc(e, t, r.children, n), t.child;
	}
	function il(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), id |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (ha(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(s(153));
		if (t.child !== null) {
			for (e = t.child, n = Oi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Oi(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function al(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && ga(e)));
	}
	function ol(e, t, n) {
		switch (t.tag) {
			case 3:
				Oe(t, t.stateNode.containerInfo), da(t, wa, e.memoizedState.cache), aa();
				break;
			case 27:
			case 5:
				Ae(t);
				break;
			case 4:
				Oe(t, t.stateNode.containerInfo);
				break;
			case 10:
				da(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, Do(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) {
					if (r.dehydrated !== null) return Eo(t), t.flags |= 128, null;
					r = ha(e, t, n, !1);
					var i = t.child.childLanes;
					return r || (n & i) !== 0 ? qc(e, t, n) : (Eo(t), e = il(e, t, n), e === null ? null : e.sibling);
				}
				Eo(t);
				break;
			case 19:
				if (t.flags & 128) return nl(e, t, n);
				if (i = !!(e.flags & 128), r = (n & t.childLanes) !== 0, r ||= (ha(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return nl(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Mo(t, jo.current), r) break;
				return null;
			case 22: return t.lanes = 0, Nc(e, t, n, t.pendingProps);
			case 24: da(t, wa, e.memoizedState.cache);
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
		} else Oc = !1, q && t.flags & 1048576 && qi(t, Bi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ja(t.elementType), t.type = e, typeof e == "function") Di(e) ? (r = _c(e, r), t.tag = 1, t = Hc(null, t, e, r, n)) : (t.tag = 0, t = Bc(null, t, e, r, n));
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
						throw t = ve(e) || e, Error(s(306, t, ""));
					}
				}
				return t;
			case 0: return Bc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, i = _c(r, t.pendingProps), Hc(e, t, r, i, n);
			case 3:
				a: {
					if (Oe(t, t.stateNode.containerInfo), e === null) throw Error(s(387));
					r = t.pendingProps;
					var a = t.memoizedState;
					i = a.element, co(e, t), go(t, r, null, n);
					var o = t.memoizedState;
					if (r = o.cache, da(t, wa, r), r !== a.cache && ma(t, [wa], n, !0), ho(), r = o.element, a.isDehydrated) {
						if (a = {
							element: r,
							isDehydrated: !1,
							cache: o.cache
						}, t.updateQueue.baseState = a, t.memoizedState = a, t.flags & 256) {
							t = Uc(e, t, r, n);
							break a;
						}
						if (r !== i) {
							i = Ii(Error(s(424)), t), sa(i), t = Uc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (K = lm(e.firstChild), Zi = t, q = !0, Qi = null, $i = !0, n = ao(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (aa(), r === i) {
							t = il(e, t, n);
							break a;
						}
						kc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return zc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : q || (t.stateNode = fp(t.type, t.pendingProps, P.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return Ae(t), e === null && q && (r = t.stateNode = hm(t.type, t.pendingProps, P.current), Zi = t, $i = !0, i = K, Sp(t.type) ? (um = i, K = lm(r.firstChild)) : K = i), kc(e, t, t.pendingProps.children, n), zc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && q && ((i = r = K) && (r = rm(r, t.type, t.pendingProps, $i), r === null ? i = !1 : (t.stateNode = r, Zi = t, K = lm(r.firstChild), $i = !1, i = !0)), i || ta(t)), Ae(t), i = t.type, a = t.pendingProps, o = e === null ? null : e.memoizedProps, r = a.children, pp(i, a) ? r = null : o !== null && pp(i, o) && (t.flags |= 32), t.memoizedState !== null && (i = qo(e, t, Xo, null, null, n), sh._currentValue = i), zc(e, t), kc(e, t, r, n), t.child;
			case 6: return e === null && q && ((e = n = K) && (n = im(n, t.pendingProps, $i), n === null ? e = !1 : (t.stateNode = n, Zi = t, K = null, e = !0)), e || ta(t)), null;
			case 13: return qc(e, t, n);
			case 4: return Oe(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = io(t, null, r, n) : kc(e, t, r, n), t.child;
			case 11: return Ac(e, t, t.type, t.pendingProps, n);
			case 7: return r = t.pendingProps, zc(e, t), kc(e, t, r, n), t.child;
			case 8: return kc(e, t, t.pendingProps.children, n), t.child;
			case 12: return kc(e, t, t.pendingProps.children, n), t.child;
			case 10: return rl(e, t, n);
			case 9: return i = t.type._context, r = t.pendingProps.children, _a(t), i = va(i), r = r(i), t.flags |= 1, kc(e, t, r, n), t.child;
			case 14: return jc(e, t, t.type, t.pendingProps, n);
			case 15: return Mc(e, t, t.type, t.pendingProps, n);
			case 19: return nl(e, t, n);
			case 31: return Rc(e, t, n);
			case 22: return Nc(e, t, n, t.pendingProps);
			case 24: return _a(t), r = va(wa), e === null ? (i = za(), i === null && (i = Xu, a = Ta(), i.pooledCache = a, a.refCount++, a !== null && (i.pooledCacheLanes |= n), i = a), t.memoizedState = {
				parent: r,
				cache: i
			}, so(t), da(t, wa, i)) : ((e.lanes & n) !== 0 && (co(e, t), go(t, null, null, n), ho()), i = e.memoizedState, a = t.memoizedState, i.parent === r ? (r = a.cache, da(t, wa, r), r !== i.cache && ma(t, [wa], n, !0)) : (i = {
				parent: r,
				cache: r
			}, t.memoizedState = i, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i), da(t, wa, r))), kc(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : q && Ji(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : zc(e, t), kc(e, t, r.children, n), t.child;
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
				else throw Ya = Ga, Ua;
			}
		} else e.flags &= -16777217;
	}
	function ul(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ym(t)) {
			if (Vd()) e.flags |= 8192;
			else throw Ya = Ga, Ua;
		}
	}
	function dl(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : ot(), e.lanes |= t, cd |= t);
	}
	function fl(e, t) {
		if (!q) switch (e.tailMode) {
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
		switch (Yi(t), t.tag) {
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
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), fa(wa), ke(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (ia(t) ? cl(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, oa())), pl(t), null;
			case 26:
				var i = t.type, a = t.memoizedState;
				return e === null ? (cl(t), a === null ? (pl(t), ll(t, i, null, r, n)) : (pl(t), ul(t, a))) : a ? a === e.memoizedState ? (pl(t), t.flags &= -16777217) : (cl(t), pl(t), ul(t, a)) : (e = e.memoizedProps, e !== r && cl(t), pl(t), ll(t, i, e, r, n)), null;
			case 27:
				if (je(t), n = P.current, i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && cl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(s(166));
						return pl(t), t.subtreeFlags &= -33554433, null;
					}
					e = Te.current, ia(t) ? na(t, e) : (e = hm(i, r, n), t.stateNode = e, cl(t));
				}
				return pl(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (je(t), i = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && cl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(s(166));
						return pl(t), t.subtreeFlags &= -33554433, null;
					}
					if (a = Te.current, ia(t)) na(t, a);
					else {
						var o = lp(P.current);
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
						a[vt] = t, a[yt] = r;
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
					if (e = P.current, ia(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, i = Zi, i !== null) switch (i.tag) {
							case 27:
							case 5: r = i.memoizedProps;
						}
						e[vt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || $f(e.nodeValue, n)), e || ta(t, !0);
					} else e = lp(e).createTextNode(r), e[vt] = t, t.stateNode = e;
				}
				return pl(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = ia(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(s(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(s(557));
							e[vt] = t;
						} else aa(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						pl(t), e = !1;
					} else n = oa(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (Ao(t), t) : (Ao(t), null);
					if (t.flags & 128) throw Error(s(558));
				}
				return pl(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (i = ia(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!i) throw Error(s(318));
							if (i = t.memoizedState, i = i === null ? null : i.dehydrated, !i) throw Error(s(317));
							i[vt] = t;
						} else aa(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						pl(t), i = !1;
					} else i = oa(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i), i = !0;
					if (!i) return t.flags & 256 ? (Ao(t), t) : (Ao(t), null);
				}
				return Ao(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, i = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (i = r.alternate.memoizedState.cachePool.pool), a = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (a = r.memoizedState.cachePool.pool), a !== i && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), dl(t, t.updateQueue), pl(t), null);
			case 4: return ke(), e === null && Uf(t.stateNode.containerInfo), t.flags |= 67108864, pl(t), null;
			case 10: return fa(t.type), pl(t), null;
			case 19:
				if (No(t), r = t.memoizedState, r === null) return pl(t), null;
				if (i = !!(t.flags & 128), a = r.rendering, a === null) {
					if (i) fl(r, !1);
					else {
						if (rd !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (a = Po(e), a !== null) {
								for (t.flags |= 128, fl(r, !1), e = a.updateQueue, t.updateQueue = e, dl(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) ki(n, e), n = n.sibling;
								return Mo(t, jo.current & 1 | 2), q && Ki(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && B() > md && (t.flags |= 128, i = !0, fl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!i) {
						if (e = Po(a), e !== null) {
							if (t.flags |= 128, i = !0, e = e.updateQueue, t.updateQueue = e, dl(t, e), fl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !a.alternate && !q) return pl(t), null;
						} else 2 * B() - r.renderingStartTime > md && n !== 536870912 && (t.flags |= 128, i = !0, fl(r, !1), t.lanes = 4194304);
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
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = B(), e.sibling = null, a = jo.current, a = i ? a & 1 | 2 : a & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || q ? Mo(t, a) : (n = a, N(wo, t), N(jo, n), To === null && (To = t)), q && Ki(t, r.treeForkCount), e;
				}
				return pl(t), null;
			case 22:
			case 23: return Ao(t), Co(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (pl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : pl(t), n = t.updateQueue, n !== null && dl(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && we(Ra), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), fa(wa), pl(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, pl(t), null;
		}
		throw Error(s(156, t.tag));
	}
	function hl(e, t) {
		switch (Yi(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return fa(wa), ke(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return je(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (Ao(t), t.alternate === null) throw Error(s(340));
					aa();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (Ao(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(s(340));
					aa();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return No(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return ke(), null;
			case 10: return fa(t.type), null;
			case 22:
			case 23: return Ao(t), Co(), e !== null && we(Ra), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return fa(wa), null;
			case 25: return null;
			default: return null;
		}
	}
	function gl(e, t) {
		switch (Yi(t), t.tag) {
			case 3:
				fa(wa), ke();
				break;
			case 26:
			case 27:
			case 5:
				je(t);
				break;
			case 4:
				ke();
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
				fa(t.type);
				break;
			case 22:
			case 23:
				Ao(t), Co(), e !== null && we(Ra);
				break;
			case 24: fa(wa);
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
				vo(t, n);
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
						var i = e.stateNode, a = di(e.memoizedProps, i);
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
			ip(r, e.type, n, t), r[yt] = t;
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
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = fn)), Cl(e, r), U = !0;
		else if (i !== 4 && (i === 27 && (Cl(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (Ml(e, t, n, r), e = e.sibling; e !== null;) Ml(e, t, n, r), e = e.sibling;
	}
	function Nl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), Cl(e, r), U = !0;
		else if (i !== 4 && (i === 27 && (Cl(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (Nl(e, t, n, r), e = e.sibling; e !== null;) Nl(e, t, n, r), e = e.sibling;
	}
	function Pl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			np(t, r, n), t[vt] = e, t[yt] = n;
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
				t = pi(t.default, t.share), t !== "none" && (Vl(e, n, t, null, !1) || Ul(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function Gl(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = di(r, n), a = pi(r.default, n.paired ? r.share : r.enter);
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
								var a = pi(n.default, n.share);
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
			var t = e.memoizedProps, n = di(t, e.stateNode), r = Il === null ? void 0 : Il.get(n), i = pi(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (Vl(e, n, i, null, !1) ? r === void 0 ? jd(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, Il.delete(n), jd(e, t.onShare)) : Ul(e.child, !1)), Il !== null && Kl(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) ql(e), e = e.sibling;
		else Il !== null && Kl(e);
	}
	function Jl(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = di(t, e.stateNode);
				t = pi(t.default, t.update), e.flags &= -5, t !== "none" && Vl(e, n, t, e.memoizedState = [], !1);
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
				var n = e.memoizedProps, r = e.stateNode, i = di(n, r), a = pi(n.default, n.update);
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
		if (e = e.containerInfo, sp = gh, e = Vr(e), Hr(e)) {
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
					n && r !== null && (n = di(r.memoizedProps, r.stateNode), i = t.memoizedProps, i = pi(i.default, i.update), i !== "none" && Vl(r, n, i, r.memoizedState = [], !0));
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
						vo(e, t);
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
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, U = !0;
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
		t !== null && (e.alternate = null, hu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Dt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var gu = null, _u = !1;
	function vu(e, t, n) {
		for (n = n.child; n !== null;) yu(e, t, n), n = n.sibling;
	}
	function yu(e, t, n) {
		if (Ke && typeof Ke.onCommitFiberUnmount == "function") try {
			Ke.onCommitFiberUnmount(Ge, n);
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
						(gu.nodeType === 9 ? gu.body : gu.nodeName === "HTML" ? gu.ownerDocument.body : gu).removeChild(n.stateNode), U = !0;
					} catch (e) {
						ff(n, t, e);
					}
					else try {
						gu.removeChild(n.stateNode), U = !0;
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
												r = i.getElementsByTagName("title")[0], (!r || r[Tt] || r[vt] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = i.createElement(t), i.head.insertBefore(r, i.querySelector("head > title"))), np(r, t, n), r[vt] = e, Mt(r), t = r;
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
										r[vt] = e, Mt(r), t = r;
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
						G(t, ""), U = !0;
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
						n.nodeValue = t, U = !0;
					} catch (t) {
						ff(e, e.return, t);
					}
				}
				break;
			case 3:
				if (U = !1, Wm = null, a = Tu, Tu = bm(t.containerInfo), wu(t, e, n), Tu = a, Du(e), i & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					ff(e, e.return, t);
				}
				nu && (nu = !1, Ou(e)), U = !1;
				break;
			case 4:
				i = tu, tu = eu, r = Ht(), a = Tu, Tu = bm(e.stateNode.containerInfo), wu(t, e, n), Du(e), Tu = a, U && ou && (su = !0), U = r, tu = i;
				break;
			case 12:
				wu(t, e, n), Du(e);
				break;
			case 31:
				wu(t, e, n), Du(e), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Cu(e, t)));
				break;
			case 13:
				wu(t, e, n), Du(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (fd = B()), i & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Cu(e, t)));
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
				i & 512 && (Y || r === null || Sl(r, r.return)), i = Ht(), a = ou, o = (n & 335544064) === n, c = e.memoizedProps, ou = o && pi(c.default, c.update) !== "none", wu(t, e, n), Du(e), o && r !== null && U && (e.flags |= 4), ou = a, U = i;
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
						n.flags & 32 && (G(l, ""), n.flags &= -33), Nl(e, jl(e), l, o);
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
				t = di(a, o), o = di(n.memoizedProps, o);
				var s = pi(a.default, a.update);
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
							if (l !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < l.length; i++) _o(l[i], c);
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
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && Ea(n));
	}
	function Fu(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && Ea(e));
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
				Iu(e, t, n, r), i && cu && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && Ea(a)));
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
				case 24: Ea(n.memoizedState.cache);
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
			var t = va(wa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return va(wa).controller.signal;
		}
	}, Yu = typeof WeakMap == "function" ? WeakMap : Map, X = 0, Xu = null, Z = null, Q = 0, Zu = 0, Qu = null, $u = !1, ed = !1, td = !1, nd = 0, rd = 0, id = 0, ad = 0, od = 0, sd = 0, cd = 0, ld = null, ud = null, dd = !1, fd = 0, pd = 0, md = Infinity, hd = null, gd = null, _d = 0, vd = null, yd = null, bd = 0, xd = 0, Sd = null, Cd = null, wd = null, Td = null, Ed = null, Dd = 0, Od = null;
	function kd() {
		return X & 2 && Q !== 0 ? Q & -Q : j.T === null ? ht() : Nf();
	}
	function Ad() {
		if (sd === 0) {
			if (!(Q & 536870912) || q) {
				var e = $e;
				$e <<= 1, !($e & 3932160) && ($e = 262144), sd = e;
			} else sd = 536870912;
		}
		return e = wo.current, e !== null && (e.flags |= 32), sd;
	}
	function jd(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(di(e.memoizedProps, n))), Td === null && (Td = []), Td.push(t.bind(null, r));
		}
	}
	function Md(e, t, n) {
		(e === Xu && (Zu === 2 || Zu === 9) || e.cancelPendingCommit !== null) && (zd(e, 0), Id(e, Q, sd, !1)), ct(e, n), X & 2 && e === Xu || (e === Xu && (!(X & 2) && (ad |= n), rd === 4 && Id(e, Q, sd, !1)), Tf(e));
	}
	function Nd(e, t, n) {
		if (X & 6) throw Error(s(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || rt(e, t), i = r ? qd(e, t) : Gd(e, t, !0), a = r;
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
						if (Id(r, t, sd, !$u), nt(r, 0, !0) !== 0) break a;
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
			unsuspend: fn
		}, Il = null, Hu(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? fd - B() : (a & 4194048) === a ? pd - B() : 0, m = eh(d, m), m !== null) ? (bd = a, e.cancelPendingCommit = m(ef.bind(null, e, t, a, n, r, i, o, s, c, l, u, d, null, f, p)), Id(e, a, o, !l)) : ef(e, t, a, n, r, i, o, s, c, l, u, d);
	}
	function Fd(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Fr(a(), i)) return !1;
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
		t = it(e, t), t &= ~od, t &= ~ad, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - Je(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && ut(e, n, t);
	}
	function Ld() {
		return X & 6 ? !0 : (Ef(0, !1), !1);
	}
	function Rd() {
		if (Z !== null) {
			if (Zu === 0) var e = Z.return;
			else e = Z, ua = la = null, $o(e), Qa = null, $a = 0, e = Z;
			for (; e !== null;) gl(e.alternate, e), e = e.return;
			Z = null;
		}
	}
	function zd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), bd = 0, Rd(), Xu = e, Z = n = Oi(e.current, null), Q = t, Zu = 0, Qu = null, $u = !1, ed = rt(e, t), td = !1, cd = sd = od = ad = id = rd = 0, ud = ld = null, dd = !1, nd = it(e, t), vi(), n;
	}
	function Bd(e, t) {
		J = null, j.H = lc, t === Ha || t === Wa ? (t = Xa(), Zu = 3) : t === Ua ? (t = Xa(), Zu = 4) : Zu = t === Dc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Qu = t, Z === null && (rd = 1, xc(e, Ii(t, e.current)));
	}
	function Vd() {
		var e = wo.current;
		return e === null ? !0 : (Q & 4194048) === Q ? To === null : (Q & 62914560) === Q || Q & 536870912 ? e === To : !1;
	}
	function Hd() {
		var e = j.H;
		return j.H = lc, e === null ? lc : e;
	}
	function Ud() {
		var e = j.A;
		return j.A = Ju, e;
	}
	function Wd() {
		rd = 4, $u || (Q & 4194048) !== Q && wo.current !== null || (ed = !0), !(id & 134217727) && !(ad & 134217727) || Xu === null || Id(Xu, Q, sd, !1);
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
							wo.current === null && (t = !0);
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
		return t && e.shellSuspendCounter++, ua = la = null, X = r, j.H = i, j.A = a, Z === null && (Xu = null, Q = 0, vi()), o;
	}
	function Kd() {
		for (; Z !== null;) Yd(Z);
	}
	function qd(e, t) {
		var n = X;
		X |= 2;
		var r = Hd(), i = Ud();
		Xu !== e || Q !== t ? (hd = null, md = B() + 500, zd(e, t)) : ed = rt(e, t);
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
							if (Ka(a)) {
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
							Ka(a) ? (Zu = 0, Qu = null, Xd(t)) : (Zu = 0, Qu = null, Zd(e, t, a, 7));
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
		return ua = la = null, j.H = r, j.A = i, X = n, Z === null ? (Xu = null, Q = 0, vi(), rd) : 0;
	}
	function Jd() {
		for (; Z !== null && !Le();) Yd(Z);
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
				r === Zi && (q ? (ra(r), r.tag === 5 && r.stateNode != null && (K = r.stateNode)) : (ra(r), q = !0));
			default: gl(n, t), t = Z = ki(t, nd), t = sl(n, t, nd);
		}
		e.memoizedProps = e.pendingProps, t === null ? Qd(e) : Z = t;
	}
	function Zd(e, t, n, r) {
		ua = la = null, $o(t), Qa = null, $a = 0;
		var i = t.return;
		try {
			if (Ec(e, i, t, n, Q)) {
				rd = 1, xc(e, Ii(n, e.current)), Z = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw Z = i, t;
			rd = 1, xc(e, Ii(n, e.current)), Z = null;
			return;
		}
		t.flags & 32768 ? (q || r === 1 ? e = !0 : ed || Q & 536870912 ? e = !1 : ($u = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = wo.current, r !== null && r.tag === 13 && (r.flags |= 16384))), $d(t, e)) : Qd(t);
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
		if (xd = s, s |= _i, lt(e, n, s, r, i, a), Td = null, (n & 335544064) === n ? (Ed = ka(e), r = 10262) : (Ed = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, vf(H, function() {
			return uf(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Fl = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = j.T, j.T = null, i = M.p, M.p = 2, a = X, X |= 4;
			try {
				lu(e, t, n);
			} finally {
				X = a, M.p = i, j.T = r;
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
				r = j.T, j.T = null;
				var i = M.p;
				M.p = 2;
				var a = X;
				X |= 4;
				try {
					ou = su = !1, Eu(t, e, n), n = cp;
					var o = Vr(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && Br(s.ownerDocument.documentElement, s)) {
						if (c !== null && Hr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = zr(s, h), v = zr(s, g);
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
					X = a, M.p = i, j.T = r;
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
				var i = X;
				X |= 4;
				try {
					du(e, t.alternate, t);
				} finally {
					X = i, M.p = r, j.T = n;
				}
			}
			_d = 3;
		}
	}
	function sf() {
		if (_d === 4 || _d === 3) {
			_d = 0;
			var e = wd;
			wd = null, Re();
			var t = vd, n = yd, r = bd, i = Cd, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? _d = 5 : (_d = 0, yd = vd = null, cf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (gd = null), mt(r), n = n.stateNode, Ke && typeof Ke.onCommitFiberRoot == "function") try {
				Ke.onCommitFiberRoot(Ge, n, void 0, (n.current.flags & 128) == 128);
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
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, Ea(t)));
	}
	function lf() {
		return wd !== null && (wd.skipTransition(), wd = null), af(), of(), sf(), uf();
	}
	function uf() {
		if (_d !== 5) return !1;
		var e = vd, t = xd;
		xd = 0;
		var n = mt(bd), r = j.T, i = M.p;
		try {
			M.p = 32 > n ? 32 : n, j.T = null, n = Sd, Sd = null;
			var a = vd, o = bd;
			if (_d = 0, yd = vd = null, bd = 0, X & 6) throw Error(s(331));
			var c = X;
			if (X |= 4, Gu(a.current), Lu(a, a.current, o, n), X = c, Ef(0, !1), Ke && typeof Ke.onPostCommitFiberRoot == "function") try {
				Ke.onPostCommitFiberRoot(Ge, a);
			} catch {}
			return !0;
		} finally {
			M.p = i, j.T = r, cf(e, t);
		}
	}
	function df(e, t, n) {
		t = Ii(n, t), t = Cc(e.stateNode, t, 2), e = uo(e, t, 2), e !== null && (ct(e, 2), Tf(e));
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
					e = Ii(n, e), n = wc(2), r = uo(t, n, 2), r !== null && (Tc(n, r, t, e), ct(r, 2), Tf(r));
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
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, Xu === e && (Q & n) === n && (rd === 4 || rd === 3 && (Q & 62914560) === Q && 300 > B() - fd ? X & 2 ? od |= n : zd(e, 0) : od |= n, cd === Q && (cd = 0)), Tf(e);
	}
	function hf(e, t) {
		t === 0 && (t = ot()), e = xi(e, t), e !== null && (ct(e, t), Tf(e));
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
		return R(e, t);
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
								a = (1 << 31 - Je(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, jf(r, a));
						} else a = Q, a = nt(r, r === Xu ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || rt(r, a) || (n = !0, jf(r, a));
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
			var o = 31 - Je(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = at(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Xu, n = Q, n = nt(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Zu === 2 || Zu === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && z(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || rt(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && z(r), mt(n)) {
				case 2:
				case 8:
					n = Be;
					break;
				case 32:
					n = H;
					break;
				case 268435456:
					n = He;
					break;
				default: n = H;
			}
			return r = Af.bind(null, e), n = R(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && z(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function Af(e, t) {
		if (_d !== 0 && _d !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (lf() && e.callbackNode !== n) return null;
		var r = Q;
		return r = nt(e, e === Xu ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Nd(e, r, t), kf(e, B()), e.callbackNode != null && e.callbackNode === n ? Af.bind(null, e) : null);
	}
	function jf(e, t) {
		if (lf()) return null;
		Nd(e, t, !0);
	}
	function Mf() {
		bp(function() {
			X & 6 ? R(ze, Df) : Of();
		});
	}
	function Nf() {
		if (wf === 0) {
			var e = Ma;
			e === 0 && (e = Qe, Qe <<= 1, !(Qe & 261888) && (Qe = 256)), wf = e;
		}
		return wf;
	}
	function Pf(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : dn(e);
	}
	function Ff(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Pf((i[yt] || null).action), o = r.submitter;
			o && (t = (t = o[yt] || null) ? Pf(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new Nn("action", "action", null, r, i);
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
	for (var If = 0; If < ci.length; If++) {
		var Lf = ci[If];
		li(Lf.toLowerCase(), "on" + (Lf[0].toUpperCase() + Lf.slice(1)));
	}
	li(ei, "onAnimationEnd"), li(ti, "onAnimationIteration"), li(ni, "onAnimationStart"), li("dblclick", "onDoubleClick"), li("focusin", "onFocus"), li("focusout", "onBlur"), li(ri, "onTransitionRun"), li(ii, "onTransitionStart"), li(ai, "onTransitionCancel"), li(oi, "onTransitionEnd"), Lt("onMouseEnter", ["mouseout", "mouseover"]), Lt("onMouseLeave", ["mouseout", "mouseover"]), Lt("onPointerEnter", ["pointerout", "pointerover"]), Lt("onPointerLeave", ["pointerout", "pointerover"]), It("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), It("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), It("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), It("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), It("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), It("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
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
						mi(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						mi(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function $(e, t) {
		var n = t[xt];
		n === void 0 && (n = t[xt] = /* @__PURE__ */ new Set());
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
			e[Hf] = !0, Pt.forEach(function(t) {
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
		n = i.bind(null, t, n, e), i = void 0, !Sn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
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
					if (o = Ot(s), o === null) return;
					if (c = o.tag, c === 5 || c === 6 || c === 26 || c === 27) {
						r = a = o;
						continue a;
					}
					s = s.parentNode;
				}
			}
			r = r.return;
		}
		yn(function() {
			var r = a, i = mn(n), o = [];
			a: {
				var s = si.get(e);
				if (s !== void 0) {
					var c = Nn, u = e;
					switch (e) {
						case "keypress": if (On(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = Zn;
							break;
						case "focusin":
							u = "focus", c = Hn;
							break;
						case "focusout":
							u = "blur", c = Hn;
							break;
						case "beforeblur":
						case "afterblur":
							c = Hn;
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
							c = Bn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = Vn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = er;
							break;
						case ei:
						case ti:
						case ni:
							c = Un;
							break;
						case oi:
							c = tr;
							break;
						case "scroll":
						case "scrollend":
							c = Fn;
							break;
						case "wheel":
							c = nr;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = Wn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							c = Qn;
							break;
						case "submit":
							c = $n;
							break;
						case "toggle":
						case "beforetoggle": c = rr;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? s === null ? null : s + "Capture" : s;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = bn(m, p), g != null && d.push(Kf(m, g, h))), f) break;
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
					if (c = e === "mouseover" || e === "pointerover", s = e === "mouseout" || e === "pointerout", c && n !== pn && (u = n.relatedTarget || n.fromElement) && (Ot(u) || u[bt])) break a;
					(s || c) && (u = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, s ? (c = n.relatedTarget || n.toElement, s = r, c = c ? Ot(c) : null, c !== null && (f = l(c), d = c.tag, c !== f || d !== 5 && d !== 27 && d !== 6) && (c = null)) : (s = null, c = r), s !== c && (d = Bn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Qn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = s == null ? u : At(s), h = c == null ? u : At(c), u = new d(g, m + "leave", s, n, i), u.target = f, u.relatedTarget = h, g = null, Ot(i) === r && (d = new d(p, m + "enter", c, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = s && c ? T(s, c, Jf) : null, s !== null && Yf(o, u, s, d, !1), c !== null && f !== null && Yf(o, f, c, d, !0)));
				}
				a: {
					if (s = r ? At(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var _ = Cr;
					else if (_r(s)) {
						if (wr) _ = Nr;
						else {
							_ = jr;
							var v = Ar;
						}
					} else c = s.nodeName, !c || c.toLowerCase() !== "input" || s.type !== "checkbox" && s.type !== "radio" ? r && cn(r.elementType) && (_ = Cr) : _ = Mr;
					if (_ &&= _(e, r)) {
						vr(o, _, n, i);
						break a;
					}
					v && v(e, s, r);
				}
				switch (v = r ? At(r) : window, e) {
					case "focusin":
						(_r(v) || v.contentEditable === "true") && (Wr = v, Gr = r, Kr = null);
						break;
					case "focusout":
						Kr = Gr = Wr = null;
						break;
					case "mousedown":
						qr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						qr = !1, Jr(o, n, i);
						break;
					case "selectionchange": if (Ur) break;
					case "keydown":
					case "keyup": Jr(o, n, i);
				}
				var y;
				if (ar) b: {
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
				else pr ? dr(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (cr && n.locale !== "ko" && (pr || b !== "onCompositionStart" ? b === "onCompositionEnd" && pr && (y = Dn()) : (wn = i, Tn = "value" in wn ? wn.value : wn.textContent, pr = !0)), v = qf(r, b), 0 < v.length && (b = new Gn(b, e, null, n, i), o.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = fr(n), y !== null && (b.data = y)))), (y = sr ? mr(e, n) : hr(e, n)) && (b = qf(r, "onBeforeInput"), 0 < b.length && (v = new Gn("onBeforeInput", "beforeinput", null, n, i), o.push({
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
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = bn(e, n), i != null && r.unshift(Kf(e, i, a)), i = bn(e, t), i != null && r.push(Kf(e, i, a))), e.tag === 3) return r;
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
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = bn(n, a), l != null && o.unshift(Kf(n, l, c))) : i || (l = bn(n, a), l != null && o.push(Kf(n, l, c)))), n = n.return;
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
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || G(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && G(e, "" + r);
				else return;
				break;
			case "className":
				Wt(e, "class", r);
				break;
			case "tabIndex":
				Wt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Wt(e, n, r);
				break;
			case "style":
				sn(e, r, a);
				return;
			case "data": if (t !== "object") {
				Wt(e, "data", r);
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
				r != null && (e.onclick = fn);
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
				$("beforetoggle", e), $("toggle", e), Ut(e, "popover", r);
				break;
			case "xlinkActuate":
				Gt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Gt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Gt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Gt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Gt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Gt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Gt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Gt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Gt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Ut(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = ln.get(n) || n, Ut(e, n, r);
			else return;
		}
		U = !0;
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
				if (typeof r == "string") G(e, r);
				else if (typeof r == "number" || typeof r == "bigint") G(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && $("scroll", e);
				return;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = fn);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!Ft.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (i = n.endsWith("Capture"), a = n.slice(2, i ? n.length - 7 : void 0), t = e[yt] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(a, t, i), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(a, r, i);
						break a;
					}
					U = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Ut(e, n, r);
				}
				return;
		}
		U = !0;
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
				$t(e, a, c, l, u, o, i, !1);
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
				t = a, n = o, e.multiple = !!r, t == null ? n != null && tn(e, !!r, n, !0) : tn(e, !!r, t, !1);
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
				rn(e, r, i, a);
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
							m !== f && (U = !0), a = m;
							break;
						case "name":
							m !== f && (U = !0), i = m;
							break;
						case "checked":
							m !== f && (U = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (U = !0), d = m;
							break;
						case "value":
							m !== f && (U = !0), o = m;
							break;
						case "defaultValue":
							m !== f && (U = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(s(137, t));
							break;
						default: m !== f && ep(e, t, p, m, r, f);
					}
				}
				W(e, o, c, l, u, d, a, i);
				return;
			case "select":
				for (a in m = o = c = p = null, n) if (l = n[a], n.hasOwnProperty(a) && l != null) switch (a) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(a) || ep(e, t, a, null, r, l);
				}
				for (i in r) if (a = r[i], l = n[i], r.hasOwnProperty(i) && (a != null || l != null)) switch (i) {
					case "value":
						a !== l && (U = !0), p = a;
						break;
					case "defaultValue":
						a !== l && (U = !0), c = a;
						break;
					case "multiple": a !== l && (U = !0), o = a;
					default: a !== l && ep(e, t, i, a, r, l);
				}
				t = c, n = o, r = m, p == null ? !!r != !!n && (t == null ? tn(e, !!n, n ? [] : "", !1) : tn(e, !!n, t, !0)) : tn(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (i = n[c], n.hasOwnProperty(c) && i != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: ep(e, t, c, null, r, i);
				}
				for (o in r) if (i = r[o], a = n[o], r.hasOwnProperty(o) && (i != null || a != null)) switch (o) {
					case "value":
						i !== a && (U = !0), p = i;
						break;
					case "defaultValue":
						i !== a && (U = !0), m = i;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (i != null) throw Error(s(91));
						break;
					default: i !== a && ep(e, t, o, i, r, a);
				}
				nn(e, p, m);
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
						p !== m && (U = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
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
		return n = lp(n).createElement(e), n[vt] = r, n[yt] = t, np(n, e, t), Mt(n), n;
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
						a[Tt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
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
		var a = Ot(i);
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
					nm(n), Dt(n);
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
			} else if (!e[Tt]) switch (t) {
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
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === fn && (e.onclick = null), Dt(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		Dt(e);
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
		var t = kt(e);
		t !== null && t.tag === 5 && t.type === "form" ? Zs(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = Qt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), Mt(t), r.head.appendChild(t)));
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
			var i = "link[rel=\"preload\"][as=\"" + Qt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Qt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Qt(n.imageSizes) + "\"]")) : i += "[href=\"" + Qt(e) + "\"]";
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
				np(o, "link", e), t === "style" && (o[Et] = !0, o.onload = o.onerror = function() {
					Nt(o);
				}), Mt(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Qt(r) + "\"][href=\"" + Qt(e) + "\"]", a = i;
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
				r = n.createElement("link"), np(r, "link", e), Mt(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = jt(r).hoistableStyles, a = Pm(e);
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
					Mt(c), np(c, "link", e), c._p = new Promise(function(e, t) {
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
			var r = jt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = E({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Mt(a), np(a, "link", e), n.head.appendChild(a)), a = {
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
			var r = jt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = E({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Mt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var i = (i = P.current) ? bm(i) : null;
		if (!i) throw Error(s(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = jt(i).hoistableStyles, r = t.get(n), r || (r = {
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
					var a = jt(i).hoistableStyles, o = a.get(e);
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
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = jt(i).hoistableScripts, r = t.get(n), r || (r = {
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
		return "href=\"" + Qt(e) + "\"";
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
			if (!0 !== t[Et]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[Et] = !0, t.onload = t.onerror = Nt.bind(null, t), np(t, "link", n), Mt(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + Qt(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Qt(n.href) + "\"]");
				if (r) return t.instance = r, Mt(r), r;
				var i = E({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Mt(r), np(r, "style", i), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				i = Pm(n.href);
				var a = e.querySelector(Fm(i));
				if (a) return t.state.loading |= 4, t.instance = a, Mt(a), a;
				r = Im(n), (i = vm.get(i)) && Hm(r, i), a = (e.ownerDocument || e).createElement("link"), Mt(a);
				var o = a;
				return o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), np(a, "link", r), t.state.loading |= 4, Vm(a, n.precedence, e), t.instance = a;
			case "script": return a = Rm(n.src), (i = e.querySelector(zm(a))) ? (t.instance = i, Mt(i), i) : (r = n, (i = vm.get(a)) && (r = E({}, n), Um(r, i)), e = e.ownerDocument || e, i = e.createElement("script"), Mt(i), np(i, "link", r), e.head.appendChild(i), t.instance = i);
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
			if (!(a[Tt] || a[vt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
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
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Mt(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), Mt(a);
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
		_currentValue: be,
		_currentValue2: be,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = st(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = st(0), this.hiddenUpdates = st(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = Ei(3, null, null, t), e.current = a, a.stateNode = e, t = Ta(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, so(a), e;
	}
	function uh(e) {
		return e ? (e = wi, e) : wi;
	}
	function dh(e, t, n, r, i, a) {
		i = uh(i), r.context === null ? r.context = i : r.pendingContext = i, r = lo(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = uo(e, r, t), n !== null && (Md(n, e, t), fo(n, e, t));
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
			var t = xi(e, 67108864);
			t !== null && Md(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = kd();
			t = pt(t);
			var n = xi(e, t);
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
					var a = kt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = tt(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Je(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Tf(a), !(X & 6) && (md = B() + 500, Ef(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = xi(a, 2), s !== null && Md(s, a, 2), Ld(), ph(a, 2);
					}
					if (a = bh(r), a === null && Gf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Gf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = mn(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = Ot(e), e !== null) {
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
				case ze: return 2;
				case Be: return 8;
				case H:
				case Ve: return 32;
				case He: return 268435456;
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
		}, t !== null && (t = kt(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
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
		var t = Ot(e.target);
		if (t !== null) {
			var n = l(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = u(n), t !== null) {
						e.blockedOn = t, gt(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = d(n), t !== null) {
						e.blockedOn = t, gt(e.priority, function() {
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
				pn = r, n.target.dispatchEvent(r), pn = null;
			} else return t = kt(n), t !== null && mh(t), e.blockedOn = n, !1;
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
				var a = kt(n);
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
			var i = n[r], a = n[r + 1], o = i[yt] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[yt] || null) s = o.formAction;
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
			dh(e.current, 2, null, e, null, null), Ld(), t[bt] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = ht();
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
			Ge = Jh.inject(qh), Ke = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!c(e)) throw Error(s(299));
		var n = !1, r = "", i = vc, a = yc, o = bc;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (i = t.onUncaughtError), t.onCaughtError !== void 0 && (a = t.onCaughtError), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, i, a, o, Uh), e[bt] = t.current, Uf(e), new Wh(t);
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
		"partial",
		"failed",
		"cancelled",
		"held"
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
		}), ie), O;
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
						O = n;
						break;
					} else throw Error("onRequest: must return new Request() or Response() when modifying the request");
				}
			}
		}
		if (!O) {
			try {
				O = await p(fe, c);
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
								n = void 0, O = t;
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
						response: O,
						schemaPath: e,
						params: g,
						options: D,
						id: ae
					});
					if (t) {
						if (!(t instanceof Response)) throw Error("onResponse: must return new Response() when modifying the response");
						O = t;
					}
				}
			}
		}
		let pe = O.headers.get("Content-Length");
		if (O.status === 204 || fe.method === "HEAD" || pe === "0" && !O.headers.get("Transfer-Encoding")?.includes("chunked")) return O.ok ? {
			data: void 0,
			response: O
		} : {
			error: void 0,
			response: O
		};
		if (O.ok) return {
			data: await (async () => {
				if (_ === "stream") return O.body;
				if (_ === "json" && !pe) {
					let e = await O.text();
					return e ? JSON.parse(e) : void 0;
				}
				return await O[_]();
			})(),
			response: O
		};
		let me = await O.text();
		try {
			me = JSON.parse(me);
		} catch {}
		return {
			error: me,
			response: O
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
async function O(e, t) {
	let { data: n, error: r, response: i } = await D.POST("/api/project/rename", { body: {
		name: e,
		expected_path: t
	} });
	if (!n) throw fe(r, i.status);
	return n.project;
}
async function pe() {
	let { data: e, error: t, response: n } = await D.GET("/api/jobs", { params: { query: { limit: 100 } } });
	if (!e) throw fe(t, n.status);
	return e.jobs;
}
async function me(e) {
	let { data: t, error: n, response: r } = await D.POST("/api/jobs/{job_id}/stop", { params: { path: { job_id: e } } });
	if (!t) throw fe(n, r.status);
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
	recommendedPlatform: "",
	supportedPlatforms: ["kali", "ubuntu"],
	plan: null
}, M = "legion.graphWorkspaceHeightPx", be = 1600, xe = "#ff9f43", Se = {
	observed: "observed",
	inferred: "inferred",
	ai_suggested: "ai suggested",
	user_entered: "user entered"
}, Ce = {
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
}, we = {
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
}, Te = {
	critical: 0,
	high: 1,
	medium: 2,
	moderate: 2,
	low: 3,
	info: 4,
	informational: 4
}, Ee = { modalOpen: !1 }, P = {
	scriptDbId: null,
	processId: 0,
	scriptId: "",
	source: "",
	output: "",
	command: "",
	status: "",
	downloadName: "",
	modalOpen: !1
}, De = {
	modalOpen: !1,
	hostId: null,
	hostIp: "",
	hostName: ""
}, Oe = {
	step: 1,
	lastMode: "",
	lastEngagementPreset: "",
	postSubmitLock: !0,
	captureInterfacesLoaded: !1
}, ke = {
	modalOpen: !1,
	busy: !1,
	pendingAction: null,
	pendingLabel: "",
	latestSummary: null
}, Ae = {
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
	let e = Ee.modalOpen || P.modalOpen || Object.values(Ae).some(Boolean);
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
function Le(e) {
	let t = document.createElement("td");
	return t.textContent = e ?? "", t;
}
function Re(e) {
	return String(e || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function B(e, t = !1) {
	let n = document.getElementById("action-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
function V(e, t = !1) {
	let n = document.getElementById("workspace-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
// ../app/web/static/js/workspace/project_view.js
function ze(e) {
	p(e), F("project-name", e.name || "");
	let t = document.getElementById("project-name");
	t && (t.dataset.displayName = e.display_name || ""), F("project-kind", e.is_temporary ? "temporary" : "saved"), F("project-output-folder", e.output_folder || ""), F("project-running-folder", e.running_folder || ""), !z("project-save-path").trim() && e.name && I("project-save-path", e.name);
}
// node_modules/react/cjs/react-jsx-runtime.production.js
var Be = /* @__PURE__ */ e(((e) => {
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
})), H = (/* @__PURE__ */ e(((e, t) => {
	t.exports = Be();
})))();
function Ve({ sidebar: e, title: t, sidebarEditor: n, titleEditor: r }) {
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
				let t = await O(e, o.path);
				_.getSnapshot().name === o.path && (b(t), ze(t), B("Workspace renamed")), S();
			} catch (e) {
				d(e instanceof Error ? e.message : "Rename failed."), requestAnimationFrame(() => g.current?.focus());
			} finally {
				m.current = !1, p(!1);
			}
		}
	}
	let E = o?.location === "sidebar", te = /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)("input", {
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
	}), /* @__PURE__ */ (0, H.jsx)("span", {
		role: "alert",
		className: `workspace-rename-error${E ? " workspace-rename-sidebar-error" : ""}`,
		children: u
	})] });
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
		(0, w.createPortal)(/* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)("strong", {
			id: "sidebar-project-name",
			title: "Double-click to rename workspace",
			style: { visibility: E ? "hidden" : void 0 },
			onDoubleClick: (e) => {
				e.preventDefault(), e.stopPropagation(), x("sidebar");
			},
			children: v
		}), /* @__PURE__ */ (0, H.jsx)("small", {
			id: "sidebar-project-kind",
			children: i.is_temporary ? "Temporary · save to keep your work" : "Saved project"
		})] }), e),
		(0, w.createPortal)(/* @__PURE__ */ (0, H.jsx)("button", {
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
function He() {
	let e = (0, C.useSyncExternalStore)(v.subscribe, v.getSnapshot), [t, n] = (0, C.useState)(/* @__PURE__ */ new Set()), [r, i] = (0, C.useState)(""), a = (0, C.useRef)(/* @__PURE__ */ new Set());
	async function o(e) {
		if (!a.current.has(e)) {
			a.current.add(e), n((t) => new Set(t).add(e)), i("");
			try {
				let t = await me(e);
				v.set(v.getSnapshot().map((e) => e.id === t.id ? t : e)), B("Job stop requested"), v.set(await pe());
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
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [r && /* @__PURE__ */ (0, H.jsx)("tr", {
		role: "alert",
		children: /* @__PURE__ */ (0, H.jsx)("td", {
			colSpan: 8,
			children: r
		})
	}), e.map((e) => {
		let n = e.status === "queued" || e.status === "running", r = e.cancel_requested || t.has(e.id), i = r && n ? e.status === "queued" ? "cancelling" : "stopping" : e.status, a = Array.isArray(e.result?.warnings) ? e.result.warnings.filter((e) => typeof e == "string") : [], s = e.error || a.join(" | ") || (r ? e.cancel_reason || "stop requested" : "");
		return /* @__PURE__ */ (0, H.jsxs)("tr", {
			"data-job-id": e.id,
			children: [
				/* @__PURE__ */ (0, H.jsx)("td", { children: e.id }),
				/* @__PURE__ */ (0, H.jsx)("td", { children: e.type }),
				/* @__PURE__ */ (0, H.jsx)("td", { children: i }),
				/* @__PURE__ */ (0, H.jsx)("td", { children: e.created_at }),
				/* @__PURE__ */ (0, H.jsx)("td", { children: e.started_at }),
				/* @__PURE__ */ (0, H.jsx)("td", { children: e.finished_at }),
				/* @__PURE__ */ (0, H.jsx)("td", { children: s }),
				/* @__PURE__ */ (0, H.jsx)("td", { children: n && /* @__PURE__ */ (0, H.jsx)("button", {
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
var Ue = null, We = /* @__PURE__ */ new Map(), Ge = [];
function Ke(e) {
	return Ue = e, We.forEach((e, t) => Ue.update(t, e)), Ge.splice(0).forEach(({ action: t, args: n, resolve: r, reject: i }) => {
		Promise.resolve().then(() => e.actions[t](...n)).then(r, i);
	}), () => {
		Ue === e && (Ue = null);
	};
}
function qe(e, t) {
	We.set(e, t), Ue?.update(e, t);
}
function Je(e, ...t) {
	return Ue ? Ue.actions[e](...t) : new Promise((n, r) => Ge.push({
		action: e,
		args: t,
		resolve: n,
		reject: r
	}));
}
// ../app/web/static/js/workspace/http.js
async function Ye(e, t) {
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
			else if (Me[r]) t.fg = Me[r];
			else if (Ne[r]) t.bg = Ne[r];
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
			a += `<span class="${$e(r)}">${Re(e)}</span>`;
		}
		return Qe(String(n || "").split(";").map((e) => e.trim()).filter((e) => e.length > 0).map((e) => parseInt(e, 10)).filter((e) => Number.isFinite(e)), r), i = o + e.length, e;
	}), i < t.length && (a += `<span class="${$e(r)}">${Re(t.slice(i))}</span>`), a || "";
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
function ct(e) {
	qe("processes", e || []);
}
function lt(e) {
	F("script-output-meta", e || "");
}
function ut(e) {
	P.output = String(e || ""), tt("script-output-text", P.output);
}
function dt(e) {
	F("script-output-command", e || "");
}
function ft(e) {
	let t = document.getElementById("process-output-modal");
	t && (Ee.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function pt(e) {
	let t = document.getElementById("script-output-modal");
	t && (P.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function mt() {
	return Je("closeOutput");
}
function ht(e = !0) {
	pt(!1), e && (P.scriptDbId = null, P.processId = 0, P.scriptId = "", P.source = "", P.output = "", P.command = "", P.status = "", P.downloadName = "", F("script-output-modal-title", "Script Output"), lt("No script selected"), dt(""), ut(""));
}
async function gt(e) {
	let t = parseInt(e, 10);
	if (t) {
		pt(!0), F("script-output-modal-title", "Script Output"), lt(`Script ${t} | loading...`), dt(""), ut(""), P.scriptDbId = t, P.processId = 0, P.scriptId = "", P.source = "", P.output = "", P.command = "", P.status = "", P.downloadName = "";
		try {
			let e = await Xe(`/api/workspace/scripts/${t}/output?max_chars=50000`), n = String(e.output || e.output_chunk || ""), r = e.source === "process" ? `Process ${e.process_id || "?"}` : "Script row output";
			P.processId = parseInt(e.process_id, 10) || 0, P.scriptId = String(e.script_id || ""), P.source = String(e.source || ""), P.output = n, P.command = String(e.command || ""), P.status = String(e.status || ""), P.downloadName = "", dt(e.command || "(no associated process command)"), ut(n), lt(`${e.script_id || `Script ${t}`} | ${r} | bytes ${e.output_length || n.length}`);
		} catch (e) {
			lt(`Script ${t} | load failed`), ut(`Failed to load script output: ${e.message || e}`);
		}
	}
}
function _t({ title: e = "Artifact Preview", meta: t = "", command: n = "", output: r = "", downloadName: i = "" } = {}) {
	pt(!0), P.scriptDbId = null, P.processId = 0, P.scriptId = "", P.source = "graph", P.output = String(r || ""), P.command = String(n || ""), P.status = "", P.downloadName = String(i || ""), F("script-output-modal-title", e || "Artifact Preview"), lt(String(t || "Artifact preview")), dt(n || "(no associated command)"), ut(r || "");
}
async function vt() {
	await bt(P.output || "", "Script output copied to clipboard", "No script output to copy");
}
async function yt() {
	let e = document.getElementById("script-output-command");
	await bt(e ? String(e.textContent || "") : "", "Command copied to clipboard", "No command to copy");
}
async function bt(e, t, n) {
	let r = String(e || "");
	if (!r) V(n || "Nothing to copy", !0);
	else try {
		if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(r);
		else {
			let e = document.createElement("textarea");
			e.value = r, e.setAttribute("readonly", "readonly"), e.style.position = "absolute", e.style.left = "-9999px", document.body.appendChild(e), e.select(), document.execCommand("copy"), document.body.removeChild(e);
		}
		V(t || "Copied to clipboard");
	} catch (e) {
		V(`Copy failed: ${e.message}`, !0);
	}
}
function xt() {
	let e = P.output || "";
	if (!e) {
		V("No script output to download", !0);
		return;
	}
	if (P.downloadName) {
		let t = new Blob([e], { type: "text/plain;charset=utf-8" }), n = URL.createObjectURL(t), r = document.createElement("a");
		r.href = n, r.download = P.downloadName, document.body.appendChild(r), r.click(), r.remove(), URL.revokeObjectURL(n), V(`${P.downloadName} downloaded`);
		return;
	}
	let t = parseInt(P.scriptDbId, 10) || "unknown", n = (String(P.scriptId || "").trim() || `script-${t}`).replace(/[^a-zA-Z0-9._-]+/g, "-"), r = new Blob([e], { type: "text/plain;charset=utf-8" }), i = URL.createObjectURL(r), a = document.createElement("a");
	a.href = i, a.download = `${n}-${t}-output.txt`, document.body.appendChild(a), a.click(), a.remove(), URL.revokeObjectURL(i), V(`Script ${t} output downloaded`);
}
function St(e) {
	F("stat-hosts", e.hosts), F("stat-open-ports", e.open_ports), F("stat-services", e.services), F("stat-cves", e.cves), F("stat-running", e.running_processes), F("stat-finished", e.finished_processes);
}
// ../app/web/static/js/workspace/activity.js
function Ct(e) {
	if (e && typeof e == "object") {
		if (e.project && ze(e.project), e.summary && St(e.summary), e.scheduler) {
			let t = e.scheduler.engagement_policy || {};
			F("scheduler-mode", e.scheduler.mode || ""), F("scheduler-goal", t.preset_label || t.preset || e.scheduler.goal_profile || ""), F("scheduler-families", e.scheduler.preapproved_families_count || 0);
		}
		Array.isArray(e.scheduler_rationale_feed) && wt(e.scheduler_rationale_feed);
	}
}
function wt(e) {
	qe("rationale", e || []);
}
function Tt(e) {
	qe("decisions", e || []);
}
function Et(e) {
	qe("approvals", e || []);
}
function Dt(e) {
	qe("scans", e || []);
}
function Ot(e) {
	m(e || []), F("job-count", (e || []).length);
}
function kt() {
	return Je("loadOverview");
}
function At() {
	return Je("loadProcesses");
}
function jt() {
	return Je("loadDecisions");
}
function Mt() {
	return Je("loadScans");
}
async function Nt() {
	Ot((await Xe("/api/jobs?limit=20")).jobs || []);
}
// ../app/web/static/js/workspace/approvals.js
function Pt() {
	return Je("loadApprovals");
}
// ../app/web/static/js/workspace/graph_selection.js
function Ft(e, t) {
	return e === "edge" ? (A.filtered.edges || []).find((e) => String(e?.edge_id || "") === String(t || "")) || null : (A.filtered.nodes || []).find((e) => String(e?.node_id || "") === String(t || "")) || null;
}
// ../app/web/static/js/workspace/graph_common.js
var It, Lt;
function Rt(e) {
	for (let t of ["graphRenderWorkspace", "graphSyncDetailPresentation"]) if (typeof e[t] != "function") throw TypeError(`Missing graph_common callback: ${t}`);
	({graphRenderWorkspace: It, graphSyncDetailPresentation: Lt} = e);
}
function zt() {
	let e = document.getElementById("graph-workspace-panel");
	return String(e?.dataset?.graphEnabled || "").toLowerCase() === "true";
}
function Bt() {
	let e = document.getElementById("graph-workspace-canvas");
	return e ? e.closest(".graph-panel") : null;
}
function Vt() {
	return document.getElementById("graph-workspace-shell");
}
function U() {
	let e = Vt();
	return e ? e.closest(".graph-panel") : null;
}
function Ht() {
	return document.querySelector(".graph-canvas-panel");
}
function Ut() {
	return document.querySelector(".graph-canvas-scroll");
}
function Wt() {
	return !!(A.selectedKind && A.selectedRef);
}
function Gt({ allowRetainedSummary: e = !0 } = {}) {
	if (A.selectedKind !== "node" || !A.selectedRef) return null;
	let t = Ft("node", A.selectedRef);
	if (t) return t;
	if (!e) return null;
	let n = A.selectedPayload, r = String(A.selectedRef || ""), i = String(n?.node_id || "");
	return !n || i !== r || !G(n, "summary_kind") || !A.expandedSummaryIds[i] ? null : n;
}
function Kt(e) {
	let t = Number.parseInt(String(e || ""), 10);
	return Number.isFinite(t) ? Math.max(520, Math.min(be, t)) : 680;
}
function qt(e, { persist: t = !0 } = {}) {
	let n = Bt();
	if (!n) return;
	let r = Kt(e);
	if (n.style.setProperty("--graph-workspace-height", `${r}px`), t) try {
		window.localStorage.setItem(M, String(r));
	} catch {}
	Lt();
}
function Jt() {
	try {
		let e = window.localStorage.getItem(M);
		if (e) {
			qt(e, { persist: !1 });
			return;
		}
	} catch {}
	qt(680, { persist: !1 });
}
function Yt() {
	if (!A.resize) return;
	let e = A.resize.handle, t = A.resize.pointerId;
	if (document.body.classList.remove("graph-workspace-resizing"), window.removeEventListener("pointermove", Xt), window.removeEventListener("pointerup", Yt), window.removeEventListener("pointercancel", Yt), window.removeEventListener("blur", Yt), e && typeof e.releasePointerCapture == "function" && t != null) try {
		e.hasPointerCapture && e.hasPointerCapture(t) && e.releasePointerCapture(t);
	} catch {}
	qt(A.resize.currentHeight || A.resize.startHeight), A.resize = null;
}
function Xt(e) {
	if (!A.resize) return;
	let t = Number(e.clientY || 0) - A.resize.startY, n = A.resize.startHeight + t;
	A.resize.currentHeight = Kt(n), qt(A.resize.currentHeight, { persist: !1 }), It({ preserveDetail: !0 });
}
function Zt(e) {
	if (!zt()) return;
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
	document.body.classList.add("graph-workspace-resizing"), window.addEventListener("pointermove", Xt), window.addEventListener("pointerup", Yt), window.addEventListener("pointercancel", Yt), window.addEventListener("blur", Yt);
}
function Qt() {
	qt(680);
}
function W(e, t = !1) {
	let n = document.getElementById("graph-workspace-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function $t(e) {
	return String(e || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
function en(e) {
	let t = String(e || "").trim(), n = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
	return n ? `${n[1]}.${n[2]}.${n[3]}.0/24` : t || "other";
}
function tn(e) {
	let t = String(e || ""), n = 5381;
	for (let e = 0; e < t.length; e += 1) n = (n << 5) + n + t.charCodeAt(e), n &= 2147483647;
	return Math.abs(n).toString(36);
}
function nn(e) {
	let t = String(e || "").trim().toLowerCase().split(".").filter(Boolean);
	if (t.length <= 2) return t.join(".") || "";
	let n = t.slice(-2).join(".");
	return [
		"co.uk",
		"com.au",
		"co.jp"
	].includes(n) && t.length >= 3 ? t.slice(-3).join(".") : t.slice(-2).join(".");
}
function rn(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	try {
		return new URL(t).host || "";
	} catch {
		let e = t.match(/^[a-z]+:\/\/([^/?#]+)/i);
		return e ? String(e[1] || "").trim() : "";
	}
}
function G(e, t) {
	return !e || typeof e != "object" ? "" : (e.properties && typeof e.properties == "object" ? e.properties : {})[t];
}
function an(e) {
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
function on(e) {
	let t = String(e?.last_seen || "").trim(), n = String(e?.first_seen || "").trim();
	return t || n || "";
}
function sn(e) {
	let t = {
		"24h": 24,
		"7d": 168,
		"30d": 720,
		"90d": 2160
	}[String(e || "all").trim().toLowerCase()];
	return t ? Date.now() - t * 60 * 60 * 1e3 : 0;
}
function cn(e, t) {
	if (!t) return !0;
	let n = Date.parse(on(e));
	return !Number.isFinite(n) || n >= t;
}
function ln(e, t) {
	let n = String(t || "").trim().toLowerCase();
	return !n || String(G(e, "severity") || "").trim().toLowerCase() === n;
}
function un(e, t) {
	let n = String(t || "").trim().toLowerCase();
	return !n || an(e).some((e) => String(e || "").trim().toLowerCase() === n);
}
function dn() {
	F("graph-min-confidence-value", z("graph-min-confidence") || "0");
}
function fn() {
	let e = Math.max(10, Math.min(400, parseInt(z("graph-zoom-slider"), 10) || A.zoomPercent || 100));
	A.zoomPercent = e, F("graph-zoom-value", `${e}%`);
}
function pn() {
	return Pe[String(z("graph-view-select") || A.viewId || "attack_surface").trim()] || Pe.attack_surface;
}
function mn(e, t, n) {
	let r = typeof e == "string" ? document.getElementById(e) : e;
	if (!r) return;
	let i = String(r.value || ""), a = Array.from(new Set((t || []).map((e) => String(e || "").trim()).filter(Boolean))).sort();
	r.innerHTML = "";
	let o = document.createElement("option");
	o.value = "", o.textContent = n, r.appendChild(o), a.forEach((e) => {
		let t = document.createElement("option");
		t.value = e, t.textContent = $t(e), r.appendChild(t);
	}), a.includes(i) && (r.value = i);
}
function hn() {
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
function gn() {
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
function _n() {
	let e = A.data || {}, t = Array.isArray(e.nodes) ? e.nodes : [], n = Array.isArray(e.edges) ? e.edges : [];
	mn("graph-node-type-filter", t.map((e) => String(e?.type || "").trim().toLowerCase()), "all node types"), mn("graph-edge-type-filter", n.map((e) => String(e?.type || "").trim().toLowerCase()), "all edge types"), mn("graph-source-kind-filter", t.concat(n).map((e) => String(e?.source_kind || "").trim().toLowerCase()), "all provenance"), mn("graph-severity-filter", t.concat(n).map((e) => String(G(e, "severity") || "").trim().toLowerCase()), "all severities"), mn("graph-pack-filter", t.concat(n).flatMap((e) => an(e).map((e) => String(e || "").trim().toLowerCase())), "all packs");
}
function vn(e) {
	return we[String(e?.type || "").trim().toLowerCase()] || "#b4bbdd";
}
function yn(e) {
	return Ce[String(e?.source_kind || "observed").trim().toLowerCase()] || Ce.observed;
}
function bn() {
	return !!window.LEGION_OPAQUE_UI_ENABLED || !!document.body?.classList.contains("opaque-ui");
}
function xn(e) {
	let t = yn(e);
	return String(t?.edgeStroke || t?.stroke || "#687691");
}
function Sn(e) {
	let t = yn(e);
	return bn() ? String(t?.fillOpaque || "#18182a") : String(t?.fill || "#18182a");
}
function Cn(e) {
	let t = String(e || "").trim().split(/\s+/).filter(Boolean);
	if (!t.length) return ["unknown"];
	let n = [], r = "";
	return t.forEach((e) => {
		let t = r ? `${r} ${e}` : e;
		t.length <= 18 || !r ? r = t : (n.push(r), r = e);
	}), r && n.push(r), n.slice(0, 2);
}
function wn(e, t = {}, n = "") {
	let r = document.createElementNS("http://www.w3.org/2000/svg", e);
	return Object.entries(t).forEach(([e, t]) => {
		t != null && t !== "" && r.setAttribute(e, String(t));
	}), n && (r.textContent = n), r;
}
function Tn(e, t) {
	let n = e.getBoundingClientRect(), r = e.viewBox.baseVal, i = n.width > 0 ? r.width / n.width : 1, a = n.height > 0 ? r.height / n.height : 1;
	return {
		x: r.x + (t.clientX - n.left) * i,
		y: r.y + (t.clientY - n.top) * a
	};
}
// ../app/web/static/js/workspace/host_scope.js
function En(e) {
	let t = parseInt(e, 10);
	if (!Number.isFinite(t) || t <= 0) return "";
	let n = (k.hosts || []).find((e) => String(e?.id || "") === String(t));
	return n ? String(n.hostname || n.ip || `host ${n.id || t}`).trim() : "";
}
function Dn(e, t = "") {
	let n = parseInt(e, 10), r = Number.isFinite(n) && n > 0 ? n : 0, i = r ? String(t || En(r) || `host ${r}`).trim() : "", a = parseInt(k.servicesHostFilterId, 10), o = String(k.servicesHostFilterLabel || "").trim();
	return k.servicesHostFilterId = r, k.servicesHostFilterLabel = i, String(a || 0) !== String(r || 0) || o !== i;
}
// ../app/web/static/js/workspace/host_filters.js
var On, kn, An, jn, Mn, Nn, Pn;
function Fn(e) {
	for (let t of [
		"closeRibbonMenus",
		"graphLoadSnapshot",
		"loadHostDetail",
		"loadWorkspaceHosts",
		"loadWorkspaceServices",
		"renderHosts",
		"renderServices"
	]) if (typeof e[t] != "function") throw TypeError(`Missing host_filters callback: ${t}`);
	({closeRibbonMenus: On, graphLoadSnapshot: kn, loadHostDetail: An, loadWorkspaceHosts: jn, loadWorkspaceServices: Mn, renderHosts: Nn, renderServices: Pn} = e);
}
function In(e) {
	if (!Array.isArray(e)) return [];
	let t = /* @__PURE__ */ new Set(), n = [];
	return e.forEach((e) => {
		let r = String(typeof e == "string" ? e : e?.name || "").trim();
		if (!r) return;
		let i = r.toLowerCase();
		t.has(i) || (t.add(i), n.push(r));
	}), n;
}
function Ln(e) {
	let t = Array.isArray(e) ? e : String(e || "").split(","), n = /* @__PURE__ */ new Set(), r = [];
	return t.forEach((e) => {
		let t = String(e || "").trim(), i = t.toLowerCase();
		t && !n.has(i) && (n.add(i), r.push(t));
	}), r;
}
function Rn() {
	let e = Ln(k.hostServiceFilters || []);
	return e.length ? e : Ln(k.hostServiceFilter || "");
}
function zn() {
	return Rn().join(", ");
}
function Bn(e, t, n = "No categories") {
	let r = typeof e == "string" ? document.getElementById(e) : e;
	if (!r) return;
	let i = In(t);
	if (r.innerHTML = "", !i.length) {
		let e = document.createElement("span");
		e.className = "category-chip category-chip-empty", e.textContent = n, r.appendChild(e);
	} else i.forEach((e) => {
		let t = document.createElement("span");
		t.className = "category-chip", t.textContent = e, r.appendChild(t);
	});
}
function Vn(e) {
	let t = document.createElement("td");
	return t.className = "category-cell", Bn(t, e, "Uncategorized"), t.title = In(e).join(", "), t;
}
function Hn() {
	let e = /* @__PURE__ */ new Set(), t = [];
	return (k.hosts || []).forEach((n) => {
		In(n?.categories || []).forEach((n) => {
			let r = n.toLowerCase();
			e.has(r) || (e.add(r), t.push(n));
		});
	}), t.sort((e, t) => e.localeCompare(t)), t;
}
function Un() {
	let e = Hn();
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
function Wn() {
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
	}), Rn().forEach((e) => t(e, 0));
	let r = Array.from(e.values());
	return r.sort((e, t) => e.service.localeCompare(t.service)), r;
}
function Gn() {
	let e = document.getElementById("hosts-service-filter-list"), t = document.getElementById("hosts-service-filter-button"), n = document.getElementById("hosts-service-filter-clear-button"), r = Rn(), i = new Set(r.map((e) => e.toLowerCase())), a = zn();
	if (t && (t.textContent = r.length ? `Services (${r.length})` : "Services", t.classList.toggle("is-active", r.length > 0), t.title = r.length ? `Host service filters: ${a}` : "Filter hosts by open service", t.setAttribute("aria-label", t.title)), n && (n.disabled = r.length === 0), !e) return;
	let o = Wn();
	if (e.innerHTML = "", !o.length) {
		let t = document.createElement("p");
		t.className = "meta-note", t.textContent = "No open services available.", e.appendChild(t);
	} else o.forEach((t) => {
		let n = document.createElement("label");
		n.className = "panel-filter-option";
		let r = document.createElement("input");
		r.type = "checkbox", r.value = t.service, r.checked = i.has(String(t.service || "").toLowerCase()), r.addEventListener("change", async () => {
			let e = Rn(), n = String(t.service || "").trim().toLowerCase(), i = e.some((e) => e.toLowerCase() === n);
			await $n(r.checked && !i ? e.concat([t.service]) : e.filter((e) => e.toLowerCase() !== n));
		});
		let a = document.createElement("span");
		a.className = "panel-filter-option-name", a.textContent = t.service, n.appendChild(r), n.appendChild(a);
		let o = document.createElement("span"), s = Number(t.host_count || 0);
		o.className = "panel-filter-option-count", o.textContent = String(Number.isFinite(s) ? s : 0), n.appendChild(o), e.appendChild(n);
	});
}
function Kn(e) {
	let t = document.getElementById("hosts-service-filter-popover"), n = document.getElementById("hosts-service-filter-button"), r = !!e;
	t && (t.hidden = !r), n && n.setAttribute("aria-expanded", r ? "true" : "false"), r && Gn();
}
function qn() {
	let e = new URLSearchParams(), t = String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down";
	e.set("filter", t), Rn().forEach((t) => {
		e.append("service", t);
	});
	let n = String(k.hostCategoryFilter || "").trim();
	return n && e.set("category", n), e.toString();
}
function Jn() {
	let e = new URLSearchParams(), t = parseInt(k.servicesHostFilterId, 10);
	Number.isFinite(t) && t > 0 && e.set("host_id", String(t));
	let n = String(k.servicesCategoryFilter || "").trim();
	return n && e.set("category", n), e.toString();
}
function Yn() {
	let e = document.getElementById("hosts-filter-show-all-button"), t = document.getElementById("hosts-filter-hide-down-button"), n = document.getElementById("hosts-reset-filter-button"), r = String(k.hostFilter || "hide_down").trim().toLowerCase(), i = zn(), a = String(k.hostCategoryFilter || "").trim(), o = String(k.servicesCategoryFilter || "").trim();
	I("hosts-category-filter-select", a), I("services-category-filter-select", o);
	let s = parseInt(k.servicesHostFilterId, 10), c = String(k.servicesHostFilterLabel || "").trim();
	if (e && e.classList.toggle("is-active", r === "show_all"), t && t.classList.toggle("is-active", r !== "show_all"), n) {
		let e = r === "hide_down" && !i && !a && (!Number.isFinite(s) || s <= 0);
		n.disabled = e, n.classList.toggle("is-active", !e);
		let t = "Reset host filters (show only up hosts)";
		i && a && c ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear category filter: ${a}, clear services filter: ${c})` : i && c ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear services filter: ${c})` : i && a ? t = `Reset host filters (show only up hosts, clear service filter: ${i}, clear category filter: ${a})` : i ? t = `Reset host filters (show only up hosts, clear service filter: ${i})` : a ? t = `Reset host filters (show only up hosts, clear category filter: ${a})` : c && (t = `Reset host filters (show only up hosts, clear services filter: ${c})`), n.setAttribute("title", t), n.setAttribute("aria-label", t);
	}
}
async function Xn(e) {
	k.hostFilter = String(e || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down", Yn(), On(), await jn(), await kn({ background: !1 }).catch(() => {});
}
async function Zn(e) {
	k.hostCategoryFilter = String(e || "").trim(), Yn(), Nn(k.hosts), await Promise.all([jn(), Mn()]), await kn({ background: !1 }).catch(() => {});
}
async function Qn(e) {
	let t = String(e || "").trim(), n = Rn(), r = n.map((e) => e.toLowerCase());
	t && n.length === 1 && r[0] === t.toLowerCase() ? await $n([]) : await $n(t ? [t] : []);
}
async function $n(e) {
	k.hostServiceFilters = Ln(e), k.hostServiceFilter = k.hostServiceFilters.join(","), Yn(), Gn(), Nn(k.hosts), Pn(k.services), await Promise.all([jn(), Mn()]), await kn({ background: !1 }).catch(() => {});
}
async function er(e) {
	k.servicesCategoryFilter = String(e || "").trim(), Yn(), Pn(k.services), await Mn();
}
async function tr(e, t = "") {
	let n = parseInt(e, 10), r = parseInt(k.servicesHostFilterId, 10);
	Number.isFinite(n) && n > 0 && n === r ? Dn(0) : Number.isFinite(n) && n > 0 ? (k.selectedHostId = n, Dn(n, t)) : Dn(0), Yn(), Nn(k.hosts), await Promise.all([k.selectedHostId ? An(k.selectedHostId) : Promise.resolve(), Mn()]);
}
async function nr() {
	k.hostFilter = "hide_down", k.hostServiceFilter = "", k.hostServiceFilters = [], k.hostCategoryFilter = "", k.servicesHostFilterId = 0, k.servicesHostFilterLabel = "", k.servicesCategoryFilter = "", Yn(), Nn(k.hosts), Pn(k.services), On(), await Promise.all([jn(), Mn()]), await kn({ background: !1 }).catch(() => {});
}
// ../app/web/static/js/workspace/host_detail.js
function rr(e) {
	k.hostDetail = e || null;
	let t = e?.host || {}, n = e?.ports || [], r = e?.observations || {}, i = e?.target_state || {}, a = Array.isArray(r?.technologies) ? r.technologies : [], o = Array.isArray(i?.device_categories) ? i.device_categories : [];
	F("host-detail-name", t.ip ? `${t.ip} (${t.hostname || "no-hostname"})` : ""), I("workspace-tool-host-ip", t.ip || "");
	let s = document.getElementById("host-detail-ports");
	s && (s.innerHTML = "", n.forEach((e) => {
		let t = document.createElement("tr");
		t.appendChild(Le(e.port || "")), t.appendChild(Le(e.protocol || "")), t.appendChild(Le(e.state || "")), t.appendChild(Le(e.service?.name || "")), t.appendChild(Le(`${e.service?.product || ""} ${e.service?.version || ""}`.trim())), t.appendChild(Le(it(e))), s.appendChild(t);
	}));
	let c = document.getElementById("host-detail-scripts");
	c && (c.innerHTML = "", n.forEach((e) => {
		(e.scripts || []).forEach((e) => {
			let t = document.createElement("tr");
			t.appendChild(Le(e.id || "")), t.appendChild(Le(e.script_id || "")), t.appendChild(Le(e.display_output || (e.output || "").slice(0, 140)));
			let n = document.createElement("td"), r = document.createElement("button");
			r.type = "button", r.textContent = "View", r.dataset.scriptViewId = String(e.id || ""), n.appendChild(r), t.appendChild(n), c.appendChild(t);
		});
	}));
	let l = document.getElementById("host-detail-ai-technologies");
	l && (l.innerHTML = "", a.forEach((e) => {
		let t = document.createElement("tr");
		t.appendChild(Le(e.name || "")), t.appendChild(Le(e.version || "")), t.appendChild(Le(e.cpe || "")), t.appendChild(Le(e.evidence || "")), l.appendChild(t);
	})), F("host-ai-tech-count", a.length), Bn("host-detail-categories", o, "Uncategorized");
	let u = document.getElementById("host-detail-deep-scans"), d = document.getElementById("host-detail-scan-results");
	if (u && d) {
		let t = Array.isArray(e?.deep_scans) ? e.deep_scans : [];
		u.hidden = t.length === 0, d.replaceChildren();
		for (let e of t) {
			let t = document.createElement("details"), n = document.createElement("summary"), r = document.createElement("pre");
			n.textContent = `${e.profile_status || ""} · ${e.profile_sha256 || ""}`, r.textContent = JSON.stringify({
				role_hypotheses: e.classification || {},
				candidates: e.candidates || [],
				reproduced: e.reproduced || [],
				task_problems: e.problems || [],
				dependency_audit: e.dependency_audit || ""
			}, null, 2), t.append(n, r), d.append(t);
		}
	}
	F("host-device-category-count", In(o).length);
}
// ../app/web/static/js/workspace/invalidation_waiters.js
function ir(e, t = 5e3) {
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
function ar(e) {
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
async function or({ service: e = "", port: t = "", protocol: n = "tcp", limit: r = 500, offset: i = 0 } = {}) {
	let a = new URLSearchParams();
	return a.set("limit", String(r)), a.set("offset", String(i)), e && a.set("service", String(e)), t && a.set("port", String(t)), n && a.set("protocol", String(n)), Xe(`/api/workspace/tools?${a.toString()}`);
}
async function sr({ service: e = "", port: t = "", protocol: n = "tcp" } = {}) {
	let r = [], i = 0, a = 0;
	for (; a < 200;) {
		let o = await or({
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
var cr, lr, ur, dr;
function fr(e) {
	for (let t of [
		"graphLoadSnapshot",
		"renderHosts",
		"renderServices",
		"renderTools"
	]) if (typeof e[t] != "function") throw TypeError(`Missing workspace_data callback: ${t}`);
	({graphLoadSnapshot: cr, renderHosts: lr, renderServices: ur, renderTools: dr} = e);
}
function pr(e) {
	return new Promise((t) => {
		window.setTimeout(t, Math.max(0, Number(e) || 0));
	});
}
async function mr(e, t = 12e4, n = 1200) {
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
				await ir(["jobs"], Math.min(Math.max(e, 1), 3e4));
			} catch {
				await pr(n);
			}
		} else await pr(n);
	}
	throw Error("Timed out waiting for job completion.");
}
async function hr() {
	let e = qn(), t = Jn(), n = await Xe(`/api/workspace/hosts?${e}`);
	if (e !== qn()) return;
	n && n.filter && (k.hostFilter = String(n.filter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down"), Yn(), ur(k.services), lr(n.hosts || []);
	let r = parseInt(k.servicesHostFilterId, 10), i = (Array.isArray(n.hosts) ? n.hosts : []).some((e) => String(e?.id || "") === String(r || ""));
	Number.isFinite(r) && r > 0 && !i && (Dn(k.selectedHostId), Yn(), lr(k.hosts)), t !== Jn() && await gr();
}
async function gr() {
	let e = Jn(), t = await Xe(`/api/workspace/services${e ? `?${e}` : ""}`);
	if (e !== Jn()) return;
	let n = parseInt(t?.host_id, 10);
	(!Number.isFinite(n) || n <= 0) && (k.servicesHostFilterId = 0, k.servicesHostFilterLabel = ""), k.servicesCategoryFilter = String(t?.category || "").trim(), Yn(), ur(t.services || []);
}
async function _r({ service: e = "", force: t = !1 } = {}) {
	if (!k.toolsLoading || t) {
		k.toolsLoading = !0;
		try {
			let t = await sr({ service: e });
			k.toolsHydrated = !0, dr(t);
		} finally {
			k.toolsLoading = !1;
		}
	}
}
async function vr(e) {
	e && rr(await Xe(`/api/workspace/hosts/${e}`));
}
async function yr() {
	V("Refreshing workspace...");
	try {
		await Promise.all([
			hr(),
			gr(),
			_r()
		]), k.selectedHostId && await vr(k.selectedHostId);
		try {
			await cr({ background: !0 });
		} catch {}
		V("Workspace refreshed");
	} catch (e) {
		V(`Workspace refresh failed: ${e.message}`, !0);
	}
}
function br(e) {
	return Array.from(new Set(String(e || "").split(",").map((e) => String(e || "").trim()).filter(Boolean)));
}
// ../app/web/static/js/workspace/device_categories.js
var xr;
function Sr(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing device_categories callback: ${t}`);
	({applySchedulerPreferences: xr} = e);
}
function Cr(e, t = !1) {
	let n = document.getElementById("device-category-save-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function wr(e = {}) {
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
			e && e.appendChild(wr({}));
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
function Tr() {
	Bn("device-category-builtins-list", (k.builtInDeviceCategories || []).map((e) => e?.name || ""), "No built-in categories");
	let e = document.getElementById("device-category-rules-body");
	if (!e) return;
	e.innerHTML = "";
	let t = Array.isArray(k.deviceCategoryRules) ? k.deviceCategoryRules : [];
	t.length ? t.forEach((t) => {
		e.appendChild(wr(t));
	}) : e.appendChild(wr({}));
}
function Er() {
	return Array.from(document.querySelectorAll("#device-category-rules-body tr")).map((e) => {
		let t = (t) => {
			let n = e.querySelector(`[data-device-category-field="${t}"]`);
			return n ? String(n.value || "").trim() : "";
		};
		return {
			name: t("name"),
			ports: br(t("ports")),
			fingerprint_fragments: br(t("fingerprint_fragments")),
			cpe: br(t("cpe"))
		};
	}).filter((e) => e.name);
}
async function Dr() {
	Cr("Saving...");
	try {
		let e = await Ye("/api/scheduler/preferences", { device_categories: Er() });
		xr(e), Cr("Saved");
	} catch (e) {
		Cr(`Save failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/engagement_policy.js
function Or(e) {
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
function kr(e, t) {
	let n = Ar(t), r = e && typeof e == "object" ? e : {}, i = Or(r.preset || n);
	return {
		...i,
		...r,
		custom_overrides: r.custom_overrides && typeof r.custom_overrides == "object" ? r.custom_overrides : {},
		legacy_goal_profile: r.legacy_goal_profile || jr({
			...i,
			...r
		})
	};
}
function Ar(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "external_pentest" ? "external_pentest" : t === "internal_pentest" ? "internal_pentest" : t === "external_recon" ? "external_recon" : "internal_recon";
}
function jr(e) {
	let t = String(e?.preset || "").trim().toLowerCase();
	return t === "external_recon" || t === "external_pentest" ? "external_pentest" : "internal_asset_discovery";
}
function Mr(e, t) {
	return t ? "Custom lets you override scope and intent manually. Use the standard presets unless you need a non-standard combination." : {
		external_recon: "Low-noise external mapping focused on discovery, fingerprinting, and bounded validation.",
		external_pentest: "Broader external follow-up once recon shows a target is worth deeper assessment.",
		internal_quick_recon: "Fast internal low-hanging-fruit sweep focused on SMB, NetBIOS, NFS, printers, common admin panels, and other obvious exposure points.",
		internal_recon: "Broader internal discovery and validation across exposed services without moving into pentest depth.",
		internal_pentest: "Deeper internal assessment with wider follow-up and higher-noise exploration."
	}[String(e || "").trim().toLowerCase()] || "Preset drives scope and intent for most runs. Switch to custom only if you need a manual override.";
}
// ../app/web/static/js/workspace/scan_policy.js
var Nr, Pr, Fr, Ir, Lr;
function Rr(e) {
	for (let t of [
		"applyNmapModeTargetDefaults",
		"refreshNmapModeOptions",
		"refreshNmapScanButtonState",
		"setNmapWizardStep",
		"updateNmapCommandPreview"
	]) if (typeof e[t] != "function") throw TypeError(`Missing scan_policy callback: ${t}`);
	({applyNmapModeTargetDefaults: Nr, refreshNmapModeOptions: Pr, refreshNmapScanButtonState: Fr, setNmapWizardStep: Ir, updateNmapCommandPreview: Lr} = e);
}
function zr() {
	return String(z("scheduler-goal-select") || "internal_recon").trim().toLowerCase();
}
function Br() {
	return String(z("nmap-engagement-preset-select") || "").trim().toLowerCase() || zr();
}
function Vr(e = "") {
	return String(e || "").trim().toLowerCase() === "internal_quick_recon";
}
function Hr(e = "") {
	let t = Wr(e, { fallbackGoalProfile: z("scheduler-goal-select") || "internal_recon" });
	return String(t.scope || "").trim().toLowerCase() === "internal";
}
function Ur() {
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
function Wr(e, t = {}) {
	let n = String(e || "internal_recon").trim().toLowerCase();
	if (n !== "custom") return kr(Or(n), n);
	let r = String(t.fallbackGoalProfile || z("scheduler-goal-select") || "internal_recon");
	return kr({
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
function Gr() {
	let e = Br(), t = e === "custom", n = Wr(e, { fallbackGoalProfile: z("scheduler-goal-select") || "internal_recon" });
	F("nmap-engagement-derived-scope", n.scope || "internal"), F("nmap-engagement-derived-intent", n.intent || "recon");
	let r = document.getElementById("nmap-engagement-preset-summary");
	r && (r.textContent = Mr(e, t));
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
function Kr(e = {}) {
	let t = document.getElementById("passive-capture-interface"), n = document.getElementById("passive-capture-interface-note");
	if (!t) return;
	let r = Array.isArray(e.interfaces) ? e.interfaces : [], i = String(e.default_interface || "").trim(), a = String(t.value || "").trim();
	if (t.innerHTML = "", !r.length) {
		let e = document.createElement("option");
		e.value = "", e.textContent = "No capture-ready interfaces found", t.appendChild(e), t.value = "", n && (n.textContent = "Passive capture needs an active non-loopback IPv4 interface."), Lr();
	} else {
		if (r.forEach((e) => {
			let n = document.createElement("option");
			n.value = String(e.name || "").trim(), n.textContent = String(e.label || e.name || "").trim(), n.dataset.networks = Array.isArray(e.ipv4_networks) ? e.ipv4_networks.join(", ") : "", t.appendChild(n);
		}), t.value = a && r.some((e) => String(e.name || "").trim() === a) ? a : i && r.some((e) => String(e.name || "").trim() === i) ? i : String(r[0].name || "").trim(), n) {
			let e = t.options[t.selectedIndex], r = String(e?.dataset?.networks || "").trim();
			n.textContent = r ? `Connected networks: ${r}` : "Passive capture will watch discovery traffic on the selected interface.";
		}
		Lr();
	}
}
async function qr() {
	if (document.getElementById("passive-capture-interface")) try {
		let e = await Xe("/api/network/interfaces");
		Oe.captureInterfacesLoaded = !0, Kr(e || {});
	} catch {
		Oe.captureInterfacesLoaded = !1, Kr({
			interfaces: [],
			default_interface: ""
		});
	}
}
function Jr({ scrollIntoView: e = !1, focusPreset: t = !1, focusTargets: n = !1 } = {}) {
	let r = document.getElementById("nmap-scan-block");
	e && r && r.scrollIntoView({
		behavior: "smooth",
		block: "start"
	}), Oe.postSubmitLock = !0, Oe.lastMode = "", Oe.lastEngagementPreset = "", Oe.captureInterfacesLoaded = !1, I("nmap-targets", ""), L("nmap-run-actions", !0), I("passive-capture-duration", "15"), Kr({
		interfaces: [],
		default_interface: ""
	});
	let i = document.querySelector("input[name='nmap-scan-mode'][value='easy']");
	i && (i.checked = !0), I("nmap-engagement-preset-select", z("scheduler-goal-select") || "internal_recon"), Gr(), Nr("easy"), Ir(1), Pr(), Fr(), qr().catch(() => {});
	let a = t ? "nmap-engagement-preset-select" : n ? "nmap-targets" : "";
	if (a) {
		let e = document.getElementById(a);
		e && window.setTimeout(() => {
			e.focus();
		}, 220);
	}
}
// ../app/web/static/js/workspace/dialogs.js
var Yr, Xr;
function Zr(e) {
	for (let t of ["openManualToolPicker", "pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing dialogs callback: ${t}`);
	({openManualToolPicker: Yr, pollSnapshot: Xr} = e);
}
function Qr(e) {
	let t = document.getElementById("nmap-scan-modal");
	t && (Ae.nmapScanOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function $r(e) {
	let t = document.getElementById("manual-scan-modal");
	t && (Ae.manualScanOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function ei(e) {
	let t = document.getElementById("host-remove-modal");
	t && (Ae.hostRemoveOpen = !!e, De.modalOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function ti(e) {
	let t = document.getElementById("graph-note-modal");
	t && (Ae.graphNoteOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie(), e && window.requestAnimationFrame(() => {
		let e = document.getElementById("graph-note-input");
		e && (e.focus(), e.setSelectionRange(e.value.length, e.value.length));
	}));
}
function ni() {
	Qr(!1);
}
function ri() {
	k.manualToolTargets = [];
	let e = document.getElementById("workspace-tool-target-wrapper"), t = document.getElementById("workspace-tool-target-select");
	e && (e.hidden = !0), t && (t.innerHTML = ""), F("workspace-tool-context", ""), $r(!1);
}
function ii() {
	$r(!1);
}
function ai(e = !0) {
	ei(!1), e && (De.hostId = null, De.hostIp = "", De.hostName = "", F("host-remove-modal-target", ""));
}
function oi(e = !1) {
	ti(!1), e && I("graph-note-input", "");
}
function si() {
	mi(), Qr(!0), Jr({
		scrollIntoView: !1,
		focusPreset: !0
	});
}
function ci() {
	Yr({});
}
function li(e) {
	let t = parseInt(e, 10);
	if (!t) return;
	let n = k.hosts.find((e) => parseInt(e.id, 10) === t);
	De.hostId = t, De.hostIp = String(n?.ip || ""), De.hostName = String(n?.hostname || ""), F("host-remove-modal-target", (De.hostName ? `${De.hostIp} (${De.hostName})` : De.hostIp) || `Host ID ${t}`), ei(!0);
}
function ui(e) {
	let t = document.getElementById("scheduler-settings-modal");
	t && (Ae.schedulerOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function di(e) {
	let t = document.getElementById("device-category-settings-modal");
	t && (Ae.deviceCategorySettingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function fi(e) {
	let t = document.getElementById("app-settings-modal");
	t && (Ae.settingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function pi(e, t) {
	let n = t ? String(e || "").trim() : "";
	je.openMenuId = n || null, document.querySelectorAll(".ribbon-menu[data-ribbon-menu]").forEach((e) => {
		let t = String(e.dataset.ribbonMenu || ""), r = n && t === n;
		e.classList.toggle("is-open", !!r);
		let i = e.querySelector("[data-ribbon-menu-toggle]");
		i && i.setAttribute("aria-expanded", r ? "true" : "false");
	});
}
function mi() {
	pi("", !1), Kn(!1);
}
function hi(e) {
	let t = String(e || "").trim();
	t ? pi(t, je.openMenuId !== t) : mi();
}
function gi() {
	mi(), ui(!0);
}
function _i() {
	ui(!1);
}
function vi() {
	mi(), Cr("Idle"), Tr(), di(!0);
}
function yi() {
	di(!1);
}
// ../app/web/static/js/workspace/graph_viewport.js
function bi(e) {
	return (A.filtered.groups || []).find((t) => String(t?.key || "") === String(e || "")) || null;
}
function xi(e) {
	if (!e || G(e, "summary_kind")) return 0;
	let t = parseInt(G(e, "host_id"), 10);
	if (Number.isFinite(t) && t > 0) return t;
	let n = String(e?.label || "").trim().toLowerCase(), r = String(G(e, "hostname") || "").trim().toLowerCase(), i = String(G(e, "ip") || "").trim(), a = (k.hosts || []).find((e) => n && String(e?.hostname || "").trim().toLowerCase() === n || r && String(e?.hostname || "").trim().toLowerCase() === r || i && String(e?.ip || "").trim() === i), o = parseInt(a?.id, 10);
	return Number.isFinite(o) && o > 0 ? o : 0;
}
function Si(e) {
	let t = parseInt(k.selectedHostId, 10);
	return !Number.isFinite(t) || t <= 0 || String(e?.type || "").trim().toLowerCase() !== "host" ? !1 : xi(e) === t;
}
function Ci() {
	return Math.max(10, Math.min(400, Number(A.zoomPercent || 100)));
}
function wi(e, t, n, r) {
	let i = Math.max(1, Number(e || 1)), a = Math.max(1, Number(t || 1)), o = Math.max(1, Number(n || 1)) / Math.max(1, Number(r || 1));
	return i / a >= o ? {
		width: i,
		height: i / o
	} : {
		width: a * o,
		height: a
	};
}
function Ti(e, t, n, r, i, a) {
	let o = Math.max(1, Number(n || 1)), s = Math.max(1, Number(r || 1)), c = Math.max(1, Number(i || 1)), l = Math.max(1, Number(a || 1)), u = Number(e || 0), d = Number(t || 0);
	return u = c >= o ? o / 2 : Math.max(c / 2, Math.min(o - c / 2, u)), d = l >= s ? s / 2 : Math.max(l / 2, Math.min(s - l / 2, d)), {
		x: u,
		y: d
	};
}
function Ei(e, t) {
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
function Di(e, t) {
	let n = document.getElementById("graph-workspace-canvas"), r = Ut();
	if (!n || !r) return A.viewport = null, null;
	let i = Math.max(1, Number(r.clientWidth || r.getBoundingClientRect().width || 1)), a = Math.max(1, Number(r.clientHeight || r.getBoundingClientRect().height || 1)), o = Ei(e, t), s = wi(o.width, o.height, i, a), c = Math.max(1, i / (s.width * 1.25), a / (s.height * 1.25));
	s.width *= c, s.height *= c;
	let l = Ci() / 100, u = Math.max(1, s.width / l), d = Math.max(1, s.height / l), f = A.viewport || {}, p = o.x + o.width / 2, m = o.y + o.height / 2, h = Ti((Number.isFinite(Number(f.centerX)) ? Number(f.centerX) : p) - o.x, (Number.isFinite(Number(f.centerY)) ? Number(f.centerY) : m) - o.y, o.width, o.height, u, d);
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
function Oi() {
	return Ci() >= 55;
}
function ki(e = {}) {
	return e.isSelected || e.isHostSelected || e.isSummaryNode ? !0 : Ci() >= 60;
}
function Ai(e = {}) {
	return e.isSelected || e.isHostSelected || e.isSummaryNode ? !0 : Ci() >= 78;
}
// ../app/web/static/js/workspace/host_actions.js
var ji;
function Mi(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing host_actions callback: ${t}`);
	({pollSnapshot: ji} = e);
}
function Ni(e = "Run supported tool") {
	let t = document.createElement("button");
	return t.type = "button", t.className = "icon-btn", t.title = e, t.setAttribute("aria-label", e), t.innerHTML = "<i class=\"fa-solid fa-screwdriver-wrench\" aria-hidden=\"true\"></i>", t;
}
function Pi(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = "icon-btn", n.dataset.subnetAction = String(e || ""), n.dataset.subnet = String(t || ""), e === "rescan" && (n.title = "Rescan subnet", n.setAttribute("aria-label", "Rescan subnet"), n.innerHTML = "<i class=\"fa-solid fa-rotate-right\" aria-hidden=\"true\"></i>"), n;
}
function Fi(e) {
	let t = parseInt(e, 10);
	return !Number.isFinite(t) || t <= 0 ? null : (k.hosts || []).find((e) => parseInt(e?.id, 10) === t) || null;
}
function Ii(e) {
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
	let o = String(G(a, "service") || "").trim().replace(/\?+$/, "").toLowerCase();
	return {
		serviceName: o,
		serviceLabel: String(a?.label || o || "").trim()
	};
}
function Li(e) {
	if (!e) return null;
	let t = String(e?.type || "").trim().toLowerCase();
	if (!["port", "service"].includes(t)) return null;
	let n = xi(e), r = Fi(n), i = String(r?.ip || G(e, "ip") || "").trim(), a = String(G(e, "port") || "").trim(), o = String(G(e, "protocol") || "tcp").trim().toLowerCase() || "tcp";
	if (!n || !i || !a) return null;
	let s = "", c = "";
	if (t === "service") s = String(G(e, "service") || e.label || "").trim().replace(/\?+$/, "").toLowerCase(), c = String(e.label || s || "").trim();
	else {
		let t = Ii(e);
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
function Ri() {
	document.querySelectorAll(".graph-action-menu.is-open").forEach((e) => {
		e.classList.remove("is-open");
		let t = e.querySelector(".panel-menu-button");
		t && t.setAttribute("aria-expanded", "false");
	});
}
async function zi(e, { port: t = "", protocol: n = "tcp" } = {}) {
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
async function Bi(e, t) {
	if (e && t?.tool_id) try {
		let n = await Ye("/api/workspace/tools/run", {
			host_ip: e.hostIp,
			port: e.port,
			protocol: e.protocol,
			tool_id: String(t.tool_id || "")
		});
		V(`${t.label || t.tool_id} queued for ${e.hostIp}:${e.port}/${e.protocol} (job ${n?.job?.id || "?"})`), await ji();
	} catch (e) {
		V(`Tool launch failed: ${e.message}`, !0);
	}
}
function Vi(e) {
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
		if (Ri(), !s || (t.classList.add("is-open"), n.setAttribute("aria-expanded", "true"), a)) return;
		r.innerHTML = "";
		let c = document.createElement("div");
		c.className = "graph-action-menu-status", c.textContent = "Loading actions...", r.appendChild(c);
		try {
			let t = await zi(i, {
				port: e?.port || "",
				protocol: e?.protocol || "tcp"
			});
			if (r.innerHTML = "", t.length) t.forEach((t) => {
				let n = document.createElement("button");
				n.type = "button", n.className = "ribbon-submenu-item", n.textContent = String(t.label || t.tool_id || "tool"), n.title = String(t.command_template || t.tool_id || ""), n.addEventListener("click", async (n) => {
					n.preventDefault(), n.stopPropagation(), Ri(), await Bi(e, t);
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
async function Hi(e) {
	let t = parseInt(e?.dataset?.hostId, 10), n = String(e?.dataset?.hostAction || "");
	return t ? n === "rescan" ? (await Ki(t), !0) : n === "remove" && (li(t), !0) : !0;
}
async function Ui(e) {
	let t = String(e?.dataset?.subnet || "").trim(), n = String(e?.dataset?.subnetAction || "");
	return !t || n === "rescan" && (await qi(t), !0);
}
async function Wi(e) {
	if (!e?.hostId || !e?.port) return;
	let t = `${e.hostIp}:${e.port}/${e.protocol}`;
	if (window.confirm(`Delete port ${t}?`)) try {
		await Ye("/api/workspace/ports/delete", {
			host_id: e.hostId,
			port: e.port,
			protocol: e.protocol
		}), V(`Deleted port ${t}`), await ji();
	} catch (e) {
		V(`Delete port failed: ${e.message}`, !0);
	}
}
async function Gi(e) {
	if (!e?.hostId || !e?.port) return;
	let t = `${e.serviceLabel || e.serviceName || "service"} on ${e.hostIp}:${e.port}/${e.protocol}`;
	if (window.confirm(`Delete ${t}?`)) try {
		await Ye("/api/workspace/services/delete", {
			host_id: e.hostId,
			port: e.port,
			protocol: e.protocol,
			service: e.serviceName
		}), V(`Deleted ${t}`), await ji();
	} catch (e) {
		V(`Delete service failed: ${e.message}`, !0);
	}
}
async function Ki(e) {
	let t = parseInt(e, 10);
	if (t) try {
		V(`Rescan queued (job ${(await Ye(`/api/workspace/hosts/${t}/rescan`, {}))?.job?.id || "?"})`), await ji();
	} catch (e) {
		V(`Rescan failed: ${e.message}`, !0);
	}
}
async function qi(e) {
	let t = String(e || "").trim();
	if (t) try {
		let e = await Ye("/api/workspace/subnets/rescan", { subnet: t }), n = Number(e?.job?.id || 0);
		e?.job?.existing ? V(`Subnet rescan already queued/running (job ${n || "?"})`) : V(`Subnet rescan queued (job ${n || "?"})`), await ji();
	} catch (e) {
		V(`Subnet rescan failed: ${e.message}`, !0);
	}
}
async function Ji() {
	let e = parseInt(De.hostId, 10);
	if (!e) ai(!0);
	else try {
		let t = await fetch(`/api/workspace/hosts/${e}`, { method: "DELETE" }), n = {};
		try {
			n = await t.json();
		} catch {}
		if (!t.ok) {
			let e = n.error || `Request failed (${t.status})`;
			throw Error(e);
		}
		let r = String(n.host_ip || De.hostIp || "");
		ai(!0), k.selectedHostId === e && (k.selectedHostId = null, k.hostDetail = null), V(`Removed host ${r || e}`), await Promise.all([
			yr(),
			ji(),
			Pt()
		]);
	} catch (e) {
		V(`Remove host failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/tools.js
var Yi;
function Xi(e) {
	for (let t of ["pollSnapshot"]) if (typeof e[t] != "function") throw TypeError(`Missing tools callback: ${t}`);
	({pollSnapshot: Yi} = e);
}
function Zi() {
	if (z("workspace-tool-host-ip").trim()) return;
	let e = k.hosts.find((e) => String(e.id) === String(k.selectedHostId));
	e?.ip && I("workspace-tool-host-ip", e.ip);
}
function K(e) {
	return [
		String(e?.host_id || ""),
		String(e?.host_ip || ""),
		String(e?.port || ""),
		String(e?.protocol || "tcp"),
		String(e?.service || "")
	].join("|");
}
function q(e, t = "") {
	let n = document.getElementById("workspace-tool-select");
	if (!n) return;
	k.manualToolOptions = Array.isArray(e) ? e : [];
	let r = String(t || n.value || "").trim();
	n.innerHTML = "", k.manualToolOptions.filter((e) => e?.runnable !== !1).forEach((e) => {
		let t = document.createElement("option");
		t.value = String(e.tool_id || ""), t.textContent = `${e.label || e.tool_id} (${e.tool_id || ""})`, n.appendChild(t);
	}), r && Array.from(n.options).some((e) => e.value === r) && (n.value = r), $i();
}
function Qi() {
	let e = z("workspace-tool-select").trim();
	return e && (Array.isArray(k.manualToolOptions) ? k.manualToolOptions : []).find((t) => String(t?.tool_id || "") === e) || null;
}
function $i() {
	let e = document.getElementById("workspace-tool-parameters-wrapper"), t = document.getElementById("workspace-tool-parameters");
	if (!e || !t) return;
	t.innerHTML = "";
	let n = Qi(), r = Array.isArray(n?.parameters) ? n.parameters : [];
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
function ea() {
	let e = document.getElementById("workspace-tool-parameters-wrapper"), t = document.getElementById("workspace-tool-parameters");
	if (!e || e.hidden || !t) return {};
	let n = {};
	return t.querySelectorAll("[data-parameter-name]").forEach((e) => {
		let t = String(e.dataset.parameterName || "").trim(), r = String(e.value || "").trim();
		t && r && (n[t] = r);
	}), n;
}
async function ta({ hostId: e = 0, service: t = "", limit: n = 500 } = {}) {
	let r = new URLSearchParams();
	r.set("limit", String(n)), e && r.set("host_id", String(e)), t && r.set("service", String(t));
	let i = await Xe(`/api/workspace/tool-targets?${r.toString()}`);
	return Array.isArray(i?.targets) ? i.targets : [];
}
async function na(e = "", t = "", { port: n = "", protocol: r = "tcp" } = {}) {
	let i = await sr({
		service: e,
		port: n,
		protocol: r
	});
	return q(i, t), i;
}
async function ra(e, { preferredToolId: t = "" } = {}) {
	let n = e && typeof e == "object" ? e : {};
	I("workspace-tool-host-ip", n.host_ip || ""), I("workspace-tool-port", n.port || ""), I("workspace-tool-protocol", n.protocol || "tcp"), await na(String(n.service || "").trim(), t, {
		port: String(n.port || "").trim(),
		protocol: String(n.protocol || "tcp").trim() || "tcp"
	});
}
async function ia(e, { preferredTargetKey: t = "", preferredToolId: n = "" } = {}) {
	k.manualToolTargets = Array.isArray(e) ? e : [];
	let r = document.getElementById("workspace-tool-target-wrapper"), i = document.getElementById("workspace-tool-target-select");
	if (!r || !i) return;
	if (i.innerHTML = "", !k.manualToolTargets.length) {
		r.hidden = !0;
		return;
	}
	k.manualToolTargets.forEach((e) => {
		let t = document.createElement("option");
		t.value = K(e), t.textContent = String(e?.label || `${e?.host_ip || ""}:${e?.port || ""}/${e?.protocol || "tcp"}`), i.appendChild(t);
	}), r.hidden = !1;
	let a = t && Array.from(i.options).some((e) => e.value === t) ? t : String(i.options[0]?.value || "");
	a && (i.value = a), await ra(k.manualToolTargets.find((e) => K(e) === String(i.value || "")), { preferredToolId: n });
}
async function aa({ contextLabel: e = "", targets: t = null, hostId: n = 0, service: r = "", preferredToolId: i = "" } = {}) {
	mi(), $r(!0), F("workspace-tool-context", e || "");
	try {
		let e = Array.isArray(t) ? t : [];
		if (!e.length && (Number(n) > 0 || String(r || "").trim()) && (e = await ta({
			hostId: Number(n) || 0,
			service: String(r || "").trim(),
			limit: 2e3
		})), e.length) {
			await ia(e, { preferredToolId: i });
			return;
		}
	} catch (e) {
		V(`Load tool targets failed: ${e.message}`, !0);
	}
	k.manualToolTargets = [];
	let a = document.getElementById("workspace-tool-target-wrapper"), o = document.getElementById("workspace-tool-target-select");
	a && (a.hidden = !0), o && (o.innerHTML = ""), Zi(), q(k.tools, i);
}
async function oa() {
	let e = document.getElementById("workspace-tool-target-select");
	if (!e) return;
	let t = k.manualToolTargets.find((t) => K(t) === String(e.value || ""));
	t && await ra(t);
}
async function sa() {
	if (!Ae.manualScanOpen) return;
	let e = document.getElementById("workspace-tool-target-select"), t = "";
	if (e && !e.closest("[hidden]")) {
		let n = k.manualToolTargets.find((t) => K(t) === String(e.value || ""));
		t = String(n?.service || "").trim();
	}
	await na(t, z("workspace-tool-select").trim(), {
		port: z("workspace-tool-port").trim(),
		protocol: z("workspace-tool-protocol").trim() || "tcp"
	});
}
async function ca() {
	let e = z("workspace-tool-host-ip").trim(), t = z("workspace-tool-port").trim(), n = z("workspace-tool-protocol").trim() || "tcp", r = z("workspace-tool-select").trim();
	if (!e || !t || !r) {
		V("host ip, port and tool are required", !0);
		return;
	}
	let i = ea();
	ii(), V("Queueing tool run...");
	try {
		V(`Tool run queued (job ${(await Ye("/api/workspace/tools/run", {
			host_ip: e,
			port: t,
			protocol: n,
			tool_id: r,
			parameters: i
		}))?.job?.id || "?"})`), await Yi();
	} catch (e) {
		V(`Tool run failed: ${e.message}`, !0);
	}
}
async function la() {
	Ae.manualScanOpen && ii(), V("Queueing scheduler run...");
	try {
		V(`Scheduler run queued (job ${(await Ye("/api/scheduler/run", {}))?.job?.id || "?"})`), await Yi();
	} catch (e) {
		V(`Scheduler run failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/graph_detail.js
var ua;
function da(e) {
	for (let t of ["graphRenderWorkspace"]) if (typeof e[t] != "function") throw TypeError(`Missing graph_detail callback: ${t}`);
	({graphRenderWorkspace: ua} = e);
}
function fa() {
	oi(!1), A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.relatedContent = [], ua();
}
function pa(e) {
	let t = !!e;
	A.filtersExpanded = t;
	let n = document.getElementById("graph-filters-panel"), r = document.getElementById("graph-filters-toggle-button");
	if (n && (n.hidden = !t), r) {
		let e = t ? "Hide Filters" : "Show Filters";
		r.setAttribute("title", e), r.setAttribute("aria-label", e), r.setAttribute("aria-expanded", t ? "true" : "false"), r.classList.toggle("is-active", t);
	}
}
function ma() {
	let e = Ht(), t = document.getElementById("graph-workspace-canvas");
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
		let e = Ft("edge", o);
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
function ha() {
	let e = Vt(), t = document.getElementById("graph-sidebar"), n = document.getElementById("graph-detail-dock-slot"), r = document.getElementById("graph-detail-floating-layer"), i = document.getElementById("graph-detail-panel"), a = document.getElementById("graph-detail-dock-toggle-button"), o = document.getElementById("graph-detail-close-button");
	if (!e || !t || !n || !r || !i || !a || !o) return;
	let s = String(A.detailMode || "floating") !== "docked", c = Wt();
	e.classList.toggle("graph-workspace-detail-floating", s), e.classList.toggle("graph-workspace-detail-docked", !s), t.hidden = s, r.hidden = !s || !c, i.classList.toggle("is-floating", s), a.setAttribute("title", s ? "Dock Panel" : "Float Panel"), a.setAttribute("aria-label", s ? "Dock Panel" : "Float Panel"), o.hidden = !s, s ? i.parentElement !== r && r.appendChild(i) : i.parentElement !== n && n.appendChild(i), i.hidden = s ? !c : !1, !s || !c ? (i.style.left = "", i.style.top = "") : window.requestAnimationFrame(() => {
		let e = Ht();
		if (!e || i.hidden) return;
		let t = ma(), n = Math.min(i.offsetWidth || 430, Math.max(280, e.clientWidth - 16)), r = i.offsetHeight || 420, a = Math.max(320, e.clientWidth), o = Math.max(240, e.clientHeight), s = Math.max(8, a - n - 10), c = 12;
		t && (s = t.x + 18, c = t.y + 12, s + n > a - 8 && (s = Math.max(8, t.x - n - 18)), c + r > o - 8 && (c = Math.max(8, o - r - 8))), s = Math.max(8, Math.min(s, a - n - 8)), c = Math.max(8, Math.min(c, o - Math.min(r, o - 8) - 8)), i.style.left = `${Math.round(s)}px`, i.style.top = `${Math.round(c)}px`;
	});
}
function ga(e) {
	A.detailMode = String(e || "floating").trim().toLowerCase() === "docked" ? "docked" : "floating", ha();
}
function _a() {
	ga(A.detailMode === "docked" ? "floating" : "docked");
}
function va() {
	let e = document.getElementById("graph-focus-selection-button"), t = document.getElementById("graph-clear-focus-button"), n = document.getElementById("graph-expand-selection-button"), r = document.getElementById("graph-collapse-expanded-button"), i = Gt(), a = i && G(i, "summary_kind") ? i : null, o = String(a?.node_id || ""), s = !!(o && A.expandedSummaryIds[o]);
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
function ya() {
	let e = document.getElementById("graph-detail-caption"), t = document.getElementById("graph-selection-badges"), n = document.getElementById("graph-detail-fields"), r = document.getElementById("graph-host-actions-block"), i = document.getElementById("graph-host-actions"), a = document.getElementById("graph-port-actions-block"), o = document.getElementById("graph-port-actions"), s = document.getElementById("graph-service-actions-block"), c = document.getElementById("graph-service-actions"), l = document.getElementById("graph-subnet-actions-block"), u = document.getElementById("graph-subnet-actions"), d = document.getElementById("graph-detail-evidence"), f = document.getElementById("graph-detail-properties"), p = document.getElementById("graph-annotations-list"), m = document.getElementById("graph-focus-selection-button");
	document.getElementById("graph-expand-selection-button"), document.getElementById("graph-collapse-expanded-button");
	let h = document.getElementById("graph-pin-toggle-button"), g = document.getElementById("graph-note-open-button"), _ = String(A.selectedKind || ""), v = String(A.selectedRef || ""), y = _ === "node" ? Gt() : Ft(_, v);
	if (A.selectedPayload = y, t.innerHTML = "", n.innerHTML = "", i.innerHTML = "", o.innerHTML = "", c.innerHTML = "", u.innerHTML = "", r.hidden = !0, a.hidden = !0, s.hidden = !0, l.hidden = !0, d.innerHTML = "", p.innerHTML = "", !y) {
		e.textContent = "Select a node or edge", f.textContent = "No graph selection", m.disabled = !0, m.setAttribute("title", "Select a node or summary to focus"), m.setAttribute("aria-label", "Select a node or summary to focus"), g.disabled = !0, g.setAttribute("title", "Select a node or edge to add a note"), g.setAttribute("aria-label", "Select a node or edge to add a note"), h.disabled = !0, h.classList.remove("is-active"), h.setAttribute("title", "Select a node to pin"), h.setAttribute("aria-label", "Select a node to pin"), va(), ha();
		return;
	}
	let b = _ === "node" && !!G(y, "summary_kind"), x = _ === "edge" && !!G(y, "aggregate_kind"), S = _ === "node" ? xi(y) : 0, ee = _ === "node" ? String(y.type || "").trim().toLowerCase() : "", C = [];
	if (_ === "node") e.textContent = `${$t(y.type)}: ${y.label || y.node_id || ""}`, C.push(["Node ID", y.node_id || ""]), C.push(["Type", $t(y.type || "")]), b && (C.push(["Summary", "collapsed cluster"]), C.push(["Members", G(y, "member_count") || ""]), C.push(["Examples", (G(y, "sample_labels") || []).join(", ")]), C.push(["Expanded", A.expandedSummaryIds[String(y.node_id || "")] ? "yes" : "no"]));
	else {
		let t = Ft("node", y.from_node_id), n = Ft("node", y.to_node_id);
		e.textContent = `${$t(y.type)}: ${t?.label || y.from_node_id || ""} -> ${n?.label || y.to_node_id || ""}`, C.push(["Edge ID", y.edge_id || ""]), C.push(["Type", $t(y.type || "")]), C.push(["From", t?.label || y.from_node_id || ""]), C.push(["To", n?.label || y.to_node_id || ""]), x && (C.push(["Aggregate Count", G(y, "aggregate_count") || ""]), C.push(["Edge Types", (G(y, "edge_types") || []).join(", ")]));
	}
	if (C.push(["Confidence", y.confidence ?? ""]), C.push(["Provenance", Se[String(y.source_kind || "").trim().toLowerCase()] || $t(y.source_kind || "")]), C.push(["First Seen", y.first_seen || ""]), C.push(["Last Seen", y.last_seen || ""]), C.push(["Source Ref", y.source_ref || ""]), C.forEach(([e, t]) => {
		if (t == null || t === "") return;
		let r = document.createElement("dt");
		r.textContent = e;
		let i = document.createElement("dd");
		i.textContent = String(t), n.appendChild(r), n.appendChild(i);
	}), [
		$t(y.type || ""),
		Se[String(y.source_kind || "").trim().toLowerCase()] || $t(y.source_kind || ""),
		`${Math.round(Number(y.confidence || 0))}% confidence`
	].forEach((e) => {
		let n = document.createElement("span");
		n.className = "graph-badge", n.textContent = e, t.appendChild(n);
	}), _ === "node" && A.pinnedNodeIds[String(y.node_id || "")]) {
		let e = document.createElement("span");
		e.className = "graph-badge graph-badge-pinned", e.textContent = "pinned", t.appendChild(e);
	}
	if (b) {
		let e = document.createElement("span");
		e.className = "graph-badge", e.textContent = "summary", t.appendChild(e);
	}
	if (x) {
		let e = document.createElement("span");
		e.className = "graph-badge", e.textContent = `${G(y, "aggregate_count") || 0} merged edges`, t.appendChild(e);
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
	let ne = (A.annotations || []).filter((e) => String(e?.target_kind || "") === _ && String(e?.target_ref || "") === v);
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
		let e = Ni("Run supported tool");
		e.addEventListener("click", async () => {
			await aa({
				hostId: Number(S) || 0,
				contextLabel: `Supported tools for ${String(y.label || "host").trim()}`
			});
		}), i.appendChild(e);
	}
	if (_ === "node" && ee === "port") {
		let e = Li(y);
		if (e) {
			a.hidden = !1;
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Delete Port", t.setAttribute("aria-label", "Delete Port"), t.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", t.addEventListener("click", async () => {
				await Wi(e);
			}), o.appendChild(t), o.appendChild(Vi(e));
		}
	}
	if (_ === "node" && ee === "service") {
		let e = Li(y);
		if (e) {
			s.hidden = !1;
			let t = document.createElement("button");
			t.type = "button", t.className = "icon-btn icon-btn-danger", t.title = "Delete Service", t.setAttribute("aria-label", "Delete Service"), t.innerHTML = "<i class=\"fa-solid fa-trash\" aria-hidden=\"true\"></i>", t.addEventListener("click", async () => {
				await Gi(e);
			}), c.appendChild(t), c.appendChild(Vi(e));
		}
	}
	if (_ === "node" && ee === "subnet") {
		let e = String(G(y, "cidr") || y.label || "").trim();
		if (e) {
			l.hidden = !1;
			let t = Pi("rescan", e);
			t.addEventListener("click", async () => {
				await Ui(t);
			}), u.appendChild(t);
		}
	}
	g.disabled = !1, g.setAttribute("title", "Add Note"), g.setAttribute("aria-label", "Add Note"), h.disabled = _ !== "node" || b;
	let re = _ === "node" && !!A.pinnedNodeIds[String(y.node_id || "")];
	h.classList.toggle("is-active", re), _ === "node" ? b ? (h.setAttribute("title", "Summary nodes cannot be pinned"), h.setAttribute("aria-label", "Summary nodes cannot be pinned")) : (h.setAttribute("title", re ? "Unpin Node" : "Pin Node"), h.setAttribute("aria-label", re ? "Unpin Node" : "Pin Node")) : (h.setAttribute("title", "Pinning is available for nodes only"), h.setAttribute("aria-label", "Pinning is available for nodes only")), b ? ba("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.") : ba(), va(), ha();
}
function ba(e = "") {
	let t = document.getElementById("graph-detail-content-list"), n = document.getElementById("graph-detail-content-status");
	if (!t || !n) return;
	t.innerHTML = "";
	let r = Array.isArray(A.relatedContent) ? A.relatedContent : [];
	r.length ? (n.textContent = `${r.length} related item${r.length === 1 ? "" : "s"}`, r.forEach((e) => {
		let n = document.createElement("article");
		n.className = "graph-content-card";
		let r = document.createElement("div");
		r.className = "graph-content-header";
		let i = document.createElement("strong");
		i.textContent = e.label || e.filename || e.node_id || "artifact", r.appendChild(i);
		let a = document.createElement("span");
		a.className = "graph-content-kind", a.textContent = $t(e.kind || e.node_type || "artifact"), r.appendChild(a), n.appendChild(r);
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
			e.kind === "image" && e.preview_url || await bt(String(e.preview_text || e.ref || ""), `${e.filename || e.label || "Artifact"} copied to clipboard`, "Nothing to copy");
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
				_t({
					title: "Artifact Preview",
					meta: e.filename || e.ref || "Artifact preview",
					command: e.ref || "",
					output: e.preview_text || "",
					downloadName: e.filename || "artifact.txt"
				});
			}), s.appendChild(t);
		}
		n.appendChild(s), t.appendChild(n);
	}), ha()) : (n.textContent = e || "No related files", ha());
}
async function xa() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || ""), n = e === "node" ? Gt() : null;
	if (!e || !t || e !== "node" || !n) {
		A.relatedContent = [];
		return;
	}
	if (G(n, "summary_kind")) {
		A.relatedContent = [], ba("Summary nodes do not have direct related content. Expand or focus the cluster to inspect individual artifacts.");
		return;
	}
	let r = Number(A.contentRequestId || 0) + 1;
	A.contentRequestId = r, A.relatedContent = [], ba("Loading related content...");
	try {
		let e = await Xe(`/api/graph/nodes/${encodeURIComponent(t)}/content?max_chars=20000`);
		if (r !== A.contentRequestId) return;
		A.relatedContent = Array.isArray(e?.entries) ? e.entries : [], ba();
	} catch (e) {
		if (r !== A.contentRequestId) return;
		A.relatedContent = [], ba(`Related content load failed: ${e.message}`);
	}
}
// ../app/web/static/js/workspace/graph_layout.js
function Sa(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
	return (e || []).forEach((e) => {
		let o = parseInt(G(e, "host_id"), 10);
		if (!(!Number.isFinite(o) || o <= 0) && String(e.type || "") === "host") {
			t.set(o, e), n.set(o, String(e.label || G(e, "ip") || `host-${o}`));
			let s = String(G(e, "hostname") || "").trim();
			s && i.set(o, s);
			let c = String(G(e, "ip") || "").trim();
			c && r.set(o, en(c));
			let l = G(e, "device_categories");
			Array.isArray(l) ? a.set(o, In(l)) : a.set(o, In(String(l || "").split(",")));
		}
	}), {
		hostById: t,
		hostLabelById: n,
		subnetByHostId: r,
		domainByHostId: i,
		categoriesByHostId: a
	};
}
function Ca(e, t, n) {
	let r = String(G(e, "summary_group_key") || "").trim();
	if (r) return r;
	let i = String(e?.type || "").trim().toLowerCase(), a = parseInt(G(e, "host_id"), 10), o = String(G(e, "hostname") || "").trim(), s = String(G(e, "service") || G(e, "name") || G(e, "product") || "").trim();
	if (t === "host") return i === "host" ? String(e.label || "host") : n.hostLabelById.get(a) || "unassigned host";
	if (t === "category") {
		let t = In(i === "host" ? G(e, "device_categories") : n.categoriesByHostId.get(a) || []);
		return t.length ? t.join(", ") : "uncategorized";
	}
	if (t === "domain") return i === "fqdn" ? String(e.label || "domain") : o || n.domainByHostId.get(a) || "undisclosed domain";
	if (t === "service") return i === "service" ? s || String(e.label || "service") : i === "port" ? `${G(e, "port") || ""}/${G(e, "protocol") || ""}`.replace(/\/$/, "") || "port" : s || $t(i) || "other service";
	if (t === "finding") return String(i === "finding" ? G(e, "title") || e.label || "finding" : G(e, "cve") || G(e, "title") || G(e, "severity") || $t(i) || "other");
	if (i === "subnet") return String(e.label || "subnet");
	let c = String(G(e, "ip") || "").trim();
	return c ? en(c) : n.subnetByHostId.get(a) || "other subnet";
}
function wa(e, t) {
	let n = String(e?.type || "").trim().toLowerCase(), r = String(t?.type || "").trim().toLowerCase(), i = Fe.indexOf(n), a = Fe.indexOf(r);
	return i === a ? String(e?.label || "").localeCompare(String(t?.label || "")) : (i === -1 ? Fe.length : i) - (a === -1 ? Fe.length : a);
}
function Ta(e) {
	let t = String(G(e, "severity") || "").trim().toLowerCase();
	return t ? Object.prototype.hasOwnProperty.call(Te, t) ? Te[t] : 80 : 99;
}
function Ea(e, t) {
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
function Da(e, t) {
	return String(e || "").localeCompare(String(t || ""), void 0, {
		numeric: !0,
		sensitivity: "base"
	});
}
function Oa(e, t) {
	return Array.from(e.entries()).sort((e, n) => {
		let [r, i] = e, [a, o] = n, s = Math.min(...i.map((e) => Ea(e?.type, t)), 9), c = Math.min(...o.map((e) => Ea(e?.type, t)), 9);
		if (s !== c) return s - c;
		let l = Math.min(...i.map((e) => Ta(e)), 99), u = Math.min(...o.map((e) => Ta(e)), 99);
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
		return d === f ? Da(r, a) : f - d;
	});
}
function ka(e) {
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
function Aa(e, t) {
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
function ja(e, t, n) {
	let r = String(e || "").trim().toLowerCase(), i = String(t || A.viewId || "attack_surface").trim().toLowerCase();
	return i === "attack_surface" ? r === "scope" || r === "subnet" ? 0 : r === "host" || r === "fqdn" ? 1 : r === "port" || r === "service" ? 2 : r === "technology" || r === "cpe" ? 4 : r === "finding" || r === "cve" || r === "exploit_reference" ? 5 : [
		"credential",
		"identity",
		"session",
		"action",
		"artifact",
		"evidence_record"
	].includes(r) ? 6 : 7 : i === "host_service_topology" ? r === "host" || r === "fqdn" || r === "subnet" ? 0 : r === "port" || r === "service" ? 1 : r === "technology" || r === "cpe" ? 3 : r === "finding" || r === "cve" || r === "exploit_reference" ? 4 : 5 : i === "web_application_map" ? r === "host" || r === "fqdn" || r === "service" ? 0 : r === "technology" || r === "cpe" ? 2 : r === "finding" || r === "cve" || r === "exploit_reference" ? 3 : 4 : i === "credential_identity_session" ? r === "host" ? 0 : r === "credential" || r === "identity" || r === "session" ? 1 : r === "action" || r === "artifact" || r === "evidence_record" ? 2 : 3 : i === "exploitation_chain" ? r === "host" ? 0 : r === "finding" || r === "cve" || r === "exploit_reference" ? 1 : r === "credential" || r === "identity" || r === "session" ? 2 : 4 : Ea(r, n);
}
function Ma(e, t, n) {
	let r = Math.sqrt(Math.max(e, 1)) * (t >= 5e3 ? 1.08 : 1.16);
	return Math.max(1100, Math.min(t >= 5e3 ? 5600 : 4200, Math.round(r + n * 120)));
}
function Na(e, t, n, r, i) {
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
function Pa(e, t, n, r, i = {}) {
	let a = Array.isArray(e) ? e.length : 0, o = a >= 5e3 ? 10 : a >= 2500 ? 12 : 16, s = a >= 5e3 ? 8 : a >= 2500 ? 10 : 14, c = a >= 5e3 ? 20 : 26, l = a >= 5e3 ? 20 : 28, u = a >= 5e3 ? 14 : 18, d = a >= 5e3 ? 12 : 18, f = String(A.viewId || "attack_surface").trim(), p = new Map((e || []).map((e) => [String(e?.node_id || ""), e])), { neighborMap: m, degreeMap: h } = ka(t), g = Oa(n, r), _ = /* @__PURE__ */ new Map();
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
			let n = Ea(e?.type, r) - Ea(t?.type, r);
			if (n !== 0) return n;
			let i = Ta(e) - Ta(t);
			if (i !== 0) return i;
			let a = Number(h.get(String(t?.node_id || "")) || 0) - Number(h.get(String(e?.node_id || "")) || 0);
			if (a !== 0) return a;
			let o = Number((m.get(String(t?.node_id || "")) || /* @__PURE__ */ new Set()).size) - Number((m.get(String(e?.node_id || "")) || /* @__PURE__ */ new Set()).size);
			return o === 0 ? Da(e?.label || "", t?.label || "") : o;
		}), c = Math.min(...i.map((e) => Ea(e?.type, r)), 9), l = Math.min(...i.map((e) => Ta(e)), 99), p = i.filter((e) => [
			"finding",
			"cve",
			"exploit_reference"
		].includes(String(e?.type || "").trim().toLowerCase())).length, { columns: g, rows: _ } = Aa(i.length, a), v = Math.max(220, Math.round(u * 2 + g * N.width + Math.max(0, g - 1) * o)), b = Math.max(132, Math.round(58 + _ * N.height + Math.max(0, _ - 1) * s + d));
		return {
			key: n,
			label: n,
			nodes: i,
			nodeIds: i.map((e) => String(e?.node_id || "")).filter(Boolean),
			priority: c,
			severity: l,
			findings: p,
			degree: Number(y.get(n) || 0),
			lane: Math.min(...i.map((e) => ja(e?.type, f, r)), 99),
			columns: g,
			rows: _,
			width: v,
			height: b,
			area: v * b,
			x: 20,
			y: 20
		};
	});
	b.sort((e, t) => e.lane === t.lane ? e.priority === t.priority ? e.severity === t.severity ? e.findings === t.findings ? e.degree === t.degree ? e.area === t.area ? Da(e.key, t.key) : t.area - e.area : t.degree - e.degree : t.findings - e.findings : e.severity - t.severity : e.priority - t.priority : e.lane - t.lane);
	let x = Na(b, Ma(b.reduce((e, t) => e + Number(t.area || 0), 0), a, new Set(b.map((e) => Number(e?.lane ?? 0))).size || 1), c, l, 20), S = {};
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
	}), w = Math.max(Math.round(x.width || 1200), 1200), T = Math.max(Math.round(x.height || 760), 760);
	return Object.values(S).forEach((e) => {
		w = Math.max(w, (Number(e?.x) || 0) + N.width + 80), T = Math.max(T, (Number(e?.y) || 0) + N.height + 120);
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
function Fa(e) {
	if (!e || typeof e != "object") return [];
	let t = Array.isArray(G(e, "member_node_ids")) ? G(e, "member_node_ids") : [];
	if (t.length) return t.map((e) => String(e || "")).filter(Boolean);
	let n = String(e.node_id || "");
	return n ? [n] : [];
}
function Ia(e, t, n) {
	let r = String(n || A.renderMode || "auto").trim().toLowerCase();
	return r === "graph" ? !1 : r === "summary" || r === "matrix" || e >= 1e3 || t >= 3e3;
}
function La(e, t, n) {
	let r = String(n || A.renderMode || "auto").trim().toLowerCase();
	return r === "matrix" ? !0 : r === "graph" || r === "summary" ? !1 : e >= 1600 || t >= 4500;
}
function Ra(e) {
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
function za(e) {
	let t = "", n = Infinity;
	return (e || []).forEach((e) => {
		let r = String(G(e, "severity") || "").trim().toLowerCase();
		if (!r) return;
		let i = Object.prototype.hasOwnProperty.call(Te, r) ? Te[r] : 80;
		i < n && (n = i, t = r);
	}), t;
}
function Ba(e, t) {
	let n = String(e || "").trim().toLowerCase();
	return n === "scope" || n === "subnet" ? Infinity : n === "finding" || n === "cve" || n === "exploit_reference" ? t >= 5e3 ? 5 : 7 : n === "host" || n === "fqdn" ? t >= 5e3 ? 3 : 5 : n === "technology" || n === "cpe" ? t >= 5e3 ? 2 : 3 : t >= 5e3 ? 2 : 4;
}
function Va(e, t) {
	let n = String(e?.type || "").trim().toLowerCase(), r = String(e?.label || "").trim(), i = parseInt(G(e, "host_id"), 10), a = String(G(e, "hostname") || "").trim(), o = String(G(e, "ip") || "").trim(), s = String(G(e, "service") || G(e, "name") || r || "").trim().toLowerCase(), c = rn(r).toLowerCase();
	return n === "host" ? {
		type: n,
		bucket: en(o) || t.subnetByHostId.get(i) || nn(a) || "hosts"
	} : n === "fqdn" ? {
		type: n,
		bucket: nn(r || a) || t.domainByHostId.get(i) || "domains"
	} : n === "port" ? {
		type: n,
		bucket: `${G(e, "port") || r}/${G(e, "protocol") || "tcp"}`.replace(/\/$/, "")
	} : n === "service" ? {
		type: n,
		bucket: s || "service"
	} : n === "url" ? {
		type: n,
		bucket: c || nn(a) || "urls"
	} : n === "technology" || n === "cpe" || n === "credential" || n === "identity" || n === "session" ? {
		type: n,
		bucket: String(r || G(e, "name") || n).trim().toLowerCase() || n
	} : n === "finding" || n === "cve" || n === "exploit_reference" ? {
		type: n,
		bucket: String(r || G(e, "title") || G(e, "cve") || G(e, "severity") || n).trim().toLowerCase() || n
	} : {
		type: n,
		bucket: String(r || n).trim().toLowerCase() || n
	};
}
function Ha(e, t, n) {
	let r = Array.isArray(n) ? n.length : 0, i = $t(String(t || "").replace(/^.+?:/, "")) || $t(e) || "summary", a = r === 1 ? "" : "s";
	return e === "host" ? `${i} ${r} host${a}` : e === "fqdn" ? `${i} ${r} fqdn${a}` : e === "service" || e === "port" || e === "technology" || e === "cpe" ? `${i} ${r}` : e === "url" ? `${i} ${r} url${a}` : `${i} ${r}`;
}
function Ua(e, t, n, r) {
	let i = za(r), a = (r || []).map((e) => String(e?.label || "").trim()).filter(Boolean).slice(0, 3);
	return {
		node_id: e,
		type: n.type,
		label: Ha(n.type, n.bucket, r),
		confidence: Math.max(...(r || []).map((e) => Number(e?.confidence || 0) || 0), 0),
		source_kind: Ra(r),
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
function Wa(e, t, n, r) {
	let i = (e || []).slice().sort((e, t) => {
		let n = Number(G(e, "aggregate_count") || 1), r = Number(G(t, "aggregate_count") || 1);
		return n === r ? Da(e?.edge_id || "", t?.edge_id || "") : r - n;
	});
	if (r) return i;
	let a = /* @__PURE__ */ new Map(), o = [];
	return i.forEach((e) => {
		let r = String(e?.from_node_id || ""), i = String(e?.to_node_id || ""), s = Number(G(e, "aggregate_count") || 1), c = t.has(r), l = t.has(i);
		if (n && (r === n || i === n) || c || l || s >= 3) {
			o.push(e);
			return;
		}
		let u = Number(a.get(r) || 0), d = Number(a.get(i) || 0);
		u >= 6 && d >= 6 || (a.set(r, u + 1), a.set(i, d + 1), o.push(e));
	}), o;
}
function Ga(e, t, n, r) {
	let i = Array.isArray(e) ? e.length : 0, a = /* @__PURE__ */ new Map();
	(e || []).forEach((e) => {
		let t = Ca(e, r, n) || "other";
		a.has(t) || a.set(t, []), a.get(t).push(e);
	});
	let o = [], s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map();
	a.forEach((e, t) => {
		let r = /* @__PURE__ */ new Map();
		(e || []).forEach((e) => {
			let t = Va(e, n), i = `${t.type}|${t.bucket}`;
			r.has(i) || r.set(i, {
				descriptor: t,
				nodes: []
			}), r.get(i).nodes.push(e);
		}), s.set(t, /* @__PURE__ */ new Set()), r.forEach((e, n) => {
			let r = Ba(String(e.descriptor?.type || "").trim().toLowerCase(), i), a = `graph-summary-${tn(`${t}|${n}`)}`, d = !!A.expandedSummaryIds[a];
			if (e.nodes.length > r && !d) {
				let n = Ua(a, t, e.descriptor, e.nodes);
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
			edge_id: `graph-edge-summary-${tn(i)}`,
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
		a.members.push(e), a.properties.aggregate_count += Number(G(e, "aggregate_count") || 1), a.properties.edge_types.push(r), a.confidence = Math.max(Number(a.confidence || 0), Number(e?.confidence || 0) || 0), a.source_kind = Ra(a.members);
	});
	let f = String(A.selectedRef || ""), p = Array.isArray(A.focusSeedNodeIds) && A.focusSeedNodeIds.length > 0, m = Wa(Array.from(d.values()).map((e) => ({
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
function Ka(e, t, n, r) {
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
function qa(e, t, n) {
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
		let a = Number(G(e, "aggregate_count") || 1);
		i.set(t, Number(i.get(t) || 0) + a), i.set(n, Number(i.get(n) || 0) + a);
	});
	let a = (n || []).map((e) => ({
		key: String(e?.key || ""),
		label: String(e?.label || e?.key || ""),
		nodeCount: Array.isArray(e?.nodeIds) ? e.nodeIds.length : 0,
		activity: Number(i.get(String(e?.key || "")) || 0)
	})).sort((e, t) => e.activity === t.activity ? e.nodeCount === t.nodeCount ? Da(e.label, t.label) : t.nodeCount - e.nodeCount : t.activity - e.activity), o = a.slice(0, 24), s = new Set(o.map((e) => e.key)), c = a.length > o.length;
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
		let c = Number(G(e, "aggregate_count") || 1);
		u[i][a] += c, d = Math.max(d, u[i][a]);
	}), {
		groups: o,
		values: u,
		maxValue: d
	};
}
// ../app/web/static/js/workspace/graph_filters.js
function Ja() {
	A.viewId = String(z("graph-view-select") || A.viewId || "attack_surface").trim(), A.groupBy = String(z("graph-group-select") || A.groupBy || pn().defaultGroup || "subnet").trim(), A.renderMode = String(z("graph-render-mode-select") || A.renderMode || "auto").trim().toLowerCase(), A.focusDepth = Math.max(1, Math.min(3, parseInt(z("graph-focus-depth-select"), 10) || A.focusDepth || 1));
	let e = parseInt(z("graph-host-filter"), 10), t = Math.max(0, Math.min(100, parseInt(z("graph-min-confidence"), 10) || 0));
	return {
		viewId: A.viewId,
		groupBy: A.groupBy,
		renderMode: A.renderMode,
		focusDepth: A.focusDepth,
		hostId: Number.isFinite(e) && e > 0 ? e : 0,
		hostFilter: String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down",
		serviceFilters: Rn(),
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
function Ya(e) {
	let t = pn(), n = Ja(), r = n.sourceKind, i = n.nodeType, a = n.edgeType, o = n.severity, s = n.pack, c = sn(n.timeWindow), l = Array.isArray(e?.nodes) ? e.nodes.slice() : [], u = Array.isArray(e?.edges) ? e.edges.slice() : [];
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
		return t && n && ln(e, o) && un(e, s) && cn(e, c);
	}, h = (e) => {
		let t = !r || String(e?.source_kind || "").trim().toLowerCase() === r, n = !a || String(e?.type || "").trim().toLowerCase() === a;
		return t && n && ln(e, o) && un(e, s) && cn(e, c);
	}, g = new Set(f ? l.filter(m).map((e) => String(e?.node_id || "")) : l.map((e) => String(e?.node_id || ""))), _ = p ? u.filter(h) : u.slice();
	p && _.forEach((e) => {
		g.add(String(e?.from_node_id || "")), g.add(String(e?.to_node_id || ""));
	}), l = l.filter((e) => g.has(String(e?.node_id || ""))), d = new Set(l.map((e) => String(e?.node_id || ""))), u = _.filter((e) => d.has(String(e?.from_node_id || "")) && d.has(String(e?.to_node_id || "")));
	let v = l.length, y = u.length, b = Ka(l, u, A.focusSeedNodeIds, n.focusDepth);
	l = b.nodes, u = b.edges;
	let x = Sa(l), S = /* @__PURE__ */ new Map(), ee = Ia(l.length, u.length, n.renderMode), C = !1, w = /* @__PURE__ */ new Set();
	if (ee) {
		let e = Ga(l, u, x, n.groupBy || t.defaultGroup || "subnet");
		l = e.nodes, u = e.edges, S = e.groupsMap, C = !!e.usedSummary, w = e.summaryNodeIds || /* @__PURE__ */ new Set();
	} else l.sort(wa).forEach((e) => {
		let r = Ca(e, n.groupBy || t.defaultGroup || "subnet", x) || "other";
		S.has(r) || S.set(r, []), S.get(r).push(e);
	});
	let T = Pa(l, u, S, n.groupBy || t.defaultGroup || "subnet", A.positions), E = La(l.length, u.length, n.renderMode) && (T.groups || []).length > 2 ? "matrix" : "graph", te = E === "matrix" ? qa(l, u, T.groups || []) : null;
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
function Xa(e) {
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
function Za({ preserveDetail: e = !1 } = {}) {
	let t = document.getElementById("graph-workspace-canvas"), n = document.getElementById("graph-workspace-empty"), r = document.getElementById("graph-matrix-view");
	if (!t || !n || !r) return;
	let i = Ya(A.data);
	A.filtered = i;
	let a = i.nodes || [], o = i.edges || [], s = i.positions || {}, c = !1, l = A.selectedKind === "node" ? Gt() : Ft(A.selectedKind, A.selectedRef);
	if (A.selectedKind && !l && (A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.relatedContent = [], c = !0), F("graph-workspace-summary", `${a.length} visible nodes | ${o.length} visible edges | ${Number(i?.meta?.baseNodeCount || A.data?.meta?.total_nodes || a.length)} filtered nodes${i?.meta?.summaryUsed ? " | summary mode" : ""}${i?.renderKind === "matrix" ? " | matrix fallback" : ""}${i?.meta?.focusActive ? ` | focus ${i.meta.focusDepth} hop` : ""}`), !a.length) {
		r.hidden = !0, t.innerHTML = "", t.setAttribute("viewBox", "0 0 1600 900"), t.style.width = "100%", t.style.height = `${Math.max(520, Number(Ut()?.clientHeight || 680))}px`, A.viewport = null, t.hidden = !1, n.hidden = !1, ya(), ha();
		return;
	}
	if (n.hidden = !0, i.renderKind === "matrix") {
		t.hidden = !0, r.hidden = !1, Xa(i), e && !c && A.selectedKind || ya(), ha();
		return;
	}
	r.hidden = !0, r.innerHTML = "", t.hidden = !1, t.innerHTML = "";
	let u = Oi(), d = wn("defs");
	d.appendChild(wn("marker", {
		id: "graph-arrow",
		markerWidth: 8,
		markerHeight: 8,
		refX: 7,
		refY: 4,
		orient: "auto",
		markerUnits: "strokeWidth"
	}));
	let f = wn("path", {
		d: "M0,0 L8,4 L0,8 z",
		fill: "rgba(121, 133, 158, 0.65)"
	});
	d.firstChild.appendChild(f), d.appendChild(wn("marker", {
		id: "graph-arrow-highlight",
		markerWidth: 9,
		markerHeight: 9,
		refX: 8,
		refY: 4.5,
		orient: "auto",
		markerUnits: "strokeWidth"
	}));
	let p = wn("path", {
		d: "M0,0 L9,4.5 L0,9 z",
		fill: xe
	});
	d.lastChild.appendChild(p), t.appendChild(d), (i.groups || []).forEach((e) => {
		let n = wn("g", {
			class: "graph-group",
			"data-graph-group-key": e.key || ""
		});
		n.appendChild(wn("rect", {
			x: e.x,
			y: e.y,
			width: e.width,
			height: e.height,
			rx: 18,
			fill: bn() ? "#131313" : "rgba(19, 19, 19, 0.75)",
			stroke: "rgba(160, 160, 160, 0.16)",
			"data-graph-group-key": e.key || ""
		})), u && n.appendChild(wn("text", {
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
		].join(" "), f = String(e?.edge_id || ""), p = h && h === f, g = !(!m || String(e?.from_node_id || "") !== m && String(e?.to_node_id || "") !== m), _ = yn(e), v = Math.max(1, Number(G(e, "aggregate_count") || 1)), y = p ? 4.2 : g ? Math.min(6.8, 2.5 + Math.log2(v + 1)) : Math.min(4.2, 1.05 + Math.log2(v + 1) * .7), b = p ? 1 : g ? .98 : Math.max(.18, Math.min(.34, .16 + Math.log2(v + 1) * .045)), x = p ? "#eef1ff" : g ? xe : xn(e), S = p || g ? "url(#graph-arrow-highlight)" : "url(#graph-arrow)";
		t.appendChild(wn("path", {
			d,
			stroke: "transparent",
			fill: "none",
			"stroke-width": 12,
			"data-graph-edge-id": e.edge_id || "",
			class: "graph-edge-hitbox"
		})), t.appendChild(wn("path", {
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
		yn(e);
		let i = vn(e), a = A.selectedKind === "node" && String(A.selectedRef || "") === n, o = Si(e), c = !!G(e, "summary_kind"), l = Ai({
			isSelected: a,
			isHostSelected: o,
			isSummaryNode: c
		}), u = ki({
			isSelected: a,
			isHostSelected: o,
			isSummaryNode: c
		}), d = wn("g", {
			transform: `translate(${r.x}, ${r.y})`,
			"data-graph-node-id": n,
			class: `graph-node${a ? " is-selected" : ""}${o ? " is-host-selected" : ""}${c ? " is-summary" : ""}`
		});
		if (d.appendChild(wn("rect", {
			width: N.width,
			height: N.height,
			rx: 14,
			fill: Sn(e),
			stroke: a ? "#eef1ff" : i,
			"stroke-width": a ? 2.8 : 1.8,
			"data-graph-node-id": n
		})), d.appendChild(wn("rect", {
			x: 10,
			y: 9,
			width: 8,
			height: N.height - 18,
			rx: 4,
			fill: i,
			opacity: .9,
			"data-graph-node-id": n
		})), l && d.appendChild(wn("text", {
			x: 28,
			y: 18,
			class: "graph-node-type",
			"data-graph-node-id": n
		}, $t(e.type || ""))), u) {
			let t = wn("text", {
				x: 28,
				y: l ? 34 : 30,
				class: "graph-node-label",
				"data-graph-node-id": n
			});
			Cn(e.label || n).forEach((e, r) => {
				let i = wn("tspan", {
					x: 28,
					dy: r === 0 ? 0 : 14,
					"data-graph-node-id": n
				}, e);
				t.appendChild(i);
			}), d.appendChild(t);
		}
		A.pinnedNodeIds[n] && d.appendChild(wn("circle", {
			cx: N.width - 16,
			cy: 14,
			r: 5,
			fill: "#eef1ff",
			opacity: .9,
			"data-graph-node-id": n
		})), c && d.appendChild(wn("circle", {
			cx: N.width - 16,
			cy: N.height - 14,
			r: 7,
			fill: i,
			opacity: .95,
			"data-graph-node-id": n
		})), t.appendChild(d);
	}), Di(i.width, i.height), e && !c && A.selectedKind || ya(), ha();
}
// ../app/web/static/js/workspace/graph_data.js
function Qa(e, t) {
	let n = Ft(e === "node" ? "node" : "edge", t), r = e === "node" ? xi(n) : 0;
	if (r > 0) {
		let e = String(k.selectedHostId || "") !== String(r);
		k.selectedHostId = r, (e || !k.hostDetail) && (k.hostDetail = null, vr(r).catch((e) => {
			V(`Load host detail failed: ${e.message}`, !0);
		}));
	}
	A.selectedKind = String(e || ""), A.selectedRef = String(t || ""), A.selectedPayload = null, A.relatedContent = [], Za(), xa().catch(() => {});
}
async function $a({ force: e = !1 } = {}) {
	if (!zt()) return;
	if (A.metadataLoaded && !e) {
		hn();
		return;
	}
	let [t, n] = await Promise.all([Xe("/api/graph/layouts"), Xe("/api/graph/annotations")]);
	A.layouts = Array.isArray(t?.layouts) ? t.layouts : [], A.annotations = Array.isArray(n?.annotations) ? n.annotations : [], A.metadataLoaded = !0;
	let r = String(z("graph-view-select") || A.viewId || "attack_surface").trim();
	if (!A.activeLayoutId) {
		let e = A.layouts.find((e) => String(e?.view_id || "") === r && String(e?.name || "").trim().toLowerCase() === "default") || A.layouts.find((e) => String(e?.view_id || "") === r);
		A.activeLayoutId = String(e?.layout_id || ""), e?.layout?.positions && typeof e.layout.positions == "object" && (A.positions = { ...e.layout.positions }), e?.layout?.pinned_node_ids && typeof e.layout.pinned_node_ids == "object" && (A.pinnedNodeIds = { ...e.layout.pinned_node_ids });
	}
	hn();
}
async function eo({ background: e = !1, forceMetadata: t = !1 } = {}) {
	if (zt()) {
		if (A.loading) A.needsRefresh = !0;
		else {
			A.loading = !0, e || W("Loading graph...");
			try {
				(!A.metadataLoaded || t) && await $a({ force: t });
				let n = Ja(), r = new URLSearchParams();
				r.set("filter", String(n.hostFilter || "hide_down")), (Array.isArray(n.serviceFilters) ? n.serviceFilters : []).forEach((e) => {
					r.append("service", e);
				}), n.category && r.set("category", n.category), n.hostId > 0 && r.set("host_id", String(n.hostId)), n.nodeType && r.set("node_type", n.nodeType), n.edgeType && r.set("edge_type", n.edgeType), n.sourceKind && r.set("source_kind", n.sourceKind), n.search && r.set("q", n.search), n.minConfidence > 0 && r.set("min_confidence", String(n.minConfidence)), n.hideAiSuggested && r.set("hide_ai_suggested", "true"), n.hideNmapXmlArtifacts && r.set("hide_nmap_xml_artifacts", "true"), r.set("limit_nodes", "8000"), r.set("limit_edges", "24000");
				let i = await Xe(`/api/graph?${r.toString()}`);
				A.data = {
					nodes: Array.isArray(i?.nodes) ? i.nodes : [],
					edges: Array.isArray(i?.edges) ? i.edges : [],
					meta: i?.meta || {}
				}, _n(), hn(), Za({ preserveDetail: e && !!A.selectedKind }), A.selectedKind !== "node" || !A.selectedRef || e && Array.isArray(A.relatedContent) && A.relatedContent.length || xa().catch(() => {}), e || W(`Graph loaded: ${A.filtered.nodes.length} nodes, ${A.filtered.edges.length} edges`);
			} catch (e) {
				W(`Graph load failed: ${e.message}`, !0);
			} finally {
				A.loading = !1, A.needsRefresh && (A.needsRefresh = !1, eo({ background: !0 }).catch(() => {}));
			}
		}
	}
}
function to(e = 900) {
	zt() && (A.refreshTimer && window.clearTimeout(A.refreshTimer), A.refreshTimer = window.setTimeout(() => {
		A.refreshTimer = null, eo({ background: !0 }).catch(() => {});
	}, Math.max(100, Number(e) || 900)));
}
async function no() {
	await eo({ background: !1 });
}
async function ro() {
	let e = parseInt(z("graph-host-filter"), 10);
	W("Rebuilding graph...");
	try {
		let t = await Ye("/api/graph/rebuild", { host_id: Number.isFinite(e) && e > 0 ? e : 0 });
		W(`Graph rebuilt: ${Number(t?.mutation_count || 0)} mutations`), await eo({
			background: !1,
			forceMetadata: !0
		});
	} catch (e) {
		W(`Graph rebuild failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/workspace_view.js
function io({ resetForms: e = !0 } = {}) {
	k.hostDetail = null, F("host-detail-name", ""), I("workspace-note", ""), I("workspace-tool-host-ip", ""), e && (I("workspace-tool-port", ""), I("workspace-tool-protocol", "tcp"), I("workspace-script-id", ""), I("workspace-script-port", ""), I("workspace-script-protocol", "tcp"), I("workspace-script-output", ""), I("workspace-cve-name", ""), I("workspace-cve-severity", "")), F("host-ai-analysis-status", ""), F("host-ai-tech-count", 0), F("host-ai-manual-count", 0);
}
function ao({ clearProjectPaths: e = !1 } = {}) {
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
	}, A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, A.selectedKind = "", A.selectedRef = "", A.selectedPayload = null, A.metadataLoaded = !1, A.layouts = [], A.annotations = [], St({
		hosts: 0,
		open_ports: 0,
		services: 0,
		cves: 0,
		running_processes: 0,
		finished_processes: 0
	}), wt([]), co([]), uo([]), _o([]), ct([]), Tt([]), Et([]), Ot([]), io({ resetForms: !0 }), mt(!0), ht(!0), ai(!0), gn(), hn(), Za(), e && (I("project-open-path", ""), I("project-save-path", ""));
}
function oo(e) {
	let t = document.getElementById("workspace-host-select");
	if (!t) return;
	let n = k.selectedHostId;
	t.innerHTML = "", e.forEach((e) => {
		let n = document.createElement("option");
		n.value = String(e.id), n.textContent = `${e.ip || ""} ${e.hostname ? `(${e.hostname})` : ""}`.trim(), t.appendChild(n);
	}), e.length ? (k.selectedHostId = e.some((e) => String(e.id) === String(n)) ? n : e[0].id, t.value = String(k.selectedHostId)) : (k.selectedHostId = null, io({ resetForms: !0 }));
}
async function so(e, { loadDetail: t = !0, syncGraph: n = !0, preserveGraphDetail: r = !0 } = {}) {
	let i = parseInt(e, 10);
	if (!Number.isFinite(i) || i <= 0) {
		k.selectedHostId = null, k.hostDetail = null;
		let e = Dn(0);
		io({ resetForms: !0 }), e && await gr();
		return;
	}
	let a = String(k.selectedHostId || "") !== String(i);
	k.selectedHostId = i;
	let o = Dn(i), s = [];
	o && (Yn(), co(k.hosts), s.push(gr())), t && (a || !k.hostDetail) && (k.hostDetail = null, s.push(vr(i)));
	try {
		await Promise.all(s);
	} catch (e) {
		V(`Load host detail failed: ${e.message}`, !0);
	}
}
function co(e) {
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
			t.stopPropagation(), await tr(e.id || 0, a);
		}), r.appendChild(i), n.appendChild(r);
		let c = document.createElement("td"), l = document.createElement("span"), u = document.createElement("i"), d = go(e.os || "");
		u.className = `${d.className} host-os-icon`, u.setAttribute("aria-hidden", "true");
		let f = String(e.raw_os || "").trim(), p = String(e.os || "").trim();
		u.title = f && p && f !== p ? `${d.label}; imported OS: ${f}` : d.label, l.className = "host-ip-with-icon", l.appendChild(u), l.appendChild(document.createTextNode(e.ip || "")), c.appendChild(l), n.appendChild(c), n.appendChild(Le(e.hostname)), n.appendChild(Le(e.status));
		let m = Le(e.os);
		f && p && f !== p && (m.title = `Resolved from stronger service evidence. Imported OS: ${f}`), n.appendChild(m), n.appendChild(Vn(e.categories || [])), n.appendChild(Le(e.open_ports));
		let h = document.createElement("td");
		h.className = "host-actions";
		let g = Ni(`Run supported tool for ${a}`);
		g.addEventListener("click", async (t) => {
			t.stopPropagation(), await aa({
				hostId: Number(e.id) || 0,
				contextLabel: `Supported tools for ${a}`
			});
		}), h.appendChild(g), n.appendChild(h), t.appendChild(n);
	}), F("host-count", k.hosts.length), oo(k.hosts), Un(), Gn(), gn());
}
function lo(e, t) {
	let n = Ln(t);
	if (!n.length) return !0;
	let r = new Set(n.map((e) => e.toLowerCase()));
	return Array.isArray(e?.services) && e.services.some((e) => r.has(String(e || "").trim().toLowerCase()));
}
function uo(e) {
	k.services = Array.isArray(e) ? e : [];
	let t = document.getElementById("services-body");
	if (!t) return;
	t.innerHTML = "", k.services.forEach((e) => {
		let n = document.createElement("tr"), r = document.createElement("td"), i = document.createElement("button");
		i.type = "button", i.className = "icon-btn", i.title = `Show hosts for ${e.service || "service"}`, i.setAttribute("aria-label", `Show hosts for ${e.service || "service"}`), i.innerHTML = "<i class=\"fa-solid fa-filter\" aria-hidden=\"true\"></i>", Rn().map((e) => e.toLowerCase()).includes(String(e.service || "").trim().toLowerCase()) && i.classList.add("is-active"), i.addEventListener("click", async () => {
			await Qn(e.service || "");
		}), r.className = "service-filter-cell", r.appendChild(i), n.appendChild(r), n.appendChild(Le(e.service || "")), n.appendChild(Le(Array.isArray(e.ports) ? e.ports.join(", ") : "")), n.appendChild(Le(e.host_count || 0)), n.appendChild(Le(e.port_count || 0)), n.appendChild(Le(Array.isArray(e.protocols) ? e.protocols.join(",") : "")), n.appendChild(Vn(e.categories || []));
		let a = document.createElement("td"), o = Ni(`Run supported tool for ${e.service || "service"}`);
		o.addEventListener("click", async () => {
			await aa({
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
	Gn();
}
function fo(e) {
	let t = document.getElementById("services-panel-body"), n = document.getElementById("services-panel-toggle-button");
	if (!t || !n) return;
	let r = !!e;
	t.hidden = r, n.classList.toggle("is-collapsed", r), n.setAttribute("aria-expanded", r ? "false" : "true"), n.title = r ? "Show Services" : "Hide Services", n.setAttribute("aria-label", r ? "Show Services" : "Hide Services");
}
function po() {
	let e = document.getElementById("services-panel-body");
	e && fo(!e.hidden);
}
function mo(e) {
	let t = document.getElementById("graph-panel-body"), n = document.getElementById("graph-panel-toggle-button");
	if (!t || !n) return;
	let r = !!e;
	t.hidden = r, n.classList.toggle("is-collapsed", r), n.setAttribute("aria-expanded", r ? "false" : "true"), n.title = r ? "Show Graph Workspace" : "Hide Graph Workspace", n.setAttribute("aria-label", r ? "Show Graph Workspace" : "Hide Graph Workspace");
}
function ho() {
	let e = document.getElementById("graph-panel-body");
	e && mo(!e.hidden);
}
function go(e) {
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
function _o(e) {
	k.tools = Array.isArray(e) ? e : [];
	let t = document.getElementById("tools-body");
	t && (t.innerHTML = "", k.tools.forEach((e) => {
		let n = document.createElement("tr");
		n.dataset.toolId = String(e.tool_id || ""), n.appendChild(Le(e.label || "")), n.appendChild(Le(e.tool_id || "")), n.appendChild(Le(e.run_count || 0)), n.appendChild(Le(e.last_status || "")), n.appendChild(Le(Array.isArray(e.danger_categories) ? e.danger_categories.join(",") : "")), t.appendChild(n);
	})), k.manualToolTargets.length || q(k.tools), F("tool-count", k.tools.length);
}
// ../app/web/static/js/workspace/live_updates.js
function vo(e) {
	if (e) {
		if (e.project && ze(e.project), e.summary && St(e.summary), Yn(), Array.isArray(e.hosts)) {
			let t = String(k.hostFilter || "hide_down").trim().toLowerCase() === "show_all" ? "show_all" : "hide_down", n = Rn();
			t !== "show_all" && co(n.length ? e.hosts.filter((e) => lo(e, n)) : e.hosts);
		}
		if (Array.isArray(e.services) && (parseInt(k.servicesHostFilterId, 10) > 0 || uo(e.services)), Array.isArray(e.tools) && !k.toolsHydrated && _o(e.tools), e.tools_meta && typeof e.tools_meta == "object") {
			let t = Number(e.tools_meta.total || 0);
			Number.isFinite(t) && t >= 0 && (F("tool-count", t), k.toolsHydrated && !k.toolsLoading && t !== k.tools.length && _r().catch(() => {}));
		}
		if (Array.isArray(e.processes) && ct(e.processes), e.credential_capture && e.credential_capture, e.scheduler) {
			let t = e.scheduler.engagement_policy || {};
			F("scheduler-mode", e.scheduler.mode || ""), F("scheduler-goal", t.preset_label || t.preset || e.scheduler.goal_profile || ""), F("scheduler-families", e.scheduler.preapproved_families_count || 0);
		}
		Array.isArray(e.scheduler_rationale_feed) && wt(e.scheduler_rationale_feed), Array.isArray(e.scheduler_decisions) && Tt(e.scheduler_decisions), Array.isArray(e.scheduler_approvals) && Et(e.scheduler_approvals), Array.isArray(e.jobs) && Ot(e.jobs), Array.isArray(e.scan_history) && Dt(e.scan_history), k.selectedHostId && !k.hostDetail && vr(k.selectedHostId).catch(() => {}), to();
	}
}
function yo(e) {
	return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${e}`;
}
function bo(e, t) {
	let n = document.getElementById("live-status");
	n && (n.textContent = e, n.style.color = t ? "#ff9b9b" : "");
}
async function xo(e) {
	let t = new Set((e || []).map((e) => String(e || "").trim()).filter(Boolean));
	if (!t.size) return;
	let n = [], r = t.has("hosts"), i = t.has("services"), a = k.selectedHostId && (r || i || t.has("graph"));
	t.has("overview") && n.push(kt()), r ? (n.push(hr()), parseInt(k.servicesHostFilterId, 10) > 0 && !i && n.push(gr())) : i && n.push(gr()), t.has("processes") && n.push(At()), t.has("jobs") && n.push(Nt()), t.has("approvals") && n.push(Pt()), t.has("decisions") && n.push(jt()), t.has("scan_history") && n.push(Mt()), t.has("tools") && k.toolsHydrated && n.push(_r({ force: !0 })), t.has("graph") && n.push(eo({ background: !0 })), a && n.push(vr(k.selectedHostId)), n.length && await Promise.all(n.map((e) => Promise.resolve(e).catch(() => {})));
}
function So(e) {
	(e || []).forEach((e) => {
		let t = String(e || "").trim();
		t && ve.pendingChannels.add(t);
	}), ve.timer || ve.running || (ve.timer = window.setTimeout(async () => {
		if (ve.timer = null, !ve.running) {
			ve.running = !0;
			try {
				for (; ve.pendingChannels.size;) {
					let e = Array.from(ve.pendingChannels);
					ve.pendingChannels.clear(), await xo(e);
				}
			} finally {
				ve.running = !1;
			}
		}
	}, 60));
}
function Co() {
	let e = new WebSocket(yo("/ws/snapshot"));
	e.onopen = () => bo("Live", !1), e.onmessage = (e) => {
		try {
			let t = JSON.parse(e.data);
			if (t && t.type === "invalidate") {
				ar(t.channels || []), So(t.channels || []);
				return;
			}
			if (t && t.type === "heartbeat") return;
			vo(t);
		} catch {
			bo("Decode Error", !0);
		}
	}, e.onerror = () => bo("Socket Error", !0), e.onclose = () => {
		bo("Reconnecting", !0), window.setTimeout(Co, 1500);
	};
}
async function wo() {
	try {
		let e = await fetch("/api/snapshot", { cache: "no-store" });
		if (!e.ok) {
			bo("Polling Error", !0);
			return;
		}
		vo(await e.json());
	} catch {
		bo("Polling Error", !0);
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
	return /* @__PURE__ */ (0, H.jsx)("button", {
		id: e,
		type: "button",
		className: `${a}${i ? " icon-btn-danger" : ""}`,
		title: t,
		"aria-label": t,
		disabled: r,
		onClick: o,
		children: /* @__PURE__ */ (0, H.jsx)("i", {
			className: n,
			"aria-hidden": "true"
		})
	});
}
function Xo({ error: e, loading: t, empty: n, columns: r }) {
	let i = e || (t ? "Loading..." : n ? "No entries yet." : "");
	return i ? /* @__PURE__ */ (0, H.jsx)("tr", {
		role: e ? "alert" : "status",
		children: /* @__PURE__ */ (0, H.jsx)("td", {
			colSpan: r,
			children: i
		})
	}) : null;
}
function Zo({ id: e, text: t }) {
	let n = (0, C.useRef)(null), r = (0, C.useRef)(!0);
	return (0, C.useLayoutEffect)(() => {
		r.current && n.current && (n.current.scrollTop = n.current.scrollHeight);
	}, [t]), /* @__PURE__ */ (0, H.jsx)("div", {
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
function Qo({ controller: e }) {
	let t = (0, C.useSyncExternalStore)(Ro.subscribe, Ro.getSnapshot), n = (0, C.useSyncExternalStore)(Wo.subscribe, Wo.getSnapshot);
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(Xo, {
		...t,
		empty: !t.items.length,
		columns: 7
	}), t.items.map((t) => {
		let r = ot(t.status), i = n.has(`process:${t.id}`) || n.has("process:clear"), a = nt(t.hostIp, t.port, t.protocol), o = Number(String(t.percent ?? "").replace("%", "").trim()), s = t.percent == null || t.percent === "" ? "" : Number.isFinite(o) ? `${o.toFixed(1)}%` : t.percent;
		return /* @__PURE__ */ (0, H.jsxs)("tr", {
			"data-process-id": t.id,
			children: [
				/* @__PURE__ */ (0, H.jsx)("td", { children: t.id }),
				/* @__PURE__ */ (0, H.jsx)("td", {
					className: "process-name-cell",
					title: t.name || "",
					children: /* @__PURE__ */ (0, H.jsx)("span", {
						className: "cell-truncate",
						children: t.name
					})
				}),
				/* @__PURE__ */ (0, H.jsx)("td", {
					className: "process-target-cell",
					title: a,
					children: /* @__PURE__ */ (0, H.jsx)("span", {
						className: "cell-truncate",
						children: a
					})
				}),
				/* @__PURE__ */ (0, H.jsx)("td", {
					className: "process-status-cell",
					children: /* @__PURE__ */ (0, H.jsxs)("span", {
						className: `process-status ${st(t.status)}`,
						children: [r && /* @__PURE__ */ (0, H.jsx)("span", {
							className: "process-spinner",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, H.jsx)("span", { children: t.status })]
					})
				}),
				/* @__PURE__ */ (0, H.jsx)("td", {
					className: "process-percent-cell",
					children: s
				}),
				/* @__PURE__ */ (0, H.jsx)("td", {
					className: "process-eta-cell",
					children: at(t.estimatedRemaining)
				}),
				/* @__PURE__ */ (0, H.jsxs)("td", {
					className: "process-actions",
					children: [/* @__PURE__ */ (0, H.jsx)("button", {
						type: "button",
						className: "icon-btn",
						"aria-label": "Output",
						title: "Output",
						"data-process-action": "output",
						"data-process-id": t.id,
						onClick: () => {
							e.actions.openOutput(t.id);
						},
						children: /* @__PURE__ */ (0, H.jsx)("i", {
							className: "fa-solid fa-terminal",
							"aria-hidden": "true"
						})
					}), [
						"retry",
						...r ? ["kill"] : [],
						"close"
					].map((n) => /* @__PURE__ */ (0, H.jsx)("button", {
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
						children: /* @__PURE__ */ (0, H.jsx)("i", {
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
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(Yo, {
		id: "process-clear-finished-button",
		label: "Hide Finished/Issues",
		icon: "fa-solid fa-broom",
		disabled: t,
		onClick: () => {
			e.clearProcesses(!1);
		}
	}), /* @__PURE__ */ (0, H.jsx)(Yo, {
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
	return t?.trim() ? /* @__PURE__ */ (0, H.jsxs)("div", { children: [
		e,
		": ",
		t
	] }) : null;
}
function ts({ controller: e }) {
	let t = (0, C.useSyncExternalStore)(zo.subscribe, zo.getSnapshot), n = (0, C.useSyncExternalStore)(Wo.subscribe, Wo.getSnapshot);
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(Xo, {
		...t,
		empty: !t.items.length,
		columns: 6
	}), t.items.map((t) => /* @__PURE__ */ (0, H.jsxs)("tr", {
		"data-approval-id": t.id,
		children: [
			/* @__PURE__ */ (0, H.jsx)("td", { children: t.id }),
			/* @__PURE__ */ (0, H.jsx)("td", { children: nt(t.host_ip, t.port, t.protocol) }),
			/* @__PURE__ */ (0, H.jsxs)("td", { children: [
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "tool",
					value: t.label || t.tool_id
				}),
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "id",
					value: t.tool_id
				}),
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "command",
					value: t.command_template
				}),
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "status",
					value: t.status
				})
			] }),
			/* @__PURE__ */ (0, H.jsxs)("td", { children: [
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "risk tags",
					value: t.risk_tags || t.danger_categories
				}),
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "decision",
					value: t.policy_decision
				}),
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "why risky",
					value: t.risk_summary
				}),
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "policy",
					value: t.policy_reason
				}),
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "safer alternative",
					value: t.safer_alternative
				}),
				/* @__PURE__ */ (0, H.jsx)(es, {
					label: "family policy",
					value: t.family_policy_state
				})
			] }),
			/* @__PURE__ */ (0, H.jsxs)("td", { children: [/* @__PURE__ */ (0, H.jsx)(es, {
				label: "planner rationale",
				value: t.rationale
			}), /* @__PURE__ */ (0, H.jsx)(es, {
				label: "evidence",
				value: t.evidence_refs
			})] }),
			/* @__PURE__ */ (0, H.jsx)("td", {
				className: "approval-action-buttons",
				children: [
					"approve",
					"reject",
					"allow-family",
					"suppress-family"
				].map((r) => /* @__PURE__ */ (0, H.jsx)("button", {
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
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(Xo, {
		...e,
		empty: !e.items.length,
		columns: 8
	}), e.items.map((e) => /* @__PURE__ */ (0, H.jsxs)("tr", { children: [
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.timestamp }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: nt(e.host_ip, e.port, e.protocol) }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.tool_id || e.label }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.scheduler_mode }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: String(e.approved ?? "") }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: String(e.executed ?? "") }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.reason }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.command_family_id })
	] }, e.id))] });
}
function rs() {
	let e = (0, C.useSyncExternalStore)(Vo.subscribe, Vo.getSnapshot);
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(Xo, {
		...e,
		empty: !e.items.length,
		columns: 8
	}), e.items.map((e) => /* @__PURE__ */ (0, H.jsxs)("tr", { children: [
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.id }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.submission_kind }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.status }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.target_summary }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.scope_summary }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.scan_mode }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.created_at }),
		/* @__PURE__ */ (0, H.jsx)("td", { children: e.result_summary })
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
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
		e.error && /* @__PURE__ */ (0, H.jsx)("p", {
			role: "alert",
			children: e.error
		}),
		!e.items.length && /* @__PURE__ */ (0, H.jsx)("p", {
			className: "meta-note rationale-empty",
			children: e.loading ? "Loading..." : "Scheduler rationale will appear here as tools are ranked, suppressed, and executed."
		}),
		e.items.map((e, t) => /* @__PURE__ */ (0, H.jsxs)("article", {
			className: "rationale-entry",
			children: [
				/* @__PURE__ */ (0, H.jsxs)("div", {
					className: "rationale-entry-top",
					children: [/* @__PURE__ */ (0, H.jsxs)("div", {
						className: "rationale-entry-heading",
						children: [/* @__PURE__ */ (0, H.jsx)("p", {
							className: "rationale-entry-prefix",
							children: nt(e.host_ip || "Project-wide", e.port, e.protocol)
						}), /* @__PURE__ */ (0, H.jsx)("strong", {
							className: "rationale-entry-title",
							children: e.headline || e.kind || "Decision"
						})]
					}), /* @__PURE__ */ (0, H.jsx)("span", {
						className: "rationale-entry-time",
						children: is(e.timestamp)
					})]
				}),
				!!e.tags?.length && /* @__PURE__ */ (0, H.jsx)("div", {
					className: "rationale-entry-tags",
					children: e.tags.filter(Boolean).map((e, t) => /* @__PURE__ */ (0, H.jsx)("span", {
						className: "chip rationale-chip",
						children: e
					}, t))
				}),
				/* @__PURE__ */ (0, H.jsx)("p", {
					className: "rationale-entry-summary",
					children: e.summary || "Scheduler decision recorded."
				}),
				!!e.details?.length && /* @__PURE__ */ (0, H.jsx)("div", {
					className: "rationale-entry-details",
					children: e.details.filter(Boolean).map((e, t) => /* @__PURE__ */ (0, H.jsx)("div", {
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
		V("No output to download", !0);
		return;
	}
	let n = URL.createObjectURL(new Blob([e], { type: "text/plain;charset=utf-8" })), r = document.createElement("a");
	r.href = n, r.download = t, document.body.appendChild(r), r.click(), r.remove(), URL.revokeObjectURL(n), V(`${t} downloaded`);
}
function ss({ controller: e }) {
	let t = (0, C.useSyncExternalStore)(e.output.store.subscribe, e.output.store.getSnapshot);
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
		/* @__PURE__ */ (0, H.jsxs)("div", {
			className: "panel-header modal-header",
			children: [
				/* @__PURE__ */ (0, H.jsx)("h2", {
					id: "process-output-modal-title",
					children: "Process Output"
				}),
				/* @__PURE__ */ (0, H.jsx)("p", {
					id: "process-output-meta",
					children: t.meta
				}),
				/* @__PURE__ */ (0, H.jsx)(Yo, {
					id: "process-output-modal-close",
					className: "modal-close-btn",
					label: "Close dialog",
					icon: "fa-solid fa-xmark",
					onClick: () => e.output.close()
				})
			]
		}),
		/* @__PURE__ */ (0, H.jsxs)("div", {
			className: "modal-actions modal-toolbar-actions",
			children: [
				/* @__PURE__ */ (0, H.jsx)(Yo, {
					id: "process-output-refresh-button",
					label: "Refresh",
					icon: "fa-solid fa-rotate-right",
					disabled: t.loading || !t.id,
					onClick: () => {
						e.output.refresh();
					}
				}),
				/* @__PURE__ */ (0, H.jsx)(Yo, {
					id: "process-output-copy-button",
					label: "Copy to Clipboard",
					icon: "fa-regular fa-copy",
					onClick: () => {
						bt(t.text, "Process output copied to clipboard", "No process output to copy");
					}
				}),
				/* @__PURE__ */ (0, H.jsx)(Yo, {
					id: "process-output-download-button",
					label: "Download .txt",
					icon: "fa-solid fa-download",
					onClick: () => os(t.text, `process-${t.id}-output.txt`)
				})
			]
		}),
		t.error && /* @__PURE__ */ (0, H.jsx)("p", {
			role: "alert",
			children: t.error
		}),
		/* @__PURE__ */ (0, H.jsxs)("div", {
			className: "process-command-block",
			children: [/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "process-command-header",
				children: [/* @__PURE__ */ (0, H.jsx)("span", { children: "Command" }), /* @__PURE__ */ (0, H.jsx)(Yo, {
					id: "process-output-command-copy",
					label: "Copy command",
					icon: "fa-regular fa-copy",
					onClick: () => {
						bt(t.command, "Command copied to clipboard", "No command to copy");
					}
				})]
			}), /* @__PURE__ */ (0, H.jsx)("div", {
				id: "process-output-command",
				className: "process-command-text",
				children: t.command
			})]
		}),
		/* @__PURE__ */ (0, H.jsxs)("div", {
			className: "process-command-block",
			children: [/* @__PURE__ */ (0, H.jsx)("div", {
				className: "process-command-header",
				children: /* @__PURE__ */ (0, H.jsx)("span", { children: "Progress" })
			}), /* @__PURE__ */ (0, H.jsx)("div", {
				id: "process-output-progress",
				className: "process-command-text",
				children: t.progress || "No structured progress reported"
			})]
		}),
		/* @__PURE__ */ (0, H.jsxs)("div", {
			className: "process-command-block process-output-block",
			children: [/* @__PURE__ */ (0, H.jsx)("div", {
				className: "process-command-header",
				children: /* @__PURE__ */ (0, H.jsx)("span", { children: "Output" })
			}), /* @__PURE__ */ (0, H.jsx)(Zo, {
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
		applyOverview: Ct,
		refreshSnapshot: wo,
		setOutputOpen: ft,
		status: V
	}), t = (e) => {
		let t = document.querySelector(e);
		if (!t) throw Error(`Activity mount point missing: ${e}`);
		return t.replaceChildren(), t.dataset.framework = "react", t;
	}, n = [
		{
			node: t("#processes-body"),
			content: /* @__PURE__ */ (0, H.jsx)(Qo, { controller: e })
		},
		{
			node: t(".ribbon-process-actions"),
			content: /* @__PURE__ */ (0, H.jsx)($o, { controller: e })
		},
		{
			node: t("#approvals-body"),
			content: /* @__PURE__ */ (0, H.jsx)(ts, { controller: e })
		},
		{
			node: t("#decisions-body"),
			content: /* @__PURE__ */ (0, H.jsx)(ns, {})
		},
		{
			node: t("#scan-history-body"),
			content: /* @__PURE__ */ (0, H.jsx)(rs, {})
		},
		{
			node: t("#decision-rationale-body"),
			content: /* @__PURE__ */ (0, H.jsx)(as, {})
		},
		{
			node: t("#process-output-modal > .legion-modal"),
			content: /* @__PURE__ */ (0, H.jsx)(ss, { controller: e })
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
	let i = Ke({
		update: Go,
		actions: e.actions
	}), a = (0, c.createRoot)(r);
	a.render(/* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [Object.keys(Uo).map((e) => /* @__PURE__ */ (0, H.jsx)(cs, { name: e }, e)), n.map(({ node: e, content: t }, n) => (0, w.createPortal)(t, e, String(n)))] })), window.addEventListener("pagehide", () => {
		i(), e.dispose(), a.unmount();
	}, { once: !0 });
}
// src/hub/api.ts
async function us(e) {
	return ps(await D.GET("/api/hub/projects/{identifier}/network", { params: { path: { identifier: e } } }));
}
async function ds(e, t, n) {
	return ps(await D.PUT("/api/hub/projects/{identifier}/network", {
		params: { path: { identifier: e } },
		body: {
			expected_revision: t,
			settings: n
		}
	}));
}
async function fs(e, t, n) {
	return ps(await D.POST("/api/hub/projects/{identifier}/network/check", {
		params: { path: { identifier: e } },
		body: {
			target: t,
			port: n
		}
	}));
}
function ps({ data: e, error: t, response: n }) {
	if (!e) throw fe(t, n.status);
	return e;
}
async function ms() {
	return ps(await D.GET("/api/hub/projects")).projects;
}
async function hs() {
	return ps(await D.GET("/api/hub/settings"));
}
async function gs(e) {
	return ps(await D.POST("/api/hub/settings/save-folder", { body: { path: e } }));
}
async function _s(e) {
	return ps(await D.POST("/api/hub/projects", { body: { name: e } }));
}
async function vs(e) {
	return ps(await D.POST("/api/hub/projects/{identifier}/open", { params: { path: { identifier: e } } }));
}
async function ys(e) {
	return ps(await D.GET("/api/hub/projects/{identifier}/files", { params: { path: { identifier: e } } }));
}
async function bs(e, t) {
	return ps(await D.POST("/api/hub/projects/{identifier}/connector", {
		params: { path: { identifier: e } },
		body: { selection: t }
	}));
}
async function xs(e) {
	return ps(await D.POST("/api/hub/connectors/install", { body: { connector: e } }));
}
async function Ss(e) {
	return ps(await D.GET("/api/jobs/{job_id}", { params: { path: { job_id: e } } }));
}
function Cs(e, t) {
	return `/api/hub/projects/${encodeURIComponent(e)}/file?${new URLSearchParams({ path: t })}`;
}
async function ws(e, t) {
	return ps(await D.POST("/api/hub/projects/{identifier}/rename", {
		params: { path: { identifier: e } },
		body: { name: t }
	}));
}
async function Ts(e) {
	return ps(await D.POST("/api/hub/projects/{identifier}/save", { params: { path: { identifier: e } } }));
}
async function Es(e, t) {
	return ps(await D.POST("/api/hub/projects/{identifier}/save-as", {
		params: { path: { identifier: e } },
		body: { name: t }
	}));
}
async function Ds(e) {
	return ps(await D.POST("/api/hub/open-path", { body: { path: e } }));
}
async function Os(e) {
	let t = await fetch("/api/hub/restore-zip", {
		method: "POST",
		headers: { "Content-Type": "application/zip" },
		body: e
	}), n = await t.json();
	if (!t.ok) throw fe(n, t.status);
	return n;
}
function ks(e) {
	return `/api/hub/projects/${encodeURIComponent(e)}/bundle`;
}
async function As() {
	return ps(await D.GET("/api/snapshot"));
}
async function js(e) {
	return ps(await D.GET("/api/hub/projects/{identifier}/background", { params: { path: { identifier: e } } }));
}
async function Ms(e, t) {
	return ps(await D.POST("/api/hub/projects/{identifier}/background/control", {
		params: { path: { identifier: e } },
		body: { running: t }
	}));
}
async function Ns(e, t) {
	return ps(await D.POST("/api/hub/projects/{identifier}/background/alerts/{alert_id}/dismiss", { params: { path: {
		identifier: e,
		alert_id: t
	} } }));
}
async function Ps(e, t) {
	return ps(await D.GET("/api/hub/projects/{identifier}/background/results/{alert_id}", { params: { path: {
		identifier: e,
		alert_id: t
	} } }));
}
function Fs(e, t) {
	return `/api/hub/projects/${encodeURIComponent(e)}/filesystem${t ? `?${new URLSearchParams({ result: t })}` : ""}`;
}
function Is(e, t) {
	return `/api/hub/projects/${encodeURIComponent(e)}/editor?${new URLSearchParams({ result: t })}`;
}
async function Ls(e) {
	return ps(await D.GET("/api/hub/projects/{identifier}/deep-scans", { params: {
		path: { identifier: e },
		query: { compact: !0 }
	} }));
}
async function Rs(e, t) {
	return ps(await D.POST("/api/hub/projects/{identifier}/deep-scans", {
		params: { path: { identifier: e } },
		body: t
	}));
}
async function zs(e) {
	return ps(await D.POST("/api/jobs/{job_id}/stop", { params: { path: { job_id: e } } }));
}
function Bs(e, t) {
	return `/api/hub/projects/${encodeURIComponent(e)}/editor?${new URLSearchParams({ path: t })}`;
}
async function Vs(e, t) {
	return ps(await D.GET("/api/hub/projects/{identifier}/deep-scans/{scan_id}", { params: { path: {
		identifier: e,
		scan_id: t
	} } }));
}
// src/hub/Icon.tsx
function Hs({ kind: e }) {
	return /* @__PURE__ */ (0, H.jsx)("svg", {
		width: "17",
		height: "17",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.4",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, H.jsx)("path", { d: {
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
function Us() {
	let [e, t] = (0, C.useState)(() => window.legionDesktop);
	return (0, C.useEffect)(() => {
		let e = () => t(window.legionDesktop ? { ...window.legionDesktop } : void 0);
		return window.addEventListener("legion-desktop-changed", e), e(), () => window.removeEventListener("legion-desktop-changed", e);
	}, []), e;
}
// src/hub/WindowControls.tsx
function Ws({ desktop: e }) {
	return /* @__PURE__ */ (0, H.jsxs)("div", {
		className: "hub-window-controls",
		"aria-label": "Window controls",
		children: [
			/* @__PURE__ */ (0, H.jsx)("button", {
				"aria-label": "Minimise window",
				title: "Minimise",
				onClick: () => e.minimize(),
				children: /* @__PURE__ */ (0, H.jsx)("svg", {
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, H.jsx)("path", { d: "M4 8h8" })
				})
			}),
			/* @__PURE__ */ (0, H.jsx)("button", {
				"aria-label": e.maximized ? "Restore window" : "Maximise window",
				title: e.maximized ? "Restore" : "Maximise",
				onClick: () => e.toggleMaximize(),
				children: /* @__PURE__ */ (0, H.jsx)("svg", {
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, H.jsx)("path", { d: e.maximized ? "M5 3h8v8M3 5h8v8H3Z" : "M4 4h8v8H4Z" })
				})
			}),
			/* @__PURE__ */ (0, H.jsx)("button", {
				"aria-label": "Close window",
				title: "Close",
				onClick: () => e.close(),
				children: /* @__PURE__ */ (0, H.jsx)("svg", {
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, H.jsx)("path", { d: "m5 5 6 6m0-6-6 6" })
				})
			})
		]
	});
}
// src/hub/ProjectLabel.tsx
function Gs({ name: e, onRename: t, request: n = 0, doubleClick: r = !1 }) {
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
	return /* @__PURE__ */ (0, H.jsxs)("span", {
		className: "hub-project-label",
		children: [i ? /* @__PURE__ */ (0, H.jsx)("input", {
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
		}) : /* @__PURE__ */ (0, H.jsx)("button", {
			className: "hub-name",
			"aria-label": `Rename ${e}`,
			title: r ? "Double-click to rename" : "Rename project",
			onClick: r ? void 0 : m,
			onDoubleClick: r ? m : void 0,
			children: e
		}), c && /* @__PURE__ */ (0, H.jsx)("span", {
			className: "hub-inline-error",
			role: "alert",
			children: c
		})]
	});
}
// src/hub/parts.tsx
var Ks = {
	"app-settings": "Application settings",
	"interface-settings": "Interface settings",
	"scheduler-settings": "Scheduler settings",
	"device-category-settings": "Device categories"
}, qs = {
	hosts: "Hosts",
	services: "Services",
	graph: "Graph",
	activity: "Activity",
	approvals: "Approvals"
}, Js = {
	scan: "New scan",
	tool: "Run a tool",
	import: "Import results"
}, Ys = {
	...qs,
	...Ks,
	...Js
};
function Xs({ part: e, host: t, close: n, displayChanged: r, statusChanged: i }) {
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
	]), /* @__PURE__ */ (0, H.jsxs)("section", {
		className: "hub-reused-panel",
		"aria-label": Ys[e],
		children: [!Ks[e] && e !== "scan" && e !== "tool" && /* @__PURE__ */ (0, H.jsx)("button", {
			className: "hub-part-close",
			"aria-label": `Close ${Ys[e]}`,
			onClick: n,
			children: "×"
		}), /* @__PURE__ */ (0, H.jsx)("iframe", {
			ref: a,
			title: Ys[e],
			src: `/?part=${encodeURIComponent(e)}${t ? `&host=${t}` : ""}`
		})]
	});
}
// src/hub/ConnectorInstall.tsx
var Zs = {
	openvpn: "OpenVPN",
	wireguard: "WireGuard"
};
function Qs() {
	let [e, t] = (0, C.useState)(null), [n, r] = (0, C.useState)(null), [i, a] = (0, C.useState)(""), [o, s] = (0, C.useState)("");
	(0, C.useEffect)(() => {
		if (n === null) return;
		let i = !0, o;
		async function c() {
			try {
				let o = await Ss(n);
				if (!i) return;
				if (s(""), o.status === "queued" || o.status === "running") a(`${Zs[e]} installation ${o.status} (job #${o.id}).`);
				else {
					a(o.status === "completed" ? String(o.result?.message || "Installation completed.") : ""), o.status !== "completed" && s(o.error || `Installation ${o.status}.`), t(null), r(null);
					return;
				}
			} catch (e) {
				if (!i) return;
				s(`Could not check installation: ${e.message}. Retrying…`);
			}
			o = setTimeout(() => {
				c();
			}, 2e3);
		}
		return c(), () => {
			i = !1, clearTimeout(o);
		};
	}, [n, e]);
	async function c(e) {
		t(e), s(""), a(`Queueing ${Zs[e]} installation…`);
		try {
			let t = await xs(e);
			r(t.job.id), a(`${Zs[e]} installation queued (job #${t.job.id}).`);
		} catch (e) {
			t(null), a(""), s(e.message);
		}
	}
	return /* @__PURE__ */ (0, H.jsxs)("div", {
		className: "hub-connector-install",
		children: [
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-connector-install-buttons",
				children: [/* @__PURE__ */ (0, H.jsx)("button", {
					disabled: e !== null,
					onClick: () => {
						c("openvpn");
					},
					children: "Install OpenVPN"
				}), /* @__PURE__ */ (0, H.jsx)("button", {
					disabled: e !== null,
					onClick: () => {
						c("wireguard");
					},
					children: "Install WireGuard"
				})]
			}),
			i && /* @__PURE__ */ (0, H.jsx)("p", {
				role: "status",
				className: "hub-muted",
				children: i
			}),
			o && /* @__PURE__ */ (0, H.jsx)("p", {
				role: "alert",
				className: "hub-error",
				children: o
			})
		]
	});
}
// src/hub/NetworkSettings.tsx
var $s = (e) => e.split(/[\s,]+/).filter(Boolean), ec = (e) => e instanceof Error ? e.message : String(e);
function tc(e) {
	let t = e.settings;
	return {
		name: t.name || "",
		source: t.scope_source || "",
		targets: (t.allowed_targets || []).join("\n"),
		exclusions: (t.exclusions || []).join("\n"),
		ports: (t.allowed_ports || []).join(", "),
		mode: t.mode || "local",
		iface: t.interface || "",
		profile: t.profile_id || "",
		services: (t.required_services || []).map((e) => `${e.target}:${e.port}`).join("\n")
	};
}
function nc({ projectId: e }) {
	let [t, n] = (0, C.useState)(null), [r, i] = (0, C.useState)(null), [a, o] = (0, C.useState)(!1), [s, c] = (0, C.useState)(""), [l, u] = (0, C.useState)(""), [d, f] = (0, C.useState)(""), [p, m] = (0, C.useState)("");
	(0, C.useEffect)(() => {
		let t = !0;
		return us(e).then((e) => {
			t && (n(e), i(tc(e)));
		}).catch((e) => {
			t && c(ec(e));
		}), () => {
			t = !1;
		};
	}, [e]);
	function h(e, t) {
		i((n) => n && {
			...n,
			[e]: t
		});
	}
	async function g() {
		if (t && r) {
			o(!0), c(""), u("");
			try {
				let a = $s(r.services).map((e) => {
					let t = e.lastIndexOf(":");
					if (t <= 0) throw Error("Required services use hostname:port or IP:port.");
					return {
						target: e.slice(0, t),
						port: Number(e.slice(t + 1))
					};
				}), o = await ds(e, t.revision, {
					name: r.name,
					scope_source: r.source,
					allowed_targets: $s(r.targets),
					exclusions: $s(r.exclusions),
					allowed_ports: $s(r.ports).map(Number),
					mode: r.mode,
					interface: r.iface,
					profile_id: r.profile,
					execution_environment: "local",
					required_services: a
				});
				n(o), i(tc(o)), u("Network settings saved. Automatic jobs recheck this configuration before running.");
			} catch (e) {
				c(ec(e));
			} finally {
				o(!1);
			}
		}
	}
	async function _() {
		o(!0), c("");
		try {
			let t = await us(e);
			n(t), i(tc(t)), u("Settings reloaded.");
		} catch (e) {
			c(ec(e));
		} finally {
			o(!1);
		}
	}
	async function v() {
		o(!0), c(""), u("Checking saved scope and route…");
		try {
			let t = await fs(e, d, p ? Number(p) : void 0);
			n((e) => e && {
				...e,
				recent_checks: [...e.recent_checks || [], t].slice(-20)
			}), u(t.reason);
		} catch (e) {
			c(ec(e)), u("");
		} finally {
			o(!1);
		}
	}
	return /* @__PURE__ */ (0, H.jsxs)("details", {
		className: "hub-network-settings",
		open: !0,
		children: [
			/* @__PURE__ */ (0, H.jsx)("summary", { children: "Network settings" }),
			/* @__PURE__ */ (0, H.jsx)("p", {
				className: "hub-muted",
				children: "All automatic network tools use this project's saved scope and connection. Offline file work can continue without it."
			}),
			t && r && /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsxs)("p", {
					className: "hub-muted",
					children: [
						t.configured ? "Settings complete" : "Settings incomplete",
						" · Revision ",
						t.revision,
						" · Execution: this computer"
					]
				}),
				/* @__PURE__ */ (0, H.jsx)("form", {
					onSubmit: (e) => {
						e.preventDefault(), g();
					},
					children: /* @__PURE__ */ (0, H.jsxs)("fieldset", {
						disabled: a,
						children: [
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Network name", /* @__PURE__ */ (0, H.jsx)("input", {
								value: r.name,
								maxLength: 120,
								onChange: (e) => h("name", e.target.value)
							})] }),
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Scope source", /* @__PURE__ */ (0, H.jsx)("input", {
								value: r.source,
								maxLength: 1e3,
								placeholder: "Organiser's instructions or your explicit lab scope",
								onChange: (e) => h("source", e.target.value)
							})] }),
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Allowed targets", /* @__PURE__ */ (0, H.jsx)("textarea", {
								value: r.targets,
								placeholder: "IPs, CIDRs or exact hostnames; one per line",
								onChange: (e) => h("targets", e.target.value)
							})] }),
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Exclusions", /* @__PURE__ */ (0, H.jsx)("textarea", {
								value: r.exclusions,
								onChange: (e) => h("exclusions", e.target.value)
							})] }),
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Allowed ports", /* @__PURE__ */ (0, H.jsx)("input", {
								value: r.ports,
								placeholder: "Optional comma-separated ports; blank allows any port in scope",
								onChange: (e) => h("ports", e.target.value)
							})] }),
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Connection mode", /* @__PURE__ */ (0, H.jsxs)("select", {
								value: r.mode,
								onChange: (e) => h("mode", e.target.value),
								children: [
									/* @__PURE__ */ (0, H.jsx)("option", {
										value: "local",
										children: "Local / direct network"
									}),
									/* @__PURE__ */ (0, H.jsx)("option", {
										value: "openvpn",
										children: "OpenVPN"
									}),
									/* @__PURE__ */ (0, H.jsx)("option", {
										value: "wireguard",
										children: "WireGuard"
									})
								]
							})] }),
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Expected interface", /* @__PURE__ */ (0, H.jsx)("input", {
								value: r.iface,
								maxLength: 15,
								placeholder: "For example tun0, wg0 or enp1s0",
								onChange: (e) => h("iface", e.target.value)
							})] }),
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Profile identity", /* @__PURE__ */ (0, H.jsx)("input", {
								value: r.profile,
								placeholder: "NetworkManager UUID, WireGuard peer public key or OpenVPN config path",
								onChange: (e) => h("profile", e.target.value)
							})] }),
							/* @__PURE__ */ (0, H.jsx)("p", {
								className: "hub-muted",
								children: "For a direct OpenVPN client, use an explicit tunnel device in its configuration. Local mode can leave profile identity blank."
							}),
							/* @__PURE__ */ (0, H.jsx)("p", {
								className: "hub-muted",
								children: "WireGuard requires a nonzero transport fwmark for enforced execution. The app reads this setting and keeps your tunnel configuration unchanged."
							}),
							/* @__PURE__ */ (0, H.jsx)("p", {
								className: "hub-muted",
								children: "Guarded OpenVPN currently requires a userspace tunnel (disable-dco). DCO and raw-socket tools need a separate adapter and are held."
							}),
							/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Required TCP services", /* @__PURE__ */ (0, H.jsx)("textarea", {
								value: r.services,
								placeholder: "Optional hostname:port or IP:port, one per line",
								onChange: (e) => h("services", e.target.value)
							})] }),
							/* @__PURE__ */ (0, H.jsxs)("div", {
								className: "hub-network-actions",
								children: [/* @__PURE__ */ (0, H.jsx)("button", {
									type: "submit",
									children: "Save network settings"
								}), /* @__PURE__ */ (0, H.jsx)("button", {
									type: "button",
									onClick: () => {
										_();
									},
									children: "Reload saved settings"
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, H.jsxs)("p", {
					className: "hub-muted",
					children: [t.enforcement_reason, " Commands run without elevated capabilities; tools that require raw sockets or passive capture are held or fail explicitly."]
				}),
				/* @__PURE__ */ (0, H.jsxs)("form", {
					className: "hub-network-check",
					onSubmit: (e) => {
						e.preventDefault(), v();
					},
					children: [
						/* @__PURE__ */ (0, H.jsxs)("label", { children: ["Check target", /* @__PURE__ */ (0, H.jsx)("input", {
							value: d,
							onChange: (e) => f(e.target.value),
							required: !0,
							maxLength: 253
						})] }),
						/* @__PURE__ */ (0, H.jsxs)("label", { children: ["TCP port", /* @__PURE__ */ (0, H.jsx)("input", {
							value: p,
							type: "number",
							min: 1,
							max: 65535,
							onChange: (e) => m(e.target.value)
						})] }),
						/* @__PURE__ */ (0, H.jsx)("button", {
							disabled: a || !d,
							children: "Check saved network"
						})
					]
				}),
				/* @__PURE__ */ (0, H.jsx)("p", {
					className: "hub-muted",
					children: "Checks use saved settings. Results describe the check time; jobs recheck before running."
				}),
				!!t.recent_checks?.length && /* @__PURE__ */ (0, H.jsxs)("details", { children: [/* @__PURE__ */ (0, H.jsx)("summary", { children: "Recent network checks" }), [...t.recent_checks].reverse().map((e, n) => /* @__PURE__ */ (0, H.jsxs)("div", {
					className: "hub-network-report",
					children: [
						/* @__PURE__ */ (0, H.jsxs)("strong", { children: [e.status, e.revision === t.revision ? "" : " · previous configuration"] }),
						/* @__PURE__ */ (0, H.jsxs)("span", { children: [
							e.target,
							" · ",
							new Date(e.checked_at).toLocaleString()
						] }),
						/* @__PURE__ */ (0, H.jsx)("p", { children: e.reason }),
						e.routes?.map((e, t) => /* @__PURE__ */ (0, H.jsxs)("div", { children: [
							"Route: ",
							String(e.destination),
							" → ",
							String(e.interface),
							" · source ",
							String(e.source),
							" · gateway ",
							String(e.gateway || "direct")
						] }, t)),
						e.services?.map((e, t) => /* @__PURE__ */ (0, H.jsxs)("div", { children: [
							"TCP ",
							String(e.address),
							":",
							String(e.port),
							" · ",
							String(e.outcome)
						] }, t))
					]
				}, `${e.checked_at}-${n}`))] })
			] }),
			l && /* @__PURE__ */ (0, H.jsx)("p", {
				role: "status",
				className: "hub-muted",
				children: l
			}),
			s && /* @__PURE__ */ (0, H.jsx)("p", {
				role: "alert",
				className: "hub-error",
				children: s
			})
		]
	});
}
// src/hub/Menu.tsx
function rc({ items: e, x: t, y: n, close: r, label: i = "Project actions" }) {
	let a = (0, C.useRef)(null), o = (0, C.useRef)(document.activeElement);
	return (0, C.useLayoutEffect)(() => {
		let e = a.current;
		return e.style.left = `${Math.max(8, Math.min(t, window.innerWidth - e.offsetWidth - 8))}px`, e.style.top = `${Math.max(8, Math.min(n, window.innerHeight - e.offsetHeight - 8))}px`, e.querySelector("button:not(:disabled)")?.focus(), () => o.current?.focus();
	}, []), (0, C.useEffect)(() => {
		let e = (e) => {
			a.current?.contains(e.target) || r();
		};
		return window.addEventListener("pointerdown", e), window.addEventListener("blur", r), window.addEventListener("resize", r), () => {
			window.removeEventListener("pointerdown", e), window.removeEventListener("blur", r), window.removeEventListener("resize", r);
		};
	}, [r]), /* @__PURE__ */ (0, H.jsx)("div", {
		className: "hub-context-menu",
		role: "menu",
		"aria-label": i,
		ref: a,
		style: {
			left: t,
			top: n
		},
		onKeyDown: (e) => {
			if ((e.key === "Escape" || e.key === "Tab") && (e.preventDefault(), r()), /^[1-9]$/.test(e.key) && (e.preventDefault(), a.current.querySelectorAll("button")[Number(e.key) - 1]?.click()), ![
				"ArrowDown",
				"ArrowUp",
				"Home",
				"End"
			].includes(e.key)) return;
			e.preventDefault();
			let t = [...a.current.querySelectorAll("button:not(:disabled)")], n = t.indexOf(document.activeElement);
			t[e.key === "Home" ? 0 : e.key === "End" ? t.length - 1 : (n + (e.key === "ArrowDown" ? 1 : -1) + t.length) % t.length]?.focus();
		},
		children: e.map((e) => /* @__PURE__ */ (0, H.jsx)("button", {
			role: "menuitem",
			disabled: e.disabled,
			onClick: () => {
				r(), e.run();
			},
			children: e.label
		}, e.label))
	});
}
// src/hub/preferences.ts
function ic(e, t) {
	try {
		let n = localStorage.getItem(`legion.workspace.${e}`);
		return n === null ? t : JSON.parse(n);
	} catch {
		return t;
	}
}
function ac(e, t) {
	try {
		localStorage.setItem(`legion.workspace.${e}`, JSON.stringify(t));
	} catch {}
}
function oc(e, t, n, r, i = 1) {
	let a = (e) => Math.max(n, Math.min(r, e)), [o, s] = (0, C.useState)(() => {
		let n = ic(e, t);
		return typeof n == "number" && Number.isFinite(n) ? a(n) : t;
	}), c = (0, C.useRef)(null);
	return (0, C.useEffect)(() => ac(e, o), [e, o]), {
		width: o,
		resize: {
			onPointerDown(e) {
				e.button === 0 && (c.current = {
					x: e.clientX,
					width: o
				}, e.currentTarget.setPointerCapture(e.pointerId), e.preventDefault());
			},
			onPointerMove(e) {
				c.current && s(a(c.current.width + i * (e.clientX - c.current.x)));
			},
			onPointerUp() {
				c.current = null;
			},
			onPointerCancel() {
				c.current = null;
			},
			onKeyDown(e) {
				[
					"ArrowLeft",
					"ArrowRight",
					"Home",
					"End"
				].includes(e.key) && (e.preventDefault(), s((t) => e.key === "Home" ? n : e.key === "End" ? r : a(t + i * (e.key === "ArrowLeft" ? -10 : 10))));
			}
		}
	};
}
function sc() {
	return oc("sidebarWidth", 260, 210, 340);
}
function cc() {
	return oc("actionPanelWidth", 340, 280, 480, -1);
}
// src/hub/hardware/model.ts
var lc = (e) => typeof e == "object" && e && !Array.isArray(e) ? e : {}, uc = (e) => typeof e == "string" && ![
	"unknown",
	"n/a",
	"none",
	"—"
].includes(e.trim().toLowerCase()) ? e.trim() : "";
function dc(e) {
	let t = lc(e), n = t.id;
	if (typeof n != "number" || !Number.isSafeInteger(n) || n <= 0) return null;
	let r = Array.isArray(t.categories) ? t.categories.map((e) => uc(e).toLowerCase()) : [], i = r.some((e) => /^(printer|network printer)$/.test(e)) ? "network-printer" : r.includes("server") ? "server" : r.some((e) => /^(workstation|desktop|computer)$/.test(e)) ? "computer" : "unknown-device";
	return {
		id: `host-${n}`,
		hostId: n,
		kind: "host",
		artwork: i,
		hostname: uc(t.hostname),
		ip: uc(t.ip),
		os: uc(t.os)
	};
}
function fc(e, t, n, r) {
	r?.project_id !== e.id && (r = null);
	let i = [{
		id: "laptop",
		kind: "laptop",
		artwork: "laptop",
		label: "Laptop",
		hostname: n?.computer.name || "",
		os: n?.computer.system || "",
		ip: ""
	}], a = r?.configured ? r.settings.mode !== "local" : e.vpn !== "none", o = r?.settings.mode, s = o && o !== "local" ? o : r?.connector || e.connector, c = s === "wireguard" ? "WireGuard" : s === "openvpn" ? "OpenVPN" : "Unknown";
	if (a && i.push({
		id: "vpn",
		kind: "vpn",
		artwork: "vpn-appliance",
		label: c,
		hostname: "",
		os: "",
		ip: ""
	}), t?.project.name === e.path && Array.isArray(t.hosts)) {
		let e = /* @__PURE__ */ new Set();
		for (let n of t.hosts) {
			let t = dc(n);
			t && !e.has(t.id) && (e.add(t.id), i.push(t));
		}
	}
	i.sort((e, t) => e.kind === "host" && t.kind === "host" ? e.hostId - t.hostId : 0);
	let l = [];
	if (r?.configured) {
		let e = a ? "vpn" : "laptop", t = /* @__PURE__ */ new Set();
		for (let n of [...r.recent_checks || []].reverse()) if (n.revision === r.revision) for (let a of i) {
			if (a.kind !== "host" || t.has(a.id)) continue;
			let i = (n.routes || []).map(lc).find((e) => e.destination === a.ip), o = (n.target || "").split(/,\s*/);
			(i || o.includes(a.ip) || a.hostname && o.includes(a.hostname)) && (t.add(a.id), n.status === "ready" && i?.interface === r.settings.interface && l.push({
				id: `route-${a.id}`,
				from: e,
				to: a.id,
				kind: "route",
				observedAt: n.checked_at
			}));
		}
		a && l.length && l.push({
			id: "vpn-route",
			from: "laptop",
			to: "vpn",
			kind: "vpn",
			observedAt: l[0].observedAt
		});
	}
	return {
		nodes: i,
		links: l
	};
}
function pc(e) {
	let t = /* @__PURE__ */ new Map(), n = e.nodes.filter((e) => e.kind !== "host").map((e) => e.id);
	for (let e of n) t.set(e, 0);
	let r = /* @__PURE__ */ new Map();
	for (let t of e.links) r.set(t.from, [...r.get(t.from) || [], t.to]), r.set(t.to, [...r.get(t.to) || [], t.from]);
	for (let e = 0; e < n.length; e++) for (let i of r.get(n[e]) || []) t.has(i) || (t.set(i, t.get(n[e]) + 1), n.push(i));
	let i = /* @__PURE__ */ new Map();
	for (let n of e.nodes.filter((e) => e.kind === "host")) {
		let e = t.get(n.id) || 1;
		i.set(e, [...i.get(e) || [], n]);
	}
	let a = [...i.values()].reduce((e, t) => e + Math.ceil(t.length / 5), 0), o = Math.max(650, a * 180 + 250), s = o - 110, c = (s - 100) / Math.max(1, a), l = e.nodes.filter((e) => e.kind !== "host"), u = l.map((e, t) => ({
		...e,
		x: 420 + (t - (l.length - 1) / 2) * 200,
		y: s
	})), d = 1;
	for (let [, e] of [...i].sort(([e], [t]) => e - t)) {
		for (let t = 0; t < e.length; t++) {
			let n = Math.floor(t / 5), r = Math.min(5, e.length - n * 5), i = t % 5;
			u.push({
				...e[t],
				x: 420 + (i - (r - 1) / 2) * 175,
				y: s - (d + n) * c
			});
		}
		d += Math.ceil(e.length / 5);
	}
	return {
		nodes: u,
		width: 840,
		height: o
	};
}
// src/hub/hardware/HardwareMap.tsx
var mc = "/static/images/hardware/", hc = (e) => e instanceof Element && !!e.closest("input,textarea,select,[contenteditable]:not([contenteditable=\"false\"]),[role=\"dialog\"],[role=\"menu\"]");
function gc({ projectId: e, graph: t, onSelect: n, onOpen: r, onSetup: i }) {
	let a = (0, C.useRef)(null), o = (0, C.useRef)(null), [s, c] = (0, C.useState)({
		width: 840,
		height: 650
	}), [l, u] = (0, C.useState)({
		x: 0,
		y: 0,
		zoom: 1
	}), [d, f] = (0, C.useState)(null), [p, m] = (0, C.useState)(null), h = (0, C.useMemo)(() => pc(t), [t]), [g, _] = (0, C.useState)(() => {
		let t = ic(`hardwareNumbers:${e}`, []);
		return Array.isArray(t) ? [...new Set(t.filter((e) => typeof e == "string" && /^host-\d+$/.test(e)))].slice(0, 9) : [];
	});
	(0, C.useEffect)(() => {
		_((n) => {
			let r = [...n];
			for (let e of t.nodes) e.kind === "host" && !r.includes(e.id) && r.length < 9 && r.push(e.id);
			return r.length === n.length ? n : (ac(`hardwareNumbers:${e}`, r), r);
		});
	}, [e, t.nodes]), (0, C.useEffect)(() => {
		let e = a.current;
		if (!e || typeof ResizeObserver > "u") return;
		let t = new ResizeObserver((e) => {
			let t = e[0].contentRect;
			t.width && t.height && c({
				width: t.width,
				height: t.height
			});
		});
		return t.observe(e), () => t.disconnect();
	}, []), (0, C.useEffect)(() => {
		let e = a.current;
		if (!e) return;
		let t = (e) => {
			e.ctrlKey || e.metaKey || !e.deltaY || (e.preventDefault(), u((t) => ({
				...t,
				zoom: Math.max(.3, Math.min(3, t.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)))
			})));
		};
		return e.addEventListener("wheel", t, { passive: !1 }), () => e.removeEventListener("wheel", t);
	}, []), (0, C.useEffect)(() => u({
		x: 0,
		y: 0,
		zoom: 1
	}), [h.width, h.height]);
	let v = Math.max(.001, Math.min(1, (s.width - 28) / h.width, (s.height - 28) / h.height)) * l.zoom, y = (s.width - h.width * v) / 2 + l.x, b = (s.height - h.height * v) / 2 + l.y, x = (e) => {
		f(e?.id || null), n(e);
	};
	(0, C.useEffect)(() => {
		if (!d) return;
		let e = t.nodes.find((e) => e.id === d);
		e ? n(e) : (f(null), n(null));
	}, [
		t.nodes,
		d,
		n
	]), (0, C.useEffect)(() => {
		let e = (e) => {
			if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || hc(e.target) || [...document.querySelectorAll("[role=\"dialog\"],[role=\"menu\"]")].some((e) => e.getClientRects().length > 0)) return;
			(e.key === "0" || e.key === "Escape") && (e.preventDefault(), x(null), u({
				x: 0,
				y: 0,
				zoom: 1
			}));
			let n = Number(e.key) - 1;
			if (/^[1-9]$/.test(e.key)) {
				let r = t.nodes.find((e) => e.id === g[n]);
				r && (e.preventDefault(), x(r), a.current?.querySelector(`[data-hardware-id="${r.id}"]`)?.focus({ preventScroll: !0 }));
			}
			if (e.key === "`" && d) {
				let n = t.nodes.find((e) => e.id === d), r = a.current?.querySelector(`[data-hardware-id="${d}"]`);
				if (n && r) {
					e.preventDefault();
					let t = r.getBoundingClientRect();
					m({
						node: n,
						x: t.right,
						y: t.top
					});
				}
			}
		};
		return document.addEventListener("keydown", e), () => document.removeEventListener("keydown", e);
	}, [
		t.nodes,
		d,
		g,
		n
	]);
	function S(e) {
		e.button !== 0 || e.target.closest("button") || (o.current = {
			x: e.clientX,
			y: e.clientY,
			dx: l.x,
			dy: l.y
		}, e.currentTarget.setPointerCapture(e.pointerId));
	}
	return /* @__PURE__ */ (0, H.jsxs)("div", {
		ref: a,
		className: "hardware-canvas",
		role: "region",
		"aria-label": "Hardware map",
		tabIndex: -1,
		onPointerDown: S,
		onPointerMove: (e) => {
			if (o.current) {
				let t = o.current;
				u((n) => ({
					...n,
					x: t.dx + e.clientX - t.x,
					y: t.dy + e.clientY - t.y
				}));
			}
		},
		onPointerUp: (e) => {
			o.current && Math.hypot(e.clientX - o.current.x, e.clientY - o.current.y) < 4 && x(null), o.current = null;
		},
		onPointerCancel: () => {
			o.current = null;
		},
		children: [/* @__PURE__ */ (0, H.jsxs)("div", {
			className: "hardware-world",
			style: {
				width: h.width,
				height: h.height,
				transform: `translate(${y}px, ${b}px) scale(${v})`
			},
			children: [/* @__PURE__ */ (0, H.jsx)("svg", {
				className: "hardware-links",
				width: h.width,
				height: h.height,
				"aria-label": "Observed connections",
				children: t.links.map((e) => {
					let t = h.nodes.find((t) => t.id === e.from), n = h.nodes.find((t) => t.id === e.to);
					return !t || !n ? null : /* @__PURE__ */ (0, H.jsx)("line", {
						"data-link-kind": e.kind,
						x1: t.x,
						y1: t.y,
						x2: n.x,
						y2: n.y,
						children: /* @__PURE__ */ (0, H.jsx)("title", { children: `${e.kind === "vpn" ? "VPN route" : "Observed route"} · ${e.observedAt}` })
					}, e.id);
				})
			}), h.nodes.map((e) => {
				let t = e.id === d, n = e.kind === "laptop" ? "0" : g.includes(e.id) ? String(g.indexOf(e.id) + 1) : "", a = [
					e.label,
					e.ip,
					e.hostname,
					e.os
				].filter(Boolean).join(" · ") || "Unknown device";
				return /* @__PURE__ */ (0, H.jsxs)("button", {
					type: "button",
					className: "hardware-node",
					"data-hardware-id": e.id,
					"data-artwork": e.artwork,
					"aria-label": a,
					"aria-pressed": t,
					style: {
						left: e.x,
						top: e.y,
						"--hardware-contour": `url("${mc}${e.artwork}-contour.svg")`
					},
					onClick: () => x(e),
					onDoubleClick: () => {
						e.hostId ? r(e.hostId) : i();
					},
					onContextMenu: (t) => {
						t.preventDefault(), x(e), m({
							node: e,
							x: t.clientX,
							y: t.clientY
						});
					},
					children: [
						n && /* @__PURE__ */ (0, H.jsx)("span", {
							className: "hardware-number",
							"aria-hidden": "true",
							children: n
						}),
						/* @__PURE__ */ (0, H.jsxs)("span", {
							className: "hardware-artwork",
							children: [/* @__PURE__ */ (0, H.jsx)("img", {
								src: `${mc}${e.artwork}.png`,
								width: "70",
								height: "70",
								alt: "",
								draggable: !1
							}), /* @__PURE__ */ (0, H.jsx)("span", { className: "hardware-contour" })]
						}),
						/* @__PURE__ */ (0, H.jsx)("span", {
							className: "hardware-labels",
							children: [
								e.label,
								e.ip,
								e.hostname,
								e.os
							].filter(Boolean).map((e, t) => /* @__PURE__ */ (0, H.jsx)("span", {
								title: e,
								children: e
							}, t))
						})
					]
				}, e.id);
			})]
		}), p && /* @__PURE__ */ (0, H.jsx)(rc, {
			label: "Device actions",
			x: p.x,
			y: p.y,
			close: () => m(null),
			items: [
				...p.node.hostId ? [{
					label: "Details",
					run: () => r(p.node.hostId)
				}] : [],
				{
					label: "Project setup",
					run: i
				},
				{
					label: "Home",
					run: () => {
						x(null), u({
							x: 0,
							y: 0,
							zoom: 1
						});
					}
				}
			]
		})]
	});
}
// src/hub/pages.tsx
var _c = (e) => e instanceof Error ? e.message : String(e);
function vc({ project: e, snapshot: t, settings: n, onSelect: r, onOpen: i, onSetup: a, onServices: o, onFiles: s }) {
	let [c, l] = (0, C.useState)(null);
	(0, C.useEffect)(() => {
		let t = !0;
		return us(e.id).then((n) => {
			t && n?.project_id === e.id && l(n);
		}).catch(() => {
			t && l(null);
		}), () => {
			t = !1;
		};
	}, [e.id, t?.timestamp]);
	let u = (0, C.useMemo)(() => fc(e, t, n, c), [
		e,
		t,
		n,
		c
	]);
	return /* @__PURE__ */ (0, H.jsxs)("section", {
		className: "hub-overview",
		"aria-label": "Project overview",
		children: [
			/* @__PURE__ */ (0, H.jsx)("h1", { children: e.name }),
			/* @__PURE__ */ (0, H.jsx)("p", {
				className: "hub-folder",
				children: e.folder
			}),
			/* @__PURE__ */ (0, H.jsxs)("nav", {
				className: "hardware-layers",
				"aria-label": "Overview layers",
				children: [
					/* @__PURE__ */ (0, H.jsxs)("button", {
						"aria-current": "page",
						onClick: () => {},
						children: [/* @__PURE__ */ (0, H.jsx)("kbd", { children: "Q" }), "Hardware"]
					}),
					/* @__PURE__ */ (0, H.jsxs)("button", {
						onClick: o,
						children: [/* @__PURE__ */ (0, H.jsx)("kbd", { children: "W" }), "Services"]
					}),
					/* @__PURE__ */ (0, H.jsxs)("button", {
						onClick: s,
						children: [/* @__PURE__ */ (0, H.jsx)("kbd", { children: "E" }), "Files"]
					})
				]
			}),
			/* @__PURE__ */ (0, H.jsx)(gc, {
				projectId: e.id,
				graph: u,
				onSelect: r,
				onOpen: i,
				onSetup: a
			}, e.id)
		]
	});
}
function yc({ project: e, onChange: t }) {
	let [n, r] = (0, C.useState)([]), [i, a] = (0, C.useState)(""), [o, s] = (0, C.useState)(!1), [c, l] = (0, C.useState)(!1);
	(0, C.useEffect)(() => {
		let t = !0;
		return ys(e.id).then((e) => {
			t && (r(e.files), s(e.truncated));
		}).catch((e) => {
			t && a(_c(e));
		}), () => {
			t = !1;
		};
	}, [e.id]);
	async function u(n) {
		l(!0), a("");
		try {
			await bs(e.id, n), t({
				...e,
				connector: n
			});
		} catch (e) {
			a(_c(e));
		} finally {
			l(!1);
		}
	}
	return /* @__PURE__ */ (0, H.jsxs)("section", {
		className: "hub-project-setup",
		"aria-label": "Project setup",
		children: [
			/* @__PURE__ */ (0, H.jsx)("h1", { children: "Project setup" }),
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-property",
				children: [
					/* @__PURE__ */ (0, H.jsx)("label", {
						htmlFor: "hub-project-vpn",
						children: "Connector"
					}),
					/* @__PURE__ */ (0, H.jsxs)("select", {
						id: "hub-project-vpn",
						value: e.connector || "networkmanager",
						disabled: c,
						onChange: (e) => {
							u(e.target.value);
						},
						children: [
							/* @__PURE__ */ (0, H.jsx)("option", {
								value: "networkmanager",
								children: "NetworkManager"
							}),
							/* @__PURE__ */ (0, H.jsx)("option", {
								value: "openvpn",
								children: "OpenVPN"
							}),
							/* @__PURE__ */ (0, H.jsx)("option", {
								value: "wireguard",
								children: "WireGuard"
							})
						]
					}),
					/* @__PURE__ */ (0, H.jsx)("span", {
						className: "hub-muted",
						children: "Not configured"
					})
				]
			}),
			i && /* @__PURE__ */ (0, H.jsx)("p", {
				className: "hub-error",
				role: "alert",
				children: i
			}),
			/* @__PURE__ */ (0, H.jsx)(nc, { projectId: e.id }, `${e.id}-${e.connector}`),
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-files-header",
				children: [/* @__PURE__ */ (0, H.jsx)("h2", { children: "Files" }), /* @__PURE__ */ (0, H.jsx)("button", {
					className: "hub-quiet",
					"aria-label": "Refresh files",
					onClick: () => {
						ys(e.id).then((e) => {
							r(e.files), s(e.truncated), a("");
						}).catch((e) => a(_c(e)));
					},
					children: "↻"
				})]
			}),
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-files",
				children: [n.map((t) => /* @__PURE__ */ (0, H.jsxs)("a", {
					href: Cs(e.id, t.path),
					download: !0,
					children: [
						/* @__PURE__ */ (0, H.jsx)(Hs, { kind: "file" }),
						/* @__PURE__ */ (0, H.jsx)("span", { children: t.path }),
						/* @__PURE__ */ (0, H.jsx)("small", { children: t.size < 1024 ? `${t.size} B` : `${Math.ceil(t.size / 1024)} KB` })
					]
				}, t.path)), !n.length && /* @__PURE__ */ (0, H.jsx)("span", {
					className: "hub-muted",
					children: "—"
				})]
			}),
			o && /* @__PURE__ */ (0, H.jsx)("p", {
				className: "hub-muted",
				children: "First 500 files"
			})
		]
	});
}
function bc({ settings: e, openPart: t, onSettingsChange: n }) {
	let [r, i] = (0, C.useState)(e?.projects_folder || ""), [a, o] = (0, C.useState)(!1), [s, c] = (0, C.useState)("");
	(0, C.useEffect)(() => {
		i(e?.projects_folder || "");
	}, [e?.projects_folder]);
	async function l() {
		o(!0), c("");
		try {
			n(await gs(r.trim()));
		} catch (e) {
			c(_c(e));
		} finally {
			o(!1);
		}
	}
	return /* @__PURE__ */ (0, H.jsxs)("section", {
		className: "hub-setup-page",
		"aria-label": "Computer setup",
		children: [
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-computer",
				children: [/* @__PURE__ */ (0, H.jsx)(Hs, { kind: "computer" }), /* @__PURE__ */ (0, H.jsxs)("div", { children: [/* @__PURE__ */ (0, H.jsx)("h1", { children: e?.computer.name || "This computer" }), /* @__PURE__ */ (0, H.jsx)("span", {
					className: "hub-muted",
					children: e?.computer.system || "—"
				})] })]
			}),
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-property",
				children: [/* @__PURE__ */ (0, H.jsx)("span", { children: "VPN" }), /* @__PURE__ */ (0, H.jsx)("span", {
					className: "hub-vpn-unconfigured",
					children: "Not configured"
				})]
			}),
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-property hub-connection-default",
				children: [
					/* @__PURE__ */ (0, H.jsx)("label", {
						htmlFor: "hub-default-vpn",
						children: "Default VPN"
					}),
					/* @__PURE__ */ (0, H.jsx)("select", {
						id: "hub-default-vpn",
						disabled: !0,
						value: "none",
						children: /* @__PURE__ */ (0, H.jsx)("option", {
							value: "none",
							children: "No default"
						})
					}),
					/* @__PURE__ */ (0, H.jsx)("button", {
						className: "hub-quiet",
						disabled: !0,
						"aria-label": "Refresh VPNs — not available yet",
						children: "↻"
					}),
					/* @__PURE__ */ (0, H.jsx)(Qs, {})
				]
			}),
			/* @__PURE__ */ (0, H.jsxs)("form", {
				className: "hub-property hub-save-folder",
				onSubmit: (e) => {
					e.preventDefault(), l();
				},
				children: [
					/* @__PURE__ */ (0, H.jsx)("label", {
						htmlFor: "hub-save-folder",
						children: "Default save folder"
					}),
					/* @__PURE__ */ (0, H.jsx)("input", {
						id: "hub-save-folder",
						value: r,
						onChange: (e) => i(e.target.value),
						disabled: !e || a,
						autoComplete: "off",
						spellCheck: !1
					}),
					/* @__PURE__ */ (0, H.jsx)("button", {
						disabled: !e || a || !r.trim() || r === e.projects_folder,
						children: a ? "Saving…" : "Save"
					})
				]
			}),
			s && /* @__PURE__ */ (0, H.jsx)("p", {
				className: "hub-error",
				role: "alert",
				children: s
			}),
			/* @__PURE__ */ (0, H.jsx)("div", {
				className: "hub-settings-links",
				children: Object.entries(Ks).map(([e, n]) => /* @__PURE__ */ (0, H.jsx)("button", {
					onClick: () => t(e),
					children: n
				}, e))
			})
		]
	});
}
// src/hub/Dialog.tsx
function xc({ title: e, close: t, children: n }) {
	let r = (0, C.useRef)(null), i = (0, C.useRef)(document.activeElement);
	return (0, C.useEffect)(() => (r.current?.querySelector("input,button")?.focus(), () => i.current?.focus()), []), /* @__PURE__ */ (0, H.jsx)("div", {
		className: "hub-modal-backdrop",
		onClick: (e) => {
			e.target === e.currentTarget && t();
		},
		children: /* @__PURE__ */ (0, H.jsxs)("div", {
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
			children: [/* @__PURE__ */ (0, H.jsx)("h2", { children: e }), n]
		})
	});
}
// src/hub/Palette.tsx
function Sc({ commands: e, close: t }) {
	let [n, r] = (0, C.useState)(""), [i, a] = (0, C.useState)(0), o = (0, C.useMemo)(() => e.filter((e) => `${e.label} ${e.detail || ""}`.toLowerCase().includes(n.toLowerCase())).slice(0, 30), [e, n]), s = (0, C.useRef)(null);
	function c(e) {
		let n = o[e];
		n && (t(), n.run());
	}
	return /* @__PURE__ */ (0, H.jsx)(xc, {
		title: "Search workspace",
		close: t,
		children: /* @__PURE__ */ (0, H.jsxs)("div", {
			onKeyDown: (e) => {
				(e.key === "ArrowDown" || e.key === "ArrowUp") && (e.preventDefault(), a((t) => {
					let n = (t + (e.key === "ArrowDown" ? 1 : -1) + o.length) % Math.max(1, o.length);
					return s.current?.children[n]?.scrollIntoView?.({ block: "nearest" }), n;
				})), e.key === "Enter" && (e.preventDefault(), c(i));
			},
			children: [/* @__PURE__ */ (0, H.jsx)("input", {
				"aria-label": "Search views, actions, and hosts",
				placeholder: "Search…",
				value: n,
				onChange: (e) => {
					r(e.target.value), a(0);
				},
				"aria-controls": "hub-search-results",
				"aria-activedescendant": o[i] ? `hub-command-${i}` : void 0
			}), /* @__PURE__ */ (0, H.jsx)("div", {
				id: "hub-search-results",
				className: "hub-palette-results",
				ref: s,
				role: "listbox",
				children: o.map((e, t) => /* @__PURE__ */ (0, H.jsxs)("button", {
					id: `hub-command-${t}`,
					role: "option",
					"aria-selected": t === i,
					onClick: () => c(t),
					children: [/* @__PURE__ */ (0, H.jsx)("span", { children: e.label }), /* @__PURE__ */ (0, H.jsx)("small", { children: e.detail })]
				}, e.id))
			})]
		})
	});
}
// src/hub/live.ts
function Cc() {
	let [e, t] = (0, C.useState)(null), [n, r] = (0, C.useState)("Connecting"), i = (0, C.useRef)(() => {});
	return (0, C.useEffect)(() => {
		let e = !0, n = !1, a = null, o, s = !1;
		async function c() {
			if (n) s = !0;
			else {
				n = !0;
				try {
					let n = await As();
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
// src/hub/reader/workspace-controller.js
var wc = (e) => structuredClone(e), Tc = (e) => e instanceof Error ? e.message : String(e);
function Ec(e) {
	if (!e || typeof e.running != "boolean") throw Error("Workspace control state is unavailable");
	let t = /* @__PURE__ */ new Map();
	for (let n of e.alerts || []) typeof n.id == "string" && n.id && typeof n.result_path == "string" && t.set(n.id, wc(n));
	let n = [
		"running",
		"pausing",
		"paused"
	].includes(e.observed_state) ? e.observed_state : null;
	return {
		...wc(e),
		observed_state: n,
		alerts: [...t.values()].sort((e, t) => (Number(t.completed) || 0) - (Number(e.completed) || 0) || e.id.localeCompare(t.id))
	};
}
var Dc = class {
	constructor({ openResult: e = () => {} } = {}) {
		this.workspaces = /* @__PURE__ */ new Map(), this.selected = null, this.selectionRevision = 0, this.listeners = /* @__PURE__ */ new Set(), this.openResultCallback = e;
	}
	register({ id: e, label: t, adapter: n }) {
		if (typeof e != "string" || !e || this.workspaces.has(e)) throw Error("A unique workspace ID is required");
		for (let e of [
			"read",
			"setRunning",
			"dismiss",
			"result"
		]) if (typeof n?.[e] != "function") throw Error("Workspace adapter is missing " + e);
		return this.workspaces.set(e, {
			id: e,
			label: t || e,
			adapter: n,
			status: null,
			error: "",
			busy: !1,
			dismissing: /* @__PURE__ */ new Set(),
			dismissed: /* @__PURE__ */ new Set(),
			opening: null,
			revision: 0,
			readSequence: 0,
			appliedSequence: 0
		}), e;
	}
	workspace(e = this.selected) {
		let t = this.workspaces.get(e);
		if (!t) throw Error("Unknown workspace");
		return t;
	}
	select(e) {
		return e === null ? (this.selectionRevision++, this.selected = null, this.emit(), Promise.resolve()) : (this.workspace(e), e !== this.selected && this.selectionRevision++, this.selected = e, this.emit(), this.refresh(e));
	}
	view(e = this.selected) {
		if (e === null) return null;
		let t = this.workspace(e), n = t.status ? wc(t.status) : null;
		return n && (n.alerts = n.alerts.filter((e) => !t.dismissed.has(e.id))), {
			id: t.id,
			label: t.label,
			status: n,
			error: t.error,
			busy: t.busy,
			dismissing: [...t.dismissing],
			opening: t.opening
		};
	}
	subscribe(e) {
		return this.listeners.add(e), e(this.view()), () => this.listeners.delete(e);
	}
	emit() {
		for (let e of this.listeners) e(this.view());
	}
	async refresh(e = this.selected) {
		let t = this.workspace(e), n = t.revision, r = ++t.readSequence;
		try {
			let i = Ec(await t.adapter.read());
			return t.revision !== n || r < t.appliedSequence || t.busy ? !1 : (t.appliedSequence = r, t.status = i, t.error = "", e === this.selected && this.emit(), !0);
		} catch (i) {
			return t.revision === n && r >= t.appliedSequence && !t.busy && (t.appliedSequence = r, t.error = Tc(i), e === this.selected && this.emit()), !1;
		}
	}
	async setRunning(e, t = this.selected) {
		let n = this.workspace(t);
		if (typeof e != "boolean") throw Error("running must be boolean");
		if (n.busy) return !1;
		n.busy = !0, n.error = "", n.revision++, t === this.selected && this.emit();
		try {
			if ((await n.adapter.setRunning(e))?.running !== e) throw Error("Workspace did not acknowledge the requested state");
			return n.status && (n.status.running = e, n.status.observed_state = null), !0;
		} catch (e) {
			return n.error = Tc(e), !1;
		} finally {
			n.busy = !1, n.revision++, t === this.selected && this.emit();
			let e = n.error;
			await this.refresh(t), e && !n.error && (n.error = e, t === this.selected && this.emit());
		}
	}
	async dismiss(e, t = this.selected) {
		let n = this.workspace(t);
		if (n.dismissing.has(e)) return !1;
		if (!n.status?.alerts.some((t) => t.id === e)) throw Error("Unknown result alert");
		n.dismissing.add(e), n.error = "", n.revision++, t === this.selected && this.emit();
		try {
			return await n.adapter.dismiss(e), n.dismissed.add(e), !0;
		} catch (e) {
			return n.error = Tc(e), !1;
		} finally {
			n.dismissing.delete(e), n.revision++, t === this.selected && this.emit();
		}
	}
	async open(e, t = this.selected) {
		let n = this.workspace(t), r = this.selectionRevision, i = n.status?.alerts.find((t) => t.id === e);
		if (!i || n.dismissed.has(e)) throw Error("Unknown result alert");
		if (n.opening) return !1;
		n.opening = e, n.error = "", t === this.selected && this.emit();
		try {
			let e = await n.adapter.result(wc(i));
			return this.selected !== t || r !== this.selectionRevision ? !1 : (await this.openResultCallback({
				workspaceId: t,
				workspaceLabel: n.label,
				alert: wc(i),
				result: e
			}), !0);
		} catch (e) {
			return n.error = Tc(e), !1;
		} finally {
			n.opening = null, t === this.selected && this.emit();
		}
	}
};
// src/hub/reader/useBackground.ts
function Oc(e, t) {
	let n = (0, C.useRef)(t);
	n.current = t;
	let r = (0, C.useRef)(e?.id);
	r.current = e?.id;
	let i = (0, C.useMemo)(() => new Dc({ openResult: ({ workspaceId: e, alert: t }) => {
		r.current === e && n.current(t.id);
	} }), []), [a, o] = (0, C.useState)(null);
	return (0, C.useEffect)(() => i.subscribe(o), [i]), (0, C.useEffect)(() => {
		let t = e?.id;
		if (!t || !e) {
			i.select(null);
			return;
		}
		i.workspaces.has(t) || i.register({
			id: t,
			label: e.name,
			adapter: {
				read: () => js(t),
				setRunning: (e) => Ms(t, e),
				dismiss: (e) => Ns(t, e),
				result: (e) => Ps(t, e.id)
			}
		}), i.workspaces.get(t).label = e.name, i.select(t);
		let n = !1, r;
		async function a() {
			await i.refresh(t), n || (r = setTimeout(a, 2e3));
		}
		return r = setTimeout(a, 2e3), () => {
			n = !0, clearTimeout(r);
		};
	}, [
		i,
		e?.id,
		e?.name
	]), {
		controller: i,
		view: a?.id === e?.id ? a : null
	};
}
// src/hub/scanner/ScanCard.tsx
var kc = (e) => e && typeof e == "object" && !Array.isArray(e) ? e : {}, Ac = (e) => Array.isArray(e) ? e.map(kc) : [], jc = (e) => typeof e == "string" || typeof e == "number" ? String(e) : "";
function Mc({ node: e, scans: t }) {
	let n = t.runs.find((t) => t.host_id === e.hostId && ["queued", "running"].includes(t.status));
	return /* @__PURE__ */ (0, H.jsxs)("div", {
		className: "hub-deep-scan-action",
		children: [/* @__PURE__ */ (0, H.jsx)("span", { children: e.label || e.hostname || e.ip }), /* @__PURE__ */ (0, H.jsx)("button", {
			disabled: !!t.busy || !!n,
			onClick: () => {
				t.start(e);
			},
			"aria-label": `Deep scan ${e.ip}`,
			children: n?.status === "running" ? "Running" : n ? "Queued" : t.busy === e.hostId ? "…" : "Run"
		})]
	});
}
function Nc({ run: e, project: t, scans: n }) {
	let [r, i] = (0, C.useState)(!1), [a, o] = (0, C.useState)(null), [s, c] = (0, C.useState)("");
	(0, C.useEffect)(() => {
		let n = !0;
		return o(null), c(""), r && e.summary_omitted && Vs(t.id, e.id).then((e) => {
			n && o(e);
		}).catch((e) => {
			n && c(String(e));
		}), () => {
			n = !1;
		};
	}, [
		t.id,
		e.id,
		e.status,
		e.summary_omitted,
		e.profile_path,
		r
	]);
	let l = ["queued", "running"].includes(e.status), u = kc(a?.summary ?? e.summary), d = kc(u.classification), f = [kc(d.primary), ...Ac(d.alternatives)].filter((e) => e.device_type), p = `${t.folder}/${String(e.directory)}`, m = e.profile_path;
	return /* @__PURE__ */ (0, H.jsxs)("article", {
		className: `hub-scan-card${l ? " hub-scan-active" : ""}`,
		"data-scan-id": e.id,
		children: [
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-scan-heading",
				children: [
					/* @__PURE__ */ (0, H.jsx)("span", { children: e.target_ip }),
					/* @__PURE__ */ (0, H.jsx)("small", { children: e.status }),
					l ? /* @__PURE__ */ (0, H.jsx)("button", {
						disabled: e.settling,
						onClick: () => {
							n.cancel(e);
						},
						children: e.settling ? "Saving…" : "Stop"
					}) : !!(m || e.log_path) && /* @__PURE__ */ (0, H.jsx)("a", {
						href: Bs(t.id, `${t.folder}/${m || String(e.log_path)}`),
						target: "_blank",
						rel: "noopener",
						children: "Open"
					})
				]
			}),
			e.reason && /* @__PURE__ */ (0, H.jsx)("p", {
				className: "hub-error",
				children: e.reason
			}),
			!l && /* @__PURE__ */ (0, H.jsxs)("details", {
				onToggle: (e) => i(e.currentTarget.open),
				children: [
					/* @__PURE__ */ (0, H.jsx)("summary", { children: "Results" }),
					s && /* @__PURE__ */ (0, H.jsx)("p", {
						className: "hub-error",
						children: s
					}),
					r && e.summary_omitted && !a && !s && /* @__PURE__ */ (0, H.jsx)("small", { children: "Loading results…" }),
					typeof a?.implementation_audit_path == "string" && /* @__PURE__ */ (0, H.jsx)("a", {
						href: Bs(t.id, `${t.folder}/${a.implementation_audit_path}`),
						target: "_blank",
						rel: "noopener",
						children: "Tool identity audit"
					}),
					f.length > 0 && /* @__PURE__ */ (0, H.jsxs)("div", {
						className: "hub-scan-observations",
						children: [/* @__PURE__ */ (0, H.jsx)("span", { children: "Role hypotheses" }), f.map((e, t) => /* @__PURE__ */ (0, H.jsxs)("small", {
							title: jc(e.explanation),
							children: [
								jc(e.device_type),
								" · ",
								jc(e.score),
								" · ",
								jc(e.confidence)
							]
						}, t))]
					}),
					Ac(u.services).map((e, t) => /* @__PURE__ */ (0, H.jsxs)("small", {
						className: "hub-scan-observation",
						children: [
							jc(e.port),
							"/",
							jc(e.protocol),
							" · ",
							jc(e.state),
							" · ",
							jc(kc(e.fingerprint).product) || jc(kc(e.fingerprint).name)
						]
					}, t)),
					["candidates", "reproduced"].map((e) => Ac(u[e]).map((t, n) => /* @__PURE__ */ (0, H.jsxs)("small", {
						className: "hub-scan-observation",
						children: [
							e === "candidates" ? "Candidate" : "Reproduced",
							" · ",
							jc(t.title) || jc(t.type) || jc(t.template_id) || jc(t.explanation)
						]
					}, `${e}-${n}`))),
					Ac(u.problems).map((e, t) => /* @__PURE__ */ (0, H.jsxs)("small", {
						className: "hub-error hub-scan-observation",
						children: [
							jc(e.tool),
							" · ",
							jc(e.status),
							" · ",
							jc(e.reason) || jc(e.parse_error)
						]
					}, t)),
					Ac(u.artifacts).map((e, n) => /* @__PURE__ */ (0, H.jsx)("a", {
						className: "hub-scan-evidence",
						href: Bs(t.id, `${p}/profile/${jc(e.path)}`),
						target: "_blank",
						rel: "noopener",
						children: jc(e.path).replace(/^raw\//, "")
					}, n))
				]
			})
		]
	});
}
// src/hub/reader/BackgroundPanel.tsx
function Pc({ view: e, controller: t }) {
	let n = e?.status, r = n?.running ? "Stop" : "Start";
	return /* @__PURE__ */ (0, H.jsx)("div", {
		className: "hub-background-control",
		children: /* @__PURE__ */ (0, H.jsx)("button", {
			id: "hub-background-toggle",
			"data-action": r.toLowerCase(),
			"aria-label": `${r} background jobs for ${e?.label || "workspace"}`,
			"aria-pressed": n?.running || !1,
			"aria-busy": e?.busy || !1,
			title: n?.worker.available ? n.pause_semantics : "Reader unavailable",
			disabled: !n || e?.busy || !!e?.error || !n.running && !n.worker.available,
			onClick: () => {
				e && n && t.setRunning(!n.running, e.id);
			},
			children: r
		})
	});
}
function Fc({ id: e, label: t, count: n, expanded: r = !1, children: i }) {
	let [a, o] = (0, C.useState)(() => ic(`reader-group:${e}`, r));
	return /* @__PURE__ */ (0, H.jsxs)("details", {
		id: e,
		className: "hub-reader-group",
		open: a,
		onToggle: (t) => {
			let n = t.currentTarget.open;
			n !== a && (o(n), ac(`reader-group:${e}`, n));
		},
		children: [/* @__PURE__ */ (0, H.jsxs)("summary", { children: [t, /* @__PURE__ */ (0, H.jsx)("span", { children: n })] }), i]
	});
}
function Ic({ alert: e, view: t, controller: n, history: r = !1 }) {
	let i = e.id.startsWith("hash-") ? "Hash" : "Cipher";
	return /* @__PURE__ */ (0, H.jsxs)("article", {
		className: "hub-result-alert",
		"data-result-id": e.id,
		children: [/* @__PURE__ */ (0, H.jsxs)("div", {
			className: "hub-result-copy",
			children: [/* @__PURE__ */ (0, H.jsx)("div", {
				className: "hub-result-title",
				title: e.result_path,
				children: e.display_name || e.result_path.split("/").pop()
			}), /* @__PURE__ */ (0, H.jsxs)("small", { children: [
				r ? e.history_reason || i : e.transformations.map((e) => e.replace(/^hypothesis:/, "")).join(", ") || i,
				" · ",
				e.size < 1024 ? `${e.size} B` : `${Math.ceil(e.size / 1024)} KB`
			] })]
		}), /* @__PURE__ */ (0, H.jsxs)("div", {
			className: "hub-result-actions",
			children: [/* @__PURE__ */ (0, H.jsx)("a", {
				href: Is(t.id, e.id),
				target: "_blank",
				rel: "noopener",
				title: "Open in a separate editor",
				children: "Open"
			}), !r && /* @__PURE__ */ (0, H.jsx)("button", {
				disabled: t.dismissing.includes(e.id),
				onClick: () => {
					n.dismiss(e.id, t.id);
				},
				"aria-label": `Dismiss ${e.display_name || e.result_path.split("/").pop()}`,
				children: "×"
			})]
		})]
	});
}
function Lc({ view: e, controller: t, header: n, scans: r, project: i, targets: a = [], target: o }) {
	let s = e?.status?.alerts || [], c = e?.status?.history || [], l = r?.runs.filter((e) => !o || e.host_id === o.hostId) || [], u = l.filter((e) => ["queued", "running"].includes(e.status)), d = l.filter((e) => !["queued", "running"].includes(e.status));
	return /* @__PURE__ */ (0, H.jsxs)("aside", {
		className: "hub-background-panel",
		"aria-label": "Workspace working and results",
		children: [
			n,
			e?.error && /* @__PURE__ */ (0, H.jsx)("p", {
				className: "hub-error",
				role: "alert",
				children: e.error
			}),
			r?.error && /* @__PURE__ */ (0, H.jsx)("p", {
				className: "hub-error",
				role: "alert",
				children: r.error
			}),
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "hub-result-alerts",
				"aria-label": "Result alerts",
				children: [
					/* @__PURE__ */ (0, H.jsx)(Fc, {
						id: "hub-cyber-kill-chain",
						label: "Cyber Kill Chain",
						count: 0,
						children: null
					}, `${e?.id}-kill-chain`),
					["Hash", "Cipher"].map((n) => {
						let r = s.filter((e) => (e.id.startsWith("hash-") ? "Hash" : "Cipher") === n);
						return /* @__PURE__ */ (0, H.jsx)(Fc, {
							id: `hub-reader-${n.toLowerCase()}`,
							label: n,
							count: r.length,
							expanded: !0,
							children: e && r.map((n) => /* @__PURE__ */ (0, H.jsx)(Ic, {
								alert: n,
								view: e,
								controller: t
							}, n.id))
						}, `${e?.id}-${n}`);
					}),
					o && r && /* @__PURE__ */ (0, H.jsx)("div", {
						className: "hub-selected-deep-scan",
						children: /* @__PURE__ */ (0, H.jsx)(Mc, {
							node: {
								...o,
								label: "Deep scan"
							},
							scans: r
						})
					})
				]
			}),
			/* @__PURE__ */ (0, H.jsxs)(Fc, {
				id: "hub-background-working",
				label: "Working",
				count: (e?.status?.working.length || 0) + u.length,
				expanded: !0,
				children: [e?.status?.working.map((e) => /* @__PURE__ */ (0, H.jsxs)("div", {
					className: "hub-background-job",
					children: [/* @__PURE__ */ (0, H.jsx)("span", { children: e.tool === "cipher" ? "Cipher" : "Hash" }), /* @__PURE__ */ (0, H.jsx)("small", { children: e.state })]
				}, `${e.tool}-${e.id}`)), r && i && u.map((e) => /* @__PURE__ */ (0, H.jsx)(Nc, {
					run: e,
					project: i,
					scans: r
				}, e.id))]
			}, `${e?.id}-working`),
			!o && r && /* @__PURE__ */ (0, H.jsx)(Fc, {
				id: "hub-deep-scan",
				label: "Deep scan",
				count: a.length,
				children: a.map((e) => /* @__PURE__ */ (0, H.jsx)(Mc, {
					node: e,
					scans: r
				}, e.id))
			}, `${e?.id}-deep-scan`),
			/* @__PURE__ */ (0, H.jsxs)(Fc, {
				id: "hub-background-history",
				label: "History",
				count: c.length + d.length,
				children: [r && i && d.map((e) => /* @__PURE__ */ (0, H.jsx)(Nc, {
					run: e,
					project: i,
					scans: r
				}, e.id)), e && c.map((n) => /* @__PURE__ */ (0, H.jsx)(Ic, {
					alert: n,
					view: e,
					controller: t,
					history: !0
				}, n.id))]
			}, `${e?.id}-history`)
		]
	});
}
// src/hub/scanner/useDeepScans.ts
function Rc(e) {
	let [t, n] = (0, C.useState)([]), [r, i] = (0, C.useState)(""), [a, o] = (0, C.useState)(null), s = (0, C.useRef)(e?.id);
	s.current = e?.id;
	let c = (0, C.useRef)(async () => {});
	(0, C.useEffect)(() => {
		let t = !0, r = !1;
		n([]), i(""), o(null);
		async function a() {
			if (e && !r) {
				r = !0;
				try {
					let r = await Ls(e.id);
					t && (n(r.runs), i(""));
				} catch (e) {
					t && i(e instanceof Error ? e.message : String(e));
				} finally {
					r = !1;
				}
			}
		}
		c.current = a, a();
		let s = setInterval(() => {
			a();
		}, 2e3);
		return () => {
			t = !1, clearInterval(s);
		};
	}, [e?.id]);
	async function l(t) {
		if (!e || !t.hostId || a) return;
		let n = e.id;
		o(t.hostId), i("");
		try {
			let e = await us(n);
			await Rs(n, {
				host_id: t.hostId,
				target_ip: t.ip,
				expected_revision: e.revision
			}), s.current === n && await c.current();
		} catch (e) {
			s.current === n && i(e instanceof Error ? e.message : String(e));
		} finally {
			s.current === n && o(null);
		}
	}
	async function u(t) {
		if (!t.job_id) return;
		let n = e?.id;
		try {
			await zs(t.job_id), s.current === n && await c.current();
		} catch (e) {
			s.current === n && i(e instanceof Error ? e.message : String(e));
		}
	}
	return {
		runs: t,
		error: r,
		busy: a,
		start: l,
		cancel: u
	};
}
// src/hub/ProjectHub.tsx
var zc = (e) => e instanceof Error ? e.message : String(e);
function Bc() {
	let e = Us(), t = (e) => e instanceof Element && !e.closest("button,input,select,a,[role=\"button\"]"), n = (n) => {
		n.button === 0 && t(n.target) && e?.startMove();
	}, r = (n) => {
		t(n.target) && e?.toggleMaximize();
	}, [i, a] = (0, C.useState)([]), [o, s] = (0, C.useState)(null), [c, l] = (0, C.useState)(null), [u, d] = (0, C.useState)("home"), f = Oc(c, Ae), p = Rc(c), [m, h] = (0, C.useState)(""), [g, _] = (0, C.useState)(null), [v, y] = (0, C.useState)(""), [b, x] = (0, C.useState)(""), [S, ee] = (0, C.useState)("Ready"), [w, T] = (0, C.useState)(!1), [E, te] = (0, C.useState)(!1), [ne, re] = (0, C.useState)(!1), [ie, ae] = (0, C.useState)(0), [oe, se] = (0, C.useState)(""), [ce, le] = (0, C.useState)(), [ue, de] = (0, C.useState)(document.body.classList.contains("colorful-background")), [D, fe] = (0, C.useState)(null), [O, pe] = (0, C.useState)(() => ic("sidebarCollapsed", !1) === !0), { width: me, resize: k } = sc(), he = Cc(), ge = cc(), [_e, A] = (0, C.useState)(null), ve = (0, C.useCallback)((e) => A(c ? {
		projectId: c.id,
		node: e
	} : null), [c?.id]);
	(0, C.useEffect)(() => A(null), [c?.id, u]);
	let ye = (0, C.useRef)(!1), j = (0, C.useRef)(0), M = (0, C.useRef)(0), be = (0, C.useRef)(!1), xe = (0, C.useRef)(null), Se = (0, C.useRef)("project"), Ce = (0, C.useRef)(void 0);
	async function we() {
		let e = ++M.current, t = await ms();
		return e === M.current && a(t), t;
	}
	async function N(e, t = !1) {
		if (ye.current) throw Error("A project operation is already running.");
		let n = ++j.current;
		ye.current = !0, T(!0), x("");
		try {
			let r = await e();
			return await we(), he.refresh(), n === j.current && (l(r.project), t || d("project"), ee("Ready")), r;
		} catch (e) {
			throw n === j.current && x(zc(e)), e;
		} finally {
			ye.current = !1, T(!1);
		}
	}
	function Te(e) {
		e.catch(() => {});
	}
	(0, C.useEffect)(() => {
		let e = !0;
		return we().then(async (t) => {
			let n = ic("hubNavigation", null);
			if (!e || j.current || !n) return;
			let r = n.setupOrigin;
			r && [
				"home",
				"project",
				"project-setup",
				"part",
				"files"
			].includes(r.page) && (r.page !== "part" || r.part && Ys[r.part]) && (Ce.current = r);
			let i = t.find((e) => e.id === n.project);
			if (i) {
				if (await N(() => vs(i.id)), !e || j.current !== 1) return;
				n.page === "setup" && d("setup"), n.page === "project-setup" && d("project-setup"), n.page === "part" && n.part && Ys[n.part] && (se(n.part), le(n.host), d("part"));
			} else n.page === "setup" && !n.project && d("setup");
		}).catch((t) => {
			e && x(zc(t));
		}).finally(() => {
			e && re(!0);
		}), hs().then(s).catch((t) => {
			e && x(zc(t));
		}), () => {
			e = !1;
		};
	}, []), (0, C.useEffect)(() => {
		ne && ac("hubNavigation", {
			project: c?.id,
			page: u,
			part: oe,
			host: ce,
			setupOrigin: Ce.current
		});
	}, [
		ne,
		c?.id,
		u,
		oe,
		ce
	]), (0, C.useEffect)(() => {
		ac("sidebarCollapsed", O), be.current && (be.current = !1, document.getElementById(O ? "hub-sidebar-reopen" : "hub-sidebar-toggle")?.focus());
	}, [O]), (0, C.useEffect)(() => {
		let e = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && (e.preventDefault(), e.stopImmediatePropagation(), te((e) => !e)), (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && c && !g && !E && (e.preventDefault(), e.stopImmediatePropagation(), e.shiftKey ? Me("save-as", `${c.name} copy`) : Te(F(c))), c && !g && !E && !D && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing && !(e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable]:not([contenteditable=\"false\"]),[role=\"dialog\"],[role=\"menu\"]")) && (u === "project" || u === "files" || u === "part" && oe === "services")) {
				let t = e.key.toLowerCase();
				[
					"q",
					"w",
					"e"
				].includes(t) && (e.preventDefault(), t === "q" && De(), t === "w" && Ne("services"), t === "e" && ke());
			}
		};
		return document.addEventListener("keydown", e, !0), () => document.removeEventListener("keydown", e, !0);
	}, [
		c,
		g,
		E,
		D,
		u,
		oe
	]);
	function Ee() {
		j.current++, d("home"), l(null), x(""), fe(null);
	}
	function P() {
		if (j.current++, x(""), u === "setup") {
			let e = Ce.current;
			se(e?.part || ""), le(e?.host), Se.current = e?.panelReturn || (c ? "project" : "home"), d((e?.page === "project" || e?.page === "project-setup") && !c ? "home" : e?.page || (c ? "project" : "home"));
		} else Ce.current = {
			page: u,
			part: oe,
			host: ce,
			panelReturn: Se.current
		}, d("setup");
	}
	function De() {
		j.current++, d("project"), x("");
	}
	function Oe() {
		j.current++, d("project-setup"), x("");
	}
	function ke() {
		c && window.open(Fs(c.id), "_blank", "noopener");
	}
	function Ae(e) {
		c && window.open(Is(c.id, e), "_blank", "noopener");
	}
	function je(e) {
		be.current = !0, pe(e);
	}
	function Me(e, t = "") {
		fe(null), x(""), y(t), _(e);
	}
	function Ne(e, t) {
		j.current++, u !== "part" && (Se.current = u), se(e), le(t), d("part"), x("");
	}
	function Pe() {
		d(Se.current), he.refresh();
	}
	function Fe(e) {
		document.body.classList.toggle("colorful-background", e), de(e);
	}
	async function Ie(e) {
		c?.id !== e.id && await N(() => vs(e.id));
	}
	async function F(e) {
		await Ie(e), await N(() => Ts(e.id), !0), ee("Saved");
	}
	async function I(e) {
		c && await N(() => ws(c.id, e), !0);
	}
	function L(e, t) {
		if ("key" in e && e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
		e.preventDefault();
		let n = e.currentTarget.getBoundingClientRect();
		fe({
			project: t,
			x: "clientX" in e ? e.clientX : n.left,
			y: "clientY" in e ? e.clientY : n.bottom
		});
	}
	async function R() {
		if (v.trim() && !w) try {
			g === "open" ? await N(() => Ds(v.trim())) : g === "save-as" && c ? await N(() => Es(c.id, v.trim())) : await N(() => _s(v.trim())), _(null);
		} catch {}
	}
	async function z(e, t) {
		try {
			if (await Ie(e), t === "rename" && (pe(!1), ae((e) => e + 1)), t === "save" && await F(e), t === "save-as" && Me("save-as", `${e.name} copy`), t === "details" && Me("details"), t === "export") {
				let t = document.createElement("a");
				t.href = ks(e.id), t.download = "", t.click();
			}
		} catch (e) {
			x(zc(e));
		}
	}
	let Le = i.filter((e) => e.name.toLowerCase().includes(m.toLowerCase())), Re = [
		...i.map((e) => ({
			id: `project-${e.id}`,
			label: e.name,
			detail: "Project",
			run: () => Te(N(() => vs(e.id)))
		})),
		{
			id: "home",
			label: "Projects",
			detail: "View",
			run: Ee
		},
		{
			id: "setup",
			label: "Setup",
			detail: "View",
			run: P
		},
		{
			id: "create",
			label: "New project",
			detail: "Action",
			run: () => Me("create")
		},
		{
			id: "open",
			label: "Open project",
			detail: "Action",
			run: () => Me("open")
		},
		{
			id: "restore",
			label: "Restore ZIP",
			detail: "Action",
			run: () => xe.current?.click()
		},
		...Object.entries(Ks).map(([e, t]) => ({
			id: e,
			label: t,
			detail: "Settings",
			run: () => Ne(e)
		}))
	];
	if (c) {
		Re.push({
			id: "overview",
			label: "Overview",
			detail: "View",
			run: De
		}), Re.push({
			id: "project-setup",
			label: "Project setup",
			detail: "View",
			run: Oe
		}), Re.push({
			id: "files",
			label: "Files",
			detail: "View",
			run: () => ke()
		});
		for (let [e, t] of Object.entries({
			...qs,
			...Js
		})) Re.push({
			id: e,
			label: t,
			detail: qs[e] ? "View" : "Action",
			run: () => Ne(e)
		});
		for (let [e, t] of Object.entries({
			rename: "Rename project",
			save: "Save project",
			"save-as": "Save project as",
			export: "Export ZIP",
			details: "Workspace details"
		})) Re.push({
			id: e,
			label: t,
			detail: "Action",
			run: () => Te(z(c, e))
		});
		let e = he.snapshot?.hosts;
		if (Array.isArray(e)) for (let t of e) t && typeof t == "object" && "id" in t && "ip" in t && Re.push({
			id: `host-${t.id}`,
			label: `${t.ip} ${"hostname" in t && t.hostname || ""}`.trim(),
			detail: "Host",
			run: () => Ne("hosts", Number(t.id))
		});
	}
	let B = he.snapshot?.jobs?.filter((e) => e.status === "running" || e.status === "queued") || [], V = document.getElementById("project-hub-root")?.dataset, ze = he.snapshot?.project.name === c?.path ? he.snapshot?.project : null, Be = D ? Object.entries({
		rename: "Rename project",
		save: "Save",
		"save-as": "Save as…",
		export: "Export ZIP",
		details: "Workspace details"
	}).map(([e, t]) => ({
		label: t,
		disabled: w,
		run: () => Te(z(D.project, e))
	})) : [], Ve = u === "setup" ? "Setup" : u === "project-setup" ? "Project setup" : u === "files" ? "Files" : u === "part" ? Ys[oe] : "Overview", He = u === "project" && _e && _e.projectId === c?.id && _e.node?.kind === "host" ? _e.node : null, Ue = c ? fc(c, he.snapshot, o, null).nodes.filter((e) => e.kind === "host") : [], We = c && [
		"project",
		"project-setup",
		"files"
	].includes(u);
	return /* @__PURE__ */ (0, H.jsxs)("div", {
		className: `hub-app${O ? " hub-collapsed" : ""}${e ? " hub-desktop" : ""}`,
		style: {
			"--hub-sidebar-width": `${me}px`,
			"--hub-actions-width": `${ge.width}px`
		},
		children: [
			ue && /* @__PURE__ */ (0, H.jsx)("div", {
				className: "logo-watermark",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, H.jsx)("pre", { children: window.LEGION_CONSOLE_LOGO_ART || "" })
			}),
			/* @__PURE__ */ (0, H.jsxs)("aside", {
				id: "hub-sidebar",
				className: "hub-sidebar",
				"aria-label": "Projects",
				hidden: O,
				children: [
					/* @__PURE__ */ (0, H.jsxs)("div", {
						className: "hub-brand-row",
						onPointerDown: n,
						onDoubleClick: r,
						children: [/* @__PURE__ */ (0, H.jsxs)("button", {
							className: "hub-brand",
							onClick: Ee,
							children: [/* @__PURE__ */ (0, H.jsx)("span", {
								className: "hub-logo",
								"aria-hidden": "true",
								children: "F"
							}), "FlagHop"]
						}), /* @__PURE__ */ (0, H.jsx)("button", {
							id: "hub-sidebar-toggle",
							className: "hub-sidebar-toggle",
							"aria-label": "Collapse sidebar",
							title: "Collapse sidebar",
							"aria-controls": "hub-sidebar",
							"aria-expanded": !O,
							onClick: () => je(!0),
							children: /* @__PURE__ */ (0, H.jsx)(Hs, { kind: "left" })
						})]
					}),
					c ? /* @__PURE__ */ (0, H.jsxs)("div", {
						className: "hub-project-context",
						children: [
							/* @__PURE__ */ (0, H.jsxs)("div", {
								className: "hub-project-heading",
								onContextMenu: (e) => L(e, c),
								onKeyDown: (e) => L(e, c),
								tabIndex: 0,
								"aria-label": `${c.name} project actions`,
								children: [/* @__PURE__ */ (0, H.jsx)("span", {
									className: "hub-avatar",
									"aria-hidden": "true",
									children: "FH"
								}), /* @__PURE__ */ (0, H.jsx)(Gs, {
									name: c.name,
									onRename: I,
									request: ie,
									doubleClick: !0
								}, c.id)]
							}),
							/* @__PURE__ */ (0, H.jsxs)("button", {
								className: "hub-search",
								onClick: () => te(!0),
								children: [
									/* @__PURE__ */ (0, H.jsx)(Hs, { kind: "search" }),
									/* @__PURE__ */ (0, H.jsx)("span", { children: "Search workspace" }),
									/* @__PURE__ */ (0, H.jsx)("kbd", { children: "Ctrl K" })
								]
							}),
							/* @__PURE__ */ (0, H.jsxs)("nav", {
								"aria-label": `${c.name} tabs`,
								children: [
									/* @__PURE__ */ (0, H.jsxs)("button", {
										className: "hub-overview-tab",
										"aria-current": u === "project" ? "page" : void 0,
										onClick: De,
										children: [/* @__PURE__ */ (0, H.jsx)(Hs, { kind: "home" }), "Overview"]
									}),
									/* @__PURE__ */ (0, H.jsxs)("button", {
										className: "hub-overview-tab hub-project-setup-tab",
										"aria-current": u === "project-setup" ? "page" : void 0,
										onClick: Oe,
										children: [/* @__PURE__ */ (0, H.jsx)(Hs, { kind: "gear" }), "Project setup"]
									}),
									/* @__PURE__ */ (0, H.jsxs)("button", {
										className: "hub-overview-tab",
										"aria-current": u === "files" ? "page" : void 0,
										onClick: () => ke(),
										children: [/* @__PURE__ */ (0, H.jsx)(Hs, { kind: "file" }), "Files"]
									})
								]
							})
						]
					}) : /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
						/* @__PURE__ */ (0, H.jsxs)("label", {
							className: "hub-search",
							children: [
								/* @__PURE__ */ (0, H.jsx)(Hs, { kind: "search" }),
								/* @__PURE__ */ (0, H.jsx)("input", {
									id: "hub-search",
									"aria-label": "Search projects",
									placeholder: "Search projects",
									value: m,
									onChange: (e) => h(e.target.value)
								}),
								/* @__PURE__ */ (0, H.jsx)("button", {
									"aria-label": "Search workspace",
									onClick: () => te(!0),
									children: /* @__PURE__ */ (0, H.jsx)("kbd", { children: "Ctrl K" })
								})
							]
						}),
						/* @__PURE__ */ (0, H.jsxs)("div", {
							className: "hub-section-label",
							children: [/* @__PURE__ */ (0, H.jsx)("span", { children: "Projects" }), /* @__PURE__ */ (0, H.jsx)("button", {
								id: "hub-new-project",
								"aria-label": "New project",
								disabled: w,
								onClick: () => Me("create"),
								children: "+"
							})]
						}),
						/* @__PURE__ */ (0, H.jsx)("div", {
							className: "hub-projects",
							children: Le.map((e) => /* @__PURE__ */ (0, H.jsxs)("button", {
								className: "hub-project",
								"data-hub-project": e.id,
								disabled: w,
								onContextMenu: (t) => L(t, e),
								onKeyDown: (t) => L(t, e),
								onClick: () => Te(N(() => vs(e.id))),
								children: [/* @__PURE__ */ (0, H.jsx)("span", {
									className: "hub-avatar",
									"aria-hidden": "true",
									children: "FH"
								}), /* @__PURE__ */ (0, H.jsx)("span", { children: e.name })]
							}, e.id))
						})
					] }),
					/* @__PURE__ */ (0, H.jsxs)("button", {
						id: "hub-setup",
						className: "hub-setup needs-setup",
						onClick: P,
						"aria-label": "Setup — VPN not configured",
						"aria-current": u === "setup" ? "page" : void 0,
						children: [
							/* @__PURE__ */ (0, H.jsx)(Hs, { kind: "gear" }),
							/* @__PURE__ */ (0, H.jsx)("span", { children: "Setup" }),
							/* @__PURE__ */ (0, H.jsx)("span", { className: "hub-dot" })
						]
					}),
					/* @__PURE__ */ (0, H.jsx)("div", {
						className: "hub-resizer",
						role: "separator",
						"aria-label": "Resize sidebar",
						"aria-orientation": "vertical",
						"aria-valuemin": 210,
						"aria-valuemax": 340,
						"aria-valuenow": me,
						tabIndex: 0,
						...k
					})
				]
			}),
			/* @__PURE__ */ (0, H.jsxs)("main", {
				className: "hub-main",
				children: [
					/* @__PURE__ */ (0, H.jsxs)("header", {
						className: "hub-header",
						onPointerDown: n,
						onDoubleClick: r,
						children: [
							O && /* @__PURE__ */ (0, H.jsx)("button", {
								id: "hub-sidebar-reopen",
								className: "hub-sidebar-toggle",
								"aria-label": "Show sidebar",
								title: "Show sidebar",
								"aria-controls": "hub-sidebar",
								"aria-expanded": "false",
								onClick: () => je(!1),
								children: /* @__PURE__ */ (0, H.jsx)(Hs, { kind: "right" })
							}),
							O && /* @__PURE__ */ (0, H.jsx)("button", {
								className: "hub-collapsed-brand",
								onClick: Ee,
								children: "FlagHop"
							}),
							c ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
								/* @__PURE__ */ (0, H.jsx)("span", {
									className: "hub-avatar",
									"aria-hidden": "true",
									children: "FH"
								}),
								/* @__PURE__ */ (0, H.jsx)(Gs, {
									name: c.name,
									onRename: I
								}, c.id),
								/* @__PURE__ */ (0, H.jsx)("span", {
									className: "hub-divider",
									children: "/"
								}),
								/* @__PURE__ */ (0, H.jsx)("span", { children: Ve })
							] }) : /* @__PURE__ */ (0, H.jsx)("span", { children: u === "setup" || u === "part" ? Ve : "Projects" }),
							c && /* @__PURE__ */ (0, H.jsx)(Pc, { ...f }),
							/* @__PURE__ */ (0, H.jsx)("button", {
								className: "hub-header-details",
								"aria-label": "Workspace details",
								title: "Workspace details",
								onClick: () => Me("details"),
								children: "ⓘ"
							}),
							e && /* @__PURE__ */ (0, H.jsx)(Ws, { desktop: e })
						]
					}),
					b && !g && /* @__PURE__ */ (0, H.jsx)("p", {
						className: "hub-error",
						role: "alert",
						children: b
					}),
					/* @__PURE__ */ (0, H.jsxs)("div", {
						className: "hub-workspace-body",
						children: [/* @__PURE__ */ (0, H.jsxs)("div", {
							className: `hub-content${u === "part" ? " hub-content-part" : ""}${u === "project" || u === "project-setup" ? " hub-content-project" : ""}${u === "project" ? " hub-content-hardware" : ""}${u === "files" ? " hub-content-files" : ""}`,
							children: [
								u === "home" && /* @__PURE__ */ (0, H.jsxs)("section", {
									className: "hub-home",
									"aria-label": "Project home",
									children: [
										/* @__PURE__ */ (0, H.jsx)("span", {
											className: "hub-home-mark",
											children: "F"
										}),
										/* @__PURE__ */ (0, H.jsx)("h1", { children: "Projects" }),
										/* @__PURE__ */ (0, H.jsx)("div", {
											className: "hub-home-list",
											children: Le.map((e) => /* @__PURE__ */ (0, H.jsxs)("button", {
												disabled: w,
												onContextMenu: (t) => L(t, e),
												onKeyDown: (t) => L(t, e),
												onClick: () => Te(N(() => vs(e.id))),
												children: [/* @__PURE__ */ (0, H.jsx)("span", {
													className: "hub-avatar",
													"aria-hidden": "true",
													children: "FH"
												}), /* @__PURE__ */ (0, H.jsx)("span", { children: e.name })]
											}, e.id))
										}),
										/* @__PURE__ */ (0, H.jsxs)("div", {
											className: "hub-home-actions",
											children: [
												/* @__PURE__ */ (0, H.jsx)("button", {
													className: "hub-create-link",
													disabled: w,
													onClick: () => Me("create"),
													children: "+ New project"
												}),
												/* @__PURE__ */ (0, H.jsx)("button", {
													disabled: w,
													onClick: () => Me("open"),
													children: "Open project"
												}),
												/* @__PURE__ */ (0, H.jsx)("button", {
													disabled: w,
													onClick: () => xe.current?.click(),
													children: "Restore ZIP"
												})
											]
										})
									]
								}),
								u === "project" && c && /* @__PURE__ */ (0, H.jsx)(vc, {
									project: c,
									snapshot: he.snapshot,
									settings: o,
									onSelect: ve,
									onOpen: (e) => Ne("hosts", e),
									onSetup: Oe,
									onServices: () => Ne("services"),
									onFiles: () => ke()
								}, c.id),
								u === "project-setup" && c && /* @__PURE__ */ (0, H.jsx)(yc, {
									project: c,
									onChange: (e) => l((t) => t?.id === e.id ? e : t)
								}, c.id),
								u === "setup" && /* @__PURE__ */ (0, H.jsx)(bc, {
									settings: o,
									openPart: Ne,
									onSettingsChange: s
								}),
								u === "part" && /* @__PURE__ */ (0, H.jsx)(Xs, {
									part: oe,
									host: ce,
									close: Pe,
									displayChanged: Fe,
									statusChanged: ee
								})
							]
						}), We && /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)("div", {
							className: "hub-actions-resizer",
							role: "separator",
							"aria-label": "Resize action panel",
							"aria-orientation": "vertical",
							"aria-valuemin": 280,
							"aria-valuemax": 480,
							"aria-valuenow": ge.width,
							tabIndex: 0,
							...ge.resize
						}), /* @__PURE__ */ (0, H.jsx)(Lc, {
							...f,
							scans: p,
							project: c,
							targets: Ue,
							target: He,
							header: He && /* @__PURE__ */ (0, H.jsxs)("div", {
								className: "hardware-context",
								"aria-label": "Selected device",
								children: [/* @__PURE__ */ (0, H.jsxs)("div", { children: [
									He.ip && /* @__PURE__ */ (0, H.jsx)("span", { children: He.ip }),
									He.hostname && /* @__PURE__ */ (0, H.jsx)("small", { children: He.hostname }),
									He.os && /* @__PURE__ */ (0, H.jsx)("small", { children: He.os })
								] }), /* @__PURE__ */ (0, H.jsx)("button", {
									onClick: () => Ne("hosts", He.hostId),
									children: "Details"
								})]
							})
						})] })]
					}),
					/* @__PURE__ */ (0, H.jsx)("span", {
						className: "hub-status-announcement",
						role: "status",
						children: w ? "Working…" : S
					})
				]
			}),
			e && !e.maximized && /* @__PURE__ */ (0, H.jsx)("div", {
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
				].map((t) => /* @__PURE__ */ (0, H.jsx)("div", {
					"data-window-edge": t,
					onPointerDown: (n) => {
						n.button === 0 && (n.preventDefault(), e.resizeEdge(t));
					}
				}, t))
			}),
			/* @__PURE__ */ (0, H.jsx)("input", {
				ref: xe,
				type: "file",
				accept: ".zip,application/zip",
				hidden: !0,
				"aria-label": "Restore workspace ZIP",
				onChange: (e) => {
					let t = e.target.files?.[0];
					t && Te(N(() => Os(t))), e.target.value = "";
				}
			}),
			D && /* @__PURE__ */ (0, H.jsx)(rc, {
				items: Be,
				x: D.x,
				y: D.y,
				close: () => fe(null)
			}),
			E && /* @__PURE__ */ (0, H.jsx)(Sc, {
				commands: Re,
				close: () => te(!1)
			}),
			g && /* @__PURE__ */ (0, H.jsx)(xc, {
				title: g === "create" ? "New project" : g === "save-as" ? "Save project as" : g === "open" ? "Open project" : "Workspace details",
				close: () => {
					w || _(null);
				},
				children: g === "details" ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)("dl", {
					className: "hub-details",
					children: Object.entries({
						Project: c?.name,
						File: c?.path,
						Folder: c?.folder,
						Output: ze?.output_folder,
						Running: ze?.running_folder,
						Autosave: ze?.autosave?.last_saved_at || "—",
						"Autosave error": ze?.autosave?.last_error || "—",
						Status: w ? "Working…" : S,
						"Running / queued jobs": String(B.length),
						Connection: he.connection,
						Version: V?.version,
						Bind: V?.bind || "Localhost only",
						Authentication: V?.auth || "No auth"
					}).map(([e, t]) => /* @__PURE__ */ (0, H.jsxs)("div", { children: [/* @__PURE__ */ (0, H.jsx)("dt", { children: e }), /* @__PURE__ */ (0, H.jsx)("dd", { children: t || "—" })] }, e))
				}), /* @__PURE__ */ (0, H.jsx)("div", {
					className: "hub-modal-actions",
					children: /* @__PURE__ */ (0, H.jsx)("button", {
						onClick: () => _(null),
						children: "Close"
					})
				})] }) : /* @__PURE__ */ (0, H.jsxs)("form", {
					onSubmit: (e) => {
						e.preventDefault(), R();
					},
					children: [
						/* @__PURE__ */ (0, H.jsx)("input", {
							"aria-label": g === "open" ? "Project path" : "Project name",
							maxLength: g === "open" ? void 0 : 120,
							autoComplete: "off",
							value: v,
							disabled: w,
							onChange: (e) => y(e.target.value)
						}),
						b && /* @__PURE__ */ (0, H.jsx)("p", {
							className: "hub-error",
							role: "alert",
							children: b
						}),
						/* @__PURE__ */ (0, H.jsxs)("div", {
							className: "hub-modal-actions",
							children: [/* @__PURE__ */ (0, H.jsx)("button", {
								type: "button",
								disabled: w,
								onClick: () => _(null),
								children: "Cancel"
							}), /* @__PURE__ */ (0, H.jsx)("button", {
								className: "hub-primary",
								disabled: w || !v.trim(),
								children: w ? "Working…" : g === "open" ? "Open" : g === "save-as" ? "Save" : "Create"
							})]
						})
					]
				})
			})
		]
	});
}
// ../app/web/static/js/workspace/scan.js
var Vc;
function Hc(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing scan callback: ${t}`);
	({applySchedulerPreferences: Vc} = e);
}
function Uc(e) {
	return (e || "").split(/[\s,]+/).map((e) => e.trim()).filter((e) => e.length > 0);
}
function Wc() {
	let e = document.querySelector("input[name='nmap-scan-mode']:checked");
	return e ? String(e.value || "rfc1918_discovery") : "rfc1918_discovery";
}
function Gc(e, t = "T3") {
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
function Kc(e, t = 1e3) {
	let n = parseInt(e, 10);
	return Number.isFinite(n) ? Math.min(65535, Math.max(1, n)) : t;
}
function qc() {
	let e = Wc(), t = /* @__PURE__ */ new Set();
	return e === "rfc1918_discovery" ? (R("nmap-rfc-10") && t.add("10.0.0.0/8"), R("nmap-rfc-172") && t.add("172.16.0.0/12"), R("nmap-rfc-192") && t.add("192.168.0.0/16"), Array.from(t)) : (Uc(z("nmap-targets")).forEach((e) => t.add(e)), Array.from(t));
}
function Jc() {
	let e = document.getElementById("nmap-rfc-profile");
	return (e ? String(e.value || "quick").trim().toLowerCase() : "quick") === "comprehensive" ? "comprehensive" : "quick";
}
function Yc(e) {
	return e === "comprehensive" ? _e : ge;
}
function Xc() {
	let e = document.getElementById("nmap-rfc-chunk-concurrency"), t = parseInt(e ? String(e.value || "1").trim() : "1", 10);
	return Number.isFinite(t) ? Math.max(1, Math.min(t, 4)) : 1;
}
function Zc(e) {
	if (e === "easy") {
		let e = Vr(Br());
		return {
			discovery: R("nmap-easy-discovery"),
			skip_dns: R("nmap-easy-skip-dns"),
			force_pn: R("nmap-easy-force-pn"),
			timing: Gc(z("nmap-easy-timing"), "T3"),
			top_ports: e ? 0 : Kc(z("nmap-easy-top-ports"), 1e3),
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
		timing: Gc(z("nmap-hard-timing"), "T4"),
		top_ports: Kc(z("nmap-hard-top-ports"), 1e3),
		service_detection: R("nmap-hard-service-detection"),
		default_scripts: R("nmap-hard-default-scripts"),
		os_detection: R("nmap-hard-os-detection"),
		aggressive: R("nmap-hard-aggressive"),
		full_ports: R("nmap-hard-full-ports"),
		vuln_scripts: R("nmap-hard-vuln-scripts"),
		host_discovery_only: !1,
		arp_ping: !1
	};
	let t = R("nmap-rfc-host-discovery-only"), n = Jc();
	return {
		discovery: R("nmap-rfc-discovery"),
		host_discovery_only: t,
		skip_dns: R("nmap-rfc-skip-dns"),
		arp_ping: R("nmap-rfc-arp-ping"),
		force_pn: !1,
		timing: Gc(z("nmap-rfc-timing"), "T3"),
		top_ports: 0,
		explicit_ports: t ? "" : Yc(n),
		scan_profile: n,
		chunk_concurrency: Xc(),
		service_detection: R("nmap-rfc-service-detection"),
		default_scripts: R("nmap-rfc-default-scripts"),
		os_detection: R("nmap-rfc-os-detection"),
		aggressive: !1,
		full_ports: !1,
		vuln_scripts: !1
	};
}
function Qc() {
	return [
		R("nmap-rfc-10"),
		R("nmap-rfc-172"),
		R("nmap-rfc-192")
	].filter(Boolean).length;
}
function $c(e) {
	[
		"nmap-rfc-10",
		"nmap-rfc-172",
		"nmap-rfc-192"
	].forEach((t) => {
		let n = document.getElementById(t);
		n && (n.disabled = !e);
	});
}
function el(e) {
	e === "rfc1918_discovery" ? (L("nmap-rfc-discovery", !0), L("nmap-rfc-host-discovery-only", !0), L("nmap-rfc-arp-ping", !1), L("nmap-rfc-skip-dns", !0), I("nmap-rfc-timing", "T3"), I("nmap-rfc-profile", "quick"), I("nmap-rfc-chunk-concurrency", "1"), L("nmap-rfc-service-detection", !1), L("nmap-rfc-default-scripts", !1), L("nmap-rfc-os-detection", !1), L("nmap-rfc-force-pn", !1), L("nmap-rfc-10", !0), L("nmap-rfc-172", !0), L("nmap-rfc-192", !0), $c(!0)) : (L("nmap-rfc-10", !1), L("nmap-rfc-172", !1), L("nmap-rfc-192", !1), L("nmap-rfc-force-pn", !1), $c(!1));
}
function tl(e) {
	let t = document.getElementById(e);
	if (!t || t.disabled) return !0;
	let n = String(t.value || "").trim();
	if (!n) return !1;
	let r = parseInt(n, 10);
	return Number.isInteger(r) && r >= 1 && r <= 65535;
}
function nl() {
	let e = Wc();
	if (e === "passive_capture") {
		if (!Hr(Br())) return {
			valid: !1,
			reason: "Passive Capture is available only for internal engagement presets."
		};
		if (!String(z("passive-capture-interface") || "").trim()) return {
			valid: !1,
			reason: "Select a capture interface."
		};
		let e = Ur();
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
	let t = (e === "rfc1918_discovery" ? [] : Uc(z("nmap-targets"))).length > 0, n = e === "rfc1918_discovery" && Qc() > 0;
	return !t && !n ? {
		valid: !1,
		reason: "Add targets, or select RFC1918 ranges in RFC1918 mode."
	} : qc().length ? e === "easy" ? !Vr(Br()) && !tl("nmap-easy-top-ports") ? {
		valid: !1,
		reason: "Easy mode Top Ports must be 1-65535."
	} : {
		valid: !0,
		reason: ""
	} : e === "hard" && !R("nmap-hard-full-ports") && !tl("nmap-hard-top-ports") ? {
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
function rl() {
	let e = document.getElementById("nmap-scan-button");
	if (!e) return;
	let t = nl(), n = !Oe.postSubmitLock;
	e.disabled = !t.valid || !n, e.title = n ? t.valid ? "" : t.reason : "Enter scan inputs to enable this action.";
}
function il(e) {
	let t = String(e || "").trim();
	return t ? (t.match(/(?:[^\s"'`]+|"[^"]*"|'[^']*')+/g) || []).map((e) => e.trim()).map((e) => e.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")).filter((e) => e.length > 0) : [];
}
function al(e) {
	return (e || []).map((e) => {
		let t = String(e ?? "");
		return t ? /^[A-Za-z0-9_./:=@-]+$/.test(t) ? t : `'${t.replace(/'/g, "'\\''")}'` : "''";
	}).join(" ");
}
function ol() {
	let e = document.getElementById("nmap-command-preview");
	if (!e) return;
	let t = Wc(), n = document.getElementById("nmap-scan-button"), r = document.getElementById("nmap-run-actions-label"), i = document.getElementById("nmap-args-label");
	if (n && (n.textContent = t === "passive_capture" ? "Start Passive Capture Job" : "Start Nmap Scan Job"), r && (r.lastChild.textContent = t === "passive_capture" ? " Run scripted actions after spawned Easy scans" : " Run scripted actions after scan"), i && (i.hidden = t === "passive_capture"), t === "passive_capture") {
		e.textContent = `Command Preview: ${al([
			"tshark",
			"-i",
			String(z("passive-capture-interface") || "<interface>").trim() || "<interface>",
			"-n",
			"-q",
			"-a",
			`duration:${Ur() * 60}`,
			"-f",
			"arp or broadcast or multicast or udp port 67 or udp port 68 or udp port 137 or udp port 138 or udp port 5353 or udp port 5355 or udp port 1900",
			"-w",
			"<output_prefix>.pcapng"
		])}  |  Then queue Easy scans for discovered internal networks`, rl();
		return;
	}
	let a = qc(), o = Zc(t), s = il(z("nmap-args").trim()), c = s.some((e) => {
		let t = String(e || "").trim().toLowerCase();
		return t === "--stats-every" || t.startsWith("--stats-every=");
	}), l = s.some((e) => {
		let t = String(e || "").trim().toLowerCase();
		return t === "-v" || t === "-vv" || t === "-vvv" || t === "--verbose";
	}), u = a.length ? a : ["<targets>"], d = ["nmap"];
	o.host_discovery_only ? (d.push("-sn"), o.skip_dns && d.push("-n"), o.arp_ping && d.push("-PR"), d.push(`-${Gc(o.timing, "T3")}`)) : ((o.force_pn || !o.discovery) && d.push("-Pn"), o.skip_dns && d.push("-n"), d.push(`-${Gc(o.timing, "T3")}`), o.full_ports ? d.push("-p-") : String(o.explicit_ports || "").trim() ? d.push("-p", String(o.explicit_ports || "").trim()) : d.push("--top-ports", String(Kc(o.top_ports, 1e3))), o.aggressive ? d.push("-A") : (o.service_detection && d.push("-sV"), o.default_scripts && d.push("-sC"), o.os_detection && d.push("-O")), o.vuln_scripts && d.push("--script", "vuln"));
	let f = c ? s : [
		...s,
		"--stats-every",
		"15s"
	];
	l || (f = [...f, "-vv"]), d.push(...f, ...u, "-oA", "<output_prefix>"), e.textContent = `Command Preview: ${al(d)}`, rl();
}
function sl() {
	let e = Br(), t = Vr(e), n = e !== Oe.lastEngagementPreset, r = document.getElementById("nmap-easy-top-ports"), i = document.getElementById("nmap-easy-top-ports-label"), a = document.getElementById("nmap-easy-preset-note"), o = document.getElementById("nmap-easy-service-detection"), s = document.getElementById("nmap-easy-default-scripts");
	n && (o && (o.checked = !t), s && (s.checked = !t)), r && (r.disabled = t), i && (i.hidden = t), a && (a.hidden = !t, a.textContent = t ? `Internal Quick Recon uses a curated TCP port list instead of Top Ports: ${ge}. Add UDP-specific follow-up separately if needed.` : ""), Oe.lastEngagementPreset = e;
}
function cl(e) {
	let t = Math.max(1, Math.min(4, parseInt(e, 10) || 1));
	Oe.step = t, [
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
	n && (n.disabled = t <= 1), r && (r.disabled = t >= 4, r.style.display = t >= 4 ? "none" : ""), rl();
}
function ll() {
	let e = Wc();
	e !== Oe.lastMode && (el(e), Oe.lastMode = e), document.querySelectorAll("[data-mode-options]").forEach((t) => {
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
		let e = Jc(), t = Xc(), n = e === "comprehensive" ? "More comprehensive uses a broader common-internal-services TCP list" : "Quick uses the curated low-hanging-fruit TCP list", r = Yc(e), i = `${t} chunk scan${t === 1 ? "" : "s"} at a time`;
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
	sl(), ol(), rl();
}
async function ul() {
	if (Oe.postSubmitLock) {
		B("Scan failed: enter scan inputs before starting a job.", !0), rl();
		return;
	}
	let e = nl();
	if (!e.valid) {
		B(`Scan failed: ${e.reason}`, !0);
		let t = String(e.reason || "").toLowerCase();
		t.includes("target") || t.includes("rfc1918") || t.includes("interface") ? cl(3) : cl(4);
		return;
	}
	let t = qc(), n = Wc(), r = Zc(n), i = !!r.discovery, a = Wr(Br(), { fallbackGoalProfile: z("scheduler-goal-select") || "internal_recon" });
	B("Queueing Nmap scan job...");
	try {
		let e = await Ye("/api/scheduler/preferences", {
			engagement_policy: a,
			goal_profile: jr(a)
		});
		Vc(e);
		let o = (n === "passive_capture" ? await Ye("/api/scan/passive-capture", {
			interface_name: z("passive-capture-interface").trim(),
			duration_minutes: Ur(),
			run_actions: R("nmap-run-actions"),
			scan_mode: n
		}) : await Ye("/api/nmap/scan", {
			targets: t,
			discovery: i,
			staged: !1,
			run_actions: R("nmap-run-actions"),
			nmap_path: "nmap",
			nmap_args: z("nmap-args").trim(),
			scan_mode: n,
			scan_options: r
		}))?.job?.id;
		B(o ? `${n === "passive_capture" ? "Passive capture" : "Nmap scan"} queued (job ${o})` : n === "passive_capture" ? "Passive capture queued" : "Nmap scan queued"), ni(), I("nmap-targets", ""), Oe.postSubmitLock = !0, cl(1), ol(), rl(), await wo();
	} catch (e) {
		B(`Scan failed: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/tool_settings.js
var dl;
function fl(e) {
	for (let t of ["applySchedulerPreferences"]) if (typeof e[t] != "function") throw TypeError(`Missing tool_settings callback: ${t}`);
	({applySchedulerPreferences: dl} = e);
}
function pl(e, t = !1) {
	let n = document.getElementById("settings-tool-audit-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function ml(e, t = !1) {
	let n = document.getElementById("settings-tool-install-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function hl(e, t = !1) {
	let n = document.getElementById("interface-settings-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function gl(e) {
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
function _l(e) {
	let t = !!e;
	window.LEGION_COLORFUL_ASCII_BACKGROUND_ENABLED = t, document.body?.classList.toggle("colorful-background", t), L("interface-colorful-ascii-background", t), gl(t);
}
function vl(e) {
	let t = !!e, n = document.getElementById("graph-workspace-panel"), r = document.getElementById("graph-workspace-shell"), i = document.getElementById("graph-workspace-disabled-state");
	n && (n.dataset.graphEnabled = t ? "true" : "false", n.hidden = !t), r && (r.hidden = !t), i && (i.hidden = t), L("interface-graph-workspace-enabled", t), t ? eo({ background: !1 }).catch(() => {}) : (A.loading = !1, fa());
}
function yl() {
	return j.recommendedPlatform;
}
function bl(e) {
	j.plan = e || null;
	let t = e || {}, n = String(t?.script || "");
	I("settings-tool-install-script", n);
	let r = Number(t?.command_count || 0), i = Number(t?.manual_count || 0), a = String(t?.platform || yl() || "this system"), o = ["kali", "ubuntu"].includes(yl());
	if (document.getElementById("settings-tool-install-run-button").disabled = !o || !e || r === 0, document.getElementById("settings-tool-install-copy-button").disabled = !n.trim(), !r && !i) {
		ml(`No missing tool installs are queued for ${a}.`);
		return;
	}
	let s = `${r} install command${r === 1 ? "" : "s"} queued for ${a}`;
	i > 0 && (s += `; ${i} tool${i === 1 ? "" : "s"} still require manual follow-up`), ml(s);
}
function xl(e) {
	let t = document.getElementById("settings-tool-audit-body");
	if (!t) return;
	let n = Array.isArray(e) ? e : [];
	t.innerHTML = n.length ? n.map((e) => {
		let t = String(e?.status || "unknown"), n = e?.resolved_path || e?.configured_value || "-", r = t === "installed" ? "tool-audit-status-ok" : t === "configured-missing" ? "tool-audit-status-warn" : "tool-audit-status-missing";
		return `
            <tr>
                <td>
                    <strong>${Re(e?.label || e?.key || "tool")}</strong>
                    <div class="meta-note">${Re(e?.purpose || "")}</div>
                    ${e?.notes ? `<div class="meta-note">${Re(e.notes)}</div>` : ""}
                </td>
                <td>${Re(e?.category || "")}</td>
                <td><span class="${r}">${Re(t)}</span></td>
                <td><code>${Re(n)}</code></td>
                <td><code>${Re(e?.[`${yl()}_install`] || "-")}</code></td>
            </tr>
        `;
	}).join("") : "<tr><td colspan=\"5\" class=\"empty-cell\">No tool audit data.</td></tr>";
}
async function Sl() {
	pl("Checking tools...");
	try {
		let e = await Xe("/api/settings/tool-audit"), t = String(e?.recommended_platform || "").trim().toLowerCase();
		j.recommendedPlatform = ["kali", "ubuntu"].includes(t) ? t : "", xl(e?.tools || []), j.supportedPlatforms = Array.isArray(e?.supported_platforms) && e.supported_platforms.length ? e.supported_platforms : ["kali", "ubuntu"];
		let n = e?.summary || {};
		pl(`Installed ${n.installed || 0}/${n.total || 0}; missing ${n.missing || 0}; configured missing ${n.configured_missing || 0}`), await Cl(!1);
	} catch (e) {
		xl([]), bl(null), pl(`Tool audit failed: ${e.message}`, !0), ml(`Install plan unavailable: ${e.message}`, !0);
	}
}
async function Cl(e = !0) {
	e && ml("Building install plan...");
	try {
		if (!yl()) throw Error("Automatic installation supports Kali and Ubuntu only.");
		bl(await Xe("/api/settings/tool-audit/install-plan?scope=missing") || {});
	} catch (e) {
		bl(null), ml(`Install plan failed: ${e.message}`, !0);
	}
}
async function wl() {
	let e = String(z("settings-tool-install-script") || "");
	if (e.trim() || (await Cl(!1), e = String(z("settings-tool-install-script") || "")), !e.trim()) ml("No install script is available to copy.", !0);
	else try {
		if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(e);
		else {
			let t = document.createElement("textarea");
			t.value = e, t.setAttribute("readonly", "readonly"), t.style.position = "absolute", t.style.left = "-9999px", document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t);
		}
		ml("Install script copied to clipboard.");
	} catch (e) {
		ml(`Copy failed: ${e.message}`, !0);
	}
}
async function Tl() {
	ml("Queueing install job...");
	try {
		if (!yl()) throw Error("Automatic installation supports Kali and Ubuntu only.");
		let e = await Ye("/api/settings/tool-audit/install", { scope: "missing" }), t = Number(e?.job?.id || 0);
		ml(t > 0 ? `Install queued as job #${t}. Use Logging > Jobs to monitor progress.` : "Install job queued. Use Logging > Jobs to monitor progress.");
	} catch (e) {
		ml(`Install failed to queue: ${e.message}`, !0);
	}
}
// ../app/web/static/js/workspace/scheduler_preferences.js
function El(e = {}) {
	return {
		graph_workspace: !!e.graph_workspace,
		context_summary_enabled: e.context_summary_enabled !== !1
	};
}
function Dl(e) {
	if (!e) return;
	let t = kr(e.engagement_policy, e.goal_profile);
	k.deviceCategoryRules = e.device_categories || [], k.builtInDeviceCategories = e.built_in_device_categories || [], F("scheduler-mode", "deterministic"), F("scheduler-goal", t.preset_label || t.preset), F("scheduler-families", e.preapproved_families_count || 0), I("scheduler-goal-select", t.preset), I("engagement-scope-select", t.scope), I("engagement-intent-select", t.intent);
	for (let [e, n] of Object.entries({
		"engagement-credential-mode": "credential_attack_mode",
		"engagement-lockout-mode": "lockout_risk_mode",
		"engagement-stability-mode": "stability_risk_mode",
		"engagement-detection-mode": "detection_risk_mode",
		"engagement-approval-mode": "approval_mode",
		"engagement-noise-budget": "noise_budget"
	})) I(e, t[n]);
	L("engagement-allow-exploitation", t.allow_exploitation), L("engagement-allow-lateral", t.allow_lateral_movement);
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
	}), vl(!!e.feature_flags?.graph_workspace), Ol(), Tr();
}
function Ol() {
	let e = String(z("scheduler-goal-select") || "internal_recon").trim().toLowerCase(), t = e === "custom", n = t ? {
		scope: z("engagement-scope-select") || "internal",
		intent: z("engagement-intent-select") || "recon"
	} : Or(e);
	t || (I("engagement-scope-select", n.scope || "internal"), I("engagement-intent-select", n.intent || "recon")), F("engagement-derived-scope", n.scope || "internal"), F("engagement-derived-intent", n.intent || "recon");
	let r = document.getElementById("engagement-preset-summary");
	r && (r.textContent = Mr(e, t));
	let i = document.getElementById("engagement-custom-scope-label"), a = document.getElementById("engagement-custom-intent-label"), o = document.getElementById("engagement-custom-note"), s = document.getElementById("engagement-scope-select"), c = document.getElementById("engagement-intent-select");
	[
		i,
		a,
		o
	].forEach((e) => {
		e && (e.hidden = !t);
	}), s && (s.disabled = !t), c && (c.disabled = !t), sl(), document.getElementById("nmap-command-preview") && ol();
}
function kl() {
	return {
		engagement_policy: kr({
			preset: z("scheduler-goal-select"),
			scope: z("engagement-scope-select"),
			intent: z("engagement-intent-select"),
			allow_exploitation: R("engagement-allow-exploitation"),
			allow_lateral_movement: R("engagement-allow-lateral"),
			credential_attack_mode: z("engagement-credential-mode"),
			lockout_risk_mode: z("engagement-lockout-mode"),
			stability_risk_mode: z("engagement-stability-mode"),
			detection_risk_mode: z("engagement-detection-mode"),
			approval_mode: z("engagement-approval-mode"),
			noise_budget: z("engagement-noise-budget")
		}),
		max_concurrency: Number(z("scheduler-concurrency-input") || 1),
		max_host_concurrency: Number(z("scheduler-host-concurrency-input") || 1),
		max_jobs: Number(z("scheduler-max-jobs-input") || 200),
		dangerous_categories: [...document.querySelectorAll(".danger-group input[value]:checked")].map((e) => e.value)
	};
}
async function Al() {
	try {
		Dl(await Xe("/api/scheduler/preferences"));
	} catch (e) {
		B(`Settings: ${e.message}`, !0);
	}
}
async function jl(e) {
	e?.preventDefault();
	try {
		Dl(await Ye("/api/scheduler/preferences", kl())), F("scheduler-save-status", "Saved");
	} catch (e) {
		F("scheduler-save-status", e.message);
	}
}
// ../app/web/static/js/workspace/controller.js
var Ml = class {
	connect() {
		this.connected ||= (Sr({ applySchedulerPreferences: Dl }), Zr({
			openManualToolPicker: aa,
			pollSnapshot: wo
		}), Rt({
			graphRenderWorkspace: Za,
			graphSyncDetailPresentation: ha
		}), da({ graphRenderWorkspace: Za }), Mi({ pollSnapshot: wo }), Fn({
			closeRibbonMenus: mi,
			graphLoadSnapshot: eo,
			loadHostDetail: vr,
			loadWorkspaceHosts: hr,
			loadWorkspaceServices: gr,
			renderHosts: co,
			renderServices: uo
		}), Hc({ applySchedulerPreferences: Dl }), Rr({
			applyNmapModeTargetDefaults: el,
			refreshNmapModeOptions: ll,
			refreshNmapScanButtonState: rl,
			setNmapWizardStep: cl,
			updateNmapCommandPreview: ol
		}), fl({ applySchedulerPreferences: Dl }), Xi({ pollSnapshot: wo }), fr({
			graphLoadSnapshot: eo,
			renderHosts: co,
			renderServices: uo,
			renderTools: _o
		}), !0);
	}
};
// ../app/web/static/js/workspace/graph_actions.js
function Nl(e) {
	let t = (A.layouts || []).find((t) => String(t?.layout_id || "") === String(e || ""));
	A.activeLayoutId = String(t?.layout_id || ""), A.positions = t?.layout?.positions && typeof t.layout.positions == "object" ? { ...t.layout.positions } : {}, A.pinnedNodeIds = t?.layout?.pinned_node_ids && typeof t.layout.pinned_node_ids == "object" ? { ...t.layout.pinned_node_ids } : {}, t?.layout?.group_by && I("graph-group-select", t.layout.group_by), t?.name && I("graph-layout-name", t.name), hn(), Za();
}
function Pl() {
	let e = Ya(A.data), t = /* @__PURE__ */ new Map();
	if ((e.nodes || []).forEach((n) => {
		let r = Ca(n, A.groupBy || pn().defaultGroup || "subnet", Sa(e.nodes)) || "other";
		t.has(r) || t.set(r, []), t.get(r).push(n);
	}), !Array.isArray(e?.nodes) || !e.nodes.length || !t.size) {
		W("No graph nodes are available to tidy.", !0);
		return;
	}
	let n = Pa(e.nodes, e.edges, t, A.groupBy || pn().defaultGroup || "subnet", {});
	Object.entries(n.positions || {}).forEach(([e, t]) => {
		A.positions[e] = {
			x: Number(t?.x) || 0,
			y: Number(t?.y) || 0
		};
	}), Za({ preserveDetail: !0 }), W(`Layout tidied for ${e.nodes.length} nodes across ${(n.groups || []).length} groups`);
}
function Fl() {
	if (A.selectedKind !== "node" || !A.selectedRef) {
		W("Select a node or summary before focusing the neighborhood.", !0), va();
		return;
	}
	let e = Gt(), t = Fa(e);
	t.length ? (A.focusSeedNodeIds = t, A.focusSeedLabel = String(e?.label || e?.node_id || "selection"), A.focusDepth = Math.max(1, Math.min(3, parseInt(z("graph-focus-depth-select"), 10) || A.focusDepth || 1)), G(e, "summary_kind") && (A.selectedKind = "node", A.selectedRef = t[0]), Za(), va(), W(`Focused ${A.focusDepth}-hop neighborhood around ${A.focusSeedLabel}`)) : (W("The selected graph node cannot be focused.", !0), va());
}
function Il() {
	A.focusSeedNodeIds.length ? (A.focusSeedNodeIds = [], A.focusSeedLabel = "", Za(), va(), W("Graph focus cleared")) : (W("No graph focus is active.", !0), va());
}
function Ll() {
	if (A.selectedKind !== "node" || !A.selectedRef) {
		W("Select a summary node before expanding it.", !0), va();
		return;
	}
	let e = Gt();
	if (!G(e, "summary_kind")) {
		W("Selected node is already expanded.", !0), va();
		return;
	}
	let t = String(e?.node_id || "");
	A.expandedSummaryIds[t] ? (delete A.expandedSummaryIds[t], A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = null, W(`Collapsed ${e.label || t}`)) : (A.expandedSummaryIds[t] = !0, A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = e, W(`Expanded ${e.label || t}`)), Za(), va();
}
function Rl() {
	let e = Gt(), t = String(e?.node_id || "");
	!G(e, "summary_kind") || !t || !A.expandedSummaryIds[t] ? (W("Select an expanded summary cluster to collapse.", !0), va()) : (delete A.expandedSummaryIds[t], A.selectedKind = "node", A.selectedRef = t, A.selectedPayload = null, Za(), va(), W(`Collapsed ${e.label || t}`));
}
async function zl() {
	let e = String(z("graph-view-select") || A.viewId || "attack_surface").trim(), t = String(z("graph-layout-name") || "default").trim() || "default", n = String(A.activeLayoutId || ""), r = {
		positions: A.filtered?.positions && typeof A.filtered.positions == "object" ? A.filtered.positions : A.positions,
		pinned_node_ids: A.pinnedNodeIds,
		group_by: String(z("graph-group-select") || A.groupBy || pn().defaultGroup || "subnet").trim(),
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
		let i = (await Ye("/api/graph/layouts", {
			layout_id: n,
			view_id: e,
			name: t,
			layout: r
		}))?.layout || {};
		A.layouts = (A.layouts || []).filter((e) => String(e?.layout_id || "") !== String(i.layout_id || "")), A.layouts.push(i), A.activeLayoutId = String(i.layout_id || ""), hn(), I("graph-layout-select", A.activeLayoutId), W(`Layout saved: ${i.name || t}`);
	} catch (e) {
		W(`Layout save failed: ${e.message}`, !0);
	}
}
function Bl() {
	A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, I("graph-layout-select", ""), Za(), W("Layout reset");
}
async function Vl() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || ""), n = String(z("graph-note-input") || "").trim();
	if (!e || !t) W("Select a node or edge before saving a note.", !0);
	else if (!n) W("Note text is required.", !0);
	else try {
		let r = (await Ye("/api/graph/annotations", {
			target_kind: e,
			target_ref: t,
			body: n,
			created_by: "web-operator",
			source_ref: `graph-workspace:${A.viewId}`
		}))?.annotation || {};
		A.annotations = (A.annotations || []).filter((e) => String(e?.annotation_id || "") !== String(r.annotation_id || "")), A.annotations.push(r), I("graph-note-input", ""), oi(!1), ya(), W("Note saved");
	} catch (e) {
		W(`Note save failed: ${e.message}`, !0);
	}
}
function Hl() {
	let e = String(A.selectedKind || ""), t = String(A.selectedRef || "");
	if (!e || !t) {
		W("Select a node or edge before adding a note.", !0);
		return;
	}
	let n = Ft(e === "node" ? "node" : "edge", t), r = String(n?.label || n?.edge_id || t || "").trim() || "selected item";
	F("graph-note-modal-target", `Target: ${$t(e)} | ${r}`), ti(!0);
}
function Ul() {
	let e = A.selectedKind === "node" ? Ft("node", A.selectedRef) : null;
	if (!e) {
		W("Select a node to pin or unpin.", !0);
		return;
	}
	let t = String(e.node_id || "");
	if (A.pinnedNodeIds[t]) delete A.pinnedNodeIds[t], W(`Node unpinned: ${e.label || t}`);
	else {
		let n = A.filtered.positions?.[t] || A.positions?.[t];
		n && (A.positions[t] = {
			x: n.x,
			y: n.y
		}), A.pinnedNodeIds[t] = !0, W(`Node pinned: ${e.label || t}`);
	}
	Za();
}
// ../app/web/static/js/workspace/interface_settings.js
function Wl(e) {
	let t = document.getElementById("interface-settings-modal");
	t && (Ae.interfaceSettingsOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
async function Gl() {
	hl("Loading interface settings...");
	try {
		let [e, t] = await Promise.all([Xe("/api/scheduler/preferences"), Xe("/api/settings/display")]), n = El(e?.feature_flags).graph_workspace;
		L("interface-graph-workspace-enabled", n), L("interface-colorful-ascii-background", !!t?.colorful_ascii_background), hl("Interface settings loaded");
	} catch (e) {
		hl(`Load failed: ${e.message}`, !0);
	}
}
async function Kl() {
	let e = R("interface-graph-workspace-enabled"), t = R("interface-colorful-ascii-background");
	hl("Saving interface settings...");
	try {
		let [n, r] = await Promise.all([Ye("/api/scheduler/preferences", { feature_flags: { graph_workspace: e } }), Ye("/api/settings/display", { colorful_ascii_background: t })]);
		Dl(n), _l(!!r?.colorful_ascii_background), hl("Interface settings saved");
	} catch (e) {
		hl(`Save failed: ${e.message}`, !0);
	}
}
async function ql() {
	mi(), fi(!0), await Promise.allSettled([Sl()]);
}
function Jl() {
	fi(!1);
}
async function Yl() {
	mi(), Wl(!0), await Gl();
}
function Xl() {
	Wl(!1);
}
// ../app/web/static/js/workspace/projects.js
async function Zl() {
	mi();
	let e = z("project-open-path").trim();
	if (!e) {
		let t = window.prompt("Enter existing project path (.legion):", "");
		if (e = String(t || "").trim(), !e) return;
		I("project-open-path", e);
	}
	await gu();
}
async function Ql(e = !1) {
	mi();
	let t = z("project-save-path").trim();
	if (e || !t) {
		let e = String(z("project-name") || "").trim(), n = window.prompt("Enter destination path (.legion):", e);
		if (t = String(n || "").trim(), !t) return;
		I("project-save-path", t);
	}
	await _u();
}
async function $l() {
	mi(), z("project-save-path").trim() ? await _u() : B("Save failed: no destination path is set. Use Save As.", !0);
}
async function eu() {
	await Ql(!0);
}
function Y() {
	mi(), window.location.assign(`/api/project/download-zip?t=${Date.now()}`);
}
async function tu() {
	mi(), await fu("restoring a workspace bundle", async () => {
		let e = document.getElementById("project-restore-zip-file");
		e ? (e.value = "", e.click()) : B("Restore failed: ZIP input control missing.", !0);
	});
}
async function nu(e) {
	let t = e?.target, n = t?.files && t.files.length ? t.files[0] : null;
	if (n) {
		B(`Uploading restore bundle (${n.name})...`);
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
				B(`Restore queued (job ${i})...`);
				let e = await mr(i, 12e5, 1500), t = String(e?.result?.project?.name || "").trim();
				t && (I("project-save-path", t), I("project-open-path", t));
			}
			B("Workspace restored"), ao({ clearProjectPaths: !1 }), await yr(), await Promise.all([wo(), Pt()]);
		} catch (e) {
			B(`Restore failed: ${e.message}`, !0);
		} finally {
			t && (t.value = "");
		}
	}
}
async function ru() {
	mi();
	let e = z("nmap-xml-path").trim();
	if (!e) {
		let t = window.prompt("Enter Nmap XML path:", "");
		if (e = String(t || "").trim(), !e) return;
		I("nmap-xml-path", e);
	}
	L("nmap-xml-run-actions", window.confirm("Run scripted actions after XML import?")), await vu();
}
function iu(e) {
	let t = document.getElementById("workspace-switch-guard-modal");
	t && (ke.modalOpen = !!e, Ae.workspaceSwitchGuardOpen = !!e, t.classList.toggle("is-open", !!e), t.setAttribute("aria-hidden", e ? "false" : "true"), Ie());
}
function au(e, t = !1) {
	let n = document.getElementById("workspace-switch-guard-status");
	n && (n.textContent = e || "", n.style.color = t ? "#ff9b9b" : "");
}
function ou() {
	ke.busy = !1, ke.pendingAction = null, ke.pendingLabel = "", ke.latestSummary = null, au("Stop running jobs and processes before switching workspaces."), F("workspace-switch-guard-summary", "No active work detected."), F("workspace-switch-guard-details", ""), iu(!1);
}
async function su() {
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
function cu(e) {
	let t = Array.isArray(e?.jobs) ? e.jobs : [], n = Array.isArray(e?.processes) ? e.processes : [], r = [];
	return t.slice(0, 6).forEach((e) => {
		r.push(`Job ${e.id} | ${e.type || "job"} | ${e.status || ""}`);
	}), n.slice(0, 8).forEach((e) => {
		r.push(`Process ${e.id} | ${e.name || "process"} | ${e.hostIp || ""}${e.port ? `:${e.port}/${e.protocol || "tcp"}` : ""} | ${e.status || ""}`);
	}), (t.length > 6 || n.length > 8) && r.push("..."), r.join("\n");
}
function lu(e, t, n) {
	ke.pendingAction = n, ke.pendingLabel = String(t || "switch workspaces"), ke.latestSummary = e;
	let r = Array.isArray(e?.jobs) ? e.jobs.length : 0, i = Array.isArray(e?.processes) ? e.processes.length : 0;
	au("Active work must be stopped before switching workspaces."), F("workspace-switch-guard-summary", `${r} active job${r === 1 ? "" : "s"} and ${i} active process${i === 1 ? "" : "es"} detected before ${ke.pendingLabel}.`), F("workspace-switch-guard-details", cu(e)), iu(!0);
}
async function uu(e = 2e4) {
	let t = Date.now() + Math.max(1e3, Number(e) || 2e4);
	for (; Date.now() < t;) {
		let e = await su();
		if (!e.jobs.length && !e.processes.length) return e;
		await new Promise((e) => window.setTimeout(e, 600));
	}
	throw Error("Timed out waiting for running jobs and processes to stop.");
}
async function du() {
	if (!ke.busy) {
		ke.busy = !0, au("Stopping active jobs and processes...");
		try {
			let e = await su();
			for (let t of e.jobs) {
				let e = Number(t?.id || 0);
				e > 0 && await Ye(`/api/jobs/${e}/stop`, {});
			}
			for (let t of e.processes) {
				let e = Number(t?.id || 0);
				if (e > 0) try {
					await Ye(`/api/processes/${e}/kill`, {});
				} catch {}
			}
			await uu(), await wo();
			let t = ke.pendingAction;
			ou(), typeof t == "function" && await t();
		} catch (e) {
			ke.busy = !1, au(`Stop failed: ${e.message}`, !0);
		}
	}
}
async function fu(e, t) {
	let n = await su();
	n.jobs.length || n.processes.length ? lu(n, e, t) : await t();
}
async function pu() {
	B("Creating temporary project...");
	let e = await Ye("/api/project/new-temp", {});
	B("Created temporary project"), ao({ clearProjectPaths: !0 }), ze(e?.project || {}), await yr(), await Promise.all([wo(), Pt()]);
}
async function mu() {
	try {
		await fu("creating a new workspace", pu);
	} catch (e) {
		if (String(e?.message || "").toLowerCase().includes("jobs/scans are active")) {
			await fu("creating a new workspace", pu);
			return;
		}
		B(`Create failed: ${e.message}`, !0);
	}
}
async function hu() {
	let e = z("project-open-path").trim();
	if (!e) {
		B("Open failed: project path is required", !0);
		return;
	}
	B("Opening project...");
	let t = await Ye("/api/project/open", { path: e });
	B("Project opened"), ao({ clearProjectPaths: !1 }), I("project-save-path", ""), ze(t?.project || {}), await yr(), await Promise.all([wo(), Pt()]);
}
async function gu() {
	try {
		await fu("opening a workspace", hu);
	} catch (e) {
		if (String(e?.message || "").toLowerCase().includes("jobs/scans are active")) {
			await fu("opening a workspace", hu);
			return;
		}
		B(`Open failed: ${e.message}`, !0);
	}
}
async function _u() {
	let e = z("project-save-path").trim();
	if (!e) B("Save failed: destination path is required", !0);
	else {
		B("Saving project...");
		try {
			let t = await Ye("/api/project/save-as", {
				path: e,
				replace: R("project-save-replace")
			}), n = Number(t?.job?.id || 0);
			n > 0 && (B(`Save queued (job ${n})...`), await mr(n, 6e5, 1500)), B("Project saved"), await wo();
		} catch (e) {
			B(`Save failed: ${e.message}`, !0);
		}
	}
}
async function vu() {
	let e = z("nmap-xml-path").trim();
	if (!e) B("Import failed: XML path is required", !0);
	else {
		B("Queueing Nmap XML import job...");
		try {
			let t = (await Ye("/api/nmap/import-xml", {
				path: e,
				run_actions: R("nmap-xml-run-actions")
			}))?.job?.id;
			B(t ? `Nmap XML import queued (job ${t})` : "Nmap XML import queued"), await wo();
		} catch (e) {
			B(`Import failed: ${e.message}`, !0);
		}
	}
}
// ../app/web/static/js/workspace/events.js
function yu() {
	let e = (e, t) => {
		let n = document.getElementById(e);
		n && n.addEventListener("click", t);
	};
	e("nmap-scan-button", ul), e("ribbon-workspace-new-action-button", mu), e("ribbon-workspace-open-action-button", Zl), e("ribbon-workspace-save-action-button", $l), e("ribbon-workspace-save-as-action-button", eu), e("ribbon-workspace-download-action-button", Y), e("ribbon-workspace-restore-action-button", tu), e("ribbon-import-xml-action-button", ru), e("hosts-reset-filter-button", nr), e("hosts-filter-show-all-button", () => Xn("show_all")), e("hosts-filter-hide-down-button", () => Xn("hide_down")), e("services-panel-toggle-button", po), e("graph-panel-toggle-button", ho), e("ribbon-scan-add-action-button", si), e("ribbon-scan-manual-action-button", ci), e("ribbon-scheduler-settings-button", gi), e("ribbon-interface-settings-button", Yl), e("ribbon-device-category-settings-button", vi), e("ribbon-app-settings-button", ql), e("workspace-refresh-button", yr), e("workspace-run-tool-button", ca), e("workspace-run-scheduler-button", la), e("graph-refresh-button", no), e("graph-rebuild-button", ro), e("graph-filters-toggle-button", () => pa(!A.filtersExpanded)), e("graph-focus-selection-button", Fl), e("graph-clear-focus-button", Il), e("graph-expand-selection-button", Ll), e("graph-collapse-expanded-button", Rl), e("graph-layout-save-button", zl), e("graph-layout-reset-button", Bl), e("graph-note-open-button", Hl), e("graph-note-save-button", Vl), e("graph-note-modal-close", () => oi(!1)), e("graph-note-modal-cancel", () => oi(!1)), e("graph-pin-toggle-button", Ul), e("graph-detail-dock-toggle-button", _a), e("graph-detail-close-button", fa), pa(A.filtersExpanded), fo(!0), mo(!1);
	let t = Ut();
	t && t.addEventListener("scroll", () => {
		A.detailMode === "floating" && Wt() && ha();
	}), window.addEventListener("resize", () => {
		zt() && Za({ preserveDetail: !0 });
	});
	let n = document.getElementById("workspace-host-select");
	n && n.addEventListener("change", async (e) => {
		await so(e.target.value, {
			syncGraph: !0,
			preserveGraphDetail: !0
		});
	});
	let r = document.getElementById("hosts-category-filter-select");
	r && r.addEventListener("change", async (e) => {
		await Zn(e.target.value);
	});
	let i = document.getElementById("hosts-service-filter-button");
	i && i.addEventListener("click", (e) => {
		e.stopPropagation(), Kn(!!document.getElementById("hosts-service-filter-popover")?.hidden);
	});
	let a = document.getElementById("hosts-service-filter-clear-button");
	a && a.addEventListener("click", async (e) => {
		e.stopPropagation(), await $n([]);
	});
	let o = document.getElementById("hosts-service-filter-popover");
	o && o.addEventListener("click", (e) => {
		e.stopPropagation();
	}), document.addEventListener("click", () => {
		Kn(!1);
	});
	let s = document.getElementById("services-category-filter-select");
	s && s.addEventListener("change", async (e) => {
		await er(e.target.value);
	});
	let c = document.getElementById("workspace-tool-target-select");
	c && c.addEventListener("change", async () => {
		await oa();
	}), ["workspace-tool-port", "workspace-tool-protocol"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", async () => {
			await sa();
		});
	});
	let l = document.getElementById("workspace-tool-select");
	l && l.addEventListener("change", () => {
		$i();
	});
	let u = document.getElementById("hosts-body");
	u && u.addEventListener("click", async (e) => {
		let t = e.target.closest("button[data-host-action]");
		if (t && await Hi(t)) return;
		let n = e.target.closest("tr[data-host-id]");
		if (!n) return;
		let r = parseInt(n.dataset.hostId, 10);
		r && await so(r, {
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
			await gt(e);
			return;
		}
		let n = e.target.closest("button[data-script-delete-id]");
		n && parseInt(n.dataset.scriptDeleteId, 10);
	}), e("nmap-wizard-back", () => cl(Oe.step - 1)), e("nmap-wizard-next", () => cl(Oe.step + 1)), e("scheduler-modal-close", _i), e("interface-settings-modal-close", Xl), e("interface-settings-save-button", Kl), e("device-category-modal-close", yi), e("device-category-add-rule-button", () => {
		let e = document.getElementById("device-category-rules-body");
		e && e.appendChild(wr({}));
	}), e("device-category-save-button", Dr), e("settings-modal-close", Jl), e("settings-tool-audit-refresh-button", Sl), e("settings-tool-install-copy-button", wl), e("settings-tool-install-run-button", Tl), e("workspace-switch-guard-close", ou), e("workspace-switch-guard-cancel-button", ou), e("workspace-switch-guard-stop-button", du), e("nmap-scan-modal-close", ni), e("manual-scan-modal-close", ri), e("host-remove-modal-close", () => ai(!0)), e("host-remove-modal-cancel", () => ai(!0)), e("host-remove-modal-confirm", Ji), e("script-output-modal-close", () => ht(!0)), e("script-output-copy-button", vt), e("script-output-command-copy", yt), e("script-output-download-button", xt), e("graph-layout-tidy-button", Pl);
	let f = document.getElementById("project-restore-zip-file");
	f && f.addEventListener("change", nu), document.querySelectorAll("[data-ribbon-menu-toggle]").forEach((e) => {
		e.addEventListener("click", (t) => {
			t.preventDefault(), t.stopPropagation(), hi(e.getAttribute("data-ribbon-menu-toggle"));
		});
	}), document.addEventListener("click", (e) => {
		e.target.closest(".ribbon-menu") || mi();
	});
	let p = document.getElementById("graph-resize-handle");
	p && (p.addEventListener("pointerdown", Zt), p.addEventListener("dblclick", (e) => {
		e.preventDefault(), Qt();
	})), Jt();
	let m = document.getElementById("process-output-modal");
	m && m.addEventListener("click", (e) => {
		e.target === m && mt(!0);
	});
	let h = document.getElementById("script-output-modal");
	h && h.addEventListener("click", (e) => {
		e.target === h && ht(!0);
	});
	let g = document.getElementById("nmap-scan-modal");
	g && g.addEventListener("click", (e) => {
		e.target === g && ni();
	});
	let _ = document.getElementById("manual-scan-modal");
	_ && _.addEventListener("click", (e) => {
		e.target === _ && ri();
	});
	let v = document.getElementById("interface-settings-modal");
	v && v.addEventListener("click", (e) => {
		e.target === v && Xl();
	});
	let y = document.getElementById("workspace-switch-guard-modal");
	y && y.addEventListener("click", (e) => {
		e.target === y && ou();
	});
	let b = document.getElementById("host-remove-modal");
	b && b.addEventListener("click", (e) => {
		e.target === b && ai(!0);
	});
	let x = document.getElementById("graph-note-modal");
	x && x.addEventListener("click", (e) => {
		e.target === x && oi(!1);
	});
	let S = document.getElementById("scheduler-settings-modal");
	S && S.addEventListener("click", (e) => {
		e.target === S && _i();
	});
	let ee = document.getElementById("device-category-settings-modal");
	ee && ee.addEventListener("click", (e) => {
		e.target === ee && yi();
	});
	let C = document.getElementById("app-settings-modal");
	C && C.addEventListener("click", (e) => {
		e.target === C && Jl();
	}), document.addEventListener("keydown", (e) => {
		e.key === "Escape" && (je.openMenuId ? mi() : Ee.modalOpen ? mt(!0) : P.modalOpen ? ht(!0) : Ae.nmapScanOpen ? ni() : Ae.manualScanOpen ? ri() : !Ae.submittedScansOpen && !Ae.schedulerDecisionsOpen && (Ae.hostRemoveOpen ? ai(!0) : Ae.graphNoteOpen ? oi(!1) : Ae.settingsOpen ? Jl() : Ae.deviceCategorySettingsOpen ? yi() : Ae.schedulerOpen ? _i() : A.detailMode === "floating" && Wt() && fa()));
	}), document.addEventListener("pointerdown", (e) => {
		if (A.detailMode !== "floating" || !Wt()) return;
		let t = e.target;
		if (!(t instanceof Element) || t.closest("#graph-detail-panel") || t.closest("[data-graph-node-id], [data-graph-edge-id]")) return;
		let n = U();
		n && n.contains(t) || fa();
	}), document.querySelectorAll("[data-wizard-goto]").forEach((e) => {
		e.addEventListener("click", () => {
			cl(e.getAttribute("data-wizard-goto"));
		});
	});
	let w = document.getElementById("nmap-wizard");
	w && w.querySelectorAll("input, select, textarea").forEach((e) => {
		let t = e.tagName === "INPUT" && (e.type === "checkbox" || e.type === "radio") || e.tagName === "SELECT" ? "change" : "input";
		e.addEventListener(t, () => {
			Oe.postSubmitLock = !1, e.name === "nmap-scan-mode" && cl(3), e.id === "nmap-engagement-preset-select" && Gr(), ll();
		});
	}), ["nmap-args"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("input", () => {
			Oe.postSubmitLock = !1, ol();
		});
	}), Jr({
		scrollIntoView: !1,
		focusPreset: !1,
		focusTargets: !1
	});
}
// ../app/web/static/js/workspace/graph_events.js
function bu(e) {
	if (!A.drag) return;
	e.preventDefault();
	let t = Number(e.clientX || 0) - Number(A.drag.startClientX || 0), n = Number(e.clientY || 0) - Number(A.drag.startClientY || 0);
	if (!A.drag.active && Math.hypot(t, n) < 4) return;
	if (A.drag.active = !0, A.drag.kind === "pan") {
		let e = document.getElementById("graph-workspace-canvas"), r = A.drag.viewport || A.viewport;
		if (!e || !r) return;
		let i = e.getBoundingClientRect();
		if (!i.width || !i.height) return;
		let a = Number(r.width || 1) / Math.max(1, i.width), o = Number(r.height || 1) / Math.max(1, i.height), s = Ti(Number(A.drag.startCenterX || r.centerX || 0) - t * a - (r.boundsX || 0), Number(A.drag.startCenterY || r.centerY || 0) - n * o - (r.boundsY || 0), r.boundsWidth, r.boundsHeight, r.width, r.height);
		s.x += r.boundsX || 0, s.y += r.boundsY || 0;
		let c = s.x - Number(r.width || 1) / 2, l = s.y - Number(r.height || 1) / 2;
		A.viewport = {
			...r,
			x: c,
			y: l,
			centerX: s.x,
			centerY: s.y
		}, document.body.classList.add("graph-workspace-panning"), e.setAttribute("viewBox", `${c} ${l} ${r.width} ${r.height}`), A.detailMode === "floating" && Wt() && ha();
		return;
	}
	let r = document.getElementById("graph-workspace-canvas");
	if (!r) return;
	let i = Tn(r, e), a = Number(i.x || 0) - Number(A.drag.startPointX || 0), o = Number(i.y || 0) - Number(A.drag.startPointY || 0);
	Object.entries(A.drag.initialPositions || {}).forEach(([e, t]) => {
		A.positions[e] = {
			x: Math.max(20, Math.round((Number(t?.x) || 0) + a)),
			y: Math.max(28, Math.round((Number(t?.y) || 0) + o))
		};
	}), Za({ preserveDetail: !0 });
}
function xu() {
	if (!A.drag) return;
	let e = !!A.drag.active;
	document.body.classList.remove("graph-workspace-panning"), window.removeEventListener("pointermove", bu), window.removeEventListener("pointerup", xu), A.drag = null, e && (A.suppressClickUntil = Date.now() + 180);
}
function Su() {
	if (!zt()) return;
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
			e === "graph-view-select" && (I("graph-group-select", (Pe[String(t.target.value || "attack_surface").trim()] || Pe.attack_surface).defaultGroup || "finding"), A.activeLayoutId = "", A.positions = {}, A.pinnedNodeIds = {}, hn()), [
				"graph-group-select",
				"graph-render-mode-select",
				"graph-severity-filter",
				"graph-pack-filter",
				"graph-time-window-filter"
			].includes(e) ? Za() : await eo({ background: !1 });
		});
	});
	let e = document.getElementById("graph-search-input");
	if (e) {
		let t = null;
		e.addEventListener("input", () => {
			t && window.clearTimeout(t), t = window.setTimeout(() => {
				eo({ background: !1 }).catch(() => {});
			}, 350);
		});
	}
	let t = document.getElementById("graph-min-confidence");
	t && t.addEventListener("input", () => {
		dn(), eo({ background: !1 }).catch(() => {});
	});
	let n = document.getElementById("graph-zoom-slider");
	n && n.addEventListener("input", () => {
		fn(), Za();
	});
	let r = document.getElementById("graph-focus-depth-select");
	r && r.addEventListener("change", () => {
		A.focusDepth = Math.max(1, Math.min(3, parseInt(r.value, 10) || 1)), A.focusSeedNodeIds.length && Za();
	}), ["graph-hide-ai-suggested", "graph-hide-nmap-xml-artifacts"].forEach((e) => {
		let t = document.getElementById(e);
		t && t.addEventListener("change", () => {
			eo({ background: !1 }).catch(() => {});
		});
	});
	let i = document.getElementById("graph-layout-select");
	i && i.addEventListener("change", () => {
		let e = String(i.value || "");
		e ? (Nl(e), W("Layout loaded")) : Bl();
	});
	let a = document.getElementById("graph-workspace-canvas");
	a && (a.addEventListener("click", (e) => {
		if (Number(A.suppressClickUntil || 0) > Date.now()) return;
		let t = e.target.closest("[data-graph-node-id]");
		if (t) {
			Qa("node", t.getAttribute("data-graph-node-id"));
			return;
		}
		let n = e.target.closest("[data-graph-edge-id]");
		n ? Qa("edge", n.getAttribute("data-graph-edge-id")) : e.target.closest("[data-graph-group-key]") || fa();
	}), a.addEventListener("dblclick", (e) => {
		let t = e.target.closest("[data-graph-node-id]");
		if (!t) return;
		let n = String(t.getAttribute("data-graph-node-id") || "");
		A.selectedKind = "node", A.selectedRef = n, G(Ft("node", n), "summary_kind") && Ll();
	}), a.addEventListener("pointerdown", (e) => {
		let t = e.target.closest("[data-graph-node-id]");
		if (!t) return;
		let n = String(t.getAttribute("data-graph-node-id") || ""), r = Tn(a, e), i = A.filtered.positions?.[n] || A.positions?.[n];
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
		}, window.addEventListener("pointermove", bu), window.addEventListener("pointerup", xu), e.preventDefault());
	}), a.addEventListener("pointerdown", (e) => {
		let t = e.target.closest("[data-graph-group-key]");
		if (!t || e.target.closest("[data-graph-node-id]")) return;
		let n = String(t.getAttribute("data-graph-group-key") || ""), r = bi(n), i = Array.isArray(r?.nodeIds) ? r.nodeIds.filter(Boolean) : [];
		if (!i.length) return;
		let o = Tn(a, e), s = {};
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
		}, window.addEventListener("pointermove", bu), window.addEventListener("pointerup", xu), e.preventDefault());
	}), a.addEventListener("pointerdown", (e) => {
		if (e.target.closest("[data-graph-node-id], [data-graph-edge-id], [data-graph-group-key]")) return;
		let t = A.viewport || Di(A.filtered.width || 1600, A.filtered.height || 900);
		t && (A.drag = {
			kind: "pan",
			startClientX: Number(e.clientX || 0),
			startClientY: Number(e.clientY || 0),
			startCenterX: Number(t.centerX || 0),
			startCenterY: Number(t.centerY || 0),
			viewport: { ...t },
			active: !1
		}, window.addEventListener("pointermove", bu), window.addEventListener("pointerup", xu), e.preventDefault());
	})), dn(), fn(), gn(), hn();
}
// ../app/web/static/js/legion.js
var Cu = new Ml();
// src/main.tsx
window.addEventListener("DOMContentLoaded", () => {
	if (document.body.classList.contains("project-foundation")) return;
	Cu.connect();
	let e = document.getElementById("initial-snapshot");
	if (e && e.textContent) try {
		vo(JSON.parse(e.textContent));
	} catch {
		bo("Init Error", !0);
	}
	window.LEGION_WS_ENABLED ? Co() : (bo("Polling/API", !1), wo(), window.setInterval(wo, 2e3)), Al(), Pt();
	let t = document.getElementById("scheduler-form");
	t && t.addEventListener("submit", jl);
	let n = document.getElementById("scheduler-provider-select");
	n && n.addEventListener("change", () => {});
	let r = document.getElementById("scheduler-goal-select");
	r && r.addEventListener("change", Ol);
	let i = document.getElementById("engagement-scope-select");
	i && i.addEventListener("change", Ol);
	let a = document.getElementById("engagement-intent-select");
	a && a.addEventListener("change", Ol), Ol(), yu(), Su(), yr();
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
		}), e("breadcrumb-view").textContent = t[r], document.body.dataset.workspaceView = r, r === "services" && typeof fo == "function" && fo(!1), r === "graph" && typeof zt == "function" && zt() && (typeof mo == "function" && mo(!1), typeof Za == "function" && requestAnimationFrame(() => Za({ preserveDetail: !0 }))), i && o("view", r), f();
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
		(0, c.createRoot)(e).render(/* @__PURE__ */ (0, H.jsx)(Bc, {}));
		return;
	}
	let t = document.getElementById("workspace-identity-sidebar"), n = document.getElementById("workspace-identity-title"), r = document.querySelector(".workspace-project-shell"), i = document.querySelector(".workspace-breadcrumb"), a = document.getElementById("workspace-react-root"), o = document.getElementById("jobs-body");
	if (!t || !n || !r || !i || !a || !o) throw Error("Workspace component mount points are missing.");
	t.replaceChildren(), n.replaceChildren(), o.replaceChildren(), f({
		updateJobs: x,
		updateProject: b,
		beginRename: S
	}), ls(), (0, c.createRoot)(a).render(/* @__PURE__ */ (0, H.jsx)(Ve, {
		sidebar: t,
		title: n,
		sidebarEditor: r,
		titleEditor: i
	})), (0, c.createRoot)(o).render(/* @__PURE__ */ (0, H.jsx)(He, {})), a.dataset.framework = "react", o.dataset.framework = "react";
});
