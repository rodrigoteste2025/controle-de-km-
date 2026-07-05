let supabaseClient = null;
let usuarioAtual = null;

function iniciarSupabase(){
  if(!USAR_SUPABASE){
    atualizarStatusOnline("Supabase desativado no config.js.", "erro");
    return;
  }

  if(!window.supabase){
    atualizarStatusOnline("Biblioteca Supabase não carregou. Verifique a internet.", "erro");
    return;
  }

  if(!SUPABASE_URL.includes("supabase.co") || SUPABASE_ANON_KEY.includes("COLE_AQUI")){
    atualizarStatusOnline("Configure a URL e a chave publishable no arquivo js/config.js.", "erro");
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function atualizarStatusOnline(msg, tipo="ok"){
  const el = document.getElementById("statusOnline");
  if(!el) return;
  el.style.color = tipo === "erro" ? "#991b1b" : tipo === "aviso" ? "#92400e" : "#166534";
  el.innerText = msg;
}

function verificarConexao(){
  if(!navigator.onLine){
    atualizarStatusOnline("Sem internet. O app continua salvando no celular.", "erro");
    return false;
  }
  if(!supabaseClient){
    iniciarSupabase();
  }
  if(!supabaseClient){
    atualizarStatusOnline("Supabase não configurado.", "erro");
    return false;
  }
  atualizarStatusOnline("Internet ativa e Supabase configurado.");
  return true;
}

async function carregarUsuario(){
  if(!supabaseClient) return;
  const { data } = await supabaseClient.auth.getUser();
  usuarioAtual = data?.user || null;
  document.getElementById("usuarioLogado").innerText = usuarioAtual ? usuarioAtual.email : "Sem login";
}

function abrirLogin(){
  document.getElementById("modalLogin").style.display = "flex";
}

function fecharLogin(){
  document.getElementById("modalLogin").style.display = "none";
}

async function entrar(){
  if(!verificarConexao()) return;
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginSenha").value;

  if(!email || !password){
    alert("Informe e-mail e senha.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if(error){
    alert("Erro no login: " + error.message);
    return;
  }

  fecharLogin();
  await carregarUsuario();
  mostrarStatus("Login realizado com sucesso.");
}

async function sair(){
  if(supabaseClient){
    await supabaseClient.auth.signOut();
  }
  usuarioAtual = null;
  document.getElementById("usuarioLogado").innerText = "Sem login";
  mostrarStatus("Você saiu do sistema.");
}

function motoristaParaSupabase(m){
  return {
    local_id: m.local_id,
    nome: m.nome,
    ativo: m.ativo !== false,
    atualizado_em: m.atualizado_em || new Date().toISOString()
  };
}

function veiculoParaSupabase(v){
  return {
    local_id: v.local_id,
    nome: v.nome,
    ativo: v.ativo !== false,
    atualizado_em: v.atualizado_em || new Date().toISOString()
  };
}

function registroParaSupabase(r){
  return {
    local_id: r.local_id,
    status: r.status || "ABERTO",
    data_saida: r.dataSaida || null,
    hora_saida: r.horaSaida || null,
    data_chegada: r.dataChegada || null,
    hora_chegada: r.horaChegada || null,
    tempo: r.tempo || null,
    fasa: r.fasa || null,
    motorista: r.motorista || null,
    veiculo: r.veiculo || null,
    km_inicial: r.kmInicial || null,
    km_final: r.kmFinal || null,
    km_rodado: r.kmRodado || null,
    combustivel: r.combustivel || null,
    tipo_combustivel: r.tipoCombustivel || null,
    atividade: r.atividade || null,
    usuario_email: r.usuario_email || usuarioAtual?.email || null,
    ativo: r.ativo !== false,
    atualizado_em: r.atualizado_em || new Date().toISOString()
  };
}

function motoristaDoSupabase(m){
  return {
    local_id: m.local_id,
    nome: m.nome,
    ativo: m.ativo !== false,
    pendente: false,
    atualizado_em: m.atualizado_em
  };
}

function veiculoDoSupabase(v){
  return {
    local_id: v.local_id,
    nome: v.nome,
    ativo: v.ativo !== false,
    pendente: false,
    atualizado_em: v.atualizado_em
  };
}

function registroDoSupabase(r){
  return {
    local_id: r.local_id,
    status: r.status || "ABERTO",
    dataSaida: r.data_saida || "",
    horaSaida: r.hora_saida ? String(r.hora_saida).substring(0,5) : "",
    dataChegada: r.data_chegada || "",
    horaChegada: r.hora_chegada ? String(r.hora_chegada).substring(0,5) : "",
    tempo: r.tempo || "",
    fasa: r.fasa || "",
    motorista: r.motorista || "",
    veiculo: r.veiculo || "",
    kmInicial: r.km_inicial || "",
    kmFinal: r.km_final || "",
    kmRodado: r.km_rodado || "",
    combustivel: r.combustivel || "",
    tipoCombustivel: r.tipo_combustivel || "",
    atividade: r.atividade || "",
    usuario_email: r.usuario_email || "",
    ativo: r.ativo !== false,
    pendente: false,
    atualizado_em: r.atualizado_em
  };
}

async function enviarPendentes(){
  if(!verificarConexao()) return;

  const agora = new Date().toISOString();

  const motoristasPendentes = estado.motoristas.filter(m => m.pendente);
  for(const m of motoristasPendentes){
    m.atualizado_em = agora;
    const { error } = await supabaseClient.from("motoristas").upsert(motoristaParaSupabase(m), { onConflict: "local_id" });
    if(error) throw error;
    m.pendente = false;
  }

  const veiculosPendentes = estado.veiculos.filter(v => v.pendente);
  for(const v of veiculosPendentes){
    v.atualizado_em = agora;
    const { error } = await supabaseClient.from("veiculos").upsert(veiculoParaSupabase(v), { onConflict: "local_id" });
    if(error) throw error;
    v.pendente = false;
  }

  const registrosPendentes = estado.registros.filter(r => r.pendente);
  for(const r of registrosPendentes){
    r.atualizado_em = agora;
    const { error } = await supabaseClient.from("quilometragem").upsert(registroParaSupabase(r), { onConflict: "local_id" });
    if(error) throw error;
    r.pendente = false;
  }

  salvarCache();
}

async function baixarDoBanco(mostrar=true){
  if(!verificarConexao()) return;

  try{
    if(mostrar) mostrarStatus("Baixando dados do Supabase...");

    const { data: ms, error: em } = await supabaseClient.from("motoristas").select("*").order("nome");
    if(em) throw em;

    const { data: vs, error: ev } = await supabaseClient.from("veiculos").select("*").order("nome");
    if(ev) throw ev;

    const { data: rs, error: er } = await supabaseClient.from("quilometragem").select("*").order("data_saida", { ascending: false });
    if(er) throw er;

    const pendMotoristas = estado.motoristas.filter(m => m.pendente);
    const pendVeiculos = estado.veiculos.filter(v => v.pendente);
    const pendRegistros = estado.registros.filter(r => r.pendente);

    estado.motoristas = (ms || []).map(motoristaDoSupabase).filter(m => m.ativo);
    estado.veiculos = (vs || []).map(veiculoDoSupabase).filter(v => v.ativo);
    estado.registros = (rs || []).map(registroDoSupabase).filter(r => r.ativo);

    for(const m of pendMotoristas){
      if(!estado.motoristas.some(x => x.local_id === m.local_id)) estado.motoristas.push(m);
    }
    for(const v of pendVeiculos){
      if(!estado.veiculos.some(x => x.local_id === v.local_id)) estado.veiculos.push(v);
    }
    for(const r of pendRegistros){
      if(!estado.registros.some(x => x.local_id === r.local_id)) estado.registros.push(r);
    }

    salvarCache();
    renderizar();
    if(mostrar) mostrarStatus("Dados atualizados do banco.");
    atualizarStatusOnline("Última atualização do banco: " + new Date().toLocaleString("pt-BR"));
  }catch(e){
    console.error(e);
    alert("Erro ao baixar do banco: " + e.message);
  }
}

async function sincronizarTudo(){
  if(!verificarConexao()) return;

  try{
    mostrarStatus("Sincronizando...");
    await enviarPendentes();
    await baixarDoBanco(false);
    mostrarStatus("Sincronização concluída.");
    atualizarStatusOnline("Última sincronização: " + new Date().toLocaleString("pt-BR"));
  }catch(e){
    console.error(e);
    alert("Erro ao sincronizar: " + e.message);
  }
}

window.addEventListener("online", () => {
  atualizarStatusOnline("Internet voltou. Sincronizando...");
  sincronizarTudo();
});

window.addEventListener("offline", () => {
  atualizarStatusOnline("Sem internet. Os dados serão salvos no celular.", "erro");
});
