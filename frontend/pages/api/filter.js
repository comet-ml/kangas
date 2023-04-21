import config from '../../config';
import formatQueryArgs from '../../lib/formatQueryArgs';

const handler = async (req, res) => {
    const queryString = formatQueryArgs({
        dgid: req.query.dgid,
        timestamp: req.query.timestamp,
        whereExpr: req.query.where,
        computedColumns: req.query.computedColumns,
    });
    const result = await fetch(`${config.apiUrl}verify-where?${queryString}`, { next: { revalidate: 1440 } });
    const json = await result.json();
    res.send(json);
}

export default handler;
