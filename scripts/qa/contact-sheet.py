# Usage: python3 sheet.py out.png cols thumbW file1 file2 ...   -> contact sheet with labels
import sys
from PIL import Image, ImageDraw
out, cols, tw, *files = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), *sys.argv[4:]
ims = [Image.open(f).convert("RGB") for f in files]
th = int(ims[0].height * tw / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 16)), "white")
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * tw, (i // cols) * (th + 16)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 16))
    d.text((x + 4, y + 2), f.split("/")[-1], fill="black")
sheet.save(out)
print(out, sheet.size)
