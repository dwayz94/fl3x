/**
 * Just enough MP4 and WebM parsing to check an uploaded background video
 * without ffmpeg: container, video codec, size and duration. Files are
 * never decoded here; browsers play them as they are.
 */

export type VideoFormat = "mp4" | "webm";
export interface VideoInfo {
  format: VideoFormat;
  durationMs: number;
  width: number;
  height: number;
}

export class VideoError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

/** Sniffs the container from the first bytes (an ISO BMFF "ftyp" box, or the EBML magic of WebM / Matroska). */
export function sniffVideo(buf: Buffer): VideoFormat | null {
  if (buf.length < 12) return null;
  if (buf.toString("latin1", 4, 8) === "ftyp") return "mp4";
  if (buf.readUInt32BE(0) === 0x1a45dfa3) return "webm";
  return null;
}

export function readVideo(buf: Buffer, format: VideoFormat): VideoInfo {
  try {
    return format === "mp4" ? readMp4(buf) : readWebm(buf);
  } catch (err) {
    if (err instanceof VideoError) throw err;
    throw new VideoError("bad_video", "This video could not be read");
  }
}

// --- MP4 (ISO BMFF) -----------------------------------------------------

interface Box {
  type: string;
  start: number;
  /** First byte after the box header. */
  data: number;
  end: number;
}

function* boxes(buf: Buffer, start: number, end: number): Generator<Box> {
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    let header = 8;
    if (size === 1) {
      if (p + 16 > end) return;
      size = Number(buf.readBigUInt64BE(p + 8));
      header = 16;
    } else if (size === 0) {
      size = end - p; // runs to the end of the file
    }
    if (size < header || p + size > end) return;
    yield { type, start: p, data: p + header, end: p + size };
    p += size;
  }
}

const child = (buf: Buffer, box: Box, type: string) => {
  for (const b of boxes(buf, box.data, box.end)) if (b.type === type) return b;
  return null;
};

/** Containers that can carry who / where (iPhone videos keep GPS in moov/udta or moov/meta). */
const METADATA_BOXES = new Set(["udta", "meta", "uuid"]);

/**
 * Reads duration and size from moov, checks every video track is H.264
 * (the one codec every browser plays in MP4: iPhones record HEVC, which
 * Chrome on most PCs can't), and blanks metadata boxes in place.
 */
function readMp4(buf: Buffer): VideoInfo {
  let moov: Box | null = null;
  for (const b of boxes(buf, 0, buf.length)) {
    if (b.type === "moov") moov = b;
    // Renamed to "free" (skipped by every player): same length, so the sample offsets stay valid.
    else if (METADATA_BOXES.has(b.type)) buf.write("free", b.start + 4, "latin1");
  }
  if (!moov) throw new VideoError("bad_video", "This video could not be read");

  let durationMs = 0;
  let width = 0;
  let height = 0;
  let videoTracks = 0;
  for (const b of boxes(buf, moov.data, moov.end)) {
    if (METADATA_BOXES.has(b.type)) {
      buf.write("free", b.start + 4, "latin1");
    } else if (b.type === "mvhd") {
      const v = buf[b.data];
      const timescale = buf.readUInt32BE(b.data + (v === 1 ? 20 : 12));
      const duration = v === 1 ? Number(buf.readBigUInt64BE(b.data + 24)) : buf.readUInt32BE(b.data + 16);
      if (timescale > 0) durationMs = (duration / timescale) * 1000;
    } else if (b.type === "mvex" && !durationMs) {
      // Fragmented MP4: the total duration lives in mehd (in the movie timescale, read above).
      const mehd = child(buf, b, "mehd");
      const mvhd = child(buf, moov, "mvhd");
      if (mehd && mvhd) {
        const timescale = buf.readUInt32BE(mvhd.data + (buf[mvhd.data] === 1 ? 20 : 12));
        const d = buf[mehd.data] === 1 ? Number(buf.readBigUInt64BE(mehd.data + 4)) : buf.readUInt32BE(mehd.data + 4);
        if (timescale > 0) durationMs = (d / timescale) * 1000;
      }
    } else if (b.type === "trak") {
      for (const t of boxes(buf, b.data, b.end)) if (METADATA_BOXES.has(t.type)) buf.write("free", t.start + 4, "latin1");
      const mdia = child(buf, b, "mdia");
      const hdlr = mdia && child(buf, mdia, "hdlr");
      if (!mdia || !hdlr || buf.toString("latin1", hdlr.data + 8, hdlr.data + 12) !== "vide") continue;
      videoTracks++;
      const minf = child(buf, mdia, "minf");
      const stbl = minf && child(buf, minf, "stbl");
      const stsd = stbl && child(buf, stbl, "stsd");
      // stsd: version/flags, entry count, then one box per sample description, named after the codec.
      const entry = stsd ? boxes(buf, stsd.data + 8, stsd.end).next().value : undefined;
      if (!entry || (entry.type !== "avc1" && entry.type !== "avc3")) {
        throw new VideoError("bad_codec", "MP4 videos must be H.264 (export as H.264 or \"Most compatible\")");
      }
      const tkhd = child(buf, b, "tkhd");
      if (tkhd && !width) {
        // Display size, 16.16 fixed point, at the end of tkhd.
        const at = tkhd.data + (buf[tkhd.data] === 1 ? 88 : 76);
        width = Math.round(buf.readUInt32BE(at) / 65536);
        height = Math.round(buf.readUInt32BE(at + 4) / 65536);
      }
    }
  }
  if (!videoTracks) throw new VideoError("bad_video", "This file has no video");
  if (!durationMs) throw new VideoError("bad_video", "Couldn't read this video's length");
  return { format: "mp4", durationMs, width, height };
}

// --- WebM (Matroska / EBML) -----------------------------------------------

const EBML = 0x1a45dfa3;
const DOC_TYPE = 0x4282;
const SEGMENT = 0x18538067;
const INFO = 0x1549a966;
const TIMECODE_SCALE = 0x2ad7b1;
const DURATION = 0x4489;
const TRACKS = 0x1654ae6b;
const TRACK_ENTRY = 0xae;
const TRACK_TYPE = 0x83;
const CODEC_ID = 0x86;
const VIDEO = 0xe0;
const PIXEL_WIDTH = 0xb0;
const PIXEL_HEIGHT = 0xba;
const CLUSTER = 0x1f43b675;
const CLUSTER_TIMECODE = 0xe7;
const SIMPLE_BLOCK = 0xa3;
const BLOCK_GROUP = 0xa0;
const BLOCK = 0xa1;

/** Reads a variable-length integer. IDs keep their marker bit, sizes don't; an all-ones size means "unknown". */
function vint(buf: Buffer, p: number, isId: boolean): { value: number; len: number; unknown: boolean } {
  const first = buf[p];
  if (first === undefined || first === 0) throw new VideoError("bad_video", "This video could not be read");
  const len = Math.clz32(first) - 23; // leading zeros within the byte, + 1
  if (len > (isId ? 4 : 8) || p + len > buf.length) throw new VideoError("bad_video", "This video could not be read");
  let value = isId ? first : first & (0xff >> len);
  let allOnes = value === (0xff >> len);
  for (let i = 1; i < len; i++) {
    value = value * 256 + buf[p + i]!;
    if (buf[p + i] !== 0xff) allOnes = false;
  }
  return { value, len, unknown: !isId && allOnes };
}

interface Element {
  id: number;
  data: number;
  end: number;
  unknown: boolean;
}

function element(buf: Buffer, p: number, limit: number): Element {
  const id = vint(buf, p, true);
  const size = vint(buf, p + id.len, false);
  const data = p + id.len + size.len;
  return { id: id.value, data, end: size.unknown ? limit : Math.min(data + size.value, limit), unknown: size.unknown };
}

function* elements(buf: Buffer, start: number, end: number): Generator<Element> {
  let p = start;
  while (p < end) {
    const e = element(buf, p, end);
    yield e;
    if (e.unknown) return;
    p = e.end;
  }
}

const uint = (buf: Buffer, e: Element) => {
  let v = 0;
  for (let i = e.data; i < e.end; i++) v = v * 256 + buf[i]!;
  return v;
};
const float = (buf: Buffer, e: Element) => (e.end - e.data === 4 ? buf.readFloatBE(e.data) : e.end - e.data === 8 ? buf.readDoubleBE(e.data) : 0);
const str = (buf: Buffer, e: Element) => buf.toString("latin1", e.data, e.end).replace(/\0+$/, "");

/** WebM codecs every current browser plays (Safari since 2021 for VP8 / VP9). */
const WEBM_CODECS = new Set(["V_VP8", "V_VP9", "V_AV1"]);

/**
 * Duration from Segment > Info (Duration × TimecodeScale). Files recorded in
 * a browser (MediaRecorder) often have no Duration: then the last block's
 * timestamp is used, walking the clusters (often of unknown size too).
 */
function readWebm(buf: Buffer): VideoInfo {
  const header = element(buf, 0, buf.length);
  if (header.id !== EBML) throw new VideoError("bad_video", "This video could not be read");
  for (const e of elements(buf, header.data, header.end)) {
    if (e.id === DOC_TYPE && str(buf, e) !== "webm") throw new VideoError("bad_type", "Only MP4, WebM and GIF files");
  }
  const segment = element(buf, header.end, buf.length);
  if (segment.id !== SEGMENT) throw new VideoError("bad_video", "This video could not be read");

  let scale = 1_000_000; // ns per tick, the default
  let duration = 0;
  let width = 0;
  let height = 0;
  let videoTracks = 0;
  let clusterTime = 0;
  let lastBlock = -1;
  const blockTime = (data: number) => {
    const track = vint(buf, data, false);
    lastBlock = Math.max(lastBlock, clusterTime + buf.readInt16BE(data + track.len));
  };

  // Clusters are flattened into this loop (entered instead of skipped), so unknown sizes work.
  let p = segment.data;
  while (p < segment.end) {
    let e: Element;
    try {
      e = element(buf, p, segment.end);
    } catch {
      break; // a cut-off tail: keep what was read
    }
    if (e.id === CLUSTER) {
      p = e.data;
      continue;
    }
    if (e.unknown) break;
    if (e.id === INFO) {
      for (const i of elements(buf, e.data, e.end)) {
        if (i.id === TIMECODE_SCALE) scale = uint(buf, i) || scale;
        else if (i.id === DURATION) duration = float(buf, i);
      }
    } else if (e.id === TRACKS) {
      for (const t of elements(buf, e.data, e.end)) {
        if (t.id !== TRACK_ENTRY) continue;
        let type = 0;
        let codec = "";
        let video: Element | null = null;
        for (const f of elements(buf, t.data, t.end)) {
          if (f.id === TRACK_TYPE) type = uint(buf, f);
          else if (f.id === CODEC_ID) codec = str(buf, f);
          else if (f.id === VIDEO) video = f;
        }
        if (type !== 1) continue;
        videoTracks++;
        if (!WEBM_CODECS.has(codec)) throw new VideoError("bad_codec", "WebM videos must be VP8, VP9 or AV1");
        if (video && !width) {
          for (const v of elements(buf, video.data, video.end)) {
            if (v.id === PIXEL_WIDTH) width = uint(buf, v);
            else if (v.id === PIXEL_HEIGHT) height = uint(buf, v);
          }
        }
      }
    } else if (e.id === CLUSTER_TIMECODE) {
      clusterTime = uint(buf, e);
    } else if (e.id === SIMPLE_BLOCK && e.end - e.data > 3) {
      blockTime(e.data);
    } else if (e.id === BLOCK_GROUP) {
      for (const g of elements(buf, e.data, e.end)) if (g.id === BLOCK && g.end - g.data > 3) blockTime(g.data);
    }
    p = e.end;
  }

  if (!videoTracks) throw new VideoError("bad_video", "This file has no video");
  const ticks = duration > 0 ? duration : lastBlock;
  if (!(ticks > 0)) throw new VideoError("bad_video", "Couldn't read this video's length");
  return { format: "webm", durationMs: (ticks * scale) / 1e6, width, height };
}
