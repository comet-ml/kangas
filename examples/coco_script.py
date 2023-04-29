# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2023 Kangas Development Team      #
#    All rights reserved                             #
######################################################
"""
Create a Kangas DataGrid from COCO dataset collection.

COCO is a large-scale object detection, segmentation,
and captioning dataset.

0. Install Kangas DatGrid: `pip install kangas`
1. Download Images and Annotations from: https://cocodataset.org/#download
2. Save annotations into a folder, say "annotations", and the
   images into another folder, say "val2014".
3. Change the filename below to the instance JSON, say "annotations/instances_val2014.json"
4. Run this file: `python coco_script.py`

This sample script creates a sample datagrid with 500 images
and randomly logs either bounding boxes, or regions, for each
annotation for an image.

In addition, it generates a random score, confidence, and two
category columns (for playing with the grouping function in
Kangas DataGrid).

The images' metadata contains the labels so that you can use
Kangas' filter functionality in the UI.

After running the script, run this command at the prompt:

```
kangas server coco-dataset.datagrid
```

Example filters to try in the UI:

1. Images containing cats and dogs: `{"image"}.labels.dog and {"image"}.labels.cat`
2. Images with the same number of cats and dogs:  `{"image"}.labels.dog == {"image"}.labels.cat`
3. Images with a lot of person segments: `{"image"}.labels.person > 16`
4. Images of a certain size:  `{"image"}.image.width > 600`
5. Images with exactly one segment in them: `{"image"}.count == 1`
6. Image with the most toilets: `{"image"}.labels.toilet > 9`
"""

import json
import random
from collections import defaultdict

from kangas import DataGrid, Image

filename = "annotations/instances_val2014.json"
MAX_IMAGES = 500

print("Loading...")
data = json.load(open(filename))

# data keys: ['info', 'images', 'licenses', 'annotations', 'categories']

# data["images"] - list of:
# {'license': 3,
# 'file_name': 'COCO_val2014_000000391895.jpg',
# 'coco_url': 'http://images.cocodataset.org/val2014/COCO_val2014_000000391895.jpg',
# 'height': 360,
# 'width': 640,
# 'date_captured': '2013-11-14 11:18:45',
# 'flickr_url': 'http://farm9.staticflickr.com/8186/8119368305_4e622c8349_z.jpg',
# 'id': 391895}

print("Loading image_map...")
image_map = {image["id"]: image for image in data["images"]}

print("Loading category_map...")
category_map = {category["id"]: category for category in data["categories"]}

# data["annotations"] - list of:
# {'segmentation': [[239.97,
#   242.54,
#   261.95,
#   228.87,
#   271.34]],
# 'area': 2765.1486500000005,
# 'iscrowd': 0,
# 'image_id': 558840,
# 'bbox': [199.84, 200.46, 77.71, 70.88],
# 'category_id': 58,
# 'id': 156}

print("Loading annotation_map...")
annotation_map = defaultdict(list)
for annotation in data["annotations"]:
    annotation_map[annotation["image_id"]].append(annotation)

# About 300 images that don't have annotations
# because there is nothing really in them

# images are in val2014/image_map[ID]["file_name"]

print("Logging...")

dg = DataGrid(
    name="coco-dataset",
    columns=[
        "ID",
        "Image",
        "Score",
        "Confidence",
        "Filename",
        "Category 5",
        "Category 10",
    ],
)

print("Logging images...")

done = False
count = 0
for id in image_map:
    if not done:
        if id in annotation_map:
            image = Image("val2014/%s" % image_map[id]["file_name"])
            for annotation in annotation_map[id]:
                category_id = annotation["category_id"]
                regions = annotation["segmentation"]
                bbox = annotation["bbox"]
                if random.random() < 0.5:
                    if isinstance(bbox, list):
                        label = category_map[category_id]["name"]
                        image.add_bounding_boxes(
                            label,
                            [
                                [bbox[0], bbox[1]],
                                [bbox[0] + bbox[2], bbox[1] + bbox[3]],
                            ],
                            score=random.random(),
                        )
                else:
                    if isinstance(regions, list):
                        label = category_map[category_id]["name"]
                        image.add_regions(label, *regions, score=random.random())

            dg.append(
                [
                    id,
                    image,
                    random.random(),
                    random.random(),
                    image_map[id]["file_name"],
                    random.choice(["one", "two", "three", "four", "five"]),
                    random.choice(
                        [
                            "one",
                            "two",
                            "three",
                            "four",
                            "five",
                            "six",
                            "seven",
                            "eight",
                            "nine",
                            "ten",
                        ]
                    ),
                ]
            )
            count += 1
            if count == MAX_IMAGES:
                done = True
                break
    else:
        break

dg.save()
