# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2022 Kangas Development Team      #
#    All rights reserved                             #
######################################################
"""
Creates 4 projection maps from sklearn's breast_cancer
dataset.

What is the effect of scaling on projections?
"""

from sklearn.datasets import load_breast_cancer

import kangas as kg

# Load the data:
ds = load_breast_cancer(as_frame=True)
df = ds.data
df["target"] = ds.target
cols = df.columns.tolist()
df = df[cols[-1:] + cols[:-1]]

# Create the datagrid:
pca = []
t_sne = []
scaled_pca = []
scaled_t_sne = []
labels = []

# Get scale min, max:
scales = {name: {"min": df[name].min(), "max": df[name].max()} for name in df}


def scale(value, name):
    return (value - scales[name]["min"]) / (scales[name]["max"] - scales[name]["min"])


names = list(df.columns)
for index, column in df.iterrows():
    # Everything, but target:
    # Scale the data
    scaled_data = [scale(row, names[i + 1]) for i, row in enumerate(column[1:])]
    data = [row for i, row in enumerate(column[1:])]
    # The target is the label:
    label = str(int(column[0]))
    labels.append(label)
    pca.append(kg.Embedding(data, label=label, projection="pca"))
    scaled_pca.append(kg.Embedding(scaled_data, label=label, projection="pca"))
    t_sne.append(kg.Embedding(data, label=label, projection="t-sne"))
    scaled_t_sne.append(kg.Embedding(scaled_data, label=label, projection="t-sne"))

dg = kg.read_dataframe(df, name="breast-cancer")
dg.append_columns(
    {
        "Label": labels,
        "PCA": pca,
        "Scaled PCA": scaled_pca,
        "t-SNE": t_sne,
        "Scaled t-SNE": scaled_t_sne,
        "All": [1] * len(pca),
    }
)
dg.save()
