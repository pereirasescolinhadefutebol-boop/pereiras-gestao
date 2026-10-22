
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const categorias = ['Baby', 'Infantil', 'Pré-juvenil', 'Juvenil'];

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [form, setForm] = useState({
    nome: '',
    responsavel: '',
    telefone: '',
    categoria: 'Baby',
    mensalidade: '',
    data_matricula: new Date().toLocaleDateString('en-CA'),
    ativo: true
  });

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (ativo) {
          setCarregando(false);
        }
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
      email: form.email,
      password: form.senha
    });

    if (error) {
      setErro(error.message);
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
    setCarregando(false);
  }

  async function sair() {
    await supabase.auth.signOut();
    setUsuario(null);
    setAlunos([]);
  }

  function atualizar(campo, valor) {
    setForm(atual => ({ ...atual, [campo]: valor }));
  }

  async function cadastrar(event) {
    event.preventDefault();
    setErro('');
    setMensagem('');

    if (!form.nome.trim()) {
      setErro('Informe o nome do aluno.');
      return;
    }

    setSalvando(true);

    const registro = {
      nome: form.nome.trim(),
      responsavel: form.responsavel.trim(),
      telefone: form.telefone.trim(),
      categoria: form.categoria,
      mensalidade: Number(form.mensalidade || 0),
      data_matricula: form.data_matricula,
      ativo: form.ativo
    };

    const { error } = await supabase.from('alunos').insert(registro);

    if (error) {
      setErro('Erro ao cadastrar: ' + error.message);
    } else {
      setMensagem('Aluno cadastrado com sucesso!');
      setForm({
        nome: '',
        responsavel: '',
        telefone: '',
        categoria: 'Baby',
        mensalidade: '',
        data_matricula: new Date().toLocaleDateString('en-CA'),
        ativo: true
      });
      await carregarAlunos();
    }

    setSalvando(false);
  }

  const estiloInput = {
    width: '100%',
    padding: 11,
    marginTop: 6,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    boxSizing: 'border-box',
    fontSize: 15
  };

  if (carregando) {
    return <main style={{ padding: 30, fontFamily: 'Arial' }}>
      Carregando Pereira's Gestão...
    </main>;
  }

  if (!usuario) {
    return <main style={{
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
        <label>E-mail</label>
        <input
          type="email"
          required
          style={estiloInput}
          value={form.email || ''}
          onChange={e => atualizar('email', e.target.value)}
        />
        <p />
        <label>Senha</label>
        <input
          type="password"
          required
          style={estiloInput}
          value={form.senha || ''}
          onChange={e => atualizar('senha', e.target.value)}
        />
        {erro && <p style={{ color: '#b91c1c' }}>{erro}</p>}
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
    </main>;
  }

  return <main style={{
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
      <button onClick={sair} style={{
        padding: '10px 16px',
        borderRadius: 8,
        cursor: 'pointer'
      }}>Sair do sistema</button>
    </header>

    <section style={{
      background: 'white',
      padding: 20,
      marginTop: 20,
      borderRadius: 14
    }}>
      <h2>Cadastrar aluno</h2>
      <form onSubmit={cadastrar}>
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
          <label>Categoria
            <select style={estiloInput} value={form.categoria}
              onChange={e => atualizar('categoria', e.target.value)}>
              {categorias.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Mensalidade (R$)
            <input type="number" min="0" step="0.01" style={estiloInput}
              value={form.mensalidade}
              onChange={e => atualizar('mensalidade', e.target.value)} />
          </label>
          <label>Data da matrícula
            <input type="date" required style={estiloInput}
              value={form.data_matricula}
              onChange={e => atualizar('data_matricula', e.target.value)} />
          </label>
        </div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 18
        }}>
          <input type="checkbox" checked={form.ativo}
            onChange={e => atualizar('ativo', e.target.checked)} />
          Aluno ativo
        </label>
        <button disabled={salvando} style={{
          marginTop: 18,
          padding: '12px 20px',
          border: 0,
          borderRadius: 8,
          background: '#15803d',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          {salvando ? 'Salvando...' : 'Salvar aluno'}
        </button>
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
      <h2>Alunos cadastrados ({alunos.length})</h2>
      {alunos.length === 0 ? <p>Nenhum aluno cadastrado ainda.</p> :
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
          }}>
            <thead>
              <tr>
                {['Nome', 'Responsável', 'WhatsApp', 'Categoria', 'Mensalidade', 'Situação'].map(t =>
                  <th key={t} style={{ padding: 10, borderBottom: '2px solid #cbd5e1' }}>{t}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {alunos.map(a => <tr key={a.id}>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>{a.nome}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>{a.responsavel || '—'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>{a.telefone || '—'}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>{a.categoria}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                  {Number(a.mensalidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>
                  {a.ativo ? 'Ativo' : 'Inativo'}
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      }
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
