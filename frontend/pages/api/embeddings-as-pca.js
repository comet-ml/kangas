import stream, { Stream } from 'stream';
import config from '../../config';

const handler = async (req, res) => {
    const query = new URLSearchParams(
        Object.fromEntries(
            Object.entries({
                ...req.query
            }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
        )
    );

    const result = await fetch(
        `${config.apiUrl}embeddings-as-pca?${query.toString()}`,
        { next: { revalidate: 10000 } }
    );

    if (!req.query.thumbnail) {
        const json = await result.json();
        res.send(json);
    } else {
        const image = await result.body;
        const passthrough = new Stream.PassThrough();
        stream.pipeline(image, passthrough, (err) => err ? console.error(err) : null);
        res.setHeader('Cache-Control', 'max-age=604800')
        passthrough.pipe(res);
    }
};

export default handler;
