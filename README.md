<div align="center">
<img src="https://user-images.githubusercontent.com/42076840/197875783-35aef4d3-9381-447f-b5a9-20296dfacd51.png"><br>
</div>

-----------------

# Kangas: Explore multimedia datasets at scale


Kangas is a tool for exploring, analyzing, and visualizing large-scale multimedia data. It provides a straightforward Python API
for logging large tables of data, along with an intuitive visual interface for performing complex queries against your dataset.

The key features of Kangas include:

- **Scalability**. Kangas DataGrid, the fundamental class for representing datasets, can easily store millions of rows of data.
- **Performance**. Group, sort, and filter across millions of data points in seconds with a simple, fast UI.
- **Interoperability**. Any data, any environment. Kangas can run in a notebook or as a standalone app, both locally and remotely.
- **Integrated computer vision support**. Visualize and filter bounding boxes, labels, and metadata without any extra setup.

You can access a live demo of Kangas at <a href="https://kangas.comet.com" target="_blank">kangas.comet.com</a>. 

## Getting started

Kangas is accessible as a Python library via pip
```
pip install kangas
```

Once installed, there are many ways to load or create a DataGrid:

```python
import kangas as kg

# Load an existing DataGrid
dg = kg.read_datagrid("https://github.com/caleb-kaiser/kangas_examples/raw/master/coco-500.datagrid")

# Build a DataGrid from a CSV
dg = kg.read_csv("/path/to/your.csv")

# Build a DataGrid from a Pandas DataFrame
dg = kg.read_dataframe(your_dataframe)

# Construct a DataGrid manually
dg = kg.DataGrid(name="Example 1", columns=["Category", "Loss", "Fitness", "Timestamp"])
```

After your DataGrid is initialized, you can render it within the Kangas Viewer directly from Python:

```python
dg.show()
```
<img width="1789" alt="image" src="https://user-images.githubusercontent.com/42076840/197875668-5519d504-2209-472f-952e-ed09554ecb7a.png">

From the Kangas Viewer, you can group, sort, and filter data. In addition, Kangas will do its best to parse any metadata attached to your assets. For example, if you're using the COCO-500 DataGrid from the quickstart above, Kangas will automatically parse labels and scores for each image:

<img src="https://github.com/caleb-kaiser/kangas_examples/blob/master/Oct-25-2022%2016-43-56.gif">

And viola! Now you're started using Kangas. If you'd like to explore further, take a look at our example notebooks below:

## Documentation

1. <a href="https://github.com/comet-ml/kangas/wiki">Documentation Homepage</a>
2. <a href="https://github.com/comet-ml/kangas/blob/main/notebooks/DataGrid-Getting%20Started.ipynb">Quickstart Notebook</a>
3. <a href="https://github.com/comet-ml/kangas/blob/main/notebooks/Integrations.ipynb">Integrations Notebook</a>

## FAQ

### Is Kangas ready for public use?
Kangas is currently in an open beta. We stress test Kangas heavily and often, and are confident in sharing with the public. That being said, it is a very young project, and there will be bugs and rough edges. Additionally, new features will be added at a fast pace, so if you find a bug or have a request, please do not hesitate to open a ticket or start a discussion.

### Does Kangas support _____ system?
Kangas can be run as a standalone application on newer versions of Windows, MacOS, and most popular Linux distributions. In addition, Kangas can run remotely via Google Colab, or within any Jupyter notebook environment.

### When should I use Kangas instead of _____?
#### Pandas
Kangas and Pandas are complimentary tools. When you've wrangled your data into a Pandas DataFrame, Kangas can ingest that DataFrame via the `DataGrid.read_dataframe()` method, making it easy to visualize and explore your tabular data. Additionally, if your data is too large to process in Pandas or involves multimedia assets, Kangas is a strong alternative.

#### Tensorboard
TensorBoard is one of several tools (including Kangas parent organization, [Comet](https://comet.com)) that specializes in experiment managment. Like Kangas, it provides charting and visualizations out of the box, but is specifically designed for analyzing training workflows. Kangas, in contrast, is designed to analyze any dataset. For example, even if you use a tool like TensorBoard for analyzing training runs, you may still use Kangas before training for exploratory data analysis, or for prediction analysis post-deployment.

### What is Kangas relationship with Comet?
Kangas is developed and maintained by the Research team at [Comet ML](https://comet.com). It began life as a prototype for Comet users who needed to visualize large computer vision datasets, and was later spun out into a standalone open source project. Kangas is and always will be free and open source software, and we are more than happy to accept community contributions.

## Contributing
Kangas has only recently been released, and as such, we don't have much of a formal process for contributions. If you have an idea or would like to make a contribution, we recommend opening a ticket describing your proposed contribution so that we can collaborate directly. We love working with community contributors.
