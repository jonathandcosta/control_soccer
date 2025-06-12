// =============================================
// VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// =============================================

// Elementos do DOM
const formAtleta = document.getElementById('formAtleta');
const listaAtletas = document.getElementById('atletasCadastrados');
const btnLimpar = document.getElementById('limparLista');
const filtroPosicao = document.getElementById('filtroPosicao');
const filtroCriterio = document.getElementById('filtroCriterio');
const btnAplicarFiltro = document.getElementById('aplicarFiltro');

// Dados da aplicação
let atletas = JSON.parse(localStorage.getItem('atletas')) || [];
const times = {
  Azul: { jogadores: [], contador: 0 },
  Amarelo: { jogadores: [], contador: 0 },
  Laranja: { jogadores: [], contador: 0 },
};

// Limites de posições por time
const LIMITES_POSICOES = {
  GOL: 1,
  ZAG: 2,
  LE: 1,
  LD: 1,
  VOL: 2,
  ME: 2,
  ATA: 2,
};

// =============================================
// EVENT LISTENERS
// =============================================

formAtleta.addEventListener('submit', cadastrarAtleta);
btnLimpar.addEventListener('click', limparAtletas);
btnAplicarFiltro.addEventListener('click', atualizarListaAtletas);

// Event delegation para botões dinâmicos
document.addEventListener('click', function (e) {
  // Botões de time
  if (e.target.classList.contains('btn-time')) {
    const time = e.target.getAttribute('data-time');
    const idAtleta = e.target.getAttribute('data-id');
    const atleta = atletas.find((a) => a.dataCadastro === idAtleta);
    adicionarAoTime(time, atleta);
  }

  // Botão excluir
  if (e.target.classList.contains('btn-excluir')) {
    const time = e.target.getAttribute('data-time');
    const idAtleta = e.target.getAttribute('data-id');
    removerDoTime(time, idAtleta);
  }

  // Botão editar
  if (e.target.classList.contains('btn-editar')) {
    const idAtleta = e.target.getAttribute('data-id');
    editarJogador(idAtleta);
  }
});

// =============================================
// FUNÇÕES PRINCIPAIS
// =============================================

function cadastrarAtleta(e) {
  e.preventDefault();

  const nomeInput = document.getElementById('nome');
  const nomeFormatado = formatarNome(nomeInput.value.trim());
  const mensalista = document.getElementById('mensalista').checked;
  const assiduo = document.getElementById('assiduo').checked;
  const convidado = document.getElementById('convidado').checked;
  const posicao = document.getElementById('posicao').value;

  // Validação básica
  if (!nomeFormatado || !posicao) {
    alert('Por favor, preencha todos os campos obrigatórios');
    return;
  }

  const atleta = {
    nome: nomeFormatado,
    mensalista,
    assiduo,
    convidado,
    posicao,
    dataCadastro: new Date().getTime().toString(),
  };

  atletas.push(atleta);
  salvarNoLocalStorage();
  atualizarListaAtletas();
  atualizarEstatisticas()
  formAtleta.reset();
  document.getElementById('nome').focus();
}

function editarJogador(idAtleta) {
  const atleta = atletas.find((a) => a.dataCadastro === idAtleta);
  if (!atleta) return;

  // Encontra e remove do time se estiver em algum
  const timeDoAtleta = Object.keys(times).find((time) =>
    times[time].jogadores.some((j) => j.dataCadastro === idAtleta),
  );

  if (timeDoAtleta) {
    removerDoTime(timeDoAtleta, idAtleta);
  }

  // Preenche o formulário para edição
  document.getElementById('nome').value = atleta.nome;
  document.getElementById('mensalista').checked = atleta.mensalista;
  document.getElementById('assiduo').checked = atleta.assiduo;
  document.getElementById('convidado').checked = atleta.convidado;
  document.getElementById('posicao').value = atleta.posicao;

  // Remove da lista para evitar duplicação
  atletas = atletas.filter((a) => a.dataCadastro !== idAtleta);
  salvarNoLocalStorage();
  atualizarListaAtletas();
  document.getElementById('nome').focus();
}

function limparAtletas() {
  if (confirm('Tem certeza que deseja apagar TODOS os atletas?')) {
    atletas = [];
    Object.keys(times).forEach((time) => {
      times[time].jogadores = [];
      times[time].contador = 0;
    });
    salvarNoLocalStorage();
    atualizarListaAtletas();
    atualizarTimes();
    atualizarEstatisticas()
  }
}

// =============================================
// FUNÇÕES DE ATUALIZAÇÃO DE VISUALIZAÇÃO
// =============================================

function atualizarListaAtletas() {
  const atletasExibidos = aplicarFiltros();
  listaAtletas.innerHTML = '';

  atletasExibidos.forEach((atleta, index) => {
    const li = document.createElement('li');
    const emTime = estaEmTime(atleta);

    li.innerHTML = `
      <strong>${index + 1}.</strong> ${atleta.nome} (${atleta.posicao}) - 
      ${atleta.mensalista ? 'Mensalista' : ''} ${
      atleta.assiduo ? 'Assíduo' : ''
    } ${atleta.convidado ? 'Convidado' : ''}
      <small>${new Date(parseInt(atleta.dataCadastro)).toLocaleString()}</small>
      <div class="botoes-time">
        <button class="btn-time btn-azul" data-time="Azul" data-id="${
          atleta.dataCadastro
        }" ${emTime ? 'disabled' : ''}>
          Azul
        </button>
        <button class="btn-time btn-amarelo" data-time="Amarelo" data-id="${
          atleta.dataCadastro
        }" ${emTime ? 'disabled' : ''}>
          Amarelo
        </button>
        <button class="btn-time btn-laranja" data-time="Laranja" data-id="${
          atleta.dataCadastro
        }" ${emTime ? 'disabled' : ''}>
          Laranja
        </button>
        </div>
        
        <div class="fedback-times">
           ${times.Azul.contador} Azul, ${times.Amarelo.contador} Amarelo, ${
      times.Laranja.contador
    } Laranja
        </div>
      
      `;
    listaAtletas.appendChild(li);
  });
}

function atualizarTimes() {
  Object.keys(times).forEach((time) => {
    const timeElement = document.getElementById(`time${time}`);
    const ul = timeElement.querySelector('ul');
    ul.innerHTML = '';

    times[time].jogadores.forEach((jogador) => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${jogador.nome} (${jogador.posicao})
        <button class="btn-editar" data-id="${jogador.dataCadastro}">✏️</button>
        <button class="btn-excluir" data-time="${time}" data-id="${jogador.dataCadastro}">×</button>
      `;
      ul.appendChild(li);
    });

    timeElement.querySelector(
      'h3',
    ).textContent = `Time ${time} (${times[time].contador}/11)`;
  });
}

// =============================================
// FUNÇÕES DE LÓGICA DE NEGÓCIO
// =============================================

function adicionarAoTime(time, atleta) {
  const timeObj = times[time];

  // Validações
  if (timeObj.contador >= 11) {
    alert(`Time ${time} já está completo (11 jogadores)`);
    return;
  }

  if (estaEmTime(atleta)) {
    alert('Este jogador já está em um time!');
    return;
  }

  const posicoesNoTime = timeObj.jogadores.map((j) => j.posicao);
  const countPosicao = posicoesNoTime.filter(
    (p) => p === atleta.posicao,
  ).length;

  if (countPosicao >= LIMITES_POSICOES[atleta.posicao]) {
    alert(
      `Time ${time} já tem o máximo de ${atleta.posicao}s (${
        LIMITES_POSICOES[atleta.posicao]
      })`,
    );
    return;
  }

  // Adiciona ao time
  timeObj.jogadores.push(atleta);
  timeObj.contador++;
  salvarNoLocalStorage();
  atualizarTimes();
  atualizarListaAtletas();
}

function removerDoTime(time, idAtleta) {
  const timeObj = times[time];
  const index = timeObj.jogadores.findIndex((j) => j.dataCadastro === idAtleta);

  if (index !== -1) {
    timeObj.jogadores.splice(index, 1);
    timeObj.contador--;
    salvarNoLocalStorage();
    atualizarTimes();
    atualizarListaAtletas();
  }
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

function formatarNome(nome) {
  return nome
    .trim()
    .toLowerCase()
    .split(' ')
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

function aplicarFiltros() {
  const posicaoSelecionada = filtroPosicao.value;
  const criterioSelecionado = filtroCriterio.value;

  let atletasFiltrados = atletas;

  if (posicaoSelecionada !== 'TODOS') {
    atletasFiltrados = atletasFiltrados.filter(
      (atleta) => atleta.posicao === posicaoSelecionada,
    );
  }

  if (criterioSelecionado !== 'TODOS') {
    atletasFiltrados = atletasFiltrados.filter((atleta) => {
      if (criterioSelecionado === 'MENSALISTA') return atleta.mensalista;
      if (criterioSelecionado === 'ASSIDUO') return atleta.assiduo;
      if (criterioSelecionado === 'CONVIDADO') return atleta.convidado;
      if (criterioSelecionado === 'AMBOS')
        return atleta.mensalista && atleta.assiduo && atleta.convidado;
      return true;
    });
  }

  return atletasFiltrados;
}

function estaEmTime(atleta) {
  return Object.values(times).some((time) =>
    time.jogadores.some((j) => j.dataCadastro === atleta.dataCadastro),
  );
}

function salvarNoLocalStorage() {
  localStorage.setItem('atletas', JSON.stringify(atletas));
  localStorage.setItem('times', JSON.stringify(times));
}

function carregarDados() {
  const savedTimes = JSON.parse(localStorage.getItem('times'));
  if (savedTimes) {
    Object.keys(savedTimes).forEach((time) => {
      times[time] = savedTimes[time];
    });
  }
  atualizarListaAtletas();
  atualizarTimes();
  atualizarEstatisticas()
}

// Inicialização
carregarDados();

function atualizarEstatisticas() {
  const totalAtletas = atletas.length;
  const totalMensalistas = atletas.filter((a) => a.mensalista).length;
  const totalAssiduos = atletas.filter((a) => a.assiduo).length;
  const totalConvidados = atletas.filter((a) => a.convidado).length;

  document.getElementById('totalAtletas').textContent = totalAtletas;
  document.getElementById('totalMensalistas').textContent = totalMensalistas;
  document.getElementById('totalAssiduos').textContent = totalAssiduos;
  document.getElementById('totalConvidados').textContent = totalConvidados;
}
