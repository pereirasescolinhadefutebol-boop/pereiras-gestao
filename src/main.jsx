
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function App() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [usuario, setUsuario] = useState(null);

  async function entrar(event) {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error) throw error;

      const { data: admin, error: adminError } =
        await supabase.rpc('is_admin');

      if (adminError || admin !== true) {
        await supabase.auth.signOut();
        throw new Error('Este usuário não tem autorização de administrador.');
      }

      setUsuario(data.user);
      setSenha('');
    } catch (error) {
      setErro(error.message || 'Não foi possível entrar no sistema.');
    } finally {
      setCarregando(false);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    setUsuario(null);
    setEmail('');
    setSenha('');
    setErro('');
  }

  if (usuario) {
    return (
      <main style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        fontFamily: 'Arial, sans-serif',
        padding: 24,
        boxSizing: 'border-box'
      }}>
        <header style={{
          background: '#0f172a',
          color: 'white',
          padding: 24,
          borderRadius: 16
        }}>
          <h1>Pereira's Gestão</h1>
          <p>Gestão de alunos e mensalidades</p>
          <p>Administrador: {usuario.email}</p>
          <button onClick={sair}>Sair do sistema</button>
        </header>

        <section style={{
          background: 'white',
          padding: 24,
          marginTop: 24,
          borderRadius: 16
        }}>
          <h2>Painel administrativo</h2>
          <p>Login realizado com sucesso!</p>
          <p>
            Na próxima etapa, vamos criar o cadastro de alunos
            e o controle das mensalidades.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: '#0f172a',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box'
    }}>
      <section style={{
        width: '100%',
        maxWidth: 400,
        padding: 32,
        background: 'white',
        borderRadius: 18,
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 42 }}>⚽</div>
          <h1>Pereira's Gestão</h1>
          <p>Gestão de alunos e mensalidades</p>
        </div>

        <form onSubmit={entrar}>
          <label htmlFor="email">E-mail do administrador</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="Seu e-mail"
            style={{
              width: '100%',
              padding: 13,
              marginTop: 8,
              marginBottom: 18,
              boxSizing: 'border-box'
            }}
          />

          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={event => setSenha(event.target.value)}
            placeholder="Sua senha"
            style={{
              width: '100%',
              padding: 13,
              marginTop: 8,
              marginBottom: 18,
              boxSizing: 'border-box'
            }}
          />

          {erro && (
            <p role="alert" style={{ color: '#b91c1c' }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              padding: 14,
              border: 0,
              borderRadius: 8,
              background: '#15803d',
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: carregando ? 'wait' : 'pointer'
            }}
          >
            {carregando ? 'Verificando...' : 'Entrar no sistema'}
          </button>
        </form>

        <p style={{
          marginTop: 24,
          textAlign: 'center',
          color: '#64748b',
          fontSize: 12
        }}>
          Acesso exclusivo do administrador
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
