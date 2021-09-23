# JSEXP: Javascripts for web-based psycholinguistic experiments.

This repository provides a set of CSS, HTML, and Javascript files that are aimed to make it easier to design your own web-based experiments. 
It is based on original code by Dave Kleinschmidt, modified by various other members of the Human Language Processing lab at the 
University of Rochester (including Zach Burchill, Wednesday Bushong, Gevher Karboga, Florian Jaeger, Linda Liu, Anna Persson, Maryann Tan, and Xin Xie).

The purpose of this updated git rep is to consolidate the various different versions of these Javascripts into a working combined package.


# How to include this package into your projects

We recommend using [git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) to add JSEXP to your project repository. This will 
allow you to pull/push the most recent updates of this package while continuing to develop your experiment-specific code. When you clone a 
project that contains a submodule, remember that you need to also clone the submodule (by default the submodule folder will be cloned but 
not its content). Use ```git clone --recurse-submodules https://github.com/chaconinc/MainProject``` during the cloning to also automatically
clone all submodules contained in the project. Once cloned, you can update all submodules in your project by using ```git submodule update --remote```.
Once updates to a submodule are committed and pushed to your project, you and your collaborators can pull these updates. Make sure to use 
```git pull --recurse-submodules``` if you want changes to the submodules not only to be fetched but also to be pulled.
