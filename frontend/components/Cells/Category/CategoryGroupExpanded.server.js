import { Suspense } from 'react';
// Client components
import CategoryGroupClient from './CategoryGroupExpanded.client';

// Util
import { useData } from '../../../lib/useData';
import { getColor } from '../../../lib/generateChartColor';
import hashQuery from '../../../lib/hashQuery';
import fetchCategory from '../../../lib/fetchCategory';
import formatChartText from '../../../lib/formatChartText';
// TODO Create a helper called generateLayout that also generates data.
const CategoryGroupCell = ({ value, dgid }) => {
    return (
        <div className="cell-content curve-asset">
            <CategoryGroupClient value={value} />
        </div>
    );
};

export default CategoryGroupCell;
