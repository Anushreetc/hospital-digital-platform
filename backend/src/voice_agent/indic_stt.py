import torch
import numpy as np
from livekit.agents import stt, utils
from transformers import AutoModel

class IndicConformerSTT(stt.STT):
    def __init__(self, lang: str = "kn"):
        super().__init__(capabilities=stt.STTCapabilities(
            streaming=False, interim_results=False
        ))
        self._lang = lang
        self._model = None

    def _get_model(self):
        if self._model is None:
            print("[IndicConformerSTT] Loading AI4Bharat IndicConformer model...")
            self._model = AutoModel.from_pretrained(
                "ai4bharat/indic-conformer-600m-multilingual",
                trust_remote_code=True
            )
        return self._model

    async def _recognize_impl(self, buffer, *, language=None, conn_options=None):
        try:
            model = self._get_model()
            frame = utils.audio.combine_frames(buffer)
            pcm = np.frombuffer(frame.data, dtype=np.int16).astype(np.float32) / 32768.0
            wav = torch.from_numpy(pcm).unsqueeze(0)
            
            target_lang = language or self._lang
            text = model(wav, target_lang, "ctc")
            
            return stt.SpeechEvent(
                type=stt.SpeechEventType.FINAL_TRANSCRIPT,
                alternatives=[stt.SpeechData(text=text, language=target_lang)]
            )
        except Exception as e:
            print(f"[IndicConformerSTT Error]: {e}")
            return stt.SpeechEvent(
                type=stt.SpeechEventType.FINAL_TRANSCRIPT,
                alternatives=[stt.SpeechData(text="", language=self._lang)]
            )
