'use client';
import { useState } from 'react';
import { Field, Pick, ErrorBox } from './ui';

type SetupPartner = { id: string; name: string };

export function AuthScreen({
  mode,
  partners,
  onSuccess,
}: {
  mode: 'setup' | 'login';
  partners: SetupPartner[];
  onSuccess: () => Promise<void>;
}) {
  const setup = mode === 'setup';
  const [partnerId, setPartnerId] = useState(partners[0]?.id || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-screen">
      <section className="onboarding auth-card">
        <div className="auth-logo">
          <img src="/logo-iconic.png" alt="Iconic" width={89} height={100} />
        </div>
        <h2>{setup ? 'Creá tu acceso' : 'Ingresá'}</h2>
        <p>
          {setup
            ? 'El primer socio define email y contraseña. Después, cada socio carga las suyas en Configuración.'
            : 'Entrá con el email y la contraseña de tu socio para usar el CRM.'}
        </p>
        <ErrorBox message={error} />
        {setup && !partners.length ? (
          <p className="hint">Todavía no hay socios para crear un acceso.</p>
        ) : (
          <form
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError('');
              try {
                const response = await fetch(
                  setup ? '/api/auth/setup' : '/api/auth/login',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(
                      setup
                        ? { partner_id: partnerId, email, password }
                        : { email, password },
                    ),
                  },
                );
                const result = (await response.json()) as { error?: string };
                if (!response.ok)
                  throw new Error(result.error || 'No se pudo ingresar.');
                await onSuccess();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {setup ? (
              <Field label="Socio *">
                <Pick
                  label="Socio"
                  value={partnerId}
                  onChange={setPartnerId}
                  options={partners.map((partner) => ({
                    value: partner.id,
                    label: partner.name,
                  }))}
                />
              </Field>
            ) : null}
            <Field label="Email *">
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Contraseña *">
              <input
                type="password"
                autoComplete={setup ? 'new-password' : 'current-password'}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <button
              className="primary"
              disabled={busy || (setup && !partnerId)}
            >
              {busy
                ? 'Ingresando…'
                : setup
                  ? 'Crear acceso'
                  : 'Ingresar'}
            </button>
          </form>
        )}
        {setup ? (
          <small>La contraseña tiene que tener al menos 8 caracteres.</small>
        ) : null}
      </section>
    </div>
  );
}
