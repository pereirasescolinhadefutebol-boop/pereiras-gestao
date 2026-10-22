
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function entrar(event) {
    event.preventDefault();
    alert('A tela está pronta. Na próxima etapa vamos conectar o login ao Supabase.');
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#0f172a',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box'
    }}>
      <section style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
        background: '#ffffff',
        borderRadius: '18px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '42px' }}>⚽</div>
          <h1 style={{ marginBottom: '8px', color: '#0f172a' }}>
            Pereira's Gestão
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Gestão de alunos e mensalidades
          </p>
        </div>

        <form onSubmit={entrar}>
          <label htmlFor="email">E-mail do administrador</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Seu e-mail"
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '8px',
              marginBottom: '18px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
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
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Sua senha"
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '8px',
              marginBottom: '22px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              border: 0,
              borderRadius: '8px',
              background: '#15803d',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Entrar no sistema
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '12px'
        }}>
          Acesso exclusivo do administrador
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
