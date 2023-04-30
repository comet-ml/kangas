import stream, { Stream } from 'stream';
import config from '@kangas/config';
import formatQueryArgs from '@kangas/lib/formatQueryArgs';

const handler = async (req, res) => {
    const queryString = formatQueryArgs(req.query);
    const result = await fetch(
        `${config.apiUrl}embeddings-as-pca?${queryString}`,
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
