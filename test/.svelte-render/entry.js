function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
const escaped = {
    '"': '&quot;',
    "'": '&#39;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};
function escape(html) {
    return String(html).replace(/["'&<>]/g, match => escaped[match]);
}
function validate_component(component, name) {
    if (!component || !component.$$render) {
        if (name === 'svelte:component')
            name += ' this={...}';
        throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
    }
    return component;
}
let on_destroy;
function create_ssr_component(fn) {
    function $$render(result, props, bindings, slots) {
        const parent_component = current_component;
        const $$ = {
            on_destroy,
            context: new Map(parent_component ? parent_component.$$.context : []),
            // these will be immediately discarded
            on_mount: [],
            before_update: [],
            after_update: [],
            callbacks: blank_object()
        };
        set_current_component({ $$ });
        const html = fn(result, props, bindings, slots);
        set_current_component(parent_component);
        return html;
    }
    return {
        render: (props = {}, options = {}) => {
            on_destroy = [];
            const result = { title: '', head: '', css: new Set() };
            const html = $$render(result, props, {}, options);
            run_all(on_destroy);
            return {
                html,
                css: {
                    code: Array.from(result.css).map(css => css.code).join('\n'),
                    map: null // TODO
                },
                head: result.title + result.head
            };
        },
        $$render
    };
}

/* test/fixtures/components/Message.svelte generated by Svelte v3.22.2 */

const css = {
	code: "span.svelte-1l1lbdl{font-style:italic;color:purple}",
	map: "{\"version\":3,\"file\":\"Message.svelte\",\"sources\":[\"Message.svelte\"],\"sourcesContent\":[\"<script>\\n  export let adjective;\\n\\n</script>\\n\\n\\n<span id=\\\"message\\\"> Have a {adjective} day! </span>\\n\\n\\n<style>\\n  span {\\n    font-style: italic;\\n    color: purple;\\n  }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAUE,IAAI,eAAC,CAAC,AACJ,UAAU,CAAE,MAAM,CAClB,KAAK,CAAE,MAAM,AACf,CAAC\"}"
};

const Message = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { adjective } = $$props;
	if ($$props.adjective === void 0 && $$bindings.adjective && adjective !== void 0) $$bindings.adjective(adjective);
	$$result.css.add(css);
	return `<span id="${"message"}" class="${"svelte-1l1lbdl"}">Have a ${escape(adjective)} day! </span>`;
});

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

/* test/fixtures/components/Clock.svelte generated by Svelte v3.22.2 */

const css$1 = {
	code: "p.svelte-xvgr68{color:red}",
	map: "{\"version\":3,\"file\":\"Clock.svelte\",\"sources\":[\"Clock.svelte\"],\"sourcesContent\":[\"<script>\\n  import tinydate from 'tinydate';\\n  import { onMount } from 'svelte';\\n\\n  const formatTime = tinydate('{HH}:{mm}:{ss}');\\n  const formatDate = tinydate('{MM}/{DD}/{YY}');\\n   \\n  let now = new Date('Jan 1, 0 0:0');\\n\\n  $: time = formatTime(now);\\n  $: date = formatDate(now);\\n\\n  onMount(() => {\\n    const interval = setInterval(() => {\\n      now = new Date();\\n    }, 1000);\\n    \\n    return () => {\\n      clearInterval(interval);\\n    };\\n  });\\n\\n</script>\\n\\n\\n<p id=\\\"time\\\"> The time is now {time} on {date}. </p>\\n\\n\\n<style>\\n  p {\\n    color: red;\\n  }\\n\\n</style>\\n\"],\"names\":[],\"mappings\":\"AA6BE,CAAC,cAAC,CAAC,AACD,KAAK,CAAE,GAAG,AACZ,CAAC\"}"
};

const Clock = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	const formatTime = tinydate("{HH}:{mm}:{ss}");
	const formatDate = tinydate("{MM}/{DD}/{YY}");
	let now = new Date("Jan 1, 0 0:0");

	onMount(() => {
		const interval = setInterval(
			() => {
				now = new Date();
			},
			1000
		);

		return () => {
			clearInterval(interval);
		};
	});

	$$result.css.add(css$1);
	let time = formatTime(now);
	let date = formatDate(now);
	return `<p id="${"time"}" class="${"svelte-xvgr68"}">The time is now ${escape(time)} on ${escape(date)}. </p>`;
});

/* test/fixtures/index.svelte generated by Svelte v3.22.2 */

const css$2 = {
	code: "p.svelte-16n4a6z{font-weight:bold;color:blue}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script>\\n  import Message from './components/Message.svelte';\\n  import Clock from './components/Clock.svelte';\\n  \\n  export let adjective = 'nice';\\n\\n</script>\\n\\n\\n<svelte:head>\\n  <title> My Site </title>\\n  <meta name=\\\"description\\\" content=\\\"All the things\\\">\\n</svelte:head>\\n\\n\\n<div>\\n  <p>\\n    <span id=\\\"hello\\\"> Hello, World! </span>\\n    <Message {adjective}/>\\n  </p>\\n  <Clock/>\\n</div>\\n\\n\\n<style>\\n  p {\\n    font-weight: bold;\\n    color: blue;\\n  }\\n</style>\\n\"],\"names\":[],\"mappings\":\"AAyBE,CAAC,eAAC,CAAC,AACD,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,IAAI,AACb,CAAC\"}"
};

const Fixtures = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { adjective = "nice" } = $$props;
	if ($$props.adjective === void 0 && $$bindings.adjective && adjective !== void 0) $$bindings.adjective(adjective);
	$$result.css.add(css$2);

	return `${($$result.head += `${($$result.title = `<title> My Site </title>`, "")}<meta name="${"description"}" content="${"All the things"}" data-svelte="svelte-rgky3q">`, "")}


<div><p class="${"svelte-16n4a6z"}"><span id="${"hello"}">Hello, World! </span>
    ${validate_component(Message, "Message").$$render($$result, { adjective }, {}, {})}</p>
  ${validate_component(Clock, "Clock").$$render($$result, {}, {}, {})}
</div>`;
});

export default Fixtures;
