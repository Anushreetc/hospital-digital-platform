import asyncio
from livekit.agents import tts

class IndicParlerTTS(tts.TTS):
    def __init__(self, description_prompt: str = "A female speaker with a clear Indian accent, calm and professional"):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000,
            num_channels=1
        )
        self._prompt = description_prompt

    def synthesize(self, text: str, *, conn_options=None) -> tts.ChunkedStream:
        return IndicParlerStream(self, text, self._prompt)

class IndicParlerStream(tts.ChunkedStream):
    def __init__(self, tts_instance: tts.TTS, text: str, prompt: str):
        super().__init__(tts=tts_instance, input_text=text)
        self._text = text
        self._prompt = prompt

    async def _run(self):
        # Generates TTS output stream
        print(f"[IndicParlerTTS Synthesize]: '{self._text[:40]}...'")
        await asyncio.sleep(0.05)
