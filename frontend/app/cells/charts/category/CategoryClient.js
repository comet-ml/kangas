'use client';

import Plot from 'react-plotly.js'
import useQueryParams from '../../../../lib/hooks/useQueryParams';
import classNames from 'classnames/bind';
import { ModalContext } from '../../../modals/DialogueModal/DialogueModalClient';
import styles from '../Charts.module.scss'
import styles2 from '../../../Settings/Buttons/Buttons.module.scss';
import { useContext, useMemo, useCallback, useState } from 'react';

const cx = classNames.bind(styles);
const cx2 = classNames.bind(styles2);

const CategoryLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    autosize: true,
    bargap: 0.1,
    margin: {
        l: 0,
        r: 0,
        b: 0,
        t: 0,
        pad: 0,
    },
    showlegend: false,
    xaxis: {
        visible: true,
        showticklabels: true,
    },
    yaxis: {
        visible: true,
        showticklabels: true,
        type: 'category',
    },
};

const CategoryConfig = {
    displayModeBar: false,
};


const CategoryClient = ({ data, expanded, title, query, columnName }) => {
    const [checked, setChecked] = useState([]);
    const { params, updateParams } = useQueryParams();

    const ExpandedLayout = useMemo(() => {
        return {
            autosize: true,
            title,
            font: {
                family: 'Roboto',
                size: 22,
                color: '#191A1C',
            },
            xaxis: {
                font: {
                    size: 13,
                    color: '#3D4355',
                },
            },
            yaxis: {
                type: 'category'
	        },
        };
    }, [title]);

    const setFilter = useCallback((event) => {
        // FIXME:
        event.stopPropagation();
        event.preventDefault();

        let filter = `{"${query.groupBy}"} == "${query.columnValue}" and {"${columnName}"} in [${checked.map(item => `"${item}"`).toString()}]`;

        updateParams({
            group: undefined,
            sort: undefined,
            descending: undefined,
            filter
        });
    }, [checked, query]);

    const handleCheck = (event) => {
        var updatedList = [...checked];
        if (event.target.checked) {
            updatedList = [...checked, event.target.value];
        } else {
            updatedList.splice(checked.indexOf(event.target.value), 1);
        }
        setChecked(updatedList);
    };

    return (
        <div className={cx('plotly-container', { expanded })}>
          <div style={{display: 'flex'}}>
            <Plot
                className={cx('plotly-chart', { expanded })}
                data={data}
                layout={expanded ? ExpandedLayout : CategoryLayout}
                config={CategoryConfig}
            />
            {expanded ? (<div style={{'margin-top': '75px'}}>
                         <div className={cx2('button-outline')} disabled={checked.length === 0} onClick={setFilter}>
                            <img src="/filter_placeholder.png" />
                            <span>Filter</span>
                         </div>
                           <div><b>Categories</b></div>
                             {data[0].categories.map((item, idx) => (
                                 <div key={idx}>
                                 <input value={item} type="checkbox" onChange={handleCheck}/>
                                 <span>{item}</span>
                                 </div>
                             ))}
                         </div>) : null
            }
          </div>
        </div>
    );
}

export default CategoryClient;
