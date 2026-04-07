// ==========================
// IDENTIFICAÇÃO DE PÁGINA
// ==========================
const pagina = window.location.pathname;

// ==========================
// STORAGE
// ==========================
function getAnalises() {
  return JSON.parse(localStorage.getItem("analises")) || [];
}

function setAnalises(lista) {
  localStorage.setItem("analises", JSON.stringify(lista));
}

// ==========================
// UUID
// ==========================
function gerarId() {
  return crypto.randomUUID();
}

// ==========================
// CALCULAR NOTA TOTAL
// ==========================
function calcularNotaTotal(analise) {
  let total = 0;

  for (let chave in analise) {
    if (chave.toLowerCase().includes("nota")) {
      const valor = parseFloat(analise[chave]);
      if (!isNaN(valor)) total += valor;
    }
  }

  return total;
}

// ==========================
// BUSCAR POR ID
// ==========================
function buscarPorId(id) {
  return getAnalises().find(a => a.id === id);
}

// ==========================
// ==========================
// INDEX (CRUD)
// ==========================
// ==========================
if (pagina.includes("index.html") || pagina === "/") {
  renderLista();
}

function renderLista() {
  const lista = document.getElementById("lista-analises");
  const analises = getAnalises();

  if (!lista) return;

  // ordena por nota (melhor primeiro)
  analises.sort((a, b) => (b.notaTotal || 0) - (a.notaTotal || 0));

  lista.innerHTML = `<h2>Análises registradas</h2>`;

  analises.forEach(item => {
    const row = document.createElement("div");
    row.className = "row border-top pt-2 mt-2";

    row.innerHTML = `
      <div class="col-4">
        <span class="fw-bold d-block">${item.nomeCerveja || "Sem nome"}</span>
        <span class="text-secondary d-block">${item.estilo || "-"}</span>
        <span class="text-secondary d-block">${formatarData(item.dataAnalise)}</span>
      </div>

      <div class="col-2 text-center pt-2">
        <span>Nota</span><br>
        <span class="fw-bold">${item.notaTotal ?? 0}</span>
      </div>

      <div class="col-6 text-end pt-3">
        <button class="btn btn-secondary btn-sm" onclick="consultar('${item.id}')">consultar</button>
        <button class="btn btn-warning btn-sm" onclick="editar('${item.id}')">editar</button>
        <button class="btn btn-danger btn-sm" onclick="excluir('${item.id}')">excluir</button>
      </div>
    `;

    lista.appendChild(row);
  });
}

// ==========================
// FORMATAR DATA
// ==========================
function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

// ==========================
// EXCLUIR
// ==========================
function excluir(id) {
  if (!confirm("Deseja excluir esta análise?")) return;

  let analises = getAnalises();
  analises = analises.filter(a => a.id !== id);

  setAnalises(analises);
  renderLista();
}

// ==========================
// NAVEGAÇÃO
// ==========================
function consultar(id) {
  window.location.href = `visualizar.html?id=${id}`;
}

function editar(id) {
  window.location.href = `analise.html?editar=${id}`;
}

// ==========================
// ==========================
// ANALISE (FORMULÁRIO)
// ==========================
// ==========================
if (pagina.includes("analise.html")) {
  const form = document.getElementById("form-analise");

  if (form) {
    const params = new URLSearchParams(window.location.search);
    const editarId = params.get("editar");

    // Preencher se for edição
    if (editarId) {
      preencherFormulario(editarId);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const dados = new FormData(form);
      const analise = {};

      dados.forEach((valor, chave) => {
        if (analise[chave]) {
          analise[chave] = [].concat(analise[chave], valor);
        } else {
          analise[chave] = valor;
        }
      });

      // calcula nota
      analise.notaTotal = calcularNotaTotal(analise);

      if (editarId) {
        atualizarAnalise(editarId, analise);
      } else {
        analise.id = gerarId();
        salvarAnalise(analise);
      }

      // redireciona para index
      window.location.href = "index.html";
    });
  }
}

// ==========================
// SALVAR
// ==========================
function salvarAnalise(nova) {
  const analises = getAnalises();
  analises.push(nova);
  setAnalises(analises);
}

// ==========================
// ATUALIZAR
// ==========================
function atualizarAnalise(id, nova) {
  const analises = getAnalises();

  const atualizadas = analises.map(a =>
    a.id === id ? { ...nova, id } : a
  );

  setAnalises(atualizadas);
}

// ==========================
// PREENCHER FORMULÁRIO
// ==========================
function preencherFormulario(id) {
  const item = buscarPorId(id);
  if (!item) return;

  for (let chave in item) {
    const campos = document.querySelectorAll(`[name="${chave}"]`);

    campos.forEach(campo => {
      if (campo.type === "checkbox") {
        if (Array.isArray(item[chave])) {
          campo.checked = item[chave].includes(campo.value);
        } else {
          campo.checked = campo.value === item[chave];
        }
      } else if (campo.type === "radio") {
        campo.checked = campo.value === item[chave];
      } else {
        campo.value = item[chave];
      }
    });
  }
}

// ==========================
// VISUALIZAR
// ==========================
if (pagina.includes("visualizar.html")) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    mostrarDetalhes(id);
  }
}

function mostrarDetalhes(id) {
  const item = buscarPorId(id);
  const container = document.getElementById("detalhes");

  if (!item || !container) return;

  let html = "";

  for (let chave in item) {
    if (chave === "id") continue;

    let valor = item[chave];

    if (Array.isArray(valor)) {
      valor = valor.join(", ");
    }

    html += `
      <div class="card mb-2 p-2">
        <strong>${formatarTitulo(chave)}</strong>
        <p>${valor || "-"}</p>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ==========================
// FORMATAR TÍTULOS
// ==========================
function formatarTitulo(texto) {
  return texto
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase());
}

// ==========================
// REMOVER REGISTROS ANTIGOS
// ==========================
function corrigirIdsAntigos() {
  const analises = getAnalises();
  let alterado = false;

  analises.forEach(a => {
    if (!a.id) {
      a.id = crypto.randomUUID();
      alterado = true;
    }
  });

  if (alterado) {
    setAnalises(analises);
    console.log("IDs corrigidos");
  }
}

// executa ao carregar
corrigirIdsAntigos();