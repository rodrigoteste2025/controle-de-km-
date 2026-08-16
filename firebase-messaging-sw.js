// ==========================================
// FIREBASE MESSAGING SERVICE WORKER
// CONTROLE DE QUILOMETRAGEM IDAF
// ==========================================


// ==========================================
// FIREBASE APP
// ==========================================

importScripts(
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"
);


// ==========================================
// FIREBASE MESSAGING
// ==========================================

importScripts(
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js"
);


// ==========================================
// CONFIGURAÇÃO FIREBASE
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


// ==========================================
// FIREBASE MESSAGING
// ==========================================

const messaging =
    firebase.messaging();


// ==========================================
// NOTIFICAÇÃO EM SEGUNDO PLANO
// ==========================================

messaging.onBackgroundMessage(
    function(payload) {

        console.log(
            "[firebase-messaging-sw.js]",
            "Mensagem recebida:",
            payload
        );


        // ======================================
        // PEGAR DADOS DA MENSAGEM
        // ======================================

        const titulo =
            payload?.data?.titulo ||
            "Controle de Quilometragem IDAF";


        const corpo =
            payload?.data?.mensagem ||
            "Nova atualização no sistema";


        console.log(
            "Título:",
            titulo
        );


        console.log(
            "Mensagem:",
            corpo
        );


        // ======================================
        // OPÇÕES DA NOTIFICAÇÃO
        // ======================================

        const opcoes = {

            body:
                corpo,

            icon:
                "/icons/icon-192.png.png",

            badge:
                "/icons/icon-192.png.png",

            tag:
                "controle-quilometragem-idaf",

            renotify:
                true,

            data: {

                url:
                    "/"

            }

        };


        // ======================================
        // MOSTRAR UMA ÚNICA NOTIFICAÇÃO
        // ======================================

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

        console.log(
            "Notificação clicada."
        );


        event.notification.close();


        event.waitUntil(

            clients.matchAll({

                type:
                    "window",

                includeUncontrolled:
                    true

            })

            .then(function(clientList) {


                // =================================
                // SE O APP JÁ ESTIVER ABERTO
                // =================================

                for (
                    const client of clientList
                ) {

                    if (
                        "focus" in client
                    ) {

                        return client.focus();

                    }

                }


                // =================================
                // SE O APP NÃO ESTIVER ABERTO
                // =================================

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