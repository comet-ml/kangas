import { DataArraySharp } from "@mui/icons-material";
import fetchCategory from "../../../../lib/fetchCategory"
import fetchIt from "../../../../lib/fetchIt";
import CategoryClient from "./CategoryClient";
import classNames from 'classnames/bind';
import styles from '../Charts.module.scss'

const cx = classNames.bind(styles);

const layout =  {
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

const Category = async ({ value, expanded }) => {
    const data = await fetchCategory(value);

    if (data?.isVerbatim) {
        return <>Verbatim</>
    } else if (!expanded) {
        const queryString =new URLSearchParams(
            Object.fromEntries(
                Object.entries({
                    chartType: 'category', 
                    data: JSON.stringify(data)
                }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();

        return (
            <img src={`/api/charts?${queryString}`} loading="lazy" className={cx(['chart-thumbnail', 'category'])} />
          )        
    } else {
        return <CategoryClient expanded={expanded} title={value?.columnName} query={value} columnName={value?.columnName} data={data} />
    }    
}

export default Category;
