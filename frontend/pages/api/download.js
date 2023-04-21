import stream, { Stream } from 'stream';
import config from '../../config';
import formatQueryArgs from '../../lib/formatQueryArgs';

const handler = async (req, res) => {
    const queryString = formatQueryArgs({dgid: req.query.dgid});
    const result = await fetch(`${config.apiUrl}download?${queryString}`, { next: { revalidate: 100000 } });
    const datagrid = await result.body;
    const passthrough = new Stream.PassThrough();
    stream.pipeline(datagrid, passthrough, (err) => err ? console.error(err) : null);
    res.setHeader('Cache-Control', 'max-age=604800')
    passthrough.pipe(res);
}

export default handler;
