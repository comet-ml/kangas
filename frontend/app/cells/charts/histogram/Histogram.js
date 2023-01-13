import fetchHistogram from "../../../../lib/fetchHistogram"
import HistogramClient from "./HistogramClient";

const Histogram = async ({ value, expanded }) => {
    const data = await fetchHistogram(value);
    if (data?.isVerbatim) {
        return (
            <div>{`${data?.value}`}</div>
        )
    }

    return <HistogramClient data={data} expanded={expanded} title={value?.columnName} />
}

export default Histogram;