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
Create a Kangas DataGrid while training a tensorflow
model on the MNIST dataset.

0. Install Kangas DatGrid: `pip install kangas`
1. Run this file: `python mnist_script.py`

This sample script will train a simple neural network
for 5 epochs on the MNIST training data.

The neural network takes an MNIST digit representation
as input, and outputs 10 predictions (one for each
digit). The output node with the highest output activation
wins.

The Kangas DataGrid logs all of the outputs for each
input, including the input (logged as an image).

After running the script, run this command at the prompt:

```
kangas server mnist-5-epochs.datagrid
```

Example filters to try in the UI:

1. Show rows before training: `{"epoch"} == 0`
2. Show rows after training: `{"epoch"} == 5`
3. Show rows after training, for correct outputs: `{"epoch"} == 5 and {"output"} == {"guess"}`
4. Show rows after training, for incorrect outputs: `{"epoch"} == 5 and {"output"} != {"guess"}`

"""


from tensorflow.keras.datasets import mnist
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import RMSprop
from tensorflow.keras.utils import to_categorical

from kangas import DataGrid, Image


def build_model_graph(parameters):
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


def train(parameters, model, x_train, y_train, x_test, y_test):
    model.fit(
        x_train,
        y_train,
        batch_size=parameters["batch_size"],
        epochs=1,
        validation_data=(x_test, y_test),
    )


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


def main():
    parameters = {
        "layer1_size": 50,
        "layer2_size": 25,
        "layer3_size": 25,
        "batch_size": 64,
        "epochs": 5,
    }
    x_train, y_train, x_test, y_test = get_dataset()

    model = build_model_graph(parameters)

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

    # First, we make image of the test corpus, to reuse them:
    images = [Image(test, shape=(28, 28)) for test in x_test]

    # Do it once before training:
    outputs = model.predict(x_test)
    epoch = 0
    for index in range(len(x_test)):
        truth = int(y_test[index].argmax())
        guess = int(outputs[index].argmax())
        dg.append([epoch, index, images[index], truth, guess] + list(outputs[index]))

    for epoch in range(1, parameters["epochs"] + 1):
        train(parameters, model, x_train, y_train, x_test, y_test)
        outputs = model.predict(x_test)

        for index in range(len(x_test)):
            truth = int(y_test[index].argmax())
            guess = int(outputs[index].argmax())
            dg.append(
                [epoch, index, images[index], truth, guess] + list(outputs[index])
            )

    dg.save()


if __name__ == "__main__":
    main()
