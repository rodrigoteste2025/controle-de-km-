// ==========================================
// FIREBASE MESSAGING SERVICE WORKER
// CONTROLE DE QUILOMETRAGEM IDAF
// ==========================================


// Firebase App
importScripts(
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"
);


// Firebase Messaging
importScripts(
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js"
);


// ==========================================
// CONFIGURAÇÃO FIREBASE
// ==========================================

firebase.initializeApp({

    apiKey: "AIzaSyDpJqPqLfMA4yaBHMQEvRbK0dLYwGTp5c8",

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


// ==========================================
// FIREBASE MESSAGING
// ==========================================

const messaging = firebase.messaging();


// ==========================================
// NOTIFICAÇÃO EM SEGUNDO PLANO
// ==========================================

messaging.onBackgroundMessage(
    function(payload) {

        console.log(
            "[firebase-messaging-sw.js] Notificação recebida:",
            payload
        );


        const titulo =
            payload?.notification?.title ||
            "Controle de Quilometragem IDAF";


        const corpo =
            payload?.notification?.body ||
            "Nova atualização no sistema";


        const opcoes = {

            body: corpo,

            icon: "/icons/icon-192.png",

            badge: "/icons/icon-192.png",

            tag: "controle-quilometragem-idaf",

            renotify: true,

            data: {

                url: "/"

            }

        };


        return self.registration.showNotification(
            titulo,
            opcoes
        );

    }
);


// ==========================================
// CLIQUE NA NOTIFICAÇÃO
// ==========================================

self.addEventListener(
    "notificationclick",
    function(event) {

        event.notification.close();


        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            })

            .then(function(clientList) {

                // Se o aplicativo já estiver aberto,
                // coloca a janela em primeiro plano.

                for (
                    const client of clientList
                ) {

                    if (
                        "focus" in client
                    ) {

                        return client.focus();

                    }

                }


                // Caso não esteja aberto,
                // abre o aplicativo.

                if (
                    clients.openWindow
                ) {

                    return clients.openWindow(
                        "/"
                    );

                }

            })

        );

    }
);