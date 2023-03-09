<div align="center">
<img src="https://raw.githubusercontent.com/comet-ml/kangas/main/imgs/kangas-datagrid.png"><br>
</div>

-----------------

<p align="center">
    <a href="https://badge.fury.io/py/kangas">
        <img src="https://badge.fury.io/py/kangas.png" alt="PyPI version" height="18">
    </a>
    <a rel="nofollow" href="https://opensource.org/licenses/Apache-2.0">
        <img alt="GitHub" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg">
    </a>
    <a rel="nofollow" href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/DataGrid-Getting%20Started.ipynb">
        <img src="https://colab.research.google.com/assets/colab-badge.svg">
    </a>
    <a href="https://kangas.comet.com?datagrid=/data/coco-500.datagrid" rel="nofollow">
        <img src="https://img.shields.io/badge/Kangas-Live%20Demo-blue.svg" alt="Kangas Live Demo">
    </a>
    <a href="https://github.com/comet-ml/kangas/wiki" rel="nofollow">
        <img src="https://img.shields.io/badge/Kangas-Docs-blue.svg" alt="Kangas Documentation">
    </a>
    <a rel="nofollow" href="https://pepy.tech/project/kangas">
        <img style="max-width: 100%;" data-canonical-src="https://pepy.tech/badge/kangas" alt="Downloads" 
             src="https://camo.githubusercontent.com/708e470ec83922035f2189544eb968c8c5bba5c8623b0ebb9cb88c5c370766c4/68747470733a2f2f706570792e746563682f62616467652f6b616e676173">
    </a>
    <a rel="nofollow" href="https://doi.org/10.5281/zenodo.7410884">
        <img src="https://zenodo.org/badge/DOI/10.5281/zenodo.7410884.svg" alt="DOI">
    </a>
    <a href="https://trackgit.com">
        <img src="https://us-central1-trackgit-analytics.cloudfunctions.net/token/ping/ldn6h026vu25r9kus8ld" alt="trackgit-views" />
    </a>
</p>

# Kangas: Explore Multimedia Datasets at Scale :kangaroo:

Kangas is a tool for exploring, analyzing, and visualizing large-scale multimedia data. It provides a straightforward Python API
for logging large tables of data, along with an intuitive visual interface for performing complex queries against your dataset.

The key features of Kangas include:

- **Scalability**. Kangas DataGrid, the fundamental class for representing datasets, can easily store millions of rows of data.
- **Performance**. Group, sort, and filter across millions of data points in seconds with a simple, fast UI.
- **Interoperability**. Any data, any environment. Kangas can run in a notebook or as a standalone app, both locally and remotely.
- **Integrated computer vision support**. Visualize and filter bounding boxes, labels, and metadata without any extra setup.

You can access a live demo of Kangas at <a href="https://kangas.comet.com?datagrid=/data/coco-500.datagrid">kangas.comet.com</a>. 

## Getting Started

Kangas is accessible as a Python library via pip
```
pip install kangas
```

Once installed, there are many ways to load or create a DataGrid. Here, we load a publicly available DataGrid file, but the Kangas API also provides methods for ingesting CSVs, Pandas DataFrames, and for manually constructing a new DataGrid:

```python
import kangas as kg

# Load an existing DataGrid
dg = kg.read_datagrid("https://github.com/caleb-kaiser/kangas_examples/raw/master/coco-500.datagrid.zip")
```

After your DataGrid is initialized, you can render it within the Kangas Viewer directly from Python:

```python
dg.show()
```
<img width="1789" alt="image" src="https://user-images.githubusercontent.com/42076840/197875668-5519d504-2209-472f-952e-ed09554ecb7a.png">

From the Kangas Viewer, you can group, sort, and filter data. In addition, Kangas will do its best to parse any metadata attached to your assets. For example, if you're using the COCO-500 DataGrid from the quickstart above, Kangas will automatically parse labels and scores for each image:

<img src="https://github.com/caleb-kaiser/kangas_examples/blob/master/Oct-25-2022%2016-43-56.gif">

And voil&agrave;! Now you're started using Kangas. 

### Pandas DataFrames

Kangas can also read Pandas DataFrame objects directly:

```python
import kangas as kg
import pandas as pd

df = pd.DataFrame({"hidden_layer_size": [8, 16, 64], "loss": [0.97, 0.53, 0.12]})
dg = kg.read_dataframe(df)
```
### HuggingFace Datasets

HuggingFace's datasets can also be loaded into DataGrid directly because they use
rows of dictionaries, and images are represented by PIL images. DataGrid will
automatically convert PIL images into a [Kangas Image](https://github.com/comet-ml/kangas/wiki/Image#image):

```python
import kangas as kg
from datasets import load_dataset

dataset = load_dataset("beans", split="train")
dg = kg.DataGrid(dataset)
```

### Parquet files

> **Note**: You will need to have pyarrow installed to read parquet files.

```python
import kangas as kg

dg = kg.read_parquet("https://github.com/Teradata/kylo/raw/master/samples/sample-data/parquet/userdata5.parquet")
```

If you'd like to explore further, take a look at our example notebooks below:

## Documentation

1. <a href="https://github.com/comet-ml/kangas/wiki">Documentation Homepage</a>
2. <a href="https://github.com/comet-ml/kangas/blob/main/notebooks/DataGrid-Getting%20Started.ipynb">Quickstart Notebook</a> <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/DataGrid-Getting%20Started.ipynb"><img src="https://colab.research.google.com/assets/colab-badge.svg"></a>
3. <a href="https://github.com/comet-ml/kangas/blob/main/notebooks/Integrations.ipynb">Integrations Notebook</a> <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/Integrations.ipynb"><img src="https://colab.research.google.com/assets/colab-badge.svg"></a>
4. <a href="https://github.com/comet-ml/kangas/blob/main/examples/mnist_script.py"> MNIST Classification Example</a>

## FAQ

### Is Kangas ready for public use?
Kangas is currently in an open beta. We stress test Kangas heavily and often, and are confident in sharing with the public. That being said, it is a very young project, and there will be bugs and rough edges. Additionally, new features will be added at a fast pace, so if you find a bug or have a request, please do not hesitate to open a ticket or start a discussion.

### Does Kangas support _____ system?
Kangas can be run as a standalone application on newer versions of Windows, MacOS, and most popular Linux distributions. In addition, Kangas can run remotely via Google Colab, or within any Jupyter notebook environment.

### When should I use Kangas instead of _____?
#### Pandas
Kangas and Pandas are complimentary tools. When you've wrangled your data into a Pandas DataFrame, Kangas can ingest that DataFrame via the `DataGrid.read_dataframe()` method, making it easy to visualize and explore your tabular data. Additionally, if your data is too large to process in Pandas or involves multimedia assets, Kangas is a strong alternative.

#### Tensorboard
TensorBoard is one of several tools (including Kangas parent organization, [Comet](https://www.comet.com/site/?utm_source=kangas&utm_medium=referral&utm_campaign=kangas_datagrids_2022&utm_content=github) that specializes in experiment management and monitoring). Like Kangas, it provides charting and visualizations out of the box, but is specifically designed for analyzing training workflows. Kangas, in contrast, is designed to analyze any dataset. For example, even if you use a tool like TensorBoard for analyzing training runs, you may still use Kangas before training for exploratory data analysis, or for prediction analysis post-deployment.

### What is Kangas relationship with Comet?
Kangas is developed and maintained by the Research team at [Comet](https://www.comet.com/site/?utm_source=kangas&utm_medium=referral&utm_campaign=kangas_datagrids_2022&utm_content=github). It began life as a prototype for Comet users who needed to visualize large computer vision datasets, and was later spun out into a standalone open source project. Kangas is and always will be free and open source software, and we are more than happy to accept community contributions.

## Contributing
Kangas has only recently been released, and as such, we don't have much of a formal process for contributions. If you have an idea or would like to make a contribution, we recommend opening a ticket describing your proposed contribution so that we can collaborate directly. We love working with community contributors.
