const SOI = 0xFFD8;
const EOI = 0xFFD9;
const SOS = 0xFFDA;
// const APP0 = 0xFFE0;
// const APP15 = 0xFFEF;

class JpegSegment {
  #view: DataView;

  constructor(
    public readonly data: Uint8Array,
    public readonly isImageData = false,
  ) {
    this.#view = new DataView(
      this.data.buffer,
      this.data.byteOffset,
      this.data.byteLength,
    );
  }

  get marker() {
    return this.isImageData ? 0 : this.#view.getUint16(0);
  }

  get length() {
    return this.isImageData ? this.#view.byteLength : this.#view.byteLength - 2;
  }

  toString() {
    const markerHex = this.marker.toString(16).padStart(4, "0").toUpperCase();
    return `${markerHex}, ${this.length}`;
  }
}

function readJpegFileSync(path: string): JpegSegment[] {
  const data = Deno.readFileSync(path);
  const view = new DataView(data.buffer);
  let isImageData = false;
  let offset = 0;
  const segments: JpegSegment[] = [];
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset);
    let length = 2;
    if (isImageData) {
      length = (view.byteLength - 2) - offset;
    } else if (marker !== SOI && marker !== EOI) {
      length += view.getUint16(offset + 2);
    }
    const segment: JpegSegment = new JpegSegment(
      data.subarray(offset, offset + length),
      isImageData,
    );
    segments.push(segment);
    offset += length;
    isImageData = segment.marker === SOS;
    console.log("" + segment);
  }
  return segments;
}

if (import.meta.main) {
  if (Deno.args.length != 1) {
    console.log("Example: Deno run -A main.ts your_image.jpg");
  } else {
    try {
      readJpegFileSync(Deno.args[0]);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      }
    }
  }
}
