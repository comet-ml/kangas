import axios from 'axios';

export default async function handler(req, res) {
    const body = JSON.parse(req.body);
    const { url, ...query } = body;
    const metadata = await axios.request({
        url,
        method: 'post',
        data: query,
    });
    if (metadata.status === 200) {
        return res.status(200).json(metadata.data);
    } else {
        return res.status(metadata.status);
    }
}
