> This is a Jupyter Notebook example using Kangas. You can open and run it in <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/examples/mnist-5-epochs.ipynb">Google's Colab</a>. If you appreciate this project, give us a star!

---

# MNIST, 5 Epochs

Create a Kangas DataGrid while training a tensorflow
model on the MNIST dataset.

To get started, we'll need to make sure we have at least these packages (in addition to tensorflow).


```python
%pip install kangas --upgrade --quiet
%pip install aitk --upgrade --quiet
```

## Overview

This notebook will train a simple neural network
for 5 epochs on the MNIST training data.

The neural network takes an MNIST digit representation
as input, and outputs 10 predictions (one for each
digit). The output node with the highest output activation
wins.

The Kangas DataGrid logs all of the outputs for each
input, including the input (logged as an image).


```python
from tensorflow.keras.datasets import mnist
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import RMSprop
from tensorflow.keras.utils import to_categorical

from kangas import DataGrid, Image
from aitk.networks import Network
```

    2023-04-12 09:49:47.679267: W tensorflow/stream_executor/platform/default/dso_loader.cc:64] Could not load dynamic library 'libcudart.so.11.0'; dlerror: libcudart.so.11.0: cannot open shared object file: No such file or directory
    2023-04-12 09:49:47.679304: I tensorflow/stream_executor/cuda/cudart_stub.cc:29] Ignore above cudart dlerror if you do not have a GPU set up on your machine.


For this simple model, we'll build a flat deep learning network. It won't use any convolution layers, but will treat the data as a simple 1D vector. This is not a good way to treat 2D data, but it makes for a simple start.

We define a function that creates the model, given a set of parameters.


```python
def build_model(parameters):
    model = Sequential()
    model.add(
        Dense(
            parameters["layer1_size"],
            activation="sigmoid",  # relu, sigmoid
            name="hidden1",
            input_shape=(784,),
        )
    )
    model.add(Dense(parameters["layer2_size"], name="hidden2", activation="sigmoid"))
    model.add(Dense(parameters["layer3_size"], name="hidden3", activation="sigmoid"))
    model.add(Dense(10, name="output", activation="softmax"))
    model.compile(
        loss="categorical_crossentropy",
        optimizer=RMSprop(),
        metrics=["accuracy"],
    )
    return model
```

We create a model, with:


```python
parameters = {
    "layer1_size": 50,
    "layer2_size": 25,
    "layer3_size": 25,
    "batch_size": 64,
    "epochs": 5,
}
model = build_model(parameters)
```

    2023-04-12 09:49:50.928383: W tensorflow/stream_executor/platform/default/dso_loader.cc:64] Could not load dynamic library 'libcuda.so.1'; dlerror: libcuda.so.1: cannot open shared object file: No such file or directory
    2023-04-12 09:49:50.928541: W tensorflow/stream_executor/cuda/cuda_driver.cc:269] failed call to cuInit: UNKNOWN ERROR (303)
    2023-04-12 09:49:50.928649: I tensorflow/stream_executor/cuda/cuda_diagnostics.cc:156] kernel driver does not appear to be running on this host (saliva3): /proc/driver/nvidia/version does not exist
    2023-04-12 09:49:50.929635: I tensorflow/core/platform/cpu_feature_guard.cc:151] This TensorFlow binary is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following CPU instructions in performance-critical operations:  AVX2 FMA
    To enable them in other operations, rebuild TensorFlow with the appropriate compiler flags.


We create a function to download and format the inputs and targets as we desire:


```python
def get_dataset():
    num_classes = 10
    # the data, shuffled and split between train and test sets
    (x_train, y_train), (x_test, y_test) = mnist.load_data()
    x_train = x_train.reshape(60000, 784)
    x_test = x_test.reshape(10000, 784)
    x_train = x_train.astype("float32")
    x_test = x_test.astype("float32")
    x_train /= 255
    x_test /= 255
    print(x_train.shape[0], "train samples")
    print(x_test.shape[0], "test samples")
    # convert class vectors to binary class matrices
    y_train = to_categorical(y_train, num_classes)
    y_test = to_categorical(y_test, num_classes)
    return x_train, y_train, x_test, y_test
```


```python
x_train, y_train, x_test, y_test = get_dataset()
```

    60000 train samples
    10000 test samples


For visualization purposes, we use `aitk.network.Network`:


```python
network = Network(model)
```

To see what the network structure, and input representations, look like, we give `network.display()` an input representation:


```python
network.display(x_train[0])
```


<svg id='keras-network' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' image-rendering="pixelated" width="380px" height="400px" style="background-color: #B0C4DE">
 <g >
  <svg viewBox="0 0 400 420" width="380px" height="400px">
    <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="black" />
        </marker>
    </defs><rect x="99.0" y="24" width="202" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_output" class="keras-network" x="100.0" y="25" height="50" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhCgABAIMAAAgICA0NDRERERUVFRYWFh4eHiAgICsrKy4uLgAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAACgABAAAIDgAPCBBQgICBAQEAIAgIADs="><title>Layer: output 'Dense'
Act function: softmax
Act output range: (0.0, 1.0)
Actual minmax: (0.0, 1.0)
Shape = (None, 10)</title></image><text x="305.0" y="52.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >output</text><path d="M 200.0 104 L 200.0 77 " stroke="black" stroke-width="2" marker-end="url(#arrow)" fill="none" /><rect x="99.0" y="104" width="202" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_hidden3" class="keras-network" x="100.0" y="105" height="50" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhGQABAIQAAENDQ1FRUVNTU1VVVWFhYWRkZGhoaGxsbG1tbXNzc3R0dHx8fH9/f4ODg4WFhYiIiIqKipSUlJWVlZaWlp2dnaCgoKGhoaioqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAGQABAAAIHwAdCEDgQMKDCQksUBgA4IIBAgwaRFhQQAGEAxUCBAQAOw=="><title>Layer: hidden3 'Dense'
Act function: sigmoid
Act output range: (0.0, 1.0)
Actual minmax: (0.0, 1.0)
Shape = (None, 25)</title></image><text x="305.0" y="132.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >hidden3</text><path d="M 200.0 184 L 200.0 157 " stroke="black" stroke-width="2" marker-end="url(#arrow)" fill="none" /><rect x="99.0" y="184" width="202" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_hidden2" class="keras-network" x="100.0" y="185" height="50" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhGQABAIQAACgoKDExMTQ0NExMTGRkZGVlZWZmZmlpaWtra2xsbHFxcXZ2dnh4eHp6eoCAgIyMjI6OjpOTk6Ojo6ioqKmpqbOzs7W1tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAGQABAAAIHwANPKigAIKAAwwcSGgwgIKFCQ4iJFgQgAAABAUOBAQAOw=="><title>Layer: hidden2 'Dense'
Act function: sigmoid
Act output range: (0.0, 1.0)
Actual minmax: (0.0, 1.0)
Shape = (None, 25)</title></image><text x="305.0" y="212.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >hidden2</text><path d="M 200.0 264 L 200.0 237 " stroke="black" stroke-width="2" marker-end="url(#arrow)" fill="none" /><rect x="99.0" y="264" width="202" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_hidden1" class="keras-network" x="100.0" y="265" height="50" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhMgABAIUAAD8/P0FBQVFRUVJSUlVVVVlZWVtbW15eXl9fX2VlZWZmZmdnZ25ubnBwcHFxcXZ2dnl5eXt7e319fYGBgYKCgoWFhYqKioyMjI+Pj5aWlpeXl5iYmJubm5+fn6Wlpaenp6mpqaysrMLCwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAMgABAAAIOgAHXMigAQIABx5AQJjQIEIIARsgWPiggUGHDRUUiHBQgIIBAhgyeAApIcACBxwIJDjAIcMDBRAQBAQAOw=="><title>Layer: hidden1 'Dense'
Act function: sigmoid
Act output range: (0.0, 1.0)
Actual minmax: (0.0, 1.0)
Shape = (None, 50)</title></image><text x="305.0" y="292.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >hidden1</text><path d="M 200.0 344 L 200.0 317 " stroke="black" stroke-width="2" marker-end="url(#arrow)" fill="none" /><rect x="99.00000000000001" y="344" width="201.99999999999997" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_hidden1_input" class="keras-network" x="100.00000000000001" y="345" height="50" width="199.99999999999997" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhEAMBAIYAAAAAAAEBAQICAgMDAwkJCQsLCw4ODhAQEBISEhcXFxgYGBkZGRoaGhsbGx4eHiMjIyQkJCcnJysrKy0tLS4uLjExMTc3Nzg4OEBAQEJCQkZGRk5OTlBQUFFRUVJSUlpaWl1dXV5eXmtra2xsbHJycnd3d35+fn9/f4KCgoSEhIWFhYeHh4iIiIuLi5SUlJaWlpqampycnKCgoKampqqqqqurq6ysrK+vr7a2tre3t7q6uru7u76+vsPDw8bGxsnJyc3Nzc/Pz9TU1NXV1dvb293d3eHh4eLi4uXl5e7u7vDw8PHx8fLy8vT09Pf39/n5+fr6+vv7+/z8/P39/f///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAEAMBAAAIzwABCBxIsKDBgwgTKlzIsKHDhxAhDkBA0QSLGwxmUHFygqEDCCFg0JhCkqQRG1OY9MCwsEKSkjCnRAHhwcOFCAwREInpA4eTJREBcIghgiSQAgAkwAgKwEAAGFM+MDXYYgoPAVMJFuAxRUNWgg+WGJExIsBXAB2UkCyx4OwEHSRfNDh7AISUKTvOCnwy5QnLqRRQ5CAZBGvQCC6QlISCI6gCEkVg/tgQMUGGITB9dDDsEEGNnSV7cCAA0YKNIzCbqEAakUVJIStSHNBLuzbtgAA7"><title>Layer: hidden1_input 'InputLayer'
Actual minmax: (0.0, 1.0)
Shape = [(None, 784)]</title></image><text x="305.0" y="372.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >hidden1_input</text><text x="200.0" y="12.5" font-family="monospace" font-size="15" text-anchor="middle" fill="black" alignment-baseline="central" >Activations for sequential</text></svg></g></svg>


This is an accurate representation of the network. However, it makes the input vector a bit hard for humans to understand.

What shape does an input representation have?


```python
x_train[0].shape
```




    (784,)



Ah, yes. I believe that 784 is the width times the height of the raw images:


```python
28 * 28
```




    784



Right. SO, let's set the visual representation for the humans among us:


```python
network.set_config_layer("hidden1_input", vshape=(28, 28))
```

And try displaying again:


```python
network.display(x_train[1])
```


<svg id='keras-network' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' image-rendering="pixelated" width="280px" height="400px" style="background-color: #B0C4DE">
 <g >
  <svg viewBox="0 0 400 570" width="280px" height="400px">
    <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="black" />
        </marker>
    </defs><rect x="99.0" y="24" width="202" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_output" class="keras-network" x="100.0" y="25" height="50" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhCgABAIIAAAgICA0NDRERERUVFRYWFh8fHywsLC4uLiwAAAAACgABAAAIDgANCBBQgECBAQEAHAgIADs="><title>Layer: output 'Dense'
Act function: softmax
Act output range: (0.0, 1.0)
Actual minmax: (0.0, 1.0)
Shape = (None, 10)</title></image><text x="305.0" y="52.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >output</text><path d="M 200.0 104 L 200.0 77 " stroke="black" stroke-width="2" marker-end="url(#arrow)" fill="none" /><rect x="99.0" y="104" width="202" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_hidden3" class="keras-network" x="100.0" y="105" height="50" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhGQABAIQAAEVFRVBQUFJSUlRUVGFhYWVlZWlpaW1tbXJycnR0dHp6en9/f4GBgYODg4eHh4iIiImJiZSUlJaWlp6enqGhoaqqqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAGQABAAAIHwAdCDjQQMIDCQgoTBgAoIIBAgsYRFBQIAGEAxQCBAQAOw=="><title>Layer: hidden3 'Dense'
Act function: sigmoid
Act output range: (0.0, 1.0)
Actual minmax: (0.0, 1.0)
Shape = (None, 25)</title></image><text x="305.0" y="132.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >hidden3</text><path d="M 200.0 184 L 200.0 157 " stroke="black" stroke-width="2" marker-end="url(#arrow)" fill="none" /><rect x="99.0" y="184" width="202" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_hidden2" class="keras-network" x="100.0" y="185" height="50" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhGQABAIQAAC8vLzQ0NDk5OUxMTFlZWV1dXWFhYWZmZmlpaW1tbXd3d3t7e319fYCAgIKCgoeHh5CQkJubm6ampqysrK2trbS0tLW1tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAGQABAAAIHwALPKiAAIKAAwoaUHAwYIIFCQsiIGAQgACABAYSBAQAOw=="><title>Layer: hidden2 'Dense'
Act function: sigmoid
Act output range: (0.0, 1.0)
Actual minmax: (0.0, 1.0)
Shape = (None, 25)</title></image><text x="305.0" y="212.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >hidden2</text><path d="M 200.0 264 L 200.0 237 " stroke="black" stroke-width="2" marker-end="url(#arrow)" fill="none" /><rect x="99.0" y="264" width="202" height="52" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_hidden1" class="keras-network" x="100.0" y="265" height="50" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhMgABAIUAAD8/P0RERE5OTk9PT1VVVVdXV1hYWF1dXWBgYGFhYWdnZ2hoaGxsbG5ubnFxcXV1dXl5eX9/f4KCgoWFhYaGhoiIiIqKiouLi4+Pj5OTk5WVlZaWlpeXl5iYmJmZmZqampubm56enqKioqOjo6SkpKWlpampqaurq7Ozs7S0tLa2tgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAMgABAAAIOwARnAChAUOCCAQ6PIAgYYEHASMyUDBBIkAJAxUiqPjgwIKDBgcyiCjQAcMABhRQGOCgIMSGFAAmXAgIADs="><title>Layer: hidden1 'Dense'
Act function: sigmoid
Act output range: (0.0, 1.0)
Actual minmax: (0.0, 1.0)
Shape = (None, 50)</title></image><text x="305.0" y="292.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >hidden1</text><path d="M 200.0 344 L 200.0 317 " stroke="black" stroke-width="2" marker-end="url(#arrow)" fill="none" /><rect x="99.0" y="344" width="202" height="202" style="fill:none;stroke:black;stroke-width:2"/><image id="keras-network_hidden1_input" class="keras-network" x="100.0" y="345" height="200" width="200" preserveAspectRatio="none" image-rendering="optimizeSpeed" xlink:href="data:image/gif;base64,R0lGODdhHAAcAIYAAAAAAAYGBgcHBwoKCgwMDBMTExUVFRkZGRwcHB0dHSUlJSYmJi8vLzAwMDIyMjMzMzY2Njg4ODk5OTw8PD8/P0dHR0tLS0xMTE9PT1RUVFVVVVZWVmBgYHBwcHJycnl5eXp6eoCAgIKCgoODg4eHh42NjZGRkZKSkpSUlJ+fn6KioqOjo6Wlpaenp6ioqK2trbKysrOzs7q6ur29vb6+vsPDw8TExMbGxsfHx8rKytDQ0NfX19/f3+Dg4OHh4ePj4+Tk5OXl5ebm5unp6e3t7e7u7u/v7/Dw8PPz8/b29vn5+fz8/P39/f///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAHAAcAEAI5gABCBxIsKDBgwgHrljCkAlDDjOYtEg4UMMSIQcQCiDBRAYBiiBDihT4IAWTFA5GAhAAY8mRCgUQGHRYA6RFJScaJNAAwwcTHi0iqBxKVCCEHw6NDFkiIYDKBkUYxiBg4YMBgUyQpAR5gwkNik2Y2LC5xMTBBiyWvBiJAEdDhkPMFp1Lt65dilAZLiEyd8CEHksc5sgQGMTQB0WYePXABAgDDE1cjFzAgskQHRlmLmERUgJDCglpgryQZEkHig5RkOWhccQSHxVCbmDiw6CHxCpUWmQYZIdeGyKKHggReEkJBXeT3w0IADs="><title>Layer: hidden1_input 'InputLayer'
Actual minmax: (0.0, 1.0)
Shape = [(None, 784)]</title></image><text x="305.0" y="447.0" font-family="monospace" font-size="12" text-anchor="start" fill="blue" alignment-baseline="central" >hidden1_input</text><text x="200.0" y="12.5" font-family="monospace" font-size="15" text-anchor="middle" fill="black" alignment-baseline="central" >Activations for sequential</text></svg></g></svg>


What do we see?

1. The input layer is the MNIST digit image data
2. The network's output layer has 10 units, one for each digit
3. The activations flow from from bottom to top
4. Before training, the output is basically random, because the weights are random

For this experiment, we'll make a Kangas DataGrid to keep track of each test input digit ("Image), what the proper category is, ("Truth"), what the network thinks it is ("Output", the max of the following), and the output of each unit on the ouptut layer ("score_0" through "score_9").


```python
dg = DataGrid(
    name="mnist-5-epochs",
    columns=[
        "Epoch",
        "Index",
        "Image",
        "Truth",
        "Output",
        "score_0",
        "score_1",
        "score_2",
        "score_3",
        "score_4",
        "score_5",
        "score_6",
        "score_7",
        "score_8",
        "score_9",
    ],
)
```

First, we make image of the test corpus, to reuse them:


```python
images = [Image(test, shape=(28, 28)) for test in x_test]
```

We run the test data through the model once before training as a baseline:


```python
outputs = model.predict(x_test)
epoch = 0
for index in range(len(x_test)):
    truth = int(y_test[index].argmax())
    guess = int(outputs[index].argmax())
    dg.append([epoch, index, images[index], truth, guess] + list(outputs[index]))
```

And define a function that will train the training data for one epoch:


```python
def train(parameters, model, x_train, y_train, x_test, y_test):
    model.fit(
        x_train,
        y_train,
        batch_size=parameters["batch_size"],
        epochs=1,
        validation_data=(x_test, y_test),
    )
```

And we are ready to train!


```python
for epoch in range(1, parameters["epochs"] + 1):
    train(parameters, model, x_train, y_train, x_test, y_test)
    outputs = model.predict(x_test)

    for index in range(len(x_test)):
        truth = int(y_test[index].argmax())
        guess = int(outputs[index].argmax())
        dg.append(
            [epoch, index, images[index], truth, guess] + list(outputs[index])
        )
```

    2023-04-12 09:49:58.777091: W tensorflow/core/framework/cpu_allocator_impl.cc:82] Allocation of 188160000 exceeds 10% of free system memory.


    938/938 [==============================] - 2s 2ms/step - loss: 1.2609 - accuracy: 0.6720 - val_loss: 0.6033 - val_accuracy: 0.8639
     96/938 [==>...........................] - ETA: 1s - loss: 0.5775 - accuracy: 0.8657

    2023-04-12 09:50:02.630636: W tensorflow/core/framework/cpu_allocator_impl.cc:82] Allocation of 188160000 exceeds 10% of free system memory.


    938/938 [==============================] - 2s 2ms/step - loss: 0.4262 - accuracy: 0.8947 - val_loss: 0.3236 - val_accuracy: 0.9181
     91/938 [=>............................] - ETA: 1s - loss: 0.3205 - accuracy: 0.9178

    2023-04-12 09:50:05.966214: W tensorflow/core/framework/cpu_allocator_impl.cc:82] Allocation of 188160000 exceeds 10% of free system memory.


    938/938 [==============================] - 2s 2ms/step - loss: 0.2770 - accuracy: 0.9271 - val_loss: 0.2422 - val_accuracy: 0.9364
     88/938 [=>............................] - ETA: 1s - loss: 0.2305 - accuracy: 0.9389

    2023-04-12 09:50:09.145775: W tensorflow/core/framework/cpu_allocator_impl.cc:82] Allocation of 188160000 exceeds 10% of free system memory.


    938/938 [==============================] - 2s 2ms/step - loss: 0.2176 - accuracy: 0.9413 - val_loss: 0.2029 - val_accuracy: 0.9450
     60/938 [>.............................] - ETA: 1s - loss: 0.1663 - accuracy: 0.9542

    2023-04-12 09:50:12.611366: W tensorflow/core/framework/cpu_allocator_impl.cc:82] Allocation of 188160000 exceeds 10% of free system memory.


    938/938 [==============================] - 2s 2ms/step - loss: 0.1818 - accuracy: 0.9510 - val_loss: 0.1824 - val_accuracy: 0.9494


We save the DataGrid:


```python
dg.save()
```

    Saving data...


    100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 60000/60000 [00:01<00:00, 33781.54it/s]


    Saving datagrid to 'mnist-5-epochs.datagrid'...
    Extending data...


    100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 60000/60000 [00:05<00:00, 10123.06it/s]


    Computing statistics...


    100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 17/17 [00:01<00:00, 11.20it/s]


And now we are ready to see the DataGrid:


```python
dg.show()
```


Some example filters to try in the UI:

1. Show rows before training: `{"epoch"} == 0`
2. Show rows after training: `{"epoch"} == 5`
3. Show rows after training, for correct outputs: `{"epoch"} == 5 and {"output"} == {"guess"}`
4. Show rows after training, for incorrect outputs: `{"epoch"} == 5 and {"output"} != {"guess"}`

---

> This is a Jupyter Notebook example using Kangas. You can open and run it in <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/examples/mnist-5-epochs.ipynb">Google's Colab</a>. If you appreciate this project, give us a star!

