
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const categorias = ['Baby', 'Infantil', 'Pré-juvenil', 'Juvenil'];

const dataHoje = () => {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
};

const novoFormulario = () => ({
  nome: '',
  responsavel: '',
  telefone: '',
  categoria: 'Baby',
  turno: 'Tarde',
  mensalidade: '70',
  data_matricula: dataHoje(),
  ativo: true,
  bolsista: false,
  isento: false
});

const dinheiro = valor =>
  Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [login, setLogin] = useState({ email: '', senha: '' });
  const [form, setForm] = useState(novoFormulario);

  const estiloInput = {
    width: '100%',
    padding: 11,
    marginTop: 6,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    boxSizing: 'border-box',
    fontSize: 15
  };

  const estiloBotao = {
    padding: '10px 15px',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold'
  };

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (ativo) setCarregando(false);
        return;
      }

      const { data: admin, error: adminError } =
        await supabase.rpc('is_admin');

      if (adminError || admin !== true) {
        await supabase.auth.signOut();
        if (ativo) {
          setErro('Acesso não autorizado. Entre com a conta administradora.');
          setCarregando(false);
        }
        return;
      }

      if (ativo) setUsuario(session.user);
      await carregarAlunos();

      if (ativo) setCarregando(false);
    }

    iniciar();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session && ativo) setUsuario(null);
      }
    );

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function carregarAlunos() {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      setErro('Não foi possível carregar os alunos: ' + error.message);
      return;
    }

    setAlunos(data || []);
  }

  async function entrar(event) {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: login.email,
      password: login.senha
    });

    if (error) {
      setErro('Não foi possível entrar: ' + error.message);
      setCarregando(false);
      return;
    }

    const { data: admin, error: adminError } =
      await supabase.rpc('is_admin');

    if (adminError || admin !== true) {
      await supabase.auth.signOut();
      setErro('Este usuário não tem autorização de administrador.');
      setCarregando(false);
      return;
    }

    setUsuario(data.user);
    await carregarAlunos();
    setCarregando(false);
  }

  async function sair() {
    await supabase.auth.signOut();
    setUsuario(null);
    setAlunos([]);
    cancelarEdicao();
  }

  function atualizar(campo, valor) {
    setForm(atual => {
      const proximo = { ...atual, [campo]: valor };

      if (campo === 'turno') {
        if (valor === 'Manhã' &&
            !['Pré-juvenil', 'Juvenil'].includes(proximo.categoria)) {
          proximo.categoria = 'Pré-juvenil';
        }

        if (valor === 'Tarde' &&
            !categorias.includes(proximo.categoria)) {
          proximo.categoria = 'Baby';
        }

        if (valor === 'Manhã' && !editandoId && !atual.mensalidade) {
          proximo.mensalidade = '60';
        }

        if (valor === 'Tarde' && !editandoId && !atual.mensalidade) {
          proximo.mensalidade = '70';
        }
      }

      return proximo;
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(novoFormulario());
    setErro('');
    setMensagem('');
  }

  function editarAluno(aluno) {
    setEditandoId(aluno.id);
    setErro('');
    setMensagem('');

    const turno = aluno.turno || 'Tarde';
    let categoria = aluno.categoria || 'Baby';

    if (turno === 'Manhã' &&
        !['Pré-juvenil', 'Juvenil'].includes(categoria)) {
      categoria = 'Pré-juvenil';
    }

    setForm({
      nome: aluno.nome || '',
      responsavel: aluno.responsavel || '',
      telefone: aluno.telefone || '',
      categoria,
      turno,
      mensalidade: String(aluno.mensalidade ?? ''),
      data_matricula: aluno.data_matricula || dataHoje(),
      ativo: aluno.ativo ?? true,
      bolsista: aluno.bolsista ?? false,
      isento: aluno.isento ?? false
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function salvarAluno(event) {
    event.preventDefault();
    setErro('');
    setMensagem('');

    if (!form.nome.trim()) {
      setErro('Informe o nome do aluno.');
      return;
    }

    if (!form.turno) {
      setErro('Selecione o turno principal do aluno.');
      return;
    }

    if (form.turno === 'Manhã' &&
        !['Pré-juvenil', 'Juvenil'].includes(form.categoria)) {
      setErro('Pela manhã, as categorias são Pré-juvenil e Juvenil.');
      return;
    }

    const valorMensalidade = form.isento
      ? 0
      : Number(form.mensalidade);

    if (!form.isento &&
        (form.mensalidade === '' ||
         !Number.isFinite(valorMensalidade) ||
         valorMensalidade < 0)) {
      setErro('Informe um valor de mensalidade válido.');
      return;
    }

    setSalvando(true);

    const registro = {
      nome: form.nome.trim(),
      responsavel: form.responsavel.trim(),
      telefone: form.telefone.trim(),
      categoria: form.categoria,
      turno: form.turno,
      mensalidade: valorMensalidade,
      data_matricula: form.data_matricula,
      ativo: form.ativo,
      bolsista: form.bolsista,
      isento: form.isento
    };

    const resultado = editandoId
      ? await supabase.from('alunos').update(registro).eq('id', editandoId)
      : await supabase.from('alunos').insert(registro);

    if (resultado.error) {
      setErro('Erro ao salvar aluno: ' + resultado.error.message);
    } else {
      setMensagem(editandoId
        ? 'Cadastro atualizado com sucesso!'
        : 'Aluno cadastrado com sucesso!');

      setEditandoId(null);
      setForm(novoFormulario());
      await carregarAlunos();
    }

    setSalvando(false);
  }

  function renderTabela(lista) {
    if (!lista.length) {
      return <p style={{ color: '#64748b' }}>Nenhum aluno neste grupo.</p>;
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left'
        }}>
          <thead>
            <tr>
              {['Aluno', 'Responsável', 'WhatsApp', 'Mensalidade', 'Situação', 'Ação'].map(t =>
                <th key={t} style={{
                  padding: 10,
                  borderBottom: '2px solid #cbd5e1'
                }}>{t}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {lista.map(a => (
              <tr key={a.id}>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                  {a.nome}
                </td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                  {a.responsavel || '—'}
                </td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                  {a.telefone || '—'}
                </td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                  {a.isento ? 'Isento' : dinheiro(a.mensalidade)}
                  {a.bolsista && !a.isento ? ' · Bolsista' : ''}
                </td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                  {a.ativo ? 'Ativo' : 'Inativo'}
                </td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => editarAluno(a)}
                    style={{ ...estiloBotao, background: '#dbeafe', color: '#1d4ed8' }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const ativos = alunos.filter(a => a.ativo);
  const bolsistasIsentos = ativos.filter(a => a.bolsista || a.isento);
  const pagantes = ativos.filter(a => !a.bolsista && !a.isento);
  const semTurno = pagantes.filter(a => !a.turno);
  const turnos = ['Manhã', 'Tarde'];

  if (carregando) {
    return <main style={{ padding: 30, fontFamily: 'Arial' }}>
      Carregando Pereira's Gestão...
    </main>;
  }

  if (!usuario) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: '#0f172a',
        fontFamily: 'Arial, sans-serif'
      }}>
        <form onSubmit={entrar} style={{
          width: '100%',
          maxWidth: 380,
          background: 'white',
          padding: 28,
          borderRadius: 16,
          boxSizing: 'border-box'
        }}>
          <h1 style={{ textAlign: 'center' }}>⚽ Pereira's Gestão</h1>
          <p style={{ textAlign: 'center', color: '#64748b' }}>
            Acesso do administrador
          </p>
          <label>E-mail
            <input
              type="email"
              required
              style={estiloInput}
              value={login.email}
              onChange={e => setLogin(atual => ({ ...atual, email: e.target.value }))}
            />
          </label>
          <p />
          <label>Senha
            <input
              type="password"
              required
              style={estiloInput}
              value={login.senha}
              onChange={e => setLogin(atual => ({ ...atual, senha: e.target.value }))}
            />
          </label>
          {erro && <p role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
          <button disabled={carregando} style={{
            ...estiloInput,
            background: '#15803d',
            color: 'white',
            border: 0,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Entrar
          </button>
        </form>
      </main>
    );
  }

  const categoriasDoTurno = form.turno === 'Manhã'
    ? ['Pré-juvenil', 'Juvenil']
    : categorias;

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: 20,
      fontFamily: 'Arial, sans-serif',
      color: '#0f172a'
    }}>
      <header style={{
        background: '#0f172a',
        color: 'white',
        padding: 22,
        borderRadius: 14,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h1 style={{ margin: 0 }}>⚽ Pereira's Gestão</h1>
          <p style={{ marginBottom: 0 }}>Gestão da escolinha de futebol</p>
        </div>
        <button onClick={sair} style={estiloBotao}>Sair do sistema</button>
      </header>

      <section style={{
        background: 'white',
        padding: 20,
        marginTop: 20,
        borderRadius: 14
      }}>
        <h2>{editandoId ? 'Editar aluno' : 'Cadastrar aluno'}</h2>
        <form onSubmit={salvarAluno}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}>
            <label>Nome do aluno *
              <input required style={estiloInput} value={form.nome}
                onChange={e => atualizar('nome', e.target.value)} />
            </label>

            <label>Nome do responsável
              <input style={estiloInput} value={form.responsavel}
                onChange={e => atualizar('responsavel', e.target.value)} />
            </label>

            <label>Telefone / WhatsApp
              <input type="tel" style={estiloInput} value={form.telefone}
                onChange={e => atualizar('telefone', e.target.value)} />
            </label>

            <label>Turno principal *
              <select required style={estiloInput} value={form.turno}
                onChange={e => atualizar('turno', e.target.value)}>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
              </select>
            </label>

            <label>Categoria *
              <select required style={estiloInput} value={form.categoria}
                onChange={e => atualizar('categoria', e.target.value)}>
                {categoriasDoTurno.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label>Mensalidade individual (R$)
              <input type="number" min="0" step="0.01"
                disabled={form.isento}
                style={estiloInput}
                value={form.isento ? '0' : form.mensalidade}
                onChange={e => atualizar('mensalidade', e.target.value)}
                placeholder={form.turno === 'Manhã' ? 'Ex.: 60,00' : 'Ex.: 70,00'} />
              <small style={{ color: '#64748b' }}>
                Manhã: normalmente R$ 60,00. Tarde: normalmente R$ 70,00.
                Você pode informar outro valor.
              </small>
            </label>

            <label>Data da matrícula
              <input type="date" required style={estiloInput}
                value={form.data_matricula}
                onChange={e => atualizar('data_matricula', e.target.value)} />
            </label>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 22,
            marginTop: 18
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.ativo}
                onChange={e => atualizar('ativo', e.target.checked)} />
              Aluno ativo
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.bolsista}
                onChange={e => atualizar('bolsista', e.target.checked)} />
              Bolsista
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.isento}
                onChange={e => atualizar('isento', e.target.checked)} />
              Isento de mensalidade
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <button disabled={salvando} style={{
              ...estiloBotao,
              background: '#15803d',
              color: 'white'
            }}>
              {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Salvar aluno'}
            </button>

            {editandoId && (
              <button type="button" onClick={cancelarEdicao}
                style={{ ...estiloBotao, background: '#e2e8f0' }}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        {erro && <p role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
        {mensagem && <p style={{ color: '#15803d' }}>{mensagem}</p>}
      </section>

      <section style={{
        background: 'white',
        padding: 20,
        marginTop: 20,
        borderRadius: 14
      }}>
        <h2>Resumo dos alunos ativos</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12
        }}>
          {[
            ['Total de alunos', ativos.length],
            ['Manhã', ativos.filter(a => a.turno === 'Manhã').length],
            ['Tarde', ativos.filter(a => a.turno === 'Tarde').length],
            ['Bolsistas/isentos', bolsistasIsentos.length]
          ].map(([titulo, total]) => (
            <div key={titulo} style={{
              background: '#f1f5f9',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ color: '#475569' }}>{titulo}</div>
              <strong style={{ fontSize: 25 }}>{total}</strong>
            </div>
          ))}
        </div>
      </section>

      {bolsistasIsentos.length > 0 && (
        <section style={{
          background: 'white',
          padding: 20,
          marginTop: 20,
          borderRadius: 14
        }}>
          <h2>Bolsistas e isentos ({bolsistasIsentos.length})</h2>
          {renderTabela(bolsistasIsentos)}
        </section>
      )}

      <section style={{
        background: 'white',
        padding: 20,
        marginTop: 20,
        borderRadius: 14
      }}>
        <h2>Alunos pagantes por turno e turma</h2>

        {semTurno.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3>Turno ainda não definido ({semTurno.length})</h3>
            <p>Edite esses alunos para definir o turno principal.</p>
            {renderTabela(semTurno)}
          </div>
        )}

        {turnos.map(turno => {
          const alunosDoTurno = pagantes.filter(a => a.turno === turno);

          return (
            <div key={turno} style={{ marginTop: 24 }}>
              <h3>{turno} ({alunosDoTurno.length} alunos)</h3>

              {categorias
                .filter(c => turno === 'Tarde' || ['Pré-juvenil', 'Juvenil'].includes(c))
                .map(categoria => {
                  const grupo = alunosDoTurno.filter(a => a.categoria === categoria);

                  return (
                    <div key={categoria} style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: 14,
                      marginTop: 12
                    }}>
                      <h4 style={{ marginTop: 0 }}>
                        {categoria} — {grupo.length} aluno(s)
                      </h4>

                      {[...new Set(grupo.map(a => Number(a.mensalidade || 0)))]
                        .sort((a, b) => a - b)
                        .map(valor => {
                          const porValor = grupo.filter(
                            a => Number(a.mensalidade || 0) === valor
                          );

                          return (
                            <div key={valor} style={{ marginTop: 12 }}>
                              <h5>{dinheiro(valor)} — {porValor.length} aluno(s)</h5>
                              {renderTabela(porValor)}
                            </div>
                          );
                        })}

                      {grupo.length === 0 && (
                        <p style={{ color: '#64748b' }}>Nenhum aluno nesta turma.</p>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </section>

      <section style={{
        background: 'white',
        padding: 20,
        marginTop: 20,
        borderRadius: 14
      }}>
        <h2>Todos os alunos cadastrados ({alunos.length})</h2>
        <p>Inclui alunos ativos e inativos.</p>
        {renderTabela(alunos)}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
