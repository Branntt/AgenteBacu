-- Tabla de gastos personales
create table gastos_personales (
  id bigint primary key generated always as identity,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  categoria text not null,
  descripcion text,
  monto numeric(12, 2) not null,
  cuenta text not null default 'Bancolombia', -- Bancolombia, Nequi, etc.
  recibo_url text, -- URL a imagen del recibo (si se implementa)
  notas text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabla de saldos personales
create table saldos_personales (
  id bigint primary key generated always as identity,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nombre_cuenta text not null, -- Bancolombia, Nequi, etc.
  monto_actual numeric(12, 2) not null,
  monto_inicial numeric(12, 2) not null,
  fecha_actualizacion timestamp with time zone default now(),
  unique(usuario_id, nombre_cuenta)
);

-- Tabla de suscripciones mensuales
create table suscripciones_personales (
  id bigint primary key generated always as identity,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  monto numeric(12, 2) not null,
  dia_pago int not null default 1, -- día del mes
  activa boolean default true,
  categoria text, -- Servicios, Aplicaciones, Transporte, etc.
  created_at timestamp with time zone default now()
);

-- Índices para mejor rendimiento
create index idx_gastos_personales_usuario_fecha on gastos_personales(usuario_id, fecha desc);
create index idx_gastos_personales_usuario_categoria on gastos_personales(usuario_id, categoria);
create index idx_suscripciones_personales_usuario on suscripciones_personales(usuario_id);

-- RLS: Solo el usuario autenticado puede ver/editar sus propios datos
alter table gastos_personales enable row level security;
alter table saldos_personales enable row level security;
alter table suscripciones_personales enable row level security;

create policy "Usuarios solo ven sus gastos" on gastos_personales
  for all using (auth.uid() = usuario_id);

create policy "Usuarios solo ven sus saldos" on saldos_personales
  for all using (auth.uid() = usuario_id);

create policy "Usuarios solo ven sus suscripciones" on suscripciones_personales
  for all using (auth.uid() = usuario_id);
