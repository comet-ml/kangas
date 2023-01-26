import GoogleChartsNode from 'google-charts-node';
import stream, { Stream } from 'stream';
import config from '../../config';
const drawChart = () => {
    const data = google.visualization.arrayToDataTable([
        ['City', '2010 Population'],
        ['New York City, NY', 8175000],
        ['Los Angeles, CA', 3792000],
        ['Chicago, IL', 2695000],
        ['Houston, TX', 2099000],
        ['Philadelphia, PA', 1526000],
      ]);

      const options = {
        title: 'Population of Largest U.S. Cities',
        chartArea: { width: '50%' },
        hAxis: {
          title: 'Total Population',
          minValue: 0,
        },
        vAxis: {
          title: 'City',
        },
      };

      const chart = new google.visualization.BarChart(container);
      chart.draw(data, options);
}


const handler = async (req, res) => {
    const { query } = req;
    const queryString = new URLSearchParams(query).toString();
    const result = await fetch(`${config.apiUrl}chart-image?${queryString}`, { next: { revalidate: 100000 } });
    /*const image = await GoogleChartsNode.render(drawChart, {
        width: 400,
        height: 300,
    });*/
    const image = await result.body;
    const passthrough = new Stream.PassThrough();
    stream.pipeline(image, passthrough, (err) => console.error(err));
    res.setHeader('Cache-Control', 'max-age=604800')
    passthrough.pipe(res);
}

export default handler;