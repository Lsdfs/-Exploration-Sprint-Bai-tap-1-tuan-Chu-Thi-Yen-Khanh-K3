"""Mild offline pitch reduction by changing the WAV playback sample rate."""
import io
import wave


def lower_pitch(audio):
    with wave.open(io.BytesIO(audio), 'rb') as source:
        params = source.getparams()
        pcm = source.readframes(source.getnframes())
    output = io.BytesIO()
    with wave.open(output, 'wb') as target:
        target.setparams(params._replace(framerate=round(params.framerate * 0.82)))
        target.writeframes(pcm)
    return output.getvalue()
