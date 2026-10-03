-- PROPUESTA — No aplicar directamente.
-- H-06: registra cambios operativos en la misma transacción que modifica
-- registrations. Si falla audit_log, la mutación completa hace rollback.
-- Instalar y probar en staging antes de publicar el código que elimina el
-- segundo insert desde Server Actions.

do $preflight$
begin
    if to_regclass('public.registrations') is null
       or to_regclass('public.audit_log') is null
       or to_regprocedure('public.current_player_id()') is null then
        raise exception 'Preflight H-06: faltan registrations, audit_log o current_player_id().';
    end if;

    if exists (
        select 1
        from (values
            ('registrations', 'id'), ('registrations', 'estado'),
            ('registrations', 'payment_status'), ('registrations', 'metodo_pago'),
            ('registrations', 'checked_in'), ('registrations', 'checked_in_at'),
            ('registrations', 'fecha_pago'), ('registrations', 'importe'),
            ('audit_log', 'entidad'), ('audit_log', 'entidad_id'),
            ('audit_log', 'accion'), ('audit_log', 'usuario_id'),
            ('audit_log', 'valores_anteriores_json'),
            ('audit_log', 'valores_nuevos_json'), ('audit_log', 'metadata')
        ) as required(table_name, column_name)
        where not exists (
            select 1 from information_schema.columns c
            where c.table_schema = 'public'
              and c.table_name = required.table_name
              and c.column_name = required.column_name
        )
    ) then
        raise exception 'Preflight H-06: faltan columnas esperadas en registrations/audit_log.';
    end if;
end;
$preflight$;

create or replace function public.audit_registration_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    v_previous jsonb;
    v_current jsonb;
    v_changed_fields text[];
    v_operation text;
    v_registration_id uuid;
begin
    if tg_op = 'INSERT' then
        v_previous := null;
        v_current := jsonb_build_object(
            'estado', new.estado,
            'payment_status', new.payment_status,
            'metodo_pago', new.metodo_pago,
            'checked_in', new.checked_in,
            'checked_in_at', new.checked_in_at,
            'fecha_pago', new.fecha_pago,
            'importe', new.importe
        );
        v_changed_fields := array[
            'estado', 'payment_status', 'metodo_pago', 'checked_in',
            'checked_in_at', 'fecha_pago', 'importe'
        ];
        v_operation := 'created';
        v_registration_id := new.id;
    elsif tg_op = 'DELETE' then
        v_previous := jsonb_build_object(
            'estado', old.estado,
            'payment_status', old.payment_status,
            'metodo_pago', old.metodo_pago,
            'checked_in', old.checked_in,
            'checked_in_at', old.checked_in_at,
            'fecha_pago', old.fecha_pago,
            'importe', old.importe
        );
        v_current := null;
        v_changed_fields := array[
            'estado', 'payment_status', 'metodo_pago', 'checked_in',
            'checked_in_at', 'fecha_pago', 'importe'
        ];
        v_operation := 'deleted';
        v_registration_id := old.id;
    else
        v_previous := jsonb_build_object(
            'estado', old.estado,
            'payment_status', old.payment_status,
            'metodo_pago', old.metodo_pago,
            'checked_in', old.checked_in,
            'checked_in_at', old.checked_in_at,
            'fecha_pago', old.fecha_pago,
            'importe', old.importe
        );
        v_current := jsonb_build_object(
            'estado', new.estado,
            'payment_status', new.payment_status,
            'metodo_pago', new.metodo_pago,
            'checked_in', new.checked_in,
            'checked_in_at', new.checked_in_at,
            'fecha_pago', new.fecha_pago,
            'importe', new.importe
        );

        if v_previous is not distinct from v_current then
            return new;
        end if;

        v_changed_fields := array_remove(array[
            case when old.estado is distinct from new.estado then 'estado' end,
            case when old.payment_status is distinct from new.payment_status then 'payment_status' end,
            case when old.metodo_pago is distinct from new.metodo_pago then 'metodo_pago' end,
            case when old.checked_in is distinct from new.checked_in then 'checked_in' end,
            case when old.checked_in_at is distinct from new.checked_in_at then 'checked_in_at' end,
            case when old.fecha_pago is distinct from new.fecha_pago then 'fecha_pago' end,
            case when old.importe is distinct from new.importe then 'importe' end
        ], null);

        v_operation := case
            when old.estado is distinct from new.estado and new.estado = 'cancelada' then 'cancel'
            when old.estado = 'lista_espera' and new.estado = 'pendiente_pago' then 'waiting_list_promotion'
            when old.estado is distinct from new.estado and new.estado = 'lista_espera' then 'moved_to_waiting_list'
            when old.estado is distinct from new.estado and new.estado = 'confirmada' then 'confirmed'
            when old.payment_status is distinct from new.payment_status and new.payment_status = 'verificado' then 'payment_verified'
            when old.checked_in is distinct from new.checked_in and new.checked_in then 'check_in'
            when old.checked_in is distinct from new.checked_in then 'check_out'
            else 'registration_updated'
        end;
        v_registration_id := new.id;
    end if;

    insert into public.audit_log (
        entidad,
        entidad_id,
        accion,
        usuario_id,
        valores_anteriores_json,
        valores_nuevos_json,
        metadata
    ) values (
        'registration',
        v_registration_id,
        'registration_update',
        public.current_player_id(),
        v_previous,
        v_current,
        jsonb_build_object(
            'source', 'registration_row_trigger',
            'operation', v_operation,
            'db_operation', tg_op,
            'changed_fields', to_jsonb(v_changed_fields)
        )
    );

    if tg_op = 'DELETE' then return old; end if;
    return new;
end;
$function$;

drop trigger if exists audit_registration_mutation on public.registrations;
create trigger audit_registration_mutation
    after insert or update or delete on public.registrations
    for each row execute function public.audit_registration_mutation();

-- La función de trigger no es un RPC de aplicación. El trigger la invoca
-- internamente; no conceder EXECUTE directo a clientes.
revoke all on function public.audit_registration_mutation() from public, anon, authenticated;
