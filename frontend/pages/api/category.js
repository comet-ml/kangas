import config from '../../config';
import formatQueryArgs from '../../lib/formatQueryArgs';

const handler = async (req, res) => {
    const { endpoint, ...query } = req.query;

    const queryString = formatQueryArgs(query);
    const result = await fetch(`${config.apiUrl}category?${queryString}`, { next: { revalidate: 100000 } });
    const json = await result.json();
    res.setHeader('Cache-Control', 'max-age=604800')
    res.send(json);
}

export default handler;
