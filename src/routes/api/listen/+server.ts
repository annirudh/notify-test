import postgres from 'postgres';

const psql = postgres({
    host: 'ep-bitter-hat-50614265.us-east-2.aws.neon.tech',
    database: 'test',
    username: 'annirudh',
    password: 'lDBvyjLs7Zh1',
    ssl: 'require',
})

export async function GET() {
    await psql.listen('events', (value) => {
        console.log(value)
    })
    console.log('registered')

    const stream = new ReadableStream({
        start(controller) {
        },
    })

    return new Response(stream, {
        headers: {
            'content-type': 'text/event-stream',
        }
    });
}