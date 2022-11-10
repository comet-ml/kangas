# Using Hugging Face Object Detection Models with Kangas

In this guide we will demonstrate how you can use Kangas to evaluate models from the Hugging Face hub.

We'll to use the [OWL-ViT object detection model](https://huggingface.co/docs/transformers/model_doc/owlvit) to make predictions on the on 500 examples from the validation split of the [fashionpedia 4 categories dataset](https://huggingface.co/datasets/detection-datasets/fashionpedia_4_categories).

The dataset has 4 classes. `['accessories', 'clothing', 'bags', 'shoes']`.

For each image, we'll log bounding boxes and scores for the individual classes in the dataset. Learn more about annotating images with Kangas [here](https://github.com/comet-ml/kangas/wiki/Image)

## Install Dependencies

```shell
pip install -r requirements.txt
```

## Run the detection script

```shell
python detect.py
```

## Start the Kangas Server

```shell
kangas server
```

## Exploring Model Predictions

Let's take a look at some of the things we can do with Kangas.

### Find examples where the model fails to predict the presence of an object

Here we're going to filter for example images that contain accessories that were not detected by the model.

https://user-images.githubusercontent.com/7529846/201136371-0321ba11-1be5-484b-800e-014733013d60.mov

### Sort by highest and lowest mAP score to find our best and worst predictions

Next, let's sort the images based on their mAP score. This lets us find some examples images where our model is doing well and where it is having difficulty.

https://user-images.githubusercontent.com/7529846/201138422-3a7edbc3-1e21-4be1-8784-d0fc4865fda3.mov


### Group by an object class to see how it affects mAP

It is likley that our model is detecting some objects well and missing others. We want to see if the mAP score per image is being affected by the presence of an object in that image.

https://user-images.githubusercontent.com/7529846/201143588-061f8a68-2233-407e-a0cc-72a52fe58c44.mov

### Filtering based on Image metadata

We have logged annotations and labels as metadata in our Images. Kangas lets you filter examples based on this metadata.

Let's take a look at images that contain bags and shoes. Simply add the following line to the filter input

```
{"Image"}.labels.contains("gt_bags") and {"Image"}.labels.contains("gt_shoes")
```

https://user-images.githubusercontent.com/7529846/201147784-009906ac-e4fc-4436-a398-ac51cb0677c2.mov

