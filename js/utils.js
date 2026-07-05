function uuidLocal(){
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "local_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function dataAtual(){
  return new Date().toISOString().split("T")[0];
}

function horaAtual(){
  const agora = new Date();
  return String(agora.getHours()).padStart(2,"0") + ":" + String(agora.getMinutes()).padStart(2,"0");
}

function formatarData(data){
  if(!data) return "";
  const p = data.split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function calcularTempo(dataSaida,horaSaida,dataChegada,horaChegada){
  const inicio = new Date(`${dataSaida}T${horaSaida}`);
  const fim = new Date(`${dataChegada}T${horaChegada}`);
  const diff = fim - inicio;
  if(diff < 0 || Number.isNaN(diff)) return "Horário inválido";
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(minutos / 60);
  const min = minutos % 60;
  return `${horas}h ${min}min`;
}

function nomeMes(numero){
  const meses = {"01":"JANEIRO","02":"FEVEREIRO","03":"MARÇO","04":"ABRIL","05":"MAIO","06":"JUNHO","07":"JULHO","08":"AGOSTO","09":"SETEMBRO","10":"OUTUBRO","11":"NOVEMBRO","12":"DEZEMBRO"};
  return meses[numero] || "TODOS OS MESES";
}

function mostrarStatus(mensagem,tipo="ok"){
  const status = document.getElementById("status");
  status.style.display = "block";
  status.innerText = mensagem;
  if(tipo === "erro"){
    status.style.background = "#fee2e2";
    status.style.color = "#991b1b";
  }else{
    status.style.background = "#ecfdf5";
    status.style.color = "#166534";
  }
  setTimeout(() => status.style.display = "none", 3500);
}

function normalizar(txt){
  return (txt || "").trim().toUpperCase();
}
