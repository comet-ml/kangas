import stream, { Stream } from 'stream';
import config from '../../config';

const handler = async (req, res) => {
    const { endpoint, ...query } = req.query;
    const queryString = new URLSearchParams(query).toString();
    const result = await fetch(`${config.apiUrl}${endpoint}?${queryString}`, { next: { revalidate: 100000 } });
    const image = await result.body;
    const passthrough = new Stream.PassThrough();
    stream.pipeline(image, passthrough, (err) => console.error(err));
    res.setHeader('Cache-Control', 'max-age=604800')
    passthrough.pipe(res);
}

export default handler;