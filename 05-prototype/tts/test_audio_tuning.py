import io
import unittest
import wave

from audio_tuning import lower_pitch


class AudioTuningTest(unittest.TestCase):
    def test_lowers_pitch_and_preserves_pcm(self):
        source = io.BytesIO()
        pcm = b'\x01\x00' * 22050
        with wave.open(source, 'wb') as wav:
            wav.setparams((1, 2, 22050, 0, 'NONE', 'not compressed'))
            wav.writeframes(pcm)
        with wave.open(io.BytesIO(lower_pitch(source.getvalue())), 'rb') as wav:
            self.assertEqual(wav.getframerate(), 18081)
            self.assertEqual(wav.getnframes(), 22050)
            self.assertEqual(wav.readframes(22050), pcm)


if __name__ == '__main__':
    unittest.main()
