# Kangas DataGrid

The high-performance, multimedia grid tool for data analysis and
exploration.

## What is Kangas DataGrid?

Kangas DataGrid is a Python library for creating a table of text, numbers,
and images, and then exploring them via a web browser-based UI.

### A short example

```python
from kangas import DataGrid, Image

dg = DataGrid(
    name="Short Example",
    columns=["Category", "Image", "Output"],
)


model = build_model()
model.fit(x_train, y_train)
outputs = model.predict(x_test)

for index in range(len(x_test)):
    dg.append([
        y_test[index],
        Image(x_test[index]),
        outputs[index].argmax(),
    ])

dg.show()
```

<img src="https://github.com/comet-ml/kangas/blob/main/imgs/short-example.png"></img>
<img src="https://github.com/comet-ml/kangas/blob/main/imgs/short-example-group-by-category.png"></img>

## Further Documentation

1. <a href="https://github.com/comet-ml/kangas/blob/main/README.md">General README</a>
2. <a href="https://github.com/comet-ml/kangas/blob/main/README-filters.md">DataGrid Filters</a>
3. <a href="https://github.com/comet-ml/kangas/blob/main/notebooks/DataGrid-Getting%20Started.ipynb">Getting Started</a> - Jupyter Notebook
