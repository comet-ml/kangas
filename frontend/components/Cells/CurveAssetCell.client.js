import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false,
});

// It spiritually hurts me that this cannot be a server component - Caleb
const CurveAssetCellClient = ({ chartData, layout }) => {
    return (
        <Plot
            data={chartData}
            layout={layout}
            config={{ displayModeBar: false }}
        />
    );
};

export default CurveAssetCellClient;
