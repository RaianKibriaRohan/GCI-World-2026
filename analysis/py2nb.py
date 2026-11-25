"""Convert a '# %%' percent-format script into a Jupyter notebook."""
import sys, re, nbformat

src, dst = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()
parts = re.split(r"^# %%(.*)$", text, flags=re.M)
nb = nbformat.v4.new_notebook()
for i in range(1, len(parts), 2):
    tag, body = parts[i].strip(), parts[i + 1].strip("\n")
    if tag == "[markdown]":
        md = "\n".join(l[2:] if l.startswith("# ") else l.lstrip("#") for l in body.splitlines())
        nb.cells.append(nbformat.v4.new_markdown_cell(md.strip()))
    elif body.strip():
        nb.cells.append(nbformat.v4.new_code_cell(body.strip()))
nb.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
nbformat.write(nb, dst)
print("wrote", dst, len(nb.cells), "cells")
