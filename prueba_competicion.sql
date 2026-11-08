do $$
declare
    s uuid; e uuid; cat uuid; ec uuid; st uuid; m uuid;
    rejected boolean := false;
begin
    insert into seasons (name, slug, start_date, end_date, status)
    values ('Test', 'test-modelo', '2026-09-01', '2027-07-31', 'draft') returning id into s;

    insert into events (season_id, event_number, event_type, name, slug, status)
    values (s, 1, 'regular', 'Test', 'test-modelo-p1', 'draft') returning id into e;

    insert into categories (code, name, display_order) values ('test', 'Test', 99) returning id into cat;
    insert into event_categories (event_id, category_id) values (e, cat) returning id into ec;

    insert into competition_stages (event_category_id, name, stage_type, stage_order, status, rules_json)
    values (ec, 'Grupo', 'group', 1, 'draft', '{}') returning id into st;

    insert into matches (stage_id, match_number, status, match_stage)
    values (st, 'T1', 'finished_pending_validation', 'grupo') returning id into m;

    begin
        insert into match_sets (match_id, set_number, score_a, score_b) values (m, 1, 5, 4);
    exception when others then
        rejected := true;
        raise notice 'Correcto: 5-4 rechazado -> %', sqlerrm;
    end;

    if not rejected then
        raise exception 'FALLO: 5-4 debería rechazarse';
    end if;

    insert into match_sets (match_id, set_number, score_a, score_b) values (m, 1, 6, 4);
    raise notice 'Correcto: 6-4 aceptado';

    raise exception 'Fin de la prueba (todo revertido)';
end $$;
