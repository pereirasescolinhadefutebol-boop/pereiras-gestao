
import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: 'Arial, sans-serif',
      color: '#0f172a',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <header style={{
        background: '#0f172a',
        color: '#ffffff',
        padding: '24px',
        borderRadius: '16px'
      }}>
        <h1 style={{ margin: 0 }}>Pereira's Gestão</h1>
        <p>Gestão de alunos e mensalidades</p>
      </header>

      <main style={{
        marginTop: '24px',
        background: '#ffffff',
        padding: '24px',
        borderRadius: '16px'
      }}>
        <h2>Bem-vindo!</h2>
        <p>Seu sistema de gestão está começando a ser construído.</p>
        <p>Em breve, você poderá cadastrar alunos, registrar mensalidades e acompanhar pagamentos.</p>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
