
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
	'use strict';

	function noop() {}

	const identity = x => x;

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

	const tasks = new Set();
	let running = false;

	function run_tasks() {
		tasks.forEach(task => {
			if (!task[0](window.performance.now())) {
				tasks.delete(task);
				task[1]();
			}
		});

		running = tasks.size > 0;
		if (running) requestAnimationFrame(run_tasks);
	}

	function loop(fn) {
		let task;

		if (!running) {
			running = true;
			requestAnimationFrame(run_tasks);
		}

		return {
			promise: new Promise(fulfil => {
				tasks.add(task = [fn, fulfil]);
			}),
			abort() {
				tasks.delete(task);
			}
		};
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

	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	function element(name) {
		return document.createElement(name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function custom_event(type, detail) {
		const e = document.createEvent('CustomEvent');
		e.initCustomEvent(type, false, false, detail);
		return e;
	}

	let stylesheet;
	let active = 0;
	let current_rules = {};

	// https://github.com/darkskyapp/string-hash/blob/master/index.js
	function hash(str) {
		let hash = 5381;
		let i = str.length;

		while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
		return hash >>> 0;
	}

	function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
		const step = 16.666 / duration;
		let keyframes = '{\n';

		for (let p = 0; p <= 1; p += step) {
			const t = a + (b - a) * ease(p);
			keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
		}

		const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
		const name = `__svelte_${hash(rule)}_${uid}`;

		if (!current_rules[name]) {
			if (!stylesheet) {
				const style = element('style');
				document.head.appendChild(style);
				stylesheet = style.sheet;
			}

			current_rules[name] = true;
			stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
		}

		const animation = node.style.animation || '';
		node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;

		active += 1;
		return name;
	}

	function delete_rule(node, name) {
		node.style.animation = (node.style.animation || '')
			.split(', ')
			.filter(name
				? anim => anim.indexOf(name) < 0 // remove specific animation
				: anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
			)
			.join(', ');

		if (name && !--active) clear_rules();
	}

	function clear_rules() {
		requestAnimationFrame(() => {
			if (active) return;
			let i = stylesheet.cssRules.length;
			while (i--) stylesheet.deleteRule(i);
			current_rules = {};
		});
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let promise;

	function wait() {
		if (!promise) {
			promise = Promise.resolve();
			promise.then(() => {
				promise = null;
			});
		}

		return promise;
	}

	function dispatch(node, direction, kind) {
		node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function create_bidirectional_transition(node, fn, params, intro) {
		let config = fn(node, params);

		let t = intro ? 0 : 1;

		let running_program = null;
		let pending_program = null;
		let animation_name = null;

		function clear_animation() {
			if (animation_name) delete_rule(node, animation_name);
		}

		function init(program, duration) {
			const d = program.b - t;
			duration *= Math.abs(d);

			return {
				a: t,
				b: program.b,
				d,
				duration,
				start: program.start,
				end: program.start + duration,
				group: program.group
			};
		}

		function go(b) {
			const {
				delay = 0,
				duration = 300,
				easing = identity,
				tick: tick$$1 = noop,
				css
			} = config;

			const program = {
				start: window.performance.now() + delay,
				b
			};

			if (!b) {
				program.group = outros;
				outros.remaining += 1;
			}

			if (running_program) {
				pending_program = program;
			} else {
				// if this is an intro, and there's a delay, we need to do
				// an initial tick and/or apply CSS animation immediately
				if (css) {
					clear_animation();
					animation_name = create_rule(node, t, b, duration, delay, easing, css);
				}

				if (b) tick$$1(0, 1);

				running_program = init(program, duration);
				add_render_callback(() => dispatch(node, b, 'start'));

				loop(now => {
					if (pending_program && now > pending_program.start) {
						running_program = init(pending_program, duration);
						pending_program = null;

						dispatch(node, running_program.b, 'start');

						if (css) {
							clear_animation();
							animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
						}
					}

					if (running_program) {
						if (now >= running_program.end) {
							tick$$1(t = running_program.b, 1 - t);
							dispatch(node, running_program.b, 'end');

							if (!pending_program) {
								// we're done
								if (running_program.b) {
									// intro — we can tidy up immediately
									clear_animation();
								} else {
									// outro — needs to be coordinated
									if (!--running_program.group.remaining) run_all(running_program.group.callbacks);
								}
							}

							running_program = null;
						}

						else if (now >= running_program.start) {
							const p = now - running_program.start;
							t = running_program.a + running_program.d * easing(p / running_program.duration);
							tick$$1(t, 1 - t);
						}
					}

					return !!(running_program || pending_program);
				});
			}
		}

		return {
			run(b) {
				if (typeof config === 'function') {
					wait().then(() => {
						config = config();
						go(b);
					});
				} else {
					go(b);
				}
			},

			end() {
				clear_animation();
				running_program = pending_program = null;
			}
		};
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = blank_object();
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	/*
	Adapted from https://github.com/mattdesl
	Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
	*/

	function fade(node, {
		delay = 0,
		duration = 400
	}) {
		const o = +getComputedStyle(node).opacity;

		return {
			delay,
			duration,
			css: t => `opacity: ${t * o}`
		};
	}

	/* src/App.svelte generated by Svelte v3.3.0 */

	const file = "src/App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.task = list[i];
		child_ctx.each_value = list;
		child_ctx.task_index = i;
		return child_ctx;
	}

	// (310:8) {:else}
	function create_else_block(ctx) {
		var p, t_value = ctx.task.description, t, p_class_value, dispose;

		function dblclick_handler() {
			return ctx.dblclick_handler(ctx);
		}

		return {
			c: function create() {
				p = element("p");
				t = text(t_value);
				p.className = p_class_value = "" + (ctx.task.completed ? 'task-description completed' : 'task-description') + " svelte-8djq0d";
				add_location(p, file, 310, 10, 5919);
				dispose = listen(p, "dblclick", dblclick_handler);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
				append(p, t);
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if ((changed.filteredTasks) && t_value !== (t_value = ctx.task.description)) {
					set_data(t, t_value);
				}

				if ((changed.filteredTasks) && p_class_value !== (p_class_value = "" + (ctx.task.completed ? 'task-description completed' : 'task-description') + " svelte-8djq0d")) {
					p.className = p_class_value;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}

				dispose();
			}
		};
	}

	// (303:8) {#if task.editing}
	function create_if_block(ctx) {
		var input, dispose;

		function input_input_handler_1() {
			ctx.input_input_handler_1.call(input, ctx);
		}

		function blur_handler() {
			return ctx.blur_handler(ctx);
		}

		function keydown_handler() {
			return ctx.keydown_handler(ctx);
		}

		return {
			c: function create() {
				input = element("input");
				input.className = "edit-task svelte-8djq0d";
				input.autofocus = true;
				add_location(input, file, 303, 10, 5682);

				dispose = [
					listen(input, "input", input_input_handler_1),
					listen(input, "blur", blur_handler),
					listen(input, "keydown", keydown_handler)
				];
			},

			m: function mount(target, anchor) {
				insert(target, input, anchor);

				input.value = ctx.task.description;

				input.focus();
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if (changed.filteredTasks && (input.value !== ctx.task.description)) input.value = ctx.task.description;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(input);
				}

				run_all(dispose);
			}
		};
	}

	// (295:4) {#each filteredTasks as task}
	function create_each_block(ctx) {
		var div1, input, t0, t1, div0, div1_transition, current, dispose;

		function input_change_handler() {
			ctx.input_change_handler.call(input, ctx);
		}

		function select_block_type(ctx) {
			if (ctx.task.editing) return create_if_block;
			return create_else_block;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(ctx);

		function click_handler() {
			return ctx.click_handler(ctx);
		}

		return {
			c: function create() {
				div1 = element("div");
				input = element("input");
				t0 = space();
				if_block.c();
				t1 = space();
				div0 = element("div");
				div0.textContent = "×";
				attr(input, "type", "checkbox");
				input.className = "completed-task svelte-8djq0d";
				add_location(input, file, 297, 8, 5535);
				div0.className = "delete-task svelte-8djq0d";
				add_location(div0, file, 316, 8, 6126);
				div1.className = "task svelte-8djq0d";
				add_location(div1, file, 295, 6, 5491);

				dispose = [
					listen(input, "change", input_change_handler),
					listen(div0, "click", click_handler)
				];
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, input);

				input.checked = ctx.task.completed;

				append(div1, t0);
				if_block.m(div1, null);
				append(div1, t1);
				append(div1, div0);
				current = true;
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if (changed.filteredTasks) input.checked = ctx.task.completed;

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(div1, t1);
					}
				}
			},

			i: function intro(local) {
				if (current) return;
				add_render_callback(() => {
					if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
					div1_transition.run(1);
				});

				current = true;
			},

			o: function outro(local) {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
				div1_transition.run(0);

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}

				if_block.d();

				if (detaching) {
					if (div1_transition) div1_transition.end();
				}

				run_all(dispose);
			}
		};
	}

	function create_fragment(ctx) {
		var div2, header, h1, t1, p, strong, t2, t3, t4, input, t5, div0, t6, div1, button0, t7, button0_class_value, t8, button1, t9, button1_class_value, t10, button2, t11, button2_class_value, t12, button3, t14, button4, current, dispose;

		var each_value = ctx.filteredTasks;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		function outro_block(i, detaching, local) {
			if (each_blocks[i]) {
				if (detaching) {
					on_outro(() => {
						each_blocks[i].d(detaching);
						each_blocks[i] = null;
					});
				}

				each_blocks[i].o(local);
			}
		}

		return {
			c: function create() {
				div2 = element("div");
				header = element("header");
				h1 = element("h1");
				h1.textContent = "My Tasks";
				t1 = space();
				p = element("p");
				strong = element("strong");
				t2 = text(ctx.tasksRemaining);
				t3 = text("\n      tasks remaining");
				t4 = space();
				input = element("input");
				t5 = space();
				div0 = element("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t6 = space();
				div1 = element("div");
				button0 = element("button");
				t7 = text("All");
				t8 = space();
				button1 = element("button");
				t9 = text("Active");
				t10 = space();
				button2 = element("button");
				t11 = text("Completed");
				t12 = space();
				button3 = element("button");
				button3.textContent = "Select all";
				t14 = space();
				button4 = element("button");
				button4.textContent = "Remove completed";
				h1.className = "logo svelte-8djq0d";
				add_location(h1, file, 280, 4, 5147);
				strong.className = "svelte-8djq0d";
				add_location(strong, file, 282, 6, 5216);
				p.className = "tasks-remaining svelte-8djq0d";
				add_location(p, file, 281, 4, 5182);
				header.className = "header svelte-8djq0d";
				add_location(header, file, 279, 2, 5119);
				input.className = "task-input svelte-8djq0d";
				input.placeholder = "Enter a task...";
				attr(input, "type", "text");
				add_location(input, file, 286, 2, 5295);
				div0.className = "tasks";
				add_location(div0, file, 293, 2, 5431);
				button0.className = button0_class_value = "" + (ctx.currentFilter === 'all' ? 'filter-button active' : 'filter-button') + " svelte-8djq0d";
				add_location(button0, file, 322, 4, 6259);
				button1.className = button1_class_value = "" + (ctx.currentFilter === 'active' ? 'filter-button active' : 'filter-button') + " svelte-8djq0d";
				add_location(button1, file, 327, 4, 6420);
				button2.className = button2_class_value = "" + (ctx.currentFilter === 'completed' ? 'filter-button active' : 'filter-button') + " svelte-8djq0d";
				add_location(button2, file, 332, 4, 6590);
				button3.className = "select-all-tasks svelte-8djq0d";
				add_location(button3, file, 337, 4, 6769);
				button4.className = "remove-completed-tasks svelte-8djq0d";
				add_location(button4, file, 340, 4, 6864);
				div1.className = "options svelte-8djq0d";
				add_location(div1, file, 321, 2, 6233);
				div2.className = "container svelte-8djq0d";
				add_location(div2, file, 278, 0, 5093);

				dispose = [
					listen(input, "input", ctx.input_input_handler),
					listen(input, "keydown", ctx.addTask),
					listen(button0, "click", ctx.click_handler_1),
					listen(button1, "click", ctx.click_handler_2),
					listen(button2, "click", ctx.click_handler_3),
					listen(button3, "click", ctx.selectAllTasks),
					listen(button4, "click", ctx.clearCompletedTasks)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div2, anchor);
				append(div2, header);
				append(header, h1);
				append(header, t1);
				append(header, p);
				append(p, strong);
				append(strong, t2);
				append(p, t3);
				append(div2, t4);
				append(div2, input);

				input.value = ctx.newTask;

				append(div2, t5);
				append(div2, div0);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div0, null);
				}

				append(div2, t6);
				append(div2, div1);
				append(div1, button0);
				append(button0, t7);
				append(div1, t8);
				append(div1, button1);
				append(button1, t9);
				append(div1, t10);
				append(div1, button2);
				append(button2, t11);
				append(div1, t12);
				append(div1, button3);
				append(div1, t14);
				append(div1, button4);
				current = true;
			},

			p: function update(changed, ctx) {
				if (!current || changed.tasksRemaining) {
					set_data(t2, ctx.tasksRemaining);
				}

				if (changed.newTask && (input.value !== ctx.newTask)) input.value = ctx.newTask;

				if (changed.filteredTasks) {
					each_value = ctx.filteredTasks;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
							each_blocks[i].i(1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].i(1);
							each_blocks[i].m(div0, null);
						}
					}

					group_outros();
					for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
					check_outros();
				}

				if ((!current || changed.currentFilter) && button0_class_value !== (button0_class_value = "" + (ctx.currentFilter === 'all' ? 'filter-button active' : 'filter-button') + " svelte-8djq0d")) {
					button0.className = button0_class_value;
				}

				if ((!current || changed.currentFilter) && button1_class_value !== (button1_class_value = "" + (ctx.currentFilter === 'active' ? 'filter-button active' : 'filter-button') + " svelte-8djq0d")) {
					button1.className = button1_class_value;
				}

				if ((!current || changed.currentFilter) && button2_class_value !== (button2_class_value = "" + (ctx.currentFilter === 'completed' ? 'filter-button active' : 'filter-button') + " svelte-8djq0d")) {
					button2.className = button2_class_value;
				}
			},

			i: function intro(local) {
				if (current) return;
				for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

				current = true;
			},

			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);
				for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div2);
				}

				destroy_each(each_blocks, detaching);

				run_all(dispose);
			}
		};
	}

	const ENTER_KEY = 13;

	function instance($$self, $$props, $$invalidate) {
		

	  let currentFilter = "all";
	  let newTask = "";
	  let tempId = 4;
	  let tasks = [
	    {
	      id: 1,
	      description: "Schedule appointment",
	      completed: false,
	      editing: false
	    },
	    {
	      id: 2,
	      description: "Send email",
	      completed: false,
	      editing: false
	    },
	    {
	      id: 3,
	      description: "Register for conference",
	      completed: false,
	      editing: false
	    },
	    {
	      id: 4,
	      description: "Pay bill",
	      completed: false,
	      editing: false
	    },
	    {
	      id: 5,
	      description: "Make dinner reservations",
	      completed: false,
	      editing: false
	    }
	  ];

	  function addTask(event) {
	    if (event.which === ENTER_KEY) {
	      tasks.push({
	        id: tempId,
	        description: newTask,
	        completed: false,
	        editing: false
	      });
	      $$invalidate('tasks', tasks);
	      $$invalidate('tempId', tempId += 1);
	      $$invalidate('newTask', newTask = "");
	    }
	  }

	  function editTask(task) {
	    task.editing = true;
	    $$invalidate('tasks', tasks);
	  }

	  function finishEdit(task) {
	    task.editing = false;
	    $$invalidate('tasks', tasks);
	  }

	  function finishEditKeydown(task, event) {
	    if (event.which === ENTER_KEY) {
	      finishEdit(task);
	    }
	  }

	  function deleteTask(id) {
	    $$invalidate('tasks', tasks = tasks.filter(task => task.id !== id));
	  }

	  function selectAllTasks() {
	    tasks.forEach(task => (task.completed = true));
	    $$invalidate('tasks', tasks);
	  }

	  function updateFilter(filter) {
	    $$invalidate('currentFilter', currentFilter = filter);
	  }

	  function clearCompletedTasks() {
	    $$invalidate('tasks', tasks = tasks.filter(task => !task.completed));
	  }

		function input_input_handler() {
			newTask = this.value;
			$$invalidate('newTask', newTask);
		}

		function input_change_handler({ task, each_value, task_index }) {
			each_value[task_index].completed = this.checked;
			$$invalidate('filteredTasks', filteredTasks), $$invalidate('currentFilter', currentFilter), $$invalidate('tasks', tasks);
		}

		function input_input_handler_1({ task, each_value, task_index }) {
			each_value[task_index].description = this.value;
			$$invalidate('filteredTasks', filteredTasks), $$invalidate('currentFilter', currentFilter), $$invalidate('tasks', tasks);
		}

		function blur_handler({ task }) {
			return finishEdit(task);
		}

		function keydown_handler({ task }) {
			return finishEditKeydown(task, event);
		}

		function dblclick_handler({ task }) {
			return editTask(task);
		}

		function click_handler({ task }) {
			return deleteTask(task.id);
		}

		function click_handler_1() {
			return updateFilter('all');
		}

		function click_handler_2() {
			return updateFilter('active');
		}

		function click_handler_3() {
			return updateFilter('completed');
		}

		let tasksRemaining, filteredTasks;

		$$self.$$.update = ($$dirty = { tasks: 1, currentFilter: 1 }) => {
			if ($$dirty.tasks) { $$invalidate('tasksRemaining', tasksRemaining = tasks.filter(task => !task.completed).length); }
			if ($$dirty.currentFilter || $$dirty.tasks) { $$invalidate('filteredTasks', filteredTasks =
	        currentFilter === "all"
	          ? tasks
	          : currentFilter === "completed"
	          ? tasks.filter(task => task.completed)
	          : tasks.filter(task => !task.completed)); }
		};

		return {
			currentFilter,
			newTask,
			addTask,
			editTask,
			finishEdit,
			finishEditKeydown,
			deleteTask,
			selectAllTasks,
			updateFilter,
			clearCompletedTasks,
			tasksRemaining,
			filteredTasks,
			input_input_handler,
			input_change_handler,
			input_input_handler_1,
			blur_handler,
			keydown_handler,
			dblclick_handler,
			click_handler,
			click_handler_1,
			click_handler_2,
			click_handler_3
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, []);
		}
	}

	const app = new App({
		target: document.body,
		props: {
			name: 'world'
		}
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
