import config from '../../config';

const handler = async (req, res) => {
    const result = await fetch(`${config.apiUrl}status`);
    const json = await result.json();
    res.send(json);
}

export default handler;
