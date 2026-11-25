"""Remove folder entries from a .pptx zip (they break cloud co-editing)."""
import sys, zipfile, shutil, os
src = sys.argv[1]; tmp = src + ".tmp"
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
    for it in zin.infolist():
        if not it.filename.endswith("/"):
            zout.writestr(it, zin.read(it.filename))
shutil.move(tmp, src)
