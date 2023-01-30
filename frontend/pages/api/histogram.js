import config from '../../config';

const handler = async (req, res) => {
    const { endpoint, ...query } = req.query;
    const queryString = new URLSearchParams(query).toString();
    const result = await fetch(`${config.apiUrl}histogram?${queryString}`, { next: { revalidate: 100000 } });
    const json = await result.json();
    res.setHeader('Cache-Control', 'max-age=604800')
    res.send(json);
}

export default handler;