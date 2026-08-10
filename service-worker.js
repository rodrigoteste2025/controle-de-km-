// ==========================================
// SERVICE WORKER
// CONTROLE DE QUILOMETRAGEM IDAF
// ==========================================

// ==========================================
// FIREBASE CLOUD MESSAGING
// ==========================================

importScripts(
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js"
);


// ==========================================
// FIREBASE
// ==========================================

firebase.initializeApp({

    apiKey:
        "AIzaSyDpJqPqLfMA4yaBHMQEvRbK0dLYwGTp5c8",

    authDomain:
        "controle-de-quilometragem-idaf.firebaseapp.com",

    projectId:
        "controle-de-quilometragem-idaf",

    storageBucket:
        "controle-de-quilometragem-idaf.firebasestorage.app",

    messagingSenderId:
        "612792585807",

    appId:
        "1:612792585807:web:9463469153b591cf4aa43a"

});


const messaging =
    firebase.messaging();


// ==========================================
// NOTIFICAÇÃO EM SEGUNDO PLANO
// ==========================================

messaging.onBackgroundMessage(
    function(payload) {

        console.log(
            "[Firebase] Notificação recebida:",
            payload
        );


        const titulo =
            payload?.notification?.title ||
            payload?.data?.titulo ||
            "Controle de Quilometragem IDAF";


        const corpo =
            payload?.notification?.body ||
            payload?.data?.mensagem ||
            "Nova atualização";


        // --------------------------------------
        // MOSTRAR NOTIFICAÇÃO
        // --------------------------------------

        self.registration.showNotification(
            titulo,
            {

                body:
                    corpo,

                icon:
                    "/icons/icon-192.png",

                badge:
                    "/icons/icon-192.png",

                tag:
                    "controle-quilometragem-idaf",

                renotify:
                    true,

                data: {

                    url:
                        "/"

                }

            }
        );

    }
);


// ==========================================
// CLIQUE NA NOTIFICAÇÃO
// ==========================================

self.addEventListener(
    "notificationclick",
    function(event) {

        console.log(
            "[Service Worker] Clique na notificação."
        );


        event.notification.close();


        event.waitUntil(

            clients.matchAll({

                type:
                    "window",

                includeUncontrolled:
                    true

            })

            .then(
                function(clientList) {

                    // ----------------------------------
                    // PROCURA UMA JANELA JÁ ABERTA
                    // ----------------------------------

                    for (
                        const client
                        of clientList
                    ) {

                        if (
                            "focus"
                            in client
                        ) {

                            return client.focus();

                        }

                    }


                    // ----------------------------------
                    // ABRE O APLICATIVO
                    // ----------------------------------

                    if (
                        clients.openWindow
                    ) {

                        return clients.openWindow(
                            "/"
                        );

                    }

                }
            )

        );

    }
);


// ==========================================
// CACHE
// ==========================================

const CACHE_NAME =
    "controle-km-v3-aviso-sync-8";


const ARQUIVOS = [

    "./",

    "./index.html",

    "./manifest.json",

    "./css/estilo.css",

    "./js/config.js",

    "./js/utils.js",

    "./js/supabase-service.js",

    "./js/app.js",

    "./js/firebase.js",

    "./icons/icon-192.png",

    "./icons/icon-512.png"

];


// ==========================================
// INSTALAÇÃO
// ==========================================

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            )

            .then(
                async cache => {

                    console.log(
                        "[Service Worker] Iniciando cache..."
                    );


                    for (
                        const arquivo
                        of ARQUIVOS
                    ) {

                        try {

                            await cache.add(
                                arquivo
                            );


                            console.log(
                                "[Cache OK]",
                                arquivo
                            );


                        } catch (erro) {

                            console.warn(
                                "[Cache ignorado - arquivo não encontrado]",
                                arquivo
                            );

                        }

                    }


                    console.log(
                        "[Service Worker] Cache concluído."
                    );

                }
            )

        );


        self.skipWaiting();

    }
);


// ==========================================
// ATIVAÇÃO
// ==========================================

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(
                    keys => {

                        return Promise.all(

                            keys.map(
                                key => {

                                    if (
                                        key !==
                                        CACHE_NAME
                                    ) {

                                        console.log(
                                            "[Service Worker] Removendo cache antigo:",
                                            key
                                        );


                                        return caches.delete(
                                            key
                                        );

                                    }

                                }
                            )

                        );

                    }
                )

        );


        self.clients.claim();

    }
);


// ==========================================
// BUSCA DE ARQUIVOS
// ==========================================

self.addEventListener(
    "fetch",
    event => {

        const req =
            event.request;


        // --------------------------------------
        // SOMENTE GET
        // --------------------------------------

        if (
            req.method !==
            "GET"
        ) {

            return;

        }


        // --------------------------------------
        // NÃO INTERCEPTAR FIREBASE
        // NÃO INTERCEPTAR SUPABASE
        // --------------------------------------

        const url =
            new URL(
                req.url
            );


        if (
            url.hostname.includes(
                "googleapis.com"
            ) ||
            url.hostname.includes(
                "firebaseio.com"
            ) ||
            url.hostname.includes(
                "supabase.co"
            ) ||
            url.hostname.includes(
                "gstatic.com"
            )
        ) {

            return;

        }


        event.respondWith(

            fetch(req)

                .then(
                    response => {

                        // ----------------------------------
                        // GUARDA CÓPIA NO CACHE
                        // ----------------------------------

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === "basic"
                        ) {

                            const clone =
                                response.clone();


                            caches.open(
                                CACHE_NAME
                            )

                            .then(
                                cache => {

                                    cache.put(
                                        req,
                                        clone
                                    );

                                }
                            )

                            .catch(
                                () => {}
                            );

                        }


                        return response;

                    }
                )

                .catch(
                    () => {

                        // ----------------------------------
                        // OFFLINE
                        // ----------------------------------

                        return caches.match(
                            req
                        )

                        .then(
                            cached => {

                                if (
                                    cached
                                ) {

                                    return cached;

                                }


                                return caches.match(
                                    "./index.html"
                                );

                            }
                        );

                    }
                )

        );

    }
);