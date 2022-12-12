# Using DataGrids with the Hugging Face Hub

In this guide we will demonstrate how to use the Hugging Face Hub as a way to store your Kangas datagrids.

For this example, we will use the OpenAI's CLIP model on the CIFAR10 dataset. Once we run our evaluation, we will upload the resulting datagrid file to the Hub as a dataset. We will then demonstrate how you can load your datagrids directly from the Hub.

This workflow is a convenient way to save evaluations from your model across multiple datasets and have them accessible in a single location. Saving your datagrids to the Hub lets you share and access your model evaluations from any machine.

## Install Dependencies

```shell
pip install -r requirements.txt
```

## Login to the Hugging Face Hub

In order to run this example, you will need to log in to the Hub using your personal access token. [You can find that here](https://huggingface.co/settings/tokens)

```shell
huggingface-cli login
```

## Run the prediction script

Our prediction script will download the CIFAR10 test set, evaluate each sample in the dataset using the CLIP model and save the image, label, predicted label and model confidence scores to a datagrid file.

```shell
python predict.py
```

Running this script will produce a `cifar10-test.datagrid` file in the current working directory.

## Run the Upload Script

Next, we'll upload our datagrid to the Hugging Face Hub using this snippet in the `upload_to_hub.py` script.

```python
import argparse

from huggingface_hub import HfApi


def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo_id")
    parser.add_argument("--path")
    parser.add_argument("--path_in_repo")

    return parser.parse_args()


args = get_args()

api = HfApi()
api.upload_file(
    path_or_fileobj=args.path,
    path_in_repo=args.path_in_repo,
    repo_id=args.repo_id,
    repo_type="dataset",
)

```

The upload script assumes that you have already created a dataset repository on the Hub to store your model evaluations.

```shell
python upload_to_hub.py --repo_id <Your Repo ID> \
--path <Path to the datagrid file> \
--path_in_repo <The path for your datagrid in the dataset repo>
```
<img width="600" alt="datagrid-hf-hub-example" src="https://user-images.githubusercontent.com/7529846/206374126-82fb60ab-dd68-4739-8655-153ad02930b7.png">

## Load your DataGrids from the Hub

The following snippet will load in your datagrid directly from the Hub. Simply pass in `repo_id` and `filename` of the datagrid file you want to analyze.

```python
import argparse

from huggingface_hub import hf_hub_download

from kangas import DataGrid


def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo_id")
    parser.add_argument("--filename")
    parser.add_argument("--port", type=int, default=4000)

    return parser.parse_args()


args = get_args()

dg = DataGrid.read_datagrid(
    hf_hub_download(
        repo_id=args.repo_id,
        filename=args.filename,
        repo_type="dataset",
        use_auth_token=True,
    )
)
dg.show(port=args.port)
```

You can run this snippet using the `download_from_hub.py` script.

```shell
python download_from_hub.py --repo_id <Your Repo ID> \
--filename <Name of your datagrid file>
```

Or run the snippet from a Colab notebook in the following way

https://user-images.githubusercontent.com/7529846/206373126-829e56b7-a340-4300-ac23-1eca7f1768bc.mp4

## Using DataGrid with Existing Hugging Face Datasets

If you already have a dataset hosted on the Hub, Kangas also supports directly loading the dataset for analysis from the CLI.

```
kangas server <dataset name> --split "val"
```

For example to load the `test` set of the `imdb` dataset, you would run

```
kangas server imdb --split "test"
```

This command will automatically download the dataset from the hub and start the Kangas UI with the dataset loaded into it.

https://user-images.githubusercontent.com/7529846/207111507-0671cbb5-e3b7-4e79-905b-b3032f25b0f9.mp4
