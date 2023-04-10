import config from '../../config';

const handler = async (req, res) => {
    const query = new URLSearchParams(req.query);
    const result = await fetch(`${config.apiUrl}timestamp?dgid=${query?.get('dgid')}`);
    const json = await result.json();
    res.send(json);
}

export default handler;
