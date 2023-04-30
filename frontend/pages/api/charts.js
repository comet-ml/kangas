import stream, { Stream } from 'stream';
import config from '@kangas/config';
import formatQueryArgs from '@kangas/lib/formatQueryArgs';

const handler = async (req, res) => {
    const queryString = formatQueryArgs(req.query);
    const result = await fetch(`${config.apiUrl}chart-image?${queryString}`, { next: { revalidate: 100000 } });
    /*const image = await GoogleChartsNode.render(drawChart, {
        width: 400,
        height: 300,
    });*/
    const image = await result.body;
    const passthrough = new Stream.PassThrough();
    stream.pipeline(image, passthrough, (err) => err ? console.error(err) : null);
    res.setHeader('Cache-Control', 'max-age=604800')
    passthrough.pipe(res);
}

export default handler;
