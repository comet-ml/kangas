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

