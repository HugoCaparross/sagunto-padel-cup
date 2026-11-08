do $$
declare
    s uuid; e uuid; cat uuid; ec uuid; st uuid; m uuid;
    at timestamptz;
    rejected boolean := false;
begin
    insert into seasons (name, slug, start_date, end_date, status)
    values ('Test', 'test-pistas', '2026-09-01', '2027-07-31', 'draft') returning id into s;

    insert into events (season_id, event_number, event_type, name, slug, status)
    values (s, 1, 'regular', 'Test', 'test-pistas-p1', 'draft') returning id into e;

    insert into event_courts (event_id, name, position)
    values (e, 'Pista 1', 1), (e, 'Pista 2', 2);

    insert into categories (code, name, display_order) values ('test', 'Test', 99) returning id into cat;
    insert into event_categories (event_id, category_id) values (e, cat) returning id into ec;

    insert into competition_stages (event_category_id, name, stage_type, stage_order, status, rules_json)
    values (ec, 'Grupo', 'group', 1, 'draft', '{}') returning id into st;

    insert into matches (stage_id, match_number, status, match_stage)
    values (st, 'T1', 'scheduled', 'grupo') returning id into m;

    update matches set court_name = 'Pista 1' where id = m;
    select court_assigned_at into at from matches where id = m;
    if at is null then
        raise exception 'FALLO: no se registró la hora de asignación de pista';
    end if;
    raise notice 'Correcto: pista asignada y hora registrada';

    begin
        update matches set court_name = 'Pista 9' where id = m;
    exception when others then
        rejected := true;
        raise notice 'Correcto: pista inexistente rechazada -> %', sqlerrm;
    end;

    if not rejected then
        raise exception 'FALLO: Pista 9 debería rechazarse';
    end if;

    raise exception 'Fin de la prueba (todo revertido)';
end $$;
