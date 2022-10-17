import { Suspense } from 'react';
// Client components
import CategoryGroupClient from './CategoryGroupCell.client';
import DeferredCell from '../../DeferredCell.client';
// Util
import { useData } from '../../../lib/useData';
import { getColor } from '../../../lib/generateChartColor';
import hashQuery from '../../../lib/hashQuery';
import fetchCategory from '../../../lib/fetchCategory';
import formatChartText from '../../../lib/formatChartText';
// TODO Create a helper called generateLayout that also generates data.
const CategoryGroupCell = ({ value, dgid, defer }) => (
    <div className="cell-content category-chart">
        { !defer && <CategoryGroupClient value={value} /> }
        { defer && (
            <DeferredCell>
                <CategoryGroupClient value={value} />
            </DeferredCell>
        ) }
    </div>
);

export default CategoryGroupCell;
