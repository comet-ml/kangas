import torch
from datasets import load_dataset
from kornia.metrics import mean_average_precision
from torchvision.ops import nms
from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor

from kangas import DataGrid, Image

PRETRAINED_MODEL_NAME = "google/owlvit-base-patch16"
DATASET_NAME = "detection-datasets/fashionpedia_4_categories"
DATASET_SPLIT = "val"
N_SAMPLES = 500

IOU_THRESHOLD = 0.5
SCORE_THRESHOLD = 0.2

if torch.cuda.is_available():
    device = torch.device("cuda")
else:
    device = torch.device("cpu")


processor = AutoProcessor.from_pretrained(PRETRAINED_MODEL_NAME)
model = AutoModelForZeroShotObjectDetection.from_pretrained(PRETRAINED_MODEL_NAME).to(
    device
)
model.eval()

dataset = load_dataset(f"{DATASET_NAME}", split=f"{DATASET_SPLIT}", streaming=True)
dataset = dataset.shuffle(seed=42)
dataset = dataset.take(N_SAMPLES)

class_names = dataset.features["objects"].feature["category"].names

columns = ["id", "image", "mAP"]
columns.extend([cn for cn in class_names])
columns.extend([f"score_{cn}" for cn in class_names])

dg = DataGrid(
    name="fashionpedia",
    columns=columns,
)


def get_class_pred_score(cn, labels, pred_scores):
    return pred_scores[labels.index(cn)].item()


def apply_nms(pred_bboxes, pred_scores, pred_labels, threshold):
    indices = nms(pred_bboxes, pred_scores, threshold)
    return pred_bboxes[indices], pred_scores[indices], pred_labels[indices]


def apply_score_threshold(pred_bboxes, pred_scores, pred_labels, threshold):
    indices = torch.where(pred_scores >= threshold)
    if len(indices) != 0:
        return pred_bboxes[indices], pred_scores[indices], pred_labels[indices]

    else:
        return None


def annotate_datagrid_image(dg_image, bboxes, labels, scores=None):
    if scores is None:
        for category, bbox in zip(labels, bboxes):
            dg_image.add_bounding_boxes(
                f"gt_{class_names[category]}",
                [(bbox[0], bbox[1]), (bbox[2], bbox[3])],
                score=1.0,
            )

    else:
        for pred_bbox, pred_score, pred_label in zip(bboxes, scores, labels):
            pred_bbox, pred_score, pred_label = map(
                lambda x: x.tolist(), [pred_bbox, pred_score, pred_label]
            )
            dg_image.add_bounding_boxes(
                f"pred_{class_names[pred_label]}",
                [
                    (pred_bbox[0], pred_bbox[1]),
                    (pred_bbox[2], pred_bbox[3]),
                ],
                score=pred_score,
            )


for idx, example in enumerate(dataset):
    image_id = example["image_id"]
    image = example["image"]

    dg_image = Image(image)
    objects = example["objects"]

    labels = objects["category"]
    bboxes = objects["bbox"]

    annotate_datagrid_image(dg_image, bboxes, labels)

    inputs = processor(
        text=[f"a photograph of {cn}" for cn in class_names],
        images=image,
        return_tensors="pt",
    ).to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    outputs.logits = outputs.logits.cpu()
    outputs.pred_boxes = outputs.pred_boxes.cpu()

    target_sizes = torch.Tensor([image.size[::-1]])
    results = processor.post_process(outputs=outputs, target_sizes=target_sizes)
    result = results[0]

    pred_bboxes, pred_scores, pred_labels = (
        result["boxes"],
        result["scores"],
        result["labels"],
    )
    filtered_preds = apply_score_threshold(
        pred_bboxes, pred_scores, pred_labels, SCORE_THRESHOLD
    )

    # Skip if predictions scores are too low
    if filtered_preds is None:
        continue
    else:
        pred_bboxes, pred_scores, pred_labels = filtered_preds
        pred_bboxes, pred_scores, pred_labels = apply_nms(
            pred_bboxes, pred_scores, pred_labels, IOU_THRESHOLD
        )

    map_score, _ = mean_average_precision(
        [pred_bboxes],
        [pred_labels],
        [pred_scores],
        [torch.tensor(bboxes)],
        [torch.tensor(labels)],
        len(class_names),
        threshold=IOU_THRESHOLD,
    )
    annotate_datagrid_image(dg_image, pred_bboxes.long(), pred_labels, pred_scores)

    row = {
        "id": image_id,
        "image": dg_image,
        "mAP": map_score.item(),
    }

    # update columns based on whether a class is present in an image
    label_names = list(map(lambda x: class_names[x], labels))
    row.update({cn: 1 if cn in label_names else 0 for cn in class_names})

    pred_label_names = list(map(lambda x: class_names[x], pred_labels))
    row.update(
        {
            f"score_{cn}": get_class_pred_score(cn, pred_label_names, pred_scores)
            if cn in pred_label_names
            else 0.0
            for cn in class_names
        }
    )
    dg.append(row)

dg.save()
