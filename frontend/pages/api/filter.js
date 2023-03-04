import config from '../../config';

const handler = async (req, res) => {
    const query = new URLSearchParams(req.query);
    const result = await fetch(`${config.apiUrl}verify-where?dgid=${query?.get('dgid')}&timestamp=${query?.get('timestamp')}&whereExpr=${query?.get('where')}`, { next: { revalidate: 1440 } });
    const json = await result.json();
    res.send(json);
}

export default handler;
