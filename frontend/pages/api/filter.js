import config from '../../config';

const handler = async (req, res) => {
    const query = new URLSearchParams(req.query);
    const result = await fetch(`${config.apiUrl}verify-where?dgid=${query?.get('dgid')}&whereExpr=${query?.get('where')}`, { next: { revalidate: 0 } });
    const json = await result.json();
    res.send(json);
}

export default handler;