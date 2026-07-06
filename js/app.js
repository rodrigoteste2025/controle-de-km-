const CHAVE_CACHE = "controle_km_v3_cache";

let estado = {
  motoristas: [],
  veiculos: [],
  registros: []
};

let viagemFechamentoAtual = null;

function carregarCache(){
  const raw = localStorage.getItem(CHAVE_CACHE);
  if(raw){
    try{
      estado = JSON.parse(raw);
    }catch(e){
      estado = { motoristas: [], veiculos: [], registros: [] };
    }
  }
}

function salvarCache(){
  localStorage.setItem(CHAVE_CACHE, JSON.stringify(estado));
}

function marcarPendente(item){
  item.pendente = true;
  item.atualizado_em = new Date().toISOString();
}

function getMotoristasAtivos(){
  return estado.motoristas.filter(m => m.ativo !== false).sort((a,b) => a.nome.localeCompare(b.nome));
}

function getVeiculosAtivos(){
  return estado.veiculos.filter(v => v.ativo !== false).sort((a,b) => a.nome.localeCompare(b.nome));
}

function getRegistrosAtivos(){
  return estado.registros.filter(r => r.ativo !== false);
}

function carregarCadastros(){
  const selectMotorista = document.getElementById("motorista");
  const selectVeiculo = document.getElementById("veiculo");
  const filtroVeiculo = document.getElementById("filtroVeiculo");

  const motoristaSelecionado = selectMotorista.value;
  const veiculoSelecionado = selectVeiculo.value;
  const filtroVeiculoSelecionado = filtroVeiculo.value;

  selectMotorista.innerHTML = '<option value="">Selecione</option>';
  selectVeiculo.innerHTML = '<option value="">Selecione</option>';
  filtroVeiculo.innerHTML = '<option value="">Todos os veículos</option>';

  getMotoristasAtivos().forEach(m => {
    selectMotorista.innerHTML += `<option value="${m.nome}">${m.nome}</option>`;
  });

  getVeiculosAtivos().forEach(v => {
    selectVeiculo.innerHTML += `<option value="${v.nome}">${v.nome}</option>`;
    filtroVeiculo.innerHTML += `<option value="${v.nome}">${v.nome}</option>`;
  });

  selectMotorista.value = motoristaSelecionado;
  selectVeiculo.value = veiculoSelecionado;
  filtroVeiculo.value = filtroVeiculoSelecionado;

  const listaMotoristas = document.getElementById("listaMotoristas");
  const listaVeiculos = document.getElementById("listaVeiculos");
  listaMotoristas.innerHTML = "";
  listaVeiculos.innerHTML = "";

  getMotoristasAtivos().forEach(m => {
    listaMotoristas.innerHTML += `
      <span class="item-cadastro">${m.nome}
        <button class="btn-excluir" onclick="excluirMotorista('${m.local_id}')">X</button>
      </span>`;
  });

  getVeiculosAtivos().forEach(v => {
    listaVeiculos.innerHTML += `
      <span class="item-cadastro">${v.nome}
        <button class="btn-excluir" onclick="excluirVeiculo('${v.local_id}')">X</button>
      </span>`;
  });
}

async function cadastrarMotorista(){
  const nome = normalizar(document.getElementById("novoMotorista").value);
  if(!nome) return mostrarStatus("Informe o nome do motorista.", "erro");

  if(getMotoristasAtivos().some(m => m.nome === nome)){
    return mostrarStatus("Motorista já cadastrado.", "erro");
  }

  const item = { local_id: uuidLocal(), nome, ativo: true };
  marcarPendente(item);
  estado.motoristas.push(item);
  salvarCache();
  document.getElementById("novoMotorista").value = "";
  renderizar();
  mostrarStatus("Motorista cadastrado.");
  if(navigator.onLine) await sincronizarTudo();
}

async function cadastrarVeiculo(){
  const nome = normalizar(document.getElementById("novoVeiculo").value);
  if(!nome) return mostrarStatus("Informe o veículo.", "erro");

  if(getVeiculosAtivos().some(v => v.nome === nome)){
    return mostrarStatus("Veículo já cadastrado.", "erro");
  }

  const item = { local_id: uuidLocal(), nome, ativo: true };
  marcarPendente(item);
  estado.veiculos.push(item);
  salvarCache();
  document.getElementById("novoVeiculo").value = "";
  renderizar();
  mostrarStatus("Veículo cadastrado.");
  if(navigator.onLine) await sincronizarTudo();
}

async function excluirMotorista(id){
  if(!confirm("Deseja excluir este motorista?")) return;
  const item = estado.motoristas.find(m => m.local_id === id);
  if(item){
    item.ativo = false;
    marcarPendente(item);
    salvarCache();
    renderizar();
    if(navigator.onLine) await sincronizarTudo();
  }
}

async function excluirVeiculo(id){
  if(!confirm("Deseja excluir este veículo?")) return;
  const item = estado.veiculos.find(v => v.local_id === id);
  if(item){
    item.ativo = false;
    marcarPendente(item);
    salvarCache();
    renderizar();
    if(navigator.onLine) await sincronizarTudo();
  }
}

document.getElementById("formKm").addEventListener("submit", async function(e){
  e.preventDefault();

  const registro = {
    local_id: uuidLocal(),
    status: "ABERTO",
    dataSaida: document.getElementById("dataSaida").value,
    horaSaida: document.getElementById("horaSaida").value,
    dataChegada: "",
    horaChegada: "",
    tempo: "",
    fasa: "",
    destino: "",
    motorista: document.getElementById("motorista").value,
    veiculo: document.getElementById("veiculo").value,
    kmInicial: Number(document.getElementById("kmInicial").value),
    kmFinal: "",
    kmRodado: "",
    combustivel: "",
    atividade: normalizar(document.getElementById("atividade").value),
    usuario_email: usuarioAtual?.email || "",
    ativo: true
  };

  marcarPendente(registro);
  estado.registros.push(registro);
  salvarCache();
  limparFormulario();
  renderizar();
  mostrarStatus("Saída registrada.");
  if(navigator.onLine) await sincronizarTudo();
});

function limparFormulario(){
  document.getElementById("formKm").reset();
  document.getElementById("dataSaida").value = dataAtual();
  document.getElementById("horaSaida").value = horaAtual();
}

function obterRegistrosFiltrados(){
  const pesquisa = (document.getElementById("pesquisa").value || "").toLowerCase();
  const mes = document.getElementById("filtroMes").value;
  const ano = document.getElementById("filtroAno").value;
  const veiculoFiltro = document.getElementById("filtroVeiculo").value;

  return getRegistrosAtivos().filter(item => {
    const data = item.dataSaida || "";
    const anoItem = data.substring(0,4);
    const mesItem = data.substring(5,7);

    const texto = [
      item.motorista,
      item.veiculo,
      item.atividade,
      item.fasa,
      item.destino,
      item.dataSaida
    ].join(" ").toLowerCase();

    return texto.includes(pesquisa)
      && (mes === "" || mesItem === mes)
      && (ano === "" || anoItem === ano)
      && (veiculoFiltro === "" || item.veiculo === veiculoFiltro);
  }).sort((a,b) => {
    const aAberta = a.status === "ABERTO" || !a.kmFinal || !a.dataChegada;
    const bAberta = b.status === "ABERTO" || !b.kmFinal || !b.dataChegada;

    if(aAberta && !bAberta) return -1;
    if(!aAberta && bAberta) return 1;

    const dataA = (a.dataSaida || "") + (a.horaSaida || "");
    const dataB = (b.dataSaida || "") + (b.horaSaida || "");
    return dataB.localeCompare(dataA);
  });
}

function criarLinhaRegistro(item){
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td data-label="Data Saída">${formatarData(item.dataSaida)}</td>
    <td data-label="Hora Saída">${item.horaSaida || "-"}</td>
    <td data-label="Data Chegada">${item.dataChegada ? formatarData(item.dataChegada) : "-"}</td>
    <td data-label="Hora Chegada">${item.horaChegada || "-"}</td>
    <td data-label="Tempo">${item.tempo || "-"}</td>
    <td data-label="FASA">${item.fasa || "-"}</td>
    <td data-label="Destino">${item.destino || "-"}</td>
    <td data-label="Motorista">${item.motorista || "-"}</td>
    <td data-label="Veículo">${item.veiculo || "-"}</td>
    <td data-label="Km Inicial">${item.kmInicial || "-"}</td>
    <td data-label="Km Final">${item.kmFinal || "-"}</td>
    <td data-label="Km Rodado">${item.kmRodado || "-"}</td>
    <td data-label="Litros">${item.combustivel || "-"}</td>
    <td data-label="Atividade">${item.atividade || "-"}</td>
    <td data-label="Ação">
      ${item.status === "ABERTO" || !item.kmFinal || !item.dataChegada ? `<button class="btn-fechar" onclick="fecharViagem('${item.local_id}')">Fechar</button>` : ""}
      <button class="btn-excluir" onclick="excluirRegistro('${item.local_id}')">Excluir</button>
    </td>
  `;
  return tr;
}

function renderizar(){
  carregarCadastros();

  const lista = obterRegistrosFiltrados();
  const abertas = lista.filter(item => item.status === "ABERTO" || !item.kmFinal || !item.dataChegada);
  const finalizadas = lista.filter(item => !(item.status === "ABERTO" || !item.kmFinal || !item.dataChegada));

  const tabelaAbertas = document.getElementById("tabelaAbertas");
  const tabelaFinalizadas = document.getElementById("tabelaFinalizadas");

  if(tabelaAbertas){
    tabelaAbertas.innerHTML = "";
    abertas.forEach(item => tabelaAbertas.appendChild(criarLinhaRegistro(item)));
  }

  if(tabelaFinalizadas){
    tabelaFinalizadas.innerHTML = "";
    finalizadas.forEach(item => tabelaFinalizadas.appendChild(criarLinhaRegistro(item)));
  }

  const tituloAbertas = document.getElementById("tituloViagensAbertas");
  const tituloFinalizadas = document.getElementById("tituloViagensFinalizadas");

  if(tituloAbertas) tituloAbertas.innerText = `Viagens em Aberto (${abertas.length})`;
  if(tituloFinalizadas) tituloFinalizadas.innerText = `Histórico de Viagens Finalizadas (${finalizadas.length})`;

  atualizarResumo(lista);
}

function atualizarResumo(lista){
  document.getElementById("totalRegistros").innerText = lista.length;
  document.getElementById("viagensAbertas").innerText = lista.filter(r => r.status === "ABERTO").length;
  document.getElementById("totalKm").innerText = lista.reduce((s,r) => s + Number(r.kmRodado || 0), 0);
  document.getElementById("totalCombustivel").innerText = lista.reduce((s,r) => s + Number(r.combustivel || 0), 0).toFixed(2);
}

function fecharViagem(id){
  const item = estado.registros.find(r => r.local_id === id);
  if(!item) return;

  viagemFechamentoAtual = item;

  document.getElementById("fecharId").value = id;
  document.getElementById("fecharDataChegada").value = dataAtual();
  document.getElementById("fecharHoraChegada").value = horaAtual();
  document.getElementById("fecharKmFinal").value = item.kmFinal || "";
  document.getElementById("fecharFasa").value = item.fasa || "";
  document.getElementById("fecharDestino").value = item.destino || "";
  document.getElementById("fecharCombustivel").value = item.combustivel || "";

  document.getElementById("infoFechamento").innerHTML = `
    <b>Motorista:</b> ${item.motorista}<br>
    <b>Veículo:</b> ${item.veiculo}<br>
    <b>Saída:</b> ${formatarData(item.dataSaida)} às ${item.horaSaida}<br>
    <b>Km inicial:</b> ${item.kmInicial}
  `;

  atualizarTempoModal();
  document.getElementById("modalFechamento").style.display = "flex";
}

function atualizarTempoModal(){
  if(!viagemFechamentoAtual) return;
  const dataChegada = document.getElementById("fecharDataChegada").value;
  const horaChegada = document.getElementById("fecharHoraChegada").value;
  if(dataChegada && horaChegada){
    document.getElementById("fecharTempo").value = calcularTempo(
      viagemFechamentoAtual.dataSaida,
      viagemFechamentoAtual.horaSaida,
      dataChegada,
      horaChegada
    );
  }
}

function fecharModal(){
  document.getElementById("modalFechamento").style.display = "none";
  viagemFechamentoAtual = null;
}

async function salvarFechamento(){
  const id = document.getElementById("fecharId").value;
  const item = estado.registros.find(r => r.local_id === id);
  if(!item) return;

  const kmFinal = Number(document.getElementById("fecharKmFinal").value);
  const dataChegada = document.getElementById("fecharDataChegada").value;
  const horaChegada = document.getElementById("fecharHoraChegada").value;
  const fasa = normalizar(document.getElementById("fecharFasa").value);
  const destino = normalizar(document.getElementById("fecharDestino").value);
  const combustivel = Number(document.getElementById("fecharCombustivel").value || 0);

  if(!dataChegada) return alert("Informe a data de chegada.");
  if(!horaChegada) return alert("Informe o horário de chegada.");
  if(!kmFinal || kmFinal < Number(item.kmInicial)){
    return alert("Km final inválido. Ele não pode ser menor que o Km inicial.");
  }

  const tempo = calcularTempo(item.dataSaida, item.horaSaida, dataChegada, horaChegada);
  if(tempo === "Horário inválido"){
    return alert("A chegada não pode ser menor que a saída.");
  }

  item.kmFinal = kmFinal;
  item.kmRodado = kmFinal - Number(item.kmInicial);
  item.dataChegada = dataChegada;
  item.horaChegada = horaChegada;
  item.tempo = tempo;
  item.fasa = fasa;
  item.destino = destino;
  item.combustivel = combustivel;
  item.status = "FECHADO";
  item.usuario_email = usuarioAtual?.email || item.usuario_email || "";
  marcarPendente(item);

  salvarCache();
  fecharModal();
  renderizar();
  mostrarStatus("Viagem fechada.");
  if(navigator.onLine) await sincronizarTudo();
}

async function excluirRegistro(id){
  if(!confirm("Deseja excluir este registro?")) return;
  const item = estado.registros.find(r => r.local_id === id);
  if(item){
    item.ativo = false;
    marcarPendente(item);
    salvarCache();
    renderizar();
    if(navigator.onLine) await sincronizarTudo();
  }
}

function limparFiltros(){
  document.getElementById("pesquisa").value = "";
  document.getElementById("filtroMes").value = "";
  document.getElementById("filtroAno").value = new Date().getFullYear();
  document.getElementById("filtroVeiculo").value = "";
  renderizar();
}

function gerarPDF(){
  if(!window.jspdf || !window.jspdf.jsPDF){
    alert("A biblioteca de PDF não carregou. Abra com internet e tente novamente.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const mes = document.getElementById("filtroMes").value;
  const ano = document.getElementById("filtroAno").value;
  const veiculo = document.getElementById("filtroVeiculo").value || "TODOS OS VEÍCULOS";
  const lista = obterRegistrosFiltrados();

  if(lista.length === 0) return alert("Não há registros para gerar relatório.");

  const totalKm = lista.reduce((s,r) => s + Number(r.kmRodado || 0), 0);
  const totalComb = lista.reduce((s,r) => s + Number(r.combustivel || 0), 0);

  const doc = new jsPDF("landscape","mm","a4");
  doc.setFontSize(14);
  doc.text("RELATÓRIO DE CONTROLE DE QUILOMETRAGEM", 148, 15, {align:"center"});
  doc.setFontSize(10);
  doc.text(`Mês: ${nomeMes(mes)} / ${ano || "TODOS"}`, 14, 25);
  doc.text(`Veículo: ${veiculo}`, 105, 25);
  doc.text(`Data de emissão: ${formatarData(dataAtual())}`, 14, 31);
  doc.text(`Total de registros: ${lista.length}`, 14, 37);
  doc.text(`Total KM: ${totalKm}`, 75, 37);
  doc.text(`Total Litros: ${totalComb.toFixed(2)}`, 125, 37);

  doc.autoTable({
    startY: 45,
    head: [["Status","Saída","Chegada","Tempo","FASA","Destino","Motorista","Veículo","Km Inicial","Km Final","Km Rodado","Litros","Atividade"]],
    body: lista.map(r => [
      r.status,
      `${formatarData(r.dataSaida)} ${r.horaSaida || ""}`,
      r.dataChegada ? `${formatarData(r.dataChegada)} ${r.horaChegada || ""}` : "-",
      r.tempo || "-",
      r.fasa || "-",
      r.destino || "-",
      r.motorista || "-",
      r.veiculo || "-",
      r.kmInicial || "-",
      r.kmFinal || "-",
      r.kmRodado || "-",
      r.combustivel || "-",
      r.atividade || "-"
    ]),
    styles:{fontSize:7,cellPadding:2,overflow:"linebreak"},
    headStyles:{fillColor:[22,101,52],textColor:255},
    columnStyles:{12:{cellWidth:55}}
  });

  doc.save(`relatorio_quilometragem_${nomeMes(mes)}_${ano || "todos"}.pdf`);
}

function exportarCSV(){
  const lista = obterRegistrosFiltrados();
  if(lista.length === 0) return alert("Não há registros para exportar.");

  let csv = "Status;Data Saida;Hora Saida;Data Chegada;Hora Chegada;Tempo;FASA;Destino;Motorista;Veiculo;Km Inicial;Km Final;Km Rodado;Litros;Atividade\n";
  lista.forEach(r => {
    csv += `${r.status};${formatarData(r.dataSaida)};${r.horaSaida};${r.dataChegada ? formatarData(r.dataChegada) : ""};${r.horaChegada};${r.tempo};${r.fasa};${r.destino || ""};${r.motorista};${r.veiculo};${r.kmInicial};${r.kmFinal};${r.kmRodado};${r.combustivel || ""};${r.atividade}\n`;
  });

  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "controle_quilometragem.csv";
  link.click();
}

function alternarCadastros(){
  const conteudo = document.getElementById("conteudoCadastros");
  const seta = document.getElementById("setaCadastros");

  if(conteudo.classList.contains("fechado")){
    conteudo.classList.remove("fechado");
    conteudo.classList.add("aberto");
    seta.innerText = "▼";
  }else{
    conteudo.classList.remove("aberto");
    conteudo.classList.add("fechado");
    seta.innerText = "▶";
  }
}


async function atualizarAutomaticamenteAoEntrar(){
  if(navigator.onLine && supabaseClient){
    try{
      atualizarStatusOnline("Atualizando dados do banco automaticamente...");
      await sincronizarTudo();
      atualizarStatusOnline("Dados atualizados automaticamente: " + new Date().toLocaleString("pt-BR"));
    }catch(e){
      console.error(e);
      atualizarStatusOnline("Não foi possível atualizar automaticamente. Use o botão Sincronizar.", "aviso");
    }
  }
}


function alternarBloco(idConteudo, idSeta){
  const conteudo = document.getElementById(idConteudo);
  const seta = document.getElementById(idSeta);

  if(!conteudo || !seta) return;

  if(conteudo.classList.contains("fechado")){
    conteudo.classList.remove("fechado");
    conteudo.classList.add("aberto");
    seta.innerText = "▼";
  }else{
    conteudo.classList.remove("aberto");
    conteudo.classList.add("fechado");
    seta.innerText = "▶";
  }
}

function alternarViagensAbertas(){
  alternarBloco("conteudoViagensAbertas", "setaViagensAbertas");
}

function alternarViagensFinalizadas(){
  alternarBloco("conteudoViagensFinalizadas", "setaViagensFinalizadas");
}

async function iniciarApp(){
  carregarCache();
  document.getElementById("dataSaida").value = dataAtual();
  document.getElementById("horaSaida").value = horaAtual();
  document.getElementById("filtroAno").value = new Date().getFullYear();

  document.getElementById("fecharDataChegada").addEventListener("change", atualizarTempoModal);
  document.getElementById("fecharHoraChegada").addEventListener("input", atualizarTempoModal);

  renderizar();
  iniciarSupabase();
  await carregarUsuario();

  if(navigator.onLine && supabaseClient){
    await atualizarAutomaticamenteAoEntrar();
  }else{
    verificarConexao();
  }

  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("service-worker.js");
  }
}

document.addEventListener("visibilitychange", () => {
  if(!document.hidden){
    atualizarAutomaticamenteAoEntrar();
  }
});

window.addEventListener("focus", () => {
  atualizarAutomaticamenteAoEntrar();
});

iniciarApp();
