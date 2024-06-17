import postgres from 'postgres';

// TODO: don't hardcode, should be dynamic
const psql = postgres({
    host: 'ep-bitter-hat-50614265.us-east-2.aws.neon.tech',
    database: 'test',
    username: 'annirudh',
    password: 'lDBvyjLs7Zh1',
    ssl: 'require',
})

// TODO: these should use prisma or some other schema declaration
export async function GET() {
    await psql`CREATE TABLE IF NOT EXISTS matrix_rows (
        id SERIAL PRIMARY KEY,
        priority FLOAT
    )`

    await psql`CREATE OR REPLACE FUNCTION notify_trigger() RETURNS TRIGGER AS $trigger$
    DECLARE
        new_rec matrix_rows;
        old_rec matrix_rows;
        payload TEXT;
    BEGIN
        CASE TG_OP
        WHEN 'UPDATE' THEN
            new_rec := NEW;
            old_rec := OLD;
        WHEN 'INSERT' THEN
            new_rec := NEW;
        WHEN 'DELETE' THEN
            old_rec := OLD;
        ELSE
            RAISE EXCEPTION 'Unknown TG_OP: "%"', TG_OP;
        END CASE;
        
        payload := json_build_object(
            'timestamp', CURRENT_TIMESTAMP,
            'action', LOWER(TG_OP),
            'schema', TG_TABLE_SCHEMA,
            'table', TG_TABLE_NAME,
            'new', row_to_json(new_rec),
            'old', row_to_json(old_rec)
        );

        PERFORM pg_notify('events', payload);
        RETURN new_rec;

    END;
    $trigger$ LANGUAGE plpgsql;
    `

    await psql`DROP TRIGGER row_notify ON matrix_rows`
    await psql`
    CREATE TRIGGER row_notify AFTER INSERT OR UPDATE OR DELETE ON matrix_rows
    FOR EACH ROW EXECUTE PROCEDURE notify_trigger();
    `

    return new Response()
}