const entregas = [
  { id: 301, transportadora: "RotaMax", regiao: "Sudeste", prazo: 3, real: 7 },
  { id: 302, transportadora: "ViaCargo", regiao: "Sul", prazo: 5, real: 5 },
  { id: 303, transportadora: "FlashLog", regiao: "Nordeste", prazo: 4, real: 9 },
  { id: 304, transportadora: "RotaMax", regiao: "Norte", prazo: 6, real: 4 },
  { id: 305, transportadora: "ViaCargo", regiao: "Centro-Oeste", prazo: 2, real: 6 },
  { id: 306, transportadora: "FlashLog", regiao: "Sul", prazo: 5, real: 12 },
  { id: 307, transportadora: "RotaMax", regiao: "Sul", prazo: 6, real: 9 },
  { id: 308, transportadora: "ViaCargo", regiao: "Sudeste", prazo: 3, real: 4 },
  { id: 309, transportadora: "FlashLog", regiao: "Norte", prazo: 5, real: 5 },
  { id: 310, transportadora: "ViaCargo", regiao: "Nordeste", prazo: 4, real: 8 }
];

let chartTransportadora = null;
let chartRegiao = null;

// Adiciona informações calculadas em cada entrega
const dadosBase = entregas.map((e) => {
  const atraso = Math.max(0, e.real - e.prazo);
  return {
    ...e,
    atraso,
    atrasada: e.real > e.prazo
  };
});

function calcularPrioridade(atraso) {
  if (atraso >= 5) return "Alta";
  if (atraso >= 3) return "Média";
  if (atraso > 0) return "Baixa";
  return "No prazo";
}

function preencherFiltros() {
  const transportadoras = [...new Set(dadosBase.map((e) => e.transportadora))].sort();
  const regioes = [...new Set(dadosBase.map((e) => e.regiao))].sort();

  const selectTransportadora = document.getElementById("filterTransportadora");
  const selectRegiao = document.getElementById("filterRegiao");

  transportadoras.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    selectTransportadora.appendChild(option);
  });

  regioes.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    selectRegiao.appendChild(option);
  });
}

function obterDadosFiltrados() {
  const transportadora = document.getElementById("filterTransportadora").value;
  const regiao = document.getElementById("filterRegiao").value;
  const status = document.getElementById("filterStatus").value;

  return dadosBase.filter((e) => {
    const filtroTransportadora = !transportadora || e.transportadora === transportadora;
    const filtroRegiao = !regiao || e.regiao === regiao;
    const filtroStatus =
      !status ||
      (status === "atrasada" && e.atrasada) ||
      (status === "noprazo" && !e.atrasada);

    return filtroTransportadora && filtroRegiao && filtroStatus;
  });
}

function atualizarKPIs(dados) {
  const total = dados.length;
  const atrasadas = dados.filter((e) => e.atrasada);
  const totalAtrasadas = atrasadas.length;
  const percentualAtraso = total ? ((totalAtrasadas / total) * 100).toFixed(1) : "0.0";
  const maiorAtraso = atrasadas.length ? Math.max(...atrasadas.map((e) => e.atraso)) : 0;

  document.getElementById("kpiTotal").textContent = total;
  document.getElementById("kpiAtrasadas").textContent = totalAtrasadas;
  document.getElementById("kpiPercentual").textContent = `${percentualAtraso}%`;
  document.getElementById("kpiMaiorAtraso").textContent = `${maiorAtraso} dias`;
}

function contarAtrasosPorCampo(dados, campo) {
  const contagem = {};

  dados.forEach((e) => {
    const chave = e[campo];
    if (!contagem[chave]) contagem[chave] = 0;
    if (e.atrasada) contagem[chave]++;
  });

  return contagem;
}

function atualizarGraficoTransportadora(dados) {
  const contagem = contarAtrasosPorCampo(dados, "transportadora");
  const labels = Object.keys(contagem);
  const valores = Object.values(contagem);

  if (chartTransportadora) chartTransportadora.destroy();

  chartTransportadora = new Chart(document.getElementById("chartTransportadora"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Atrasos",
          data: valores
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

function atualizarGraficoRegiao(dados) {
  const contagem = contarAtrasosPorCampo(dados, "regiao");
  const labels = Object.keys(contagem);
  const valores = Object.values(contagem);

  if (chartRegiao) chartRegiao.destroy();

  chartRegiao = new Chart(document.getElementById("chartRegiao"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: valores
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

function atualizarTabela(dados) {
  const tbody = document.getElementById("tabelaEntregas");

  const ordenado = [...dados].sort((a, b) => b.atraso - a.atraso);
  tbody.innerHTML = "";

  ordenado.forEach((e) => {
    const prioridade = calcularPrioridade(e.atraso);

    let badgePrioridade = "";
    if (prioridade === "Alta") {
      badgePrioridade = `<span class="badge high">Alta</span>`;
    } else if (prioridade === "Média") {
      badgePrioridade = `<span class="badge medium">Média</span>`;
    } else if (prioridade === "Baixa") {
      badgePrioridade = `<span class="badge delay">Baixa</span>`;
    } else {
      badgePrioridade = `<span class="badge ok">No prazo</span>`;
    }

    const status = e.atrasada
      ? `<span class="badge delay">Atrasada</span>`
      : `<span class="badge ok">No prazo</span>`;

    const tr = document.createElement("tr");
    if (e.atraso >= 5) tr.classList.add("row-critical");

    tr.innerHTML = `
      <td>#${e.id}</td>
      <td>${e.transportadora}</td>
      <td>${e.regiao}</td>
      <td>${e.prazo} dias</td>
      <td>${e.real} dias</td>
      <td>${status}</td>
      <td>${e.atraso > 0 ? `+${e.atraso} dias` : "0 dias"}</td>
    `;

    tbody.appendChild(tr);
  });
}

function atualizarDashboard() {
  const dadosFiltrados = obterDadosFiltrados();
  atualizarKPIs(dadosFiltrados);
  atualizarGraficoTransportadora(dadosFiltrados);
  atualizarGraficoRegiao(dadosFiltrados);
  atualizarTabela(dadosFiltrados);
}

document.getElementById("filterTransportadora").addEventListener("change", atualizarDashboard);
document.getElementById("filterRegiao").addEventListener("change", atualizarDashboard);
document.getElementById("filterStatus").addEventListener("change", atualizarDashboard);

document.addEventListener("DOMContentLoaded", () => {
  preencherFiltros();
  atualizarDashboard();
});