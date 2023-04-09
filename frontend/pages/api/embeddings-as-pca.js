import config from '../../config';

const handler = async (req, res) => {
    const query = new URLSearchParams(
        Object.fromEntries(
            Object.entries({
                ...req.query
            }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
        )
    );

    const result = await fetch(`${config.apiUrl}embeddings-as-pca?${query.toString()}`,
			       { next: { revalidate: 10000 } });
    const json = await result.json();
    res.send(json);
}

export default handler;
