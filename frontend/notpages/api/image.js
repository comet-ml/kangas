import axios from 'axios';

export default async function handler(req, res) {
    const url = req?.query?.url;

    if (!url) {
        return res
            .status(400)
            .json({ message: 'URL parameter not present in request body' });
    }

    const stream = await axios.request({
        url,
        responseType: 'stream',
    });

    if (stream.status === 200) {
        await stream.data.pipe(res);
    } else {
        return res.status(stream.status);
    }
}
