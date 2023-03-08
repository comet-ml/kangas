import config from '../../config';

const handler = async (req, res) => {
    const query = new URLSearchParams(
        Object.fromEntries(
            Object.entries({
                ...req.query
            }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
        )
    );

    const result = await fetch(`${config.apiUrl}asset-metadata?${query.toString()}`, {
        headers: {
            'Cache-Control': 'max-age=604800',
        },
        next: {
            revalidate: 1440
        },
    });
    const json = await result.json();
    res.send(json);
}

export default handler;
