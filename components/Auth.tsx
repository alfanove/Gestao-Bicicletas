import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const authMethod = isSignUp ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { error } = await authMethod({ email, password });

    if (error) {
      setError(error.message);
    } else if (isSignUp) {
        alert("Registo efetuado! Por favor, verifique o seu email para confirmar a sua conta.")
        setIsSignUp(false); // Switch to login view after successful sign up
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-light-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-center text-brand-text">
            {isSignUp ? 'Criar Nova Conta' : 'Bem-vindo de Volta!'}
          </h1>
          <p className="text-center text-gray-500 text-sm mt-2">
            {isSignUp ? 'Preencha os seus dados para começar.' : 'Faça login para continuar.'}
          </p>
        </div>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              type="email"
              placeholder="o.seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email Address"
            />
          </div>
          <div>
            <label htmlFor="password"className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-brand-primary/70 disabled:cursor-not-allowed"
            >
              {loading ? 'A processar...' : (isSignUp ? 'Criar Conta' : 'Login')}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
          <button
            onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null);
            }}
            className="font-medium text-brand-primary hover:text-brand-primary-dark ml-1"
          >
            {isSignUp ? 'Faça login' : 'Registe-se'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
