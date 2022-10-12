// Client components
import CurveAssetCellClient from './CurveAssetCell.client';

// Util
import { useData } from '../../lib/useData';
import { getColor } from '../../lib/generateChartColor';
import fetchAsset from '../../lib/fetchAsset';

// TODO Create a helper called generateLayout that also generates data.
const CurveAssetCellServer = ({ value, dgid }) => {
    const { type, assetId, assetType } = value;
    const asset = useData(`${assetId}`, () =>
        fetchAsset({ assetId, dgid, returnType: 'json' })
    );
    const { data, error } = asset;
    const chartData = [
        {
            type: 'line',
            x: data.x,
            y: data.y,
            marker: {
                color: getColor(data.name),
            },
        },
    ];
    const layout = {
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        width: 120,
        height: 120,
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0,
            pad: 0,
        },
        showlegend: false,
        xaxis: {
            visible: false,
            showticklabels: false,
        },
        yaxis: {
            visible: false,
            showticklabels: false,
        },
    };
    return (
        <div className="cell-content curve-asset">
            <CurveAssetCellClient chartData={chartData} layout={layout} />
        </div>
    );
};

export default CurveAssetCellServer;
