from datasets import load_dataset
from tqdm import tqdm
from transformers import CLIPModel, CLIPProcessor

from kangas import DataGrid, Image

SPLIT = "test"
dataset = load_dataset("cifar10", split=SPLIT, streaming=True)
dataset = dataset.shuffle(seed=42)
num_examples = dataset.info.splits[SPLIT].num_examples

label_names = dataset.features["label"].names

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

columns = ["id", "image", "label", "predicted_label"]
columns.extend([f"score_{label_name}" for label_name in label_names])

dg = DataGrid(
    name="cifar10-test",
    columns=columns,
)

for idx, example in enumerate(tqdm(dataset, total=num_examples)):
    image = example["img"]
    label = example["label"]

    inputs = processor(
        text=label_names,
        images=image,
        return_tensors="pt",
        padding=True,
    )
    outputs = model(**inputs)
    logits_per_image = (
        outputs.logits_per_image
    )  # this is the image-text similarity score
    probs = logits_per_image.softmax(
        dim=1
    )  # we can take the softmax to get the label probabilities

    label_name = label_names[label]
    predicted_label_name = label_names[probs.argmax()]

    row = [
        idx,
        Image(image),
        label_name,
        predicted_label_name,
    ]
    row.extend(probs.tolist()[0])
    dg.append(row)

dg.save()
