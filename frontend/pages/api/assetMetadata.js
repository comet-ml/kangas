import config from '@kangas/config';
import formatQueryArgs from '@kangas/lib/formatQueryArgs';


const handler = async (req, res) => {
    const queryString = formatQueryArgs(req.query);

    const result = await fetch(`${config.apiUrl}asset-metadata?${queryString}`,
                               { next: { revalidate: 10000 } });
    const json = await result.json();
    res.send(json);
}

export default handler;
