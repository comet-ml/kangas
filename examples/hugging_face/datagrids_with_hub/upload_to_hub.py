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
