import argparse

from huggingface_hub import hf_hub_download

from kangas import DataGrid


def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo_id")
    parser.add_argument("--filename")

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
dg.show(port=8892)
