> This is a Jupyter Notebook example using Kangas. You can open and run it in <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/Using_Kangas_Datagrids_with_the_Hugging_Face_Hub.ipynb">Google's Colab</a>. If you appreciate this project, give us a star!

---

In this guide we will demonstrate how to download Kangas DataGrids directly from a Hugging Face Hub dataset repository.


# Install Dependencies


```python
!pip install huggingface_hub kangas --quiet
```

# Login to the Hugging Face Hub


```python
from huggingface_hub import login
login()
```

# Download Datagrid from Hub

We will use `hf_hub_download` to fetch a saved datagrid file [that's been saved on the hub](https://huggingface.co/datasets/Comet/CLIP-eval/tree/main).


```python
from huggingface_hub import hf_hub_download

from kangas import DataGrid


dg = DataGrid.read_datagrid(
    hf_hub_download(
        repo_id="Comet/CLIP-eval",
        filename="cifar10-test.datagrid",
        repo_type="dataset",
        use_auth_token=True
    )
)
dg.show()
```

---

> This is a Jupyter Notebook example using Kangas. You can open and run it in <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/Using_Kangas_Datagrids_with_the_Hugging_Face_Hub.ipynb">Google's Colab</a>. If you appreciate this project, give us a star!

