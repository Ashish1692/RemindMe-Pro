const CACHE_NAME = "remindme-v1";
const ASSETS = [
	"./",
	"./index.html",
	"./manifest.json",
	"./css/variables.css",
	"./css/base.css",
	"./css/layout.css",
	"./css/components.css",
	"./css/animations.css",
];
self.addEventListener("install", (e) => {
	e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
	self.skipWaiting();
});
self.addEventListener("activate", (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((k) =>
				Promise.all(
					k
						.filter((x) => x !== CACHE_NAME)
						.map((x) => caches.delete(x)),
				),
			),
	);
	self.clients.claim();
});
self.addEventListener("fetch", (e) => {
	e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
self.addEventListener("push", (e) => {
	const d = e.data ? e.data.json() : {};
	e.waitUntil(
		self.registration.showNotification(d.title || "RemindMe Pro", {
			body: d.body || "Reminder!",
			icon: "/assets/icons/icons8-alarm-96.png",
			tag: d.tag || "r",
			data: d,
			actions: [
				{ action: "done", title: "✅ Done" },
				{ action: "snooze", title: "💤 Snooze" },
			],
		}),
	);
});
self.addEventListener("notificationclick", (e) => {
	e.notification.close();
	if (e.action === "done") {
		self.clients.matchAll().then((c) =>
			c.forEach((x) =>
				x.postMessage({
					type: "TASK_DONE",
					taskId: e.notification.data?.taskId,
				}),
			),
		);
	} else if (e.action === "snooze") {
		self.clients.matchAll().then((c) =>
			c.forEach((x) =>
				x.postMessage({
					type: "TASK_SNOOZE",
					taskId: e.notification.data?.taskId,
				}),
			),
		);
	} else {
		e.waitUntil(clients.openWindow("/"));
	}
});
