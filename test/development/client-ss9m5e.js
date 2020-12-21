(function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                let j = 0;
                const remove = [];
                while (j < node.attributes.length) {
                    const attribute = node.attributes[j++];
                    if (!attributes[attribute.name]) {
                        remove.push(attribute.name);
                    }
                }
                for (let k = 0; k < remove.length; k++) {
                    node.removeAttribute(remove[k]);
                }
                return nodes.splice(i, 1)[0];
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function claim_text(nodes, data) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeType === 3) {
                node.data = '' + data;
                return nodes.splice(i, 1)[0];
            }
        }
        return text(data);
    }
    function claim_space(nodes) {
        return claim_text(nodes, ' ');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    function query_selector_all(selector, parent = document.body) {
        return Array.from(parent.querySelectorAll(selector));
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function claim_component(block, parent_nodes) {
        block && block.l(parent_nodes);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* test/fixtures/src/components/Message.svelte generated by Svelte v3.31.0 */

    const file = "test/fixtures/src/components/Message.svelte";

    function create_fragment(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Have a ");
    			t1 = text(/*adjective*/ ctx[0]);
    			t2 = text(" day!");
    			this.h();
    		},
    		l: function claim(nodes) {
    			span = claim_element(nodes, "SPAN", { id: true, class: true });
    			var span_nodes = children(span);
    			t0 = claim_text(span_nodes, "Have a ");
    			t1 = claim_text(span_nodes, /*adjective*/ ctx[0]);
    			t2 = claim_text(span_nodes, " day!");
    			span_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(span, "id", "message");
    			attr_dev(span, "class", "svelte-1l1lbdl");
    			add_location(span, file, 6, 0, 46);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*adjective*/ 1) set_data_dev(t1, /*adjective*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Message", slots, []);
    	let { adjective } = $$props;
    	const writable_props = ["adjective"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Message> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("adjective" in $$props) $$invalidate(0, adjective = $$props.adjective);
    	};

    	$$self.$capture_state = () => ({ adjective });

    	$$self.$inject_state = $$props => {
    		if ("adjective" in $$props) $$invalidate(0, adjective = $$props.adjective);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [adjective];
    }

    class Message extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { adjective: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Message",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*adjective*/ ctx[0] === undefined && !("adjective" in props)) {
    			console.warn("<Message> was created without expected prop 'adjective'");
    		}
    	}

    	get adjective() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set adjective(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var RGX = /([^{]*?)\w(?=\})/g;

    var MAP = {
    	YYYY: 'getFullYear',
    	YY: 'getYear',
    	MM: function (d) {
    		return d.getMonth() + 1;
    	},
    	DD: 'getDate',
    	HH: 'getHours',
    	mm: 'getMinutes',
    	ss: 'getSeconds',
    	fff: 'getMilliseconds'
    };

    function tinydate (str, custom) {
    	var parts=[], offset=0;

    	str.replace(RGX, function (key, _, idx) {
    		// save preceding string
    		parts.push(str.substring(offset, idx - 1));
    		offset = idx += key.length + 1;
    		// save function
    		parts.push(custom && custom[key] || function (d) {
    			return ('00' + (typeof MAP[key] === 'string' ? d[MAP[key]]() : MAP[key](d))).slice(-key.length);
    		});
    	});

    	if (offset !== str.length) {
    		parts.push(str.substring(offset));
    	}

    	return function (arg) {
    		var out='', i=0, d=arg||new Date();
    		for (; i<parts.length; i++) {
    			out += (typeof parts[i]==='string') ? parts[i] : parts[i](d);
    		}
    		return out;
    	};
    }

    /* test/fixtures/src/components/Clock.svelte generated by Svelte v3.31.0 */
    const file$1 = "test/fixtures/src/components/Clock.svelte";

    function create_fragment$1(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("The time is now ");
    			t1 = text(/*time*/ ctx[0]);
    			t2 = text(" on ");
    			t3 = text(/*date*/ ctx[1]);
    			t4 = text(".");
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", { id: true, class: true });
    			var p_nodes = children(p);
    			t0 = claim_text(p_nodes, "The time is now ");
    			t1 = claim_text(p_nodes, /*time*/ ctx[0]);
    			t2 = claim_text(p_nodes, " on ");
    			t3 = claim_text(p_nodes, /*date*/ ctx[1]);
    			t4 = claim_text(p_nodes, ".");
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(p, "id", "time");
    			attr_dev(p, "class", "svelte-xvgr68");
    			add_location(p, file$1, 25, 0, 459);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*time*/ 1) set_data_dev(t1, /*time*/ ctx[0]);
    			if (dirty & /*date*/ 2) set_data_dev(t3, /*date*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Clock", slots, []);
    	const formatTime = tinydate("{HH}:{mm}:{ss}");
    	const formatDate = tinydate("{MM}/{DD}/{YY}");
    	let now = new Date("Jan 1, 0 0:0");

    	onMount(() => {
    		const interval = setInterval(
    			() => {
    				$$invalidate(2, now = new Date());
    			},
    			1000
    		);

    		return () => {
    			clearInterval(interval);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		tinydate,
    		onMount,
    		formatTime,
    		formatDate,
    		now,
    		time,
    		date
    	});

    	$$self.$inject_state = $$props => {
    		if ("now" in $$props) $$invalidate(2, now = $$props.now);
    		if ("time" in $$props) $$invalidate(0, time = $$props.time);
    		if ("date" in $$props) $$invalidate(1, date = $$props.date);
    	};

    	let time;
    	let date;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*now*/ 4) {
    			 $$invalidate(0, time = formatTime(now));
    		}

    		if ($$self.$$.dirty & /*now*/ 4) {
    			 $$invalidate(1, date = formatDate(now));
    		}
    	};

    	return [time, date, now];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* test/fixtures/src/index.svelte generated by Svelte v3.31.0 */
    const file$2 = "test/fixtures/src/index.svelte";

    function create_fragment$2(ctx) {
    	let meta;
    	let t0;
    	let div;
    	let p;
    	let span;
    	let t1;
    	let t2;
    	let message;
    	let t3;
    	let clock;
    	let current;

    	message = new Message({
    			props: { adjective: /*adjective*/ ctx[0] },
    			$$inline: true
    		});

    	clock = new Clock({ $$inline: true });

    	const block = {
    		c: function create() {
    			meta = element("meta");
    			t0 = space();
    			div = element("div");
    			p = element("p");
    			span = element("span");
    			t1 = text("Hello, World!");
    			t2 = space();
    			create_component(message.$$.fragment);
    			t3 = space();
    			create_component(clock.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			const head_nodes = query_selector_all("[data-svelte=\"svelte-rgky3q\"]", document.head);
    			meta = claim_element(head_nodes, "META", { name: true, content: true });
    			head_nodes.forEach(detach_dev);
    			t0 = claim_space(nodes);
    			div = claim_element(nodes, "DIV", {});
    			var div_nodes = children(div);
    			p = claim_element(div_nodes, "P", { class: true });
    			var p_nodes = children(p);
    			span = claim_element(p_nodes, "SPAN", { id: true });
    			var span_nodes = children(span);
    			t1 = claim_text(span_nodes, "Hello, World!");
    			span_nodes.forEach(detach_dev);
    			t2 = claim_space(p_nodes);
    			claim_component(message.$$.fragment, p_nodes);
    			p_nodes.forEach(detach_dev);
    			t3 = claim_space(div_nodes);
    			claim_component(clock.$$.fragment, div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			document.title = " My Site ";
    			attr_dev(meta, "name", "description");
    			attr_dev(meta, "content", "All the things");
    			add_location(meta, file$2, 11, 2, 203);
    			attr_dev(span, "id", "hello");
    			add_location(span, file$2, 17, 4, 287);
    			attr_dev(p, "class", "svelte-16n4a6z");
    			add_location(p, file$2, 16, 2, 279);
    			add_location(div, file$2, 15, 0, 271);
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, meta);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, span);
    			append_dev(span, t1);
    			append_dev(p, t2);
    			mount_component(message, p, null);
    			append_dev(div, t3);
    			mount_component(clock, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const message_changes = {};
    			if (dirty & /*adjective*/ 1) message_changes.adjective = /*adjective*/ ctx[0];
    			message.$set(message_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(message.$$.fragment, local);
    			transition_in(clock.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(message.$$.fragment, local);
    			transition_out(clock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(meta);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(message);
    			destroy_component(clock);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Src", slots, []);
    	let { adjective = "nice" } = $$props;
    	const writable_props = ["adjective"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Src> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("adjective" in $$props) $$invalidate(0, adjective = $$props.adjective);
    	};

    	$$self.$capture_state = () => ({ Message, Clock, adjective });

    	$$self.$inject_state = $$props => {
    		if ("adjective" in $$props) $$invalidate(0, adjective = $$props.adjective);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [adjective];
    }

    class Src extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { adjective: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Src",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get adjective() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set adjective(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    try {
      const client = new Src({
        target: document.body,
        hydrate: true,
        props: {
          adjective: 'lovely',
        },
      });
    } catch (err) {
      console.error(err);
    }

}());
