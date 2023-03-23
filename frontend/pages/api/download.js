import stream, { Stream } from 'stream';
import config from '../../config';

const handler = async (req, res) => {
    const query = new URLSearchParams(req.query);
    const result = await fetch(`${config.apiUrl}download?dgid=${query?.get('dgid')}`, { next: { revalidate: 100000 } });
    const datagrid = await result.body;
    const passthrough = new Stream.PassThrough();
    stream.pipeline(datagrid, passthrough, (err) => err ? console.error(err) : null);
    res.setHeader('Cache-Control', 'max-age=604800')
    passthrough.pipe(res);
}

export default handler;
