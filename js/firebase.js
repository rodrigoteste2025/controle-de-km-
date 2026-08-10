// ==========================================
// FIREBASE CLOUD MESSAGING
// CONTROLE DE QUILOMETRAGEM IDAF
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
    getMessaging,
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging.js";

// ==========================================
// CONFIGURAÇÃO FIREBASE
// ==========================================

const firebaseConfig = {

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
        "1:612792585807:web:9463469153b591cf4aa43a",

    measurementId:
        "G-KFC8W5RWR7"
};

// ==========================================
// INICIALIZA FIREBASE
// ==========================================

const app =
    initializeApp(firebaseConfig);

const messaging =
    getMessaging(app);

// ==========================================
// CHAVE VAPID
// ==========================================

const VAPID_KEY =
    "BA1TogBuACD2RAz5Jul9DMBvwqNRr47nnjRHHZbNLzQ4oqq81UGArUDlJ49rlFfWI0TtX8JDgh1WJ1_kP44rgGA";

// ==========================================
// DETECTAR PWA / IOS
// ==========================================

function isIOS() {

    return /iPad|iPhone|iPod/.test(
        navigator.userAgent
    ) ||
    (
        navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1
    );

}


function isStandalone() {

    return (
        window.matchMedia &&
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches
    ) ||
    window.navigator.standalone === true;

}


// ==========================================
// ATUALIZAR BOTÃO
// ==========================================

function atualizarBotaoNotificacao(
    estado
) {

    const botao =
        document.getElementById(
            "btnAtivarNotificacoes"
        );

    if (!botao) return;


    if (estado === "ativando") {

        botao.disabled = true;

        botao.innerText =
            "🔄 Ativando notificações...";

        return;

    }


    if (estado === "ativo") {

        botao.disabled = false;

        botao.innerText =
            "🔔 Notificações ativadas";

        botao.classList.add(
            "notificacoes-ativas"
        );

        return;

    }


    if (estado === "negado") {

        botao.disabled = false;

        botao.innerText =
            "⚠️ Notificações bloqueadas";

        return;

    }


    botao.disabled = false;

    botao.innerText =
        "🔔 Ativar notificações";

}


// ==========================================
// REGISTRAR FIREBASE
// ==========================================

async function registrarFirebase() {

    try {

        console.log(
            "===================================="
        );

        console.log(
            "Iniciando Firebase..."
        );

        console.log(
            "iOS:",
            isIOS()
        );

        console.log(
            "PWA instalado:",
            isStandalone()
        );

        console.log(
            "===================================="
        );


        // ------------------------------------------
        // VERIFICA SUPORTE
        // ------------------------------------------

        if (!("Notification" in window)) {

            console.error(
                "Este navegador não suporta notificações."
            );

            alert(
                "Este dispositivo/navegador não oferece suporte a notificações."
            );

            return;

        }


        // ------------------------------------------
        // iPhone precisa estar como PWA
        // ------------------------------------------

        if (
            isIOS() &&
            !isStandalone()
        ) {

            console.warn(
                "iPhone não está executando como PWA."
            );

            alert(
                "No iPhone, primeiro adicione o aplicativo à Tela de Início e depois abra o aplicativo pelo ícone."
            );

            return;

        }


        atualizarBotaoNotificacao(
            "ativando"
        );


        // ------------------------------------------
        // PERMISSÃO
        // ------------------------------------------

        let permissao =
            Notification.permission;


        console.log(
            "Permissão atual:",
            permissao
        );


        if (
            permissao !== "granted"
        ) {

            permissao =
                await Notification.requestPermission();

        }


        console.log(
            "Permissão depois da solicitação:",
            permissao
        );


        if (
            permissao !== "granted"
        ) {

            console.warn(
                "Notificações não autorizadas."
            );

            atualizarBotaoNotificacao(
                "negado"
            );

            return;

        }


        console.log(
            "Permissão concedida."
        );


        // ------------------------------------------
        // SERVICE WORKER
        // ------------------------------------------

        if (
            !("serviceWorker" in navigator)
        ) {

            console.error(
                "Service Worker não é suportado."
            );

            atualizarBotaoNotificacao(
                "negado"
            );

            return;

        }


        const registrations =
            await navigator.serviceWorker
                .getRegistrations();


        console.log(
            "Service Workers encontrados:",
            registrations
        );


        // ------------------------------------------
        // PROCURA SERVICE WORKER PRINCIPAL
        // ------------------------------------------

        let registration =
            registrations.find(
                reg =>
                    reg.active &&
                    reg.active.scriptURL.includes(
                        "service-worker.js"
                    )
            );


        // ------------------------------------------
        // SE NÃO EXISTIR, REGISTRA
        // ------------------------------------------

        if (!registration) {

            try {

                registration =
                    await navigator.serviceWorker.register(
                        "/service-worker.js"
                    );

                console.log(
                    "Service Worker principal registrado:",
                    registration
                );


            } catch (erroSW) {

                console.error(
                    "Erro ao registrar Service Worker:",
                    erroSW
                );

                atualizarBotaoNotificacao(
                    "negado"
                );

                return;

            }

        } else {

            console.log(
                "Service Worker principal encontrado:",
                registration
            );

        }


        // ------------------------------------------
        // GARANTE SERVICE WORKER ATIVO
        // ------------------------------------------

        if (
            !registration.active
        ) {

            console.log(
                "Aguardando Service Worker ficar ativo..."
            );

            await new Promise(
                resolve => {

                    const limite =
                        setTimeout(
                            resolve,
                            5000
                        );

                    registration.addEventListener(
                        "updatefound",
                        () => {

                            const novo =
                                registration.installing;

                            if (!novo) return;

                            novo.addEventListener(
                                "statechange",
                                () => {

                                    if (
                                        novo.state ===
                                        "activated"
                                    ) {

                                        clearTimeout(
                                            limite
                                        );

                                        resolve();

                                    }

                                }
                            );

                        }
                    );

                }
            );

        }


        // ------------------------------------------
        // GERA TOKEN FIREBASE
        // ------------------------------------------

        console.log(
            "Gerando token Firebase..."
        );


        const token =
            await getToken(
                messaging,
                {

                    vapidKey:
                        VAPID_KEY,

                    serviceWorkerRegistration:
                        registration

                }
            );


        // ------------------------------------------
        // VERIFICA TOKEN
        // ------------------------------------------

        if (!token) {

            console.error(
                "Nenhum token Firebase foi gerado."
            );

            atualizarBotaoNotificacao(
                "negado"
            );

            return;

        }


        console.log(
            "===================================="
        );

        console.log(
            "TOKEN FIREBASE:"
        );

        console.log(token);

        console.log(
            "===================================="
        );


        // ------------------------------------------
        // SALVA LOCALMENTE
        // ------------------------------------------

        localStorage.setItem(
            "firebase_token",
            token
        );


        // ==========================================
        // SUPABASE
        // ==========================================

        const SUPABASE_URL =
            "https://ocxyxgjauhrmtenbsvhf.supabase.co";


        const SUPABASE_ANON_KEY =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeHl4Z2phdWhybXRlbmJzdmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMDg4ODYsImV4cCI6MjA5ODc4NDg4Nn0.n1hW9qwmFdeqywxZVEz9XbJb-h1C0ztKTgCJioS_71Y";


        if (
            !window.supabase ||
            !window.supabase.createClient
        ) {

            console.error(
                "Biblioteca Supabase não encontrada."
            );

            atualizarBotaoNotificacao(
                "negado"
            );

            return;

        }


        const supabasePush =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );


        console.log(
            "Supabase para notificações conectado."
        );


        // ------------------------------------------
        // SALVA TOKEN NO SUPABASE
        // ------------------------------------------

        const {
            data,
            error
        } =
            await supabasePush
                .from("tokens_push")
                .upsert(

                    {

                        token: token,

                        usuario:
                            localStorage.getItem(
                                "usuario"
                            ) ||
                            "SEM NOME",

                        dispositivo:
                            navigator.platform,

                        navegador:
                            navigator.userAgent,

                        ativo:
                            true,

                        atualizado_em:
                            new Date().toISOString()

                    },

                    {

                        onConflict:
                            "token"

                    }

                );


        // ------------------------------------------
        // VERIFICA ERRO SUPABASE
        // ------------------------------------------

        if (error) {

            console.error(
                "Erro ao salvar token no Supabase:",
                error
            );

            atualizarBotaoNotificacao(
                "negado"
            );

            alert(
                "Firebase conectado, mas houve erro ao salvar o token no Supabase."
            );

            return;

        }


        console.log(
            "Token salvo no Supabase com sucesso!"
        );


        // ------------------------------------------
        // MARCA COMO CONECTADO
        // ------------------------------------------

        localStorage.setItem(
            "firebase_conectado",
            "true"
        );


        localStorage.setItem(
            "notificacoes_ativas",
            "true"
        );


        atualizarBotaoNotificacao(
            "ativo"
        );


        console.log(
            "Firebase conectado com sucesso!"
        );


        // ------------------------------------------
        // TESTE LOCAL
        // ------------------------------------------

        console.log(
            "Dispositivo pronto para receber Push."
        );


    } catch (erro) {

        console.error(
            "Erro no Firebase:",
            erro
        );

        atualizarBotaoNotificacao(
            "negado"
        );

    }

}


// ==========================================
// BOTÃO ATIVAR NOTIFICAÇÕES
// ==========================================

function configurarBotaoNotificacoes() {

    const botao =
        document.getElementById(
            "btnAtivarNotificacoes"
        );


    if (!botao) {

        console.warn(
            "Botão btnAtivarNotificacoes não encontrado."
        );

        return;

    }


    // ------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------

    if (
        Notification.permission ===
        "granted"
    ) {

        atualizarBotaoNotificacao(
            "ativo"
        );

    } else {

        atualizarBotaoNotificacao(
            "normal"
        );

    }


    // ------------------------------------------
    // CLIQUE
    // ------------------------------------------

    botao.addEventListener(
        "click",
        async () => {

            await registrarFirebase();

        }
    );

}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            configurarBotaoNotificacoes();

        }
    );

} else {

    configurarBotaoNotificacoes();

}


// ==========================================
// RECEBER NOTIFICAÇÃO COM APP ABERTO
// ==========================================

onMessage(
    messaging,
    payload => {

        console.log(
            "Notificação recebida:",
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
        // NOTIFICAÇÃO EM PRIMEIRO PLANO
        // --------------------------------------

        if (
            Notification.permission ===
            "granted"
        ) {

            try {

                new Notification(
                    titulo,
                    {

                        body: corpo,

                        icon:
                            "/icons/icon-192.png"

                    }
                );

            } catch (erro) {

                console.error(
                    "Erro ao mostrar notificação:",
                    erro
                );

            }

        }

    }
);


// ==========================================
// EXPÕE FUNÇÃO GLOBAL
// ==========================================

window.registrarFirebase =
    registrarFirebase;