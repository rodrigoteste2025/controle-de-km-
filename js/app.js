const CHAVE_CACHE = "controle_km_v3_cache";

let estado = {
    motoristas: [],
    veiculos: [],
    registros: []
};

let viagemFechamentoAtual = null;


// =====================================================
// CACHE LOCAL
// =====================================================

function carregarCache() {

    const raw = localStorage.getItem(CHAVE_CACHE);

    if (raw) {

        try {

            estado = JSON.parse(raw);

        } catch (e) {

            estado = {
                motoristas: [],
                veiculos: [],
                registros: []
            };

        }

    }

}


function salvarCache() {

    localStorage.setItem(
        CHAVE_CACHE,
        JSON.stringify(estado)
    );

}


function marcarPendente(item) {

    item.pendente = true;
    item.atualizado_em = new Date().toISOString();

}


// =====================================================
// CADASTROS
// =====================================================

function getMotoristasAtivos() {

    return estado.motoristas
        .filter(m => m.ativo !== false)
        .sort((a, b) =>
            a.nome.localeCompare(b.nome)
        );

}


function getVeiculosAtivos() {

    return estado.veiculos
        .filter(v => v.ativo !== false)
        .sort((a, b) =>
            a.nome.localeCompare(b.nome)
        );

}


function getRegistrosAtivos() {

    return estado.registros
        .filter(r => r.ativo !== false);

}


// =====================================================
// CARREGAR CADASTROS
// =====================================================

function carregarCadastros() {

    const selectMotorista =
        document.getElementById("motorista");

    const selectVeiculo =
        document.getElementById("veiculo");

    const filtroVeiculo =
        document.getElementById("filtroVeiculo");


    const motoristaSelecionado =
        selectMotorista.value;

    const veiculoSelecionado =
        selectVeiculo.value;

    const filtroVeiculoSelecionado =
        filtroVeiculo.value;


    selectMotorista.innerHTML =
        '<option value="">Selecione</option>';

    selectVeiculo.innerHTML =
        '<option value="">Selecione</option>';

    filtroVeiculo.innerHTML =
        '<option value="">Todos os veículos</option>';


    getMotoristasAtivos().forEach(m => {

        selectMotorista.innerHTML +=
            `<option value="${m.nome}">${m.nome}</option>`;

    });


    getVeiculosAtivos().forEach(v => {

        selectVeiculo.innerHTML +=
            `<option value="${v.nome}">${v.nome}</option>`;

        filtroVeiculo.innerHTML +=
            `<option value="${v.nome}">${v.nome}</option>`;

    });


    selectMotorista.value =
        motoristaSelecionado;

    selectVeiculo.value =
        veiculoSelecionado;

    filtroVeiculo.value =
        filtroVeiculoSelecionado;


    const listaMotoristas =
        document.getElementById("listaMotoristas");

    const listaVeiculos =
        document.getElementById("listaVeiculos");


    listaMotoristas.innerHTML = "";
    listaVeiculos.innerHTML = "";


    getMotoristasAtivos().forEach(m => {

        listaMotoristas.innerHTML += `
            <span class="item-cadastro">
                ${m.nome}
                <button
                    class="btn-excluir"
                    onclick="excluirMotorista('${m.local_id}')">
                    X
                </button>
            </span>
        `;

    });


    getVeiculosAtivos().forEach(v => {

        listaVeiculos.innerHTML += `
            <span class="item-cadastro">
                ${v.nome}
                <button
                    class="btn-excluir"
                    onclick="excluirVeiculo('${v.local_id}')">
                    X
                </button>
            </span>
        `;

    });

}


// =====================================================
// MOTORISTAS
// =====================================================

async function cadastrarMotorista() {

    const nome =
        normalizar(
            document.getElementById("novoMotorista").value
        );


    if (!nome) {

        return mostrarStatus(
            "Informe o nome do motorista.",
            "erro"
        );

    }


    if (
        getMotoristasAtivos()
            .some(m => m.nome === nome)
    ) {

        return mostrarStatus(
            "Motorista já cadastrado.",
            "erro"
        );

    }


    const item = {

        local_id: uuidLocal(),

        nome,

        ativo: true

    };


    marcarPendente(item);

    estado.motoristas.push(item);

    salvarCache();

    document.getElementById(
        "novoMotorista"
    ).value = "";


    renderizar();

    mostrarStatus(
        "Motorista cadastrado."
    );


    if (navigator.onLine) {

        await sincronizarTudo();

    }

}


async function excluirMotorista(id) {

    if (
        !confirm(
            "Deseja excluir este motorista?"
        )
    ) return;


    const item =
        estado.motoristas.find(
            m => m.local_id === id
        );


    if (item) {

        item.ativo = false;

        marcarPendente(item);

        salvarCache();

        renderizar();


        if (navigator.onLine) {

            await sincronizarTudo();

        }

    }

}


// =====================================================
// VEÍCULOS
// =====================================================

async function cadastrarVeiculo() {

    const nome =
        normalizar(
            document.getElementById("novoVeiculo").value
        );


    if (!nome) {

        return mostrarStatus(
            "Informe o veículo.",
            "erro"
        );

    }


    if (
        getVeiculosAtivos()
            .some(v => v.nome === nome)
    ) {

        return mostrarStatus(
            "Veículo já cadastrado.",
            "erro"
        );

    }


    const item = {

        local_id: uuidLocal(),

        nome,

        ativo: true

    };


    marcarPendente(item);

    estado.veiculos.push(item);

    salvarCache();


    document.getElementById(
        "novoVeiculo"
    ).value = "";


    renderizar();

    mostrarStatus(
        "Veículo cadastrado."
    );


    if (navigator.onLine) {

        await sincronizarTudo();

    }

}


async function excluirVeiculo(id) {

    if (
        !confirm(
            "Deseja excluir este veículo?"
        )
    ) return;


    const item =
        estado.veiculos.find(
            v => v.local_id === id
        );


    if (item) {

        item.ativo = false;

        marcarPendente(item);

        salvarCache();

        renderizar();


        if (navigator.onLine) {

            await sincronizarTudo();

        }

    }

}


// =====================================================
// 🔔 NOTIFICAÇÕES PUSH
// =====================================================

async function enviarNotificacaoPush(
    titulo,
    mensagem
) {

    try {

        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {

            console.warn(
                "Supabase não está disponível para enviar a notificação."
            );

            return;

        }

        console.log(
            "Enviando notificação:",
            titulo,
            mensagem
        );

        const {
            data,
            error
        } = await supabaseClient.functions.invoke(
            "quick-service",
            {
                body: {

                    titulo: titulo,

                    mensagem: mensagem

                }
            }
        );

        if (error) {

            console.error(
                "Erro ao enviar notificação:",
                error
            );

            return;

        }

        console.log(
            "Notificação enviada com sucesso:",
            data
        );

    } catch (erro) {

        console.error(
            "Erro na notificação Push:",
            erro
        );

    }

}

// =====================================================
// 🚗 REGISTRAR SAÍDA
// =====================================================

document
    .getElementById("formKm")
    .addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const registro = {

                local_id:
                    uuidLocal(),

                status:
                    "ABERTO",

                dataSaida:
                    document.getElementById(
                        "dataSaida"
                    ).value,

                horaSaida:
                    document.getElementById(
                        "horaSaida"
                    ).value,

                dataChegada:
                    "",

                horaChegada:
                    "",

                tempo:
                    "",

                fasa:
                    "",

                destino:
                    "",

                motorista:
                    document.getElementById(
                        "motorista"
                    ).value,

                veiculo:
                    document.getElementById(
                        "veiculo"
                    ).value,

                kmInicial:
                    Number(
                        document.getElementById(
                            "kmInicial"
                        ).value
                    ),

                kmFinal:
                    "",

                kmRodado:
                    "",

                combustivel:
                    "",

                atividade:
                    normalizar(
                        document.getElementById(
                            "atividade"
                        ).value
                    ),

                usuario_email:
                    usuarioAtual?.email || "",

                ativo:
                    true

            };


            marcarPendente(registro);

            estado.registros.push(registro);

            salvarCache();

            limparFormulario();

            renderizar();

            mostrarStatus(
                "Saída registrada."
            );


            // -----------------------------------------
            // 🔔 NOTIFICAÇÃO DE SAÍDA
            // -----------------------------------------

            if (navigator.onLine) {

                await sincronizarTudo();


                await enviarNotificacaoPush(

                    "🚗 SAÍDA REGISTRADA",

                    `Motorista: ${registro.motorista} | Veículo: ${registro.veiculo}`

                );

            }

        }
    );


// =====================================================
// LIMPAR FORMULÁRIO
// =====================================================

function limparFormulario() {

    document
        .getElementById("formKm")
        .reset();


    document.getElementById(
        "dataSaida"
    ).value = dataAtual();


    document.getElementById(
        "horaSaida"
    ).value = horaAtual();

}


// =====================================================
// FILTROS
// =====================================================

function obterRegistrosFiltrados() {

    const pesquisa =
        (
            document.getElementById(
                "pesquisa"
            ).value || ""
        ).toLowerCase();


    const mes =
        document.getElementById(
            "filtroMes"
        ).value;


    const ano =
        document.getElementById(
            "filtroAno"
        ).value;


    const veiculoFiltro =
        document.getElementById(
            "filtroVeiculo"
        ).value;


    return getRegistrosAtivos()

        .filter(item => {

            const data =
                item.dataSaida || "";

            const anoItem =
                data.substring(0, 4);

            const mesItem =
                data.substring(5, 7);


            const texto = [

                item.motorista,

                item.veiculo,

                item.atividade,

                item.fasa,

                item.destino,

                item.dataSaida

            ]
                .join(" ")
                .toLowerCase();


            return texto.includes(pesquisa)

                && (
                    mes === "" ||
                    mesItem === mes
                )

                && (
                    ano === "" ||
                    anoItem === ano
                )

                && (
                    veiculoFiltro === "" ||
                    item.veiculo === veiculoFiltro
                );

        })

        .sort((a, b) => {

            const aAberta =
                a.status === "ABERTO" ||
                !a.kmFinal ||
                !a.dataChegada;


            const bAberta =
                b.status === "ABERTO" ||
                !b.kmFinal ||
                !b.dataChegada;


            if (
                aAberta &&
                !bAberta
            ) return -1;


            if (
                !aAberta &&
                bAberta
            ) return 1;


            const dataA =
                (a.dataSaida || "") +
                (a.horaSaida || "");


            const dataB =
                (b.dataSaida || "") +
                (b.horaSaida || "");


            return dataB.localeCompare(
                dataA
            );

        });

}


// =====================================================
// LINHA DA TABELA
// =====================================================

function criarLinhaRegistro(item) {

    const tr =
        document.createElement("tr");


    tr.innerHTML = `

        <td data-label="Data Saída">
            ${formatarData(item.dataSaida)}
        </td>

        <td data-label="Hora Saída">
            ${item.horaSaida || "-"}
        </td>

        <td data-label="Data Chegada">
            ${
                item.dataChegada
                    ? formatarData(item.dataChegada)
                    : "-"
            }
        </td>

        <td data-label="Hora Chegada">
            ${item.horaChegada || "-"}
        </td>

        <td data-label="Tempo">
            ${item.tempo || "-"}
        </td>

        <td data-label="FASA">
            ${item.fasa || "-"}
        </td>

        <td data-label="Destino">
            ${item.destino || "-"}
        </td>

        <td data-label="Motorista">
            ${item.motorista || "-"}
        </td>

        <td data-label="Veículo">
            ${item.veiculo || "-"}
        </td>

        <td data-label="Km Inicial">
            ${item.kmInicial || "-"}
        </td>

        <td data-label="Km Final">
            ${item.kmFinal || "-"}
        </td>

        <td data-label="Km Rodado">
            ${item.kmRodado || "-"}
        </td>

        <td data-label="Litros">
            ${item.combustivel || "-"}
        </td>

        <td data-label="Atividade">
            ${item.atividade || "-"}
        </td>

        <td data-label="Ação">

            ${
                item.status === "ABERTO" ||
                !item.kmFinal ||
                !item.dataChegada

                    ? `
                        <button
                            onclick="fecharViagem('${item.local_id}')">
                            Fechar
                        </button>
                      `

                    : ""
            }

            <button
                class="btn-excluir"
                onclick="excluirRegistro('${item.local_id}')">
                Excluir
            </button>

        </td>

    `;


    return tr;

}


// =====================================================
// RENDERIZAÇÃO
// =====================================================

function renderizar() {

    carregarCadastros();


    const lista =
        obterRegistrosFiltrados();


    const abertas =
        lista.filter(
            item =>
                item.status === "ABERTO" ||
                !item.kmFinal ||
                !item.dataChegada
        );


    const finalizadas =
        lista.filter(
            item =>
                !(
                    item.status === "ABERTO" ||
                    !item.kmFinal ||
                    !item.dataChegada
                )
        );


    const tabelaAbertas =
        document.getElementById(
            "tabelaAbertas"
        );


    const tabelaFinalizadas =
        document.getElementById(
            "tabelaFinalizadas"
        );


    if (tabelaAbertas) {

        tabelaAbertas.innerHTML = "";

        abertas.forEach(
            item =>
                tabelaAbertas.appendChild(
                    criarLinhaRegistro(item)
                )
        );

    }


    if (tabelaFinalizadas) {

        tabelaFinalizadas.innerHTML = "";

        finalizadas.forEach(
            item =>
                tabelaFinalizadas.appendChild(
                    criarLinhaRegistro(item)
                )
        );

    }


    const tituloAbertas =
        document.getElementById(
            "tituloViagensAbertas"
        );


    const tituloFinalizadas =
        document.getElementById(
            "tituloViagensFinalizadas"
        );


    if (tituloAbertas) {

        tituloAbertas.innerText =
            `Viagens em Aberto (${abertas.length})`;

    }


    if (tituloFinalizadas) {

        tituloFinalizadas.innerText =
            `Histórico de Viagens Finalizadas (${finalizadas.length})`;

    }


    atualizarResumo(lista);

}


// =====================================================
// RESUMO
// =====================================================

function atualizarResumo(lista) {

    document.getElementById(
        "totalRegistros"
    ).innerText =
        lista.length;


    document.getElementById(
        "viagensAbertas"
    ).innerText =
        lista.filter(
            r => r.status === "ABERTO"
        ).length;


    document.getElementById(
        "totalKm"
    ).innerText =
        lista.reduce(
            (s, r) =>
                s +
                Number(
                    r.kmRodado || 0
                ),
            0
        );


    document.getElementById(
        "totalCombustivel"
    ).innerText =
        lista.reduce(
            (s, r) =>
                s +
                Number(
                    r.combustivel || 0
                ),
            0
        ).toFixed(2);

}


// =====================================================
// ABRIR MODAL DE FECHAMENTO
// =====================================================

function fecharViagem(id) {

    const item =
        estado.registros.find(
            r => r.local_id === id
        );


    if (!item) return;


    viagemFechamentoAtual =
        item;


    document.getElementById(
        "fecharId"
    ).value = id;


    document.getElementById(
        "fecharDataChegada"
    ).value =
        dataAtual();


    document.getElementById(
        "fecharHoraChegada"
    ).value =
        horaAtual();


    document.getElementById(
        "fecharKmFinal"
    ).value =
        item.kmFinal || "";


    document.getElementById(
        "fecharFasa"
    ).value =
        item.fasa || "";


    document.getElementById(
        "fecharDestino"
    ).value =
        item.destino || "";


    document.getElementById(
        "fecharCombustivel"
    ).value =
        item.combustivel || "";


    document.getElementById(
        "infoFechamento"
    ).innerHTML = `

        <b>Motorista:</b>
        ${item.motorista}

        <br>

        <b>Veículo:</b>
        ${item.veiculo}

        <br>

        <b>Saída:</b>
        ${formatarData(item.dataSaida)}
        às
        ${item.horaSaida}

        <br>

        <b>Km inicial:</b>
        ${item.kmInicial}

    `;


    atualizarTempoModal();


    document.getElementById(
        "modalFechamento"
    ).style.display =
        "flex";

}


// =====================================================
// TEMPO
// =====================================================

function atualizarTempoModal() {

    if (!viagemFechamentoAtual)
        return;


    const dataChegada =
        document.getElementById(
            "fecharDataChegada"
        ).value;


    const horaChegada =
        document.getElementById(
            "fecharHoraChegada"
        ).value;


    if (
        dataChegada &&
        horaChegada
    ) {

        document.getElementById(
            "fecharTempo"
        ).value = calcularTempo(

            viagemFechamentoAtual.dataSaida,

            viagemFechamentoAtual.horaSaida,

            dataChegada,

            horaChegada

        );

    }

}


// =====================================================
// FECHAR MODAL
// =====================================================

function fecharModal() {

    document.getElementById(
        "modalFechamento"
    ).style.display =
        "none";


    viagemFechamentoAtual =
        null;

}


// =====================================================
// 💾 SALVAR FECHAMENTO
// =====================================================

async function salvarFechamento() {

    const id =
        document.getElementById(
            "fecharId"
        ).value;


    const item =
        estado.registros.find(
            r => r.local_id === id
        );


    if (!item) return;


    const kmFinal =
        Number(
            document.getElementById(
                "fecharKmFinal"
            ).value
        );


    const dataChegada =
        document.getElementById(
            "fecharDataChegada"
        ).value;


    const horaChegada =
        document.getElementById(
            "fecharHoraChegada"
        ).value;


    const fasa =
        normalizar(
            document.getElementById(
                "fecharFasa"
            ).value
        );


    const destino =
        normalizar(
            document.getElementById(
                "fecharDestino"
            ).value
        );


    const combustivel =
        Number(
            document.getElementById(
                "fecharCombustivel"
            ).value || 0
        );


    if (!dataChegada) {

        return alert(
            "Informe a data de chegada."
        );

    }


    if (!horaChegada) {

        return alert(
            "Informe o horário de chegada."
        );

    }


    if (
        !kmFinal ||
        kmFinal < Number(item.kmInicial)
    ) {

        return alert(
            "Km final inválido. Ele não pode ser menor que o Km inicial."
        );

    }


    const tempo =
        calcularTempo(

            item.dataSaida,

            item.horaSaida,

            dataChegada,

            horaChegada

        );


    if (
        tempo === "Horário inválido"
    ) {

        return alert(
            "A chegada não pode ser menor que a saída."
        );

    }


    // -----------------------------------------
    // ATUALIZA VIAGEM
    // -----------------------------------------

    item.kmFinal =
        kmFinal;


    item.kmRodado =
        kmFinal -
        Number(item.kmInicial);


    item.dataChegada =
        dataChegada;


    item.horaChegada =
        horaChegada;


    item.tempo =
        tempo;


    item.fasa =
        fasa;


    item.destino =
        destino;


    item.combustivel =
        combustivel;


    item.status =
        "FECHADO";


    item.usuario_email =
        usuarioAtual?.email ||
        item.usuario_email ||
        "";


    marcarPendente(item);


    salvarCache();

    fecharModal();

    renderizar();

    mostrarStatus(
        "Viagem fechada."
    );


    // -----------------------------------------
    // 🏁 NOTIFICAÇÃO DE CHEGADA
    // -----------------------------------------

    if (navigator.onLine) {

        await sincronizarTudo();


        await enviarNotificacaoPush(

            "🏁 CHEGADA REGISTRADA",

            `Motorista: ${item.motorista} | Veículo: ${item.veiculo} | Destino: ${item.destino || "Não informado"}`

        );

    }

}


// =====================================================
// EXCLUIR REGISTRO
// =====================================================

async function excluirRegistro(id) {

    if (
        !confirm(
            "Deseja excluir este registro?"
        )
    ) return;


    const item =
        estado.registros.find(
            r => r.local_id === id
        );


    if (item) {

        item.ativo = false;

        marcarPendente(item);

        salvarCache();

        renderizar();


        if (navigator.onLine) {

            await sincronizarTudo();

        }

    }

}


// =====================================================
// LIMPAR FILTROS
// =====================================================

function limparFiltros() {

    document.getElementById(
        "pesquisa"
    ).value = "";


    document.getElementById(
        "filtroMes"
    ).value = "";


    document.getElementById(
        "filtroAno"
    ).value =
        new Date().getFullYear();


    document.getElementById(
        "filtroVeiculo"
    ).value = "";


    renderizar();

}


// =====================================================
// PDF
// =====================================================




function gerarPDF() {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("A biblioteca de PDF não foi carregada.");
      return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const registrosOriginais = obterRegistrosFiltrados();

    const registros = (registrosOriginais || []).filter(r => {
      const status = String(r.status || "").toUpperCase();

      return status !== "ABERTO" &&
        r.kmFinal !== null &&
        r.kmFinal !== undefined &&
        r.kmFinal !== "";
    });

    if (!registros.length) {
      alert("Não existem viagens finalizadas para gerar o PDF.");
      return;
    }

    const numero = valor => {
      if (valor === null || valor === undefined || valor === "") {
        return 0;
      }

      if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : 0;
      }

      const valorTexto = String(valor).trim().replace(/\s/g, "");

      if (valorTexto.includes(",") && valorTexto.includes(".")) {
        return Number(
          valorTexto.replace(/\./g, "").replace(",", ".")
        ) || 0;
      }

      if (valorTexto.includes(",")) {
        return Number(valorTexto.replace(",", ".")) || 0;
      }

      return Number(valorTexto) || 0;
    };

    const texto = valor => {
      if (valor === null || valor === undefined || valor === "") {
        return "-";
      }

      return String(valor).trim() || "-";
    };

    const kmTexto = valor => {
      if (valor === null || valor === undefined || valor === "") {
        return "-";
      }

      return String(Math.round(numero(valor)));
    };

    // Litros com até três casas decimais, sem separador de milhar.
    const litrosTexto = valor => {
      if (valor === null || valor === undefined || valor === "") {
        return "0";
      }

      return numero(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
        useGrouping: false
      });
    };

    const dataTexto = valor => {
      if (!valor) return "-";

      if (/^\d{4}-\d{2}-\d{2}/.test(String(valor))) {
        const partes = String(valor).slice(0, 10).split("-");
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }

      return String(valor);
    };

    const horaTexto = valor => {
      if (!valor) return "-";
      return String(valor).slice(0, 5);
    };

    const obterDataSaida = r =>
      r.dataSaida || r.data_saida || r.data || r.saidaData || "";

    const obterHoraSaida = r =>
      r.horaSaida || r.hora_saida || r.saida || "";

    const obterDataChegada = r =>
      r.dataChegada || r.data_chegada || r.chegadaData || "";

    const obterHoraChegada = r =>
      r.horaChegada || r.hora_chegada || r.chegada || "";

    const obterMotorista = r =>
      r.motorista || r.nomeMotorista || r.nome_motorista || "-";

    const obterDestino = r =>
      r.destino || r.localDestino || r.local_destino || "-";

    const obterKmInicial = r =>
      r.kmInicial ?? r.km_inicial ?? "";

    const obterKmFinal = r =>
      r.kmFinal ?? r.km_final ?? "";

    const obterKmRodado = r => {
      const informado = r.kmRodado ?? r.km_rodado;

      if (informado !== null && informado !== undefined && informado !== "") {
        return informado;
      }

      return numero(obterKmFinal(r)) - numero(obterKmInicial(r));
    };

    const obterLitros = r =>
      r.combustivel ??
      r.litros ??
      r.quantidadeLitros ??
      r.quantidade_litros ??
      0;

    const obterFasa = r => {
      const valor =
        r.fasa ??
        r.FASA ??
        r.numeroFasa ??
        r.numero_fasa ??
        "";

      return valor === "" ? "-" : String(valor).replace(/\s+/g, "");
    };

    const obterAtividade = r =>
      r.atividade || r.descricao || r.observacao || "-";

    // Identificação do veículo presente em cada registro.
    const obterVeiculo = r => {
      let veiculo =
        r.veiculo ??
        r.nomeVeiculo ??
        r.nome_veiculo ??
        r.veiculoNome ??
        r.veiculo_nome ??
        r.modeloVeiculo ??
        r.modelo_veiculo ??
        "";

      let placa =
        r.placa ??
        r.placaVeiculo ??
        r.placa_veiculo ??
        "";

      // Alguns sistemas guardam o veículo como um objeto.
      if (veiculo && typeof veiculo === "object") {
        placa = placa ||
          veiculo.placa ||
          veiculo.placaVeiculo ||
          veiculo.placa_veiculo ||
          "";

        veiculo =
          veiculo.nome ||
          veiculo.modelo ||
          veiculo.descricao ||
          veiculo.identificacao ||
          "";
      }

      // Se houver apenas placa, utiliza a placa.
      if (!veiculo && placa) {
        return String(placa).trim().toUpperCase();
      }

      if (!veiculo) {
        return "";
      }

      const nome = String(veiculo).trim();
      const placaTexto = String(placa).trim();

      if (
        placaTexto &&
        !nome.toUpperCase().includes(placaTexto.toUpperCase())
      ) {
        return `${nome} - ${placaTexto}`.toUpperCase();
      }

      return nome.toUpperCase();
    };

    registros.sort((a, b) =>
      String(obterDataSaida(b)).localeCompare(String(obterDataSaida(a)))
    );

    // Identifica os veículos que aparecem no relatório.
    const veiculos = [
      ...new Set(
        registros
          .map(obterVeiculo)
          .filter(Boolean)
      )
    ];

    let identificacaoVeiculo;

    if (veiculos.length === 1) {
      identificacaoVeiculo = `VEÍCULO: ${veiculos[0]}`;
    } else if (veiculos.length > 1) {
      identificacaoVeiculo = `VEÍCULOS: ${veiculos.join(" | ")}`;
    } else {
      identificacaoVeiculo = "VEÍCULO: NÃO IDENTIFICADO NOS REGISTROS";
    }

    const totalKm = registros.reduce(
      (soma, r) => soma + Math.max(0, numero(obterKmRodado(r))),
      0
    );

    const totalComb = registros.reduce(
      (soma, r) => soma + numero(obterLitros(r)),
      0
    );

    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();

    const margemEsquerda = 5;
    const margemDireita = 5;
    const larguraUtil = larguraPagina - margemEsquerda - margemDireita;

    // Cabeçalho do PDF.
    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);

    doc.text(
      "CONTROLE DE UTILIZAÇÃO DE VEÍCULOS OFICIAIS",
      larguraPagina / 2,
      7,
      { align: "center" }
    );

    // Identificação do veículo em destaque.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);

    doc.text(
      identificacaoVeiculo,
      larguraPagina / 2,
      13,
      {
        align: "center",
        maxWidth: larguraUtil
      }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(45, 45, 45);

    doc.text(
      `Viagens finalizadas: ${registros.length} | Total de km: ${kmTexto(totalKm)} | Total de litros: ${litrosTexto(totalComb)}`,
      larguraPagina / 2,
      18,
      { align: "center" }
    );

    const cabecalho = [[
      "Data saída",
      "Saída",
      "Data chegada",
      "Chegada",
      "Motorista",
      "Destino",
      "Km inicial",
      "Km final",
      "Km rodado",
      "Litros",
      "FASA",
      "Atividade"
    ]];

    const corpo = registros.map(r => [
      dataTexto(obterDataSaida(r)),
      horaTexto(obterHoraSaida(r)),
      dataTexto(obterDataChegada(r)),
      horaTexto(obterHoraChegada(r)),
      texto(obterMotorista(r)),
      texto(obterDestino(r)),
      kmTexto(obterKmInicial(r)),
      kmTexto(obterKmFinal(r)),
      kmTexto(obterKmRodado(r)),
      litrosTexto(obterLitros(r)),
      obterFasa(r),
      texto(obterAtividade(r))
    ]);

    const largurasBase = [
      18, 10, 18, 10, 31, 31,
      17, 17, 17, 15, 22, 47
    ];

    const somaBase = largurasBase.reduce(
      (soma, largura) => soma + largura,
      0
    );

    const fator = larguraUtil / somaBase;
    const larguras = largurasBase.map(largura => largura * fator);

    const estilosColunas = {};

    larguras.forEach((largura, indice) => {
      estilosColunas[indice] = {
        cellWidth: largura,
        valign: "middle"
      };
    });

    [0, 1, 2, 3, 6, 7, 8, 9, 10].forEach(indice => {
      estilosColunas[indice].halign = "center";
    });

    [4, 5, 11].forEach(indice => {
      estilosColunas[indice].halign = "left";
      estilosColunas[indice].overflow = "linebreak";
    });

    doc.autoTable({
      head: cabecalho,
      body: corpo,
      startY: 22,
      margin: {
        left: margemEsquerda,
        right: margemDireita,
        top: 8,
        bottom: 13
      },
      tableWidth: larguraUtil,
      theme: "grid",
      showHead: "everyPage",
      rowPageBreak: "avoid",
      styles: {
        font: "helvetica",
        fontSize: 6.5,
        cellPadding: {
          top: 1.3,
          right: 1,
          bottom: 1.3,
          left: 1
        },
        overflow: "linebreak",
        valign: "middle",
        lineWidth: 0.1,
        lineColor: [210, 215, 210],
        textColor: [45, 45, 45],
        minCellHeight: 7
      },
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6.5,
        halign: "center",
        valign: "middle",
        cellPadding: 1.5
      },
      columnStyles: estilosColunas,
      didParseCell: function (dados) {
        if (dados.section !== "body") return;

        // Ajusta FASA para evitar sobreposição.
        if (dados.column.index === 10) {
          const conteudo = String(dados.cell.text.join(""));

          if (conteudo.length > 15) {
            dados.cell.styles.fontSize = 4.5;
          } else if (conteudo.length > 11) {
            dados.cell.styles.fontSize = 5;
          } else if (conteudo.length > 8) {
            dados.cell.styles.fontSize = 5.5;
          }

          dados.cell.styles.overflow = "hidden";
          dados.cell.styles.halign = "center";
        }

        // Campos numéricos em uma única linha.
        if ([1, 3, 6, 7, 8, 9].includes(dados.column.index)) {
          dados.cell.styles.overflow = "hidden";
          dados.cell.styles.halign = "center";
        }

        // Preserva até três casas decimais nos litros.
        if (dados.column.index === 9) {
          dados.cell.styles.fontSize = 6;
          dados.cell.styles.overflow = "hidden";
          dados.cell.styles.halign = "center";
        }
      }
    });

    // Quadro de assinaturas centralizado.
    let yAssinaturas = doc.lastAutoTable.finalY + 10;
    const alturaNecessaria = 42;

    if (yAssinaturas + alturaNecessaria > alturaPagina - 15) {
      doc.addPage();
      yAssinaturas = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(45, 45, 45);

    doc.text(
      "CONTROLE DE RUBRICA DOS MOTORISTAS",
      larguraPagina / 2,
      yAssinaturas,
      { align: "center" }
    );

    yAssinaturas += 5;

    const motoristas = [
      ...new Set(
        registros
          .map(r => String(obterMotorista(r)).trim())
          .filter(nome => nome && nome !== "-")
      )
    ];

    const larguraTabelaAssinaturas = Math.min(210, larguraUtil);
    const margemCentralizada =
      (larguraPagina - larguraTabelaAssinaturas) / 2;

    const larguraNome = larguraTabelaAssinaturas * 0.5;
    const larguraRubrica = larguraTabelaAssinaturas - larguraNome;

    doc.autoTable({
      startY: yAssinaturas,
      margin: {
        left: margemCentralizada,
        right: margemCentralizada,
        bottom: 15
      },
      tableWidth: larguraTabelaAssinaturas,
      head: [[
        "Nome do motorista",
        "Rubrica / assinatura"
      ]],
      body: motoristas.map(nome => [nome, ""]),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        minCellHeight: 11,
        valign: "middle",
        lineWidth: 0.25,
        lineColor: [130, 130, 130],
        textColor: [45, 45, 45],
        overflow: "linebreak"
      },
      headStyles: {
        fillColor: [22, 101, 52],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        minCellHeight: 11
      },
      columnStyles: {
        0: {
          cellWidth: larguraNome,
          halign: "left"
        },
        1: {
          cellWidth: larguraRubrica,
          halign: "center",
          minCellHeight: 12
        }
      }
    });

    const yDeclaracao = doc.lastAutoTable.finalY + 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    if (yDeclaracao + 10 > alturaPagina - 12) {
      doc.addPage();

      doc.text(
        "Declaro que as informações registradas correspondem às viagens realizadas.",
        larguraPagina / 2,
        20,
        {
          align: "center",
          maxWidth: larguraUtil
        }
      );
    } else {
      doc.text(
        "Declaro que as informações registradas correspondem às viagens realizadas.",
        larguraPagina / 2,
        yDeclaracao,
        {
          align: "center",
          maxWidth: larguraUtil
        }
      );
    }

    // Rodapé e numeração das páginas.
    const totalPaginas = doc.internal.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(110, 110, 110);

      doc.text(
        "IDAF - Controle de utilização de veículos oficiais",
        margemEsquerda,
        alturaPagina - 5
      );

      doc.text(
        `Página ${pagina} de ${totalPaginas}`,
        larguraPagina - margemDireita,
        alturaPagina - 5,
        { align: "right" }
      );
    }

    doc.save("controle-utilizacao-veiculos-IDAF.pdf");

  } catch (erro) {
    console.error("Erro ao gerar PDF:", erro);
    alert(
      "Não foi possível gerar o PDF. Verifique o console do navegador para mais detalhes."
    );
  }
}


// =====================================================
// CSV
// =====================================================

function exportarCSV() {

    const lista =
        obterRegistrosFiltrados();


    if (lista.length === 0) {

        return alert(
            "Não há registros para exportar."
        );

    }


    let csv =
        "Status;Data Saida;Hora Saida;Data Chegada;Hora Chegada;Tempo;FASA;Destino;Motorista;Veiculo;Km Inicial;Km Final;Km Rodado;Litros;Atividade\n";


    lista.forEach(r => {

        csv +=
            `${r.status};` +
            `${formatarData(r.dataSaida)};` +
            `${r.horaSaida};` +
            `${r.dataChegada ? formatarData(r.dataChegada) : ""};` +
            `${r.horaChegada};` +
            `${r.tempo};` +
            `${r.fasa};` +
            `${r.destino || ""};` +
            `${r.motorista};` +
            `${r.veiculo};` +
            `${r.kmInicial};` +
            `${r.kmFinal};` +
            `${r.kmRodado};` +
            `${r.combustivel || ""};` +
            `${r.atividade}\n`;

    });


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const link =
        document.createElement("a");


    link.href =
        URL.createObjectURL(blob);


    link.download =
        "controle_quilometragem.csv";


    link.click();

}


// =====================================================
// CADASTROS - ABRIR/FECHAR
// =====================================================

function alternarCadastros() {

    const conteudo =
        document.getElementById(
            "conteudoCadastros"
        );


    const seta =
        document.getElementById(
            "setaCadastros"
        );


    if (
        conteudo.classList.contains(
            "fechado"
        )
    ) {

        conteudo.classList.remove(
            "fechado"
        );

        conteudo.classList.add(
            "aberto"
        );

        seta.innerText = "▼";

    } else {

        conteudo.classList.remove(
            "aberto"
        );

        conteudo.classList.add(
            "fechado"
        );

        seta.innerText = "▶";

    }

}


// =====================================================
// ATUALIZAÇÃO AUTOMÁTICA
// =====================================================

async function atualizarAutomaticamenteAoEntrar() {

    if (
        navigator.onLine &&
        supabaseClient
    ) {

        try {

            atualizarStatusOnline(
                "Atualizando dados do banco automaticamente..."
            );


            await sincronizarTudo();


            atualizarStatusOnline(
                "Dados atualizados automaticamente: " +
                new Date().toLocaleString(
                    "pt-BR"
                )
            );


        } catch (e) {

            console.error(e);


            atualizarStatusOnline(
                "Não foi possível atualizar automaticamente. Use o botão Sincronizar.",
                "aviso"
            );

        }

    }

}


// =====================================================
// BLOCOS
// =====================================================

function alternarBloco(
    idConteudo,
    idSeta
) {

    const conteudo =
        document.getElementById(
            idConteudo
        );


    const seta =
        document.getElementById(
            idSeta
        );


    if (
        !conteudo ||
        !seta
    ) return;


    if (
        conteudo.classList.contains(
            "fechado"
        )
    ) {

        conteudo.classList.remove(
            "fechado"
        );

        conteudo.classList.add(
            "aberto"
        );

        seta.innerText = "▼";

    } else {

        conteudo.classList.remove(
            "aberto"
        );

        conteudo.classList.add(
            "fechado"
        );

        seta.innerText = "▶";

    }

}


function alternarViagensAbertas() {

    alternarBloco(
        "conteudoViagensAbertas",
        "setaViagensAbertas"
    );

}


function alternarViagensFinalizadas() {

    alternarBloco(
        "conteudoViagensFinalizadas",
        "setaViagensFinalizadas"
    );

}


// =====================================================
// INICIALIZAÇÃO
// =====================================================

async function iniciarApp() {

    carregarCache();


    document.getElementById(
        "dataSaida"
    ).value =
        dataAtual();


    document.getElementById(
        "horaSaida"
    ).value =
        horaAtual();


    document.getElementById(
        "filtroAno"
    ).value =
        new Date().getFullYear();


    document
        .getElementById(
            "fecharDataChegada"
        )
        .addEventListener(
            "change",
            atualizarTempoModal
        );


    document
        .getElementById(
            "fecharHoraChegada"
        )
        .addEventListener(
            "input",
            atualizarTempoModal
        );


    renderizar();


    iniciarSupabase();


    verificarConexao();


    await carregarUsuario();


    if (
        navigator.onLine &&
        supabaseClient
    ) {

        await atualizarAutomaticamenteAoEntrar();

    } else {

        verificarConexao();

    }


    // -----------------------------------------
    // SERVICE WORKER
    // -----------------------------------------

    if (
        "serviceWorker" in navigator &&
        (
            location.protocol === "https:" ||
            location.hostname === "localhost" ||
            location.hostname === "127.0.0.1"
        )
    ) {

        try {

            await navigator.serviceWorker.register(
                "service-worker.js"
            );


            console.log(
                "[Service Worker] registrado com sucesso."
            );


        } catch (e) {

            console.warn(
                "Service Worker não registrado:",
                e
            );

        }

    }

}


// =====================================================
// ATUALIZA AO VOLTAR PARA O APP
// =====================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (!document.hidden) {

            atualizarAutomaticamenteAoEntrar();

        }

    }
);


// =====================================================
// ATUALIZA AO VOLTAR PARA A JANELA
// =====================================================

window.addEventListener(
    "focus",
    () => {

        atualizarAutomaticamenteAoEntrar();

    }
);


// =====================================================
// INICIA APP
// =====================================================

iniciarApp();